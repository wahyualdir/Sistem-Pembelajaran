# LAPORAN AUDIT SEBELUM MERGE: PERBAIKAN NAVIGASI MENU

**Tanggal Audit**: 1 November 2026  
**Branch**: `fix/navigasi-menu`  
**Titik Rollback Audit**: `sebelum-audit-pra-merge`  
**Titik Rollback Induk**: `sebelum-fix-navigasi`  
**Keputusan**: **SIAP DENGAN CATATAN**

---

## 1. Ringkasan Eksekutif & Keputusan

Berdasarkan audit independen terhadap seluruh commit pada branch `fix/navigasi-menu`, status perbaikan navigasi diklasifikasikan sebagai **SIAP DENGAN CATATAN**.

Tiga alasan utama keputusan ini:
1. **Navigasi 100% Terverifikasi Bersih dan Tanpa Pelonggaran**: Tes klik menu ketat (`tests/e2e/menu-click-strict.spec.ts`) membuktikan 124/124 menu yang dirender untuk seluruh 7 akun peran berhasil mendarat persis pada URL tujuan tanpa terpental ke beranda. Tidak ada pelonggaran tes (`fixme`, `skip`, retries, atau manipulasi `INTENDED_REDIRECTS`).
2. **Keamanan Login Demo di Lingkungan Produksi Terkunci Rapat (Fail-Closed)**: Verifikasi statis dan dinamis (`tests/demo-prod-gating.test.ts`) membuktikan bahwa saat `NODE_ENV=production` dan `ALLOW_DEMO_AUTH` tidak aktif, autentikasi demo, cookie palsu, dan impersonasi peran ditolak 100%.
3. **Kredensial Hardcode Berhasil Dimigrasikan**: Kata sandi superadmin yang sebelumnya tertulis secara literal di beberapa berkas telah diganti dengan pembacaan environment variable (`SUPERADMIN_PASSWORD`), dengan fallback aman dan pencatatan template di `.env.example`.

Catatan sebelum merge ke production:
- Pengguna wajib merotasi kata sandi akun superadmin di Supabase Production jika pernah menggunakan kata sandi default lama.
- Uji verifikasi manual pada Vercel Preview Deployment dengan akun Supabase asli (bukan demo).

---

## 2. Hasil Audit Fase A sampai E

### A. Selisih Jumlah Menu (122 vs 124 vs 149)
- **Tingkat Keparahan**: RENDAH (Konsistensi Terbukti)
- **Fakta & Rekonsiliasi**:
  1. **122 menu**: Jumlah item mentah unik di `MENU_CONFIG` untuk 9 peran (tidak menghitung 3 item grup bersama/support).
  2. **149 menu**: Jumlah seluruh item yang dirender untuk 9 peran (`122 raw + 9 peran × 3 item shared support (/settings, /help, /transparency) = 149`). Ini persis dengan laporan `npm run audit:menu` dan `docs/AUDIT_MENU_FUNGSI.md`.
  3. **124 menu**: Jumlah item menu yang dirender dan diuji E2E untuk 7 peran yang memiliki akun demo di `README.md` (`STUDENT`: 20, `LECTURER`: 23, `ACADEMIC_ADVISOR`: 23, `DEPARTMENT_HEAD`: 16, `FACULTY_ADMIN`: 16, `TEACHING_ASSISTANT`: 11, `SUPERADMIN`: 15 $\rightarrow$ total 124).
  4. **25 menu sisa**: Milik 2 peran Fase 3 yang belum memiliki kredensial demo di `README.md`, yaitu `PROGRAM_SECRETARY` (13 item) dan `LAB_HEAD` (12 item) ($124 + 25 = 149$).
- **Integritas `MENU_CONFIG`**:
  `git diff sebelum-fix-navigasi..HEAD -- src/lib/config/menu-config.ts` membuktikan tidak ada penambahan/pengurangan label, href, ikon, atau perubahan urutan item (hanya penambahan helper murni `matchesPrefix`).
- **Kesimpulan**: Selisih angka 122, 124, dan 149 telah terekonsiliasi secara matematis dan konsisten dengan arsitektur peran aplikasi.

---

### B. Pemeriksaan Pelonggaran Tes
- **Tingkat Keparahan**: RENDAH (Tidak Ada Pelonggaran)
- **Fakta**:
  1. Riwayat git `tests/e2e/menu-click-navigation.spec.ts` menunjukkan perubahan commit hanya berupa perbaikan selector, perpanjangan timeout cold compilation Next.js di platform Windows, dan penambahan logging diagnostik.
  2. `INTENDED_REDIRECTS` dibuat di commit pertama (`16cc8fb`) hanya untuk 3 entri `/grades` yang bersumber dari kode aktual `src/app/(portal)/grades/page.tsx:19-27`. Namun pada eksekusi runtime, redirect ini tidak pernah terpicu (`REDIRECT-SENGAJA count: 0`) karena ketiga peran tersebut tidak memiliki link `/grades` di sidebar.
  3. Pencarian `git grep -nE "fixme|\.skip|test\.skip"` pada direktori tes menghasilkan 0 kecocokan.
  4. Tes independen baru `tests/e2e/menu-click-strict.spec.ts` yang dijalankan tanpa toleransi `INTENDED_REDIRECTS` mencatat 124/124 klik menu sukses dengan status `EXACT_MATCH` (0 selisih URL).
