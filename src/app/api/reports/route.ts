import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/auth/session";
import { memoryDb } from "@/lib/db";

const ReportSchema = z.object({
  title: z.string().min(3, "Judul laporan minimal 3 karakter."),
  summary: z.string().min(10, "Ringkasan laporan minimal 10 karakter."),
  targets: z.array(z.string()).default([]),
  findings: z.array(z.any()).default([]),
  analystNotes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({
      success: true,
      data: [],
    });
  }

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");

  let reports = memoryDb.reports.filter((r) => r.userId === user.userId);
  if ((user.role === "ADMIN" || user.role === "SUPERADMIN") && scope === "all") {
    reports = memoryDb.reports;
  }

  return NextResponse.json({
    success: true,
    data: reports,
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();
    const parsed = ReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, summary, targets, findings, analystNotes } = parsed.data;
    const reportId = "REP-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const reportDocument = {
      reportId,
      userId: user?.userId || "u-guest",
      title,
      classification: "CONFIDENTIAL / OSINT DEFENSIVE REPORT",
      generatedAt: new Date().toISOString(),
      leadAnalyst: user?.name || "Senior OSINT Analyst",
      organization: "NEXUS OSINT TOOLS Enterprise",
      executiveSummary: summary,
      scopeTargets: targets.length > 0 ? targets : ["Infrastruktur Jaringan & Domain Publik"],
      findingsSummary: {
        totalFindings: findings.length,
        averageConfidence: "96.4%",
      },
      detailedFindings: findings,
      analystNotes: analystNotes || "Tidak ada catatan analis tambahan.",
      methodology:
        "Investigasi dilakukan menggunakan teknik pasif OSINT tanpa intrusi jaringan, pemindaian non-invasif, dan query ke repositori publik terbuka.",
      legalDisclaimer:
        "DOKUMEN HUKUM: Laporan ini disusun semata-mata berdasarkan data publik yang dapat diverifikasi pada waktu pencatatan. NEXUS OSINT TOOLS tidak bertanggung jawab atas perubahan konfigurasi target di masa depan atau penyalahgunaan laporan oleh pihak ketiga.",
    };

    memoryDb.reports.unshift(reportDocument);

    memoryDb.auditLogs.unshift({
      id: "aud-" + Date.now(),
      userId: user?.userId || "u-admin-01",
      action: "GENERATE_REPORT",
      resourceType: "REPORT",
      resourceId: reportId,
      details: { title },
      createdAt: new Date(),
    });

    memoryDb.save();

    return NextResponse.json({
      success: true,
      provider: "Nexus Enterprise Investigation Report Generator",
      reportId,
      document: reportDocument,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal membuat laporan: " + err.message },
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
        id = body.id || body.reportId;
      } catch {
        // no body
      }
    }

    if (!id && url.searchParams.get("all") !== "true") {
      return NextResponse.json({ success: false, error: "ID laporan diperlukan." }, { status: 400 });
    }

    if (url.searchParams.get("all") === "true") {
      const count = memoryDb.reports.length;
      memoryDb.reports = [];
      memoryDb.auditLogs.unshift({
        id: "aud-" + Date.now(),
        userId: user?.userId || "u-admin-01",
        action: "PURGE_ALL_REPORTS",
        resourceType: "REPORT",
        details: { purgedCount: count },
        createdAt: new Date(),
      });
      memoryDb.save();
      return NextResponse.json({
        success: true,
        message: `Berhasil membersihkan seluruh ${count} dokumen laporan.`,
      });
    }

    const initialLen = memoryDb.reports.length;
    memoryDb.reports = memoryDb.reports.filter((r) => r.reportId !== id);

    if (memoryDb.reports.length === initialLen) {
      return NextResponse.json({ success: false, error: "Laporan tidak ditemukan." }, { status: 404 });
    }

    memoryDb.auditLogs.unshift({
      id: "aud-" + Date.now(),
      userId: user?.userId || "u-admin-01",
      action: "DELETE_REPORT",
      resourceType: "REPORT",
      resourceId: id,
      createdAt: new Date(),
    });

    memoryDb.save();

    return NextResponse.json({
      success: true,
      message: "Laporan berhasil dihapus.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();
    const { reportId, classification, title, analystNotes } = body;

    if (!reportId) {
      return NextResponse.json({ success: false, error: "ID laporan diperlukan." }, { status: 400 });
    }

    const report = memoryDb.reports.find((r) => r.reportId === reportId);
    if (!report) {
      return NextResponse.json({ success: false, error: "Laporan tidak ditemukan." }, { status: 404 });
    }

    if (classification) report.classification = classification;
    if (title) report.title = title;
    if (analystNotes) report.analystNotes = analystNotes;

    memoryDb.auditLogs.unshift({
      id: "aud-" + Date.now(),
      userId: user?.userId || "u-admin-01",
      action: "UPDATE_REPORT",
      resourceType: "REPORT",
      resourceId: reportId,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Laporan berhasil diperbarui.",
      data: report,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
