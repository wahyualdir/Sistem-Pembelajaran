-- SIAJAR Migration 20: Phase 3B - 3F Complete Database Persistence
-- Covers Domain 3 (Gradebook & Final Grades), Domain 4 (Attendance & Leave Permits),
-- Domain 5 (CBT Quizzes, Question Keys & Proctoring), Domain 6 (Exam Disputes),
-- and Domain 7 (Library, Campus Events, Certificates & Portfolios).

BEGIN;

-- ============================================================================
-- BAGIAN 1: DOMAIN 3 — EVALUASI AKADEMIK, KOMPONEN NILAI & GRADEBOOK
-- ============================================================================

-- 1.1 Komponen Bobot Penilaian Kelas (Tugas, Kuis, UTS, UAS, Praktikum)
CREATE TABLE IF NOT EXISTS public.grade_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    weight_percent NUMERIC(5,2) NOT NULL CHECK (weight_percent > 0 AND weight_percent <= 100),
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_grade_component_class_name UNIQUE (class_id, name)
);

ALTER TABLE public.grade_components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS grade_components_select ON public.grade_components;
CREATE POLICY grade_components_select ON public.grade_components
FOR SELECT TO authenticated
USING (
    public.is_enrolled(class_id)
    OR public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
);

DROP POLICY IF EXISTS grade_components_write ON public.grade_components;
CREATE POLICY grade_components_write ON public.grade_components
FOR ALL TO authenticated
USING (public.is_class_staff(class_id) OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (public.is_class_staff(class_id) OR public.has_global_role('ACADEMIC_STAFF'));

-- 1.2 Master Butir Penilaian Manual / Luring (UTS, UAS, Praktikum, Partisipasi)
CREATE TABLE IF NOT EXISTS public.grade_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    component_id UUID REFERENCES public.grade_components(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    max_score NUMERIC(6,2) NOT NULL DEFAULT 100.00 CHECK (max_score > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS grade_items_select ON public.grade_items;
CREATE POLICY grade_items_select ON public.grade_items
FOR SELECT TO authenticated
USING (
    public.is_enrolled(class_id)
    OR public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
);

DROP POLICY IF EXISTS grade_items_write ON public.grade_items;
CREATE POLICY grade_items_write ON public.grade_items
FOR ALL TO authenticated
USING (public.is_class_staff(class_id) OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (public.is_class_staff(class_id) OR public.has_global_role('ACADEMIC_STAFF'));

-- 1.3 Dispensasi / Pengecualian Butir Penilaian (Separation of Duties: requested_by <> approved_by)
CREATE TABLE IF NOT EXISTS public.grade_exemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    item_id UUID NULL,
    component_id UUID NULL REFERENCES public.grade_components(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    approved_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    approved_at TIMESTAMPTZ NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_exemption_target CHECK (item_id IS NOT NULL OR component_id IS NOT NULL),
    CONSTRAINT ck_exemption_sod CHECK (
        (status = 'PENDING' AND approved_by IS NULL) OR
        (status IN ('APPROVED', 'REJECTED') AND approved_by IS NOT NULL AND approved_by <> requested_by)
    )
);

ALTER TABLE public.grade_exemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS grade_exemptions_select ON public.grade_exemptions;
CREATE POLICY grade_exemptions_select ON public.grade_exemptions
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
);

DROP POLICY IF EXISTS grade_exemptions_insert ON public.grade_exemptions;
CREATE POLICY grade_exemptions_insert ON public.grade_exemptions
FOR INSERT TO authenticated
WITH CHECK (
    public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
);

DROP POLICY IF EXISTS grade_exemptions_update ON public.grade_exemptions;
CREATE POLICY grade_exemptions_update ON public.grade_exemptions
FOR UPDATE TO authenticated
USING (
    public.has_active_role('PROGRAM_COORDINATOR')
    OR public.has_global_role('ACADEMIC_STAFF')
)
WITH CHECK (
    public.has_active_role('PROGRAM_COORDINATOR')
    OR public.has_global_role('ACADEMIC_STAFF')
);

-- 1.4 Penguncian Buku Nilai Kelas (Single Source of Truth Lock)
CREATE TABLE IF NOT EXISTS public.gradebook_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    is_locked BOOLEAN NOT NULL DEFAULT true,
    locked_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NULL,
    reason TEXT,
    CONSTRAINT uq_gradebook_class UNIQUE (class_id)
);

ALTER TABLE public.gradebook_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gradebook_locks_select ON public.gradebook_locks;
CREATE POLICY gradebook_locks_select ON public.gradebook_locks
FOR SELECT TO authenticated
USING (
    public.is_enrolled(class_id)
    OR public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
);

DROP POLICY IF EXISTS gradebook_locks_write ON public.gradebook_locks;
CREATE POLICY gradebook_locks_write ON public.gradebook_locks
FOR ALL TO authenticated
USING (
    public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
)
WITH CHECK (
    public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
);

-- 1.5 Permohonan Buka Kunci Buku Nilai (3-Party Separation of Duties)
CREATE TABLE IF NOT EXISTS public.gradebook_unlock_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED')),
    approved_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    approved_at TIMESTAMPTZ NULL,
    executed_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    executed_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gradebook_unlock_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gradebook_unlock_requests_select ON public.gradebook_unlock_requests;
CREATE POLICY gradebook_unlock_requests_select ON public.gradebook_unlock_requests
FOR SELECT TO authenticated
USING (
    public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
);

DROP POLICY IF EXISTS gradebook_unlock_requests_write ON public.gradebook_unlock_requests;
CREATE POLICY gradebook_unlock_requests_write ON public.gradebook_unlock_requests
FOR ALL TO authenticated
USING (
    public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
)
WITH CHECK (
    public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
);

-- 1.6 Skala Konversi Huruf Mutu Dinamis & Nilai Akhir Kelas
CREATE TABLE IF NOT EXISTS public.grade_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_scales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS grade_scales_select ON public.grade_scales;
CREATE POLICY grade_scales_select ON public.grade_scales
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS grade_scales_write ON public.grade_scales;
CREATE POLICY grade_scales_write ON public.grade_scales
FOR ALL TO authenticated
USING (public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('PROGRAM_COORDINATOR'))
WITH CHECK (public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('PROGRAM_COORDINATOR'));

CREATE TABLE IF NOT EXISTS public.grade_scale_bands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scale_id UUID NOT NULL REFERENCES public.grade_scales(id) ON DELETE CASCADE,
    letter VARCHAR(5) NOT NULL,
    grade_point NUMERIC(3,2) NOT NULL CHECK (grade_point >= 0.00 AND grade_point <= 4.00),
    min_score NUMERIC(5,2) NOT NULL CHECK (min_score >= 0.00 AND min_score <= 100.00),
    max_score NUMERIC(5,2) NOT NULL CHECK (max_score >= min_score AND max_score <= 100.00),
    CONSTRAINT uq_scale_letter UNIQUE (scale_id, letter)
);

ALTER TABLE public.grade_scale_bands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS grade_scale_bands_select ON public.grade_scale_bands;
CREATE POLICY grade_scale_bands_select ON public.grade_scale_bands
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS grade_scale_bands_write ON public.grade_scale_bands;
CREATE POLICY grade_scale_bands_write ON public.grade_scale_bands
FOR ALL TO authenticated
USING (public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('PROGRAM_COORDINATOR'))
WITH CHECK (public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('PROGRAM_COORDINATOR'));

CREATE TABLE IF NOT EXISTS public.class_final_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    numeric_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (numeric_score >= 0.00 AND numeric_score <= 100.00),
    letter_grade VARCHAR(5) NOT NULL DEFAULT 'E',
    grade_point NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'FINAL')),
    published_at TIMESTAMPTZ NULL,
    calculated_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_class_student_final_grade UNIQUE (class_id, student_id),
    CONSTRAINT ck_final_grade_published CHECK (
        (status = 'DRAFT' AND published_at IS NULL) OR
        (status = 'FINAL' AND published_at IS NOT NULL)
    )
);

