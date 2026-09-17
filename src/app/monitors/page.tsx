"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, Plus, Search, Rss, ArrowLeft, CheckCircle2, ExternalLink, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

export default function MonitorsPage() {
  const { success, error: toastError } = useToast();
  const [monitors, setMonitors] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [typeInput, setTypeInput] = useState<"rss" | "keyword">("rss");
  const [keywordFilter, setKeywordFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMonitors = async () => {
    try {
      const res = await fetch("/api/monitors");
      const d = await res.json();
      if (d.success) setMonitors(d.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

  const handleAddMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: typeInput,
          target: targetInput,
          keywordFilter,
        }),
      });

      const d = await res.json();
      if (!res.ok || !d.success) {
        toastError(d.error || "Gagal menambahkan monitor.");
        setLoading(false);
        return;
      }

      success("Pemantau feed/keyword berhasil diaktifkan!", "Monitor Aktif");
      setModalOpen(false);
      setTargetInput("");
      setKeywordFilter("");
      fetchMonitors();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMonitor = async (id: string, name: string) => {
    if (!confirm(`Hapus pemantauan "${name}"?`)) return;
    try {
      const res = await fetch(`/api/monitors?id=${id}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        success("Monitor berhasil dihapus.", "Terhapus");
        fetchMonitors();
      } else {
        toastError(d.error || "Gagal menghapus monitor");
      }
    } catch (err: any) {
      toastError(err.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Radio className="h-4 w-4" />
              <span>Pemantauan Kontinu</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Keyword & RSS Feed Monitor
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sistem pemindaian terjadwal untuk feed RSS berita publik dan kata kunci insiden.
            </p>
          </div>

          <Button
            variant="glow"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Monitor Baru</span>
          </Button>
        </div>

        {/* Monitors List */}
        <div className="space-y-4">
          {monitors.map((mon) => (
            <Card key={mon.id} className="border-slate-800 bg-slate-900/60 p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="cyan" className="text-[10px] uppercase font-mono">
                      {mon.type}
                    </Badge>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      AKTIF
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white">{mon.feedTitle || mon.target}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-1 truncate max-w-lg">
                    {mon.target}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono text-cyan-400 font-bold">
                      {mon.totalMatches} Temuan Terdeteksi
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Diperbarui: {formatDate(mon.lastChecked)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMonitor(mon.id, mon.feedTitle || mon.target)}
                    className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors ml-1"
                    title="Hapus Monitor"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Recent items */}
              {mon.recentItems && mon.recentItems.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-300">Artikel & Temuan Terakhir:</span>
                  <div className="space-y-1.5">
                    {mon.recentItems.slice(0, 3).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded bg-slate-950 p-2 text-xs"
                      >
                        <span className="text-slate-200 truncate max-w-md">{item.title}</span>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-cyan-400 inline-flex items-center gap-1 text-[11px]"
                          >
                            <span>Buka Sumber</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}

          {monitors.length === 0 && (
            <Card className="border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 space-y-3">
              <Radio className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm">Belum ada pemantau aktif.</p>
              <p className="text-xs text-slate-500">
                Klik tombol &quot;Tambah Monitor Baru&quot; untuk menambahkan URL feed RSS atau kata kunci intelijen.
              </p>
            </Card>
          )}
        </div>

        {/* Modal Add Monitor */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogHeader>
            <DialogTitle>Tambah Monitor Feed / Keyword</DialogTitle>
            <DialogDescription>
              Masukkan tautan feed RSS publik atau kata kunci ancaman yang ingin dipantau secara otomatis.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMonitor} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-300">Tipe Monitor</label>
              <select
                value={typeInput}
                onChange={(e: any) => setTypeInput(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="rss">Feed RSS Berita Publik</option>
                <option value="keyword">Kata Kunci Insiden / Brand</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-slate-300">
                {typeInput === "rss" ? "URL Feed RSS (contoh: https://feeds.bbci.co.uk/news/world/rss.xml)" : "Kata Kunci Target"}
              </label>
              <Input
                required
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder={typeInput === "rss" ? "https://..." : "Contoh: Ransomware XYZ"}
              />
            </div>

            {typeInput === "rss" && (
              <div className="space-y-1">
                <label className="font-medium text-slate-300">Filter Kata Kunci Tertentu (Opsional)</label>
                <Input
                  value={keywordFilter}
                  onChange={(e) => setKeywordFilter(e.target.value)}
                  placeholder="Contoh: cyber, breach, security"
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="glow" isLoading={loading}>
                Aktifkan Pemantau
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}
