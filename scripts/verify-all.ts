import { isPrivateIp, validateUrlSafe } from "../src/lib/security/ssrf-guard";
import { encrypt, decrypt, generateKeyHint } from "../src/lib/security/encryption";
import { hashPassword, comparePassword, signToken, verifyToken } from "../src/lib/auth/jwt";
import crypto from "crypto";
import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js";

async function runAllValidations() {
  console.log("==================================================");
  console.log("NEXUS OSINT TOOLS - AUTOMATED INTEGRATION TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. SSRF Guard Tests
  console.log("\n[1] PENGUJIAN SSRF GUARD & ANTI-LOOPBACK:");
  assert(isPrivateIp("127.0.0.1"), "Memblokir Loopback IPv4 (127.0.0.1)");
  assert(isPrivateIp("::1"), "Memblokir Loopback IPv6 (::1)");
  assert(isPrivateIp("10.0.0.1"), "Memblokir RFC 1918 Class A (10.0.0.1)");
  assert(isPrivateIp("172.16.0.1"), "Memblokir RFC 1918 Class B (172.16.0.1)");
  assert(isPrivateIp("192.168.1.1"), "Memblokir RFC 1918 Class C (192.168.1.1)");
  assert(isPrivateIp("169.254.169.254"), "Memblokir AWS/GCP Cloud Metadata (169.254.169.254)");
  assert(!isPrivateIp("8.8.8.8"), "Mengizinkan IP Publik Sah (8.8.8.8)");
  assert(!isPrivateIp("1.1.1.1"), "Mengizinkan IP Publik Sah (1.1.1.1)");

  const urlLocal = await validateUrlSafe("http://localhost:3000");
  assert(!urlLocal.safe, "Memblokir URL http://localhost:3000");

  const urlMeta = await validateUrlSafe("http://169.254.169.254/latest/meta-data");
  assert(!urlMeta.safe, "Memblokir URL AWS Cloud Metadata");

  const urlFile = await validateUrlSafe("file:///etc/passwd");
  assert(!urlFile.safe, "Memblokir Protokol file://");

  // 2. AES-256-GCM Encryption Tests
  console.log("\n[2] PENGUJIAN ENKRIPSI KREDENSIAL AES-256-GCM:");
  const testSecret = "sk-live-nexus-rapidapi-enterprise-secret-key-998811";
  const { encrypted, iv, tag } = encrypt(testSecret);
  assert(encrypted !== testSecret, "Ciphertext tidak sama dengan plaintext");
  assert(iv.length === 24, "Panjang IV 96-bit (24 karakter hex)");
  assert(tag.length === 32, "Panjang Auth Tag 128-bit (32 karakter hex)");

  const decrypted = decrypt(encrypted, iv, tag);
  assert(decrypted === testSecret, "Hasil dekripsi sesuai 100% dengan plaintext asli");

  const hint = generateKeyHint(testSecret);
  assert(hint.startsWith("sk-") && hint.endsWith("8811"), "Hint masking API key tepat");

  // 3. Password Hashing & JWT Tests
  console.log("\n[3] PENGUJIAN AUTENTIKASI & JWT RBAC:");
  const pass = "Admin123!";
  const hashed = await hashPassword(pass);
  assert(hashed.startsWith("$2a$") || hashed.startsWith("$2b$"), "Format bcrypt hash valid");
  assert(await comparePassword(pass, hashed), "Verifikasi password benar berhasil");
  assert(!(await comparePassword("WrongPassword", hashed)), "Penolakan password salah berhasil");

  const jwtToken = signToken({
    userId: "usr-admin-test",
    email: "admin@nexus-osint.io",
    role: "ADMIN",
    name: "Chief Admin Analyst",
  });
  assert(typeof jwtToken === "string" && jwtToken.split(".").length === 3, "JWT Token berstruktur 3 segmen valid");

  const verified = verifyToken(jwtToken);
  assert(verified?.role === "ADMIN", "Verifikasi role ADMIN pada token sukses");

  // 4. Cryptographic Hash Tests
  console.log("\n[4] PENGUJIAN KALKULASI HASH KRIPTOGRAFI:");
  const testString = "NEXUS-OSINT-2026";
  const md5Calc = crypto.createHash("md5").update(testString).digest("hex");
  const sha256Calc = crypto.createHash("sha256").update(testString).digest("hex");
  assert(md5Calc.length === 32, "Panjang hash MD5 32 hex");
  assert(sha256Calc.length === 64, "Panjang hash SHA-256 64 hex");

  // 5. Phone & Email Validators
  console.log("\n[5] PENGUJIAN VALIDATOR DIGITAL:");
  assert(isValidPhoneNumber("+628123456789", "ID"), "Nomor telepon Indonesia sah (+62812...) terverifikasi");
  assert(!isValidPhoneNumber("+62123", "ID"), "Nomor telepon tidak valid ditolak");

  console.log("\n==================================================");
  console.log(`HASIL AKHIR: ${passed} LULUS, ${failed} GAGAL`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllValidations();
