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
- `auth.users`: Managed oleh Supabase Auth (`id` uuid, `email` text).
- `public.profiles`: `id` uuid (PK -> auth.users), `full_name` text, `email` text (UNIQUE), `status` user_status (ACTIVE, PENDING, LOCKED, SUSPENDED, DEACTIVATED), `must_change_password` boolean, `locked_until` timestamp with time zone, `last_login_at` timestamp with time zone, `preferred_locale` text, `timezone` text, `created_at` timestamp with time zone, `updated_at` timestamp with time zone.
- `public.roles`: `id` uuid, `code` varchar (UNIQUE), `name` text, `description` text, `created_at` timestamp with time zone.
- `public.user_roles`: `id` uuid, `user_id` uuid (FK profiles CASCADE), `role_id` uuid (FK roles RESTRICT), `scope_type` scope_type (GLOBAL, PROGRAM, CLASS), `scope_id` uuid, `valid_from` timestamp with time zone, `valid_until` timestamp with time zone, `granted_by` uuid (FK profiles SET NULL), `status` user_role_status (ACTIVE, REVOKED, EXPIRED), `created_at` timestamp with time zone, `updated_at` timestamp with time zone.
- `public.user_identifiers`: `id` uuid, `user_id` uuid (FK profiles CASCADE), `type` identifier_type (NIM, NIDN, NIP, EMAIL, USERNAME), `value` varchar, `is_primary` boolean, `created_at` timestamp with time zone, `updated_at` timestamp with time zone.
- `public.user_devices`: `id` uuid, `user_id` uuid (FK profiles CASCADE), `device_id_hash` text (UNIQUE), `label` text, `first_seen_at` timestamp with time zone, `last_seen_at` timestamp with time zone, `last_ip_masked` text, `last_country` text, `last_city` text, `last_session_id` uuid, `trusted` boolean, `revoked_at` timestamp with time zone, `created_at` timestamp with time zone, `updated_at` timestamp with time zone.
- `public.login_events`: `id` uuid, `user_id` uuid (FK profiles CASCADE), `device_id` uuid, `event_type` event_type, `is_new_device` boolean, `risk_level` risk_level (LOW, MEDIUM, HIGH), `ip_masked` text, `country` text, `city` text, `notified_at` timestamp with time zone, `created_at` timestamp with time zone.
- `public.audit_logs`: `id` uuid, `actor_user_id` uuid (FK profiles RESTRICT), `actor_role` varchar, `action` varchar, `entity_type` varchar, `entity_id` uuid, `scope_type` varchar, `scope_id` uuid, `before_json` jsonb, `after_json` jsonb, `ip_address` inet, `user_agent` text, `request_id` text, `created_at` timestamp with time zone, `on_behalf_of` uuid (FK profiles RESTRICT), `description` text, `details` jsonb.
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
- `public.programs` (Bukan `study_programs`): `id` uuid, `code` text (UNIQUE), `name` text, `is_active` boolean, `created_at` timestamp with time zone, `updated_at` timestamp with time zone.
- `public.semesters` (Bukan `academic_years`): `id` uuid, `label` text (UNIQUE), `is_active` boolean, `created_at` timestamp with time zone, `updated_at` timestamp with time zone.
- `public.courses`: `id` uuid, `program_id` uuid (FK programs RESTRICT), `code` text (UNIQUE), `name` text, `credits` smallint, `is_active` boolean, `created_at` timestamp with time zone, `updated_at` timestamp with time zone.
- `public.classes`: `id` uuid, `title` varchar, `section` varchar, `join_code` varchar (UNIQUE), `capacity` smallint, `status` class_status (DRAFT, OPEN, ACTIVE, CLOSED, ARCHIVED), `created_by` uuid (FK profiles RESTRICT), `created_at` timestamp with time zone, `updated_at` timestamp with time zone, `deleted_at` timestamp with time zone, `course_id` uuid (FK courses RESTRICT), `semester_id` uuid (FK semesters RESTRICT), `lecturer_id` uuid (FK profiles RESTRICT).
- `public.enrollments`: `id` uuid, `class_id` uuid (FK classes RESTRICT), `student_id` uuid (FK profiles RESTRICT), `status` enrollment_status (ACTIVE, DROPPED, COMPLETED, REMOVED), `enrolled_at` timestamp with time zone, `dropped_at` timestamp with time zone.
- `public.class_assistants` (Bukan `teaching_assistants`): `id` uuid, `class_id` uuid (FK classes RESTRICT), `user_id` uuid (FK profiles RESTRICT), `permission` varchar, `granted_by` uuid (FK profiles RESTRICT), `created_at` timestamp with time zone.

