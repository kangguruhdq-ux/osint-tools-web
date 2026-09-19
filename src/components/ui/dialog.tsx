"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, children, className }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 md:p-6 flex min-h-[100dvh] items-center justify-center overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Dialog card */}
      <div
        className={cn(
          "relative z-50 w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150 my-auto",
          "max-h-[min(calc(100dvh-2rem),860px)] flex flex-col overflow-hidden",
          className
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3.5 top-3.5 z-20 rounded-lg p-1.5 text-slate-400 opacity-70 transition-all hover:bg-slate-800 hover:opacity-100 hover:text-white active:scale-95"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Tutup</span>
        </button>
        <div className="overflow-y-auto p-4 sm:p-6 overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left mb-4 pr-7", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold leading-none tracking-tight text-white", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-slate-400 mt-1", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-6 pt-2", className)}
      {...props}
    />
  );
}
