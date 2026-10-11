# Dokumen Rencana Kerja Fase 3 (Phase 3 Execution Plan)

> **Status Dokumen**: RENCANA SAJA (*Planning Only*) — Tidak Ada Kode atau Migrasi yang Dijalankan pada Fase Ini.  
> **Tanggal Penyusunan**: 11 Oktober 2026  
> **Tujuan**: Menetapkan panduan arsitektur transisi lapisan persistensi aplikasi SIAJAR dari penyimpanan memori sementara (*in-memory*) ke basis data relasional permanen (Supabase PostgreSQL) dengan penegakan keamanan *Row Level Security* (RLS), *Role-Based Access Control* (RBAC), integritas transaksi ACID, dan kepatuhan regulasi UU Pelindungan Data Pribadi (UU PDP).

---

## 1. Urutan Domain yang Diusulkan & Rasional Ketergantungan (Dependency Sequence)

Urutan implementasi migrasi persistensi basis data dirancang secara berjenjang (*layered dependency order*). Setiap tingkatan hanya bergantung pada lapisan di bawahnya dan tidak menimbulkan siklus ketergantungan (*circular dependency*).

```
   ┌─────────────────────────────────────────────────────────────────┐
   │ 1. PONDASI: Identitas, Pengguna, Peran & Profil                │
   │    (auth.users, profiles, roles, user_roles, audit_logs)        │
   └────────────────────────────────┬────────────────────────────────┘
                                    │
   ┌────────────────────────────────▼────────────────────────────────┐
   │ 2. AKADEMIK DASAR: Master Data, Kurikulum, Kelas & Enrollment   │
   │    (study_programs, courses, academic_years, rooms, classes,    │
   │     enrollments, teaching_assistants)                           │
   └────────────────────────────────┬────────────────────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │                                               │
   ┌────────▼───────────────────────┐              ┌────────▼───────────────────────┐
   │ 3. EVALUASI AKADEMIK & NILAI   │              │ 4. KEHADIRAN & DISPENSASI      │
   │    (grade_components,          │              │    (attendance_sessions,       │
   │     student_grades,            │              │     attendance_records,        │
   │     gradebook_locks)           │              │     leave_permits)             │
   └────────────────┬───────────────┘              └────────────────────────────────┘
                    │
   ┌────────────────▼────────────────────────────────┐
   │ 5. EVALUASI BERBASIS CBT & PROCTORING           │
   │    (quizzes, quiz_questions, quiz_options,      │
   │     exam_attempts, exam_answers, exam_events)   │
   └────────────────┬────────────────────────────────┘
                    │
   ┌────────────────▼────────────────────────────────┐
   │ 6. PENYELESAIAN SENGKETA & AKUNTABILITAS NILAI  │
   │    (exam_disputes, grade_change_requests,       │
   │     grade_export_logs, immutable audit logs)    │
   └────────────────┬────────────────────────────────┘
                    │
   ┌────────────────▼────────────────────────────────┐
   │ 7. KOMUNIKASI, FORUM, MATERI & LAYANAN KONTEN   │
   │    (materials, assignments, submissions,        │
   │     notifications, forums, announcements,       │
   │     library, events, certificates, portfolios)  │
   └─────────────────────────────────────────────────┘
```

