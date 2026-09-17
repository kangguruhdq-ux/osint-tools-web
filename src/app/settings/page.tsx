"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  KeyRound,
  Trash2,
  Shield,
  Save,
  Upload,
  Sparkles,
  Camera,
  Check,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const PRESET_AVATARS = [
  {
    id: "cyber-cyan",
    label: "Cyber Visor",
    data: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="p1bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#020617"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="50" fill="url(#p1bg)"/>
        <circle cx="50" cy="38" r="18" fill="#0284c7"/>
        <rect x="34" y="34" width="32" height="8" rx="4" fill="#38bdf8"/>
        <line x1="38" y1="38" x2="62" y2="38" stroke="#ffffff" stroke-width="2"/>
        <path d="M22 84 C24 62, 76 62, 78 84" fill="#0284c7" opacity="0.9"/>
        <circle cx="50" cy="38" r="22" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4,2"/>
      </svg>
    `.trim())}`,
  },
  {
    id: "sentinel-emerald",
    label: "Sentinel Ops",
    data: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="p2bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#020617"/>
            <stop offset="100%" stop-color="#047857"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="50" fill="url(#p2bg)"/>
        <circle cx="50" cy="38" r="18" fill="#059669"/>
        <path d="M50 26 L64 32 V44 C64 52 50 60 50 60 C50 60 36 52 36 44 V32 Z" fill="#10b981" opacity="0.8"/>
        <path d="M22 84 C24 62, 76 62, 78 84" fill="#047857" opacity="0.9"/>
        <circle cx="50" cy="38" r="22" fill="none" stroke="#34d399" stroke-width="1.5" stroke-dasharray="3,3"/>
      </svg>
    `.trim())}`,
  },
  {
    id: "shadow-purple",
    label: "Shadow Intel",
    data: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="p3bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#020617"/>
            <stop offset="100%" stop-color="#6d28d9"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="50" fill="url(#p3bg)"/>
        <circle cx="50" cy="38" r="18" fill="#7c3aed"/>
        <path d="M32 30 Q50 18 68 30 Q60 52 50 56 Q40 52 32 30 Z" fill="#8b5cf6" opacity="0.85"/>
        <circle cx="44" cy="38" r="3" fill="#c4b5fd"/>
        <circle cx="56" cy="38" r="3" fill="#c4b5fd"/>
        <path d="M22 84 C24 62, 76 62, 78 84" fill="#6d28d9" opacity="0.9"/>
        <circle cx="50" cy="38" r="22" fill="none" stroke="#a78bfa" stroke-width="1.5" stroke-dasharray="4,2"/>
      </svg>
    `.trim())}`,
  },
  {
    id: "quantum-indigo",
    label: "Quantum Tech",
    data: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="p4bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#020617"/>
            <stop offset="100%" stop-color="#3730a3"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="50" fill="url(#p4bg)"/>
        <circle cx="50" cy="38" r="18" fill="#4f46e5"/>
        <polygon points="50,26 60,42 40,42" fill="#818cf8"/>
        <polygon points="50,50 40,34 60,34" fill="#a5b4fc" opacity="0.7"/>
        <path d="M22 84 C24 62, 76 62, 78 84" fill="#3730a3" opacity="0.9"/>
        <circle cx="50" cy="38" r="22" fill="none" stroke="#818cf8" stroke-width="1.5" stroke-dasharray="3,3"/>
      </svg>
    `.trim())}`,
  },
  {
    id: "solar-amber",
    label: "Solar Vanguard",
    data: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="p5bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#020617"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="50" fill="url(#p5bg)"/>
        <circle cx="50" cy="38" r="18" fill="#d97706"/>
        <circle cx="50" cy="38" r="10" fill="#f59e0b"/>
        <circle cx="50" cy="38" r="4" fill="#fef3c7"/>
        <path d="M22 84 C24 62, 76 62, 78 84" fill="#b45309" opacity="0.9"/>
        <circle cx="50" cy="38" r="22" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="4,2"/>
      </svg>
    `.trim())}`,
  },
  {
    id: "crimson-rose",
    label: "Crimson Operative",
    data: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="p6bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#020617"/>
            <stop offset="100%" stop-color="#be123c"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="50" fill="url(#p6bg)"/>
        <circle cx="50" cy="38" r="18" fill="#e11d48"/>
        <rect x="36" y="34" width="28" height="8" rx="2" fill="#fda4af"/>
        <path d="M22 84 C24 62, 76 62, 78 84" fill="#be123c" opacity="0.9"/>
        <circle cx="50" cy="38" r="22" fill="none" stroke="#fb7185" stroke-width="1.5" stroke-dasharray="3,3"/>
      </svg>
    `.trim())}`,
  },
];

