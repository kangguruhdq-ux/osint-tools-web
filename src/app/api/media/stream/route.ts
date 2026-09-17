import { NextRequest, NextResponse } from "next/server";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

function cleanMediaUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  let u = rawUrl.trim();
  u = u.split("#")[0];
  let prev = "";
  while (prev !== u) {
    prev = u;
    u = u
      .replace(/&amp;/gi, "&")
      .replace(/&#038;/g, "&")
      .replace(/&#38;/g, "&")
      .replace(/\\u0026/gi, "&")
      .replace(/\\\//g, "/")
      .replace(/\\"/g, '"');
  }
  return u.trim();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let targetUrl = searchParams.get("url") || "";
    const filenameParam = searchParams.get("filename") || searchParams.get("title") || "media_download.mp4";

    if (!targetUrl) {
      return NextResponse.json({ success: false, error: "Parameter url wajib diisi." }, { status: 400 });
    }

    // Thoroughly clean URL to prevent Bad URL hash
    targetUrl = cleanMediaUrl(targetUrl);

    // SSRF check
    const ssrf = await validateUrlSafe(targetUrl);
    if (!ssrf.safe) {
      return NextResponse.json({ success: false, error: "Akses ke URL target diblokir oleh SSRF guard." }, { status: 403 });
    }

    // Stream from CDN without Referer to bypass hotlink block and bad hash
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      // If direct fetch returned error, try fallback redirect
      return NextResponse.redirect(targetUrl);
    }

    const rawContentType = upstreamRes.headers.get("content-type") || "";
    if (rawContentType.includes("text/html")) {
      return NextResponse.json(
        { success: false, error: "Tautan yang dialirkan merupakan halaman HTML, bukan berkas stream media langsung." },
        { status: 400 }
      );
    }

    const formatParam = searchParams.get("format");
    const safeFilename = filenameParam.replace(/[^a-zA-Z0-9._-]/g, "_");
    let contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstreamRes.headers.get("content-length");

    if (formatParam === "mp3" || safeFilename.toLowerCase().endsWith(".mp3")) {
      contentType = "audio/mpeg";
    } else if (safeFilename.toLowerCase().endsWith(".mp4") || contentType.includes("image") || contentType === "application/octet-stream") {
      contentType = "video/mp4";
    }

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Cache-Control": "public, max-age=3600",
    };

    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    return new NextResponse(upstreamRes.body as any, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Gagal mengalirkan media: " + err.message }, { status: 500 });
  }
}
