# INSTRUKSI ANTIGRAVITY — Semua Menu Berfungsi dan Perbaikan Bug SIAJAR

> Cara pakai: simpan file ini sebagai `docs/INSTRUKSI_MENU_BERFUNGSI.md` di repo, lalu beri perintah ke Antigravity:
> **"Baca `docs/INSTRUKSI_MENU_BERFUNGSI.md` sampai habis. Kerjakan berurutan per FASE. Berhenti di akhir tiap fase, tulis laporan sesuai Bagian 14, dan tunggu saya menjawab 'lanjut'."**
> Jangan menempel seluruh isi sekaligus tanpa jeda fase. Fase 0 dan Fase 1 wajib selesai sebelum fase lain.

---

## 0. PERAN DAN ATURAN KERAS

Kamu adalah insinyur perangkat lunak senior yang memperbaiki repo `Sistem-Pembelajaran` (SIAJAR, paket `siakad`). Tujuan tunggal: **setiap menu di setiap role membuka halaman nyata yang bekerja end-to-end, bukan tampilan tiruan**, dan semua bug yang ditemukan diperbaiki dengan bukti.

Aturan keras (melanggar salah satunya = pekerjaan ditolak):

1. **Jangan mengarang.** Setiap klaim "sudah berfungsi" harus disertai bukti: perintah yang dijalankan beserta keluarannya, atau tes yang lolos. Jika sesuatu tidak bisa dijalankan di lingkunganmu, tulis "TIDAK DIVERIFIKASI" dan alasannya. Jangan menulis "selesai" untuk hal yang tidak kamu jalankan.
2. **Jangan menghapus fitur untuk membuat tes lolos.** Menyembunyikan menu atau mengosongkan halaman bukan perbaikan.
3. **Jangan mengubah arah desain.** Pakai token dan komponen yang sudah ada (`tailwind.config.ts`, `src/components/ui/*`, `docs/INSTRUKSI_REDESAIN_HIJAU_BOTOL.md`). Tidak ada warna baru, tidak ada tema baru, tidak ada gaya "AI slop" (gradien ungu/biru, glassmorphism berlebihan). Tata letak 3 kolom yang sudah ada dipertahankan. Perubahan visual hanya yang dibutuhkan agar fungsi bekerja (status kosong, status galat, status memuat).
4. **Jangan deploy**, jangan ubah `vercel.json`, jangan menyentuh variabel lingkungan production. README sudah menyatakan jangan deploy sebelum Fase 2E selesai.
5. **Migrasi database hanya bertambah (additive).** Jangan mengedit migrasi lama di `supabase/migrations/`. Buat file baru berprefiks tanggal terbaru setelah `20261023000038`. Setiap migrasi baru wajib: RLS aktif di tabel baru, kebijakan per role, indeks untuk kolom yang difilter, dan catatan rollback di `docs/ROLLBACK_MENU_FUNGSI.md`.
6. **Satu perubahan, satu komit kecil.** Format pesan komit: `fix(menu-<id>): <apa yang diperbaiki>` atau `feat(menu-<id>): ...` atau `sec: ...`. Jangan komit campur aduk.
7. **Jangan force-push, jangan menulis ulang riwayat git** tanpa izin tertulis dari saya.
8. **Jangan menambah dependensi baru** kecuali tidak ada cara lain. Jika perlu, tulis alasannya dan minta persetujuan dulu. Pustaka yang sudah ada dan boleh dipakai: `exceljs`, `papaparse`, `jszip`, `@react-pdf/renderer`, `recharts`, `zod`, `react-hook-form`, `@tanstack/react-table`, `idb-keyval`.
9. **Semua teks antarmuka berbahasa Indonesia** dan zona waktu tampilan WIB (Asia/Jakarta). Tanggal disimpan UTC di database.
10. **Role baru (Kepala Lab, Sekretaris Prodi) di luar cakupan.** Jangan membuatnya sekarang. Tetapi jangan menambah pengecekan role yang di-hardcode baru; semua izin baru harus lewat peta izin pusat (`src/modules/academic/permissions.ts` dan `src/lib/config/menu-config.ts`) supaya role baru mudah ditambahkan nanti.

---

## 1. KONTEKS REPO (hasil audit awal, verifikasi ulang di Fase 0)

- Stack: Next.js 14 (App Router), TypeScript, Supabase (Auth, Postgres, Storage, RLS), Prisma 5, Tailwind 3, Radix UI, Vitest, Playwright.
- Skala: sekitar 865 file, 177 ribu baris TS/TSX; 89 halaman di `src/app/(portal)`, 31 di `(dashboard)` (sisa SIAKAD lama), 29 route di `src/app/api`; 40 migrasi; 152 tabel, semuanya sudah RLS (`npm run check:rls` lolos).
- Kode domain ada di `src/modules/*` (academic, identity, admin, early-warning, notifications, requests) dan `src/lib/*`.
- Menu didefinisikan di `src/lib/config/menu-config.ts` (763 baris). Role: `STUDENT`, `TEACHING_ASSISTANT`, `LECTURER`, `PROGRAM_COORDINATOR`, `ACADEMIC_STAFF`, `SYSTEM_ADMIN`, `SUPER_ADMIN`.
- Mode demo (tanpa Supabase) menyimpan data di memori server lewat `globalThis.__siajar*` (61 titik). Data hilang saat restart dan tidak bekerja di serverless.
- Hasil cek awal: `next lint` bersih; `tsc --noEmit` hanya 2 galat dan keduanya karena `prisma generate` tidak bisa jalan di sandbox; vitest 563 lolos, 1 gagal, 21 file tes tidak termuat karena penyebab Prisma yang sama. Artinya **kondisi tes sebenarnya belum diketahui** sampai `prisma generate` berhasil di lingkunganmu.

### Temuan yang sudah diketahui (kamu wajib memverifikasi dan memperbaikinya)

