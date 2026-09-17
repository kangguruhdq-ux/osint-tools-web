import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function TermsOfServicePage() {
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
            <FileText className="h-3.5 w-3.5" />
            <span>Perjanjian Penggunaan Layanan</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Syarat & Ketentuan (Terms of Service)
          </h1>
          <p className="text-xs text-slate-400">
            Terakhir Diperbarui: 16 September 2026 • Versi Dokumen: 1.0-LEGAL
          </p>
        </div>

        <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-6 text-slate-300">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">1. Batasan Penggunaan yang Sah (Acceptable Use Policy)</h2>
            <p>
              Dengan mendaftar atau menggunakan layanan NEXUS OSINT TOOLS, Anda menyetujui bahwa penggunaan platform ini hanya untuk tujuan legal, riset akademis, analisis keamanan siber defensif, due diligence, dan jurnalisme investigasi yang sah.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">2. Larangan Aktivitas Siber Berbahaya</h2>
            <p>
              Pengguna DILARANG KERAS menggunakan NEXUS OSINT TOOLS untuk:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Melakukan penyerangan terhadap infrastruktur jaringan (seperti DDoS, credential stuffing, SQL injection, atau eksploitasi kerentanan).</li>
              <li>Membypass mekanisme login, paywall, captcha, atau enkripsi DRM platform pihak ketiga.</li>
              <li>Mengumpulkan informasi privat tanpa hak (doxxing, cyberstalking, atau pencurian data identitas).</li>
              <li>Menyebarkan malware atau indikator ancaman dengan maksud jahat.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">3. Penafian Tanggung Jawab (Disclaimer of Warranty)</h2>
            <p>
              Layanan disediakan &quot;sebagaimana adanya&quot; (as-is). NEXUS OSINT TOOLS tidak memberikan jaminan kelengkapan absolut terhadap perubahan data eksternal oleh penyedia domain, registrar, atau platform media pihak ketiga.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
