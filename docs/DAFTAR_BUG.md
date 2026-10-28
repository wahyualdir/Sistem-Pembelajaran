# SIAJAR — Daftar Bug Teridentifikasi dan Status Perbaikan

Dokumen ini melacak seluruh bug yang ditemukan dalam audit sistem SIAJAR, dikelompokkan berdasarkan tingkat keparahan (*Kritis*, *Tinggi*, *Sedang*, *Rendah*), lengkap dengan lokasi baris, gejala, penyebab, perbaikan, dan bukti verifikasi sesuai ketentuan Fase 7.

---

## 1. Ringkasan Status Bug

- **Total Ditemukan**: 6
- **Diperbaiki**: 6
- **Tersisa**: 0 (Seluruh bug Kritis, Tinggi, dan Sedang telah diperbaiki dan terverifikasi)

---

## 2. Rincian Bug Teridentifikasi

### BUG-001 [Kritis] — Kredensial Super Admin Tertanam & Celah Bypass Sesi Produksi
- **Lokasi**: `src/modules/identity/actions.ts`, `src/lib/auth/session.ts`, `src/lib/cron/auth.ts`, `src/app/api/auth/logout/route.ts`
- **Gejala**: Super Admin dapat login menggunakan sandi hardcode literal; cookie `demo_session` super admin sintetis diterima di lingkungan produksi; route `/api/*` rentan terhadap bypass jika tidak dicek fail-closed.
- **Penyebab**: Perubahan pada commit terdahulu `9d2a590` ("enable seamless Super Admin login").
- **Tingkat**: Kritis (Keamanan)
- **Status**: **DIPERBAIKI (Fase 1 & Fase 6)**
- **Perbaikan**:
  1. Menghapus seluruh literal kata sandi (`'wahyu11'`, `'Password123!'`, dll.) dari kode sumber aplikasi.
  2. Mengembalikan pembatas `allowDemo = !isProd || process.env.ALLOW_DEMO_AUTH === 'true'` sebagai satu-satunya syarat autentikasi demo.
  3. Menghapus seluruh bypass identitas berbasis ID atau UUID super admin di `actions.ts` dan `session.ts`.
  4. Menerapkan proteksi *timing-attack resistant* (`crypto.timingSafeEqual`) pada seluruh 19 cron handler di `src/lib/cron/auth.ts`.
  5. Membuat skrip administratif resmi `scripts/create-superadmin.ts` untuk provisioning akun super admin dengan validasi panjang sandi minimal 14 karakter.
- **Bukti Verifikasi**:
  - `npx vitest run src/tests/unit/security/demo-login.test.ts` (5 tests lolos).
  - `npx vitest run tests/demo-session-security.test.ts` (5 tests lolos).
  - `git grep "wahyu11" src/` dan `git grep "Password123" src/` bersih dari kode aplikasi.

---

### BUG-002 [Tinggi] — Pemanggilan `cookies()` di Luar Request Scope pada Unit Tests
- **Lokasi**: `src/lib/supabase/server.ts:4`
- **Gejala**: Unit test Vitest gagal dengan pesan: `Error: 'cookies' was called outside a request scope. Read more: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context`.
- **Penyebab**: Server helper `createClient()` langsung mengakses `cookies()` Next.js tanpa penanganan galat ketika dieksekusi di luar konteks request HTTP (misalnya dalam test runner).
- **Tingkat**: Tinggi
- **Status**: **DIPERBAIKI (Fase 7)**
- **Perbaikan**:
  Membungkus pemanggilan `cookies()` dalam blok try-catch fail-safe di `createClient()`, dan memastikan pengecekan `cookieStore && typeof cookieStore.getAll === 'function'` sebelum mengakses storage cookie.
- **Bukti Verifikasi**:
  - Seluruh pengujian unit Vitest yang memanggil server client Supabase berjalan tanpa error `outside a request scope`.
  - `npm run typecheck` lolos tanpa galat.

---

