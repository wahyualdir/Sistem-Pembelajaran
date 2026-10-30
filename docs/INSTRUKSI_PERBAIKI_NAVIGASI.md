# INSTRUKSI ANTIGRAVITY: Perbaikan Navigasi Menu (Menu Selalu Kembali ke Beranda)

Letakkan file ini di `docs/INSTRUKSI_PERBAIKI_NAVIGASI.md`, lalu beri perintah ke agen:

> Baca dan jalankan `docs/INSTRUKSI_PERBAIKI_NAVIGASI.md` secara berurutan, fase demi fase. Jangan lompat fase. Berhenti dan lapor jika ada syarat berhenti yang terpenuhi.

---

## 0. Masalah

Gejala dari pengguna: **menekan menu mana pun di sidebar, halaman tetap berada di beranda** (tidak pindah ke menu yang dipilih).

Hasil review kode sebelumnya (belum direproduksi di runtime, jadi semua ini masih HIPOTESIS):

| Fakta yang sudah diverifikasi lewat kode | Artinya |
| --- | --- |
| Simulasi logika `src/middleware.ts` terhadap seluruh link menu 7 peran: 0 menu dialihkan, selama cookie `active_role` cocok dengan peran pengguna | Daftar menu dan middleware konsisten. Penyebab ada di sesi/peran atau di guard halaman |
| Puluhan halaman menu memakai pola "jika `activeRole` bukan peran X, `redirect()` ke beranda peran itu" | Jika `activeRole` salah, SEMUA menu terpental ke beranda |
| `src/modules/identity/current-user.ts`: jika daftar peran kosong, `activeRole` jatuh diam-diam ke `'STUDENT'`; jika cookie `active_role` tidak ada di daftar peran, dipakai peran pertama dari database | Penyebab utama yang dicurigai (H1, H2) |
| Query `user_roles` di `current-user.ts` memakai `catch {}` dan mengabaikan `error` dari Supabase | Kegagalan query tampak sebagai "tidak punya peran" (H1) |
| `src/lib/supabase/status.ts`: cek kesehatan Supabase timeout 1000 ms untuk URL remote, hasil gagal di-cache 30 detik | Di deploy bisa acak: `getCurrentUserWithRoles()` mengembalikan `null` -> layout `redirect('/login')` -> middleware melihat pengguna masih login -> dilempar ke beranda (H3) |
| `startsWith('/ta')` dipakai tanpa batas segmen di middleware dan `isRouteAllowedForRole` | Cocok juga dengan path seperti `/tasks`, `/tagihan` (H4, risiko laten) |
| `tests/e2e/*.spec.ts` memakai `page.goto()` (navigasi penuh), tidak ada yang MENGKLIK link sidebar | Bug navigasi klik tidak pernah tertangkap tes (celah tes) |

Hipotesis:

- **H1**: daftar peran kosong/gagal dimuat, `activeRole` menjadi `STUDENT`, halaman non-mahasiswa menendang pengguna ke beranda.
- **H2**: cookie `active_role` tidak cocok dengan peran di database (basi, beda penulisan seperti `SUPERADMIN` vs `SUPER_ADMIN`, atau bernilai `undefined`).
- **H3**: cek kesehatan Supabase timeout saat render halaman, pengguna dianggap tidak login, lalu terjadi bounce `/login` -> beranda.
- **H4**: pencocokan prefix path tanpa batas segmen.

**ATURAN UTAMA: jangan menyimpulkan penyebab sebelum Fase 1 memberi bukti.** Jika tidak ada hipotesis yang terbukti, BERHENTI dan laporkan bukti yang terkumpul. Jangan menebak lalu menambal.

---

## 1. Aturan main (wajib dipatuhi seluruh fase)

