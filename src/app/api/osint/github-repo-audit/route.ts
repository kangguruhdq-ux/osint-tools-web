import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getSystemSetting,
  persistAuditLogToDb,
} from "@/lib/db";
import { authenticateRequest } from "@/lib/auth/session";

const GithubRepoSchema = z.object({
  repo: z.string().min(1, "URL atau nama repositori GitHub wajib diisi."),
});

interface ThreatFinding {
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  detail: string;
  filePath?: string;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    // 1. Check if tool is disabled by administrator
    const isEnabled = (await getSystemSetting("tool_github_repo_audit_enabled", "true")) !== "false";
    if (!isEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: "Alat GitHub Repo Security Auditor saat ini dinonaktifkan sementara oleh Administrator Sistem untuk pemeliharaan keamanan.",
          isDisabledByAdmin: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = GithubRepoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // 2. Parse owner and repo cleanly
    let input = parsed.data.repo.trim();
    // Normalize URL if provided
    if (input.startsWith("http://") || input.startsWith("https://")) {
      try {
        const urlObj = new URL(input);
        const parts = urlObj.pathname.split("/").filter(Boolean);
        if (parts.length >= 2) {
          input = `${parts[0]}/${parts[1].replace(/\.git$/, "")}`;
        }
      } catch {
        // fallback to input
      }
    }
    input = input.replace(/^github\.com\//i, "").replace(/\.git$/i, "").replace(/^\/+|\/+$/g, "");

    const repoParts = input.split("/");
    if (repoParts.length !== 2 || !repoParts[0] || !repoParts[1]) {
      return NextResponse.json(
        {
          success: false,
          error: "Format repositori tidak valid. Gunakan format 'owner/repo' atau URL penuh 'https://github.com/owner/repo'.",
        },
        { status: 400 }
      );
    }

    const [owner, repoName] = repoParts;

    // 3. Prepare GitHub API headers (including admin PAT token if configured)
    const adminPat = (await getSystemSetting("github_pat_token", "")) || process.env.GITHUB_TOKEN || "";
    const headers: Record<string, string> = {
      "User-Agent": "NexusOSINT-RepoSecurityAuditor/2.0",
      Accept: "application/vnd.github.v3+json",
    };
    if (adminPat) {
      headers["Authorization"] = `Bearer ${adminPat.trim()}`;
    }

    // 4. Fetch Repository Profile & Metadata
    const repoRes = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`,
      { headers, signal: AbortSignal.timeout(8000) }
    );

    if (repoRes.status === 404) {
      return NextResponse.json(
        {
          success: false,
          error: `Repositori '${owner}/${repoName}' tidak ditemukan atau bersifat privat di GitHub.`,
        },
        { status: 404 }
      );
    }

    if (repoRes.status === 403 || repoRes.status === 429) {
      const resetTime = repoRes.headers.get("x-ratelimit-reset");
      return NextResponse.json(
        {
          success: false,
          error: "Batas permintaan (rate limit) GitHub API terlampaui. Administrator dapat mengonfigurasikan GitHub Personal Access Token (PAT) di Admin Console untuk batas 5.000 req/jam.",
          rateLimited: true,
          resetAt: resetTime ? new Date(Number(resetTime) * 1000).toISOString() : undefined,
        },
        { status: 429 }
      );
    }

    if (!repoRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Gagal mengakses GitHub API: HTTP ${repoRes.status} ${repoRes.statusText}`,
        },
        { status: 502 }
      );
    }

    const repoData = await repoRes.json();
    const rateLimitRemaining = Number(repoRes.headers.get("x-ratelimit-remaining") || 60);

    const findings: ThreatFinding[] = [];
    const suspiciousFiles: Array<{ path: string; type: string; reason: string }> = [];
    const codeIndicators: Array<{ rule: string; pattern: string; file: string }> = [];
    let score = 100;

    // --- Heuristic Check 1: Repo Metadata & Anomalies ---
    const createdAt = new Date(repoData.created_at);
    const daysSinceCreation = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 3600 * 24)));
    const stars = repoData.stargazers_count || 0;
    const forks = repoData.forks_count || 0;
    const hasIssues = repoData.has_issues;
    const isArchived = repoData.archived;
    const isFork = repoData.fork;
    const desc = repoData.description || "";

    // Anomaly: young repo with disproportionate stars (fake starbot pattern)
    if (daysSinceCreation < 21 && stars > 150) {
      score -= 25;
      findings.push({
        category: "Metadata Anomaly",
        severity: "HIGH",
        title: "Indikasi Fake Starburst / Bintang Palsu",
        detail: `Repositori baru dibuat ${daysSinceCreation} hari yang lalu namun telah memiliki ${stars} stars. Pola ini umum digunakan oleh threat actor untuk meningkatkan kepercayaan korban terhadap script berbahaya.`,
      });
    }

    // Disabled issues in a public tool
    if (!hasIssues && stars > 50) {
      score -= 15;
      findings.push({
        category: "Transparency",
        severity: "MEDIUM",
        title: "Tab Issue GitHub Dinonaktifkan",
        detail: "Fitur Issues dinonaktifkan oleh pemilik repo. Teknik ini kerap dipakai pembuat malware agar korban lain tidak dapat memberi tahu bahaya di repositori.",
      });
    }

    // Trigger keywords in description
    const descLower = desc.toLowerCase();
    const suspiciousKeywords = [
      { word: "stealer", level: "CRITICAL", title: "Deskripsi Menyebutkan Stealer" },
      { word: "token grabber", level: "CRITICAL", title: "Deskripsi Menyebutkan Token Grabber" },
      { word: "hwid spoofer", level: "HIGH", title: "Deskripsi Mengindikasikan HWID Spoofer / Hack" },
      { word: "password:", level: "HIGH", title: "Deskripsi Mengandung Kunci Password Arsip" },
      { word: "pass:", level: "HIGH", title: "Deskripsi Mengandung Kunci Password Arsip" },
      { word: "disable antivirus", level: "CRITICAL", title: "Instruksi Menonaktifkan Antivirus" },
      { word: "turn off defender", level: "CRITICAL", title: "Instruksi Menonaktifkan Windows Defender" },
      { word: "free nitro", level: "HIGH", title: "Umpan Free Discord Nitro" },
      { word: "t.me/", level: "MEDIUM", title: "Tautan Langsung ke Saluran Telegram Luar" },
    ];

    for (const kw of suspiciousKeywords) {
      if (descLower.includes(kw.word)) {
        if (kw.level === "CRITICAL") score -= 35;
        else if (kw.level === "HIGH") score -= 20;
        else score -= 10;

        findings.push({
          category: "Deskripsi & Metadata",
          severity: kw.level as any,
          title: kw.title,
          detail: `Ditemukan kata kunci mencurigakan "${kw.word}" pada deskripsi repositori.`,
        });
      }
    }

    // --- Heuristic Check 2: File Tree Inspection (Recursive) ---
    const defaultBranch = repoData.default_branch || "main";
    let treeFiles: Array<{ path: string; size?: number; type: string }> = [];

    try {
      const treeRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      if (treeRes.ok) {
        const treeData = await treeRes.json();
        if (Array.isArray(treeData.tree)) {
          treeFiles = treeData.tree;
        }
      }
    } catch {
      // ignore tree error
    }

    // Dangerous extensions
    const dangerousExecExts = [".exe", ".scr", ".bat", ".cmd", ".pif", ".vbs", ".vbe", ".hta", ".ps1", ".apk", ".dll"];
    const dangerousArchives = [".rar", ".7z", ".iso", ".img"];

    for (const item of treeFiles) {
      if (item.type !== "blob") continue;
      const lowerPath = item.path.toLowerCase();

      // Check double extensions (e.g., photo.png.exe)
      if (/\.[a-z0-9]+\.(exe|scr|bat|cmd|vbs|ps1|pif)$/i.test(lowerPath)) {
        score -= 40;
        findings.push({
          category: "Evasion / Obfuscation",
          severity: "CRITICAL",
          title: "Teknik Double Extension Terdeteksi",
          detail: `File menyamarkan ekstensi berbahaya: '${item.path}'.`,
          filePath: item.path,
        });
        suspiciousFiles.push({
          path: item.path,
          type: "Double Extension",
          reason: "Menyamarkan executable sebagai file dokumen/gambar",
        });
      }

      // Check dangerous executable binary inside repository
      for (const ext of dangerousExecExts) {
        if (lowerPath.endsWith(ext)) {
          const isPowerShellOrBatch = ext === ".bat" || ext === ".cmd" || ext === ".ps1";
          const penalty = isPowerShellOrBatch ? 15 : 30;
          score -= penalty;

          findings.push({
            category: "Dangerous Binary / Script",
            severity: isPowerShellOrBatch ? "HIGH" : "CRITICAL",
            title: `File Biner / Script Eksekusi (${ext}) Ditemukan`,
            detail: `Repositori memuat file eksekusi '${item.path}'. Repositori open-source murni umumnya tidak membagikan file binary mentah tanpa build pipeline.`,
            filePath: item.path,
          });
          suspiciousFiles.push({
            path: item.path,
            type: ext.toUpperCase(),
            reason: isPowerShellOrBatch ? "Script otomatisasi Windows berisiko tinggi" : "File executable biner berpotensi trojan",
          });
          break;
        }
      }

      // Check suspicious filenames
      const suspiciousNames = ["grabber", "stealer", "webhook", "inject", "payload", "stub", "bypass", "crypter", "spoofer"];
      for (const sName of suspiciousNames) {
        if (lowerPath.includes(sName)) {
          score -= 20;
          findings.push({
            category: "Malware Signature Name",
            severity: "HIGH",
            title: `Pola Nama Malware '${sName}' Ditemukan`,
            detail: `Nama file '${item.path}' cocok dengan nomenklatur alat serangan/stealer.`,
            filePath: item.path,
          });
          break;
        }
      }
    }

    // --- Heuristic Check 3: Content Pattern Scanner for Webhooks & Stealers ---
    // Pick up to 3 candidate script files or README to inspect content
    const inspectCandidates = treeFiles
      .filter((f) => {
        const lp = f.path.toLowerCase();
        return (
          lp.endsWith(".py") ||
          lp.endsWith(".js") ||
          lp.endsWith(".ps1") ||
          lp.endsWith(".bat") ||
          lp.endsWith(".vbs") ||
          lp === "readme.md"
        );
      })
      .slice(0, 4);

    for (const cand of inspectCandidates) {
      try {
        const rawRes = await fetch(
          `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/${encodeURIComponent(defaultBranch)}/${encodeURIComponent(cand.path)}`,
          { headers: { "User-Agent": "NexusOSINT-RepoSecurityAuditor/2.0" }, signal: AbortSignal.timeout(5000) }
        );
        if (rawRes.ok) {
          const content = await rawRes.text();

          // 1. Check Discord Webhook
          const discordMatch = content.match(/discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/i);
          if (discordMatch) {
            score -= 50;
            findings.push({
              category: "Data Exfiltration",
              severity: "CRITICAL",
              title: "Discord Webhook Exfiltration Endpoint Terdeteksi",
              detail: `Ditemukan URL Discord Webhook aktif pada file '${cand.path}'. Ini merupakan indikator kuat malware stealers (mengekstrak sandi browser, token, atau session korban ke server Discord).`,
              filePath: cand.path,
            });
            codeIndicators.push({
              rule: "DISCORD_WEBHOOK_EXFILTRATION",
              pattern: discordMatch[0].slice(0, 35) + "••••••••",
              file: cand.path,
            });
          }

          // 2. Check Telegram Bot Exfiltration
          const telegramMatch = content.match(/api\.telegram\.org\/bot\d+:[A-Za-z0-9_-]+/i);
          if (telegramMatch) {
            score -= 45;
            findings.push({
              category: "Data Exfiltration",
              severity: "CRITICAL",
              title: "Telegram Bot Exfiltration Endpoint Terdeteksi",
              detail: `Ditemukan bot token Telegram untuk pengiriman data rahasia pada file '${cand.path}'.`,
              filePath: cand.path,
            });
            codeIndicators.push({
              rule: "TELEGRAM_BOT_EXFILTRATION",
              pattern: telegramMatch[0].slice(0, 30) + "••••••••",
              file: cand.path,
            });
          }

          // 3. Check Credential / Token Harvesting Patterns
          const harvestMatch = content.match(/(?:leveldb|discordtoken|passwords\.txt|cookies\.sqlite|exodus\.wallet|metamask)/i);
          if (harvestMatch) {
            score -= 35;
            findings.push({
              category: "Credential Stealing Pattern",
              severity: "HIGH",
              title: "Pola Pembacaan Kredensial Browser / Dompet Crypto",
              detail: `Ditemukan pola pembacaan penyimpanan data sensitif (${harvestMatch[0]}) pada '${cand.path}'.`,
              filePath: cand.path,
            });
            codeIndicators.push({
              rule: "CREDENTIAL_HARVESTING_KEYWORD",
              pattern: harvestMatch[0],
              file: cand.path,
            });
          }

          // 4. Obfuscation detection
          const obfMatch = content.match(/(?:eval\(String\.fromCharCode|powershell.*-[eE]nc|powershell.*-WindowStyle\s+Hidden|certutil\s+-(?:urlcache|decode))/i);
          if (obfMatch) {
            score -= 40;
            findings.push({
              category: "Obfuscation & Defense Evasion",
              severity: "CRITICAL",
              title: "Perintah Obfuskasi / PowerShell Tersembunyi",
              detail: `Ditemukan mekanisme eksekusi tersembunyi (${obfMatch[0].slice(0, 30)}) pada file '${cand.path}'.`,
              filePath: cand.path,
            });
            codeIndicators.push({
              rule: "OBFUSCATED_EXECUTION_COMMAND",
              pattern: obfMatch[0],
              file: cand.path,
            });
          }
        }
      } catch {
        // ignore raw fetch error
      }
    }

    // --- Heuristic Check 4: Releases Inspection ---
    let releasesList: any[] = [];
    try {
      const relRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/releases?per_page=3`,
        { headers, signal: AbortSignal.timeout(6000) }
      );
      if (relRes.ok) {
        releasesList = await relRes.json();
      }
    } catch {
      // ignore release error
    }

    let suspiciousReleasesFound = 0;
    if (Array.isArray(releasesList) && releasesList.length > 0) {
      for (const rel of releasesList) {
        const bodyLower = (rel.body || "").toLowerCase();
        if (bodyLower.includes("password:") || bodyLower.includes("pass:") || bodyLower.includes("pass is") || bodyLower.includes("password is")) {
          score -= 30;
          suspiciousReleasesFound++;
          findings.push({
            category: "Release Security",
            severity: "CRITICAL",
            title: "Arsip Rilis Dilindungi Password (Bypass Antivirus)",
            detail: `Rilis '${rel.name || rel.tag_name}' memuat petunjuk password arsip. Teknik ini umum digunakan threat actor untuk mencegah deteksi virus scanner oleh GitHub/browser.`,
          });
        }
      }
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine Status
    let status: "AMAN" | "WASPADA" | "BERBAHAYA" = "AMAN";
    let summary = "";

    if (score >= 85) {
      status = "AMAN";
      summary = `Repositori ${owner}/${repoName} tergolong AMAN. Tidak ditemukan signature malware, webhook exfiltration, file eksekusi ganda, atau anomali reputasi bintang. Struktur proyek memenuhi standar repositori open source bersih.`;
    } else if (score >= 50) {
      status = "WASPADA";
      summary = `Repositori ${owner}/${repoName} tergolong WASPADA (Perlu Kehati-hatian). Terdeteksi beberapa indikator risiko seperti file script otomatisasi, konfigurasi tidak lazim, atau rilis biner yang memerlukan audit manual sebelum dieksekusi.`;
    } else {
      status = "BERBAHAYA";
      summary = `PERINGATAN TINGGI: Repositori ${owner}/${repoName} teridentifikasi BERBAHAYA! Terdeteksi indikator malware aktif seperti exfiltration webhook, script stealer kredensial, obfuskasi kode, atau arsip release yang disamarkan. JANGAN unduh atau jalankan kode dari repositori ini!`;
    }

    // Build recommendations
    const recommendations: string[] = [];
    if (status === "BERBAHAYA") {
      recommendations.push("JANGAN PERNAH menjalankan script atau file executable (.exe, .bat, .ps1, .vbs) dari repositori ini.");
      recommendations.push("Laporkan (Report) repositori ini ke tim GitHub Trust & Safety dengan kategori 'Malware or exploit'.");
      recommendations.push("Jika Anda telah menjalankan kode dari repo ini, segera ganti semua token Discord, password browser, dan periksa sesi aktif akun Anda.");
    } else if (status === "WASPADA") {
      recommendations.push("Tinjau setiap baris file script (.ps1/.bat) dan dependensi sebelum melakukan clone atau build.");
      recommendations.push("Jalankan di lingkungan sandbox/VM terisolasi tanpa akses ke jaringan lokal atau kredensial pribadi.");
      recommendations.push("Periksa riwayat commit dan profile pengunggah untuk memverifikasi reputasi author.");
    } else {
      recommendations.push("Repositori memenuhi standar keamanan dasar dan tidak memiliki indikator malware publik.");
      recommendations.push("Tetap terapkan praktik aman dengan meninjau file 'package.json' / 'requirements.txt' sebelum instalasi dependensi.");
    }

    // Persist audit log
    const authUser = await authenticateRequest(req);
    await persistAuditLogToDb({
      id: "aud-" + Date.now(),
      userId: authUser?.userId || "u-guest",
      action: "GITHUB_REPO_SECURITY_AUDIT",
      resourceType: "TOOL",
      resourceId: `${owner}/${repoName}`,
      status: "SUCCESS",
      details: {
        repo: `${owner}/${repoName}`,
        score,
        status,
        findingsCount: findings.length,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        target: `${owner}/${repoName}`,
        status,
        score,
        summary,
        repo: {
          fullName: repoData.full_name,
          owner: repoData.owner?.login,
          ownerAvatar: repoData.owner?.avatar_url,
          name: repoData.name,
          description: repoData.description || "Tidak ada deskripsi",
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          openIssues: repoData.open_issues_count,
          watchers: repoData.watchers_count,
          defaultBranch: repoData.default_branch,
          license: repoData.license?.name || "Tidak ada lisensi publik",
          createdAt: repoData.created_at?.split("T")[0],
          updatedAt: repoData.updated_at?.split("T")[0],
          pushedAt: repoData.pushed_at?.split("T")[0],
          isArchived: repoData.archived,
          isFork: repoData.fork,
          htmlUrl: repoData.html_url,
          sizeKb: repoData.size,
        },
        threatFindings: findings,
        suspiciousFiles,
        codeIndicators,
        recommendations,
        scanStats: {
          totalFilesScanned: treeFiles.length,
          releasesChecked: releasesList.length,
          rateLimitRemaining,
          executionTimeMs: Date.now() - startTime,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Gagal melakukan audit keamanan repositori: " + (err.message || "Unknown error"),
      },
      { status: 500 }
    );
  }
}
