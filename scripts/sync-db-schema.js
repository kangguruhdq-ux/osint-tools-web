const { execSync } = require("child_process");

const dbUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_URL ||
  process.env.NEON_DATABASE_URL;

if (!dbUrl) {
  console.log("[DB Sync] Tidak ada DATABASE_URL terdeteksi. Melewati inisialisasi schema database eksternal.");
  process.exit(0);
}

// Ensure DATABASE_URL is set for Prisma CLI
process.env.DATABASE_URL = dbUrl;

console.log("[DB Sync] Mendeteksi database PostgreSQL eksternal. Memverifikasi dan menyinkronkan skema tabel...");

try {
  // Push prisma schema to external postgres (Neon / Supabase)
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
    timeout: 45000,
  });
  console.log("[DB Sync] Skema tabel PostgreSQL berhasil disinkronkan ke cloud database!");
} catch (err) {
  console.warn("[DB Sync] Peringatan: Sinkronisasi skema database dilewati atau gagal:", err.message);
}
