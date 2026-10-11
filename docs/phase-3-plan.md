# Dokumen Rencana Kerja Fase 3 (Phase 3 Execution Plan) — Edisi Selaras Snapshot Skema

> **Status Dokumen**: RENCANA SAJA (*Planning Only*) — Tidak Ada Kode atau Migrasi yang Dijalankan pada Fase Ini.  
> **Tanggal Pembaruan**: 11 Oktober 2026  
> **Sumber Kebenaran Tunggal (*Single Source of Truth*)**: [`docs/schema-snapshot.md`](file:///c:/Users/ACER/Downloads/implementasi/docs/schema-snapshot.md) (Hasil migrasi 1..16 pada PGlite).  
> **Tujuan**: Menetapkan panduan arsitektur transisi lapisan persistensi aplikasi SIAJAR dari penyimpanan memori sementara (*in-memory*) ke basis data relasional permanen (Supabase PostgreSQL) dengan penegakan keamanan *Row Level Security* (RLS), *Role-Based Access Control* (RBAC), integritas transaksi ACID, dan kepatuhan regulasi UU Pelindungan Data Pribadi (UU PDP).

---

## 1. Urutan Domain yang Diusulkan & Rasional Ketergantungan (Dependency Sequence)

Urutan implementasi migrasi persistensi basis data dirancang secara berjenjang (*layered dependency order*). Setiap tingkatan hanya bergantung pada lapisan di bawahnya dan tidak menimbulkan siklus ketergantungan (*circular dependency*):

```
   ┌─────────────────────────────────────────────────────────────────┐
   │ 1. PONDASI IDENTITAS & KEAMANAN                                 │
   │    auth.users, profiles, roles, user_roles, audit_logs         │
   └────────────────────────────────┬────────────────────────────────┘
                                    │
   ┌────────────────────────────────▼────────────────────────────────┐
   │ 2. AKADEMIK DASAR: Master Kurikulum, Kelas & Asisten Dosen     │
   │    programs, semesters, courses, classes, enrollments,         │
   │    class_assistants                                             │
   └────────────────────────────────┬────────────────────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │                                               │
   ┌────────▼───────────────────────┐              ┌────────▼───────────────────────┐
   │ 3. EVALUASI AKADEMIK & NILAI   │              │ 4. KEHADIRAN & DISPENSASI      │
   │    grades, grade_history       │              │    attendance_sessions,        │
   │                                │              │    attendance_records,         │
   │                                │              │    leave_permits (BARU)        │
   └────────────────┬───────────────┘              └────────────────────────────────┘
                    │
   ┌────────────────▼────────────────────────────────┐
   │ 5. EVALUASI BERBASIS CBT & PROCTORING (BARU)    │
   │    quizzes, quiz_questions, quiz_options,      │
   │    exam_attempts, exam_answers, exam_events     │
   └────────────────┬────────────────────────────────┘
                    │
   ┌────────────────▼────────────────────────────────┐
   │ 6. SENGKETA NILAI & PERUBAHAN NILAI FINAL       │
   │    grade_change_requests (SUDAH ADA),           │
   │    exam_disputes (BARU)                         │
   └────────────────┬────────────────────────────────┘
                    │
   ┌────────────────▼────────────────────────────────┐
   │ 7. KOMUNIKASI, MATERI, FORUM & LAYANAN KONTEN   │
   │    materials, assignments, submissions,         │
   │    notifications, discussions, announcements,   │
   │    library, campus_events, portfolios (BARU)    │
   └─────────────────────────────────────────────────┘
```

### Rincian Rasional Ketergantungan:
1. **Domain 1 (Identitas & Autentikasi)**: Pondasi mutlak. Semua baris data dan kebijakan RLS di seluruh tabel membutuhkan `auth.uid()`, relasi ke `public.profiles(id)`, dan verifikasi peran dari `public.user_roles`.
2. **Domain 2 (Master Kurikulum, Kelas, Peserta & Asisten)**: Seluruh kegiatan perkuliahan membutuhkan entitas program studi (`programs`), semester aktif (`semesters`), mata kuliah (`courses`), rombongan belajar (`classes`), peserta kelas (`enrollments`), dan asisten dosen (`class_assistants`). Tanpa ini, pencatatan nilai dan presensi tidak memiliki jangkar relasional.
3. **Domain 3 (Nilai & Gradebook)**: Buku nilai master kelas menggunakan tabel `public.grades` dan riwayat audit perubahan nilai `public.grade_history`.
4. **Domain 4 (Presensi Kuliah & Izin Sakit)**: Bergantung pada kelas dan peserta kelas. Rekap presensi mempengaruhi kelayakan mahasiswa mengikuti evaluasi akhir.
5. **Domain 5 (CBT Ujian & Proctoring)**: Membutuhkan kelas untuk penjadwalan kuis/ujian dan mahasiswa terdaftar untuk pengerjaan ujian (*attempts*). Telemetri kecurangan merekam intervensi pengawas secara *real-time*.
6. **Domain 6 (Sengketa Ujian & Perubahan Nilai Final)**: Membutuhkan lembar ujian (untuk sanggahan soal CBT) dan master nilai (untuk permohonan revisi nilai terintegrasi 3 pihak di `grade_change_requests`: Dosen pengaju -> Kaprodi pemutus -> Staf eksekutor).
7. **Domain 7 (Konten, Forum, Notifikasi, Pustaka & Event)**: Modul kolaborasi dan layanan pendukung kampus.

---

## 2. Rincian Teknis Per Domain (Pemisahan Status Skema & Rencana DDL)

Semua DDL baru di Fase 3 **WAJIB** menggunakan klausa defensif `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` atau `CREATE TABLE IF NOT EXISTS` agar **TIDAK MENCIPTAKAN TABEL GANDA** atau menimpa skema yang sudah ada di snapshot 1..16.

---

### Domain 1: Identitas, Pengguna, Peran & Audit Log

#### A. SUDAH ADA di Skema (Snapshot Migrasi 1..16):
- `auth.users`: Managed oleh Supabase Auth (`id` UUID, `email`).
- `public.profiles`: `id` UUID (PK -> auth.users), `full_name`, `email`, `avatar_url`, `status` (`user_status`: PENDING, ACTIVE, LOCKED, SUSPENDED, DEACTIVATED), `must_change_password`, `created_at`, `updated_at`.
- `public.roles`: `id` UUID, `code` VARCHAR(50) UNIQUE, `name` VARCHAR(100), `description` TEXT.
- `public.user_roles`: `id` UUID, `user_id` UUID (FK profiles RESTRICT), `role_id` UUID (FK roles RESTRICT), `scope_type` (`scope_type`: GLOBAL, PROGRAM, CLASS), `scope_id` UUID, `status` (`user_role_status`: ACTIVE, REVOKED, EXPIRED).
- `public.user_identifiers`: `id` UUID, `user_id` UUID (FK profiles CASCADE), `type` (`identifier_type`: NIM, NIDN, NIP, EMAIL, USERNAME), `value` VARCHAR(100).
- `public.user_devices`: `id` UUID, `user_id` UUID (FK profiles CASCADE), `device_id_hash`, `label`, `last_ip_masked`, `trusted`, `revoked_at`.
- `public.login_events`: `id` UUID, `user_id` UUID (FK profiles CASCADE), `device_id` UUID, `event_type` (`event_type`), `risk_level` (`risk_level`).
- `public.audit_logs`: `id` UUID, `actor_user_id` UUID (FK profiles RESTRICT), `actor_role` VARCHAR(50), `action` VARCHAR(100), `entity_type` VARCHAR(100), `entity_id` UUID, `scope_type` VARCHAR(50), `scope_id` UUID, `description` TEXT, `details` JSONB, `ip_address` INET, `user_agent` TEXT, `on_behalf_of` UUID (FK profiles RESTRICT), `before_json` JSONB, `after_json` JSONB, `created_at` TIMESTAMPTZ.
  - *Trigger Perlindungan*: `tr_audit_logs_immutable` mencegah `UPDATE` dan `DELETE`.
  - *Hak Akses*: `log_audit()` dicabut dari public/anon/authenticated (hanya `service_role`).

#### B. TABEL BARU (Fase 3):
- *Tidak ada tabel baru yang diperlukan*. Skema identitas, perangkat, login, dan audit log sudah lengkap dan teruji di Fase 2E.

#### C. Status Server Actions:
- `loginAction()` [SUDAH ADA di Kode]
- `logoutAction()` [SUDAH ADA di Kode]
- `impersonateUserAction()` [SUDAH ADA di Kode — Teruji HMAC & Fail-Closed]
- `stopImpersonatingAction()` [SUDAH ADA di Kode]
- `updateUserRoleAction()` [SUDAH ADA di Kode — Teruji Cek Terakhir & Audit Rollback]
- `deleteUserAction()` [SUDAH ADA di Kode — Teruji RPC anonymize_user]

#### D. Penanganan Data Akun Seed/Demo:
- **PERINGATAN KERAS**: Akun demo/seed sintetis (`a0000010-...`, dsb.) **HANYA BOLEH DISUNTIKKAN KE LINGKUNGAN STAGING**.
- **JANGAN PERNAH** men-seed akun demo ke lingkungan database produksi. Di produksi, akun admin awal dibuat secara mandiri via CLI Supabase / Supabase Auth Dashboard dengan kata sandi unik yang kuat.

---

### Domain 2: Master Kurikulum, Kelas Perkuliahan, Peserta & Asisten

#### A. SUDAH ADA di Skema (Snapshot Migrasi 1..16):
- `public.programs` (Bukan `study_programs`): `id` UUID, `code` VARCHAR(20) UNIQUE, `name` VARCHAR(100), `degree` VARCHAR(20), `is_active` BOOLEAN, `created_at`, `updated_at`.
- `public.semesters` (Bukan `academic_years`): `id` UUID, `code` VARCHAR(20) UNIQUE, `name` VARCHAR(50), `start_date` DATE, `end_date` DATE, `is_active` BOOLEAN, `created_at`, `updated_at`.
- `public.courses`: `id` UUID, `program_id` UUID (FK programs RESTRICT), `code` VARCHAR(20), `name` VARCHAR(100), `credits` INTEGER, `status` VARCHAR(20), `created_at`, `updated_at`.
- `public.classes`: `id` UUID, `course_id` UUID (FK courses RESTRICT), `semester_id` UUID (FK semesters RESTRICT), `title` VARCHAR(100), `section` VARCHAR(10), `capacity` INTEGER, `status` (`class_status`: DRAFT, OPEN, ACTIVE, CLOSED, ARCHIVED), `created_by` UUID (FK profiles RESTRICT), `created_at`, `updated_at`.
- `public.enrollments`: `id` UUID, `class_id` UUID (FK classes RESTRICT), `user_id` UUID (FK profiles RESTRICT), `status` (`enrollment_status`: ACTIVE, DROPPED, COMPLETED, REMOVED), `created_at`, `updated_at`.
- `public.class_assistants` (Bukan `teaching_assistants`): `id` UUID, `class_id` UUID (FK classes RESTRICT), `user_id` UUID (FK profiles RESTRICT), `permission` VARCHAR(50), `assigned_by` UUID (FK profiles RESTRICT), `assigned_at` TIMESTAMPTZ.

#### B. TABEL / KOLOM BARU (Fase 3):
- `ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS lecturer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;`
- `CREATE TABLE IF NOT EXISTS public.rooms ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(100) NOT NULL, building VARCHAR(100), capacity INT, latitude NUMERIC(10,7), longitude NUMERIC(10,7), radius_meters INT DEFAULT 50, created_at TIMESTAMPTZ DEFAULT now() );`

#### C. Status Server Actions:
- `createClassAction()` [SUDAH ADA di Kode]
- `listMyClassesAction()` [SUDAH ADA di Kode]
- `approveClassAction()` [BARU DIBUAT di Fase 3 — Khusus Kaprodi]
- `assignLecturerAction()` [BARU DIBUAT di Fase 3 — Khusus Kaprodi]
- `enrollStudentAction()` [BARU DIBUAT di Fase 3 — Khusus Staf Akademik]
- `batchEnrollCsvAction()` [BARU DIBUAT di Fase 3 — Khusus Staf Akademik]
- `transferClassAction()` [BARU DIBUAT di Fase 3 — Khusus Staf Akademik]

---

### Domain 3: Evaluasi Akademik, Nilai & Gradebook

#### A. SUDAH ADA di Skema (Snapshot Migrasi 1..16):
- `public.grades`: `id` UUID, `item_type` VARCHAR(50), `item_id` UUID, `student_id` UUID (FK profiles RESTRICT), `score` NUMERIC(5,2), `max_score` NUMERIC(5,2), `status` (`grade_status`: DRAFT, FINAL), `comment` TEXT, `created_by` UUID (FK profiles RESTRICT), `created_at`, `updated_at`.
- `public.grade_history`: `id` UUID, `grade_id` UUID (FK grades CASCADE), `score` NUMERIC(5,2), `change_reason` TEXT, `changed_by` UUID (FK profiles RESTRICT), `changed_at` TIMESTAMPTZ.

#### B. TABEL / KOLOM BARU (Fase 3):
- Tambahkan kolom referensi kelas ke tabel `public.grades`:
  `ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE RESTRICT;`
- Kunci buku nilai kelas (*Gradebook Locks*):
  `CREATE TABLE IF NOT EXISTS public.gradebook_locks ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT, is_locked BOOLEAN DEFAULT true, locked_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT, locked_at TIMESTAMPTZ DEFAULT now(), reason TEXT, CONSTRAINT uq_gradebook_class UNIQUE(class_id) );`

#### C. Status Server Actions:
- `saveScoreAction()` [BARU DIBUAT di Fase 3 — Dosen/Asisten sesuai izin class_assistants]
- `lockGradebookAction()` [BARU DIBUAT di Fase 3 — Khusus Dosen Pengampu / Kaprodi]
- `recalculateFinalGradesAction()` [BARU DIBUAT di Fase 3 — Staf Akademik]

---

### Domain 4: Kehadiran Kuliah & Dispensasi (Presensi & Izin Sakit)

#### A. SUDAH ADA di Skema (Snapshot Migrasi 1..16):
- *Belum ada tabel presensi di skema 1..16* (saat ini masih tersimpan pada array in-memory `AttendanceStore`).

#### B. TABEL BARU (Fase 3):
- Sesi Presensi Perkuliahan:
  ```sql
  CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    session_number INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    qr_token_secret VARCHAR(100),
    qr_refreshed_at TIMESTAMPTZ,
    room_id UUID REFERENCES public.rooms(id) ON DELETE RESTRICT,
    radius_meters INT DEFAULT 50,
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_session_class_number UNIQUE (class_id, session_number)
  );
  ```
- Rekam Kehadiran Mahasiswa:
  ```sql
  CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    method VARCHAR(50) NOT NULL, -- 'QR', 'MANUAL_LECTURER', 'GEOFENCE'
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENT', -- 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED'
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    verified_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    CONSTRAINT uq_session_student UNIQUE (session_id, student_id)
  );
  ```
- Permohonan Izin / Sakit (Dispensasi):
  ```sql
  CREATE TABLE IF NOT EXISTS public.leave_permits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    session_number INT NOT NULL,
    permit_type VARCHAR(50) NOT NULL, -- 'SICK', 'OFFICIAL_DUTY', 'BEREAVEMENT', 'OTHER'
    permit_date DATE NOT NULL,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED', -- 'SUBMITTED', 'APPROVED', 'REJECTED'
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reviewed_at TIMESTAMPTZ,
    review_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

#### C. Status Server Actions:
- `createAttendanceSessionAction()` [BARU DIBUAT di Fase 3]
- `submitQrAttendanceAction()` [BARU DIBUAT di Fase 3]
- `manualOverrideAttendanceAction()` [BARU DIBUAT di Fase 3]
- `submitLeavePermitAction()` [BARU DIBUAT di Fase 3]
- `reviewLeavePermitAction()` [BARU DIBUAT di Fase 3]

---

### Domain 5: Kuis, Ujian CBT & Telemetri Proctoring

#### A. SUDAH ADA di Skema (Snapshot Migrasi 1..16):
- *Belum ada tabel CBT di skema 1..16* (saat ini beroperasi in-memory pada `QuizStore`).

#### B. TABEL BARU (Fase 3):
- Bank Kuis & Pengaturan Ujian:
  ```sql
  CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    duration_minutes INT NOT NULL DEFAULT 60,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    max_attempts INT NOT NULL DEFAULT 1,
    shuffle_questions BOOLEAN NOT NULL DEFAULT true,
    is_published BOOLEAN NOT NULL DEFAULT false,
    strict_proctoring BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL DEFAULT 'MULTIPLE_CHOICE', -- 'MULTIPLE_CHOICE', 'ESSAY'
    points NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    order_index INT NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS public.quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_index INT NOT NULL DEFAULT 0
  );
  ```
- Sesi Ujian Mahasiswa & Lembar Jawaban:
  ```sql
  CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    total_score NUMERIC(5,2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT', 'DISQUALIFIED'
    CONSTRAINT uq_quiz_attempt UNIQUE (quiz_id, student_id, started_at)
  );

  CREATE TABLE IF NOT EXISTS public.exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE RESTRICT,
    selected_option_id UUID REFERENCES public.quiz_options(id) ON DELETE RESTRICT,
    essay_text TEXT,
    score_earned NUMERIC(5,2) DEFAULT 0.00,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    graded_at TIMESTAMPTZ,
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
  );

  CREATE TABLE IF NOT EXISTS public.exam_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'TAB_SWITCH', 'WINDOW_BLUR', 'EXIT_FULLSCREEN', 'DEVTOOLS_OPEN', 'LECTURER_INTERVENTION'
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

