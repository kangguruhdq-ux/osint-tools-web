import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as cheerio from "cheerio";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const UrlScanSchema = z.object({
  url: z.string().min(3, "URL target wajib diisi."),
});

const SUSPICIOUS_TLDS = new Set([
  "xyz", "top", "buzz", "cam", "fit", "rest", "work", "icu", "click", "tk",
  "ml", "ga", "cf", "gq", "sbs", "surf", "monster", "quest", "beauty", "hair",
  "skin", "makeup", "dating", "gdn", "bid", "loan", "men", "stream", "download"
]);

const MONITORED_BRANDS = [
  { name: "Google", regex: /g[o0]{2}gl[e3]|accounts[.-]google/i, official: "google.com" },
  { name: "PayPal", regex: /paypa[l1]|paypal[.-]security|paypal[.-]verify/i, official: "paypal.com" },
  { name: "Microsoft", regex: /micr[o0]s[o0]ft|login[.-]live|msft[.-]auth/i, official: "microsoft.com" },
  { name: "Apple", regex: /app[l1][e3][.-]id|apple[.-]support/i, official: "apple.com" },
  { name: "Netflix", regex: /netf[l1]ix|netflix[.-]billing/i, official: "netflix.com" },
  { name: "Facebook/Meta", regex: /faceb[o0]{2}k|fb[.-]security|meta[.-]verify/i, official: "facebook.com" },
  { name: "Bank BCA", regex: /k[l1]ikbca|bca[.-]klik|bca[.-]id|halo[.-]bca/i, official: "bca.co.id" },
  { name: "Bank Mandiri", regex: /livin[.-]mandiri|mandiri[.-]online/i, official: "bankmandiri.co.id" },
  { name: "DANA", regex: /dana[.-]kaget|dana[.-]id|claim[.-]dana|promo[.-]dana/i, official: "dana.id" },
  { name: "WhatsApp", regex: /whatsa[p]{1,3}|wa[.-]me[.-]verify/i, official: "whatsapp.com" },
  { name: "Telegram", regex: /te[l1]egram[.-]web|t[.-]me[.-]login/i, official: "telegram.org" },
  { name: "Binance/Crypto", regex: /b[i1]nance|metamask[.-]io|wallet[.-]connect/i, official: "binance.com" },
];

