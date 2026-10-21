# SIAJAR — Instruksi Seed Data Akademik untuk Antigravity

Prodi Teknik Informatika, Universitas Islam Riau · Semester Ganjil 2026/2027 · Versi 1 · Oktober 2026

Berkas ini melengkapi `docs/INSTRUKSI_ANTIGRAVITY.md` dan `docs/INSTRUKSI_PETA_PULAU.md`. Aturan umum di dua dokumen itu (RLS wajib, gagal tertutup, pelaporan jujur, tulisan antarmuka natural) tetap berlaku. Taruh berkas ini di `docs/INSTRUKSI_SEED_AKADEMIK.md` dan salin isi `seed-akademik-data.zip` ke `docs/seed-data/`.

---

## Prompt pembuka (tempel ke Antigravity)

```
Baca docs/INSTRUKSI_SEED_AKADEMIK.md sampai habis, lalu semua berkas di docs/seed-data/.

Buat cabang baru (seed-akademik-uir) dari cabang utama. Kerjakan Fase S0 sampai S6 berurutan dan
mandiri, tanpa menunggu konfirmasi di antara fase. Bila ada hal yang tidak jelas, pilih opsi paling
aman, catat di docs/KEPUTUSAN_SEED_AKADEMIK.md, lalu lanjut.

Mulai dengan audit (S0). Semua nama tabel di dokumen adalah rujukan dari skema yang sudah saya
periksa, tetapi buktikan sendiri dari migrasi yang ada.

Keselamatan: skrip seed TIDAK BOLEH berjalan terhadap proyek Supabase produksi. Ikuti seluruh
bagian 2 dokumen. Jangan menaruh kata sandi apa pun di repo. Jangan menyebut "selesai" untuk apa
pun yang belum punya bukti keluaran perintah atau tes yang benar-benar dijalankan.
```

---

## 1. Hasil akhir yang harus ada (angka pasti)

Setelah seed berhasil di database lokal atau staging:

- **168 akun login**: 120 mahasiswa (NIM), 42 dosen (NIDN), 6 staf dan admin (NIP). Asisten dosen adalah 16 dari 120 mahasiswa itu, jadi masuk dengan NIM.
- **120 mahasiswa**: 30 per angkatan 2023, 2024, 2025, 2026. NIM berbentuk `{23|24|25|26}3510{001-030}`.
- **42 dosen** bernama baru (fiktif) dengan gelar lengkap dan NIDN 10 digit. Satu di antaranya Kaprodi, satu lagi pengganti Wakil Dekan I yang tidak mengajar.
- **6 akun staf dan admin** dengan NIP 8 digit: 3 Staf Akademik, 2 System Admin, 1 Super Admin.
- **1 program studi** (kode `351`, Teknik Informatika), **1 semester** (Ganjil 2026/2027), **14 ruang**.
- **63 mata kuliah** (seluruh Kurikulum 2025) dan **164 kelas** (152 kelas inti dan 12 kelas pilihan) untuk semester ganjil.
- **256 slot jadwal mingguan** (Senin sampai Jumat).
- **870 pendaftaran** (mahasiswa ke kelas).
- **56 penugasan asisten dosen** oleh 16 orang, masing-masing dua izin per kelas, sehingga 112 baris izin.

Semua angka ini harus dicek ulang oleh skrip verifikasi di Fase S6 dan dilaporkan apa adanya.

## 2. Aturan keselamatan (wajib)

Repo ini **publik**. Seed pernah membuat akun demo berdomain kampus asli di tempat yang tidak semestinya. Karena itu:

1. **Skrip tidak menyimpan dan tidak meminta kata sandi di kode.** Kata sandi semua akun seed dibaca dari variabel lingkungan `SEED_PASSWORD` (minimal 12 karakter). Bila kosong atau terlalu pendek, skrip berhenti. Jangan pernah mencetak kata sandi ke log. Jangan menaruhnya di `.env.example`, dokumen, atau tes yang dikomit (di CI pakai nilai sekali pakai dari secret atau dari langkah workflow untuk database lokal sementara).
2. **Guard lingkungan, gagal tertutup.** Skrip hanya boleh berjalan bila:
   - `SEED_ENV` tepat bernilai `local` atau `staging`;
   - `SEED_CONFIRM_PROJECT_REF` sama dengan ref proyek yang terbaca dari `NEXT_PUBLIC_SUPABASE_URL` (untuk alamat `127.0.0.1` atau `localhost` nilainya harus `local`);
   - `NODE_ENV` dan `VERCEL_ENV` bukan `production`.
   Nilai kosong, tidak dikenal, atau tidak cocok membuat skrip berhenti dengan pesan jelas sebelum menyentuh database.
