# INSTRUKSI ANTIGRAVITY: Tutup Catatan Audit Tahap 2

Konteks: setelah audit tahap 1, ada empat catatan yang masih bisa dikerjakan agen:

1. `SUPERADMIN_PASSWORD` tidak boleh menjadi jalur login di production (dan dokumen tidak boleh menyarankan mengisinya di Vercel Production).
2. Peran `PROGRAM_SECRETARY` dan `LAB_HEAD` lolos tes di mode demo, tetapi belum diperiksa terhadap database/RLS.
3. Tes e2e memakan 42 menit; berisiko melewati batas waktu CI.
4. Pastikan tidak ada loop redirect untuk peran tak dikenal, dan pindai JWT per temuan, bukan agregat.

Hal yang BUKAN tugas agen (jangan dikerjakan, cukup ingatkan di laporan): rotasi sandi superadmin di Supabase production, pengaturan env di dashboard Vercel, dan uji Preview Deployment dengan akun asli.

---

## 0. Aturan main

1. **Lingkup**: logika login/env, tes, konfigurasi CI/Playwright, skrip audit, dan dokumen. Dilarang menyentuh: isi `MENU_CONFIG` (label/href/ikon/urutan), `supabase/migrations/`, `prisma/schema.prisma`, desain/tema, dependensi `package.json` (kecuali menambah npm script bila benar-benar perlu), dan berkas `.env*` selain `.env.example`.
2. **Dilarang mengubah database.** Fase 2 hanya melaporkan dan, bila perlu, menulis DRAFT SQL di `docs/` untuk disetujui pengguna. Draft tidak boleh ditaruh di `supabase/migrations/` dan tidak boleh dijalankan.
3. **Keamanan hanya boleh mengetat.** Guard tetap fail-closed. Dilarang mengaktifkan `ALLOW_DEMO_AUTH`, menghapus guard, atau membuat rute bisa diakses lebih banyak peran demi meluluskan tes.
4. **Jangan mencetak rahasia.** Samarkan nilai sandi/token/JWT di semua keluaran, log, laporan, dan pesan commit (mis. `w****1`, `eyJh...[disamarkan]`). Untuk JWT, hanya boleh mencetak klaim non-rahasia (`role`, `iss`, `ref`) dan panjang string; JANGAN mencetak signature.
5. **Jangan menulis ulang riwayat git. Jangan push, merge, atau deploy.**
6. **Tanpa utang tipe baru**: dilarang menambah `any`, `@ts-ignore`, `@ts-nocheck`, `eslint-disable`. Jumlah `any` di `src` harus tetap 659 atau turun.
7. Satu perubahan = satu commit kecil berawalan `fix(security):`, `fix(nav):`, `test(nav):`, `ci:`, atau `docs(audit):`. Setelah tiap langkah: `npm run typecheck; npm run lint`. Setelah tiap fase: `npm test`.
8. **Fakta, bukan asumsi**: setiap temuan menyertakan perintah dan keluarannya (disamarkan bila perlu). Jika tidak bisa diverifikasi, tulis "TIDAK TERVERIFIKASI" beserta alasannya.

**Syarat berhenti dan lapor segera:**
- Ada jalur NON-demo (production) yang membandingkan kata sandi login dengan env var atau string tetap di luar Supabase Auth.
- Ditemukan JWT `service_role` atau kunci dari project Supabase sungguhan di dalam repo.
- Peran baru tidak ada di database dan perbaikannya butuh migrasi (laporkan, jangan membuat migrasi).
- Perbaikan butuh lebih dari 15 file produksi dalam satu fase.

---

## FASE 0. Titik kembali dan baseline

```powershell
git status                                   # harus bersih; jika tidak, STOP dan laporkan
git branch --show-current                    # harus fix/navigasi-menu
git tag sebelum-penutupan-tahap-2
git grep -nE ": any\b|as any\b" -- src | Measure-Object -Line     # catat: harus 659
npm run typecheck; npm run lint; npm test; npm run audit:menu; npm run audit:guards
```

