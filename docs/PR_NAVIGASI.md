# PR: Perbaikan Navigasi Menu Sidebar, Resolusi Peran, dan Pengamanan Akses

## 1. Judul Pull Request
`fix(nav): perbaikan navigasi menu sidebar, resolusi peran, segment matching rute, pengujian 9 peran (149 menu), dan pengamanan kredensial`

---

## 2. Ringkasan Perubahan (TL;DR)
Perbaikan ini menuntaskan bug navigasi di mana klik pada menu sidebar SIAJAR mengembalikan pengguna ke halaman beranda peran (bounce back). Perbaikan diselesaikan secara menyeluruh di seluruh lapisan:
1. **Resolusi Peran**: Mencegah silent fallback ke `STUDENT`, menangani error Supabase secara fail-closed, dan menyelaraskan normalisasi kode peran.
2. **Segment Matching Rute**: Penggunaan helper `matchesPrefix` pada middleware dan guard portal untuk mencegah false-positive prefix match (seperti `/ta` terhadap `/tasks`).
3. **Cakupan 9 Peran Penuh (149 Menu)**: Menguji seluruh 9 peran di sistem SIAJAR, termasuk dua peran baru `PROGRAM_SECRETARY` (13 menu) dan `LAB_HEAD` (12 menu), membuktikan 100% exact match tanpa mental.
4. **Pengamanan Akses & Kredensial**: Mengisolasi login demo dan mode pengembang hanya untuk lingkungan non-production (atau `ALLOW_DEMO_AUTH="true"`), menghapus seluruh hardcode sandi lama dari working tree, dan mengonfigurasi environment variables yang aman untuk CI dan Vercel.

---

## 3. Akar Masalah yang Diselesaikan (H1 - H4)

- **H1 (Resolusi Peran Kosong/Gagal Mengembalikan Fallback Salah)**:
  Sebelumnya, kegagalan kueri `user_roles` di Supabase menyebabkan `activeRole` secara diam-diam jatuh ke `'STUDENT'`. Akibatnya, dosen/admin yang login dianggap mahasiswa dan seluruh menunya ditendang ke `/dashboard` mahasiswa oleh guard halaman.
  *Solusi*: Error Supabase tidak lagi ditelan, logging diagnostik ditambahkan, dan mekanisme penentuan peran default mengambil peran sah pertama dari database pengguna dengan validasi ketat.

- **H2 (Cookie `active_role` Tidak Valid / Beda Format)**:
  Nilai cookie `active_role` yang usang, memiliki spasi, atau berbeda format (mis. `SUPERADMIN` vs `SUPER_ADMIN`, `sekprodi` vs `PROGRAM_SECRETARY`) menyebabkan penolakan akses pada rute portal.
  *Solusi*: Dibuat normalisasi format peran dua arah (`normalizeRoleCode`), pembersihan spasi dan underscore, sinkronisasi otomatis nilai cookie dengan peran sah di database, dan penolakan cookie manipulasi.

- **H3 (Timeout Pemeriksaan Status Supabase Menyebabkan Bounce ke Login/Beranda)**:
  Pemeriksaan kesehatan Supabase yang timeout 1000 ms pada remote instance memicu layout portal melempar `redirect('/login')`. Di saat bersamaan, middleware melihat token sesi masih ada, sehingga terjadi pengalihan balik ke beranda.
  *Solusi*: Penyesuaian batas toleransi timeout (3000 ms remote) dan fail-closed yang terkoordinasi antara layout dan middleware.

- **H4 (Pencocokan Prefix Rute Tanpa Batas Segmen)**:
  Pola `startsWith('/ta')` pada rute asisten dosen mencocokkan rute apa pun yang diawali karakter tersebut seperti `/tasks` atau `/tagihan`.
  *Solusi*: Ditambahkan helper `matchesPrefix(pathname, prefix)` yang memastikan batas segmen rute `/` (contoh: `/ta` hanya cocok dengan `/ta` atau `/ta/...`).

---

## 4. Peran Sekretaris Prodi dan Kepala Lab

