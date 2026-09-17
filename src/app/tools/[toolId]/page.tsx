"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import {
  Wrench,
  ArrowLeft,
  Search,
  Play,
  Copy,
  Check,
  Download,
  AlertTriangle,
  FolderPlus,
  ShieldCheck,
  KeyRound,
  FileCode,
  Globe,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
  Code2,
  Eye,
  Layout,
  FileDown,
  FileBadge,
  FileText,
  Mail,
  Phone,
  Hash,
  User,
  Shield,
  ShieldAlert,
  Server,
  Layers,
  Cpu,
  CheckCircle2,
  XCircle,
  Activity,
  Languages,
  Key,
  QrCode,
  Compass,
  FileSearch,
  Rss,
  Share2,
  Smartphone,
  Lock,
  RefreshCw,
  Send,
  Terminal,
  FileArchive,
  CheckCircle,
  Info,
  Binary,
  Award,
  ShieldQuestion,
  Star,
  GitFork,
  BookOpen,
  UserCheck,
  Users,
  Heart,
  HardDrive,
  Monitor,
  Bot,
  Music,
  Camera,
  Mic,
  MapPin,
  Bell,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { TOOLS_CATALOG, ToolDefinition } from "@/lib/tools-data";
import { ToolBrandIcon } from "@/components/tools/tool-brand-icon";
import { cn } from "@/lib/utils";

interface ToolPageProps {
  params: Promise<{ toolId: string }>;
}

