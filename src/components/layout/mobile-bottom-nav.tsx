"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Terminal, FolderGit2, Radio, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "54 Tools",
    href: "/tools",
    icon: Terminal,
  },
  {
    label: "Workspace",
    href: "/workspace",
    icon: FolderGit2,
  },
  {
    label: "Monitors",
    href: "/monitors",
    icon: Radio,
  },
  {
    label: "Akun",
    href: "/settings",
    icon: User,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on auth / login / register pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
    return null;
  }

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-1.5 pointer-events-none">
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="pointer-events-auto mx-auto max-w-md rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] px-2 py-1.5 flex items-center justify-around"
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 select-none active:scale-90",
                isActive ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileBottomNavActive"
                  className="absolute inset-0 bg-cyan-500/15 rounded-xl border border-cyan-500/30"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon className={cn("h-4 w-4 transition-transform", isActive && "scale-110 text-cyan-400")} />
                <span className={cn("text-[10px] font-medium tracking-tight", isActive ? "text-cyan-300 font-semibold" : "text-slate-400")}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