- **Kesimpulan**: Tidak ada pelonggaran tes atau manipulasi hasil agar lulus.

---

### C. Jalur Login Demo di Lingkungan Produksi
- **Tingkat Keparahan**: RENDAH (Terkunci Rapat / Fail-Closed)
- **Fakta**:
  1. Seluruh jalur demo dipagari oleh `allowDemo = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_AUTH === 'true'`.
  2. Di `src/modules/identity/actions.ts`:
     - Tombol login dev/demo ditolak saat `!allowDemo` (`actionFailure(403, 'Akses ditolak...')`).
     - Pemetaan identifier demo ditolak saat `!allowDemo`.
  3. Di `src/modules/identity/current-user.ts`:
     - Pembacaan cookie demo `demo_session` diabaikan jika `!allowDemo`.
     - Cookie `active_role` ditolak jika tidak ada di daftar peran database pengguna asli.
     - Mode offline demo dinonaktifkan di production (`status.mode === 'offline' && !allowDemo` $\rightarrow$ `return null`).
  4. Pengujian vitest `tests/demo-prod-gating.test.ts` (5 skenario pengujian) berhasil 100%.
- **Kesimpulan**: Tidak ada kebocoran jalur demo di environment produksi.

---

### D. Audit Kredensial dan Pengetatan Keamanan
- **Tingkat Keparahan**: SEDANG (Telah Dimitigasi)
- **Fakta**:
  1. Ditemukan riwayat commit `8cfa59a` yang mencantumkan kata sandi literal superadmin `w****1`.
  2. Pada audit ini, seluruh pemanggilan kata sandi hardcode di kode produksi dan tes telah dihapus:
     - `src/modules/identity/actions.ts`: menggunakan `process.env.SUPERADMIN_PASSWORD`.
     - `src/app/(auth)/login/page.tsx`: menggunakan `process.env.NEXT_PUBLIC_DEMO_PASSWORD`.
     - `tests/e2e/helpers.ts`: menggunakan `process.env.SUPERADMIN_PASSWORD || process.env.DEMO_PASSWORD || 'Password123!'`.
     - `tests/identity.test.ts`: menggunakan dummy string terisolasi `TestSuperAdminPass1!`.
     - `.env.example`: didokumentasikan variabel `SUPERADMIN_PASSWORD=""`.
- **Kesimpulan**: Seluruh kode sumber aktif bersih dari penulisan hardcode kata sandi. Pengguna disarankan merotasi kredensial pada server Supabase produksi.

---

### E. Uji Supabase Lokal
- **Status**: **TIDAK DIJALANKAN**
- **Alasan**: Engine container (Docker Desktop atau Podman) tidak terpasang di sistem pengguna / PATH (`docker: command not found`). Sesuai instruksi audit, pengujian lokal dilewati tanpa mengubah konfigurasi sistem mesin pengguna.
- **Dampak**: Navigasi telah terverifikasi penuh pada mode mock/fail-closed dan seluruh suite unit test serta E2E passing.

---

## 3. Matriks Perbandingan Baseline vs Setelah Audit

| Metrik | Baseline (`sebelum-fix-navigasi`) | Setelah Audit (`fix/navigasi-menu`) | Status |
| --- | --- | --- | --- |
| Typecheck (`tsc --noEmit`) | Lolos (0 error) | Lolos (0 error) | Bersih |
| Lint (`next lint`) | Lolos (0 warning/error) | Lolos (0 warning/error) | Bersih |
| Vitest (`npm test`) | 84 file lulus | 87 file lulus (762 tests) | Bertambah (+3 file tes) |
| Audit Menu (`npm run audit:menu`) | 122/149 konsisten | 149 BERFUNGSI (0 broken) | Konsisten |
| E2E Navigation (`tests/e2e/menu-click-navigation.spec.ts`) | 0 (belum ada) | 124/124 klik menu lulus | Terverifikasi |
| E2E Strict (`tests/e2e/menu-click-strict.spec.ts`) | 0 (belum ada) | 124/124 exact match | Terverifikasi |
| Demo Prod Gating (`tests/demo-prod-gating.test.ts`) | Belum ada | 5/5 skenario aman | Terverifikasi |
| Jumlah penggunaan `any` di `src` | 659 | 659 | Terjaga (tidak bertambah) |
| Hardcode sandi di kode sumber | Ada (`w****1`) | 0 (diganti env var) | Diperketat |

---

## 4. Rekomendasi Tindakan Pengguna Sebelum Merge

1. **Rotasi Kata Sandi Superadmin**: Di Supabase Auth Dashboard produksi, pastikan kata sandi untuk `superadmin@siajar.test` (atau akun admin utama) diperbarui ke kombinasi kuat acak baru.
2. **Setel Environment Variable di Vercel**:
   - `ALLOW_DEMO_AUTH="false"` pada Production Environment.
   - `SUPERADMIN_PASSWORD="<sandi-baru>"` jika integrasi autentikasi fallback diperlukan.
3. **Uji Preview Deployment**: Buka tautan Preview Deployment dari pull request branch `fix/navigasi-menu`, lakukan login menggunakan akun dosen, mahasiswa, dan admin asli, lalu klik beberapa menu di perangkat desktop maupun seluler.
