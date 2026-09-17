# Dokumentasi Resmi API: NEXUS OSINT TOOLS

Platform SaaS Enterprise untuk Intelijen Sumber Terbuka (OSINT) Legal, Analisis Data Publik, dan Utilitas Digital.

---

## 1. Standar Keamanan & Autentikasi

### Headers yang Didukung
- `Content-Type: application/json`
- `Authorization: Bearer <JWT_TOKEN>` (Opsional jika menggunakan session cookie)

### Kebijakan Anti-SSRF (Server-Side Request Forgery)
Setiap permintaan outbound yang menerima input URL/Domain divalidasi oleh **SSRF Guard**:
- **Ditolak**: `127.0.0.0/8` (Loopback/Localhost), `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (RFC 1918 Private Subnets), `169.254.169.254` (Cloud Metadata), skema `file://`, `ftp://`, dan `gopher://`.

---

## 2. Autentikasi (`/api/auth`)

### `POST /api/auth/register`
Mendaftarkan akun analis baru.
- **Body**: `{ "name": string, "email": string, "password": string }`
- **Response**: `{ "success": true, "user": {...}, "token": string }`

### `POST /api/auth/login`
Masuk ke akun dan mendapatkan secure HTTP-only session cookie serta token JWT.
- **Body**: `{ "email": string, "password": string }`
- **Response**: `{ "success": true, "user": {...}, "token": string }`

### `POST /api/auth/logout`
Menghapus session cookie aktif.

### `GET /api/auth/me`
Mengambil profil akun yang sedang login.

---

## 3. OSINT Intelligence (`/api/osint`)

### `POST /api/osint/dns`
Resolusi mendalam DNS records publik.
- **Body**: `{ "domain": "example.com", "recordType": "ALL" | "A" | "AAAA" | "MX" | "TXT" | "NS" | "CNAME" | "SOA" | "CAA" | "PTR" }`
- **Response**: `{ "success": true, "records": {...}, "latencyMs": number }`

### `POST /api/osint/whois`
Query soket TCP port 43 langsung ke server WHOIS IANA & TLD.
- **Body**: `{ "domain": "example.com" }`
- **Response**: `{ "success": true, "registrar": string, "creationDate": string, "expiryDate": string, "nameServers": string[], "raw": string }`

### `POST /api/osint/ip`
Pencarian geolokasi publik, ISP, organisasi, ASN, dan reverse DNS PTR.
- **Body**: `{ "ip": "8.8.8.8" }`
- **Response**: `{ "success": true, "ip": string, "asn": string, "isp": string, "country": string, "reverseDns": string[] }`

### `POST /api/osint/url`
Audit keamanan URL, status HTTP, redirect chain, dan security headers audit (HSTS, CSP, X-Frame-Options).
- **Body**: `{ "url": "https://example.com" }`
- **Response**: `{ "success": true, "httpStatus": 200, "redirectChain": [...], "securityHeaders": {...} }`

### `POST /api/osint/technology`
Deteksi pasif CMS, Framework (Next.js, React, Vue), Web Server, CDN, dan Analytics.
- **Body**: `{ "url": "https://example.com" }`
- **Response**: `{ "success": true, "technologies": [{ "name": string, "category": string, "evidence": string }] }`

### `POST /api/osint/links`
Ekstraksi semua tautan hyperlink `<a href>` pada halaman publik dan pengelompokan Internal vs External.
- **Body**: `{ "url": "https://example.com" }`
- **Response**: `{ "success": true, "internalCount": number, "externalCount": number, "internalLinks": [...], "externalLinks": [...] }`

### `POST /api/osint/username`
Pengecekan keberadaan username pada 20+ platform publik secara simultan.
- **Body**: `{ "username": "torvalds" }`
- **Response**: `{ "success": true, "results": [{ "platform": string, "status": "FOUND" | "NOT_FOUND" | "UNKNOWN", "profileUrl": string }] }`

### `POST /api/osint/profile`
Analisis metadata profil publik (bio, follower count publik, tautan eksternal).
- **Body**: `{ "target": "https://github.com/torvalds", "platform": "auto" }`

### `POST /api/osint/domain`
Analisis multi-sumber intelijen domain (DNS, sertifikat TLS, ASN, WHOIS).
- **Body**: `{ "domain": "example.com" }`

### `POST /api/osint/social-search`
Pencarian konten publik berbasis kata kunci dengan filter platform.
- **Body**: `{ "query": "cybersecurity news", "platform": "all" }`

### `POST /api/osint/hashtag`
Analisis tren hashtag, keterkaitan topik semantik, dan confidence score.
- **Body**: `{ "hashtag": "infosec" }`

### `POST /api/osint/screenshot`
Screenshot halaman web publik dalam lingkungan sandbox aman.
- **Body**: `{ "url": "https://example.com" }`

