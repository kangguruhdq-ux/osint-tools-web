import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

declare global {
  var globalPrisma: PrismaClient | undefined;
  var globalMemoryDb: MemoryStore | undefined;
}

export const prisma =
  global.globalPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.globalPrisma = prisma;
}

let isPrismaOnline: boolean | null = null;

export async function safeDbQuery<T>(fn: (client: PrismaClient) => Promise<T>): Promise<T | null> {
  if (isPrismaOnline === false) {
    return null;
  }
  try {
    const result = await Promise.race([
      fn(prisma),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error("DB_TIMEOUT")), 300)),
    ]);
    isPrismaOnline = true;
    return result as T;
  } catch {
    isPrismaOnline = false;
    return null;
  }
}

// In-Memory fallback store for dev/testing when external Postgres is not yet connected
export interface MockUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "USER" | "ANALYST" | "ADMIN" | "SUPERADMIN";
  status?: "ACTIVE" | "SUSPENDED" | "BANNED";
  avatar?: string;
  createdAt: Date;
}

export interface MockInvestigation {
  id: string;
  userId: string;
  title: string;
  description: string;
  tags: string[];
  status: string;
  priority: string;
  analystNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockScanResult {
  id: string;
  userId?: string;
  investigationId?: string;
  toolId: string;
  target: string;
  data: any;
  summary: string;
  confidenceScore: number;
  sourceInfo: string;
  createdAt: Date;
}

export interface MockProvider {
  id: string;
  key: string;
  name: string;
  category: string;
  baseUrl?: string;
  status: "ACTIVE" | "CONFIGURATION_REQUIRED" | "ERROR" | "DISABLED";
  keyHint?: string;
  encryptedKey?: string;
  iv?: string;
  tag?: string;
}

class MemoryStore {
  users: Map<string, MockUser> = new Map();
  investigations: Map<string, MockInvestigation> = new Map();
  scanResults: MockScanResult[] = [];
  providers: Map<string, MockProvider> = new Map();
  auditLogs: any[] = [];
  keywordMonitors: any[] = [];
  reports: any[] = [];

  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), "data", "local-db.json");
    this.initDefaultSeed();
    this.loadFromDisk();
    // Pastikan akun default admin selalu tersedia jika belum ada di data tersimpan
    if (!this.users.has("admin@nexus-osint.io")) {
      this.initDefaultSeed();
    }
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.users && Array.isArray(parsed.users)) {
          for (const [k, v] of parsed.users) {
            this.users.set(k, { ...v, createdAt: new Date(v.createdAt) });
          }
        }
        if (parsed.investigations && Array.isArray(parsed.investigations)) {
          for (const [k, v] of parsed.investigations) {
            this.investigations.set(k, {
              ...v,
              createdAt: new Date(v.createdAt),
              updatedAt: new Date(v.updatedAt),
            });
          }
        }
        if (parsed.scanResults && Array.isArray(parsed.scanResults)) {
          this.scanResults = parsed.scanResults.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
          }));
        }
        if (parsed.providers && Array.isArray(parsed.providers)) {
          for (const [k, v] of parsed.providers) {
            this.providers.set(k, v);
          }
        }
        if (parsed.auditLogs && Array.isArray(parsed.auditLogs)) {
          this.auditLogs = parsed.auditLogs.map((a: any) => ({
            ...a,
            createdAt: new Date(a.createdAt),
          }));
        }
        if (parsed.keywordMonitors && Array.isArray(parsed.keywordMonitors)) {
          this.keywordMonitors = parsed.keywordMonitors.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          }));
        }
        if (parsed.reports && Array.isArray(parsed.reports)) {
          this.reports = parsed.reports.map((r: any) => ({
            ...r,
            generatedAt: new Date(r.generatedAt),
          }));
        }
      }
    } catch (err) {
      console.warn("[LocalDB] Gagal memuat snapshot database dari disk:", err);
    }
  }

  saveToDisk() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        users: Array.from(this.users.entries()),
        investigations: Array.from(this.investigations.entries()),
        scanResults: this.scanResults.slice(0, 500),
        providers: Array.from(this.providers.entries()),
        auditLogs: this.auditLogs.slice(0, 1000),
        keywordMonitors: this.keywordMonitors,
        reports: this.reports,
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.warn("[LocalDB] Gagal menyimpan snapshot database ke disk:", err);
    }
  }

  save() {
    this.saveToDisk();
  }

  private initDefaultSeed() {
    // Admin user: admin@nexus-osint.io / Admin123!
    this.users.set("admin@nexus-osint.io", {
      id: "u-admin-01",
      email: "admin@nexus-osint.io",
      name: "Chief Admin Analyst",
      passwordHash: "$2b$10$cJegmLi0lL1PXJC7IjR4xOKM8kQoKGBufuKaszfvqrTZc9EDoRZyO", // Admin123!
      role: "ADMIN",
      createdAt: new Date(),
    });

    // Regular Analyst: analyst@nexus-osint.io / Analyst123!
    this.users.set("analyst@nexus-osint.io", {
      id: "u-analyst-02",
      email: "analyst@nexus-osint.io",
      name: "Senior OSINT Analyst",
      passwordHash: "$2b$10$VI/jMEGl8w6wq4FCCpw8uOAw5Si0DHRFOFCk2VnFbhgQoIae4WjAu", // Analyst123!
      role: "ANALYST",
      createdAt: new Date(),
    });

    // Sample Active Investigation
    this.investigations.set("inv-001", {
      id: "inv-001",
      userId: "u-admin-01",
      title: "Investigasi Domain & Infrastruktur Target A",
      description: "Analisis pasif reputasi domain, sertifikat TLS, DNS record, dan pemetaan ASN server.",
      tags: ["cyber-threat", "domain-recon", "phishing-check"],
      status: "OPEN",
      priority: "HIGH",
      analystNotes: "Domain terindikasi menggunakan nameserver Cloudflare dan sertifikat Let's Encrypt baru.",
      createdAt: new Date(Date.now() - 3600000 * 24),
      updatedAt: new Date(),
    });

    // Default API Providers
    const defaultProviders: MockProvider[] = [
      {
        id: "prov-01",
        key: "rapidapi",
        name: "RapidAPI Media Downloader Hub",
        category: "downloader",
        baseUrl: "https://social-download-all-in-one.p.rapidapi.com",
        status: "CONFIGURATION_REQUIRED",
      },
      {
        id: "prov-02",
        key: "cobalt",
        name: "Cobalt Downloader Legal API",
        category: "downloader",
        baseUrl: "https://api.cobalt.tools",
        status: "CONFIGURATION_REQUIRED",
      },
      {
        id: "prov-03",
        key: "openai",
        name: "OpenAI GPT-4o / Analysis API",
        category: "ai",
        baseUrl: "https://api.openai.com/v1",
        status: "CONFIGURATION_REQUIRED",
      },
      {
        id: "prov-04",
        key: "gemini",
        name: "Google Gemini 1.5 Pro API",
        category: "ai",
        baseUrl: "https://generativelanguage.googleapis.com",
        status: "CONFIGURATION_REQUIRED",
      },
      {
        id: "prov-05",
        key: "native-dns",
        name: "Native Node.js DNS Resolver",
        category: "osint",
        status: "ACTIVE",
      },
      {
        id: "prov-06",
        key: "native-whois",
        name: "Direct Socket WHOIS (IANA/TLD)",
        category: "osint",
        status: "ACTIVE",
      },
      {
        id: "prov-07",
        key: "native-ip",
        name: "Public IP Geolocation & RDAP",
        category: "osint",
        status: "ACTIVE",
      },
    ];

    for (const p of defaultProviders) {
      this.providers.set(p.key, p);
    }
  }
}

export const memoryDb: MemoryStore =
  global.globalMemoryDb || new MemoryStore();

if (process.env.NODE_ENV !== "production") {
  global.globalMemoryDb = memoryDb;
}
