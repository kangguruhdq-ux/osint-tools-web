"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Trash2,
  Download,
  Eye,
  Shield,
  Edit,
  Save,
  Check,
  RefreshCw,
  Printer,
  FileDown,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

export default function AdminReportsPage() {
  const { success, error: toastError } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("ALL");

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editClassification, setEditClassification] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const d = await res.json();
      if (d.success && Array.isArray(d.data)) {
        setReports(d.data);
      } else {
        setReports([]);
      }
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (reportId: string, title: string) => {
    if (!confirm(`Hapus dokumen laporan "${title}" secara permanen?`)) return;

    try {
      const res = await fetch(`/api/reports?id=${reportId}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        success("Laporan berhasil dihapus.", "Terhapus");
        fetchReports();
      } else {
        toastError(d.error || "Gagal menghapus laporan.");
      }
    } catch (err: any) {
      toastError(err.message);
    }
  };

  const handleBulkPurge = async () => {
    if (reports.length === 0) return;
    if (!confirm("PERINGATAN: Apakah Anda yakin ingin membersihkan SELURUH laporan investigasi untuk efisiensi penyimpanan? Tindakan ini tidak dapat dibatalkan.")) return;

    try {
      const res = await fetch("/api/reports?all=true", { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        success(d.message || "Seluruh laporan berhasil dibersihkan.", "Pembersihan Selesai");
        fetchReports();
      } else {
        toastError(d.error || "Gagal membersihkan laporan.");
      }
    } catch (err: any) {
      toastError(err.message);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setSaving(true);
    try {
      const res = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReport.reportId,
          classification: editClassification,
          title: editTitle,
          analystNotes: editNotes,
        }),
      });

      const d = await res.json();
      if (!res.ok || !d.success) {
        throw new Error(d.error || "Gagal memperbarui laporan.");
      }

      success("Metadata laporan berhasil diperbarui.", "Tersimpan");
      setEditModalOpen(false);
      fetchReports();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportAllJson = () => {
    const jsonStr = JSON.stringify(reports, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus_all_reports_archive_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success("Arsip seluruh laporan berhasil diekspor.", "Unduhan Siap");
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      (r.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.reportId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.leadAnalyst || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      filterClass === "ALL" || (r.classification || "").toUpperCase().includes(filterClass);

    return matchesSearch && matchesClass;
  });

  return (
    <AppLayout userRole="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
              <Shield className="h-4 w-4" />
              <span>Admin Console • Central Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Manajemen Laporan Global
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Kelola, audit klasifikasi, cetak, dan pangkas seluruh dokumen laporan investigasi yang disusun oleh para analis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAllJson}
              disabled={reports.length === 0}
              className="gap-1.5 text-xs border-slate-700 hover:text-cyan-300"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Ekspor Semua JSON</span>
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkPurge}
              disabled={reports.length === 0}
              className="gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Bersihkan Semua Laporan</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID laporan, judul, atau nama analis..."
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Semua Klasifikasi</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="DEFENSIVE">DEFENSIVE</option>
              <option value="RESTRICTED">RESTRICTED</option>
              <option value="PUBLIC">PUBLIC</option>
            </select>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchReports}
              className="text-xs text-slate-400 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Memuat daftar laporan...
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900/40 p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 mb-3">
                <FileText className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">Tidak Ada Dokumen Laporan</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {reports.length === 0
                  ? "Belum ada laporan yang disusun oleh analis di platform ini."
                  : "Tidak ada laporan yang cocok dengan kata kunci pencarian Anda."}
              </p>
            </Card>
          ) : (
            filteredReports.map((rep) => (
              <Card key={rep.reportId} className="border-slate-800 bg-slate-900/60 p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-cyan-400 text-xs font-bold">{rep.reportId}</span>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {rep.classification || "CONFIDENTIAL"}
                      </Badge>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatDate(rep.generatedAt)}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-white">{rep.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {rep.executiveSummary || rep.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                      <span>Analis: <span className="text-slate-200">{rep.leadAnalyst}</span></span>
                      <span>Temuan: <span className="text-cyan-400">{rep.findingsSummary?.totalFindings || 0} items</span></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(rep);
                        setDetailModalOpen(true);
                      }}
                      className="text-xs h-8 gap-1 border-slate-700 hover:text-cyan-300"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Rincian</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(rep);
                        setEditTitle(rep.title);
                        setEditClassification(rep.classification || "CONFIDENTIAL / OSINT");
                        setEditNotes(rep.analystNotes || "");
                        setEditModalOpen(true);
                      }}
                      className="text-xs h-8 gap-1 border-slate-700 hover:text-blue-300"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(rep.reportId, rep.title)}
                      className="text-xs h-8 p-2"
                      title="Hapus Laporan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Modal: View Details */}
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          {selectedReport && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-cyan-400 text-xs font-bold">{selectedReport.reportId}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedReport.classification}
                  </Badge>
                </div>
                <DialogTitle>{selectedReport.title}</DialogTitle>
                <DialogDescription>
                  Disusun oleh {selectedReport.leadAnalyst} • {formatDate(selectedReport.generatedAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-white mb-1">Ringkasan Eksekutif</h4>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-slate-300 leading-relaxed">
                    {selectedReport.executiveSummary || selectedReport.summary}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">Target Ruang Lingkup (Scope)</h4>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-slate-300 font-mono text-[11px]">
                    {selectedReport.scopeTargets ? selectedReport.scopeTargets.join(", ") : "-"}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">Catatan Analis</h4>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-slate-300 leading-relaxed">
                    {selectedReport.analystNotes || "Tidak ada catatan khusus."}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">Pernyataan Hukum & Metodologi</h4>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-slate-400 text-[11px] leading-relaxed">
                    {selectedReport.methodology || "Investigasi pasif OSINT berstandar GDPR & ISO 27001."}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const jsonStr = JSON.stringify(selectedReport, null, 2);
                    const blob = new Blob([jsonStr], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${selectedReport.reportId}_export.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh JSON</span>
                </Button>

                <Button
                  variant="glow"
                  size="sm"
                  onClick={() => setDetailModalOpen(false)}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </Dialog>

        {/* Modal: Edit Report */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogHeader>
            <DialogTitle>Edit Metadata Laporan</DialogTitle>
            <DialogDescription>
              Ubah klasifikasi keamanan atau catatan khusus laporan ID {selectedReport?.reportId}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Judul Dokumen</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Klasifikasi Keamanan</label>
              <select
                value={editClassification}
                onChange={(e) => setEditClassification(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="CONFIDENTIAL / OSINT DEFENSIVE REPORT">CONFIDENTIAL / OSINT</option>
                <option value="DEFENSIVE THREAT REPORT">DEFENSIVE THREAT REPORT</option>
                <option value="RESTRICTED / INTERNAL AUDIT">RESTRICTED / INTERNAL AUDIT</option>
                <option value="PUBLIC DISCLOSURE READY">PUBLIC DISCLOSURE READY</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Catatan Analis</label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="glow"
                size="sm"
                isLoading={saving}
                className="gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Perubahan</span>
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}