**A. Keamanan (Fase 1).** Commit `9d2a590` ("enable seamless Super Admin login") menambahkan:
- sandi super admin yang tertanam di kode (`'wahyu11'` dan `'Password123!'`) di `src/modules/identity/actions.ts` dalam `loginAction`;
- pelewatan pembatas non-production lewat `isSuperAdminByIdentifier` / `isSuperAdminUser` (`allowDemo || isSuperAdmin...`), sehingga login demo super admin juga hidup di production;
- penerimaan cookie `demo_session` di production bila nilainya UUID `a0000010-0000-0000-0000-000000000010`, berawalan `u-staf-20120009`, atau milik user sintetis ber-role `SUPER_ADMIN` (di `getCurrentUserWithRoles` dan `src/lib/auth/session.ts`);
- `src/middleware.ts` mengecualikan seluruh `/api` dari pengecekan sesi, jadi route API bergantung penuh pada pengecekan di dalam handler.
Repo bisa di-clone tanpa login, jadi nilai-nilai di atas dianggap **sudah bocor**.

**B. Banyak menu hanya tampilan tiruan.** Dari 71 href unik di `menu-config.ts`, 9 tidak punya halaman sendiri dan jatuh ke halaman catch-all `[...slug]`:
`/coordinator/courses`, `/coordinator/curriculum`, `/coordinator/monitoring/at-risk`, `/exams/question-bank`, `/exams/review`, `/lecturer/mentoring`, `/staff/master/students`, `/staff/master/lecturers`, `/staff/services/verification`.
Halaman catch-all (`coordinator`, `staff`, `lecturer`, `admin`, `exams`, `attendance`) memuat konstanta data tiruan, contoh: `COORDINATOR_METRICS` ("96.2%", "24 dari 24 kelas"), `STAFF_STATS` ("2,840 Mhs", "142 Dosen"), `LECTURER_CLASSES` (ID kelas palsu), `DEFAULT_SAMPLE_QUESTIONS` di `exams/[...slug]`.

**C. Halaman portal berisi konstanta statis** (indikasi data tiruan, verifikasi satu per satu): `community/page`, `community/forum`, `community/groups`, `community/events`, `community/mentoring`, `portfolio`, `help`, `certificates`, `announcements`, `attendance/history`, `ta/classes`, `ta/materials`, `ta/attendance`.

**D. Tombol palsu dan `alert()`.** 36 kemunculan `alert(`, `onClick={() => {}}`, atau `href="#"`. Terbanyak di `messages-hub-view.tsx` (7), `lecturer-attendance-hub-view.tsx` (6), `community-hub-view.tsx` (4), `coordinator-evaluations-view.tsx` (3). Contoh tombol unduh palsu: `coordinator-reports-hub-view.tsx` ("Mengunduh dokumen: ..."), `lecturer-attendance-hub-view.tsx` ("Mengunduh rekapitulasi presensi kelas format CSV...", "Membuka lampiran surat...").

**E. Penyimpanan di memori.** 61 penggunaan `globalThis.__siajar*` (siajarAkademik, siajarUbah, siajarAktivitasHarian, siajarTugas, siajarKuis, siajarForumTopics, siajarForumReplies, siajarDisputes, siajarRubrics, siajarPresensi, siajarNotifPrefs, siajarSimilarityPairs, dan lain-lain). Pembatas login dan kode kelas juga per instance.

**F. Dokumentasi usang.** Bagian bawah `README.md` masih SIAKAD lama; ada kontradiksi (tabel status: Markdown selesai; daftar batasan: materi masih teks biasa).

---

## 2. DEFINISI "MENU BERFUNGSI" (Definition of Done per menu)

Sebuah menu dianggap berfungsi **hanya jika semua poin berikut benar dan terbukti**:

1. **Rute.** `href` di `menu-config.ts` menuju file `page.tsx` khusus (bukan `[...slug]` yang menampilkan data tiruan). Catch-all hanya boleh tersisa sebagai pengalih (redirect) rute lama.
2. **Akses.** Role yang tidak berhak ditolak di **server** (middleware, `requireRole`, server action, dan RLS), bukan hanya disembunyikan di UI. Role yang berhak tidak terpental ke halaman lain.
3. **Data nyata.** Data dibaca dari sumber yang sama dengan modul terkait (Supabase bila online; mode demo bila offline), tanpa konstanta tiruan di komponen. Angka ringkasan dihitung dari data, bukan ditulis tangan.
4. **Aksi nyata.** Setiap tombol/form memanggil server action atau route yang menyimpan perubahan, mencatat audit bila sensitif, dan memperbarui tampilan (`revalidatePath`/`router.refresh`). Tidak ada `alert()` sebagai hasil akhir dan tidak ada tombol tanpa handler.
5. **Lima status UI.** Memuat (skeleton), kosong (pesan + aksi lanjut), galat (pesan jelas + coba lagi), sukses (toast/pesan inline), dan tidak berwenang (pesan 403, bukan layar kosong).
6. **Validasi.** Input divalidasi dengan `zod` di server; galat dikembalikan dalam bentuk `ActionResponse` yang sama dengan yang sudah dipakai di `src/modules/identity/types.ts`.
7. **Responsif.** Tidak ada gulir horizontal di lebar 360 px dan 768 px; tabel lebar berada dalam wadah `overflow-x-auto`.
8. **Bukti tes.** Ada minimal satu tes otomatis per menu (Bagian 11) dan menu tercatat berstatus `BERFUNGSI` di `docs/AUDIT_MENU_FUNGSI.md` beserta bukti.

Status yang boleh dipakai di audit: `BERFUNGSI`, `SEBAGIAN` (tulis bagian yang belum), `TIRUAN` (data statis), `RUSAK` (galat), `TIDAK DIVERIFIKASI`.

---

## FASE 0 — Jaring pengaman dan baseline (WAJIB, belum boleh mengubah kode aplikasi)