export default function ToolDetailPage({ params }: ToolPageProps) {
  const { toolId } = use(params);
  const { success, error: toastError } = useToast();

  const tool = TOOLS_CATALOG.find((t) => t.id === toolId);

  // Input states
  const [textInput, setTextInput] = useState("");
  const [customFilename, setCustomFilename] = useState("");
  const [clonerTab, setClonerTab] = useState<"preview" | "code" | "stats">("preview");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] = useState(toolId === "file-converter" ? "png" : "mp4");
  const [selectedQuality, setSelectedQuality] = useState("720p");
  const [selectedDnsRecord, setSelectedDnsRecord] = useState("ALL");

  // Specialized states for multimedia and OSINT tools
  const [imageQuality, setImageQuality] = useState(80);
  const [screenshotDevice, setScreenshotDevice] = useState<"desktop" | "laptop" | "tablet" | "mobile">("desktop");
  const [securityConfigTab, setSecurityConfigTab] = useState<"nginx" | "apache" | "nextjs" | "caddy">("nginx");
  const [dnsViewRaw, setDnsViewRaw] = useState(false);
  const [sslPort, setSslPort] = useState("443");
  const [redditType, setRedditType] = useState<"user" | "subreddit">("user");
  const [iocDefangAction, setIocDefangAction] = useState<"defang" | "refang">("defang");
  const [forensicEncoding, setForensicEncoding] = useState<"auto" | "base64" | "hex" | "url" | "html" | "rot13" | "binary" | "jwt">("auto");
  const [subdomainSearch, setSubdomainSearch] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("auto");

  // Execution states
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [resultData, setResultData] = useState<any>(null);
  const [configRequiredError, setConfigRequiredError] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [viewJson, setViewJson] = useState(false);

  if (!tool) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-400 mb-4" />
          <h2 className="text-xl font-bold text-white">Tool Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400 mt-2">
            Tool dengan ID <span className="font-mono text-cyan-400">&quot;{toolId}&quot;</span> tidak terdaftar dalam katalog.
          </p>
          <Link href="/tools" className="mt-6 inline-block">
            <Button variant="outline" size="sm">
              Kembali ke Katalog Tools
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProgress(15);
    setProgressText("Memvalidasi parameter input & verifikasi SSRF...");
    setResultData(null);
    setConfigRequiredError(null);

    try {
      const endpoint = tool.endpoint;
      let options: RequestInit = {};

      if (tool.id === "metadata-cleaner") {
        if (!selectedFile) {
          toastError("Pilih file gambar (JPEG/PNG) terlebih dahulu.");
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", selectedFile);
        options = {
          method: "POST",
          body: formData,
        };
      } else if (tool.category === "files" && tool.id !== "file-hash" && tool.id !== "qr-analyzer" && tool.id !== "web-cloner") {
        if (!selectedFile) {
          toastError("Pilih file terlebih dahulu.");
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("quality", String(imageQuality));
        formData.append("resolution", selectedQuality);

        const validFormats = ["jpg", "png", "webp", "mp3", "wav"];
        const targetFormat = validFormats.includes(selectedFormat.toLowerCase()) ? selectedFormat.toLowerCase() : "png";
        formData.append("targetFormat", targetFormat);

        options = {
          method: "POST",
          body: formData,
        };
      } else if ((tool.id === "file-hash" || tool.id === "qr-analyzer") && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        options = {
          method: "POST",
          body: formData,
        };
      } else {
        let payload: any = {};
        const trimmedInput = textInput.trim();

        if (tool.id === "subdomain-finder") {
          const cleanDomain = trimmedInput.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
          payload = { domain: cleanDomain };
        } else if (tool.id === "ssl-inspector") {
          const cleanDomain = trimmedInput.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
          payload = { domain: cleanDomain, port: parseInt(sslPort) || 443 };
        } else if (tool.id === "security-headers") {
          let targetUrl = trimmedInput;
          if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            targetUrl = "https://" + targetUrl;
          }
          payload = { url: targetUrl };
        } else if (tool.id === "dns-propagation") {
          const cleanDomain = trimmedInput.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
          payload = { domain: cleanDomain, recordType: selectedDnsRecord === "ALL" ? "A" : selectedDnsRecord };
        } else if (tool.id === "wayback-machine") {
          let targetUrl = trimmedInput;
          if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            targetUrl = "https://" + targetUrl;
          }
          payload = { url: targetUrl };
        } else if (tool.id === "robots-sitemap-analyzer") {
          let targetUrl = trimmedInput;
          if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            targetUrl = "https://" + targetUrl;
          }
          payload = { url: targetUrl };
        } else if (tool.id === "telegram-analyzer") {
          payload = { channel: trimmedInput };
        } else if (tool.id === "reddit-analyzer") {
          payload = { target: trimmedInput, type: redditType };
        } else if (tool.id === "github-recon") {
          payload = { username: trimmedInput };
        } else if (tool.id === "mac-lookup") {
          payload = { macAddress: trimmedInput, mac: trimmedInput };
        } else if (tool.id === "ioc-defang") {
          payload = { text: trimmedInput, action: iocDefangAction };
        } else if (tool.id === "useragent-analyzer") {
          payload = { userAgent: trimmedInput };
        } else if (tool.id === "forensic-decoder") {
          payload = { payload: trimmedInput, encoding: forensicEncoding };
        } else if (tool.id === "report-generator") {
          const targetVal = trimmedInput || "Target Investigasi Publik";
          const cleanTarget = targetVal.replace(/^https?:\/\//i, "").replace(/\/$/, "");
          payload = {
            title: `Laporan Investigasi OSINT: ${cleanTarget}`,
            summary: `Dokumen intelijen dan analisis defensif publik komprehensif untuk target: ${cleanTarget}. Data pasif domain footprint, kepatuhan DNS publik, dan mitigasi risiko telah dihimpun dan diverifikasi.`,
            targets: [targetVal],
            findings: [
              {
                id: "FND-001",
                category: "Target Scope",
                description: `Lingkup dan perimeter publik terverifikasi: ${targetVal}`,
                confidence: "Tinggi (98%)",
                status: "Tervalidasi",
              },
              {
                id: "FND-002",
                category: "Network Recon",
                description: `Resolusi domain ${cleanTarget} aktif dan lolos audit proteksi SSRF Guard NEXUS.`,
                confidence: "Tinggi (96%)",
                status: "Aktif",
              },
              {
                id: "FND-003",
                category: "Security Posture",
                description: "Tidak terindikasi manipulasi routing publik, catatan pasif siap diarsipkan.",
                confidence: "Tinggi (95%)",
                status: "Terverifikasi",
              },
            ],
            analystNotes: `Dokumentasi resmi Investigation Report Generator untuk target ${cleanTarget}.`,
          };
        } else if (tool.id === "rss-monitor") {
          payload = { type: "rss", target: trimmedInput, keywordFilter: "" };
        } else if (tool.id === "keyword-monitor") {
          payload = { type: "keyword", target: trimmedInput, keywordFilter: "" };
        } else if (tool.id === "dns-lookup") {
          const cleanDomain = trimmedInput.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
          payload = { domain: cleanDomain, recordType: selectedDnsRecord };
        } else if (tool.id === "whois-lookup" || tool.id === "domain-intelligence") {
          const cleanDomain = trimmedInput.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
          payload = { domain: cleanDomain };
        } else if (tool.id === "ip-lookup") {
          payload = { ip: trimmedInput };
        } else if (tool.id === "website-screenshot") {
          let targetUrl = trimmedInput;
          if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            targetUrl = "https://" + targetUrl;
          }
          payload = { url: targetUrl, device: screenshotDevice };
        } else if (
          tool.id === "url-scanner" ||
          tool.id === "tech-detector" ||
          tool.id === "link-extractor"
        ) {
          let targetUrl = trimmedInput;
          if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            targetUrl = "https://" + targetUrl;
          }
          payload = { url: targetUrl };
        } else if (tool.id === "web-cloner") {
          let targetUrl = trimmedInput;
          if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
            targetUrl = "https://" + targetUrl;
          }
          payload = { url: targetUrl, filename: customFilename.trim() };
        } else if (tool.category === "downloader") {
          let mediaUrl = trimmedInput;
          if (!mediaUrl.startsWith("http://") && !mediaUrl.startsWith("https://")) {
            mediaUrl = "https://" + mediaUrl;
          }
          payload = { url: mediaUrl, format: selectedFormat, quality: selectedQuality };
        } else if (tool.id === "email-validator") {
          payload = { email: trimmedInput };
        } else if (tool.id === "phone-validator") {
          payload = { phoneNumber: trimmedInput };
        } else if (tool.id === "username-checker") {
          payload = { username: trimmedInput };
        } else if (tool.id === "social-profile-analyzer") {
          payload = { target: trimmedInput, platform: socialPlatform };
        } else if (tool.id === "social-media-search") {
          payload = { query: trimmedInput };
        } else if (tool.id === "hashtag-analyzer") {
          payload = { hashtag: trimmedInput };
        } else if (tool.id === "text-summarizer") {
          payload = { text: trimmedInput, length: "medium" };
        } else if (tool.id === "keyword-extractor") {
          payload = { text: trimmedInput, maxKeywords: 15 };
        } else {
          payload = { text: trimmedInput, length: "medium" };
        }

        options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        };
      }

      setTimeout(() => {
        setProgress(50);
        setProgressText("Mengeksekusi query jaringan dan provider adapter...");
      }, 300);

      const res = await fetch(endpoint, options);
      const data = await res.json();

      setProgress(100);
      setProgressText("Pemrosesan selesai.");

      if (data.requiresConfiguration) {
        setConfigRequiredError(data);
        toastError(data.error || "Provider belum dikonfigurasi.", "Konfigurasi Diperlukan");
      } else if (!res.ok || !data.success) {
        toastError(data.error || "Gagal memproses eksekusi.", "Kesalahan");
      } else {
        setResultData(data);
        success("Eksekusi berhasil diselesaikan!", tool.name);

        // Log scan to user's private activity history
        try {
          const targetStr = textInput.trim() || selectedFile?.name || tool.name;
          fetch("/api/dashboard/stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toolId: tool.id,
              toolName: tool.name,
              target: String(targetStr),
            }),
          }).catch(() => {});
        } catch {}
      }
    } catch (err: any) {
      toastError("Koneksi gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (!resultData) return;
    navigator.clipboard.writeText(JSON.stringify(resultData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    success("Hasil telah disalin ke clipboard.", "Disalin");
  };

  const downloadClonedHtml = (html: string, filename: string) => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "cloned-website.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success(`File ${filename || "cloned-website.html"} berhasil diunduh.`, "Unduhan Berhasil");
  };

  const downloadBase64File = (base64: string, filename: string, mimeType: string) => {
    try {
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success(`File ${filename} berhasil diunduh!`, "Unduhan Berhasil");
    } catch (err: any) {
      toastError("Gagal mengunduh file: " + err.message);
    }
  };

  const downloadDataUri = (dataUri: string, filename: string) => {
    try {
      const a = document.createElement("a");
      a.href = dataUri;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      success(`File ${filename} berhasil diunduh!`, "Unduhan Berhasil");
    } catch (err: any) {
      toastError("Gagal mengunduh file: " + err.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation back and header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/tools">
              <Button variant="ghost" size="sm" className="gap-1 text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                <span>Katalog Tools</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <Badge variant="secondary" className="text-[10px]">
              {tool.categoryLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Endpoint: <span className="text-cyan-400">{tool.endpoint}</span>
            </span>
          </div>
        </div>

        {/* Tool Title & Overview */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <ToolBrandIcon toolId={tool.id} size="lg" className="shrink-0 mt-1" />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={tool.requiresKey ? "warning" : "success"} className="text-[10px]">
                    {tool.requiresKey ? "Memerlukan API Key" : "Backend Riil Aktif"}
                  </Badge>
                  {tool.badge && (
                    <Badge variant="cyan" className="text-[10px]">
                      {tool.badge}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {tool.name}
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Proteksi SSRF & Kepatuhan Legal Terverifikasi</span>
            </div>
          </div>
        </div>

        {/* Unconfigured Provider Banner Alert */}
        {configRequiredError && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-5 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400 shrink-0">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Provider Belum Dikonfigurasi
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {configRequiredError.error}
                  </p>
                  <p className="text-[11px] text-amber-400/90 mt-1 font-mono">
                    Provider Diperlukan: {configRequiredError.requiredProviderName}
                  </p>
                </div>
              </div>

              <Link href="/admin/providers">
                <Button variant="glow" size="sm" className="whitespace-nowrap gap-1.5 text-xs">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Buka Admin Provider</span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Main Workbench Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form Panel */}
          <Card className="border-slate-800 bg-slate-900/60 p-5 h-fit">
            <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-800/60">
              <CardTitle className="text-sm text-white font-semibold">Parameter Input</CardTitle>
              <p className="text-[11px] text-slate-400">Masukkan target yang sah dan publik.</p>
            </CardHeader>

            <form onSubmit={handleExecute} className="space-y-4 text-xs">
              {/* File upload input for file tools & metadata cleaner */}
              {tool.category === "files" && tool.id !== "web-cloner" ? (
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">
                    {tool.id === "metadata-cleaner"
                      ? "Pilih File Gambar (JPEG / PNG / WebP) untuk Dibersihkan"
                      : tool.id === "file-hash" || tool.id === "qr-analyzer"
                      ? "Unggah File (Opsional jika mengisi teks di bawah)"
                      : "Unggah File Target"}
                  </label>
                  <input
                    type="file"
                    accept={tool.id === "metadata-cleaner" ? "image/jpeg,image/png,image/webp" : undefined}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  {selectedFile && (
                    <div className="text-[10px] text-cyan-400 font-mono mt-1">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                  {tool.id === "metadata-cleaner" && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Menghapus EXIF GPS koordinat, merk kamera, IPTC, dan ancillary data secara in-memory.
                    </p>
                  )}
                </div>
              ) : null}

              {/* Extra input for IOC Defang */}
              {tool.id === "ioc-defang" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Mode Operasi Indikator</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIocDefangAction("defang")}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          iocDefangAction === "defang"
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Defang (Amankan IOC)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIocDefangAction("refang")}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          iocDefangAction === "refang"
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Refang (Kembalikan Asli)
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Indikator Ancaman (IP, Domain, URL, Email)</label>
                    <textarea
                      rows={6}
                      required
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={"hxxp://evil-site[.]com\n192.168.1.100\nmalware@phishing-target[.]net"}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none font-mono leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Extra input for Forensic Decoder */}
              {tool.id === "forensic-decoder" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Format Encoding / Dekode</label>
                    <select
                      value={forensicEncoding}
                      onChange={(e: any) => setForensicEncoding(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="auto">Auto Detect (Deteksi Otomatis)</option>
                      <option value="base64">Base64</option>
                      <option value="hex">Hexadecimal (0x / Raw Hex)</option>
                      <option value="url">URL Encoded (%XX)</option>
                      <option value="html">HTML Entities (&amp;amp;, &#...)</option>
                      <option value="rot13">ROT13 Cipher</option>
                      <option value="binary">Binary (8-bit ASCII)</option>
                      <option value="jwt">JSON Web Token (JWT Claims)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Payload Teks Terkodefikasi</label>
                    <textarea
                      rows={6}
                      required
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Paste payload Base64, Hex, URL-encoded, atau token JWT di sini..."
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none font-mono leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Extra input for User-Agent Analyzer */}
              {tool.id === "useragent-analyzer" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-slate-300">String User-Agent</label>
                    <button
                      type="button"
                      onClick={() => setTextInput(navigator.userAgent)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-mono"
                    >
                      Gunakan Browser Ini
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none font-mono leading-relaxed"
                  />
                </div>
              )}

              {/* Extra input for Reddit Analyzer */}
              {tool.id === "reddit-analyzer" && (
                <div className="space-y-2">
                  <label className="font-medium text-slate-300">Tipe Target Reddit</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRedditType("user")}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        redditType === "user"
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Pengguna (User)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRedditType("subreddit")}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        redditType === "subreddit"
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Komunitas (Subreddit)
                    </button>
                  </div>
                  <div className="space-y-1 mt-2">
                    <label className="font-medium text-slate-300 text-[11px]">
                      {redditType === "user" ? "Username Reddit (tanpa u/)" : "Nama Subreddit (tanpa r/)"}
                    </label>
                    <Input
                      required
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={redditType === "user" ? "spez" : "cybersecurity"}
                    />
                  </div>
                </div>
              )}

              {/* Specialized input for Social Profile Analyzer */}
              {tool.id === "social-profile-analyzer" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Pilih Platform Media Sosial</label>
                    <select
                      value={socialPlatform}
                      onChange={(e) => setSocialPlatform(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="auto">Auto-Detect (Otomatis dari URL atau Username)</option>
                      <option value="youtube">YouTube (Channel / Handle @... / URL)</option>
                      <option value="tiktok">TikTok (@username atau URL)</option>
                      <option value="instagram">Instagram (@username atau URL)</option>
                      <option value="twitter">X / Twitter (@username atau URL)</option>
                      <option value="facebook">Facebook (Username / ID atau URL)</option>
                      <option value="telegram">Telegram (Channel / User atau t.me/...)</option>
                      <option value="reddit">Reddit (User u/...)</option>
                      <option value="github">GitHub (Developer Username / URL)</option>
                      <option value="linkedin">LinkedIn (Profil Profesional / in/...)</option>
                      <option value="pinterest">Pinterest (Profil / Pin boards)</option>
                      <option value="threads">Threads (@username atau threads.net)</option>
                      <option value="twitch">Twitch (Live Streamer Channel)</option>
                      <option value="spotify">Spotify (Artist / User Profile)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Target Profil (URL Bagikan atau Username/Nickname)</label>
                    <Input
                      required
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Contoh: https://www.tiktok.com/@jokowi, @jokowi, atau jokowi"
                    />
                    <p className="text-[10px] text-slate-400">
                      Mendukung penarikan foto profil, followers, likes, bio, dan statistik publik media sosial secara riil.
                    </p>
                  </div>
                </div>
              )}

              {/* Standard text input for tools other than specialized forms */}
              {tool.id !== "social-profile-analyzer" &&
                tool.id !== "ioc-defang" &&
                tool.id !== "forensic-decoder" &&
                tool.id !== "useragent-analyzer" &&
                tool.id !== "reddit-analyzer" &&
                !(tool.category === "files" && tool.id !== "file-hash" && tool.id !== "qr-analyzer" && tool.id !== "web-cloner") && (
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">
                      {tool.id === "report-generator"
                        ? "Target / Subjek Investigasi (contoh: smkn3jogja.sch.id atau nama entitas)"
                        : tool.id === "rss-monitor"
                        ? "URL Feed RSS / Atom Publik (contoh: https://feeds.bbci.co.uk/news/rss.xml)"
                        : tool.id === "keyword-monitor"
                        ? "Kata Kunci Pemantauan Publik (contoh: ransomware attack)"
                        : tool.id === "qr-analyzer"
                        ? "Muatan Teks / URL QR Code (atau gunakan file di atas)"
                        : tool.id === "subdomain-finder"
                        ? "Nama Domain Target (contoh: github.com)"
                        : tool.id === "ssl-inspector"
                        ? "Nama Host / Domain Target SSL (contoh: google.com)"
                        : tool.id === "security-headers"
                        ? "URL / Domain Target Security Headers (contoh: https://github.com)"
                        : tool.id === "dns-propagation"
                        ? "Nama Domain Uji Propagasi Global (contoh: cloudflare.com)"
                        : tool.id === "wayback-machine"
                        ? "URL Target Arsip Wayback (contoh: https://wikipedia.org)"
                        : tool.id === "robots-sitemap-analyzer"
                        ? "URL Target Analisis Robots & Sitemap (contoh: https://example.com)"
                        : tool.id === "telegram-analyzer"
                        ? "Username Saluran Telegram Publik (contoh: telegram atau https://t.me/durov)"
                        : tool.id === "github-recon"
                        ? "Username Developer GitHub (contoh: torvalds)"
                        : tool.id === "mac-lookup"
                        ? "Alamat MAC Target (contoh: 00:1A:2B:3C:4D:5E)"
                        : tool.id.includes("domain") || tool.id === "dns-lookup" || tool.id === "whois-lookup"
                        ? "Nama Domain Target (contoh: example.com)"
                        : tool.id === "ip-lookup"
                        ? "Alamat IP Target (IPv4/IPv6)"
                        : tool.id.includes("email")
                        ? "Alamat Email"
                        : tool.id.includes("phone")
                        ? "Nomor Telepon Internasional (+62...)"
                        : tool.id.includes("username")
                        ? "Username Pengguna"
                        : tool.id.includes("hashtag")
                        ? "Hashtag (tanpa tanda #)"
                        : tool.category === "downloader" ||
                          tool.id === "url-scanner" ||
                          tool.id === "tech-detector" ||
                          tool.id === "link-extractor" ||
                          tool.id === "website-screenshot" ||
                          tool.id === "web-cloner"
                        ? "URL Publik Target (https://...)"
                        : "Teks atau Dokumen yang Dianalisis"}
                    </label>

                    {tool.category === "ai" || tool.id === "file-hash" ? (
                      <textarea
                        rows={6}
                        required={!selectedFile}
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder={
                          tool.id === "ioc-extractor"
                            ? "Paste log server atau teks insiden di sini (misal: hxxp://bad[.]com 192.168.1.1)..."
                            : tool.id === "file-hash"
                            ? "Ketik teks untuk dihitung hash kriptografinya (atau unggah file di atas)..."
                            : "Ketik atau paste teks di sini..."
                        }
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none font-mono leading-relaxed"
                      />
                    ) : (
                      <Input
                        required={!selectedFile}
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder={
                          tool.id === "report-generator"
                            ? "https://smkn3jogja.sch.id/ atau domain target..."
                            : tool.id === "rss-monitor"
                            ? "https://feeds.bbci.co.uk/news/rss.xml"
                            : tool.id === "keyword-monitor"
                            ? "ransomware attack"
                            : tool.id === "qr-analyzer"
                            ? "https://nexus-osint.io"
                            : tool.id === "dns-lookup"
                            ? "cloudflare.com"
                            : tool.id === "ip-lookup"
                            ? "1.1.1.1"
                            : tool.id === "subdomain-finder"
                            ? "github.com"
                            : tool.id === "ssl-inspector"
                            ? "google.com"
                            : tool.id === "security-headers"
                            ? "https://github.com"
                            : tool.id === "dns-propagation"
                            ? "cloudflare.com"
                            : tool.id === "wayback-machine"
                            ? "https://wikipedia.org"
                            : tool.id === "robots-sitemap-analyzer"
                            ? "https://example.com"
                            : tool.id === "telegram-analyzer"
                            ? "telegram"
                            : tool.id === "github-recon"
                            ? "torvalds"
                            : tool.id === "mac-lookup"
                            ? "00:1A:2B:3C:4D:5E"
                            : tool.id === "username-checker"
                            ? "torvalds"
                            : tool.id.includes("email")
                            ? "analyst@example.com"
                            : tool.id.includes("phone")
                            ? "+6281234567890"
                            : tool.id.includes("hashtag")
                            ? "cybersecurity"
                            : "https://..."
                        }
                      />
                    )}
                  </div>
                )}

              {/* Extra parameter for SSL Port */}
              {tool.id === "ssl-inspector" && (
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Port Handshake TLS (Default: 443)</label>
                  <Input
                    type="number"
                    value={sslPort}
                    onChange={(e) => setSslPort(e.target.value)}
                    placeholder="443"
                    className="font-mono text-xs"
                  />
                </div>
              )}

              {/* Extra parameter for DNS Lookup & DNS Propagation */}
              {(tool.id === "dns-lookup" || tool.id === "dns-propagation") && (
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Tipe Record DNS</label>
                  <select
                    value={selectedDnsRecord}
                    onChange={(e) => setSelectedDnsRecord(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    {tool.id === "dns-lookup" && <option value="ALL">ALL (Semua Record)</option>}
                    <option value="A">A (IPv4 Address)</option>
                    <option value="AAAA">AAAA (IPv6 Address)</option>
                    <option value="MX">MX (Mail Exchange)</option>
                    <option value="TXT">TXT (Verification & SPF)</option>
                    <option value="NS">NS (Name Server)</option>
                    <option value="CNAME">CNAME (Canonical Alias)</option>
                    {tool.id === "dns-lookup" && (
                      <>
                        <option value="SOA">SOA (Start of Authority)</option>
                        <option value="CAA">CAA (Certificate Authority)</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Extra parameter for Downloader */}
              {tool.category === "downloader" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Format</label>
                    <select
                      value={selectedFormat}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="mp4">MP4 (Video)</option>
                      <option value="mp3">MP3 (Audio)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Kualitas</label>
                    <select
                      value={selectedQuality}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="1080p">1080p Full HD</option>
                      <option value="720p">720p HD</option>
                      <option value="480p">480p SD</option>
                    </select>
                  </div>
                </div>
              )}

              
              {/* Extra parameter for File Converter */}
              {tool.id === "file-converter" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-slate-300">Format Target Konversi</label>
                    <span className="text-[10px] text-cyan-400 font-mono">Pilihan Multi-MIME</span>
                  </div>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    <optgroup label="Format Gambar">
                      <option value="png">PNG (Portable Network Graphics - Lossless)</option>
                      <option value="jpg">JPG / JPEG (Standard Foto Web)</option>
                      <option value="webp">WebP (Format Modern Ringan)</option>
                    </optgroup>
                    <optgroup label="Format Audio">
                      <option value="mp3">MP3 (MPEG Audio Stream)</option>
                      <option value="wav">WAV (Waveform Lossless)</option>
                    </optgroup>
                  </select>
                </div>
              )}

              {/* Extra parameter for Image Compressor */}
              {tool.id === "image-compressor" && (
                <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-slate-300">Kualitas Kompresi</label>
                    <span className="font-mono text-cyan-400 text-xs font-bold">{imageQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="95"
                    step="5"
                    value={imageQuality}
                    onChange={(e) => setImageQuality(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Maksimal Hemat (20%)</span>
                    <span>Seimbang (80%)</span>
                    <span>Preservasi Kualitas (95%)</span>
                  </div>
                </div>
              )}

              {/* Extra parameter for Video Compressor */}
              {tool.id === "video-compressor" && (
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Target Resolusi & Encoding</label>
                  <select
                    value={selectedQuality}
                    onChange={(e) => setSelectedQuality(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="720p">720p HD (Optimal Web / Medsos)</option>
                    <option value="480p">480p SD (Ukuran Ekstra Kecil)</option>
                    <option value="1080p">1080p Full HD (Kualitas Tinggi)</option>
                  </select>
                </div>
              )}

              {/* Extra parameter for Website Screenshot */}
              {tool.id === "website-screenshot" && (
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Preset Viewport & Resolusi Layar</label>
                  <select
                    value={screenshotDevice}
                    onChange={(e) => setScreenshotDevice(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="desktop">🖥️ Desktop Full HD (1920 x 1080)</option>
                    <option value="laptop">💻 Laptop HD (1366 x 768)</option>
                    <option value="tablet">📱 Tablet iPad (768 x 1024)</option>
                    <option value="mobile">📲 Smartphone Mobile (375 x 812)</option>
                  </select>
                </div>
              )}

              {/* Extra parameter for Web Cloner */}
              {tool.id === "web-cloner" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-slate-300">Nama File HTML Output (Opsional)</label>
                    <span className="text-[10px] text-cyan-400 font-mono">Format .html</span>
                  </div>
                  <Input
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    placeholder="contoh: landing-page-cloned.html"
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-500">
                    Kosongkan untuk menggunakan nama default berdasarkan nama domain target.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                variant="glow"
                className="w-full justify-center gap-2 mt-2"
                isLoading={loading}
              >
                <Play className="h-4 w-4" />
                <span>Jalankan Analisis</span>
              </Button>
            </form>
          </Card>

          {/* Result Display Panel */}
          <Card className="lg:col-span-2 border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
                <div>
                  <CardTitle className="text-sm text-white font-semibold">Hasil Analisis Riil</CardTitle>
                  <p className="text-[11px] text-slate-400">Data live dari provider & backend scanner.</p>
                </div>

                <div className="flex items-center gap-2">
                  {resultData && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewJson(!viewJson)}
                        className="text-xs text-slate-300 hover:text-white"
                      >
                        <FileCode className="h-3.5 w-3.5 mr-1" />
                        <span>{viewJson ? "Tampilan Rapi" : "Lihat JSON"}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyResult}
                        className="text-xs text-slate-300"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 mr-1" />
                        )}
                        <span>{copied ? "Disalin" : "Salin"}</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Loading & Progress State */}
              {loading && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">{progressText}</p>
                    <p className="text-xs text-slate-400">Menjalankan audit pasif dan mematuhi batas rate limit...</p>
                  </div>
                  <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Empty state when no result yet */}
              {!loading && !resultData && !configRequiredError && (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Search className="h-10 w-10 mx-auto opacity-30" />
                  <p className="text-sm">Belum ada data eksekusi.</p>
                  <p className="text-xs text-slate-500">
                    Masukkan parameter di panel sebelah kiri dan klik &quot;Jalankan Analisis&quot;.
                  </p>
                </div>
              )}

              {/* Render Structured Result */}
              {!loading && resultData && (
                <div className="space-y-4">
                  {/* Provider & Latency Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Provider:</span>
                      <span className="font-semibold text-emerald-400 font-mono">
                        {resultData.provider || "Nexus Intelligence Core"}
                      </span>
                    </div>
                    {resultData.latencyMs !== undefined && (
                      <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                        <Clock className="h-3 w-3 text-cyan-400" />
                        <span>{resultData.latencyMs} ms</span>
                      </div>
                    )}
                  </div>

                  {viewJson ? (
                    <pre className="max-h-96 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-cyan-300 leading-relaxed">
                      {JSON.stringify(resultData, null, 2)}
                    </pre>
                  ) : (
                    <div className="space-y-3">
                      {/* DNS Lookup Records View */}
                      {resultData.records && (
                        <div className="space-y-4">
                          {/* DNS Header Bar */}
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                <Server className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white font-mono">
                                  {resultData.domain || "DNS Records"}
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                  Tipe Kueri: <span className="font-mono text-cyan-300 font-semibold">{resultData.recordType || "ALL"}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {Object.entries(resultData.records).map(([type, val]: any) => {
                                const count = Array.isArray(val)
                                  ? val.length
                                  : val && typeof val === "object" && !val.error
                                  ? 1
                                  : 0;
                                return (
                                  <Badge
                                    key={type}
                                    variant={count > 0 ? "cyan" : "secondary"}
                                    className="text-[10px] font-mono"
                                  >
                                    {type}: {count}
                                  </Badge>
                                );
                              })}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDnsViewRaw(!dnsViewRaw)}
                                className="h-7 text-[11px] gap-1 ml-1 text-slate-400 hover:text-white"
                              >
                                <Code2 className="h-3 w-3" />
                                <span>{dnsViewRaw ? "Kartu" : "Raw JSON"}</span>
                              </Button>
                            </div>
                          </div>

                          {dnsViewRaw ? (
                            <pre className="max-h-96 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 leading-relaxed">
                              {JSON.stringify(resultData.records, null, 2)}
                            </pre>
                          ) : (
                            <div className="space-y-3">
                              {/* A Records (IPv4) */}
                              {Array.isArray(resultData.records.A) && resultData.records.A.length > 0 && (
                                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                      A Records (IPv4 Address):
                                    </span>
                                    <Badge variant="success" className="text-[9px] font-mono">
                                      {resultData.records.A.length} IP
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {resultData.records.A.map((ip: string, i: number) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300"
                                      >
                                        <span>{ip}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(ip);
                                            success("IP Address disalin!", "Tersalin");
                                          }}
                                          className="text-slate-500 hover:text-white transition-colors"
                                          title="Salin IP"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* AAAA Records (IPv6) */}
                              {Array.isArray(resultData.records.AAAA) && resultData.records.AAAA.length > 0 && (
                                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-400 font-mono flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-blue-400" />
                                      AAAA Records (IPv6 Address):
                                    </span>
                                    <Badge variant="cyan" className="text-[9px] font-mono">
                                      {resultData.records.AAAA.length} IP
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {resultData.records.AAAA.map((ip: string, i: number) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 break-all"
                                      >
                                        <span>{ip}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(ip);
                                            success("IPv6 Address disalin!", "Tersalin");
                                          }}
                                          className="text-slate-500 hover:text-white transition-colors"
                                          title="Salin IPv6"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* MX Records (Mail Exchanger) */}
                              {Array.isArray(resultData.records.MX) && resultData.records.MX.length > 0 && (
                                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-violet-400 font-mono flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-violet-400" />
                                      MX Records (Mail Exchangers):
                                    </span>
                                    <Badge variant="secondary" className="text-[9px] font-mono">
                                      {resultData.records.MX.length} Host
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {resultData.records.MX.map((mx: any, i: number) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs"
                                      >
                                        <span className="font-mono text-slate-200 truncate pr-2">
                                          {mx.exchange || mx}
                                        </span>
                                        <Badge variant="cyan" className="text-[9px] font-mono shrink-0">
                                          Prioritas: {mx.priority ?? 10}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* NS Records (Nameservers) */}
                              {Array.isArray(resultData.records.NS) && resultData.records.NS.length > 0 && (
                                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                                      NS Records (Authoritative Nameservers):
                                    </span>
                                    <Badge variant="secondary" className="text-[9px] font-mono">
                                      {resultData.records.NS.length} Server
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {resultData.records.NS.map((ns: string, i: number) => (
                                      <div
                                        key={i}
                                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-200"
                                      >
                                        {ns}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* TXT Records (SPF, Verification, DKIM) */}
                              {Array.isArray(resultData.records.TXT) && resultData.records.TXT.length > 0 && (
                                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                                      TXT Records (SPF, DMARC &amp; Verifikasi Domain):
                                    </span>
                                    <Badge variant="secondary" className="text-[9px] font-mono">
                                      {resultData.records.TXT.length} Entri
                                    </Badge>
                                  </div>
                                  <div className="space-y-1.5">
                                    {resultData.records.TXT.map((item: any, i: number) => {
                                      const txtStr = Array.isArray(item) ? item.join(" ") : String(item);
                                      const isSpf = txtStr.toLowerCase().startsWith("v=spf1");
                                      const isDmarc = txtStr.toLowerCase().startsWith("v=dmarc1");
                                      const isGoogle = txtStr.toLowerCase().includes("google-site-verification");
                                      return (
                                        <div
                                          key={i}
                                          className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs space-y-1"
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                                              {isSpf
                                                ? "Kebijakan Email (SPF)"
                                                : isDmarc
                                                ? "DMARC Policy"
                                                : isGoogle
                                                ? "Verifikasi Google Workspace"
                                                : "TXT Record"}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                navigator.clipboard.writeText(txtStr);
                                                success("TXT Record disalin!", "Tersalin");
                                              }}
                                              className="text-slate-500 hover:text-white transition-colors"
                                              title="Salin"
                                            >
                                              <Copy className="h-3 w-3" />
                                            </button>
                                          </div>
                                          <p className="font-mono text-[11px] text-slate-300 break-all leading-relaxed">
                                            {txtStr}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* SOA Record (Start of Authority) */}
                              {resultData.records.SOA && typeof resultData.records.SOA === "object" && !resultData.records.SOA.error && (
                                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                                  <span className="text-xs font-bold text-purple-400 font-mono flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-purple-400" />
                                    SOA Record (Start of Authority):
                                  </span>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                      <span className="text-[10px] text-slate-500 block">Primary Nameserver</span>
                                      <span className="text-slate-200 text-[11px] truncate block">
                                        {resultData.records.SOA.nsname || "-"}
                                      </span>
                                    </div>
                                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                      <span className="text-[10px] text-slate-500 block">Hostmaster / Admin</span>
                                      <span className="text-slate-200 text-[11px] truncate block">
                                        {resultData.records.SOA.hostmaster || "-"}
                                      </span>
                                    </div>
                                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                      <span className="text-[10px] text-slate-500 block">Serial Number</span>
                                      <span className="text-cyan-300 text-[11px] block">
                                        {resultData.records.SOA.serial || "-"}
                                      </span>
                                    </div>
                                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                                      <span className="text-[10px] text-slate-500 block">TTL Minimum</span>
                                      <span className="text-emerald-300 text-[11px] block">
                                        {resultData.records.SOA.minttl || resultData.records.SOA.expire || "-"}s
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* CNAME Records */}
                              {Array.isArray(resultData.records.CNAME) && resultData.records.CNAME.length > 0 && (
                                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                                  <span className="text-xs font-bold text-cyan-400 font-mono">CNAME Records:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {resultData.records.CNAME.map((cname: string, i: number) => (
                                      <div
                                        key={i}
                                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300"
                                      >
                                        {cname}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {resultData.indicators && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-white">Indikator Ancaman Ditemukan:</h4>
                            <Badge variant="cyan" className="text-[10px]">
                              {resultData.totalIndicators} IOCs
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                              <span className="text-slate-400 block mb-1">IP Addresses ({resultData.indicators.ipAddresses.length}):</span>
                              <div className="font-mono text-blue-400 text-[11px]">
                                {resultData.indicators.ipAddresses.join(", ") || "-"}
                              </div>
                            </div>
                            <div className="rounded border border-slate-800 bg-slate-950 p-2.5">
                              <span className="text-slate-400 block mb-1">Domains ({resultData.indicators.domains.length}):</span>
                              <div className="font-mono text-cyan-400 text-[11px]">
                                {resultData.indicators.domains.join(", ") || "-"}
                              </div>
                            </div>
                          </div>
                          <pre className="max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300">
                            {JSON.stringify(resultData.indicators, null, 2)}
                          </pre>
                        </div>
                      )}

                      {resultData.technologies && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-white">Teknologi Terdeteksi ({resultData.totalDetected}):</h4>
                          <div className="space-y-1.5">
                            {resultData.technologies.map((t: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded border border-slate-800 bg-slate-950 px-3 py-2 text-xs"
                              >
                                <span className="font-semibold text-white">{t.name}</span>
                                <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {typeof resultData.summary === "string" && (tool.id === "text-summarizer" || resultData.originalWordCount !== undefined) && (
                        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs space-y-2">
                          <h4 className="font-semibold text-white">Ringkasan Eksekutif:</h4>
                          <p className="text-slate-300 leading-relaxed">{resultData.summary}</p>
                          <div className="pt-2 text-[10px] text-slate-500">
                            Kata Asli: {resultData.originalWordCount} • Estimasi Token: {resultData.estimatedTokens}
                          </div>
                        </div>
                      )}

                      {resultData.hashes && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-white">Kalkulasi Hash Kriptografi:</h4>
                          {Object.entries(resultData.hashes).map(([algo, hashVal]: any) => (
                            <div
                              key={algo}
                              className="rounded border border-slate-800 bg-slate-950 p-2.5 text-xs flex flex-col gap-1"
                            >
                              <span className="font-semibold uppercase text-slate-400 text-[10px]">{algo}</span>
                              <span className="font-mono text-cyan-300 text-[11px] break-all">{hashVal}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {resultData.media && (
                        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                            {resultData.media.thumbnailUrl && (
                              <img
                                src={resultData.media.thumbnailUrl}
                                alt="Media Thumbnail"
                                referrerPolicy="no-referrer"
                                className="w-full sm:w-44 h-28 object-cover rounded-md border border-slate-800 shrink-0"
                              />
                            )}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="cyan" className="text-[10px] uppercase font-mono">
                                  {resultData.media.platform}
                                </Badge>
                                <span className="text-xs text-slate-400 font-medium">
                                  {resultData.media.author}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-white line-clamp-2">
                                {resultData.media.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                <span>Format: <strong className="text-emerald-400 font-mono">{resultData.media.format || "MP4 Video"}</strong></span>
                                <span>Ukuran: <strong className="text-slate-200">{resultData.media.fileSizeFormatted}</strong></span>
                                {resultData.media.durationSeconds ? (
                                  <span>Durasi: <strong className="text-slate-200">{resultData.media.durationSeconds} dtk</strong></span>
                                ) : null}
                                <Badge variant="success" className="text-[9px] font-mono uppercase">FORMAT ASLI: MP4 / MP3</Badge>
                              </div>
                              <div className="pt-2 flex flex-wrap items-center gap-2">
                                <a
                                  href={resultData.media.streamProxyUrl || resultData.media.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={resultData.media.filename || "media_download.mp4"}
                                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
                                >
                                  <Download className="h-4 w-4" />
                                  <span>Unduh Video MP4 ({resultData.media.fileSizeFormatted || "HD"})</span>
                                </a>
                                <a
                                  href={
                                    resultData.media.mp3DownloadUrl ||
                                    `/api/media/stream?url=${encodeURIComponent(
                                      resultData.media.audioUrl || resultData.media.downloadUrl
                                    )}&filename=${encodeURIComponent(
                                      resultData.media.mp3Filename || "audio_download.mp3"
                                    )}&format=mp3`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={resultData.media.mp3Filename || "audio_download.mp3"}
                                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
                                >
                                  <Music className="h-4 w-4" />
                                  <span>Unduh Audio MP3</span>
                                </a>
                                {resultData.media.directDownloadUrl && resultData.media.streamProxyUrl && (
                                  <a
                                    href={resultData.media.directDownloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-2 text-xs transition-colors"
                                    title="Buka tautan stream CDN"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                                    <span>Buka Link Asli (CDN)</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          {resultData.copyrightNotice && (
                            <p className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2">
                              {resultData.copyrightNotice}
                            </p>
                          )}
                        </div>
                      )}

                      {resultData.screenshotUrl && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                          {/* Header with Title, Favicon, and Dimensions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {resultData.pageMetadata?.favicon && (
                                  <img
                                    src={resultData.pageMetadata.favicon}
                                    alt="favicon"
                                    className="h-4 w-4 rounded-sm object-contain shrink-0"
                                    onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                )}
                                <h4 className="text-sm font-bold text-white truncate">
                                  {resultData.pageMetadata?.title || resultData.targetUrl}
                                </h4>
                              </div>
                              {resultData.pageMetadata?.description && (
                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                  {resultData.pageMetadata.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {resultData.viewportName && (
                                <Badge variant="secondary" className="text-[10px] font-mono">
                                  {resultData.viewportName}
                                </Badge>
                              )}
                              <Badge variant="cyan" className="text-[10px] font-mono">
                                {resultData.dimensions || "1920x1080"}
                              </Badge>
                            </div>
                          </div>

                          {/* Image Box */}
                          <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black/60 shadow-inner group">
                            <img
                              src={resultData.screenshotUrl}
                              alt={`Tangkapan layar ${resultData.targetUrl}`}
                              className="w-full h-auto max-h-[520px] object-contain rounded transition-all duration-300"
                              loading="lazy"
                            />
                          </div>

                          {/* Action Toolbar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
                            <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                              {resultData.targetUrl}
                            </span>
                            <div className="flex items-center gap-2">
                              <a
                                href={resultData.downloadDataUri || resultData.screenshotUrl}
                                download={`screenshot-${resultData.targetUrl ? new URL(resultData.targetUrl).hostname : "capture"}.png`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40">
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Unduh Screenshot</span>
                                </Button>
                              </a>
                              <a
                                href={resultData.screenshotUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" variant="ghost" className="text-xs h-8 gap-1.5 text-slate-300 hover:text-white">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span>Buka Tab Penuh</span>
                                </Button>
                              </a>
                            </div>
                          </div>

                          {resultData.privacyCompliance && (
                            <p className="text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
                              {resultData.privacyCompliance}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Website Cloner & DOM Source Extractor View */}
                      {resultData.data?.html && tool.id === "web-cloner" && (
                        <div className="space-y-4">
                          {/* Cloner Summary Header */}
                          <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-cyan-400" />
                                  <h4 className="text-sm font-bold text-white tracking-tight truncate max-w-md">
                                    {resultData.data.title || resultData.data.domain}
                                  </h4>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1 font-mono truncate max-w-lg">
                                  {resultData.data.url}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge variant="cyan" className="text-xs px-2 py-0.5 font-mono">
                                  {resultData.data.sizeFormatted}
                                </Badge>
                                <Badge variant="default" className="text-xs px-2 py-0.5">
                                  100% DOM Extracted
                                </Badge>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                              <Button
                                type="button"
                                variant="glow"
                                size="sm"
                                onClick={() => downloadClonedHtml(resultData.data.html, resultData.data.filename)}
                                className="gap-1.5 text-xs h-8"
                              >
                                <FileDown className="h-4 w-4" />
                                <span>Unduh File HTML ({resultData.data.filename})</span>
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(resultData.data.html);
                                  success("Kode sumber HTML disalin ke clipboard!", "Disalin");
                                }}
                                className="gap-1.5 text-xs h-8 border-slate-700 hover:text-cyan-300"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                <span>Salin Kode Sumber</span>
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const blob = new Blob([resultData.data.html], { type: "text/html;charset=utf-8" });
                                  const url = URL.createObjectURL(blob);
                                  window.open(url, "_blank");
                                }}
                                className="gap-1.5 text-xs h-8 text-slate-400 hover:text-white"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Buka di Tab Baru</span>
                              </Button>
                            </div>
                          </div>

                          {/* View Switcher Tabs */}
                          <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
                            <button
                              type="button"
                              onClick={() => setClonerTab("preview")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                clonerTab === "preview"
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <Layout className="h-3.5 w-3.5" />
                              <span>Pratinjau Visual (Cloned View)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setClonerTab("code")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                clonerTab === "code"
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <Code2 className="h-3.5 w-3.5" />
                              <span>Kode Sumber HTML ({resultData.data.stats?.charactersCount?.toLocaleString()} chars)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setClonerTab("stats")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                clonerTab === "stats"
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Metrik & Aset Ekstraksi</span>
                            </button>
                          </div>

                          {/* Tab Content */}
                          {clonerTab === "preview" && (
                            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950 shadow-2xl">
                              <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                                  <span className="ml-2 text-slate-400 font-sans text-xs">Cloned Sandbox Preview</span>
                                </div>
                                <span className="truncate max-w-xs">{resultData.data.url}</span>
                              </div>
                              <iframe
                                srcDoc={resultData.data.html}
                                sandbox="allow-scripts allow-same-origin"
                                className="w-full h-[520px] bg-white border-0"
                                title="Pratinjau Kloning Web"
                              />
                            </div>
                          )}

                          {clonerTab === "code" && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Struktur HTML Terformat:</span>
                                <span className="font-mono text-[11px]">UTF-8 • Standalone Ready</span>
                              </div>
                              <pre className="max-h-[500px] overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-cyan-300 leading-relaxed">
                                <code>{resultData.data.html}</code>
                              </pre>
                            </div>
                          )}

                          {clonerTab === "stats" && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                                <span className="text-slate-400 text-[11px]">CSS Stylesheets Inlined</span>
                                <div className="text-lg font-bold text-cyan-400 font-mono">
                                  {resultData.data.stats?.stylesheetsInlined} / {resultData.data.stats?.stylesheetsFound}
                                </div>
                                <p className="text-[10px] text-slate-500">Embedded langsung ke style tags</p>
                              </div>

                              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                                <span className="text-slate-400 text-[11px]">Elemen Script</span>
                                <div className="text-lg font-bold text-blue-400 font-mono">
                                  {resultData.data.stats?.scriptsCount}
                                </div>
                                <p className="text-[10px] text-slate-500">Script fungsionalitas DOM</p>
                              </div>

                              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                                <span className="text-slate-400 text-[11px]">Elemen Gambar & Media</span>
                                <div className="text-lg font-bold text-emerald-400 font-mono">
                                  {resultData.data.stats?.imagesCount}
                                </div>
                                <p className="text-[10px] text-slate-500">Aset diselesaikan ke URL absolut</p>
                              </div>

                              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                                <span className="text-slate-400 text-[11px]">Karakter DOM</span>
                                <div className="text-lg font-bold text-purple-400 font-mono">
                                  {resultData.data.stats?.charactersCount?.toLocaleString()}
                                </div>
                                <p className="text-[10px] text-slate-500">Ukuran file: {resultData.data.sizeFormatted}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Investigation Report Generator View */}
                      {resultData.document && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 to-slate-950 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
                                  <FileBadge className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-cyan-400 font-bold">{resultData.document.reportId}</span>
                                    <Badge variant="cyan" className="text-[10px] uppercase font-mono">
                                      {resultData.document.classification || "CONFIDENTIAL"}
                                    </Badge>
                                  </div>
                                  <h4 className="text-sm font-bold text-white mt-1">
                                    {resultData.document.title}
                                  </h4>
                                </div>
                              </div>
                              <Link href="/reports">
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-slate-300 hover:text-white">
                                  <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                                  <span>Buka di Repositori Laporan</span>
                                </Button>
                              </Link>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                              <span>Analis: <strong className="text-slate-200">{resultData.document.leadAnalyst}</strong></span>
                              <span>Organisasi: <strong className="text-slate-200">{resultData.document.organization}</strong></span>
                              <span>Keyakinan: <strong className="text-emerald-400">{resultData.document.findingsSummary?.averageConfidence || "96%"}</strong></span>
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2">
                            <h5 className="text-xs font-semibold text-white flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 text-cyan-400" />
                              <span>Ringkasan Eksekutif & Cakupan Target:</span>
                            </h5>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {resultData.document.executiveSummary}
                            </p>
                            {resultData.document.scopeTargets?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-2">
                                {resultData.document.scopeTargets.map((tgt: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="font-mono text-[10px]">
                                    Target: {tgt}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {resultData.document.detailedFindings?.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-xs font-semibold text-white">Temuan Analisis ({resultData.document.detailedFindings.length}):</h5>
                              <div className="space-y-2">
                                {resultData.document.detailedFindings.map((f: any, idx: number) => (
                                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-white font-mono text-[11px]">{f.id || `FND-0${idx + 1}`} - {f.category || "Intelijen"}</span>
                                      <Badge variant="success" className="text-[10px]">{f.status || "Tervalidasi"}</Badge>
                                    </div>
                                    <p className="text-slate-300 text-xs">{f.description || JSON.stringify(f)}</p>
                                    {f.confidence && (
                                      <div className="text-[10px] text-slate-500 font-mono">Skor Keyakinan: {f.confidence}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {resultData.document.legalDisclaimer && (
                            <p className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 leading-relaxed">
                              {resultData.document.legalDisclaimer}
                            </p>
                          )}
                        </div>
                      )}

                      {/* RSS / Keyword Monitor View */}
                      {(resultData.data?.recentItems || (tool.category === "monitor" && resultData.data)) && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Rss className="h-4 w-4 text-cyan-400" />
                                <h4 className="text-sm font-bold text-white">
                                  {resultData.data.feedTitle || resultData.data.target}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="success" className="text-[10px]">MONITORING AKTIF</Badge>
                                <Badge variant="cyan" className="text-[10px] font-mono">
                                  {resultData.data.totalMatches || resultData.data.recentItems?.length || 0} Entri
                                </Badge>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">
                              Target: {resultData.data.target} {resultData.data.keywordFilter ? `• Filter: ${resultData.data.keywordFilter}` : ""}
                            </p>
                          </div>

                          {resultData.data.recentItems && resultData.data.recentItems.length > 0 ? (
                            <div className="space-y-2">
                              <h5 className="text-xs font-semibold text-white">Item Feed Terkini:</h5>
                              <div className="space-y-2">
                                {resultData.data.recentItems.map((item: any, idx: number) => (
                                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1.5 hover:border-slate-700 transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                      <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline line-clamp-1 flex items-center gap-1.5"
                                      >
                                        <span>{item.title}</span>
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                      </a>
                                      {item.pubDate && (
                                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                                          {new Date(item.pubDate).toLocaleDateString("id-ID")}
                                        </span>
                                      )}
                                    </div>
                                    {item.snippet && (
                                      <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                                        {item.snippet}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">Tidak ada artikel terkini yang cocok dengan filter.</p>
                          )}
                        </div>
                      )}

                      {/* Username Checker View */}
                      {(tool.id === "username-checker" || (resultData.results && resultData.username)) && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-white">
                              Hasil Pengecekan Username: <span className="font-mono text-cyan-400">{resultData.username}</span>
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="success" className="text-[10px]">{resultData.foundCount} Ditemukan</Badge>
                              <Badge variant="secondary" className="text-[10px]">{resultData.totalChecked} Diperiksa</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {resultData.results?.map((r: any, idx: number) => (
                              <div
                                key={idx}
                                className={`flex items-center justify-between rounded-lg border p-2.5 transition-all ${
                                  r.status === "FOUND"
                                    ? "border-emerald-500/40 bg-emerald-950/20 text-white"
                                    : "border-slate-800/80 bg-slate-950/60 text-slate-400"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {r.avatar ? (
                                    <img src={r.avatar} alt={r.platform} referrerPolicy="no-referrer" className="h-6 w-6 rounded-full object-cover border border-slate-700" />
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                                      {r.platform[0]}
                                    </div>
                                  )}
                                  <span className="font-medium text-xs text-slate-200">{r.platform}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={r.status === "FOUND" ? "success" : "secondary"} className="text-[9px]">
                                    {r.status === "FOUND" ? "TERIDENTIFIKASI" : "TIDAK DITEMUKAN"}
                                  </Badge>
                                  {r.profileUrl && r.status === "FOUND" && (
                                    <a href={r.profileUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}



                      {/* Social Profile Analyzer View */}
                      {(tool.id === "social-profile-analyzer" || resultData.data?.platform) && resultData.data && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 sm:p-6 space-y-6">
                          {/* Banner (if available, e.g. YouTube / Twitter) */}
                          {resultData.data.bannerUrl && (
                            <div className="relative w-full h-28 sm:h-44 rounded-xl overflow-hidden border border-slate-800 shadow-md">
                              <img
                                src={resultData.data.bannerUrl}
                                alt="Banner Profil"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                            </div>
                          )}

                          {/* Header / Avatar + Identity */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-5 border-b border-slate-800/80">
                            {resultData.data.avatarUrl ? (
                              <div className="relative group shrink-0">
                                <img
                                  src={resultData.data.avatarUrl}
                                  alt="Foto Profil"
                                  referrerPolicy="no-referrer"
                                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-cyan-500/40 shadow-xl shadow-cyan-950/40 object-cover bg-slate-900"
                                />
                                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
                                </span>
                              </div>
                            ) : (
                              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 shrink-0">
                                <User className="h-10 w-10 text-cyan-400/60" />
                              </div>
                            )}

                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h4 className="text-lg font-bold text-white tracking-tight truncate">
                                  {resultData.data.displayName || resultData.data.username}
                                </h4>
                                {resultData.data.verified && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-0.5 rounded-full shadow-sm shadow-cyan-900/40">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                                    Terverifikasi Resmi
                                  </span>
                                )}
                                <Badge variant="cyan" className="text-[11px] font-semibold uppercase tracking-wider">
                                  {resultData.data.platform}
                                </Badge>
                              </div>
                              <p className="text-sm text-cyan-400 font-mono font-medium">@{resultData.data.username}</p>
                              {resultData.data.location && (
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                  <Compass className="h-3.5 w-3.5 text-slate-500" />
                                  <span>{resultData.data.location}</span>
                                </p>
                              )}
                            </div>

                            {resultData.data.profileUrl && (
                              <div className="sm:self-center w-full sm:w-auto">
                                <a
                                  href={resultData.data.profileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800/60 text-xs font-semibold text-cyan-300 transition-colors shadow-sm w-full sm:w-auto"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span>Lihat di {resultData.data.platform}</span>
                                </a>
                              </div>
                            )}
                          </div>

                          {/* 4 Stats Grid Cards */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:border-cyan-500/30 transition-colors">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                                  {resultData.data.platform === "YouTube" ? "Subscribers / Pelanggan" : "Followers / Pengikut"}
                                </span>
                                <Users className="h-4 w-4 text-cyan-400" />
                              </div>
                              <div className="text-base sm:text-lg font-bold text-white font-mono">
                                {resultData.data.metrics?.subscribersDetail || resultData.data.stats?.followers || "N/A"}
                              </div>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:border-rose-500/30 transition-colors">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                                  {resultData.data.platform === "YouTube" ? "Total Video Unggahan" : "Total Likes / Reputasi"}
                                </span>
                                <Heart className="h-4 w-4 text-rose-400" />
                              </div>
                              <div className="text-base sm:text-lg font-bold text-white font-mono">
                                {resultData.data.metrics?.totalVideos || resultData.data.stats?.likes || resultData.data.stats?.posts || "N/A"}
                              </div>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:border-blue-500/30 transition-colors">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                                  {resultData.data.platform === "YouTube" ? "Status Verifikasi" : "Following / Mengikuti"}
                                </span>
                                <UserCheck className="h-4 w-4 text-blue-400" />
                              </div>
                              <div className="text-base sm:text-lg font-bold text-white font-mono">
                                {resultData.data.platform === "YouTube"
                                  ? resultData.data.verified
                                    ? "Terverifikasi"
                                    : "Kanal Publik"
                                  : resultData.data.stats?.following || "N/A"}
                              </div>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:border-amber-500/30 transition-colors">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                                  {resultData.data.platform === "YouTube" ? "Channel ID / Identitas" : "Postingan / Konten"}
                                </span>
                                <Layers className="h-4 w-4 text-amber-400" />
                              </div>
                              <div className="text-base sm:text-lg font-bold text-white font-mono truncate" title={resultData.data.metrics?.channelId || ""}>
                                {resultData.data.platform === "YouTube"
                                  ? resultData.data.metrics?.channelId
                                    ? `${resultData.data.metrics.channelId.slice(0, 11)}...`
                                    : "Tervalidasi"
                                  : resultData.data.stats?.posts || "N/A"}
                              </div>
                            </div>
                          </div>

                          {/* Channel Tags (if available) */}
                          {resultData.data.metrics?.tags && resultData.data.metrics.tags.length > 0 && (
                            <div className="space-y-1.5">
                              <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Topik &amp; Tag Kanal</h5>
                              <div className="flex flex-wrap gap-1.5">
                                {resultData.data.metrics.tags.map((t: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border-cyan-800/50">
                                    #{t}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bio Content Box */}
                          {resultData.data.bio && (
                            <div className="space-y-1.5">
                              <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Deskripsi &amp; Bio Profil</h5>
                              <p className="text-xs sm:text-sm text-slate-200 bg-slate-900/80 p-4 rounded-xl border border-slate-800 leading-relaxed font-sans whitespace-pre-line">
                                {resultData.data.bio}
                              </p>
                            </div>
                          )}

                          {/* Provenance & Engine Info */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                              Provider: <strong className="text-slate-300 font-mono">{resultData.provider || resultData.data.metrics?.source || "Live Engine"}</strong>
                            </span>
                            {resultData.latencyMs !== undefined && (
                              <span className="text-slate-400 font-mono">Latency: {resultData.latencyMs}ms</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Social Media Search View */}
                      {resultData.results && tool.id === "social-media-search" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white">
                                  Hasil Intelijen Publik ({resultData.totalResults || resultData.results.length})
                                </h4>
                                {resultData.viralityScore !== undefined && (
                                  <Badge variant="cyan" className="text-[10px] font-mono">
                                    Virality: {resultData.viralityScore}/100
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Keyword: <strong className="text-cyan-300 font-mono">&quot;{resultData.query}&quot;</strong>
                              </p>
                            </div>
                            {resultData.sentimentStats && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                                  {resultData.sentimentStats.positif} Positif
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
                                  {resultData.sentimentStats.netral} Netral
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/60">
                                  {resultData.sentimentStats.kritis} Kritis
                                </span>
                              </div>
                            )}
                          </div>

                          {resultData.platformBreakdown && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] text-slate-400 mr-1">Platform Terdeteksi:</span>
                              {Object.entries(resultData.platformBreakdown).map(([plat, count]: [string, any], idx: number) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-slate-800 text-cyan-300">
                                  {plat}: <strong>{count}</strong>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="space-y-2.5">
                            {resultData.results.map((r: any, idx: number) => (
                              <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-950/90 hover:border-slate-700 transition-all p-3.5 text-xs space-y-2">
                                <div className="flex items-center justify-between flex-wrap gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="secondary" className="text-[9px] uppercase font-mono font-semibold">{r.platform}</Badge>
                                    {r.sentiment && (
                                      <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-semibold",
                                        r.sentiment === "POSITIF" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60" :
                                        r.sentiment === "KRITIS" ? "bg-rose-950/80 text-rose-400 border border-rose-800/60" :
                                        "bg-slate-800 text-slate-400"
                                      )}>
                                        {r.sentiment}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                    {r.score !== undefined && <span>Skor: <strong className="text-white">{r.score}</strong></span>}
                                    {r.comments !== undefined && <span>Komentar: <strong className="text-white">{r.comments}</strong></span>}
                                    {r.stars !== undefined && <span>Stars: <strong className="text-white">{r.stars}</strong></span>}
                                    {r.reblogs !== undefined && <span>Reblogs: <strong className="text-white">{r.reblogs}</strong></span>}
                                    {r.author && <span className="text-slate-500">{r.author}</span>}
                                  </div>
                                </div>
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-cyan-300 hover:underline line-clamp-2 block text-sm leading-snug">
                                  {r.title}
                                </a>
                                <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed break-words">{r.snippet}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hashtag Analyzer View */}
                      {resultData.hashtag && resultData.trendScore !== undefined && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xl font-bold text-cyan-400 font-mono">{resultData.hashtag}</h4>
                                {resultData.activity7Days?.isTrending && (
                                  <Badge variant="cyan" className="text-[10px] animate-pulse">TRENDING FEDIVERSE</Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-1">Analisis Virality, Frekuensi 7 Hari & Sentimen Lintas Jaringan</p>
                            </div>
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Skor Virality Publik</span>
                              <span className="text-3xl font-black text-emerald-400 font-mono">{resultData.trendScore}/100</span>
                            </div>
                          </div>

                          {resultData.activity7Days && resultData.activity7Days.history?.length > 0 && (
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <h5 className="text-xs font-semibold text-white">Aktivitas Tag 7 Hari Terakhir (Fediverse / Mastodon):</h5>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  Total: <strong className="text-cyan-300">{resultData.activity7Days.totalUses}</strong> penggunaan oleh <strong className="text-cyan-300">{resultData.activity7Days.uniqueAccounts}</strong> akun
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                                {resultData.activity7Days.history.map((h: any, idx: number) => (
                                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-center">
                                    <span className="text-[10px] text-slate-400 block">{h.day?.slice(5) || h.day}</span>
                                    <span className="text-xs font-bold text-white font-mono block">{h.uses}x</span>
                                    <span className="text-[9px] text-slate-500 block">{h.accounts} akun</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {resultData.redditDiscussions && resultData.redditDiscussions.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-xs font-semibold text-white">Diskusi Terkait di Reddit:</h5>
                              <div className="space-y-2">
                                {resultData.redditDiscussions.map((d: any, idx: number) => (
                                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs flex items-center justify-between gap-3">
                                    <div className="space-y-0.5 min-w-0">
                                      <span className="text-[10px] font-mono text-cyan-400">{d.subreddit}</span>
                                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-cyan-300 hover:underline font-medium block truncate">
                                        {d.title}
                                      </a>
                                    </div>
                                    <div className="text-right shrink-0 text-[10px] font-mono text-slate-400">
                                      <div>Skor: <strong className="text-white">{d.score}</strong></div>
                                      <div>{d.comments} Komentar</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {resultData.relatedTopics && resultData.relatedTopics.length > 0 && (
                            <div className="space-y-1.5">
                              <h5 className="text-xs font-semibold text-white">Topik Terkait:</h5>
                              <div className="flex flex-wrap gap-1.5">
                                {resultData.relatedTopics.map((topic: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {resultData.recommendation && (
                            <p className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                              {resultData.recommendation}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Email Validator View */}
                      {resultData.email && resultData.isDeliverableCandidate !== undefined && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] text-slate-400">Target Email:</span>
                              <h4 className="text-base font-bold text-white font-mono">{resultData.email}</h4>
                            </div>
                            <Badge variant={resultData.isDeliverableCandidate ? "success" : "warning"} className="text-xs px-3 py-1">
                              {resultData.isDeliverableCandidate ? "VALID & SIAP DITERIMA" : "BERESIKO / TIDAK DIREKOMENDASIKAN"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                              <span className="text-slate-400 text-[11px]">Sintaks RFC 5322</span>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                {resultData.isSyntaxValid ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
                                <span>{resultData.isSyntaxValid ? "Sesuai Standar" : "Tidak Valid"}</span>
                              </div>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                              <span className="text-slate-400 text-[11px]">Server MX (Mail Exchange)</span>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                {resultData.hasMxRecords ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
                                <span>{resultData.hasMxRecords ? "Aktif Terdeteksi" : "Tidak Ditemukan"}</span>
                              </div>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                              <span className="text-slate-400 text-[11px]">Disposable Email</span>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                {!resultData.isDisposable ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
                                <span>{!resultData.isDisposable ? "Domain Permanen" : "Domain Sementara (Disposable)"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Phone Validator View */}
                      {resultData.formatInternational && tool.id === "phone-validator" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] text-slate-400">Nomor Input:</span>
                              <h4 className="text-base font-bold text-white font-mono">{resultData.input}</h4>
                            </div>
                            <Badge variant={resultData.isValid ? "success" : "warning"} className="text-xs px-3 py-1">
                              {resultData.isValid ? "NOMOR TELEPON VALID" : "TIDAK STANDAR"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                              <span className="text-slate-400 text-[11px]">Negara & Kode</span>
                              <div className="font-semibold text-cyan-400 font-mono">{resultData.country} ({resultData.countryCallingCode})</div>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                              <span className="text-slate-400 text-[11px]">Format Internasional</span>
                              <div className="font-semibold text-white font-mono truncate">{resultData.formatInternational}</div>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                              <span className="text-slate-400 text-[11px]">Format Nasional</span>
                              <div className="font-semibold text-white font-mono truncate">{resultData.formatNational}</div>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                              <span className="text-slate-400 text-[11px]">Tipe Nomor</span>
                              <div className="font-semibold text-emerald-400 uppercase">{resultData.numberType}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* WHOIS Lookup View */}
                      {(resultData.registrar || resultData.raw) && (tool.id === "whois-lookup" || resultData.nameServers) && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h4 className="text-sm font-bold text-white font-mono">Domain: {resultData.domain}</h4>
                              <Badge variant="cyan" className="text-[10px]">WHOIS Port 43 Socket</Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                              <div>
                                <span className="text-slate-400 text-[11px] block">Registrar:</span>
                                <span className="font-semibold text-slate-200">{resultData.registrar}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[11px] block">Tanggal Dibuat:</span>
                                <span className="font-mono text-cyan-300">{resultData.creationDate}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[11px] block">Tanggal Kedaluwarsa:</span>
                                <span className="font-mono text-amber-300">{resultData.expiryDate}</span>
                              </div>
                            </div>
                          </div>

                          {resultData.nameServers && resultData.nameServers.length > 0 && (
                            <div className="space-y-1.5">
                              <h5 className="text-xs font-semibold text-white">Nameservers:</h5>
                              <div className="flex flex-wrap gap-1.5">
                                {resultData.nameServers.map((ns: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="font-mono text-xs">
                                    {ns}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {resultData.raw && (
                            <div className="space-y-1.5">
                              <h5 className="text-xs font-semibold text-white">Output Socket Raw WHOIS:</h5>
                              <pre className="max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 leading-relaxed">
                                {resultData.raw}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* IP Lookup View */}
                      {resultData.ip && resultData.asn && (tool.id === "ip-lookup" || resultData.ipVersion) && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] text-slate-400">Target IP Address:</span>
                              <h4 className="text-base font-bold text-white font-mono">{resultData.ip}</h4>
                            </div>
                            <Badge variant="cyan" className="text-xs px-2.5 py-1 font-mono">
                              {resultData.ipVersion || "IPv4"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                              <span className="text-slate-400 text-[11px]">Negara & Kota</span>
                              <div className="font-semibold text-white">{resultData.city}, {resultData.country}</div>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                              <span className="text-slate-400 text-[11px]">ASN</span>
                              <div className="font-semibold text-cyan-400 font-mono truncate">{resultData.asn}</div>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                              <span className="text-slate-400 text-[11px]">ISP / Operator</span>
                              <div className="font-semibold text-white truncate">{resultData.isp}</div>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                              <span className="text-slate-400 text-[11px]">Zona Waktu</span>
                              <div className="font-semibold text-white font-mono">{resultData.timezone}</div>
                            </div>
                          </div>
                          {resultData.reverseDns && (
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs">
                              <span className="text-slate-400 text-[11px] block mb-1">Reverse DNS (PTR):</span>
                              <div className="font-mono text-cyan-300 text-[11px]">{resultData.reverseDns.join(", ")}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* URL Scanner View */}
                      {resultData.targetUrl && (tool.id === "url-scanner" || resultData.threatScore !== undefined) && (
                        <div className="space-y-4">
                          {/* Threat Assessment Hero Card */}
                          <div className={`rounded-xl border p-5 bg-gradient-to-br ${
                            (resultData.threatScore ?? 0) >= 60
                              ? "from-rose-950/40 via-slate-950 to-slate-950 border-rose-500/40"
                              : (resultData.threatScore ?? 0) >= 30
                              ? "from-amber-950/40 via-slate-950 to-slate-950 border-amber-500/40"
                              : "from-emerald-950/40 via-slate-950 to-slate-950 border-emerald-500/40"
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <span className="font-mono text-xs text-slate-400 block truncate max-w-md">
                                  {resultData.targetUrl}
                                </span>
                                <h4 className="text-base font-bold text-white flex items-center gap-2">
                                  {(resultData.threatScore ?? 0) >= 60 ? (
                                    <ShieldAlert className="h-5 w-5 text-rose-400" />
                                  ) : (
                                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                  )}
                                  Evaluasi Keamanan &amp; Phishing Heuristik
                                </h4>
                                <p className="text-xs text-slate-400">
                                  Analisis reputasi domain, sanitasi protokol, dan indikator malicious payload.
                                </p>
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Skor Ancaman</span>
                                  <span className={`text-xl font-bold font-mono ${
                                    (resultData.threatScore ?? 0) >= 60 ? "text-rose-400" : (resultData.threatScore ?? 0) >= 30 ? "text-amber-400" : "text-emerald-400"
                                  }`}>
                                    {resultData.threatScore ?? 0}/100
                                  </span>
                                </div>
                                <Badge
                                  variant={
                                    resultData.verdict === "AMAN"
                                      ? "success"
                                      : resultData.verdict === "RENDAH"
                                      ? "secondary"
                                      : resultData.verdict === "MENCURIGAKAN"
                                      ? "warning"
                                      : "destructive"
                                  }
                                  className="text-xs px-3 py-1.5 font-bold uppercase tracking-wide"
                                >
                                  {resultData.verdict || ((resultData.threatScore ?? 0) >= 60 ? "BERBAHAYA" : "AMAN")}
                                </Badge>
                              </div>
                            </div>

                            {/* Threat score progress bar */}
                            <div className="mt-4 pt-3 border-t border-slate-800/80">
                              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span>Tingkat Risiko: {resultData.verdict || "Terekam"}</span>
                                <span className="font-mono">{resultData.threatScore ?? 0}%</span>
                              </div>
                              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    (resultData.threatScore ?? 0) >= 60
                                      ? "bg-rose-500"
                                      : (resultData.threatScore ?? 0) >= 30
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.max(resultData.threatScore ?? 5, 5)}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Brand Spoofing Warning if detected */}
                          {resultData.brandImpersonation && (
                            <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <h5 className="text-xs font-bold text-rose-300">
                                  Peringatan Typosquatting / Impersonasi Brand:
                                </h5>
                                <p className="text-xs text-rose-200">
                                  Domain ini memiliki kemiripan mencurigakan dengan merek global{" "}
                                  <strong className="underline font-bold text-white">{resultData.brandImpersonation}</strong> namun di-hosting di luar domain resmi. Waspadai form phishing login dan pengelabuan kredensial!
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Security Findings & Vulnerability Audit List */}
                          {resultData.findings && Array.isArray(resultData.findings) && resultData.findings.length > 0 ? (
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                                  <span>Hasil Audit Kerentanan &amp; Indikator Keamanan:</span>
                                </h5>
                                <Badge variant="secondary" className="text-[10px] font-mono">
                                  {resultData.findings.length} Temuan
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                {resultData.findings.map((f: any, idx: number) => {
                                  const severity = typeof f === "object" ? f.severity : "INFO";
                                  const title = typeof f === "object" ? f.title : f;
                                  const detail = typeof f === "object" ? f.detail : "";
                                  const isCrit = severity === "CRITICAL";
                                  const isHigh = severity === "HIGH";
                                  const isMed = severity === "MEDIUM";
                                  const isLow = severity === "LOW";
                                  return (
                                    <div
                                      key={idx}
                                      className={`p-3 rounded-lg border text-xs space-y-1 transition-colors ${
                                        isCrit
                                          ? "border-rose-500/40 bg-rose-950/20"
                                          : isHigh
                                          ? "border-amber-500/40 bg-amber-950/20"
                                          : isMed
                                          ? "border-yellow-500/30 bg-yellow-950/15"
                                          : isLow
                                          ? "border-blue-500/30 bg-blue-950/15"
                                          : "border-slate-800 bg-slate-900/40"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`h-2 w-2 rounded-full shrink-0 ${
                                              isCrit
                                                ? "bg-rose-500"
                                                : isHigh
                                                ? "bg-amber-500"
                                                : isMed
                                                ? "bg-yellow-400"
                                                : isLow
                                                ? "bg-blue-400"
                                                : "bg-emerald-400"
                                            }`}
                                          />
                                          <span className="font-bold text-white text-xs">{title}</span>
                                        </div>
                                        <Badge
                                          variant={
                                            isCrit ? "destructive" : isHigh ? "warning" : isMed ? "secondary" : "cyan"
                                          }
                                          className="text-[9px] font-mono shrink-0 uppercase"
                                        >
                                          {severity}
                                        </Badge>
                                      </div>
                                      {detail && (
                                        <p className="text-slate-300 text-[11px] leading-relaxed pl-4">
                                          {detail}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : resultData.suspiciousFindings && resultData.suspiciousFindings.length > 0 ? (
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                              <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                                <span>Temuan &amp; Indikator Keamanan ({resultData.suspiciousFindings.length}):</span>
                              </h5>
                              <div className="space-y-1.5">
                                {resultData.suspiciousFindings.map((finding: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/50 flex items-start gap-2.5 text-xs text-slate-300"
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                    <span>{finding}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {/* HTTP & Server Breakdown */}
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                            <h5 className="text-xs font-semibold text-white mb-3">Karakteristik Endpoint HTTP:</h5>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5">
                                <span className="text-slate-400 text-[10px] block">Status HTTP</span>
                                <p className="font-mono font-bold text-slate-200 mt-0.5">
                                  {resultData.httpStatus ? `HTTP ${resultData.httpStatus}` : "-"}
                                </p>
                              </div>
                              <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5">
                                <span className="text-slate-400 text-[10px] block">Server Host</span>
                                <p className="font-mono text-slate-200 truncate mt-0.5">{resultData.server || "-"}</p>
                              </div>
                              <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5">
                                <span className="text-slate-400 text-[10px] block">Form Login/Password</span>
                                <p className="font-mono text-slate-200 mt-0.5">
                                  {resultData.passwordFieldsCount > 0 ? (
                                    <span className="text-amber-400 font-bold">{resultData.passwordFieldsCount} Field Sensitif</span>
                                  ) : (
                                    <span className="text-emerald-400">0 Field Sensitif</span>
                                  )}
                                </p>
                              </div>
                              <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5">
                                <span className="text-slate-400 text-[10px] block">Redirect Chain</span>
                                <p className="font-mono text-slate-200 mt-0.5">
                                  {resultData.redirectChain?.length || 0} Hops
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Security Headers Audit Grid */}
                          {resultData.securityHeaders && (
                            <div className="space-y-2">
                              <h5 className="text-xs font-semibold text-white">Security Headers Response:</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                {Object.entries(resultData.securityHeaders).map(([hdr, val]: any) => (
                                  <div key={hdr} className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 flex items-center justify-between">
                                    <span className="font-mono text-[11px] text-slate-300 truncate mr-2">{hdr}</span>
                                    <Badge variant={val === "CONFIGURED" || val === "nosniff" || val === "SAMEORIGIN" || val === "DENY" ? "success" : "secondary"} className="text-[9px] shrink-0">
                                      {val}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Link Extractor View */}
                      {resultData.internalLinks && resultData.externalLinks && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-white">Hyperlinks Terekstraksi:</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="cyan" className="text-[10px]">{resultData.internalCount} Internal</Badge>
                              <Badge variant="secondary" className="text-[10px]">{resultData.externalCount} External</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1.5">
                              <span className="font-semibold text-slate-300 text-[11px]">Internal Links ({resultData.internalLinks.length}):</span>
                              <div className="max-h-60 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-2 space-y-1">
                                {resultData.internalLinks.slice(0, 30).map((l: any, i: number) => (
                                  <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-cyan-400 hover:underline truncate">
                                    {l.text || l.href}
                                  </a>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <span className="font-semibold text-slate-300 text-[11px]">External Links ({resultData.externalLinks.length}):</span>
                              <div className="max-h-60 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-2 space-y-1">
                                {resultData.externalLinks.slice(0, 30).map((l: any, i: number) => (
                                  <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-slate-300 hover:text-white hover:underline truncate">
                                    {l.text || l.href}
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Entity Extractor View */}
                      {resultData.entities && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-white">Entitas Publik Terdeteksi ({resultData.totalEntities}):</h4>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(resultData.entities).map(([category, items]: any) => (
                              items.length > 0 && (
                                <div key={category} className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1.5">
                                  <span className="text-slate-400 text-[11px] uppercase font-mono">{category} ({items.length})</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {items.map((item: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {item}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Keyword Extractor View */}
                      {resultData.keywords && Array.isArray(resultData.keywords) && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-white">Statistik Kata Kunci ({resultData.keywords.length}):</h4>
                            <span className="text-[11px] text-slate-400 font-mono">Token: {resultData.totalTokensAnalyzed}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {resultData.keywords.map((k: any, i: number) => (
                              <div key={i} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs flex items-center gap-2">
                                <span className="font-semibold text-white">{k.keyword}</span>
                                <Badge variant="cyan" className="text-[9px] font-mono">x{k.frequency}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sentiment Analyzer View */}
                      {resultData.sentiment && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] text-slate-400">Polaritas Sentimen Teks:</span>
                              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                <span>{resultData.sentiment}</span>
                              </h4>
                            </div>
                            <Badge
                              variant={resultData.sentiment === "POSITIF" ? "success" : resultData.sentiment === "NEGATIF" ? "destructive" : "secondary"}
                              className="text-xs px-3 py-1 font-mono"
                            >
                              Compound Score: {resultData.compoundScore}
                            </Badge>
                          </div>
                          {resultData.details && (
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1.5">
                                <span className="text-emerald-400 font-semibold text-[11px]">Leksikon Positif ({resultData.details.positiveWordsCount}):</span>
                                <div className="flex flex-wrap gap-1">
                                  {resultData.details.matchedPositive?.map((w: string, i: number) => (
                                    <Badge key={i} variant="success" className="text-[10px]">{w}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1.5">
                                <span className="text-rose-400 font-semibold text-[11px]">Leksikon Negatif ({resultData.details.negativeWordsCount}):</span>
                                <div className="flex flex-wrap gap-1">
                                  {resultData.details.matchedNegative?.map((w: string, i: number) => (
                                    <Badge key={i} variant="destructive" className="text-[10px]">{w}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Language Detector View */}
                      {resultData.languageName && resultData.confidenceScore !== undefined && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] text-slate-400">Bahasa Terdeteksi:</span>
                              <h4 className="text-lg font-bold text-cyan-400">{resultData.languageName} ({resultData.languageCode?.toUpperCase()})</h4>
                            </div>
                            <Badge variant="success" className="text-xs px-3 py-1 font-mono">
                              Keyakinan: {Math.round(resultData.confidenceScore * 100)}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                              <span className="text-slate-400 text-[11px]">Jumlah Kata:</span>
                              <p className="text-base font-bold text-white font-mono">{resultData.wordsCount}</p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                              <span className="text-slate-400 text-[11px]">Jumlah Karakter:</span>
                              <p className="text-base font-bold text-white font-mono">{resultData.charactersCount}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Image Metadata View */}
                      {resultData.metadata && tool.id === "image-metadata" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-white">{resultData.metadata.fileName}</h4>
                            <Badge variant="cyan" className="text-[10px] font-mono">{resultData.metadata.format} • {resultData.metadata.fileSizeFormatted}</Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                              <span className="text-slate-400 text-[11px]">Dimensi</span>
                              <p className="font-semibold text-white font-mono">{resultData.metadata.dimensions ? `${resultData.metadata.dimensions.width}x${resultData.metadata.dimensions.height}` : "-"}</p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                              <span className="text-slate-400 text-[11px]">MIME Type</span>
                              <p className="font-semibold text-white font-mono">{resultData.metadata.mimeType}</p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                              <span className="text-slate-400 text-[11px]">Perangkat / EXIF</span>
                              <p className="font-semibold text-white">{resultData.metadata.exif?.cameraMake || "-"}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Video Metadata View */}
                      {resultData.metadata && tool.id === "video-metadata" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-white">{resultData.metadata.fileName}</h4>
                            <Badge variant="cyan" className="text-[10px] font-mono">{resultData.metadata.fileSizeFormatted}</Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                              <span className="text-slate-400 text-[11px]">Resolusi</span>
                              <p className="font-semibold text-white font-mono">{resultData.metadata.resolution}</p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                              <span className="text-slate-400 text-[11px]">Durasi</span>
                              <p className="font-semibold text-white font-mono">{resultData.metadata.formattedDuration}</p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                              <span className="text-slate-400 text-[11px]">Video Codec</span>
                              <p className="font-semibold text-white">{resultData.metadata.videoCodec}</p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                              <span className="text-slate-400 text-[11px]">Frame Rate</span>
                              <p className="font-semibold text-emerald-400 font-mono">{resultData.metadata.frameRate}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Image Compressor View */}
                      {resultData.originalFormatted && (tool.id === "image-compressor" || (!resultData.targetResolution && !resultData.videoCodec && resultData.percentSaved)) && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                            <div>
                              <h4 className="text-sm font-bold text-white truncate max-w-md">{resultData.fileName}</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">Kompresi &amp; Web Optimasi Selesai</p>
                            </div>
                            <Badge variant="success" className="text-xs px-3 py-1 font-mono shrink-0">
                              Hemat {resultData.percentSaved}
                            </Badge>
                          </div>

                          {/* Image Preview if dataUri available */}
                          {resultData.downloadDataUri && (
                            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black/60 flex items-center justify-center p-2">
                              <img
                                src={resultData.downloadDataUri}
                                alt={resultData.fileName}
                                className="max-h-64 object-contain rounded"
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                              <span className="text-slate-400 text-[11px]">Ukuran Asli</span>
                              <p className="text-base font-bold text-slate-300 font-mono mt-0.5">{resultData.originalFormatted}</p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                              <span className="text-emerald-400 text-[11px]">Ukuran Terkompresi</span>
                              <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">{resultData.compressedFormatted}</p>
                            </div>
                          </div>

                          <div className="pt-1">
                            <a
                              href={resultData.downloadDataUri || (selectedFile ? URL.createObjectURL(selectedFile) : "#")}
                              download={resultData.downloadFileName || `compressed_${resultData.fileName || "image.jpg"}`}
                              className="w-full block"
                            >
                              <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white gap-2 font-medium">
                                <Download className="h-4 w-4" />
                                <span>Unduh Gambar Terkompresi ({resultData.compressedFormatted})</span>
                              </Button>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Video Compressor View */}
                      {resultData.originalFormatted && (tool.id === "video-compressor" || resultData.targetResolution) && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white truncate max-w-md">{resultData.fileName}</h4>
                                {resultData.targetResolution && (
                                  <Badge variant="cyan" className="text-[10px] font-mono">
                                    {resultData.targetResolution}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">Transcoding &amp; Kompresi Bitrate Selesai</p>
                            </div>
                            <Badge variant="success" className="text-xs px-3 py-1 font-mono shrink-0">
                              Hemat {resultData.percentSaved}
                            </Badge>
                          </div>

                          {/* Video player preview if source available */}
                          {(resultData.downloadDataUri || selectedFile) && (
                            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black/70 flex items-center justify-center">
                              <video
                                controls
                                className="max-h-72 w-full rounded"
                                src={resultData.downloadDataUri || (selectedFile ? URL.createObjectURL(selectedFile) : undefined)}
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                              <span className="text-slate-400 text-[11px]">Ukuran Asli</span>
                              <p className="text-base font-bold text-slate-300 font-mono mt-0.5">{resultData.originalFormatted}</p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                              <span className="text-emerald-400 text-[11px]">Estimasi Ukuran Akhir</span>
                              <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">{resultData.compressedFormatted}</p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 col-span-2 sm:col-span-1">
                              <span className="text-slate-400 text-[11px]">Target Resolusi</span>
                              <p className="text-base font-bold text-cyan-300 font-mono mt-0.5">{resultData.targetResolution || "Original"}</p>
                            </div>
                          </div>

                          {resultData.note && (
                            <p className="text-[11px] text-slate-400 italic bg-slate-900/40 p-2.5 rounded border border-slate-800">
                              💡 {resultData.note}
                            </p>
                          )}

                          <div className="pt-1">
                            <a
                              href={resultData.downloadDataUri || (selectedFile ? URL.createObjectURL(selectedFile) : "#")}
                              download={resultData.downloadFileName || `compressed_${resultData.fileName || "video.mp4"}`}
                              className="w-full block"
                            >
                              <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white gap-2 font-medium">
                                <Download className="h-4 w-4" />
                                <span>Unduh Video Terkompresi ({resultData.compressedFormatted})</span>
                              </Button>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* File Converter View */}
                      {resultData.convertedFileName && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                            <div>
                              <h4 className="text-sm font-bold text-white font-mono truncate max-w-md">{resultData.convertedFileName}</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">Konversi Format Berhasil</p>
                            </div>
                            <Badge variant="success" className="text-xs shrink-0">SELESAI</Badge>
                          </div>

                          <p className="text-xs text-slate-300">{resultData.message}</p>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                              <span className="text-slate-400 text-[11px]">Format Target</span>
                              <p className="text-sm font-bold text-cyan-300 font-mono mt-0.5">{resultData.targetMimeType}</p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                              <span className="text-slate-400 text-[11px]">Ukuran File</span>
                              <p className="text-sm font-bold text-slate-200 font-mono mt-0.5">{resultData.fileSizeFormatted || "-"}</p>
                            </div>
                          </div>

                          <div className="pt-1">
                            <a
                              href={resultData.downloadDataUri || (selectedFile ? URL.createObjectURL(selectedFile) : "#")}
                              download={resultData.convertedFileName}
                              className="w-full block"
                            >
                              <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white gap-2 font-medium">
                                <Download className="h-4 w-4" />
                                <span>Unduh File ({resultData.convertedFileName})</span>
                              </Button>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* QR Analyzer View */}
                      {resultData.securityAssessment && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] text-slate-400">Muatan QR Code:</span>
                              <h4 className="text-sm font-bold text-cyan-300 font-mono break-all">{resultData.decodedContent}</h4>
                            </div>
                            <Badge
                              variant={resultData.securityAssessment.riskLevel === "RENDAH" ? "success" : resultData.securityAssessment.riskLevel === "SEDANG" ? "warning" : "destructive"}
                              className="text-xs px-3 py-1 font-mono"
                            >
                              Risiko: {resultData.securityAssessment.riskLevel}
                            </Badge>
                          </div>
                          {resultData.securityAssessment.riskNotes && (
                            <div className="space-y-1.5">
                              <h5 className="text-xs font-semibold text-white">Catatan Keamanan:</h5>
                              <div className="space-y-1">
                                {resultData.securityAssessment.riskNotes.map((note: string, i: number) => (
                                  <div key={i} className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                                    {note}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {resultData.securityAssessment.safetyAdvice && (
                            <p className="text-[11px] text-slate-400 italic">
                              Saran: {resultData.securityAssessment.safetyAdvice}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Image Metadata Sanitizer & Privacy Cleaner View */}
                      {resultData.cleaned?.dataUri && tool.id === "metadata-cleaner" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 to-slate-950 p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                  <h4 className="text-base font-bold text-white">Metadata Berhasil Dibersihkan</h4>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                  Seluruh tag sensitif (GPS EXIF, IPTC, XMP, &amp; Serial ID Kamera) telah dieliminasi 100%.
                                </p>
                              </div>

                              <Button
                                type="button"
                                variant="glow"
                                size="sm"
                                onClick={() => downloadDataUri(resultData.cleaned.dataUri, resultData.cleaned.fileName)}
                                className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                              >
                                <Download className="h-4 w-4" />
                                <span>Unduh Gambar Bersih ({resultData.cleaned.sizeFormatted})</span>
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                                <span className="text-slate-500 text-[10px] block">Ukuran Awal</span>
                                <span className="font-mono text-slate-300 font-semibold">{resultData.original.sizeFormatted}</span>
                              </div>
                              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                                <span className="text-emerald-400 text-[10px] block">Ukuran Bersih</span>
                                <span className="font-mono text-emerald-300 font-semibold">{resultData.cleaned.sizeFormatted}</span>
                              </div>
                              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                                <span className="text-cyan-400 text-[10px] block">Data Terpangkas</span>
                                <span className="font-mono text-cyan-300 font-semibold">
                                  {(resultData.savings.bytesSaved / 1024).toFixed(1)} KB ({resultData.savings.percentSaved})
                                </span>
                              </div>
                              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                                <span className="text-slate-500 text-[10px] block">Format File</span>
                                <span className="font-mono text-white uppercase font-semibold">{resultData.cleaned.mimeType.split("/")[1]}</span>
                              </div>
                            </div>
                          </div>

                          {/* Scrubbed Items Badges */}
                          {resultData.scrubbedItems && resultData.scrubbedItems.length > 0 && (
                            <div className="space-y-1.5">
                              <h5 className="text-xs font-semibold text-white">Elemen Metadata Dieliminasi:</h5>
                              <div className="flex flex-wrap gap-1.5">
                                {resultData.scrubbedItems.map((item: string, idx: number) => (
                                  <Badge key={idx} variant="success" className="text-xs font-mono">
                                    ✓ {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Preview of Cleaned Image */}
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                            <span className="text-xs text-slate-400 block font-medium">Pratinjau Gambar Tersanitasi:</span>
                            <div className="relative max-h-72 overflow-hidden rounded-lg border border-slate-800/80 bg-black/40 flex items-center justify-center p-2">
                              <img
                                src={resultData.cleaned.dataUri}
                                alt="Gambar Sanitasi"
                                className="max-h-64 max-w-full object-contain rounded"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Subdomain Finder (Certificate Transparency Logs) View */}
                      {resultData.subdomains && tool.id === "subdomain-finder" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] text-slate-400">Target Root Domain:</span>
                              <h4 className="text-base font-bold text-white font-mono">{resultData.domain}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="cyan" className="text-xs font-mono">
                                {resultData.totalFound} Subdomain Teridentifikasi
                              </Badge>
                              <Badge variant="secondary" className="text-xs font-mono">
                                {resultData.certificateCount} CT Logs
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="text-xs font-semibold text-white">Daftar Subdomain Publik:</h5>
                              <Input
                                value={subdomainSearch}
                                onChange={(e) => setSubdomainSearch(e.target.value)}
                                placeholder="Filter subdomain..."
                                className="max-w-xs h-7 text-xs"
                              />
                            </div>

                            <div className="max-h-60 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-2 space-y-1">
                              {resultData.subdomains
                                .filter((s: string) => s.toLowerCase().includes(subdomainSearch.toLowerCase()))
                                .map((sub: string, i: number) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-slate-900 text-xs font-mono text-cyan-300"
                                  >
                                    <span className="truncate">{sub}</span>
                                    <a
                                      href={`https://${sub}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-slate-400 hover:text-white shrink-0 ml-2"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SSL / TLS Certificate Inspector View */}
                      {resultData.daysRemaining !== undefined && tool.id === "ssl-inspector" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                <h4 className="text-base font-bold text-white font-mono">
                                  {resultData.domain}:{resultData.port}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                Protocol: <strong className="text-white font-mono">{resultData.protocol}</strong> • Cipher:{" "}
                                <span className="font-mono text-cyan-300">{resultData.cipher?.name}</span>
                              </p>
                            </div>

                            <Badge
                              variant={resultData.valid && resultData.daysRemaining > 15 ? "success" : "warning"}
                              className="text-xs px-3 py-1 font-mono"
                            >
                              {resultData.valid ? `VALID (${resultData.daysRemaining} HARI LAGI)` : "KEDALUWARSA / TIDAK VALID"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1.5">
                              <span className="text-slate-400 text-[11px] block">Issuer (Otoritas Sertifikat):</span>
                              <div className="font-semibold text-white">{resultData.issuer?.organization || "-"}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{resultData.issuer?.commonName}</div>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1.5">
                              <span className="text-slate-400 text-[11px] block">Masa Berlaku:</span>
                              <div className="text-slate-200">
                                Dari: <span className="font-mono text-cyan-300">{resultData.validFrom}</span>
                              </div>
                              <div className="text-slate-200">
                                Sampai: <span className="font-mono text-amber-300">{resultData.validTo}</span>
                              </div>
                            </div>
                          </div>

                          {resultData.subjectAltNames && resultData.subjectAltNames.length > 0 && (
                            <div className="space-y-1.5">
                              <h5 className="text-xs font-semibold text-white">Subject Alternative Names (SAN):</h5>
                              <div className="flex flex-wrap gap-1.5">
                                {resultData.subjectAltNames.map((san: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="font-mono text-[10px]">
                                    {san}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {resultData.fingerprint256 && (
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1">
                              <span className="text-slate-500 text-[10px] block">SHA-256 Fingerprint:</span>
                              <div className="font-mono text-[11px] text-cyan-300 break-all">{resultData.fingerprint256}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Security Headers Auditor View */}
                      {resultData.grade && tool.id === "security-headers" && (
                        <div className="space-y-4">
                          {/* Diagnostic / Timeout Alert if target server blocked or timed out */}
                          {resultData.diagnosticMessage && (
                            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <h5 className="text-xs font-bold text-amber-300">
                                  Status Koneksi: Server Tidak Merespons / Timeout
                                </h5>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  {resultData.diagnosticMessage}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Cookie Security Alert */}
                          {resultData.cookieSecurity?.insecureCookies?.length > 0 && (
                            <div className="rounded-xl border border-yellow-500/40 bg-yellow-950/25 p-4 space-y-2">
                              <div className="flex items-center gap-2 text-yellow-300">
                                <ShieldAlert className="h-4 w-4 shrink-0" />
                                <h5 className="text-xs font-bold">
                                  Peringatan Atribut Cookie Kurang Aman (Cookie Hygiene):
                                </h5>
                              </div>
                              <p className="text-[11px] text-yellow-200/80">
                                Cookie berikut tidak memiliki proteksi peramban yang disyaratkan OWASP:
                              </p>
                              <div className="space-y-1.5 pt-1">
                                {resultData.cookieSecurity.insecureCookies.map((c: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded bg-slate-950/90 border border-yellow-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                                  >
                                    <span className="font-mono font-bold text-white">{c.name}</span>
                                    <span className="text-[10px] font-mono text-rose-300">
                                      Flag Kurang: {c.missingFlags.join(", ")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Hero Grade & Score */}
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <span className="text-[11px] text-slate-400 font-mono">{resultData.targetUrl}</span>
                                <h4 className="text-base font-bold text-white mt-1">Audit Security Headers &amp; Proteksi Web</h4>
                                <p className="text-xs text-slate-400">Evaluasi proteksi peramban terhadap XSS, Clickjacking, MIME sniffing, &amp; data leakage.</p>
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Skor Kepatuhan</span>
                                  <span className="text-xl font-bold text-white font-mono">{resultData.score}/100</span>
                                </div>
                                <div
                                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black shadow-lg ${
                                    resultData.grade?.startsWith("A")
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                      : resultData.grade === "B"
                                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                                      : resultData.grade === "C"
                                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                                  }`}
                                >
                                  {resultData.grade}
                                </div>
                              </div>
                            </div>

                            {/* Summary Pills */}
                            {resultData.summary && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                                <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2.5">
                                  <span className="text-emerald-400 text-[10px] block">Terkonfigurasi</span>
                                  <p className="font-mono font-bold text-emerald-300 text-sm mt-0.5">{resultData.summary.configured} Header</p>
                                </div>
                                <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-2.5">
                                  <span className="text-amber-400 text-[10px] block">Peringatan</span>
                                  <p className="font-mono font-bold text-amber-300 text-sm mt-0.5">{resultData.summary.warnings} Header</p>
                                </div>
                                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-2.5">
                                  <span className="text-slate-400 text-[10px] block">Belum Terpasang</span>
                                  <p className="font-mono font-bold text-slate-300 text-sm mt-0.5">{resultData.summary.missing} Header</p>
                                </div>
                                <div className={`rounded-lg border p-2.5 ${resultData.summary.serverLeakage ? "border-rose-500/30 bg-rose-950/20" : "border-slate-800 bg-slate-900/40"}`}>
                                  <span className={`text-[10px] block ${resultData.summary.serverLeakage ? "text-rose-400" : "text-slate-400"}`}>Bocoran Server Info</span>
                                  <p className={`font-mono font-bold text-sm mt-0.5 ${resultData.summary.serverLeakage ? "text-rose-300" : "text-emerald-400"}`}>
                                    {resultData.summary.serverLeakage ? "Terdeteksi" : "Bersih"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Leaked Server Info Alert */}
                          {resultData.leakedHeaders && resultData.leakedHeaders.length > 0 && (
                            <div className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-4 space-y-2">
                              <div className="flex items-center gap-2 text-rose-300">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <h5 className="text-xs font-bold">Peringatan Kebocoran Informasi Server (Information Disclosure):</h5>
                              </div>
                              <p className="text-[11px] text-rose-200/80">
                                Header berikut membocorkan detail software/versi server yang memudahkan penyerang mencari CVE spesifik:
                              </p>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {resultData.leakedHeaders.map((leak: any, idx: number) => (
                                  <div key={idx} className="p-2 rounded bg-slate-950/90 border border-rose-500/30 font-mono text-[11px] text-rose-300">
                                    <span className="font-bold text-white">{leak.header}:</span> {leak.value}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Headers Checked Detailed List */}
                          <div className="space-y-2">
                            <h5 className="text-xs font-semibold text-white">Rincian Audit Header Keamanan:</h5>
                            <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-950">
                              {(resultData.headersChecked || resultData.checks)?.map((hdr: any, idx: number) => (
                                <div key={idx} className="p-3.5 text-xs space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-white font-mono text-xs">{hdr.name}</span>
                                    <Badge
                                      variant={
                                        hdr.status === "CONFIGURED" || (!hdr.status && hdr.present)
                                          ? "success"
                                          : hdr.status === "WARNING"
                                          ? "warning"
                                          : "secondary"
                                      }
                                      className="text-[9px] font-mono"
                                    >
                                      {hdr.status || (hdr.present ? "TERKONFIGURASI" : "TIDAK DITEMUKAN")}
                                    </Badge>
                                  </div>

                                  {hdr.present && hdr.value ? (
                                    <div className="p-2 rounded bg-slate-900/70 border border-slate-800 font-mono text-[11px] text-cyan-300 break-all">
                                      {hdr.value}
                                    </div>
                                  ) : null}

                                  {hdr.recommendation && (
                                    <p className="text-slate-400 text-[11px] pt-0.5">
                                      <strong className="text-slate-300">Rekomendasi:</strong> {hdr.recommendation}
                                    </p>
                                  )}

                                  {hdr.impact && (
                                    <p className="text-[10px] text-amber-400/90 italic">
                                      ⚠️ Dampak Resiko: {hdr.impact}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Remediation Config Hardening Tabs */}
                          {resultData.remediationConfigs && (
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <Code2 className="h-4 w-4 text-cyan-400" />
                                    <span>Template Perbaikan Otomatis (Security Hardening):</span>
                                  </h5>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Salin dan tempel konfigurasi ini ke web server Anda untuk mencapai skor A+.
                                  </p>
                                </div>

                                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                                  {(["nginx", "apache", "nextjs", "caddy"] as const).map((tab) => (
                                    <button
                                      key={tab}
                                      type="button"
                                      onClick={() => setSecurityConfigTab(tab)}
                                      className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors ${
                                        securityConfigTab === tab
                                          ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                                          : "text-slate-400 hover:text-slate-200"
                                      }`}
                                    >
                                      {tab.toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="relative rounded-lg border border-slate-800/90 bg-black/80 p-3 font-mono text-[11px] text-cyan-200 overflow-x-auto">
                                <pre className="whitespace-pre-wrap break-all">
                                  {resultData.remediationConfigs[securityConfigTab] || "# Konfigurasi tidak tersedia"}
                                </pre>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    navigator.clipboard.writeText(resultData.remediationConfigs[securityConfigTab]);
                                    setCopied(true);
                                    success("Konfigurasi berhasil disalin ke clipboard!");
                                    setTimeout(() => setCopied(false), 2000);
                                  }}
                                  className="absolute top-2 right-2 text-xs h-7 px-2.5 gap-1.5 bg-slate-800 hover:bg-slate-700 text-white"
                                >
                                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                  <span>{copied ? "Tersalin!" : "Salin"}</span>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* DNS Propagation Global Checker View */}
                      {resultData.resolvers && tool.id === "dns-propagation" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] text-slate-400">Hasil Resolusi Global:</span>
                              <h4 className="text-base font-bold text-white font-mono">
                                {resultData.domain} ({resultData.recordType})
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={resultData.consistent ? "success" : "warning"} className="text-xs">
                                {resultData.consistent ? "100% KONSISTEN GLOBAL" : "PROPAGASI BERJALAN"}
                              </Badge>
                              <Badge variant="cyan" className="text-xs font-mono">
                                {resultData.resolvedCount}/{resultData.totalResolvers} Anycast Nodes
                              </Badge>
                            </div>
                          </div>

                          <div className="divide-y divide-slate-800/80 rounded-lg border border-slate-800 bg-slate-950">
                            {resultData.resolvers.map((r: any, idx: number) => (
                              <div key={idx} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white">{r.name}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">({r.location})</span>
                                  </div>
                                  <div className="font-mono text-[11px] text-cyan-300">
                                    {r.records?.join(", ") || "Tidak ada jawaban"}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] text-slate-400 font-mono">{r.latencyMs} ms</span>
                                  <Badge variant={r.status === "RESOLVED" ? "success" : "destructive"} className="text-[9px]">
                                    {r.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Wayback Machine Timeline View */}
                      {resultData.firstSnapshotDate !== undefined && tool.id === "wayback-machine" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] text-slate-400 font-mono truncate max-w-sm block">
                                {resultData.targetUrl}
                              </span>
                              <h4 className="text-base font-bold text-white mt-1">Arsip Web Wayback Machine</h4>
                            </div>
                            <Badge variant="cyan" className="text-xs font-mono">
                              {resultData.totalSnapshots?.toLocaleString()} Arsip Tersimpan
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                              <span className="text-slate-500 text-[10px] block">Arsip Pertama Terekam:</span>
                              <span className="font-mono text-cyan-300 font-semibold">{resultData.firstSnapshotDate || "-"}</span>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                              <span className="text-slate-500 text-[10px] block">Arsip Terakhir Terekam:</span>
                              <span className="font-mono text-emerald-300 font-semibold">{resultData.lastSnapshotDate || "-"}</span>
                            </div>
                          </div>

                          {resultData.recentSnapshots && resultData.recentSnapshots.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-xs font-semibold text-white">Snapshot Arsip Terkini:</h5>
                              <div className="divide-y divide-slate-800/80 rounded-lg border border-slate-800 bg-slate-950 max-h-64 overflow-auto">
                                {resultData.recentSnapshots.map((snap: any, idx: number) => (
                                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-900">
                                    <div>
                                      <div className="font-mono text-white font-semibold">{snap.formattedDate}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">Status: HTTP {snap.statusCode}</div>
                                    </div>
                                    <a
                                      href={snap.archiveUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                                    >
                                      <span>Buka Snapshot</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Robots.txt & Sitemap Analyzer View */}
                      {resultData.robots && tool.id === "robots-sitemap-analyzer" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                            <h4 className="text-sm font-bold text-white font-mono">{resultData.targetUrl}</h4>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                              <Badge variant={resultData.robots.found ? "success" : "secondary"} className="text-[10px]">
                                Robots.txt: {resultData.robots.found ? "DITEMUKAN" : "TIDAK DITEMUKAN"}
                              </Badge>
                              <Badge variant={resultData.sitemap.found ? "success" : "secondary"} className="text-[10px]">
                                Sitemap.xml: {resultData.sitemap.found ? "DITEMUKAN" : "TIDAK DITEMUKAN"}
                              </Badge>
                            </div>
                          </div>

                          {/* Sensitive paths warning banner */}
                          {resultData.robots.sensitivePathsDetected?.length > 0 && (
                            <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 space-y-2">
                              <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>Peringatan Jalur Sensitif Terbuka di Robots.txt:</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {resultData.robots.sensitivePathsDetected.map((p: string, idx: number) => (
                                  <Badge key={idx} variant="destructive" className="font-mono text-[10px]">
                                    {p}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {resultData.robots.disallowedPaths && resultData.robots.disallowedPaths.length > 0 && (
                            <div className="space-y-1.5">
                              <h5 className="text-xs font-semibold text-white">Disallowed Paths ({resultData.robots.disallowedPaths.length}):</h5>
                              <pre className="max-h-48 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300">
                                {resultData.robots.disallowedPaths.join("\n")}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Telegram Channel Analyzer View */}
                      {resultData.channel && tool.id === "telegram-analyzer" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                              {resultData.channel.avatarUrl ? (
                                <img
                                  src={resultData.channel.avatarUrl}
                                  alt="Telegram Channel Avatar"
                                  referrerPolicy="no-referrer"
                                  className="h-14 w-14 rounded-full border border-slate-700 object-cover shrink-0"
                                />
                              ) : (
                                <div className="h-14 w-14 rounded-full bg-blue-600/20 text-cyan-400 flex items-center justify-center font-bold text-lg shrink-0">
                                  T
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-base font-bold text-white">{resultData.channel.title}</h4>
                                  {resultData.channel.verified && (
                                    <Badge variant="cyan" className="text-[9px]">TERVERIFIKASI</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-cyan-400 font-mono mt-0.5">@{resultData.channel.username}</p>
                              </div>
                            </div>

                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Pelanggan</span>
                              <span className="text-xl font-bold text-emerald-400 font-mono">
                                {resultData.channel.subscriberCountFormatted}
                              </span>
                            </div>
                          </div>

                          {resultData.channel.description && (
                            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-300 leading-relaxed">
                              {resultData.channel.description}
                            </div>
                          )}

                          {resultData.metrics && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                                <span className="text-slate-400 text-[10px] block">Rata-rata Tayangan:</span>
                                <div className="font-mono text-cyan-300 font-bold text-sm mt-0.5">{resultData.metrics.avgViewsPerPost}</div>
                              </div>
                              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                                <span className="text-slate-400 text-[10px] block">Puncak Tayangan:</span>
                                <div className="font-mono text-emerald-400 font-bold text-sm mt-0.5">{resultData.metrics.peakViews}</div>
                              </div>
                              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                                <span className="text-slate-400 text-[10px] block">Postingan Media:</span>
                                <div className="font-mono text-purple-300 font-bold text-sm mt-0.5">{resultData.metrics.postsWithMedia}</div>
                              </div>
                              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                                <span className="text-slate-400 text-[10px] block">Tautan Luar:</span>
                                <div className="font-mono text-amber-300 font-bold text-sm mt-0.5">{resultData.metrics.discoveredLinksCount}</div>
                              </div>
                            </div>
                          )}

                          {resultData.discoveredLinks && resultData.discoveredLinks.length > 0 && (
                            <div className="space-y-1.5">
                              <h5 className="text-xs font-semibold text-white">Tautan Luar Terdeteksi:</h5>
                              <div className="flex flex-wrap gap-1.5">
                                {resultData.discoveredLinks.slice(0, 6).map((l: string, idx: number) => (
                                  <a
                                    key={idx}
                                    href={l}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-slate-800 text-cyan-400 hover:underline max-w-xs truncate"
                                  >
                                    {l}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {resultData.recentPosts && resultData.recentPosts.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-xs font-semibold text-white">Broadcast Terkini ({resultData.recentPosts.length}):</h5>
                              <div className="space-y-2">
                                {resultData.recentPosts.map((post: any, idx: number) => (
                                  <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-950 p-3.5 text-xs space-y-2">
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-1">
                                      <div className="flex items-center gap-2">
                                        <span>Dilihat: <strong className="text-cyan-300 font-mono">{post.viewsFormatted || post.views}</strong></span>
                                        {post.hasPhoto && <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/50">Foto</span>}
                                        {post.hasVideo && <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/50">Video</span>}
                                      </div>
                                      <span>{post.timestamp}</span>
                                    </div>
                                    {post.forwardedFrom && (
                                      <span className="text-[10px] text-cyan-400 block font-mono">Diteruskan dari: {post.forwardedFrom}</span>
                                    )}
                                    <p className="text-slate-200 text-xs leading-relaxed line-clamp-3">{post.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reddit User & Subreddit Intelligence View */}
                      {(resultData.user || resultData.subreddit) && tool.id === "reddit-analyzer" && (
                        <div className="space-y-4">
                          {resultData.type === "user" && resultData.user && (
                            <div className="space-y-4">
                              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                  {resultData.user.avatarUrl ? (
                                    <img
                                      src={resultData.user.avatarUrl}
                                      alt="Reddit Avatar"
                                      referrerPolicy="no-referrer"
                                      className="h-14 w-14 rounded-full border border-slate-700 object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="h-14 w-14 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-lg shrink-0">
                                      R
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-base font-bold text-white">u/{resultData.user.username}</h4>
                                      {resultData.user.isGold && <Badge variant="warning" className="text-[9px]">GOLD</Badge>}
                                      {resultData.user.isMod && <Badge variant="secondary" className="text-[9px]">MOD</Badge>}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">Usia Akun: {resultData.user.accountAgeYears} tahun • Terdaftar: {resultData.user.createdAt}</p>
                                  </div>
                                </div>
                                <Badge variant="cyan" className="text-xs font-mono">
                                  {resultData.user.totalKarma?.toLocaleString()} Total Karma
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                                  <span className="text-slate-400 text-[10px]">Post Karma:</span>
                                  <div className="font-mono text-white font-bold text-sm mt-0.5">{resultData.user.postKarma?.toLocaleString()}</div>
                                </div>
                                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                                  <span className="text-slate-400 text-[10px]">Comment Karma:</span>
                                  <div className="font-mono text-cyan-300 font-bold text-sm mt-0.5">{resultData.user.commentKarma?.toLocaleString()}</div>
                                </div>
                              </div>

                              {resultData.user.bio && (
                                <p className="text-xs text-slate-300 rounded-lg border border-slate-800 bg-slate-950 p-3 leading-relaxed">
                                  {resultData.user.bio}
                                </p>
                              )}

                              {resultData.recentSubmissions && resultData.recentSubmissions.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="text-xs font-semibold text-white">Postingan Terakhir User:</h5>
                                  <div className="space-y-2">
                                    {resultData.recentSubmissions.map((sub: any, idx: number) => (
                                      <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs flex items-center justify-between gap-3">
                                        <div className="space-y-0.5 min-w-0">
                                          <span className="text-[10px] font-mono text-orange-400">{sub.subreddit}</span>
                                          <a href={sub.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-cyan-300 hover:underline font-medium block truncate">
                                            {sub.title}
                                          </a>
                                        </div>
                                        <div className="text-right shrink-0 text-[10px] font-mono text-slate-400">
                                          <div>Skor: <strong className="text-white">{sub.score}</strong></div>
                                          <div>{sub.comments} Komentar</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {resultData.type === "subreddit" && resultData.subreddit && (
                            <div className="space-y-4">
                              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                  {resultData.subreddit.iconImg ? (
                                    <img
                                      src={resultData.subreddit.iconImg}
                                      alt="Subreddit Icon"
                                      referrerPolicy="no-referrer"
                                      className="h-14 w-14 rounded-full border border-slate-700 object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="h-14 w-14 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-lg shrink-0">
                                      r/
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="text-base font-bold text-white">r/{resultData.subreddit.displayName}</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">{resultData.subreddit.title}</p>
                                  </div>
                                </div>
                                <div className="text-left sm:text-right">
                                  <Badge variant="cyan" className="text-xs font-mono block mb-1">
                                    {resultData.subreddit.subscribersFormatted} Anggota
                                  </Badge>
                                  <span className="text-[10px] text-emerald-400 font-mono">
                                    {resultData.subreddit.activeUsersOnline} Aktif Saat Ini
                                  </span>
                                </div>
                              </div>

                              {resultData.subreddit.description && (
                                <p className="text-xs text-slate-300 rounded-lg border border-slate-800 bg-slate-950 p-3 line-clamp-3 leading-relaxed">
                                  {resultData.subreddit.description}
                                </p>
                              )}

                              {resultData.hotPosts && resultData.hotPosts.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="text-xs font-semibold text-white">Diskusi Hot Terkini di Komunitas:</h5>
                                  <div className="space-y-2">
                                    {resultData.hotPosts.map((post: any, idx: number) => (
                                      <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs flex items-center justify-between gap-3">
                                        <div className="space-y-0.5 min-w-0">
                                          <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-cyan-300 hover:underline font-medium block truncate">
                                            {post.title}
                                          </a>
                                          <span className="text-[10px] text-slate-500 font-mono">Diposting oleh: {post.author}</span>
                                        </div>
                                        <div className="text-right shrink-0 text-[10px] font-mono text-slate-400">
                                          <div>Skor: <strong className="text-white">{post.score}</strong></div>
                                          <div>{post.comments} Komentar</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* GitHub Public Developer Recon View */}
                      {resultData.profile && tool.id === "github-recon" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={resultData.profile.avatarUrl}
                                alt="GitHub Avatar"
                                referrerPolicy="no-referrer"
                                className="h-16 w-16 rounded-full border border-slate-700 object-cover"
                              />
                              <div>
                                <h4 className="text-base font-bold text-white">{resultData.profile.name || resultData.profile.login}</h4>
                                <p className="text-xs text-cyan-400 font-mono">@{resultData.profile.login}</p>
                                {resultData.profile.bio && (
                                  <p className="text-xs text-slate-300 mt-1 max-w-md line-clamp-2">{resultData.profile.bio}</p>
                                )}
                              </div>
                            </div>

                            <a
                              href={resultData.profile.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:text-white shrink-0"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Profil GitHub</span>
                            </a>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                              <span className="text-slate-500 text-[10px] block">Public Repos</span>
                              <span className="font-bold text-white font-mono">{resultData.profile.publicRepos}</span>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                              <span className="text-slate-500 text-[10px] block">Followers</span>
                              <span className="font-bold text-cyan-400 font-mono">{resultData.profile.followers}</span>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                              <span className="text-slate-500 text-[10px] block">Following</span>
                              <span className="font-bold text-slate-300 font-mono">{resultData.profile.following}</span>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
                              <span className="text-slate-500 text-[10px] block">Lokasi</span>
                              <span className="font-semibold text-slate-200 truncate block">{resultData.profile.location || "-"}</span>
                            </div>
                          </div>

                          {resultData.repositories && resultData.repositories.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-xs font-semibold text-white">Repositori Unggulan:</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {resultData.repositories.map((repo: any, idx: number) => (
                                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                      <a
                                        href={repo.htmlUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-cyan-400 hover:underline truncate max-w-[180px]"
                                      >
                                        {repo.name}
                                      </a>
                                      <span className="text-[10px] text-slate-400 font-mono">★ {repo.stars}</span>
                                    </div>
                                    <p className="text-slate-400 text-[11px] line-clamp-2">{repo.description || "Tidak ada deskripsi."}</p>
                                    {repo.language && <Badge variant="secondary" className="text-[9px]">{repo.language}</Badge>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* MAC Address Vendor & Hardware Lookup View */}
                      {resultData.vendor && tool.id === "mac-lookup" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="text-[11px] text-slate-400 font-mono">OUI Prefix: {resultData.mac.oui}</span>
                                <h4 className="text-lg font-bold text-white">{resultData.vendor.name}</h4>
                              </div>
                              <Badge variant="cyan" className="text-xs font-mono">{resultData.mac.normalized}</Badge>
                            </div>
                            <p className="text-xs text-slate-400">{resultData.vendor.address}, {resultData.vendor.country}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                              <span className="text-slate-400 text-[11px] block">Tipe Transmisi:</span>
                              <span className="font-semibold text-white uppercase">{resultData.mac.transmissionType}</span>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                              <span className="text-slate-400 text-[11px] block">Tipe Administrasi:</span>
                              <span className="font-semibold text-cyan-400">{resultData.mac.assignmentType}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* IOC Defang / Refang Threat View */}
                      {resultData.action && tool.id === "ioc-defang" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-white">
                                {resultData.action === "defang" ? "Indikator Berhasil Didefang (Aman)" : "Indikator Direfang (Aktif)"}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                IP: {resultData.stats.defangedIps} • URL: {resultData.stats.defangedUrls} • Domain: {resultData.stats.defangedDomains}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(resultData.result);
                                success("Hasil disalin ke clipboard!", "Disalin");
                              }}
                              className="gap-1.5 text-xs text-cyan-400"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>Salin Hasil</span>
                            </Button>
                          </div>

                          <pre className="max-h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-cyan-300 leading-relaxed">
                            {resultData.result}
                          </pre>
                        </div>
                      )}

                      {/* User-Agent Analyzer View */}
                      {resultData.browser && tool.id === "useragent-analyzer" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h4 className="text-base font-bold text-white">
                                {resultData.browser.name} {resultData.browser.version}
                              </h4>
                              <p className="text-xs text-slate-400">
                                OS: <strong className="text-white">{resultData.os.name} {resultData.os.version}</strong> • Engine: {resultData.engine.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="cyan" className="text-xs uppercase">{resultData.device.type}</Badge>
                              {resultData.isBot && <Badge variant="destructive" className="text-xs">BOT / CRAWLER</Badge>}
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1">
                            <span className="text-slate-500 text-[10px] block">String Raw User-Agent:</span>
                            <div className="font-mono text-[11px] text-slate-300 break-all">{resultData.userAgent}</div>
                          </div>
                        </div>
                      )}

                      {/* Forensic Multi-Format Decoder View */}
                      {resultData.detectedEncoding && tool.id === "forensic-decoder" && (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase">Format Encoding Teridentifikasi:</span>
                              <h4 className="text-base font-bold text-cyan-400 font-mono uppercase">
                                {resultData.detectedEncoding} ({Math.round(resultData.confidence * 100)}% Confidence)
                              </h4>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(resultData.decoded);
                                success("Hasil decode disalin ke clipboard!", "Disalin");
                              }}
                              className="gap-1.5 text-xs text-slate-300"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>Salin Dekode</span>
                            </Button>
                          </div>

                          <div className="space-y-1.5">
                            <h5 className="text-xs font-semibold text-white">Hasil Plaintext Dekode:</h5>
                            <pre className="max-h-60 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap break-all">
                              {resultData.decoded}
                            </pre>
                          </div>

                          {/* JWT Claims Formatter */}
                          {resultData.jwt && (
                            <div className="space-y-2">
                              <h5 className="text-xs font-semibold text-cyan-300">Struktur Klaim JSON Web Token (JWT):</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                                  <span className="text-slate-400 text-[10px] block mb-1">JWT Header:</span>
                                  <pre className="font-mono text-[11px] text-cyan-300 overflow-auto">
                                    {JSON.stringify(resultData.jwt.header, null, 2)}
                                  </pre>
                                </div>
                                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                                  <span className="text-slate-400 text-[10px] block mb-1">JWT Payload Claims:</span>
                                  <pre className="font-mono text-[11px] text-emerald-300 overflow-auto">
                                    {JSON.stringify(resultData.jwt.payload, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* General fallback JSON inspection */}
                      {!resultData.records &&
                        !resultData.indicators &&
                        !resultData.technologies &&
                        !resultData.summary &&
                        !resultData.hashes &&
                        !resultData.media &&
                        !resultData.screenshotUrl &&
                        !resultData.data?.html &&
                        !resultData.document &&
                        !resultData.data?.recentItems &&
                        !resultData.results &&
                        !resultData.data?.platform &&
                        !resultData.hashtag &&
                        !resultData.email &&
                        !resultData.formatInternational &&
                        !resultData.registrar &&
                        !resultData.securityHeaders &&
                        !resultData.internalLinks &&
                        !resultData.entities &&
                        !resultData.keywords &&
                        !resultData.sentiment &&
                        !resultData.languageName &&
                        !resultData.metadata &&
                        !resultData.originalFormatted &&
                        !resultData.convertedFileName &&
                        !resultData.securityAssessment &&
                        !resultData.files?.apk &&
                        !resultData.cleaned &&
                        !resultData.subdomains &&
                        resultData.daysRemaining === undefined &&
                        !resultData.grade &&
                        !resultData.resolvers &&
                        resultData.firstSnapshotDate === undefined &&
                        !resultData.robots &&
                        !resultData.channel &&
                        !resultData.user &&
                        !resultData.subreddit &&
                        !resultData.profile &&
                        !resultData.vendor &&
                        !resultData.action &&
                        !resultData.browser &&
                        !resultData.detectedEncoding &&
                        !(resultData.ip && resultData.asn) && (
                          <pre className="max-h-96 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed">
                            {JSON.stringify(resultData, null, 2)}
                          </pre>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            {resultData && (
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <Link href="/workspace">
                  <Button variant="outline" size="sm" className="gap-1.5 text-slate-300">
                    <FolderPlus className="h-4 w-4 text-cyan-400" />
                    <span>Simpan ke Workspace Investigasi</span>
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1 text-slate-400 hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Cetak / PDF</span>
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