#### C. Status Server Actions:
- `submitQuizAttemptAction()` [SUDAH ADA di Kode — Teruji Guard Impersonasi A3c]
- `createQuizAction()` [BARU DIBUAT di Fase 3]
- `publishQuizAction()` [BARU DIBUAT di Fase 3]
- `startQuizAttemptAction()` [BARU DIBUAT di Fase 3]
- `saveAnswerAction()` [BARU DIBUAT di Fase 3]
- `interveneStudentAction()` [BARU DIBUAT di Fase 3]

---

### Domain 6: Sengketa Nilai Ujian & Putusan Perubahan Nilai Final

#### A. SUDAH ADA di Skema (Snapshot Migrasi 1..16):
- `public.grade_change_requests`: `id` UUID, `grade_id` UUID (FK grades RESTRICT), `class_id` UUID (FK classes RESTRICT), `old_score` NUMERIC(5,2), `proposed_score` NUMERIC(5,2), `reason` TEXT, `status` (`change_request_status`: PENDING, APPROVED, REJECTED, EXECUTED), `requested_by` UUID (FK profiles RESTRICT), `reviewed_by` UUID (FK profiles RESTRICT), `reviewed_at` TIMESTAMPTZ, `review_note` TEXT, `executed_by` UUID (FK profiles RESTRICT), `executed_at` TIMESTAMPTZ, `execution_note` TEXT, `created_at` TIMESTAMPTZ.
  - *Fungsi Keamanan*: RPC `decide_grade_change` (000014) dan `execute_grade_change` (000014) sudah diimplementasikan dengan row-level lock `FOR UPDATE` dan audit logging.

