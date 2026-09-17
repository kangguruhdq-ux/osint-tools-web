import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const PreviewSchema = z.object({
  url: z.string().url("Format URL media tidak valid."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PreviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const mediaUrl = parsed.data.url.trim();

    // SSRF validation
    const ssrfCheck = await validateUrlSafe(mediaUrl);
    if (!ssrfCheck.safe) {
      return NextResponse.json(
        { success: false, error: ssrfCheck.error },
        { status: 403 }
      );
    }

    const parsedUrl = new URL(mediaUrl);
    const host = parsedUrl.hostname.toLowerCase();

    let platform = "unknown";
    let oembedUrl = "";

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      platform = "YouTube";
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(mediaUrl)}&format=json`;
    } else if (host.includes("tiktok.com")) {
      platform = "TikTok";
      oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(mediaUrl)}`;
    } else if (host.includes("twitter.com") || host.includes("x.com")) {
      platform = "X (Twitter)";
      oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(mediaUrl)}`;
    } else if (host.includes("instagram.com")) {
      platform = "Instagram";
    } else if (host.includes("facebook.com") || host.includes("fb.watch")) {
      platform = "Facebook";
    } else if (host.includes("pinterest.com")) {
      platform = "Pinterest";
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Domain URL tidak didukung. Harap masukkan URL dari TikTok, Instagram, YouTube, X/Twitter, Facebook, atau Pinterest.",
        },
        { status: 400 }
      );
    }

    let metadata: any = {
      platform,
      url: mediaUrl,
      title: `${platform} Public Media`,
      author: "Public Creator",
      thumbnailUrl: null,
      availableFormats: ["MP4 (Original)", "MP4 (720p)", "MP3 (Audio)"],
    };

    // If official oEmbed is available, fetch real official metadata
    if (oembedUrl) {
      try {
        const oembedRes = await fetch(oembedUrl, {
          headers: { "User-Agent": "NexusMediaMetadataPreview/1.0" },
          signal: AbortSignal.timeout(6000),
        });
        if (oembedRes.ok) {
          const d = await oembedRes.json();
          metadata.title = d.title || metadata.title;
          metadata.author = d.author_name || metadata.author;
          metadata.authorUrl = d.author_url || null;
          metadata.thumbnailUrl = d.thumbnail_url || null;
        }
      } catch {
        // Fallback
      }
    }

    return NextResponse.json({
      success: true,
      provider: `Official ${platform} oEmbed & Metadata API`,
      metadata,
      copyrightDisclaimer:
        "PERINGATAN HAK CIPTA: Pengunduhan konten media hanya diizinkan untuk konten milik sendiri atau konten dengan lisensi publik yang sah. Pelanggaran hak cipta adalah tanggung jawab pengguna.",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses pratinjau media: " + err.message },
      { status: 500 }
    );
  }
}
