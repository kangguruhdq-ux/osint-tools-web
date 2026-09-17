import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UsernameSchema = z.object({
  username: z.string().min(1, "Username atau tautan profil wajib diisi.").max(300, "Input terlalu panjang."),
});

function extractCleanUsername(raw: string): string {
  let u = raw.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) {
    try {
      const parsed = new URL(u);
      const pathname = parsed.pathname;
      const match = pathname.match(/@([^/?#]+)/);
      if (match) return match[1];
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        const last = segments[segments.length - 1].replace(/^@/, "");
        if (last && last !== "user" && last !== "channel" && !last.includes(".php")) return last;
        if (segments.length > 1) return segments[segments.length - 2].replace(/^@/, "");
      }
    } catch {}
  }
  return u.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 40);
}

interface PlatformConfig {
  name: string;
  category: "Social Media" | "Developer & Tech" | "Community & Gaming";
  urlPattern: string;
  check: (username: string) => Promise<{ status: "FOUND" | "NOT_FOUND" | "UNKNOWN"; avatar?: string }>;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = UsernameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const username = extractCleanUsername(parsed.data.username);
    if (!username || username.length < 2) {
      return NextResponse.json(
        { success: false, error: "Username tidak valid atau minimal 2 karakter." },
        { status: 400 }
      );
    }

