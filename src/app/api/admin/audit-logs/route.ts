import { NextRequest, NextResponse } from "next/server";
import { memoryDb, ensureDbSynced, clearAuditLogsFromDb } from "@/lib/db";

export async function GET() {
  await ensureDbSynced();
  return NextResponse.json({
    success: true,
    data: memoryDb.auditLogs,
  });
}

export async function DELETE(req: NextRequest) {
  try {
    await clearAuditLogsFromDb();
    return NextResponse.json({
      success: true,
      message: "Seluruh riwayat audit log keamanan berhasil dibersihkan.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
