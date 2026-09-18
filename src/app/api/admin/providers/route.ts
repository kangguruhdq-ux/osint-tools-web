import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { memoryDb, ensureDbSynced, persistAuditLogToDb } from "@/lib/db";
import { encrypt, generateKeyHint } from "@/lib/security/encryption";
import { authenticateRequest } from "@/lib/auth/session";

const ProviderUpdateSchema = z.object({
  key: z.string(),
  name: z.string().optional(),
  apiKey: z.string().min(3, "API Key minimal 3 karakter."),
  baseUrl: z.string().optional(),
});

export async function GET() {
  await ensureDbSynced();
  const providers = Array.from(memoryDb.providers.values()).map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    category: p.category,
    baseUrl: p.baseUrl || "-",
    status: p.status,
    keyHint: p.keyHint || (p.status === "ACTIVE" ? "••••••••(Native)" : "Belum Dikonfigurasi"),
    hasKey: !!p.encryptedKey || p.status === "ACTIVE",
  }));

  return NextResponse.json({
    success: true,
    data: providers,
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();
    const parsed = ProviderUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { key, apiKey, baseUrl, name } = parsed.data;

    // Encrypt API key with AES-256-GCM
    const { encrypted, iv, tag } = encrypt(apiKey);
    const hint = generateKeyHint(apiKey);

    let provider = memoryDb.providers.get(key);
    if (!provider) {
      provider = {
        id: "prov-" + Date.now(),
        key,
        name: name || key,
        category: "external",
        status: "CONFIGURATION_REQUIRED",
      };
    }

    provider.encryptedKey = encrypted;
    provider.iv = iv;
    provider.tag = tag;
    provider.keyHint = hint;
    if (baseUrl) provider.baseUrl = baseUrl;
    provider.status = "ACTIVE"; // activated upon saving encrypted key

    memoryDb.providers.set(key, provider);
    memoryDb.save();

    // Audit log
    await persistAuditLogToDb({
      id: "aud-" + Date.now(),
      userId: user?.userId || "u-admin-01",
      action: "API_KEY_ENCRYPTED_SAVE",
      resourceType: "PROVIDER",
      resourceId: key,
      details: { keyHint: hint, providerName: provider.name },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `API Key untuk provider '${provider.name}' berhasil disimpan secara terenkripsi (AES-256-GCM).`,
      keyHint: hint,
      status: "ACTIVE",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan API key: " + err.message },
      { status: 500 }
    );
  }
}
