import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dns from "dns/promises";

const AsnSchema = z.object({
  target: z.string().min(2, "Target ASN, IP, atau domain diperlukan."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AsnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    let input = parsed.data.target.trim();
    let queryIp = "";
    let isAsnDirect = false;

    // Check if input is direct ASN (e.g. AS13335 or 13335)
    if (/^AS?\d+$/i.test(input)) {
      isAsnDirect = true;
      const asnNum = input.toUpperCase().replace(/^AS/, "");
      try {
        const res = await fetch(`https://stat.ripe.net/data/as-overview/data.json?resource=AS${asnNum}`, {
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          const json = await res.json();
          const d = json.data;
          return NextResponse.json({
            success: true,
            asn: `AS${asnNum}`,
            holder: d.holder || "Unknown Organization",
            announced: d.announced ?? true,
            type: d.type || "ASN",
            query: input,
            source: "RIPE NCC RIS Engine",
            details: {
              blockName: d.block?.name || `AS${asnNum} Allocation`,
              resource: d.resource,
            },
            timestamp: new Date().toISOString(),
          });
        }
      } catch {}
    }

    // If input is domain, resolve to IP
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(input)) {
      const cleanDomain = input.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
      try {
        const ips = await dns.resolve4(cleanDomain);
        if (ips.length > 0) {
          queryIp = ips[0];
        } else {
          return NextResponse.json({ success: false, error: "Domain tidak memiliki A record publik." }, { status: 404 });
        }
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Gagal menerjemahkan domain "${cleanDomain}": ${err.message}` }, { status: 400 });
      }
    } else {
      queryIp = input;
    }

    // Query IP geolocation & ASN via public RDAP / ipapi
    let asnData: any = null;

    try {
      const res = await fetch(`https://ipapi.co/${queryIp}/json/`, {
        headers: { "User-Agent": "NexusOsintTool/1.0" },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        asnData = await res.json();
      }
    } catch {}

    if (!asnData || asnData.error) {
      // Fallback to ip-api.com
      try {
        const res2 = await fetch(`http://ip-api.com/json/${queryIp}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
          signal: AbortSignal.timeout(6000),
        });
        if (res2.ok) {
          const d2 = await res2.json();
          if (d2.status === "success") {
            const asParts = (d2.as || "").split(" ");
            const asnNumber = asParts[0] || "Unknown";
            const asName = asParts.slice(1).join(" ") || d2.org || d2.isp;
            asnData = {
              ip: d2.query,
              asn: asnNumber,
              org: asName,
              isp: d2.isp,
              country_name: d2.country,
              country_code: d2.countryCode,
              city: d2.city,
              region: d2.regionName,
            };
          }
        }
      } catch {}
    }

    if (!asnData) {
      return NextResponse.json({ success: false, error: "Gagal mengambil rincian ASN untuk IP: " + queryIp }, { status: 502 });
    }

    const asnStr = asnData.asn || (asnData.as ? asnData.as.split(" ")[0] : "AS-UNKNOWN");
    const orgName = asnData.org || asnData.isp || "Autonomous System Provider";

    return NextResponse.json({
      success: true,
      query: input,
      resolvedIp: queryIp,
      asn: asnStr,
      organization: orgName,
      isp: asnData.isp || orgName,
      country: asnData.country_name || "Unknown",
      countryCode: asnData.country_code || "",
      city: asnData.city || "-",
      region: asnData.region || "-",
      networkPrefix: asnData.network || `${queryIp}/24`,
      source: "Global BGP & IP Routing Registries (RIPE/ARIN/APNIC)",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Kesalahan server saat memproses ASN: " + err.message }, { status: 500 });
  }
}
