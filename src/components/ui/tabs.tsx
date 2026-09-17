"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  selectedTab: string;
  onSelectTab: (val: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (val: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = React.useState<string>(value || defaultValue || "");

  const currentTab = value !== undefined ? value : activeTab;
  const handleSelect = (val: string) => {
    setActiveTab(val);
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ selectedTab: currentTab, onSelectTab: handleSelect }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg bg-slate-950/70 p-1 text-slate-400 border border-slate-800",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");

  const isSelected = ctx.selectedTab === value;

  return (
    <button
      type="button"
      onClick={() => ctx.onSelectTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer",
        isSelected
          ? "bg-blue-600/90 text-white shadow-sm shadow-blue-500/20"
          : "hover:text-slate-200 hover:bg-slate-800/50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");

  if (ctx.selectedTab !== value) return null;

  return (
    <div className={cn("mt-4 focus-visible:outline-none animate-in fade-in-50 duration-200", className)}>
      {children}
    </div>
  );
}
