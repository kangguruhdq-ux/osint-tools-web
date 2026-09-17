"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Printer,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const { success, error: toastError } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [targetsInput, setTargetsInput] = useState("");
  const [analystNotes, setAnalystNotes] = useState("");

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      const d = await res.json();
      if (d.success && Array.isArray(d.data)) {
        setReports(d.data);
      } else {
        setReports([]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const targets = targetsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          targets,
          analystNotes,
        }),
      });

      const d = await res.json();
      if (!res.ok || !d.success) {
        toastError(d.error || "Gagal membuat laporan");
        setLoading(false);
        return;
      }

      success("Laporan investigasi berhasil dibuat!", "Laporan Dibuat");
      setCreateModalOpen(false);
      setTitle("");
      setSummary("");
      setTargetsInput("");
      setAnalystNotes("");
      fetchReports();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string, repTitle: string) => {
    if (!confirm(`Hapus dokumen laporan "${repTitle}"?`)) return;

    try {
      const res = await fetch(`/api/reports?id=${reportId}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        success("Laporan berhasil dihapus.", "Terhapus");
        fetchReports();
      } else {
        toastError(d.error || "Gagal menghapus laporan");
      }
    } catch (err: any) {
      toastError(err.message);
    }
  };

  const handleExportJson = (rep: any) => {
    const jsonStr = JSON.stringify(rep, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rep.reportId}_report.json`;
    a.click();
    URL.revokeObjectURL(url);
    success("Laporan berhasil diekspor ke JSON.", "Unduhan Siap");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <FileText className="h-4 w-4" />
              <span>Dokumentasi Resmi</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Laporan Investigasi OSINT
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Daftar dokumen intelijen resmi yang telah disusun dan siap diekspor ke format JSON, CSV, atau PDF siap cetak.
            </p>
          </div>

          <Button
            variant="glow"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Laporan Baru</span>
          </Button>
        </div>

        <div className="space-y-3">
          {reports.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900/40 p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 mb-3">
                <FileText className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">Belum Ada Laporan Investigasi</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Susun laporan intelijen pertama Anda dari data investigasi atau klik tombol di bawah untuk membuat laporan baru.
              </p>
              <Button
                variant="glow"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 gap-1.5 text-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Laporan Pertama</span>
              </Button>
            </Card>
          ) : (
            reports.map((rep) => (
            <Card key={rep.reportId} className="border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-cyan-400 text-xs font-bold">{rep.reportId}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {rep.classification || "CONFIDENTIAL"}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-white">{rep.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 max-w-2xl">
                    {rep.executiveSummary || rep.summary}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
                    <span>Analis: {rep.leadAnalyst || "Senior OSINT Analyst"}</span>
                    <span>•</span>
                    <span>{formatDate(rep.generatedAt || new Date())}</span>
                    <span>•</span>
                    <span className="text-emerald-400">
                      {rep.findingsSummary?.totalFindings || 0} Temuan Terverifikasi
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportJson(rep)}
                    className="text-xs text-slate-300"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    <span>JSON</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.print()}
                    className="text-xs text-slate-300"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" />
                    <span>Cetak PDF</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteReport(rep.reportId, rep.title)}
                    className="text-xs p-2 h-8"
                    title="Hapus Laporan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          )))}
        </div>

        {/* Modal: Create Report */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogHeader>
            <DialogTitle>Buat Laporan Investigasi Baru</DialogTitle>
            <DialogDescription>
              Dokumentasikan hasil temuan dan susun ringkasan eksekutif berstandar hukum.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Judul Laporan</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Laporan Analisis Phishing Domain X"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Target Investigasi (pisahkan koma)</label>
              <Input
                value={targetsInput}
                onChange={(e) => setTargetsInput(e.target.value)}
                placeholder="target.com, 104.21.48.18, @username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Ringkasan Eksekutif</label>
              <textarea
                rows={3}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Tuliskan ringkasan temuan dan ancaman utama..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Catatan Analis Tambahan</label>
              <textarea
                rows={2}
                value={analystNotes}
                onChange={(e) => setAnalystNotes(e.target.value)}
                placeholder="Rekomendasi mitigasi atau catatan teknis..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="glow" isLoading={loading}>
                Generate Laporan Resmi
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}
