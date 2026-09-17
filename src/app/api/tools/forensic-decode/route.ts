import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ForensicSchema = z.object({
  payload: z.string().min(1, "Payload untuk didekode wajib diisi."),
  encoding: z.enum(["auto", "base64", "hex", "url", "html", "rot13", "binary", "jwt"]).default("auto"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ForensicSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const payload = parsed.data.payload.trim();
    let encoding = parsed.data.encoding;

    // 1. Auto-detect encoding
    if (encoding === "auto") {
      if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(payload)) {
        encoding = "jwt";
      } else if (/^[01\s]{8,}$/.test(payload) && payload.replace(/\s/g, "").length % 8 === 0) {
        encoding = "binary";
      } else if (/^(?:0x)?[0-9a-fA-F]{4,}$/.test(payload.replace(/[\s:]/g, "")) && payload.replace(/[\s:]/g, "").length % 2 === 0) {
        encoding = "hex";
      } else if (/%[0-9a-fA-F]{2}/.test(payload)) {
        encoding = "url";
      } else if (/&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/.test(payload)) {
        encoding = "html";
      } else if (/^[A-Za-z0-9+/=]{4,}$/.test(payload.replace(/\s/g, "")) && payload.replace(/\s/g, "").length % 4 === 0) {
        encoding = "base64";
      } else {
        encoding = "rot13";
      }
    }

    let decoded = "";
    let extraMeta: any = {};

    if (encoding === "jwt") {
      try {
        const parts = payload.split(".");
        const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
        const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));

        decoded = JSON.stringify({ header, payload: claims }, null, 2);
        extraMeta = {
          algorithm: header.alg || "Unknown",
          tokenType: header.typ || "JWT",
          issuedAt: claims.iat ? new Date(claims.iat * 1000).toISOString() : undefined,
          expiresAt: claims.exp ? new Date(claims.exp * 1000).toISOString() : undefined,
          subject: claims.sub,
          issuer: claims.iss,
        };
      } catch (e: any) {
        decoded = "Gagal mendecode JWT: Format token tidak valid.";
      }
    } else if (encoding === "base64") {
      try {
        decoded = Buffer.from(payload, "base64").toString("utf8");
      } catch {
        decoded = "Gagal mendecode Base64: Karakter tidak valid.";
      }
    } else if (encoding === "hex") {
      try {
        const clean = payload.replace(/[^0-9a-fA-F]/g, "");
        decoded = Buffer.from(clean, "hex").toString("utf8");
      } catch {
        decoded = "Gagal mendecode Hex: Karakter bukan heksadesimal valid.";
      }
    } else if (encoding === "url") {
      try {
        decoded = decodeURIComponent(payload);
      } catch {
        decoded = "Gagal mendecode URL: Sequence malformed.";
      }
    } else if (encoding === "html") {
      decoded = payload
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x2F;/gi, "/")
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    } else if (encoding === "binary") {
      try {
        const bits = payload.replace(/\s+/g, "");
        let str = "";
        for (let i = 0; i < bits.length; i += 8) {
          const byte = bits.substring(i, i + 8);
          str += String.fromCharCode(parseInt(byte, 2));
        }
        decoded = str;
      } catch {
        decoded = "Gagal mendecode Binary.";
      }
    } else {
      // Rot13
      decoded = payload.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      });
    }

    return NextResponse.json({
      success: true,
      provider: "Nexus Multi-Format Cryptographic Forensic Decoder",
      detectedEncoding: encoding,
      originalLength: payload.length,
      decodedLength: decoded.length,
      decodedText: decoded,
      extraMetadata: Object.keys(extraMeta).length > 0 ? extraMeta : null,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal mendecode payload: " + err.message },
      { status: 500 }
    );
  }
}