ALTER TABLE public.class_final_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_final_grades_select ON public.class_final_grades;
CREATE POLICY class_final_grades_select ON public.class_final_grades
FOR SELECT TO authenticated
USING (
    (student_id = (SELECT auth.uid()) AND status = 'FINAL')
    OR public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
);

DROP POLICY IF EXISTS class_final_grades_write ON public.class_final_grades;
CREATE POLICY class_final_grades_write ON public.class_final_grades
FOR ALL TO authenticated
USING (public.is_class_staff(class_id) OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (public.is_class_staff(class_id) OR public.has_global_role('ACADEMIC_STAFF'));


-- ============================================================================
-- BAGIAN 2: DOMAIN 4 — PRESENSI PERKULIAHAN, QR DINAMIS, GPS & IZIN SAKIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    session_number INT NOT NULL CHECK (session_number >= 1 AND session_number <= 16),
    title VARCHAR(200) NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time VARCHAR(10) NOT NULL DEFAULT '08:00',
    end_time VARCHAR(10) NOT NULL DEFAULT '10:30',
    code VARCHAR(20) NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT true,
    methods JSONB NOT NULL DEFAULT '["QR_DYNAMIC", "LOCATION_GPS"]'::jsonb,
    preset VARCHAR(30) NOT NULL DEFAULT 'TATAP_MUKA',
    location_lat NUMERIC(10,7),
    location_lng NUMERIC(10,7),
    radius_meters INT NOT NULL DEFAULT 50,
    location_name VARCHAR(150),
    late_threshold_minutes INT NOT NULL DEFAULT 15,
    qr_token_secret VARCHAR(100),
    qr_refreshed_at TIMESTAMPTZ,
    room_id UUID REFERENCES public.rooms(id) ON DELETE RESTRICT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_session_class_number UNIQUE (class_id, session_number)
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class ON public.attendance_sessions(class_id);

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_sessions_select ON public.attendance_sessions;
CREATE POLICY attendance_sessions_select ON public.attendance_sessions
FOR SELECT TO authenticated
USING (
    public.is_enrolled(class_id)
    OR public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
);

DROP POLICY IF EXISTS attendance_sessions_write ON public.attendance_sessions;
CREATE POLICY attendance_sessions_write ON public.attendance_sessions
FOR ALL TO authenticated
USING (public.is_class_staff(class_id) OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (public.is_class_staff(class_id) OR public.has_global_role('ACADEMIC_STAFF'));

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    student_name VARCHAR(150),
    check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    method VARCHAR(50) NOT NULL DEFAULT 'QR_DYNAMIC',
    status VARCHAR(20) NOT NULL DEFAULT 'HADIR' CHECK (status IN ('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA')),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    distance_meters INT,
    device_id VARCHAR(150),
    is_late BOOLEAN NOT NULL DEFAULT false,
    is_flagged_anomaly BOOLEAN NOT NULL DEFAULT false,
    anomaly_reason TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    notes TEXT,
    CONSTRAINT uq_session_student UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records(student_id);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_records_select ON public.attendance_records;
CREATE POLICY attendance_records_select ON public.attendance_records
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.attendance_sessions s
        WHERE s.id = public.attendance_records.session_id
          AND (public.is_class_staff(s.class_id) OR public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('PROGRAM_COORDINATOR'))
    )
);

