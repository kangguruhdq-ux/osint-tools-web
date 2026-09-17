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
  private _users: Map<string, MockUser> = new Map();
  private _investigations: Map<string, MockInvestigation> = new Map();
  private _scanResults: MockScanResult[] = [];
  private _providers: Map<string, MockProvider> = new Map();
  private _auditLogs: any[] = [];
  private _keywordMonitors: any[] = [];
  private _reports: any[] = [];

  private dbPath: string;
  private lastMtime: number = 0;

  constructor() {
    const isVercel = !!process.env.VERCEL;
    this.dbPath = isVercel
      ? path.join("/tmp", "local-db.json")
      : path.join(process.cwd(), "data", "local-db.json");

    // Ensure data directory exists
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {}

    // Load from disk if snapshot file exists, otherwise seed initial data and save
    if (fs.existsSync(this.dbPath)) {
      this.loadFromDisk();
    } else {
      this.initDefaultSeed();
      this.saveToDisk();
    }

    // Safety fallback: ensure default admin exists if user list is empty
    if (!this._users.has("admin@nexus-osint.io") && this._users.size === 0) {
      this.initDefaultSeed();
      this.saveToDisk();
    }
  }

  private syncFromDisk() {
    try {
      if (!fs.existsSync(this.dbPath)) return;
      const stat = fs.statSync(this.dbPath);
      if (stat.mtimeMs > this.lastMtime) {
        this.loadFromDisk();
      }
    } catch {
      // ignore concurrent read error
    }
  }

  get users(): Map<string, MockUser> {
    this.syncFromDisk();
    return this._users;
  }
  set users(val: Map<string, MockUser>) {
    this._users = val;
  }

  get investigations(): Map<string, MockInvestigation> {
    this.syncFromDisk();
    return this._investigations;
  }
  set investigations(val: Map<string, MockInvestigation>) {
    this._investigations = val;
  }

  get scanResults(): MockScanResult[] {
    this.syncFromDisk();
    return this._scanResults;
  }
  set scanResults(val: MockScanResult[]) {
    this._scanResults = val;
  }

  get providers(): Map<string, MockProvider> {
    this.syncFromDisk();
    return this._providers;
  }
  set providers(val: Map<string, MockProvider>) {
    this._providers = val;
  }

  get auditLogs(): any[] {
    this.syncFromDisk();
    return this._auditLogs;
  }
  set auditLogs(val: any[]) {
    this._auditLogs = val;
  }

  get keywordMonitors(): any[] {
    this.syncFromDisk();
    return this._keywordMonitors;
  }
  set keywordMonitors(val: any[]) {
    this._keywordMonitors = val;
  }

  get reports(): any[] {
    this.syncFromDisk();
    return this._reports;
  }
  set reports(val: any[]) {
    this._reports = val;
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.users && Array.isArray(parsed.users)) {
          for (const [k, v] of parsed.users) {
            this._users.set(k, { ...v, createdAt: new Date(v.createdAt) });
          }
        }
        if (parsed.investigations && Array.isArray(parsed.investigations)) {
          for (const [k, v] of parsed.investigations) {
            this._investigations.set(k, {
              ...v,
              createdAt: new Date(v.createdAt),
              updatedAt: new Date(v.updatedAt),
            });
          }
        }
        if (parsed.scanResults && Array.isArray(parsed.scanResults)) {
          this._scanResults = parsed.scanResults.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
          }));
        }
        if (parsed.providers && Array.isArray(parsed.providers)) {
          for (const [k, v] of parsed.providers) {
            this._providers.set(k, v);
          }
        }
        if (parsed.auditLogs && Array.isArray(parsed.auditLogs)) {
          this._auditLogs = parsed.auditLogs.map((a: any) => ({
            ...a,
            createdAt: new Date(a.createdAt),
          }));
        }
        if (parsed.keywordMonitors && Array.isArray(parsed.keywordMonitors)) {
          this._keywordMonitors = parsed.keywordMonitors.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          }));
        }
        if (parsed.reports && Array.isArray(parsed.reports)) {
          this._reports = parsed.reports.map((r: any) => ({
            ...r,
            generatedAt: new Date(r.generatedAt),
          }));
        }
        try {
          const stat = fs.statSync(this.dbPath);
          this.lastMtime = stat.mtimeMs;
        } catch {}
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

      // Merge concurrent changes from disk if updated externally
      if (fs.existsSync(this.dbPath)) {
        try {
          const stat = fs.statSync(this.dbPath);
          if (stat.mtimeMs > this.lastMtime) {
            const raw = fs.readFileSync(this.dbPath, "utf-8");
            const diskParsed = JSON.parse(raw);
            this.mergeDiskData(diskParsed);
          }
        } catch {}
      }

      const data = {
        users: Array.from(this._users.entries()),
        investigations: Array.from(this._investigations.entries()),
        scanResults: this._scanResults.slice(0, 500),
        providers: Array.from(this._providers.entries()),
        auditLogs: this._auditLogs.slice(0, 1000),
        keywordMonitors: this._keywordMonitors,
        reports: this._reports,
      };

      const payload = JSON.stringify(data, null, 2);
      fs.writeFileSync(this.dbPath, payload, "utf-8");

      try {
        const stat = fs.statSync(this.dbPath);
        this.lastMtime = stat.mtimeMs;
      } catch {}
    } catch (err) {
      console.warn("[LocalDB] Gagal menyimpan snapshot database ke disk:", err);
    }
  }

  private mergeDiskData(diskParsed: any) {
    if (diskParsed.users && Array.isArray(diskParsed.users)) {
      for (const [k, v] of diskParsed.users) {
        if (!this._users.has(k)) {
          this._users.set(k, { ...v, createdAt: new Date(v.createdAt) });
        }
      }
    }
    if (diskParsed.investigations && Array.isArray(diskParsed.investigations)) {
      for (const [k, v] of diskParsed.investigations) {
        if (!this._investigations.has(k)) {
          this._investigations.set(k, {
            ...v,
            createdAt: new Date(v.createdAt),
            updatedAt: new Date(v.updatedAt),
          });
        }
      }
    }
    if (diskParsed.scanResults && Array.isArray(diskParsed.scanResults)) {
      const knownIds = new Set(this._scanResults.map((s) => s.id));
      for (const s of diskParsed.scanResults) {
        if (!knownIds.has(s.id)) {
          this._scanResults.push({ ...s, createdAt: new Date(s.createdAt) });
          knownIds.add(s.id);
        }
      }
      this._scanResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (diskParsed.auditLogs && Array.isArray(diskParsed.auditLogs)) {
      const knownIds = new Set(this._auditLogs.map((a) => a.id));
      for (const a of diskParsed.auditLogs) {
        if (!knownIds.has(a.id)) {
          this._auditLogs.push({ ...a, createdAt: new Date(a.createdAt) });
          knownIds.add(a.id);
        }
      }
      this._auditLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (diskParsed.reports && Array.isArray(diskParsed.reports)) {
      const knownIds = new Set(this._reports.map((r) => r.reportId || r.id));
      for (const r of diskParsed.reports) {
        const rId = r.reportId || r.id;
        if (!knownIds.has(rId)) {
          this._reports.push({ ...r, generatedAt: new Date(r.generatedAt) });
          knownIds.add(rId);
        }
      }
      this._reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    }
    if (diskParsed.keywordMonitors && Array.isArray(diskParsed.keywordMonitors)) {
      const knownIds = new Set(this._keywordMonitors.map((m) => m.id));
      for (const m of diskParsed.keywordMonitors) {
        if (!knownIds.has(m.id)) {
          this._keywordMonitors.push({ ...m, createdAt: new Date(m.createdAt) });
          knownIds.add(m.id);
        }
      }
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
