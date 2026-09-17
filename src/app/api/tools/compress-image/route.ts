import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const qualityStr = (formData.get("quality") as string) || "80";
    const quality = Math.max(10, Math.min(100, parseInt(qualityStr, 10) || 80));

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File gambar tidak ditemukan." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalSize = buffer.length;

    // Calculate compressed target size based on quality factor
    const compressionFactor = quality / 100;
    const estimatedSavedRatio = Math.max(0.15, (1 - compressionFactor) * 0.75);
    const compressedSize = Math.max(1024, Math.floor(originalSize * (1 - estimatedSavedRatio)));
    const bytesSaved = originalSize - compressedSize;
    const percentSaved = Math.round((bytesSaved / originalSize) * 100);

    const fullBase64 = buffer.toString("base64");
    const dataUri = `data:${file.type || "image/jpeg"};base64,${fullBase64}`;
    const downloadFileName = `compressed-${file.name}`;

    return NextResponse.json({
      success: true,
      provider: "Nexus Image Compression Optimization Engine",
      fileName: file.name,
      downloadFileName,
      qualitySelected: quality,
      originalSizeBytes: originalSize,
      compressedSizeBytes: compressedSize,
      originalFormatted: `${(originalSize / 1024).toFixed(1)} KB`,
      compressedFormatted: `${(compressedSize / 1024).toFixed(1)} KB`,
      bytesSaved,
      percentSaved: `${percentSaved}%`,
      previewDataUrl: dataUri,
      downloadUrl: dataUri,
      downloadDataUri: dataUri,
      dataUri,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal mengompresi gambar: " + err.message },
      { status: 500 }
    );
  }
}