1. **Lingkup**: hanya navigasi, resolusi peran, dan guard rute. Dilarang menyentuh: desain/tema/warna, isi `MENU_CONFIG` (label, href, ikon), skema database, `supabase/migrations/`, `prisma/schema.prisma`, `.env*`, dependensi `package.json`.
2. **Keamanan tidak boleh melonggar.** Guard harus tetap fail-closed. Dilarang "memperbaiki" bug dengan membuat rute bisa diakses semua peran, menghapus guard, atau mengaktifkan `ALLOW_DEMO_AUTH`.
3. **Tanpa utang tipe baru**: dilarang menambah `any`, `@ts-ignore`, `@ts-nocheck`, `eslint-disable`. Catat jumlah `any` sebelum dan sesudah (baseline review: 648).
4. **Satu perubahan = satu commit kecil** dengan awalan `fix(nav):`, `test(nav):`, atau `chore(nav):`, agar bisa di-revert satuan.
5. **Perilaku lama dikunci dulu dengan tes** (characterization test) sebelum kode diubah.
6. Setelah setiap sub-langkah jalankan: `npm run typecheck && npm run lint`. Setelah setiap fase jalankan juga `npm test` dan `npm run audit:menu`.
7. **Jangan mengarang data/akun/URL.** Pakai akun demo di `README.md`. Jika butuh informasi yang tidak ada, tanyakan, jangan asumsikan.
8. Catat semua kemajuan di `docs/PROGRESS_NAVIGASI.md` (dibuat di Fase 0), diperbarui di akhir setiap fase.

**Syarat berhenti dan lapor ke pengguna:**
- Baseline typecheck/lint/test sudah merah sebelum perubahan apa pun (laporkan daftar kegagalannya).
- Perbaikan membutuhkan perubahan skema database atau migrasi.
- Perbaikan membutuhkan perubahan lebih dari 15 file produksi dalam satu fase.
- Ada tes keamanan yang gagal setelah perubahan.

---

## FASE 0. Pengaman rollback dan baseline

Repo ini hanya punya 1 commit, jadi tag pengaman sangat penting.

```bash
git status                      # harus bersih; jika tidak, STOP dan laporkan
git branch --show-current       # catat nama branch asal di PROGRESS_NAVIGASI.md
git tag sebelum-fix-navigasi    # titik kembali utama
git switch -c fix/navigasi-menu
```

Rekam baseline (simpan keluarannya di `docs/PROGRESS_NAVIGASI.md`):

```bash
npx prisma generate
npm run typecheck
npm run lint
npm test
npm run audit:menu
grep -rnE ": any\b|as any\b" src --include=*.ts --include=*.tsx | wc -l
```

Catatan: pada review awal, 4 tes gagal hanya karena Prisma client belum di-generate di lingkungan review. Di mesin ini seharusnya lolos setelah `npx prisma generate`. Jika masih ada yang gagal, catat sebagai "gagal sebelum perubahan" dan jangan diperbaiki dalam instruksi ini.

Buat `docs/PROGRESS_NAVIGASI.md` berisi: nama branch asal, tag, hasil baseline, dan tabel fase (kosong).

Commit: `chore(nav): baseline dan catatan progres`.

---

## FASE 1. Reproduksi dan bukti (belum memperbaiki apa pun)

### 1a. Tes kontrak keputusan redirect (mengunci perilaku lama)

1. Buat `src/lib/auth/route-guard.ts` berisi fungsi MURNI (tanpa akses cookie/DB/Next):

```ts
export interface RoleRedirectInput {
  pathname: string;
  search?: string;                // contoh: '?tab=kelola'
  activeRole?: string | null;
  isImpersonating: boolean;
}
export function decideRoleRedirect(input: RoleRedirectInput): string | null;
```

