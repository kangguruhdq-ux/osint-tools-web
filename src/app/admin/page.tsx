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
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchSystemStats();
  }, []);

  return (
    <AppLayout userRole="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldAlert className="h-4 w-4" />
              <span>Pusat Kendali Enterprise</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Admin Dashboard & Sistem
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Kelola user, role, enkripsi provider API, uji koneksi, dan pantau log audit keamanan.
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
              <span className="text-xs font-medium text-slate-400">Status Provider</span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-emerald-400 font-mono">
              3 Native Aktif
            </div>
            <div className="mt-1 text-[11px] text-amber-400">
              4 Memerlukan API Key
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
              <span>Master Key Terproteksi</span>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Status SSRF Guard</span>
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-lg font-bold text-cyan-300 font-mono">
              ENFORCED
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Anti-Loopback & Subnet RFC1918
            </div>
          </Card>
        </div>

        {/* System Health Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-cyan-400" />
                <span>Metrik Performa Server & Node.js</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSystemStats}
                className="h-7 text-xs text-slate-400 hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                <span>Refresh</span>
              </Button>
            </div>

            {systemStats ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Status Sistem:</span>
                  <Badge variant="success">{systemStats.status}</Badge>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Node.js Version:</span>
                  <span className="font-mono text-white">{systemStats.nodeVersion}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Platform OS:</span>
                  <span className="font-mono text-white">{systemStats.platform} ({systemStats.arch})</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Penggunaan RAM Proses:</span>
                  <span className="font-mono text-cyan-400">{systemStats.processRssMb} MB RSS</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Queue Status:</span>
                  <span className="font-mono text-emerald-400">{systemStats.queueStatus}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mode Pemeliharaan (Maintenance):</span>
                  <span className="font-mono text-slate-300">Non-Aktif</span>
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
                      <div className="text-[11px] text-slate-400">Kelola RapidAPI, Cobalt, OpenAI, dan tes koneksi langsung.</div>
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
                      <div className="text-[11px] text-slate-400">Atur hak akses (USER, ANALYST, ADMIN) dan batas kuota.</div>
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
                      <div className="text-[11px] text-slate-400">Jejak audit setiap scan, aktivitas login, dan pemblokiran SSRF.</div>
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
