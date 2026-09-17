import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UserAgentSchema = z.object({
  userAgent: z.string().min(3, "String User-Agent wajib diisi."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UserAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const ua = parsed.data.userAgent.trim();

    // 1. Detect Operating System
    let os = "Unknown OS";
    if (/Windows NT 10\.0/i.test(ua)) os = "Windows 10 / Windows 11";
    else if (/Windows NT 6\.3/i.test(ua)) os = "Windows 8.1";
    else if (/Windows NT 6\.1/i.test(ua)) os = "Windows 7";
    else if (/Macintosh.*Mac OS X (\d+[._]\d+)/i.test(ua)) {
      const match = ua.match(/Mac OS X (\d+[._]\d+)/i);
      os = `macOS ${match ? match[1].replace("_", ".") : ""}`.trim();
    } else if (/iPhone.*OS (\d+[._]\d+)/i.test(ua)) {
      const match = ua.match(/OS (\d+[._]\d+)/i);
      os = `iOS (iPhone) ${match ? match[1].replace("_", ".") : ""}`.trim();
    } else if (/iPad.*OS (\d+[._]\d+)/i.test(ua)) {
      const match = ua.match(/OS (\d+[._]\d+)/i);
      os = `iPadOS ${match ? match[1].replace("_", ".") : ""}`.trim();
    } else if (/Android (\d+(\.\d+)?)/i.test(ua)) {
      const match = ua.match(/Android (\d+(\.\d+)?)/i);
      os = `Android ${match ? match[1] : ""}`.trim();
    } else if (/Linux/i.test(ua)) os = "Linux";

    // 2. Detect Browser
    let browser = "Unknown Browser";
    let version = "";

    if (/Edg\/(\d+[\.\d]*)/i.test(ua)) {
      browser = "Microsoft Edge";
      version = ua.match(/Edg\/(\d+[\.\d]*)/i)?.[1] || "";
    } else if (/OPR\/(\d+[\.\d]*)/i.test(ua) || /Opera/i.test(ua)) {
      browser = "Opera";
      version = ua.match(/OPR\/(\d+[\.\d]*)/i)?.[1] || "";
    } else if (/Chrome\/(\d+[\.\d]*)/i.test(ua) && !/Chromium/i.test(ua)) {
      browser = "Google Chrome";
      version = ua.match(/Chrome\/(\d+[\.\d]*)/i)?.[1] || "";
    } else if (/Firefox\/(\d+[\.\d]*)/i.test(ua)) {
      browser = "Mozilla Firefox";
      version = ua.match(/Firefox\/(\d+[\.\d]*)/i)?.[1] || "";
    } else if (/Version\/(\d+[\.\d]*).*Safari/i.test(ua)) {
      browser = "Apple Safari";
      version = ua.match(/Version\/(\d+[\.\d]*)/i)?.[1] || "";
    }

    // 3. Detect Bot / Crawler
    let isBot = false;
    let botName: string | null = null;
    let botCategory = "Standard Client";

    const botPatterns = [
      { name: "Googlebot", cat: "Search Engine Crawler", re: /Googlebot/i },
      { name: "Bingbot", cat: "Search Engine Crawler", re: /bingbot/i },
      { name: "YandexBot", cat: "Search Engine Crawler", re: /YandexBot/i },
      { name: "DuckDuckBot", cat: "Privacy Search Crawler", re: /DuckDuckBot/i },
      { name: "Baiduspider", cat: "Search Engine Crawler", re: /Baiduspider/i },
      { name: "AhrefsBot", cat: "SEO & Backlink Auditor", re: /AhrefsBot/i },
      { name: "SemrushBot", cat: "SEO & Backlink Auditor", re: /SemrushBot/i },
      { name: "Twitterbot", cat: "Social Media Link Preview", re: /Twitterbot/i },
      { name: "facebookexternalhit", cat: "Social Media Link Preview", re: /facebookexternalhit/i },
      { name: "TelegramBot", cat: "Social Media Link Preview", re: /TelegramBot/i },
      { name: "Discordbot", cat: "Chat Link Preview", re: /Discordbot/i },
      { name: "curl / Wget", cat: "CLI Automation Tool", re: /(curl|wget|python-requests|aiohttp)/i },
    ];

    for (const b of botPatterns) {
      if (b.re.test(ua)) {
        isBot = true;
        botName = b.name;
        botCategory = b.cat;
        break;
      }
    }

    // 4. Device Type
    let deviceType = "Desktop";
    if (isBot) deviceType = "Bot / Spider";
    else if (/Mobile/i.test(ua) || /Android/i.test(ua) || /iPhone/i.test(ua)) deviceType = "Mobile Phone";
    else if (/Tablet|iPad/i.test(ua)) deviceType = "Tablet";

    // 5. Engine
    let engine = "Unknown Engine";
    if (/AppleWebKit/i.test(ua)) engine = "WebKit / Blink";
    else if (/Gecko\//i.test(ua)) engine = "Gecko (Firefox)";
    else if (/Trident/i.test(ua)) engine = "Trident (IE)";

    return NextResponse.json({
      success: true,
      provider: "Nexus User-Agent & Bot Crawler Heuristic Profiler",
      userAgent: ua,
      browser: {
        name: browser,
        version: version || "Unspecified",
        engine,
      },
      os: {
        name: os,
        architecture: /x86_64|Win64|x64|amd64/i.test(ua) ? "64-bit" : /arm64|aarch64/i.test(ua) ? "ARM 64-bit" : "32-bit / Standard",
      },
      device: {
        type: deviceType,
        isMobile: deviceType === "Mobile Phone" || deviceType === "Tablet",
        isBot,
        botName,
        botCategory,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memprofil User-Agent: " + err.message },
      { status: 500 }
    );
  }
}
