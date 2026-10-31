# INSTRUKSI ANTIGRAVITY: Audit Sebelum Merge (Perbaikan Navigasi)

Letakkan di `docs/INSTRUKSI_AUDIT_SEBELUM_MERGE.md`, lalu beri perintah ke agen:

> Baca dan jalankan `docs/INSTRUKSI_AUDIT_SEBELUM_MERGE.md` secara berurutan. Ini tugas AUDIT: laporkan temuan apa adanya, jangan memperbaiki apa pun di luar yang diizinkan dalam dokumen ini.

Konteks: branch `fix/navigasi-menu` (16 commit, tag `sebelum-fix-navigasi`) melaporkan semua tes hijau. Sebelum di-merge ada empat hal yang belum terbukti dan harus dicek: (A) selisih jumlah menu, (B) kemungkinan tes yang "dilonggarkan" saat gagal, (C) perubahan jalur login demo, (D) kata sandi yang tercantum di laporan.

---

## 0. Aturan main

1. **Read-only untuk kode produksi.** Dalam tugas ini agen hanya boleh menambah: tes baru, dokumen laporan, dan (hanya bila diizinkan eksplisit di bagian C) perbaikan yang MENGETATKAN keamanan. Dilarang mengubah `MENU_CONFIG`, skema database, migrasi, `.env*`, atau desain.
2. **Jangan push, merge, rebase, atau deploy.** Siapkan saja bahannya; pengguna yang menjalankan.
3. **Jangan mencetak rahasia.** Di semua keluaran, log, laporan, dan pesan commit, nilai kata sandi/token harus disamarkan (mis. `w****1`). Cukup tulis file, nomor baris, dan panjang string.
4. **Jangan menulis ulang riwayat git** (tanpa `filter-repo`, `rebase -i`, `push --force`). Jika rahasia ada di riwayat, cukup laporkan.
5. **Fakta, bukan asumsi.** Setiap temuan wajib menyertakan perintah yang dijalankan dan keluarannya (disamarkan bila perlu). Jika tidak bisa diverifikasi, tulis "TIDAK TERVERIFIKASI" beserta alasannya.
6. Semua pekerjaan di branch `fix/navigasi-menu`, satu langkah satu commit kecil berawalan `test(audit):`, `docs(audit):`, atau `fix(security):`.

**Syarat berhenti dan lapor:** ditemukan jalur login demo yang bisa dipakai di production, atau rahasia asli (bukan placeholder demo) di repo. Laporkan segera sebelum melanjutkan bagian lain.

---

## FASE 0. Titik kembali

```powershell
git status                                   # harus bersih; jika tidak, STOP dan laporkan
git branch --show-current                    # harus fix/navigasi-menu
git tag sebelum-audit-pra-merge              # titik kembali untuk tugas ini
```

Rollback tugas ini kapan saja: `git reset --hard sebelum-audit-pra-merge` (hanya menghapus commit audit, perbaikan navigasi tetap utuh).

---

## FASE A. Selisih jumlah menu (122 vs 124 vs 149)

Pada review awal `audit:menu` melaporkan 122 menu; laporan agen menyebut 149 di audit dan 124 di tes klik. Jelaskan selisihnya dengan bukti.

1. Hitung menu per peran langsung dari kode, dua kali: (i) dari `MENU_CONFIG` mentah, (ii) dari `getMenuGroupsForRole(peran)` (yang dirender, termasuk grup bersama/support). Tulis tabel peran x jumlah.
2. Buka `test-results/nav-report.json`. Untuk setiap peran, bandingkan daftar href yang diuji vs daftar href dari langkah 1(ii). Tampilkan SELISIHNYA persis (href mana yang tidak diuji, dan alasannya: `fixme`, `skip`, difilter, di luar sidebar).
3. Jelaskan cara `scripts/audit-menu.ts` menghitung 149 dan mengapa berbeda dari 122 di baseline (`git stash`-free: gunakan `git show sebelum-fix-navigasi:docs/AUDIT_MENU_FUNGSI.md` untuk angka lama). Apakah yang bertambah adalah menu baru, cara hitung yang berubah, atau perubahan file `MENU_CONFIG`?
4. Buktikan `MENU_CONFIG` tidak diubah isinya:

```powershell
git diff sebelum-fix-navigasi..HEAD -- src/lib/config/menu-config.ts
```

Hanya perubahan terkait `matchesPrefix`/normalisasi peran yang boleh ada. Jika label/href/ikon/urutan item berubah, tandai sebagai TEMUAN KRITIS.

Keluaran: bagian "A" di laporan dengan tabel dan kesimpulan satu kalimat.

---

## FASE B. Apakah tes dilonggarkan agar lulus?

Agen mengedit `tests/e2e/menu-click-navigation.spec.ts` beberapa kali saat tes gagal.

1. Tampilkan seluruh riwayat berkas itu:

```powershell
git log -p --follow -- tests/e2e/menu-click-navigation.spec.ts
```

2. Untuk setiap perubahan, klasifikasikan: (a) memperbaiki kesalahan tes itu sendiri (selector, timing), (b) menaikkan timeout, (c) menambah entri `INTENDED_REDIRECTS`, (d) menambah `fixme`/`skip`/pengecualian, (e) lainnya.
3. Cetak seluruh isi `INTENDED_REDIRECTS`. Untuk SETIAP entri, buka halaman tujuannya di `src/app/**` dan buktikan redirect itu memang kode yang sengaja ditulis (kutip baris `redirect(...)` beserta kondisinya). Tandai entri yang tidak punya dasar di kode atau yang tujuannya sama dengan beranda peran.
4. Cari pelonggaran lain: `grep` setara dengan

```powershell
git grep -nE "fixme|\.skip|test\.skip|retries|setTimeout|timeout:" -- tests/e2e/menu-click-navigation.spec.ts playwright.config.ts
```

5. Tulis tes tambahan `tests/e2e/menu-click-strict.spec.ts` yang TIDAK memakai `INTENDED_REDIRECTS`: untuk setiap peran, klik tiap menu dan simpan hasil mentah (href vs URL akhir). Tes ini tidak boleh gagal, hanya menulis `test-results/nav-raw.json`. Lalu bandingkan: daftar semua href yang URL akhirnya berbeda dari href, dan pastikan setiap perbedaan tercakup di langkah 3.

Keluaran: bagian "B": tabel perubahan tes, tabel entri `INTENDED_REDIRECTS` (dasar kode / tidak berdasar), dan daftar href yang berakhir di URL berbeda.

---

## FASE C. Jalur login demo tidak boleh terbuka di production

Perubahan agen menyentuh alias akun demo (`ta@siajar.ac.id`, `sysadmin@siajar.ac.id`), persistensi `demo_session`, dan "fallback peran sintetis". Ini area sensitif.

1. Tampilkan diff lengkap:

```powershell
git diff sebelum-fix-navigasi..HEAD -- src/modules/identity/demo-users.ts src/modules/identity/actions.ts src/modules/identity/current-user.ts src/middleware.ts src/lib/auth/server-guards.ts
```

2. Untuk setiap jalur berikut, tunjukkan baris kode yang menjaganya dan jelaskan perilaku saat `NODE_ENV=production` dan `ALLOW_DEMO_AUTH` TIDAK diset:
   - login dengan identifier akun demo (termasuk alias baru) ditolak;
   - cookie `demo_session`/`siakad_session` palsu diabaikan oleh middleware dan `current-user.ts`;
   - fallback peran sintetis dan fallback peran demo (`matchedDemo.roles`) tidak aktif;
   - kegagalan Supabase (timeout/UNAVAILABLE) tidak pernah menghasilkan pengguna atau peran yang ter-autentikasi.
3. Tulis tes unit `tests/demo-prod-gating.test.ts` (vitest) yang mengatur `process.env.NODE_ENV='production'` tanpa `ALLOW_DEMO_AUTH` lalu membuktikan keempat poin di atas, termasuk satu kasus negatif: dengan `ALLOW_DEMO_AUTH='true'` perilakunya memang terbuka (agar jelas bahwa yang dijaga adalah flag, bukan kebetulan). Ikuti pola mock di `tests/identity.test.ts`.
4. Jika ada celah (jalur demo bisa dipakai di production): **jangan perbaiki diam-diam.** Laporkan celahnya dengan baris kode, lalu hanya jika perbaikannya murni MENGETATKAN (menambah kondisi penolakan, tidak menghapus guard), buat commit terpisah `fix(security): ...` beserta tes. Jika perbaikan butuh keputusan desain, berhenti dan tanyakan pengguna.

Keluaran: bagian "C": tabel jalur x perilaku (production tanpa flag / dengan flag), hasil tes, dan daftar celah (atau "tidak ditemukan celah").

---

## FASE D. Kredensial di repo

Laporan agen memuat sandi akun Super Admin yang berbeda dari sandi demo lain. Repo ini tampaknya publik.

1. Cari kemunculan di working tree dan riwayat TANPA mencetak nilainya (samarkan di keluaran):

```powershell
git grep -nI "wahyu11"
git log --oneline -S"wahyu11" --all
```

2. Pindai pola kredensial lain di `src`, `tests`, `scripts`, `docs`, `README.md`, `supabase/seed*`, `.env.example`:

```powershell
git grep -nIiE "(password|passwd|sandi|secret|token|api[_-]?key)\s*[:=]\s*['\"][^'\"]{6,}['\"]"
```

   Kecualikan placeholder jelas (`changeme`, `your-...`, `xxx`, nama variabel `process.env.*`) dan sandi demo bersama `Password123!` (cukup catat bahwa itu sandi demo publik, jangan dihitung sebagai kebocoran).