DROP POLICY IF EXISTS attendance_records_insert ON public.attendance_records;
CREATE POLICY attendance_records_insert ON public.attendance_records
FOR INSERT TO authenticated
WITH CHECK (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.attendance_sessions s
        WHERE s.id = public.attendance_records.session_id
          AND (public.is_class_staff(s.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

DROP POLICY IF EXISTS attendance_records_update ON public.attendance_records;
CREATE POLICY attendance_records_update ON public.attendance_records
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.attendance_sessions s
        WHERE s.id = public.attendance_records.session_id
          AND (public.is_class_staff(s.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.attendance_sessions s
        WHERE s.id = public.attendance_records.session_id
          AND (public.is_class_staff(s.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

CREATE TABLE IF NOT EXISTS public.leave_permits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    student_name VARCHAR(150),
    class_id UUID REFERENCES public.classes(id) ON DELETE RESTRICT,
    course_title VARCHAR(200) NOT NULL,
    session_number INT NOT NULL DEFAULT 1,
    permit_type VARCHAR(50) NOT NULL DEFAULT 'SAKIT' CHECK (permit_type IN ('SAKIT', 'IZIN')),
    permit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'MENUNGGU VERIFIKASI' CHECK (status IN ('MENUNGGU VERIFIKASI', 'DISETUJUI', 'DITOLAK')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reviewed_at TIMESTAMPTZ,
    review_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leave_permits_student ON public.leave_permits(student_id);
CREATE INDEX IF NOT EXISTS idx_leave_permits_class ON public.leave_permits(class_id);

ALTER TABLE public.leave_permits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leave_permits_select ON public.leave_permits;
CREATE POLICY leave_permits_select ON public.leave_permits
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR (class_id IS NOT NULL AND public.is_class_staff(class_id))
    OR public.has_active_role('LECTURER')
    OR public.has_global_role('ACADEMIC_STAFF')
);

DROP POLICY IF EXISTS leave_permits_insert ON public.leave_permits;
CREATE POLICY leave_permits_insert ON public.leave_permits
FOR INSERT TO authenticated
WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS leave_permits_update ON public.leave_permits;
CREATE POLICY leave_permits_update ON public.leave_permits
FOR UPDATE TO authenticated
USING (
    (class_id IS NOT NULL AND public.is_class_staff(class_id))
    OR public.has_active_role('LECTURER')
    OR public.has_global_role('ACADEMIC_STAFF')
)
WITH CHECK (
    (class_id IS NOT NULL AND public.is_class_staff(class_id))
    OR public.has_active_role('LECTURER')
    OR public.has_global_role('ACADEMIC_STAFF')
);


-- ============================================================================
-- BAGIAN 3: DOMAIN 5 — KUIS, UJIAN CBT, KUNCI JAWABAN & TELEMETRI PROCTORING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    exam_type VARCHAR(30) NOT NULL DEFAULT 'KUIS' CHECK (exam_type IN ('KUIS', 'UTS', 'UAS', 'LATIHAN', 'REMEDIAL')),
    duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    max_attempts INT NOT NULL DEFAULT 1,
    shuffle_questions BOOLEAN NOT NULL DEFAULT true,
    shuffle_options BOOLEAN NOT NULL DEFAULT true,
    is_published BOOLEAN NOT NULL DEFAULT false,
    strict_proctoring BOOLEAN NOT NULL DEFAULT false,
    proctoring_level VARCHAR(20) NOT NULL DEFAULT 'STANDARD' CHECK (proctoring_level IN ('OFF', 'LIGHT', 'STANDARD', 'STRICT')),
    max_violations INT NOT NULL DEFAULT 5,
    require_fullscreen BOOLEAN NOT NULL DEFAULT true,
    block_copy_paste BOOLEAN NOT NULL DEFAULT true,
    require_attendance BOOLEAN NOT NULL DEFAULT false,
    passcode VARCHAR(30),
    kkm INT NOT NULL DEFAULT 70,
    result_display VARCHAR(30) NOT NULL DEFAULT 'IMMEDIATE',
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED')),
    total_points NUMERIC(6,2) NOT NULL DEFAULT 100.00,
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_class ON public.quizzes(class_id);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quizzes_select ON public.quizzes;
CREATE POLICY quizzes_select ON public.quizzes
FOR SELECT TO authenticated
USING (
    public.is_enrolled(class_id)
    OR public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
);

DROP POLICY IF EXISTS quizzes_write ON public.quizzes;
CREATE POLICY quizzes_write ON public.quizzes
FOR ALL TO authenticated
USING (public.is_class_staff(class_id) OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (public.is_class_staff(class_id) OR public.has_global_role('ACADEMIC_STAFF'));

CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    points NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    order_index INT NOT NULL DEFAULT 0,
    topic_tag VARCHAR(100),
    cpl_tag VARCHAR(100),
    difficulty VARCHAR(20) DEFAULT 'MEDIUM',
    rubric TEXT,
    starter_code TEXT,
    programming_language VARCHAR(30),
    explanation TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quiz_questions_select ON public.quiz_questions;
CREATE POLICY quiz_questions_select ON public.quiz_questions
FOR SELECT TO authenticated
USING (
    quiz_id IS NULL
    OR EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.quiz_questions.quiz_id
          AND (public.is_enrolled(q.class_id) OR public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

DROP POLICY IF EXISTS quiz_questions_write ON public.quiz_questions;
CREATE POLICY quiz_questions_write ON public.quiz_questions
FOR ALL TO authenticated
USING (
    public.has_active_role('LECTURER')
    OR public.has_global_role('ACADEMIC_STAFF')
)
WITH CHECK (
    public.has_active_role('LECTURER')
    OR public.has_global_role('ACADEMIC_STAFF')
);

CREATE TABLE IF NOT EXISTS public.quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON public.quiz_options(question_id);

ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quiz_options_select ON public.quiz_options;
CREATE POLICY quiz_options_select ON public.quiz_options
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS quiz_options_write ON public.quiz_options;
CREATE POLICY quiz_options_write ON public.quiz_options
FOR ALL TO authenticated
USING (public.has_active_role('LECTURER') OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (public.has_active_role('LECTURER') OR public.has_global_role('ACADEMIC_STAFF'));

-- KUNCI JAWABAN TERPISAH (Mahasiswa DILARANG KERAS membaca tabel ini)
CREATE TABLE IF NOT EXISTS public.quiz_question_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    correct_option_id UUID NULL REFERENCES public.quiz_options(id) ON DELETE CASCADE,
    correct_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_question_key UNIQUE (question_id)
);

ALTER TABLE public.quiz_question_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quiz_question_keys_select ON public.quiz_question_keys;
CREATE POLICY quiz_question_keys_select ON public.quiz_question_keys
FOR SELECT TO authenticated
USING (
    public.has_active_role('LECTURER')
    OR public.has_active_role('TEACHING_ASSISTANT')
    OR public.has_global_role('ACADEMIC_STAFF')
);

DROP POLICY IF EXISTS quiz_question_keys_write ON public.quiz_question_keys;
CREATE POLICY quiz_question_keys_write ON public.quiz_question_keys
FOR ALL TO authenticated
USING (public.has_active_role('LECTURER') OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (public.has_active_role('LECTURER') OR public.has_global_role('ACADEMIC_STAFF'));

-- Sesi Pengerjaan Ujian Mahasiswa
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    student_name VARCHAR(150),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deadline_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '60 minutes'),
    finished_at TIMESTAMPTZ,
    total_score NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    max_score NUMERIC(6,2) NOT NULL DEFAULT 100.00,
    is_graded BOOLEAN NOT NULL DEFAULT true,
    violations_count INT NOT NULL DEFAULT 0,
    is_terminated BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT', 'DISQUALIFIED')),
    answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_grading_drafts JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_attempt_per_student
    ON public.exam_attempts (quiz_id, student_id)
    WHERE status = 'IN_PROGRESS';

CREATE INDEX IF NOT EXISTS idx_exam_attempts_quiz ON public.exam_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON public.exam_attempts(student_id);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exam_attempts_select ON public.exam_attempts;
CREATE POLICY exam_attempts_select ON public.exam_attempts
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_attempts.quiz_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('PROGRAM_COORDINATOR'))
    )
);

DROP POLICY IF EXISTS exam_attempts_insert ON public.exam_attempts;
CREATE POLICY exam_attempts_insert ON public.exam_attempts
FOR INSERT TO authenticated
WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS exam_attempts_update ON public.exam_attempts;
CREATE POLICY exam_attempts_update ON public.exam_attempts
FOR UPDATE TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_attempts.quiz_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
)
WITH CHECK (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_attempts.quiz_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

CREATE TABLE IF NOT EXISTS public.exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE RESTRICT,
    selected_option_id UUID REFERENCES public.quiz_options(id) ON DELETE SET NULL,
    essay_text TEXT,
    answer_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_draft BOOLEAN NOT NULL DEFAULT true,
    last_saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    score_earned NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    graded_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    graded_at TIMESTAMPTZ,
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exam_answers_select ON public.exam_answers;
CREATE POLICY exam_answers_select ON public.exam_answers
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.exam_attempts a
        JOIN public.quizzes q ON q.id = a.quiz_id
        WHERE a.id = public.exam_answers.attempt_id
          AND (a.student_id = (SELECT auth.uid()) OR public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

DROP POLICY IF EXISTS exam_answers_write ON public.exam_answers;
CREATE POLICY exam_answers_write ON public.exam_answers
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.exam_attempts a
        JOIN public.quizzes q ON q.id = a.quiz_id
        WHERE a.id = public.exam_answers.attempt_id
          AND (a.student_id = (SELECT auth.uid()) OR public.is_class_staff(q.class_id))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.exam_attempts a
        JOIN public.quizzes q ON q.id = a.quiz_id
        WHERE a.id = public.exam_answers.attempt_id
          AND (a.student_id = (SELECT auth.uid()) OR public.is_class_staff(q.class_id))
    )
);

-- Telemetri Pelanggaran Klien Mahasiswa
CREATE TABLE IF NOT EXISTS public.exam_telemetry_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    student_name VARCHAR(150),
    event_type VARCHAR(100) NOT NULL,
    duration_seconds INT DEFAULT 0,
    details TEXT,
    client_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_telemetry_exam ON public.exam_telemetry_events(exam_id);

ALTER TABLE public.exam_telemetry_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exam_telemetry_events_select ON public.exam_telemetry_events;
CREATE POLICY exam_telemetry_events_select ON public.exam_telemetry_events
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_telemetry_events.exam_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('PROGRAM_COORDINATOR'))
    )
);

DROP POLICY IF EXISTS exam_telemetry_events_insert ON public.exam_telemetry_events;
CREATE POLICY exam_telemetry_events_insert ON public.exam_telemetry_events
FOR INSERT TO authenticated
WITH CHECK (student_id = (SELECT auth.uid()));

-- Intervensi Pengawas Dosen
CREATE TABLE IF NOT EXISTS public.exam_proctor_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    student_name VARCHAR(150),
    proctor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    actor_name VARCHAR(150),
    action_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    value_before TEXT,
    value_after TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_interventions_exam ON public.exam_proctor_interventions(exam_id);

ALTER TABLE public.exam_proctor_interventions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exam_proctor_interventions_select ON public.exam_proctor_interventions;
CREATE POLICY exam_proctor_interventions_select ON public.exam_proctor_interventions
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_proctor_interventions.exam_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('PROGRAM_COORDINATOR'))
    )
);

