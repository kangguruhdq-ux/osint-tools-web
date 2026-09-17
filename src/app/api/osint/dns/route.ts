import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";
import { z } from "zod";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";
import { memoryDb } from "@/lib/db";

const DnsSchema = z.object({
  domain: z.string().min(3, "Nama domain tidak valid."),
  recordType: z
    .enum(["ALL", "A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "CAA", "PTR"])
    .default("ALL"),
});

async function resolveDoh(domain: string, type: string): Promise<any[] | null> {
  const endpoints = [
    `https://1.1.1.1/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
    `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: { Accept: "application/dns-json" },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.Answer && Array.isArray(data.Answer) && data.Answer.length > 0) {
        if (type === "MX") {
          return data.Answer.map((a: any) => {
            const parts = (a.data || "").split(" ");
            return {
              priority: parseInt(parts[0], 10) || 10,
              exchange: (parts[1] || parts[0] || "").replace(/\.$/, ""),
            };
          });
        }
        if (type === "SOA") {
          const parts = (data.Answer[0].data || "").split(" ");
          return [{
            nsname: (parts[0] || "").replace(/\.$/, ""),
            hostmaster: (parts[1] || "").replace(/\.$/, ""),
            serial: parseInt(parts[2], 10) || 0,
            refresh: parseInt(parts[3], 10) || 0,
            retry: parseInt(parts[4], 10) || 0,
            expire: parseInt(parts[5], 10) || 0,
            minttl: parseInt(parts[6], 10) || 0,
          }];
        }
        return data.Answer.map((a: any) =>
          typeof a.data === "string" ? a.data.replace(/\.$/, "") : a.data
        );
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = DnsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let rawDomain = parsed.data.domain.trim().toLowerCase();
    // Clean protocol, path, port, or query if user pasted a URL
    rawDomain = rawDomain.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0].split("?")[0].trim();

    // SSRF Check
    const ssrfCheck = await validateUrlSafe(`http://${rawDomain}`);
    if (!ssrfCheck.safe) {
      return NextResponse.json(
        { success: false, error: ssrfCheck.error },
        { status: 400 }
      );
    }

    const { recordType } = parsed.data;
    const records: Record<string, any> = {};

    const queryA = async () => {
      try {
        const res = await dns.resolve4(rawDomain);
        if (res && res.length > 0) {
          records.A = res;
          return;
        }
      } catch {}
      const doh = await resolveDoh(rawDomain, "A");
      records.A = doh && doh.length > 0 ? doh : { error: "NO_RECORD" };
    };

    const queryAAAA = async () => {
      try {
        const res = await dns.resolve6(rawDomain);
        if (res && res.length > 0) {
          records.AAAA = res;
          return;
        }
      } catch {}
      const doh = await resolveDoh(rawDomain, "AAAA");
      records.AAAA = doh && doh.length > 0 ? doh : { error: "NO_RECORD" };
    };

    const queryMX = async () => {
      try {
        const res = await dns.resolveMx(rawDomain);
        if (res && res.length > 0) {
          records.MX = res;
          return;
        }
      } catch {}
      const doh = await resolveDoh(rawDomain, "MX");
      records.MX = doh && doh.length > 0 ? doh : { error: "NO_RECORD" };
    };

    const queryTXT = async () => {
      try {
        const res = await dns.resolveTxt(rawDomain);
        if (res && res.length > 0) {
          records.TXT = res;
          return;
        }
      } catch {}
      const doh = await resolveDoh(rawDomain, "TXT");
      records.TXT = doh && doh.length > 0 ? doh.map(d => [d.replace(/^"|"$/g, "")]) : { error: "NO_RECORD" };
    };

    const queryNS = async () => {
      try {
        const res = await dns.resolveNs(rawDomain);
        if (res && res.length > 0) {
          records.NS = res;
          return;
        }
      } catch {}
      const doh = await resolveDoh(rawDomain, "NS");
      records.NS = doh && doh.length > 0 ? doh : { error: "NO_RECORD" };
    };

    const queryCNAME = async () => {
      try {
        const res = await dns.resolveCname(rawDomain);
        if (res && res.length > 0) {
          records.CNAME = res;
          return;
        }
      } catch {}
      const doh = await resolveDoh(rawDomain, "CNAME");
      records.CNAME = doh && doh.length > 0 ? doh : { error: "NO_RECORD" };
    };

    const querySOA = async () => {
      try {
        const res = await dns.resolveSoa(rawDomain);
        if (res) {
          records.SOA = res;
          return;
        }
      } catch {}
      const doh = await resolveDoh(rawDomain, "SOA");
      records.SOA = doh && doh.length > 0 ? doh[0] : { error: "NO_RECORD" };
    };

    const queryCAA = async () => {
      try {
        const res = await dns.resolveCaa(rawDomain);
        if (res && res.length > 0) {
          records.CAA = res;
          return;
        }
      } catch {}
      const doh = await resolveDoh(rawDomain, "CAA");
      records.CAA = doh && doh.length > 0 ? doh : { error: "NO_RECORD" };
    };

    if (recordType === "ALL") {
      await Promise.allSettled([
        queryA(),
        queryAAAA(),
        queryMX(),
        queryTXT(),
        queryNS(),
        queryCNAME(),
        querySOA(),
        queryCAA(),
      ]);
    } else {
      switch (recordType) {
        case "A":
          await queryA();
          break;
        case "AAAA":
          await queryAAAA();
          break;
        case "MX":
          await queryMX();
          break;
        case "TXT":
          await queryTXT();
          break;
        case "NS":
          await queryNS();
          break;
        case "CNAME":
          await queryCNAME();
          break;
        case "SOA":
          await querySOA();
          break;
        case "CAA":
          await queryCAA();
          break;
        case "PTR":
          try {
            records.PTR = await dns.reverse(rawDomain);
          } catch (e: any) {
            records.PTR = { error: e.code || "NO_PTR" };
          }
          break;
      }
    }

    const latencyMs = Date.now() - startTime;

    // Log to memory audit
    memoryDb.auditLogs.unshift({
      id: "aud-" + Date.now(),
      action: "DNS_LOOKUP",
      resourceType: "TOOL",
      details: { domain: rawDomain, recordType, latencyMs },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      provider: "Node.js Native DNS Resolver",
      domain: rawDomain,
      recordType,
      records,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal melakukan resolusi DNS: " + err.message },
      { status: 500 }
    );
  }
}
