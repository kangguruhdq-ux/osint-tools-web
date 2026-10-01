"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
  badgeText?: string;
}

export function TermuxIconSvg({ className = "h-5 w-5", type = "termux-classic" }: { className?: string; type?: string }) {
  if (type === "termux-green") {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="32" height="32" rx="7" fill="#000000" />
        <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" stroke="#16a34a" strokeOpacity="0.4" />
        <path
          d="M9 10L16 16L9 22"
          stroke="#22c55e"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 22H24"
          stroke="#4ade80"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "termux-bash") {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="32" height="32" rx="7" fill="#030712" />
        <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" stroke="#0ea5e9" strokeOpacity="0.3" />
        <text
          x="6.5"
          y="21"
          fontFamily="ui-monospace,SFMono-Regular,Consolas,monospace"
          fontSize="13"
          fontWeight="900"
          fill="#38bdf8"
        >
          ~$
        </text>
        <path
          d="M22 21H26"
          stroke="#06b6d4"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "cyber-shield") {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="32" height="32" rx="7" fill="#020617" />
        <path
          d="M16 5L24 8V15C24 20.5 20.5 25 16 27C11.5 25 8 20.5 8 15V8L16 5Z"
          fill="#0369a1"
          fillOpacity="0.25"
          stroke="#0284c7"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M13 13L16.5 16L13 19"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 19H21"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Default: Official Termux Classic terminal icon (>_ in white and cyan)
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="7" fill="#000000" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" stroke="#334155" />
      <path
        d="M9 10L16 16L9 22"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 22H24"
        stroke="#00E5FF"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLogo({
  className,
  size = "md",
  showText = true,
  href,
  badgeText = "OSINT",
}: BrandLogoProps) {
  const [brandIcon, setBrandIcon] = useState<string>("termux-classic");
  const [brandName, setBrandName] = useState<string>("NEXUS");

  useEffect(() => {
    // Fetch live brand settings from API
    fetch("/api/brand/settings")
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.data) {
          if (d.data.icon) setBrandIcon(d.data.icon);
          if (d.data.name) setBrandName(d.data.name);
        }
      })
      .catch(() => {});
  }, []);

  const sizeBox =
    size === "sm"
      ? "h-7 w-7"
      : size === "lg"
      ? "h-11 w-11"
      : "h-9 w-9";

  const sizeSvg =
    size === "sm"
      ? "h-7 w-7"
      : size === "lg"
      ? "h-11 w-11"
      : "h-9 w-9";

  const content = (
    <div className={cn("flex items-center gap-2.5 group select-none", className)}>
      <div
        className={cn(
          sizeBox,
          "shrink-0 flex items-center justify-center rounded-lg shadow-md shadow-cyan-950/40 group-hover:scale-105 transition-all overflow-hidden border border-slate-800"
        )}
      >
        <TermuxIconSvg className={sizeSvg} type={brandIcon} />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base sm:text-lg leading-tight">
            {brandName}{" "}
            <span className="text-cyan-400 font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
              {badgeText}
            </span>
          </span>
          <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
            Legal Intelligence
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
