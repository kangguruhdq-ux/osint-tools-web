import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MacSchema = z.object({
  macAddress: z.string().min(6, "Alamat MAC minimal 6 karakter."),
});

// Top IEEE OUI Vendor Database
const KNOWN_OUIS: Record<string, { vendor: string; country: string; type: string }> = {
  "00:03:93": { vendor: "Apple, Inc.", country: "US", type: "Networking / Device" },
  "00:05:02": { vendor: "Apple, Inc.", country: "US", type: "Mobile / Mac" },
  "00:10:18": { vendor: "Broadcom Corporation", country: "US", type: "Wireless Controller" },
  "00:14:22": { vendor: "Dell Inc.", country: "US", type: "Computer / Server" },
  "00:1A:11": { vendor: "Google, Inc.", country: "US", type: "IoT / Hardware" },
  "00:1A:2B": { vendor: "Ayecom Technology Co., Ltd.", country: "TW", type: "Telecommunications" },
  "00:1C:B3": { vendor: "Apple, Inc.", country: "US", type: "Mac / iPhone" },
  "00:50:56": { vendor: "VMware, Inc.", country: "US", type: "Virtual Machine Adapter" },
  "08:00:27": { vendor: "PCS Systemtechnik GmbH (VirtualBox)", country: "DE", type: "Virtual Machine" },
  "18:65:90": { vendor: "Apple, Inc.", country: "US", type: "Mobile Device" },
  "24:0A:C4": { vendor: "Espressif Inc.", country: "CN", type: "IoT / ESP32 Module" },
  "28:6D:CD": { vendor: "Samsung Electronics", country: "KR", type: "Smartphone / Smart TV" },
  "30:B5:C2": { vendor: "TP-Link Corporation", country: "CN", type: "Router / Access Point" },
  "3C:5A:B4": { vendor: "Google LLC", country: "US", type: "Chromecast / Pixel" },
  "40:B0:76": { vendor: "ASUSTek Computer Inc.", country: "TW", type: "Motherboard / Router" },
  "48:2C:A0": { vendor: "Huawei Technologies Co., Ltd", country: "CN", type: "Cellular / Modem" },
  "50:C7:BF": { vendor: "TP-Link Corporation Limited", country: "CN", type: "Smart Home / Kasa" },
  "58:9E:C6": { vendor: "Apple, Inc.", country: "US", type: "iPad / Mac" },
  "60:45:BD": { vendor: "Microsoft Corporation", country: "US", type: "Surface / Xbox" },
  "68:D7:9A": { vendor: "Ubiquiti Networks Inc.", country: "US", type: "UniFi AP / Switch" },
  "70:85:C2": { vendor: "Intel Corporation", country: "US", type: "Wi-Fi Chipset" },
  "74:D4:35": { vendor: "Giga-Byte Technology Co., Ltd.", country: "TW", type: "Motherboard" },
  "80:7D:3A": { vendor: "Xiaomi Communications Co Ltd", country: "CN", type: "Smartphone / IoT" },
  "88:66:5A": { vendor: "Apple, Inc.", country: "US", type: "Apple Watch / iPhone" },
  "98:01:A7": { vendor: "Amazon Technologies Inc.", country: "US", type: "Echo / Fire TV" },
  "B8:27:EB": { vendor: "Raspberry Pi Foundation", country: "GB", type: "Single Board Computer" },
  "DC:A6:32": { vendor: "Raspberry Pi Trading Ltd", country: "GB", type: "Raspberry Pi 4/5" },
  "E4:5F:01": { vendor: "Raspberry Pi Trading Ltd", country: "GB", type: "Raspberry Pi Compute" },
  "F0:18:98": { vendor: "Apple, Inc.", country: "US", type: "MacBook / iMac" },
  "F4:F5:E8": { vendor: "Cisco Systems, Inc", country: "US", type: "Enterprise Switch" },
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = MacSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const raw = parsed.data.macAddress.trim();
    // Normalize clean hex chars only
    const cleanHex = raw.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();

    if (cleanHex.length < 6) {
      return NextResponse.json(
        { success: false, error: "Format MAC Address tidak valid. Masukkan minimal 6 karakter heksadesimal." },
        { status: 400 }
      );
    }

    const oui = `${cleanHex.substring(0, 2)}:${cleanHex.substring(2, 4)}:${cleanHex.substring(4, 6)}`;
    const formattedMac = cleanHex
      .match(/.{1,2}/g)
      ?.slice(0, 6)
      ?.join(":") || oui;

    let vendorInfo = KNOWN_OUIS[oui] || null;

    // Live public fallback query if not in local top dictionary
    if (!vendorInfo) {
      try {
        const liveRes = await fetch(`https://api.macvendors.com/${encodeURIComponent(oui)}`, {
          headers: { "User-Agent": "NexusMacLookup/1.0" },
          signal: AbortSignal.timeout(4000),
        });
        if (liveRes.ok) {
          const vendorName = await liveRes.text();
          if (vendorName && !vendorName.includes("Not Found")) {
            vendorInfo = {
              vendor: vendorName.trim(),
              country: "Global",
              type: "Hardware Vendor",
            };
          }
        }
      } catch {}
    }

    // Determine MAC type
    const firstByte = parseInt(cleanHex.substring(0, 2), 16);
    const isMulticast = (firstByte & 0x01) !== 0;
    const isLocallyAdministered = (firstByte & 0x02) !== 0;

    return NextResponse.json({
      success: true,
      provider: "IEEE OUI Hardware Vendor & MAC Address Engine",
      macAddress: formattedMac,
      ouiPrefix: oui,
      vendor: vendorInfo?.vendor || "Vendor Tidak Dikenal / Privat",
      country: vendorInfo?.country || "-",
      deviceType: vendorInfo?.type || "Uncategorized Hardware",
      specifications: {
        transmission: isMulticast ? "Multicast / Broadcast" : "Unicast (Individual)",
        addressAssignment: isLocallyAdministered ? "Locally Administered (Custom/Spoofed)" : "Universally Administered (IEEE Official)",
        formatStandard: "EUI-48",
      },
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal mengidentifikasi MAC address: " + err.message },
      { status: 500 }
    );
  }
}