#### B. TABEL BARU (Fase 3):
- Ruang Perkuliahan (`rooms`):
  `CREATE TABLE IF NOT EXISTS public.rooms ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(100) NOT NULL, building VARCHAR(100), capacity INT, latitude NUMERIC(10,7), longitude NUMERIC(10,7), radius_meters INT DEFAULT 50, created_at TIMESTAMPTZ DEFAULT now() );`

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
- `public.grades`: `id` uuid, `class_id` uuid (FK classes RESTRICT — SUDAH ADA di snapshot), `student_id` uuid (FK profiles RESTRICT), `item_type` text, `item_id` uuid, `score` numeric, `max_score` numeric, `comment` text, `status` grade_status (DRAFT, FINAL), `graded_by` uuid (FK profiles RESTRICT), `finalized_by` uuid (FK profiles RESTRICT), `finalized_at` timestamp with time zone, `is_visible_to_student` boolean, `created_at` timestamp with time zone, `updated_at` timestamp with time zone.
- `public.grade_history`: `id` uuid, `grade_id` uuid (FK grades CASCADE), `class_id` uuid (FK classes RESTRICT — SUDAH ADA di snapshot), `old_score` numeric, `new_score` numeric, `old_status` grade_status, `new_status` grade_status, `changed_by` uuid (FK profiles RESTRICT), `reason` text, `changed_at` timestamp with time zone.

#### B. TABEL / KOLOM BARU (Fase 3):
- *Catatan Skema*: Kolom referensi kelas `class_id` pada `public.grades` dan `public.grade_history` telah terverifikasi **SUDAH ADA** di snapshot skema (migrasi 1..16), sehingga perintah penambahan kolom tidak diperlukan.
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

#### B. TABEL BARU & ARSITEKTUR KEAMANAN EVALUASI (Fase 3):
- **1. Bank Soal, Opsi & Pemisahan Kunci Jawaban (Perlindungan Kebocoran Kunci)**:
  - Opsi jawaban untuk mahasiswa (`quiz_options`) **TIDAK MEMUAT** penanda kunci benar `is_correct`.
  - Kunci jawaban dipisahkan ke tabel terisolasi dengan RLS ketat:
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
    order_index INT NOT NULL DEFAULT 0
  );

  -- KUNCI JAWABAN TERPISAH (RLS HANYA DOSEN PENGAMPU / PENGAWAS):
  -- Role Mahasiswa DILARANG membaca baris tabel ini! Penilaian wajib melalui RPC SECURITY DEFINER.
  CREATE TABLE IF NOT EXISTS public.quiz_question_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    correct_option_id UUID NOT NULL REFERENCES public.quiz_options(id) ON DELETE CASCADE,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_question_key UNIQUE (question_id)
  );
  ALTER TABLE public.quiz_question_keys ENABLE ROW LEVEL SECURITY;
  -- Kebijakan RLS: SELECT hanya untuk dosen pengampu kelas terkait / SUPER_ADMIN.
  ```

- **2. Sesi Ujian, Batas Waktu Server, & Partial Index Satu Attempt Aktif**:
  ```sql
  CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deadline_at TIMESTAMPTZ NOT NULL, -- SERVER ENFORCED: dihitung DB = started_at + (duration_minutes * interval '1 minute')
    finished_at TIMESTAMPTZ,
    total_score NUMERIC(5,2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT', 'DISQUALIFIED'
    created_at TIMESTAMPTZ DEFAULT now()
  );

  -- INDEKS UNIK PARSIAL: HANYA BOLEH ADA 1 ATTEMPT BERSTATUS 'IN_PROGRESS' PER MAHASISWA-UJIAN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_active_attempt_per_student
    ON public.exam_attempts (quiz_id, student_id)
    WHERE status = 'IN_PROGRESS';
  ```

- **3. Draf Jawaban Berkala & Pengumpulan Final Idempoten**:
  ```sql
  CREATE TABLE IF NOT EXISTS public.exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE RESTRICT,
    selected_option_id UUID REFERENCES public.quiz_options(id) ON DELETE SET NULL,
    essay_text TEXT,
    is_draft BOOLEAN NOT NULL DEFAULT true, -- Autosave berkala ke server
    last_saved_at TIMESTAMPTZ DEFAULT now(),
    score_earned NUMERIC(5,2) DEFAULT 0.00,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    graded_at TIMESTAMPTZ,
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
  );
  -- RPC submit_exam_attempt() bersifat IDEMPOTEN:
  -- Menilai otomatis pilihan ganda lewat quiz_question_keys (SECURITY DEFINER),
  -- mengunci status 'SUBMITTED', dan jika dipanggil berulang mengembalikan hasil tanpa menduplikasi data.
  -- Submit setelah deadline_at otomatis ditolak dan dialihkan ke status 'TIMED_OUT'.
  ```

- **4. Pemisahan Telemetri Mahasiswa vs Intervensi Dosen Pengawas**:
  ```sql
  -- Tabel A: Telemetri Integritas Klien Mahasiswa (Logging Event Browser)
  CREATE TABLE IF NOT EXISTS public.exam_telemetry_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    event_type VARCHAR(100) NOT NULL, -- 'TAB_SWITCH', 'WINDOW_BLUR', 'EXIT_FULLSCREEN', 'DEVTOOLS_OPEN', 'IP_CHANGED'
    client_timestamp TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  -- Tabel B: Intervensi & Tindakan Pengawas Dosen (Tindakan Administratif Proctor)
  CREATE TABLE IF NOT EXISTS public.exam_proctor_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    proctor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    action_type VARCHAR(50) NOT NULL, -- 'VERBAL_WARNING', 'FORCE_PAUSE', 'TIME_REDUCTION', 'DISQUALIFY'
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