0.1. Buat cabang kerja: `git switch -c perbaikan/menu-berfungsi` dan tag titik awal: `git tag pra-menu-fungsi`.

0.2. Siapkan lingkungan dan **pastikan Prisma ter-generate**:
```bash
npm ci
npx prisma generate        # harus berhasil; jika gagal, hentikan dan laporkan galatnya
cp .env.example .env.local # isi nilai lokal; jangan pernah mengomit .env.local
```

0.3. Jalankan baseline dan simpan keluaran lengkap ke `docs/baseline-menu-fungsi/` (satu file per perintah):
```bash
npm run typecheck
npm run lint
npm run cek:hex
npm run check:rls
npm test
npm run build
npx playwright install --with-deps chromium && npm run test:e2e
supabase start && supabase db reset && supabase test db   # jika Supabase CLI tersedia
```
Catat: jumlah lolos/gagal, nama tes gagal, dan penyebabnya. **Jangan memperbaiki apa pun dulu.** Daftar semua kegagalan itu di `docs/AUDIT_MENU_FUNGSI.md` bagian "Baseline".

0.4. Baca dulu dokumen proyek yang sudah ada sebelum membuat asumsi: `docs/menu-inventory.md`, `docs/persistence-map.md`, `docs/PROGRESS.md`, `docs/production-readiness.md`, `docs/ARSITEKTUR_PER_ROLE.md`, `docs/SIAJAR_Fitur_dan_Menu_Role.md`, `docs/RUNBOOK.md`. Jika isi dokumen bertentangan dengan kode, **kode yang benar**; catat pertentangannya.

0.5. Buat `docs/ROLLBACK_MENU_FUNGSI.md` dengan tabel kosong: `Fase | Tag git | Migrasi baru | Cara membatalkan`. Isi di setiap akhir fase.

**Keluaran Fase 0:** laporan baseline. Berhenti dan tunggu "lanjut".

---

## FASE 1 — Perbaikan keamanan (sebelum fitur apa pun)

Kerjakan sebagai komit-komit `sec:` terpisah. Tag di akhir: `fase-1-keamanan`.

1.1. **Cabut kemudahan akses di commit `9d2a590`.** Jangan sekadar `git revert` buta; tinjau dulu supaya fitur sah dari commit itu (akses multi-role) tidak rusak. Hasil akhir yang wajib:
- Hapus `'wahyu11'` dan `'Password123!'` dari `loginAction`. Tidak boleh ada sandi literal di `src/` selain di berkas tes dan `README` mode demo.
- Kembalikan pembatas `allowDemo = !isProd || ALLOW_DEMO_AUTH === 'true'` sebagai satu-satunya gerbang login demo. Hapus semua `|| isSuperAdminByIdentifier` dan `|| isSuperAdminUser` yang melewatinya, serta pengecualian khusus `20120009` / `u-staf-20120009`.
- Di `getCurrentUserWithRoles` dan `src/lib/auth/session.ts`, cookie `demo_session` dan `active_role` **hanya** dipercaya bila `allowDemo` benar. Hapus pengecualian berbasis UUID super admin. Pada production tanpa sesi Supabase yang valid, hasilnya harus `null`.
- Di `session.ts`, hapus fallback yang mengembalikan `userId: "usr-superadmin"` dan peran `ADMIN` hanya karena ada cookie `active_role`.

1.2. **Login super admin yang sah untuk production.** Buat `scripts/create-superadmin.ts` (dijalankan manual dengan `tsx`) yang membuat/memperbarui akun di Supabase Auth memakai `SUPABASE_SERVICE_ROLE_KEY`, membaca `SUPERADMIN_EMAIL` dan `SUPERADMIN_PASSWORD` dari env (menolak sandi kurang dari 14 karakter), menambahkan baris `user_roles` ber-role `SUPER_ADMIN`, dan mencatat ke `audit_logs`. Tanpa sandi di kode.

1.3. **Audit semua route `/api`** (29 berkas `route.ts`). Buat tabel di `docs/AUDIT_KEAMANAN_API.md`: path, metode, siapa yang boleh, mekanisme otentikasi, hasil. Aturan:
- Route yang berubah data wajib memeriksa sesi nyata + role di dalam handler.
- Route cron wajib memeriksa `Authorization: Bearer ${CRON_SECRET}` dengan perbandingan waktu-konstan.
- `src/app/api/smoke-actions/route.ts` menyetel cookie `demo_session` ke super admin: bungkus agar hanya aktif bila `NODE_ENV !== 'production'`, atau hapus bila tidak dipakai tes.
- Webhook (judge) wajib memverifikasi `JUDGE_WEBHOOK_SECRET`.

1.4. **Perbarui tes keamanan.** Ubah `src/tests/unit/security/demo-login.test.ts` agar menegaskan: (a) `'wahyu11'` dan `'Password123!'` ditolak saat env sandi kosong, termasuk untuk akun super admin; (b) di `NODE_ENV=production` tanpa `ALLOW_DEMO_AUTH`, cookie `demo_session` apa pun (termasuk UUID super admin) tidak menghasilkan sesi; (c) `/api/*` yang dilindungi menjawab 401 tanpa sesi. Tes harus **gagal** di kode lama dan **lolos** di kode baru; tunjukkan keduanya.

1.5. **Catat tindak lanjut manual untuk saya** di `docs/AUDIT_KEAMANAN_API.md`, jangan lakukan sendiri: putar (rotate) semua sandi yang pernah terkomit; pertimbangkan pembersihan riwayat git; periksa apakah repo seharusnya privat.

**Keluaran Fase 1:** laporan + bukti tes merah→hijau. Berhenti.

---

## FASE 2 — Inventaris dan audit menu otomatis

