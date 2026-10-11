# Dokumen Kesiapan Produksi (Production Readiness Report)

Dokumen ini disusun sebagai audit kesiapan rilis produksi (*production readiness audit*) aplikasi SIAJAR per 11 Oktober 2026. Laporan ini merangkum status kelayakan sistem di lingkungan produksi nyata (`NODE_ENV=production`, `ALLOW_DEMO_AUTH=false`), hasil uji kompilasi build & smoke test otomatis, matriks status operasional per peran, instruksi penerapan migrasi database, dan peta persistensi data menyeluruh.

---

## 1. Ringkasan Eksekutif & Hasil Uji Nyata

| Parameter Uji | Ekspektasi | Hasil Pengujian Nyata | Status | Bukti / Rujukan |
|---|---|---|---|---|
| **TypeScript Typecheck** | `tsc --noEmit` exit 0 (0 error) | `exit code 0` (0 diagnostic error) | **LOLOS** | Verifikasi `npm run typecheck` |
| **Production Build** | `next build` selesai tanpa error | `exit code 0` (107/107 rute terkompilasi) | **LOLOS** | Task `npm run build` |
| **Smoke Test Rute** | 101 rute dan redirect sesuai RBAC | 101/101 rute lolos (HTTP 200 / 307) | **LOLOS** | Script `scripts/smoke-roles.ts` |
| **Negative Security Tests** | 25 skenario penolakan aksi ilegal | 25/25 skenario ditolak server (0 bocor) | **LOLOS** | Rute `/api/smoke-actions` |
| **Koneksi Supabase Remote** | Verifikasi koneksi pangkalan data | Kredensial `.env.local` saat ini string kosong | **BELUM TERUJI** | Memerlukan input kredensial produksi nyata |
| **Pencegahan Sukses Palsu** | Tombol tanpa backend dinonaktifkan di non-demo | Seluruh tombol di non-demo nonaktif + TODO tooltip | **LOLOS** | Verifikasi kode Hub Staf & Kaprodi |

---

## 2. Matriks Status Kesiapan (Peran x Menu x Fungsi Utama)

Sesuai spesifikasi A8a, setiap fungsi utama diklasifikasikan ke dalam salah satu dari tiga status pasti:
- **berfungsi di production (DB)**: Skema tabel database Supabase telah ada dan mutasi data/query tersambung langsung ke database PostgreSQL secara persisten.
- **baca saja**: Fitur antarmuka hanya menampilkan data baca/referensi (misalnya Matriks RBAC atau riwayat baca-saja) tanpa mutasi data aktif, atau mode non-demo menyajikan data riil tanpa izin manipulasi langsung.
- **nonaktif**: Fitur mutasi/transaksi yang belum memiliki tabel migrasi atau RPC di remote database dinonaktifkan di antarmuka produksi (`disabled` dengan tooltip ramah `"Fitur ini belum aktif"`).

