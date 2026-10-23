# SIAJAR: Instruksi Fitur "Kain Semester" untuk Antigravity

Versi 1 · 23 Oktober 2026 · Bahasa antarmuka, komentar, dan dokumentasi: Indonesia

Taruh berkas ini di `docs/INSTRUKSI_KAIN_SEMESTER.md` pada repo, lalu tempel **Prompt pembuka** di bawah ke chat Antigravity. Berkas ini adalah satu-satunya sumber instruksi untuk fitur ini. Cakupannya hanya beranda mahasiswa (`/student`).

---

## Prompt pembuka (tempel ke Antigravity)

```
Baca seluruh isi docs/INSTRUKSI_KAIN_SEMESTER.md sebelum menyentuh kode apa pun.

Kerjakan Fase A sampai Fase I secara berurutan. Jangan melompati fase. Fase A (jaring
pengaman rollback) wajib selesai sebelum satu baris kode fitur ditulis.

Aturan pegangan:
1. Audit dulu, baru ubah. Semua nama tabel, kolom, dan rute di dokumen ini adalah hasil
   audit awal saya dan BISA SALAH atau sudah berubah. Verifikasi di repo. Kalau berbeda,
   ikuti repo, lalu catat di docs/KEPUTUSAN.md.
2. Fitur ini dikunci di belakang feature flag yang default MATI. Dengan flag mati, aplikasi
   harus berperilaku persis seperti sebelum fitur ini ada.
3. Tidak ada migrasi database, tidak ada dependensi baru, tidak ada perubahan pada fitur lain.
4. Kalau satu fase gagal pemeriksaan dua kali berturut-turut: berhenti, batalkan commit fase
   itu (lihat bagian Rollback), tulis laporan, dan tanya saya. Jangan meninggalkan kondisi
   setengah jadi.
5. Jangan menambah fitur di luar dokumen. Ide tambahan dicatat di docs/IDE_LANJUTAN.md.
6. Setelah tiap fase: jalankan pemeriksaan yang tercantum di fase itu, perbaiki sampai hijau,
   commit, lalu catat di docs/PROGRESS_KAIN_SEMESTER.md.

Mulai dari Fase A.
```

---

## 1. Tujuan dan hasil yang diharapkan

Beranda mahasiswa saat ini berupa kumpulan kartu. Fitur ini menambahkan satu tampilan baru, **Kain Semester**: sebuah kisi di mana tiap **baris** adalah satu mata kuliah (kelas) yang diikuti mahasiswa, tiap **kolom** adalah satu pekan (1 sampai 16), dan tiap **kotak** menunjukkan apa yang terjadi di pekan itu (hadir, tugas masuk, terlewat, dan seterusnya).

Yang dilihat mahasiswa:

```
Kain semestermu                         Pekan 9 dari 16
              1   .   .   .   5   .   .   .   9   .   .   .  13  .  .  16
Data Science  ■   ■   ■   ■   ■   ■   ■   ■   [ ]  □   □   □   □  □  □  □
Algoritma     ■   ■   ■   ◧   ■   ■   ○   ■   [ ]  □   □   □   □  □  □  □
...
■ Lengkap   ◧ Hadir, tugas belum masuk   ○ Terlewat   [ ] Pekan ini   □ Belum
Satu baris ringkasan netral, lalu satu baris peringatan dini (kalau ada).
```

- Tap satu kotak: muncul **sheet** (naik dari bawah di HP, panel samping/dialog di layar lebar) berisi detail kelas dan pekan itu: status presensi dan daftar tugas yang tenggatnya jatuh di pekan itu.
- Tap nama mata kuliah: menuju halaman kelas tersebut (Peta Pulau kelas itu, kalau ada rutenya).
- Pada beranda, tampilan ini **menggantikan kartu "Status akademik dan peringatan dini"** (`StudentAcademicStatusCard`) hanya ketika flag menyala. Informasi peringatan dini tidak hilang: ia menjadi satu baris di bawah kisi.

Di luar cakupan putaran ini (catat di `docs/IDE_LANJUTAN.md`, jangan dikerjakan): halaman Presensi versi detail, ekspor "kain akhir semester" sebagai gambar di halaman Pencapaian, motif budaya Melayu, pergantian font.

---

## 2. Fakta repo hasil audit awal (WAJIB diverifikasi ulang di Fase B)

Ini hasil bacaan saya terhadap repo `wahyualdir/Sistem-Pembelajaran`. Perlakukan sebagai petunjuk, bukan kebenaran.

**Stack:** Next.js 14 App Router, TypeScript, Supabase (Postgres + RLS), Tailwind, Vitest. Skrip penting di `package.json`: `typecheck`, `lint`, `test`, `check:rls`, `check:snapshot`, `check:plan`, `cek` (menggabungkan semuanya), dan `cek:hex` (TIDAK termasuk di dalam `cek`, jalankan terpisah).

**Sumber data yang benar adalah tabel Supabase, bukan model Prisma.** `prisma/schema.prisma` memuat model `Presensi`, `Pertemuan`, `Tugas`, dan `PengumpulanTugas`, tetapi pencarian `prisma.presensi`, `prisma.pertemuan`, `prisma.tugas` di `src/` tidak menemukan pemakaian. Itu sisa SIAKAD lama. **Jangan memakainya.** Verifikasi dengan `grep` di Fase B. Tabel yang dipakai aplikasi (dari `supabase/migrations/`):