2.1. Buat skrip `scripts/audit-menu.ts` (jalan dengan `tsx`, dipanggil lewat `npm run audit:menu`) yang:
- mengimpor struktur menu dari `src/lib/config/menu-config.ts`;
- memetakan setiap `href` (per role) ke berkas `page.tsx` di `src/app`, membedakan: halaman khusus, catch-all `[...slug]`, redirect, dan **tidak ada**;
- mendeteksi di berkas halaman dan komponen yang diimpornya: konstanta data tiruan (`^const [A-Z_]+ = [\[{]`), `alert(`, `onClick={() => {}}`, `href="#"`, `setTimeout` yang meniru proses, kata "Segera hadir/dummy/contoh", dan `globalThis.__siajar`;
- mengeluarkan `docs/AUDIT_MENU_FUNGSI.md` berisi tabel: `Role | Menu | href | Jenis rute | Sumber data | Aksi palsu | Status | Bukti`.
- gagal (exit 1) bila ada menu tanpa halaman khusus atau menu berstatus `TIRUAN`/`RUSAK` yang tidak ada di daftar pengecualian bertanda tangan saya.

2.2. Cari juga **rute yatim**: halaman yang ada tetapi tidak muncul di menu mana pun (misalnya `ta/materials`, `ta/attendance`, `ta/forum`, `community/*`, `portfolio`, `attendance/history`, `exams/history`, `devices`). Untuk tiap rute yatim tentukan: dihubungkan ke menu/tab induk, atau dijadikan redirect, atau dihapus (hapus hanya dengan persetujuan saya).

2.3. Periksa juga 31 halaman di `src/app/(dashboard)` (sisa SIAKAD). Tandai mana yang masih terjangkau dan mana yang sudah dialihkan oleh `LEGACY_ROUTE_REDIRECTS`. Jangan menghapus; laporkan.

2.4. Jalankan aplikasi dan **buka setiap menu secara nyata** untuk tiap role (Playwright, login mode demo): catat status HTTP, galat konsol, dan apakah halaman menampilkan data dari sumber yang benar. Hasilnya melengkapi kolom `Status` dan `Bukti`.

**Keluaran Fase 2:** `docs/AUDIT_MENU_FUNGSI.md` lengkap + jumlah menu per status. Berhenti dan tunggu prioritas dari saya.

---

## FASE 3 — Pastikan rute dan akses per role benar

3.1. Untuk 9 menu yang jatuh ke catch-all, buat halaman khusus di folder masing-masing (lihat Lampiran A untuk isi tiap halaman). Catch-all yang tersisa hanya melakukan `redirect()` untuk URL lama (`LEGACY_REDIRECTS`) dan `notFound()` untuk selain itu.

3.2. Pecah halaman catch-all yang sekarang berisi banyak tampilan menjadi komponen terpisah di `src/modules/...` yang dipakai halaman khusus. Jangan menggandakan kode.

3.3. **Matriks akses.** Perluas `tests/nav-roles.test.ts`: untuk setiap pasangan (role × href di seluruh menu) uji bahwa (a) role berhak mendapat 200, (b) role tidak berhak mendapat redirect ke beranda role-nya atau 403, (c) tidak ada href yang tampil di sidebar suatu role tetapi ditolak untuk role itu (menu "mati").

3.4. Periksa pengalihan beranda: `/student`, `/lecturer`, `/ta`, `/coordinator`, `/staff`, `/admin/system`, `/admin`. Pastikan pengguna multi-role bisa berganti role tanpa salah arah dan `active_role` tervalidasi di server (tidak boleh memilih role yang tidak dimiliki).

3.5. Periksa semua lencana (badge) menu di `menu-config.ts` (notifikasi, pesan, koreksi TA, periksa jawaban, sanggahan, evaluasi, persetujuan nilai, pengajuan masuk, flashcard, tukar keahlian, tinjau konten): tiap angka harus dihitung dari data nyata dan turun ke 0 setelah item diproses.

Tag: `fase-3-rute-akses`.

---

## FASE 4 — Ganti data tiruan dengan data nyata (per menu)

Urutan prioritas (kerjakan satu menu penuh sebelum pindah; satu komit per menu):

**Prioritas 1 (inti LMS)**: Beranda tiap role, Kelas Saya, Tugas, Nilai Saya, Ujian dan Kuis, Presensi, Pengumuman, Kalender, Notifikasi.
**Prioritas 2 (operasional)**: Persetujuan Nilai, Penugasan Dosen, Perkuliahan, Mahasiswa Berisiko, Master data staf (Mahasiswa, Dosen, Data Akademik), Jadwal, Kelas dan Peserta, Nilai dan Presensi, Pengajuan Masuk, Laporan.
**Prioritas 3 (pendukung)**: Komunitas (forum, grup, acara, bimbingan), Portofolio, Perpustakaan, Sertifikat, Pencapaian, Pesan, Flashcard, Tukar Keahlian, Evaluasi Dosen, Bantuan, Privasi, Admin Sistem (Pemantauan, Integrasi, Sesi Login, Cadangan, Pengaturan, Log Audit), Super Admin (Akun, Peran dan Akses, Aturan Akademik, Pengumuman Kampus).

Untuk **setiap** menu, jalankan alur ini dan tulis hasilnya di `docs/AUDIT_MENU_FUNGSI.md`:

1. Baca halaman, komponen, dan action-nya. Tulis daftar elemen interaktif (tombol, form, filter, tab, tautan) dan **apa yang seharusnya terjadi** pada tiap elemen berdasarkan `docs/SIAJAR_Fitur_dan_Menu_Role.md` dan `docs/USE_CASE_SIAJAR.md`.
2. Tentukan sumber data. Gunakan modul/action yang sudah ada bila ada (mis. `listMyClassesAction`, `getAllQuizzesAction`, `getQuestionBankAction`, `getMentoringRiskListAction`). Bila belum ada, buat server action baru di modul yang tepat, dengan cek role dan zod.
3. Hapus konstanta tiruan. Angka ringkasan (mis. "Keterlaksanaan Kelas", "Mahasiswa Perlu Perhatian", jumlah mahasiswa/dosen/ruang/rombel) dihitung dari tabel nyata (`classes`, `enrollments`, `attendance_records`, `student_risk_evaluations`, `grade_change_requests`, dan seterusnya).
4. Bila data belum ada, tampilkan status kosong yang berguna, **bukan** angka palsu. Data contoh hanya boleh datang dari seed (`prisma/seed.ts`, `supabase/seed*.sql`, `scripts/seed-akademik/`), tidak dari komponen.
5. Aksi tulis: simpan ke database lewat action, catat audit untuk aksi sensitif (nilai, persetujuan, akun, peran, pengaturan), kirim notifikasi lewat `src/modules/notifications/service.ts` bila alurnya menuntut, lalu segarkan tampilan.
6. Tambahkan tes (Bagian 11).

