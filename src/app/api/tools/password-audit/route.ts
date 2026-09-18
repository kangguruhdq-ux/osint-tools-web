import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const AuditSchema = z.object({
  password: z.string().min(1, "Password tidak boleh kosong."),
});

function formatDuration(seconds: number): string {
  if (seconds < 1) return "Instan (< 1 detik)";
  if (seconds < 60) return `${Math.round(seconds)} detik`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} menit`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} jam`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} hari`;
  if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} tahun`;
  if (seconds < 315360000000) return `${Math.round(seconds / 3153600000)} abad`;
  return "Jutaan tahun (Kriptografis Sangat Kuat)";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AuditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const pw = parsed.data.password;
    const len = pw.length;

    // Character Pool Analysis
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasDigits = /[0-9]/.test(pw);
    const hasSymbols = /[^a-zA-Z0-9]/.test(pw);

    let poolSize = 0;
    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasDigits) poolSize += 10;
    if (hasSymbols) poolSize += 33;

    // Shannon entropy in bits: L * log2(poolSize)
    const entropyBits = poolSize > 0 ? Math.round(len * Math.log2(poolSize) * 10) / 10 : 0;

    // Total possible combinations: poolSize ^ len
    const combinations = Math.pow(poolSize, len);

    // Crack times across various hardware tiers (average attempts = combinations / 2)
    const avgGuesses = combinations / 2;

    // Speeds:
    // 1. Online web form (throttled): 10 req/sec
    // 2. Offline Single CPU (MD5/SHA256): 10,000,000 / sec
    // 3. 8x NVIDIA RTX 4090 GPU Cluster: 120,000,000,000 / sec
    const onlineTimeSec = avgGuesses / 10;
    const cpuTimeSec = avgGuesses / 10000000;
    const gpuTimeSec = avgGuesses / 120000000000;

    // Pattern & Weakness Checks
    const weaknesses: string[] = [];
    if (len < 8) weaknesses.push("Panjang kurang dari 8 karakter.");
    else if (len < 12) weaknesses.push("Panjang di bawah standar modern (disarankan minimal 12 karakter).");
    if (!hasUpper) weaknesses.push("Tidak memiliki huruf besar (A-Z).");
    if (!hasLower) weaknesses.push("Tidak memiliki huruf kecil (a-z).");
    if (!hasDigits) weaknesses.push("Tidak memiliki angka (0-9).");
    if (!hasSymbols) weaknesses.push("Tidak memiliki simbol atau karakter khusus (@, #, $, dll.).");

    const commonSequences = ["123", "abc", "qwerty", "password", "admin", "login", "asdf"];
    for (const seq of commonSequences) {
      if (pw.toLowerCase().includes(seq)) {
        weaknesses.push(`Mengandung pola atau kata umum yang mudah ditebak ("${seq}").`);
        break;
      }
    }

    // Score calculation (0 to 100)
    let score = Math.min(100, Math.round((entropyBits / 80) * 100));
    if (weaknesses.length > 2) score = Math.min(score, 40);
    if (len < 8) score = Math.min(score, 25);

    let strengthTier: "VERY_WEAK" | "WEAK" | "MODERATE" | "STRONG" | "VERY_STRONG" = "MODERATE";
    if (score < 25) strengthTier = "VERY_WEAK";
    else if (score < 50) strengthTier = "WEAK";
    else if (score < 75) strengthTier = "MODERATE";
    else if (score < 90) strengthTier = "STRONG";
    else strengthTier = "VERY_STRONG";

    return NextResponse.json({
      success: true,
      length: len,
      entropyBits,
      poolSize,
      score,
      strengthTier,
      hasLowercase: hasLower,
      hasUppercase: hasUpper,
      hasDigits,
      hasSymbols,
      weaknesses,
      crackTimeEstimates: {
        onlineThrottled: formatDuration(onlineTimeSec),
        singleCpu: formatDuration(cpuTimeSec),
        gpuClusterRtx4090: formatDuration(gpuTimeSec),
      },
      recommendation:
        score >= 80
          ? "Sangat Baik: Kata sandi memiliki entropi tinggi dan tahan terhadap serangan brute force berbasis klaster GPU modern."
          : score >= 50
          ? "Cukup: Tambahkan kombinasi simbol, angka, dan perpanjang hingga minimal 14 karakter untuk ketahanan maksimal."
          : "Lemah / Rentan: Kata sandi berisiko tinggi dapat dipecahkan dalam hitungan detik oleh penyerang siber.",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Gagal menganalisis entropi kata sandi: " + err.message }, { status: 500 });
  }
}
