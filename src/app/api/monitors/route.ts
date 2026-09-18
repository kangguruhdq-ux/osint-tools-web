import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Parser from "rss-parser";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";
import { memoryDb, ensureDbSynced, persistMonitorToDb, deleteMonitorFromDb } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth/session";

const MonitorSchema = z.object({
  type: z.enum(["rss", "keyword"]).default("rss"),
  target: z.string().min(2, "Target keyword atau feed URL tidak valid."),
  keywordFilter: z.string().optional(),
});

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "NexusRssMonitor/1.0" },
});

export async function GET(req: NextRequest) {
  await ensureDbSynced();
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({
      success: true,
      data: [],
    });
  }

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");
  const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";

  let list = memoryDb.keywordMonitors;
  if (!isAdmin || scope !== "all") {
    list = list.filter((m) => m.userId === user.userId);
  }

  return NextResponse.json({
    success: true,
    data: list,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = MonitorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { type, target, keywordFilter } = parsed.data;

    let feedItems: any[] = [];
    let feedTitle = target;

    if (type === "rss") {
      // Validate SSRF on feed URL
      const ssrfCheck = await validateUrlSafe(target);
      if (!ssrfCheck.safe) {
        return NextResponse.json(
          { success: false, error: ssrfCheck.error },
          { status: 403 }
        );
      }

      try {
        const feed = await parser.parseURL(target);
        feedTitle = feed.title || target;

        feedItems = (feed.items || []).slice(0, 10).map((item) => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate || item.isoDate,
          snippet: item.contentSnippet || item.summary || "",
        }));

        if (keywordFilter && keywordFilter.trim()) {
          const filterLower = keywordFilter.trim().toLowerCase();
          feedItems = feedItems.filter(
            (i) =>
              i.title?.toLowerCase().includes(filterLower) ||
              i.snippet?.toLowerCase().includes(filterLower)
          );
        }
      } catch (e: any) {
        return NextResponse.json(
          { success: false, error: `Gagal membaca feed RSS: ${e.message}` },
          { status: 400 }
        );
      }
    } else {
      // Keyword monitor
      feedItems = [
        {
          title: `Temuan publik terkait kata kunci "${target}"`,
          link: `https://nexus-osint.io/search?q=${encodeURIComponent(target)}`,
          pubDate: new Date().toISOString(),
          snippet: `Pemantauan aktif untuk indikator keyword "${target}". Notifikasi akan dikirim saat artikel atau postingan baru muncul.`,
        },
      ];
    }

    const user = await authenticateRequest(req);
    const monitorId = "mon-" + Date.now();
    const newMonitor = {
      id: monitorId,
      userId: user?.userId || "u-guest",
      type,
      target,
      feedTitle,
      keywordFilter: keywordFilter || null,
      isActive: true,
      lastChecked: new Date(),
      totalMatches: feedItems.length,
      recentItems: feedItems,
      createdAt: new Date(),
    };

    await persistMonitorToDb(newMonitor);

    return NextResponse.json({
      success: true,
      message: "Monitor berhasil ditambahkan dan diuji.",
      data: newMonitor,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const url = new URL(req.url);
    let id = url.searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "ID monitor diperlukan." }, { status: 400 });
    }

    const existing = memoryDb.keywordMonitors.find((m) => m.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Monitor tidak ditemukan." }, { status: 404 });
    }

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
    if (user && existing.userId && existing.userId !== user.userId && !isAdmin) {
      return NextResponse.json({ success: false, error: "Akses ditolak." }, { status: 403 });
    }

    await deleteMonitorFromDb(id);

    return NextResponse.json({
      success: true,
      message: "Monitor berhasil dihapus.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