---

## 4. Media Downloader (`/api/media`)

### `POST /api/media/preview`
Pratinjau metadata resmi media publik via oEmbed.
- **Body**: `{ "url": "https://www.youtube.com/watch?v=..." }`

### `POST /api/media/download`
Menginisialisasi download konten publik berizin melalui provider legal terenkripsi.
- **Body**: `{ "url": string, "format": "mp4" | "mp3", "quality": "720p" | "1080p" }`
- **Response**: `{ "success": true, "jobId": string, "progressEndpoint": string }`
*(Jika provider belum dikonfigurasi, mengembalikan status `422 CONFIGURATION_REQUIRED`)*

---

## 5. AI & Threat Intelligence (`/api/ai`)

### `POST /api/ai/ioc`
Ekstraksi otomatis Indikator Ancaman (IPv4, IPv6, Domain, URL, MD5, SHA-1, SHA-256, Email, CVE) dengan de-obfuscator (`hxxp`, `[.]`).
- **Body**: `{ "text": string }`

### `POST /api/ai/summarize`
Meringkas dokumen teks panjang dengan extractive NLP native atau OpenAI adapter.
- **Body**: `{ "text": string, "length": "short" | "medium" | "detailed" }`

### `POST /api/ai/keywords`
Ekstraksi kata kunci dengan pembobotan statistik RAKE & frekuensi TF-IDF.
- **Body**: `{ "text": string, "maxKeywords": 15 }`

### `POST /api/ai/language`
Deteksi bahasa otomatis berbasis N-gram untuk 50+ bahasa dunia.
- **Body**: `{ "text": string }`

### `POST /api/ai/sentiment`
Analisis polaritas sentimen (Positif, Netral, Negatif) dan skor objektivitas.
- **Body**: `{ "text": string }`

### `POST /api/ai/entities`
Ekstraksi entitas bernama (Organisasi, Lokasi Umum, Tanggal, Produk, Domain, Istilah Teknis).
- **Body**: `{ "text": string }`

---

## 6. File & Cryptographic Utilities (`/api/tools`)

### `POST /api/tools/hash`
Kalkulasi streaming hash kriptografi MD5, SHA-1, SHA-256, SHA-512 dengan fitur perbandingan kecocokan hash.
- **Content-Type**: `multipart/form-data` atau `application/json`

### `POST /api/tools/image-metadata`
Inspeksi header biner gambar EXIF dengan masking koordinat GPS otomatis demi privasi.
- **Content-Type**: `multipart/form-data` (field: `file`)

### `POST /api/tools/video-metadata`
Inspeksi box atom MP4/WebM untuk durasi, resolusi, FPS, dan codec audio/video.

### `POST /api/tools/compress-image`
Kompresi gambar JPG, PNG, WebP dengan slider kualitas dan kalkulasi persentase hemat ukuran.

### `POST /api/tools/compress-video`
Background job kompresi resolusi dan bitrate video.

### `POST /api/tools/convert`
Konversi format berkas legal (JPG, PNG, WebP, MP3, WAV).

### `POST /api/tools/qr-analyze`
Dekode gambar QR code dan analisis URL mencurigakan tanpa auto-open link.

### `POST /api/tools/validate-email`
Validasi sintaks RFC 5322, verifikasi DNS MX, dan deteksi disposable email.

### `POST /api/tools/validate-phone`
Validasi nomor telepon internasional sesuai standar ITU-T via Google `libphonenumber`.

---

## 7. Monitoring & Workspace (`/api/monitors` & `/api/investigations` & `/api/reports`)

### `GET /api/monitors` & `POST /api/monitors`
Manajemen monitor kata kunci dan feed RSS live.

### `GET /api/investigations` & `POST /api/investigations`
Manajemen project investigasi, catatan analis, dan timeline peristiwa.

### `POST /api/reports`
Penyusunan laporan intelijen terstruktur dengan cover, temuan, skor keyakinan, dan disclaimer hukum.

---

## 8. Admin Console (`/api/admin`)

### `GET /api/admin/users` & `PATCH /api/admin/users`
Manajemen pengguna, RBAC role switcher (USER, ANALYST, ADMIN), dan kuota scan.

### `GET /api/admin/providers` & `POST /api/admin/providers`
Manajemen konfigurasi provider API dengan enkripsi kredensial **AES-256-GCM**.

### `POST /api/admin/providers/[id]/test`
Pengujian koneksi langsung ke provider API dengan pengukuran latensi milidetik.

### `GET /api/admin/audit-logs`
Audit trail lengkap seluruh aktivitas sistem dan pencegahan SSRF.

### `GET /api/admin/system-status`
Metrik RAM, Node.js process health, status queue, dan toggle maintenance mode.