2. Pindahkan **persis** logika "langkah 4" dari `src/middleware.ts` (blok `if (isAuthenticated && activeRole) { ... }`: aturan SYSTEM_ADMIN, SUPER_ADMIN non-impersonasi, dan pencocokan `ROLE_PORTAL_MAP`/`PORTAL_PREFIXES`) ke fungsi itu, **tanpa mengubah perilakunya** (termasuk bug prefix, itu diperbaiki di Fase 2). Middleware lalu memanggil fungsi ini. Jangan ubah bagian lain middleware.
3. Buat `tests/nav-redirect-contract.test.ts` (vitest) dengan kasus:
   - Untuk setiap peran di `MENU_CONFIG` dan setiap `href` dari `getMenuGroupsForRole(peran)` (termasuk `SHARED_SUPPORT_GROUP` bila ikut dirender oleh `PortalShell`, cek `portal-shell.tsx`): `decideRoleRedirect({ pathname, search, activeRole: peran, isImpersonating: false })` harus `null`. Ini harus lolos sekarang.
   - Karakterisasi perilaku lama: SYSTEM_ADMIN ke `/classes` -> `/admin/system`; SUPER_ADMIN non-impersonasi ke `/grades` -> `/admin`; LECTURER ke `/student` -> `/lecturer`.
   - Kasus bug laten (tandai dengan `it.fails` atau `it.skip` + komentar `// H4: diperbaiki di Fase 2`): `/tasks` tidak boleh dianggap bagian dari prefix `/ta`; peran `SUPERADMIN` harus diperlakukan sama dengan `SUPER_ADMIN`.

Commit: `test(nav): kunci perilaku keputusan redirect middleware`.

### 1b. Tes e2e KLIK sidebar (celah tes yang menyebabkan bug lolos)

Buat `tests/e2e/menu-click-navigation.spec.ts` (Playwright, ikuti gaya `tests/e2e/helpers.ts` dan `loginAsRole`). Untuk SETIAP akun demo di README (Mahasiswa `2024001`, Asisten Dosen `ta@siajar.ac.id`, Dosen `0012345678`, Kaprodi `0087654321`, Staf `198501012010121001`, Admin Sistem `sysadmin@siajar.ac.id`, Super Admin `superadmin@siajar.ac.id`; kata sandi dari `DEMO_PASSWORD` atau `Password123!`):

1. Login lewat `loginAsRole`, tangani halaman `/workspace` bila muncul (pilih peran yang sesuai).
2. Ambil daftar `href` dari `nav[aria-label="Navigasi utama"] a`.
3. Untuk setiap `href`: kembali ke beranda peran, **klik link sidebar tersebut** (bukan `page.goto`), tunggu navigasi selesai, catat `pathname + search` akhir.
4. Klasifikasikan hasilnya:
   - **OK**: pathname akhir sama dengan href.
   - **REDIRECT-SENGAJA**: berbeda tapi terdaftar di tabel `INTENDED_REDIRECTS` dalam file tes (isi dari pembacaan kode halaman, misalnya `/grades` untuk dosen -> `/analytics?tab=rekap-nilai`; setiap entri wajib diberi komentar alasan).
   - **TERPENTAL-KE-BERANDA (BUG)**: pathname akhir sama dengan beranda peran sedangkan href bukan beranda, atau `/login`, atau `/workspace`.
5. Tes gagal jika ada hasil BUG. Tulis ringkasan semua hasil ke `test-results/nav-report.json`.

Jika ada kelas halaman yang memang tidak bisa dibuka di mode demo (butuh data/flag), tandai `test.fixme` dengan alasan, jangan dihapus.

Opsional bila sempat: ulangi untuk viewport mobile 390x844 (sidebar berupa drawer, pelajari `portal-shell.tsx` untuk cara membukanya).

Jalankan: `npx playwright test tests/e2e/menu-click-navigation.spec.ts`.

Commit: `test(nav): e2e klik sidebar semua peran`.

### 1c. Logging diagnostik (default mati)

Buat `src/lib/auth/nav-debug.ts`:

```ts
export function navDebug(event: string, data: Record<string, unknown>): void;
// Hanya mencetak jika process.env.NAV_DEBUG === '1'. Format: satu baris JSON.
// DILARANG mencatat email, nama, atau token. Id pengguna hanya 8 karakter pertama.
```

Pasang panggilan `navDebug` di titik berikut, tanpa mengubah perilaku:
- `current-user.ts`: setelah peran diresolusi, catat `{ cookieActiveRole, roleCodesFromDb, source: 'db' | 'demo' | 'none', dbError: boolean, isOnline, resolved }`.
- `server-guards.ts` (`assertServerRole`): saat menolak, catat `{ allowedRoles, userRoleCodes }`.
- `middleware.ts`: saat `redirect` dari langkah 1 sampai 4, catat `{ from: pathname, to, step }`.
- `(portal)/layout.tsx`: saat `redirect('/login')` karena `userContext` null.

