import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as cheerio from "cheerio";

const TelegramSchema = z.object({
  channel: z.string().min(2, "Nama channel atau link Telegram wajib diisi."),
});

function parseViewCount(str: string): number {
  if (!str) return 0;
  const clean = str.trim().toUpperCase();
  if (clean.endsWith("K")) return Math.round(parseFloat(clean) * 1000);
  if (clean.endsWith("M")) return Math.round(parseFloat(clean) * 1000000);
  return parseInt(clean.replace(/[^0-9]/g, ""), 10) || 0;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = TelegramSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let raw = parsed.data.channel.trim();
    raw = raw.replace(/^https?:\/\/t\.me\/(s\/)?/i, "").replace(/^@/, "");
    const channelName = raw.split("/")[0].split("?")[0];

    let res = await fetch(`https://t.me/s/${channelName}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await fetch(`https://t.me/${channelName}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
    }

    const html = res && res.ok ? await res.text() : "";
    const $ = cheerio.load(html || "<div></div>");

    const title =
      $(".tgme_channel_info_header_title").text().trim() ||
      $(".tgme_page_title").text().trim() ||
      channelName;
    const subscribers =
      $(".tgme_channel_info_counter .counter_value").text().trim() ||
      $(".tgme_page_extra").text().trim() ||
      "Publik";
    const bio =
      $(".tgme_channel_info_description").text().trim() ||
      $(".tgme_page_description").text().trim() ||
      "Tidak ada deskripsi publik.";
    const avatar =
      $(".tgme_page_photo_image").attr("src") ||
      $(".tgme_page_photo img").attr("src") ||
      null;
    const isVerified =
      html.includes("verified-icon") ||
      $(".tgme_channel_info_header_title .verified-icon").length > 0;

    // Extract recent broadcast messages with rich metrics
    const recentPosts: any[] = [];
    const discoveredLinks: string[] = [];
    const discoveredMentions: string[] = [];
    let totalViews = 0;
    let maxViews = 0;
    let postsWithMedia = 0;

    $(".tgme_widget_message_wrap").slice(-12).each((_, el) => {
      const msgText = $(el).find(".tgme_widget_message_text").text().trim();
      const views = $(el).find(".tgme_widget_message_views").text().trim() || "0";
      const time =
        $(el).find(".tgme_widget_message_date time").attr("datetime") ||
        $(el).find(".tgme_widget_message_date").text().trim() ||
        "Baru saja";
      const link = $(el).find(".tgme_widget_message_date").attr("href") || `https://t.me/${channelName}`;

      const hasPhoto = $(el).find(".tgme_widget_message_photo").length > 0;
      const hasVideo = $(el).find(".tgme_widget_message_video, video").length > 0;
      const hasDocument = $(el).find(".tgme_widget_message_document").length > 0;
      const forwardedFrom = $(el).find(".tgme_widget_message_forwarded_from_name").text().trim() || null;

      if (hasPhoto || hasVideo || hasDocument) {
        postsWithMedia++;
      }

      // Collect links & mentions from text
      const urlMatches = msgText.match(/https?:\/\/[^\s]+/g);
      if (urlMatches) {
        for (const u of urlMatches) {
          if (!discoveredLinks.includes(u) && discoveredLinks.length < 10) {
            discoveredLinks.push(u);
          }
        }
      }
      const mentionMatches = msgText.match(/@[a-zA-Z0-9_]{3,30}/g);
      if (mentionMatches) {
        for (const m of mentionMatches) {
          if (!discoveredMentions.includes(m) && discoveredMentions.length < 10) {
            discoveredMentions.push(m);
          }
        }
      }

      const numericViews = parseViewCount(views);
      totalViews += numericViews;
      if (numericViews > maxViews) maxViews = numericViews;

      if (msgText || views || hasPhoto || hasVideo) {
        recentPosts.unshift({
          text: msgText || (hasPhoto ? "[Foto Publik]" : hasVideo ? "[Video Publik]" : "[Lampiran Media]"),
          views: views || "0",
          viewsFormatted: views || "0",
          timestamp: time,
          datetime: time,
          link,
          hasPhoto,
          hasVideo,
          hasDocument,
          forwardedFrom,
        });
      }
    });

    const avgViews = recentPosts.length > 0 ? Math.round(totalViews / recentPosts.length) : 0;

    return NextResponse.json({
      success: true,
      provider: "Telegram Official Public Web Gateway Scraper",
      channelName: `@${channelName}`,
      channelUrl: `https://t.me/${channelName}`,
      channel: {
        title,
        username: channelName,
        verified: isVerified,
        avatarUrl: avatar,
        subscriberCountFormatted: subscribers,
        description: bio,
      },
      info: {
        title,
        subscribers,
        bio,
        avatarUrl: avatar,
        isVerified,
      },
      metrics: {
        totalExtracted: recentPosts.length,
        avgViewsPerPost: avgViews.toLocaleString(),
        peakViews: maxViews.toLocaleString(),
        postsWithMedia,
        discoveredLinksCount: discoveredLinks.length,
        discoveredMentionsCount: discoveredMentions.length,
      },
      discoveredLinks,
      discoveredMentions,
      recentPosts,
      totalPostsExtracted: recentPosts.length,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal menganalisis channel Telegram: " + err.message },
      { status: 500 }
    );
  }
}

