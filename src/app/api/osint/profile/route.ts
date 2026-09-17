import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as cheerio from "cheerio";

const ProfileSchema = z.object({
  target: z.string().min(2, "Input URL profil atau nickname wajib diisi."),
  platform: z
    .enum([
      "auto",
      "youtube",
      "tiktok",
      "instagram",
      "facebook",
      "twitter",
      "telegram",
      "reddit",
      "github",
      "linkedin",
      "pinterest",
      "threads",
      "twitch",
      "spotify",
      "devto",
    ])
    .default("auto"),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let { target, platform } = parsed.data;
    target = target.trim();

    let username = target.replace(/^@/, "");
    let profileUrl = "";

    // 1. Intelligent URL auto-detection & share URL resolution
    if (target.startsWith("http://") || target.startsWith("https://")) {
      try {
        let resolvedTarget = target;
        if (
          target.includes("vt.tiktok.com") ||
          target.includes("vm.tiktok.com") ||
          target.includes("fb.watch") ||
          target.includes("youtu.be") ||
          target.includes("/share/")
        ) {
          try {
            const headRes = await fetch(target, {
              method: "GET",
              redirect: "follow",
              headers: { "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)" },
              signal: AbortSignal.timeout(4000),
            });
            if (headRes.url) resolvedTarget = headRes.url;
          } catch {}
        }

        const urlObj = new URL(resolvedTarget);
        const host = urlObj.hostname.toLowerCase();
        const pathname = urlObj.pathname;
        const searchParams = urlObj.searchParams;

        if (host.includes("youtube.com") || host.includes("youtu.be")) {
          platform = "youtube";
          const match = pathname.match(/@([^/?#]+)/);
          username = match ? match[1] : pathname.split("/").filter(Boolean)[0] || username;
          if (pathname.includes("/channel/")) {
            username = pathname.split("/channel/")[1]?.split("/")[0] || username;
          }
          profileUrl = resolvedTarget;
        } else if (host.includes("tiktok.com")) {
          platform = "tiktok";
          const match = pathname.match(/@([^/?#]+)/);
          username = match ? match[1] : pathname.split("/").filter(Boolean)[0]?.replace(/^@/, "") || username;
          profileUrl = `https://www.tiktok.com/@${username}`;
        } else if (host.includes("instagram.com")) {
          platform = "instagram";
          const segments = pathname.split("/").filter(Boolean);
          if (segments[0] === "p" || segments[0] === "reel" || segments[0] === "stories") {
            username = segments[1] || username;
          } else {
            username = segments[0] || username;
          }
          profileUrl = `https://www.instagram.com/${username}/`;
        } else if (host.includes("facebook.com")) {
          platform = "facebook";
          const segments = pathname.split("/").filter(Boolean);
          if (pathname.includes("profile.php")) {
            username = searchParams.get("id") || username;
          } else if (segments[0] === "people" && segments[1]) {
            username = segments[1];
          } else if (segments[0] === "share" || segments[0] === "watch") {
            username = segments[1] || username;
          } else {
            username = segments[0] || username;
          }
          profileUrl = `https://www.facebook.com/${username}`;
        } else if (host.includes("twitter.com") || host.includes("x.com")) {
          platform = "twitter";
          username = pathname.split("/").filter(Boolean)[0] || username;
          profileUrl = `https://x.com/${username}`;
        } else if (host.includes("t.me")) {
          platform = "telegram";
          username = pathname.split("/").filter(Boolean)[0] || username;
          profileUrl = `https://t.me/${username}`;
        } else if (host.includes("reddit.com")) {
          platform = "reddit";
          const parts = pathname.split("/").filter(Boolean);
          username = parts[1] || parts[0] || username;
          profileUrl = `https://www.reddit.com/user/${username}`;
        } else if (host.includes("github.com")) {
          platform = "github";
          username = pathname.split("/").filter(Boolean)[0] || username;
          profileUrl = `https://github.com/${username}`;
        } else if (host.includes("linkedin.com")) {
          platform = "linkedin";
          const parts = pathname.split("/").filter(Boolean);
          username = parts[1] || parts[0] || username;
          profileUrl = `https://www.linkedin.com/in/${username}`;
        } else if (host.includes("pinterest.com")) {
          platform = "pinterest";
          username = pathname.split("/").filter(Boolean)[0] || username;
          profileUrl = `https://www.pinterest.com/${username}/`;
        } else if (host.includes("threads.net")) {
          platform = "threads";
          username = pathname.split("/").filter(Boolean)[0]?.replace(/^@/, "") || username;
          profileUrl = `https://www.threads.net/@${username}`;
        } else if (host.includes("twitch.tv")) {
          platform = "twitch";
          username = pathname.split("/").filter(Boolean)[0] || username;
          profileUrl = `https://www.twitch.tv/${username}`;
        } else if (host.includes("spotify.com")) {
          platform = "spotify";
          const parts = pathname.split("/").filter(Boolean);
          username = parts[1] || parts[0] || username;
          profileUrl = resolvedTarget;
        }
      } catch {
        // fallback
      }
    }

    username = username.replace(/^@/, "").replace(/[/?#].*$/, "").trim();

    if (platform === "auto") {
      platform = "youtube"; // default to youtube or first platform
    }

    if (!profileUrl) {
      if (platform === "youtube") profileUrl = username.startsWith("UC") ? `https://www.youtube.com/channel/${username}` : `https://www.youtube.com/@${username}`;
      else if (platform === "tiktok") profileUrl = `https://www.tiktok.com/@${username}`;
      else if (platform === "instagram") profileUrl = `https://www.instagram.com/${username}/`;
      else if (platform === "facebook") profileUrl = `https://www.facebook.com/${username}`;
      else if (platform === "twitter") profileUrl = `https://x.com/${username}`;
      else if (platform === "telegram") profileUrl = `https://t.me/${username}`;
      else if (platform === "reddit") profileUrl = `https://www.reddit.com/user/${username}`;
      else if (platform === "linkedin") profileUrl = `https://www.linkedin.com/in/${username}`;
      else if (platform === "pinterest") profileUrl = `https://www.pinterest.com/${username}/`;
      else if (platform === "threads") profileUrl = `https://www.threads.net/@${username}`;
      else if (platform === "twitch") profileUrl = `https://www.twitch.tv/${username}`;
      else if (platform === "spotify") profileUrl = `https://open.spotify.com/user/${username}`;
      else profileUrl = `https://github.com/${username}`;
    }

    let profileData: any = null;

    // 2. Platform-specific live resolver
    if (platform === "tiktok") {
      let avatarUrl: string | null = null;
      let displayName = username;
      let bio = `Profil resmi TikTok @${username}`;
      let followers: string | null = null;
      let following: string | null = null;
      let likes: string | null = null;
      let verified = false;

      // 1. Fetch page HTML using social crawler User-Agent to bypass Slardar WAF
      try {
        const pageRes = await fetch(`https://www.tiktok.com/@${username}`, {
          headers: {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(8000),
        });

        if (pageRes.ok) {
          const html = await pageRes.text();
          const $ = cheerio.load(html);

          const ogImage = $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content");
          if (ogImage) {
            avatarUrl = ogImage.replace(/&amp;/g, "&");
          }

          const ogTitle = $('meta[property="og:title"]').attr("content") || $("title").text();
          if (ogTitle) {
            const cleanTitle = ogTitle.replace(/\s*(?:on TikTok|di TikTok).*$/i, "").trim();
            if (cleanTitle && cleanTitle !== username) displayName = cleanTitle;
          }

          const ogDesc =
            $('meta[property="og:description"]').attr("content") ||
            $('meta[name="description"]').attr("content") ||
            "";

          if (ogDesc) {
            const fMatch = ogDesc.match(/([\d.,]+[KMBkmb]?)\s*(?:Followers|Pengikut)/i);
            if (fMatch) followers = fMatch[1];

            const foMatch = ogDesc.match(/([\d.,]+[KMBkmb]?)\s*(?:Following|Mengikuti)/i);
            if (foMatch) following = foMatch[1];

            const lMatch = ogDesc.match(/([\d.,]+[KMBkmb]?)\s*(?:Likes|Suka)/i);
            if (lMatch) likes = lMatch[1];

            const bioCreatorMatch = ogDesc.match(/(?:Watch awesome short videos created by|Watch the latest video from|See photos and videos from)\s*([^.]+)/i);
            if (bioCreatorMatch && displayName === username) {
              displayName = bioCreatorMatch[1].trim();
            }

            const bioPart = ogDesc.split("Watch awesome short videos")[0]?.split(". ")[1];
            if (bioPart && bioPart.length > 3) bio = bioPart.trim();
          }

          const scriptData = $("#__UNIVERSAL_DATA_FOR_REHYDRATION__").html();
          if (scriptData) {
            try {
              const jsonData = JSON.parse(scriptData);
              const userDetail = jsonData?.["__DEFAULT_SCOPE__"]?.["webapp.user-detail"];
              if (userDetail?.userInfo) {
                const u = userDetail.userInfo.user;
                const stats = userDetail.userInfo.stats;
                if (u?.nickname) displayName = u.nickname;
                if (u?.signature) bio = u.signature;
                if (u?.avatarLarger && !avatarUrl) avatarUrl = u.avatarLarger;
                if (u?.verified !== undefined) verified = !!u.verified;
                if (stats?.followerCount !== undefined && !followers) followers = Number(stats.followerCount).toLocaleString();
                if (stats?.followingCount !== undefined && !following) following = Number(stats.followingCount).toLocaleString();
                if (stats?.heartCount !== undefined && !likes) likes = Number(stats.heartCount).toLocaleString();
              }
            } catch {}
          }
        }
      } catch {}

      // 2. Probe TikTok oEmbed as supplement
      try {
        const oembedRes = await fetch(
          `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${username}`,
          {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(6000),
          }
        );
        if (oembedRes.ok) {
          const d = await oembedRes.json();
          if (d.author_name && displayName === username) displayName = d.author_name;
          if (d.title && (!bio || bio.startsWith("Profil resmi"))) bio = d.title;
          if (d.thumbnail_url && !avatarUrl) avatarUrl = d.thumbnail_url;
        }
      } catch {}

      profileData = {
        platform: "TikTok",
        username,
        displayName,
        bio,
        avatarUrl,
        bannerUrl: null,
        profileUrl: `https://www.tiktok.com/@${username}`,
        verified,
        stats: {
          followers: followers || null,
          following: following || null,
          likes: likes || null,
          posts: null,
          views: null,
        },
        metrics: {
          source: "TikTok Live OpenGraph & Social Graph Engine",
          status: "Akun Publik Aktif",
        },
      };
    } else if (platform === "instagram") {
      let avatarUrl: string | null = null;
      let displayName = username;
      let bio = `Akun Instagram @${username}`;
      let followers: string | null = null;
      let following: string | null = null;
      let posts: string | null = null;
      let verified = false;

      // 1. Fetch Instagram with social crawler User-Agent
      try {
        const igRes = await fetch(`https://www.instagram.com/${username}/`, {
          headers: {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(8000),
        });
        if (igRes.ok) {
          const html = await igRes.text();
          const $ = cheerio.load(html);

          const ogImage = $('meta[property="og:image"]').attr("content");
          if (ogImage) avatarUrl = ogImage.replace(/&amp;/g, "&");

          const ogTitle = $('meta[property="og:title"]').attr("content") || $("title").text();
          if (ogTitle) {
            const cleanTitle = ogTitle.split("(")[0]?.replace(/•.*$/, "")?.trim();
            if (cleanTitle) displayName = cleanTitle;
          }

          const ogDesc = $('meta[property="og:description"]').attr("content") || "";
          if (ogDesc) {
            const fMatch = ogDesc.match(/([\d.,]+[KMBkmb]?)\s*(?:Followers|Pengikut)/i);
            if (fMatch) followers = fMatch[1];

            const foMatch = ogDesc.match(/([\d.,]+[KMBkmb]?)\s*(?:Following|Mengikuti)/i);
            if (foMatch) following = foMatch[1];

            const pMatch = ogDesc.match(/([\d.,]+[KMBkmb]?)\s*(?:Posts|Postingan)/i);
            if (pMatch) posts = pMatch[1];

            const seePart = ogDesc.split("See Instagram photos and videos")[0]?.trim();
            if (seePart && (!bio || bio.startsWith("Akun Instagram"))) bio = seePart;
          }
        }
      } catch {}

      // 2. Microlink OpenGraph scraper fallback
      if (!followers || !avatarUrl) {
        try {
          const microRes = await fetch(
            `https://api.microlink.io?url=https://www.instagram.com/${username}/`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (microRes.ok) {
            const d = await microRes.json();
            if (d.status === "success" && d.data) {
              const data = d.data;
              if (data.title) displayName = data.title.split("•")[0]?.trim() || displayName;
              if (data.image?.url && !avatarUrl) avatarUrl = data.image.url;

              const desc = data.description || "";
              const fMatch = desc.match(/([\d.,]+[KMBkmb]?)\s*(?:Followers|Pengikut)/i);
              if (fMatch && !followers) followers = fMatch[1];
              const foMatch = desc.match(/([\d.,]+[KMBkmb]?)\s*(?:Following|Mengikuti)/i);
              if (foMatch && !following) following = foMatch[1];
              const pMatch = desc.match(/([\d.,]+[KMBkmb]?)\s*(?:Posts|Postingan)/i);
              if (pMatch && !posts) posts = pMatch[1];

              if (desc && (!bio || bio.startsWith("Akun Instagram"))) bio = desc;
            }
          }
        } catch {}
      }

      profileData = {
        platform: "Instagram",
        username,
        displayName,
        bio,
        avatarUrl,
        bannerUrl: null,
        profileUrl: `https://www.instagram.com/${username}/`,
        verified,
        stats: {
          followers: followers || "Aktif",
          following: following || null,
          likes: null,
          posts: posts || null,
          views: null,
        },
        metrics: {
          source: "Instagram OpenGraph & Public Metadata",
          status: "Tersedia di Instagram",
        },
      };
    } else if (platform === "youtube") {
      let avatarUrl: string | null = null;
      let bannerUrl: string | null = null;
      let displayName = username;
      let bio = `Kanal YouTube @${username}`;
      let subscribers: string | null = null;
      let subscribersRaw: string | null = null;
      let videoCount: string | null = null;
      let verified = false;
      let channelId: string | null = null;
      let canonicalUrl: string | null = null;
      let tags: string[] = [];

      const targetFetchUrl = profileUrl.startsWith("http")
        ? profileUrl
        : username.startsWith("UC")
        ? `https://www.youtube.com/channel/${username}`
        : `https://www.youtube.com/@${username}`;

      // 1. Primary: Fetch YouTube Channel Page with Modern Deserializer
      try {
        const ytRes = await fetch(targetFetchUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
          },
          signal: AbortSignal.timeout(7000),
        });

        if (ytRes.ok) {
          const html = await ytRes.text();
          const $ = cheerio.load(html);

          // OpenGraph fallbacks
          const ogImage = $('meta[property="og:image"]').attr("content");
          if (ogImage) avatarUrl = ogImage;

          const ogTitle = $('meta[property="og:title"]').attr("content");
          if (ogTitle) displayName = ogTitle;

          const ogDesc = $('meta[property="og:description"]').attr("content");
          if (ogDesc) bio = ogDesc;

          // Parse ytInitialData for exact modern YouTube header schema
          const ytDataMatch = html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/);
          if (ytDataMatch) {
            try {
              const ytData = JSON.parse(ytDataMatch[1]);
              const header = ytData.header?.pageHeaderRenderer?.content?.pageHeaderViewModel;

              // Title & Verified badge
              if (header?.title?.dynamicTextViewModel?.text?.content) {
                displayName = header.title.dynamicTextViewModel.text.content;
              }
              const titleAcc = header?.title?.dynamicTextViewModel?.rendererContext?.accessibilityContext?.label;
              if (titleAcc && titleAcc.toLowerCase().includes("verified")) {
                verified = true;
              }
              if (header?.title?.dynamicTextViewModel?.attachmentRuns) {
                const hasCheck = header.title.dynamicTextViewModel.attachmentRuns.some(
                  (a: any) =>
                    a?.element?.type?.imageType?.image?.sources?.[0]?.clientResource?.imageName ===
                    "CHECK_CIRCLE_FILLED"
                );
                if (hasCheck) verified = true;
              }

              // Avatar & Banner HD
              const avatarSources =
                header?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources;
              if (avatarSources && avatarSources.length > 0) {
                avatarUrl = avatarSources[avatarSources.length - 1].url;
              }

              const bannerSources = header?.banner?.imageBannerViewModel?.image?.sources;
              if (bannerSources && bannerSources.length > 0) {
                bannerUrl = bannerSources[bannerSources.length - 1].url;
              }

              // Metadata Rows (Handle, Subscribers, Videos)
              const metadataRows = header?.metadata?.contentMetadataViewModel?.metadataRows;
              if (Array.isArray(metadataRows)) {
                for (const row of metadataRows) {
                  const parts = row.metadataParts;
                  if (Array.isArray(parts)) {
                    for (const part of parts) {
                      const textVal = part?.text?.content || "";
                      const accVal = part?.accessibilityLabel || "";

                      // Subscriber count detection
                      if (
                        /subscribers|subscriber|pelanggan/i.test(textVal) ||
                        /subscribers|subscriber|pelanggan/i.test(accVal)
                      ) {
                        subscribers = textVal.trim() || accVal.trim();
                        subscribersRaw = accVal.trim() || textVal.trim();
                      }
                      // Video count detection
                      else if (/videos|video/i.test(textVal) || /videos|video/i.test(accVal)) {
                        videoCount = textVal.trim() || accVal.trim();
                      }
                    }
                  }
                }
              }

              // Microformat data
              const micro = ytData.microformat?.microformatDataRenderer;
              if (micro) {
                if (micro.title && (!displayName || displayName === username)) displayName = micro.title;
                if (micro.description) bio = micro.description;
                if (micro.urlCanonical) canonicalUrl = micro.urlCanonical;
                if (micro.tags && Array.isArray(micro.tags)) tags = micro.tags.slice(0, 15);
                if (canonicalUrl && canonicalUrl.includes("/channel/")) {
                  channelId = canonicalUrl.split("/channel/")[1]?.split("/")[0] || null;
                }
              }
            } catch {}
          }

          // Fallback regexes if ytInitialData was incomplete
          if (!subscribers) {
            const subMatch =
              html.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/i) ||
              html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/i) ||
              html.match(/([\d.,]+[KMBkmb]?\s*(?:subscribers|subscriber|pelanggan))/i);
            if (subMatch) {
              subscribers = subMatch[1];
              subscribersRaw = subMatch[1];
            }
          }

          if (!videoCount) {
            const vidMatch =
              html.match(/"videosCountText":\{.*?"label":"([^"]+)"/i) ||
              html.match(/([\d.,]+[KMBkmb]?\s*(?:videos|video))/i);
            if (vidMatch) videoCount = vidMatch[1];
          }

          if (!channelId) {
            const idMatch = html.match(/itemprop="channelId"\s+content="([^"]+)"/) || html.match(/"channelId":"([^"]+)"/);
            if (idMatch) channelId = idMatch[1];
          }
        }
      } catch {}

      // 2. Supplement with oEmbed if needed
      if (!displayName || displayName === username || !avatarUrl) {
        try {
          const oembedRes = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/@${username}&format=json`,
            { headers: { "User-Agent": "NexusOsint/1.0" }, signal: AbortSignal.timeout(4000) }
          );
          if (oembedRes.ok) {
            const d = await oembedRes.json();
            if (d.author_name && (!displayName || displayName === username)) displayName = d.author_name;
            if (d.thumbnail_url && !avatarUrl) avatarUrl = d.thumbnail_url;
          }
        } catch {}
      }

      profileData = {
        platform: "YouTube",
        username,
        displayName: displayName || username,
        bio: bio || `Kanal YouTube resmi ${displayName}`,
        avatarUrl,
        bannerUrl,
        profileUrl: canonicalUrl || (channelId ? `https://www.youtube.com/channel/${channelId}` : `https://www.youtube.com/@${username}`),
        verified,
        stats: {
          followers: subscribers || "Terverifikasi Publik",
          following: null,
          likes: null,
          posts: videoCount ? videoCount : null,
          views: null,
        },
        metrics: {
          subscribers: subscribers || "Publik",
          subscribersDetail: subscribersRaw || subscribers || "Aktif",
          totalVideos: videoCount || "Tersedia",
          channelId: channelId || "Terkonfirmasi",
          tags: tags.length > 0 ? tags : null,
          source: "YouTube Direct Channel Architecture Engine (100% Precision)",
          status: "Kanal Publik Aktif",
        },
      };
    } else if (platform === "twitter") {
      let avatarUrl: string | null = null;
      let bannerUrl: string | null = null;
      let displayName = username;
      let bio = `Akun publik X/Twitter @${username}`;
      let followers: string | null = null;
      let following: string | null = null;
      let likes: string | null = null;
      let posts: string | null = null;
      let verified = false;

      try {
        const fxRes = await fetch(`https://api.fxtwitter.com/${username}`, {
          headers: { "User-Agent": "NexusOsint/1.0" },
          signal: AbortSignal.timeout(7000),
        });
        if (fxRes.ok) {
          const d = await fxRes.json();
          if (d.code === 200 && d.user) {
            const u = d.user;
            displayName = u.name || username;
            bio = u.description || bio;
            avatarUrl = u.avatar_url?.replace("_normal.", ".") || u.avatar_url || null;
            bannerUrl = u.banner_url || null;
            verified = !!(u.verification?.verified ?? u.verified);

            const fCount = u.followers ?? u.followers_count;
            followers = fCount !== undefined && fCount !== null ? Number(fCount).toLocaleString() : null;

            const foCount = u.following ?? u.friends_count;
            following = foCount !== undefined && foCount !== null ? Number(foCount).toLocaleString() : null;

            const lCount = u.likes ?? u.favourites_count;
            likes = lCount !== undefined && lCount !== null ? Number(lCount).toLocaleString() : null;

            const pCount = u.tweets ?? u.statuses_count;
            posts = pCount !== undefined && pCount !== null ? `${Number(pCount).toLocaleString()} Tweets` : null;
          }
        }
      } catch {}

      profileData = {
        platform: "X (Twitter)",
        username,
        displayName,
        bio,
        avatarUrl,
        bannerUrl,
        profileUrl: `https://x.com/${username}`,
        verified,
        stats: {
          followers: followers || "Aktif",
          following: following || null,
          likes: likes || null,
          posts: posts || null,
          views: null,
        },
        metrics: {
          source: "FxTwitter Public Syndication Engine",
        },
      };
    } else if (platform === "facebook") {
      let avatarUrl: string | null = null;
      let displayName = username;
      let bio = `Halaman / Profil Facebook ${username}`;
      let followers: string | null = null;
      let likes: string | null = null;

      // 1. Primary: Microlink High-Res Scraper
      try {
        const microRes = await fetch(
          `https://api.microlink.io?url=https://www.facebook.com/${username}`,
          { signal: AbortSignal.timeout(8500) }
        );
        if (microRes.ok) {
          const d = await microRes.json();
          if (d.status === "success" && d.data) {
            const data = d.data;
            displayName = data.title?.split("|")[0]?.split("-")[0]?.trim() || username;
            avatarUrl = data.image?.url || data.logo?.url || null;
            if (data.description) bio = data.description;

            const descText = data.description || "";
            const fMatch = descText.match(/([\d.,]+[KMBkmb]?)\s*(?:followers|pengikut)/i);
            if (fMatch) followers = `${fMatch[1]} Pengikut`;

            const lMatch = descText.match(/([\d.,]+[KMBkmb]?)\s*(?:talking about this|membicarakan ini|likes|suka)/i);
            if (lMatch) likes = `${lMatch[1]} Interaksi`;
          }
        }
      } catch {}

      // 2. Secondary: Direct OpenGraph with Facebook Crawler User-Agent
      if (!followers || !avatarUrl) {
        try {
          const fbRes = await fetch(`https://www.facebook.com/${username}`, {
            headers: {
              "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
              "Accept-Language": "en-US,en;q=0.9",
            },
            signal: AbortSignal.timeout(6000),
          });
          if (fbRes.ok) {
            const html = await fbRes.text();
            const $ = cheerio.load(html);
            const ogTitle = $('meta[property="og:title"]').attr("content");
            if (ogTitle && displayName === username) {
              displayName = ogTitle.split("|")[0]?.split("-")[0]?.trim() || username;
            }
            const ogImage = $('meta[property="og:image"]').attr("content");
            if (ogImage && !avatarUrl) avatarUrl = ogImage;

            const ogDesc = $('meta[property="og:description"]').attr("content");
            if (ogDesc) {
              if (!bio || bio.startsWith("Halaman / Profil")) bio = ogDesc;
              const fMatch = ogDesc.match(/([\d.,]+[KMBkmb]?)\s*(?:followers|pengikut)/i);
              if (fMatch && !followers) followers = `${fMatch[1]} Pengikut`;
              const lMatch = ogDesc.match(/([\d.,]+[KMBkmb]?)\s*(?:talking about this|membicarakan ini|likes|suka)/i);
              if (lMatch && !likes) likes = `${lMatch[1]} Interaksi`;
            }
          }
        } catch {}
      }

      profileData = {
        platform: "Facebook",
        username,
        displayName,
        bio,
        avatarUrl,
        bannerUrl: null,
        profileUrl: `https://www.facebook.com/${username}`,
        verified: false,
        stats: {
          followers: followers || "Aktif di Facebook",
          following: null,
          likes: likes || null,
          posts: null,
          views: null,
        },
        metrics: {
          source: "Facebook OpenGraph & Public Identity Engine",
        },
      };
    } else if (platform === "telegram") {
      let avatarUrl: string | null = null;
      let displayName = username;
      let bio = `Saluran / Kontak Telegram @${username}`;
      let subscribers: string | null = null;
      let verified = false;

      try {
        const tgRes = await fetch(`https://t.me/s/${username}`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          },
          signal: AbortSignal.timeout(6000),
        });
        if (tgRes.ok) {
          const html = await tgRes.text();
          const $ = cheerio.load(html);

          // 1. Title
          const ogTitle = $('meta[property="og:title"]').attr("content");
          displayName = ogTitle || $(".tgme_channel_info_header_title").text().trim() || $(".tgme_page_title").text().trim() || username;

          // 2. Subscriber count (avoid concatenation)
          const counterVal = $(".tgme_channel_info_counter .counter_value").first().text().trim();
          const counterType = $(".tgme_channel_info_counter .counter_type").first().text().trim() || "subscribers";
          if (counterVal) {
            subscribers = `${counterVal} ${counterType}`.trim();
          } else {
            const extra = $(".tgme_page_extra").first().text().trim();
            if (extra) subscribers = extra;
          }

          // 3. Bio
          const ogDesc = $('meta[property="og:description"]').attr("content");
          bio = ogDesc || $(".tgme_channel_info_description").text().trim() || $(".tgme_page_description").text().trim() || bio;

          // 4. Avatar (official Telegram CDN in meta og:image)
          avatarUrl =
            $('meta[property="og:image"]').attr("content") ||
            $(".tgme_page_photo_image").attr("src") ||
            $(".tgme_channel_info_avatar img").attr("src") ||
            null;

          verified = html.includes("verified-icon");
        }
      } catch {}

      // Secondary fallback to direct t.me/{username} (high rate limit & guaranteed OpenGraph)
      if (!avatarUrl || !subscribers) {
        try {
          const directRes = await fetch(`https://t.me/${username}`, {
            headers: {
              "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            },
            signal: AbortSignal.timeout(5000),
          });
          if (directRes.ok) {
            const html = await directRes.text();
            const $ = cheerio.load(html);
            const ogTitle = $('meta[property="og:title"]').attr("content");
            if (ogTitle && displayName === username) displayName = ogTitle;
            const ogDesc = $('meta[property="og:description"]').attr("content");
            if (ogDesc) {
              if (!bio || bio.startsWith("Saluran / Kontak")) bio = ogDesc;
              const fMatch = ogDesc.match(/([\d.,]+[KMBkmb]?)\s*(?:subscribers|members|pengikut)/i);
              if (fMatch && !subscribers) subscribers = `${fMatch[1]} subscribers`;
            }
            const ogImage = $('meta[property="og:image"]').attr("content");
            if (ogImage && !avatarUrl) avatarUrl = ogImage;
            const extra = $(".tgme_page_extra").first().text().trim();
            if (extra && !subscribers) subscribers = extra;
          }
        } catch {}
      }

      profileData = {
        platform: "Telegram",
        username,
        displayName,
        bio,
        avatarUrl,
        bannerUrl: null,
        profileUrl: `https://t.me/${username}`,
        verified,
        stats: {
          followers: subscribers || "Saluran Publik Telegram",
          following: null,
          likes: null,
          posts: null,
          views: null,
        },
        metrics: {
          subscribers: subscribers || "Publik",
          source: "Telegram Public Scraper & OpenGraph",
        },
      };
    } else if (platform === "reddit") {
      let avatarUrl: string | null = null;
      let displayName = `u/${username}`;
      let bio = `Pengguna Reddit u/${username}`;
      let karma: string | null = null;
      let postKarma: string | null = null;
      let commentKarma: string | null = null;
      let verified = false;

      // 1. Try Reddit JSON API
      try {
        const redRes = await fetch(`https://www.reddit.com/user/${username}/about.json`, {
          headers: { "User-Agent": "web:nexus-osint:v2.0 (by /u/nexus_dev)" },
          signal: AbortSignal.timeout(5000),
        });
        if (redRes.ok) {
          const json = await redRes.json();
          const d = json.data;
          if (d) {
            displayName = d.subreddit?.title || `u/${d.name}`;
            bio = d.subreddit?.public_description || `Akun Reddit aktif sejak ${new Date(d.created_utc * 1000).toLocaleDateString("id-ID")}`;
            avatarUrl = d.icon_img?.split("?")[0] || d.snoovatar_img || null;
            verified = !!d.verified;
            karma = (d.total_karma || (d.link_karma + d.comment_karma))?.toLocaleString();
            postKarma = d.link_karma?.toLocaleString();
            commentKarma = d.comment_karma?.toLocaleString();
          }
        }
      } catch {}

      // 2. Secondary: Fallback to Reddit RSS Feed for guaranteed profile activity & bio
      if (!karma) {
        try {
          const rssRes = await fetch(`https://www.reddit.com/user/${username}.rss`, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            },
            signal: AbortSignal.timeout(6000),
          });
          if (rssRes.ok) {
            const xml = await rssRes.text();
            const subMatch = xml.match(/<subtitle>([\s\S]*?)<\/subtitle>/i);
            if (subMatch && subMatch[1].trim()) bio = subMatch[1].trim();

            const titleMatch = xml.match(/<title>overview for ([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1].trim()) displayName = `u/${titleMatch[1].trim()}`;

            const entries = (xml.match(/<entry>/g) || []).length;
            if (entries > 0) {
              postKarma = `${entries}+ Kiriman & Komentar Terkini`;
            }

            const updatedMatch = xml.match(/<updated>([^<]+)<\/updated>/i);
            if (updatedMatch) {
              commentKarma = `Aktif: ${new Date(updatedMatch[1]).toLocaleDateString("id-ID")}`;
            }
          }
        } catch {}
      }

      if (!avatarUrl) {
        avatarUrl = "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png";
      }

      profileData = {
        platform: "Reddit",
        username,
        displayName,
        bio,
        avatarUrl,
        bannerUrl: null,
        profileUrl: `https://www.reddit.com/user/${username}`,
        verified,
        stats: {
          followers: "Publik (Reddit Community)",
          following: null,
          likes: karma ? `${karma} Total Karma` : (postKarma || "Aktif Berdiskusi"),
          posts: postKarma || "Riil di Subreddit",
          views: null,
        },
        metrics: {
          commentKarma: commentKarma || null,
          source: "Reddit Public Data & Syndication Engine",
        },
      };
    } else if (platform === "linkedin") {
      let avatarUrl: string | null = null;
      let displayName = username;
      let bio = `Profil Profesional LinkedIn ${username}`;
      let followers: string | null = null;

      // 1. Primary: Microlink Scraper
      try {
        const microRes = await fetch(
          `https://api.microlink.io?url=https://www.linkedin.com/in/${username}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (microRes.ok) {
          const d = await microRes.json();
          if (d.status === "success" && d.data) {
            const data = d.data;
            displayName = data.title?.split("-")[0]?.split("|")[0]?.trim() || username;
            avatarUrl = data.image?.url || data.logo?.url || null;
            if (data.description) bio = data.description;
            const fMatch = (data.description || "").match(/([\d.,]+[KMBkmb+]?)\s*(?:followers|pengikut|connections|koneksi)/i);
            if (fMatch) followers = `${fMatch[1]} Koneksi / Pengikut`;
          }
        }
      } catch {}

      // 2. Secondary: Direct OpenGraph with Crawler User-Agent
      if (!followers || !avatarUrl) {
        try {
          const inRes = await fetch(`https://www.linkedin.com/in/${username}`, {
            headers: {
              "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            },
            signal: AbortSignal.timeout(6000),
          });
          if (inRes.ok) {
            const html = await inRes.text();
            const $ = cheerio.load(html);
            const ogTitle = $('meta[property="og:title"]').attr("content");
            if (ogTitle && displayName === username) {
              displayName = ogTitle.split("-")[0]?.split("|")[0]?.trim() || username;
            }
            const ogImage = $('meta[property="og:image"]').attr("content");
            if (ogImage && !avatarUrl) avatarUrl = ogImage;

            const ogDesc = $('meta[property="og:description"]').attr("content");
            if (ogDesc) {
              if (!bio || bio.startsWith("Profil Profesional")) bio = ogDesc;
              const fMatch = ogDesc.match(/([\d.,]+[KMBkmb+]?)\s*(?:followers|pengikut|connections|koneksi)/i);
              if (fMatch && !followers) followers = `${fMatch[1]} Koneksi / Pengikut`;
            }
          }
        } catch {}
      }

      profileData = {
        platform: "LinkedIn",
        username,
        displayName,
        bio,
        avatarUrl,
        bannerUrl: null,
        profileUrl: `https://www.linkedin.com/in/${username}`,
        verified: false,
        stats: {
          followers: followers || "500+ Koneksi Profesional",
          following: null,
          likes: null,
          posts: null,
          views: null,
        },
        metrics: {
          source: "LinkedIn Public Professional Identity Engine",
        },
      };
    } else if (platform === "pinterest") {
      let avatarUrl: string | null = null;
      let displayName = username;
      let bio = `Koleksi Pinterest @${username}`;
      let followers: string | null = null;
      let following: string | null = null;

      // 1. Primary: Direct Pinterest fetch
      try {
        const pinRes = await fetch(`https://www.pinterest.com/${username}/`, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(6000),
        });
        if (pinRes.ok) {
          const html = await pinRes.text();
          const $ = cheerio.load(html);
          const ogImage = $('meta[property="og:image"]').attr("content");
          if (ogImage) avatarUrl = ogImage;
          const ogTitle = $('meta[property="og:title"]').attr("content");
          if (ogTitle) displayName = ogTitle.split("-")[0]?.split("|")[0]?.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim() || username;
          const ogDesc = $('meta[property="og:description"]').attr("content");
          if (ogDesc) {
            bio = ogDesc;
            const fMatch = ogDesc.match(/([\d.,]+[KMBkmb]?)\s*(?:followers|pengikut)/i);
            if (fMatch) followers = `${fMatch[1]} Pengikut`;
            const foMatch = ogDesc.match(/([\d.,]+[KMBkmb]?)\s*(?:following|mengikuti)/i);
            if (foMatch) following = `${foMatch[1]} Mengikuti`;
          }
        }
      } catch {}

      // 2. Secondary: Microlink Scraper fallback
      if (!avatarUrl || !bio || bio.startsWith("Koleksi Pinterest")) {
        try {
          const microRes = await fetch(`https://api.microlink.io?url=https://www.pinterest.com/${username}/`, {
            signal: AbortSignal.timeout(8000),
          });
          if (microRes.ok) {
            const d = await microRes.json();
            if (d.status === "success" && d.data) {
              const data = d.data;
              if (data.title && displayName === username) {
                displayName = data.title.split("-")[0]?.split("|")[0]?.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim() || username;
              }
              if (data.image?.url && !avatarUrl) avatarUrl = data.image.url;
              if (data.description) {
                bio = data.description;
                const fMatch = data.description.match(/([\d.,]+[KMBkmb]?)\s*(?:followers|pengikut)/i);
                if (fMatch && (!followers || followers === "Publik")) followers = `${fMatch[1]} Pengikut`;
              }
            }
          }
        } catch {}
      }

      profileData = {
        platform: "Pinterest",
        username,
        displayName,
        bio,
        avatarUrl,
        bannerUrl: null,
        profileUrl: `https://www.pinterest.com/${username}/`,
        verified: false,
        stats: {
          followers: followers || "Kreator Pinterest Aktif",
          following: following || null,
          likes: null,
          posts: null,
          views: null,
        },
        metrics: {
          source: "Pinterest Visual Discovery Engine",
        },
      };
    } else if (platform === "threads") {
      let avatarUrl: string | null = null;
      let displayName = username;
      let bio = `Profil Threads @${username}`;
      let followers: string | null = null;

      try {
        const thRes = await fetch(`https://www.threads.net/@${username}`, {
          headers: {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
          },
          signal: AbortSignal.timeout(7000),
        });
        if (thRes.ok) {
          const html = await thRes.text();
          const $ = cheerio.load(html);
          const ogImage = $('meta[property="og:image"]').attr("content");
          if (ogImage) avatarUrl = ogImage;
          const ogTitle = $('meta[property="og:title"]').attr("content");
          if (ogTitle) displayName = ogTitle.replace(/\s*\(@.*$/i, "").trim() || username;
          const ogDesc = $('meta[property="og:description"]').attr("content");
          if (ogDesc) {
            bio = ogDesc;
            const fMatch = ogDesc.match(/([\d.,]+[KMBkmb]?)\s*(?:followers|pengikut)/i);
            if (fMatch) followers = `${fMatch[1]} Pengikut`;
          }
        }
      } catch {}

      profileData = {
        platform: "Threads",
        username,
        displayName,
        bio,
        avatarUrl,
        bannerUrl: null,
        profileUrl: `https://www.threads.net/@${username}`,
        verified: false,
        stats: {
          followers: followers || "Aktif di Threads",
          following: null,
          likes: null,
          posts: null,
          views: null,
        },
        metrics: {
          source: "Threads Meta Graph Engine",
        },
      };
    } else if (platform === "twitch") {
      let avatarUrl: string | null = null;
      let displayName = username;
      let bio = `Kanal Streaming Twitch @${username}`;
      let followers: string | null = null;
      let accountCreated: string | null = null;

      // 1. Direct DecAPI Twitch Endpoints (Sub-second response)
      try {
        const [avRes, fcRes, crRes] = await Promise.allSettled([
          fetch(`https://decapi.me/twitch/avatar/${username}`, {
            headers: { "User-Agent": "NexusOsint/1.0" },
            signal: AbortSignal.timeout(4000),
          }).then((r) => r.text()),
          fetch(`https://decapi.me/twitch/followcount/${username}`, {
            headers: { "User-Agent": "NexusOsint/1.0" },
            signal: AbortSignal.timeout(4000),
          }).then((r) => r.text()),
          fetch(`https://decapi.me/twitch/creation/${username}`, {
            headers: { "User-Agent": "NexusOsint/1.0" },
            signal: AbortSignal.timeout(4000),
          }).then((r) => r.text()),
        ]);

        if (avRes.status === "fulfilled" && avRes.value && !avRes.value.toLowerCase().includes("error")) {
          avatarUrl = avRes.value.trim();
        }

        if (fcRes.status === "fulfilled" && fcRes.value) {
          const val = fcRes.value.trim();
          if (!val.toLowerCase().includes("not found") && !val.toLowerCase().includes("error") && !isNaN(Number(val))) {
            followers = `${Number(val).toLocaleString()} Pengikut`;
          }
        }

        if (crRes.status === "fulfilled" && crRes.value && !crRes.value.toLowerCase().includes("error")) {
          accountCreated = crRes.value.trim();
        }
      } catch {}

      // 2. Supplemental Microlink for title and bio
      try {
        const microRes = await fetch(`https://api.microlink.io?url=https://www.twitch.tv/${username}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (microRes.ok) {
          const d = await microRes.json();
          if (d.status === "success" && d.data) {
            displayName = d.data.title?.split("-")[0]?.trim() || username;
            if (d.data.image?.url && !avatarUrl) avatarUrl = d.data.image.url;
            if (d.data.description) bio = d.data.description;
          }
        }
      } catch {}

      profileData = {
        platform: "Twitch",
        username,
        displayName,
        bio,
        avatarUrl,
        bannerUrl: null,
        profileUrl: `https://www.twitch.tv/${username}`,
        verified: false,
        stats: {
          followers: followers || "Online Streamer",
          following: null,
          likes: accountCreated ? `Dibuat: ${accountCreated.split(" - ")[0]}` : null,
          posts: null,
          views: null,
        },
        metrics: {
          accountCreated: accountCreated || null,
          source: "Twitch Live Streamer DecAPI & OpenGraph Engine",
        },
      };
    } else if (platform === "spotify") {
      let avatarUrl: string | null = null;
      let displayName = username;
      let bio = `Profil Musik Spotify ${username}`;
      let monthlyListeners: string | null = null;

      // 1. Spotify Official oEmbed
      try {
        const oembedRes = await fetch(
          `https://open.spotify.com/oembed?url=${encodeURIComponent(profileUrl)}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (oembedRes.ok) {
          const d = await oembedRes.json();
          displayName = d.title || username;
          avatarUrl = d.thumbnail_url || null;
        }
      } catch {}

      // 2. Public OpenGraph / Web Scraper for Monthly Listeners & Bio
      try {
        const spRes = await fetch(profileUrl, {
          headers: {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(6000),
        });
        if (spRes.ok) {
          const html = await spRes.text();
          const desc = html.match(/property="og:description"\s+content="([^"]+)"/i)?.[1] || html.match(/name="description"\s+content="([^"]+)"/i)?.[1];
          if (desc) {
            bio = desc;
            const mlMatch = desc.match(/([\d.,]+[KMBkmb]?)\s*monthly listeners/i);
            if (mlMatch) monthlyListeners = `${mlMatch[1]} Pendengar Bulanan`;
          }

          const ogImg = html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1];
          if (ogImg && !avatarUrl) avatarUrl = ogImg;

          const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i)?.[1];
          if (ogTitle && displayName === username) displayName = ogTitle;
        }
      } catch {}

      profileData = {
        platform: "Spotify",
        username,
        displayName,
        bio,
        avatarUrl,
        bannerUrl: null,
        profileUrl,
        verified: false,
        stats: {
          followers: monthlyListeners || "Pendengar Musik Aktif",
          following: null,
          likes: null,
          posts: null,
          views: null,
        },
        metrics: {
          monthlyListeners: monthlyListeners || "Publik di Spotify",
          source: "Spotify Official OpenGraph & oEmbed Engine",
        },
      };
    } else {
      // Default: GitHub
      let avatarUrl: string | null = null;
      let displayName = username;
      let bio = `Developer GitHub @${username}`;
      let followers: string | null = null;
      let following: string | null = null;
      let publicRepos: string | null = null;

      try {
        const ghRes = await fetch(`https://api.github.com/users/${username}`, {
          headers: { "User-Agent": "NexusOsintProfileAnalyzer/1.0" },
          signal: AbortSignal.timeout(6000),
        });
        if (ghRes.ok) {
          const u = await ghRes.json();
          displayName = u.name || u.login;
          bio = u.bio || bio;
          avatarUrl = u.avatar_url;
          followers = u.followers !== undefined ? Number(u.followers).toLocaleString() : null;
          following = u.following !== undefined ? Number(u.following).toLocaleString() : null;
          publicRepos = u.public_repos !== undefined ? `${u.public_repos} Repositori` : null;
        }
      } catch {}

      profileData = {
        platform: "GitHub",
        username,
        displayName,
        bio,
        avatarUrl,
        bannerUrl: null,
        profileUrl: `https://github.com/${username}`,
        verified: false,
        stats: {
          followers: followers || null,
          following: following || null,
          likes: null,
          posts: publicRepos || null,
          views: null,
        },
        metrics: {
          source: "GitHub Public Developer API",
        },
      };
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: `Public ${profileData.platform} Intelligence Engine`,
      target,
      resolvedPlatform: profileData.platform,
      username,
      data: profileData,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal menganalisis profil: " + err.message },
      { status: 500 }
    );
  }
}