### Rincian Rasional Ketergantungan:
1. **Domain 1 (Identitas & Autentikasi)**: Pondasi mutlak. Semua baris data dan kebijakan RLS di seluruh tabel membutuhkan `auth.uid()` serta pemetaan peran dari tabel `user_roles`.
2. **Domain 2 (Master Data, Kelas & Enrollment)**: Seluruh kegiatan akademik membutuhkan entitas rombongan belajar (`classes`) dan hubungan keterikatan peserta (`enrollments`) serta dosen pengampu (`classes.lecturer_id`). Tanpa enrollment, presensi dan buku nilai tidak memiliki konteks.
3. **Domain 3 (Nilai & Gradebook)**: Buku nilai dasar kelas, bobot komponen nilai, dan batas penguncian nilai semester. Menjadi muara akhir dari seluruh penilaian tugas, presensi, dan ujian.
4. **Domain 4 (Presensi Kuliah & Izin Sakit)**: Bergantung pada kelas dan peserta kelas. Rekap presensi mempengaruhi kelayakan mahasiswa mengikuti ujian (ambang 75% kehadiran).
5. **Domain 5 (CBT Ujian & Proctoring)**: Membutuhkan kelas untuk penjadwalan ujian dan mahasiswa terdaftar untuk pengerjaan ujian (*attempts*). Telemetri kecurangan merekam intervensi pengawas secara *real-time*.
6. **Domain 6 (Sengketa Ujian & Perubahan Nilai Final)**: Membutuhkan lembar ujian (untuk sanggahan soal) dan buku nilai (untuk revisi nilai final terintegrasi 3 pihak: Dosen pengaju -> Kaprodi pemutus -> Staf eksekutor).
7. **Domain 7 (Konten, Forum, Notifikasi, Pustaka & Event)**: Lapisan interaksi sosial dan pelengkap akademik. Bergantung pada kelas dan identitas pengguna, tetapi kegagalan pada lapisan ini tidak melumpuhkan fungsi inti operasional akademik.

---

## 2. Rincian Teknis Per Domain (Tabel, RLS, Actions, & Migrasi)

---

### Domain 1: Identitas, Pengguna, Peran & Audit Log Dasar
- **Tabel & Kolom Kunci**:
  - `auth.users` (`id`, `email`, `created_at`)
  - `public.profiles` (`id` FK auth.users, `nim_nip`, `full_name`, `avatar_url`, `phone`, `status`, `created_at`)
  - `public.roles` (`id`, `name` [STUDENT, LECTURER, TEACHING_ASSISTANT, PROGRAM_COORDINATOR, ACADEMIC_STAFF, SYSTEM_ADMIN, SUPER_ADMIN])
  - `public.user_roles` (`id`, `user_id` FK profiles, `role_id` FK roles, `created_at`)
  - `public.audit_logs` (`id`, `actor_id` FK profiles, `on_behalf_of` FK profiles NULLABLE, `action`, `resource`, `resource_id`, `details`, `ip_address`, `user_agent`, `created_at`)
- **Relasi**: `profiles` 1:N `user_roles` N:1 `roles`; `audit_logs` mereferensikan `profiles(id)`.
- **Nama Berkas Migrasi**: `20260930000001_identity_schema.sql` (Existing), `20261011000015_audit_logs_hardening.sql` (Tahap Verifikasi).
- **Kebijakan RLS Per Peran**:
  - `profiles`: SELECT semua pengguna terautentikasi; UPDATE hanya milik sendiri (`auth.uid() = id`), SUPER_ADMIN dapat mengelola status semua akun.
  - `user_roles`: SELECT pengguna terautentikasi; INSERT/UPDATE/DELETE hanya SUPER_ADMIN.
  - `audit_logs`: INSERT dari service role / server actions; SELECT hanya untuk `SYSTEM_ADMIN` dan `SUPER_ADMIN`; UPDATE/DELETE dilarang mutlak via trigger anti-tamper.
- **Server Action yang Disambung Ulang**:
  - `loginAction()`, `logoutAction()`, `impersonateUserAction()`, `stopImpersonatingAction()`, `updateUserRoleAction()`, `deleteUserAction()`.
- **Data yang Harus Dimigrasi**: Akun dummy demo ditranslasikan ke akun seeding database via script `supabase/seed.sql` jika diizinkan pengembang.
- **Tombol yang Diaktifkan di UI**:
  - Hub Kelola Pengguna: Ubah Role, Nonaktifkan Akun, Tombol Impersonate Super Admin (dengan modal alasan min 10 karakter).

---

