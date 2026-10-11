# Dokumen Kesiapan Produksi (Production Readiness Report)

Dokumen ini disusun sebagai audit kesiapan rilis produksi (*production readiness audit*) aplikasi SIAJAR per 11 Oktober 2026. Laporan ini merangkum status kelayakan sistem di lingkungan produksi nyata (`NODE_ENV=production`, `ALLOW_DEMO_AUTH=false`), hasil uji kompilasi build & smoke test otomatis, matriks status operasional per peran, instruksi penerapan migrasi database, dan peta persistensi data menyeluruh.

---

## 1. Ringkasan Eksekutif & Hasil Uji Nyata

| Parameter Uji | Ekspektasi | Hasil Pengujian Nyata | Status | Bukti / Rujukan |
|---|---|---|---|---|
| **TypeScript Typecheck** | `tsc --noEmit` exit 0 (0 error) | `exit code 0` (0 diagnostic error) | **LOLOS** | Verifikasi `npm run typecheck` |
| **Production Build** | `next build` selesai tanpa error | `exit code 0` (107/107 rute terkompilasi) | **LOLOS** | Task `npm run build` |
| **Smoke Test Rute** | 107 rute dan redirect sesuai RBAC | 107/107 rute lolos (HTTP 200 / 307) | **LOLOS** | Script `scripts/smoke-roles.ts` |
| **Server-Side Role Guard (A2)** | Mahasiswa spoof active_role=SUPER_ADMIN di-redirect 307 ke /workspace di semua rute admin | 6/6 rute admin terblokir tanpa data bocor | **LOLOS** | `src/lib/auth/server-guards.ts` & `scripts/smoke-roles.ts` |
| **Uji Mode Demo (/api/smoke-actions)** | 25 skenario penolakan aksi ilegal | 25/25 skenario ditolak server (0 bocor), rute 404 di produksi | **LOLOS** | Rute `/api/smoke-actions` (Mode Demo) |
| **Uji Keamanan Database (A6)** | 22 uji negatif berpasangan kontrol positif di DB lokal (pgcrypto/pglite) | 22/22 skenario lolos (100%) | **LOLOS** | Script `scripts/test-database-security.mjs` |
| **Pengujian Supabase Asli (PostgREST/JWT/Grants)** | Uji akses PostgREST nyata dengan JWT per role | BELUM DILAKUKAN (verifikasi saat ini memakai PGlite lokal) | **BELUM TERUJI** | Wajib dilakukan di project Supabase STAGING terpisah sebelum produksi |
| **Pencegahan Sukses Palsu** | Tombol tanpa backend dinonaktifkan di non-demo | Seluruh tombol di non-demo nonaktif + TODO tooltip | **LOLOS** | Verifikasi kode Hub Staf, Kaprodi, Admin |

---

## 2. Matriks Status Kesiapan (Peran x Menu x Fungsi Utama)

Sesuai spesifikasi pengetatan A7:
- **berfungsi di production (DB)**: WAJIB menyebut file dan nama fungsi yang memanggil pangkalan data Supabase secara nyata.
- **baca saja**: Fitur antarmuka hanya menampilkan data baca/referensi tanpa mutasi data aktif, atau mode non-demo menyajikan data riil tanpa izin manipulasi langsung.
- **nonaktif**: Fitur mutasi/transaksi yang belum memiliki fungsi pemanggilan DB backend riil di kode dinonaktifkan di antarmuka produksi (`disabled` dengan keterangan `"Fitur ini belum aktif"`). Seluruh rujukan fungsi fiktif (`assignLecturerAction`, `approveClassAction`) telah dicabut.

