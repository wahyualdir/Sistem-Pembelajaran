# SIAJAR — Daftar Bug Teridentifikasi dan Status Perbaikan

Dokumen ini melacak seluruh bug yang ditemukan dalam audit sistem SIAJAR, dikelompokkan berdasarkan tingkat keparahan (*Kritis*, *Tinggi*, *Sedang*, *Rendah*), lengkap dengan lokasi baris, gejala, penyebab, perbaikan, dan bukti verifikasi sesuai ketentuan Fase 7 dan Investigasi Navigasi Menu.

---

## 1. Ringkasan Status Bug

- **Total Ditemukan**: 11
- **Diperbaiki**: 11
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
  1. Menghapus seluruh literal kata sandi (`'w****1'`, `'Password123!'`, dll.) dari kode sumber aplikasi.
  2. Mengembalikan pembatas `allowDemo = !isProd || process.env.ALLOW_DEMO_AUTH === 'true'` sebagai satu-satunya syarat autentikasi demo.
  3. Menghapus seluruh bypass identitas berbasis ID atau UUID super admin di `actions.ts` dan `session.ts`.
  4. Menerapkan proteksi *timing-attack resistant* (`crypto.timingSafeEqual`) pada seluruh 19 cron handler di `src/lib/cron/auth.ts`.
  5. Membuat skrip administratif resmi `scripts/create-superadmin.ts` untuk provisioning akun super admin dengan validasi panjang sandi minimal 14 karakter.
- **Bukti Verifikasi**:
  - `npx vitest run src/tests/unit/security/demo-login.test.ts` (5 tests lolos).
  - `npx vitest run tests/demo-session-security.test.ts` (5 tests lolos).
  - `git grep "w****1" src/` dan `git grep "Password123" src/` bersih dari kode aplikasi.

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

---

### BUG-007 [Kritis] — Loop Render Infinite di PortalShell (H-BARU)
- **Lokasi**: `src/app/(portal)/portal-shell.tsx:55-75`
- **Gejala**: Pengguna mengklik menu apa pun di sidebar portal, tetapi halaman tidak berpindah / freeze / terpental kembali ke beranda peran.
- **Penyebab**: `navGroups = getNavGroups(role, badges ?? unread)` dipanggil tanpa `useMemo` pada setiap render shell. Array referensi baru kemudian dijadikan dependensi pada `useEffect(..., [normalizedRole, navGroups])` yang memanggil `setCollapsedGroups`. Perubahan state tersebut memicu re-render instan tak terbatas (*infinite re-render loop*), membatalkan seluruh transisi navigasi klien (`next/link`).
- **Tingkat**: Kritis
- **Status**: **DIPERBAIKI (Fase 2.2)**
- **Commit**: `438afc1`
- **Perbaikan**:
  1. Membungkus `navGroups` dengan `useMemo(..., [role, badges, unread])`.
  2. Menghapus dependensi array `navGroups` yang tidak stabil dari `useEffect` accordion collapse, sehingga hanya bergantung pada `[normalizedRole]`.
- **Bukti Verifikasi**:
  - Playwright E2E sidebar navigation test (`tests/e2e/menu-click-navigation.spec.ts`) berjalan sukses untuk Super Admin (15/15 menu `OK`) dan Mahasiswa tanpa freezing.

---

### BUG-008 [Tinggi] — Segment Matching Prefix Error pada Route Guard (H4)
- **Lokasi**: `src/lib/config/menu-config.ts` dan `src/lib/auth/route-guard.ts`
- **Gejala**: Pengguna membuka rute seperti `/tasks` dialihkan paksa ke portal `/ta` atau dipental ke beranda karena dianggap melanggar otorisasi.
- **Penyebab**: Pengecekan rute menggunakan `pathname.startsWith(prefix)` tanpa batas segmen (`/`). Karena `/tasks` diawali string `/ta`, sistem keliru mengidentifikasi rute `/tasks` sebagai bagian dari portal `/ta` (Asisten Dosen).
- **Tingkat**: Tinggi
- **Status**: **DIPERBAIKI (Fase 2.3)**
- **Commit**: `0fb8d1a`
- **Perbaikan**:
  Menambahkan fungsi pembantu batas segmen `matchesPrefix(pathname, prefix)`: `p === pathname || pathname.startsWith(p + '/')` di `menu-config.ts` dan `route-guard.ts`, serta memperbarui seluruh rute pengecekan.
- **Bukti Verifikasi**:
  - `tests/nav-redirect-contract.test.ts` (15 tests lolos, termasuk uji rute `/tasks` untuk non-TA).

---