3. **Cegah tercampur dengan pengguna nyata.** Sebelum menulis, periksa `auth.users`. Jika ada email yang tidak berakhiran `@mhs.siajar.test`, `@dosen.siajar.test`, atau `@staf.siajar.test`, skrip berhenti kecuali `SEED_ALLOW_EXISTING_USERS=true` diberikan secara eksplisit.
4. **Domain email khusus `.test`** (domain yang dicadangkan RFC 2606 dan tidak bisa menerima surel). Jangan memakai `@uir.ac.id` atau `@student.uir.ac.id`. Bila alur login kata sandi memeriksa `allowed_email_domains`, tambahkan tiga domain `.test` itu **hanya lewat skrip seed** (bukan lewat migrasi) dan catat di keputusan.
5. **Mode kering dulu.** Perintah bawaan adalah `--dry-run` (hanya memvalidasi dan mencetak jumlah). Penulisan sungguhan memerlukan `--apply`. Penghapusan data seed memerlukan `--reset` dan hanya menghapus akun berdomain `.test` beserta data turunannya.
6. **Idempoten.** Menjalankan `--apply` dua kali tidak menggandakan apa pun (upsert berkunci NIM, NIDN, NIP, kode kelas, dan seterusnya).
7. **`.gitignore`**: tambahkan `docs/seed-data/PEMETAAN_RAHASIA_*` dan `.env.seed*`. Berkas `PEMETAAN_RAHASIA_dosen_lama_ke_baru.csv` memuat nama asli dari jadwal dan **tidak boleh dikomit**. Berkas CSV lain aman (semua fiktif).

## 3. Berkas data yang disediakan (di `docs/seed-data/`)

Jangan menebak atau mengurai ulang PDF jadwal. Semua data sudah dibersihkan, dicek, dan dijadikan CSV:

- `kurikulum_2025.csv` (63 baris): semester, kode kurikulum, nama, SKS teori dan praktik, prasyarat, kategori, rumpun pilihan, jenis (wajib atau pilihan).
- `pemetaan_kode_jadwal_kurikulum.csv` (38 baris): kode di jadwal dan kode kurikulum untuk mata kuliah yang sama.
- `jadwal_ganjil_2026_2027.csv` (256 baris): `id_sesi`, hari, jam mulai dan selesai, komponen (Teori atau Praktikum), SKS, kode jadwal, kode kurikulum, mata kuliah, kelas, tingkat, penanda mata kuliah pilihan, id ruang, id dosen (dipisah `;` bila dua dosen), nama dosen.
- `ruang.csv` (14), `dosen_baru.csv` (42), `mahasiswa.csv` (120), `krs_pendaftaran.csv` (870), `asdos_penugasan.csv` (56), `staf_admin.csv` (6).
- `bentrok_jadwal_sumber.csv` (41) dan `bentrok_mahasiswa_terdaftar.csv` (19 mahasiswa): lihat bagian 6.
- `README_DATA.md`: ringkasan kolom.

Validasi setiap berkas dengan Zod saat dimuat (tipe, panjang, format) dan hentikan seluruh proses bila ada baris yang tidak lolos.

## 4. Aturan identitas dan login

