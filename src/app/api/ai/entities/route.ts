import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const EntitySchema = z.object({
  text: z.string().min(10, "Teks minimal 10 karakter."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = EntitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { text } = parsed.data;

    // Pattern recognizers for legal public entities
    const orgPattern = /\b(?:PT|CV|Inc|Ltd|Corp|GmbH|Google|Microsoft|Apple|Cloudflare|Amazon|Meta|Twitter|Telegram|Cisco|IBM|OpenAI|GitHub)\b(?:\s+[A-Z][a-zA-Z0-9]+)*/g;
    const locationPattern = /\b(?:Indonesia|Jakarta|Bandung|Surabaya|Singapore|Malaysia|United States|London|Tokyo|Berlin|Australia|Europe|Asia|California)\b/g;
    const datePattern = /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}-\d{2}-\d{2}|(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi;
    const techPattern = /\b(?:Linux|Windows|Docker|Kubernetes|Next\.js|React|Vue|Python|TypeScript|Node\.js|PostgreSQL|MySQL|Redis|Nginx|Apache|Cloudflare|GraphQL|REST\s+API)\b/gi;
    const domainPattern = /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|net|org|io|id|gov|edu|xyz|co)\b/gi;
    const protocolPattern = /\b(?:DNS|WHOIS|TLS|SSL|HTTP|HTTPS|SSH|FTP|BGP|ASN|IPv4|IPv6|TCP|UDP)\b/g;

    const orgs = Array.from(new Set(text.match(orgPattern) || []));
    const locations = Array.from(new Set(text.match(locationPattern) || []));
    const dates = Array.from(new Set(text.match(datePattern) || []));
    const techs = Array.from(new Set(text.match(techPattern) || []));
    const domains = Array.from(new Set(text.match(domainPattern) || []));
    const protocols = Array.from(new Set(text.match(protocolPattern) || []));

    const totalEntities =
      orgs.length + locations.length + dates.length + techs.length + domains.length + protocols.length;

    return NextResponse.json({
      success: true,
      provider: "Nexus Legal Public NER Engine",
      totalEntities,
      entities: {
        organizations: orgs,
        locations,
        dates,
        technologies: techs,
        domains,
        technicalTerms: protocols,
      },
      privacyCompliance:
        "Sistem tidak mengekstrak atau mengidentifikasi data pribadi terproteksi (nama lengkap personal privat, KTP, alamat rumah, atau nomor privat).",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal mengekstrak entitas: " + err.message },
      { status: 500 }
    );
  }
}
