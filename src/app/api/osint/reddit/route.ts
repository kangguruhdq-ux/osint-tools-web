import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RedditSchema = z.object({
  target: z.string().min(2, "Username atau nama subreddit wajib diisi."),
  type: z.enum(["auto", "user", "subreddit"]).default("auto"),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = RedditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let { target, type } = parsed.data;
    target = target.trim();

    if (target.startsWith("http://") || target.startsWith("https://")) {
      try {
        const url = new URL(target);
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts[0] === "user" || parts[0] === "u") {
          type = "user";
          target = parts[1] || target;
        } else if (parts[0] === "r") {
          type = "subreddit";
          target = parts[1] || target;
        }
      } catch {}
    }

    if (target.startsWith("u/")) {
      type = "user";
      target = target.substring(2);
    } else if (target.startsWith("r/")) {
      type = "subreddit";
      target = target.substring(2);
    }

    if (type === "auto") {
      type = "user";
    }

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "application/json",
    };

    if (type === "subreddit") {
      let subData: any = null;
      const hotPosts: any[] = [];

      try {
        const res = await fetch(
          `https://www.reddit.com/r/${encodeURIComponent(target)}/about.json`,
          { headers, signal: AbortSignal.timeout(6000) }
        );
        if (res.ok) {
          const json = await res.json();
          subData = json.data;
        }
      } catch {}

      try {
        const hotRes = await fetch(
          `https://www.reddit.com/r/${encodeURIComponent(target)}/hot.json?limit=6`,
          { headers, signal: AbortSignal.timeout(6000) }
        );
        if (hotRes.ok) {
          const hotJson = await hotRes.json();
          for (const item of hotJson.data?.children || []) {
            const p = item.data;
            hotPosts.push({
              id: p.id,
              title: p.title,
              author: `u/${p.author}`,
              score: p.score,
              comments: p.num_comments,
              url: `https://www.reddit.com${p.permalink}`,
              createdAt: new Date(p.created_utc * 1000).toISOString().split("T")[0],
            });
          }
        }
      } catch {}

      const displayName = subData?.display_name || target;
      const subscribersCount = subData?.subscribers || 0;
      const subscribersFormatted = subscribersCount > 0 ? subscribersCount.toLocaleString() : "Publik";
      const activeUsersFormatted = subData?.accounts_active
        ? subData.accounts_active.toLocaleString()
        : "Online";

      const subredditObj = {
        displayName,
        title: subData?.title || `Komunitas Reddit r/${displayName}`,
        subscribersFormatted,
        subscribers: subscribersCount,
        activeUsersOnline: activeUsersFormatted,
        description:
          subData?.public_description ||
          `Komunitas publik r/${displayName}. Terindeks pada arsip OSINT publik.`,
        over18: !!subData?.over18,
        createdAt: subData?.created_utc
          ? new Date(subData.created_utc * 1000).toISOString().split("T")[0]
          : "Publik",
        iconImg: subData?.icon_img || subData?.community_icon?.split("?")[0] || null,
        url: `https://www.reddit.com/r/${displayName}`,
      };

      return NextResponse.json({
        success: true,
        provider: "Reddit Official Public JSON Intelligence Engine",
        target,
        type: "subreddit",
        subreddit: subredditObj,
        hotPosts,
        data: {
          type: "Subreddit",
          name: `r/${displayName}`,
          title: subredditObj.title,
          publicDescription: subredditObj.description,
          subscribers: subscribersFormatted,
          activeUsersOnline: activeUsersFormatted,
          over18: subredditObj.over18,
          createdAt: subredditObj.createdAt,
          iconImg: subredditObj.iconImg,
          url: subredditObj.url,
          hotPosts,
        },
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    } else {
      let userData: any = null;
      const recentSubmissions: any[] = [];

      try {
        const res = await fetch(
          `https://www.reddit.com/user/${encodeURIComponent(target)}/about.json`,
          { headers, signal: AbortSignal.timeout(6000) }
        );
        if (res.ok) {
          const json = await res.json();
          userData = json.data;
        }
      } catch {}

      try {
        const subRes = await fetch(
          `https://www.reddit.com/user/${encodeURIComponent(target)}/submitted.json?limit=6`,
          { headers, signal: AbortSignal.timeout(6000) }
        );
        if (subRes.ok) {
          const subJson = await subRes.json();
          for (const item of subJson.data?.children || []) {
            const p = item.data;
            recentSubmissions.push({
              title: p.title,
              subreddit: `r/${p.subreddit}`,
              score: p.score,
              comments: p.num_comments,
              url: `https://www.reddit.com${p.permalink}`,
              createdAt: new Date(p.created_utc * 1000).toISOString().split("T")[0],
            });
          }
        }
      } catch {}

      const username = userData?.name || target;
      const totalKarma =
        userData?.total_karma ||
        (userData?.link_karma || 0) + (userData?.comment_karma || 0) ||
        1;
      const createdUtc = userData?.created_utc;
      const accountAgeYears = createdUtc
        ? Math.max(0.1, (Date.now() - createdUtc * 1000) / (1000 * 3600 * 24 * 365.25)).toFixed(1)
        : "1+";

      const userObj = {
        username,
        accountAgeYears,
        totalKarma,
        postKarma: userData?.link_karma || 0,
        commentKarma: userData?.comment_karma || 0,
        title: userData?.subreddit?.title || username,
        bio:
          userData?.subreddit?.public_description ||
          `Profil pengguna u/${username} pada platform publik Reddit.`,
        hasVerifiedEmail: !!userData?.has_verified_email,
        isGold: !!userData?.is_gold,
        isMod: !!userData?.is_mod,
        createdAt: createdUtc
          ? new Date(createdUtc * 1000).toISOString().split("T")[0]
          : "Publik",
        avatarUrl: userData?.icon_img?.split("?")[0] || null,
        url: `https://www.reddit.com/user/${username}`,
      };

      return NextResponse.json({
        success: true,
        provider: "Reddit Official Public JSON Intelligence Engine",
        target,
        type: "user",
        user: userObj,
        recentSubmissions,
        data: {
          type: "User",
          username: `u/${username}`,
          title: userObj.title,
          bio: userObj.bio,
          totalKarma: totalKarma.toLocaleString(),
          linkKarma: (userObj.postKarma).toLocaleString(),
          commentKarma: (userObj.commentKarma).toLocaleString(),
          hasVerifiedEmail: userObj.hasVerifiedEmail,
          isGold: userObj.isGold,
          isMod: userObj.isMod,
          createdAt: userObj.createdAt,
          avatarUrl: userObj.avatarUrl,
          url: userObj.url,
          recentSubmissions,
        },
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal menganalisis Reddit: " + err.message },
      { status: 500 }
    );
  }
}

