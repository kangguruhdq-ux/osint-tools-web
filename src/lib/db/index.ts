import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Auto-map Vercel Neon Postgres environment variables if DATABASE_URL is not set directly
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.STORAGE_URL ||
    process.env.NEON_DATABASE_URL;
}

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
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error("DB_TIMEOUT")), 3500)),
    ]);
    isPrismaOnline = true;
    return result as T;
  } catch {
    isPrismaOnline = false;
    // Reset after 10 seconds to retry cloud database connection
    setTimeout(() => {
      isPrismaOnline = null;
    }, 10000);
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

  public hasSyncedFromDb: boolean = false;
  private syncPromise: Promise<void> | null = null;
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

    // Trigger cloud database sync if PostgreSQL is online
    this.syncFromPostgres().catch(() => {});
  }

  async syncFromPostgres(): Promise<void> {
    if (this.syncPromise) return this.syncPromise;
    this.syncPromise = (async () => {
      try {
        await safeDbQuery(async (p) => {
          // 1. Ensure default seed users exist in DB
          for (const [, u] of this._users.entries()) {
            await p.user.upsert({
              where: { email: u.email },
              update: {},
              create: {
                id: u.id,
                email: u.email,
                name: u.name,
                passwordHash: u.passwordHash,
                role: u.role as any,
                avatarUrl: u.avatar || null,
              },
            }).catch(() => {});
          }

          // Ensure guest user exists for foreign key constraints
          await p.user.upsert({
            where: { email: "guest@nexus-osint.io" },
            update: {},
            create: {
              id: "u-guest",
              email: "guest@nexus-osint.io",
              name: "Guest Explorer",
              passwordHash: "GUEST_LOCKED",
              role: "USER",
            },
          }).catch(() => {});

          // 2. Load Users from DB
          const dbUsers = await p.user.findMany().catch(() => []);
          if (dbUsers && dbUsers.length > 0) {
            for (const u of dbUsers) {
              this._users.set(u.email, {
                id: u.id,
                email: u.email,
                name: u.name,
                passwordHash: u.passwordHash,
                role: u.role as any,
                avatar: u.avatarUrl || undefined,
                createdAt: u.createdAt,
              });
            }
          }

          // 3. Load Investigations from DB
          const dbInvs = await p.investigation.findMany({
            orderBy: { updatedAt: "desc" },
          }).catch(() => []);
          if (dbInvs && dbInvs.length > 0) {
            for (const inv of dbInvs) {
              this._investigations.set(inv.id, {
                id: inv.id,
                userId: inv.userId,
                title: inv.title,
                description: inv.description || "",
                tags: inv.tags || [],
                status: inv.status,
                priority: inv.priority,
                analystNotes: inv.analystNotes || "",
                createdAt: inv.createdAt,
                updatedAt: inv.updatedAt,
              });
            }
          }

          // 4. Load Keyword Monitors from DB
          const dbMonitors = await p.keywordMonitor.findMany({
            orderBy: { createdAt: "desc" },
          }).catch(() => []);
          if (dbMonitors && dbMonitors.length > 0) {
            this._keywordMonitors = dbMonitors.map((m) => ({
              id: m.id,
              userId: m.userId,
              type: (m.sources?.[0] as any) || "rss",
              target: m.keyword,
              feedTitle: m.sources?.[1] || m.keyword,
              keywordFilter: null,
              isActive: m.isActive,
              lastChecked: m.updatedAt,
              totalMatches: m.totalMatches,
              recentItems: [],
              createdAt: m.createdAt,
            }));
          }

          // 5. Load Reports from DB
          const dbReports = await p.report.findMany({
            orderBy: { createdAt: "desc" },
          }).catch(() => []);
          if (dbReports && dbReports.length > 0) {
            this._reports = dbReports.map((r) => {
              if (r.content && typeof r.content === "object" && !Array.isArray(r.content)) {
                return {
                  ...(r.content as any),
                  reportId: r.id,
                  userId: r.userId,
                  title: r.title,
                  executiveSummary: r.summary || (r.content as any).executiveSummary,
                  generatedAt: r.createdAt.toISOString(),
                };
              }
              return {
                reportId: r.id,
                userId: r.userId,
                title: r.title,
                classification: "CONFIDENTIAL / OSINT DEFENSIVE REPORT",
                generatedAt: r.createdAt.toISOString(),
                leadAnalyst: "Senior OSINT Analyst",
                organization: "NEXUS OSINT TOOLS Enterprise",
                executiveSummary: r.summary || "",
                scopeTargets: ["Infrastruktur Publik"],
                findingsSummary: { totalFindings: 0, averageConfidence: "95%" },
                detailedFindings: [],
                analystNotes: "",
                methodology: "Passive OSINT",
                legalDisclaimer: r.disclaimer,
              };
            });
          }

          // 6. Load Audit Logs from DB
          const dbLogs = await p.auditLog.findMany({
            take: 500,
            orderBy: { createdAt: "desc" },
          }).catch(() => []);
          if (dbLogs && dbLogs.length > 0) {
            this._auditLogs = dbLogs.map((l) => ({
              id: l.id,
              userId: l.userId || "u-guest",
              action: l.action,
              resourceType: l.resourceType,
              resourceId: l.resourceId || "",
              status: l.status,
              details: l.details || {},
              createdAt: l.createdAt,
            }));
          }

          // 7. Load Scan Results from DB
          const dbScans = await p.scanResult.findMany({
            take: 300,
            orderBy: { createdAt: "desc" },
          }).catch(() => []);
          if (dbScans && dbScans.length > 0) {
            this._scanResults = dbScans.map((s) => ({
              id: s.id,
              investigationId: s.investigationId || undefined,
              toolId: s.toolId,
              target: s.target,
              data: s.data,
              summary: s.summary || "",
              confidenceScore: s.confidenceScore,
              sourceInfo: s.sourceInfo || "",
              createdAt: s.createdAt,
            }));
          }

          this.saveToDisk();
        });
      } catch {
        // Fallback gracefully to memory/disk
      } finally {
        this.hasSyncedFromDb = true;
      }
    })();
    return this.syncPromise;
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

export async function persistUserToDb(user: MockUser): Promise<void> {
  try {
    memoryDb.users.set(user.email, user);
    memoryDb.save();

    await safeDbQuery((p) =>
      p.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          passwordHash: user.passwordHash,
          role: user.role as any,
          avatarUrl: user.avatar || null,
        },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          passwordHash: user.passwordHash,
          role: user.role as any,
          avatarUrl: user.avatar || null,
        },
      })
    );
  } catch {}
}