### Domain 2: Master Data Akademik, Kelas Perkuliahan & Enrollment
- **Tabel & Kolom Kunci**:
  - `public.study_programs` (`id`, `code`, `name`, `faculty`, `degree`)
  - `public.academic_years` (`id`, `code`, `name`, `semester` [ODD, EVEN, SHORT], `is_active`, `start_date`, `end_date`)
  - `public.rooms` (`id`, `name`, `code`, `building`, `capacity`, `latitude`, `longitude`, `radius_meters`)
  - `public.courses` (`id`, `study_program_id` FK, `code`, `name`, `credits`, `semester_level`, `is_active`)
  - `public.classes` (`id`, `course_id` FK, `academic_year_id` FK, `name`, `code`, `lecturer_id` FK profiles, `capacity`, `status` [DRAFT, PROPOSED, APPROVED, ACTIVE, ARCHIVED])
  - `public.enrollments` (`id`, `class_id` FK classes, `student_id` FK profiles, `status` [ENROLLED, DROPPED, COMPLETED], `final_grade_letter`, `final_grade_score`)
  - `public.teaching_assistants` (`id`, `class_id` FK classes, `ta_id` FK profiles, `assigned_at`)
- **Relasi**:
  - `classes` N:1 `courses`, `classes` N:1 `academic_years`, `classes` N:1 `profiles` (lecturer).
  - `enrollments` N:1 `classes`, `enrollments` N:1 `profiles` (student).
- **Nama Berkas Migrasi**: `20260930000003_academic_core.sql` (Existing), `20260930000008_master_data.sql` (Existing).
- **Kebijakan RLS Per Peran**:
  - `classes`: SELECT aktif untuk dosen pengampu (`lecturer_id = auth.uid()`), asisten, dan mahasiswa terdaftar via `enrollments`. Staf dan Kaprodi dapat melihat seluruh kelas pada lingkup prodi terkait. Mutasi `status` usulan kelas hanya oleh Kaprodi / Staf.
  - `enrollments`: Mahasiswa hanya dapat membaca baris milik mereka sendiri (`student_id = auth.uid()`); Dosen/Asisten membaca enrollment kelas yang diampu; Staf mengelola mutasi tambah/pindah kelas.
- **Server Action yang Disambung Ulang**:
  - `createClassAction()`, `approveClassAction()`, `assignLecturerAction()`, `enrollStudentAction()`, `batchEnrollCsvAction()`, `transferClassAction()`.
- **Data yang Harus Dimigrasi**: Daftar 21 mahasiswa demo, data mata kuliah kurikulum, dan master ruang GPS.
- **Tombol yang Diaktifkan di UI**:
  - Staf: Tambah Mahasiswa Manual, Simpan Plotting Kelas, Konfirmasi Impor CSV Peserta, Simpan Pindah Rombel.
  - Kaprodi: Setujui Kelas Baru, Simpan Penugasan Dosen.

---

### Domain 3: Buku Nilai & Komponen Nilai (Gradebook)
- **Tabel & Kolom Kunci**:
  - `public.grade_components` (`id`, `class_id` FK classes, `name`, `weight_percentage`, `type` [TASK, ATTENDANCE, QUIZ, MIDTERM, FINAL], `is_active`)
  - `public.student_grades` (`id`, `enrollment_id` FK enrollments, `component_id` FK grade_components, `score` NUMERIC(5,2) CHECK (score >= 0 AND score <= 100), `graded_by` FK profiles, `updated_at`)
  - `public.gradebook_locks` (`id`, `class_id` FK classes, `is_locked`, `locked_by` FK profiles, `locked_at`, `reason`)
- **Relasi**: `student_grades` N:1 `enrollments`, `student_grades` N:1 `grade_components`.
- **Nama Berkas Migrasi**: `20260930000005_grading.sql` (Existing).
- **Kebijakan RLS Per Peran**:
  - Dosen pengampu: INSERT/UPDATE skor hanya jika `gradebook_locks.is_locked = false` dan kelas milik dosen tersebut.
  - Asisten dosen: INSERT/UPDATE hanya komponen bertipe `TASK` atau `QUIZ`.
  - Mahasiswa: SELECT nilai milik sendiri via relasi `enrollments.student_id = auth.uid()`.
  - Kaprodi & Staf: SELECT agregasi nilai se-prodi; DILARANG mengubah langsung nilai mahasiswa (harus via mekanisme perubahan nilai).