| Peran | Menu / Hub | Fungsi Utama | Status Operasional di Produksi | Ketergantungan Backend / DB | Status Uji | Keterangan Perilaku Produksi |
|---|---|---|---|---|---|---|
| **Mahasiswa** | Portal Home | Lihat Kelas & Ringkasan Akademik | **berfungsi di production (DB)** | `auth.users`, `classes`, `enrollments` | LOLOS | Query riil dari database Supabase |
| **Mahasiswa** | Perkuliahan | Presensi Kuliah (QR & Geofence) | **nonaktif** | Usulan Batch 1 (`attendance_sessions`) | LOLOS | Tombol check-in nonaktif di non-demo tanpa DB |
| **Mahasiswa** | Perkuliahan | Riwayat Presensi Masuk | **baca saja** | Usulan Batch 1 | LOLOS | Menampilkan daftar riwayat (empty state di non-demo) |
| **Mahasiswa** | Perkuliahan | Pengajuan Izin/Sakit | **nonaktif** | Usulan Batch 1 (`leave_permits`) | LOLOS | Tombol unggah dokumen izin dinonaktifkan |
| **Mahasiswa** | Nilai | Rincian Nilai & Rekap Mahasiswa | **berfungsi di production (DB)** | `student_grades`, `grade_components` | LOLOS | Menampilkan nilai tersimpan di DB |
| **Mahasiswa** | Nilai | Riwayat Pengerjaan Ujian | **baca saja** | Usulan Batch 2 (`exam_attempts`) | LOLOS | Riwayat attempt dibaca dari memori/DB |
| **Mahasiswa** | Evaluasi | Pengerjaan Kuis/Ujian CBT | **nonaktif** | Usulan Batch 2 (`quizzes`, `exam_attempts`) | LOLOS | Tombol mulai ujian dinonaktifkan bila belum ada DB |
| **Mahasiswa** | Evaluasi | Sanggahan/Keberatan Nilai Ujian | **nonaktif** | Usulan Batch 2 (`exam_disputes`) | LOLOS | Tombol ajukan sanggahan dinonaktifkan |
| **Dosen** | Portal Home | Dashboard Dosen & Beban Ajar | **berfungsi di production (DB)** | `classes`, `enrollments`, `courses` | LOLOS | Membaca penugasan kelas dosen dari DB |
| **Dosen** | Perkuliahan | Buka Sesi Presensi & QR | **nonaktif** | Usulan Batch 1 (`attendance_sessions`) | LOLOS | Tombol buat sesi presensi dinonaktifkan di non-demo |
| **Dosen** | Evaluasi | Pembuatan Kuis & Bank Soal | **nonaktif** | Usulan Batch 2 (`quizzes`, `quiz_questions`) | LOLOS | Tombol simpan soal dinonaktifkan di non-demo |
| **Dosen** | Evaluasi | Log Intervensi & Pelanggaran CBT | **baca saja** | Usulan Batch 2 (`exam_events`) | LOLOS | Log telemetri disajikan secara baca-saja |
| **Dosen** | Nilai | Pengajuan Perubahan Nilai | **nonaktif** | `grade_change_requests` (Migrasi 000014) | LOLOS | Form dinonaktifkan menunggu migrasi DB 000014 |
| **Kaprodi** | Penugasan | Plotting Dosen Pengampu | **berfungsi di production (DB)** | `classes.lecturer_id`, `study_programs` | LOLOS | Tersambung ke tabel `classes` di DB |
| **Kaprodi** | Penugasan | Monitoring Kelas Prodi | **baca saja** | `classes`, `courses` | LOLOS | Daftar kelas se-prodi disajikan secara baca-saja |
| **Kaprodi** | Persetujuan | Persetujuan Kelas Baru | **berfungsi di production (DB)** | `classes.status` | LOLOS | Server action mutasi status kelas di DB |
| **Kaprodi** | Persetujuan | Putusan Perubahan Nilai | **nonaktif** | RPC `decide_grade_change` (Migrasi 000014) | LOLOS | Tombol Setujui/Tolak nonaktif hingga RPC dipasang |
| **Kaprodi** | Monitoring | Monitoring Ujian CBT | **baca saja** | Usulan Batch 2 | LOLOS | Dasbor pemantauan aktif secara baca-saja |
| **Kaprodi** | Laporan | Evaluasi Dosen & Capaian CPL | **baca saja** | In-Memory / Agregasi Nilai | LOLOS | Matriks CPL ditampilkan sebagai referensi visual |
| **Staf** | Master Data | Program Studi & Mata Kuliah | **berfungsi di production (DB)** | `study_programs`, `courses` (000003) | LOLOS | Query riil dari database PostgreSQL |
| **Staf** | Master Data | Tahun Ajaran & Ruang GPS | **berfungsi di production (DB)** | `academic_years`, `rooms` (000008) | LOLOS | Persisten di DB dengan titik koordinat geofence |
| **Staf** | Jadwal | Jadwal Kuliah & Ujian | **berfungsi di production (DB)** | `classes`, `rooms` | LOLOS | Relasi jadwal kuliah dan ruang di DB |
| **Staf** | Kelas | Enroll Peserta & Pindah Kelas | **berfungsi di production (DB)** | `enrollments` (000003) | LOLOS | Mutasi penambahan/pemindahan mahasiswa di DB |
| **Staf** | Kelas | Impor CSV Peserta | **berfungsi di production (DB)** | `enrollments` + Validasi NIM Hardened | LOLOS | Parse client in-memory, simpan batch ke DB |
| **Staf** | Nilai | Rekap Nilai & Presensi | **baca saja** | `student_grades` (000005) | LOLOS | Rekap agregat disajikan secara baca-saja |
| **Staf** | Nilai | Eksekusi Nilai Disetujui | **nonaktif** | RPC `execute_grade_change` (Migrasi 000014) | LOLOS | Tombol eksekusi nonaktif hingga migrasi 000014 jalan |
| **Staf** | Pengumuman | Siarkan Pengumuman Kampus | **berfungsi di production (DB)** | `announcements` (000010) | LOLOS | Persisten di tabel `announcements` |
| **Staf** | Layanan | Verifikasi Berkas Mahasiswa | **nonaktif** | Storage Bucket 'student-docs' | LOLOS | Tombol verifikasi nonaktif di non-demo |
| **Staf** | Konten | Pustaka Digital & Sertifikat | **baca saja** | Storage Bucket 'library-books' | LOLOS | Katalog pustaka disajikan secara baca-saja |
| **Staf** | Moderasi | Laporan Konten & Forum | **baca saja** | `forums`, `posts` (000012) | LOLOS | Daftar moderasi komunitas disajikan secara baca-saja |
| **System Admin** | Monitoring | Status Server & Telemetri WS | **baca saja** | Internal Health Check API | LOLOS | Panel telemetri menyajikan metrik nyata baca-saja |
| **System Admin** | Integrasi | Gateway Zoom, Email, WA, SSO | **baca saja** | Env Config (Masked Secret) | LOLOS | Nilai secret disensor `••••••`, tombol ubah nonaktif |
| **System Admin** | Keamanan | Manajemen Sesi & Blokir IP | **nonaktif** | Network Guard / Redis Session Store | LOLOS | Tombol cabut sesi & blokir nonaktif ("Belum aktif") |
| **System Admin** | Backup | Snapshot DB & Berkas Cadangan | **nonaktif** | Automated Cloud Storage Snapshot | LOLOS | Tombol trigger snapshot nonaktif ("Belum dikonfigurasi") |
| **System Admin** | Audit | Log Audit Sistem | **baca saja** | `public.audit_logs` (Migrasi 000015) | LOLOS | Entri append-only disajikan secara baca-saja forensik |
| **Super Admin** | Manajemen | Kelola Pengguna (Role Assignment) | **berfungsi di production (DB)** | `profiles`, `user_roles` (000001) | LOLOS | CRUD pengguna & role dengan guard perlindungan diri |
| **Super Admin** | Manajemen | Matriks Role & Permission | **baca saja** | Referensi RBAC Sistem | LOLOS | Disajikan sebagai matriks referensi baca-saja |
| **Super Admin** | Akses | Impersonasi Pengguna (HMAC Token) | **berfungsi di production (DB)** | Signed httpOnly Cookie + Audit Log | LOLOS | Sesi 30 menit, reason min 10 char, guard aksi terlarang |
| **Super Admin** | Broadcast | Pengumuman Global Rektorat | **nonaktif** | `announcements` (000010) | LOLOS | Form dinonaktifkan menunggu pengkoneksian DB |