| Tabel | Kolom yang relevan | Catatan |
|---|---|---|
| `classes` | `id`, `title`, `section`, `status`, `deleted_at` | Satu baris Kain = satu kelas |
| `enrollments` | `class_id`, `student_id`, `status`, `enrolled_at`, `dropped_at` | Ambil hanya `status = 'ACTIVE'` |
| `attendance_sessions` | `id`, `class_id`, `session_number` (CHECK 1 sampai 16), `title`, `session_date` (DATE), `is_open` | `session_number` = nomor pekan. Unik per `(class_id, session_number)` |
| `attendance_records` | `session_id`, `student_id`, `status` (`HADIR`, `TERLAMBAT`, `IZIN`, `SAKIT`, `ALPA`), `check_in_at` | RLS: mahasiswa hanya bisa membaca baris miliknya |
| `assignments` | `id`, `class_id`, `title`, `due_at`, `close_at`, `status` (`DRAFT`, `PUBLISHED`, `CLOSED`) | Tidak punya nomor pekan |
| `submissions` | `assignment_id`, `student_id`, `status` (`DRAFT`, `SUBMITTED`, `RETURNED`, `REVIEWED`, `GRADED`), `submitted_at`, `is_late` | |

Tabel `semesters` hanya punya `label` dan `is_active`. **Tidak ada tanggal mulai semester.** Maka nomor "pekan sekarang" harus diturunkan dari data sesi (lihat bagian 5.2).

**Struktur beranda mahasiswa:**
- `src/app/(portal)/student/page.tsx`: server component. Memuat data paralel dengan `Promise.allSettled`, lalu merender `StudentDashboardClient`.
- `src/app/(portal)/student/student-dashboard-client.tsx`: client component (±617 baris). Memuat `<StudentAcademicStatusCard evaluations={academicStatus} />` di dalam kondisi `(showAll || showKelasSaya)`, tepat di bawah `<ActionBanner />`.
- Chip beranda: `BERANDA_CHIPS` di `src/lib/config/menu-config.ts`.

**Pola kode yang harus diikuti:**
- Server action: berkas `'use server'` di `src/modules/<domain>/`, memakai `getCurrentUserWithRoles()` dari `@/modules/identity/actions` untuk identitas, dan `createClient()` dari `@/lib/supabase/server` untuk query (klien yang menghormati RLS). **Dilarang memakai `@/lib/supabase/admin` (service role) untuk fitur ini.**
- Logika murni (tanpa I/O) ditaruh di `src/lib/akademik/` (contoh: `daily-priorities.ts`, `semester-recap.ts`), lalu dites unit.
- Hasil server action seragam: `{ ok: true, data } | { ok: false, pesan }` (lihat tipe `ActionResponse` di `@/modules/identity/types`; cek bentuk aslinya). `getDailyPrioritiesAction` mengembalikan larik langsung, jadi cek pola mana yang dipakai di aksi beranda lain dan ikuti yang paling dekat.
- Validasi input dengan Zod. Pesan galat berbahasa Indonesia natural.
- Feature flag: `src/lib/config/features.ts` (`FEATURE_FLAGS`, server-only, dibaca dari `process.env` tanpa awalan `NEXT_PUBLIC_`, default mati). Fungsi `isFeatureFlagActive`.
- Mode demo dan persistensi: `attendance-actions.ts` mengimpor `isDemoMode`, `isFeatureFlagActive`, dan `checkSupabaseOnline`. **Audit pola persisnya** dan ikuti, supaya fitur ini berperilaku konsisten saat persistensi mati atau Supabase offline.
- Tes: Vitest. Tes unit diletakkan di `src/tests/unit/<area>/`. Ada juga `tests/` di akar.
- Zona waktu: simpan UTC, tampilkan WIB (Asia/Jakarta). Ada helper `formatJakartaDate` di `src/modules/academic/home-utils.ts`; pakai kalau cocok.

**Aturan warna (dijaga `scripts/cek-hex.js`):** hanya hex palet kampus yang boleh muncul di `src/`: `#F3F3F4`, `#FFFFFF`, `#111111`, `#ED1C24`, `#A91117`, `#808285`, `#58595B`, `#E2E3E4`, `#000000`. **Pakai token Tailwind/CSS variable** (`bg-ink`, `bg-gray-soft`, `border-primary`, `text-foreground`, dan seterusnya), jangan menulis hex sendiri.

**Privasi:** `docs/PRIVASI_DATA_AKTIVITAS.md` melarang log belajar mandiri (Peta Pulau, Flashcard, Podcast) dipakai sebagai dasar absensi, penilaian, atau perankingan. Kain Semester **hanya** memakai data formal (`attendance_records`, `submissions`, `assignments`). Jangan mencampurnya dengan data aktivitas belajar mandiri.

**Temuan di luar cakupan (catat saja, jangan diperbaiki):**
1. `getHomeBannerAction` di `src/modules/academic/home-actions.ts` berisi data ujian yang ditulis langsung di kode (`quiz-mid-2026`, "Kuis Evaluasi Tengah Semester Web Modern"). Banner di beranda kemungkinan menampilkan data karangan. Catat di `docs/IDE_LANJUTAN.md` dan laporkan di laporan akhir.
2. Model Prisma yang tidak terpakai (lihat di atas). Catat.

---

## 3. Aturan keras (tidak boleh dilanggar)

