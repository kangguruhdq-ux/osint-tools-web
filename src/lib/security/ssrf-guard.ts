import dns from "dns/promises";
import net from "net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "::",
  "metadata.google.internal",
]);

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;

  // 10.0.0.0/8 (Private)
  if (parts[0] === 10) return true;

  // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16 (Private)
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 169.254.0.0/16 (Link-local & AWS/GCP Cloud Metadata 169.254.169.254)
  if (parts[0] === 169 && parts[1] === 254) return true;

  // 0.0.0.0/8 (Current network)
  if (parts[0] === 0) return true;

  // 224.0.0.0/4 (Multicast)
  if (parts[0] >= 224) return true;

  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fe80:")) return true; // Link-local
  if (normalized.startsWith("fc00:") || normalized.startsWith("fd00:")) return true; // Unique local
  return false;
}

export function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateIpv4(ip);
  if (family === 6) return isPrivateIpv6(ip);
  return true; // Malformed is considered unsafe
}

const TRUSTED_PUBLIC_DOMAINS = [
  "tiktok.com",
  "vt.tiktok.com",
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "fb.watch",
  "fb.com",
  "pinterest.com",
  "pin.it",
  "rapidcdn.app",
  "snapsave.app",
  "cdninstagram.com",
  "fbcdn.net",
  "tiktokcdn.com",
  "twimg.com",
  "pinimg.com",
  "googlevideo.com",
  "github.com",
  "gitlab.com",
  "google.com",
  "wikipedia.org",
  "wikimedia.org",
  "wordpress.com",
  "wp.com",
  "cloudflare.com",
  "reddit.com",
  "linkedin.com",
  "googleapis.com",
  "gstatic.com",
  "jsdelivr.net",
  "unpkg.com",
  "fontawesome.com",
  "cdnjs.com",
  "bootstrapcdn.com",
];

function isTrustedPublicPlatform(hostname: string): boolean {
  return TRUSTED_PUBLIC_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith("." + domain)
  );
}

export async function validateUrlSafe(
  urlString: string
): Promise<{ safe: boolean; error?: string; parsedUrl?: URL; resolvedIp?: string }> {
  try {
    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      return { safe: false, error: "Format URL tidak valid." };
    }

    // Scheme blocking: only allow HTTP and HTTPS
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        safe: false,
        error: `Protokol '${parsed.protocol}' diblokir demi keamanan. Hanya http dan https yang diizinkan.`,
      };
    }

    const hostname = parsed.hostname.toLowerCase().trim();

    // Check basic string blacklist
    if (
      BLOCKED_HOSTS.has(hostname) ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return {
        safe: false,
        error: "Akses ke host lokal atau loopback diblokir oleh kebijakan keamanan SSRF.",
      };
    }

    // If hostname is directly an IP literal
    if (net.isIP(hostname)) {
      if (isPrivateIp(hostname)) {
        return {
          safe: false,
          error: "Akses ke alamat IP privat, loopback, atau cloud metadata diblokir (SSRF Guard).",
        };
      }
      return { safe: true, parsedUrl: parsed, resolvedIp: hostname };
    }

    // Fast-path for verified major public platforms
    if (isTrustedPublicPlatform(hostname)) {
      return { safe: true, parsedUrl: parsed, resolvedIp: "public-cdn" };
    }

    // DNS Resolution using OS resolver (dns.lookup) for maximum network compatibility
    try {
      const results = await dns.lookup(hostname, { all: true });
      if (!results || results.length === 0) {
        return {
          safe: false,
          error: `Domain '${hostname}' tidak memiliki record alamat server.`,
        };
      }

      for (const res of results) {
        if (isPrivateIp(res.address)) {
          return {
            safe: false,
            error: `Domain '${hostname}' mengarah ke IP privat [${res.address}] yang diblokir demi keamanan.`,
          };
        }
      }
      return { safe: true, parsedUrl: parsed, resolvedIp: results[0].address };
    } catch {
      // Secondary fallback to resolve4
      try {
        const addresses = await dns.resolve4(hostname);
        for (const ip of addresses) {
          if (isPrivateIp(ip)) {
            return {
              safe: false,
              error: `Domain '${hostname}' mengarah ke IP privat [${ip}] yang diblokir demi keamanan.`,
            };
          }
        }
        return { safe: true, parsedUrl: parsed, resolvedIp: addresses[0] };
      } catch {
        // Tertiary fallback: DoH (DNS-over-HTTPS via Cloudflare / Google)
        try {
          const dohRes = await fetch(`https://1.1.1.1/dns-query?name=${encodeURIComponent(hostname)}&type=A`, {
            headers: { Accept: "application/dns-json" },
            signal: AbortSignal.timeout(4000),
          });
          if (dohRes.ok) {
            const dohData = await dohRes.json();
            if (dohData.Answer && Array.isArray(dohData.Answer)) {
              for (const ans of dohData.Answer) {
                if (ans.type === 1 && typeof ans.data === "string") {
                  if (isPrivateIp(ans.data)) {
                    return {
                      safe: false,
                      error: `Domain '${hostname}' mengarah ke IP privat [${ans.data}] yang diblokir demi keamanan.`,
                    };
                  }
                  return { safe: true, parsedUrl: parsed, resolvedIp: ans.data };
                }
              }
            }
          }
        } catch {
          // ignore DoH fallback failure
        }

        return {
          safe: false,
          error: `Domain '${hostname}' tidak dapat diresolusi ke server manapun.`,
        };
      }
    }
  } catch (err: any) {
    return { safe: false, error: `Validasi keamanan gagal: ${err.message}` };
  }
}