DROP POLICY IF EXISTS exam_proctor_interventions_insert ON public.exam_proctor_interventions;
CREATE POLICY exam_proctor_interventions_insert ON public.exam_proctor_interventions
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_proctor_interventions.exam_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);


-- ============================================================================
-- BAGIAN 4: DOMAIN 6 — SENGKETA / SANGGAHAN NILAI UJIAN CBT (EXAM DISPUTES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exam_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE RESTRICT,
    exam_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE RESTRICT,
    question_id UUID NULL REFERENCES public.quiz_questions(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    student_name VARCHAR(150),
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUBMITTED', 'RESOLVED')),
    lecturer_feedback TEXT,
    adjusted_points NUMERIC(5,2),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_disputes_exam ON public.exam_disputes(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_disputes_student ON public.exam_disputes(student_id);

ALTER TABLE public.exam_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exam_disputes_select ON public.exam_disputes;
CREATE POLICY exam_disputes_select ON public.exam_disputes
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_disputes.exam_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('PROGRAM_COORDINATOR'))
    )
);

DROP POLICY IF EXISTS exam_disputes_insert ON public.exam_disputes;
CREATE POLICY exam_disputes_insert ON public.exam_disputes
FOR INSERT TO authenticated
WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS exam_disputes_update ON public.exam_disputes;
CREATE POLICY exam_disputes_update ON public.exam_disputes
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_disputes.exam_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_disputes.exam_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);