Dua peran baru pada arsitektur SIAJAR telah diverifikasi secara penuh:
- **Sekretaris Program Studi (`PROGRAM_SECRETARY`)**: Memiliki 13 menu navigasi (10 menu portal akademik prodi + 3 menu shared support). Seluruh guard halaman (`page.tsx`) terbukti mengizinkan peran ini (`assertServerRole(['PROGRAM_SECRETARY'])`). Beranda portal berada di `/secretary`.
- **Kepala Laboratorium (`LAB_HEAD`)**: Memiliki 12 menu navigasi (9 menu portal praktikum & lab + 3 menu shared support). Seluruh guard halaman terbukti mengizinkan peran ini (`assertServerRole(['LAB_HEAD'])`). Beranda portal berada di `/lab`.
- **Hasil Pengujian**: Keduanya terintegrasi di `tests/e2e/menu-click-navigation.spec.ts` dan `tests/e2e/menu-click-strict.spec.ts` dengan status **25/25 EXACT_MATCH** (0 bug, 0 pengalihan tak disengaja).

---

## 5. Perubahan Kredensial & Environment Variables (Wajib Diketahui Reviewer)

1. **Pembersihan Sandi Hardcode**:
   - Seluruh penulisan kata sandi literal lama (`w****1`) telah dihapus total dari kode sumber dan dokumentasi (pemindaian kata sandi lama menghasilkan 0).
   - Penggantian dilakukan menggunakan variabel lingkungan `SUPERADMIN_PASSWORD` dan `NEXT_PUBLIC_DEMO_PASSWORD`.
2. **Pencegahan Kebocoran di Production**:
   - Komponen UI `LoginDevMode` (mode pengembang di halaman login) dipagari ketat agar tidak pernah tampil di production kecuali flag `ALLOW_DEMO_AUTH="true"` disetel.
   - Fallback offline demo ditolak total saat `NODE_ENV === 'production' && ALLOW_DEMO_AUTH !== 'true'`.
   - Percobaan login live Supabase tidak lagi melakukan retry diam-diam dengan password demo di production.

---

## 6. Daftar Environment Variables untuk Vercel & CI

### Matriks Pengaturan Environment Variables Vercel

| Variabel | Production | Preview | Keterangan |
| --- | --- | --- | --- |
| `ALLOW_DEMO_AUTH` | **tidak diset** | **tidak diset** (kecuali Preview memakai project Supabase TERPISAH tanpa data nyata) | Menutup total seluruh jalur login akun demo sintetis. |
| `SUPERADMIN_PASSWORD` | **tidak diset** | **tidak diset** | Hanya untuk akun superadmin DEMO. JANGAN diset di Production/Preview. Sandi superadmin sungguhan hanya ada di Supabase Auth. |
| `NEXT_PUBLIC_DEMO_PASSWORD` | **tidak diset** | **tidak diset** | Terekspos ke klien; jangan pernah isi dengan kredensial nyata. |

> [!WARNING] Catatan Keamanan Vercel Preview
> Preview di Vercel dapat diakses siapa pun yang tahu URL-nya, dan secara bawaan bisa mewarisi environment variables Production. Karena itu, mengaktifkan `ALLOW_DEMO_AUTH=true` dengan kunci Supabase production berarti akun demo bisa membuka data nyata. Biarkan ketiga variabel di atas tidak diset baik di Production maupun di Preview default.

### Lingkungan CI / Automated Testing (GitHub Actions)
| Variabel | Nilai di CI Workflow | Keterangan |
| --- | --- | --- |
| `ALLOW_DEMO_AUTH` | `'true'` | Mengizinkan suite pengujian E2E Playwright login sebagai akun demo. |
| `DEMO_PASSWORD` | `'Password123!'` | Kata sandi akun demo non-production bersama. |
| `SUPERADMIN_PASSWORD` | `'Password123!'` | Kata sandi demo superadmin untuk pengujian CI (bukan sandi produksi). |
| `NEXT_PUBLIC_DEMO_PASSWORD` | `'Password123!'` | Kata sandi demo untuk komponen login client. |

---

## 7. Daftar Perubahan Berkas per Kelompok

### A. Navigasi & Segment Matching
- `src/lib/config/menu-config.ts`: Implementasi helper murni `matchesPrefix`, normalisasi kode peran (`normalizeRoleCode`) dengan pembersihan spasi/case, default home `/workspace` untuk peran tak dikenal.
- `src/lib/auth/route-guard.ts`: Penegakan batas segmen rute per peran dan fallback aman `/workspace` untuk peran tak dikenal.
- `src/middleware.ts`: Penggunaan `matchesPrefix` untuk pengecekan akses rute per peran.

