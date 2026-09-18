import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateUrlSafe } from "@/lib/security/ssrf-guard";

const SecurityTxtSchema = z.object({
  domain: z.string().min(3, "Domain tidak valid."),
});

interface SecurityTxtDirective {
  key: string;
  value: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SecurityTxtSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const cleanDomain = parsed.data.domain
      .trim()
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .split(":")[0];

    const targetUrl = `https://${cleanDomain}`;
    const ssrf = await validateUrlSafe(targetUrl);
    if (!ssrf.safe) {
      return NextResponse.json({ success: false, error: ssrf.error || "Akses ke domain diblokir oleh SSRF Guard." }, { status: 403 });
    }

    const testUrls = [
      `https://${cleanDomain}/.well-known/security.txt`,
      `https://${cleanDomain}/security.txt`,
      `http://${cleanDomain}/.well-known/security.txt`,
    ];

    let foundContent = "";
    let effectiveUrl = "";

    for (const url of testUrls) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NexusSecurityTxtAuditor/1.0",
            Accept: "text/plain, text/markdown, */*",
          },
          signal: AbortSignal.timeout(5000),
        });

        if (res.ok) {
          const text = await res.text();
          // Verify it contains standard directives and is not an HTML 404 error page
          if (text.toLowerCase().includes("contact:") || text.toLowerCase().includes("expires:") || text.toLowerCase().includes("policy:")) {
            foundContent = text;
            effectiveUrl = url;
            break;
          }
        }
      } catch {
        continue;
      }
    }

    if (!foundContent) {
      return NextResponse.json({
        success: true,
        domain: cleanDomain,
        found: false,
        complianceStatus: "NON_COMPLIANT",
        message: `File RFC 9116 security.txt tidak ditemukan pada domain ${cleanDomain}. Domain belum mengumumkan kontak respon kerentanan siber terstandar.`,
        directives: [],
        timestamp: new Date().toISOString(),
      });
    }

    // Parse security.txt directives
    const lines = foundContent.split("\n");
    const directives: SecurityTxtDirective[] = [];
    const grouped: Record<string, string[]> = {
      contacts: [],
      encryption: [],
      policies: [],
      acknowledgments: [],
      hiring: [],
      preferredLanguages: [],
      canonical: [],
    };
    let expiresAtStr = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const colonIndex = trimmed.indexOf(":");
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();
        directives.push({ key, value });

        const lowerKey = key.toLowerCase();
        if (lowerKey === "contact") grouped.contacts.push(value);
        else if (lowerKey === "encryption") grouped.encryption.push(value);
        else if (lowerKey === "policy") grouped.policies.push(value);
        else if (lowerKey === "acknowledgments") grouped.acknowledgments.push(value);
        else if (lowerKey === "hiring") grouped.hiring.push(value);
        else if (lowerKey === "preferred-languages") grouped.preferredLanguages.push(value);
        else if (lowerKey === "canonical") grouped.canonical.push(value);
        else if (lowerKey === "expires") expiresAtStr = value;
      }
    }

    // Evaluate expiration
    let isExpired = false;
    let expiresDate: Date | null = null;
    if (expiresAtStr) {
      const parsedDate = new Date(expiresAtStr);
      if (!isNaN(parsedDate.getTime())) {
        expiresDate = parsedDate;
        isExpired = parsedDate.getTime() < Date.now();
      }
    }

    // RFC 9116 requires: Contact AND Expires directives
    const hasContact = grouped.contacts.length > 0;
    const hasExpires = !!expiresAtStr;
    const isRfcCompliant = hasContact && hasExpires && !isExpired;

    return NextResponse.json({
      success: true,
      domain: cleanDomain,
      found: true,
      discoveredUrl: effectiveUrl,
      complianceStatus: isRfcCompliant ? "COMPLIANT" : isExpired ? "EXPIRED" : "PARTIAL",
      isRfcCompliant,
      hasContactDirective: hasContact,
      hasExpiresDirective: hasExpires,
      isExpired,
      expiresAt: expiresDate ? expiresDate.toISOString() : expiresAtStr || null,
      groupedDirectives: grouped,
      totalDirectives: directives.length,
      rawContent: foundContent.slice(0, 4000),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Gagal menginspeksi security.txt: " + err.message }, { status: 500 });
  }
}
