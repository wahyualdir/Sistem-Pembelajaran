# SIAJAR — Daftar Bug Teridentifikasi dan Status Perbaikan

Dokumen ini melacak seluruh bug yang ditemukan dalam audit sistem SIAJAR, dikelompokkan berdasarkan tingkat keparahan (*Kritis*, *Tinggi*, *Sedang*, *Rendah*), lengkap dengan lokasi baris, gejala, penyebab, perbaikan, dan bukti verifikasi.

---

## 1. Ringkasan Status Bug

- **Total Ditemukan**: 6
- **Diperbaiki**: 0 (Fase 0 adalah baseline murni; perbaikan dimulai di Fase 1)
- **Tersisa**: 6

---

## 2. Rincian Bug Teridentifikasi (Baseline Fase 0)

### BUG-001 [Kritis] — Kredensial Super Admin Tertanam & Celah Bypass Sesi Produksi
- **Lokasi**: `src/modules/identity/actions.ts:241`, `src/lib/auth/session.ts`, `src/lib/auth/current-user.ts`, `src/middleware.ts`
- **Gejala**: Super Admin dapat login menggunakan sandi hardcode `'wahyu11'` atau `'Password123!'`; cookie `demo_session` super admin sintetis diterima di lingkungan produksi; route `/api/*` dikecualikan dari pengecekan sesi middleware.
- **Penyebab**: Perubahan pada commit `9d2a590` ("enable seamless Super Admin login").
- **Tingkat**: Kritis (Keamanan)
- **Status**: Belum diperbaiki (Jadwal perbaikan: Fase 1)
- **Rencana Perbaikan**: Hapus literal password, pulihkan guard `allowDemo`, validasi cookie demo hanya pada non-production, dan tambahkan proteksi sesi pada API.

### BUG-002 [Tinggi] — Pemanggilan `cookies()` di Luar Request Scope pada Unit Tests
- **Lokasi**: `src/lib/supabase/server.ts:5:23` (dipanggil dari `listPendingReviewsAction`, `assertClassOwner`, `assertClassMember`, dsb.)
- **Gejala**: Unit test Vitest gagal dengan pesan: `Error: 'cookies' was called outside a request scope. Read more: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context`.
- **Penyebab**: Server action mengimpor dan memanggil helper `createClient()` yang langsung mengakses `cookies()` Next.js tanpa fallback atau mock ketika dijalankan dalam runner pengujian non-HTTP.
- **Tingkat**: Tinggi
- **Status**: Belum diperbaiki (Baseline)
- **Rencana Perbaikan**: Berikan penanganan fallback fail-safe pada modul auth / helper supabase server jika `cookies()` melempar error saat pengujian non-request scope.

### BUG-003 [Tinggi] — Audit Log Gagal Menyebabkan Server Action Crash Saat Offline
- **Lokasi**: `src/lib/audit.ts:96:13`
- **Gejala**: `AUDIT_LOG_WRITE_FAILED: Gagal menyimpan jejak audit: TypeError: fetch failed` pada pengujian evaluasi dosen (`src/tests/unit/evaluation/evaluation.test.ts`).
- **Penyebab**: `recordSystemAuditLog` melempar error keras jika panggilan fetch ke database Supabase gagal, padahal aplikasi berada di lingkungan tes offline / demo.
- **Tingkat**: Tinggi
- **Status**: Belum diperbaiki (Baseline)
- **Rencana Perbaikan**: Fallback simpan audit log ke memori/console logger saat backend Supabase tidak terjangkau di lingkungan lokal/pengujian.

### BUG-004 [Tinggi] — 60 Kode Warna Hex di Luar Palet Resmi Kampus pada Halaman Login
- **Lokasi**: `src/app/(auth)/login/island-illustration.tsx` (12 hex) dan `src/app/(auth)/login/page.tsx` (48 hex)
- **Gejala**: `npm run cek:hex` gagal dengan exit code 1.
- **Penyebab**: Penulisan hex inline literal (#E8E4DA, #15803D, #25D366, dll.) alih-alih token Tailwind resmi kampus (#F3F3F4, #FFFFFF, #111111, #ED1C24, #A91117, #808285, #58595B, #E2E3E4, #000000).
- **Tingkat**: Tinggi
- **Status**: Belum diperbaiki (Baseline)
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
- **Status**: Belum diperbaiki (Baseline)
- **Rencana Perbaikan**: Sediakan parameter redirect langsung atau pemilihan role aktif saat pengujian otomatis.
