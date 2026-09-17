"use client";

import React, { useState, useEffect } from "react";
import {
  HardDrive,
  Cpu,
  Trash2,
  RefreshCw,
  Zap,
  ShieldCheck,
  Database,
  FileText,
  Clock,
  Activity,
  AlertCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export default function AdminStoragePage() {
  const { success, error: toastError } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/storage");
      const d = await res.json();
      if (d.success && d.stats) {
        setStats(d.stats);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMaintenance = async (action: string, label: string, params?: any) => {
    if (!confirm(`Konfirmasi jalankan pemeliharaan: "${label}"?`)) return;

    setActionLoading(action);
    try {
      const res = await fetch("/api/admin/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, params }),
      });

      const d = await res.json();
      if (!res.ok || !d.success) {
        throw new Error(d.error || "Gagal menjalankan pemeliharaan");
      }

      success(d.message || "Pemeliharaan berhasil dijalankan.", "Efisiensi Selesai");
      fetchStats();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AppLayout userRole="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
              <HardDrive className="h-4 w-4" />
              <span>Admin Console • Storage Optimization</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Penyimpanan & Efisiensi Sistem
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Pantau footprint memori, entitas database operasional, dan lakukan tindakan pembersihan untuk efisiensi penyimpanan server.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            isLoading={loading}
            className="gap-1.5 text-xs self-start sm:self-auto border-slate-700 hover:text-cyan-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Segarkan Metrik</span>
          </Button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Heap Memory */}
          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Heap Process V8</span>
              <Cpu className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats?.memory?.heapUsedMb || "0"} <span className="text-xs font-normal text-slate-400">MB</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Alokasi Total:</span>
              <span className="font-mono text-slate-300">{stats?.memory?.heapTotalMb || "0"} MB</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{
                  width: `${Math.min(100, Math.round(((stats?.memory?.heapUsedMb || 1) / (stats?.memory?.heapTotalMb || 1)) * 100))}%`,
                }}
              />
            </div>
          </Card>

          {/* System RAM */}
          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">RAM Server Fisik</span>
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats?.memory?.freeSystemMemMb
                ? (Number(stats.memory.freeSystemMemMb) / 1024).toFixed(1)
                : "0"}{" "}
              <span className="text-xs font-normal text-slate-400">GB Bebas</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Penggunaan Host:</span>
              <span className="font-mono text-slate-300">{stats?.memory?.systemUsagePercent || "0"}%</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${stats?.memory?.systemUsagePercent || 0}%` }}
              />
            </div>
          </Card>

          {/* Scan Results */}
          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Hasil Scan Tersimpan</span>
              <Database className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats?.entities?.scanResultsCount || "0"}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Investigasi Aktif:</span>
              <span className="font-mono text-slate-300">{stats?.entities?.investigationsCount || "0"} kasus</span>
            </div>
          </Card>

          {/* Audit Logs */}
          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Riwayat Audit Logs</span>
              <ShieldCheck className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats?.entities?.auditLogsCount || "0"}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Total Laporan:</span>
              <span className="font-mono text-slate-300">{stats?.entities?.reportsCount || "0"} dokumen</span>
            </div>
          </Card>
        </div>

        {/* Action Panel: Storage Optimization & Maintenance */}
        <Card className="border-slate-800 bg-slate-900/60 p-5 sm:p-6 shadow-xl">
          <CardHeader className="p-0 pb-4 mb-5 border-b border-slate-800/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                <span>Operasi Pembersihan & Optimalisasi Efisiensi</span>
              </CardTitle>
              <Badge variant="cyan" className="font-mono text-[10px]">
                ZERO MOCK DATA
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Jalankan tugas pemeliharaan berkala untuk menjaga latensi server tetap rendah dan mencegah kelebihan beban memori.
            </p>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Action 1: Clean Temp Media */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      <span>Bersihkan Cache Media Sementara</span>
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">Downloader Cache</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Menghapus riwayat stream downloader (TikTok, YouTube, IG, dll.) yang telah selesai diunduh oleh pengguna.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={actionLoading === "CLEAN_TEMP_MEDIA"}
                  onClick={() => handleMaintenance("CLEAN_TEMP_MEDIA", "Bersihkan Cache Media")}
                  className="mt-4 gap-1.5 text-xs self-start border-slate-700 hover:border-rose-500 hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Jalankan Pembersihan Media</span>
                </Button>
              </div>

              {/* Action 2: Vacuum Orphan Scan Results */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Vakum & Optimalkan Database Memori</span>
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">Database Vacuum</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Membersihkan scan hasil ad-hoc yang tidak terikat pada investigasi aktif, dan memicu garbage collection V8.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={actionLoading === "OPTIMIZE_VACUUM"}
                  onClick={() => handleMaintenance("OPTIMIZE_VACUUM", "Vakum Database Memori")}
                  className="mt-4 gap-1.5 text-xs self-start border-slate-700 hover:border-emerald-500 hover:text-emerald-300"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Optimalkan & Vakum</span>
                </Button>
              </div>

              {/* Action 3: Purge Old Audit Logs */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-purple-400" />
                      <span>Pangkas Audit Logs Lama (&gt; 30 Hari)</span>
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">Log Retention</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Memotong jejak audit keamanan yang telah melewati masa retensi standar 30 hari untuk menjaga performa query.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={actionLoading === "PURGE_AUDIT_LOGS"}
                  onClick={() => handleMaintenance("PURGE_AUDIT_LOGS", "Pangkas Audit Logs 30 Hari", { days: 30 })}
                  className="mt-4 gap-1.5 text-xs self-start border-slate-700 hover:border-purple-500 hover:text-purple-300"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Pangkas Log Lama</span>
                </Button>
              </div>

              {/* Action 4: Flush Network Query Cache */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Reset Cache Query Jaringan (DNS / IP)</span>
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">Network Cache</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Mengosongkan cache lookup pasif domain, rekaman DNS, dan geolokasi IP agar query berikutnya mengambil rincian paling mutakhir.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={actionLoading === "FLUSH_CACHE"}
                  onClick={() => handleMaintenance("FLUSH_CACHE", "Reset Cache Query Jaringan")}
                  className="mt-4 gap-1.5 text-xs self-start border-slate-700 hover:border-cyan-500 hover:text-cyan-300"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Kosongkan Cache Query</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}