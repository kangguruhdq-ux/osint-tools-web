import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const HeadersSchema = z.object({
  url: z.string().min(3, "URL target wajib diisi."),
});

interface HeaderCheckItem {
  name: string;
  key: string;
  present: boolean;
  value: string | null;
  status: "SECURE" | "WARNING" | "MISSING";
  severity: "Tinggi" | "Sedang" | "Rendah";
  description: string;
  recommendation: string;
  impact: string;
  score: number;
}


// Multi-stage fetch with fallback to avoid "Connection Timeout / Abort" crash
async function fetchHeadersResilient(
  targetUrl: string
): Promise<{ response: Response | null; finalUrl: string; errorReason?: string }> {
  const parsed = new URL(targetUrl);
  const isOriginallyHttps = parsed.protocol === "https:";

  const attempts: { url: string; method: string; timeoutMs: number }[] = isOriginallyHttps
    ? [
        { url: targetUrl, method: "GET", timeoutMs: 5000 },
        { url: targetUrl.replace(/^https:/i, "http:"), method: "GET", timeoutMs: 4000 },
      ]
    : [
        { url: targetUrl, method: "GET", timeoutMs: 5000 },
        { url: targetUrl.replace(/^http:/i, "https:"), method: "GET", timeoutMs: 4000 },
      ];

  let lastError = "Request failed";

  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, {
        method: attempt.method,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 NexusHeaderAuditor/2.5",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        },
        signal: AbortSignal.timeout(attempt.timeoutMs),
        redirect: "follow",
      });

      if (res) {
        return { response: res, finalUrl: res.url || attempt.url };
      }
    } catch (e: any) {
      lastError = e?.message || "Timeout / Abort";
    }
  }

  return { response: null, finalUrl: targetUrl, errorReason: lastError };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = HeadersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let rawInput = parsed.data.url.trim();
    if (!rawInput.startsWith("http://") && !rawInput.startsWith("https://")) {
      rawInput = "https://" + rawInput;
    }

    // SSRF Check
    const ssrf = await validateUrlSafe(rawInput);
    if (!ssrf.safe) {
      return NextResponse.json({ success: false, error: ssrf.error }, { status: 403 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawInput);
    } catch {
      return NextResponse.json({ success: false, error: "Format URL tidak valid." }, { status: 400 });
    }

    const { response: res, finalUrl, errorReason } = await fetchHeadersResilient(rawInput);

    // Standard recommended remediation configs
    const recommendedConfigs = {
      nginx: `# Konfigurasi Keamanan Header Nginx (Letakkan di blok server { ... })
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self';" always;
server_tokens off; # Sembunyikan versi Nginx`,
      apache: `# Konfigurasi Keamanan Header Apache (.htaccess atau httpd.conf)
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  Header always set Cross-Origin-Resource-Policy "same-origin"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  Header unset X-Powered-By
  ServerSignature Off
</IfModule>`,
      nextjs: `// Konfigurasi Next.js (next.config.js / next.config.ts)
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};`,
      caddy: `# Konfigurasi Caddy Web Server (Caddyfile)
example.com {
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
        -Server
    }
}`,
    };

    // If all connection attempts failed: do not throw 500! Host timed out or is firewalled.
    if (!res) {
      const dummyChecked: HeaderCheckItem[] = [
        {
          name: "Strict-Transport-Security (HSTS)",
          key: "strict-transport-security",
          present: false,
          value: null,
          status: "MISSING",
          severity: "Tinggi",
          description: "Memaksa peramban berkomunikasi secara eksklusif lewat HTTPS terenkripsi.",
          recommendation: "Tambahkan Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
          impact: "Mencegah serangan Man-in-the-Middle (MitM) dan SSL Stripping.",
          score: 0,
        },
        {
          name: "Content-Security-Policy (CSP)",
          key: "content-security-policy",
          present: false,
          value: null,
          status: "MISSING",
          severity: "Tinggi",
          description: "Membatasi sumber daya (skrip, gambar, stylesheet) yang diizinkan untuk dimuat dan dieksekusi.",
          recommendation: "Terapkan Content-Security-Policy dengan default-src 'self' dan batasi skrip luar.",
          impact: "Pertahanan utama terhadap Cross-Site Scripting (XSS) dan injeksi payload.",
          score: 0,
        },
        {
          name: "X-Frame-Options",
          key: "x-frame-options",
          present: false,
          value: null,
          status: "MISSING",
          severity: "Sedang",
          description: "Mengontrol perizinan rendering halaman dalam tag iframe atau frame.",
          recommendation: "Tambahkan header X-Frame-Options: SAMEORIGIN",
          impact: "Mencegah serangan Clickjacking dan pembajakan klik.",
          score: 0,
        },
        {
          name: "X-Content-Type-Options",
          key: "x-content-type-options",
          present: false,
          value: null,
          status: "MISSING",
          severity: "Sedang",
          description: "Mencegah peramban melakukan MIME-sniffing terhadap konten respons.",
          recommendation: "Tambahkan X-Content-Type-Options: nosniff",
          impact: "Mencegah file non-eksekutabel dipaksa berjalan sebagai JavaScript.",
          score: 0,
        },
        {
          name: "Referrer-Policy",
          key: "referrer-policy",
          present: false,
          value: null,
          status: "MISSING",
          severity: "Rendah",
          description: "Mengatur metadata referensi URL saat navigasi lintas domain.",
          recommendation: "Gunakan Referrer-Policy: strict-origin-when-cross-origin",
          impact: "Mencegah parameter query sensitif bocor ke pihak luar.",
          score: 0,
        },
        {
          name: "Permissions-Policy",
          key: "permissions-policy",
          present: false,
          value: null,
          status: "MISSING",
          severity: "Rendah",
          description: "Membatasi akses API sensorik perangkat pengguna (kamera, mikrofon, geolokasi).",
          recommendation: "Konfigurasikan Permissions-Policy: camera=(), microphone=(), geolocation=()",
          impact: "Mencegah penyalahgunaan izin perangkat pengguna oleh skrip pihak ketiga.",
          score: 0,
        },
        {
          name: "Cross-Origin-Opener-Policy (COOP)",
          key: "cross-origin-opener-policy",
          present: false,
          value: null,
          status: "MISSING",
          severity: "Sedang",
          description: "Mengisolasi konteks penjelajahan tab dari dokumen cross-origin.",
          recommendation: "Tambahkan Cross-Origin-Opener-Policy: same-origin",
          impact: "Melindungi dari serangan side-channel Spectre dan XS-Leaks.",
          score: 0,
        },
        {
          name: "Cross-Origin-Resource-Policy (CORP)",
          key: "cross-origin-resource-policy",
          present: false,
          value: null,
          status: "MISSING",
          severity: "Rendah",
          description: "Membatasi domain mana saja yang boleh memuat aset statis situs Anda.",
          recommendation: "Tambahkan Cross-Origin-Resource-Policy: same-origin",
          impact: "Mencegah pencurian aset dan kebocoran data cross-origin.",
          score: 0,
        },
      ];

      return NextResponse.json({
        success: true,
        provider: "Nexus HTTP Security Header & Intelligence Auditor",
        targetUrl: rawInput,
        url: rawInput,
        finalUrl,
        statusCode: 0,
        timeout: true,
        unreachable: true,
        connectionStatus: "TIMEOUT_OR_BLOCKED",
        diagnosticMessage: `Server tujuan (${parsedUrl.hostname}) terdaftar di DNS publik namun tidak merespons koneksi HTTP/HTTPS dalam batas waktu pemindaian (${errorReason || "Timeout / Aborted"}). Kemungkinan server memblokir scanner otomatis (Cloudflare / WAF), membatasi akses negara, atau port 80/443 sedang tidak aktif.`,
        grade: "F",
        score: 0,
        summary: {
          totalInspected: dummyChecked.length,
          configured: 0,
          warnings: 0,
          missing: dummyChecked.length,
          leakedHeadersCount: 0,
          serverLeakage: false,
        },
        headersChecked: dummyChecked,
        checks: dummyChecked,
        leakedHeaders: [],
        cookieSecurity: {
          totalCookies: 0,
          insecureCookies: [],
        },
        recommendedConfigs,
        remediationConfigs: recommendedConfigs,
        rawHeaders: {},
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }

    // Extract all headers
    const headersObj: Record<string, string> = {};
    res.headers.forEach((val, key) => {
      headersObj[key.toLowerCase()] = val;
    });

    const isHttps = finalUrl.startsWith("https://") || rawInput.startsWith("https://");

    // 1. HSTS Analysis
    const hstsRaw = headersObj["strict-transport-security"];
    let hstsStatus: "SECURE" | "WARNING" | "MISSING" = "MISSING";
    let hstsScore = 0;
    let hstsRec = "Tambahkan Strict-Transport-Security: max-age=31536000; includeSubDomains; preload";
    if (hstsRaw) {
      const maxAgeMatch = hstsRaw.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      const hasSubdomains = /includeSubDomains/i.test(hstsRaw);
      const hasPreload = /preload/i.test(hstsRaw);

      if (maxAge >= 31536000 && hasSubdomains) {
        hstsStatus = "SECURE";
        hstsScore = 20;
        hstsRec = hasPreload
          ? "HSTS terkonfigurasi optimal dengan direktif preload."
          : "Disarankan menambahkan direktif 'preload' untuk registrasi HSTS Preload list peramban.";
      } else if (maxAge > 0) {
        hstsStatus = "WARNING";
        hstsScore = 12;
        hstsRec = "Tingkatkan max-age minimal 1 tahun (31536000) dan sertakan includeSubDomains.";
      }
    } else if (!isHttps) {
      hstsRec = "Situs berjalan di HTTP biasa. Aktifkan sertifikat SSL/HTTPS terlebih dahulu sebelum menerapkan HSTS.";
    }

    // 2. CSP Analysis
    const cspRaw = headersObj["content-security-policy"];
    let cspStatus: "SECURE" | "WARNING" | "MISSING" = "MISSING";
    let cspScore = 0;
    let cspRec = "Terapkan Content-Security-Policy dengan default-src 'self' dan batasi skrip eksternal.";
    if (cspRaw) {
      const hasUnsafeInline = /'unsafe-inline'/i.test(cspRaw);
      const hasUnsafeEval = /'unsafe-eval'/i.test(cspRaw);
      const hasWildcard = /\s\*\s/i.test(cspRaw);

      if (hasUnsafeInline || hasUnsafeEval || hasWildcard) {
        cspStatus = "WARNING";
        cspScore = 15;
        const flaws = [
          hasUnsafeInline ? "'unsafe-inline' (risiko injeksi XSS)" : "",
          hasUnsafeEval ? "'unsafe-eval' (evaluasi string dinamis)" : "",
          hasWildcard ? "wildcard '*' (sumber eksternal terbuka)" : "",
        ]
          .filter(Boolean)
          .join(", ");
        cspRec = `CSP aktif namun memiliki kelemahan: ${flaws}. Gunakan Nonce/Hash sha256.`;
      } else {
        cspStatus = "SECURE";
        cspScore = 25;
        cspRec = "Kebijakan CSP ketat dan melindungi dari injeksi Cross-Site Scripting (XSS).";
      }
    }

    // 3. X-Frame-Options
    const xfoRaw = headersObj["x-frame-options"];
    let xfoStatus: "SECURE" | "WARNING" | "MISSING" = "MISSING";
    let xfoScore = 0;
    let xfoRec = "Tambahkan header X-Frame-Options: SAMEORIGIN atau DENY";
    if (xfoRaw) {
      const upper = xfoRaw.toUpperCase();
      if (upper.includes("DENY") || upper.includes("SAMEORIGIN")) {
        xfoStatus = "SECURE";
        xfoScore = 15;
        xfoRec = `Terkonfigurasi aman (${upper}). Mencegah situs disematkan dalam iframe phishing (Clickjacking).`;
      } else {
        xfoStatus = "WARNING";
        xfoScore = 8;
        xfoRec = "Nilai X-Frame-Options tidak standar. Gunakan DENY atau SAMEORIGIN.";
      }
    }

    // 4. X-Content-Type-Options
    const xctoRaw = headersObj["x-content-type-options"];
    const xctoPresent = Boolean(xctoRaw && xctoRaw.toLowerCase().includes("nosniff"));
    const xctoScore = xctoPresent ? 10 : 0;

    // 5. Referrer-Policy
    const refRaw = headersObj["referrer-policy"];
    let refStatus: "SECURE" | "WARNING" | "MISSING" = "MISSING";
    let refScore = 0;
    let refRec = "Gunakan Referrer-Policy: strict-origin-when-cross-origin";
    if (refRaw) {
      refStatus = "SECURE";
      refScore = 10;
      refRec = `Terkonfigurasi (${refRaw}). Melindungi parameter sensitif URL agar tidak bocor ke analitik luar.`;
    }

    // 6. Permissions-Policy
    const permRaw = headersObj["permissions-policy"];
    const permPresent = Boolean(permRaw);
    const permScore = permPresent ? 10 : 0;

    // 7. Cross-Origin-Opener-Policy (COOP)
    const coopRaw = headersObj["cross-origin-opener-policy"];
    const coopPresent = Boolean(coopRaw);
    const coopScore = coopPresent ? 5 : 0;

    // 8. Cross-Origin-Resource-Policy (CORP)
    const corpRaw = headersObj["cross-origin-resource-policy"];
    const corpPresent = Boolean(corpRaw);
    const corpScore = corpPresent ? 5 : 0;

    const headersChecked: HeaderCheckItem[] = [
      {
        name: "Strict-Transport-Security (HSTS)",
        key: "strict-transport-security",
        present: Boolean(hstsRaw),
        value: hstsRaw || null,
        status: hstsStatus,
        severity: "Tinggi",
        description: "Memaksa peramban berkomunikasi secara eksklusif lewat HTTPS terenkripsi.",
        recommendation: hstsRec,
        impact: "Mencegah serangan Man-in-the-Middle (MitM) dan SSL Stripping.",
        score: hstsScore,
      },
      {
        name: "Content-Security-Policy (CSP)",
        key: "content-security-policy",
        present: Boolean(cspRaw),
        value: cspRaw || null,
        status: cspStatus,
        severity: "Tinggi",
        description: "Membatasi sumber daya (skrip, gambar, stylesheet) yang diizinkan untuk dimuat dan dieksekusi.",
        recommendation: cspRec,
        impact: "Pertahanan utama terhadap Cross-Site Scripting (XSS) dan data exfiltration.",
        score: cspScore,
      },
      {
        name: "X-Frame-Options",
        key: "x-frame-options",
        present: Boolean(xfoRaw),
        value: xfoRaw || null,
        status: xfoStatus,
        severity: "Sedang",
        description: "Mengontrol apakah peramban diizinkan merender halaman dalam tag <frame>, <iframe>, atau <object>.",
        recommendation: xfoRec,
        impact: "Mencegah serangan Clickjacking dan pembajakan klik tersembunyi.",
        score: xfoScore,
      },
      {
        name: "X-Content-Type-Options",
        key: "x-content-type-options",
        present: xctoPresent,
        value: xctoRaw || null,
        status: xctoPresent ? "SECURE" : "MISSING",
        severity: "Sedang",
        description: "Mencegah peramban melakukan MIME-sniffing terhadap konten file respons.",
        recommendation: xctoPresent ? "Terkonfigurasi aman (nosniff)." : "Tambahkan X-Content-Type-Options: nosniff",
        impact: "Mencegah file teks/gambar yang diunggah dieksekusi sebagai skrip JavaScript berbahaya.",
        score: xctoScore,
      },
      {
        name: "Referrer-Policy",
        key: "referrer-policy",
        present: Boolean(refRaw),
        value: refRaw || null,
        status: refStatus,
        severity: "Rendah",
        description: "Mengatur seberapa banyak informasi referensi URL yang disertakan saat pengguna menavigasi ke luar domain.",
        recommendation: refRec,
        impact: "Mencegah token sesi atau data privat dalam URL query params bocor ke analitik pihak luar.",
        score: refScore,
      },
      {
        name: "Permissions-Policy",
        key: "permissions-policy",
        present: permPresent,
        value: permRaw || null,
        status: permPresent ? "SECURE" : "MISSING",
        severity: "Rendah",
        description: "Membatasi akses API sensorik perangkat pengguna (kamera, mikrofon, geolokasi, payment).",
        recommendation: permPresent
          ? "Terkonfigurasi aman."
          : "Konfigurasikan Permissions-Policy: camera=(), microphone=(), geolocation=()",
        impact: "Mengurangi celah penyalahgunaan privasi dan eksploitasi API hardware tanpa izin.",
        score: permScore,
      },
      {
        name: "Cross-Origin-Opener-Policy (COOP)",
        key: "cross-origin-opener-policy",
        present: coopPresent,
        value: coopRaw || null,
        status: coopPresent ? "SECURE" : "MISSING",
        severity: "Sedang",
        description: "Memastikan jendela tingkat atas tidak berbagi konteks penjelajahan dengan dokumen cross-origin.",
        recommendation: coopPresent ? "Terkonfigurasi." : "Disarankan menambahkan Cross-Origin-Opener-Policy: same-origin",
        impact: "Melindungi memori situs dari serangan timing attacks Spectre & XS-Leaks.",
        score: coopScore,
      },
      {
        name: "Cross-Origin-Resource-Policy (CORP)",
        key: "cross-origin-resource-policy",
        present: corpPresent,
        value: corpRaw || null,
        status: corpPresent ? "SECURE" : "MISSING",
        severity: "Rendah",
        description: "Mengontrol domain mana yang dapat membaca resource (file statis/gambar) dari situs Anda.",
        recommendation: corpPresent ? "Terkonfigurasi." : "Tambahkan Cross-Origin-Resource-Policy: same-origin atau same-site",
        impact: "Mencegah serangan Cross-Origin Data Leaks.",
        score: corpScore,
      },
    ];

    // Information leakage check
    const leakedHeaders: { header: string; value: string; risk: string }[] = [];
    if (headersObj["server"]) {
      leakedHeaders.push({
        header: "Server",
        value: headersObj["server"],
        risk: "Membocorkan jenis dan versi web server ke pemindai publik.",
      });
    }
    if (headersObj["x-powered-by"]) {
      leakedHeaders.push({
        header: "X-Powered-By",
        value: headersObj["x-powered-by"],
        risk: "Membocorkan teknologi backend (PHP, Express, ASP.NET, dll.) sehingga mempermudah eksploitasi bertarget.",
      });
    }
    if (headersObj["x-aspnet-version"]) {
      leakedHeaders.push({
        header: "X-AspNet-Version",
        value: headersObj["x-aspnet-version"],
        risk: "Membocorkan versi framework .NET spesifik.",
      });
    }
    if (headersObj["x-runtime"]) {
      leakedHeaders.push({
        header: "X-Runtime",
        value: headersObj["x-runtime"],
        risk: "Membocorkan latency eksekusi backend Ruby/Rails.",
      });
    }
    if (headersObj["x-generator"]) {
      leakedHeaders.push({
        header: "X-Generator",
        value: headersObj["x-generator"],
        risk: "Membocorkan platform CMS generator halaman (Drupal/WordPress).",
      });
    }

    // Cookie hygiene audit
    const rawSetCookie = res.headers.get("set-cookie") || "";
    const insecureCookies: { name: string; missingFlags: string[] }[] = [];
    if (rawSetCookie) {
      const cookieSegments = rawSetCookie.split(/,(?=\s*[a-zA-Z0-9_\-]+=)/);
      for (const cStr of cookieSegments) {
        const cName = cStr.split("=")[0]?.trim();
        if (!cName) continue;
        const missing: string[] = [];
        if (!/;\s*Secure/i.test(cStr) && isHttps) missing.push("Secure");
        if (!/;\s*HttpOnly/i.test(cStr)) missing.push("HttpOnly");
        if (!/;\s*SameSite=(Strict|Lax|None)/i.test(cStr)) missing.push("SameSite");

        if (missing.length > 0) {
          insecureCookies.push({ name: cName, missingFlags: missing });
        }
      }
    }

    // Penalty for information leaks and cookie gaps
    const leakagePenalty = leakedHeaders.length * 4 + Math.min(10, insecureCookies.length * 3);
    const rawScore = headersChecked.reduce((acc, c) => acc + c.score, 0);
    const finalScore = Math.max(0, Math.min(100, rawScore - leakagePenalty));

    let grade = "F";
    if (finalScore >= 90) grade = "A+";
    else if (finalScore >= 80) grade = "A";
    else if (finalScore >= 65) grade = "B";
    else if (finalScore >= 50) grade = "C";
    else if (finalScore >= 35) grade = "D";

    return NextResponse.json({
      success: true,
      provider: "Nexus HTTP Security Header & Intelligence Auditor",
      targetUrl: rawInput,
      url: rawInput,
      finalUrl,
      statusCode: res.status,
      grade,
      score: finalScore,
      summary: {
        totalInspected: headersChecked.length,
        configured: headersChecked.filter((h) => h.present && h.status === "SECURE").length,
        warnings: headersChecked.filter((h) => h.status === "WARNING").length,
        missing: headersChecked.filter((h) => h.status === "MISSING").length,
        leakedHeadersCount: leakedHeaders.length,
        serverLeakage: leakedHeaders.length > 0,
      },
      headersChecked,
      checks: headersChecked,
      leakedHeaders,
      cookieSecurity: {
        totalCookies: rawSetCookie ? 1 : 0,
        insecureCookies,
      },
      recommendedConfigs,
      remediationConfigs: recommendedConfigs,
      rawHeaders: headersObj,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal mengaudit security headers: " + (err.message || "Unknown error") },
      { status: 500 }
    );
  }
}
