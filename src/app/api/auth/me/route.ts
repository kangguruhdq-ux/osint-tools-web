import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Tidak terautentikasi." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user,
  });
}