- **Server Action yang Disambung Ulang**:
  - `saveGradeComponentAction()`, `inputStudentScoreAction()`, `lockGradebookAction()`, `recalculateFinalGradesAction()`.
- **Data yang Harus Dimigrasi**: Rekap komponen nilai dan nilai demo kelas Sistem Basis Data & Rekayasa Perangkat Lunak.
- **Tombol yang Diaktifkan di UI**:
  - Dosen: Simpan Bobot Komponen Nilai, Simpan Nilai Massal, Kunci Buku Nilai.

---

### Domain 4: Presensi Kuliah & Izin Sakit (Attendance & Leave Permits)
- **Tabel & Kolom Kunci**:
  - `public.attendance_sessions` (`id`, `class_id` FK classes, `session_number` INT, `title` VARCHAR, `session_date` DATE, `start_time` TIME, `end_time` TIME, `qr_secret` VARCHAR, `qr_refreshed_at` TIMESTAMPTZ, `room_id` FK rooms, `radius_meters` INT, `created_by` FK profiles)
  - `public.attendance_records` (`id`, `session_id` FK attendance_sessions, `student_id` FK profiles, `check_in_time` TIMESTAMPTZ, `method` [QR, MANUAL_LECTURER, GEOFENCE, FACE_RECOGNITION], `status` [PRESENT, LATE, ABSENT, EXCUSED], `latitude` NUMERIC, `longitude` NUMERIC, `verified_by` FK profiles)
  - `public.leave_permits` (`id`, `student_id` FK profiles, `class_id` FK classes, `session_number` INT, `permit_type` [SICK, PERMIT, BEREAVEMENT, ACADEMIC_DISPENSATION], `permit_date` DATE, `reason` TEXT, `attachment_url` TEXT, `status` [SUBMITTED, APPROVED, REJECTED], `reviewed_by` FK profiles, `reviewed_at` TIMESTAMPTZ, `rejection_reason` TEXT)
- **Relasi**: `attendance_records` N:1 `attendance_sessions` N:1 `classes`; `leave_permits` N:1 `classes`, `leave_permits` N:1 `profiles` (student).
- **Nama Berkas Migrasi**: `20261012000016_attendance_and_permits.sql` (Migrasi Baru Fase 3).
- **Kebijakan RLS Per Peran**:
  - `attendance_sessions`: Dosen pengampu dan Staf mengelola pembuatan sesi; Mahasiswa terdaftar hanya dapat melihat sesi aktif kelasnya.
  - `attendance_records`: Mahasiswa hanya dapat membaca rekaman miliknya dan menyisipkan check-in (`INSERT`) jika sesi aktif dan dalam radius GPS yang valid; Dosen/Asisten berwenang melakukan override manual status kehadiran.
  - `leave_permits`: Mahasiswa menyisipkan permohonan (`INSERT`) untuk dirinya sendiri; Dosen pengampu menyetujui/menolak permohonan.
- **Server Action yang Disambung Ulang**:
  - `createAttendanceSessionAction()`, `submitQrAttendanceAction()`, `manualOverrideAttendanceAction()`, `submitLeavePermitAction()`, `reviewLeavePermitAction()`.
- **Data yang Harus Dimigrasi**: Translasi log array `AttendanceStore.sessions` dan `AttendanceStore.leaves` ke tabel PostgreSQL.
- **Tombol yang Diaktifkan di UI**:
  - Dosen: Buka Sesi Presensi Baru, Tampilkan QR Dinamis, Override Status Presensi Mahasiswa, Setujui/Tolak Izin Sakit.
  - Mahasiswa: Check-in Presensi via QR / Geolocation, Unggah Bukti Surat Sakit / Izin.