1. **Flag mati = tidak ada perubahan perilaku.** Dengan `FF_KAIN_SEMESTER` mati, `/student` harus merender hal yang sama seperti sebelum fitur ini. Kartu lama `StudentAcademicStatusCard` **tidak dihapus dan tidak diubah**.
2. **Tidak ada migrasi database.** Fitur ini hanya membaca. Satu-satunya pengecualian: kalau audit membuktikan indeks yang diperlukan tidak ada dan query terukur lambat, buat **satu** migrasi baru bernomor di `supabase/migrations/` (idempoten, `IF NOT EXISTS`, komentar di atas berkas berisi SQL pembatalan), di commit terpisah, **dan berhenti untuk meminta persetujuan saya sebelum melanjutkan**. Ingat `npm run check:snapshot` dan `check:rls`.
3. **Tidak ada dependensi baru.** Kisi dibuat dengan HTML/CSS/React yang sudah ada.
4. **Hanya data milik mahasiswa yang login.** Query memakai klien yang menghormati RLS dan tambahan `.eq('student_id', user.id)` eksplisit. Tidak ada query lintas mahasiswa. Tidak ada perbandingan, peringkat, rata-rata kelas, atau "kamu lebih baik dari X%".
5. **Hanya palet resmi.** `node scripts/cek-hex.js` harus lolos.
6. **Bahasa netral dan tidak menghakimi.** Kata terlarang di antarmuka: gagal, bolos, malas, buruk, jelek, peringkat, skor, dihukum, sanksi (kecuali kalimat catatan yang sudah ada di kartu lama: "bukan sanksi atau pengurangan nilai otomatis").
7. **Jangan mengarang data.** Kalau persistensi mati, Supabase offline, atau tidak ada kelas aktif, tampilkan keadaan kosong yang jujur. Jangan memakai data contoh di jalur produksi.
8. **Tidak ada N+1.** Maksimal lima query per pemuatan, tanpa perulangan query per kelas.
9. **Jangan menyentuh** `ActionBanner`, `DailyPriorityCard`, tata letak panel kanan, atau menu. Perubahan hanya pada titik integrasi yang dijelaskan di Fase G.
10. **Tema:** komponen hanya memakai token, sehingga tampil benar baik pada tema lama maupun pada tema Soft Apple (kalau sudah diterapkan di repo). Cek dengan: `grep -n "humanizeTitle" src/components/retro/retro-window.tsx` (ada = tema Soft Apple sudah diterapkan). Jangan bergantung pada salah satunya.

---

## 4. Fase kerja

Setiap fase ditutup dengan commit tersendiri (supaya bisa dibatalkan per fase) dan baris di `docs/PROGRESS_KAIN_SEMESTER.md`. Awalan commit: `chore(kain-semester):`, `docs(kain-semester):`, `feat(kain-semester):`, `test(kain-semester):`. Deskripsi commit berbahasa Indonesia.

### Fase A: Jaring pengaman rollback (SEBELUM kode fitur)

1. `git status`: pohon kerja harus bersih. Kalau tidak bersih, **berhenti dan laporkan**. Jangan `stash` atau `reset` perubahan saya.
2. Catat commit awal: `git rev-parse HEAD`.
3. Buat tag penanda: `git tag pra-kain-semester` (di commit awal itu).
4. Buat cabang kerja: `git checkout -b fitur/kain-semester`. **Seluruh pekerjaan terjadi di cabang ini.** Jangan commit ke `main`, jangan push paksa.
5. Jalankan dan catat hasil dasar (sebelum perubahan apa pun) ke `docs/PROGRESS_KAIN_SEMESTER.md`: `npm run typecheck`, `npm run lint`, `npm test`, `node scripts/cek-hex.js`. Catat juga mana yang sudah gagal **sebelum** kamu menyentuh apa pun (misalnya tes yang butuh `prisma generate`), supaya kegagalan lama tidak dianggap buatanmu.
6. Tulis `docs/ROLLBACK_KAIN_SEMESTER.md` berisi hash commit awal, nama tag, nama cabang, dan salinan bagian "Rollback" di bawah. Commit: `chore(kain-semester): siapkan tag dan catatan rollback`.

**Selesai bila:** tag `pra-kain-semester` ada, cabang aktif, hasil dasar tercatat, `ROLLBACK_KAIN_SEMESTER.md` ter-commit.

### Fase B: Audit (hanya membaca)

Tulis `docs/AUDIT_KAIN_SEMESTER.md` (maksimal satu halaman) yang menjawab:

1. Nama tabel dan kolom sebenarnya untuk enam tabel di bagian 2. Periksa juga migrasi yang lebih baru yang mungkin mengubah kolomnya (`grep -rn "attendance_records\|submissions\|assignments" supabase/migrations`).
2. Kebijakan RLS `SELECT` pada keenam tabel: apakah mahasiswa terdaftar bisa membaca `attendance_sessions` dan `assignments` kelasnya, dan hanya baris `attendance_records`/`submissions` miliknya? Kalau ada yang tidak bisa dibaca mahasiswa, **berhenti dan laporkan**. Jangan memakai service role sebagai jalan pintas.
3. Indeks yang ada untuk query di bagian 5.3 (`session_id`, `student_id`, `class_id, due_at`).
4. Bukti bahwa model Prisma `Presensi`, `Pertemuan`, `Tugas` tidak dipakai (hasil `grep`).
5. Pola pemilihan jalur data di `attendance-actions.ts` dan aksi tugas (demo/in-memory vs Supabase; `FF_PERSISTENCE_ATTENDANCE`, `isDemoMode`, `checkSupabaseOnline`). Tuliskan pola yang akan kamu ikuti.
6. Bentuk sebenarnya `ActionResponse`, dan apakah aksi beranda lain mengembalikan larik langsung atau `{ ok, data }`.
7. Rute halaman kelas (dan rute Peta Pulau kelas) di `src/app/(portal)/classes/[id]`, untuk tautan dari nama mata kuliah.
8. Apakah `classes` punya relasi ke tabel mata kuliah (`courses`) sehingga nama mata kuliah bisa diambil, atau cukup `classes.title` + `section`. Pilih label tampilan dan catat.
9. Keputusan algoritma "pekan sekarang" (bagian 5.2) setelah memeriksa data sesi nyata/seed yang ada. Catat di `docs/KEPUTUSAN.md`.

