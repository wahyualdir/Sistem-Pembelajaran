# INSTRUKSI ANTIGRAVITY: Tutup Catatan Audit dan Uji Peran Baru

Letakkan di `docs/INSTRUKSI_TUTUP_CATATAN_AUDIT.md`, lalu beri perintah ke agen:

> Baca dan jalankan `docs/INSTRUKSI_TUTUP_CATATAN_AUDIT.md` secara berurutan, fase demi fase. Baca kode saat ini sebelum mengubah apa pun. Berhenti dan lapor jika ada syarat berhenti yang terpenuhi.

Konteks: audit pra-merge menyatakan "SIAP DENGAN CATATAN". Dokumen ini menutup catatan tersebut:

1. Pastikan fallback `SUPERADMIN_PASSWORD` tidak membawa sandi lama atau sandi lemah.
2. Pastikan `NEXT_PUBLIC_DEMO_PASSWORD` (yang dikirim ke browser) hanya berisi sandi demo bersama.
3. Pastikan pemindaian kredensial mencakup semua pola, bukan satu kasus.
4. Pastikan CI tidak merah setelah sandi diganti env var.
5. Uji peran `PROGRAM_SECRETARY` (13 menu) dan `LAB_HEAD` (12 menu) yang belum tercakup tes klik.
6. Koreksi dokumen: email akun superadmin yang tidak konsisten (`.test` vs `.ac.id`) dan hitungan "empat commit audit" yang sebenarnya lima.

---

## 0. Aturan main

1. **Lingkup**: kredensial/konfigurasi CI, tes, dokumen, dan penanganan dua peran baru di jalur navigasi. Dilarang menyentuh: isi `MENU_CONFIG` (label/href/ikon/urutan), skema database, `supabase/migrations/`, `prisma/schema.prisma`, desain/tema, dependensi `package.json`.
2. **Keamanan hanya boleh mengetat.** Guard tetap fail-closed. Dilarang mengaktifkan `ALLOW_DEMO_AUTH`, menghapus guard, atau membuat rute bisa diakses lebih banyak peran demi meluluskan tes.
3. **Jangan mencetak rahasia.** Di semua keluaran, log, laporan, dan pesan commit, samarkan nilai sandi/token (mis. `w****1`); cukup tulis file, baris, dan panjang string.
4. **Jangan menulis ulang riwayat git** (tanpa `filter-repo`, `rebase -i`, `push --force`). **Jangan push, merge, atau deploy**: pengguna yang menjalankan.
5. **Tanpa utang tipe baru**: dilarang menambah `any`, `@ts-ignore`, `@ts-nocheck`, `eslint-disable`. Jumlah `any` di `src` harus tetap 659 atau turun.
6. Satu perubahan = satu commit kecil berawalan `fix(security):`, `fix(nav):`, `test(nav):`, `ci:`, atau `docs(audit):`. Setelah tiap langkah jalankan `npm run typecheck && npm run lint`; setelah tiap fase jalankan juga `npm test`.
7. **Fakta, bukan asumsi**: setiap temuan menyertakan perintah dan keluarannya (disamarkan bila perlu). Jika tidak bisa diverifikasi, tulis "TIDAK TERVERIFIKASI" beserta alasannya.

**Syarat berhenti dan lapor:**
- Ditemukan rahasia yang tampak nyata (bukan sandi demo bersama) selain yang sudah diketahui.
- Peran `PROGRAM_SECRETARY` atau `LAB_HEAD` ternyata bisa mengakses rute peran lain tanpa guard, atau jatuh ke beranda mahasiswa.
- Perbaikan membutuhkan perubahan skema database atau lebih dari 15 file produksi dalam satu fase.

---

## FASE 0. Titik kembali dan baseline

```powershell
git status                                   # harus bersih; jika tidak, STOP dan laporkan
git branch --show-current                    # harus fix/navigasi-menu
git tag sebelum-penutupan-catatan
git grep -nE ": any\b|as any\b" -- src | Measure-Object -Line     # catat: harus 659
npm run typecheck; npm run lint; npm test; npm run audit:menu
```

Catat hasil baseline di `docs/PROGRESS_NAVIGASI.md` (bagian baru "Penutupan catatan audit").

---

## FASE 1. Peran `PROGRAM_SECRETARY` dan `LAB_HEAD`

Peran ini ada di `MENU_CONFIG` (13 dan 12 menu), tetapi tidak punya akun demo sehingga tidak tercakup tes klik. Pengecekan awal wajib dikerjakan sebelum menulis tes.

### 1a. Telusuri penanganan peran di jalur navigasi (read-only)