- **NIM** (mahasiswa dan asisten dosen): 9 digit, regex `^(23|24|25|26)3510\d{3}$`. Dua digit pertama angkatan, `3510` tetap, tiga digit terakhir urut 001 sampai 030.
- **NIDN** (dosen): 10 digit, empat digit pertama sama dengan `tahun_masuk` pada `dosen_baru.csv`. Contoh: Kaprodi `2008000307`.
- **NIP** (staf dan admin): 8 digit, empat digit pertama tahun masuk. Contoh: Super Admin `20120009`.
- Ketiganya disimpan di `user_identifiers` dengan tipe `NIM`, `NIDN`, `NIP`, `is_primary = true`. Pasangan (tipe, nilai) harus unik.
- Login memakai alur yang sudah ada: identitas dipetakan ke email lewat `user_identifiers`, lalu masuk dengan kata sandi. **Buktikan** dengan uji bahwa login dengan NIM, NIDN, dan NIP bekerja (bagian 10).
- Email teknis: `{nim}@mhs.siajar.test`, `{nidn}@dosen.siajar.test`, `{nip}@staf.siajar.test`.
- Akun dibuat lewat **Admin API Supabase** (`auth.admin.createUser` dengan `email_confirm: true` dan `user_metadata.full_name`), bukan dengan `INSERT` langsung ke `auth.users`. Pakai ulang logika penyediaan akun yang sudah ada di modul identitas bila ada (cari fungsi yang membuat pengguna sekaligus `user_identifiers` dan `user_roles`).
- `must_change_password`: `false` secara bawaan supaya demo mudah; jadikan `true` bila `SEED_FORCE_PASSWORD_CHANGE=true`.

## 5. Pemetaan angkatan, semester, dan rombel

Jadwal ini adalah semester ganjil, jadi tingkat kelas sama dengan semester berjalan:

- Angkatan 2026 (NIM 26…) = semester 1, rombel 1A sampai 1E (6 mahasiswa per rombel).
- Angkatan 2025 (NIM 25…) = semester 3, rombel 3A sampai 3E (6 per rombel).
- Angkatan 2024 (NIM 24…) = semester 5, rombel 5A sampai 5G (5, 5, 4, 4, 4, 4, 4).
- Angkatan 2023 (NIM 23…) = semester 7, rombel 7A sampai 7F (5 per rombel).

**Penting:** kode kelas `5A`, `5B`, dan `7A` dipakai ganda: sebagai nama rombel dan sebagai kelas mata kuliah pilihan (misalnya Keamanan Siber 5A). Keanggotaan rombel **selalu** diambil dari kolom `rombel` di `mahasiswa.csv`, dan pendaftaran mata kuliah dari `krs_pendaftaran.csv`. Jangan menyimpulkan keanggotaan dari kode kelas.

Mata kuliah pilihan: setiap mahasiswa semester 5 dan 7 mengambil tepat satu (tersebar 5 orang per kelas pilihan). Pemilihannya sudah dihitung supaya tumpang tindih dengan jadwal inti sekecil mungkin.

## 6. Temuan dari data sumber (jangan diabaikan)

1. **Kode jadwal tidak pernah sama dengan kode kurikulum** (0 dari 38). Contoh: Basis Data I memakai `STI2541110` di jadwal dan `STI2541114` di kurikulum. SKS-nya cocok untuk semua. Keputusan: `courses.code` memakai **kode kurikulum**, dan kode jadwal disimpan sebagai alias (tabel baru di S1).
2. **Jadwal sumber sudah memuat bentrok** (`bentrok_jadwal_sumber.csv`):
   - 31 bentrok dosen (16 dosen terdampak): 26 antara praktikum dan teori, 3 antara dua praktikum, 2 antara dua teori. Penafsiran: dosen yang tercatat pada praktikum bertindak sebagai penanggung jawab, sedangkan pelaksanaan di laboratorium dibantu asisten dosen. Karena itu penugasan asdos di data ini mencakup kelas praktikum tingkat 1, 3, dan inti tingkat 5.
   - 6 bentrok ruang, semuanya tumpang tindih 15 menit (blok 3 SKS 13:00-15:30 berhimpit dengan sesi 15:15).
   - 4 bentrok rombel (5E, 5F, 5A masing-masing 15 menit, dan 1D 50 menit pada Rabu).
   Keputusan: **data dimasukkan apa adanya** dan **tidak diperbaiki diam-diam**. Jangan menolak atau menggeser sesi. Tulis ringkasan bentrok di `docs/SEED_AKADEMIK.md`. Tampilnya peringatan bentrok di menu Jadwal Staf adalah perilaku yang diharapkan.
