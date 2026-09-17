import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as cheerio from "cheerio";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const ReconSchema = z.object({
  url: z.string().min(3, "URL atau domain target wajib diisi."),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = ReconSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let rawUrl = parsed.data.url.trim();
    if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
      rawUrl = "https://" + rawUrl;
    }
    const origin = new URL(rawUrl).origin;

    const ssrf = await validateUrlSafe(origin);
    if (!ssrf.safe) {
      return NextResponse.json({ success: false, error: ssrf.error }, { status: 403 });
    }

    // 1. Fetch robots.txt
    let robotsFound = false;
    let disallowedPaths: string[] = [];
    let allowedPaths: string[] = [];
    let sitemapDirectives: string[] = [];
    let sensitiveFindings: string[] = [];

    try {
      const robotsRes = await fetch(`${origin}/robots.txt`, {
        headers: { "User-Agent": "NexusRecon/1.0" },
        signal: AbortSignal.timeout(6000),
      });

      if (robotsRes.ok) {
        robotsFound = true;
        const text = await robotsRes.text();
        const lines = text.split("\n");

        for (let line of lines) {
          line = line.trim();
          if (line.startsWith("#") || !line.includes(":")) continue;

          const [directive, ...rest] = line.split(":");
          const val = rest.join(":").trim();
          const dirLower = directive.trim().toLowerCase();

          if (dirLower === "disallow") {
            if (val) {
              disallowedPaths.push(val);
              const valLower = val.toLowerCase();
              if (
                valLower.includes("admin") ||
                valLower.includes("login") ||
                valLower.includes("private") ||
                valLower.includes("secret") ||
                valLower.includes("backup") ||
                valLower.includes("staging") ||
                valLower.includes("api") ||
                valLower.includes("config")
              ) {
                sensitiveFindings.push(val);
              }
            }
          } else if (dirLower === "allow") {
            if (val) allowedPaths.push(val);
          } else if (dirLower === "sitemap") {
            if (val) sitemapDirectives.push(val);
          }
        }
      }
    } catch {}

    // 2. Fetch sitemap.xml
    let sitemapFound = false;
    let sitemapUrls: string[] = [];

    const targetSitemap = sitemapDirectives[0] || `${origin}/sitemap.xml`;
    try {
      const sitemapRes = await fetch(targetSitemap, {
        headers: { "User-Agent": "NexusRecon/1.0" },
        signal: AbortSignal.timeout(6000),
      });

      if (sitemapRes.ok) {
        sitemapFound = true;
        const xml = await sitemapRes.text();
        const $ = cheerio.load(xml, { xmlMode: true });
        $("loc").each((_, el) => {
          const loc = $(el).text().trim();
          if (loc && sitemapUrls.length < 30) {
            sitemapUrls.push(loc);
          }
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      provider: "Robots.txt & XML Sitemap Recon Engine",
      origin,
      robotsTxt: {
        found: robotsFound,
        url: `${origin}/robots.txt`,
        disallowedCount: disallowedPaths.length,
        disallowedPaths: disallowedPaths.slice(0, 50),
        allowedCount: allowedPaths.length,
        sitemaps: sitemapDirectives,
        sensitiveFindings,
      },
      sitemapXml: {
        found: sitemapFound,
        targetUrl: targetSitemap,
        sampleExtractedUrls: sitemapUrls,
        totalSampleUrls: sitemapUrls.length,
      },
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memindai robots/sitemap: " + err.message },
      { status: 500 }
    );
  }
}
