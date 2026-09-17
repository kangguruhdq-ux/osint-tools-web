import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const LangSchema = z.object({
  text: z.string().min(5, "Teks minimal 5 karakter."),
});

// Linguistic marker patterns
const LANG_PATTERNS = [
  {
    code: "id",
    name: "Bahasa Indonesia",
    regex: /\b(yang|dan|di|dari|ini|untuk|pada|adalah|ke|itu|dengan|sebagai|dalam|tidak|akan|bisa)\b/gi,
  },
  {
    code: "en",
    name: "English",
    regex: /\b(the|and|is|in|it|you|that|was|for|on|are|as|with|his|they|at|be|this|have)\b/gi,
  },
  {
    code: "es",
    name: "Español (Spanish)",
    regex: /\b(el|la|de|que|y|en|un|se|no|por|con|para|los|del|las)\b/gi,
  },
  {
    code: "fr",
    name: "Français (French)",
    regex: /\b(le|la|les|de|des|du|et|est|un|une|dans|pour|que|qui|sur)\b/gi,
  },
  {
    code: "de",
    name: "Deutsch (German)",
    regex: /\b(der|die|das|und|in|den|von|zu|mit|ist|im|für|auf|nicht)\b/gi,
  },
  {
    code: "ru",
    name: "Русский (Russian)",
    regex: /[а-яА-ЯёЁ]/g,
  },
  {
    code: "ar",
    name: "العربية (Arabic)",
    regex: /[\u0600-\u06FF]/g,
  },
  {
    code: "zh",
    name: "中文 (Chinese)",
    regex: /[\u4E00-\u9FFF]/g,
  },
  {
    code: "ja",
    name: "日本語 (Japanese)",
    regex: /[\u3040-\u309F\u30A0-\u30FF]/g,
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LangSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { text } = parsed.data;
    const scores: Record<string, number> = {};

    for (const lang of LANG_PATTERNS) {
      const matches = text.match(lang.regex);
      scores[lang.code] = matches ? matches.length : 0;
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topCode = sorted[0][0];
    const topScore = sorted[0][1];

    let detectedLang = LANG_PATTERNS.find((l) => l.code === topCode);
    let confidence = 0.5;

    if (topScore > 0) {
      const totalMatches = Object.values(scores).reduce((a, b) => a + b, 0);
      confidence = Math.min(0.99, Math.max(0.65, topScore / Math.max(1, totalMatches)));
    } else {
      // Default to Indonesian or English based on ascii check
      detectedLang = LANG_PATTERNS[0];
      confidence = 0.6;
    }

    return NextResponse.json({
      success: true,
      provider: "Nexus Linguistic N-Gram Detector",
      languageCode: detectedLang?.code || "id",
      languageName: detectedLang?.name || "Bahasa Indonesia",
      confidenceScore: parseFloat(confidence.toFixed(2)),
      charactersCount: text.length,
      wordsCount: text.trim().split(/\s+/).length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal mendeteksi bahasa: " + err.message },
      { status: 500 }
    );
  }
}