3. **Sebanyak 19 mahasiswa punya jadwal pribadi bertabrakan** (`bentrok_mahasiswa_terdaftar.csv`), sebagian karena bentrok rombel di atas dan sebagian karena kelas pilihan. Biarkan, jadikan bahan uji deteksi bentrok.
4. **Lima kelas diajar dua dosen** (Islam dan Keilmuan 3A sampai 3E). `classes.lecturer_id` hanya menampung satu dosen, jadi dosen pertama menjadi `lecturer_id` dan dosen kedua diberi peran `LECTURER` dengan cakupan `CLASS` pada kelas itu.
5. **Jadwal mingguan belum punya tempat di database.** Tabel `classes` tidak punya kolom hari, jam, atau ruang. Menu Jadwal Staf dan alur KRS lama memakai penyimpan sisi aplikasi (`src/features/jadwal`, `src/features/krs`) yang diisi dari `src/lib/db/seed-data.ts`. Karena itu ada dua jalur (bagian 8, S1 dan S5).
6. Daftar nama dosen lama hanya ada di berkas rahasia. Dosen baru dipetakan satu lawan satu, jadi struktur beban mengajar sama.

## 7. Pemetaan data ke skema database

Nama kolom di bawah berasal dari migrasi yang ada. Buktikan di S0 dan catat bila berbeda.

- `programs`: satu baris, `code = '351'`, `name = 'Teknik Informatika'`.
- `semesters`: satu baris, `label = 'Ganjil 2026/2027'`, `is_active = true`.
- `rooms`: 14 baris dari `ruang.csv` (`code`, `name`, `building`, `capacity`). `latitude`, `longitude`, `radius_meters` dibiarkan kosong. Presensi GPS memerlukan koordinat sungguhan yang diisi admin kemudian, dan catat itu di dokumen.
- `courses`: 63 baris dari `kurikulum_2025.csv` (`program_id`, `code` = kode kurikulum, `name` = nama Indonesia, `credits` = sks teori + praktik). Tabel baru `course_code_aliases` menyimpan kode jadwal (S1).
- `classes`: 164 baris. `title` = `{nama kurikulum} - Kelas {kelas}`, `section` = kelas, `capacity` = 40, `status` = `ACTIVE`, `course_id`, `semester_id`, `lecturer_id` = dosen pada slot teori (dosen pertama bila berdua), `created_by` = profil Kaprodi, `join_code` = 6 karakter huruf besar dan angka yang deterministik (hash dari kode dan kelas) dan unik.
- `enrollments`: 870 baris dari `krs_pendaftaran.csv`, `status = 'ACTIVE'`. Satu baris per kelas (komponen teori dan praktikum berbagi kelas yang sama).
- `class_schedule_slots` (**tabel baru**, S1): 256 baris dari `jadwal_ganjil_2026_2027.csv`.
- `profiles`, `user_identifiers`, `user_roles` dibuat bersama akun:
  - mahasiswa: peran `STUDENT`, cakupan `GLOBAL`;
  - dosen: peran `LECTURER` (ikuti pola cakupan di `seed.sql` yang ada); Kaprodi: `PROGRAM_COORDINATOR` dengan cakupan `PROGRAM` pada program 351, ditambah `LECTURER`;
  - staf: `ACADEMIC_STAFF`; administrator sistem: `SYSTEM_ADMIN`; administrator utama: `SUPER_ADMIN` dan `SYSTEM_ADMIN`;
  - asdos: `STUDENT` ditambah `TEACHING_ASSISTANT` dengan cakupan `CLASS` untuk setiap kelas yang dibantu (56 baris).
- `class_assistants`: untuk tiap penugasan di `asdos_penugasan.csv`, dua baris dengan `permission` bernilai `submission.review` dan `assignment.grade` (nilai yang diizinkan oleh constraint), `can_open_attendance = true`, `granted_by` = profil dosen kelas itu.
- Dosen wali: lihat S4 langkah 9. Relasinya ada di kolom `dosen_wali_id` dan `dosen_wali_nidn` pada `mahasiswa.csv`.

## 8. Fase pengerjaan