-- ============================================================================
-- BAGIAN 5: DOMAIN 7 — PUSTAKA DIGITAL, EVENT KAMPUS, SERTIFIKAT & PORTOFOLIO
-- ============================================================================

-- 5.1 Katalog Pustaka Digital & Peminjaman
CREATE TABLE IF NOT EXISTS public.library_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isbn VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Modul Kuliah',
    year VARCHAR(10) NOT NULL DEFAULT '2026',
    pages INT NOT NULL DEFAULT 100,
    badge VARCHAR(100) NOT NULL DEFAULT 'Modul Internal',
    file_url TEXT,
    file_size VARCHAR(50),
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS library_items_select ON public.library_items;
CREATE POLICY library_items_select ON public.library_items
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS library_items_write ON public.library_items;
CREATE POLICY library_items_write ON public.library_items
FOR ALL TO authenticated
USING (
    public.has_active_role('LECTURER')
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
)
WITH CHECK (
    public.has_active_role('LECTURER')
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
);

CREATE TABLE IF NOT EXISTS public.library_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    borrowed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
    returned_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'BORROWED' CHECK (status IN ('BORROWED', 'RETURNED', 'OVERDUE'))
);

ALTER TABLE public.library_loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS library_loans_select ON public.library_loans;
CREATE POLICY library_loans_select ON public.library_loans
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.has_global_role('ACADEMIC_STAFF'));