#### B. TABEL BARU (Fase 3):
- Sanggahan Nilai Ujian CBT (*Exam Disputes*):
  ```sql
  CREATE TABLE IF NOT EXISTS public.exam_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE RESTRICT,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED', -- 'SUBMITTED', 'RESOLVED', 'REJECTED'
    lecturer_feedback TEXT,
    adjusted_points NUMERIC(5,2),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```

#### C. Status Server Actions:
- `decideGradeChangeAction()` [SUDAH ADA di Kode — Teruji RPC & Larangan Impersonasi A3c]
- `executeGradeChangeAction()` [SUDAH ADA di Kode — Teruji RPC & Audit Rollback]
- `requestGradeChangeAction()` [SUDAH ADA di Kode]
- `submitExamDisputeAction()` [BARU DIBUAT di Fase 3]
- `resolveExamDisputeAction()` [BARU DIBUAT di Fase 3]

---

### Domain 7: Konten Pembelajaran, Forum, Notifikasi, Pustaka & Event

#### A. SUDAH ADA di Skema (Snapshot Migrasi 1..16):
- `public.materials`: `id` UUID, `class_id` UUID (FK classes RESTRICT), `title`, `description`, `content_url`, `status` (`material_status`), `created_by` (FK profiles RESTRICT).
- `public.assignments`: `id` UUID, `class_id` UUID (FK classes RESTRICT), `title`, `description`, `due_at`, `close_at`, `max_score`, `status` (`assignment_status`), `created_by` (FK profiles RESTRICT).
- `public.submissions`: `id` UUID, `assignment_id` UUID (FK assignments RESTRICT), `student_id` UUID (FK profiles RESTRICT), `text_body`, `attachment_url`, `status` (`submission_status`), `submitted_at`, `is_late`.
- `public.notifications`: `id` UUID, `user_id` UUID (FK profiles RESTRICT), `title`, `message`, `link`, `is_read`, `created_at`.
- `public.discussions`: `id` UUID, `class_id` UUID (FK classes RESTRICT), `author_id` UUID (FK profiles RESTRICT), `title`, `body`, `created_at`.
- `public.discussion_replies`: `id` UUID, `discussion_id` UUID (FK discussions CASCADE), `author_id` UUID (FK profiles RESTRICT), `body`, `created_at`.
- `public.announcements`: `id` UUID, `class_id` UUID (FK classes RESTRICT), `author_id` UUID (FK profiles RESTRICT), `title`, `body`, `created_at`.