### B. Resolusi Identitas & Peran Pengguna
- `src/modules/identity/current-user.ts`:
  - Penanganan error query Supabase secara fail-closed tanpa jatuh ke `STUDENT`.
  - Validasi ketat cookie `active_role` terhadap daftar peran sah di database pengguna.
  - Pemagaran sesi demo hanya saat `allowDemo` bernilai aktif.
- `src/modules/identity/actions.ts`:
  - Pengecekan `allowDemo` pada aksi login demo.
  - Penggantian kata sandi hardcode dengan `process.env.SUPERADMIN_PASSWORD`.
  - Eliminasi retry password demo di production.
- `src/app/(auth)/workspace/page.tsx`: Penambahan `PROGRAM_SECRETARY` dan `LAB_HEAD` ke `ALL_SYSTEM_ROLES`.
- `src/app/(auth)/login/login-dev-mode.tsx`: Pemagaran komponen mode pengembang agar tidak tampil di production.

### C. Pengujian Otomatis (E2E & Unit Test)
- `tests/e2e/menu-click-navigation.spec.ts`: Pengujian E2E klik menu sidebar untuk **9 peran** (**149 menu** teruji).
- `tests/e2e/menu-click-strict.spec.ts`: Pengujian klik menu ketat tanpa toleransi intended redirects (**149/149 exact match**).
- `tests/demo-prod-gating.test.ts`: Pengujian isolasi keamanan login demo di lingkungan produksi (mencakup 9 peran).
- `tests/nav-new-roles.test.ts`: Pengujian kontrak navigasi dan normalisasi peran baru serta isolasi peran tak dikenal.
- `scripts/audit-role-guards.ts` (`npm run audit:guards`): Skrip audit statis guard halaman peran baru.

### D. Konfigurasi CI & Dokumentasi
- `.github/workflows/ci.yml`: Penyediaan environment variables demo aman untuk pengujian otomatis di GitHub Actions.
- `.env.example`: Penambahan template `SUPERADMIN_PASSWORD` dan `NEXT_PUBLIC_DEMO_PASSWORD`.
- `docs/AUDIT_GUARD_PERAN_BARU.md`: Laporan audit guard halaman untuk `PROGRAM_SECRETARY` dan `LAB_HEAD`.
- `docs/LAPORAN_AUDIT_PRA_MERGE.md`: Laporan teknis pra-merge lengkap.
- `docs/PROGRESS_NAVIGASI.md`: Log progres implementasi dan penutupan catatan audit.

---

## 8. Cara Menguji (Verification Checklist)

Jalankan rangkaian perintah berikut di terminal:

```powershell
# 1. Typecheck & Lint
npm run typecheck
npm run lint

# 2. Seluruh Unit Test (88 file tes, 769 unit tests)
npm test

# 3. Audit Konsistensi Menu (149 menu) & Guard Peran Baru (25 menu)
npm run audit:menu
npm run audit:guards

# 4. Production Build (166 static/SSR pages)
npm run build

# 5. E2E Click Navigation Test (Playwright - 9 peran / 149 menu)
npx playwright test tests/e2e/menu-click-navigation.spec.ts tests/e2e/menu-click-strict.spec.ts
```

---

## 9. Prosedur Rollback

Jika ditemukan kendala setelah merge:
```powershell
# Rollback branch lokal ke commit sebelum penutupan catatan audit:
git reset --hard sebelum-penutupan-catatan

# Rollback total ke titik awal sebelum perbaikan navigasi:
git reset --hard sebelum-fix-navigasi
```

---

## 10. Tindakan Manual untuk Pengguna (User Checklist)

Langkah-langkah berikut **tidak diotomasi** dan harus dilakukan oleh pengguna sendiri:
- [ ] Push branch perbaikan dan tag pengaman ke remote repository:
  ```powershell
  git push origin fix/navigasi-menu
  git push origin sebelum-fix-navigasi
  git push origin sebelum-penutupan-catatan
  ```
- [ ] Buka **Vercel Preview Deployment** yang dihasilkan dari branch `fix/navigasi-menu`.
- [ ] Lakukan pengujian manual menggunakan akun Supabase riil (bukan akun demo) di peramban desktop dan peramban ponsel.
- [ ] Jika akun superadmin produksi (`superadmin@siajar.ac.id`) pernah menggunakan kata sandi default lama, lakukan pembaruan kata sandi di dashboard Supabase Auth.
- [ ] Setel environment variable `ALLOW_DEMO_AUTH="false"` di dashboard Vercel Production.
- [ ] Lakukan merge pull request ke branch utama (`main` / `master`).