**Selesai bila:** dokumen audit ter-commit (`docs(kain-semester): audit sumber data`) dan semua poin terjawab. Kalau ada jawaban yang mengubah rencana secara mendasar (misalnya RLS menghalangi), berhenti dan tanya saya.

### Fase C: Feature flag

1. Di `src/lib/config/features.ts`, tambahkan ke `FEATURE_FLAGS`:
   `FF_KAIN_SEMESTER: process.env.FF_KAIN_SEMESTER === 'true',` dengan komentar Indonesia singkat ("Kain Semester di beranda mahasiswa. Default mati.").
2. Tambahkan `FF_KAIN_SEMESTER=false` beserta komentar ke `.env.example`.
3. Jangan memakai awalan `NEXT_PUBLIC_`: flag dibaca di server component.
4. Tes kecil: flag mati bila env tidak diset, menyala hanya bila `'true'`.

**Selesai bila:** `npm run typecheck` dan tes terkait hijau. Commit: `feat(kain-semester): tambah feature flag FF_KAIN_SEMESTER`.

### Fase D: Logika murni dan tesnya

Berkas: `src/lib/akademik/semester-weave.ts` (tanpa I/O, tanpa `Date.now()` langsung; terima `now` sebagai parameter supaya bisa dites). Tes: `src/tests/unit/semester-weave/semester-weave.test.ts`.

Isi (lihat bagian 5 untuk aturan lengkap):
- Tipe: `WeaveCellState`, `WeaveCell`, `WeaveRow`, `SemesterWeaveData`, dan input mentah (`RawSession`, `RawRecord`, `RawAssignment`, `RawSubmission`, `RawClass`).
- `computeCurrentWeek(sessions, now)` mengembalikan `{ week: number | null, semesterStart: string | null }`.
- `assignWeek(dueAtISO, semesterStart)` mengembalikan nomor pekan 1 sampai 16.
- `resolveCellState(...)` fungsi murni sesuai tabel keputusan bagian 5.4.
- `buildSemesterWeave(input, now)` menyusun `SemesterWeaveData` lengkap beserta ringkasan.

Kasus tes minimal (semuanya harus ada):
1. Mahasiswa tanpa kelas aktif menghasilkan data kosong dengan `rows = []`.
2. Kelas tanpa sesi sama sekali, `currentWeek = null`, semua sel `BELUM`/`TANPA_SESI`, tanpa galat.
3. Pekan lampau, `HADIR`, tanpa tugas, hasilnya `LENGKAP`.
4. Pekan lampau, `TERLAMBAT`, hasilnya `LENGKAP` (terlambat hadir tetap hadir).
5. Pekan lampau, `HADIR`, ada tugas lewat tenggat belum dikumpulkan, hasilnya `SEBAGIAN`.
6. Pekan lampau, `HADIR`, tugas dikumpulkan terlambat (`is_late = true`), hasilnya `LENGKAP`.
7. Pekan lampau, `IZIN`, hasilnya `IZIN` (tidak dianggap terlewat).
8. Pekan lampau, `SAKIT`, hasilnya `IZIN`.
9. Pekan lampau, `ALPA`, hasilnya `TERLEWAT`.
10. Pekan lampau, sesi ada, tanpa rekaman presensi, hasilnya `TERLEWAT`.
11. Pekan lampau, kelas tidak punya sesi di nomor itu, hasilnya `TANPA_SESI`.
12. Pekan berjalan, hasilnya `SEKARANG` apa pun isinya.
13. Pekan depan, hasilnya `BELUM`.
14. Tugas dengan `status = 'DRAFT'` (milik dosen) tidak dihitung; submission `DRAFT` mahasiswa tidak dihitung sebagai "dikumpulkan".
15. Tugas jatuh tepat di batas pekan (pukul 23:59 WIB hari ke-7 vs 00:00 hari ke-8) masuk pekan yang benar (uji dengan zona WIB, bukan UTC).
16. Tugas dengan tenggat sebelum `semesterStart` masuk pekan 1; setelah pekan 16 masuk pekan 16.
17. Kelas dengan `enrollments.status != 'ACTIVE'` tidak muncul.
18. Ringkasan: jumlah pekan terlewat dan jumlah tugas menunggu dihitung benar, hanya hingga pekan berjalan.

**Selesai bila:** semua tes di atas hijau, `npm run typecheck` dan `npm run lint` bersih, `node scripts/cek-hex.js` lolos. Commit: `feat(kain-semester): logika murni kisi semester` dan `test(kain-semester): kasus uji kisi semester`.

### Fase E: Server action

Berkas: `src/modules/academic/semester-weave-actions.ts` (`'use server'`).

