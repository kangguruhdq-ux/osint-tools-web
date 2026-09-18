import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CidrSchema = z.object({
  cidr: z.string().min(3, "Format CIDR tidak valid (contoh: 192.168.1.0/24)."),
});

function ipToLong(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join(".");
}

function longToBinary(long: number): string {
  return [
    ((long >>> 24) & 255).toString(2).padStart(8, "0"),
    ((long >>> 16) & 255).toString(2).padStart(8, "0"),
    ((long >>> 8) & 255).toString(2).padStart(8, "0"),
    (long & 255).toString(2).padStart(8, "0"),
  ].join(".");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CidrSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    let rawCidr = parsed.data.cidr.trim();
    let ipStr = "";
    let prefixLen = 24;

    if (rawCidr.includes("/")) {
      const parts = rawCidr.split("/");
      ipStr = parts[0].trim();
      prefixLen = parseInt(parts[1].trim(), 10);
    } else {
      ipStr = rawCidr;
      prefixLen = 24; // Default to /24 if omitted
    }

    // Validate IP format
    const ipParts = ipStr.split(".");
    if (ipParts.length !== 4 || ipParts.some((p) => isNaN(Number(p)) || Number(p) < 0 || Number(p) > 255)) {
      return NextResponse.json({ success: false, error: "Format IP address tidak valid. Gunakan 4 oktet standar (0-255)." }, { status: 400 });
    }

    if (isNaN(prefixLen) || prefixLen < 0 || prefixLen > 32) {
      return NextResponse.json({ success: false, error: "Panjang prefix CIDR harus di antara /0 dan /32." }, { status: 400 });
    }

    const ipLong = ipToLong(ipStr);
    const maskLong = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
    const wildcardLong = (~maskLong) >>> 0;

    const networkLong = (ipLong & maskLong) >>> 0;
    const broadcastLong = (networkLong | wildcardLong) >>> 0;

    const totalHosts = Math.pow(2, 32 - prefixLen);
    const usableHosts = prefixLen >= 31 ? (prefixLen === 31 ? 2 : 1) : Math.max(0, totalHosts - 2);

    const firstUsableLong = prefixLen >= 31 ? networkLong : networkLong + 1;
    const lastUsableLong = prefixLen >= 31 ? broadcastLong : broadcastLong - 1;

    // Determine IP Scope & Class
    const firstOctet = parseInt(ipParts[0], 10);
    let ipClass = "A";
    if (firstOctet >= 128 && firstOctet <= 191) ipClass = "B";
    else if (firstOctet >= 192 && firstOctet <= 223) ipClass = "C";
    else if (firstOctet >= 224 && firstOctet <= 239) ipClass = "D (Multicast)";
    else if (firstOctet >= 240) ipClass = "E (Experimental)";

    let ipScope = "Public Internet Address";
    if (firstOctet === 10) ipScope = "Private Network (RFC 1918 - Class A)";
    else if (firstOctet === 172 && parseInt(ipParts[1], 10) >= 16 && parseInt(ipParts[1], 10) <= 31) ipScope = "Private Network (RFC 1918 - Class B)";
    else if (firstOctet === 192 && parseInt(ipParts[1], 10) === 168) ipScope = "Private Network (RFC 1918 - Class C)";
    else if (firstOctet === 127) ipScope = "Loopback / Localhost (RFC 1122)";
    else if (firstOctet === 169 && parseInt(ipParts[1], 10) === 254) ipScope = "Link-Local / APIPA (RFC 3927)";
    else if (firstOctet === 100 && parseInt(ipParts[1], 10) >= 64 && parseInt(ipParts[1], 10) <= 127) ipScope = "Carrier-Grade NAT (RFC 6598)";

    return NextResponse.json({
      success: true,
      cidr: `${longToIp(networkLong)}/${prefixLen}`,
      inputIp: ipStr,
      prefixLength: prefixLen,
      networkAddress: longToIp(networkLong),
      broadcastAddress: longToIp(broadcastLong),
      subnetMask: longToIp(maskLong),
      wildcardMask: longToIp(wildcardLong),
      firstUsableIp: longToIp(firstUsableLong),
      lastUsableIp: longToIp(lastUsableLong),
      totalAddresses: totalHosts,
      usableHosts,
      ipClass,
      ipScope,
      binarySubnetMask: longToBinary(maskLong),
      binaryNetworkAddress: longToBinary(networkLong),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Gagal menghitung CIDR subnet: " + err.message }, { status: 500 });
  }
}