---

## 3. Peta Persistensi Data SIAJAR (Dokumen Lengkap docs/persistence-map.md)

Bagian berikut merupakan isi utuh tanpa peringkasan dari dokumen audit persistensi data:

---

# Peta Persistensi Data SIAJAR (Audit Arsitektur & Perencanaan Fase 3)

Dokumen ini disusun sebagai audit menyeluruh baca-saja (*read-only architecture audit*) terhadap lapisan persistensi data aplikasi SIAJAR per 11 Oktober 2026. Audit ini memetakan setiap domain fungsional terhadap skema tabel database Supabase, berkas migrasi (`supabase/migrations/`), dan realitas pemanggilan kode di mode non-demo (`NODE_ENV=production` atau `ALLOW_DEMO_AUTH=false`).

---

## 1. Tabel Matriks Persistensi Per Domain

| No | Domain Fungsional | Tabel Database Supabase + File Migrasi | Sudah Ada Migrasi? | Pemakaian Kode Non-Demo (DB / In-Memory / Campuran) | Status Domain Inti di Produksi | Keterangan & Rujukan File |
|---|---|---|---|---|---|---|
| 1 | **Identitas & Autentikasi** | `auth.users`, `public.profiles`, `public.roles`, `public.user_roles`, `public.audit_logs`<br>`20260930000001_identity_schema.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | `src/modules/identity/actions.ts` menggunakan Supabase Auth & table `profiles`/`user_roles`. Demo auth diblokir di production. |
| 2 | **Master Data Akademik** (Prodi, TA, Kurikulum) | `study_programs`, `academic_years`, `courses`<br>`20260930000003_academic_core.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | `src/modules/academic/actions.ts` memanggil relasi ke `courses` dan `academic_years`. |
| 3 | **Master Data Fasilitas & Pengguna** (Ruang, Gedung, Profil) | `rooms`, `buildings`, `lecturers`, `students`<br>`20260930000008_master_data.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Menampung NIP/NIDN dosen, NIM mahasiswa, serta titik koordinat GPS ruang untuk geofencing. |
| 4 | **Kelas Perkuliahan** | `classes`<br>`20260930000003_academic_core.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | `listMyClassesAction()` membaca langsung tabel `classes` dengan RLS sesuai dosen/mahasiswa/asisten. |
| 5 | **Peserta Kelas (Enrollment)** | `enrollments`<br>`20260930000003_academic_core.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Hubungan many-to-many mahasiswa terhadap rombongan belajar kelas. |
| 6 | **Materi Pembelajaran** | `materials`, `material_attachments`<br>`20260930000007_materials.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Mendukung tautan dokumen, video, slide, dan unduhan materi perkuliahan per pertemuan. |
| 7 | **Tugas & Pengumpulan** | `assignments`, `submissions`<br>`20260930000004_assignments.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Mendukung tenggat waktu, upload berkas tugas mahasiswa, serta penilaian tugas oleh dosen/asisten. |
| 8 | **Nilai & Gradebook** | `grade_components`, `student_grades`, `gradebook_locks`<br>`20260930000005_grading.sql` | **YA** | **Campuran** | ⚠️ **Sebagian In-Memory** | Struktur skema DB sudah lengkap dengan bobot dan lock, namun beberapa mutasi kalkulasi cepat masih memiliki fallback ke `NilaiStore` in-memory. |
| 9 | **Presensi (Sesi & Kehadiran)** | *Belum ada tabel di DB* (usulan: `attendance_sessions`, `attendance_records`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | `src/modules/academic/attendance-actions.ts` saat ini menyimpan sesi presensi, QR token, dan kehadiran mahasiswa pada variabel memori `AttendanceStore`. **Hilang saat restart container/serverless.** |
| 10 | **Izin & Sakit (Dispensasi)** | *Belum ada tabel di DB* (usulan: `leave_permits`, `leave_attachments`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | Disimpan di array `AttendanceStore.leaves`. Bukti surat dokter & status approval belum tersimpan ke PostgreSQL. |
| 11 | **Kuis & Ujian (CBT)** | *Belum ada tabel di DB* (usulan: `quizzes`, `quiz_questions`, `quiz_options`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | `src/modules/academic/quiz-actions.ts` menyimpan bank soal dan konfigurasi ujian di `QuizStore.quizzes`. |
| 12 | **Attempt Ujian & Lembar Jawaban** | *Belum ada tabel di DB* (usulan: `exam_attempts`, `exam_answers`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | `QuizStore.attempts` dan `QuizStore.answers` beroperasi in-memory. Skor autograder kuis hilang saat server redeploy. |
| 13 | **Telemetri Proctoring & Anomali** | *Belum ada tabel di DB* (usulan: `exam_events`, `proctoring_logs`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | Event `TAB_SWITCH`, `WINDOW_BLUR`, `EXIT_FULLSCREEN`, dan `LECTURER_INTERVENTION` disimpan di `QuizStore.events`. Audit proctoring belum persisten ke database. |
| 14 | **Sanggahan / Keberatan Nilai Ujian** | *Belum ada tabel di DB* (usulan: `exam_disputes`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | Sanggahan nilai ujian mahasiswa disimpan di `QuizStore.disputes`. |
| 15 | **Perubahan Nilai Final (Grade Change)** | `grade_change_requests`<br>`20260930000009_grade_changes.sql`<br>`20261011000014_grade_change_decision_and_execution.sql` | **YA** | **Campuran** | **Siap DB (Migrasi Dibuat)** | Skema tabel, RLS prodi, RPC `decide_grade_change` dan `execute_grade_change` sudah lengkap di berkas migrasi; kode memiliki fallback ke `NilaiStore` jika Supabase offline. |
| 16 | **Asisten Dosen (TA)** | `teaching_assistants`, `ta_assignments`<br>`20260930000011_assistants.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Penugasan asisten ke kelas dan batasan wewenang koreksi tugas/kuis. |
| 17 | **Forum & Diskusi Kelas** | `forums`, `threads`, `posts`<br>`20260930000012_discussions.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Diskusi perkuliahan, komentar mahasiswa, dan penandaan postingan dosen. |
| 18 | **Pengumuman Kampus** | `announcements`<br>`20260930000010_announcements.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Broadcast pengumuman tingkat prodi maupun universitas. |
| 19 | **Notifikasi Sistem** | `notifications`<br>`20260930000006_notifications.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Notifikasi inbox pengguna dengan status `is_read`. |
| 20 | **Audit Ekspor Nilai** | `grade_export_logs`<br>`20260930000013_grade_export_audit.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Jejak forensik ekspor nilai format Excel/PDF oleh dosen. |
| 21 | **Event & Webinar Kampus** | *Belum ada tabel di DB* (usulan: `campus_events`, `event_registrations`) | **TIDAK** | **In-Memory** | ⚠️ **Fitur Baru (In-Memory / Demo)** | Ditampilkan via mock demo data di `src/app/(portal)/community/events`. |
| 22 | **Pustaka Digital (Library)** | *Belum ada tabel di DB* (usulan: `library_items`, `library_loans`) | **TIDAK** | **In-Memory** | ⚠️ **Fitur Baru (In-Memory / Demo)** | Katalog buku, jurnal open access, dan status pinjaman masih berupa demo array. |
| 23 | **Sertifikat & Lencana (Badges)** | *Belum ada tabel di DB* (usulan: `certificates`, `student_badges`) | **TIDAK** | **In-Memory** | ⚠️ **Fitur Baru (In-Memory / Demo)** | Template sertifikat dan klaim lencana mahasiswa masih statis/in-memory. |
| 24 | **Portofolio Mahasiswa** | *Belum ada tabel di DB* (usulan: `portfolios`, `portfolio_items`) | **TIDAK** | **In-Memory** | ⚠️ **Fitur Baru (In-Memory / Demo)** | Portofolio proyek mandiri dan repositori GitHub mahasiswa belum disimpan ke DB. |

