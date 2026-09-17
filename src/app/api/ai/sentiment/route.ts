import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SentimentSchema = z.object({
  text: z.string().min(5, "Teks minimal 5 karakter."),
});

// Lexicon for Indonesian and English sentiment scoring
const POSITIVE_WORDS = new Set([
  // Indonesian
  "bagus", "baik", "aman", "sukses", "hebat", "unggul", "terpercaya", "senang", "positif",
  "menang", "terbaik", "pantas", "bersih", "damai", "membantu", "stabil", "terbukti", "resmi",
  // English
  "good", "great", "excellent", "safe", "secure", "success", "successful", "positive", "helpful",
  "trusted", "reliable", "authentic", "stable", "verified", "award", "win", "happy", "clean",
]);

const NEGATIVE_WORDS = new Set([
  // Indonesian
  "buruk", "rusak", "bahaya", "ancaman", "serangan", "bocor", "ilegal", "palsu", "jahat",
  "penipuan", "gagal", "rugi", "lemah", "rentan", "terinfeksi", "malware", "phishing", "doxxing",
  // English
  "bad", "terrible", "danger", "dangerous", "threat", "attack", "breach", "leak", "illegal",
  "fake", "scam", "fraud", "failed", "vulnerable", "exploit", "infected", "malicious", "phishing",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SentimentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const words = parsed.data.text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    let posCount = 0;
    let negCount = 0;
    const matchedPositive: string[] = [];
    const matchedNegative: string[] = [];

    for (const w of words) {
      if (POSITIVE_WORDS.has(w)) {
        posCount++;
        matchedPositive.push(w);
      }
      if (NEGATIVE_WORDS.has(w)) {
        negCount++;
        matchedNegative.push(w);
      }
    }

    const totalMatches = posCount + negCount;
    let sentiment: "POSITIF" | "NETRAL" | "NEGATIF" = "NETRAL";
    let compoundScore = 0;

    if (totalMatches > 0) {
      compoundScore = (posCount - negCount) / totalMatches;
      if (compoundScore > 0.15) sentiment = "POSITIF";
      else if (compoundScore < -0.15) sentiment = "NEGATIF";
      else sentiment = "NETRAL";
    }

    const confidenceScore = totalMatches > 0 ? Math.min(0.95, 0.6 + totalMatches * 0.05) : 0.5;

    return NextResponse.json({
      success: true,
      provider: "Nexus Dual-Language Sentiment Lexicon Engine",
      sentiment,
      compoundScore: parseFloat(compoundScore.toFixed(2)),
      confidenceScore: parseFloat(confidenceScore.toFixed(2)),
      details: {
        positiveWordsCount: posCount,
        negativeWordsCount: negCount,
        matchedPositive: Array.from(new Set(matchedPositive)),
        matchedNegative: Array.from(new Set(matchedNegative)),
        totalWordsAnalyzed: words.length,
      },
      ethicsNotice:
        "Hasil analisis sentimen ini bersifat probabilistik linguistik dan tidak boleh digunakan untuk keputusan otomatis berisiko tinggi tanpa verifikasi analis manusia.",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal menganalisis sentimen: " + err.message },
      { status: 500 }
    );
  }
}