Catat baseline di `docs/PROGRESS_NAVIGASI.md` (bagian "Penutupan tahap 2").

---

## FASE 1. `SUPERADMIN_PASSWORD` tidak boleh menjadi jalur login production

### 1a. Telusuri (read-only)

```powershell
git grep -nI "SUPERADMIN_PASSWORD"
```

Untuk SETIAP pembacaan, tulis: file:baris, fungsi pembungkus, apakah berada di dalam kondisi `allowDemo` (`NODE_ENV !== 'production' || ALLOW_DEMO_AUTH === 'true'`), dan apa yang dilakukan dengan nilainya (dibandingkan dengan input? dipakai membuat akun? dipakai sebagai sandi saat memanggil Supabase?). Hasilkan tabel: pembacaan x jalur (demo / production) x kegunaan.

Juga telusuri `DEMO_PASSWORD` dan `NEXT_PUBLIC_DEMO_PASSWORD` dengan cara yang sama.

### 1b. Prinsip yang harus tercapai

- Di production tanpa `ALLOW_DEMO_AUTH`, login superadmin HANYA lewat Supabase Auth; tidak ada pembacaan `SUPERADMIN_PASSWORD` sama sekali di jalur itu.
- Variabel `SUPERADMIN_PASSWORD` hanya berarti "sandi akun superadmin DEMO" di mode demo. Ia tidak dipakai untuk memverifikasi sandi pengguna di production.

Jika 1a menemukan pembacaan di jalur production, itu syarat berhenti: laporkan segera. Perbaikan yang diizinkan hanya menghapus pembacaan itu (mengetatkan), disertai tes.

### 1c. Tes

Tambahkan di `tests/demo-prod-gating.test.ts` (atau berkas baru `tests/superadmin-env-prod.test.ts`): dengan `NODE_ENV='production'`, tanpa `ALLOW_DEMO_AUTH`, dan `SUPERADMIN_PASSWORD='nilai-uji'` diset, login dengan identifier superadmin dan sandi `nilai-uji` HARUS ditolak oleh jalur demo, dan satu-satunya pemanggilan autentikasi yang terjadi adalah ke Supabase Auth (mock `signInWithPassword`; verifikasi dipanggil dengan sandi yang dikirim pengguna, bukan nilai env). Kasus kontrol: dengan `ALLOW_DEMO_AUTH='true'` perilaku demo memang terbuka.

### 1d. Dokumen

- `.env.example`: komentar di atas `SUPERADMIN_PASSWORD`: "Hanya untuk akun superadmin DEMO. JANGAN diset di Production. Sandi superadmin sungguhan hanya ada di Supabase Auth."
- `docs/PR_NAVIGASI.md` dan `docs/LAPORAN_AUDIT_PRA_MERGE.md`: koreksi bagian yang menyarankan mengisi `SUPERADMIN_PASSWORD` di Vercel Production. Matriks yang benar:

| Variabel | Production | Preview |
| --- | --- | --- |
| `ALLOW_DEMO_AUTH` | tidak diset | tidak diset, kecuali Preview memakai project Supabase TERPISAH tanpa data nyata |
| `SUPERADMIN_PASSWORD` | tidak diset | tidak diset |
| `NEXT_PUBLIC_DEMO_PASSWORD` | tidak diset | tidak diset |

Tambahkan catatan: Preview di Vercel dapat diakses siapa pun yang tahu URL-nya, dan secara bawaan bisa mewarisi env Production; karena itu `ALLOW_DEMO_AUTH=true` dengan kunci Supabase production berarti akun demo bisa membuka data nyata.

Commit: `fix(security): superadmin env hanya untuk jalur demo` (kode+tes) dan `docs(audit): koreksi matriks env Vercel` (dokumen).

---

## FASE 2. Peran baru terhadap database dan RLS (hanya melaporkan)

