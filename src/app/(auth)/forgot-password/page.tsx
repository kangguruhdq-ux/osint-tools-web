"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Terminal, Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="mb-8 flex flex-col items-center gap-2 z-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/25">
            <Terminal className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            NEXUS <span className="text-cyan-400 font-mono text-sm px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">OSINT</span>
          </span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl z-10">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold text-white">Pemulihan Kata Sandi</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Masukkan alamat email akun Anda untuk menerima tautan reset kata sandi.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Tautan Terkirim!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Jika email <span className="text-slate-200 font-mono">{email}</span> terdaftar di sistem kami, instruksi pemulihan telah dikirimkan.
                </p>
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full mt-2">
                  Kembali ke Halaman Masuk
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Alamat Email</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@domain.com"
                  icon={<Mail className="h-4 w-4" />}
                />
              </div>

              <Button
                type="submit"
                variant="glow"
                className="w-full justify-center gap-2 mt-2"
                isLoading={loading}
              >
                <span>Kirim Tautan Reset</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Kembali ke Halaman Masuk</span>
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
