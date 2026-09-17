import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";
import { z } from "zod";

const EmailSchema = z.object({
  email: z.string().min(3, "Alamat email tidak valid."),
});

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "sharklasers.com",
  "yopmail.com",
  "dispostable.com",
  "throwawaymail.com",
  "getairmail.com",
  "fakeinbox.com",
  "trashmail.com",
  "temp-mail.org",
  "mohmal.com",
]);

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = EmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const parts = email.split("@");

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return NextResponse.json(
        { success: false, error: "Sintaks email tidak valid (kurang format user@domain)." },
        { status: 400 }
      );
    }

    const [userPart, domainPart] = parts;
    const isSyntaxValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    const isDisposable = DISPOSABLE_DOMAINS.has(domainPart);

    // DNS MX Record lookup
    let hasMxRecords = false;
    let mxRecords: any[] = [];
    try {
      mxRecords = await dns.resolveMx(domainPart);
      hasMxRecords = mxRecords.length > 0;
    } catch {
      hasMxRecords = false;
    }

    const latencyMs = Date.now() - startTime;
    const isDeliverableCandidate = isSyntaxValid && hasMxRecords && !isDisposable;

    return NextResponse.json({
      success: true,
      provider: "Nexus Email & MX Validator Engine",
      email,
      userPart,
      domainPart,
      isSyntaxValid,
      hasMxRecords,
      isDisposable,
      mxRecords,
      isDeliverableCandidate,
      privacyNotice:
        "Validasi hanya memeriksa keabsahan sintaks domain dan ketersediaan server mail exchange (MX), tanpa mengontak atau mencari identitas pemilik email.",
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memvalidasi email: " + err.message },
      { status: 500 }
    );
  }
}
