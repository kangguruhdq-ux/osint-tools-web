import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const IocSchema = z.object({
  text: z.string().min(3, "Teks input terlalu pendek."),
});

function deobfuscate(text: string): string {
  return text
    .replace(/hxxp/gi, "http")
    .replace(/\[\.\]/g, ".")
    .replace(/\(\.\)/g, ".")
    .replace(/\[:\]/g, ":")
    .replace(/\s*\[dot\]\s*/gi, ".")
    .replace(/\s*\[at\]\s*/gi, "@");
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = IocSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const rawText = parsed.data.text;
    const cleanText = deobfuscate(rawText);

    // Regex patterns for IOC extraction
    const ipv4Regex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
    const urlRegex = /\bhttps?:\/\/[a-zA-Z0-9.-]+(?::[0-9]+)?(?:\/[^\s"']*)?/gi;
    const md5Regex = /\b[a-fA-F0-9]{32}\b/g;
    const sha1Regex = /\b[a-fA-F0-9]{40}\b/g;
    const sha256Regex = /\b[a-fA-F0-9]{64}\b/g;
    const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
    const cveRegex = /\bCVE-\d{4}-\d{4,7}\b/gi;
    const domainRegex = /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|net|org|io|xyz|info|biz|top|id|edu|gov|co|ru|cn|uk|de)\b/gi;

    const ips = Array.from(new Set(cleanText.match(ipv4Regex) || []));
    const urls = Array.from(new Set(cleanText.match(urlRegex) || []));
    const emails = Array.from(new Set(cleanText.match(emailRegex) || []));
    const cves = Array.from(new Set(cleanText.match(cveRegex) || [])).map((c) => c.toUpperCase());
    const md5s = Array.from(new Set(cleanText.match(md5Regex) || []));
    const sha1s = Array.from(new Set(cleanText.match(sha1Regex) || []));
    const sha256s = Array.from(new Set(cleanText.match(sha256Regex) || []));

    // Filter domains so they don't duplicate full URLs
    const rawDomains = Array.from(new Set(cleanText.match(domainRegex) || []));
    const domains = rawDomains.filter((d) => !ips.includes(d) && !emails.some((e) => e.endsWith(d)));

    const totalCount =
      ips.length + urls.length + domains.length + md5s.length + sha1s.length + sha256s.length + emails.length + cves.length;

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: "Nexus Cyber Threat Intelligence IOC Engine",
      totalIndicators: totalCount,
      indicators: {
        ipAddresses: ips,
        domains,
        urls,
        emails,
        cveIdentifiers: cves,
        hashes: {
          md5: md5s,
          sha1: sha1s,
          sha256: sha256s,
        },
      },
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal mengekstrak IOC: " + err.message },
      { status: 500 }
    );
  }
}