#### C. Status Server Actions:
- `submitQuizAttemptAction()` [SUDAH ADA di Kode — Teruji Guard Impersonasi A3c & Idempoten]
- `createQuizAction()` [BARU DIBUAT di Fase 3]
- `publishQuizAction()` [BARU DIBUAT di Fase 3]
- `startQuizAttemptAction()` [BARU DIBUAT di Fase 3 — Server Menetapkan deadline_at]
- `saveAnswerDraftAction()` [BARU DIBUAT di Fase 3 — Simpan Draf Berkala ke Server]
- `interveneStudentAction()` [BARU DIBUAT di Fase 3 — Khusus Dosen/Pengawas]
- `interveneStudentAction()` [BARU DIBUAT di Fase 3]

---

### Domain 6: Sengketa Nilai Ujian & Putusan Perubahan Nilai Final

#### A. SUDAH ADA di Skema (Snapshot Migrasi 1..16):
- `public.grade_change_requests`: `id` uuid, `grade_id` uuid (FK grades RESTRICT), `class_id` uuid (FK classes RESTRICT), `requested_by` uuid (FK profiles RESTRICT), `class_title` text, `assignment_title` text, `student_name` text, `old_score` numeric, `proposed_score` numeric, `reason` text, `status` change_request_status (PENDING, APPROVED, REJECTED, EXECUTED), `reviewed_by` uuid (FK profiles RESTRICT), `review_note` text, `reviewed_at` timestamp with time zone, `created_at` timestamp with time zone, `executed_by` uuid (FK profiles RESTRICT), `executed_at` timestamp with time zone, `execution_note` text.
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
- `public.materials`: `id` uuid, `class_id` uuid (FK classes RESTRICT), `title` text, `body_md` text, `status` material_status (DRAFT, PUBLISHED, HIDDEN), `created_by` uuid (FK profiles RESTRICT), `created_at` timestamp with time zone, `updated_at` timestamp with time zone.
- `public.assignments`: `id` uuid, `class_id` uuid (FK classes RESTRICT), `title` text, `description` text, `due_at` timestamp with time zone, `close_at` timestamp with time zone, `max_score` numeric, `status` assignment_status (DRAFT, PUBLISHED, CLOSED), `created_by` uuid (FK profiles RESTRICT), `created_at` timestamp with time zone, `updated_at` timestamp with time zone.
- `public.submissions`: `id` uuid, `assignment_id` uuid (FK assignments RESTRICT), `student_id` uuid (FK profiles RESTRICT), `attempt_no` smallint, `status` submission_status (DRAFT, SUBMITTED, RETURNED, REVIEWED, GRADED), `text_body` text, `submitted_at` timestamp with time zone, `is_late` boolean.
- `public.notifications`: `id` uuid, `user_id` uuid (FK profiles CASCADE), `type` text, `title` text, `body` text, `entity_type` text, `entity_id` uuid, `class_id` uuid (FK classes CASCADE), `read_at` timestamp with time zone, `created_at` timestamp with time zone.
- `public.discussions`: `id` uuid, `class_id` uuid (FK classes RESTRICT), `author_id` uuid (FK profiles RESTRICT), `author_name` text, `title` text, `body` text, `is_pinned` boolean, `is_locked` boolean, `created_at` timestamp with time zone.
- `public.discussion_replies`: `id` uuid, `discussion_id` uuid (FK discussions RESTRICT), `class_id` uuid (FK classes RESTRICT), `author_id` uuid (FK profiles RESTRICT), `author_name` text, `body` text, `is_hidden` boolean, `hidden_by` uuid (FK profiles SET NULL), `created_at` timestamp with time zone.
- `public.announcements`: `id` uuid, `class_id` uuid (FK classes RESTRICT), `author_id` uuid (FK profiles RESTRICT), `title` text, `body` text, `created_at` timestamp with time zone.
- `public.materi_progres`: `id` uuid, `materi_id` uuid (FK materials CASCADE), `mahasiswa_id` uuid (FK profiles CASCADE), `selesai` boolean, `selesai_pada` timestamp with time zone, `terakhir_dibuka` timestamp with time zone, `created_at` timestamp with time zone, `updated_at` timestamp with time zone.

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