DROP POLICY IF EXISTS library_loans_write ON public.library_loans;
CREATE POLICY library_loans_write ON public.library_loans
FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (user_id = (SELECT auth.uid()) OR public.has_global_role('ACADEMIC_STAFF'));

-- 5.2 Event & Webinar Kampus
CREATE TABLE IF NOT EXISTS public.campus_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'Seminar Akademik',
    event_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    location VARCHAR(255) NOT NULL DEFAULT 'Auditorium Utama / Daring',
    organizer VARCHAR(150) NOT NULL DEFAULT 'Fakultas Teknik',
    max_participants INT DEFAULT 200,
    badge VARCHAR(100) DEFAULT 'Terbuka',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campus_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS campus_events_select ON public.campus_events;
CREATE POLICY campus_events_select ON public.campus_events
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS campus_events_write ON public.campus_events;
CREATE POLICY campus_events_write ON public.campus_events
FOR ALL TO authenticated
USING (
    public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
    OR public.has_global_role('SUPER_ADMIN')
)
WITH CHECK (
    public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
    OR public.has_global_role('SUPER_ADMIN')
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.campus_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'ATTENDED', 'CANCELLED')),
    CONSTRAINT uq_event_user UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_registrations_select ON public.event_registrations;
CREATE POLICY event_registrations_select ON public.event_registrations
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.has_global_role('ACADEMIC_STAFF'));

