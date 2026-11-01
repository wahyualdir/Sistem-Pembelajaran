# PR: Perbaikan Navigasi Menu Sidebar, Resolusi Peran, dan Pengamanan Akses

## 1. Judul Pull Request
`fix(nav): perbaikan navigasi menu sidebar, resolusi peran, segment matching rute, dan pengamanan kredensial`

---

## 2. Ringkasan Perubahan (TL;DR)
Perbaikan ini menuntaskan bug di mana klik pada menu sidebar SIAJAR selalu mengembalikan pengguna ke halaman beranda peran (bounce back). Perbaikan dilakukan secara menyeluruh dari lapisan resolusi peran (`current-user.ts`), pencocokan rute segmen di middleware (`matchesPrefix`), sinkronisasi status peran di header/layout, pengetatan fail-closed autentikasi demo di production, pengikatan tes otomatis E2E klik menu untuk seluruh 7 peran, serta migrasi kata sandi hardcode ke environment variable.

---

## 3. Akar Masalah yang Diselesaikan (H1 - H4)

- **H1 (Resolusi Peran Kosong/Gagal Mengembalikan Fallback Salah)**:
  Sebelumnya, kegagalan pengambilan data peran di Supabase (karena catch error yang diabaikan atau query gagal) menyebabkan `activeRole` secara diam-diam jatuh ke `'STUDENT'`. Akibatnya, dosen/admin yang login dianggap mahasiswa dan seluruh menu ditendang ke `/dashboard` mahasiswa oleh guard halaman.
  *Solusi*: Error Supabase tidak lagi ditelan, logging diagnostik ditambahkan, dan mekanisme penentuan peran default mengambil peran sah pertama dari profil basis data dengan validasi ketat.

- **H2 (Cookie `active_role` Tidak Valid / Beda Format)**:
  Nilai cookie `active_role` yang tidak valid, usang, atau berbeda format (mis. `SUPERADMIN` vs `SUPER_ADMIN`) menyebabkan penolakan akses pada rute portal.
  *Solusi*: Dibuat normalisasi format peran dua arah (`normalizeRoleValue`), sinkronisasi otomatis nilai cookie dengan peran yang sah, dan penolakan cookie manipulasi yang tidak terdaftar di akun pengguna.

- **H3 (Timeout Pemeriksaan Status Supabase Menyebabkan Bounce ke Login/Beranda)**:
  Pemeriksaan kesehatan Supabase yang timeout 1000 ms pada remote instance memicu layout portal melempar `redirect('/login')`. Di saat bersamaan, middleware melihat token sesi masih ada, sehingga terjadi pengalihan balik ke beranda.
  *Solusi*: Penyesuaian batas toleransi timeout dan fail-closed yang terkoordinasi antara layout dan middleware.

- **H4 (Pencocokan Prefix Rute Tanpa Batas Segmen)**:
  Pola `startsWith('/ta')` pada rute asisten dosen mencocokkan sembarang rute berawalan serupa seperti `/tasks` atau `/tagihan`.
  *Solusi*: Ditambahkan helper `matchesPrefix(pathname, prefix)` yang memastikan batas segmen rute `/` (contoh: `/ta` hanya cocok dengan `/ta` atau `/ta/...`).

---

## 4. Daftar Perubahan Berkas per Kelompok

### A. Navigasi & Segment Matching
- `src/lib/config/menu-config.ts`: Implementasi helper murni `matchesPrefix` untuk mencocokkan rute berbasis segmen URL.
- `src/middleware.ts`: Penggunaan `matchesPrefix` untuk pengecekan akses rute per peran.

### B. Resolusi Identitas & Peran Pengguna
- `src/modules/identity/current-user.ts`:
  - Penanganan error query Supabase secara fail-closed tanpa jatuh sembarangan ke peran lain.
  - Validasi ketat cookie `active_role` terhadap daftar peran sah di database pengguna.
  - Normalisasi nama peran (`normalizeRoleValue`).
  - Pemagaran sesi demo hanya saat `allowDemo` bernilai aktif.