export async function deleteUserFromDb(email: string): Promise<void> {
  try {
    memoryDb.users.delete(email);
    memoryDb.save();

    await safeDbQuery((p) =>
      p.user.delete({
        where: { email },
      })
    );
  } catch {}
}

export async function ensureDbSynced(): Promise<void> {
  if (!memoryDb.hasSyncedFromDb) {
    await memoryDb.syncFromPostgres();
  }
}

export async function ensureUserExistsInDb(userId: string): Promise<void> {
  await safeDbQuery(async (p) => {
    const exists = await p.user.findUnique({ where: { id: userId } }).catch(() => null);
    if (exists) return;

    const memUser = Array.from(memoryDb.users.values()).find((u) => u.id === userId);
    if (memUser) {
      await p.user.upsert({
        where: { email: memUser.email },
        update: { id: memUser.id },
        create: {
          id: memUser.id,
          email: memUser.email,
          name: memUser.name,
          passwordHash: memUser.passwordHash,
          role: memUser.role as any,
          avatarUrl: memUser.avatar || null,
        },
      }).catch(() => {});
      return;
    }

    const fallbackEmail = userId === "u-guest" ? "guest@nexus-osint.io" : `user-${userId}@nexus-osint.io`;
    await p.user.upsert({
      where: { email: fallbackEmail },
      update: {},
      create: {
        id: userId,
        email: fallbackEmail,
        name: userId === "u-guest" ? "Guest Explorer" : "Registered User",
        passwordHash: "N/A",
        role: "USER",
      },
    }).catch(() => {});
  });
}