### S0. Audit (tulis `docs/AUDIT_SEED_AKADEMIK.md`, maksimal dua halaman)

1. Daftar kolom, constraint unik, dan constraint CHECK untuk semua tabel di bagian 7, termasuk `attendance_sessions` dan `class_assistants`.
2. Cari fungsi penyediaan akun yang sudah ada (pembuat pengguna beserta identitas dan peran). Putuskan memakainya ulang atau menulis pembungkus.
3. Cek alur login: apakah `allowed_email_domains` atau `email_allowlist` dipakai pada login kata sandi dengan NIM, dan apakah `must_change_password` mengalihkan pengguna.
4. Telusuri penyimpan data Jadwal Staf, KRS, dan perwalian (dosen wali): tabel Supabase atau penyimpan sisi aplikasi (`src/features/*`, `src/lib/db/seed-data.ts`). Catat bendera (`FF_PERSISTENCE` atau sejenisnya) yang menentukan jalur mana yang aktif.
5. Cari tabel prasyarat atau struktur kurikulum. Bila ada, isi dari `kurikulum_2025.csv`; bila tidak, lewati dan catat.
6. Putuskan Opsi untuk bagian jadwal: **Opsi A** bila ternyata sudah ada tabel jadwal mingguan di database (pakai itu); **Opsi B** (bawaan) bila tidak ada (buat `class_schedule_slots`).

### S1. Migrasi baru (satu berkas, nomor berikutnya setelah migrasi terakhir)

- `class_schedule_slots(id uuid pk, class_id uuid not null references classes on delete cascade, component text check in ('TEORI','PRAKTIKUM'), day_of_week smallint check 1..5 (1 = Senin), start_time time, end_time time check > start_time, room_id uuid references rooms, lecturer_id uuid references profiles, sks smallint, source_ref text, created_at)` dengan unik pada `(class_id, component, day_of_week, start_time)`.
- `course_code_aliases(id uuid pk, course_id uuid not null references courses on delete cascade, alias_code text not null unique, source text not null)`.
- RLS aktif pada keduanya. Baca: anggota kelas (pakai `is_class_member`), Staf Akademik, Koordinator, dan admin. Tulis: hanya Staf Akademik dan Super Admin. Pakai fungsi pembantu yang sudah ada (`has_global_role`, `has_active_role`, `is_class_member`, `is_class_staff`).
- Uji pgTAP: mahasiswa membaca slot kelasnya sendiri, tidak membaca slot kelas lain yang bukan anggotanya (bila aturan baca dibatasi begitu), dan **tidak bisa** menulis atau menghapus.
- Migrasi harus lolos dijalankan berurutan dari database kosong (jangan mengulang kesalahan nama kolom atau fungsi yang tidak ada).

### S2. Kerangka skrip (`scripts/seed-akademik/`, TypeScript, jalankan dengan `tsx`)

- `index.ts` (CLI: `--dry-run` bawaan, `--apply`, `--reset`), `guard.ts` (aturan bagian 2), `load.ts` (baca CSV dengan Zod), `accounts.ts`, `academic.ts`, `verify.ts`.
- Tambahkan skrip npm `seed:akademik`. Skrip memakai klien admin Supabase dari variabel lingkungan yang sudah dipakai repo.
- Validasi sebelum menulis: format NIM, NIDN (empat digit pertama = tahun masuk), NIP; semua NIM, NIDN, NIP unik; setiap `id_dosen` pada jadwal ada di `dosen_baru.csv`; setiap `kode_jadwal` ada di pemetaan; setiap `nim` pada KRS dan asdos ada di `mahasiswa.csv`; tidak ada kelas tanpa peserta.
- Tulis unit test untuk validator dan guard (guard harus menolak: `SEED_ENV` kosong, `production`, ref tidak cocok, `NODE_ENV=production`).

### S3. Akun dan peran

Buat 168 akun, `user_identifiers`, dan `user_roles` sesuai bagian 4 dan 7. Tulis dalam kelompok kecil dengan penanganan galat per baris dan ringkasan di akhir. Jangan menghentikan seluruh proses karena satu galat, tetapi tandai dan laporkan.