export default function SettingsPage() {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("Pengguna OSINT");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [avatar, setAvatar] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    // 1. Instant hydration from cached localStorage
    try {
      const cached = localStorage.getItem("nexus_user");
      if (cached) {
        const u = JSON.parse(cached);
        if (u.name) setName(u.name);
        if (u.email) setEmail(u.email);
        if (u.role) setRole(u.role);
        if (u.avatar) setAvatar(u.avatar);
      }
    } catch {}

    // 2. Fetch authenticated user data from backend
    fetch("/api/auth/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setName(data.user.name);
          setEmail(data.user.email);
          setRole(data.user.role);
          if (data.user.avatar) {
            setAvatar(data.user.avatar);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toastError("Ukuran file foto maksimal 2 MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toastError("File harus berupa gambar (PNG, JPG, WebP, SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatar(result);
        success("Foto berhasil dipilih. Klik 'Simpan Perubahan' untuk mengonfirmasi.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    success("Foto profil direset ke default.");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memperbarui profil.");
      }

      // Update cached localStorage session
      try {
        const cached = localStorage.getItem("nexus_user");
        const parsed = cached ? JSON.parse(cached) : {};
        const updated = {
          ...parsed,
          name,
          email,
          role,
          avatar: avatar || null,
        };
        localStorage.setItem("nexus_user", JSON.stringify(updated));
      } catch {}

      // Dispatch event to sync Topbar in real-time
      window.dispatchEvent(new Event("nexus_user_updated"));

      success("Profil dan foto profil berhasil diperbarui.", "Tersimpan");
    } catch (err: any) {
      toastError(err.message || "Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toastError("Kata sandi baru minimal 6 karakter.");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengubah kata sandi.");
      }

      setOldPassword("");
      setNewPassword("");
      success("Kata sandi berhasil diperbarui.", "Sandi Diperbarui");
    } catch (err: any) {
      toastError(err.message || "Gagal memperbarui kata sandi.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Pengaturan Akun</h1>
              <p className="text-xs text-slate-400 mt-1">
                Kelola profil analis, foto profil (avatar), kredensial autentikasi, dan preferensi privasi Anda.
              </p>
            </div>
            <Badge
              variant={role === "ADMIN" ? "warning" : "default"}
              className="px-2.5 py-1 text-xs uppercase tracking-wider font-mono"
            >
              {role === "ADMIN" ? "Administrator" : "Analis / Investigator"}
            </Badge>
          </div>
        </div>

        {/* Profile Card & Avatar Changer */}
        <Card className="border-slate-800 bg-slate-900/60 p-5 sm:p-6 shadow-xl backdrop-blur-sm">
          <CardHeader className="p-0 pb-4 mb-5 border-b border-slate-800/60">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              <span>Profil Pengguna & Foto Akun</span>
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleUpdateProfile} className="space-y-6 text-xs">
            {/* Avatar Section */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5">
              <label className="font-semibold text-slate-200 block mb-3 text-xs flex items-center gap-2">
                <Camera className="h-4 w-4 text-cyan-400" />
                <span>Foto Profil (Avatar Akun)</span>
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Avatar Preview */}
                <div className="relative group shrink-0">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-cyan-500/60 shadow-lg shadow-cyan-500/10 bg-slate-900 flex items-center justify-center">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Foto Profil"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white text-2xl">
                        {name ? name.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload & Reset Buttons */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap gap-2.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1.5 text-xs h-8 border-slate-700 hover:border-cyan-500 hover:text-cyan-400"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Unggah Foto Sendiri</span>
                    </Button>

                    {avatar && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        className="gap-1.5 text-xs h-8 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Hapus Foto</span>
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mendukung format PNG, JPG, WebP, atau SVG (maksimal 2MB). Foto akan langsung tampil pada navbar atas dan laporan investigasi.
                  </p>
                </div>
              </div>

              {/* Preset Cyber Avatars */}
              <div className="mt-5 pt-4 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 mb-3">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Atau Pilih Avatar Operatif OSINT:</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {PRESET_AVATARS.map((preset) => {
                    const isSelected = avatar === preset.data;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatar(preset.data)}
                        className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-950/30 shadow-md shadow-cyan-500/20"
                            : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="relative h-11 w-11 rounded-full overflow-hidden border border-slate-700 group-hover:scale-105 transition-transform">
                          <img
                            src={preset.data}
                            alt={preset.label}
                            className="h-full w-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-cyan-500/30 flex items-center justify-center">
                              <Check className="h-4 w-4 text-white drop-shadow" />
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-medium truncate max-w-full ${
                            isSelected ? "text-cyan-300" : "text-slate-400 group-hover:text-slate-200"
                          }`}
                        >
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Nama Lengkap / Alias Analis</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama atau alias"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Alamat Email Terdaftar</label>
                <Input value={email} disabled className="opacity-70 cursor-not-allowed bg-slate-950/70" />
                <p className="text-[10px] text-slate-500">Email akun terikat pada sesi terautentikasi.</p>
              </div>
            </div>

            <Button type="submit" variant="glow" size="sm" isLoading={loading} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              <span>Simpan Perubahan Profil</span>
            </Button>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card id="password" className="border-slate-800 bg-slate-900/60 p-5 sm:p-6 shadow-xl backdrop-blur-sm">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-800/60">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-cyan-400" />
              <span>Ubah Kata Sandi</span>
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Kata Sandi Lama</label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Kata Sandi Baru</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="outline" size="sm" isLoading={pwLoading} className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
              <span>Perbarui Kata Sandi</span>
            </Button>
          </form>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/30 bg-red-950/20 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>Zona Bahaya (Hapus Akun)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Tindakan ini akan menghapus akun dan seluruh data investigasi secara permanen sesuai regulasi GDPR & Privasi.
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Apakah Anda yakin ingin menghapus akun Anda secara permanen?")) {
                  toastError("Fitur hapus akun terlindungi demi keamanan akun demo administrator.");
                }
              }}
              className="text-xs shrink-0"
            >
              Hapus Akun Saya
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