## 4. Keputusan Arsitektural Pengguna (Recorded Decisions)

Keputusan arsitektur persistensi Fase 3 telah ditetapkan oleh Pengguna:

| No | Topik Keputusan | Pilihan Opsi Solusi | Rekomendasi Arsitektur | Keputusan Resmi Pengguna |
|---|---|---|---|---|
| **K2** | **Penyimpanan Berkas Lampiran (Tugas & Surat Sakit)** | **A**: Supabase Storage Bucket bawaan dengan Signed URL privat 15 menit.<br>**B**: S3-compatible cloud storage eksternal (Cloudflare R2 / AWS S3). | **Opsi A (Supabase Storage)** agar autentikasi RLS bucket terintegrasi langsung dengan Supabase Auth. | **OPSI A DITERIMA**: Supabase Storage Bucket privat + Signed URL masa berlaku 15 menit. |
| **K3** | **Alur Submit Jawaban Ujian CBT Berbeban Tinggi** | **A**: Setiap jawaban butir soal langsung `INSERT` ke DB per detik.<br>**B**: Single-payload submission dengan draf berkala ke server (autosave) dan submit final idempoten. | **Opsi B (Single-Payload + Draf Berkala)** untuk menjaga integritas data dan kestabilan DB. | **OPSI B DITERIMA**: Draf berkala ke server (autosave) + single-payload final submit yang idempoten. |
| **K4** | **Penyelarasan Nama Semester vs Tahun Ajaran** | **A**: Tetap memakai tabel `semesters` yang ada di snapshot (kolom: `label`, `is_active`, `created_at`, `updated_at`).<br>**B**: Membuat tabel baru `academic_years`. | **Opsi A (Gunakan semesters yang sudah ada)** untuk menghindari tabel ganda. | **OPSI A DITERIMA**: Tetap memakai tabel `semesters` yang ada di snapshot. |
| **K5** | **Penyediaan Proyek Supabase Staging** | **A**: Pengguna menyediakan URL & Service Key proyek Supabase Staging terpisah untuk pengujian nyata.<br>**B**: Pengujian lokal sekali pakai. | **Opsi A** untuk verifikasi gateway PostgREST nyata. | **OPSI A DITERIMA**: Staging Supabase terpisah via kredensial aman di `.env.local` (diabaikan git). |

*(Catatan: K1 dihapus dari daftar keputusan karena kolom `classes.lecturer_id` telah terverifikasi SUDAH ADA di snapshot skema migrasi 1..16).*
