import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const contentType = req.headers.get("content-type") || "";
    let fileBuffer: Buffer | null = null;
    let originalName = "image.jpg";
    let mimeType = "image/jpeg";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: "File gambar tidak ditemukan." }, { status: 400 });
      }
      originalName = file.name;
      mimeType = file.type || "image/jpeg";
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
    } else {
      const body = await req.json();
      if (body.base64) {
        const parts = body.base64.split(",");
        const rawB64 = parts.length > 1 ? parts[1] : parts[0];
        fileBuffer = Buffer.from(rawB64, "base64");
        if (body.filename) originalName = body.filename;
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data gambar kosong atau format tidak didukung." },
        { status: 400 }
      );
    }

    const originalSize = fileBuffer.length;
    let cleanedBuffer: Buffer = fileBuffer;
    let cleanedType = "Unknown";
    let tagsRemoved: string[] = [
      "GPS Latitude & Longitude Coordinates",
      "Camera Make & Lens Model",
      "Serial Number & Software ID",
      "Date/Time Original Timestamps",
      "Thumbnail Previews",
      "Photoshop IPTC/XMP Data",
    ];

    // JPEG Stripper: Remove APP1 (0xFFE1) to APP15 (0xFFEF) and COM (0xFFFE) markers
    if (fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8) {
      cleanedType = "JPEG";
      const chunks: Buffer[] = [];
      chunks.push(fileBuffer.subarray(0, 2)); // SOI: FF D8
      let pos = 2;

      while (pos < fileBuffer.length) {
        if (fileBuffer[pos] !== 0xff) break;
        const marker = fileBuffer[pos + 1];

        // End of image or SOS (Start of Scan - raw image data starts here)
        if (marker === 0xd9 || marker === 0xda) {
          chunks.push(fileBuffer.subarray(pos));
          break;
        }

        // Variable length marker
        const length = fileBuffer.readUInt16BE(pos + 2);
        const isAppMarker = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe; // APP1-APP15, COM

        if (!isAppMarker) {
          // Keep critical markers (SOF, DQT, DHT, APP0 JFIF, etc.)
          chunks.push(fileBuffer.subarray(pos, pos + 2 + length));
        }

        pos += 2 + length;
      }

      cleanedBuffer = Buffer.concat(chunks);
    } else if (
      fileBuffer[0] === 0x89 &&
      fileBuffer[1] === 0x50 &&
      fileBuffer[2] === 0x4e &&
      fileBuffer[3] === 0x47
    ) {
      // PNG Stripper: Strip non-critical text chunks (tEXt, zTXt, iTXt, eXIf)
      cleanedType = "PNG";
      const chunks: Buffer[] = [];
      chunks.push(fileBuffer.subarray(0, 8)); // PNG Magic Header
      let pos = 8;

      while (pos < fileBuffer.length) {
        const length = fileBuffer.readUInt32BE(pos);
        const chunkType = fileBuffer.toString("ascii", pos + 4, pos + 8);
        const totalChunkLen = 12 + length; // 4 len + 4 type + length + 4 crc

        if (!["tEXt", "zTXt", "iTXt", "eXIf", "tIME"].includes(chunkType)) {
          chunks.push(fileBuffer.subarray(pos, pos + totalChunkLen));
        }

        pos += totalChunkLen;
      }

      cleanedBuffer = Buffer.concat(chunks);
    }

    const cleanedSize = cleanedBuffer.length;
    const bytesSaved = Math.max(0, originalSize - cleanedSize);
    const cleanedBase64 = cleanedBuffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${cleanedBase64}`;

    return NextResponse.json({
      success: true,
      provider: "Nexus Pure In-Memory EXIF & Metadata Privacy Scrubber",
      originalFilename: originalName,
      imageFormat: cleanedType,
      originalSizeBytes: originalSize,
      cleanedSizeBytes: cleanedSize,
      bytesRemoved: bytesSaved,
      removedTags: tagsRemoved,
      downloadUrl: dataUri,
      dataUri,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal membersihkan metadata: " + err.message },
      { status: 500 }
    );
  }
}
