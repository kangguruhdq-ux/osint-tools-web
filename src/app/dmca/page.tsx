import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function DmcaPolicyPage() {
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
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Kepatuhan Hak Cipta Digital</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Kebijakan Hak Cipta & DMCA (Copyright Policy)
          </h1>
          <p className="text-xs text-slate-400">
            Terakhir Diperbarui: 16 September 2026 • Versi Dokumen: 1.0-LEGAL
          </p>
        </div>

        <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-6 text-slate-300">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">1. Kebijakan Media Downloader & Hak Cipta</h2>
            <p>
              Seluruh utilitas pengunduh media publik pada platform ini dirancang eksklusif untuk konten yang dimiliki langsung oleh pengguna atau konten yang memiliki izin lisensi publik (misalnya Creative Commons atau materi domain publik). Pengguna bertanggung jawab penuh untuk memastikan mereka memiliki hak yang sah sebelum mengunduh materi berhak cipta.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">2. Prosedur Pemberitahuan DMCA Takedown</h2>
            <p>
              Jika Anda adalah pemilik hak cipta dan meyakini bahwa konten Anda disalahgunakan atau diindeks tanpa izin melalui layanan kami, silakan kirimkan notifikasi takedown resmi ke alamat kontak kepatuhan kami:
            </p>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 font-mono text-[11px] text-cyan-300">
              Email Legal & DMCA: legal@nexus-osint.io<br />
              Subjek: [DMCA Takedown Request] - NEXUS OSINT TOOLS
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