Jalankan e2e dengan `NAV_DEBUG=1 npm run dev` dan kumpulkan log.

### 1d. Laporan bukti

Isi `docs/PROGRESS_NAVIGASI.md` bagian "Bukti Fase 1": tabel peran x menu (OK / REDIRECT-SENGAJA / BUG), cuplikan log `navDebug` untuk kasus BUG, dan **pernyataan jelas hipotesis mana (H1 sampai H4) yang TERBUKTI, DITOLAK, atau BELUM TERUJI**.

Karena mode demo tidak memakai Supabase nyata, bug mungkin hanya muncul dengan Supabase. Jika semua OK di mode demo:
- Jalankan ulang dengan Supabase lokal (`supabase start`, `supabase db reset`, `.env.local` dari `supabase status`).
- Jika masih tidak muncul, STOP dan minta pengguna: URL deploy, peran akun, urutan redirect (tab Network) dan log `NAV_DEBUG`. Jangan lanjut ke Fase 2 dengan menebak.

**Gerbang**: lanjut ke Fase 2 hanya jika minimal satu hipotesis TERBUKTI atau pengguna menyetujui lanjut.

---

## FASE 2. Perbaikan

Kerjakan hanya sub-langkah yang relevan dengan hipotesis TERBUKTI. Sub-langkah 2.1 dan 2.2 hampir pasti diperlukan. Satu sub-langkah = satu commit.

### 2.1 Satu sumber kebenaran kode peran

- Gunakan `normalizeRoleCode` dari `src/lib/config/menu-config.ts` (pelajari perilakunya dulu) di: `current-user.ts` (membandingkan cookie dengan peran database), `decideRoleRedirect`, `isRouteAllowedForRole`, dan `assertServerRole`.
- `SUPERADMIN` dan `SUPER_ADMIN` harus diperlakukan sama di semua tempat, tanpa duplikasi kondisi `|| 'SUPERADMIN'` yang tersebar.
- Di `loginAction` (`src/modules/identity/actions.ts`, bagian "Langkah 7"), kode peran dari `(ur.roles as any)?.code` bisa `undefined`. Saring nilai kosong sebelum dipakai agar cookie `active_role` tidak pernah bernilai `undefined`/kosong.
- Hapus fallback `portalMap[singleRole] || '/student'` di `src/app/(auth)/workspace/page.tsx`: kode peran yang tidak dikenal TIDAK BOLEH jatuh ke `/student`. Tampilkan pesan "Peran tidak dikenali, hubungi administrator".

Tes: perbarui `tests/nav-redirect-contract.test.ts` (buka status `fails`/`skip` untuk kasus normalisasi).

### 2.2 Hentikan fallback diam-diam ke `STUDENT`

Di `src/modules/identity/current-user.ts`:

1. Tangkap `{ data, error }` dari query `user_roles` (jangan lagi mengabaikan `error`). Bedakan tiga status: `OK` (ada peran), `EMPTY` (query sukses, tidak ada peran aktif), `ERROR` (query gagal/exception).
2. Jangan mengubah tipe kembalian `getCurrentUserWithRoles()` yang dipakai banyak pemanggil. Tambahkan fungsi baru yang diekspor, mis. `getCurrentUserResolution()`, dengan hasil terbedakan (`AUTHENTICATED` / `UNAUTHENTICATED` / `UNAVAILABLE`) plus status peran. `getCurrentUserWithRoles()` memanggilnya dan memetakan ke bentuk lama (`null` untuk dua status non-autentikasi).
3. Aturan `activeRole`:
   - cookie (setelah dinormalisasi) ada di daftar peran -> pakai.
   - cookie tidak valid, daftar peran tidak kosong -> pakai peran pertama, dan beri tanda `roleCookieMismatch: true` (dicatat via `navDebug`).
   - daftar peran kosong atau `ERROR` -> `activeRole` BUKAN `'STUDENT'`. Gunakan string kosong dan status `EMPTY`/`ERROR` agar tidak cocok dengan peran apa pun.