**Aturan khusus yang sering salah:**
- Perubahan nilai final hanya lewat alur persetujuan koordinator; asisten dosen tidak bisa memfinalkan nilai.
- Kaprodi hanya melihat data prodinya (filter `program_id` di query **dan** di RLS). Perhatikan batasan README: koordinator demo melihat semua pengajuan; pada mode penuh harus per prodi.
- Mahasiswa tidak boleh membaca data mahasiswa lain, kunci jawaban (`quiz_question_keys`), atau telemetri ujian.
- Ekspor CSV harus melewati penetralan CSV injection (awalan `=`, `+`, `-`, `@` diberi petik) dan dicatat di audit; pakai ulang fungsi yang sudah ada di ekspor rekap nilai.
- Waktu: batas tugas, presensi, dan ujian dibandingkan di server memakai UTC, ditampilkan WIB.

---

## FASE 5 — Hilangkan tombol palsu dan `alert()`

5.1. Buat satu mekanisme umpan balik standar (toast) memakai komponen yang sudah ada atau komponen kecil di `src/components/ui/`. Ganti seluruh `alert(` di `src/` dengan toast atau pesan inline. Tes/regresi: `grep -rn "alert(" src` harus kosong di luar berkas tes.

5.2. Tombol palsu yang **sudah diketahui** dan harus menjadi fungsi nyata:
| Berkas | Tombol | Perilaku yang benar |
|---|---|---|
| `coordinator-reports-hub-view.tsx` | "Mengunduh dokumen: …" | Hasilkan berkas nyata (CSV via `papaparse`/XLSX via `exceljs`/PDF via `@react-pdf/renderer`) dari data prodi, lewat route/action unduh yang memeriksa role Kaprodi dan mencatat audit |
| `lecturer-attendance-hub-view.tsx` | "Mengunduh rekapitulasi presensi … CSV" | CSV nyata rekap presensi kelas (dengan penetralan CSV injection) |
| `lecturer-attendance-hub-view.tsx` | "Membuka lampiran surat" | Buat signed URL dari Supabase Storage berumur pendek setelah cek hak akses; mode demo menyajikan berkas dari penyimpanan lokal |
| `messages-hub-view.tsx` (7 titik) | kirim/laporkan/arsip/dsb. | Panggil `message-actions.ts`; hapus alert; perbarui daftar |
| `community-hub-view.tsx` (4 titik) | buat topik/gabung/daftar acara | Simpan ke tabel `discussions`/`campus_events`/`event_registrations`/`group_*` |
| `coordinator-evaluations-view.tsx` (3 titik), `library-hub-view.tsx` (2), `grades-hub-view.tsx` (2), `class-live-poll-card.tsx` (2), `mentoring-risk-view.tsx`, `class-hub-tabs.tsx`, `certificates-hub-view.tsx`, `attendance-hub-view.tsx`, `achievements-view.tsx`, `ta-right-panel.tsx`, `right-panel-switcher.tsx`, `lecturer-right-panel.tsx`, `skill-exchange-client.tsx` | sesuai hasil `grep` | Tiap titik diselesaikan sesuai Definition of Done |

5.3. Setiap `href="#"` menjadi tautan nyata atau dihapus bersama elemennya. Setiap `onClick={() => {}}` diberi handler nyata. Tidak boleh ada tombol aktif yang tidak melakukan apa-apa; bila fitur memang belum didukung data, **nonaktifkan tombol dengan alasan jelas** dan catat di audit sebagai `SEBAGIAN`.

---

## FASE 6 — Penyimpanan permanen (ganti memori server)

6.1. Inventarisasi 61 titik `globalThis.__siajar*` ke tabel di `docs/persistence-map.md` (perbarui): nama store, modul, tabel Supabase padanannya, flag `FF_PERSISTENCE_*`, status (sudah ada tabel / perlu migrasi).

6.2. Pola yang dipakai: **repository dengan dua adapter**. Saat Supabase online dan flag aktif → tabel Supabase. Saat offline/demo → store memori yang diisi seed. Antarmuka sama sehingga halaman tidak peduli. Jangan menulis `if (isOnline)` di komponen.

6.3. Prioritas migrasi store ke database (karena menyangkut data penting): tugas dan pengumpulan, kuis/ujian dan jawaban, presensi, nilai dan perubahan nilai, sanggahan, forum dan balasan, kata sandi kustom (`siajarCustomPasswords` — **jangan pernah** menyimpan sandi di memori; pindahkan ke Supabase Auth), preferensi notifikasi, notifikasi terjadwal, rubrik, kemiripan, evaluasi risiko.

6.4. Pembatas laju (login 8 kode salah/10 menit, kode kelas) harus memakai Upstash Redis bila `UPSTASH_REDIS_REST_URL` ada; fallback memori hanya untuk lokal. Uji bahwa ia tidak bisa dilewati dengan mengganti instance.

6.5. Setiap migrasi baru: nama `20261027000039_...` dan seterusnya, RLS + kebijakan per role + indeks + catatan rollback. Jalankan `supabase db reset && supabase test db` dan tambahkan tes pgTAP di `supabase/tests/` untuk kebijakan baru. Perbarui `docs/schema-snapshot.md` dengan `npm run snapshot` dan pastikan `npm run check:snapshot` lolos.

