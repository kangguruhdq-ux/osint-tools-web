import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" | "cyan" | "violet";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants = {
    default: "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
    secondary: "border-slate-700 bg-slate-800 text-slate-300",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    destructive: "border-red-500/30 bg-red-500/10 text-red-400",
    outline: "text-slate-300 border-slate-700",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    violet: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