    const platforms: PlatformConfig[] = [
      // 1. TikTok (via official public oEmbed)
      {
        name: "TikTok",
        category: "Social Media",
        urlPattern: `https://www.tiktok.com/@${username}`,
        check: async (u) => {
          try {
            const res = await fetch(`https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${u}`, {
              headers: { "User-Agent": "NexusOsint/1.0" },
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 200) {
              const d = await res.json();
              return { status: "FOUND", avatar: d.thumbnail_url || undefined };
            }
            if (res.status === 404 || res.status === 400) return { status: "NOT_FOUND" };
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 2. Instagram
      {
        name: "Instagram",
        category: "Social Media",
        urlPattern: `https://www.instagram.com/${username}/`,
        check: async (u) => {
          try {
            const res = await fetch(`https://www.instagram.com/${u}/`, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml",
              },
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 404) return { status: "NOT_FOUND" };
            if (res.status === 200) return { status: "FOUND" };
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 3. X / Twitter (via FxTwitter Syndication API)
      {
        name: "X (Twitter)",
        category: "Social Media",
        urlPattern: `https://x.com/${username}`,
        check: async (u) => {
          try {
            const res = await fetch(`https://api.fxtwitter.com/${u}`, {
              headers: { "User-Agent": "NexusOsint/1.0" },
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 200) {
              const d = await res.json();
              if (d.code === 200 && d.user) {
                return { status: "FOUND", avatar: d.user.avatar_url };
              }
              return { status: "NOT_FOUND" };
            }
            if (res.status === 404) return { status: "NOT_FOUND" };
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 4. Facebook
      {
        name: "Facebook",
        category: "Social Media",
        urlPattern: `https://www.facebook.com/${username}`,
        check: async (u) => {
          try {
            const res = await fetch(`https://www.facebook.com/${u}`, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 404) return { status: "NOT_FOUND" };
            if (res.status === 200) return { status: "FOUND" };
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 5. Telegram
      {
        name: "Telegram",
        category: "Social Media",
        urlPattern: `https://t.me/${username}`,
        check: async (u) => {
          try {
            const res = await fetch(`https://t.me/${u}`, {
              headers: { "User-Agent": "NexusOsint/1.0" },
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 200) {
              const text = await res.text();
              if (text.includes("tgme_page_title") && !text.includes("If you have Telegram, you can view and join")) {
                return { status: "FOUND" };
              }
              if (text.includes("tgme_page_extra") || text.includes("tgme_action_button_new")) {
                return { status: "FOUND" };
              }
              return { status: "NOT_FOUND" };
            }
            return { status: "NOT_FOUND" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 6. YouTube (via official public oEmbed)
      {
        name: "YouTube",
        category: "Social Media",
        urlPattern: `https://www.youtube.com/@${username}`,
        check: async (u) => {
          try {
            const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/@${u}&format=json`, {
              headers: { "User-Agent": "NexusOsint/1.0" },
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 200) {
              const d = await res.json();
              return { status: "FOUND", avatar: d.thumbnail_url || undefined };
            }
            if (res.status === 404) return { status: "NOT_FOUND" };
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 7. Pinterest
      {
        name: "Pinterest",
        category: "Social Media",
        urlPattern: `https://www.pinterest.com/${username}/`,
        check: async (u) => {
          try {
            const res = await fetch(`https://www.pinterest.com/${u}/`, {
              headers: { "User-Agent": "Mozilla/5.0" },
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 404) return { status: "NOT_FOUND" };
            if (res.status === 200) return { status: "FOUND" };
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 8. Reddit (Official JSON API)
      {
        name: "Reddit",
        category: "Community & Gaming",
        urlPattern: `https://www.reddit.com/user/${username}`,
        check: async (u) => {
          try {
            const res = await fetch(`https://www.reddit.com/user/${u}/about.json`, {
              headers: { "User-Agent": "NexusOsintUsernameChecker/1.0" },
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 200) {
              const d = await res.json();
              return { status: "FOUND", avatar: d.data?.icon_img?.split("?")[0] };
            }
            if (res.status === 404) return { status: "NOT_FOUND" };
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 9. GitHub
      {
        name: "GitHub",
        category: "Developer & Tech",
        urlPattern: `https://github.com/${username}`,
        check: async (u) => {
          try {
            const res = await fetch(`https://api.github.com/users/${u}`, {
              headers: { "User-Agent": "NexusOsintUsernameChecker/1.0", Accept: "application/json" },
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 200) {
              const d = await res.json();
              return { status: "FOUND", avatar: d.avatar_url };
            }
            if (res.status === 404) return { status: "NOT_FOUND" };
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 10. GitLab
      {
        name: "GitLab",
        category: "Developer & Tech",
        urlPattern: `https://gitlab.com/${username}`,
        check: async (u) => {
          try {
            const res = await fetch(`https://gitlab.com/api/v4/users?username=${u}`, {
              headers: { "User-Agent": "NexusOsint/1.0" },
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 200) {
              const d = await res.json();
              if (Array.isArray(d) && d.length > 0) {
                return { status: "FOUND", avatar: d[0].avatar_url };
              }
              return { status: "NOT_FOUND" };
            }
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 11. HackerNews
      {
        name: "HackerNews",
        category: "Developer & Tech",
        urlPattern: `https://news.ycombinator.com/user?id=${username}`,
        check: async (u) => {
          try {
            const res = await fetch(`https://hacker-news.firebaseio.com/v0/user/${u}.json`, {
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 200) {
              const d = await res.json();
              return d !== null ? { status: "FOUND" } : { status: "NOT_FOUND" };
            }
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 12. Dev.to
      {
        name: "Dev.to",
        category: "Developer & Tech",
        urlPattern: `https://dev.to/${username}`,
        check: async (u) => {
          try {
            const res = await fetch(`https://dev.to/api/users/by_username?url=${u}`, {
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 200) {
              const d = await res.json();
              return { status: "FOUND", avatar: d.profile_image };
            }
            if (res.status === 404) return { status: "NOT_FOUND" };
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 13. Docker Hub
      {
        name: "Docker Hub",
        category: "Developer & Tech",
        urlPattern: `https://hub.docker.com/u/${username}`,
        check: async (u) => {
          try {
            const res = await fetch(`https://hub.docker.com/v2/users/${u}`, {
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 200) return { status: "FOUND" };
            if (res.status === 404) return { status: "NOT_FOUND" };
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 14. Chess.com
      {
        name: "Chess.com",
        category: "Community & Gaming",
        urlPattern: `https://www.chess.com/member/${username}`,
        check: async (u) => {
          try {
            const res = await fetch(`https://api.chess.com/pub/player/${u}`, {
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 200) {
              const d = await res.json();
              return { status: "FOUND", avatar: d.avatar };
            }
            if (res.status === 404) return { status: "NOT_FOUND" };
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
      // 15. Gravatar
      {
        name: "Gravatar",
        category: "Community & Gaming",
        urlPattern: `https://gravatar.com/${username}`,
        check: async (u) => {
          try {
            const res = await fetch(`https://en.gravatar.com/${u}.json`, {
              signal: AbortSignal.timeout(5000),
            });
            if (res.status === 200) {
              const d = await res.json();
              return { status: "FOUND", avatar: d.entry?.[0]?.thumbnailUrl };
            }
            if (res.status === 404) return { status: "NOT_FOUND" };
            return { status: "UNKNOWN" };
          } catch {
            return { status: "UNKNOWN" };
          }
        },
      },
    ];

    const results = await Promise.allSettled(
      platforms.map(async (p) => {
        const checkResult = await p.check(username);
        return {
          platform: p.name,
          category: p.category,
          status: checkResult.status,
          profileUrl: p.urlPattern,
          avatar: checkResult.avatar,
        };
      })
    );

    const platformResults = results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : {
            platform: platforms[i].name,
            category: platforms[i].category,
            status: "UNKNOWN" as const,
            profileUrl: platforms[i].urlPattern,
          }
    );

    const foundCount = platformResults.filter((p) => p.status === "FOUND").length;
    const notFoundCount = platformResults.filter((p) => p.status === "NOT_FOUND").length;
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: "Public Social Media & API Probing Engine",
      username,
      totalChecked: platforms.length,
      foundCount,
      notFoundCount,
      results: platformResults,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memeriksa username: " + err.message },
      { status: 500 }
    );
  }
}