---

### Domain 5: Kuis, Ujian CBT, Lembar Jawaban & Proctoring Telemetry
- **Tabel & Kolom Kunci**:
  - `public.quizzes` (`id`, `class_id` FK classes, `title`, `description`, `duration_minutes`, `start_time` TIMESTAMPTZ, `end_time` TIMESTAMPTZ, `max_attempts` INT, `shuffle_questions` BOOLEAN, `is_published` BOOLEAN, `strict_proctoring` BOOLEAN)
  - `public.quiz_questions` (`id`, `quiz_id` FK quizzes, `question_text` TEXT, `question_type` [MULTIPLE_CHOICE, ESSAY, CODE], `points` NUMERIC(4,2), `order_index` INT)
  - `public.quiz_options` (`id`, `question_id` FK quiz_questions, `option_text` TEXT, `is_correct` BOOLEAN, `order_index` INT)
  - `public.exam_attempts` (`id`, `quiz_id` FK quizzes, `student_id` FK profiles, `started_at` TIMESTAMPTZ, `finished_at` TIMESTAMPTZ, `total_score` NUMERIC(5,2), `status` [IN_PROGRESS, SUBMITTED, TIMED_OUT, DISQUALIFIED])
  - `public.exam_answers` (`id`, `attempt_id` FK exam_attempts, `question_id` FK quiz_questions, `selected_option_id` FK quiz_options NULLABLE, `essay_text` TEXT NULLABLE, `score_earned` NUMERIC(4,2), `graded_at` TIMESTAMPTZ)
  - `public.exam_events` (`id`, `attempt_id` FK exam_attempts, `event_type` [TAB_SWITCH, WINDOW_BLUR, EXIT_FULLSCREEN, DEVTOOLS_OPEN, MULTIPLE_FACES, NO_FACE, LECTURER_INTERVENTION], `details` JSONB, `created_at` TIMESTAMPTZ)
- **Relasi**: Hierarki kuis -> soal -> opsi; attempt -> jawaban; attempt -> event log.
- **Nama Berkas Migrasi**: `20261012000017_quizzes_and_cbt_engine.sql` (Migrasi Baru Fase 3).
- **Kebijakan RLS Per Peran**:
  - `quiz_questions` & `quiz_options`: Mahasiswa DILARANG melihat `is_correct = true` sebelum ujian dipublikasikan hasil resminya.
  - `exam_attempts` & `exam_answers`: Mahasiswa hanya dapat memanipulasi attempt milik dirinya sendiri selama status `IN_PROGRESS`; Server action melarang submit jika sesi disamarkan (`IMPERSONATION_RESTRICTED`).
  - `exam_events`: Mahasiswa/browser hanya dapat menyisipkan (*append*) telemetri kecurangan; Dosen pengawas berhak menambahkan event `LECTURER_INTERVENTION`.
- **Server Action yang Disambung Ulang**:
  - `createQuizAction()`, `publishQuizAction()`, `startQuizAttemptAction()`, `saveAnswerAction()`, `submitQuizAttemptAction()`, `logExamAnomalyAction()`, `interveneStudentAction()`.
- **Data yang Harus Dimigrasi**: Soal kuis UTS & UAS di memori demo, riwayat pelanggaran telemetri mahasiswa demo.
- **Tombol yang Diaktifkan di UI**:
  - Dosen: Buat Bank Soal, Publikasikan Kuis, Intervensi Pengawas (Peringatan / Tambah Waktu / Diskualifikasi).
  - Mahasiswa: Mulai Pengerjaan Ujian, Kirim Lembar Jawaban.

---