Untuk KEDUA peran, buka dan catat (kutip baris kode) bagaimana masing-masing ditangani di:

- `src/middleware.ts` dan `src/lib/auth/route-guard.ts`: apakah ada di `ROLE_PORTAL_MAP`/`PORTAL_PREFIXES`? Jika tidak, apa yang terjadi saat `activeRole` bernilai peran itu (apakah `decideRoleRedirect` mengalihkan, atau membiarkan)?
- `src/app/(auth)/workspace/page.tsx`: peta ke beranda portal. Pastikan peran ini TIDAK jatuh ke `/student` (default lama sudah dihapus pada Fase 2.1; verifikasi).
- `src/modules/identity/current-user.ts` dan `src/modules/identity/actions.ts` (`loginAction`): apakah kode peran dikenali, dinormalisasi lewat `normalizeRoleCode`, dan cookie `active_role` ditulis benar.
- `src/lib/config/menu-config.ts`: `isRouteAllowedForRole` dan `normalizeRoleCode` untuk kedua peran.
- `src/app/(portal)/layout.tsx` dan `portal-shell.tsx`: menu dan beranda yang dirender untuk kedua peran.

Hasilkan tabel: komponen x peran x perilaku (termasuk "tidak ditangani / jatuh ke default").

### 1b. Matriks guard halaman (read-only, skrip audit)

Buat `scripts/audit-role-guards.ts` (npm script `audit:guards`, tambahkan di `package.json` bagian `scripts` saja; itu satu-satunya perubahan `package.json` yang diizinkan). Skrip ini murni analisis statis:

1. Ambil semua `href` menu untuk `PROGRAM_SECRETARY` dan `LAB_HEAD` (dari `getMenuGroupsForRole`).
2. Petakan tiap `href` ke berkas `page.tsx` (abaikan route group `(...)`).
3. Ekstrak guard di halaman itu: argumen `assertServerRole(...)`, perbandingan `activeRole`/`role`, dan semua `redirect(...)` beserta kondisinya.
4. Tulis `docs/AUDIT_GUARD_PERAN_BARU.md`: tabel href x peran dengan status:
   - **DIIZINKAN**: guard memuat peran itu atau tidak ada guard peran sama sekali (tandai tanpa-guard sebagai CATATAN, bukan otomatis salah).
   - **DITOLAK-SALAH**: guard tidak memuat peran itu sehingga menu yang tampil akan terpental. Ini BUG navigasi.
   - **TIDAK-PASTI**: guard dinamis yang tidak bisa dianalisis statis (jelaskan).
5. Skrip tidak boleh mengubah berkas apa pun selain menulis laporan itu.

Commit: `chore(nav): audit statis guard halaman untuk peran baru`.

### 1c. Tes unit (tidak butuh akun demo)

Tambahkan di `tests/nav-redirect-contract.test.ts` (atau berkas baru `tests/nav-new-roles.test.ts`):

- Untuk tiap `href` menu `PROGRAM_SECRETARY` dan `LAB_HEAD`: `decideRoleRedirect({ pathname, search, activeRole: <peran>, isImpersonating: false })` harus `null` (tidak dialihkan oleh middleware).
- Kode peran tak dikenal (`'FOO'`) tidak boleh menghasilkan beranda mahasiswa.
- `normalizeRoleCode` untuk kedua peran: huruf kecil/besar, spasi, dan variasi yang masuk akal menghasilkan kode kanonik yang sama.

Jika ada yang gagal, itu temuan: jangan ubah tes agar lulus. Perbaiki kode di fase 1e.

### 1d. Tes klik e2e untuk kedua peran

1. Cek apakah akun demo untuk kedua peran sudah ada di `src/modules/identity/demo-users.ts` atau seed (mungkin ada walau tidak tercantum di README).
2. **Jika belum ada**, tambahkan dua akun demo mengikuti pola akun yang sudah ada, dengan syarat ketat:
   - hanya aktif saat `allowDemo` (`NODE_ENV !== 'production' || ALLOW_DEMO_AUTH === 'true'`), persis seperti akun demo lain;
   - memakai sandi demo bersama yang sudah ada (jangan membuat sandi baru);
   - perluas `tests/demo-prod-gating.test.ts`: pada `NODE_ENV=production` tanpa `ALLOW_DEMO_AUTH`, kedua akun baru ditolak.
3. Tambahkan keduanya ke `tests/e2e/menu-click-navigation.spec.ts` dan `tests/e2e/menu-click-strict.spec.ts` (jangan menambah `INTENDED_REDIRECTS`; jika ada redirect sengaja, harus dibuktikan dengan kutipan kode halaman).
4. Jalankan:

```powershell
npx playwright test tests/e2e/menu-click-navigation.spec.ts tests/e2e/menu-click-strict.spec.ts
```

Target: 25 menu tambahan, semua OK. Jika ada yang BUG, catat href, URL akhir, dan penyebabnya (gunakan `$env:NAV_DEBUG="1"`).

Commit: `test(nav): tes klik peran sekretaris prodi dan kepala lab`.

### 1e. Perbaikan (hanya untuk temuan 1a sampai 1d)

Perbaiki hanya yang terbukti salah, satu commit per akar masalah (`fix(nav):`), dengan tes yang mengunci. Contoh yang mungkin: peran belum ada di `ROLE_PORTAL_MAP`, peta `workspace` belum memuat peran itu, atau guard halaman belum memuat peran itu. Jangan mengubah guard menjadi lebih longgar dari yang dibutuhkan peran tersebut; jika ragu apakah peran seharusnya boleh mengakses halaman itu, JANGAN menebak: tulis di laporan sebagai pertanyaan untuk pengguna.

---

## FASE 2. Kredensial dan CI

### 2a. Fallback `SUPERADMIN_PASSWORD`

1. Temukan semua pembacaan `SUPERADMIN_PASSWORD` dan tulis nilai fallback-nya (disamarkan) beserta kondisinya:

```powershell
git grep -nI "SUPERADMIN_PASSWORD"
```

2. Buktikan: (i) fallback bukan string lama, (ii) di `NODE_ENV=production` tanpa variabel itu, login superadmin demo tidak tersedia (fail-closed) dan TIDAK jatuh ke nilai bawaan yang bisa ditebak.
3. Verifikasi working tree bersih dari sandi lama (hasil harus 0):

```powershell
git grep -c "wahyu11"
```

   Jika masih ada, ganti dengan pembacaan env/ sandi demo bersama dan laporkan. Riwayat commit tidak boleh disentuh; laporkan commit pertama yang memuatnya.
4. Prinsip yang harus dicapai: **sandi superadmin sungguhan hanya ada di Supabase dan secret platform, tidak di kode**. Akun superadmin DEMO cukup memakai sandi demo bersama. Jika implementasi sekarang belum begitu, rapikan agar begitu, dengan tes.

Commit: `fix(security): fail-closed untuk superadmin demo tanpa env`.

### 2b. `NEXT_PUBLIC_DEMO_PASSWORD`

Variabel `NEXT_PUBLIC_*` dibundel ke browser dan terlihat semua pengunjung.

1. Cari semua pemakaiannya (`git grep -nI "NEXT_PUBLIC_DEMO_PASSWORD"`), terutama `src/app/(auth)/login/page.tsx`.
2. Pastikan nilainya yang boleh dipakai hanya sandi demo bersama. Pastikan panel/petunjuk akun demo di halaman login TIDAK tampil di production kecuali `ALLOW_DEMO_AUTH==='true'`. Jika tampil, ketatkan kondisinya dan beri tes.
3. Tambahkan komentar singkat di `.env.example` pada variabel itu: "terlihat publik; jangan isi dengan sandi sungguhan".

Commit: `fix(security): panel dan sandi demo hanya di non-production`.

### 2c. Pindai kredensial lengkap

1. Buka `docs/LAPORAN_AUDIT_PRA_MERGE.md` bagian D. Jika tidak memuat tabel hasil pindai pola kredensial lain, jalankan ulang (tanpa mencetak nilai):

```powershell
git grep -nIiE "(password|passwd|sandi|secret|token|api[_-]?key)\s*[:=]\s*['\"][^'\"]{6,}['\"]" -- src tests scripts docs README.md supabase .env.example
git grep -nIE "(eyJ[A-Za-z0-9_-]{20,}|sk_[A-Za-z0-9]{16,}|service_role)" -- src tests scripts docs README.md supabase .env.example
```

2. Klasifikasikan tiap temuan: PLACEHOLDER / SANDI DEMO BERSAMA / DICURIGAI NYATA (file, baris, panjang, ada di riwayat atau tidak). Tambahkan tabelnya ke laporan audit (nilai disamarkan).
3. Jika ada DICURIGAI NYATA selain yang sudah diketahui, hentikan dan laporkan.

### 2d. CI tidak boleh merah

1. Baca `.github/workflows/ci.yml`. Tentukan job mana yang menjalankan Playwright atau tes yang membaca `SUPERADMIN_PASSWORD`/`NEXT_PUBLIC_DEMO_PASSWORD`.
2. Pastikan variabel yang dibutuhkan tersedia di job itu:
   - untuk mode demo di CI, pakai sandi demo bersama sebagai nilai `env:` biasa (bukan secret sungguhan);
   - jangan memasukkan sandi superadmin sungguhan ke workflow, dan jangan mengandalkan GitHub Secrets untuk tes demo (PR dari fork tidak menerima secrets, sehingga CI merah).