---

## FASE 7 — Perburuan bug sistematis

Lakukan penyisiran per kategori. Tiap temuan dicatat di `docs/DAFTAR_BUG.md` (ID, lokasi `berkas:baris`, gejala, penyebab, perbaikan, bukti, tingkat: Kritis/Tinggi/Sedang/Rendah). **Perbaiki sendiri semua yang Kritis dan Tinggi**; yang Sedang/Rendah diperbaiki bila murah, selain itu dicatat.

7.1. **Otorisasi:** setiap server action dan route memanggil `requireRole`/`getCurrentUserWithRoles` dan memeriksa kepemilikan sumber daya (kelas milik dosen itu, kelas diikuti mahasiswa itu). Cari IDOR: parameter `id` dari klien yang dipakai tanpa cek kepemilikan.
7.2. **Alur data:** kondisi balapan (dua klik cepat membuat dua pengumpulan/dua persetujuan), idempoten untuk aksi yang bisa diulang, transaksi untuk operasi multi-tabel (finalisasi nilai, persetujuan perubahan nilai).
7.3. **Ujian/CBT:** timer dihitung dari server, simpan otomatis (`exam-autosave`), tidak bisa mengirim dua kali, jawaban tersimpan saat koneksi putus, kunci jawaban tidak pernah dikirim ke klien.
7.4. **Presensi:** kode verifikasi kedaluwarsa, heuristik GPS (`attendance-gps-heuristic.ts`) tidak bisa dilewati oleh klien, ambang 75% konsisten antara tampilan dan keputusan syarat UAS.
7.5. **Tanggal dan zona waktu:** tidak ada `new Date()` tanpa zona di perbandingan tenggat; tampilan WIB; kalender dan pengingat H-1 benar di tengah malam.
7.6. **Validasi input:** zod di semua action; panjang maksimal; unggahan berkas dibatasi tipe dan ukuran (`file-dropzone.tsx`, Storage); sanitasi Markdown di `markdown-viewer.tsx` (tanpa HTML mentah/skrip).
7.7. **Penanganan galat:** tidak ada `catch {}` kosong yang menelan galat penting (cari `catch {` dan `catch (e) {}`); tiap halaman punya `error.tsx`/`loading.tsx` yang sesuai; tidak ada layar putih.
7.8. **Aksesibilitas dasar:** tombol ikon punya `aria-label`, fokus terlihat, urutan tab wajar, kontras teks memenuhi 4.5:1 pada token yang ada.
7.9. **Responsif:** uji 360, 768, 1024 px pada setiap halaman utama; perbaiki luapan (overflow) dan sidebar/drawer seluler (riwayat komit menyebut perbaikan navigasi seluler; pastikan drawer menutup saat tautan diklik dan tidak membatalkan navigasi).
7.10. **Performa:** tidak ada N+1 pada daftar kelas/anggota/nilai; kolom yang difilter punya indeks; daftar panjang dipaginasi; tidak ada pemanggilan `supabaseAdmin` (service role) untuk membaca data yang cukup dengan klien ber-RLS.
7.11. **Tanda debug dan sisa:** cari `TODO|FIXME|HACK|@ts-ignore|@ts-nocheck|eslint-disable` (saat ini 2 kemunculan di `src/`) dan `console.log` yang membocorkan data; selesaikan atau tulis alasannya.

---

## FASE 8 — Pengujian

8.1. **Tes per menu.** Untuk tiap menu yang berstatus `BERFUNGSI`: minimal satu tes unit/integrasi pada action-nya (hasil benar, ditolak untuk role salah, validasi gagal) dan satu skenario Playwright yang membuka menu sebagai role-nya, melakukan aksi utama, dan memeriksa hasil yang tampak.
8.2. **Tes kontrak menu.** Tambah `tests/menu-contract.test.ts`: (a) setiap `href` menu punya halaman khusus; (b) tidak ada konstanta tiruan di halaman menu (gunakan aturan yang sama dengan `audit-menu.ts`); (c) tidak ada `alert(` di `src/`; (d) setiap menu hanya terlihat oleh role yang berhak mengaksesnya.
8.3. **E2E per role** (`tests/e2e/`): satu berkas per role menjalankan "perjalanan emas":
- Mahasiswa: masuk → gabung kelas → buka materi → kumpulkan tugas → ikuti kuis → lihat nilai → ajukan surat.
- Dosen: buat tugas → beri nilai draf → finalisasi → ajukan perubahan nilai → buka presensi → ekspor rekap.
- TA: koreksi → pantau ujian dengan izin delegasi saja.
- Kaprodi: setujui perubahan nilai → lihat mahasiswa berisiko → unduh laporan.
- Staf: kelola master data → jadwal → verifikasi pengajuan.
- System Admin dan Super Admin: log audit, pengaturan, cadangan, kelola akun/peran, impersonasi bertoken.
8.4. Pastikan `npm run cek` (typecheck + lint + check:rls + check:snapshot + check:plan + test) **dan** `npm run build` **dan** `npm run test:e2e` lolos. Tambahkan `audit:menu` ke skrip `cek`.
8.5. Jangan menurunkan atau menghapus tes lama yang gagal; perbaiki kode atau tes bila tesnya memang salah, dengan penjelasan di komit.

---

## FASE 9 — Dokumentasi dan serah terima

9.1. Perbarui `README.md`: hapus atau pindahkan bagian SIAKAD lama ke `docs/arsip/`; sesuaikan tabel status dan daftar "Batasan yang diketahui" dengan kenyataan (hapus kontradiksi Markdown); jelaskan cara membuat super admin (`scripts/create-superadmin.ts`) dan bahwa sandi demo hanya untuk lokal.
9.2. Perbarui `docs/PROGRESS.md` dan `docs/RUNBOOK.md`; tulis `docs/LAPORAN_MENU_FUNGSI.md` berisi ringkasan: jumlah menu per status sebelum dan sesudah, daftar bug dan perbaikannya, daftar yang masih `SEBAGIAN` beserta alasan dan estimasi.
9.3. Lengkapi `docs/ROLLBACK_MENU_FUNGSI.md`: tag git per fase, migrasi baru dan cara membatalkannya (`supabase migration` baru yang membalik; **jangan** menghapus migrasi yang sudah terkomit).

