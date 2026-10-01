"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  Zap,
  Activity,
  Server,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Save,
  Palette,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { TermuxIconSvg } from "@/components/brand/brand-logo";

export default function AdminDashboardPage() {
  const { success, error: toastError } = useToast();
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Brand Icon & System Settings State
  const [brandIcon, setBrandIcon] = useState<string>("termux-classic");
  const [brandName, setBrandName] = useState<string>("NEXUS");
  const [githubToolEnabled, setGithubToolEnabled] = useState<boolean>(true);
  const [githubPatInput, setGithubPatInput] = useState<string>("");
  const [githubPatHint, setGithubPatHint] = useState<string>("Belum Dikonfigurasi");
  const [hasGithubPat, setHasGithubPat] = useState<boolean>(false);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  const fetchSystemStats = async () => {
    try {
      const res = await fetch("/api/admin/system-status");
      const d = await res.json();
      if (d.success) setSystemStats(d.system);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/system-settings");
      const d = await res.json();
      if (d.success && d.data) {
        setBrandIcon(d.data.brand_icon || "termux-classic");
        setBrandName(d.data.brand_name || "NEXUS");
        setGithubToolEnabled(d.data.tool_github_repo_audit_enabled !== false);
        setGithubPatHint(d.data.github_pat_hint || "Belum Dikonfigurasi");
        setHasGithubPat(!!d.data.has_github_pat);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSystemStats();
    fetchSettings();
  }, []);

  const handleSaveSettings = async (overrideToolStatus?: boolean) => {
    setSavingSettings(true);
    try {
      const toolStatusToSave = overrideToolStatus !== undefined ? overrideToolStatus : githubToolEnabled;
      const res = await fetch("/api/admin/system-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_icon: brandIcon,
          brand_name: brandName,
          tool_github_repo_audit_enabled: toolStatusToSave,
          github_pat_token: githubPatInput.trim() || undefined,
        }),
      });

      const d = await res.json();
      if (!res.ok || !d.success) {
        toastError(d.error || "Gagal menyimpan pengaturan.");
        return;
      }

      success("Konfigurasi sistem, ikon Termux, dan status tools berhasil disimpan!", "Tersimpan");
      setGithubPatInput("");
      fetchSettings();
    } catch (err: any) {
      toastError(err.message || "Terjadi kesalahan.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleTool = async () => {
    const nextStatus = !githubToolEnabled;
    setGithubToolEnabled(nextStatus);
    await handleSaveSettings(nextStatus);
  };

  return (
    <AppLayout userRole="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldAlert className="h-4 w-4" />
              <span>Pusat Kendali Enterprise (61 Tools)</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Admin Dashboard & Sistem
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Kelola user, role, kontrol 61 tools OSINT, ubah ikon web Termux, enkripsi provider API, dan pantau log keamanan.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/admin/providers">
              <Button variant="glow" size="sm" className="gap-1.5 text-xs">
                <KeyRound className="h-4 w-4" />
                <span>Konfigurasi Provider API</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Pengguna</span>
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-white font-mono">2 Analis</div>
            <div className="mt-1 text-[11px] text-blue-400">
              <Link href="/admin/users" className="hover:underline">
                Kelola User & Role →
              </Link>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Katalog Tools</span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-emerald-400 font-mono">
              61 Tools Aktif
            </div>
            <div className="mt-1 text-[11px] text-cyan-400">
              <Link href="/tools" className="hover:underline">
                Katalog Lengkap →
              </Link>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Enkripsi API Kredensial</span>
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                <Lock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-lg font-bold text-purple-300 font-mono">
              AES-256-GCM
            </div>
            <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Vault Terproteksi</span>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Ikon Brand Aktif</span>
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <Palette className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-lg font-bold text-cyan-300 font-mono flex items-center gap-2">
              <TermuxIconSvg className="h-5 w-5" type={brandIcon} />
              <span className="text-sm capitalize">{brandIcon.replace("-", " ")}</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Termux Web Branding
            </div>
          </Card>
        </div>

        {/* NEW SECTION: Brand & Tool Management Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Tool Kontrol GitHub Repo Security Auditor (Tool ke-61) */}
          <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Kontrol Tool ke-61: GitHub Repo Security</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Manajemen GitHub Repo Checker
                </h3>
              </div>
              <Badge
                className={
                  githubToolEnabled
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-mono"
                    : "bg-red-500/20 text-red-300 border-red-500/40 text-xs font-mono"
                }
              >
                {githubToolEnabled ? "STATUS: AKTIF" : "STATUS: DINONAKTIFKAN"}
              </Badge>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Administrator dapat mengaktifkan atau menonaktifkan tool GitHub Repo Security Checker secara instan. Jika dinonaktifkan, seluruh pengguna/analis akan menerima pesan pemeliharaan resmi dan proses scan dihentikan.
            </p>

            {/* Quick Toggle Button */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Status Operasional Tool
                </span>
                <span className="text-[11px] text-slate-400">
                  {githubToolEnabled
                    ? "Tool siap digunakan oleh semua analis di /tools/github-repo-audit."
                    : "Tool sedang dikunci dari akses publik untuk inspeksi keamanan."}
                </span>
              </div>
              <Button
                variant={githubToolEnabled ? "glow" : "outline"}
                size="sm"
                onClick={handleToggleTool}
                isLoading={savingSettings}
                className="gap-2 text-xs"
              >
                {githubToolEnabled ? (
                  <>
                    <ToggleRight className="h-4 w-4 text-emerald-300" />
                    <span>Nonaktifkan</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-4 w-4 text-rose-400" />
                    <span>Aktifkan</span>
                  </>
                )}
              </Button>
            </div>

            {/* GitHub PAT Token Configuration */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>GitHub Personal Access Token (PAT Opsional)</span>
                <span className="font-mono text-[10px] text-cyan-400">
                  Hint: {githubPatHint}
                </span>
              </label>
              <Input
                type="password"
                placeholder="ghp_••••••••••••••••••••••••••••••••••••"
                value={githubPatInput}
                onChange={(e) => setGithubPatInput(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400">
                Memperluas limit rate dari 60 req/jam menjadi 5.000 req/jam. Disimpan dalam format enkripsi AES-256-GCM.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="glow"
                size="sm"
                onClick={() => handleSaveSettings()}
                isLoading={savingSettings}
                className="gap-1.5 text-xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Pengaturan Tool</span>
              </Button>
            </div>
          </Card>

          {/* Card 2: Kustomisasi Ikon Web Termux & Branding */}
          <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
                  <Palette className="h-4 w-4" />
                  <span>Kustomisasi Ikon Web & Branding</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Ikon Termux & Identitas Website
                </h3>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                <TermuxIconSvg className="h-6 w-6" type={brandIcon} />
                <span className="text-xs font-mono text-cyan-300 font-bold">{brandName}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Pilih varian ikon Termux yang akan ditampilkan pada header website, sidebar navigasi, navigasi mobile, dan tab browser (favicon).
            </p>

            {/* Icon Picker Radio Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "termux-classic", name: "Termux Classic", desc: ">_ Kursor Cyan", type: "termux-classic" },
                { id: "termux-green", name: "Termux Matrix", desc: ">_ Kursor Hijau", type: "termux-green" },
                { id: "termux-bash", name: "Termux Bash", desc: "~$ Shell Prompt", type: "termux-bash" },
                { id: "cyber-shield", name: "Cyber Shield", desc: "Shield + Terminal", type: "cyber-shield" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBrandIcon(opt.id)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    brandIcon === opt.id
                      ? "border-cyan-500 bg-cyan-950/30 text-white shadow-md shadow-cyan-950/50"
                      : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <TermuxIconSvg className="h-7 w-7 shrink-0" type={opt.type} />
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold block truncate">{opt.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">{opt.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Brand Name Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-slate-300">
                Nama Brand Platform
              </label>
              <Input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="NEXUS"
                className="text-xs font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="glow"
                size="sm"
                onClick={() => handleSaveSettings()}
                isLoading={savingSettings}
                className="gap-1.5 text-xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Terapkan Ikon Termux</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* System Health Specs & Quick Admin Navigation Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Spesifikasi Server & Runtime</h3>
              </div>
              <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                Node.js V8
              </Badge>
            </div>

            {systemStats ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Waktu Aktif (Uptime)</span>
                  <span className="font-mono text-white">
                    {Math.floor(systemStats.uptime / 3600)} jam {Math.floor((systemStats.uptime % 3600) / 60)} mnt
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Penggunaan Memori (RSS)</span>
                  <span className="font-mono text-cyan-300">
                    {Math.round(systemStats.memoryUsage.rss / 1024 / 1024)} MB
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Arsitektur & Platform</span>
                  <span className="font-mono text-slate-300">{systemStats.platform} ({systemStats.nodeVersion})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Database Engine</span>
                  <span className="font-mono text-emerald-400">PostgreSQL (Neon) + In-Memory Fallback</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">Memuat metrik sistem...</div>
            )}
          </Card>

          {/* Quick Admin Navigation Panels */}
          <Card className="border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Manajemen & Konfigurasi</h3>
              <p className="text-xs text-slate-400 mb-4">Navigasi ke panel administrasi operasional.</p>

              <div className="space-y-2.5">
                <Link
                  href="/admin/providers"
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 hover:border-slate-700 hover:bg-slate-900 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-blue-500/10 p-2 text-blue-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Provider API & Enkripsi Kunci</div>
                      <div className="text-[11px] text-slate-400">Kelola RapidAPI, Cobalt, OpenAI, GitHub API, dan tes koneksi langsung.</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/admin/users"
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 hover:border-slate-700 hover:bg-slate-900 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-cyan-500/10 p-2 text-cyan-400">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Manajemen Pengguna & Kuota</div>
                      <div className="text-[11px] text-slate-400">Atur hak akses (USER, ANALYST, ADMIN) dan akses 61 tools.</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/admin/audit-logs"
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 hover:border-slate-700 hover:bg-slate-900 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-purple-500/10 p-2 text-purple-400">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Audit Log Keamanan</div>
                      <div className="text-[11px] text-slate-400">Jejak audit setiap scan 61 tools, aktivitas login, dan pemblokiran SSRF.</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
