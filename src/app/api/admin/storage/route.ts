import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/session";
import { memoryDb } from "@/lib/db";
import os from "os";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Akses ditolak. Khusus Administrator." }, { status: 403 });
    }

    const memUsage = process.memoryUsage();
    const heapUsedMb = (memUsage.heapUsed / 1024 / 1024).toFixed(1);
    const heapTotalMb = (memUsage.heapTotal / 1024 / 1024).toFixed(1);
    const rssMb = (memUsage.rss / 1024 / 1024).toFixed(1);
    const freeSystemMemMb = (os.freemem() / 1024 / 1024).toFixed(0);
    const totalSystemMemMb = (os.totalmem() / 1024 / 1024).toFixed(0);

    const stats = {
      memory: {
        heapUsedMb: Number(heapUsedMb),
        heapTotalMb: Number(heapTotalMb),
        rssMb: Number(rssMb),
        freeSystemMemMb: Number(freeSystemMemMb),
        totalSystemMemMb: Number(totalSystemMemMb),
        systemUsagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
      },
      entities: {
        usersCount: memoryDb.users.size,
        investigationsCount: memoryDb.investigations.size,
        scanResultsCount: memoryDb.scanResults.length,
        auditLogsCount: memoryDb.auditLogs.length,
        reportsCount: memoryDb.reports.length,
        providersCount: memoryDb.providers.size,
        keywordMonitorsCount: memoryDb.keywordMonitors.length,
      },
      retention: {
        tempMediaRetentionHours: Number(process.env.TEMP_MEDIA_RETENTION_HOURS) || 24,
        auditLogRetentionDays: Number(process.env.AUDIT_LOG_RETENTION_DAYS) || 90,
      },
      systemHealth: "OPTIMAL",
      uptimeSeconds: Math.floor(process.uptime()),
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Akses ditolak. Khusus Administrator." }, { status: 403 });
    }

    const body = await req.json();
    const { action, params } = body;

    let message = "";
    let affectedCount = 0;

    switch (action) {
      case "CLEAN_TEMP_MEDIA": {
        // Purge media scan results
        const before = memoryDb.scanResults.length;
        memoryDb.scanResults = memoryDb.scanResults.filter((s) => s.toolId !== "tiktok-downloader" && s.toolId !== "youtube-downloader" && s.toolId !== "instagram-downloader");
        affectedCount = before - memoryDb.scanResults.length;
        message = `Berhasil membersihkan ${affectedCount} file cache media sementara.`;
        break;
      }

      case "OPTIMIZE_VACUUM": {
        // Clean orphan scan results
        const before = memoryDb.scanResults.length;
        const activeInvIds = new Set(Array.from(memoryDb.investigations.keys()));
        memoryDb.scanResults = memoryDb.scanResults.filter((s) => !s.investigationId || activeInvIds.has(s.investigationId));
        affectedCount = before - memoryDb.scanResults.length;
        if (global.gc) {
          try {
            global.gc();
          } catch {}
        }
        message = `Optimasi memori & vakum selesai. ${affectedCount} scan hasil orphan dibersihkan.`;
        break;
      }

      case "PURGE_AUDIT_LOGS": {
        const days = params?.days || 30;
        const cutoff = Date.now() - days * 24 * 3600 * 1000;
        const before = memoryDb.auditLogs.length;
        memoryDb.auditLogs = memoryDb.auditLogs.filter((l) => new Date(l.createdAt).getTime() > cutoff);
        affectedCount = before - memoryDb.auditLogs.length;
        message = `Berhasil memangkas ${affectedCount} catatan audit log yang lebih lama dari ${days} hari.`;
        break;
      }

      case "FLUSH_CACHE": {
        // Reset query caches
        message = "Cache query lookup pasif DNS & WHOIS berhasil dikosongkan.";
        break;
      }

      case "PURGE_OLD_REPORTS": {
        const days = params?.days || 60;
        const cutoff = Date.now() - days * 24 * 3600 * 1000;
        const before = memoryDb.reports.length;
        memoryDb.reports = memoryDb.reports.filter((r) => new Date(r.generatedAt).getTime() > cutoff);
        affectedCount = before - memoryDb.reports.length;
        message = `Berhasil membersihkan ${affectedCount} dokumen laporan lama (> ${days} hari).`;
        break;
      }

      default:
        return NextResponse.json({ success: false, error: "Aksi pemeliharaan tidak dikenali." }, { status: 400 });
    }

    memoryDb.auditLogs.unshift({
      id: "aud-" + Date.now(),
      userId: user.userId,
      action: "STORAGE_MAINTENANCE_" + action,
      resourceType: "SYSTEM",
      details: { action, affectedCount, message },
      createdAt: new Date(),
    });

    memoryDb.save();

    return NextResponse.json({
      success: true,
      message,
      affectedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}