---

## 10. PANDUAN TEKNIS TERPADU

- **Pola server action:** `'use server'`; ambil konteks via `getCurrentUserWithRoles()`; cek role/izin lewat `permissions.ts`; `zod.safeParse`; operasi DB; `recordAudit` (`src/lib/audit.ts`) untuk aksi sensitif; `revalidatePath`; kembalikan `ActionResponse` (`{ ok: true, data } | { ok: false, error }`). Jangan melempar galat mentah ke klien.
- **Klien Supabase:** pakai klien server ber-sesi (RLS berlaku) untuk membaca/menulis atas nama pengguna. `supabaseAdmin` (service role) hanya untuk tugas sistem yang memang melampaui RLS (cron, audit, pembuatan akun), selalu setelah cek otorisasi manual.
- **Halaman server vs klien:** ambil data di Server Component; komponen klien hanya untuk interaksi. Hindari `useEffect` untuk mengambil data awal.
- **Penamaan:** berkas `kebab-case`, komponen `PascalCase`, action berakhiran `Action`.
- **Teks:** bahasa Indonesia baku, ringkas, tanpa emoji dekoratif.
- **Tidak ada nilai ajaib:** ambang (75% presensi, 8 kode salah/10 menit, batas SKS) berasal dari `src/lib/policies` atau `institution_policies`, bukan angka di komponen.

---

## 11. DAFTAR PERIKSA PER MENU (salin ke audit untuk setiap menu)

```
Menu: <nama> | Role: <role> | href: <path>
[ ] Halaman khusus (bukan catch-all)
[ ] Akses ditegakkan di server + RLS (uji role salah)
[ ] Tidak ada konstanta data tiruan; angka dihitung dari data
[ ] Semua tombol/form/filter/tab punya handler nyata
[ ] Tidak ada alert(); umpan balik via toast/inline
[ ] Status: memuat / kosong / galat / sukses / tidak berwenang
[ ] Validasi zod di server
[ ] Aksi tulis tersimpan, teraudit bila sensitif, notifikasi bila perlu
[ ] Responsif 360/768/1024 tanpa gulir horizontal
[ ] Tes unit + E2E ditambahkan dan lolos
[ ] Bukti: <perintah/keluaran/tangkapan layar>
Status akhir: BERFUNGSI | SEBAGIAN (...) | ...
```

---

## 12. KONDISI BERHENTI DAN MINTA KEPUTUSAN

Berhenti dan tanya saya (jangan menebak) bila: perbaikan butuh dependensi baru; butuh mengedit/menghapus migrasi lama; menghapus halaman atau fitur; dua dokumen proyek bertentangan tentang perilaku bisnis (mis. aturan nilai, SKS, presensi); kunci/rahasia diperlukan untuk menguji (Gemini, Piston, Judge, Upstash); atau perubahan menyentuh `vercel.json`/production.

---

## 13. KOMIT, TAG, DAN ROLLBACK

- Tag di akhir fase: `fase-0-baseline`, `fase-1-keamanan`, `fase-2-audit`, `fase-3-rute-akses`, `fase-4-data-nyata`, `fase-5-tombol-nyata`, `fase-6-persistensi`, `fase-7-bug`, `fase-8-tes`, `fase-9-dokumen`.
- Membatalkan satu fase: `git revert <tag-sebelum>..<tag-fase>` (bukan `reset --hard`). Migrasi dibatalkan dengan migrasi baru, tidak dengan menghapus berkas.
- Titik awal aman selalu `pra-menu-fungsi`.

---

## 14. FORMAT LAPORAN AKHIR TIAP FASE

```
FASE <n> — <judul>
1. Ringkasan (maks. 5 kalimat)
2. Perubahan: daftar komit (hash + pesan)
3. Bukti: perintah yang dijalankan + ringkasan keluaran (lolos/gagal)
4. Status menu: BERFUNGSI x | SEBAGIAN x | TIRUAN x | RUSAK x | TIDAK DIVERIFIKASI x
5. Bug: ditemukan x, diperbaiki x, tersisa x (rujuk docs/DAFTAR_BUG.md)
6. TIDAK DIVERIFIKASI: <apa dan kenapa>
7. Risiko/keputusan yang butuh jawaban saya
8. Siap lanjut ke fase berikutnya? (ya/tidak + alasan)
```

---

## LAMPIRAN A — Halaman khusus untuk 9 menu yang belum punya rute

