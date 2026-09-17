import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import tls from "tls";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const SslSchema = z.object({
  domain: z.string().min(2, "Nama domain wajib diisi."),
  port: z.number().int().min(1).max(65535).default(443),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = SslSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let domain = parsed.data.domain.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
    const port = parsed.data.port;

    const ssrf = await validateUrlSafe(`https://${domain}`);
    if (!ssrf.safe) {
      return NextResponse.json({ success: false, error: ssrf.error }, { status: 403 });
    }

    const certData = await new Promise<any>((resolve, reject) => {
      const socket = tls.connect(
        {
          host: domain,
          port,
          servername: domain,
          rejectUnauthorized: false,
          timeout: 8000,
        },
        () => {
          const peerCert = socket.getPeerCertificate(true);
          const cipher = socket.getCipher();
          const protocol = socket.getProtocol();
          socket.end();

          if (!peerCert || Object.keys(peerCert).length === 0) {
            return reject(new Error("Server tidak mengembalikan sertifikat TLS"));
          }

          const validTo = new Date(peerCert.valid_to);
          const now = new Date();
          const daysRemaining = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 3600 * 24));

          const sans = peerCert.subjectaltname
            ? peerCert.subjectaltname.split(", ").map((s: string) => s.replace(/^DNS:/, ""))
            : [];

          resolve({
            subject: peerCert.subject?.CN || domain,
            subjectOrg: peerCert.subject?.O || "-",
            issuer: peerCert.issuer?.O || peerCert.issuer?.CN || "Unknown Issuer",
            issuerDetails: peerCert.issuer,
            validFrom: peerCert.valid_from,
            validTo: peerCert.valid_to,
            daysRemaining,
            isExpired: daysRemaining < 0,
            serialNumber: peerCert.serialNumber,
            fingerprint256: peerCert.fingerprint256,
            fingerprint: peerCert.fingerprint,
            sanList: sans,
            protocol: protocol || "TLSv1.3",
            cipherSuite: cipher ? `${cipher.name} (${cipher.version})` : "Standard AES-GCM",
            bits: peerCert.bits || 2048,
            authorized: socket.authorized,
          });
        }
      );

      socket.on("error", (err) => {
        socket.destroy();
        reject(err);
      });

      socket.on("timeout", () => {
        socket.destroy();
        reject(new Error("Koneksi TLS timeout setelah 8 detik."));
      });
    });

    return NextResponse.json({
      success: true,
      provider: "Node.js Native Direct Socket TLS Handshake Engine",
      domain,
      port,
      data: certData,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memeriksa sertifikat SSL/TLS: " + err.message },
      { status: 500 }
    );
  }
}
