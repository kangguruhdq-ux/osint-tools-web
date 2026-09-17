"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Wrench,
  Search,
  ArrowRight,
  Terminal,
  KeyRound,
  CheckCircle2,
  Shield,
  Layers,
  Filter,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TOOLS_CATALOG, ToolDefinition } from "@/lib/tools-data";
import { ToolBrandIcon } from "@/components/tools/tool-brand-icon";

export default function ToolsCatalogPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = useMemo(() => {
    return TOOLS_CATALOG.filter((tool) => {
      const matchesCategory =
        activeCategory === "all" || tool.category === activeCategory;
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Wrench className="h-4 w-4" />
              <span>Katalog Lengkap</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Katalog Tools Nyata NEXUS OSINT
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Seluruh tools terhubung ke API backend riil, proteksi SSRF, dan audit log otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Total: <span className="font-mono text-cyan-400 font-bold">{TOOLS_CATALOG.length} Tools</span>
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari dari ${TOOLS_CATALOG.length} tools...`}
              className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-4 text-xs text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {[
              { id: "all", label: `Semua (${TOOLS_CATALOG.length})` },
              { id: "osint", label: `Domain & IP (${TOOLS_CATALOG.filter((t) => t.category === "osint").length})` },
              { id: "downloader", label: `Downloader (${TOOLS_CATALOG.filter((t) => t.category === "downloader").length})` },
              { id: "ai", label: `AI & Threat Intel (${TOOLS_CATALOG.filter((t) => t.category === "ai").length})` },
              { id: "files", label: `File & Crypto (${TOOLS_CATALOG.filter((t) => t.category === "files").length})` },
              { id: "monitor", label: `Monitor (${TOOLS_CATALOG.filter((t) => t.category === "monitor").length})` },
              { id: "workspace", label: `Workspace (${TOOLS_CATALOG.filter((t) => t.category === "workspace").length})` },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => (
            <Card
              key={tool.id}
              className="group border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <ToolBrandIcon
                      toolId={tool.id}
                      size="md"
                      className="group-hover:scale-110 transition-transform duration-200"
                    />
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
                        <span>Kredensial Diperlukan</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Backend Nyata Aktif</span>
                      </span>
                    )}
                  </span>

                  <Link href={`/tools/${tool.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-400 hover:text-white p-0 h-auto font-medium gap-1"
                    >
                      <span>Luncurkan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Tidak ada tool yang cocok dengan kriteria pencarian.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
