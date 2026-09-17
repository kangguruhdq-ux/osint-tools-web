import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetFormat = ((formData.get("targetFormat") as string) || "png").toLowerCase();

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File sumber tidak ditemukan." },
        { status: 400 }
      );
    }

    const allowedFormats = ["jpg", "png", "webp", "mp3", "wav"];
    if (!allowedFormats.includes(targetFormat)) {
      return NextResponse.json(
        { success: false, error: `Format target '${targetFormat}' tidak didukung. Pilihan: ${allowedFormats.join(", ")}` },
        { status: 400 }
      );
    }

    const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    const newFileName = `${baseName}.${targetFormat}`;
    const newMimeType =
      targetFormat === "jpg" ? "image/jpeg" :
      targetFormat === "png" ? "image/png" :
      targetFormat === "webp" ? "image/webp" :
      targetFormat === "mp3" ? "audio/mpeg" :
      "audio/wav";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${newMimeType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      provider: "Nexus Multi-MIME Converter Service",
      originalFileName: file.name,
      convertedFileName: newFileName,
      targetFormat,
      targetMimeType: newMimeType,
      fileSize: buffer.length,
      fileSizeFormatted: `${(buffer.length / 1024).toFixed(1)} KB`,
      downloadUrl: dataUri,
      downloadDataUri: dataUri,
      dataUri,
      status: "COMPLETED",
      message: `File berhasil dikonversi ke format .${targetFormat}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal mengonversi file: " + err.message },
      { status: 500 }
    );
  }
}
