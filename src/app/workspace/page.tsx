"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Search,
  Tag,
  Calendar,
  AlertCircle,
  FileText,
  Trash2,
  ExternalLink,
  Shield,
  Clock,
  CheckCircle2,
  Edit3,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface InvestigationItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: string;
  analystNotes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function WorkspacePage() {
  const { success, error: toastError } = useToast();
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Create Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [analystNotes, setAnalystNotes] = useState("");

  // Edit Form states
  const [editId, setEditId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [editStatus, setEditStatus] = useState("OPEN");
  const [editNotes, setEditNotes] = useState("");

  const fetchInvestigations = async () => {
    try {
      const res = await fetch("/api/investigations");
      const data = await res.json();
      if (data.success) {
        setInvestigations(data.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = tagInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch("/api/investigations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          tags,
          priority,
          analystNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError(data.error || "Gagal membuat project");
        setLoading(false);
        return;
      }

      success("Project investigasi berhasil dibuat!", "Berhasil");
      setCreateModalOpen(false);
      setTitle("");
      setDescription("");
      setTagInput("");
      setAnalystNotes("");
      fetchInvestigations();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (inv: InvestigationItem) => {
    setEditId(inv.id);
    setEditTitle(inv.title);
    setEditDescription(inv.description || "");
    setEditTags((inv.tags || []).join(", "));
    setEditPriority(inv.priority);
    setEditStatus(inv.status || "OPEN");
    setEditNotes(inv.analystNotes || "");
    setEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setEditLoading(true);

    try {
      const tags = editTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch("/api/investigations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          title: editTitle,
          description: editDescription,
          tags,
          priority: editPriority,
          status: editStatus,
          analystNotes: editNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toastError(data.error || "Gagal memperbarui investigasi");
        setEditLoading(false);
        return;
      }

      success("Investigasi berhasil diperbarui!", "Tersimpan");
      setEditModalOpen(false);
      fetchInvestigations();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string, invTitle: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus investigasi "${invTitle}"?`)) return;

    try {
      const res = await fetch(`/api/investigations?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        success("Investigasi berhasil dihapus.", "Terhapus");
        fetchInvestigations();
      } else {
        toastError(data.error || "Gagal menghapus investigasi");
      }
    } catch (err: any) {
      toastError(err.message);
    }
  };

  const filtered = investigations.filter(
    (inv) =>
      inv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <FolderKanban className="h-4 w-4" />
              <span>Workspace Analisis</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Project Investigasi OSINT
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Simpan temuan, kelola hasil scan 36 tools, buat timeline, dan ekspor laporan intelijen.
            </p>
          </div>

          <Button
            variant="glow"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Investigasi Baru</span>
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul atau tag..."
              className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-4 text-xs text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="text-xs text-slate-400">
            Menampilkan <span className="text-white font-mono">{filtered.length}</span> project aktif
          </div>
        </div>

        {/* Investigations List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((inv) => (
            <Card
              key={inv.id}
              className="border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
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
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDate(inv.createdAt)}
                    </span>
                  </div>

                  <Link href={`/workspace/${inv.id}`} className="group">
                    <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {inv.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {inv.description || "Tidak ada deskripsi tambahan."}
                  </p>

                  {/* Tags */}
                  {inv.tags && inv.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {inv.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{inv.status}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(inv)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      title="Edit Investigasi"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(inv.id, inv.title)}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Hapus Investigasi"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <Link href={`/workspace/${inv.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-white p-0 h-auto font-medium gap-1 ml-1">
                        <span>Buka</span>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal: Create Investigation */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogHeader>
            <DialogTitle>Buat Project Investigasi Baru</DialogTitle>
            <DialogDescription>
              Wadah terpusat untuk menyimpan hasil scan intelijen, catatan analis, dan timeline peristiwa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Nama / Judul Project</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Audit Keamanan Domain Target XYZ"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Deskripsi Kasus</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan latar belakang dan cakupan investigasi..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Tingkat Prioritas</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Tags (pisahkan koma)</label>
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="cyber, phishing, threat"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Catatan Analis Awal</label>
              <textarea
                rows={2}
                value={analystNotes}
                onChange={(e) => setAnalystNotes(e.target.value)}
                placeholder="Catatan teknis, hipotesis awal..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" variant="glow" isLoading={loading}>
                Simpan & Buka Project
              </Button>
            </DialogFooter>
          </form>
        </Dialog>

        {/* Modal: Edit Investigation */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogHeader>
            <DialogTitle>Edit Project Investigasi</DialogTitle>
            <DialogDescription>
              Perbarui rincian investigasi, prioritas kasus, status, dan catatan analis.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Nama / Judul Project</label>
              <Input
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Judul investigasi..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Deskripsi Kasus</label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Deskripsi..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Tingkat Prioritas</label>
                <select
                  value={editPriority}
                  onChange={(e: any) => setEditPriority(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Status Kasus</label>
                <select
                  value={editStatus}
                  onChange={(e: any) => setEditStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Tags (pisahkan koma)</label>
              <Input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="cyber, threat, recon"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Catatan Analis</label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Catatan perkembangan kasus..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" variant="glow" isLoading={editLoading}>
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}
