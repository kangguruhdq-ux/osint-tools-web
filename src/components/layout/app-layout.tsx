"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

interface AppLayoutProps {
  children: React.ReactNode;
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

export function AppLayout({
  children,
  userRole: propUserRole,
  userName: propUserName,
  userEmail: propUserEmail,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  } | null>(null);

  useEffect(() => {
    const syncUser = () => {
      try {
        const cached = localStorage.getItem("nexus_user");
        if (cached) {
          setCurrentUser(JSON.parse(cached));
        }
      } catch {
        // ignore
      }
    };

    syncUser();
    window.addEventListener("nexus_user_updated", syncUser);

    // 2. Fetch authenticated user from backend session
    fetch("/api/auth/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          const u = {
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            avatar: data.user.avatar || null,
          };
          setCurrentUser(u);
          try {
            localStorage.setItem("nexus_user", JSON.stringify(u));
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("nexus_user_updated", syncUser);
    };
  }, []);

  const activeRole = currentUser?.role || propUserRole || "USER";
  const activeName = currentUser?.name || propUserName || "Analis OSINT";
  const activeEmail = currentUser?.email || propUserEmail || "";
  const activeAvatar = currentUser?.avatar || null;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Component with dynamic RBAC */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={activeRole}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          user={{
            name: activeName,
            email: activeEmail,
            role: activeRole,
            avatar: activeAvatar,
          }}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