### Domain 6: Sengketa Nilai Ujian & Putusan Perubahan Nilai Final
- **Tabel & Kolom Kunci**:
  - `public.exam_disputes` (`id`, `attempt_id` FK exam_attempts, `question_id` FK quiz_questions, `student_id` FK profiles, `reason` TEXT, `status` [SUBMITTED, RESOLVED, REJECTED], `lecturer_feedback` TEXT, `adjusted_points` NUMERIC(4,2), `updated_at` TIMESTAMPTZ)
  - `public.grade_change_requests` (`id`, `grade_id` FK grades, `class_id` FK classes, `requested_by` FK profiles, `class_title` TEXT, `assignment_title` TEXT, `student_name` TEXT, `old_score` NUMERIC(6,2), `proposed_score` NUMERIC(6,2), `reason` TEXT, `status` [PENDING, APPROVED, REJECTED, EXECUTED], `reviewed_by` FK profiles, `reviewed_at` TIMESTAMPTZ, `executed_by` FK profiles, `executed_at` TIMESTAMPTZ)
- **Relasi**: Terikat ke pangkalan data nilai dan attempt ujian.
- **Nama Berkas Migrasi**: `20261011000014_grade_change_decision_and_execution.sql` (Tahap Verifikasi).
- **Kebijakan RLS Per Peran**:
  - Sesuai RPC `decide_grade_change` dan `execute_grade_change`:
    - Pemisahan 3 pihak ditegakkan ketat: Dosen pengaju tidak boleh menyetujui/menolak; Kaprodi hanya memutuskan status `APPROVED`/`REJECTED`; Staf hanya mengeksekusi pengajuan berstatus `APPROVED`.
    - Dilarang keras dipanggil selama sesi impersonasi aktif (`IMPERSONATION_RESTRICTED`).
- **Server Action yang Disambung Ulang**:
  - `submitExamDisputeAction()`, `resolveExamDisputeAction()`, `requestGradeChangeAction()`, `decideGradeChangeAction()`, `executeGradeChangeAction()`.
- **Data yang Harus Dimigrasi**: Daftar pengajuan perubahan nilai demo (`cr-demo-001`, `cr-demo-002`).
- **Tombol yang Diaktifkan di UI**:
  - Dosen: Tanggapi Sanggahan Nilai, Ajukan Revisi Nilai Final ke Kaprodi.
  - Kaprodi: Setujui Perubahan Nilai, Tolak Perubahan Nilai.
  - Staf: Eksekusi Perubahan Nilai ke Master Database.

---

### Domain 7: Konten Pembelajaran, Forum, Notifikasi, Pustaka & Event
- **Tabel & Kolom Kunci**:
  - `public.materials` & `material_attachments` (Tautan modul perkuliahan per pertemuan)
  - `public.assignments` & `submissions` (Tenggat waktu tugas dan berkas pengumpulan mahasiswa)
  - `public.notifications` (Pemberitahuan inbox pengguna)
  - `public.forums`, `threads`, `posts` (Diskusi kelas perkuliahan)
  - `public.announcements` (Siaran rektorat dan prodi)
  - `public.library_items` & `library_loans` (Katalog buku fisik dan modul digital)
  - `public.campus_events` & `event_registrations` (Seminar dan workshop universitas)
  - `public.certificates` & `student_portfolios` (Portofolio capaian prestasi mahasiswa)
- **Nama Berkas Migrasi**: `20261012000018_campus_content_and_services.sql` (Migrasi Baru Fase 3).
- **Kebijakan RLS Per Peran**: Standar kepemilikan kelas/konten per peran.
- **Server Action yang Disambung Ulang**: `uploadMaterialAction()`, `submitAssignmentAction()`, `markNotificationReadAction()`, `postForumReplyAction()`, `createAnnouncementAction()`.
- **Tombol yang Diaktifkan di UI**:
  - Staf: Tambah Koleksi Pustaka, Buat Event Kampus, Terbitkan Sertifikat.
  - Super Admin: Buat Maklumat Baru (Broadcast Global).

---

## 3. Strategi Keamanan Migrasi (Staging, Backup, Rollback & Feature Flags)

Untuk menjamin zero-downtime dan mencegah rusaknya integritas data produksi:

### a. Lingkungan Staging Terpisah (*Isolated Staging Environment*)
- Setiap migrasi SQL wajib diterapkan terlebih dahulu pada proyek Supabase Staging (`staging.supabase.co`) yang terisolasi penuh dari pangkalan data produksi (`prod.supabase.co`).
- Pengujian otomatis (*automated regression & smoke tests*) dijalankan pada branch staging sebelum merge ke branch `main`.

### b. Prosedur Backup Sebelum Migrasi (*Pre-Migration Snapshot*)
- Administrator basis data wajib mengambil snapshot cadangan fisik penuh (*full logical dump*) sebelum migrasi dijalankan:
  ```bash
  # Perintah pencadangan skema dan data produksi:
  supabase db dump --db-url "$DATABASE_URL" -f "backup_pre_phase3_$(date +%Y%m%d_%H%M%S).sql"
  ```

### c. Urutan Penerapan Migrasi (*Sequential Application Order*)
Migrasi wajib dijalankan berurutan berdasarkan stempel waktu tanpa melompati berkas:
1. `20261011000014_grade_change_decision_and_execution.sql`
2. `20261011000015_audit_logs_hardening.sql`
3. `20261012000016_attendance_and_permits.sql`
4. `20261012000017_quizzes_and_cbt_engine.sql`
5. `20261012000018_campus_content_and_services.sql`

### d. Rencana Rollback (*Rollback Plan*)
- Untuk setiap berkas migrasi `*.sql`, disiapkan berkas pendamping `*_rollback.sql` yang memuat perintah drop table, drop policy, drop trigger, dan drop function secara terbalik:
  - Contoh: Rollback untuk migrasi 000014 mencakup `DROP FUNCTION IF EXISTS execute_grade_change; DROP FUNCTION IF EXISTS decide_grade_change;`.
- Jika terjadi kegagalan eksekusi migrasi, transaksi PostgreSQL otomatis membatalkan seluruh perubahan (*automatic transactional rollback* karena skema DDL di PostgreSQL bersifat transaksional).

### e. Manajemen Feature Flag Per Domain (*Domain Feature Flags*)
Setiap domain dikendalikan melalui variabel lingkungan (*environment variables*) di server produksi:
- `FF_PERSISTENCE_ATTENDANCE=true/false` (Kendali persistensi presensi)
- `FF_PERSISTENCE_QUIZZES=true/false` (Kendali CBT dan proctoring)
- `FF_PERSISTENCE_GRADE_CHANGES=true/false` (Kendali putusan revisi nilai)
- `FF_PERSISTENCE_LIBRARY=true/false` (Kendali pustaka dan event)

Jika suatu domain mengalami anomali di produksi, flag domain tersebut dapat dimatikan (`false`) tanpa menghentikan modul akademik lainnya, sehingga antarmuka kembali menampilkan status protektif *read-only* atau *clean empty state*.

---

## 4. Definisi Selesai (*Definition of Done*) Per Domain

Sebuah domain dinyatakan selesai pada Fase 3 apabila memenuhi kriteria ketat berikut:

1. **Uji Produksi Nyata (*Real Production Verification*)**:
   - Berjalan pada lingkungan build produksi (`NODE_ENV=production` dan `ALLOW_DEMO_AUTH=false`).
   - Tidak ada status sukses palsu (*fake success*), indikator koneksi palsu, atau angka telemetri karangan.
   - Entri baru berhasil disimpan ke tabel PostgreSQL dan dapat dibaca kembali (*persisted query*).
2. **Uji Negatif Berpasangan (*Negative Security with Positive Controls*)**:
   - Seluruh aksi mutasi server action diuji dengan skenario negatif (peran tidak berhak, percobaan manipulasi ID, prodi silang) dan WAJIB ditolak server disertai kode error eksplisit.
   - Setiap uji negatif dipasangkan dengan kontrol positif (peran sah berhasil mengeksekusi) untuk membuktikan bahwa penolakan disebabkan oleh penegakan hak akses, bukan karena kegagalan internal server (*internal error*).
