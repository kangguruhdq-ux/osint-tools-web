import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const KeywordSchema = z.object({
  text: z.string().min(20, "Teks minimal 20 karakter."),
  maxKeywords: z.number().default(15),
});

const STOPWORDS = new Set([
  // Indonesian
  "yang", "di", "dan", "dari", "ini", "untuk", "pada", "adalah", "ke", "itu", "dengan",
  "sebagai", "dalam", "bisa", "akan", "oleh", "juga", "atau", "tidak", "mereka", "kita",
  "dapat", "sudah", "saya", "kami", "anda", "karena", "tersebut", "ada", "lebih", "secara",
  // English
  "the", "and", "is", "in", "it", "you", "that", "he", "was", "for", "on", "are", "as",
  "with", "his", "they", "at", "be", "this", "have", "from", "or", "one", "had", "by",
  "word", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "there",
]);

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = KeywordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { text, maxKeywords } = parsed.data;

    // Clean text and tokenize
    const cleanTokens = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w));

    const freq: Record<string, number> = {};
    for (const token of cleanTokens) {
      freq[token] = (freq[token] || 0) + 1;
    }

    // Sort by frequency and length weight
    const sortedKeywords = Object.entries(freq)
      .map(([word, count]) => {
        // TF-IDF style weighting
        const score = count * (1 + Math.log(word.length));
        return {
          keyword: word,
          frequency: count,
          relevanceScore: parseFloat(score.toFixed(2)),
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxKeywords);

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: "Nexus Statistical Keyword & TF Engine",
      totalTokensAnalyzed: cleanTokens.length,
      uniqueKeywords: Object.keys(freq).length,
      keywords: sortedKeywords,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal mengekstrak keyword: " + err.message },
      { status: 500 }
    );
  }
}