async function checkDomainExistsDoh(hostname: string): Promise<boolean> {
  try {
    const res = await fetch(`https://1.1.1.1/dns-query?name=${encodeURIComponent(hostname)}&type=A`, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data.Answer) && data.Answer.length > 0;
    }
  } catch {
    try {
      const res2 = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`, {
        headers: { Accept: "application/dns-json" },
        signal: AbortSignal.timeout(3500),
      });
      if (res2.ok) {
        const data2 = await res2.json();
        return Array.isArray(data2.Answer) && data2.Answer.length > 0;
      }
    } catch {}
  }
  return false;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = UrlScanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let targetUrl = parsed.data.url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    // SSRF Check
    const ssrfCheck = await validateUrlSafe(targetUrl);
    if (!ssrfCheck.safe) {
      return NextResponse.json(
        { success: false, error: ssrfCheck.error },
        { status: 403 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return NextResponse.json({ success: false, error: "Format URL tidak valid." }, { status: 400 });
    }

    const findings: { severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO"; title: string; detail: string }[] = [];
    let threatScore = 0;

    const hostname = parsedUrl.hostname.toLowerCase();
    const isIpHost = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith("[");
    const domainParts = hostname.split(".");
    const tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : "";
    const isHttps = parsedUrl.protocol === "https:";

    // 1. IP Address as Hostname
    if (isIpHost) {
      threatScore += 30;
      findings.push({
        severity: "HIGH",
        title: "Hostname Berupa Alamat IP Numerik Langsung",
        detail: `URL menggunakan IP numerik (${hostname}) alih-alih domain terdaftar, sering digunakan pada server phishing sementara atau drop point malware.`,
      });
    }

    // 2. High Abuse / Suspicious TLD
    if (SUSPICIOUS_TLDS.has(tld)) {
      threatScore += 25;
      findings.push({
        severity: "HIGH",
        title: `TLD Berisiko Tinggi (.${tld})`,
        detail: `Ekstensi domain .${tld} memiliki reputasi historis penyalahgunaan tinggi dalam kampanye spam, phishing, dan malware dropper.`,
      });
    }

    // 3. HTTP Cleartext Protocol
    if (!isHttps) {
      threatScore += 20;
      findings.push({
        severity: "MEDIUM",
        title: "Protokol HTTP Tidak Terenkripsi",
        detail: "Komunikasi melalui HTTP biasa tanpa enkripsi TLS/SSL. Rentan terhadap penyadapan data dan Man-in-the-Middle (MitM).",
      });
    }

    // 4. Brand Impersonation / Typosquatting
    let brandDetected: string | null = null;
    for (const b of MONITORED_BRANDS) {
      if (b.regex.test(hostname)) {
        if (!hostname.endsWith(b.official)) {
          threatScore += 45;
          brandDetected = b.name;
          findings.push({
            severity: "CRITICAL",
            title: `Indikasi Typosquatting / Tiruan Merek (${b.name})`,
            detail: `Domain '${hostname}' menyerupai brand '${b.name}', namun bukan domain resmi (${b.official}). Kemungkinan besar situs phishing/penipuan bertarget.`,
          });
          break;
        }
      }
    }

    // 5. Credential harvesting keywords in path or query
    const rawPathQuery = (parsedUrl.pathname + parsedUrl.search).toLowerCase();
    const phishingKeywords = ["login", "signin", "verify", "account-update", "update-billing", "security-alert", "claim-dana", "hadiah", "wallet", "token="];
    const matchedKeywords = phishingKeywords.filter((kw) => rawPathQuery.includes(kw));
    if (matchedKeywords.length > 0 && !brandDetected) {
      threatScore += 15;
      findings.push({
        severity: "MEDIUM",
        title: "Kata Kunci Autentikasi / Klaim Terdeteksi",
        detail: `Jalur URL memuat parameter sensitif (${matchedKeywords.join(", ")}). Jika meminta kata sandi di luar situs resmi, waspadai phising.`,
      });
    }

    // 6. At-sign deception (@)
    if (targetUrl.includes("@")) {
      threatScore += 35;
      findings.push({
        severity: "CRITICAL",
        title: "Karakter Deception (@) Ditemukan",
        detail: "URL menggunakan simbol '@' untuk mengelabui pembacaan alamat domain sebelum tanda '@' dialihkan ke server lain.",
      });
    }

    // 7. Suspicious File Extension in URL
    const dangerousExtensions = [".exe", ".scr", ".bat", ".vbs", ".iso", ".apk", ".jar", ".ps1", ".dll"];
    const foundExt = dangerousExtensions.find((ext) => parsedUrl.pathname.toLowerCase().endsWith(ext));
    if (foundExt) {
      threatScore += 40;
      findings.push({
        severity: "CRITICAL",
        title: `URL Mengarah Langsung ke Binary / Eksekutabel (${foundExt})`,
        detail: `Tautan berujung pada pengunduhan langsung file eksekutabel berisiko tinggi (${foundExt}). Potensi drive-by download atau malware dropper.`,
      });
    }

    // Follow redirect chain safely with fallback
    const redirectChain: { url: string; status: number; location?: string }[] = [];
    let currentUrl = targetUrl;
    let finalResponse: Response | null = null;
    let htmlBody = "";
    const maxHops = 5;
    let connectionAborted = false;

    for (let hop = 0; hop < maxHops; hop++) {
      const hopSsrf = await validateUrlSafe(currentUrl);
      if (!hopSsrf.safe) {
        return NextResponse.json(
          {
            success: false,
            error: `Redirect hop #${hop + 1} ke ${currentUrl} diblokir oleh SSRF Guard: ${hopSsrf.error}`,
          },
          { status: 403 }
        );
      }

      let res: Response | null = null;
      try {
        res = await fetch(currentUrl, {
          method: "GET",
          redirect: "manual",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 NexusUrlScanner/2.5",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
          },
          signal: AbortSignal.timeout(6500),
        });
      } catch (fetchErr: any) {
        // If first hop on HTTPS failed or aborted, try HTTP fallback
        if (hop === 0 && currentUrl.startsWith("https://")) {
          const httpCandidate = currentUrl.replace(/^https:/i, "http:");
          try {
            res = await fetch(httpCandidate, {
              method: "GET",
              redirect: "manual",
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 NexusUrlScanner/2.5",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              },
              signal: AbortSignal.timeout(5500),
            });
            if (res) {
              currentUrl = httpCandidate;
            }
          } catch {
            connectionAborted = true;
          }
        } else {
          connectionAborted = true;
        }

        if (!res) {
          findings.push({
            severity: "HIGH",
            title: "Endpoint Mengalami Timeout / Server Unreachable",
            detail: `Server tujuan gagal merespons atau memutuskan koneksi sebelum respons selesai (${fetchErr.message || "Timeout / Aborted"}).`,
          });
          break;
        }
      }

      if (!res) break;

      const location = res.headers.get("location");
      redirectChain.push({
        url: currentUrl,
        status: res.status,
        location: location || undefined,
      });

      if (res.status >= 300 && res.status < 400 && location) {
        try {
          currentUrl = new URL(location, currentUrl).toString();
        } catch {
          break;
        }
      } else {
        finalResponse = res;
        try {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("text/html") || contentType.includes("application/xhtml") || contentType === "") {
            htmlBody = await res.text();
          }
        } catch {
          // ignore stream read error
        }
        break;
      }
    }

    const latencyMs = Date.now() - startTime;
    const headersObj: Record<string, string> = {};
    if (finalResponse) {
      finalResponse.headers.forEach((val, key) => {
        headersObj[key.toLowerCase()] = val;
      });
    }

    // Redirect count penalty
    if (redirectChain.length > 3) {
      threatScore += 15;
      findings.push({
        severity: "MEDIUM",
        title: "Rantai Pengalihan Panjang (> 3 Hops)",
        detail: `URL dialihkan sebanyak ${redirectChain.length} kali, sering digunakan untuk mengelabui filter keamanan atau menyembunyikan domain akhir.`,
      });
    }

    // Deep HTML inspection with Cheerio & Vulnerability Discovery
    let pageTitle = "";
    let pageDescription = "";
    let hasPasswordInput = false;
    let formActionExternal = false;
    const formActions: string[] = [];
    let mixedContentDetected = false;
    let openDirectoryListing = false;
    let debugStackExposed = false;
    let clickjackingRisk = false;

    if (htmlBody) {
      try {
        const $ = cheerio.load(htmlBody.slice(0, 600000));
        pageTitle = $("title").first().text().trim() || "";
        pageDescription = $('meta[name="description"]').attr("content")?.trim() || "";

        const bodyLower = htmlBody.toLowerCase();

        // 1. Open Directory Listing Detection
        if (
          pageTitle.toLowerCase().startsWith("index of /") ||
          $("h1").text().toLowerCase().includes("index of /") ||
          bodyLower.includes("<title>index of") ||
          (bodyLower.includes("parent directory") && (bodyLower.includes("last modified") || bodyLower.includes("size description")))
        ) {
          openDirectoryListing = true;
          threatScore += 30;
          findings.push({
            severity: "HIGH",
            title: "Open Directory Listing Terdeteksi (Sensitif)",
            detail: "Web server mengekspos direktori publik secara terbuka ('Index of /'). Berpotensi membocorkan file cadangan (.bak), dump database (.sql), atau file konfigurasi server.",
          });
        }

        // 2. Debug / Exception Stack Trace Exposure
        const debugSignatures = [
          "fatal error:", "traceback (most recent call last):", "exception in thread",
          "illuminate\\database\\queryexception", "whoops! there was an error.",
          "django version", "syntax error, unexpected", "uncaught exception"
        ];
        const matchedDebug = debugSignatures.filter((sig) => bodyLower.includes(sig));
        if (matchedDebug.length > 0) {
          debugStackExposed = true;
          threatScore += 25;
          findings.push({
            severity: "HIGH",
            title: "Eksposur Pesan Error / Stack Trace Server",
            detail: `Halaman menampilkan jejak pesan error runtime (${matchedDebug.join(", ")}). Informasi ini membocorkan path internal direktori server dan detail database kepada publik.`,
          });
        }

        // 3. Form inspection & Cross-domain Form Hijacking
        const passwordInputs = $('input[type="password"]');
        hasPasswordInput = passwordInputs.length > 0;

        $("form").each((_, form) => {
          const action = $(form).attr("action");
          if (action) {
            formActions.push(action);
            try {
              const actionUrl = new URL(action, currentUrl);
              if (actionUrl.hostname !== new URL(currentUrl).hostname) {
                formActionExternal = true;
              }
            } catch {
              // ignore relative parsing
            }
          }
        });

        if (hasPasswordInput) {
          if (!isHttps) {
            threatScore += 35;
            findings.push({
              severity: "CRITICAL",
              title: "Formulir Password di Atas Koneksi Tidak Terenkripsi (HTTP)",
              detail: "Halaman menyertakan kolom input password yang ditransmisikan tanpa enkripsi HTTPS. Kredensial dapat disadap siapa pun di jaringan yang sama.",
            });
          } else if (brandDetected) {
            threatScore += 30;
            findings.push({
              severity: "CRITICAL",
              title: "Kolom Input Kredensial pada Situs Tiruan Merek (Phishing Aktif)",
              detail: `Situs yang meniru brand '${brandDetected}' meminta pengguna memasukkan kata sandi / kredensial akun.`,
            });
          } else {
            findings.push({
              severity: "INFO",
              title: "Formulir Autentikasi / Sandi Terdeteksi",
              detail: "Halaman menyediakan antarmuka login atau form autentikasi akun pengguna.",
            });
          }
        }

        if (formActionExternal) {
          threatScore += 25;
          findings.push({
            severity: "HIGH",
            title: "Pengiriman Formulir Lintas Domain (Cross-Domain Form Action)",
            detail: "Formulir pada halaman mengirimkan data hasil input pengguna ke server domain eksternal yang berbeda.",
          });
        }

        // 4. Mixed Content Check (if page is HTTPS)
        if (currentUrl.startsWith("https://")) {
          const httpAssets: string[] = [];
          $('script[src^="http://"], img[src^="http://"], link[rel="stylesheet"][href^="http://"], iframe[src^="http://"]').each((_, el) => {
            const src = $(el).attr("src") || $(el).attr("href");
            if (src) httpAssets.push(src);
          });
          if (httpAssets.length > 0) {
            mixedContentDetected = true;
            threatScore += 15;
            findings.push({
              severity: "MEDIUM",
              title: "Mixed Content (Aset HTTP Tidak Terenkripsi)",
              detail: `Halaman HTTPS memuat ${httpAssets.length} sumber daya eksternal melalui protokol HTTP polos yang rentan terhadap modifikasi Man-in-the-Middle (MitM).`,
            });
          }
        }

        // 5. Clickjacking Risk
        const hasXfo = Boolean(headersObj["x-frame-options"]);
        const hasCspFrameAncestors = Boolean(headersObj["content-security-policy"]?.includes("frame-ancestors"));
        if (!hasXfo && !hasCspFrameAncestors && (hasPasswordInput || formActions.length > 0)) {
          clickjackingRisk = true;
          threatScore += 15;
          findings.push({
            severity: "MEDIUM",
            title: "Rentan Clickjacking (X-Frame-Options & Frame-Ancestors Hilang)",
            detail: "Halaman interaktif tidak mengonfigurasi header X-Frame-Options atau CSP frame-ancestors, sehingga dapat disematkan dalam iframe phishing transparan.",
          });
        }

        // 6. Suspicious Obfuscated Scripts / Malicious Injections
        const obfuscatedPatterns = [/eval\s*\(\s*unescape\s*\(/i, /document\.write\s*\(\s*unescape\s*\(/i, /coinhive\.min\.js/i, /crypto-loot\.com/i];
        for (const pat of obfuscatedPatterns) {
          if (pat.test(htmlBody)) {
            threatScore += 30;
            findings.push({
              severity: "HIGH",
              title: "Skrip Obfuscated / Injeksi Mencurigakan Terdeteksi",
              detail: "Ditemukan pola decoding kode JavaScript dinamis (eval/unescape) atau skrip miner latar belakang pada kode sumber halaman.",
            });
            break;
          }
        }
      } catch {
        // Cheerio parse fallback
      }
    }

    // Cookie hygiene audit
    const rawSetCookie = finalResponse?.headers.get("set-cookie") || "";
    if (rawSetCookie) {
      if (!/;\s*HttpOnly/i.test(rawSetCookie)) {
        findings.push({
          severity: "LOW",
          title: "Cookie Tanpa Flag HttpOnly",
          detail: "Cookie sesi tidak memiliki flag HttpOnly, sehingga berisiko dibaca oleh skrip Cross-Site Scripting (XSS).",
        });
      }
      if (!/;\s*Secure/i.test(rawSetCookie) && isHttps) {
        findings.push({
          severity: "LOW",
          title: "Cookie Tanpa Flag Secure",
          detail: "Cookie dikirim tanpa flag Secure pada domain HTTPS.",
        });
      }
    }

    // Missing HSTS warning
    if (isHttps && !headersObj["strict-transport-security"]) {
      findings.push({
        severity: "LOW",
        title: "Strict-Transport-Security (HSTS) Belum Diterapkan",
        detail: "Domain belum memaksa peramban untuk selalu menggunakan HTTPS (Strict-Transport-Security).",
      });
    }

    // Server Info Disclosure
    if (headersObj["server"] || headersObj["x-powered-by"]) {
      const serverInfo = [headersObj["server"], headersObj["x-powered-by"]].filter(Boolean).join(" / ");
      findings.push({
        severity: "LOW",
        title: `Informasi Web Server Terekspos (${serverInfo})`,
        detail: "Header respons membocorkan detail software web server ke publik.",
      });
    }

    // If connection was completely aborted / timed out on first hop
    if (!finalResponse) {
      threatScore = Math.max(threatScore, 35);
    }

    // Normalize final threat score (0 - 100)
    threatScore = Math.min(100, Math.max(0, threatScore));

    let verdict: "AMAN" | "RENDAH" | "MENCURIGAKAN" | "BERBAHAYA" = "AMAN";
    let threatLevel = "Aman (Tingkat Kepercayaan Tinggi)";

    if (!finalResponse) {
      verdict = "MENCURIGAKAN";
      threatLevel = "Koneksi Timeout / Server Tidak Merespons";
    } else if (threatScore >= 70) {
      verdict = "BERBAHAYA";
      threatLevel = "Tinggi (Indikasi Kuat Phishing / Malware)";
    } else if (threatScore >= 40) {
      verdict = "MENCURIGAKAN";
      threatLevel = "Sedang (Pola Tidak Wajar / Risiko Potensial)";
    } else if (threatScore >= 15) {
      verdict = "RENDAH";
      threatLevel = "Rendah (Peringatan Minor)";
    } else {
      verdict = "AMAN";
      threatLevel = "Aman (Tidak Ditemukan Indikasi Ancaman)";
      findings.push({
        severity: "INFO",
        title: "Reputasi & Struktur URL Normal",
        detail: "Tidak ada pola phishing, brand impersonation, atau keanehan pengalihan yang terdeteksi.",
      });
    }

    // Security Headers Summary
    const securityHeaders = {
      hsts: headersObj["strict-transport-security"] ? "CONFIGURED" : "MISSING",
      csp: headersObj["content-security-policy"] ? "CONFIGURED" : "MISSING",
      xFrameOptions: headersObj["x-frame-options"] || "MISSING",
      xContentTypeOptions: headersObj["x-content-type-options"] ? "nosniff" : "MISSING",
      referrerPolicy: headersObj["referrer-policy"] || "MISSING",
      permissionsPolicy: headersObj["permissions-policy"] ? "CONFIGURED" : "MISSING",
    };

    const safetyRecommendations = [
      verdict === "BERBAHAYA" || verdict === "MENCURIGAKAN"
        ? "JANGAN memasukkan username, kata sandi, PIN, nomor kartu kredit, atau OTP pada situs ini."
        : "Pastikan selalu memeriksa keaslian sertifikat SSL dan domain resmi sebelum bertransaksi.",
      !isHttps ? "Hindari bertransaksi karena koneksi HTTP dapat disadap oleh siapa pun di jaringan yang sama." : "Koneksi HTTPS aktif dengan enkripsi lalu lintas data.",
      brandDetected ? `Kunjungi langsung situs resmi di https://${MONITORED_BRANDS.find(b => b.name === brandDetected)?.official}` : null,
      openDirectoryListing ? "Nonaktifkan fitur autoindex pada server web (misal: 'Options -Indexes' di Apache) untuk mencegah kebocoran file sensitif." : null,
      debugStackExposed ? "Setel environment produksi (APP_DEBUG=false / display_errors=Off) agar pesan error internal tidak terekspos." : null,
      mixedContentDetected ? "Ubah semua URL sumber daya aset (gambar/skrip) menjadi protokol HTTPS absolut atau protocol-relative (//)." : null,
    ].filter(Boolean) as string[];

    return NextResponse.json({
      success: true,
      provider: "Nexus AI URL Threat Intelligence & Phishing Guard",
      targetUrl,
      finalUrl: currentUrl,
      httpStatus: finalResponse ? finalResponse.status : 0,
      threatScore,
      verdict,
      threatLevel,
      timeout: !finalResponse,
      findings,
      suspiciousFindings: findings.map((f: any) => typeof f === "string" ? f : `[${f.severity}] ${f.title}: ${f.detail}`),
      brandImpersonation: brandDetected || null,
      passwordFieldsCount: hasPasswordInput ? 1 : 0,
      formsCount: formActions.length,
      vulnerabilitiesDetected: {
        openDirectoryListing,
        debugStackExposed,
        mixedContentDetected,
        clickjackingRisk,
        externalFormAction: formActionExternal,
      },
      domainIntel: {
        hostname,
        tld,
        isIpHost,
        isHttps,
        brandImpersonated: brandDetected,
      },
      pageDetails: {
        title: pageTitle || null,
        description: pageDescription || null,
        hasPasswordInput,
        formActionsCount: formActions.length,
      },
      redirectChain,
      securityHeaders,
      safetyRecommendations,
      contentType: headersObj["content-type"] || "-",
      contentLength: headersObj["content-length"] || "-",
      server: headersObj["server"] || "-",
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memindai URL: " + (err.message || "Unknown error") },
      { status: 500 }
    );
  }
}
