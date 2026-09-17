"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Play,
  Clock,
  Shield,
  RefreshCw,
  Plus,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export default function AdminProvidersPage() {
  const { success, error: toastError } = useToast();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit/Key Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  // Testing states
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/admin/providers");
      const d = await res.json();
      if (d.success) setProviders(d.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const openEditModal = (provider: any) => {
    setSelectedProvider(provider);
    setApiKeyInput("");
    setBaseUrlInput(provider.baseUrl !== "-" ? provider.baseUrl : "");
    setEditModalOpen(true);
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    setSavingKey(true);

    try {
      const res = await fetch("/api/admin/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: selectedProvider.key,
          name: selectedProvider.name,
          apiKey: apiKeyInput,
          baseUrl: baseUrlInput,
        }),
      });

      const d = await res.json();
      if (!res.ok || !d.success) {
        toastError(d.error || "Gagal menyimpan API key");
        setSavingKey(false);
        return;
      }

      success(
        `Kunci API berhasil dienkripsi (AES-256-GCM) dan disimpan. Petunjuk: ${d.keyHint}`,
        "Tersimpan Aman"
      );
      setEditModalOpen(false);
      fetchProviders();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setSavingKey(false);
    }
  };

  const handleTestConnection = async (provider: any) => {
    setTestingId(provider.id);

    try {
      const res = await fetch(`/api/admin/providers/${provider.id}/test`, {
        method: "POST",
      });

      const d = await res.json();

      if (!res.ok || !d.success) {
        toastError(d.error || "Uji koneksi gagal.", "Gagal Terhubung");
      } else {
        success(`${d.message} (Latensi: ${d.latencyMs} ms)`, "Koneksi Berhasil");
        fetchProviders();
      }
    } catch (err: any) {
      toastError("Koneksi gagal: " + err.message);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <AppLayout userRole="ADMIN">
      <div className="space-y-6">
        {/* Navigation & Header */}
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
              Manajemen API Provider & Kredensial
            </h1>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchProviders}
            className="text-xs text-slate-400 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            <span>Refresh Status</span>
          </Button>
        </div>

        {/* Security Banner */}
        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 text-xs text-slate-300 flex items-start gap-3 backdrop-blur-md">
          <div className="rounded bg-purple-500/10 p-2 text-purple-400 shrink-0 border border-purple-500/20">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-white block mb-0.5">
              Standar Enkripsi Kredensial Tingkat Militer (AES-256-GCM):
            </span>
            Setiap API key yang dimasukkan dienkripsi menggunakan algoritma AES-256-GCM dengan 96-bit Initial Vector acak dan 128-bit authentication tag sebelum disimpan ke database vault. Kunci tidak pernah disimpan dalam format teks biasa (plaintext).
          </div>
        </div>

        {/* Providers Table */}
        <Card className="border-slate-800 bg-slate-900/60 p-5">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-800/60">
            <CardTitle className="text-sm font-semibold text-white">Daftar API Provider</CardTitle>
            <p className="text-xs text-slate-400">
              Konfigurasikan API key untuk mengaktifkan media downloader dan AI intelligence.
            </p>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                <tr>
                  <th className="p-3">Nama Provider</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">API Key Hint</th>
                  <th className="p-3">Endpoint Base</th>
                  <th className="p-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/80 transition-colors">
                    <td className="p-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-blue-400" />
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {p.category}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={p.status === "ACTIVE" ? "success" : "warning"}
                        className="text-[10px]"
                      >
                        {p.status === "ACTIVE" ? "AKTIF" : "KONFIGURASI DIPERLUKAN"}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-cyan-300 text-[11px]">
                      {p.keyHint}
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-[11px] truncate max-w-[180px]">
                      {p.baseUrl}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(p)}
                        className="text-xs h-7 px-2.5"
                      >
                        {p.hasKey ? "Ubah Kunci" : "Masukkan Kunci"}
                      </Button>

                      <Button
                        variant="glow"
                        size="sm"
                        onClick={() => handleTestConnection(p)}
                        isLoading={testingId === p.id}
                        className="text-xs h-7 px-2.5"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        <span>Uji Koneksi</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal: Input & Encrypt API Key */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogHeader>
            <DialogTitle>Konfigurasi API Key Terenkripsi</DialogTitle>
            <DialogDescription>
              {selectedProvider && (
                <span>
                  Memperbarui kredensial untuk provider{" "}
                  <strong className="text-white">{selectedProvider.name}</strong>. Kunci akan dienkripsi dengan AES-256-GCM.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveApiKey} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">API Key / Secret Token</label>
              <Input
                type="password"
                required
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-..."
                icon={<Lock className="h-4 w-4" />}
              />
              <p className="text-[10px] text-slate-400">
                Nilai ini akan dienkripsi di sisi server. Hanya petunjuk masking yang akan ditampilkan.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Endpoint Base URL (Opsional)</label>
              <Input
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="https://api..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="glow" isLoading={savingKey}>
                Simpan & Enkripsi Kunci
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}