| Peran | Menu / Hub | Fungsi Utama | Status Operasional di Produksi | Ketergantungan Backend / DB | Status Uji | Keterangan Perilaku Produksi (File & Fungsi DB) |
|---|---|---|---|---|---|---|
| **Mahasiswa** | Portal Home | Lihat Kelas & Ringkasan Akademik | **berfungsi di production (DB)** | `public.classes`, `public.enrollments` | LOLOS | `src/modules/academic/actions.ts: listMyClassesAction()` query riil dari database Supabase |
| **Mahasiswa** | Perkuliahan | Presensi Kuliah (QR & Geofence) | **nonaktif** | Usulan Batch 1 (`attendance_sessions`) | LOLOS | Tombol check-in nonaktif di non-demo tanpa DB |
| **Mahasiswa** | Perkuliahan | Riwayat Presensi Masuk | **baca saja** | Usulan Batch 1 | LOLOS | Menampilkan daftar riwayat (empty state di non-demo) |
| **Mahasiswa** | Perkuliahan | Pengajuan Izin/Sakit | **nonaktif** | Usulan Batch 1 (`leave_permits`) | LOLOS | Tombol unggah dokumen izin dinonaktifkan |
| **Mahasiswa** | Nilai | Rincian Nilai & Rekap Mahasiswa | **baca saja** | `public.grades` (000005) | LOLOS | `src/app/(portal)/grades/page.tsx` menyajikan tampilan baca-saja; mutasi nilai langsung di portal mahasiswa dilarang |
| **Mahasiswa** | Nilai | Riwayat Pengerjaan Ujian | **baca saja** | Usulan Batch 2 (`exam_attempts`) | LOLOS | Riwayat attempt disajikan secara baca-saja |
| **Mahasiswa** | Evaluasi | Pengerjaan Kuis/Ujian CBT | **nonaktif** | Usulan Batch 2 (`quizzes`, `exam_attempts`) | LOLOS | Tombol mulai ujian dinonaktifkan bila belum ada DB |
| **Mahasiswa** | Evaluasi | Sanggahan/Keberatan Nilai Ujian | **nonaktif** | Usulan Batch 2 (`exam_disputes`) | LOLOS | Tombol ajukan sanggahan dinonaktifkan |
| **Dosen** | Portal Home | Dashboard Dosen & Beban Ajar | **berfungsi di production (DB)** | `public.classes`, `public.courses` | LOLOS | `src/modules/academic/actions.ts: listMyClassesAction()` membaca penugasan kelas dosen dari DB |
| **Dosen** | Perkuliahan | Buka Sesi Presensi & QR | **nonaktif** | Usulan Batch 1 (`attendance_sessions`) | LOLOS | Tombol buat sesi presensi dinonaktifkan di non-demo |
| **Dosen** | Evaluasi | Pembuatan Kuis & Bank Soal | **nonaktif** | Usulan Batch 2 (`quizzes`, `quiz_questions`) | LOLOS | Tombol simpan soal dinonaktifkan di non-demo |
| **Dosen** | Evaluasi | Log Intervensi & Pelanggaran CBT | **baca saja** | Usulan Batch 2 (`exam_events`) | LOLOS | Log telemetri disajikan secara baca-saja |
| **Dosen** | Nilai | Pengajuan Perubahan Nilai | **berfungsi di production (DB)** | `public.grade_change_requests` (000009 & 000014) | LOLOS | `src/modules/academic/actions.ts: requestGradeChangeAction()` tersambung langsung ke DB |
| **Kaprodi** | Penugasan | Plotting Dosen Pengampu | **nonaktif** | `classes.lecturer_id` | LOLOS | Belum ada fungsi server action aktif di DB (rujukan fiktif `assignLecturerAction` telah dihapus) |
| **Kaprodi** | Penugasan | Monitoring Kelas Prodi | **baca saja** | `classes`, `courses` | LOLOS | Daftar kelas se-prodi disajikan secara baca-saja |
| **Kaprodi** | Persetujuan | Persetujuan Kelas Baru | **nonaktif** | `classes.status` | LOLOS | Belum ada fungsi server action aktif di DB (rujukan fiktif `approveClassAction` telah dihapus) |
| **Kaprodi** | Persetujuan | Putusan Perubahan Nilai | **berfungsi di production (DB)** | RPC `public.decide_grade_change` (000014) | LOLOS | `src/modules/academic/actions.ts: decideGradeChangeAction()` memanggil RPC database |
| **Kaprodi** | Monitoring | Monitoring Ujian CBT | **baca saja** | Usulan Batch 2 | LOLOS | Dasbor pemantauan aktif secara baca-saja |
| **Kaprodi** | Laporan | Evaluasi Dosen & Capaian CPL | **baca saja** | In-Memory / Agregasi Nilai | LOLOS | Matriks CPL ditampilkan sebagai referensi visual |
| **Staf** | Master Data | Program Studi & Mata Kuliah | **baca saja** | `public.programs`, `public.courses` (000003) | LOLOS | Referensi kurikulum disajikan baca-saja dari DB (tabel adalah `programs`, bukan `study_programs`) |
| **Staf** | Master Data | Tahun Ajaran & Ruang GPS | **baca saja** | `academic_years`, `rooms` (000008) | LOLOS | Referensi TA & GPS ruang disajikan baca-saja |
| **Staf** | Jadwal | Jadwal Kuliah & Ujian | **baca saja** | `classes`, `rooms` | LOLOS | Relasi jadwal kuliah dan ruang disajikan baca-saja |
| **Staf** | Kelas | Enroll Peserta & Pindah Kelas | **nonaktif** | `public.enrollments` | LOLOS | Fitur dinonaktifkan di non-demo karena belum ada server action DB pemindahan |
| **Staf** | Kelas | Impor CSV Peserta | **nonaktif** | `public.enrollments` | LOLOS | Fitur dinonaktifkan di non-demo karena belum ada server action batch insert DB |
| **Staf** | Nilai | Rekap Nilai & Presensi | **baca saja** | `public.grades` (000005) | LOLOS | Rekap agregat disajikan secara baca-saja |
| **Staf** | Nilai | Eksekusi Nilai Disetujui | **berfungsi di production (DB)** | RPC `public.execute_grade_change` (000014) | LOLOS | `src/modules/academic/actions.ts: executeGradeChangeAction()` memanggil RPC database |
| **Staf** | Pengumuman | Siarkan Pengumuman Kampus | **berfungsi di production (DB)** | `public.announcements` (000010) | LOLOS | `src/modules/academic/actions.ts: createAnnouncementAction()` persisten di tabel `announcements` |
| **Staf** | Layanan | Verifikasi Berkas Mahasiswa | **nonaktif** | Storage Bucket 'student-docs' | LOLOS | Tombol verifikasi nonaktif di non-demo |
| **Staf** | Konten | Pustaka Digital & Sertifikat | **baca saja** | Storage Bucket 'library-books' | LOLOS | Katalog pustaka disajikan secara baca-saja |
| **Staf** | Moderasi | Laporan Konten & Forum | **baca saja** | `forums`, `posts` (000012) | LOLOS | Daftar moderasi komunitas disajikan secara baca-saja |
| **System Admin** | Monitoring | Status Server & Telemetri WS | **baca saja** | Internal Health Check API | LOLOS | Panel telemetri menyajikan metrik nyata baca-saja |
| **System Admin** | Integrasi | Gateway Zoom, Email, WA, SSO | **baca saja** | Env Config (Masked Secret) | LOLOS | Nilai secret disensor `••••••`, tombol ubah nonaktif |
| **System Admin** | Keamanan | Manajemen Sesi & Blokir IP | **nonaktif** | Network Guard / Redis Session Store | LOLOS | Tombol cabut sesi & blokir nonaktif ("Fitur ini belum aktif") |
| **System Admin** | Backup | Snapshot DB & Berkas Cadangan | **nonaktif** | Automated Cloud Storage Snapshot | LOLOS | Tombol trigger snapshot nonaktif ("Fitur ini belum aktif") |
| **System Admin** | Audit | Log Audit Sistem | **baca saja** | `public.audit_logs` (000015) | LOLOS | Entri append-only disajikan secara baca-saja forensik |
| **Super Admin** | Manajemen | Kelola Pengguna (Role Assignment) | **nonaktif** | `profiles`, `user_roles` (000001) | LOLOS | Form mutasi pengguna di UI non-demo dinonaktifkan ("Fitur ini belum aktif") |
| **Super Admin** | Manajemen | Matriks Role & Permission | **baca saja** | Referensi RBAC Sistem | LOLOS | Disajikan sebagai matriks referensi baca-saja |
| **Super Admin** | Akses | Impersonasi Pengguna (HMAC Token) | **nonaktif** | Signed httpOnly Cookie + Audit Log | LOLOS | Dinonaktifkan di non-demo dengan keterangan "Fitur ini belum aktif" (A3d) |
| **Super Admin** | Broadcast | Pengumuman Global Rektorat | **nonaktif** | `announcements` (000010) | LOLOS | Form dinonaktifkan menunggu pengkoneksian DB |