export async function persistInvestigationToDb(inv: MockInvestigation): Promise<void> {
  try {
    memoryDb.investigations.set(inv.id, inv);
    memoryDb.save();

    await safeDbQuery(async (p) => {
      await ensureUserExistsInDb(inv.userId);
      const validPriority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(inv.priority)
        ? (inv.priority as any)
        : "MEDIUM";
      await p.investigation.upsert({
        where: { id: inv.id },
        update: {
          title: inv.title,
          description: inv.description,
          tags: inv.tags || [],
          priority: validPriority,
          status: inv.status || "OPEN",
          analystNotes: inv.analystNotes || "",
          updatedAt: new Date(),
        },
        create: {
          id: inv.id,
          userId: inv.userId,
          title: inv.title,
          description: inv.description,
          tags: inv.tags || [],
          priority: validPriority,
          status: inv.status || "OPEN",
          analystNotes: inv.analystNotes || "",
          createdAt: new Date(inv.createdAt || Date.now()),
          updatedAt: new Date(inv.updatedAt || Date.now()),
        },
      });
    });
  } catch {}
}

export async function deleteInvestigationFromDb(id: string): Promise<void> {
  try {
    memoryDb.investigations.delete(id);
    memoryDb.save();

    await safeDbQuery((p) =>
      p.investigation.delete({
        where: { id },
      }).catch(() => null)
    );
  } catch {}
}

export async function persistMonitorToDb(mon: any): Promise<void> {
  try {
    const existingIdx = memoryDb.keywordMonitors.findIndex((m) => m.id === mon.id);
    if (existingIdx >= 0) {
      memoryDb.keywordMonitors[existingIdx] = mon;
    } else {
      memoryDb.keywordMonitors.unshift(mon);
    }
    memoryDb.save();

    await safeDbQuery(async (p) => {
      await ensureUserExistsInDb(mon.userId);
      await p.keywordMonitor.upsert({
        where: { id: mon.id },
        update: {
          keyword: mon.target || mon.keyword || "",
          sources: [mon.type || "rss", mon.feedTitle || ""],
          totalMatches: mon.totalMatches || 0,
          isActive: mon.isActive !== false,
          updatedAt: new Date(),
        },
        create: {
          id: mon.id,
          userId: mon.userId,
          keyword: mon.target || mon.keyword || "",
          sources: [mon.type || "rss", mon.feedTitle || ""],
          totalMatches: mon.totalMatches || 0,
          isActive: mon.isActive !== false,
          createdAt: new Date(mon.createdAt || Date.now()),
          updatedAt: new Date(),
        },
      });
    });
  } catch {}
}

export async function deleteMonitorFromDb(id: string): Promise<void> {
  try {
    memoryDb.keywordMonitors = memoryDb.keywordMonitors.filter((m) => m.id !== id);
    memoryDb.save();

    await safeDbQuery((p) =>
      p.keywordMonitor.delete({
        where: { id },
      }).catch(() => null)
    );
  } catch {}
}

export async function persistReportToDb(report: any): Promise<void> {
  try {
    const reportId = report.reportId || report.id;
    const existingIndex = memoryDb.reports.findIndex((r) => (r.reportId || r.id) === reportId);
    if (existingIndex >= 0) {
      memoryDb.reports[existingIndex] = report;
    } else {
      memoryDb.reports.unshift(report);
    }
    memoryDb.save();

    await safeDbQuery(async (p) => {
      await ensureUserExistsInDb(report.userId);
      await p.report.upsert({
        where: { id: reportId },
        update: {
          title: report.title || "OSINT Intelligence Report",
          summary: report.executiveSummary || report.summary || "",
          content: report,
          disclaimer: report.legalDisclaimer || report.disclaimer || "NEXUS OSINT Enterprise",
          updatedAt: new Date(),
        },
        create: {
          id: reportId,
          userId: report.userId,
          title: report.title || "OSINT Intelligence Report",
          summary: report.executiveSummary || report.summary || "",
          content: report,
          disclaimer: report.legalDisclaimer || report.disclaimer || "NEXUS OSINT Enterprise",
          createdAt: new Date(report.generatedAt || report.createdAt || Date.now()),
          updatedAt: new Date(),
        },
      });
    });
  } catch {}
}

