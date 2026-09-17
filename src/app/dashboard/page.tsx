"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  FolderKanban,
  Wrench,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Plus,
  Lock,
  FileText,
  Radio,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToolBrandIcon } from "@/components/tools/tool-brand-icon";

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  };
  stats: {
    totalScans: number;
    totalReports: number;
    activeMonitors: number;
    activeProjects: number;
  };
  recentActivities: Array<{
    id: string;
    tool: string;
    target: string;
    status: string;
    time: string;
    category: string;
  }>;
  activeInvestigations: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    tags: string[];
    updatedAt: string;
  }>;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/stats");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Gagal memuat statistik dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const quickTools = [
    { id: "web-cloner", name: "Smart Web Cloner", cat: "Source Extractor", tag: "HTML CLONE" },
    { id: "tiktok-downloader", name: "TikTok Downloader", cat: "Media OSINT", tag: "NO WATERMARK" },
    { id: "instagram-downloader", name: "Instagram Media", cat: "Media OSINT", tag: "REELS/POST" },
    { id: "youtube-downloader", name: "YouTube Downloader", cat: "Media OSINT", tag: "HD VIDEO" },
    { id: "whois-lookup", name: "WHOIS Direct Socket", cat: "Domain Recon", tag: "IANA / TLD" },
    { id: "dns-lookup", name: "DNS Deep Resolver", cat: "Network OSINT", tag: "RECORDS" },
    { id: "ip-lookup", name: "IP & ASN Geolocation", cat: "Network OSINT", tag: "RDAP / GEO" },
    { id: "report-generator", name: "Laporan Investigasi", cat: "Intelligence", tag: "PDF / MD" },
  ];

  const providers = [
    { name: "Native DNS Resolver (C-ARES)", status: "ACTIVE", latency: "12ms" },
    { name: "Socket WHOIS Protocol Direct", status: "ACTIVE", latency: "48ms" },
    { name: "IP Geolocation & RDAP Engine", status: "ACTIVE", latency: "65ms" },
    { name: "Public Social Media Scrapers", status: "ACTIVE", latency: "110ms" },
    { name: "Free Community Downloader Hub", status: "ACTIVE", latency: "90ms" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top welcome banner with Tenant Identity */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {data?.user?.name ? `Workspace: ${data.user.name}` : "Dashboard Privat Analis"}
              </h1>
              <Badge
                variant={
                  data?.user?.role === "ADMIN" || data?.user?.role === "SUPERADMIN"
                    ? "warning"
                    : "cyan"
                }
                className="text-[10px] font-mono uppercase"
              >
                {data?.user?.role || "USER"}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Ruang kerja intelijen privat. Seluruh catatan investigasi, data scan, dan laporan hanya dapat diakses oleh Anda.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardStats}
              disabled={loading}
              className="gap-1.5 text-xs text-slate-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </Button>
            <Link href="/workspace?action=new">
              <Button variant="glow" size="sm" className="gap-1.5 text-xs">
                <Plus className="h-4 w-4" />
                <span>Investigasi Baru</span>
              </Button>
            </Link>
            <Link href="/tools">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30">
                <Wrench className="h-4 w-4" />
                <span>52 Tools</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Multi-Tenant Privacy Shield Notice */}
        <div className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 text-xs text-cyan-200 backdrop-blur-sm shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <Lock className="h-4 w-4" />
          </div>
          <div className="flex-1 text-[12px] leading-relaxed">
            <span className="font-semibold text-white">Privasi Akun & Isolasi Data Terjamin: </span>
            Seluruh 52 tools dapat digunakan tanpa batas. Hasil pemindaian, unduhan, dan ringkasan investigasi Anda terisolasi secara privat pada akun Anda dan tidak akan pernah dibagikan ke publik.
          </div>
        </div>

        {/* 4 Main Real Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Pemindaian</span>
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <Search className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-white font-mono">
              {loading ? "-" : data?.stats?.totalScans ?? 0}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Riwayat scan privat akun Anda</span>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Laporan Investigasi</span>
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-white font-mono">
              {loading ? "-" : data?.stats?.totalReports ?? 0}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
              <Link href="/reports" className="text-cyan-400 hover:underline">
                Buka Arsip Laporan →
              </Link>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Keyword & RSS Monitor</span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Radio className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-emerald-400 font-mono">
              {loading ? "-" : data?.stats?.activeMonitors ?? 0}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
              <Link href="/monitors" className="text-emerald-400 hover:underline">
                Kelola Pemantau Aktif →
              </Link>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Project Investigasi</span>
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                <FolderKanban className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-white font-mono">
              {loading ? "-" : data?.stats?.activeProjects ?? 0}
            </div>
            <div className="mt-1 text-[11px] text-blue-400">
              <Link href="/workspace" className="hover:underline">
                Buka OSINT Workspace →
              </Link>
            </div>
          </Card>
        </div>

        {/* Middle Section: Recent User Activities & Quick Launchpad */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Recent Activities */}
          <Card className="lg:col-span-2 border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>Riwayat Aktivitas Pemindaian Privat</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Catatan eksekusi tools dan investigasi yang dilakukan oleh akun ini.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] text-slate-300 font-mono">
                {data?.recentActivities?.length || 0} Aktivitas
              </Badge>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-cyan-400" />
                Memuat aktivitas terkini...
              </div>
            ) : !data?.recentActivities || data.recentActivities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center bg-slate-950/40">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-3">
                  <Search className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-white">Belum Ada Pemindaian</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                  Workspace Anda siap digunakan. Jalankan pemindaian pertama Anda dengan memilih salah satu dari 52 tools intelijen OSINT.
                </p>
                <Link href="/tools">
                  <Button variant="glow" size="sm" className="gap-2 text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Jelajahi 52 Tools Sekarang</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {data.recentActivities.map((act) => (
                  <div key={act.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{act.tool}</div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                          {act.target}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="success" className="text-[9px]">
                        BERHASIL
                      </Badge>
                      <div className="text-[10px] text-slate-400 mt-1">{act.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Tools Launchpad with Brand Logos */}
          <Card className="border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-blue-400" />
                  <span>Akses Cepat Tools Unggulan</span>
                </h3>
              </div>

              <div className="space-y-2">
                {quickTools.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tools/${t.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2.5 text-xs hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ToolBrandIcon toolId={t.id} className="h-5 w-5 shrink-0" />
                      <div>
                        <div className="text-slate-200 font-medium group-hover:text-cyan-300 transition-colors">
                          {t.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{t.cat}</div>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                      {t.tag}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/tools" className="mt-4">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-slate-700 hover:border-slate-600">
                <span>Lihat Seluruh 52 Tools</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </Card>
        </div>

        {/* Bottom Section: Active Projects & System Engine Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Investigations for this user */}
          <Card className="lg:col-span-2 border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-amber-400" />
                  <span>Project Investigasi Aktif Anda</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar investigasi intelijen yang tersimpan di workspace akun ini.
                </p>
              </div>
              <Link href="/workspace">
                <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-blue-300">
                  Lihat Semua
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Memuat investigasi...</div>
            ) : !data?.activeInvestigations || data.activeInvestigations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center bg-slate-950/40">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-3">
                  <FolderKanban className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-white">Belum Ada Project Investigasi</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                  Buat project investigasi pribadi untuk mengelompokkan target intelijen, bukti digital, dan ringkasan kasus.
                </p>
                <Link href="/workspace?action=new">
                  <Button variant="outline" size="sm" className="gap-2 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-950/20">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Buat Project Pertama</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.activeInvestigations.map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/workspace`}
                            className="text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
                          >
                            {inv.title}
                          </Link>
                          <Badge
                            variant={
                              inv.priority === "CRITICAL"
                                ? "destructive"
                                : inv.priority === "HIGH"
                                ? "warning"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {inv.priority}
                          </Badge>
                        </div>

                        {inv.tags && inv.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {inv.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-mono"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <Badge variant="cyan" className="text-[9px]">
                          {inv.status || "OPEN"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Engine & Security Health Status */}
          <Card className="border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Engine & Keamanan</span>
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>OPERATIONAL</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {providers.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-b border-slate-800/40 pb-2 text-xs"
                  >
                    <div>
                      <div className="text-slate-300 font-medium">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Latency: {p.latency}</div>
                    </div>
                    <Badge variant="success" className="text-[9px]">
                      ONLINE
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Perlindungan SSRF:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Filter IP Lokal & Metadata Cloud Aktif
              </span>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