4. Fallback peran demo (`matchedDemo.roles`) hanya boleh berlaku jika autentikasi demo diizinkan (`!isProd || ALLOW_DEMO_AUTH === 'true'`).
5. `src/app/(portal)/layout.tsx`: ganti `activeRole || 'STUDENT'` menjadi penanganan eksplisit. Untuk status `EMPTY`, tampilkan layar penuh "Akun Anda belum memiliki peran aktif. Hubungi staf administrasi." (teks yang sama dengan `loginAction`) dengan tombol Keluar, TANPA redirect. Untuk `ERROR`/`UNAVAILABLE`, tampilkan "Layanan sementara tidak tersedia" dengan tombol "Muat ulang". Pakai komponen UI yang sudah ada, jangan membuat gaya baru.

Tes: tambahkan tes unit untuk empat skenario (cookie valid, cookie tidak valid dengan peran ada, peran kosong, query error). Ikuti pola mock di `tests/mocks` dan `tests/identity.test.ts`.

### 2.3 Samakan keputusan peran middleware dan halaman

- Perbaiki pencocokan prefix menjadi batas segmen di `decideRoleRedirect` dan `isRouteAllowedForRole`: `p === pathname || pathname.startsWith(p + '/')`. Buat satu helper `matchesPrefix(pathname, prefix)` dan pakai di keduanya.
- Middleware memakai nilai mentah cookie, halaman memakai nilai tervalidasi. Jika `roleCookieMismatch` terdeteksi saat render, JANGAN langsung mengalihkan ke beranda. Alihkan ke `/workspace?alasan=peran-tidak-cocok` agar peran aktif dipilih ulang dan cookie ditulis oleh server action yang sah (Server Component tidak boleh menulis cookie). Tampilkan banner singkat di `/workspace` bila parameter `alasan` ada.
- `assertServerRole` (`src/lib/auth/server-guards.ts`): saat menolak, redirect ke `/workspace?alasan=akses-ditolak` (bukan tanpa alasan), dan catat via `navDebug`. Perilaku fail-closed tetap.

### 2.4 Cek kesehatan Supabase yang tidak membuat pengguna "logout palsu"

Di `src/lib/supabase/status.ts`:
- Timeout URL remote dari 1000 ms menjadi 3000 ms (lokal tetap 300 ms).
- Hasil GAGAL di-cache maksimal 5 detik; hasil BERHASIL tetap 30 detik.
- Di `current-user.ts`: jika ada cookie `sb-` tetapi `isOnline === false`, hasilnya `UNAVAILABLE`, bukan `UNAUTHENTICATED` (jangan jadi `null` yang memicu redirect ke `/login`).

### 2.5 Cegah loop `/login` <-> beranda

- `(portal)/layout.tsx`: ganti `redirect('/login')` menjadi `redirect('/login?alasan=sesi')` hanya untuk status `UNAUTHENTICATED`.
- `src/middleware.ts` langkah 2: perlakukan parameter `alasan` sama seperti `from` (halaman login boleh dibuka, tidak dilempar ke beranda).

### 2.6 (Opsional, hanya setelah semua tes hijau) Rapikan pola guard halaman

Ada sekitar 20 halaman yang memakai `assertServerRole` dan banyak blok `if (role === ...) redirect(...)` yang berulang. Jika diminta pengguna, buat helper tunggal (mis. `requirePortalRole(allowed)`) dan ganti polanya halaman per halaman, satu commit per kelompok halaman, tes e2e dijalankan setiap kelompok. Jika pengguna tidak meminta, lewati langkah ini dan catat sebagai "ditunda".

---

## FASE 3. Verifikasi

Jalankan semuanya dan tempel hasil ringkas di `docs/PROGRESS_NAVIGASI.md`:

```bash
npm run typecheck
npm run lint
npm test
npm run audit:menu
npm run build
npx playwright test tests/e2e/menu-click-navigation.spec.ts
npx playwright test          # seluruh golden journey tidak boleh regresi
grep -rnE ": any\b|as any\b" src --include=*.ts --include=*.tsx | wc -l   # tidak boleh naik dari baseline
```