DROP POLICY IF EXISTS event_registrations_write ON public.event_registrations;
CREATE POLICY event_registrations_write ON public.event_registrations
FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (user_id = (SELECT auth.uid()) OR public.has_global_role('ACADEMIC_STAFF'));

-- 5.3 Sertifikat, Badge & Portofolio Proyek Mahasiswa
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID NULL REFERENCES public.classes(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    issuer VARCHAR(150) NOT NULL DEFAULT 'Laboratorium & Fakultas Teknik UIR',
    issue_date VARCHAR(50) NOT NULL,
    credential_id VARCHAR(100) NOT NULL UNIQUE,
    grade VARCHAR(50) NOT NULL DEFAULT 'Sangat Memuaskan (A)',
    hours VARCHAR(50) NOT NULL DEFAULT '48 Jam Pelatihan',
    file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS certificates_select ON public.certificates;
CREATE POLICY certificates_select ON public.certificates
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR public.has_active_role('LECTURER')
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
);

DROP POLICY IF EXISTS certificates_write ON public.certificates;
CREATE POLICY certificates_write ON public.certificates
FOR ALL TO authenticated
USING (public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('LECTURER'))
WITH CHECK (public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('LECTURER'));

CREATE TABLE IF NOT EXISTS public.student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_code VARCHAR(80) NOT NULL,
    badge_name VARCHAR(150) NOT NULL,
    description TEXT,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_badge UNIQUE (student_id, badge_code)
);

ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_badges_select ON public.student_badges;
CREATE POLICY student_badges_select ON public.student_badges
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR public.has_active_role('LECTURER')
    OR public.has_global_role('ACADEMIC_STAFF')
);

DROP POLICY IF EXISTS student_badges_write ON public.student_badges;
CREATE POLICY student_badges_write ON public.student_badges
FOR ALL TO authenticated
USING (public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('LECTURER'))
WITH CHECK (public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('LECTURER'));

CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    project_type VARCHAR(100) NOT NULL DEFAULT 'Capstone Project',
    description TEXT NOT NULL,
    tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'Terverifikasi Dosen',
    repo_url TEXT,
    demo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portfolios_select ON public.portfolios;
CREATE POLICY portfolios_select ON public.portfolios
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS portfolios_write ON public.portfolios;
CREATE POLICY portfolios_write ON public.portfolios
FOR ALL TO authenticated
USING (student_id = (SELECT auth.uid()) OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (student_id = (SELECT auth.uid()) OR public.has_global_role('ACADEMIC_STAFF'));

CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    artifact_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portfolio_items_select ON public.portfolio_items;
CREATE POLICY portfolio_items_select ON public.portfolio_items
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS portfolio_items_write ON public.portfolio_items;
CREATE POLICY portfolio_items_write ON public.portfolio_items
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.portfolios p
        WHERE p.id = public.portfolio_items.portfolio_id
          AND (p.student_id = (SELECT auth.uid()) OR public.has_global_role('ACADEMIC_STAFF'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.portfolios p
        WHERE p.id = public.portfolio_items.portfolio_id
          AND (p.student_id = (SELECT auth.uid()) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

-- Registrasi Bucket Storage Tambahan
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('library-books', 'library-books', false),
    ('student-docs', 'student-docs', false),
    ('leave-attachments', 'leave-attachments', false),
    ('certificates', 'certificates', false)
ON CONFLICT (id) DO UPDATE SET public = false;

COMMIT;
