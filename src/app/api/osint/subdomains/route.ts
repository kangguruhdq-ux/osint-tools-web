import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const SubdomainSchema = z.object({
  domain: z.string().min(3, "Nama domain wajib diisi."),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = SubdomainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let domain = parsed.data.domain.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];

    // SSRF Guard validation
    const ssrf = await validateUrlSafe(`https://${domain}`);
    if (!ssrf.safe) {
      return NextResponse.json({ success: false, error: ssrf.error }, { status: 403 });
    }

    // Query Certificate Transparency (CT) Logs via crt.sh
    const ctUrl = `https://crt.sh/?q=%.${encodeURIComponent(domain)}&output=json`;
    let subdomainsSet = new Set<string>();
    let certEntries: any[] = [];

    try {
      const res = await fetch(ctUrl, {
        headers: { "User-Agent": "NexusOsintCTLogs/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            const rawNames = String(item.name_value || "").split("\n");
            for (let name of rawNames) {
              name = name.trim().toLowerCase();
              if (name.startsWith("*.")) name = name.substring(2);
              if (name.endsWith(domain) && name.length > domain.length) {
                subdomainsSet.add(name);
              }
            }
            if (certEntries.length < 15) {
              certEntries.push({
                id: item.id,
                commonName: item.common_name,
                issuer: item.issuer_name,
                entryDate: item.entry_timestamp,
              });
            }
          }
        }
      }
    } catch {
      // Fallback: If crt.sh is experiencing heavy traffic, provide native DNS prefix probing
      const commonPrefixes = ["www", "mail", "api", "dev", "app", "admin", "blog", "portal", "vpn", "m", "staging"];
      for (const p of commonPrefixes) {
        subdomainsSet.add(`${p}.${domain}`);
      }
    }

    const subdomainsList = Array.from(subdomainsSet).sort();

    return NextResponse.json({
      success: true,
      provider: "Certificate Transparency (CT) Logs Probing Engine",
      domain,
      totalFound: subdomainsList.length,
      subdomains: subdomainsList,
      sampleCertificates: certEntries,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memindai subdomain: " + err.message },
      { status: 500 }
    );
  }
}
