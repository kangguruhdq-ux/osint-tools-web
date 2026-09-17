import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEXUS OSINT TOOLS - Legal Intelligence & Media Utilities SaaS",
  description:
    "Platform all-in-one terpercaya untuk OSINT legal, analisis data publik, ekstraksi indikator ancaman (IOC), downloader media berizin, dan utilitas digital enterprise.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
