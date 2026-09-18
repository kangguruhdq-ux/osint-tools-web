import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dns from "dns/promises";

const EmailSchema = z.object({
  email: z.string().min(3, "Alamat email tidak valid."),
});

const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com", "10minutemail.net", "mailinator.com", "guerrillamail.com", "guerrillamail.net",
  "guerrillamail.org", "tempmail.com", "temp-mail.org", "fakeinbox.com", "throwawaymail.com",
  "trashmail.com", "yopmail.com", "yopmail.fr", "yopmail.net", "getairmail.com", "dispostable.com",
  "maildrop.cc", "sharklasers.com", "inboxkitten.com", "mohmal.com", "crazymailing.com",
  "burnermail.io", "mytemp.email", "nada.ltd", "emailondeck.com", "generator.email",
  "tempail.com", "minutemailbox.com", "generator.email", "dropmail.me", "mohmal.im",
  "getnada.com", "temp-mail.io", "internxt.com", "luxusmail.com", "disposablemail.com"
]);

const FREE_CONSUMER_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.id", "outlook.com",
  "hotmail.com", "live.com", "icloud.com", "mail.com", "zoho.com", "proton.me", "protonmail.com"
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = EmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const rawInput = parsed.data.email.trim().toLowerCase();
    let domain = "";
    let username = "";

    if (rawInput.includes("@")) {
      const parts = rawInput.split("@");
      username = parts[0];
      domain = parts[1];
    } else {
      domain = rawInput;
    }

    // Clean domain
    domain = domain.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];

    const isDisposableDomain = DISPOSABLE_DOMAINS.has(domain);
    const isFreeConsumer = FREE_CONSUMER_DOMAINS.has(domain);

    let mxRecords: any[] = [];
    let mxStatus = "UNKNOWN";
    let primaryMxHost = "";

    try {
      const mx = await dns.resolveMx(domain);
      mxRecords = mx.sort((a, b) => a.priority - b.priority);
      if (mxRecords.length > 0) {
        mxStatus = "VALID";
        primaryMxHost = mxRecords[0].exchange;
      } else {
        mxStatus = "NO_MX";
      }
    } catch (e: any) {
      mxStatus = e.code || "RESOLUTION_FAILED";
    }

    // Check if MX host points to known disposable provider
    const isMxDisposable = mxRecords.some((r) =>
      DISPOSABLE_DOMAINS.has(r.exchange.toLowerCase()) ||
      r.exchange.toLowerCase().includes("mailinator") ||
      r.exchange.toLowerCase().includes("guerrillamail")
    );

    const isBurner = isDisposableDomain || isMxDisposable;

    // Risk scoring
    let riskScore = 0; // 0 - 100
    if (isBurner) riskScore = 95;
    else if (mxStatus !== "VALID") riskScore = 75;
    else if (isFreeConsumer) riskScore = 20;
    else riskScore = 5; // Corporate / Custom domain with valid MX

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    if (riskScore >= 80) riskLevel = "CRITICAL";
    else if (riskScore >= 50) riskLevel = "HIGH";
    else if (riskScore >= 20) riskLevel = "MEDIUM";

    return NextResponse.json({
      success: true,
      email: rawInput,
      domain,
      username: username || undefined,
      isDisposable: isBurner,
      isFreeProvider: isFreeConsumer,
      isCorporateDomain: !isBurner && !isFreeConsumer && mxStatus === "VALID",
      riskScore,
      riskLevel,
      mxStatus,
      primaryMxHost: primaryMxHost || null,
      totalMxRecords: mxRecords.length,
      mxRecords: mxRecords.slice(0, 5),
      verdict: isBurner
        ? "TERDETEKSI SEBAGAI EMAIL SEMENTARA (BURNER / DISPOSABLE). Akun kemungkinan besar fiktif."
        : mxStatus === "VALID"
        ? "EMAIL VALID & AKTIF. Domain memiliki server MX terverifikasi yang siap menerima surat."
        : "DOMAIN TIDAK MEMILIKI SERVER MX. Pengiriman surat kemungkinan besar akan gagal.",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Gagal mendeteksi email disposable: " + err.message }, { status: 500 });
  }
}
