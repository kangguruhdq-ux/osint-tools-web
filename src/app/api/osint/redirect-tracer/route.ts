import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const TracerSchema = z.object({
  url: z.string().min(3, "URL tidak valid."),
});

interface RedirectHop {
  hopNumber: number;
  url: string;
  statusCode: number;
  statusText: string;
  location?: string;
  latencyMs: number;
  server?: string;
  contentType?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TracerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    let currentUrl = parsed.data.url.trim();
    if (!currentUrl.startsWith("http://") && !currentUrl.startsWith("https://")) {
      currentUrl = "https://" + currentUrl;
    }

    // SSRF Check initial URL
    const ssrf = await validateUrlSafe(currentUrl);
    if (!ssrf.safe) {
      return NextResponse.json({ success: false, error: ssrf.error || "URL tujuan diblokir oleh SSRF guard." }, { status: 403 });
    }

    const hops: RedirectHop[] = [];
    const visited = new Set<string>();
    const maxHops = 10;
    let loopDetected = false;
    let finalUrl = currentUrl;
    let isShortener = false;

    const shortenerDomains = ["bit.ly", "t.co", "tinyurl.com", "is.gd", "buff.ly", "ow.ly", "rebrand.ly", "cutt.ly", "shorte.st", "adf.ly"];

    for (let i = 0; i < maxHops; i++) {
      if (visited.has(currentUrl)) {
        loopDetected = true;
        break;
      }
      visited.add(currentUrl);

      // Check if domain is a known shortener
      try {
        const u = new URL(currentUrl);
        if (shortenerDomains.some((d) => u.hostname.toLowerCase().includes(d))) {
          isShortener = true;
        }
      } catch {}

      const startTime = Date.now();
      let res: Response;
      try {
        res = await fetch(currentUrl, {
          method: "GET",
          redirect: "manual",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NexusRedirectTracer/1.0",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(6000),
        });
      } catch (err: any) {
        hops.push({
          hopNumber: i + 1,
          url: currentUrl,
          statusCode: 0,
          statusText: "Connection Error: " + (err.message || "Timeout"),
          latencyMs: Date.now() - startTime,
        });
        break;
      }

      const latencyMs = Date.now() - startTime;
      const statusCode = res.status;
      const statusText = res.statusText || String(statusCode);
      const location = res.headers.get("location") || undefined;
      const server = res.headers.get("server") || undefined;
      const contentType = res.headers.get("content-type") || undefined;

      hops.push({
        hopNumber: i + 1,
        url: currentUrl,
        statusCode,
        statusText,
        location,
        latencyMs,
        server,
        contentType,
      });

      finalUrl = currentUrl;

      // If redirect status (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
        try {
          // Resolve relative redirect paths
          const resolvedNext = new URL(location, currentUrl).toString();
          const nextSsrf = await validateUrlSafe(resolvedNext);
          if (!nextSsrf.safe) {
            hops.push({
              hopNumber: i + 2,
              url: resolvedNext,
              statusCode: 403,
              statusText: "Blocked: Redirection to internal/private IP prohibited",
              latencyMs: 0,
            });
            break;
          }
          currentUrl = resolvedNext;
        } catch {
          break;
        }
      } else {
        // Destination reached
        break;
      }
    }

    const totalLatency = hops.reduce((acc, h) => acc + h.latencyMs, 0);

    return NextResponse.json({
      success: true,
      initialUrl: parsed.data.url,
      finalUrl,
      totalHops: hops.length,
      totalLatencyMs: totalLatency,
      isShortener,
      loopDetected,
      hops,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Gagal melacak redirect: " + err.message }, { status: 500 });
  }
}
