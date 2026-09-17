import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dns from "dns";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const PropagationSchema = z.object({
  domain: z.string().min(2, "Nama domain wajib diisi."),
  recordType: z.enum(["A", "AAAA", "MX", "TXT", "NS", "CNAME"]).default("A"),
});

interface ResolverNode {
  name: string;
  ip: string;
  location: string;
  flag: string;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = PropagationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let domain = parsed.data.domain.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
    const recordType = parsed.data.recordType;

    const ssrf = await validateUrlSafe(`https://${domain}`);
    if (!ssrf.safe) {
      return NextResponse.json({ success: false, error: ssrf.error }, { status: 403 });
    }

    const resolvers: ResolverNode[] = [
      { name: "Google Public DNS", ip: "8.8.8.8", location: "Global / US", flag: "US" },
      { name: "Cloudflare 1.1.1.1", ip: "1.1.1.1", location: "Global Anycast", flag: "GL" },
      { name: "Quad9 Security", ip: "9.9.9.9", location: "Zurich, Swiss", flag: "CH" },
      { name: "Cisco OpenDNS", ip: "208.67.222.222", location: "San Francisco, US", flag: "US" },
      { name: "AdGuard DNS", ip: "94.140.14.14", location: "Frankfurt, Jerman", flag: "DE" },
      { name: "Alibaba AliDNS", ip: "223.5.5.5", location: "Hangzhou, Asia", flag: "CN" },
      { name: "Lumen Level3", ip: "4.2.2.1", location: "Colorado, US", flag: "US" },
      { name: "Control D", ip: "76.76.2.0", location: "Toronto, Kanada", flag: "CA" },
    ];

    const results = await Promise.allSettled(
      resolvers.map(async (r) => {
        const nodeStart = Date.now();
        const resolver = new dns.promises.Resolver({ timeout: 4000, tries: 1 });
        resolver.setServers([r.ip]);

        try {
          let records: any[] = [];
          if (recordType === "A") records = await resolver.resolve4(domain);
          else if (recordType === "AAAA") records = await resolver.resolve6(domain);
          else if (recordType === "MX") records = (await resolver.resolveMx(domain)).map((m) => `${m.exchange} (${m.priority})`);
          else if (recordType === "TXT") records = (await resolver.resolveTxt(domain)).map((t) => t.join(" "));
          else if (recordType === "NS") records = await resolver.resolveNs(domain);
          else if (recordType === "CNAME") records = await resolver.resolveCname(domain);

          const latency = Date.now() - nodeStart;
          return {
            name: r.name,
            ip: r.ip,
            location: r.location,
            flag: r.flag,
            status: "RESOLVED",
            latencyMs: latency,
            records,
          };
        } catch (err: any) {
          return {
            name: r.name,
            ip: r.ip,
            location: r.location,
            flag: r.flag,
            status: "ERROR",
            latencyMs: Date.now() - nodeStart,
            error: err.code || err.message,
            records: [],
          };
        }
      })
    );

    const nodes = results.map((res, i) =>
      res.status === "fulfilled"
        ? res.value
        : {
            name: resolvers[i].name,
            ip: resolvers[i].ip,
            location: resolvers[i].location,
            flag: resolvers[i].flag,
            status: "TIMEOUT",
            latencyMs: 4000,
            records: [],
          }
    );

    const resolvedNodes = nodes.filter((n) => n.status === "RESOLVED");
    const consistencyPct = Math.round((resolvedNodes.length / resolvers.length) * 100);

    return NextResponse.json({
      success: true,
      provider: "Global Anycast Multi-Resolver Comparator",
      domain,
      recordType,
      consistencyPercentage: consistencyPct,
      totalResolvers: resolvers.length,
      resolvedCount: resolvedNodes.length,
      nodes,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal membandingkan propagasi DNS: " + err.message },
      { status: 500 }
    );
  }
}
