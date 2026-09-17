"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Shield,
  Clock,
  Search,
  CheckCircle2,
  Trash2,
  Download,
  FileText,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const { success, error: toastError } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [clearing, setClearing] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs");
      const d = await res.json();
      if (d.success) setLogs(d.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!confirm("Apakah Anda yakin ingin membersihkan seluruh riwayat audit log keamanan?")) return;
    setClearing(true);
    try {
      const res = await fetch("/api/admin/audit-logs", { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        success("Seluruh audit log berhasil dibersihkan.", "Log Dibersihkan");
        setLogs([]);
      } else {
        toastError(d.error || "Gagal membersihkan log");
      }
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setClearing(false);
    }
  };

  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus_audit_logs_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success("File audit log JSON berhasil diunduh.", "Ekspor Berhasil");
  };

  const filtered = logs.filter(
    (l) =>
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.resourceType?.toLowerCase().includes(search.toLowerCase()) ||
      (l.ipAddress && l.ipAddress.includes(search))
  );

  return (
    <AppLayout userRole="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-1 text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                <span>Admin Console</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Audit Log Keamanan & Aktivitas Sistem
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportLogs}
              disabled={logs.length === 0}
              className="gap-1.5 text-xs text-slate-300"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor Log</span>
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearLogs}
              disabled={logs.length === 0 || clearing}
              isLoading={clearing}
              className="gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Bersihkan Log</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter aksi, resource, atau IP..."
              className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Total Record: <span className="text-white font-semibold">{filtered.length}</span>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/60 p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                <tr>
                  <th className="p-3">Waktu Kejadian</th>
                  <th className="p-3">Aksi (Action)</th>
                  <th className="p-3">Tipe Resource</th>
                  <th className="p-3">Alamat IP</th>
                  <th className="p-3">Rincian / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/80 transition-colors">
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="p-3 font-semibold text-white">
                      <Badge variant="cyan" className="text-[10px] font-mono">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-slate-300">{log.resourceType}</td>
                    <td className="p-3 font-mono text-blue-400">{log.ipAddress || "127.0.0.1"}</td>
                    <td className="p-3 text-slate-400">
                      {log.details ? JSON.stringify(log.details) : "Sukses diverifikasi"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Tidak ada catatan audit log yang tersimpan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