3. Klasifikasikan tiap temuan: PLACEHOLDER / SANDI DEMO / DICURIGAI NYATA. Untuk setiap DICURIGAI NYATA tulis: file, baris, panjang string, apakah ada di riwayat commit (dan commit pertama yang memuatnya), dan apakah dipakai oleh kode login/seed.
4. **Jangan menghapus, mengganti, atau menulis ulang riwayat.** Hanya bila sandi itu ditulis keras di kode/tes/dokumen (bukan di riwayat), boleh membuat commit `fix(security):` yang menggantinya dengan pembacaan `process.env.<NAMA>` (sertakan nama variabel di `.env.example` dengan nilai placeholder), tanpa menyentuh nilai di tempat lain. Nilai lamanya tetap harus dianggap bocor.
5. Tulis rekomendasi untuk pengguna (di laporan, bukan di commit): ganti kata sandi akun tersebut di semua lingkungan yang dipakai, cek apakah akun itu ada di database production Supabase, dan pertimbangkan membersihkan riwayat git sendiri dengan alat resmi bila nilai itu nyata.

Keluaran: bagian "D": tabel temuan (disamarkan), klasifikasi, dan rekomendasi.

---

## FASE E. Uji dengan Supabase lokal (opsional, kerjakan bila Docker tersedia)

Tes klik sebelumnya berjalan di mode demo. Bug asli bisa hanya muncul dengan Supabase nyata.

1. `supabase start`, lalu `supabase db reset` (hanya basis data lokal). Isi `.env.local` dari keluaran `supabase status`.
2. Pastikan akun uji ada di database lokal lewat seed resmi proyek (baca `supabase/seed*` dan README; jangan membuat jalur akun baru).
3. Jalankan ulang `tests/e2e/menu-click-navigation.spec.ts` TANPA flag demo, dengan `NAV_DEBUG=1`:

```powershell
$env:NAV_DEBUG="1"; npx playwright test tests/e2e/menu-click-navigation.spec.ts
```

4. Jika Docker/Supabase lokal tidak tersedia, tulis "TIDAK DIJALANKAN" dengan alasannya. Jangan menyimpulkan hasil.

Keluaran: bagian "E": hasil per peran (OK/BUG/TIDAK DIJALANKAN) dan cuplikan log `navDebug` untuk kasus BUG.

---

## FASE F. Bahan merge (tanpa push/merge)

1. Buat `docs/LAPORAN_AUDIT_PRA_MERGE.md` berisi bagian A sampai E, ringkasan keputusan (SIAP MERGE / SIAP DENGAN CATATAN / JANGAN MERGE) dan alasannya.
2. Buat `docs/PR_NAVIGASI.md`: judul, ringkasan masalah dan akar masalah, daftar perubahan per kelompok, cara menguji, risiko, cara rollback.
3. Cetak perintah untuk dijalankan PENGGUNA sendiri (jangan dijalankan agen):

```powershell
git push origin fix/navigasi-menu
git push origin sebelum-fix-navigasi
```

   lalu langkah manual: buka Preview Deployment Vercel dari branch, uji dengan akun Supabase sungguhan (bukan demo) di desktop dan HP, baru merge.

Commit: `docs(audit): laporan audit pra-merge dan bahan PR`.

---

## Verifikasi akhir

```powershell
npm run typecheck
npm run lint
npm test
npm run audit:menu
npm run build
npx playwright test tests/e2e/menu-click-navigation.spec.ts
git grep -nE ": any\b|as any\b" -- src | Measure-Object -Line     # tidak boleh naik dari 659
```

Semua harus lolos seperti sebelum audit. Jika ada yang berubah, jelaskan penyebabnya.

---

## ROLLBACK

| Kebutuhan | Perintah |
| --- | --- |
| Batalkan satu langkah audit | `git revert <sha>` |
| Batalkan seluruh tugas audit | `git reset --hard sebelum-audit-pra-merge` |
| Batalkan semua termasuk perbaikan navigasi | `git switch <branch-asal>` (branch `fix/navigasi-menu` dibiarkan tidak di-merge) |

Tugas ini tidak menyentuh basis data (kecuali basis data LOKAL di Fase E), jadi rollback kode sudah cukup.

---

## LAPORAN AKHIR (format wajib dari agen)

1. Keputusan: SIAP MERGE / SIAP DENGAN CATATAN / JANGAN MERGE, dan tiga alasan utama.
2. Ringkasan temuan per fase A sampai E (satu paragraf pendek tiap fase) dengan tingkat keparahan: KRITIS / TINGGI / SEDANG / RENDAH.
3. Daftar commit audit (SHA + deskripsi) dan daftar file yang ditambah.
4. Hasil perintah verifikasi akhir.
5. Hal yang TIDAK TERVERIFIKASI dan apa yang dibutuhkan untuk memverifikasinya.
6. Tindakan yang harus dilakukan pengguna sendiri (mis. ganti sandi, uji preview Vercel).
