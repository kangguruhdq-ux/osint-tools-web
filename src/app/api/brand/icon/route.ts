import { NextRequest, NextResponse } from "next/server";
import { getSystemSetting } from "@/lib/db";

export async function GET(req: NextRequest) {
  let iconType = "termux-classic";
  try {
    iconType = await getSystemSetting("brand_icon", "termux-classic");
  } catch {
    iconType = "termux-classic";
  }

  let svgContent = "";

  if (iconType === "termux-green") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <rect width="64" height="64" rx="14" fill="#000000"/>
  <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" stroke="#16a34a" stroke-width="1.5" stroke-opacity="0.6"/>
  <!-- Termux '>' Prompt -->
  <path d="M18 20L32 32L18 44" stroke="#22c55e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Termux '_' Cursor -->
  <path d="M36 44H48" stroke="#4ade80" stroke-width="6" stroke-linecap="round"/>
</svg>`;
  } else if (iconType === "termux-bash") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <rect width="64" height="64" rx="14" fill="#050811"/>
  <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" stroke="#0ea5e9" stroke-width="1.5" stroke-opacity="0.5"/>
  <text x="14" y="42" font-family="ui-monospace,SFMono-Regular,Consolas,monospace" font-size="24" font-weight="900" fill="#38bdf8">~$</text>
  <path d="M44 42H52" stroke="#06b6d4" stroke-width="4.5" stroke-linecap="round"/>
</svg>`;
  } else if (iconType === "cyber-shield") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <rect width="64" height="64" rx="14" fill="#020617"/>
  <path d="M32 10L48 16V30C48 41 41 50 32 54C23 50 16 41 16 30V16L32 10Z" fill="#0369a1" fill-opacity="0.2" stroke="#0284c7" stroke-width="3" stroke-linejoin="round"/>
  <path d="M26 26L33 32L26 38" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M35 38H41" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
</svg>`;
  } else {
    // Default: Termux Classic (>_ in white and cyan on dark OLED black)
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <rect width="64" height="64" rx="14" fill="#000000"/>
  <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" stroke="#334155" stroke-width="1.5"/>
  <!-- Termux '>' Prompt -->
  <path d="M18 20L32 32L18 44" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Termux '_' Cursor -->
  <path d="M36 44H48" stroke="#00E5FF" stroke-width="6" stroke-linecap="round"/>
</svg>`;
  }

  return new NextResponse(svgContent, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