### S4. Data akademik (urutan wajib)

1. `programs`, 2. `semesters`, 3. `rooms`, 4. `courses` dan `course_code_aliases`, 5. `classes` (dengan peran `LECTURER` cakupan `CLASS` untuk dosen kedua pada 5 kelas Islam dan Keilmuan), 6. `class_schedule_slots`, 7. `enrollments`, 8. `class_assistants` dan peran `TEACHING_ASSISTANT` cakupan `CLASS`, 9. dosen wali (simpan di tempat yang ditemukan pada S0; jangan membuat tabel baru tanpa mencatat alasannya di keputusan; bila tidak ada tempat penyimpanan sama sekali, catat dan lewati).
10. **Pertemuan (opsional, aktif bila `SEED_WITH_PERTEMUAN=true`)**: bila `attendance_sessions` mendukungnya, buat pertemuan 1 sampai 16 per kelas berdasarkan slot **teori**: tanggal = `TANGGAL_MULAI_KULIAH` (bawaan `2026-08-31`, Senin) + (n-1) minggu + (hari-1). Bila skema membatasi satu baris per (kelas, nomor pertemuan), cukup slot teori dan catat bahwa praktikum tidak dibuatkan pertemuan terpisah.

### S5. Lapisan lama (hanya bila S0 menemukan Jadwal atau KRS masih membaca `src/lib/db/seed-data.ts`)

- Buat penghasil berkas `src/lib/db/seed-data.uir-ti-2026.generated.ts` dari CSV yang sama, dipilih dengan variabel `SEED_DATASET=uir-ti-2026`. **Jangan menghapus atau mengubah seed lama** dan jangan mengubah perilaku bawaan, karena ratusan tes bergantung padanya.
- Pastikan halaman Jadwal Staf, KRS Mahasiswa, dan perwalian menampilkan data baru bila variabel itu aktif. Tulis tes ringan yang memeriksa jumlah data.
- Bila semua halaman itu sudah membaca database, lewati S5 dan catat.

### S6. Verifikasi dan dokumen

1. `verify.ts` menjalankan semua kueri verifikasi bagian 10 dan mencetak lulus atau gagal per butir.
2. Tambahkan langkah opsional di CI (setelah `supabase db reset`): jalankan `seed:akademik --apply` dengan `SEED_ENV=local` dan kata sandi sekali pakai untuk database lokal sementara, lalu `verify`. Ini bukti pertama bahwa seed benar-benar berjalan.
3. Tulis `docs/SEED_AKADEMIK.md`: cara menjalankan (variabel lingkungan, `--dry-run`, `--apply`, `--reset`), daftar akun contoh (tanpa kata sandi), ringkasan bentrok sumber, dan asumsi.
4. Tulis `docs/KEPUTUSAN_SEED_AKADEMIK.md` dan `docs/PROGRESS_SEED_AKADEMIK.md` dengan status jujur per butir (selesai, sebagian, belum), nama tes, dan keluaran perintah yang benar-benar dijalankan.

## 9. Aturan skenario data

- **Kaprodi** adalah `D004` (Dr. Ir. Rahmawati Kartika Sari, M.Sc., NIDN `2008000307`), mengajar Struktur Data seperti pada jadwal. **Pengganti Wakil Dekan I** (`D002`, `asal = Pejabat Fakultas`) tidak punya jadwal mengajar.
- **Dosen wali**: 8 dosen, dua per angkatan (15 mahasiswa masing-masing): angkatan 2023 oleh `D018` dan `D007`, 2024 oleh `D031` dan `D027`, 2025 oleh `D024` dan `D037`, 2026 oleh `D033` dan `D040`.
- **Asisten dosen (16, NIM)**: 233510001, 233510002, 233510006, 233510007, 233510008, 233510012, 233510013, 233510018, 233510019, 233510024, 233510025, 233510030, 243510006, 243510007, 243510012, 243510024. Penugasannya tidak bertabrakan dengan jadwal kuliah mereka sendiri dan dengan penugasan lain (sudah dihitung). Satu asdos membantu paling banyak 4 kelas.
- Akun seed **tidak** boleh membawa data aktivitas (nilai, presensi, pengumpulan tugas) kecuali `SEED_WITH_ACTIVITY=true`, dan fitur itu **tidak** termasuk pekerjaan ini. Biarkan kosong.
- Bila `SEED_FORCE_PASSWORD_CHANGE` tidak diberikan, `must_change_password = false`.