---

## 3. Peta Persistensi Data SIAJAR (Audit Arsitektur & Perencanaan Fase 3)

| No | Domain Fungsional | Tabel Database Supabase + File Migrasi | Sudah Ada Migrasi? | Pemakaian Kode Non-Demo (DB / In-Memory / Campuran) | Status Domain Inti di Produksi | Keterangan & Rujukan File |
|---|---|---|---|---|---|---|
| 1 | **Identitas & Autentikasi** | `auth.users`, `public.profiles`, `public.roles`, `public.user_roles`, `public.audit_logs`<br>`20260930000001_identity_schema.sql`<br>`20261011000015_audit_logs_hardening.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | `src/modules/identity/actions.ts` menggunakan Supabase Auth & table `profiles`/`user_roles`. Demo auth diblokir di production. |
| 2 | **Master Data Akademik** (Prodi, TA, Kurikulum) | `public.programs`, `public.academic_years`, `public.courses`<br>`20260930000003_academic_core.sql`<br>`20260930000008_master_data.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | `src/modules/academic/actions.ts` memanggil relasi ke `courses` dan `academic_years`. Tabel prodi adalah `programs` (bukan `study_programs`). |
| 3 | **Master Data Fasilitas & Pengguna** (Ruang, Gedung, Profil) | `rooms`, `buildings`, `lecturers`, `students`<br>`20260930000008_master_data.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Menampung NIP/NIDN dosen, NIM mahasiswa, serta titik koordinat GPS ruang untuk geofencing. |
| 4 | **Kelas Perkuliahan** | `classes`<br>`20260930000003_academic_core.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | `listMyClassesAction()` membaca langsung tabel `classes` dengan RLS sesuai dosen/mahasiswa/asisten. |
| 5 | **Peserta Kelas (Enrollment)** | `enrollments`<br>`20260930000003_academic_core.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Hubungan many-to-many mahasiswa terhadap rombongan belajar kelas. |
| 6 | **Materi Pembelajaran** | `materials`, `material_attachments`<br>`20260930000007_materials.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Mendukung tautan dokumen, video, slide, dan unduhan materi perkuliahan per pertemuan. |
| 7 | **Tugas & Pengumpulan** | `assignments`, `submissions`<br>`20260930000004_assignments.sql` | **YA** | **DB** | **Persisten Penuh (DB)** | Mendukung tenggat waktu, upload berkas tugas mahasiswa, serta penilaian tugas oleh dosen/asisten. |
| 8 | **Nilai & Gradebook** | `public.grades`, `public.grade_history`<br>`20260930000005_grading.sql` | **YA** | **Campuran** | ⚠️ **Sebagian In-Memory** | Tabel riil di database adalah `public.grades` (bukan `student_grades`). Struktur skema DB sudah lengkap dengan item_type, score, max_score, dan riwayat revisi; beberapa komponen visual cepat memiliki fallback in-memory. |
| 9 | **Presensi (Sesi & Kehadiran)** | *Belum ada tabel di DB* (usulan: `attendance_sessions`, `attendance_records`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | `src/modules/academic/attendance-actions.ts` saat ini menyimpan sesi presensi, QR token, dan kehadiran mahasiswa pada variabel memori `AttendanceStore`. **Hilang saat restart container/serverless.** |
| 10 | **Izin & Sakit (Dispensasi)** | *Belum ada tabel di DB* (usulan: `leave_permits`, `leave_attachments`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | Disimpan di array `AttendanceStore.leaves`. Bukti surat dokter & status approval belum tersimpan ke PostgreSQL. |
| 11 | **Kuis & Ujian (CBT)** | *Belum ada tabel di DB* (usulan: `quizzes`, `quiz_questions`, `quiz_options`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | `src/modules/academic/quiz-actions.ts` menyimpan bank soal dan konfigurasi ujian di `QuizStore.quizzes`. |
| 12 | **Attempt Ujian & Lembar Jawaban** | *Belum ada tabel di DB* (usulan: `exam_attempts`, `exam_answers`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | `QuizStore.attempts` dan `QuizStore.answers` beroperasi in-memory. Skor autograder kuis hilang saat server redeploy. |
| 13 | **Telemetri Proctoring & Anomali** | *Belum ada tabel di DB* (usulan: `exam_events`, `proctoring_logs`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | Event `TAB_SWITCH`, `WINDOW_BLUR`, `EXIT_FULLSCREEN`, dan `LECTURER_INTERVENTION` disimpan di `QuizStore.events`. Audit proctoring belum persisten ke database. |
| 14 | **Sanggahan / Keberatan Nilai Ujian** | *Belum ada tabel di DB* (usulan: `exam_disputes`) | **TIDAK** | **In-Memory** | 🚨 **KRITIS: HANYA IN-MEMORY** | Sanggahan nilai ujian mahasiswa disimpan di `QuizStore.disputes`. |
| 15 | **Perubahan Nilai Final (Grade Change)** | `public.grade_change_requests` (kolom: `old_score`, `proposed_score`, `executed_by`)<br>`20260930000009_grade_changes.sql`<br>`20261011000010_grade_status_executed.sql`<br>`20261011000014_grade_change_decision_and_execution.sql` | **YA** | **Campuran** | **Siap DB (Migrasi Dibuat)** | Skema tabel menggunakan kolom `old_score` (bukan `previous_score`), RLS prodi, RPC `decide_grade_change` dan `execute_grade_change` sudah lengkap di berkas migrasi; kode memiliki fallback ke `NilaiStore` jika Supabase offline. |
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

## 4. Panduan Eksekusi Migrasi Mandiri oleh Pengguna

Sesuai instruksi ketat, **asisten AI dilarang menjalankan migrasi ke database remote mana pun**. Administrator basis data dapat mengeksekusi berkas migrasi baru berikut secara berurutan di pangkalan data Supabase:

### Berkas 1: Penambahan Nilai Enum EXECUTED (C1)
- **Berkas**: `supabase/migrations/20261011000010_grade_status_executed.sql`
- **Tujuan**: Menambahkan nilai enum `'EXECUTED'` pada tipe `public.change_request_status` dalam transaksi mandiri sebelum migrasi 14 dijalankan, memulihkan migrasi 9 dan 13 ke konten orisinal tanpa modifikasi histori.
- **Cara Eksekusi**:
  ```bash
  # Menggunakan Supabase CLI terhubung ke proyek:
  supabase db push
  # Atau melalui SQL Editor di Supabase Dashboard:
  # Salin isi berkas 20261011000010_grade_status_executed.sql dan jalankan "Run".
  ```

### Berkas 2: Penguatan Putusan & Eksekusi Nilai (Fase 2C & 2D)
- **Berkas**: `supabase/migrations/20261011000014_grade_change_decision_and_execution.sql`
- **Tujuan**: Mengaktifkan RPC `decide_grade_change` dan `execute_grade_change` dengan row-level lock (`FOR UPDATE`), atomic update ke master `grades`, audit log, dan enforcement pemisahan tugas 3 pihak.
- **Cara Eksekusi**:
  ```bash
  # Melalui SQL Editor di Supabase Dashboard:
  # Salin isi berkas 20261011000014_grade_change_decision_and_execution.sql dan jalankan "Run".
  ```

### Berkas 3: Pengerasan Imutabilitas Audit Log, Anonimisasi Pengguna & Kolom Impersonasi (Fase 2E / C3-C4)
- **Berkas**: `supabase/migrations/20261011000015_audit_logs_hardening.sql`
- **Tujuan**: Menambahkan kolom `on_behalf_of` UUID untuk jejak impersonasi, memasang trigger anti-tamper `tr_audit_logs_immutable` yang mencegah `UPDATE` dan `DELETE`, mencabut eksekusi `log_audit()` dari `PUBLIC`, `anon`, dan `authenticated` (hanya `service_role`), menyediakan RPC `anonymize_user(p_user_id)` eksklusif `SUPER_ADMIN`/`service_role` sesuai UU PDP, serta fungsi pemeliharaan retensi sah `purge_expired_audit_logs(interval)` minimal 365 hari.
- **Cara Eksekusi**:
  ```bash
  # Melalui SQL Editor di Supabase Dashboard:
  # Salin isi berkas 20261011000015_audit_logs_hardening.sql dan jalankan "Run".
  ```

---

## 5. Prosedur Pengelolaan & Penghapusan Pengguna (UU PDP & RESTRICT Constraint)

### Larangan Hard Delete Langsung di Supabase Dashboard
Tabel `public.profiles` dan `auth.users` memiliki integritas referensial foreign key (`ON DELETE RESTRICT`) terhadap beberapa tabel transaksional dan kepatuhan sistem, antara lain:
- `public.audit_logs.user_id`
- `public.grades.grader_id`
- `public.submissions.student_id`
- `public.enrollments.student_id`
- `public.classes.lecturer_id`

Mencoba melakukan **Hard Delete** baris pengguna secara langsung via Table Editor di Supabase Dashboard atau via query `DELETE FROM auth.users WHERE id = ...` akan **DITOLAK SECARA OTOMATIS** oleh PostgreSQL dengan error `violates foreign key constraint (RESTRICT)`. Hal ini merupakan desain keamanan yang disengaja untuk mencegah penghapusan jejak forensik audit dan integritas riwayat akademik.

### Prosedur yang Benar: Soft-Anonymization (Hak untuk Dilupakan / UU PDP)
Untuk memenuhi hak penghapusan data pribadi (Right to be Forgotten) sesuai UU Perlindungan Data Pribadi (UU PDP):
1. Pengguna wajib diproses melalui fungsi RPC keamanan:
   ```sql
   SELECT public.anonymize_user('USER-UUID-HER');
   ```
   Atau dieksekusi oleh `SUPER_ADMIN` melalui Server Action:
   ```typescript
   // src/modules/identity/actions.ts: deleteUserAction(targetUserId)
   ```
2. Fungsi `anonymize_user` akan:
   - Memvalidasi bahwa pemanggil adalah `SUPER_ADMIN` atau `service_role`.
   - Mengganti seluruh PII di `public.profiles` (`full_name = 'Anonymized User'`, `email = 'anonymized-<id>@deleted.local'`, `avatar_url = NULL`).
   - Mencabut seluruh role aktif pengguna dari tabel `public.user_roles`.
   - Menghapus sesi otentikasi aktif.
   - Mencatat peristiwa anonimisasi ini secara permanen ke `public.audit_logs` dengan aksi `USER_ANONYMIZED`.
   - Membiarkan entri baris UUID tetap ada sehingga integritas foreign key `RESTRICT` pada log audit dan rekaman nilai masa lalu tetap utuh.

---

## 6. Peringatan Keamanan Kritis: Pengujian Supabase Asli Wajib di Proyek Staging Terpisah

> [!WARNING]
> **PENGUJIAN DI SUPABASE ASLI (POSTGREST / JWT / HAK AKSES BAWAAN) BELUM DILAKUKAN**
>
> Seluruh verifikasi migrasi dan keamanan SQL sejauh ini dilakukan pada basis data lokal sekali pakai (PGlite) serta uji unit/mock kode di lingkungan pengembang.
>
> **Keterbatasan Pengujian PGlite:**
> 1. PGlite tidak menjalankan gateway PostgREST bawaan Supabase.
> 2. PGlite tidak memvalidasi penanganan header JWT `role=anon` / `role=authenticated` bawaan GoTrue / Supabase Auth.
> 3. Hak akses bawaan Supabase (`anon`, `authenticated`, `service_role`, `authenticator`) serta pembatasan skema via PostgREST OpenAPI belum diuji secara jaringan nyata.
>
> **Langkah Wajib Sebelum Produksi:**
> Pengujian menyeluruh pada proyek **Supabase STAGING terpisah** (BUKAN database produksi) WAJIB dilakukan sebelum rilis:
> 1. Terapkan migrasi 1..16 pada proyek Supabase Staging terpisah.
> 2. Lakukan pengujian PostgREST REST API dengan token JWT nyata per role (`STUDENT`, `LECTURER`, `PROGRAM_COORDINATOR`, `ACADEMIC_STAFF`, `SYSTEM_ADMIN`, `SUPER_ADMIN`).
> 3. Verifikasi bahwa endpoint PostgREST memblokir akses ke fungsi/tabel yang dibatasi (misal `audit_logs` tidak bisa di-update/delete oleh authenticated, `log_audit()` tidak bisa dieksekusi oleh anon/authenticated).
> 4. Verifikasi bahwa akun demo/seed HANYA disuntikkan ke proyek Staging dan **JANGAN PERNAH** di-seed ke lingkungan database produksi.

