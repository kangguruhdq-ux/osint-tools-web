import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const DefangSchema = z.object({
  text: z.string().min(1, "Teks atau daftar IOC wajib diisi."),
  action: z.enum(["defang", "refang"]).default("defang"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = DefangSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { text, action } = parsed.data;
    let result = "";

    if (action === "defang") {
      result = text
        // Protocols
        .replace(/https:\/\//gi, "hxxps://")
        .replace(/http:\/\//gi, "hxxp://")
        .replace(/ftp:\/\//gi, "fxp://")
        // Dots in domains & IPs
        .replace(/(?<=[a-zA-Z0-9_\-])\.(?=[a-zA-Z0-9_\-])/g, "[.]")
        // Emails
        .replace(/@/g, "[@]");
    } else {
      // Refang
      result = text
        .replace(/hxxps:\/\//gi, "https://")
        .replace(/hxxp:\/\//gi, "http://")
        .replace(/fxp:\/\//gi, "ftp://")
        .replace(/\[\.\]/g, ".")
        .replace(/\(\.\)/g, ".")
        .replace(/\{\.\}/g, ".")
        .replace(/\[@\]/g, "@")
        .replace(/\(@\)/g, "@");
    }

    // Extract statistics on types of IOCs in input
    const ipMatches = result.match(/\b(?:[0-9]{1,3}(?:\[\.\]|\.)){3}[0-9]{1,3}\b/g) || [];
    const urlMatches = result.match(/(?:hxxps?|https?):\/\/[^\s]+/gi) || [];
    const emailMatches = result.match(/[a-zA-Z0-9_.+-]+(?:\[@\]|@)[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/gi) || [];

    return NextResponse.json({
      success: true,
      provider: "Nexus Cyber Threat Intelligence IOC Defang/Refang Engine",
      action,
      originalText: text,
      processedText: result,
      stats: {
        totalLines: text.split("\n").length,
        detectedIps: ipMatches.length,
        detectedUrls: urlMatches.length,
        detectedEmails: emailMatches.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses defang/refang: " + err.message },
      { status: 500 }
    );
  }
}
