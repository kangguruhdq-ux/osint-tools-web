import { describe, it } from "node:test";
import assert from "node:assert";
import { isPrivateIp, validateUrlSafe } from "../src/lib/security/ssrf-guard";
import { encrypt, decrypt, generateKeyHint } from "../src/lib/security/encryption";
import { hashPassword, comparePassword, signToken, verifyToken } from "../src/lib/auth/jwt";

describe("NEXUS OSINT TOOLS Security & Core Test Suite", () => {
  // 1. SSRF Protection Tests
  describe("SSRF Protection Guard", () => {
    it("harus memblokir loopback IP (127.0.0.1)", () => {
      assert.strictEqual(isPrivateIp("127.0.0.1"), true);
    });

    it("harus memblokir RFC 1918 subnet privat (10.0.0.1, 192.168.1.1, 172.16.0.1)", () => {
      assert.strictEqual(isPrivateIp("10.0.0.1"), true);
      assert.strictEqual(isPrivateIp("192.168.1.100"), true);
      assert.strictEqual(isPrivateIp("172.16.5.20"), true);
      assert.strictEqual(isPrivateIp("172.31.255.255"), true);
    });

    it("harus memblokir cloud metadata endpoint AWS/GCP (169.254.169.254)", () => {
      assert.strictEqual(isPrivateIp("169.254.169.254"), true);
    });

    it("harus mengizinkan IP publik yang sah", () => {
      assert.strictEqual(isPrivateIp("8.8.8.8"), false);
      assert.strictEqual(isPrivateIp("1.1.1.1"), false);
      assert.strictEqual(isPrivateIp("93.184.216.34"), false);
    });

    it("harus memblokir skema file:// dan ftp://", async () => {
      const fileRes = await validateUrlSafe("file:///etc/passwd");
      assert.strictEqual(fileRes.safe, false);

      const ftpRes = await validateUrlSafe("ftp://192.168.1.1/secret");
      assert.strictEqual(ftpRes.safe, false);
    });

    it("harus memblokir request ke localhost", async () => {
      const res = await validateUrlSafe("http://localhost:8080/admin");
      assert.strictEqual(res.safe, false);
    });
  });

  // 2. AES-256-GCM Encryption Tests
  describe("AES-256-GCM Kredensial Vault", () => {
    it("harus berhasil mengenkripsi dan mendekripsi API key", () => {
      const originalKey = "sk-live-super-secret-rapidapi-token-xyz-123456";
      const { encrypted, iv, tag } = encrypt(originalKey);

      assert.notStrictEqual(encrypted, originalKey);
      assert.ok(iv);
      assert.ok(tag);

      const decrypted = decrypt(encrypted, iv, tag);
      assert.strictEqual(decrypted, originalKey);
    });

    it("harus menghasilkan hint masking yang aman", () => {
      const hint = generateKeyHint("sk-proj-9104829104810");
      assert.ok(hint.includes("••••••••"));
      assert.ok(hint.startsWith("sk-"));
      assert.ok(hint.endsWith("4810"));
    });
  });

  // 3. Password Hashing & JWT Tests
  describe("Autentikasi & JWT RBAC", () => {
    it("harus menghasilkan hash bcrypt dan berhasil memverifikasinya", async () => {
      const password = "SuperSecretPassword123!";
      const hash = await hashPassword(password);
      assert.notStrictEqual(hash, password);

      const isMatch = await comparePassword(password, hash);
      assert.strictEqual(isMatch, true);

      const isWrongMatch = await comparePassword("WrongPass", hash);
      assert.strictEqual(isWrongMatch, false);
    });

    it("harus menandatangani token JWT dan memverifikasi payload role", () => {
      const payload = {
        userId: "user-123",
        email: "analyst@nexus-osint.io",
        role: "ADMIN" as const,
        name: "Lead Analyst",
      };

      const token = signToken(payload);
      assert.ok(token);

      const decoded = verifyToken(token);
      assert.notStrictEqual(decoded, null);
      assert.strictEqual(decoded?.email, payload.email);
      assert.strictEqual(decoded?.role, "ADMIN");
    });
  });
});
