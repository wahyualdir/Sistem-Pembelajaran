# Peta Persistensi Data SIAJAR (Audit Arsitektur & Perencanaan Fase 3)

Dokumen ini disusun sebagai audit menyeluruh baca-saja (*read-only architecture audit*) terhadap lapisan persistensi data aplikasi SIAJAR per 11 Oktober 2026. Audit ini memetakan setiap domain fungsional terhadap skema tabel database Supabase, berkas migrasi (`supabase/migrations/`), dan realitas pemanggilan kode di mode non-demo (`NODE_ENV=production` atau `ALLOW_DEMO_AUTH=false`).

---

## 1. Tabel Matriks Persistensi Per Domain

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
