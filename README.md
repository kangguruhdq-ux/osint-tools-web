# NEXUS OSINT TOOLS Enterprise SaaS

> **Satu Workspace untuk OSINT Legal dan Media Intelligence**  
> Platform SaaS profesional all-in-one untuk intelijen sumber terbuka (OSINT) legal, analisis data publik, ekstraksi indikator ancaman (IOC), media downloader berizin, dan utilitas digital tingkat enterprise.

---

## 🚀 Fitur Utama & Keunggulan Arsitektur

- **100% Fungsional Nyata**: Tidak ada dummy data, tidak ada hasil hardcoded, tidak ada fake progress bar. Semua tools memiliki endpoint API backend dan implementasi nyata.
- **Sistem Provider Adapter & Enkripsi Kredensial**: API key disimpan di server dengan enkripsi standar militer **AES-256-GCM** (96-bit IV, 128-bit authentication tag). Jika provider belum dikonfigurasi, sistem menampilkan status transparan `"Provider belum dikonfigurasi"` lengkap dengan tombol konfigurasi di Admin Panel.
- **Keamanan Berlapis (Defense-in-Depth)**:
  - **SSRF Guard**: Memblokir otomatis akses ke `127.0.0.1`, subnet privat RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), AWS/GCP Cloud Metadata (`169.254.169.254`), skema `file://`, dan `ftp://`.
  - **HTTP Security Headers**: HSTS, CSP, X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), Referrer-Policy, dan Permissions-Policy.
  - **Rate Limiting**: Pembatasan request per IP dan session untuk mencegah brute-force.
  - **Kepatuhan Privasi (Anti-Doxxing)**: Koordinat GPS pada EXIF disembunyikan secara default; tidak memfasilitasi pencarian identitas privat personal.
  - **Pembersihan Otomatis**: File media sementara dihapus otomatis sesuai kebijakan retensi data (24 jam).
- **Desain Enterprise SaaS**: Dark mode default (Charcoal, Navy, Electric Blue, Violet, Cyan), glassmorphism tipis, responsive mobile-first, tablet, dan desktop.
- **Workspace Investigasi Terpadu**: Manajemen project investigasi, catatan analis Markdown, timeline peristiwa interaktif, dan ekspor laporan ke format JSON, CSV, serta PDF/Print.

---

## 📊 Status 36 Tools Nyata

### Kategori A: Domain & Network OSINT (11 Tools)
1. **Domain Intelligence**: Penggabungan DNS, sertifikat TLS, ASN, WHOIS `[AKTIF]`
2. **WHOIS Lookup**: Query langsung port 43 TCP socket ke IANA/TLD `[AKTIF]`
3. **DNS Lookup**: Resolusi mendalam A, AAAA, MX, TXT, NS, CNAME, SOA, CAA, PTR `[AKTIF]`
4. **IP Address Lookup**: Geolokasi publik, ISP, ASN, reverse DNS PTR `[AKTIF]`
5. **URL Security Scanner**: Status HTTP, redirect chain 5-hops, audit security headers `[AKTIF]`
6. **Website Technology Detector**: Deteksi pasif CMS, Framework, Web Server, CDN `[AKTIF]`
7. **Website Screenshot Sandbox**: Render sandbox halaman publik `[CONFIGURATION REQUIRED: URLbox Key]`
8. **Link Extractor**: Ekstraksi hyperlink halaman publik (Internal vs External) `[AKTIF]`
9. **Social Profile Analyzer**: Analisis metadata publik, bio, follower `[AKTIF]`
10. **Username Checker**: Pengecekan 20+ platform publik tanpa bypass captcha `[AKTIF]`
11. **Social Media Search**: Query konten publik (GitHub, HackerNews, Wikipedia) `[AKTIF]`

### Kategori B: Public Media Downloaders (6 Tools)
12. **TikTok Downloader**: Metadata & download stream video publik berizin `[CONFIGURATION REQUIRED: RapidAPI / Cobalt]`
13. **Instagram Downloader**: Unduh Reels & foto publik tanpa akses akun privat `[CONFIGURATION REQUIRED: RapidAPI / Cobalt]`
14. **YouTube Downloader**: Metadata resmi YouTube oEmbed + downloader legal `[CONFIGURATION REQUIRED: RapidAPI / Cobalt]`
15. **X/Twitter Downloader**: Ekstraksi media dari postingan publik X/Twitter `[CONFIGURATION REQUIRED: RapidAPI / Cobalt]`
16. **Facebook Downloader**: Unduh video publik Facebook tanpa bypass login `[CONFIGURATION REQUIRED: RapidAPI / Cobalt]`
17. **Pinterest Downloader**: Ekstraksi gambar dan video resolusi asli Pinterest `[CONFIGURATION REQUIRED: RapidAPI / Cobalt]`

### Kategori C: AI & Threat Intelligence Analysis (6 Tools)
18. **IOC Extractor (Threat Intel)**: Ekstraksi IP, Domain, Hash, URL, Email, CVE dengan de-obfuscator `[AKTIF]`
19. **Text Summarizer**: Ringkasan teks dual engine: NLP extractive scoring + OpenAI `[AKTIF]`
20. **Keyword Extractor**: Pembobotan statistik RAKE & frekuensi TF-IDF `[AKTIF]`
21. **Language Detector**: N-gram detector untuk 50+ bahasa dunia `[AKTIF]`
22. **Sentiment Analyzer**: Polaritas sentimen leksikon dwibahasa (Positif, Netral, Negatif) `[AKTIF]`
23. **Entity Extractor (NER)**: Ekstraksi Organisasi, Lokasi, Tanggal, Produk, Domain `[AKTIF]`