1. `getSemesterWeaveAction()`: ambil identitas lewat `getCurrentUserWithRoles()`. Bila tidak ada pengguna atau peran aktif bukan `STUDENT`, kembalikan keadaan kosong (jangan melempar galat).
2. Ikuti pola jalur data yang kamu catat di Fase B poin 5. Bila persistensi mati atau Supabase offline: keadaan kosong.
3. Query sesuai bagian 5.3, paralel seperlunya, tanpa perulangan per kelas.
4. Seluruh galat query ditangkap; kembalikan `{ ok: false, pesan: 'Kain semester belum bisa dimuat. Coba muat ulang halaman.' }` (atau bentuk yang sesuai pola repo). Jangan membocorkan pesan teknis atau SQL.
5. Hitung lewat `buildSemesterWeave` dari Fase D. Server action **tidak** berisi logika aturan: hanya mengambil data dan memanggil fungsi murni.
6. Tes unit dengan Supabase di-mock: (a) sukses, (b) satu query galat, (c) pengguna bukan mahasiswa, (d) tanpa kelas.

**Selesai bila:** tes hijau, typecheck dan lint bersih. Commit: `feat(kain-semester): server action pemuat kisi semester`.

### Fase F: Komponen UI

Berkas:
- `src/components/home/semester-weave.tsx` (client component: kisi, legenda, ringkasan)
- `src/components/home/semester-weave-sheet.tsx` (sheet detail)

Spesifikasi lengkap ada di bagian 6. Ringkas: kisi semantik (`<table>`), sel adalah `<button>`, status ditandai **bentuk dan pola, bukan hanya warna**, hanya token warna, responsif sampai lebar 360 px, ramah pembaca layar, mendukung `prefers-reduced-motion`, ada keadaan memuat/kosong/galat.

**Selesai bila:** komponen dirender di Storybook-setara yang ada (kalau repo tidak punya, cukup tes render Vitest), typecheck dan lint bersih, `node scripts/cek-hex.js` lolos, dan tes render memastikan: jumlah baris = jumlah kelas, 16 kolom, label ARIA tiap sel benar, klik sel membuka sheet. Commit: `feat(kain-semester): komponen kisi dan sheet detail`.

### Fase G: Integrasi di beranda (satu-satunya perubahan pada berkas yang sudah ada)

1. `src/app/(portal)/student/page.tsx`: bila `isFeatureFlagActive('FF_KAIN_SEMESTER')`, tambahkan `getSemesterWeaveAction()` ke daftar `Promise.allSettled` yang ada, dan teruskan hasilnya sebagai prop baru `semesterWeave`. Bila flag mati, **jangan memanggilnya sama sekali**. Prop dibuat opsional dengan nilai bawaan `null`.
2. `student-dashboard-client.tsx`: pada blok `{(showAll || showKelasSaya) && (<StudentAcademicStatusCard .../>)}`, ganti menjadi: bila `semesterWeave` berisi data, render `<SemesterWeave .../>` (dan di bawahnya satu baris peringatan dini memakai logika teks dari `StudentAcademicStatusCard`, tanpa membuat ambang baru); selain itu render kartu lama persis seperti semula.
3. Jangan mengubah urutan section, kondisi filter chip, atau komponen lain.
4. Tes: render beranda dengan flag mati (hasil tidak berubah dari snapshot/perilaku lama) dan dengan flag menyala.

**Selesai bila:** kedua keadaan flag teruji, `npm run cek` hijau (kecuali kegagalan dasar yang sudah tercatat di Fase A), `node scripts/cek-hex.js` lolos. Commit: `feat(kain-semester): integrasi di beranda mahasiswa di belakang flag`.

### Fase H: Verifikasi menyeluruh

1. `npm run cek` dan `node scripts/cek-hex.js`. Bandingkan dengan hasil dasar Fase A: tidak boleh ada kegagalan baru.
2. Jalankan aplikasi dengan `FF_KAIN_SEMESTER=true` dan periksa manual (catat hasil dan tangkapan layar ke `docs/PROGRESS_KAIN_SEMESTER.md`):
   - Lebar 360, 768, 1280 px. Tidak ada gulir horizontal pada halaman.
   - Tema terang dan gelap.
   - Akun baru tanpa kelas, satu kelas, delapan kelas.
   - Kelas dengan sesi sebagian (misalnya baru 3 pekan).
   - Navigasi keyboard (Tab ke tiap sel, Enter membuka sheet, Esc menutup).
   - Pembaca layar membaca label sel dengan benar (periksa atribut ARIA di DOM).
3. Jalankan ulang dengan `FF_KAIN_SEMESTER=false`: beranda harus identik dengan sebelum fitur.
4. Cek performa kasar: jumlah query per muat tidak lebih dari lima.

**Selesai bila:** semua butir di atas tercatat lulus. Bila ada yang gagal, perbaiki; kalau gagal dua kali, ikuti aturan berhenti di Prompt pembuka.

### Fase I: Dokumentasi dan laporan akhir

1. Perbarui `docs/PROGRESS_KAIN_SEMESTER.md`, `docs/KEPUTUSAN.md`, dan `docs/IDE_LANJUTAN.md` (temuan di luar cakupan + ide lanjutan).
2. Isi `docs/ROLLBACK_KAIN_SEMESTER.md` dengan **hash commit tiap fase** (hasil `git log --oneline pra-kain-semester..HEAD`).
3. Laporan akhir di chat: fitur yang selesai, yang sengaja ditunda beserta alasan, keputusan yang diambil, hasil pemeriksaan dasar vs akhir, dan cara menyalakan fitur (`FF_KAIN_SEMESTER=true` lalu deploy ulang).
4. **Jangan merge ke `main` dan jangan push.** Biarkan keputusan merge pada saya.

---

## 5. Aturan data dan logika

