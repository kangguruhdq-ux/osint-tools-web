import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/session";
import { memoryDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak ditemukan atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    const userId = user.userId;

    // 1. User private investigations
    const userInvestigations = Array.from(memoryDb.investigations.values())
      .filter((inv) => inv.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // 2. User private reports
    const userReports = memoryDb.reports
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

    // 3. User private monitors
    const userMonitors = memoryDb.keywordMonitors
      .filter((m) => m.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 4. User private audit logs (scan activities - exclude auth/session actions)
    const userLogs = memoryDb.auditLogs
      .filter(
        (log) =>
          log.userId === userId &&
          log.action !== "USER_REGISTER" &&
          log.action !== "USER_LOGIN" &&
          log.resourceType !== "USER"
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Format recent user activities
    const recentActivities = userLogs.slice(0, 10).map((log) => ({
      id: log.id,
      tool: log.action || "OSINT Scan",
      target:
        log.details?.domain ||
        log.details?.url ||
        log.details?.target ||
        log.details?.title ||
        log.resourceId ||
        "Target Publik",
      status: "SUCCESS",
      time: new Date(log.createdAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      category: log.resourceType || "Analisis",
    }));

    return NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: (user as any).avatar || null,
      },
      stats: {
        totalScans: userLogs.length,
        totalReports: userReports.length,
        activeMonitors: userMonitors.length,
        activeProjects: userInvestigations.length,
      },
      recentActivities,
      activeInvestigations: userInvestigations.slice(0, 5),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memuat statistik dashboard: " + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: true, message: "Guest execution ignored." });
    }

    const body = await req.json();
    const { toolId, toolName, target } = body;

    const logEntry = {
      id: "aud-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      userId: user.userId,
      action: toolName || toolId || "OSINT Scan",
      resourceType: "TOOL_SCAN",
      resourceId: target || toolId || "Target",
      details: {
        toolId,
        target: target || "Target Publik",
      },
      createdAt: new Date(),
    };

    memoryDb.auditLogs.unshift(logEntry);
    memoryDb.scanResults.unshift({
      id: "scan-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      userId: user.userId,
      toolId: toolId || "osint-scan",
      target: target || "Target Publik",
      data: { toolName, target },
      summary: `Pemindaian menggunakan utilitas ${toolName || toolId} terhadap target ${target || "publik"}.`,
      confidenceScore: 0.95,
      sourceInfo: "NEXUS Core Engine",
      createdAt: new Date(),
    });
    memoryDb.save();

    return NextResponse.json({
      success: true,
      message: "Aktivitas pemindaian berhasil dicatat ke dashboard privat.",
      data: logEntry,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