- `src/modules/identity/actions.ts`:
  - Pengecekan `allowDemo` pada aksi login demo.
  - Penggantian kata sandi hardcode dengan `process.env.SUPERADMIN_PASSWORD`.

### C. Komponen Tampilan & Header Portal
- `src/components/layout/sidebar.tsx`: Penyelarasan highlight menu aktif menggunakan `matchesPrefix`.
- `src/components/layout/header.tsx`: Sinkronisasi dropdown pemilihan peran aktif dengan peran pengguna sebenarnya.
- `src/app/(auth)/login/page.tsx`: Penggantian kata sandi hardcode tombol dev dengan `NEXT_PUBLIC_DEMO_PASSWORD`.

### D. Pengujian Otomatis (E2E & Unit Test)
- `tests/e2e/menu-click-navigation.spec.ts`: Pengujian E2E klik menu sidebar untuk 7 peran (124 menu teruji).
- `tests/e2e/menu-click-strict.spec.ts`: Pengujian klik menu ketat tanpa toleransi intended redirects (124/124 exact match).
- `tests/demo-prod-gating.test.ts`: Pengujian isolasi keamanan login demo di lingkungan produksi.
- `tests/identity.test.ts` & `tests/e2e/helpers.ts`: Penyesuaian pembacaan kredensial melalui environment variables.

### E. Dokumentasi & Konfigurasi
- `.env.example`: Penambahan variabel `SUPERADMIN_PASSWORD`.
- `docs/PROGRESS_NAVIGASI.md`: Log pelaksanaan perbaikan fase 0 - 5.
- `docs/LAPORAN_AUDIT_PRA_MERGE.md`: Laporan audit teknis pra-merge.

---

## 5. Cara Menguji (Verification Checklist)

Jalankan rangkaian perintah berikut di terminal:

```powershell
# 1. Typecheck & Lint
npm run typecheck
npm run lint

# 2. Seluruh Unit Test (87 file tes)
npm test

# 3. Audit Konsistensi Menu (149 menu)
npm run audit:menu

# 4. Production Build (166 static/SSR pages)
npm run build

# 5. E2E Click Navigation Test (Playwright)
npx playwright test tests/e2e/menu-click-navigation.spec.ts tests/e2e/menu-click-strict.spec.ts
```

---

## 6. Risiko & Mitigasi

| Risiko | Kemungkinan | Dampak | Mitigasi yang Diterapkan |
| --- | --- | --- | --- |
| Cookie `active_role` pengguna lama tidak cocok dengan enum peran | Rendah | Sedang | Dilakukan normalisasi otomatis dan fallback ke peran sah pertama di basis data |
| Rute baru di masa depan terblokir middleware | Rendah | Tinggi | Aturan segment matching `matchesPrefix` fail-closed namun transparan terhadap subpath valid |
| Login demo bocor di production | Sangat Rendah | Kritis | Dipagari ketat dengan `NODE_ENV === 'production' && ALLOW_DEMO_AUTH !== 'true'` dan diverifikasi unit test |

---

## 7. Prosedur Rollback

Jika ditemukan regresi tak terduga setelah merge:
```powershell
# Rollback branch lokal ke commit sebelum perbaikan navigasi:
git reset --hard sebelum-fix-navigasi
```

---

## 8. Tindakan Manual untuk Pengguna (User Checklist)

Langkah-langkah berikut **tidak diotomasi** dan harus dilakukan oleh pengguna sendiri:
- [ ] Push branch perbaikan dan tag pengaman ke remote repository:
  ```powershell
  git push origin fix/navigasi-menu
  git push origin sebelum-fix-navigasi
  ```
- [ ] Buka **Vercel Preview Deployment** yang dihasilkan dari branch `fix/navigasi-menu`.
- [ ] Lakukan pengujian manual menggunakan akun Supabase riil (bukan akun demo) di peramban desktop dan peramban HP.
- [ ] Jika akun superadmin produksi pernah menggunakan kata sandi default lama, lakukan rotasi/pembaruan kata sandi di dashboard Supabase Auth.
- [ ] Setel environment variable `ALLOW_DEMO_AUTH="false"` di dashboard Vercel Production.
- [ ] Lakukan merge pull request ke branch utama (`main` / `master`).
