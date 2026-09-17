import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { providerRegistry } from "@/lib/providers/registry";

const SummarizeSchema = z.object({
  text: z.string().min(50, "Teks minimal 50 karakter untuk dapat diringkas."),
  length: z.enum(["short", "medium", "detailed"]).default("medium"),
});

// High performance extractive summarizer algorithm
function extractiveSummarize(text: string, length: "short" | "medium" | "detailed") {
  // Split into sentences
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  if (sentences.length <= 3) {
    return {
      summary: sentences.join(" "),
      bulletPoints: sentences,
      method: "Extractive NLP Native",
    };
  }

  // Calculate word frequency
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  // Score sentences
  const scored = sentences.map((sentence, index) => {
    const sWords = sentence.toLowerCase().split(/\s+/);
    let score = 0;
    for (const w of sWords) {
      if (freq[w]) score += freq[w];
    }
    // Boost early sentences slightly
    if (index === 0) score *= 1.4;
    return { sentence, score, index };
  });

  // Select top N sentences based on requested length
  const targetCount =
    length === "short" ? Math.max(2, Math.min(3, Math.ceil(sentences.length * 0.25))) :
    length === "medium" ? Math.max(3, Math.min(5, Math.ceil(sentences.length * 0.45))) :
    Math.max(4, Math.min(8, Math.ceil(sentences.length * 0.65)));

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, targetCount)
    .sort((a, b) => a.index - b.index); // restore original order

  return {
    summary: top.map((t) => t.sentence).join(" "),
    bulletPoints: top.map((t) => t.sentence),
    method: "Extractive NLP Native",
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = SummarizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { text, length } = parsed.data;
    const wordCount = text.trim().split(/\s+/).length;
    const tokenEstimate = Math.ceil(wordCount * 1.3);

    // Check if OpenAI key is configured
    const openAiKey = await providerRegistry.getDecryptedApiKey("openai");

    if (openAiKey) {
      try {
        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "Anda adalah asisten intelijen OSINT. Ringkas teks pengguna secara faktual, padat, dan objektif dalam bahasa yang sama dengan input.",
              },
              {
                role: "user",
                content: `Buatkan ringkasan dengan level '${length}':\n\n${text}`,
              },
            ],
            temperature: 0.3,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const aiSummary = aiData.choices?.[0]?.message?.content;
          return NextResponse.json({
            success: true,
            provider: "OpenAI GPT-4o-mini Adapter",
            summary: aiSummary,
            originalWordCount: wordCount,
            estimatedTokens: tokenEstimate,
            latencyMs: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          });
        }
      } catch {
        // Fallback to native NLP engine
      }
    }

    // Native Extractive NLP Engine
    const result = extractiveSummarize(text, length);
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: "Nexus Native Extractive NLP Engine",
      summary: result.summary,
      bulletPoints: result.bulletPoints,
      originalWordCount: wordCount,
      estimatedTokens: tokenEstimate,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal meringkas teks: " + err.message },
      { status: 500 }
    );
  }
}
