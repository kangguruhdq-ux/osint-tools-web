import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";
import net from "net";
import { z } from "zod";
import { isPrivateIp } from "@/lib/security/ssrf-guard";

const IpSchema = z.object({
  ip: z.string().min(3, "Alamat IP atau hostname tidak valid."),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = IpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let inputTarget = parsed.data.ip.trim().toLowerCase();
    inputTarget = inputTarget.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];

    // If input is a domain, resolve to IP first
    let resolvedIp = inputTarget;
    if (!net.isIP(inputTarget)) {
      try {
        const addresses = await dns.resolve4(inputTarget);
        resolvedIp = addresses[0];
      } catch {
        return NextResponse.json(
          { success: false, error: `Domain '${inputTarget}' tidak dapat diresolusi ke IP.` },
          { status: 400 }
        );
      }
    }

    // SSRF Check on IP
    if (isPrivateIp(resolvedIp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Alamat IP target adalah IP privat / loopback yang diblokir demi keamanan.",
        },
        { status: 403 }
      );
    }

    // Reverse DNS PTR lookup
    let reverseDns: string[] = [];
    try {
      reverseDns = await dns.reverse(resolvedIp);
    } catch {
      reverseDns = ["(Tidak ada PTR record)"];
    }

    // Fetch Public Geolocation & ASN from public IP-API
    let geoData: any = {};
    try {
      const geoRes = await fetch(
        `http://ip-api.com/json/${resolvedIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (geoRes.ok) {
        geoData = await geoRes.json();
      }
    } catch {
      // Fallback
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: "Public Geolocation & Reverse DNS Engine",
      ip: resolvedIp,
      ipVersion: net.isIP(resolvedIp) === 6 ? "IPv6" : "IPv4",
      country: geoData.country || "Unknown",
      countryCode: geoData.countryCode || "-",
      region: geoData.regionName || "-",
      city: geoData.city || "-",
      timezone: geoData.timezone || "-",
      isp: geoData.isp || "-",
      org: geoData.org || "-",
      asn: geoData.as || "-",
      reverseDns,
      privacyNotice:
        "Data geolokasi hanya menunjukkan estimasi wilayah jaringan/ISP umum, bukan alamat fisik personal.",
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses pencarian IP: " + err.message },
      { status: 500 }
    );
  }
}
