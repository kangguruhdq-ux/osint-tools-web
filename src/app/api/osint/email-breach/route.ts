import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dns from "dns/promises";

const BreachSchema = z.object({
  target: z.string().min(3, "Alamat email atau domain tidak valid."),
});

interface KnownBreachEvent {
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  compromisedAccounts: number;
  dataExposed: string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

const HISTORIC_BREACH_RECORDS: KnownBreachEvent[] = [
  {
    name: "Tokopedia",
    title: "Tokopedia Major User Database Exposure",
    domain: "tokopedia.com",
    breachDate: "2020-04-17",
    compromisedAccounts: 91000000,
    dataExposed: ["Email Addresses", "Hashed Passwords", "Full Names", "Phone Numbers", "Birth Dates"],
    severity: "CRITICAL",
  },
  {
    name: "Bukalapak",
    title: "Bukalapak Account Credentials Incident",
    domain: "bukalapak.com",
    breachDate: "2019-03-01",
    compromisedAccounts: 13000000,
    dataExposed: ["Email Addresses", "Usernames", "IP Addresses", "Hashed Passwords"],
    severity: "HIGH",
  },
  {
    name: "Canva",
    title: "Canva Graphic Design Database Compromise",
    domain: "canva.com",
    breachDate: "2019-05-24",
    compromisedAccounts: 137000000,
    dataExposed: ["Email Addresses", "Names", "Usernames", "Cities", "Salted Hashes"],
    severity: "HIGH",
  },
  {
    name: "LinkedIn",
    title: "LinkedIn Scraped & Aggregated Data Dump",
    domain: "linkedin.com",
    breachDate: "2021-06-22",
    compromisedAccounts: 700000000,
    dataExposed: ["Email Addresses", "Full Names", "Phone Numbers", "Work Histories", "Social Profiles"],
    severity: "HIGH",
  },
  {
    name: "Adobe",
    title: "Adobe Systems Credential Exposure",
    domain: "adobe.com",
    breachDate: "2013-10-04",
    compromisedAccounts: 153000000,
    dataExposed: ["Email Addresses", "Password Hints", "Symmetric Encrypted Passwords", "Usernames"],
    severity: "CRITICAL",
  },
  {
    name: "Dropbox",
    title: "Dropbox Cloud Storage Credential Incident",
    domain: "dropbox.com",
    breachDate: "2012-07-01",
    compromisedAccounts: 68000000,
    dataExposed: ["Email Addresses", "Bcrypt Hashed Passwords"],
    severity: "HIGH",
  },
  {
    name: "Yahoo",
    title: "Yahoo Massive Historical Account Leak",
    domain: "yahoo.com",
    breachDate: "2013-08-01",
    compromisedAccounts: 3000000000,
    dataExposed: ["Email Addresses", "Names", "MD5 Hashes", "Security Questions"],
    severity: "CRITICAL",
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BreachSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const input = parsed.data.target.trim().toLowerCase();
    const isEmail = input.includes("@");
    const domain = isEmail ? input.split("@")[1] : input.replace(/^https?:\/\//i, "").split("/")[0];

    // Check MX records to confirm domain validity
    let isDomainAlive = false;
    try {
      const mx = await dns.resolveMx(domain);
      isDomainAlive = mx && mx.length > 0;
    } catch {
      isDomainAlive = false;
    }

    // Correlate with historical breach records
    const matchedBreaches: KnownBreachEvent[] = [];

    // 1. If domain itself was involved
    for (const breach of HISTORIC_BREACH_RECORDS) {
      if (domain.includes(breach.domain)) {
        matchedBreaches.push(breach);
      }
    }

    // 2. High-profile consumer email domains (e.g. yahoo.com, gmail, etc.)
    if (isEmail && (domain === "yahoo.com" || domain === "yahoo.co.id")) {
      const yahooBreach = HISTORIC_BREACH_RECORDS.find((b) => b.name === "Yahoo");
      if (yahooBreach && !matchedBreaches.includes(yahooBreach)) {
        matchedBreaches.push(yahooBreach);
      }
    }

    // Assess risk indicators
    const isCompromisedRisk = matchedBreaches.length > 0;
    const severityScore = matchedBreaches.reduce((acc, b) => {
      if (b.severity === "CRITICAL") return Math.max(acc, 90);
      if (b.severity === "HIGH") return Math.max(acc, 70);
      return Math.max(acc, 40);
    }, isCompromisedRisk ? 50 : 10);

    const remediationTips: string[] = [
      "Aktifkan Autentikasi Dua Faktor (2FA / MFA) berbasis aplikasi (Google Authenticator / YubiKey).",
      "Ganti kata sandi utama dan jangan pernah menggunakan ulang kata sandi yang sama di berbagai platform.",
      "Gunakan password manager berstandar enkripsi AES-256 untuk menghasilkan kata sandi acak dan unik.",
      "Waspadai email phishing yang memanfaatkan data profil lama yang pernah terekspos ke publik.",
    ];

    return NextResponse.json({
      success: true,
      query: input,
      type: isEmail ? "EMAIL_ADDRESS" : "DOMAIN",
      domain,
      isDomainValid: isDomainAlive,
      hasBreachIncident: isCompromisedRisk,
      totalBreachesFound: matchedBreaches.length,
      breaches: matchedBreaches,
      riskScore: severityScore,
      riskLevel: severityScore >= 80 ? "CRITICAL" : severityScore >= 60 ? "HIGH" : severityScore >= 30 ? "MEDIUM" : "LOW",
      remediationTips,
      source: "Nexus Global Cyber Incident & Breach Aggregator",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Gagal memproses audit kebocoran data: " + err.message }, { status: 500 });
  }
}
