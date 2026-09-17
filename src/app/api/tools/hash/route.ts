import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let buffer: Buffer;
    let compareHash: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      compareHash = (formData.get("compareHash") as string) || undefined;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "File tidak ditemukan dalam form data." },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const body = await req.json();
      if (!body.text && !body.content) {
        return NextResponse.json(
          { success: false, error: "Teks atau konten wajib diisi." },
          { status: 400 }
        );
      }
      buffer = Buffer.from(body.text || body.content, "utf8");
      compareHash = body.compareHash;
    }

    const md5 = crypto.createHash("md5").update(buffer).digest("hex");
    const sha1 = crypto.createHash("sha1").update(buffer).digest("hex");
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const sha512 = crypto.createHash("sha512").update(buffer).digest("hex");

    let matchFound = false;
    let matchedAlgorithm = "";

    if (compareHash) {
      const cleanCompare = compareHash.trim().toLowerCase();
      if (cleanCompare === md5.toLowerCase()) {
        matchFound = true;
        matchedAlgorithm = "MD5";
      } else if (cleanCompare === sha1.toLowerCase()) {
        matchFound = true;
        matchedAlgorithm = "SHA-1";
      } else if (cleanCompare === sha256.toLowerCase()) {
        matchFound = true;
        matchedAlgorithm = "SHA-256";
      } else if (cleanCompare === sha512.toLowerCase()) {
        matchFound = true;
        matchedAlgorithm = "SHA-512";
      }
    }

    return NextResponse.json({
      success: true,
      provider: "Node.js Native Cryptographic Engine",
      byteSize: buffer.length,
      hashes: {
        md5,
        sha1,
        sha256,
        sha512,
      },
      comparison: compareHash
        ? {
            providedHash: compareHash,
            isMatch: matchFound,
            matchedAlgorithm: matchFound ? matchedAlgorithm : null,
          }
        : null,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal menghitung hash: " + err.message },
      { status: 500 }
    );
  }
}
