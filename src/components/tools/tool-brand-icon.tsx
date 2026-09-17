"use client";

import React from "react";
import {
  Globe,
  Server,
  FileSearch,
  Compass,
  ShieldAlert,
  Layers,
  Camera,
  ExternalLink,
  Mail,
  Phone,
  AtSign,
  UserCheck,
  Search,
  Hash,
  Radio,
  Rss,
  FileBadge,
  Code2,
  FileText,
  Key,
  Languages,
  Activity,
  Cpu,
  Bug,
  Image as ImageIcon,
  Video,
  Fingerprint,
  Sliders,
  RefreshCw,
  QrCode,
  Wrench,
  Smartphone,
  Send,
  MessageCircle,
  GitBranch,
  Lock,
  ShieldCheck,
  Clock,
  Sparkles,
  FileCode,
} from "lucide-react";

interface ToolBrandIconProps {
  toolId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ToolBrandIcon({ toolId, size = "md", className = "" }: ToolBrandIconProps) {
  const containerSize =
    size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  // 1. TikTok Downloader
  if (toolId === "tiktok-downloader") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 via-rose-950/40 to-cyan-950/40 border border-cyan-500/40 shadow-lg shadow-cyan-500/10 group-hover:border-rose-500/50 transition-all ${className}`}
        title="TikTok"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${iconSize} text-white drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]`}
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.89 2.897 2.897 0 0 1-2.897-2.89 2.896 2.896 0 0 1 2.897-2.89c.306 0 .598.05.873.138V9.432a6.37 6.37 0 0 0-.873-.061 6.34 6.34 0 0 0-6.335 6.34 6.34 6.34 0 0 0 6.335 6.34 6.34 6.34 0 0 0 6.336-6.34V8.777a8.217 8.217 0 0 0 3.77 1.354V6.686z" />
        </svg>
      </div>
    );
  }

  // 2. Instagram Downloader
  if (toolId === "instagram-downloader") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-purple-600/25 border border-pink-500/40 shadow-lg shadow-pink-500/10 group-hover:border-pink-400 transition-all ${className}`}
        title="Instagram"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${iconSize} text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]`}
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      </div>
    );
  }

  // 3. YouTube Downloader
  if (toolId === "youtube-downloader") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-red-600/15 border border-red-500/40 shadow-lg shadow-red-600/15 group-hover:border-red-500 transition-all ${className}`}
        title="YouTube"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${iconSize} text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]`}
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </div>
    );
  }

  // 4. X / Twitter Downloader
  if (toolId === "twitter-downloader") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-slate-800/60 border border-slate-700 shadow-lg group-hover:border-slate-400 transition-all ${className}`}
        title="X / Twitter"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${iconSize} text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]`}
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>
    );
  }

  // 5. Facebook Downloader
  if (toolId === "facebook-downloader") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/40 shadow-lg shadow-blue-600/15 group-hover:border-blue-400 transition-all ${className}`}
        title="Facebook"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${iconSize} text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]`}
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </div>
    );
  }

  // 6. Pinterest Downloader
  if (toolId === "pinterest-downloader") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-red-700/20 border border-red-600/40 shadow-lg shadow-red-700/15 group-hover:border-red-500 transition-all ${className}`}
        title="Pinterest"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${iconSize} text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]`}
        >
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.332 1.357-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
        </svg>
      </div>
    );
  }

  // 7. Domain Intelligence
  if (toolId === "domain-intelligence") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-400 shadow-lg shadow-cyan-500/10 group-hover:border-cyan-400 transition-all ${className}`}
      >
        <Globe className={iconSize} />
      </div>
    );
  }

  // 8. WHOIS Lookup
  if (toolId === "whois-lookup") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-blue-600/15 border border-blue-500/35 text-blue-400 shadow-lg shadow-blue-500/10 group-hover:border-blue-400 transition-all ${className}`}
      >
        <FileSearch className={iconSize} />
      </div>
    );
  }

  // 9. DNS Lookup
  if (toolId === "dns-lookup") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/35 text-sky-400 shadow-lg shadow-sky-500/10 group-hover:border-sky-400 transition-all ${className}`}
      >
        <Server className={iconSize} />
      </div>
    );
  }

  // 10. IP Lookup
  if (toolId === "ip-lookup") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/35 text-teal-400 shadow-lg shadow-teal-500/10 group-hover:border-teal-400 transition-all ${className}`}
      >
        <Compass className={iconSize} />
      </div>
    );
  }

  // 11. URL Scanner
  if (toolId === "url-scanner") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-400 shadow-lg shadow-rose-500/10 group-hover:border-rose-400 transition-all ${className}`}
      >
        <ShieldAlert className={iconSize} />
      </div>
    );
  }

  // 12. Technology Detector
  if (toolId === "tech-detector") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/35 text-violet-400 shadow-lg shadow-violet-500/10 group-hover:border-violet-400 transition-all ${className}`}
      >
        <Layers className={iconSize} />
      </div>
    );
  }

  // 13. Website Screenshot
  if (toolId === "website-screenshot") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/35 text-indigo-400 shadow-lg shadow-indigo-500/10 group-hover:border-indigo-400 transition-all ${className}`}
      >
        <Camera className={iconSize} />
      </div>
    );
  }

  // 14. Link Extractor
  if (toolId === "link-extractor") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/35 text-blue-400 shadow-lg shadow-blue-500/10 group-hover:border-blue-400 transition-all ${className}`}
      >
        <ExternalLink className={iconSize} />
      </div>
    );
  }

  // 15. Website Cloner
  if (toolId === "web-cloner") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/15 group-hover:border-cyan-400 transition-all ${className}`}
      >
        <Code2 className={iconSize} />
      </div>
    );
  }

  // 16. Email Validator
  if (toolId === "email-validator") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/35 text-teal-400 shadow-lg group-hover:border-teal-400 transition-all ${className}`}
      >
        <Mail className={iconSize} />
      </div>
    );
  }

  // 17. Phone Validator
  if (toolId === "phone-validator") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 shadow-lg group-hover:border-emerald-400 transition-all ${className}`}
      >
        <Phone className={iconSize} />
      </div>
    );
  }

  // 18. Username Checker
  if (toolId === "username-checker") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/35 text-purple-400 shadow-lg group-hover:border-purple-400 transition-all ${className}`}
      >
        <AtSign className={iconSize} />
      </div>
    );
  }

  // 19. Social Profile Analyzer
  if (toolId === "social-profile-analyzer") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/35 text-fuchsia-400 shadow-lg group-hover:border-fuchsia-400 transition-all ${className}`}
      >
        <UserCheck className={iconSize} />
      </div>
    );
  }

  // 20. Social Media Search
  if (toolId === "social-media-search") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-400 shadow-lg group-hover:border-cyan-400 transition-all ${className}`}
      >
        <Search className={iconSize} />
      </div>
    );
  }

  // 21. Hashtag Analyzer
  if (toolId === "hashtag-analyzer") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-pink-500/15 border border-pink-500/35 text-pink-400 shadow-lg group-hover:border-pink-400 transition-all ${className}`}
      >
        <Hash className={iconSize} />
      </div>
    );
  }

  // 22. Keyword Monitor
  if (toolId === "keyword-monitor") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 shadow-lg group-hover:border-amber-400 transition-all ${className}`}
      >
        <Radio className={iconSize} />
      </div>
    );
  }

  // 23. RSS Monitor
  if (toolId === "rss-monitor") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/35 text-orange-400 shadow-lg group-hover:border-orange-400 transition-all ${className}`}
      >
        <Rss className={iconSize} />
      </div>
    );
  }

  // 24. Report Generator
  if (toolId === "report-generator") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600/25 to-indigo-600/25 border border-blue-400/40 text-cyan-300 shadow-lg shadow-blue-500/15 group-hover:border-cyan-300 transition-all ${className}`}
      >
        <FileBadge className={iconSize} />
      </div>
    );
  }

  // 25. Text Summarizer
  if (toolId === "text-summarizer") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-violet-600/15 border border-violet-500/35 text-violet-400 shadow-lg group-hover:border-violet-400 transition-all ${className}`}
      >
        <FileText className={iconSize} />
      </div>
    );
  }

  // 26. Keyword Extractor
  if (toolId === "keyword-extractor") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 shadow-lg group-hover:border-amber-400 transition-all ${className}`}
      >
        <Key className={iconSize} />
      </div>
    );
  }

  // 27. Language Detector
  if (toolId === "language-detector") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/35 text-blue-400 shadow-lg group-hover:border-blue-400 transition-all ${className}`}
      >
        <Languages className={iconSize} />
      </div>
    );
  }

  // 28. Sentiment Analyzer
  if (toolId === "sentiment-analyzer") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-400 shadow-lg group-hover:border-rose-400 transition-all ${className}`}
      >
        <Activity className={iconSize} />
      </div>
    );
  }

  // 29. Entity Extractor
  if (toolId === "entity-extractor") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/35 text-indigo-400 shadow-lg group-hover:border-indigo-400 transition-all ${className}`}
      >
        <Cpu className={iconSize} />
      </div>
    );
  }

  // 30. Threat IOC Extractor
  if (toolId === "ioc-extractor") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-red-600/15 border border-red-500/40 text-red-400 shadow-lg shadow-red-500/15 group-hover:border-red-400 transition-all ${className}`}
      >
        <Bug className={iconSize} />
      </div>
    );
  }

  // 31. Image Metadata
  if (toolId === "image-metadata") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/35 text-sky-400 shadow-lg group-hover:border-sky-400 transition-all ${className}`}
      >
        <ImageIcon className={iconSize} />
      </div>
    );
  }

  // 32. Video Metadata
  if (toolId === "video-metadata") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/35 text-purple-400 shadow-lg group-hover:border-purple-400 transition-all ${className}`}
      >
        <Video className={iconSize} />
      </div>
    );
  }

  // 33. File Hash
  if (toolId === "file-hash") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 shadow-lg group-hover:border-emerald-400 transition-all ${className}`}
      >
        <Fingerprint className={iconSize} />
      </div>
    );
  }

  // 34. Image Compressor
  if (toolId === "image-compressor") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-400 shadow-lg group-hover:border-cyan-400 transition-all ${className}`}
      >
        <Sliders className={iconSize} />
      </div>
    );
  }

  // 35. Video Compressor
  if (toolId === "video-compressor") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/35 text-indigo-400 shadow-lg group-hover:border-indigo-400 transition-all ${className}`}
      >
        <Sliders className={iconSize} />
      </div>
    );
  }

  // 36. File Converter
  if (toolId === "file-converter") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 shadow-lg group-hover:border-amber-400 transition-all ${className}`}
      >
        <RefreshCw className={iconSize} />
      </div>
    );
  }

  // 37. QR Code Security Analyzer
  if (toolId === "qr-analyzer") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 shadow-lg group-hover:border-emerald-400 transition-all ${className}`}
      >
        <QrCode className={iconSize} />
      </div>
    );
  }

  // 38. Subdomain Finder via CT Logs
  if (toolId === "subdomain-finder") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-400 shadow-lg group-hover:border-cyan-400 transition-all ${className}`}
      >
        <Layers className={iconSize} />
      </div>
    );
  }

  // 39. SSL/TLS Certificate Deep Inspector
  if (toolId === "ssl-inspector") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 shadow-lg group-hover:border-emerald-400 transition-all ${className}`}
      >
        <ShieldCheck className={iconSize} />
      </div>
    );
  }

  // 40. Security Headers & CSP Auditor
  if (toolId === "security-headers") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/35 text-violet-400 shadow-lg group-hover:border-violet-400 transition-all ${className}`}
      >
        <ShieldAlert className={iconSize} />
      </div>
    );
  }

  // 41. Global DNS Propagation Comparator
  if (toolId === "dns-propagation") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/35 text-sky-400 shadow-lg group-hover:border-sky-400 transition-all ${className}`}
      >
        <Globe className={iconSize} />
      </div>
    );
  }

  // 42. Wayback Machine Historical Explorer (Official Pillar Logo)
  if (toolId === "wayback-machine") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 shadow-lg group-hover:border-amber-400 transition-all ${className}`}
      >
        <svg viewBox="0 0 24 24" className={iconSize} fill="currentColor">
          <path d="M12 2L1 7v2h22V7L12 2zm-8 8v10h3V10H4zm6 0v10h3V10h-3zm6 0v10h3V10h-3zM2 21v2h20v-2H2z" />
        </svg>
      </div>
    );
  }

  // 43. Robots.txt & Sitemap Recon
  if (toolId === "robots-sitemap-analyzer") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-400 shadow-lg group-hover:border-rose-400 transition-all ${className}`}
      >
        <FileSearch className={iconSize} />
      </div>
    );
  }

  // 44. Telegram Channel Analyzer (Official Telegram Paper Airplane)
  if (toolId === "telegram-analyzer") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-[#229ED9]/15 border border-[#229ED9]/35 text-[#229ED9] shadow-lg group-hover:border-[#229ED9] transition-all ${className}`}
      >
        <svg viewBox="0 0 24 24" className={iconSize} fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      </div>
    );
  }

  // 45. Reddit Profile & Subreddit OSINT (Official Reddit Snoo)
  if (toolId === "reddit-analyzer") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-[#FF4500]/15 border border-[#FF4500]/35 text-[#FF4500] shadow-lg group-hover:border-[#FF4500] transition-all ${className}`}
      >
        <svg viewBox="0 0 24 24" className={iconSize} fill="currentColor">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      </div>
    );
  }

  // 46. GitHub Developer & Repo Recon (Official GitHub Octocat)
  if (toolId === "github-recon") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-slate-400/15 border border-slate-400/35 text-slate-200 shadow-lg group-hover:border-slate-300 transition-all ${className}`}
      >
        <svg viewBox="0 0 24 24" className={iconSize} fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      </div>
    );
  }

  // 47. MAC Address & OUI Vendor Identifier
  if (toolId === "mac-lookup") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/35 text-orange-400 shadow-lg group-hover:border-orange-400 transition-all ${className}`}
      >
        <Cpu className={iconSize} />
      </div>
    );
  }

  // 48. Metadata Privacy Scrubber (EXIF Cleaner)
  if (toolId === "metadata-cleaner") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/35 text-teal-400 shadow-lg group-hover:border-teal-400 transition-all ${className}`}
      >
        <Sparkles className={iconSize} />
      </div>
    );
  }

  // 49. Threat Intel IOC Defang / Refang
  if (toolId === "ioc-defang") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 shadow-lg group-hover:border-amber-400 transition-all ${className}`}
      >
        <Bug className={iconSize} />
      </div>
    );
  }

  // 50. User-Agent & Bot Crawler Profiler
  if (toolId === "useragent-analyzer") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/35 text-blue-400 shadow-lg group-hover:border-blue-400 transition-all ${className}`}
      >
        <Compass className={iconSize} />
      </div>
    );
  }

  // 51. Multi-Format Forensic Decoder
  if (toolId === "forensic-decoder") {
    return (
      <div
        className={`${containerSize} flex items-center justify-center rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/35 text-fuchsia-400 shadow-lg group-hover:border-fuchsia-400 transition-all ${className}`}
      >
        <FileCode className={iconSize} />
      </div>
    );
  }

  // Fallback generic icon
  return (
    <div
      className={`${containerSize} flex items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/35 text-blue-400 ${className}`}
    >
      <Wrench className={iconSize} />
    </div>
  );
}