#### B. TABEL BARU (Fase 3):
- Layanan Ekstensi Kampus (Pustaka, Event, Portofolio):
  ```sql
  CREATE TABLE IF NOT EXISTS public.library_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isbn VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.campus_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    location VARCHAR(255),
    max_participants INT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

#### C. Status Server Actions:
- `createAnnouncementAction()` [SUDAH ADA di Kode]
- `listMyDeadlinesAction()` [SUDAH ADA di Kode]
- `listSubmissionsAction()` [SUDAH ADA di Kode]
- `uploadMaterialAction()` [BARU DIBUAT di Fase 3]
- `submitAssignmentAction()` [BARU DIBUAT di Fase 3]
- `postDiscussionReplyAction()` [BARU DIBUAT di Fase 3]

---

## 3. Strategi Keamanan Migrasi (Staging, Rollback, DoD & Mitigasi Risiko)

### A. Strategi Lingkungan Staging Terpisah (*Isolated Staging Strategy*)
1. Seluruh migrasi database Fase 3 **WAJIB** diterapkan dan diuji secara penuh di proyek **Supabase STAGING terpisah** (`staging.supabase.co`) terlebih dahulu.
2. Gateway PostgREST nyata, JWT parsing bawaan Supabase, dan hak akses default PostgreSQL (`anon`, `authenticated`, `service_role`) **WAJIB** divalidasi di Staging sebelum mendekati produksi.
3. Database produksi **TIDAK BOLEH** disentuh sebelum seluruh uji lolos di Staging.
4. **Kebijakan Akun Seed**: Script seeding akun demo/dummy **HANYA DIGUNAKAN DI STAGING** untuk kebutuhan pengujian fungsional QA. **DILARANG KERAS** menyuntikkan data seed ke database produksi.

### B. Strategi Rollback (*Rollback Strategy*)
1. **Transaksional DDL**: Setiap berkas migrasi dibungkus dalam blok `BEGIN ... COMMIT` PostgreSQL sehingga kegagalan sintaks atau foreign key otomatis membatalkan seluruh perubahan (*automatic rollback*).
2. **Skrip Rollback Pendamping**: Untuk setiap berkas migrasi baru `202610120000XX_nama.sql`, wajib disiapkan berkas `202610120000XX_nama_rollback.sql` yang berisi perintah `DROP TABLE IF EXISTS`, `DROP FUNCTION IF EXISTS`, atau `ALTER TABLE ... DROP COLUMN IF EXISTS` secara terbalik.
3. **Pencadangan Sebelum Eksekusi (*Pre-Migration Dump*)**:
   ```bash
   supabase db dump --db-url "$STAGING_DATABASE_URL" -f "backup_staging_pre_phase3.sql"
   ```

### C. Definisi Selesai (*Definition of Done - DoD*) Per Domain
Sebuah domain dinyatakan selesai di Fase 3 hanya jika memenuhi 4 pilar:
1. **Verifikasi Database Nyata**: Data hasil mutasi tersimpan di PostgreSQL Supabase Staging dan terbaca kembali via query REST/RPC.
2. **Uji Negatif Berpasangan (*Negative Security with Positive Controls*)**: Setiap skenario pelanggaran otorisasi (spoofing peran, prodi silang, submit saat impersonasi) menghasilkan kode error eksplisit (403/Forbidden) dan dipasangkan dengan kontrol positif akun yang sah.
3. **Ketahanan Daur Ulang Server (*Restart Resilience*)**: Nilai dan data tetap utuh saat instance server Next.js di-restart, membuktikan hilangnya ketergantungan pada variabel in-memory Node.js.
4. **Zero Sukses Palsu**: Tombol antarmuka hanya aktif jika fungsi backend dan tabel DB terkait telah berfungsi nyata.

---

## 4. Daftar Keputusan yang Perlu Diambil Pengguna

Sebelum pengerjaan kode atau migrasi Fase 3 dimulai, Anda perlu menetapkan pilihan pada poin-poin keputusan arsitektural berikut:

| No | Topik Keputusan | Pilihan Opsi Solusi | Rekomendasi Arsitektur | Keputusan Anda |
|---|---|---|---|---|
| **K1** | **Skema Kolom Pengampu Kelas (`classes`)** | **A**: Menambahkan kolom `lecturer_id UUID REFERENCES profiles(id)` langsung ke tabel `classes`.<br>**B**: Menggunakan tabel perantara `class_lecturers` jika 1 kelas dapat diampu tim dosen (*team teaching*). | **Opsi A** (Simpel, konsisten dengan UI yang menampilkan dosen utama, sementara tim pengajar/asisten dapat memakai `class_assistants`). | *Menunggu Keputusan Pengguna* |
| **K2** | **Penyimpanan Berkas Lampiran (Tugas & Surat Sakit)** | **A**: Supabase Storage Bucket bawaan dengan Signed URL privat 15 menit.<br>**B**: S3-compatible cloud storage eksternal (Cloudflare R2 / AWS S3). | **Opsi A (Supabase Storage)** agar autentikasi RLS bucket terintegrasi langsung dengan Supabase Auth. | *Menunggu Keputusan Pengguna* |
| **K3** | **Alur Submit Jawaban Ujian CBT Berbeban Tinggi** | **A**: Setiap jawaban butir soal langsung `INSERT` ke DB per detik (risiko connection spike).<br>**B**: Single-payload submission: Jawaban disimpan lokal di browser (`localStorage`), dikirim sekaligus saat tombol "Kumpulkan Ujian" ditekan. | **Opsi B (Single-Payload)** untuk menjaga stabilitas PostgreSQL pada tier database standar. | *Menunggu Keputusan Pengguna* |
| **K4** | **Penyelarasan Nama Semester vs Tahun Ajaran** | **A**: Tetap memakai tabel `semesters` yang ada di snapshot (kolom: `code`, `name`, `start_date`, `end_date`, `is_active`).<br>**B**: Membuat tabel baru `academic_years` terpisah dari `semesters`. | **Opsi A (Gunakan semesters yang sudah ada)** untuk menghindari tabel berlebih yang membingungkan. | *Menunggu Keputusan Pengguna* |
| **K5** | **Penyediaan Proyek Supabase Staging** | **A**: Pengguna menyediakan URL & Service Key proyek Supabase Staging terpisah untuk pengujian nyata.<br>**B**: Pengujian tetap menggunakan database lokal sekali pakai (PGlite/Docker) sebelum staging disediakan. | **Opsi A** mutlak diperlukan sebelum deployment produksi. | *Menunggu Keputusan Pengguna* |

---

> **PERNYATAAN PENGHENTIAN (STOP RULE)**:  
> Perencanaan Fase 3 telah diselaraskan penuh dengan `docs/schema-snapshot.md`. Sesuai instruksi ketat pengguna, asisten AI **BERHENTI DI SINI** dan **TIDAK MENJALANKAN MIGRASI** serta **TIDAK MENULIS KODE FASE 3** sampai dokumen rencana ini disetujui.