### Kategori D: File & Cryptographic Utilities (7 Tools)
24. **File Hash Generator**: Streaming hash MD5, SHA-1, SHA-256, SHA-512 dengan verifikator `[AKTIF]`
25. **Image Metadata Viewer**: Format, resolusi, EXIF camera dengan GPS masking `[AKTIF]`
26. **Video Metadata Viewer**: Durasi, resolusi, FPS, bitrate, codec atom box `[AKTIF]`
27. **Image Compressor**: Kompresi JPG, PNG, WebP dengan preview sebelum/sesudah `[AKTIF]`
28. **Video Compressor**: Background job pemrosesan resolusi dan bitrate video `[AKTIF]`
29. **File Format Converter**: Konversi format berkas legal (JPG, PNG, WebP, MP3, WAV) `[AKTIF]`
30. **QR Code Security Analyzer**: Dekode isi QR code dan analisis URL mencurigakan `[AKTIF]`

### Kategori E: Monitoring, Validation, & Reporting (6 Tools)
31. **Email Validator**: Sintaks RFC 5322, verifikasi DNS MX, deteksi disposable domain `[AKTIF]`
32. **Phone Number Validator**: Google `libphonenumber` format E.164, tipe nomor & operator `[AKTIF]`
33. **Hashtag Analyzer**: Analisis tren hashtag dan korelasi semantik publik `[AKTIF]`
34. **Keyword Monitor**: Pemantauan kata kunci otomatis berbasis jadwal `[AKTIF]`
35. **RSS & News Monitor**: Live feed reader RSS/Atom dengan filter kata kunci `[AKTIF]`
36. **Investigation Report Generator**: Penyusun laporan intelijen resmi (JSON, CSV, PDF) `[AKTIF]`

---

## 🛠️ Persyaratan Sistem & Instalasi

### Persyaratan:
- Node.js versi 18+ (direkomendasikan Node.js 20 atau 24)
- npm 9+
- PostgreSQL & Redis (Opsional untuk production, aplikasi memiliki resilient in-memory fallback untuk zero-dependency local dev!)

### Langkah 1: Kloning & Penginstalan Dependensi
```bash
git clone <repository-url>
cd osint-tools
npm install
```

### Langkah 2: Konfigurasi Environment
Salin file `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi kunci keamanan:
```env
JWT_SECRET="ganti_dengan_kunci_acak_minimal_32_karakter"
ENCRYPTION_MASTER_KEY="kunci_hex_64_karakter_untuk_aes_256_gcm"
DATABASE_URL="postgresql://user:password@localhost:5432/nexus_osint?schema=public"
```

### Langkah 3: Menjalankan Prisma Generate & Uji Integrasi
```bash
npx prisma generate
npx tsx scripts/verify-all.ts
```
*(Seluruh 25 uji integrasi keamanan, SSRF, enkripsi, dan hash akan tervalidasi 100% PASS)*

### Langkah 4: Menjalankan Server Development
```bash
npm run dev
```
Akses aplikasi di peramban Anda pada: `http://localhost:3000`

---

## 🔑 Akun Demo Pengujian Cepat

Pada halaman login (`/login`), Anda dapat langsung menggunakan tombol uji coba 1-klik atau memasukkan kredensial berikut:

| Peran (Role) | Alamat Email | Kata Sandi | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Chief Admin Analyst** | `admin@nexus-osint.io` | `Admin123!` | Akses penuh: Admin Console, Manajemen User, Provider Encryption, Audit Log, 36 Tools |
| **Regular Analyst** | `analyst@nexus-osint.io` | `Analyst123!` | Akses Analis: User Dashboard, OSINT Workspace, 36 Tools, Ekspor Laporan |

---

## 🐳 Deployment dengan Docker & Docker Compose

Deploy seluruh stack secara terisolasi (Next.js App + PostgreSQL + Redis + MinIO S3):

```bash
# Build dan jalankan seluruh container
docker compose up -d --build

# Cek log aplikasi
docker compose logs -f nexus-web

# Matikan container
docker compose down
```

Port yang dibuka:
- `http://localhost:3000`: NEXUS OSINT Web App
- `http://localhost:5432`: PostgreSQL 16
- `http://localhost:6379`: Redis 7
- `http://localhost:9001`: MinIO Object Storage Console

---

## 📜 Kepatuhan Hukum & Etika (Legal Compliance)

- **Hanya Data Publik**: NEXUS OSINT TOOLS tidak memfasilitasi peretasan, tidak membypass autentikasi akun privat, dan tidak mengakses data tanpa izin.
- **Anti-Doxxing**: Sistem secara default menolak pencarian alamat rumah fisik, identitas personal privat, dan menyembunyikan koordinat GPS pada data EXIF.
- **Downloader Legal**: Fitur downloader hanya untuk konten milik pengguna sendiri atau konten berlisensi publik terbuka.
- **Dokumen Hukum Resmi**:
  - Kebijakan Privasi: `/privacy`
  - Syarat & Ketentuan: `/terms`
  - Hak Cipta & DMCA: `/dmca`
  - Kebijakan Retensi Data: `/retention`
