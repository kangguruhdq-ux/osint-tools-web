import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const CtLogSchema = z.object({
  domain: z.string().min(3, "Nama domain tidak valid."),
});

interface CertLogEntry {
  id: number;
  issuerName: string;
  commonName: string;
  nameValue: string;
  entryTimestamp: string;
  notBefore: string;
  notAfter: string;
  serialNumber: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CtLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const rawDomain = parsed.data.domain
      .trim()
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .split(":")[0]
      .toLowerCase();

    // SSRF Guard
    const ssrf = await validateUrlSafe(`https://${rawDomain}`);
    if (!ssrf.safe) {
      return NextResponse.json({ success: false, error: ssrf.error || "Pencarian domain ditolak oleh SSRF Guard." }, { status: 403 });
    }

    // Query crt.sh API for wildcard & subdomains
    const crtUrl = `https://crt.sh/?q=%.${encodeURIComponent(rawDomain)}&output=json`;

    let data: any[] = [];
    try {
      const res = await fetch(crtUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NexusCtLogExplorer/1.0",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        data = await res.json();
      }
    } catch (e: any) {
      // crt.sh can sometimes be busy or rate-limit; handle gracefully
    }

    if (!Array.isArray(data) || data.length === 0) {
      // Fallback query exact match
      try {
        const res2 = await fetch(`https://crt.sh/?q=${encodeURIComponent(rawDomain)}&output=json`, {
          headers: { "User-Agent": "NexusCtLogExplorer/1.0" },
          signal: AbortSignal.timeout(8000),
        });
        if (res2.ok) {
          data = await res2.json();
        }
      } catch {}
    }

    if (!Array.isArray(data)) {
      data = [];
    }

    // Deduplicate discovered subdomains
    const subdomainsSet = new Set<string>();
    const certsList: any[] = [];

    const now = Date.now();

    for (const item of data) {
      const names = String(item.name_value || "").split("\n");
      for (const n of names) {
        const cleanName = n.trim().toLowerCase().replace(/^\*\./, "");
        if (cleanName && cleanName.includes(rawDomain)) {
          subdomainsSet.add(cleanName);
        }
      }

      if (certsList.length < 30) {
        const notAfterDate = new Date(item.not_after);
        const isExpired = !isNaN(notAfterDate.getTime()) && notAfterDate.getTime() < now;

        certsList.push({
          id: item.id || item.min_cert_id,
          issuer: item.issuer_name || "Unknown CA",
          commonName: item.common_name,
          names: names.slice(0, 5),
          loggedAt: item.entry_timestamp,
          validFrom: item.not_before,
          validTo: item.not_after,
          isExpired,
          serialNumber: item.serial_number,
        });
      }
    }

    const uniqueSubdomains = Array.from(subdomainsSet).sort();

    return NextResponse.json({
      success: true,
      domain: rawDomain,
      totalCertificatesFound: data.length,
      totalUniqueSubdomains: uniqueSubdomains.length,
      discoveredSubdomains: uniqueSubdomains.slice(0, 100),
      recentCertificates: certsList,
      source: "Public Certificate Transparency (CT) Logs (crt.sh / Sectigo)",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Gagal menelusuri log Certificate Transparency: " + err.message }, { status: 500 });
  }
}
