import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const ClonerSchema = z.object({
  url: z.string().url("Format URL tidak valid. Gunakan format http:// atau https://"),
  filename: z.string().optional(),
});

function resolveUrl(relative: string, base: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

export async function POST(req: NextRequest) {
  console.log("[WEB-CLONER] 1. POST request received");
  try {
    const body = await req.json();
    console.log("[WEB-CLONER] 2. Body parsed:", body);
    const parsed = ClonerSchema.safeParse(body);

    if (!parsed.success) {
      console.log("[WEB-CLONER] Bad input:", parsed.error.issues[0].message);
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { url, filename: requestedFilename } = parsed.data;
    console.log("[WEB-CLONER] 3. Validating SSRF for:", url);

    // 1. SSRF Safety Check
    const ssrfCheck = await validateUrlSafe(url);
    console.log("[WEB-CLONER] 4. SSRF result:", ssrfCheck.safe);
    if (!ssrfCheck.safe) {
      return NextResponse.json(
        { success: false, error: `Keamanan SSRF: ${ssrfCheck.error}` },
        { status: 403 }
      );
    }

    // 2. Fetch Live Target Webpage with Modern Browser Headers & 8s Timeout
    let htmlText = "";
    let finalUrl = url;

    console.log("[WEB-CLONER] 5. Fetching target webpage:", url);
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
          "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
      });

      finalUrl = response.url || url;
      htmlText = await response.text();
      console.log("[WEB-CLONER] 6. Target fetched, length:", htmlText.length);
    } catch (err: any) {
      console.log("[WEB-CLONER] 6. Fetch failed:", err.message);
      return NextResponse.json(
        {
          success: false,
          error: `Gagal mengakses target web: ${err.name === "TimeoutError" || err.name === "AbortError" ? "Waktu koneksi habis (Timeout 8s)" : err.message}`,
        },
        { status: 502 }
      );
    }

    // 3. Extract Metadata
    const baseUrl = new URL(finalUrl);
    const domain = baseUrl.hostname;

    const titleMatch = htmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : domain;

    const descMatch = htmlText.match(/<meta[^>]+name=["']description["'][^>]+content=["'](.*?)["']/i);
    const metaDescription = descMatch ? descMatch[1].trim() : "";

    const charsetMatch = htmlText.match(/<meta[^>]+charset=["'](.*?)["']/i);
    const pageCharset = charsetMatch ? charsetMatch[1] : "UTF-8";

    // 4. Intelligent DOM Processing & Resource Resolution
    let processedHtml = htmlText;

    // Remove frame-busting or instant refresh redirects that might hijack preview
    processedHtml = processedHtml.replace(/<meta[^>]+http-equiv=["']refresh["'][^>]*>/gi, "");

    const stylesheetMatches = Array.from(htmlText.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi));
    const scriptMatches = Array.from(htmlText.matchAll(/<script[^>]*>[\s\S]*?<\/script>/gi));
    const imgMatches = Array.from(htmlText.matchAll(/<img[^>]+src=["'](.*?)["'][^>]*>/gi));

    // A. Parallel Fetch & Inline Primary External Stylesheets (Max 5, 1.5s timeout per CSS)
    let inlinedCount = 0;
    const candidateMatches = stylesheetMatches.slice(0, 5);
    console.log("[WEB-CLONER] 7. Inlining candidate stylesheets count:", candidateMatches.length);

    const inlineResults = await Promise.allSettled(
      candidateMatches.map(async (match) => {
        const tag = match[0];
        const hrefMatch = tag.match(/href=["'](.*?)["']/i);
        if (!hrefMatch || !hrefMatch[1]) return null;

        const cssUrl = resolveUrl(hrefMatch[1], baseUrl.href);
        let parsedCssUrl: URL;
        try {
          parsedCssUrl = new URL(cssUrl);
        } catch {
          return null;
        }

        // Fast-path: if same host as validated target page, skip redundant SSRF DNS check
        const isSameHost = parsedCssUrl.hostname.toLowerCase() === baseUrl.hostname.toLowerCase();
        if (!isSameHost) {
          const cssSsrf = await validateUrlSafe(cssUrl);
          if (!cssSsrf.safe) return null;
        }

        const cssRes = await fetch(cssUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            Accept: "text/css,*/*;q=0.1",
          },
          signal: AbortSignal.timeout(1500),
        });

        if (!cssRes.ok) return null;

        let cssText = await cssRes.text();
        // Prevent inlining massive CSS files (> 400KB) to keep response fast
        if (cssText.length > 400 * 1024) return null;

        cssText = cssText.replace(/url\(\s*['"]?(?!data:)(.*?)['"]?\s*\)/gi, (_, rel) => {
          const abs = resolveUrl(rel, cssUrl);
          return `url("${abs}")`;
        });

        return { tag, inlinedTag: `<style data-source="${cssUrl}">\n${cssText}\n</style>` };
      })
    );

    for (const res of inlineResults) {
      if (res.status === "fulfilled" && res.value) {
        const val = res.value;
        processedHtml = processedHtml.replace(val.tag, () => val.inlinedTag);
        inlinedCount++;
      }
    }
    console.log("[WEB-CLONER] 8. Stylesheets inlined:", inlinedCount);

    // B. Convert relative asset URLs to absolute URLs
    processedHtml = processedHtml.replace(/(<(?:img|script|source|video|audio|iframe|embed)[^>]+src=["'])(?!data:|blob:|#)(.*?)(["'])/gi, (_, prefix, src, suffix) => {
      return `${prefix}${resolveUrl(src, baseUrl.href)}${suffix}`;
    });

    processedHtml = processedHtml.replace(/(<(?:a|link)[^>]+href=["'])(?!data:|blob:|#|javascript:|mailto:|tel:)(.*?)(["'])/gi, (_, prefix, href, suffix) => {
      return `${prefix}${resolveUrl(href, baseUrl.href)}${suffix}`;
    });

    processedHtml = processedHtml.replace(/(srcset=["'])(.*?)(["'])/gi, (_, prefix, srcset, suffix) => {
      const resolved = srcset
        .split(",")
        .map((part: string) => {
          const trimmed = part.trim();
          const [urlPart, descriptor] = trimmed.split(/\s+/);
          if (!urlPart) return trimmed;
          return `${resolveUrl(urlPart, baseUrl.href)}${descriptor ? " " + descriptor : ""}`;
        })
        .join(", ");
      return `${prefix}${resolved}${suffix}`;
    });

    // C. Inject base tag if not present
    if (!/<base\b/i.test(processedHtml)) {
      processedHtml = processedHtml.replace(/<head[^>]*>/i, `$& \n<base href="${baseUrl.origin}/" target="_blank" />`);
    }

    // 5. Generate Safe Custom Output Filename
    let finalFilename = requestedFilename?.trim() || `${domain.replace(/[^a-zA-Z0-9_-]/g, "_")}_clone.html`;
    if (!finalFilename.toLowerCase().endsWith(".html") && !finalFilename.toLowerCase().endsWith(".htm")) {
      finalFilename += ".html";
    }

    const sizeBytes = Buffer.byteLength(processedHtml, "utf8");
    const sizeFormatted = sizeBytes > 1024 * 1024
      ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(sizeBytes / 1024).toFixed(1)} KB`;

    console.log("[WEB-CLONER] 9. Returning cloned response, size:", sizeFormatted);
    return NextResponse.json({
      success: true,
      message: "Ekstraksi dan cloning halaman web berhasil.",
      data: {
        url: finalUrl,
        originalUrl: url,
        domain,
        title: pageTitle,
        description: metaDescription,
        charset: pageCharset,
        filename: finalFilename,
        sizeBytes,
        sizeFormatted,
        html: processedHtml,
        stats: {
          stylesheetsFound: stylesheetMatches.length,
          stylesheetsInlined: inlinedCount,
          scriptsCount: scriptMatches.length,
          imagesCount: imgMatches.length,
          charactersCount: processedHtml.length,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses kloning web: " + error.message },
      { status: 500 }
    );
  }
}