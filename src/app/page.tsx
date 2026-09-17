"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  Shield,
  Search,
  Globe,
  Download,
  Brain,
  FileCode,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronDown,
  Layers,
  Sparkles,
  Zap,
  Server,
  KeyRound,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TOOLS_CATALOG, ToolDefinition } from "@/lib/tools-data";

export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredTools = TOOLS_CATALOG.filter((tool) => {
    const matchesCategory =
      activeCategory === "all" || tool.category === activeCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const faqs = [
    {
      q: "Apakah seluruh aktivitas di NEXUS OSINT TOOLS legal?",
      a: "Ya, 100% legal. NEXUS dirancang eksklusif untuk analisis data publik, audit keamanan defensif, dan media berizin. Kami tidak menyediakan fitur peretasan, tidak membypass akun privat, tidak melakukan scraping ilegal yang melanggar ketentuan, dan memblokir target privat melalui modul SSRF Guard.",
    },
    {
      q: "Bagaimana cara kerja fitur Media Downloader?",
      a: "Media Downloader menggunakan provider legal untuk mengunduh konten publik milik pengguna atau konten yang memiliki izin lisensi publik. Jika API provider belum dikonfigurasi, sistem menampilkan petunjuk integrasi API key di Admin Dashboard dan menyimpannya dengan enkripsi AES-256-GCM.",
    },
    {
      q: "Mengapa koordinat GPS disembunyikan pada Image Metadata Viewer?",
      a: "Sebagai komitmen terhadap etika OSINT dan privasi data (anti-doxxing), koordinat GPS pada data EXIF gambar di-masking secara default dan hanya dapat dibuka oleh analis dengan konfirmasi eksplisit.",
    },
    {
      q: "Bagaimana sistem melindungi dari serangan SSRF?",
      a: "Setiap URL target yang dimasukkan ke dalam modul network scanner atau link extractor divalidasi sebelum request dikirim. Host seperti localhost (127.0.0.1), subnet RFC 1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), serta AWS/GCP cloud metadata (169.254.169.254) secara otomatis ditolak.",
    },
    {
      q: "Apakah laporan investigasi dapat diekspor?",
      a: "Ya. Hasil investigasi pada OSINT Workspace dapat diekspor ke dalam format JSON terstruktur, CSV, dan tampilan print-ready PDF lengkap dengan skor keyakinan, sumber data, dan timeline peristiwa.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        {/* Glowing atmospheric circles */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-12 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400 mb-6 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>NEXUS OSINT TOOLS 1.0 Enterprise SaaS</span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-300">36 Tools Nyata Terintegrasi</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-tight sm:leading-none">
            Satu Workspace untuk{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              OSINT Legal
            </span>{" "}
            dan Media Intelligence
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Platform all-in-one terpercaya untuk investigasi domain, analisis data publik, social media intelligence, ekstraksi indikator ancaman (IOC), media downloader berizin, dan digital utilities.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="glow" size="lg" className="w-full sm:w-auto gap-2 px-8 py-6 text-base shadow-xl shadow-blue-600/30">
                <span>Mulai Sekarang</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#tools" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 px-8 py-6 text-base border-slate-700 bg-slate-900/80">
                <Search className="h-4 w-4 text-cyan-400" />
                <span>Lihat 36 Fitur Tools</span>
              </Button>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md text-left">
              <div className="text-2xl font-bold text-white font-mono">36</div>
              <div className="text-xs text-slate-400 mt-1">Tools Aktif Nyata</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md text-left">
              <div className="text-2xl font-bold text-cyan-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 mt-1">Legal & Data Publik</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md text-left">
              <div className="text-2xl font-bold text-emerald-400 font-mono">AES-256</div>
              <div className="text-xs text-slate-400 mt-1">Enkripsi API Kredensial</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md text-left">
              <div className="text-2xl font-bold text-purple-400 font-mono">SSRF</div>
              <div className="text-xs text-slate-400 mt-1">Anti-Loopback Guard</div>
            </div>
          </div>
        </div>
      </section>

      {/* 36 TOOLS SECTION */}
      <section id="tools" className="py-20 bg-slate-900/30 border-y border-slate-800/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Terminal className="h-4 w-4" />
                <span>Katalog Fungsional Penuh</span>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                36 Tools Nyata Terintegrasi
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Semua tool dilengkapi backend nyata, validasi input, error handling, dan proteksi keamanan.
              </p>
            </div>

            {/* Live Search in Tools */}
            <div className="w-full md:w-72">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tool (DNS, WHOIS, IP)..."
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 pl-9 text-xs text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { id: "all", label: "Semua 36 Tools" },
              { id: "osint", label: "Domain & IP OSINT" },
              { id: "downloader", label: "Media Downloader" },
              { id: "ai", label: "AI & Threat Intel" },
              { id: "files", label: "File & Crypto Tools" },
              { id: "monitor", label: "RSS & Monitoring" },
              { id: "workspace", label: "Workspace & Laporan" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => (
              <Card
                key={tool.id}
                className="group border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                        <Terminal className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {tool.badge && (
                          <Badge variant="cyan" className="text-[10px]">
                            {tool.badge}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">
                          {tool.categoryLabel}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {tool.requiresKey ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <KeyRound className="h-3 w-3" />
                          <span>Key Adapter</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Siap Digunakan</span>
                        </span>
                      )}
                    </span>

                    <Link href={`/tools/${tool.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-white p-0 h-auto font-medium gap-1">
                        <span>Buka Tool</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Tidak ada tool yang cocok dengan pencarian Anda.</p>
            </div>
          )}
        </div>
      </section>

      {/* CARA KERJA PLATFORM */}
      <section id="how-it-works" className="py-20 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="cyan" className="mb-2">Alur Kerja Sistem</Badge>
            <h2 className="text-3xl font-bold text-white">Bagaimana NEXUS Bekerja</h2>
            <p className="text-sm text-slate-400 mt-2">
              Empat langkah transparan dan patuh hukum untuk mendapatkan intelijen data publik yang akurat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Input Target Publik",
                desc: "Masukkan domain, IP publik, username, atau URL media yang ingin Anda investigasi.",
              },
              {
                step: "02",
                title: "Validasi & SSRF Guard",
                desc: "Sistem memvalidasi target, menyaring skema ilegal, dan memblokir akses ke subnet privat.",
              },
              {
                step: "03",
                title: "Eksekusi Provider Legal",
                desc: "Modul menjalankan query resmi melalui raw socket WHOIS, DNS resolver, atau API provider terenkripsi.",
              },
              {
                step: "04",
                title: "Workspace & Ekspor",
                desc: "Hasil disimpan ke investigasi, dipetakan ke timeline analitik, dan siap diekspor ke format JSON/PDF.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md"
              >
                <div className="text-3xl font-black text-blue-500/40 font-mono mb-3">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KEAMANAN & PRIVASI */}
      <section id="features" className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="success">Standar Keamanan Enterprise</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Dirancang untuk Kepatuhan Hukum dan Perlindungan Data
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                NEXUS OSINT TOOLS mengedepankan keamanan berlapis dan kepatuhan terhadap regulasi privasi internasional. Seluruh data sensitif terlindungi secara kriptografis dan target jaringan disaring ketat.
              </p>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-400 border border-blue-500/20">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">SSRF Guard & Anti-Loopback</h4>
                    <p className="text-slate-400 mt-0.5">Memblokir otomatis alamat IP privat, loopback localhost, dan cloud metadata AWS/GCP.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-cyan-500/10 p-1.5 text-cyan-400 border border-cyan-500/20">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Enkripsi Kredensial AES-256-GCM</h4>
                    <p className="text-slate-400 mt-0.5">API key pihak ketiga disimpan terenkripsi di server dengan master key terisolasi.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Pembersihan File Sementara Otomatis</h4>
                    <p className="text-slate-400 mt-0.5">File media dan hasil unduhan sementara otomatis dihapus sesuai kebijakan retensi data (24 jam).</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Security Preview Box */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-slate-400 text-[11px]">nexus-security-filter.log</span>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="text-slate-400">[2026-09-16 16:15:02] [SECURITY] Outbound validation initialized</div>
                <div className="text-emerald-400">[PASS] Target: &quot;example.com&quot; -&gt; Resolved: 93.184.216.34 [PUBLIC]</div>
                <div className="text-blue-400">[PASS] Security Headers Audit: HSTS=Active, CSP=Enforced, X-Frame=DENY</div>
                <div className="text-red-400">[BLOCKED] SSRF Attempt: &quot;http://169.254.169.254/latest/meta-data&quot;</div>
                <div className="text-red-400">[BLOCKED] Loopback Attempt: &quot;http://127.0.0.1:8080/admin&quot;</div>
                <div className="text-cyan-400">[SECURE] Audit record written to encrypted database vault</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 100% FREE COMMUNITY ACCESS SECTION */}
      <section id="community" className="py-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="cyan" className="mb-2">100% Gratis & Terbuka</Badge>
            <h2 className="text-3xl font-bold text-white">Tanpa Biaya, Tanpa Batasan Kuota</h2>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              NEXUS OSINT TOOLS didedikasikan untuk komunitas riset siber, analis keamanan, jurnalis investigatif, dan akademisi dengan komitmen akses terbuka penuh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Seluruh 36 Tools Aktif</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Akses bebas ke modul Network OSINT, Media Downloader publik, NLP/AI Threat Intel, serta File & Cryptography utilities tanpa paywall.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Scan domain, DNS & IP tanpa batas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Media download publik beresolusi asli</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Sandbox screenshot berproteksi SSRF</span>
                  </li>
                </ul>
              </div>
            </Card>

            <Card className="border-cyan-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 flex flex-col justify-between relative shadow-xl shadow-cyan-500/5">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Workspace & Laporan Terbuka</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Kelola investigasi multi-target, catat timeline temuan analis, dan ekspor laporan ke format JSON, CSV, dan PDF siap cetak.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Investigasi & timeline tanpa batas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Ekspor multi-format (JSON, CSV, PDF)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Penyimpanan aman lokal & sesi analis</span>
                  </li>
                </ul>
              </div>
            </Card>

            <Card className="border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Etika & Kepatuhan Legal</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Dirancang dengan prinsip defensif, mematuhi regulasi privasi data publik, anti-doxxing, dan pencegahan eksploitasi server.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>Proteksi anti-doxxing GPS otomatis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>SSRF Guard anti-loopback & metadata</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>Enkripsi API key AES-256-GCM</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Link href="/register">
              <Button variant="glow" size="lg" className="gap-2 px-8 shadow-xl shadow-cyan-500/20">
                <span>Mulai Eksplorasi Sekarang — Gratis Selamanya</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS PLACEHOLDER (LABEL CONTOH SESUAI ATURAN) */}
      <section className="py-16 bg-slate-900/30 border-y border-slate-800/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <Badge variant="secondary" className="mb-2">[Contoh Skenario Penggunaan Analis]</Badge>
            <h3 className="text-xl font-bold text-white">Dipercaya Oleh Berbagai Peran Profesional</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-slate-300 leading-relaxed italic">
                &quot;NEXUS sangat membantu mengaudit infrastruktur target secara pasif tanpa melanggar etika hukum. DNS, WHOIS, dan pemetaan ASN-nya sangat akurat.&quot;
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 text-slate-400">
                <span className="font-semibold text-white block">Ahmad R. (Contoh Persona)</span>
                <span>Security Analyst di Fintech</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-slate-300 leading-relaxed italic">
                &quot;Fitur ekstraksi IOC dan IOC de-obfuscator memangkas waktu triage insiden malware tim kami dari berjam-jam menjadi beberapa detik.&quot;
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 text-slate-400">
                <span className="font-semibold text-white block">Citra D. (Contoh Persona)</span>
                <span>Incident Responder & Threat Hunter</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-slate-300 leading-relaxed italic">
                &quot;Workspace investigasi dengan timeline visual memudahkan penyusunan laporan temuan untuk klien corporate intelijen.&quot;
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 text-slate-400">
                <span className="font-semibold text-white block">Dimas K. (Contoh Persona)</span>
                <span>OSINT Researcher & Investigator</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12">
            <Badge variant="cyan" className="mb-2">Pertanyaan Populer</Badge>
            <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-cyan-400" : "text-slate-400"
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs leading-relaxed text-slate-300 border-t border-slate-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