### 5.1 Definisi

- **Pekan** = nomor 1 sampai 16. Untuk presensi, pekan = `attendance_sessions.session_number`.
- **Hari ini (WIB)** = tanggal kalender di Asia/Jakarta dari `now`.
- `session_date` bertipe DATE tanpa zona: perlakukan sebagai tanggal WIB.

### 5.2 Pekan sekarang

Utama: `semesterStart` = `session_date` terkecil dari semua sesi bernomor 1 milik kelas aktif mahasiswa. `week = floor((hariIniWIB - semesterStart) / 7 hari) + 1`, dijepit ke 1 sampai 16. Bila `hariIniWIB < semesterStart`, `week = 0` (semester belum mulai; tidak ada kolom "sekarang").

Cadangan (bila tidak ada sesi nomor 1): `week` = nomor sesi terbesar yang `session_date <= hariIniWIB`. Bila tidak ada sama sekali: `week = null` dan tampilkan keadaan kosong "Semester belum dimulai".

Bila audit Fase B menunjukkan pola data yang membuat rumus utama keliru (misalnya dosen membuat sesi jauh sebelum tanggal kuliah), catat dan sesuaikan di `KEPUTUSAN.md`, lalu tulis tesnya.

### 5.3 Rencana query (maksimal lima)

Semua memakai klien `createClient()` yang menghormati RLS, dengan `student_id = user.id`.

1. `enrollments` (`class_id`, relasi `classes(id, title, section, status, deleted_at)`), `student_id = me`, `status = 'ACTIVE'`, kelas tidak terhapus.
2. `attendance_sessions` (`id`, `class_id`, `session_number`, `session_date`, `is_open`, `title`) untuk `class_id in (...)`.
3. `assignments` (`id`, `class_id`, `title`, `due_at`, `close_at`, `status`) untuk `class_id in (...)` dan `status in ('PUBLISHED','CLOSED')`.
4. `attendance_records` (`session_id`, `status`, `check_in_at`) untuk `student_id = me` dan `session_id in (...)`.
5. `submissions` (`assignment_id`, `status`, `submitted_at`, `is_late`) untuk `student_id = me`, `assignment_id in (...)`, dan `status <> 'DRAFT'`.

Query 2 dan 3 paralel; query 4 dan 5 paralel setelahnya. Penyusunan sel dilakukan di memori dengan peta (`Map`) berkunci `kelas:pekan`.

### 5.4 Tabel keputusan status sel

Evaluasi **berurutan**, berhenti pada aturan pertama yang cocok. `n` = nomor pekan kolom, `W` = pekan sekarang.

| # | Syarat | Status | Arti bagi mahasiswa |
|---|---|---|---|
| 1 | `W` kosong atau `n > W` | `BELUM` | Pekan belum tiba |
| 2 | `n == W` | `SEKARANG` | Pekan berjalan (jangan dinilai) |
| 3 | `n < W` dan kelas tak punya sesi nomor `n` | `TANPA_SESI` | Tidak ada pertemuan tercatat |
| 4 | Rekaman `ALPA`, atau sesi ada tetapi tak ada rekaman | `TERLEWAT` | Tidak hadir |
| 5 | Rekaman `IZIN` atau `SAKIT` | `IZIN` | Izin atau sakit (tidak dihitung terlewat) |
| 6 | Rekaman `HADIR` atau `TERLAMBAT`, dan ada tugas pekan itu yang sudah lewat tenggat tanpa pengumpulan | `SEBAGIAN` | Hadir, tugas belum masuk |
| 7 | Rekaman `HADIR` atau `TERLAMBAT` | `LENGKAP` | Hadir, dan tugas (jika ada) masuk |

**Tugas masuk pekan mana:** `assignWeek(due_at, semesterStart)` = `floor((tanggalWIB(due_at) - semesterStart) / 7) + 1`, dijepit 1 sampai 16. **Tugas "sudah masuk"** = ada `submissions` berstatus selain `DRAFT` (terlambat tetap dihitung masuk; tampilkan penanda "terlambat" di sheet). **Tugas "menunggu"** = belum ada pengumpulan, dan `due_at` belum lewat atau `close_at` belum lewat (lihat catatan di bawah). **Tugas "tertinggal"** (pemicu `SEBAGIAN`) = belum ada pengumpulan dan `close_at` sudah lewat. Pastikan definisi `due_at` vs `close_at` ini sesuai perilaku aplikasi di Fase B; kalau berbeda, ikuti aplikasi dan catat.

### 5.5 Ringkasan di bawah kisi

Satu kalimat netral dari data: jumlah pekan terlewat (`TERLEWAT`) dan jumlah tugas menunggu pada pekan sekarang atau sebelumnya. Contoh: "2 pekan terlewat, 1 tugas menunggu." Bila nol: "Semua pekan berjalan sesuai rencana." Dilarang menambah penilaian ("bagus", "buruk").

---

## 6. Spesifikasi tampilan

### 6.1 Struktur dan perilaku