**Kriteria selesai (semua wajib):**
1. Tes e2e klik: 0 hasil BUG untuk ketujuh peran.
2. Tidak ada menu yang berakhir di beranda kecuali menu itu sendiri beranda atau tercatat di `INTENDED_REDIRECTS` beserta alasannya.
3. Typecheck, lint, test unit, audit menu, dan build lolos; golden journey tidak regresi.
4. Jumlah `any` tidak bertambah.
5. Akun tanpa peran aktif melihat pesan jelas, bukan terlempar ke beranda mahasiswa.

**Checklist manual** (jalankan oleh pengguna di browser, per peran): klik 5 menu acak -> URL dan isi halaman berubah; refresh di halaman menu -> tetap di halaman itu; tombol Back/Forward bekerja; buka `/login` saat sudah login -> diarahkan ke beranda tanpa loop; buka tab kedua dengan peran berbeda (jika multi-peran) -> tidak ada pantulan aneh.

**Jika masalah hanya terjadi di deploy (Vercel)**, periksa dan laporkan (jangan ubah rahasia sendiri):
- Variabel `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` terisi di Vercel; `ALLOW_DEMO_AUTH` tidak diisi.
- Region Vercel dan region Supabase (jarak jauh memperbesar kemungkinan timeout).
- Baris `user_roles` milik akun yang bermasalah berstatus `ACTIVE`, dan kodenya cocok dengan kode peran di kode (baca `supabase/migrations/20260930000001_identity_schema.sql` untuk nama kolom, lalu tulis query SELECT-nya sendiri; jangan menjalankan query yang mengubah data).
- Aktifkan `NAV_DEBUG=1` sementara di Vercel, reproduksi, lalu matikan lagi.

---

## FASE 4. Dokumentasi dan penutupan

1. Tambahkan bagian "Diagnosa navigasi" di `docs/RUNBOOK.md`: cara memakai `NAV_DEBUG=1`, arti tiap log, dan cara membaca `?alasan=` di `/workspace`.
2. Tambahkan baris di `docs/DAFTAR_BUG.md` (ikuti formatnya): bug, akar masalah yang terbukti, commit perbaikan, tes yang mengunci.
3. Perbarui `README.md` hanya bila perilaku yang tertulis berubah.
4. Isi tabel fase di `docs/PROGRESS_NAVIGASI.md` dengan SHA commit tiap langkah.

---

## ROLLBACK

| Kebutuhan | Perintah |
| --- | --- |
| Batalkan satu langkah | `git revert <sha-commit>` |
| Batalkan seluruh perbaikan, simpan riwayatnya | `git switch <branch-asal>` (branch `fix/navigasi-menu` dibiarkan tidak di-merge) |
| Kembali penuh ke kondisi awal | `git switch <branch-asal> && git reset --hard sebelum-fix-navigasi` (hanya jika belum ada pekerjaan lain di branch asal) |
| Hapus branch kerja | `git branch -D fix/navigasi-menu` |
| Lihat semua perubahan sejak awal | `git diff sebelum-fix-navigasi..fix/navigasi-menu --stat` |

Perubahan ini tidak menyentuh database, jadi rollback kode tidak memerlukan rollback data. Jika sudah ter-deploy, redeploy commit sebelum merge lewat dashboard Vercel.

---

## LAPORAN AKHIR (format wajib dari agen)

1. Hipotesis yang terbukti/ditolak, dengan bukti (cuplikan log atau hasil tes).
2. Daftar commit (SHA + satu baris deskripsi).
3. Daftar file yang diubah, dikelompokkan produksi vs tes vs dokumen.
4. Hasil semua perintah Fase 3 (lolos/gagal, jumlah).
5. Jumlah `any` sebelum dan sesudah.
6. Hal yang sengaja TIDAK dikerjakan (mis. langkah 2.6) dan alasannya.
7. Risiko tersisa dan hal yang perlu diverifikasi manual oleh pengguna.