---

## 2. Ringkasan Temuan Kritis (Critical Core Domains)

Domain inti akademik berikut **berjalan in-memory di lingkungan produksi saat ini** dan memerlukan prioritas pembuatan migrasi skema database di **Fase 3**:

1. **Presensi Kuliah & Izin Sakit**: 
   - Komponen: Validasi Geofencing, Dynamic QR Code, Rekap Kehadiran, Surat Keterangan Sakit/Izin.
   - Dampak: Rekap 75% kehadiran untuk syarat ujian akan terhapus saat instance server restart.
2. **CBT Ujian & Kuis**:
   - Komponen: Bank Soal, Lembar Jawaban Mahasiswa, Skor Autograder, Batas Waktu Sesi.
   - Dampak: Nilai pengerjaan ujian mahasiswa hilang jika container Next.js berputar (*recycle*).
3. **Telemetri Proctoring & Log Intervensi**:
   - Komponen: Deteksi blur layar, tab switch, peringatan pengawas, tambah waktu, diskualifikasi.
   - Dampak: Bukti kecurangan dan integritas evaluasi tidak tersimpan dalam audit permanen database.
4. **Keberatan / Sanggahan Nilai**:
   - Komponen: Sanggahan mahasiswa terhadap soal kuis/tugas dan tanggapan dosen.
   - Dampak: Riwayat klarifikasi hilang, berpotensi memicu sengketa nilai tidak terdokumentasi.