- Pembungkus `<section aria-label="Kain semester">`. Judul "Kain semestermu" (sentence case) dan keterangan "Pekan {W} dari 16" di sisi kanan. Bila `W` kosong: "Semester belum dimulai".
- Kisi memakai `<table>`: `<th scope="row">` untuk nama mata kuliah, `<th scope="col">` untuk pekan (tampilkan label hanya untuk 1, 5, 9, 13, 16 dan pekan sekarang; sisanya `<span class="sr-only">`).
- Sel adalah `<button type="button">` dengan `aria-label` lengkap, contoh: "Algoritma, pekan 7: tidak hadir, 1 tugas belum dikumpulkan". Status dijelaskan dalam teks, tidak hanya warna.
- Lebar kolom label nama: 72 sampai 110 px, dipotong dengan `text-overflow: ellipsis` dan `title` berisi nama penuh. 16 kolom berbagi sisa lebar secara merata. Sel berbentuk persegi, sudut kecil. Pada lebar 360 px sel kira-kira 15 sampai 16 px: sediakan area sentuh efektif lebih besar (misalnya `::after` yang meluas 2 px) tanpa membuat sel saling tumpang tindih. Sebagai jaring pengaman, bungkus tabel dengan `overflow-x: auto` agar halaman tidak pernah bergulir horizontal.
- Baris diurutkan alfabetis menurut label tampilan, stabil antar-muat.

### 6.2 Pengkodean status (hanya token; tanpa hex)

Warna **dan** bentuk, agar terbaca oleh pengguna buta warna:

| Status | Tampilan |
|---|---|
| `LENGKAP` | Isi penuh `bg-ink` |
| `SEBAGIAN` | Separuh isi (gradasi dua warna dengan batas tegas memakai `var(--ink)` dan `var(--gray-soft)`) |
| `IZIN` | Isi `bg-gray-dark` dengan garis diagonal tipis |
| `TERLEWAT` | Kotak kosong `bg-surface` dengan garis tepi `border-gray` (tampak seperti lubang) |
| `TANPA_SESI` | Tepi putus-putus tipis, tanpa isi |
| `BELUM` | Isi `bg-gray-soft` |
| `SEKARANG` | Garis tepi 2 px `border-primary` (merah), isi sesuai keadaan presensi hari ini bila sudah ada rekaman |

**Merah (`primary`) hanya dipakai untuk `SEKARANG`** dan label pekan sekarang. Jangan memakainya untuk `TERLEWAT`.

Legenda di bawah kisi menampilkan keenam bentuk dengan label teks pendek: "Lengkap", "Hadir, tugas belum masuk", "Izin atau sakit", "Terlewat", "Belum", "Pekan ini".

### 6.3 Sheet detail

Dibuka saat sel diklik. Judul: "{Mata kuliah}, pekan {n}". Isi:
- Presensi: "Hadir", "Hadir (terlambat)", "Izin", "Sakit", "Tidak hadir", atau "Belum ada sesi", beserta tanggal sesi (format WIB).
- Judul sesi (`attendance_sessions.title`) bila ada.
- Daftar tugas pekan itu: judul, tenggat (WIB), dan status: "Sudah dikumpulkan", "Dikumpulkan terlambat", "Belum dikumpulkan". Bila tidak ada tugas: "Tidak ada tugas di pekan ini."
- Tautan "Buka kelas" ke halaman kelas (rute dari audit).
- Tutup dengan tombol Tutup, tombol Esc, dan klik di luar. Fokus kembali ke sel pemicu. Perangkap fokus selama terbuka. Gunakan `@radix-ui/react-dialog` yang sudah ada.
- Layar sempit: panel menempel di bawah dengan sudut atas membulat. Layar lebar: dialog di tengah.

### 6.4 Keadaan khusus

- **Memuat:** kerangka abu (skeleton) dengan tinggi sama seperti kisi, tanpa lonjakan tata letak.
- **Kosong (tanpa kelas aktif):** "Kamu belum terdaftar di kelas mana pun." plus tautan "Buka Kelas Saya" ke `/classes`.
- **Semester belum dimulai:** "Semester belum dimulai. Kisimu akan terisi mulai pekan pertama kuliah."
- **Galat:** "Kain semester belum bisa dimuat. Coba muat ulang halaman." Tanpa detail teknis.
- **Gerak:** satu-satunya animasi adalah garis "sekarang" yang muncul sekali saat dimuat (opasitas, maksimal 300 ms). Hormati `prefers-reduced-motion: reduce` (tanpa animasi sama sekali).
- **Tipografi:** pakai font yang sudah ada. Angka jam, tanggal, dan nomor pekan memakai `font-variant-numeric: tabular-nums`.

### 6.5 Baris peringatan dini di bawah kisi

Ambil teks dari logika `StudentAcademicStatusCard` yang sudah ada (jangan menciptakan ambang atau kalimat risiko baru). Bila semua aman, cukup satu kalimat singkat. Sertakan catatan yang sudah ada di kartu lama bahwa sistem adalah alat bantu pemantauan, bukan sanksi atau pengurangan nilai otomatis.

---

## 7. Rollback (BACA SEBELUM MULAI, dan salin ke `docs/ROLLBACK_KAIN_SEMESTER.md`)

Fitur ini dirancang agar bisa dicabut tanpa menyentuh database, karena tidak ada migrasi. Ada empat tingkat, dari yang paling cepat.

### Tingkat 0: Matikan fitur (tanpa mengubah kode, paling cepat)

1. Di pengaturan environment hosting (Vercel), hapus `FF_KAIN_SEMESTER` atau ubah menjadi `false`.
2. **Deploy ulang** (perubahan environment di Vercel baru berlaku setelah deploy baru).
3. Hasil: `/student` kembali menampilkan kartu "Status akademik dan peringatan dini" lama. Kode fitur tetap ada tetapi tidak dipakai.
4. Lokal: set `FF_KAIN_SEMESTER=false` di `.env.local`, lalu restart `npm run dev`.

### Tingkat 1: Batalkan lewat git revert (aman untuk riwayat bersama)