Tes klik berjalan di mode demo. Di production, peran dibaca dari tabel `roles` dan `user_roles`, dan kebijakan RLS menentukan data yang bisa dibaca.

### 2a. Inventaris peran di database

```powershell
git grep -nE "PROGRAM_SECRETARY|LAB_HEAD|SEKPRODI|KALAB|LAB_CHIEF" -- supabase prisma scripts docs
```

Baca skema identitas (`supabase/migrations/20260930000001_identity_schema.sql` dan migrasi lain yang menyentuh `roles`) serta berkas seed. Jawab dengan kutipan baris:

1. Bagaimana tabel `roles` diisi (seed, migrasi, atau manual)? Daftar SEMUA kode peran yang dibuat di database.
2. Apakah `PROGRAM_SECRETARY` dan `LAB_HEAD` ada? Dengan kode persis apa (mis. `SEKPRODI`, `KALAB`)?
3. Apakah kode di database cocok dengan hasil `normalizeRoleCode` dan `ROLE_PORTAL_MAP`? Tabel: kode DB x hasil normalisasi x peran kode.
4. Kebijakan RLS: untuk tabel yang diakses halaman `/secretary/*` dan `/lab/*`, adakah kebijakan yang menyebut kedua peran? Jika kebijakan hanya menyebut peran lain, data halaman itu kemungkinan kosong atau ditolak untuk kedua peran.

### 2b. Keluaran

- Tabel "peran di kode vs di database" (9 peran).
- Daftar halaman peran baru yang akan kosong/ditolak di production (berdasarkan RLS), dengan alasan kutipan kebijakan.
- Jika ada kekurangan: tulis DRAFT `docs/DRAFT_MIGRASI_PERAN_BARU.sql` yang idempotent (memakai pola `insert ... on conflict do nothing` yang sesuai skema nyata) dan HANYA berisi penambahan baris `roles`/kebijakan yang dibutuhkan. Bubuhi kepala berkas: "DRAFT - belum dijalankan - butuh persetujuan pengguna". Jangan taruh di `supabase/migrations/`, jangan jalankan, dan jangan merujuk nama kolom yang tidak terlihat di skema.
- Jika tidak ada kekurangan: tulis "tidak ditemukan kekurangan" beserta bukti.

Commit: `docs(audit): audit peran baru terhadap database dan rls`.

---

## FASE 3. Waktu tes e2e dan CI

Tes klik 9 peran memakan sekitar 42 menit; di CI berisiko melewati batas waktu atau menjadi tidak stabil.

### 3a. Ukur dan baca konfigurasi

1. Baca `playwright.config.ts`, `package.json` (script `test:e2e`), dan `.github/workflows/ci.yml` (job e2e: `timeout-minutes`, perintah server, `workers`, `retries`).
2. Ukur waktu per peran dari laporan Playwright (`test-results`) dan catat tabel peran x durasi. Catat juga apakah waktu didominasi kompilasi dev server (Next dev compile per rute) atau navigasi itu sendiri.

### 3b. Perbaikan yang diizinkan (cakupan tes TIDAK boleh berkurang: tetap 9 peran, 149 menu, mode strict)

1. Saat `process.env.CI` diset, jalankan `webServer` dari build produksi (`npm run build` lalu `npm run start`), bukan `next dev`. Mode lokal tetap seperti sekarang. Pastikan `reuseExistingServer` dan `timeout` webServer wajar.
2. Naikkan `workers` hanya jika tes saling independen (tiap tes memakai context/cookie sendiri). Coba `workers: 2` lalu `4` di CI; verifikasi tidak ada flakiness dengan menjalankan dua kali berturut-turut.
3. Pecah job e2e menjadi matriks per kelompok peran di CI (mis. 3 kelompok: mahasiswa/asdos/dosen, kaprodi/staf/sekprodi, kalab/sysadmin/superadmin) agar tiap job jauh di bawah batas waktu. Setiap job memakai build produksi yang sama (gunakan artefak build atau build ulang, pilih yang lebih sederhana).
4. Setel `timeout-minutes` yang realistis (ukuran nyata x 1,5) dan `retries: 1` hanya di CI. Jangan menaikkan timeout per-aksi di tes sebagai solusi.
5. Tidak boleh menghapus tes, menambah `fixme`/`skip`, atau mengisi `INTENDED_REDIRECTS` demi kecepatan.

