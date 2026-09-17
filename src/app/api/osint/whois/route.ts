import { NextRequest, NextResponse } from "next/server";
import net from "net";
import { z } from "zod";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const WhoisSchema = z.object({
  domain: z.string().min(3, "Nama domain tidak valid."),
});

function queryWhoisServer(server: string, domain: string, timeoutMs = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let data = "";

    socket.setTimeout(timeoutMs);

    socket.connect(43, server, () => {
      socket.write(domain + "\r\n");
    });

    socket.on("data", (chunk) => {
      data += chunk.toString("utf8");
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error(`Koneksi WHOIS ke ${server} timeout setelah ${timeoutMs}ms.`));
    });

    socket.on("error", (err) => {
      reject(err);
    });

    socket.on("close", () => {
      resolve(data);
    });
  });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = WhoisSchema.safeParse(body);
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
        { status: 400 }
      );
    }

    // 1. Query IANA WHOIS first
    let rawWhois = "";
    let whoisServer = "whois.iana.org";

    try {
      rawWhois = await queryWhoisServer(whoisServer, domain);

      // Check if IANA references a specific TLD WHOIS server
      const match = rawWhois.match(/refer:\s+([^\s]+)/i) || rawWhois.match(/whois:\s+([^\s]+)/i);
      if (match && match[1]) {
        whoisServer = match[1].trim();
        rawWhois = await queryWhoisServer(whoisServer, domain);
      }
    } catch (e: any) {
      // Fallback query to common registrar WHOIS
      try {
        whoisServer = "whois.verisign-grs.com";
        rawWhois = await queryWhoisServer(whoisServer, domain);
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: `Gagal menghubungi server WHOIS: ${e.message}`,
          },
          { status: 504 }
        );
      }
    }

    // Parse structured data safely
    const registrar =
      rawWhois.match(/Registrar:\s+(.+)/i)?.[1]?.trim() ||
      rawWhois.match(/Registrar Name:\s+(.+)/i)?.[1]?.trim() ||
      "Tidak dipublikasikan / Diproteksi";

    const creationDate =
      rawWhois.match(/Creation Date:\s+(.+)/i)?.[1]?.trim() ||
      rawWhois.match(/created:\s+(.+)/i)?.[1]?.trim() ||
      "-";

    const expiryDate =
      rawWhois.match(/Registry Expiry Date:\s+(.+)/i)?.[1]?.trim() ||
      rawWhois.match(/paid-till:\s+(.+)/i)?.[1]?.trim() ||
      "-";

    const nameServers = Array.from(
      new Set(
        [...rawWhois.matchAll(/Name Server:\s+([^\s]+)/gi)].map((m) =>
          m[1].toLowerCase().trim()
        )
      )
    );

    // Mask privacy emails if any in rawWhois (anti-doxxing)
    const sanitizedRaw = rawWhois.replace(
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
      "[DISP_PROTECTED_DATA]"
    );

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: `Direct Socket WHOIS (${whoisServer})`,
      domain,
      registrar,
      creationDate,
      expiryDate,
      nameServers,
      raw: sanitizedRaw,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses WHOIS: " + err.message },
      { status: 500 }
    );
  }
}
