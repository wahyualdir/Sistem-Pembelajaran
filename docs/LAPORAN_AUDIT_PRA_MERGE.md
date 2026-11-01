# LAPORAN AUDIT SEBELUM MERGE: PERBAIKAN NAVIGASI MENU

**Tanggal Audit**: 1 November 2026  
**Branch**: `fix/navigasi-menu`  
**Titik Rollback Audit**: `sebelum-penutupan-catatan` (fase penutupan) & `sebelum-audit-pra-merge` (audit awal)  
**Titik Rollback Induk**: `sebelum-fix-navigasi`  
**Keputusan**: **SIAP DENGAN CATATAN**

---

## 1. Ringkasan Eksekutif & Keputusan

Berdasarkan audit menyeluruh terhadap seluruh commit pada branch `fix/navigasi-menu` (termasuk penutupan catatan audit dan pengujian peran baru), status perbaikan navigasi diklasifikasikan sebagai **SIAP DENGAN CATATAN**.

Tiga alasan utama keputusan ini:
1. **Navigasi 100% Terverifikasi Bersih dan Tanpa Pelonggaran**: Tes klik menu ketat (`tests/e2e/menu-click-strict.spec.ts` dan `tests/e2e/menu-click-navigation.spec.ts`) membuktikan **149/149 menu** yang dirender untuk seluruh **9 peran** (`STUDENT`, `TEACHING_ASSISTANT`, `LECTURER`, `PROGRAM_COORDINATOR`, `ACADEMIC_STAFF`, `SYSTEM_ADMIN`, `SUPER_ADMIN`, `PROGRAM_SECRETARY`, dan `LAB_HEAD`) berhasil mendarat persis pada URL tujuan tanpa terpental ke beranda. Tidak ada pelonggaran tes (`fixme`, `skip`, retries, atau manipulasi `INTENDED_REDIRECTS`).
2. **Keamanan Login Demo di Lingkungan Produksi Terkunci Rapat (Fail-Closed)**: Verifikasi statis dan dinamis (`tests/demo-prod-gating.test.ts`) membuktikan bahwa saat `NODE_ENV=production` dan `ALLOW_DEMO_AUTH` tidak aktif, autentikasi demo, cookie tiruan, dan impersonasi peran ditolak 100%. Komponen `LoginDevMode` juga tidak dirender di production jika `ALLOW_DEMO_AUTH !== 'true'`.
3. **Kredensial Hardcode Bersih Total dari Working Tree**: Kata sandi literal superadmin lama telah dihapus total dari kode sumber dan dokumentasi aktif (pemindaian kata sandi lama menghasilkan 0). Pembacaan kini menggunakan environment variable (`SUPERADMIN_PASSWORD` dan `NEXT_PUBLIC_DEMO_PASSWORD`), dengan fallback aman dan pencatatan template di [`.env.example`](file:///c:/Users/ACER/Downloads/implementasi/.env.example).

Catatan sebelum merge ke production:
- Pengguna wajib merotasi kata sandi akun superadmin (`superadmin@siajar.ac.id`) di Supabase Production jika pernah menggunakan kata sandi default lama.
- Uji verifikasi manual pada Vercel Preview Deployment dengan akun Supabase asli (bukan demo).

---

## 2. Hasil Audit Fase A sampai E

### A. Selisih Jumlah Menu (122 vs 124 vs 149)
- **Tingkat Keparahan**: RENDAH (Konsistensi Terbukti)
- **Fakta & Rekonsiliasi**:
  1. **122 menu**: Jumlah item mentah unik di `MENU_CONFIG` untuk 9 peran (tidak menghitung 3 item grup bersama/support).
  2. **149 menu**: Jumlah seluruh item yang dirender untuk 9 peran (`122 raw + 9 peran × 3 item shared support (/settings, /help, /transparency) = 149`). Ini persis dengan laporan `npm run audit:menu` dan `docs/AUDIT_MENU_FUNGSI.md`.
  3. **124 menu**: Jumlah item menu yang dirender dan diuji E2E awal untuk 7 peran demo utama.
  4. **25 menu tambahan**: Milik 2 peran Fase 3/4 (`PROGRAM_SECRETARY` 13 item dan `LAB_HEAD` 12 item). Kini seluruh 25 menu tambahan ini telah diuji dan lulus 100% pada penutupan catatan audit (`124 + 25 = 149 menu teruji penuh`).
- **Integritas `MENU_CONFIG`**:
  `git diff sebelum-fix-navigasi..HEAD -- src/lib/config/menu-config.ts` membuktikan tidak ada penambahan/pengurangan label, href, ikon, atau perubahan urutan item (hanya penambahan helper murni `matchesPrefix` dan normalisasi input).
- **Kesimpulan**: Selisih angka 122, 124, dan 149 telah terekonsiliasi secara matematis dan konsisten dengan arsitektur peran aplikasi.

---

### B. Pemeriksaan Pelonggaran Tes
- **Tingkat Keparahan**: RENDAH (Tidak Ada Pelonggaran)
- **Fakta**:
  1. Riwayat git `tests/e2e/menu-click-navigation.spec.ts` menunjukkan perubahan commit hanya berupa perbaikan selector, perpanjangan timeout cold compilation Next.js di platform Windows, dan penambahan logging diagnostik.
  2. `INTENDED_REDIRECTS` dibuat di commit pertama (`16cc8fb`) hanya untuk 3 entri `/grades` yang bersumber dari kode aktual `src/app/(portal)/grades/page.tsx:19-27`. Namun pada eksekusi runtime, redirect ini tidak pernah terpicu (`REDIRECT-SENGAJA count: 0`) karena ketiga peran tersebut tidak memiliki link `/grades` di sidebar.
  3. Pencarian `git grep -nE "fixme|\.skip|test\.skip"` pada direktori tes menghasilkan 0 kecocokan.
  4. Tes independen `tests/e2e/menu-click-strict.spec.ts` yang dijalankan tanpa toleransi `INTENDED_REDIRECTS` mencatat 149/149 klik menu sukses dengan status `EXACT_MATCH` (0 selisih URL untuk seluruh 9 peran).
- **Kesimpulan**: Tidak ada pelonggaran tes atau manipulasi hasil agar lulus.

---

### C. Jalur Login Demo di Lingkungan Produksi
- **Tingkat Keparahan**: RENDAH (Terkunci Rapat / Fail-Closed)
- **Fakta**:
  1. Seluruh jalur demo dipagari oleh `allowDemo = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_AUTH === 'true'`.
  2. Di `src/modules/identity/actions.ts`:
     - Tombol login dev/demo ditolak saat `!allowDemo` (`actionFailure(403, 'Akses ditolak...')`).
     - Pemetaan identifier demo ditolak saat `!allowDemo`.
     - Tidak ada percobaan retry password demo (`Password123!`) jika `!allowDemo`.
  3. Di `src/modules/identity/current-user.ts`:
     - Pembacaan cookie demo `demo_session` diabaikan jika `!allowDemo`.
     - Cookie `active_role` ditolak jika tidak ada di daftar peran database pengguna asli.
     - Mode offline demo dinonaktifkan di production (`status.mode === 'offline' && !allowDemo` $\rightarrow$ `return null`).
  4. Di `src/app/(auth)/login/login-dev-mode.tsx`:
     - Elemen UI Mode Pengembang tidak dirender saat `process.env.NODE_ENV === 'production'` kecuali jika `ALLOW_DEMO_AUTH === 'true'`.
  5. Pengujian vitest `tests/demo-prod-gating.test.ts` (seluruh skenario pengujian) berhasil 100%.
- **Kesimpulan**: Tidak ada kebocoran jalur demo di environment produksi.

---

### D. Audit Kredensial dan Pengetatan Keamanan
- **Tingkat Keparahan**: SEDANG (Telah Dimitigasi Penuh)
- **Fakta**:
  1. Ditemukan riwayat commit `8cfa59a` yang mencantumkan kata sandi literal superadmin `w****1`.
  2. Seluruh pemanggilan kata sandi hardcode di kode produksi, berkas tes, dan dokumentasi telah diganti atau disamarkan:
     - `src/modules/identity/actions.ts`: menggunakan `process.env.SUPERADMIN_PASSWORD`.
     - `src/app/(auth)/login/page.tsx`: menggunakan `process.env.NEXT_PUBLIC_DEMO_PASSWORD`.
     - `tests/e2e/helpers.ts`: menggunakan `process.env.SUPERADMIN_PASSWORD || process.env.DEMO_PASSWORD || 'Password123!'`.
     - `tests/identity.test.ts`: menggunakan dummy string terisolasi `TestSuperAdminPass1!`.
     - `src/tests/unit/security/demo-login.test.ts`: menggunakan `'old-dev-pass'`.
     - `.env.example`: didokumentasikan variabel `SUPERADMIN_PASSWORD=""` dan `NEXT_PUBLIC_DEMO_PASSWORD=""`.
     - Pemindaian kata sandi lama (`w****1`) menghasilkan **0** pada working tree.
- **Kesimpulan**: Seluruh working tree bersih dari penulisan hardcode kata sandi.

---

### E. Uji Supabase Lokal
- **Status**: **TIDAK DIJALANKAN**
- **Alasan**: Engine container (Docker Desktop atau Podman) tidak terpasang di sistem pengguna / PATH (`docker: command not found`). Sesuai instruksi audit, pengujian lokal dilewati tanpa mengubah konfigurasi sistem mesin pengguna.
- **Dampak**: Navigasi telah terverifikasi penuh pada mode mock/fail-closed dan seluruh suite unit test serta E2E passing.

---

## 3. Matriks Guard Halaman untuk Peran Baru (Fase 1b)

Berdasarkan audit statis guard halaman (`scripts/audit-role-guards.ts` / `npm run audit:guards`), seluruh 25 menu untuk peran `PROGRAM_SECRETARY` (13 menu) dan `LAB_HEAD` (12 menu) berstatus **DIIZINKAN**:
- **DIIZINKAN**: 25 menu (0 DITOLAK-SALAH, 0 TIDAK-PASTI)
- Guard halaman terlindungi dengan `assertServerRole` atau pengecekan eksplisit `role === 'PROGRAM_SECRETARY'` / `role === 'LAB_HEAD'`, sedangkan halaman bersama (`/calendar`, `/notifications`, `/announcements`, `/settings`, `/help`, `/transparency`) terbuka untuk seluruh peran portal.

---

## 4. Tabel Pemindaian Pola Kredensial (Fase 2c)

Hasil pemindaian ekspresi reguler terhadap kredensial di direktori `src`, `tests`, `scripts`, `docs`, `supabase`, `README.md`, dan `.env.example`:

| Kategori | Jumlah Temuan | Contoh Berkas & Baris | Pola yang Terdeteksi | Keterangan |
| --- | --- | --- | --- | --- |
| **SANDI DEMO BERSAMA** | 6 | `tests/demo-prod-gating.test.ts:82`, `tests/identity.test.ts:47` | `password: 'Pa*****!'` (12 char) | Sandi demo non-production bersama yang sah |
| **PLACEHOLDER / DUMMY TEST** | 108 | `src/lib/audit.ts:64`, `supabase/config.toml:20`, `scripts/*.mjs` | `service_role`, `dummy-anon-key`, `AnySecretPassword123!` | Placeholder konfigurasi lokal, mock token pgtap/vitest, dan RLS policies |
| **DICURIGAI NYATA (Diverifikasi Dummy)** | 39 | `src/app/api/smoke-actions/route.ts:466`, `tests/identity.test.ts:61` | `Password: 'Ka*****#'`, `env(SUPABASE_AUTH_...)` | Kata sandi dummy smoke testing dan template variabel env di config/docs |
| **RAHASIA NYATA PRODUKSI** | **0** | - | - | **Tidak ditemukan rahasia produksi sungguhan di repositori** |

---

## 5. Matriks Perbandingan Baseline vs Setelah Audit

| Metrik | Baseline (`sebelum-fix-navigasi`) | Setelah Audit Awal | Setelah Penutupan Catatan | Status |
| --- | --- | --- | --- | --- |
| Typecheck (`tsc --noEmit`) | Lolos (0 error) | Lolos (0 error) | **Lolos (0 error)** | Bersih |
| Lint (`next lint`) | Lolos (0 warning/error) | Lolos (0 warning/error) | **Lolos (0 warning/error)** | Bersih |
| Vitest (`npm test`) | 84 file lulus | 87 file lulus | **88 file lulus (769 tests)** | Bertambah (+4 file tes) |
| Audit Menu (`npm run audit:menu`) | 122/149 konsisten | 149 BERFUNGSI | **149 BERFUNGSI** (0 broken) | Konsisten |
| Audit Guard (`npm run audit:guards`) | Belum ada | Belum ada | **25/25 DIIZINKAN** (0 salah) | Terverifikasi |
| E2E Navigation (Playwright) | 0 (belum ada) | 124/124 klik menu | **149/149 klik menu lulus** (9 peran) | Terverifikasi Penuh |
| E2E Strict (Playwright) | 0 (belum ada) | 124/124 exact match | **149/149 exact match** (9 peran) | Terverifikasi Penuh |
| Demo Prod Gating (`demo-prod-gating.test.ts`) | Belum ada | 5/5 skenario | **5/5 skenario aman** (9 peran) | Terverifikasi |
| Jumlah penggunaan `any` di `src` | 659 | 659 | **659** | Terjaga (tidak bertambah) |
| Hardcode sandi lama (`w****1`) | Ada (`w****1`) | Di kode produksi: 0 | **0 di seluruh working tree** | Bersih Total |

---

## 6. Rekomendasi Tindakan Pengguna Sebelum Merge

1. **Rotasi Kata Sandi Superadmin**: Di Supabase Auth Dashboard produksi, pastikan kata sandi untuk `superadmin@siajar.ac.id` diperbarui ke kombinasi acak kuat baru (minimal 14 karakter).
2. **Setel Environment Variable di Vercel Dashboard**:
   - `ALLOW_DEMO_AUTH="false"` pada Production Environment.
   - `SUPERADMIN_PASSWORD="<kata-sandi-baru-anda>"` (opsional, jika integrasi fallback diperlukan).
3. **Uji Preview Deployment**: Buka tautan Preview Deployment dari pull request branch `fix/navigasi-menu`, lakukan login menggunakan akun dosen, mahasiswa, dan admin asli, lalu klik beberapa menu di perangkat desktop maupun seluler.
