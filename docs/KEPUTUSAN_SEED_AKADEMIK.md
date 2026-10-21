# Log Keputusan dan Asumsi Seed Data Akademik SIAJAR

Dokumen ini mencatat keputusan arsitektur, penyesuaian teknis, dan asumsi kerja selama pengerjaan seed data akademik Prodi Teknik Informatika UIR Semester Ganjil 2026/2027.

---

## 1. Asumsi Kerja (Perlu Dikonfirmasi Pengguna / Belum Dikonfirmasi)

1. **Tanggal Mulai Perkuliahan:** Menggunakan asumsi Senin, `2026-08-31` sebagai patokan tanggal pertemuan ke-1 (`SEED_WITH_PERTEMUAN=true`). *(Status: Belum dikonfirmasi)*.
2. **Kapasitas Ruang:** Ruang kelas default 40 kursi, laboratorium 30 kursi sesuai estimasi CSV. *(Status: Belum dikonfirmasi)*.
3. **Format NIDN dan NIP Rekaan:** Mengikuti aturan empat digit pertama = tahun masuk (contoh Kaprodi: `2008000307`, Super Admin: `20120009`), bukan nomor resmi PDDIKTI/Kemdikbud. *(Status: Belum dikonfirmasi)*.
4. **Kode Kurikulum vs Kode Jadwal:** Kode kurikulum Kurikulum 2025 dijadikan `courses.code` utama, dan kode jadwal disimpan sebagai alias pada tabel `course_code_aliases`. *(Status: Belum dikonfirmasi)*.
5. **Dosen Pengganti Wakil Dekan I:** Menggunakan profil dosen fiktif `D002` tanpa jadwal mengajar langsung di kelas TI semester ganjil. *(Status: Belum dikonfirmasi)*.

---

## 2. Keputusan Teknis Berdasarkan Audit S0–S6

1. **Pilihan Opsi Jadwal (Opsi B - Fase S1):**
   Karena skema database eksisting belum memiliki tabel jadwal mingguan berkolom hari, jam, komponen, dan ruang, diputuskan membuat tabel baru `public.class_schedule_slots` dan `public.course_code_aliases` melalui migrasi `20261021000035_class_schedule_slots_and_aliases.sql` lengkap dengan RLS, trigger, indeks performa, dan pengujian pgTAP.
2. **Format `classes.join_code`:**
   Skema tabel `classes` mendefinisikan `join_code CHAR(8) NOT NULL UNIQUE`. Agar tidak terjadi padding spasi liar (`'ABC123  '`), kode gabung kelas digenerate tepat 8 karakter huruf besar dan angka deterministik berbasis hash SHA-256 dari `(course_code + '-' + section)`.
3. **Penanganan Dosen Wali (Fase S4 & S5):**
   Basis data tidak memiliki kolom `dosen_wali_id` pada tabel `profiles` maupun `classes`. Relasi perwalian diintegrasikan ke lapisan store generated (`seed-data.uir-ti-2026.generated.ts`) pada Fase S5 untuk melayani tampilan KRS & perwalian mahasiswa.
4. **Bentrok Sumber Dibiarkan Apa Adanya:**
   Seluruh 41 bentrok jadwal sumber (31 dosen, 6 ruang, 4 rombel) dan 19 bentrok KRS mahasiswa dimasukkan apa adanya tanpa diubah atau digeser secara diam-diam.
5. **Domain Surel Khusus `.test`:**
   Semua akun menggunakan domain terisolasi RFC 2606 (`@mhs.siajar.test`, `@dosen.siajar.test`, `@staf.siajar.test`) untuk mencegah tercampurnya akun uji dengan domain kampus asli.
6. **Lapisan Kompatibilitas Legacy (Fase S5):**
   Tidak mengubah nilai default pada `src/lib/db/seed-data.ts`, `master-store.ts`, `jadwal-store.ts`, atau `krs-store.ts`. Generator statis menghasilkan `seed-data.uir-ti-2026.generated.ts` yang diaktifkan secara selektif jika `SEED_DATASET=uir-ti-2026`, menjamin 100% uji coba dan fitur eksisting tetap lulus tanpa regresi.
7. **Integrasi Pipeline CI (Fase S6):**
   Menambahkan langkah eksekusi seed dan verifikasi otomatis di `.github/workflows/ci.yml` yang berjalan terhadap mesin lokal Supabase sementara dengan kredensial ephemeral.
8. **Penyesuaian Batas Panjang Kata Sandi (Opsi B):**
   Atas permintaan eksplisit pengguna untuk menggunakan kata sandi sederhana seperti `123456`, batas pengaman pada `guard.ts` disesuaikan dari minimal 12 karakter menjadi minimal 6 karakter (batas teknis terendah yang diterima oleh Supabase Auth GoTrue). Nilai 5 karakter (`12345`) tetap ditolak fail-closed agar proses pembuatan akun di Supabase Auth tidak gagal di tengah jalan.