Pakai ini bila fitur sudah ter-merge ke `main` dan dipakai bersama.

```bash
# Lihat commit fitur (awalan kain-semester) atau rentang dari tag:
git log --oneline pra-kain-semester..HEAD

# Batalkan seluruh rentang commit fitur dalam satu perintah (membuat commit pembatal baru):
git revert --no-edit pra-kain-semester..HEAD

# Bila fitur masuk lewat satu merge commit, batalkan merge itu:
git revert -m 1 <hash-merge-commit>
```

Untuk membatalkan **satu fase saja**, revert hash commit fase itu (daftar hash ada di `docs/ROLLBACK_KAIN_SEMESTER.md`). Urutan aman: revert dari fase terbaru ke terlama (I, H, G, ... A).

### Tingkat 2: Buang cabang (fitur belum ter-merge)

```bash
git checkout main
git branch -D fitur/kain-semester
# Bila cabang pernah di-push dan ingin dihapus di remote (hanya dengan izin saya):
# git push origin --delete fitur/kain-semester
```

Tag `pra-kain-semester` boleh dibiarkan sebagai penanda.

### Tingkat 3: Kembalikan berkas tertentu ke kondisi awal

```bash
# Kembalikan satu berkas yang sudah ada ke versi sebelum fitur:
git checkout pra-kain-semester -- "src/app/(portal)/student/page.tsx"
git checkout pra-kain-semester -- "src/app/(portal)/student/student-dashboard-client.tsx"
git checkout pra-kain-semester -- src/lib/config/features.ts
git checkout pra-kain-semester -- .env.example
```

Berkas baru yang dibuat fitur ini (boleh dihapus bila ingin bersih total; tidak ada berkas lama yang tertimpa selain empat di atas):

```
src/lib/akademik/semester-weave.ts
src/modules/academic/semester-weave-actions.ts
src/components/home/semester-weave.tsx
src/components/home/semester-weave-sheet.tsx
src/tests/unit/semester-weave/
docs/AUDIT_KAIN_SEMESTER.md  docs/PROGRESS_KAIN_SEMESTER.md  docs/ROLLBACK_KAIN_SEMESTER.md
```

### Database

Tidak ada migrasi, jadi **tidak ada yang perlu dibatalkan di database**. Bila (dengan persetujuan saya) sebuah migrasi indeks sempat ditambahkan, SQL pembatalannya ada di komentar atas berkas migrasi itu (`DROP INDEX IF EXISTS ...`); jalankan manual di Supabase SQL Editor, lalu hapus berkas migrasinya lewat commit pembatal.

### Verifikasi setelah rollback (wajib)

1. `git status` bersih, `git log --oneline -5` menunjukkan commit pembatal (untuk Tingkat 1).
2. `npm run typecheck && npm run lint && npm test` hasilnya sama dengan hasil dasar Fase A.
3. `node scripts/cek-hex.js` lolos.
4. Buka `/student`: kartu lama terlihat, tidak ada elemen Kain Semester, tidak ada galat di konsol.
5. `grep -rn "semester-weave\|FF_KAIN_SEMESTER" src .env.example` tidak menemukan sisa (kecuali sengaja dibiarkan pada Tingkat 0).

### Kapan agent harus membatalkan sendiri

- Satu fase gagal pemeriksaan dua kali berturut-turut: revert commit fase itu (`git revert <hash>`), tulis penyebab di `PROGRESS_KAIN_SEMESTER.md`, lalu **berhenti dan tanya saya**.
- Muncul kegagalan baru yang tidak ada di hasil dasar dan tidak bisa dijelaskan dalam dua percobaan perbaikan: ulangi langkah yang sama.
- RLS ternyata menghalangi mahasiswa membaca datanya sendiri: **berhenti** (jangan beralih ke service role) dan laporkan.
- Pohon kerja kotor di awal, atau perintah yang akan menimpa pekerjaan saya (`reset --hard`, `push --force`, `clean -fd`, `stash drop`) tampak diperlukan: **berhenti dan minta izin**. Perintah destruktif hanya dijalankan atas izin eksplisit saya.

---

## 8. Daftar periksa akhir (agent mencentang satu per satu di laporan)

- [ ] Tag `pra-kain-semester` dan cabang `fitur/kain-semester` ada; tidak ada commit ke `main`.
- [ ] `FF_KAIN_SEMESTER` default mati; ada di `.env.example`.
- [ ] Flag mati: `/student` identik dengan sebelumnya; kartu lama utuh.
- [ ] Tidak ada migrasi, tidak ada dependensi baru, tidak ada service role.
- [ ] Maksimal lima query, tanpa N+1; semua dengan klien yang menghormati RLS.
- [ ] 18 kasus uji logika hijau; tes aksi dan komponen hijau.
- [ ] `npm run cek` tidak lebih buruk dari hasil dasar; `node scripts/cek-hex.js` lolos.
- [ ] Tidak ada hex di luar palet; tidak ada kata terlarang di antarmuka.
- [ ] Label ARIA tiap sel benar; navigasi keyboard berfungsi; `prefers-reduced-motion` dihormati.
- [ ] Lebar 360/768/1280 px dan tema terang/gelap diperiksa; tidak ada gulir horizontal halaman.
- [ ] `docs/ROLLBACK_KAIN_SEMESTER.md` berisi hash tiap fase; semua temuan di luar cakupan tercatat di `IDE_LANJUTAN.md`.
- [ ] Tidak ada merge dan tidak ada push yang dilakukan tanpa izin saya.