## 10. Verifikasi dan uji login

**Kueri yang harus lulus** (jalankan lewat `verify.ts` dan tampilkan hasilnya):

- `count(*)` pada `user_identifiers` berdasarkan tipe: NIM = 120, NIDN = 42, NIP = 6.
- `count(*)` pada `auth.users` berdomain `.test` = 168.
- `programs` = 1 (kode `351`), `semesters` = 1, `rooms` = 14, `courses` = 63.
- `classes` untuk semester itu = 164 (152 inti dan 12 pilihan), `class_schedule_slots` = 256, `enrollments` aktif = 870.
- Mahasiswa per angkatan = 30; ukuran rombel sesuai bagian 5; setiap kelas punya 4 sampai 6 peserta.
- `class_assistants` = 112 baris dari 56 kelas dan 16 orang; `user_roles` `TEACHING_ASSISTANT` cakupan `CLASS` = 56.
- Kelas dengan dua dosen: 5 (dosen kedua punya peran `LECTURER` cakupan `CLASS`).
- Peran: `PROGRAM_COORDINATOR` = 1, `ACADEMIC_STAFF` = 3, `SYSTEM_ADMIN` = 3, `SUPER_ADMIN` = 1.
- Tidak ada akun yang berdomain `uir.ac.id` atau `student.uir.ac.id` dan tidak ada baris dengan nama dosen lama (cocokkan terhadap berkas rahasia secara lokal bila ada; jangan komit hasilnya).
- Menjalankan `--apply` kedua kali tidak mengubah satu pun jumlah di atas.

**Uji login (Playwright atau skrip, terhadap database lokal)**, dengan kata sandi dari `SEED_PASSWORD`:

- Mahasiswa `243510001`: masuk dan melihat kelas semester 5 miliknya (6 kelas inti dan satu kelas pilihan).
- Asisten dosen `233510001`: melihat kelas asistensinya selain kelas kuliahnya sendiri.
- Dosen Kaprodi `2008000307`: menu Koordinator tersedia.
- Staf `20110017`, System Admin `20160042`, Super Admin `20120009`: masuk dan menu sesuai peran.
- Percobaan masuk dengan NIM yang tidak ada ditolak dengan pesan yang tidak membocorkan apakah NIM itu terdaftar.

## 11. Hal yang dilarang

- Menjalankan seed ke proyek produksi, atau melonggarkan guard di bagian 2.
- Menyimpan atau mencetak kata sandi, atau menaruhnya di repo.
- Menggunakan domain email kampus asli.
- Mengomit `PEMETAAN_RAHASIA_*`.
- Mengubah migrasi lama atau seed lama (`seed.sql`, `demo_seed.sql`, `seed-data.ts`) selain yang tertulis di sini.
- Memperbaiki bentrok jadwal sumber secara diam-diam, atau menambah fitur di luar dokumen ini. Ide tambahan dicatat di `docs/IDE_LANJUTAN.md`.
- Menulis "selesai" untuk butir yang belum punya keluaran perintah atau tes yang dijalankan.

## 12. Asumsi yang perlu dikonfirmasi pengguna

Catat tiap asumsi ini di `docs/KEPUTUSAN_SEED_AKADEMIK.md` sebagai "belum dikonfirmasi":

- Tanggal mulai perkuliahan `2026-08-31` hanyalah perkiraan.
- Kapasitas ruang (40 untuk kelas, 30 untuk laboratorium) hanya perkiraan.
- NIDN dan NIP rekaan mengikuti aturan yang Anda minta (empat digit pertama = tahun masuk), bukan nomor resmi.
- Kode kurikulum dijadikan kode utama dan kode jadwal menjadi alias. Bila Anda lebih suka sebaliknya, ubah di S4 langkah 4.
- Wakil Dekan I diganti dengan satu dosen fiktif tanpa jadwal mengajar. Hapus bila tidak diperlukan.
