import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Trash2, Shield } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function DataRetentionPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        <div className="space-y-4 border-b border-slate-800 pb-6 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-xs font-semibold text-blue-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Kebijakan Retensi & Masa Simpan Data</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Kebijakan Retensi Data (Data Retention Policy)
          </h1>
          <p className="text-xs text-slate-400">
            Terakhir Diperbarui: 16 September 2026 • Versi Dokumen: 1.0-LEGAL
          </p>
        </div>

        <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-6 text-slate-300">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">1. Penghapusan Otomatis File Sementara (Auto-Deletion)</h2>
            <p>
              Demi efisiensi penyimpanan dan privasi pengguna, seluruh file media sementara yang diunduh melalui modul Media Downloader, kompresor gambar, atau konversi berkas akan otomatis dihapus secara permanen dari server penyimpanan dalam waktu <strong>maksimal 24 jam</strong> sejak proses pembuatan.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">2. Masa Simpan Log Audit</h2>
            <p>
              Log aktivitas sistem dan audit keamanan disimpan selama <strong>90 hari kalender</strong> untuk kepentingan verifikasi kepatuhan, pemantauan SSRF, dan pelacakan insiden, setelah itu log akan dipurging secara otomatis.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">3. Penghapusan Manual Oleh Pengguna</h2>
            <p>
              Pengguna memiliki hak penuh untuk menghapus project investigasi, timeline event, atau riwayat scan mereka secara instan sewaktu-waktu. Penghapusan manual oleh pengguna akan mengeksekusi penghapusan tuntas dari database vault.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