export async function deleteReportFromDb(id: string): Promise<void> {
  try {
    memoryDb.reports = memoryDb.reports.filter((r) => (r.reportId || r.id) !== id);
    memoryDb.save();

    await safeDbQuery((p) =>
      p.report.delete({
        where: { id },
      }).catch(() => null)
    );
  } catch {}
}

export async function deleteAllReportsFromDb(userId?: string): Promise<void> {
  try {
    if (userId) {
      memoryDb.reports = memoryDb.reports.filter((r) => r.userId !== userId);
    } else {
      memoryDb.reports = [];
    }
    memoryDb.save();

    await safeDbQuery((p) =>
      userId ? p.report.deleteMany({ where: { userId } }) : p.report.deleteMany()
    );
  } catch {}
}

export async function persistAuditLogToDb(log: any): Promise<void> {
  try {
    memoryDb.auditLogs.unshift(log);
    memoryDb.save();

    await safeDbQuery(async (p) => {
      let validUserId: string | null = null;
      if (log.userId) {
        try {
          await ensureUserExistsInDb(log.userId);
          validUserId = log.userId;
        } catch {
          validUserId = null;
        }
      }
      await p.auditLog.create({
        data: {
          id: log.id,
          userId: validUserId,
          action: log.action || "AUDIT",
          resourceType: log.resourceType || "SYSTEM",
          resourceId: log.resourceId ? String(log.resourceId) : null,
          status: log.status || "SUCCESS",
          details: log.details || {},
          createdAt: new Date(log.createdAt || Date.now()),
        },
      }).catch(() => {});
    });
  } catch {}
}

export async function persistScanResultToDb(scan: any): Promise<void> {
  try {
    memoryDb.scanResults.unshift(scan);
    memoryDb.save();

    await safeDbQuery(async (p) => {
      await p.scanResult.create({
        data: {
          id: scan.id,
          investigationId: scan.investigationId || null,
          toolId: scan.toolId || "osint",
          target: scan.target || "public",
          data: scan.data || {},
          summary: scan.summary || null,
          confidenceScore: typeof scan.confidenceScore === "number" ? scan.confidenceScore : 1.0,
          sourceInfo: scan.sourceInfo || "NEXUS Core",
          createdAt: new Date(scan.createdAt || Date.now()),
        },
      }).catch(() => {});
    });
  } catch {}
}

export async function clearAuditLogsFromDb(): Promise<void> {
  try {
    memoryDb.auditLogs = [];
    memoryDb.save();

    await safeDbQuery((p) => p.auditLog.deleteMany());
  } catch {}
}

export async function cleanAuditLogsInDb(cutoffDate: number): Promise<void> {
  try {
    memoryDb.auditLogs = memoryDb.auditLogs.filter((l) => new Date(l.createdAt).getTime() > cutoffDate);
    memoryDb.save();

    await safeDbQuery((p) =>
      p.auditLog.deleteMany({
        where: {
          createdAt: { lt: new Date(cutoffDate) },
        },
      })
    );
  } catch {}
}

export async function cleanReportsInDb(cutoffDate: number): Promise<void> {
  try {
    memoryDb.reports = memoryDb.reports.filter((r) => new Date(r.generatedAt || r.createdAt).getTime() > cutoffDate);
    memoryDb.save();

    await safeDbQuery((p) =>
      p.report.deleteMany({
        where: {
          createdAt: { lt: new Date(cutoffDate) },
        },
      })
    );
  } catch {}
}


