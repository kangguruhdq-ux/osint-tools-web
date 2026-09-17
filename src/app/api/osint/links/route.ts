import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as cheerio from "cheerio";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const LinkExtractSchema = z.object({
  url: z.string().url("Format URL tidak valid."),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = LinkExtractSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const targetUrl = parsed.data.url.trim();

    // SSRF Check
    const ssrfCheck = await validateUrlSafe(targetUrl);
    if (!ssrfCheck.safe) {
      return NextResponse.json(
        { success: false, error: ssrfCheck.error },
        { status: 403 }
      );
    }

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NexusLinkExtractor/1.0",
      },
      signal: AbortSignal.timeout(8000),
    });

    const html = await res.text();
    const $ = cheerio.load(html);
    const parsedTarget = new URL(targetUrl);

    const internalLinks: { href: string; text: string }[] = [];
    const externalLinks: { href: string; text: string; domain: string }[] = [];
    const seen = new Set<string>();

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      const text = $(el).text().replace(/\s+/g, " ").trim() || "[Tanpa Teks]";

      if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      try {
        const absoluteUrl = new URL(href, targetUrl).toString();
        if (seen.has(absoluteUrl)) return;
        seen.add(absoluteUrl);

        const urlObj = new URL(absoluteUrl);
        if (urlObj.hostname === parsedTarget.hostname) {
          internalLinks.push({ href: absoluteUrl, text });
        } else {
          externalLinks.push({ href: absoluteUrl, text, domain: urlObj.hostname });
        }
      } catch {
        // malformed href
      }
    });

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: "Nexus HTML Stream & Link Parser",
      targetUrl,
      totalLinks: seen.size,
      internalCount: internalLinks.length,
      externalCount: externalLinks.length,
      internalLinks: internalLinks.slice(0, 100), // capped
      externalLinks: externalLinks.slice(0, 100),
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal mengekstrak link: " + err.message },
      { status: 500 }
    );
  }
}