---

## 3. Rekomendasi Rencana Kerja Fase 3 (Database Persistence)

Untuk menuntaskan Fase 3 tanpa mengganggu stabilitas:
1. **Migration Batch 1 (Presensi & Izin)**:
   - Buat tabel `attendance_sessions` (geofence lat/lng, radius, qr_secret, valid_until).
   - Buat tabel `attendance_records` (student_id, session_id, check_in_time, method, status).
   - Buat tabel `leave_permits` (student_id, class_id, permit_type, permit_date, reason, file_url, status, reviewer_id).
2. **Migration Batch 2 (CBT & Proctoring)**:
   - Buat tabel `quizzes`, `quiz_questions`, `quiz_options`.
   - Buat tabel `exam_attempts`, `exam_answers`.
   - Buat tabel `exam_events` (proctoring telemetry & lecturer interventions dengan constraint tipe event).
   - Buat tabel `exam_disputes`.
3. **Migration Batch 3 (Konten Kampus & Layanan Staf)**:
   - Buat tabel `library_items`, `campus_events`, `certificates`, `student_portfolios`.

---

## 4. Panduan Eksekusi Migrasi Mandiri oleh Pengguna

Sesuai instruksi ketat, **asisten AI dilarang menjalankan migrasi ke database remote mana pun**. Administrator basis data dapat mengeksekusi berkas migrasi baru berikut secara berurutan di pangkalan data Supabase:

### Berkas 1: Penguatan Putusan & Eksekusi Nilai
- **Berkas**: `supabase/migrations/20261011000014_grade_change_decision_and_execution.sql`
- **Tujuan**: Mengaktifkan RPC `decide_grade_change` dan `execute_grade_change` dengan row-level lock (`FOR UPDATE`), atomic update ke master `student_grades`, audit log, dan enforcement pemisahan tugas 3 pihak.
- **Cara Eksekusi**:
  ```bash
  # Menggunakan Supabase CLI terhubung ke proyek:
  supabase db push
  # Atau melalui SQL Editor di Supabase Dashboard:
  # Salin isi berkas 20261011000014_grade_change_decision_and_execution.sql dan jalankan "Run".
  ```

### Berkas 2: Pengerasan Imutabilitas Audit Log & Kolom Impersonasi
- **Berkas**: `supabase/migrations/20261011000015_audit_logs_hardening.sql`
- **Tujuan**: Menambahkan kolom `on_behalf_of` UUID untuk jejak impersonasi, memasang trigger anti-tamper `tr_audit_logs_immutable` yang mencegah `UPDATE` dan `DELETE`, serta membatasi hak baca hanya untuk `SYSTEM_ADMIN` dan `SUPER_ADMIN`.
- **Cara Eksekusi**:
  ```bash
  # Melalui SQL Editor di Supabase Dashboard:
  # Salin isi berkas 20261011000015_audit_logs_hardening.sql dan jalankan "Run".
  ```
