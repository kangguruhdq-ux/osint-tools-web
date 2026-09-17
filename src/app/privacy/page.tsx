import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Terminal, Lock } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function PrivacyPolicyPage() {
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
            <Shield className="h-3.5 w-3.5" />
            <span>Kepatuhan Privasi & Regulasi Internasional</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Kebijakan Privasi (Privacy Policy)
          </h1>
          <p className="text-xs text-slate-400">
            Terakhir Diperbarui: 16 September 2026 • Versi Dokumen: 1.0-LEGAL
          </p>
        </div>

        <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-6 text-slate-300">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">1. Prinsip Utama Pengumpulan Data</h2>
            <p>
              NEXUS OSINT TOOLS Enterprise beroperasi berdasarkan prinsip <em>Ethical & Defensive OSINT</em>. Kami hanya mengumpulkan, memproses, dan menyajikan informasi yang tersedia secara publik di internet (seperti DNS publik, data registrasi domain WHOIS publik, alamat IP publik, dan postingan media sosial terbuka).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">2. Larangan Doxxing & Perlindungan Data Pribadi</h2>
            <p>
              Platform kami secara tegas melarang segala bentuk doxxing, pelecehan siber, stalking, dan pencarian data sensitif privat. Sistem kami secara bawaan (by default):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Menyembunyikan koordinat GPS pada modul Image Metadata Viewer.</li>
              <li>Menolak pencarian alamat rumah fisik, nomor telepon pribadi privat, atau identitas pemilik email perorangan.</li>
              <li>Menyaring dan memblokir alamat IP privat, loopback localhost, dan cloud metadata AWS/GCP via modul SSRF Guard.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">3. Keamanan & Enkripsi Kredensial</h2>
            <p>
              Seluruh API key pihak ketiga yang disimpan oleh pengguna atau administrator disimpan dalam keadaan terenkripsi menggunakan algoritma standar militer <strong>AES-256-GCM</strong> dengan tag autentikasi terisolasi. Data kata sandi di-hash menggunakan algoritma <strong>bcrypt</strong> dengan cost factor 12.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-white">4. Hak Pengguna Atas Data (Data Subject Rights)</h2>
            <p>
              Pengguna memiliki hak penuh untuk meminta penghapusan akun, penghapusan catatan investigasi, dan pembersihan log aktivitas sewaktu-waktu melalui halaman Pengaturan Akun.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
