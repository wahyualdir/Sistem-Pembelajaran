# SIAJAR — Daftar Bug Teridentifikasi dan Status Perbaikan

Dokumen ini melacak seluruh bug yang ditemukan dalam audit sistem SIAJAR, dikelompokkan berdasarkan tingkat keparahan (*Kritis*, *Tinggi*, *Sedang*, *Rendah*), lengkap dengan lokasi baris, gejala, penyebab, perbaikan, dan bukti verifikasi.

---

## 1. Ringkasan Status Bug

- **Total Ditemukan**: 6
- **Diperbaiki**: 1 (BUG-001 selesai di Fase 1)
- **Tersisa**: 5

---

## 2. Rincian Bug Teridentifikasi

### BUG-001 [Kritis] — Kredensial Super Admin Tertanam & Celah Bypass Sesi Produksi
- **Lokasi**: `src/modules/identity/actions.ts`, `src/lib/auth/session.ts`, `src/lib/cron/auth.ts`, `src/app/api/auth/logout/route.ts`
- **Gejala**: Super Admin dapat login menggunakan sandi hardcode `'wahyu11'` atau `'Password123!'`; cookie `demo_session` super admin sintetis diterima di lingkungan produksi; route `/api/*` rentan terhadap bypass jika tidak dicek fail-closed.
- **Penyebab**: Perubahan pada commit `9d2a590` ("enable seamless Super Admin login").
- **Tingkat**: Kritis (Keamanan)
- **Status**: **DIPERBAIKI (Fase 1)**
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

### BUG-002 [Tinggi] — Pemanggilan `cookies()` di Luar Request Scope pada Unit Tests
- **Lokasi**: `src/lib/supabase/server.ts:5:23` (dipanggil dari `listPendingReviewsAction`, `assertClassOwner`, `assertClassMember`, dsb.)
- **Gejala**: Unit test Vitest gagal dengan pesan: `Error: 'cookies' was called outside a request scope. Read more: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context`.
- **Penyebab**: Server action mengimpor dan memanggil helper `createClient()` yang langsung mengakses `cookies()` Next.js tanpa fallback atau mock ketika dijalankan dalam runner pengujian non-HTTP.
- **Tingkat**: Tinggi
- **Status**: Belum diperbaiki (Jadwal perbaikan: Fase 7 / Fase 8)
- **Rencana Perbaikan**: Berikan penanganan fallback fail-safe pada modul auth / helper supabase server jika `cookies()` melempar error saat pengujian non-request scope.

### BUG-003 [Tinggi] — Audit Log Gagal Menyebabkan Server Action Crash Saat Offline
- **Lokasi**: `src/lib/audit.ts:96:13`
- **Gejala**: `AUDIT_LOG_WRITE_FAILED: Gagal menyimpan jejak audit: TypeError: fetch failed` pada pengujian evaluasi dosen (`src/tests/unit/evaluation/evaluation.test.ts`).
- **Penyebab**: `recordSystemAuditLog` melempar error keras jika panggilan fetch ke database Supabase gagal, padahal aplikasi berada di lingkungan tes offline / demo.
- **Tingkat**: Tinggi
- **Status**: Belum diperbaiki (Jadwal perbaikan: Fase 7)
- **Rencana Perbaikan**: Fallback simpan audit log ke memori/console logger saat backend Supabase tidak terjangkau di lingkungan lokal/pengujian.

### BUG-004 [Tinggi] — 60 Kode Warna Hex di Luar Palet Resmi Kampus pada Halaman Login
- **Lokasi**: `src/app/(auth)/login/island-illustration.tsx` (12 hex) dan `src/app/(auth)/login/page.tsx` (48 hex)
- **Gejala**: `npm run cek:hex` gagal dengan exit code 1.
- **Penyebab**: Penulisan hex inline literal (#E8E4DA, #15803D, #25D366, dll.) alih-alih token Tailwind resmi kampus (#F3F3F4, #FFFFFF, #111111, #ED1C24, #A91117, #808285, #58595B, #E2E3E4, #000000).
- **Tingkat**: Tinggi
- **Status**: Belum diperbaiki (Jadwal perbaikan: Fase 7)
- **Rencana Perbaikan**: Konversi seluruh kode warna hex ke token Tailwind palet kampus.

### BUG-005 [Tinggi] — 9 Menu Navigasi Jatuh ke Halaman Tiruan Catch-All `[...slug]`
- **Lokasi**: `src/lib/config/menu-config.ts` dan folder `src/app/(portal)/*/[...slug]/page.tsx`
- **Gejala**: Mengakses rute seperti `/coordinator/courses`, `/exams/question-bank`, `/staff/master/students` menampilkan layout data tiruan (dummy metric dan sample questions statis).
- **Penyebab**: Halaman khusus belum dibuat sehingga Next.js menangkapnya dengan route catch-all dummy.
- **Tingkat**: Tinggi
- **Status**: Belum diperbaiki (Jadwal perbaikan: Fase 3 & 4)
- **Rencana Perbaikan**: Buat berkas `page.tsx` khusus untuk 9 menu sesuai Lampiran A dan sambungkan ke server action nyata.

### BUG-006 [Sedang] — Pengalihan Multi-Role ke `/workspace` Menyebabkan Timeout pada Skrip E2E Spesifik Role
- **Lokasi**: `src/middleware.ts` dan `src/modules/identity/actions.ts`
- **Gejala**: Playwright E2E test `responsive.spec.ts` timeout saat menunggu `/lecturer` karena pengguna multi-role diarahkan ke `/workspace` alih-alih beranda perannya.
- **Penyebab**: Logika pemilihan workspace multi-role dari commit `9d2a590` memaksa redirect ke `/workspace` jika akun memiliki lebih dari 1 role.
- **Tingkat**: Sedang
- **Status**: Belum diperbaiki (Jadwal perbaikan: Fase 7)
- **Rencana Perbaikan**: Izinkan parameter kueri atau header khusus pengujian untuk memilih role langsung tanpa harus melalui landing page `/workspace`.