### BUG-009 [Tinggi] — Silent Fallback Role `STUDENT` (H1) & Format Huruf Besar/Kecil Cookie `active_role` (H2)
- **Lokasi**: `src/modules/identity/current-user.ts`, `src/app/(portal)/layout.tsx`, `src/app/(auth)/workspace/page.tsx`
- **Gejala**: Kesalahan kueri database atau cookie yang tidak cocok secara diam-diam menjadikan pengguna berperan sebagai `STUDENT`. Jika pengguna sebenarnya adalah Dosen/Admin, mereka terlempar ke portal Mahasiswa atau mengalami loop redirect.
- **Penyebab**: `current-user.ts` melakukan `activeRole || 'STUDENT'`, dan pengecekan cookie rentan terhadap variasi huruf besar/kecil (`student` vs `STUDENT`).
- **Tingkat**: Tinggi
- **Status**: **DIPERBAIKI (Fase 2.1 & Fase 2.2)**
- **Commit**: `bbdd2b0`, `438afc1`
- **Perbaikan**:
  1. Menerapkan `normalizeRoleCode()` sebagai Single Source of Truth untuk standardisasi kode peran di seluruh lapis aplikasi.
  2. Mengimplementasikan `getCurrentUserResolution()` dengan pembedaan eksplisit: `status` (`AUTHENTICATED`, `UNAUTHENTICATED`, `UNAVAILABLE`) dan `rolesStatus` (`OK`, `EMPTY`, `ERROR`). Jika peran kosong atau error, `activeRole` bernilai `''` (bukan `'STUDENT'`).
  3. `PortalLayout` menampilkan layar penanganan ramah saat peran kosong (*EMPTY*) atau error (*UNAVAILABLE*), dan mengarahkan ke `/workspace?alasan=peran-tidak-cocok` jika cookie tidak cocok.
- **Bukti Verifikasi**:
  - `tests/user-resolution.test.ts` (5 tests lolos mencakup seluruh skenario resolusi peran).

---

### BUG-010 [Tinggi] — Timeout dan False Logout pada Supabase Health Check Remote (H3)
- **Lokasi**: `src/lib/supabase/status.ts:36`
- **Gejala**: Pengguna tiba-tiba terlempar keluar (*logout*) ke `/login` saat jaringan lambat atau Supabase remote mengalami latensi lebih dari 300ms.
- **Penyebab**: `checkSupabaseOnline` menggunakan batas waktu hardcode 300ms untuk semua URL, termasuk endpoint Supabase remote HTTPS yang membutuhkan waktu jabat tangan TLS lebih lama.
- **Tingkat**: Tinggi
- **Status**: **DIPERBAIKI (Fase 2.4)**
- **Commit**: `a311e01`
- **Perbaikan**:
  1. Membedakan batas waktu pengecekan: 300ms untuk lokal (`localhost` / `127.0.0.1`) dan 3000ms untuk remote Supabase.
  2. Menerapkan *caching* hasil kegagalan maksimal 5 detik (dan hasil sukses 30 detik) agar tidak membebani siklus permintaan berulang.
- **Bukti Verifikasi**:
  - Pengujian online/offline Supabase berjalan stabil tanpa pemutusan sesi palsu.

---

### BUG-011 [Tinggi] — Database Error Postgres 22P02 & Timeout Hanging Kueri Supabase pada Sesi Demo
- **Lokasi**: `src/modules/identity/actions.ts`, `src/modules/identity/current-user.ts`
- **Gejala**: Tombol "Masuk ke Portal" menggantung pada teks "Memeriksa kredensial…", atau layout menampilkan "Layanan sementara tidak tersedia" saat masuk sebagai akun demo.
- **Penyebab**: 
  1. `loginAction` memanggil `supabaseAdmin` tanpa batas waktu (*timeout*), sehingga jika koneksi basis data remote lambat/tertunda, server action menggantung (*hang*) melebihi batas waktu peramban.
  2. `getCurrentUserResolution` menjalankan kueri SQL dengan klausa `eq('user_id', userId)` pada kolom UUID Postgres. Untuk pengguna demo berformat ID alfanumerik (`u-mhs-...`), Postgres melemparkan error `22P02 (invalid input syntax for type uuid)`, memicu status `ERROR` dan memblokir *fallback* peran demo.
- **Tingkat**: Tinggi
- **Status**: **DIPERBAIKI (Fase 3 & Fase 4)**
- **Commit**: `ad4d6ac`
- **Perbaikan**:
  1. Menambahkan fungsi pembungkus batas waktu `withTimeout(promise, 2500)` pada seluruh pemanggilan `supabaseAdmin` di `loginAction`.
  2. Memastikan kueri database Supabase dilewati untuk sesi yang secara eksplisit masuk melalui demo (`demoSessionId`), serta menangani kode error `22P02` secara fail-safe untuk akun demo.
- **Bukti Verifikasi**:
  - Uji E2E Super Admin dan Mahasiswa lolos, seluruh menu `OK` tanpa hanging.
  - `tests/user-resolution.test.ts` (5 tests lolos).
