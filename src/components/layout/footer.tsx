import React from "react";
import Link from "next/link";
import { Terminal, Shield, Lock, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
                <Terminal className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                NEXUS <span className="text-cyan-400">OSINT</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Platform all-in-one terintegrasi untuk intelijen sumber terbuka (OSINT) legal, analisis data publik, pemantauan media, dan digital utilities untuk para investigator, analis keamanan, dan profesional.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>100% Legal & Ethical OSINT Architecture</span>
            </div>
          </div>

          {/* Quick Tools Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Kategori Tools</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tools?category=osint" className="hover:text-cyan-400 transition-colors">
                  Domain & IP Intelligence
                </Link>
              </li>
              <li>
                <Link href="/tools?category=downloader" className="hover:text-cyan-400 transition-colors">
                  Public Media Downloader
                </Link>
              </li>
              <li>
                <Link href="/tools?category=ai" className="hover:text-cyan-400 transition-colors">
                  AI Text & IOC Intelligence
                </Link>
              </li>
              <li>
                <Link href="/tools?category=files" className="hover:text-cyan-400 transition-colors">
                  Metadata & Cryptographic Tools
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-cyan-400 transition-colors font-medium text-blue-400">
                  Semua 52 Tools →
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/workspace" className="hover:text-cyan-400 transition-colors">
                  OSINT Workspace
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
                  User Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-cyan-400 transition-colors">
                  Admin Panel
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-cyan-400 transition-colors">
                  Paket Langganan
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Hukum & Kepatuhan</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-cyan-400 transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-cyan-400 transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="/dmca" className="hover:text-cyan-400 transition-colors">
                  Copyright & DMCA Policy
                </Link>
              </li>
              <li>
                <Link href="/retention" className="hover:text-cyan-400 transition-colors">
                  Kebijakan Retensi Data
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="mt-8 rounded-lg border border-slate-800/80 bg-slate-900/40 p-4 text-xs leading-relaxed text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
            <Lock className="h-3.5 w-3 w-3.5 text-amber-400" />
            <span>Pernyataan Kepatuhan Hukum & Etika:</span>
          </div>
          NEXUS OSINT TOOLS dirancang secara eksklusif untuk investigasi defensif, riset keamanan, analisis data publik, dan verifikasi fakta. Platform ini tidak menyediakan akses ke akun privat, tidak membypass mekanisme autentikasi/DRM/paywall, dan melarang keras penyalahgunaan untuk doxxing, stalking, malware, atau pencurian data.
        </div>

        <div className="mt-8 border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} NEXUS OSINT TOOLS Enterprise. Hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Operasional Normal
            </span>
            <span>v1.0.0-PROD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