### 3c. Verifikasi

Jalankan secara lokal dengan `$env:CI="true"` (build produksi) untuk SATU kelompok peran dan catat durasi sebelum vs sesudah. Jalankan dua kali untuk memeriksa stabilitas. Jangan memicu CI dari sini.

Commit: `ci: e2e dari build produksi dan matriks per kelompok peran`.

---

## FASE 4. Loop redirect dan pindai JWT

### 4a. Tes anti-loop untuk peran tak dikenal

1. Tes unit: simulasikan rantai keputusan (`decideRoleRedirect` -> logika `/workspace`) untuk `activeRole` bernilai peran tak dikenal (`'FOO'`), kosong, dan `undefined`. Batasi maksimal 5 lompatan; rantai harus berhenti di halaman yang TIDAK mengalihkan lagi (mis. `/workspace` menampilkan pesan "peran tidak dikenali").
2. Tes e2e (mode demo): login sebagai akun demo, ubah cookie `active_role` menjadi nilai tak dikenal, buka `/student`, lalu pastikan URL akhir stabil (`/workspace` atau halaman pesan) dan jumlah redirect berantai tidak lebih dari 3 (hitung via `response.request().redirectedFrom()`), tanpa error `ERR_TOO_MANY_REDIRECTS`.
3. Jika loop ditemukan, perbaiki di `route-guard.ts` / `workspace/page.tsx` dengan perubahan sekecil mungkin, plus tes yang mengunci.

Commit: `test(nav): tes anti-loop redirect untuk peran tak dikenal`.

### 4b. Pindai JWT dan rahasia per temuan

```powershell
git grep -nIE "eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}" -- . ":!node_modules" ":!package-lock.json"
```

Untuk SETIAP temuan (file:baris), tulis satu baris tabel. Decode HANYA bagian payload (segmen tengah, base64url) di memori, jangan cetak signature atau seluruh token, dan catat:

- `role` (anon / service_role / authenticated / lainnya),
- `iss` dan `ref` bila ada,
- klasifikasi:
  - **DUMMY-TES**: file ada di `tests/`, `fixtures/`, `__mocks__`, atau payload jelas rekaan (`iss` = `supabase-demo` atau nilai uji).
  - **KUNCI-DEV-LOKAL-PUBLIK**: kunci demo bawaan Supabase lokal (`iss` = `supabase-demo`), aman untuk diketahui publik.
  - **DICURIGAI-NYATA**: `role=service_role` di luar tes, atau `ref`/`iss` menunjuk project nyata (domain `*.supabase.co`) dan bukan nilai lokal/demo.

Terapkan pola yang sama untuk string berbentuk `sk_...`, `service_role` literal, dan `.env`-like di `docs/`. DICURIGAI-NYATA = syarat berhenti.

Tambahkan hasilnya (nilai disamarkan) ke `docs/LAPORAN_AUDIT_PRA_MERGE.md` bagian D sebagai tabel per temuan.

Commit: `docs(audit): tabel pindai jwt per temuan`.

---

## VERIFIKASI AKHIR

```powershell
npm run typecheck
npm run lint
npm test
npm run audit:menu
npm run audit:guards
npm run build
$env:CI="true"; npx playwright test tests/e2e/menu-click-navigation.spec.ts tests/e2e/menu-click-strict.spec.ts
git grep -nE ": any\b|as any\b" -- src | Measure-Object -Line     # tidak boleh naik dari 659
git grep -c "wahyu11"                                              # harus 0 di working tree
```