| Menu (role) | Rute baru | Isi minimal yang wajib berfungsi |
|---|---|---|
| Kurikulum (Kaprodi) | `/coordinator/curriculum` | Daftar kurikulum prodi, CPL/CPMK (`cpl`, `cpmk`, `cpmk_cpl_map`), peta mata kuliah per semester; tambah/ubah CPMK dan pemetaan; tampilan radar yang sudah ada (`cpmk-cpl-radar-card.tsx`) memakai data nyata |
| Mata Kuliah (Kaprodi) | `/coordinator/courses` | CRUD mata kuliah prodi (`courses`), SKS, semester paket, wajib/pilihan, prasyarat dengan deteksi siklus (algoritma DFS yang sudah ada), alias kode (`course_code_aliases`) |
| Mahasiswa Berisiko (Kaprodi) | `/coordinator/monitoring/at-risk` | Daftar dari `student_risk_evaluations` dan `src/modules/early-warning/*` (`coordinator-cohort-risk-view.tsx`), filter angkatan/risiko, detail penyebab, catat tindak lanjut/penjadwalan bimbingan |
| Bank Soal (Dosen) | `/exams/question-bank` | Daftar dari `getQuestionBankAction`, filter tipe/kesulitan/CPL/topik, tambah-ubah-hapus soal, impor/ekspor (`question-import-modal.tsx`), pembangkit soal AI dengan persetujuan (`ai-quiz-generator-modal.tsx`); hapus `DEFAULT_SAMPLE_QUESTIONS` |
| Periksa Jawaban (Dosen) | `/exams/review` | Antrean jawaban esai/koding dari `exam_answers`, penilaian dengan rubrik, simpan nilai, lencana jumlah antrean (`lecturerReviewCount`) turun saat diproses |
| Mahasiswa Bimbingan (Dosen) | `/lecturer/mentoring` | `getMentoringRiskListAction` + `mentoring-risk-view.tsx`, daftar mahasiswa wali, riwayat bimbingan, slot konsultasi (`consultation_slots`, `consultation_bookings`) |
| Mahasiswa (Staf) | `/staff/master/students` | CRUD mahasiswa + impor CSV 3 tahap (unggah → pratinjau galat per baris → simpan transaksional), penetapan dosen wali, status aktif (soft delete) |
| Dosen (Staf) | `/staff/master/lecturers` | CRUD dosen, NIDN, impor CSV, penugasan |
| Pengajuan Masuk (Staf) | `/staff/services/verification` | Antrean `student_requests`, verifikasi DIAJUKAN → DISETUJUI/DITOLAK dengan catatan, nomor registrasi otomatis, berkas surat PDF (`@react-pdf/renderer`), notifikasi ke mahasiswa; lencana `requestCount` |

## LAMPIRAN B — Catatan per kelompok menu (verifikasi, jangan dipercaya mentah)

- **Beranda semua role** (`/student`, `/ta`, `/lecturer`, `/coordinator`, `/staff`, `/admin/system`, `/admin`): ringkasan harus dari action nyata; panel kanan (`right-panel-switcher.tsx`, `ta-right-panel.tsx`, `lecturer-right-panel.tsx`) memiliki titik `alert`/no-op.
- **TA:** `/ta/classes`, `/ta/materials`, `/ta/attendance` memakai konstanta (`ASSISTED_CLASSES`, `ASSISTANT_MATERIALS`, `ATTENDANCE_SESSIONS`). Ganti dengan data `class_assistants` + izin delegasi per kelas; tombol yang melebihi izin harus dinonaktifkan dan ditolak di server.
- **Dosen "Buku Nilai"** mengarah ke `/analytics`: pastikan isinya memang buku nilai (gradebook berbobot, konversi huruf mutu, ekspor CSV) dan bukan hanya analitik.
- **Admin Sistem:** Pemantauan, Integrasi (ada nilai kunci contoh yang di-mask di `system-integrations-hub-view.tsx`; harus membaca status nyata dari env tanpa pernah menampilkan rahasia), Sesi Login (daftar `user_devices`/`login_events`, cabut sesi), Cadangan (selaras `scripts/backup-db.sh`; tombol hanya mencatat/memicu bila infrastruktur mendukung, jika tidak tampilkan petunjuk nyata), Pengaturan (`system_settings`, perubahan teraudit), Log Audit (`audit_logs`, filter, ekspor).
- **Super Admin:** Akun (buat/nonaktifkan/reset; impersonasi hanya lewat token bertanda tangan `impersonation-token.ts`, durasi singkat, teraudit), Peran dan Akses (matriks `roles`/`permissions`/`role_permissions` yang benar-benar dipakai penegak izin), Aturan Akademik (`institution_policies`), Pengumuman Kampus.
- **Komunitas** (forum, grup, acara, bimbingan), **Portofolio**, **Bantuan**: konstanta `THREADS` dan sejenisnya diganti data; bila fitur tidak punya tabel, buat migrasi additive atau tandai `SEBAGIAN` dan jelaskan.
- **Kalender, Notifikasi, Pengumuman:** pastikan satu sumber kebenaran, pengingat H-1 otomatis berjalan lewat `scheduler.ts`/cron dan tidak mengirim ganda.
- **AI (Tanya AI, pembangkit kuis, RAG materi):** harus berfungsi tanpa kunci (pesan jelas "AI belum dikonfigurasi", bukan galat) dan dengan `GEMINI_API_KEY` (ada persetujuan konten `ai_content_consents`, pencatatan `ai_usage_logs`, batas pemakaian).
- **Sisa SIAKAD `(dashboard)`:** jangan dikembangkan; pastikan tidak bisa menjadi jalur memutar hak akses.

## LAMPIRAN C — Kriteria penerimaan akhir (semua harus benar)

- [ ] `grep -rn "wahyu11\|Password123" src` kosong (selain berkas tes mode demo yang dijelaskan).
- [ ] Di `NODE_ENV=production` cookie `demo_session` apa pun tidak menghasilkan sesi; tes membuktikannya.
- [ ] `npm run audit:menu` melaporkan 0 menu `TIRUAN`/`RUSAK` dan 0 menu tanpa halaman khusus.
- [ ] `grep -rn "alert(" src` kosong (di luar tes).
- [ ] Tidak ada konstanta data tiruan di halaman/komponen menu (aturan `menu-contract.test.ts`).
- [ ] `npm run cek`, `npm run build`, `npm run test:e2e`, dan `supabase test db` lolos dan keluarannya terlampir.
- [ ] Store `globalThis.__siajar*` prioritas 6.3 sudah punya adapter database; sisanya terdokumentasi.
- [ ] `docs/AUDIT_MENU_FUNGSI.md`, `docs/DAFTAR_BUG.md`, `docs/AUDIT_KEAMANAN_API.md`, `docs/ROLLBACK_MENU_FUNGSI.md`, `docs/LAPORAN_MENU_FUNGSI.md`, dan `README.md` mutakhir.
- [ ] Setiap butir "TIDAK DIVERIFIKASI" dijelaskan dan dilaporkan kepada saya.
