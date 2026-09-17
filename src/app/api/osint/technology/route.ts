import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as cheerio from "cheerio";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const TechSchema = z.object({
  url: z.string().url("Format URL tidak valid."),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = TechSchema.safeParse(body);
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
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NexusTechDetector/1.0",
      },
      signal: AbortSignal.timeout(8000),
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const headers: Record<string, string> = {};
    res.headers.forEach((val, key) => {
      headers[key.toLowerCase()] = val;
    });

    const detected: { name: string; category: string; evidence: string }[] = [];

    // 1. Web Servers & CDNs
    const serverHeader = headers["server"] || "";
    if (serverHeader.toLowerCase().includes("cloudflare") || headers["cf-ray"]) {
      detected.push({ name: "Cloudflare", category: "CDN / Reverse Proxy", evidence: "Headers: cf-ray / Server" });
    }
    if (serverHeader.toLowerCase().includes("nginx")) {
      detected.push({ name: "Nginx", category: "Web Server", evidence: "Header Server: nginx" });
    }
    if (serverHeader.toLowerCase().includes("apache")) {
      detected.push({ name: "Apache HTTP Server", category: "Web Server", evidence: "Header Server: apache" });
    }
    if (headers["x-vercel-id"]) {
      detected.push({ name: "Vercel", category: "PaaS / Hosting", evidence: "Header: x-vercel-id" });
    }

    // 2. CMS Detection
    const generator = $('meta[name="generator"]').attr("content") || "";
    if (generator.toLowerCase().includes("wordpress") || html.includes("wp-content") || html.includes("wp-includes")) {
      detected.push({ name: "WordPress", category: "CMS", evidence: "HTML: wp-content / generator" });
    }
    if (generator.toLowerCase().includes("drupal") || html.includes("Drupal.settings")) {
      detected.push({ name: "Drupal", category: "CMS", evidence: "HTML: Drupal metadata" });
    }
    if (generator.toLowerCase().includes("ghost")) {
      detected.push({ name: "Ghost", category: "CMS", evidence: "Meta generator: Ghost" });
    }

    // 3. Frontend Frameworks
    if (html.includes("__NEXT_DATA__") || $('script[src*="/_next/"]').length > 0) {
      detected.push({ name: "Next.js", category: "Framework", evidence: "HTML: __NEXT_DATA__ / _next scripts" });
      detected.push({ name: "React", category: "UI Library", evidence: "Next.js dependency" });
    } else if (html.includes("react") || $('[data-reactroot]').length > 0) {
      detected.push({ name: "React", category: "UI Library", evidence: "HTML / DOM signatures" });
    }

    if (html.includes("__NUXT__") || $('script[src*="/_nuxt/"]').length > 0) {
      detected.push({ name: "Nuxt.js", category: "Framework", evidence: "HTML: __NUXT__ / _nuxt scripts" });
      detected.push({ name: "Vue.js", category: "UI Library", evidence: "Nuxt.js dependency" });
    } else if (html.includes("v-") || html.includes("vue")) {
      detected.push({ name: "Vue.js", category: "UI Library", evidence: "DOM Vue directives" });
    }

    // CSS Frameworks
    if (html.includes("tailwind") || $('link[href*="tailwind"]').length > 0 || $('[class*="flex flex-col"]').length > 0) {
      detected.push({ name: "Tailwind CSS", category: "CSS Framework", evidence: "Class signatures / Link tags" });
    }
    if (html.includes("bootstrap") || $('link[href*="bootstrap"]').length > 0) {
      detected.push({ name: "Bootstrap", category: "CSS Framework", evidence: "Link stylesheet" });
    }

    // Analytics & Trackers
    if (html.includes("googletagmanager.com") || html.includes("google-analytics.com")) {
      detected.push({ name: "Google Analytics / Tag Manager", category: "Analytics", evidence: "Script tag" });
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: "Nexus Passive Technology Scanner",
      targetUrl,
      totalDetected: detected.length,
      technologies: detected,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal mendeteksi teknologi: " + err.message },
      { status: 500 }
    );
  }
}
