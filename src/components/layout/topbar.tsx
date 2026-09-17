"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  Plus,
  User,
  LogOut,
  Shield,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  onMenuClick: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  };
}

export function Topbar({
  onMenuClick,
  user = { name: "Senior OSINT Analyst", email: "analyst@nexus-osint.io", role: "ANALYST", avatar: null },
}: TopbarProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tools?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem("nexus_user");
    } catch {}
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search */}
        <form onSubmit={handleSearch} className="relative hidden sm:block w-72 md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tool (contoh: DNS, WHOIS, IP, Hash)..."
            className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </form>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Action Button */}
        <Link href="/workspace">
          <Button variant="glow" size="sm" className="hidden sm:flex gap-1.5 text-xs py-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            <span>Investigasi Baru</span>
          </Button>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-500" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-semibold text-white">Notifikasi Sistem</span>
                <span className="text-[10px] text-cyan-400 font-mono">Real-time</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="rounded-lg bg-slate-950/80 p-2 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>52 Tools Beroperasi Normal</span>
                  </div>
                  <p className="text-slate-400 mt-1">Seluruh adapter provider publik aktif dan siap menerima query.</p>
                </div>
                <div className="rounded-lg bg-slate-950/80 p-2 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-blue-400 font-medium text-[11px]">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Audit Log Terverifikasi</span>
                  </div>
                  <p className="text-slate-400 mt-1">Sistem keamanan mendeteksi & memblokir 1 request SSRF loopback.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800/80 transition-colors"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-6 w-6 rounded-full object-cover border border-cyan-500/50"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 font-semibold text-white text-[10px]">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="hidden text-left md:block">
              <div className="font-medium text-slate-200 leading-tight">{user.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{user.role}</div>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-50 duration-150">
              <div className="border-b border-slate-800 px-3 py-2 flex items-center gap-2.5">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover border border-cyan-500/50 shrink-0"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 font-bold text-white text-xs shrink-0">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  <Badge variant={user.role === "ADMIN" ? "warning" : "default"} className="mt-1 text-[9px] px-1.5 py-0">
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white text-left"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>Profil Akun</span>
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/settings#password");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white text-left"
                >
                  <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                  <span>Ubah Sandi</span>
                </button>
                {user.role === "ADMIN" && (
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/admin");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-amber-300 hover:bg-slate-800 text-left"
                  >
                    <Shield className="h-3.5 w-3.5 text-amber-400" />
                    <span>Admin Dashboard</span>
                  </button>
                )}
              </div>

              <div className="border-t border-slate-800 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 text-left"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
