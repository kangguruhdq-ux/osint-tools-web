import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import net from "net";
import dns from "dns/promises";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const PortScanSchema = z.object({
  target: z.string().min(2, "Target host atau domain diperlukan."),
});

interface PortDefinition {
  port: number;
  service: string;
  category: string;
}

const COMMON_PORTS: PortDefinition[] = [
  { port: 80, service: "HTTP (Web Service)", category: "Web" },
  { port: 443, service: "HTTPS (Encrypted Web)", category: "Web" },
  { port: 22, service: "SSH (Secure Shell)", category: "Remote Access" },
  { port: 21, service: "FTP (File Transfer)", category: "File Transfer" },
  { port: 25, service: "SMTP (Mail Routing)", category: "Email" },
  { port: 53, service: "DNS (Domain Service)", category: "Core Network" },
  { port: 3306, service: "MySQL Database", category: "Database" },
  { port: 8080, service: "HTTP-Alt / Proxy", category: "Web Alt" },
];

function checkPort(host: string, port: number, timeoutMs = 1800): Promise<{ open: boolean; latencyMs: number; error?: string }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      const latency = Date.now() - start;
      socket.destroy();
      resolve({ open: true, latencyMs: latency });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ open: false, latencyMs: timeoutMs, error: "TIMEOUT" });
    });

    socket.on("error", (err: any) => {
      socket.destroy();
      resolve({ open: false, latencyMs: Date.now() - start, error: err.code || "CLOSED" });
    });

    try {
      socket.connect(port, host);
    } catch {
      resolve({ open: false, latencyMs: 0, error: "SOCKET_ERR" });
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PortScanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    let cleanTarget = parsed.data.target
      .trim()
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .split(":")[0];

    // SSRF Guard Check
    const ssrf = await validateUrlSafe(`http://${cleanTarget}`);
    if (!ssrf.safe) {
      return NextResponse.json({ success: false, error: ssrf.error || "Pemeriksaan terhadap target diblokir oleh SSRF Guard." }, { status: 403 });
    }

    // Resolve domain to IP
    let targetIp = cleanTarget;
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(cleanTarget)) {
      try {
        const ips = await dns.resolve4(cleanTarget);
        if (ips.length > 0) {
          targetIp = ips[0];
        }
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Gagal menyelesaikan DNS untuk domain "${cleanTarget}": ${err.message}` }, { status: 400 });
      }
    }

    // Perform non-intrusive parallel socket probes
    const scanPromises = COMMON_PORTS.map(async (p) => {
      const res = await checkPort(targetIp, p.port);
      return {
        port: p.port,
        service: p.service,
        category: p.category,
        isOpen: res.open,
        status: res.open ? "OPEN" : "CLOSED / FILTERED",
        latencyMs: res.latencyMs,
        details: res.open
          ? "Port merespon koneksi TCP secara terbuka."
          : `Tidak ada respon koneksi aktif (${res.error || "Tertutup"}).`,
      };
    });

    const portResults = await Promise.all(scanPromises);
    const openPorts = portResults.filter((p) => p.isOpen);

    return NextResponse.json({
      success: true,
      target: cleanTarget,
      targetIp,
      totalProbed: COMMON_PORTS.length,
      openCount: openPorts.length,
      closedCount: COMMON_PORTS.length - openPorts.length,
      ports: portResults,
      disclaimer: "Audit port ini dilakukan secara non-intrusif menggunakan probe TCP koneksi standar tanpa eksploitasi.",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Gagal memproses audit port: " + err.message }, { status: 500 });
  }
}
