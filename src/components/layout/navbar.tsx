"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Terminal, Menu, X, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Terminal className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base sm:text-lg">
              NEXUS <span className="text-cyan-400 font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">OSINT</span>
            </span>
            <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">Legal Intelligence</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link href="/#tools" className="hover:text-cyan-400 transition-colors">
            52 Tools
          </Link>
          <Link href="/#features" className="hover:text-cyan-400 transition-colors">
            Fitur
          </Link>
          <Link href="/#how-it-works" className="hover:text-cyan-400 transition-colors">
            Cara Kerja
          </Link>
          <Link href="/#community" className="hover:text-cyan-400 transition-colors">
            Akses Gratis
          </Link>
          <Link href="/#faq" className="hover:text-cyan-400 transition-colors">
            FAQ
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="glow" size="sm" className="gap-1.5">
              <span>Mulai Sekarang</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 py-6 space-y-4 backdrop-blur-xl animate-in slide-in-from-top-4">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-slate-300">
            <Link
              href="/#tools"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-cyan-400"
            >
              52 Tools
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-cyan-400"
            >
              Fitur
            </Link>
            <Link
              href="/#community"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-cyan-400"
            >
              Akses Gratis
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-cyan-400"
            >
              FAQ
            </Link>
          </nav>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                Masuk
              </Button>
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="glow" className="w-full justify-center">
                Mulai Sekarang
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
