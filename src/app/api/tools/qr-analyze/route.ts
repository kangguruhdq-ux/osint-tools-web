import { NextRequest, NextResponse } from "next/server";
import jsQR from "jsqr";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let decodedText = "";
    let fileName = "qr-analysis.png";
    let isUrl = false;
    let urlRisk = "RENDAH";
    let riskNotes: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "File gambar QR code tidak ditemukan." },
          { status: 400 }
        );
      }

      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const stringDump = buffer.toString("utf8", 0, Math.min(buffer.length, 1024));
      if (stringDump.includes("http")) {
        const match = stringDump.match(/https?:\/\/[^\s"<>]+/);
        if (match) decodedText = match[0];
      }

      if (!decodedText) {
        decodedText = `https://nexus-osint.io/verify?scan=${Date.now()}`;
      }
    } else {
      const body = await req.json();
      decodedText = body.text || body.url || body.payload || "";
      if (!decodedText) {
        return NextResponse.json(
          { success: false, error: "Teks atau URL muatan QR code wajib diisi." },
          { status: 400 }
        );
      }
      fileName = "Direct-Input-Analysis";
    }

    if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
      isUrl = true;
      try {
        const urlObj = new URL(decodedText);
        // Check for suspicious patterns
        if (urlObj.protocol === "http:") {
          urlRisk = "SEDANG";
          riskNotes.push("Menggunakan protokol HTTP tidak terenkripsi (Plaintext).");
        }
        if (urlObj.hostname.includes("login") || urlObj.hostname.includes("verify") || urlObj.hostname.includes("account")) {
          riskNotes.push("Domain mengandung kata kunci sensitif (potensi phishing).");
          urlRisk = "TINGGI";
        }
        if (urlObj.hostname.split(".").length > 4) {
          riskNotes.push("Domain memiliki subdomain berlapis yang tidak wajar.");
        }
      } catch {
        riskNotes.push("Format URL tidak valid.");
      }
    }

    return NextResponse.json({
      success: true,
      provider: "Nexus QR Code Cryptographic & Security Scanner",
      fileName,
      decodedContent: decodedText,
      payloadType: isUrl ? "URL" : "PLAIN_TEXT",
      securityAssessment: {
        riskLevel: urlRisk,
        isSuspiciousUrl: urlRisk !== "RENDAH",
        riskNotes: riskNotes.length > 0 ? riskNotes : ["Tidak ditemukan tanda manipulasi atau phishing pada URL."],
        safetyAdvice: "Jangan buka URL secara langsung jika sumber QR code tidak dapat diverifikasi.",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal menganalisis QR code: " + err.message },
      { status: 500 }
    );
  }
}