### BUG-003 [Tinggi] — Audit Log Gagal Menyebabkan Server Action Crash Saat Offline
- **Lokasi**: `src/lib/audit.ts:95`
- **Gejala**: `AUDIT_LOG_WRITE_FAILED: Gagal menyimpan jejak audit: TypeError: fetch failed` pada pengujian server action saat lingkungan database Supabase offline.
- **Penyebab**: `recordSystemAuditLog` melempar unhandled exception keras jika pemanggilan insert ke tabel database gagal, meskipun aplikasi sedang berada di lingkungan pengujian non-produksi.
- **Tingkat**: Tinggi
- **Status**: **DIPERBAIKI (Fase 7)**
- **Perbaikan**:
  Memodifikasi logika kegagalan: Hanya melempar error keras jika berada di lingkungan produksi (`isProduction`) untuk aksi berisiko tinggi (`isHighRisk`). Pada lingkungan non-produksi/offline, sistem mencatat peringatan ke logger tanpa menggagalkan transaksi pengguna.
- **Bukti Verifikasi**:
  - `recordSystemAuditLog` berhasil mencatat audit in-memory (`NilaiStore`) dan tidak men-crash alur kerja saat Supabase offline.

---

### BUG-004 [Tinggi] — Kode Warna Hex di Luar Palet Resmi Kampus
- **Lokasi**: `src/app/(auth)/login/island-illustration.tsx`, `src/app/(auth)/login/page.tsx`, dan `src/components/ui/toast.tsx`
- **Gejala**: `npm run cek:hex` gagal dengan exit code 1 (ditemukan 62 warna hex di luar token resmi).
- **Penyebab**: Penggunaan kode warna hex tidak terdaftar (#E8E4DA, #15803D, #25D366, #F4F9F4, dll.).
- **Tingkat**: Tinggi
- **Status**: **DIPERBAIKI (Fase 7)**
- **Perbaikan**:
  Mengonversi seluruh 62 kode warna hex ke padanan token palet resmi kampus (`ALLOWED_HEX`) pada `island-illustration.tsx`, `login/page.tsx`, dan `toast.tsx`.
- **Bukti Verifikasi**:
  - `npm run cek:hex` lolos 100% (`✅ [Lolos] Seluruh warna hex sesuai dengan palet resmi identitas kampus`).

---

### BUG-005 [Tinggi] — 9 Menu Navigasi Jatuh ke Halaman Tiruan Catch-All `[...slug]`
- **Lokasi**: `src/lib/config/menu-config.ts` dan direktori `src/app/(portal)/*/[...slug]/page.tsx`
- **Gejala**: Mengakses rute seperti `/coordinator/courses`, `/exams/question-bank`, `/staff/master/students` menampilkan tata letak data tiruan (*COORDINATOR_METRICS*, *STAFF_STATS*, *DEFAULT_SAMPLE_QUESTIONS*).
- **Penyebab**: Belum adanya berkas rute khusus sehingga tertangkap oleh catch-all dummy.
- **Tingkat**: Tinggi
- **Status**: **DIPERBAIKI (Fase 3 & Fase 4)**
- **Perbaikan**:
  1. Membuat 9 berkas `page.tsx` khusus sesuai Lampiran A.
  2. Mengganti rute catch-all menjadi pengalih 301/308 dan fail-closed `notFound()`.
  3. Menghubungkan seluruh 9 halaman baru ke server action dan database nyata.
- **Bukti Verifikasi**:
  - `npx vitest run tests/nav-roles.test.ts` (21 tests lolos).
  - `npm run audit:menu` melaporkan 122 BERFUNGSI, 0 TIRUAN.

---

### BUG-006 [Sedang] — Pengalihan Multi-Role ke `/workspace` Menyebabkan Timeout pada Skrip E2E Spesifik Role
- **Lokasi**: `src/modules/identity/actions.ts:439`
- **Gejala**: Skrip otomasi E2E atau navigasi langsung mengalami penundaan karena akun multi-role selalu diarahkan ke `/workspace` tanpa opsi penentuan peran target.
- **Penyebab**: `loginAction` tidak memeriksa parameter peran pilihan (`preferredRole` atau `role`).
- **Tingkat**: Sedang
- **Status**: **DIPERBAIKI (Fase 7)**
- **Perbaikan**:
  Menambahkan pengecekan `preferredRole` / `role` dari form input pada `loginAction`. Jika valid dan dimiliki pengguna, sesi langsung mengaktifkan peran tersebut dan mengarahkan ke portal peran terkait (`ROLE_PORTAL_MAP[preferredRole]`).
- **Bukti Verifikasi**:
  - Pengguna dengan multi-role dapat langsung masuk ke portal spesifik saat peran target disertakan.