3. Verifikasi secara lokal bahwa tes e2e lulus dengan HANYA variabel yang tertulis di workflow (bersihkan variabel lingkungan lokal lebih dulu, mis. dengan membuka shell baru dan menjalankan `npx playwright test` setelah menyalin hanya `env:` dari workflow).
4. Jangan menjalankan atau memicu CI dari sini; cukup pastikan konfigurasi dan hasil lokal.

Commit: `ci: sediakan env demo untuk tes e2e`.

---

## FASE 3. Koreksi dokumen

1. Email superadmin: bandingkan `README.md`, `src/modules/identity/demo-users.ts`, `tests/e2e/helpers.ts`, `docs/PR_NAVIGASI.md`, dan `docs/LAPORAN_AUDIT_PRA_MERGE.md`. Seragamkan ke email yang benar-benar dipakai akun demo (`superadmin@siajar.ac.id` menurut README). Perbaiki hanya dokumen yang salah; jangan mengubah kode demi dokumen.
2. Hitungan commit: perbaiki "empat commit audit" menjadi jumlah yang benar di laporan audit dan PR.
3. Perbarui `docs/PR_NAVIGASI.md`: tambahkan bagian "Peran Sekretaris Prodi dan Kepala Lab", "Perubahan kredensial/env (wajib diketahui reviewer)", dan daftar env yang harus diset di Vercel dan CI.
4. Perbarui `docs/PROGRESS_NAVIGASI.md` dengan SHA tiap langkah di dokumen ini.

Commit: `docs(audit): koreksi laporan dan perbarui bahan PR`.

---

## VERIFIKASI AKHIR

```powershell
npm run typecheck
npm run lint
npm test
npm run audit:menu
npm run audit:guards
npm run build
npx playwright test tests/e2e/menu-click-navigation.spec.ts tests/e2e/menu-click-strict.spec.ts
git grep -nE ": any\b|as any\b" -- src | Measure-Object -Line     # tidak boleh naik dari 659
git grep -c "wahyu11"                                              # harus 0 di working tree
```

**Kriteria selesai (semua wajib):**
1. Tes klik lulus untuk 9 peran (149 menu), 0 BUG.
2. Tidak ada entri `INTENDED_REDIRECTS` tanpa dasar kode.
3. `docs/AUDIT_GUARD_PERAN_BARU.md` tidak memuat status DITOLAK-SALAH yang belum diselesaikan atau dijelaskan.
4. Sandi lama tidak ada di working tree; fallback fail-closed di production dibuktikan tes.
5. Konfigurasi CI memuat semua env yang dibutuhkan tes dan tes lulus lokal hanya dengan env itu.
6. Jumlah `any` tidak naik; typecheck, lint, test, audit menu, dan build lolos.

---

## ROLLBACK

| Kebutuhan | Perintah |
| --- | --- |
| Batalkan satu langkah | `git revert <sha-commit>` |
| Batalkan seluruh tugas ini | `git reset --hard sebelum-penutupan-catatan` (perbaikan navigasi dan audit sebelumnya tetap utuh) |
| Lihat semua perubahan tugas ini | `git diff sebelum-penutupan-catatan..HEAD --stat` |

Tugas ini tidak menyentuh basis data, jadi rollback kode sudah cukup.

---

## LAPORAN AKHIR (format wajib dari agen)

1. Hasil Fase 1: tabel penanganan peran baru (komponen x peran), ringkasan matriks guard (jumlah DIIZINKAN / DITOLAK-SALAH / TIDAK-PASTI), hasil tes klik 25 menu tambahan, dan daftar perbaikan beserta bukti.
2. Hasil Fase 2: status 2a sampai 2d masing-masing (selesai / ada temuan), tabel pindai kredensial (disamarkan).
3. Pertanyaan untuk pengguna yang tidak boleh ditebak agen (mis. izin akses peran baru ke halaman tertentu).
4. Daftar commit (SHA + deskripsi) dan daftar file yang diubah (produksi / tes / konfigurasi / dokumen).
5. Hasil semua perintah verifikasi akhir, termasuk jumlah `any`.
6. Hal yang TIDAK TERVERIFIKASI dan apa yang dibutuhkan untuk memverifikasinya.
7. Tindakan yang harus dilakukan pengguna sendiri: rotasi sandi superadmin di Supabase production, set `ALLOW_DEMO_AUTH=false` di Vercel, uji Preview Deployment dengan akun asli, dan push branch serta tag.