3. **Uji Ketahanan Restart Kontainer (*Container Restart Resilience Test*)**:
   - Data yang baru dimasukkan melalui mutasi server action WAJIB tetap utuh dan terbaca sempurna setelah instance server Next.js di-restart/didaur ulang (*kill & restart process*), membuktikan hilangnya ketergantungan pada memori RAM Node.js.
4. **Verifikasi Zero TODO di Antarmuka Pengguna**:
   - Teks `"TODO(backend)"` tidak boleh muncul di layar pengguna; digantikan dengan penjelasan operasional yang ramah dan jujur.

---

## 5. Daftar Risiko & Keputusan yang Membutuhkan Persetujuan Pengguna

Berikut adalah daftar risiko arsitektural dan poin-poin yang memerlukan arahan resmi sebelum Fase 3 dimulai:

| No | Kategori | Deskripsi Risiko / Pertimbangan Arsitektur | Opsi Solusi yang Tersedia | Pilihan yang Direkomendasikan | Memerlukan Keputusan User? |
|---|---|---|---|---|---|
| 1 | **Kepatuhan Regulasi (UU PDP)** | Trigger append-only pada tabel `audit_logs` melarang mutasi/penghapusan selamanya. Namun UU PDP mewajibkan hak penghapusan data pribadi setelah masa retensi habis (misal: 5 tahun). | A: Bypass retensi via parameter rahasia internal `siajar.lawful_retention_purge = 'on'`.<br>B: Menggunakan tabel partisi per tahun (*partitioned table*) di mana partisi kedaluwarsa di-*drop* secara utuh tanpa melanggar trigger baris. | **Opsi B (Partisi)** untuk produksi skala besar, didukung Opsi A untuk masa transisi. | **YA (Persetujuan skema retensi UU PDP)** |
| 2 | **Penyimpanan Berkas (Storage Buckets)** | Surat dokter izin sakit dan lampiran tugas membutuhkan penyimpanan berkas biner. | A: Supabase Storage Bucket dengan signed URL berbatas waktu (15 menit).<br>B: AWS S3 / Cloudflare R2 eksternal. | **Opsi A (Supabase Storage)** agar konsisten dengan ekosistem database saat ini. | **YA (Konfirmasi pemilihan storage)** |
| 3 | **Penanganan Beban Ujian CBT Bersamaan** | Ratusan mahasiswa mengirimkan jawaban kuis per detik pada menit-menit akhir ujian, berpotensi memicu *connection pool exhaustion* pada PostgreSQL Supabase tier gratis/standar. | A: Direct PostgreSQL INSERT per jawaban butir soal.<br>B: Menggunakan Redis / Upstash queue sebagai buffer sementara sebelum batch sync ke PostgreSQL.<br>C: Submit hanya dilakukan di akhir ujian (*single-payload submission*), dengan draft disimpan di `localStorage` peramban mahasiswa. | **Opsi C** sebagai langkah teraman dan termurah tanpa infrastruktur tambahan. | **YA (Persetujuan alur pengumpulan jawaban CBT)** |
| 4 | **Strategi Penanganan Data Demo Lama** | Apakah data sintetis demo (21 mahasiswa, 4 dosen, nilai in-memory) perlu dibuatkan script seeding resmi ke database staging/produksi, atau dibersihkan total saat rilis publik? | A: Bersihkan total (DB dimulai dari keadaan kosong / clean state).<br>B: Sediakan script `supabase/seed.sql` opsional untuk lingkungan evaluasi/staging. | **Opsi B (Sediakan seed.sql opsional)**. | **YA (Persetujuan penanganan seed data)** |

---

> **PERNYATAAN PENGHENTIAN (STOP RULE)**:  
> Perencanaan Fase 3 telah selesai disusun. Sesuai instruksi ketat pengguna, asisten AI **BERHENTI DI SINI** dan **TIDAK MENJALANKAN MIGRASI** serta **TIDAK MENULIS KODE FASE 3** sampai dokumen rencana ini ditinjau dan disetujui secara resmi oleh pengguna.
