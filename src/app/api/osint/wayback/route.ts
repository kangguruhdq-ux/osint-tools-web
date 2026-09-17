import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const WaybackSchema = z.object({
  url: z.string().min(3, "URL atau domain target wajib diisi."),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = WaybackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let rawUrl = parsed.data.url.trim().replace(/^https?:\/\//i, "");
    const cleanUrl = rawUrl.split("/")[0];

    const ssrf = await validateUrlSafe(`https://${cleanUrl}`);
    if (!ssrf.safe) {
      return NextResponse.json({ success: false, error: ssrf.error }, { status: 403 });
    }

    // 1. Query Availability API
    let latestSnapshot: any = null;
    try {
      const availRes = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(cleanUrl)}`, {
        headers: { "User-Agent": "NexusOsintWayback/1.0" },
        signal: AbortSignal.timeout(6000),
      });
      if (availRes.ok) {
        const availJson = await availRes.json();
        if (availJson.archived_snapshots?.closest?.available) {
          latestSnapshot = availJson.archived_snapshots.closest;
        }
      }
    } catch {}

    // 2. Query CDX Server API for historical timeline
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(cleanUrl)}&output=json&limit=30&fl=timestamp,original,mimetype,statuscode,digest`;
    let timeline: any[] = [];

    try {
      const cdxRes = await fetch(cdxUrl, {
        headers: { "User-Agent": "NexusOsintWayback/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (cdxRes.ok) {
        const cdxData = await cdxRes.json();
        if (Array.isArray(cdxData) && cdxData.length > 1) {
          // First item is header: ["timestamp", "original", "mimetype", "statuscode", "digest"]
          for (let i = 1; i < cdxData.length; i++) {
            const [ts, orig, mime, status, digest] = cdxData[i];
            const year = ts.substring(0, 4);
            const month = ts.substring(4, 6);
            const day = ts.substring(6, 8);
            timeline.push({
              timestamp: ts,
              formattedDate: `${year}-${month}-${day}`,
              originalUrl: orig,
              mimeType: mime,
              httpStatus: status,
              digest,
              archiveUrl: `https://web.archive.org/web/${ts}/${orig}`,
            });
          }
        }
      }
    } catch {}

    return NextResponse.json({
      success: true,
      provider: "Internet Archive Wayback Machine CDX API",
      target: cleanUrl,
      hasArchives: timeline.length > 0 || latestSnapshot !== null,
      totalSnapshotsFound: timeline.length,
      latestSnapshot: latestSnapshot
        ? {
            url: latestSnapshot.url,
            timestamp: latestSnapshot.timestamp,
            status: latestSnapshot.status,
          }
        : null,
      timeline,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal menyelidiki Wayback Machine: " + err.message },
      { status: 500 }
    );
  }
}
