import { NextResponse } from "next/server";
import { getSystemSetting } from "@/lib/db";

export async function GET() {
  try {
    const [icon, name, badge] = await Promise.all([
      getSystemSetting("brand_icon", "termux-classic"),
      getSystemSetting("brand_name", "NEXUS"),
      getSystemSetting("brand_badge", "OSINT"),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        icon,
        name,
        badge,
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        icon: "termux-classic",
        name: "NEXUS",
        badge: "OSINT",
      },
    });
  }
}
