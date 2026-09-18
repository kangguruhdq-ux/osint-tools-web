"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Wrench,
  FileText,
  Radio,
  ShieldAlert,
  Settings,
  X,
  Terminal,
  Globe,
  Download,
  Brain,
  FileCode,
  Zap,
  ShieldCheck,
  Users,
  HardDrive,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export function Sidebar({ isOpen, onClose, userRole = "USER" }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "OSINT Workspace", href: "/workspace", icon: FolderKanban },
    { name: "Katalog 60 Tools", href: "/tools", icon: Wrench },
    { name: "Laporan Investigasi", href: "/reports", icon: FileText },
    { name: "Keyword & RSS Monitor", href: "/monitors", icon: Radio },
  ];

  const toolCategories = [
    { name: "Domain & IP OSINT", href: "/tools?category=osint", icon: Globe, count: 19 },
    { name: "Media Downloader", href: "/tools?category=downloader", icon: Download, count: 6 },
    { name: "AI & Threat Intel", href: "/tools?category=ai", icon: Brain, count: 6 },
    { name: "File & Utility Tools", href: "/tools?category=files", icon: FileCode, count: 9 },
  ];

  const adminNav = [
    { name: "Admin Dashboard", href: "/admin", icon: ShieldAlert },
    { name: "Manajemen User", href: "/admin/users", icon: Users },
    { name: "API Providers", href: "/admin/providers", icon: Zap },
    { name: "Laporan Global", href: "/admin/reports", icon: FileText },
    { name: "Penyimpanan & Sistem", href: "/admin/storage", icon: HardDrive },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base">
                NEXUS <span className="text-cyan-400 font-mono text-xs px-1 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">OSINT</span>
              </span>
              <span className="text-[9px] text-slate-400 tracking-wider uppercase font-semibold">Enterprise SaaS</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Menu Utama
            </div>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => onClose()}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-400" : "text-slate-400")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Tool Categories */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Kategori Tools
            </div>
            <nav className="space-y-1">
              {toolCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => onClose()}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-3.5 w-3.5 text-slate-400" />
                      <span>{cat.name}</span>
                    </div>
                    <span className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                      {cat.count}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Admin Nav (if user has ADMIN role) */}
          {(userRole === "ADMIN" || userRole === "SUPERADMIN") && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-400/80 flex items-center gap-1.5">
                <ShieldAlert className="h-3 w-3" />
                <span>Admin Console</span>
              </div>
              <nav className="space-y-1">
                {adminNav.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => onClose()}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-amber-400" : "text-slate-400")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Community Free Access Status & Settings */}
        <div className="border-t border-slate-800/80 p-3 bg-slate-950/80">
          <div className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Akses Komunitas Gratis</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Seluruh 60 tools aktif bebas tanpa batasan kuota berbayar.
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-300 font-mono">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Kuota: Tanpa Batas (100% Gratis)</span>
            </div>
          </div>

          <Link
            href="/settings"
            onClick={() => onClose()}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Pengaturan Akun</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
