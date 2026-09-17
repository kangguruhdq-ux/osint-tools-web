import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

function getMasterKey(): Buffer {
  const masterKeyHex = process.env.ENCRYPTION_MASTER_KEY;
  if (!masterKeyHex) {
    // Fallback deterministic development key if not set
    return crypto.createHash("sha256").update("nexus-default-master-key-2026").digest();
  }
  if (masterKeyHex.length === 64) {
    return Buffer.from(masterKeyHex, "hex");
  }
  return crypto.createHash("sha256").update(masterKeyHex).digest();
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag,
  };
}

export function decrypt(encrypted: string, ivHex: string, tagHex: string): string {
  try {
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getMasterKey(), iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    throw new Error("Gagal mendekripsi data: Kunci tidak valid atau data rusak.");
  }
}

export function generateKeyHint(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return "••••••••";
  const start = apiKey.slice(0, 3);
  const end = apiKey.slice(-4);
  return `${start}••••••••${end}`;
}
