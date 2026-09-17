import { ToolProvider, ProviderHealth } from "./types";
import { memoryDb } from "@/lib/db";
import { decrypt } from "@/lib/security/encryption";

class ProviderRegistry {
  private providers: Map<string, ToolProvider> = new Map();

  register(provider: ToolProvider) {
    this.providers.set(provider.id, provider);
  }

  get(id: string): ToolProvider | undefined {
    return this.providers.get(id);
  }

  getAll(): ToolProvider[] {
    return Array.from(this.providers.values());
  }

  async getDecryptedApiKey(providerKey: string): Promise<string | null> {
    // 1. Check environment variable first
    const envMap: Record<string, string | undefined> = {
      rapidapi: process.env.RAPIDAPI_KEY,
      cobalt: process.env.COBALT_API_URL,
      openai: process.env.OPENAI_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
    };

    if (envMap[providerKey] && envMap[providerKey]!.trim().length > 0) {
      return envMap[providerKey]!.trim();
    }

    // 2. Check encrypted DB / memory store
    const providerMeta = memoryDb.providers.get(providerKey);
    if (providerMeta?.encryptedKey && providerMeta.iv && providerMeta.tag) {
      try {
        return decrypt(providerMeta.encryptedKey, providerMeta.iv, providerMeta.tag);
      } catch (err) {
        console.error(`Gagal mendekripsi API key untuk provider ${providerKey}`, err);
        return null;
      }
    }

    return null;
  }

  async checkAllHealth(): Promise<Record<string, ProviderHealth>> {
    const results: Record<string, ProviderHealth> = {};
    for (const [id, provider] of this.providers.entries()) {
      try {
        results[id] = await provider.checkHealth();
      } catch (err: any) {
        results[id] = {
          status: "ERROR",
          message: err.message,
        };
      }
    }
    return results;
  }
}

export const providerRegistry = new ProviderRegistry();
