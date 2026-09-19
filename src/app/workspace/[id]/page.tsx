"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  FolderKanban,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Download,
  Plus,
  Tag,
  CheckCircle2,
  Trash2,
  Share2,
  Printer,
  Shield,
  Search,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InvestigationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const invId = resolvedParams.id;
  const { success, error: toastError } = useToast();

  const [notes, setNotes] = useState(
    "Target terindikasi menggunakan CDN Cloudflare dan sertifikat TLS Let's Encrypt aktif. Catatan pasif menunjukkan tidak ada kebocoran port berbahaya pada DNS MX."
  );
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [newFindingModalOpen, setNewFindingModalOpen] = useState(false);

  // Finding form
  const [findingTitle, setFindingTitle] = useState("");
  const [findingCategory, setFindingCategory] = useState("DNS");
  const [findingSource, setFindingSource] = useState("");
  const [findingDesc, setFindingDesc] = useState("");

  const [timelineEvents, setTimelineEvents] = useState([
    {
      id: "ev-1",
      title: "Pemeriksaan DNS A Record Selesai",
      category: "DNS",
      description: "IP resolved: 104.21.48.18 (Cloudflare Inc, US). Tidak ditemukan IP origin terekspos.",
      timestamp: new Date(Date.now() - 3600000 * 2),
      confidence: 1.0,
      source: "Native DNS Resolver",
    },
    {
      id: "ev-2",
      title: "Query WHOIS IANA/TLD Dieksekusi",
      category: "WHOIS",
      description: "Registrar: NameCheap Inc. Usia domain: 3 tahun. Proteksi privasi WHOIS aktif.",
      timestamp: new Date(Date.now() - 3600000 * 1),
      confidence: 0.95,
      source: "Port 43 WHOIS Socket",
    },
    {
      id: "ev-3",
      title: "Ekstraksi Indikator Ancaman (IOC)",
      category: "IOC",
      description: "Ditemukan 2 domain mencurigakan dan 1 hash SHA-256 dalam payload laporan insiden.",
      timestamp: new Date(Date.now() - 1800000),
      confidence: 0.9,
      source: "IOC Regex & Threat Pattern Engine",
    },
  ]);

  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    setTimeout(() => {
      setIsSavingNotes(false);
      success("Catatan analis berhasil diperbarui.", "Tersimpan");
    }, 500);
  };

  const handleAddFinding = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent = {
      id: "ev-" + Date.now(),
      title: findingTitle,
      category: findingCategory,
      description: findingDesc,
      timestamp: new Date(),
      confidence: 1.0,
      source: findingSource || "Catatan Manual Analis",
    };
    setTimelineEvents([newEvent, ...timelineEvents]);
    setNewFindingModalOpen(false);
    setFindingTitle("");
    setFindingDesc("");
    setFindingSource("");
    success("Temuan baru berhasil ditambahkan ke timeline.", "Ditambahkan");
  };

  const exportJSON = () => {
    const reportData = {
      project: {
        id: invId,
        title: "Investigasi Domain & Infrastruktur Target A",
        exportDate: new Date().toISOString(),
        analystNotes: notes,
      },
      findings: timelineEvents,
      disclaimer:
        "Dokumen ini dibuat secara otomatis oleh NEXUS OSINT TOOLS Enterprise. Seluruh informasi diperoleh dari data publik legal dan audit pasif.",
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-report-${invId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success("Laporan JSON berhasil diunduh.", "Ekspor Berhasil");
  };

  const exportCSV = () => {
    let csv = "Timestamp,Kategori,Judul,Deskripsi,Sumber,Confidence\n";
    for (const ev of timelineEvents) {
      csv += `"${ev.timestamp.toISOString()}","${ev.category}","${ev.title.replace(/"/g, '""')}","${ev.description.replace(/"/g, '""')}","${ev.source}","${ev.confidence}"\n`;
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-findings-${invId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success("Laporan CSV berhasil diunduh.", "Ekspor Berhasil");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation back and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/workspace">
              <Button variant="ghost" size="sm" className="gap-1 text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <span className="text-xs font-mono text-cyan-400">{invId}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportModalOpen(true)}
              className="gap-1.5 text-xs text-slate-200"
            >
              <Download className="h-4 w-4 text-blue-400" />
              <span>Ekspor Laporan</span>
            </Button>
            <Button
              variant="glow"
              size="sm"
              onClick={() => setNewFindingModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Temuan</span>
            </Button>
          </div>
        </div>

        {/* Project Header */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="warning" className="text-[10px]">
                  PRIORITAS: HIGH
                </Badge>
                <Badge variant="cyan" className="text-[10px]">
                  STATUS: OPEN
                </Badge>
                <span className="text-xs text-slate-400 font-mono">
                  Dibuat: {formatDate(new Date())}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Investigasi Domain & Infrastruktur Target A
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Analisis pasif reputasi domain, sertifikat TLS, DNS record, dan pemetaan ASN server.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 md:self-start">
              {["cyber-threat", "domain-recon", "phishing-check"].map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-[11px] text-slate-400 font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content: Analyst Notes & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline of Findings */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Timeline Temuan Intelijen</h3>
                <p className="text-xs text-slate-400">Kronologi temuan yang tersimpan dalam project ini.</p>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                {timelineEvents.length} Peristiwa Tercatat
              </span>
            </div>

            <div className="space-y-3">
              {timelineEvents.map((ev) => (
                <Card
                  key={ev.id}
                  className="border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400 border border-blue-500/20 shrink-0 mt-0.5">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">
                            {ev.title}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {ev.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                          {ev.description}
                        </p>
                        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                          <span>Sumber: {ev.source}</span>
                          <span>•</span>
                          <span className="text-emerald-400">
                            Confidence: {Math.round(ev.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {formatDate(ev.timestamp)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Analyst Notes Sidebar */}
          <div className="space-y-4">
            <Card className="border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <span>Catatan Analis (Markdown)</span>
                </div>
                <Button
                  variant="glow"
                  size="sm"
                  onClick={handleSaveNotes}
                  isLoading={isSavingNotes}
                  className="text-xs h-7 px-2.5"
                >
                  Simpan Catatan
                </Button>
              </div>

              <textarea
                rows={10}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tulis hipotesis, catatan insiden, atau observasi intelijen..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed font-mono"
              />

              <div className="mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
                Catatan ini secara otomatis disematkan ke dalam laporan ekspor resmi.
              </div>
            </Card>
          </div>
        </div>

        {/* Modal: Export Report */}
        <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
          <DialogHeader>
            <DialogTitle>Ekspor Laporan Investigasi</DialogTitle>
            <DialogDescription>
              Pilih format ekspor laporan intelijen resmi yang mematuhi standar pembuktian hukum.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div
              onClick={exportJSON}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div>
                <div className="font-semibold text-white text-xs">Format JSON Terstruktur</div>
                <div className="text-[11px] text-slate-400">Cocok untuk integrasi SIEM, SOAR, atau platform analitik.</div>
              </div>
              <Button variant="outline" size="sm" className="text-xs">
                Unduh JSON
              </Button>
            </div>

            <div
              onClick={exportCSV}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div>
                <div className="font-semibold text-white text-xs">Format Tabel CSV</div>
                <div className="text-[11px] text-slate-400">Dapat dibuka di Excel atau Google Sheets untuk audit log.</div>
              </div>
              <Button variant="outline" size="sm" className="text-xs">
                Unduh CSV
              </Button>
            </div>

            <div
              onClick={() => {
                window.print();
              }}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <div>
                <div className="font-semibold text-white text-xs">Cetak Laporan / PDF</div>
                <div className="text-[11px] text-slate-400">Cetak langsung ke printer atau simpan sebagai file PDF.</div>
              </div>
              <Button variant="glow" size="sm" className="text-xs">
                Cetak / Simpan PDF
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </Dialog>

        {/* Modal: Add Finding */}
        <Dialog open={newFindingModalOpen} onOpenChange={setNewFindingModalOpen}>
          <DialogHeader>
            <DialogTitle>Tambah Temuan Manual</DialogTitle>
            <DialogDescription>
              Catat bukti atau temuan intelijen baru ke dalam timeline investigasi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddFinding} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-300">Judul Temuan</label>
              <Input
                required
                value={findingTitle}
                onChange={(e) => setFindingTitle(e.target.value)}
                placeholder="Contoh: Terdeteksi Subdomain Mengarah ke Server Staging"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-300">Kategori</label>
                <select
                  value={findingCategory}
                  onChange={(e) => setFindingCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="DNS">DNS</option>
                  <option value="WHOIS">WHOIS</option>
                  <option value="IP">IP & ASN</option>
                  <option value="IOC">Indikator Ancaman (IOC)</option>
                  <option value="SOCIAL">Social Media</option>
                  <option value="FILE">Analisis File / EXIF</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Sumber Informasi</label>
                <Input
                  value={findingSource}
                  onChange={(e) => setFindingSource(e.target.value)}
                  placeholder="Contoh: Log DNS Internal"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-300">Rincian / Deskripsi Temuan</label>
              <textarea
                rows={3}
                required
                value={findingDesc}
                onChange={(e) => setFindingDesc(e.target.value)}
                placeholder="Jelaskan signifikansi temuan terhadap investigasi..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewFindingModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="glow">
                Simpan ke Timeline
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}
