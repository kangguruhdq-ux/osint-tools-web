import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SocialSearchSchema = z.object({
  query: z.string().min(2, "Kata kunci pencarian minimal 2 karakter."),
  platform: z.enum(["all", "reddit", "mastodon", "github", "wikipedia", "hackernews"]).default("all"),
  page: z.number().default(1),
});

function analyzeSentiment(text: string): "POSITIF" | "NETRAL" | "KRITIS" {
  const lower = text.toLowerCase();
  const posKeywords = [
    "good", "great", "excellent", "awesome", "fix", "secure", "safe", "love", "update",
    "success", "bagus", "sukses", "aman", "terbaik", "keberhasilan", "positif", "solusi",
    "optimal", "legal", "verified", "reliable"
  ];
  const negKeywords = [
    "vuln", "vulnerability", "leak", "breach", "hack", "scam", "malware", "phishing",
    "threat", "attack", "bocor", "bobol", "bahaya", "ancaman", "rusak", "penipuan",
    "korban", "hoax", "kritis", "incident", "cve", "exploit", "fake", "warning"
  ];

  let posCount = 0;
  let negCount = 0;

  for (const w of posKeywords) {
    if (lower.includes(w)) posCount++;
  }
  for (const w of negKeywords) {
    if (lower.includes(w)) negCount++;
  }

  if (negCount > posCount) return "KRITIS";
  if (posCount > negCount) return "POSITIF";
  return "NETRAL";
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = SocialSearchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { query, platform } = parsed.data;
    const results: any[] = [];

    // 1. Query Reddit Public Search
    const fetchReddit = async () => {
      if (platform !== "all" && platform !== "reddit") return;
      try {
        const res = await fetch(
          `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=5`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            },
            signal: AbortSignal.timeout(5000),
          }
        );
        if (res.ok) {
          const d = await res.json();
          for (const item of d.data?.children || []) {
            const p = item.data;
            const snippet = p.selftext
              ? p.selftext.substring(0, 220)
              : `Subreddit: r/${p.subreddit} • Skor: ${p.score} • Diskusi: ${p.num_comments}`;
            results.push({
              platform: "Reddit",
              title: p.title,
              snippet,
              url: `https://www.reddit.com${p.permalink}`,
              author: `u/${p.author}`,
              score: p.score,
              comments: p.num_comments,
              publishedAt: new Date(p.created_utc * 1000).toISOString(),
              sentiment: analyzeSentiment(p.title + " " + (p.selftext || "")),
            });
          }
        }
      } catch {}
    };

    // 2. Query Mastodon / Fediverse Public Search API
    const fetchMastodon = async () => {
      if (platform !== "all" && platform !== "mastodon") return;
      try {
        const res = await fetch(
          `https://mastodon.social/api/v2/search?q=${encodeURIComponent(query)}&type=statuses&limit=5`,
          {
            headers: {
              "User-Agent": "NexusOSINT/1.0 (OpenFediverseResearch)",
              Accept: "application/json",
            },
            signal: AbortSignal.timeout(5000),
          }
        );
        if (res.ok) {
          const d = await res.json();
          for (const item of d.statuses || []) {
            const cleanSnippet = (item.content || "")
              .replace(/<[^>]*>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .substring(0, 220);
            results.push({
              platform: "Mastodon",
              title: cleanSnippet.substring(0, 75) + "...",
              snippet: cleanSnippet,
              url: item.url,
              author: `@${item.account?.acct || item.account?.username}`,
              reblogs: item.reblogs_count,
              favourites: item.favourites_count,
              publishedAt: item.created_at,
              sentiment: analyzeSentiment(cleanSnippet),
            });
          }
        }
      } catch {}
    };

    // 3. Query GitHub Public Search API
    const fetchGithub = async () => {
      if (platform !== "all" && platform !== "github") return;
      try {
        const ghRes = await fetch(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=5`,
          {
            headers: { "User-Agent": "NexusSocialSearch/1.0" },
            signal: AbortSignal.timeout(5000),
          }
        );
        if (ghRes.ok) {
          const d = await ghRes.json();
          for (const item of d.items || []) {
            results.push({
              platform: "GitHub",
              title: item.full_name,
              snippet: item.description || "Repositori kode terbuka publik tanpa ringkasan.",
              url: item.html_url,
              author: item.owner?.login,
              stars: item.stargazers_count,
              publishedAt: item.updated_at,
              sentiment: analyzeSentiment(item.full_name + " " + (item.description || "")),
            });
          }
        }
      } catch {}
    };

    // 4. Query HackerNews Public Search API
    const fetchHackerNews = async () => {
      if (platform !== "all" && platform !== "hackernews") return;
      try {
        const hnRes = await fetch(
          `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=5`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (hnRes.ok) {
          const d = await hnRes.json();
          for (const hit of d.hits || []) {
            results.push({
              platform: "HackerNews",
              title: hit.title,
              snippet: hit.story_text || `Points: ${hit.points || 0}, Komentar: ${hit.num_comments || 0}`,
              url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
              author: hit.author,
              publishedAt: hit.created_at,
              sentiment: analyzeSentiment(hit.title + " " + (hit.story_text || "")),
            });
          }
        }
      } catch {}
    };

    // 5. Query Wikipedia Public OpenSearch API
    const fetchWikipedia = async () => {
      if (platform !== "all" && platform !== "wikipedia") return;
      try {
        const wikiRes = await fetch(
          `https://id.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (wikiRes.ok) {
          const d = await wikiRes.json();
          const titles = d[1] || [];
          const snippets = d[2] || [];
          const urls = d[3] || [];
          for (let i = 0; i < titles.length; i++) {
            results.push({
              platform: "Wikipedia",
              title: titles[i],
              snippet: snippets[i] || titles[i],
              url: urls[i],
              publishedAt: new Date().toISOString(),
              sentiment: analyzeSentiment(titles[i] + " " + (snippets[i] || "")),
            });
          }
        }
      } catch {}
    };

    await Promise.allSettled([
      fetchReddit(),
      fetchMastodon(),
      fetchGithub(),
      fetchHackerNews(),
      fetchWikipedia(),
    ]);

    // Compute sentiment breakdown
    let positiveCount = 0;
    let neutralCount = 0;
    let criticalCount = 0;
    const platformBreakdown: Record<string, number> = {};

    for (const r of results) {
      if (r.sentiment === "POSITIF") positiveCount++;
      else if (r.sentiment === "KRITIS") criticalCount++;
      else neutralCount++;

      platformBreakdown[r.platform] = (platformBreakdown[r.platform] || 0) + 1;
    }

    const viralityScore = Math.min(
      98,
      Math.max(20, results.length * 14 + Object.keys(platformBreakdown).length * 10)
    );

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: "Nexus Multi-Network Social Intelligence Aggregator",
      query,
      totalResults: results.length,
      viralityScore,
      sentimentStats: {
        positif: positiveCount,
        netral: neutralCount,
        kritis: criticalCount,
      },
      platformBreakdown,
      results,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses pencarian sosial publik: " + err.message },
      { status: 500 }
    );
  }
}

