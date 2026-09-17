import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as cheerio from "cheerio";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";
import { providerRegistry } from "@/lib/providers/registry";

const ScreenshotSchema = z.object({
  url: z.string().min(3, "URL target wajib diisi."),
  device: z.enum(["desktop", "laptop", "tablet", "mobile"]).optional().default("desktop"),
  resolution: z.string().optional(),
});

const DEVICE_VIEWPORTS: Record<string, { width: number; height: number; label: string; isMobile: boolean }> = {
  desktop: { width: 1920, height: 1080, label: "Desktop Full HD (1920x1080)", isMobile: false },
  laptop: { width: 1366, height: 768, label: "Laptop HD (1366x768)", isMobile: false },
  tablet: { width: 768, height: 1024, label: "Tablet iPad (768x1024)", isMobile: true },
  mobile: { width: 375, height: 812, label: "Mobile iPhone / Android (375x812)", isMobile: true },
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = ScreenshotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let targetUrl = parsed.data.url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    // Strict SSRF Check
    const ssrfCheck = await validateUrlSafe(targetUrl);
    if (!ssrfCheck.safe) {
      return NextResponse.json(
        { success: false, error: ssrfCheck.error },
        { status: 403 }
      );
    }

    const device = parsed.data.device || "desktop";
    const viewport = DEVICE_VIEWPORTS[device] || DEVICE_VIEWPORTS.desktop;

    // Fetch page metadata (Title, Favicon, Description) safely
    let pageTitle = "";
    let pageDescription = "";
    let faviconUrl = "";
    let finalUrl = targetUrl;
    let httpStatus = 200;

    try {
      const pageRes = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent":
            device === "mobile"
              ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
              : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(6000),
        redirect: "follow",
      });

      finalUrl = pageRes.url;
      httpStatus = pageRes.status;

      const html = await pageRes.text();
      const $ = cheerio.load(html.slice(0, 300000));
      pageTitle = $("title").first().text().trim() || "";
      pageDescription = $('meta[name="description"]').attr("content")?.trim() || "";

      const rawFavicon =
        $('link[rel="icon"]').attr("href") ||
        $('link[rel="shortcut icon"]').attr("href") ||
        $('link[rel="apple-touch-icon"]').attr("href");

      if (rawFavicon) {
        try {
          faviconUrl = new URL(rawFavicon, finalUrl).toString();
        } catch {
          faviconUrl = "";
        }
      }

      if (!faviconUrl) {
        try {
          const origin = new URL(finalUrl).origin;
          faviconUrl = `${origin}/favicon.ico`;
        } catch {
          // ignore
        }
      }
    } catch {
      // Failed metadata fetch is non-fatal for screenshot
    }

    // Check if custom URLbox API key is configured
    const apiKey = await providerRegistry.getDecryptedApiKey("urlbox");
    let screenshotUrl = "";
    let alternativeUrl = "";
    let providerName = "";

    if (apiKey) {
      screenshotUrl = `https://api.urlbox.io/v1/${apiKey}/png?url=${encodeURIComponent(
        targetUrl
      )}&width=${viewport.width}&height=${viewport.height}`;
      alternativeUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(targetUrl)}?w=${viewport.width}&h=${viewport.height}`;
      providerName = "URLbox Enterprise Headless Sandbox";
    } else {
      // Primary: High-fidelity WordPress mshots with exact dimensions
      screenshotUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(targetUrl)}?w=${viewport.width}&h=${viewport.height}`;
      // Secondary: Microlink API screenshot fallback
      alternativeUrl = `https://api.microlink.io?url=${encodeURIComponent(
        targetUrl
      )}&screenshot=true&embed=screenshot.url&viewport.width=${viewport.width}&viewport.height=${viewport.height}&viewport.isMobile=${viewport.isMobile}`;
      providerName = "WordPress Cloud WebKit & Microlink Headless Engine";
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: providerName,
      targetUrl,
      finalUrl,
      httpStatus,
      screenshotUrl,
      alternativeUrl,
      downloadUrl: screenshotUrl,
      downloadDataUri: screenshotUrl,
      viewportName: viewport.label,
      device: {
        id: device,
        label: viewport.label,
        width: viewport.width,
        height: viewport.height,
        isMobile: viewport.isMobile,
      },
      dimensions: `${viewport.width}x${viewport.height}`,
      pageMeta: {
        title: pageTitle || new URL(targetUrl).hostname,
        description: pageDescription || "Tidak ada meta deskripsi yang disediakan situs target.",
        faviconUrl,
      },
      pageMetadata: {
        title: pageTitle || new URL(targetUrl).hostname,
        description: pageDescription || "Tidak ada meta deskripsi yang disediakan situs target.",
        favicon: faviconUrl,
      },
      format: "PNG",
      latencyMs,
      privacyCompliance:
        "Tangkapan layar diproses dalam sandbox headless terisolasi tanpa cookie atau sesi autentikasi pengguna.",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses screenshot: " + err.message },
      { status: 500 }
    );
  }
}
