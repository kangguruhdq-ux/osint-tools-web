import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";
import tls from "tls";
import { z } from "zod";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const DomainSchema = z.object({
  domain: z.string().min(3, "Format domain tidak valid."),
});

async function resolveDoh(domain: string, type: string): Promise<any[]> {
  try {
    const res = await fetch(`https://1.1.1.1/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.Answer) && data.Answer.length > 0) {
        if (type === "MX") {
          return data.Answer.map((a: any) => {
            const parts = (a.data || "").split(" ");
            return {
              priority: parseInt(parts[0], 10) || 10,
              exchange: (parts[1] || parts[0] || "").replace(/\.$/, ""),
            };
          });
        }
        return data.Answer.map((a: any) =>
          typeof a.data === "string" ? a.data.replace(/\.$/, "") : a.data
        );
      }
    }
  } catch {}
  return [];
}

function getCertificateDetails(hostname: string, port = 443, timeoutMs = 5000): Promise<any> {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(
        {
          host: hostname,
          port,
          servername: hostname,
          rejectUnauthorized: false, // passive inspection
          timeout: timeoutMs,
        },
        () => {
          const cert = socket.getPeerCertificate();
          socket.destroy();
          if (!cert || Object.keys(cert).length === 0) {
            resolve({ error: "Sertifikat TLS tidak ditemukan" });
            return;
          }
          resolve({
            subject: cert.subject,
            issuer: cert.issuer,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            serialNumber: cert.serialNumber,
            fingerprint256: cert.fingerprint256,
            sans: cert.subjectaltname,
          });
        }
      );

      socket.on("timeout", () => {
        socket.destroy();
        resolve({ error: "Koneksi TLS timeout" });
      });

      socket.on("error", (e) => {
        socket.destroy();
        resolve({ error: e.message });
      });
    } catch (e: any) {
      resolve({ error: e.message });
    }
  });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = DomainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let domain = parsed.data.domain.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];

    const ssrfCheck = await validateUrlSafe(`http://${domain}`);
    if (!ssrfCheck.safe) {
      return NextResponse.json(
        { success: false, error: ssrfCheck.error },
        { status: 403 }
      );
    }

    // Parallel execution: DNS records, TLS cert
    const [aRecords, mxRecords, nsRecords, txtRecords, certDetails] = await Promise.allSettled([
      dns.resolve4(domain).catch(async () => {
        return await resolveDoh(domain, "A");
      }),
      dns.resolveMx(domain).catch(async () => {
        return await resolveDoh(domain, "MX");
      }),
      dns.resolveNs(domain).catch(async () => {
        return await resolveDoh(domain, "NS");
      }),
      dns.resolveTxt(domain).catch(() => []),
      getCertificateDetails(domain),
    ]);

    let resolvedA = aRecords.status === "fulfilled" ? aRecords.value : [];
    if (resolvedA.length === 0) {
      resolvedA = await resolveDoh(domain, "A");
    }

    let resolvedMx = mxRecords.status === "fulfilled" ? mxRecords.value : [];
    if (resolvedMx.length === 0) {
      resolvedMx = await resolveDoh(domain, "MX");
    }

    let resolvedNs = nsRecords.status === "fulfilled" ? nsRecords.value : [];
    if (resolvedNs.length === 0) {
      resolvedNs = await resolveDoh(domain, "NS");
    }

    const resolvedTxt = txtRecords.status === "fulfilled" ? txtRecords.value : [];
    const tlsCert = certDetails.status === "fulfilled" ? certDetails.value : {};

    // Get ASN / Country from first resolved IP
    let ipIntelligence = null;
    if (resolvedA.length > 0) {
      try {
        const ipRes = await fetch(
          `http://ip-api.com/json/${resolvedA[0]}?fields=country,countryCode,isp,org,as`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (ipRes.ok) {
          ipIntelligence = await ipRes.json();
        }
      } catch {
        // fallback
      }
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: "Nexus Multi-Source Domain Intelligence Engine",
      domain,
      ipAddresses: resolvedA,
      nameServers: resolvedNs,
      mailServers: resolvedMx,
      txtRecords: resolvedTxt,
      sslCertificate: tlsCert,
      asnIntelligence: ipIntelligence,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses intelijen domain: " + err.message },
      { status: 500 }
    );
  }
}
