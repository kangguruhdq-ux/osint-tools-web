import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/auth/session";
import {
  memoryDb,
  ensureDbSynced,
  getSystemSetting,
  setSystemSetting,
  persistAuditLogToDb,
} from "@/lib/db";
import { encrypt, generateKeyHint } from "@/lib/security/encryption";

const SettingsUpdateSchema = z.object({
  brand_icon: z.enum(["termux-classic", "termux-green", "termux-bash", "cyber-shield"]).optional(),
  brand_name: z.string().min(1).max(30).optional(),
  brand_badge: z.string().min(1).max(20).optional(),
  tool_github_repo_audit_enabled: z.boolean().optional(),
  github_pat_token: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Memerlukan hak akses Administrator." },
        { status: 403 }
      );
    }

    await ensureDbSynced();

    const brandIcon = await getSystemSetting("brand_icon", "termux-classic");
    const brandName = await getSystemSetting("brand_name", "NEXUS");
    const brandBadge = await getSystemSetting("brand_badge", "OSINT");
    const githubToolEnabled = (await getSystemSetting("tool_github_repo_audit_enabled", "true")) !== "false";
    const githubPat = await getSystemSetting("github_pat_token", "");

    return NextResponse.json({
      success: true,
      data: {
        brand_icon: brandIcon,
        brand_name: brandName,
        brand_badge: brandBadge,
        tool_github_repo_audit_enabled: githubToolEnabled,
        github_pat_hint: githubPat ? generateKeyHint(githubPat) : "Belum Dikonfigurasi (Rate limit 60/jam)",
        has_github_pat: !!githubPat,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Memerlukan hak akses Administrator." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = SettingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      brand_icon,
      brand_name,
      brand_badge,
      tool_github_repo_audit_enabled,
      github_pat_token,
    } = parsed.data;

    if (brand_icon !== undefined) {
      await setSystemSetting("brand_icon", brand_icon, "Active web brand icon");
    }

    if (brand_name !== undefined) {
      await setSystemSetting("brand_name", brand_name, "Active brand name");
    }

    if (brand_badge !== undefined) {
      await setSystemSetting("brand_badge", brand_badge, "Active brand badge");
    }

    if (tool_github_repo_audit_enabled !== undefined) {
      await setSystemSetting(
        "tool_github_repo_audit_enabled",
        tool_github_repo_audit_enabled ? "true" : "false",
        "Status kontrol tool GitHub Repo Security Checker"
      );
    }

    if (github_pat_token !== undefined && github_pat_token.trim().length > 0) {
      const cleanToken = github_pat_token.trim();
      await setSystemSetting("github_pat_token", cleanToken, "GitHub Personal Access Token");

      // Also update provider prov-08 in memoryDb & database
      const { encrypted, iv, tag } = encrypt(cleanToken);
      const hint = generateKeyHint(cleanToken);

      let provider = memoryDb.providers.get("github-api");
      if (provider) {
        provider.encryptedKey = encrypted;
        provider.iv = iv;
        provider.tag = tag;
        provider.keyHint = hint;
        provider.status = "ACTIVE";
        memoryDb.providers.set("github-api", provider);
        memoryDb.save();
      }
    }

    // Persist Audit Log
    await persistAuditLogToDb({
      id: "aud-" + Date.now(),
      userId: user.userId,
      action: "ADMIN_SYSTEM_SETTINGS_UPDATE",
      resourceType: "SYSTEM_CONFIG",
      resourceId: "system-settings",
      details: {
        brand_icon,
        brand_name,
        tool_github_repo_audit_enabled,
        hasNewPat: github_pat_token !== undefined && github_pat_token.trim().length > 0,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Pengaturan sistem dan kontrol tools berhasil diperbarui.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
