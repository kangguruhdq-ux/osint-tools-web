"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  initialMode?: "login" | "register";
}

export function AuthCard({ initialMode = "login" }: AuthCardProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Register states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [agreeEthics, setAgreeEthics] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Check if session is already active or if email was remembered
  React.useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("nexus_remember_email");
      if (savedEmail) {
        setLoginEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {}

    // If user is already logged in, redirect directly to dashboard
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Autentikasi gagal.");
        toastError(data.error || "Autentikasi gagal.");
        setLoading(false);
        return;
      }

      if (rememberMe) {
        try {
          localStorage.setItem("nexus_remember_email", loginEmail);
        } catch {}
      } else {
        try {
          localStorage.removeItem("nexus_remember_email");
        } catch {}
      }

      if (data.user) {
        try {
          localStorage.setItem("nexus_user", JSON.stringify(data.user));
        } catch {}
      }

      success("Autentikasi berhasil! Mengalihkan ke dashboard...", "Selamat Datang");
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage("Koneksi gagal: " + err.message);
      toastError("Koneksi gagal: " + err.message);
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeEthics) {
      setErrorMessage("Anda wajib menyetujui kepatuhan hukum dan etika OSINT.");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Registrasi gagal.");
        toastError(data.error || "Registrasi gagal.");
        setLoading(false);
        return;
      }

      if (data.user) {
        try {
          localStorage.setItem("nexus_user", JSON.stringify(data.user));
        } catch {}
      }

      success("Akun berhasil didaftarkan! Mengalihkan...", "Registrasi Berhasil");
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage("Koneksi gagal: " + err.message);
      toastError("Koneksi gagal: " + err.message);
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic atmospheric ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[480px] h-80 sm:h-[480px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/3 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Futuristic cyber background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Brand logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 flex flex-col items-center gap-2 z-10 text-center"
      >
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform duration-300">
            <Terminal className="h-6 w-6 text-white animate-pulse" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            NEXUS{" "}
            <span className="text-cyan-400 font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-800/80 shadow-sm shadow-cyan-900/50">
              OSINT
            </span>
          </span>
        </Link>
        <p className="text-xs text-slate-400 font-medium max-w-xs sm:max-w-md">
          Enterprise Security & Open Source Intelligence Platform
        </p>
      </motion.div>

      {/* Dramatic 3D Swap Card Deck Container */}
      <div className="w-full max-w-md z-10" style={{ perspective: 1400 }}>
        <motion.div
          layout
          className="relative rounded-2xl p-[1.5px] bg-gradient-to-b from-cyan-500/40 via-blue-600/20 to-slate-800/80 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl"
        >
          <Card className="w-full border-0 bg-slate-900/95 shadow-none rounded-[15px] overflow-hidden">
            {/* Animated Tab Switcher with Dramatic Swap Indicator */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-950/90 border-b border-slate-800/90 gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage("");
                }}
                className={cn(
                  "relative py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2",
                  mode === "login" ? "text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                )}
              >
                {mode === "login" && (
                  <motion.div
                    layoutId="auth-active-pill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 shadow-md shadow-blue-500/25"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Lock className="h-3.5 w-3.5 relative z-10" />
                <span className="relative z-10">Masuk ke Akun</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMessage("");
                }}
                className={cn(
                  "relative py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2",
                  mode === "register" ? "text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                )}
              >
                {mode === "register" && (
                  <motion.div
                    layoutId="auth-active-pill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 shadow-md shadow-cyan-500/25"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Sparkles className="h-3.5 w-3.5 relative z-10" />
                <span className="relative z-10">Daftar Akun Baru</span>
              </button>
            </div>

            <CardHeader className="text-center pt-5 pb-3 px-4 sm:px-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950/60 border border-blue-800/60 text-[10px] text-blue-400 font-mono mb-2 mx-auto">
                <ShieldCheck className="h-3 w-3 text-cyan-400" />
                <span>SISTEM TERENKRIPSI AES-256</span>
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {mode === "login" ? "Masuk ke Workspace Analis" : "Registrasi Analis Baru"}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                {mode === "login"
                  ? "Akses dashboard intelijen publik dan 60 utilitas digital legal."
                  : "Dapatkan akses gratis tanpa batas ke seluruh 60 tools dan workspace."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-1 px-4 sm:px-6 pb-6">

              {errorMessage && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 flex items-start gap-2 animate-shake">
                  <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 3D Dynamic Swap Deck Animation */}
              <div className="relative overflow-hidden min-h-[280px]">
                <AnimatePresence mode="wait" initial={false}>
                  {mode === "login" ? (
                    <motion.form
                      key="login-form-swap"
                      initial={{ opacity: 0, rotateY: -70, scale: 0.92, z: -100 }}
                      animate={{ opacity: 1, rotateY: 0, scale: 1, z: 0 }}
                      exit={{ opacity: 0, rotateY: 70, scale: 0.92, z: -100 }}
                      transition={{ type: "spring", stiffness: 280, damping: 26 }}
                      onSubmit={handleLogin}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Alamat Email</label>
                        <Input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="nama@organisasi.id"
                          icon={<Mail className="h-4 w-4 text-cyan-400" />}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-300">Kata Sandi</label>
                          <Link
                            href="/forgot-password"
                            className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                          >
                            Lupa sandi?
                          </Link>
                        </div>
                        <Input
                          type={showLoginPassword ? "text" : "password"}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          icon={<Lock className="h-4 w-4 text-cyan-400" />}
                          rightElement={
                            <button
                              type="button"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              className="text-slate-400 hover:text-slate-200 transition-colors p-1 focus:outline-none"
                              title={showLoginPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                            >
                              {showLoginPassword ? (
                                <EyeOff className="h-4 w-4 text-cyan-400" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          }
                        />
                      </div>

                      {/* Remember Me Checkbox */}
                      <div className="flex items-center justify-between pt-0.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500/30 focus:ring-offset-0 focus:outline-none accent-cyan-500 cursor-pointer"
                          />
                          <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                            Ingat saya di perangkat ini
                          </span>
                        </label>
                      </div>

                      <Button
                        type="submit"
                        variant="glow"
                        className="w-full justify-center gap-2 mt-2 h-11 text-sm font-semibold shadow-lg shadow-cyan-900/30"
                        isLoading={loading}
                      >
                        <span>Masuk ke Dashboard</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="register-form-swap"
                      initial={{ opacity: 0, rotateY: 70, scale: 0.92, z: -100 }}
                      animate={{ opacity: 1, rotateY: 0, scale: 1, z: 0 }}
                      exit={{ opacity: 0, rotateY: -70, scale: 0.92, z: -100 }}
                      transition={{ type: "spring", stiffness: 280, damping: 26 }}
                      onSubmit={handleRegister}
                      className="space-y-3.5"
                    >
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Nama Lengkap</label>
                        <Input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Nama Lengkap Analis"
                          icon={<User className="h-4 w-4 text-cyan-400" />}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Alamat Email</label>
                        <Input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="nama@organisasi.id"
                          icon={<Mail className="h-4 w-4 text-cyan-400" />}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Kata Sandi</label>
                        <Input
                          type={showRegPassword ? "text" : "password"}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          icon={<Lock className="h-4 w-4 text-cyan-400" />}
                          rightElement={
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="text-slate-400 hover:text-slate-200 transition-colors p-1 focus:outline-none"
                              title={showRegPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                            >
                              {showRegPassword ? (
                                <EyeOff className="h-4 w-4 text-cyan-400" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          }
                        />
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs space-y-2">
                        <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 select-none">
                          <input
                            type="checkbox"
                            checked={agreeEthics}
                            onChange={(e) => setAgreeEthics(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                          />
                          <span className="text-[11px] leading-relaxed text-slate-400">
                            Saya setuju mematuhi ketentuan hukum, kebijakan anti-doxxing, dan etika riset OSINT publik tanpa melanggar privasi personal.
                          </span>
                        </label>
                      </div>

                      <Button
                        type="submit"
                        variant="glow"
                        className="w-full justify-center gap-2 mt-2 h-11 text-sm font-semibold shadow-lg shadow-cyan-900/30"
                        isLoading={loading}
                      >
                        <span>Daftar Akun Gratis</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800/60">
                {mode === "login" ? (
                  <span>
                    Belum memiliki akun analis?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors ml-1"
                    >
                      Daftar Sekarang &rarr;
                    </button>
                  </span>
                ) : (
                  <span>
                    Sudah memiliki akun analis?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors ml-1"
                    >
                      Masuk di Sini &rarr;
                    </button>
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
