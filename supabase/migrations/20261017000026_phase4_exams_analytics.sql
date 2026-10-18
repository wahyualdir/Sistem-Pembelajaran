-- ============================================================================
-- SIAJAR Migration: Fase 4 - Ujian, Analisis Butir Soal, CPMK/CPL, dan Kemiripan
-- Berkas: 20261017000026_phase4_exams_analytics.sql
--
-- CARA MEMBATALKAN (ROLLBACK):
-- DROP TABLE IF EXISTS public.similarity_pairs CASCADE;
-- DROP TABLE IF EXISTS public.submission_fingerprints CASCADE;
-- DROP TABLE IF EXISTS public.similarity_runs CASCADE;
-- DROP TABLE IF EXISTS public.journal_cpmk CASCADE;
-- DROP TABLE IF EXISTS public.achievement_snapshots CASCADE;
-- DROP TABLE IF EXISTS public.assessment_cpmk_map CASCADE;
-- DROP TABLE IF EXISTS public.cpmk_cpl_map CASCADE;
-- DROP TABLE IF EXISTS public.cpmk CASCADE;
-- DROP TABLE IF EXISTS public.cpl CASCADE;
-- DROP TABLE IF EXISTS public.exam_summary_stats CASCADE;
-- DROP TABLE IF EXISTS public.exam_item_stats CASCADE;
-- DROP TABLE IF EXISTS public.coding_submissions CASCADE;
-- DROP TABLE IF EXISTS public.coding_test_cases CASCADE;
-- DROP TABLE IF EXISTS public.exam_makeup_participants CASCADE;
-- DROP TABLE IF EXISTS public.exam_access_tokens CASCADE;
-- DROP TABLE IF EXISTS public.exam_events CASCADE;
-- ALTER TABLE public.quizzes DROP COLUMN IF EXISTS access_mode, DROP COLUMN IF EXISTS parent_quiz_id, DROP COLUMN IF EXISTS kind, DROP COLUMN IF EXISTS score_cap, DROP COLUMN IF EXISTS combine_policy;
-- ALTER TABLE public.exam_attempts DROP COLUMN IF EXISTS expires_at, DROP COLUMN IF EXISTS extra_time_seconds, DROP COLUMN IF EXISTS last_heartbeat_at, DROP COLUMN IF EXISTS active_session_id, DROP COLUMN IF EXISTS auto_submitted, DROP COLUMN IF EXISTS submit_idempotency_key;
-- ALTER TABLE public.exam_answers DROP COLUMN IF EXISTS revision, DROP COLUMN IF EXISTS updated_at;
-- ALTER TABLE public.quiz_questions DROP COLUMN IF EXISTS code_language, DROP COLUMN IF EXISTS time_limit_ms, DROP COLUMN IF EXISTS memory_limit_mb, DROP COLUMN IF EXISTS compare_mode, DROP COLUMN IF EXISTS needs_revision;
-- ALTER TABLE public.class_assistants DROP COLUMN IF EXISTS can_view_similarity;
-- DROP FUNCTION IF EXISTS public.claim_attempt_session(uuid);
-- DROP FUNCTION IF EXISTS public.save_exam_answers(uuid, uuid, jsonb);
-- DROP FUNCTION IF EXISTS public.exam_heartbeat(uuid, uuid);
-- DROP FUNCTION IF EXISTS public.submit_exam(uuid, uuid, text);
-- DROP FUNCTION IF EXISTS public.grant_exam_extra_time(uuid, int, text);
-- DROP FUNCTION IF EXISTS public.enter_exam(uuid, text);
-- DROP FUNCTION IF EXISTS public.get_exam_monitoring_summary(uuid);
-- DROP FUNCTION IF EXISTS public.finalize_expired_attempts();
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AUTOSAVE DAN PEMULIHAN SAAT KONEKSI PUTUS (Bagian 11.1)
-- ----------------------------------------------------------------------------

ALTER TABLE public.exam_attempts
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS extra_time_seconds INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS active_session_id UUID,
    ADD COLUMN IF NOT EXISTS auto_submitted BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS submit_idempotency_key TEXT;

ALTER TABLE public.exam_answers
    ADD COLUMN IF NOT EXISTS revision INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.exam_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('offline','online','tab_hidden','tab_visible','fullscreen_exit','sesi_ganda','waktu_ditambah')),
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    client_time TIMESTAMPTZ,
    server_time TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_events_attempt_server ON public.exam_events(attempt_id, server_time);

ALTER TABLE public.exam_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exam_events_select ON public.exam_events;
CREATE POLICY exam_events_select ON public.exam_events
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.exam_attempts a
        JOIN public.quizzes q ON q.id = a.quiz_id
        WHERE a.id = public.exam_events.attempt_id
          AND (a.student_id = (SELECT auth.uid()) OR public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

DROP POLICY IF EXISTS exam_events_insert ON public.exam_events;
CREATE POLICY exam_events_insert ON public.exam_events
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.exam_attempts a
        JOIN public.quizzes q ON q.id = a.quiz_id
        WHERE a.id = public.exam_events.attempt_id
          AND (a.student_id = (SELECT auth.uid()) OR public.is_class_staff(q.class_id))
    )
);

-- ----------------------------------------------------------------------------
-- 2. TOKEN MASUK, UJIAN SUSULAN, DAN REMEDIAL (Bagian 11.2)
-- ----------------------------------------------------------------------------

ALTER TABLE public.quizzes
    ADD COLUMN IF NOT EXISTS access_mode TEXT NOT NULL DEFAULT 'open' CHECK (access_mode IN ('open','token')),
    ADD COLUMN IF NOT EXISTS parent_quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'utama' CHECK (kind IN ('utama','susulan','remedial')),
    ADD COLUMN IF NOT EXISTS score_cap NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS combine_policy TEXT NOT NULL DEFAULT 'tertinggi' CHECK (combine_policy IN ('tertinggi','ganti','rata_rata'));

CREATE TABLE IF NOT EXISTS public.exam_access_tokens (
    quiz_id UUID PRIMARY KEY REFERENCES public.quizzes(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    rotated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    rotate_every_minutes INT
);

ALTER TABLE public.exam_access_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exam_access_tokens_select ON public.exam_access_tokens;
CREATE POLICY exam_access_tokens_select ON public.exam_access_tokens
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_access_tokens.quiz_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

DROP POLICY IF EXISTS exam_access_tokens_write ON public.exam_access_tokens;
CREATE POLICY exam_access_tokens_write ON public.exam_access_tokens
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_access_tokens.quiz_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_access_tokens.quiz_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

CREATE TABLE IF NOT EXISTS public.exam_makeup_participants (
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    approved_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (quiz_id, student_id)
);

ALTER TABLE public.exam_makeup_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exam_makeup_select ON public.exam_makeup_participants;
CREATE POLICY exam_makeup_select ON public.exam_makeup_participants
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_makeup_participants.quiz_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

DROP POLICY IF EXISTS exam_makeup_write ON public.exam_makeup_participants;
CREATE POLICY exam_makeup_write ON public.exam_makeup_participants
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_makeup_participants.quiz_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_makeup_participants.quiz_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

-- ----------------------------------------------------------------------------
-- 3. AUTO-GRADER SOAL KODING (Bagian 11.3)
-- ----------------------------------------------------------------------------

ALTER TABLE public.quiz_questions
    ADD COLUMN IF NOT EXISTS code_language TEXT CHECK (code_language IN ('python','javascript','java','c','cpp','php')),
    ADD COLUMN IF NOT EXISTS time_limit_ms INT DEFAULT 2000,
    ADD COLUMN IF NOT EXISTS memory_limit_mb INT DEFAULT 128,
    ADD COLUMN IF NOT EXISTS compare_mode TEXT DEFAULT 'trim' CHECK (compare_mode IN ('exact','trim','tokens','float')),
    ADD COLUMN IF NOT EXISTS needs_revision BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.coding_test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    stdin TEXT NOT NULL DEFAULT '',
    expected_stdout TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    weight INT NOT NULL DEFAULT 1 CHECK (weight > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coding_test_cases_q ON public.coding_test_cases(question_id);

ALTER TABLE public.coding_test_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coding_test_cases_select ON public.coding_test_cases;
CREATE POLICY coding_test_cases_select ON public.coding_test_cases
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quiz_questions qq
        LEFT JOIN public.quizzes q ON q.id = qq.quiz_id
        WHERE qq.id = public.coding_test_cases.question_id
          AND (
            (q.class_id IS NOT NULL AND public.is_class_staff(q.class_id))
            OR public.has_global_role('ACADEMIC_STAFF')
            OR (public.coding_test_cases.is_hidden = false AND q.class_id IS NOT NULL AND public.is_enrolled(q.class_id))
          )
    )
);

DROP POLICY IF EXISTS coding_test_cases_write ON public.coding_test_cases;
CREATE POLICY coding_test_cases_write ON public.coding_test_cases
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quiz_questions qq
        JOIN public.quizzes q ON q.id = qq.quiz_id
        WHERE qq.id = public.coding_test_cases.question_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quiz_questions qq
        JOIN public.quizzes q ON q.id = qq.quiz_id
        WHERE qq.id = public.coding_test_cases.question_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

CREATE TABLE IF NOT EXISTS public.coding_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    source_code TEXT NOT NULL CHECK (char_length(source_code) <= 65536),
    purpose TEXT NOT NULL CHECK (purpose IN ('coba','final')),
    status TEXT NOT NULL DEFAULT 'antre' CHECK (status IN ('antre','berjalan','selesai','galat')),
    compile_output TEXT,
    results JSONB DEFAULT '[]'::jsonb,
    score NUMERIC(6,2),
    judged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coding_submissions_attempt ON public.coding_submissions(attempt_id, question_id);

ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coding_submissions_select ON public.coding_submissions;
CREATE POLICY coding_submissions_select ON public.coding_submissions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.exam_attempts a
        JOIN public.quizzes q ON q.id = a.quiz_id
        WHERE a.id = public.coding_submissions.attempt_id
          AND (a.student_id = (SELECT auth.uid()) OR public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

DROP POLICY IF EXISTS coding_submissions_insert ON public.coding_submissions;
CREATE POLICY coding_submissions_insert ON public.coding_submissions
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.exam_attempts a
        WHERE a.id = public.coding_submissions.attempt_id
          AND a.student_id = (SELECT auth.uid())
    )
);

-- ----------------------------------------------------------------------------
-- 4. ANALISIS BUTIR SOAL (Bagian 11.4)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.exam_item_stats (
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    n INT NOT NULL DEFAULT 0,
    difficulty_p NUMERIC(5,4),
    discrimination_d NUMERIC(5,4),
    point_biserial NUMERIC(5,4),
    option_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
    avg_time_seconds NUMERIC(8,2),
    omit_rate NUMERIC(5,4),
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (quiz_id, question_id)
);

ALTER TABLE public.exam_item_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exam_item_stats_select ON public.exam_item_stats;
CREATE POLICY exam_item_stats_select ON public.exam_item_stats
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_item_stats.quiz_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('PROGRAM_COORDINATOR'))
    )
);

CREATE TABLE IF NOT EXISTS public.exam_summary_stats (
    quiz_id UUID PRIMARY KEY REFERENCES public.quizzes(id) ON DELETE CASCADE,
    n INT NOT NULL DEFAULT 0,
    mean NUMERIC(6,2),
    median NUMERIC(6,2),
    stddev NUMERIC(6,2),
    min NUMERIC(6,2),
    max NUMERIC(6,2),
    kr20 NUMERIC(5,4),
    histogram JSONB NOT NULL DEFAULT '[]'::jsonb,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_summary_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exam_summary_stats_select ON public.exam_summary_stats;
CREATE POLICY exam_summary_stats_select ON public.exam_summary_stats
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = public.exam_summary_stats.quiz_id
          AND (public.is_class_staff(q.class_id) OR public.has_global_role('ACADEMIC_STAFF') OR public.has_active_role('PROGRAM_COORDINATOR'))
    )
);

-- ----------------------------------------------------------------------------
-- 5. PEMETAAN CPMK KE CPL (Bagian 11.5)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cpl (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (program_id, code)
);

ALTER TABLE public.cpl ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cpl_select ON public.cpl;
CREATE POLICY cpl_select ON public.cpl FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS cpl_write ON public.cpl;
CREATE POLICY cpl_write ON public.cpl FOR ALL TO authenticated
USING (public.has_active_role('PROGRAM_COORDINATOR') OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (public.has_active_role('PROGRAM_COORDINATOR') OR public.has_global_role('ACADEMIC_STAFF'));

CREATE TABLE IF NOT EXISTS public.cpmk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (course_id, code)
);

ALTER TABLE public.cpmk ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cpmk_select ON public.cpmk;
CREATE POLICY cpmk_select ON public.cpmk FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS cpmk_write ON public.cpmk;
CREATE POLICY cpmk_write ON public.cpmk FOR ALL TO authenticated
USING (public.has_active_role('PROGRAM_COORDINATOR') OR public.has_active_role('LECTURER') OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (public.has_active_role('PROGRAM_COORDINATOR') OR public.has_active_role('LECTURER') OR public.has_global_role('ACADEMIC_STAFF'));

CREATE TABLE IF NOT EXISTS public.cpmk_cpl_map (
    cpmk_id UUID NOT NULL REFERENCES public.cpmk(id) ON DELETE CASCADE,
    cpl_id UUID NOT NULL REFERENCES public.cpl(id) ON DELETE CASCADE,
    weight_percent NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (weight_percent > 0 AND weight_percent <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (cpmk_id, cpl_id)
);

ALTER TABLE public.cpmk_cpl_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cpmk_cpl_map_select ON public.cpmk_cpl_map;
CREATE POLICY cpmk_cpl_map_select ON public.cpmk_cpl_map FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS cpmk_cpl_map_write ON public.cpmk_cpl_map;
CREATE POLICY cpmk_cpl_map_write ON public.cpmk_cpl_map FOR ALL TO authenticated
USING (public.has_active_role('PROGRAM_COORDINATOR') OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (public.has_active_role('PROGRAM_COORDINATOR') OR public.has_global_role('ACADEMIC_STAFF'));

CREATE TABLE IF NOT EXISTS public.assessment_cpmk_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('assignment','question')),
    assessment_id UUID NOT NULL,
    cpmk_id UUID NOT NULL REFERENCES public.cpmk(id) ON DELETE CASCADE,
    weight_percent NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (weight_percent > 0 AND weight_percent <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (assessment_type, assessment_id, cpmk_id)
);

ALTER TABLE public.assessment_cpmk_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assessment_cpmk_map_select ON public.assessment_cpmk_map;
CREATE POLICY assessment_cpmk_map_select ON public.assessment_cpmk_map FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS assessment_cpmk_map_write ON public.assessment_cpmk_map;
CREATE POLICY assessment_cpmk_map_write ON public.assessment_cpmk_map FOR ALL TO authenticated
USING (public.is_class_staff(class_id) OR public.has_global_role('ACADEMIC_STAFF'))
WITH CHECK (public.is_class_staff(class_id) OR public.has_global_role('ACADEMIC_STAFF'));

CREATE TABLE IF NOT EXISTS public.achievement_snapshots (
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    cpmk_id UUID NOT NULL REFERENCES public.cpmk(id) ON DELETE CASCADE,
    score_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, class_id, cpmk_id)
);

ALTER TABLE public.achievement_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS achievement_snapshots_select ON public.achievement_snapshots;
CREATE POLICY achievement_snapshots_select ON public.achievement_snapshots
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR public.is_class_staff(class_id)
    OR public.has_active_role('PROGRAM_COORDINATOR')
    OR public.has_global_role('ACADEMIC_STAFF')
);

CREATE TABLE IF NOT EXISTS public.journal_cpmk (
    journal_id UUID NOT NULL REFERENCES public.class_session_journals(id) ON DELETE CASCADE,
    cpmk_id UUID NOT NULL REFERENCES public.cpmk(id) ON DELETE CASCADE,
    PRIMARY KEY (journal_id, cpmk_id)
);

ALTER TABLE public.journal_cpmk ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journal_cpmk_select ON public.journal_cpmk;
CREATE POLICY journal_cpmk_select ON public.journal_cpmk FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS journal_cpmk_write ON public.journal_cpmk;
CREATE POLICY journal_cpmk_write ON public.journal_cpmk FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.class_session_journals j
        WHERE j.id = public.journal_cpmk.journal_id
          AND (public.is_class_staff(j.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.class_session_journals j
        WHERE j.id = public.journal_cpmk.journal_id
          AND (public.is_class_staff(j.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

-- ----------------------------------------------------------------------------
-- 6. CEK KEMIRIPAN TUGAS (Bagian 11.6)
-- ----------------------------------------------------------------------------

ALTER TABLE public.class_assistants
    ADD COLUMN IF NOT EXISTS can_view_similarity BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.similarity_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    started_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    scope TEXT NOT NULL DEFAULT 'class' CHECK (scope IN ('class','course_history')),
    status TEXT NOT NULL DEFAULT 'antre' CHECK (status IN ('antre','berjalan','selesai','galat')),
    threshold NUMERIC(4,2) NOT NULL DEFAULT 0.60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ
);

ALTER TABLE public.similarity_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS similarity_runs_select ON public.similarity_runs;
CREATE POLICY similarity_runs_select ON public.similarity_runs
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments a
        LEFT JOIN public.class_assistants ca ON ca.class_id = a.class_id AND ca.user_id = (SELECT auth.uid())
        WHERE a.id = public.similarity_runs.assignment_id
          AND (
            public.is_class_lecturer(a.class_id)
            OR (ca.user_id IS NOT NULL AND ca.can_view_similarity = true)
            OR public.has_global_role('ACADEMIC_STAFF')
          )
    )
);

CREATE TABLE IF NOT EXISTS public.submission_fingerprints (
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('teks','kode')),
    hashes BIGINT[] NOT NULL,
    PRIMARY KEY (submission_id, kind)
);

ALTER TABLE public.submission_fingerprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS submission_fingerprints_select ON public.submission_fingerprints;
CREATE POLICY submission_fingerprints_select ON public.submission_fingerprints
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.submissions s
        JOIN public.assignments a ON a.id = s.assignment_id
        LEFT JOIN public.class_assistants ca ON ca.class_id = a.class_id AND ca.user_id = (SELECT auth.uid())
        WHERE s.id = public.submission_fingerprints.submission_id
          AND (
            public.is_class_lecturer(a.class_id)
            OR (ca.user_id IS NOT NULL AND ca.can_view_similarity = true)
            OR public.has_global_role('ACADEMIC_STAFF')
          )
    )
);

CREATE TABLE IF NOT EXISTS public.similarity_pairs (
    run_id UUID NOT NULL REFERENCES public.similarity_runs(id) ON DELETE CASCADE,
    submission_a UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    submission_b UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    score NUMERIC(5,4) NOT NULL,
    matched_segments JSONB DEFAULT '[]'::jsonb,
    review_status TEXT NOT NULL DEFAULT 'baru' CHECK (review_status IN ('baru','wajar','perlu_ditinjau')),
    review_note TEXT,
    PRIMARY KEY (run_id, submission_a, submission_b)
);

ALTER TABLE public.similarity_pairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS similarity_pairs_select ON public.similarity_pairs;
CREATE POLICY similarity_pairs_select ON public.similarity_pairs
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.similarity_runs r
        JOIN public.assignments a ON a.id = r.assignment_id
        LEFT JOIN public.class_assistants ca ON ca.class_id = a.class_id AND ca.user_id = (SELECT auth.uid())
        WHERE r.id = public.similarity_pairs.run_id
          AND (
            public.is_class_lecturer(a.class_id)
            OR (ca.user_id IS NOT NULL AND ca.can_view_similarity = true)
            OR public.has_global_role('ACADEMIC_STAFF')
          )
    )
);

DROP POLICY IF EXISTS similarity_pairs_update ON public.similarity_pairs;
CREATE POLICY similarity_pairs_update ON public.similarity_pairs
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.similarity_runs r
        JOIN public.assignments a ON a.id = r.assignment_id
        WHERE r.id = public.similarity_pairs.run_id
          AND (public.is_class_lecturer(a.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.similarity_runs r
        JOIN public.assignments a ON a.id = r.assignment_id
        WHERE r.id = public.similarity_pairs.run_id
          AND (public.is_class_lecturer(a.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

-- ----------------------------------------------------------------------------
-- 7. FUNGSI DATABASE (POSTGRESQL RPCS)
-- ----------------------------------------------------------------------------

-- claim_attempt_session(attempt_id)
CREATE OR REPLACE FUNCTION public.claim_attempt_session(p_attempt_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_attempt RECORD;
    v_new_session_id UUID := gen_random_uuid();
    v_duration INT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    SELECT a.*, q.duration_minutes INTO v_attempt
    FROM public.exam_attempts a
    JOIN public.quizzes q ON q.id = a.quiz_id
    WHERE a.id = p_attempt_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_FOUND';
    END IF;

    IF v_attempt.student_id <> v_uid THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    IF v_attempt.status <> 'IN_PROGRESS' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'NOT_IN_PROGRESS', 'status', v_attempt.status);
    END IF;

    -- Catat event sesi ganda bila sebelumnya ada sesi aktif lain
    IF v_attempt.active_session_id IS NOT NULL AND v_attempt.active_session_id <> v_new_session_id THEN
        INSERT INTO public.exam_events (attempt_id, kind, meta)
        VALUES (p_attempt_id, 'sesi_ganda', jsonb_build_object('old_session_id', v_attempt.active_session_id, 'new_session_id', v_new_session_id));
    END IF;

    v_expires_at := v_attempt.expires_at;
    IF v_expires_at IS NULL THEN
        v_expires_at := v_attempt.started_at + (COALESCE(v_attempt.duration_minutes, 60) * interval '1 minute');
    END IF;

    UPDATE public.exam_attempts
    SET active_session_id = v_new_session_id,
        last_heartbeat_at = now(),
        expires_at = v_expires_at
    WHERE id = p_attempt_id;

    RETURN jsonb_build_object(
        'ok', true,
        'session_id', v_new_session_id,
        'expires_at', v_expires_at,
        'extra_time_seconds', v_attempt.extra_time_seconds,
        'server_now', now()
    );
END;
$$;

-- save_exam_answers(attempt_id, session_id, items)
CREATE OR REPLACE FUNCTION public.save_exam_answers(
    p_attempt_id UUID,
    p_session_id UUID,
    p_items JSONB
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_attempt RECORD;
    v_effective_expiry TIMESTAMPTZ;
    v_item RECORD;
    v_accepted_revisions JSONB := '{}'::jsonb;
    v_existing_rev INT;
    v_q_id UUID;
    v_ans JSONB;
    v_rev INT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    SELECT * INTO v_attempt
    FROM public.exam_attempts
    WHERE id = p_attempt_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_FOUND';
    END IF;

    IF v_attempt.student_id <> v_uid THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    IF v_attempt.status <> 'IN_PROGRESS' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'NOT_IN_PROGRESS');
    END IF;

    IF v_attempt.active_session_id IS DISTINCT FROM p_session_id THEN
        RETURN jsonb_build_object('ok', false, 'code', 'SESI_LAIN');
    END IF;

    -- Grace period 20 detik
    v_effective_expiry := COALESCE(v_attempt.expires_at, v_attempt.deadline_at) + (v_attempt.extra_time_seconds * interval '1 second') + interval '20 seconds';
    IF now() > v_effective_expiry THEN
        RETURN jsonb_build_object('ok', false, 'code', 'WAKTU_HABIS', 'server_now', now(), 'expires_at', v_effective_expiry);
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_q_id := (v_item.value->>'question_id')::uuid;
        v_ans := v_item.value->'answer';
        v_rev := COALESCE((v_item.value->>'revision')::int, 1);

        SELECT revision INTO v_existing_rev
        FROM public.exam_answers
        WHERE attempt_id = p_attempt_id AND question_id = v_q_id;

        IF NOT FOUND THEN
            INSERT INTO public.exam_answers (attempt_id, question_id, answer_data, essay_text, selected_option_id, revision, updated_at, last_saved_at)
            VALUES (
                p_attempt_id,
                v_q_id,
                COALESCE(v_ans, '{}'::jsonb),
                CASE WHEN jsonb_typeof(v_ans) = 'string' THEN v_ans #>> '{}' ELSE NULL END,
                CASE WHEN jsonb_typeof(v_ans->'selected_option_id') = 'string' THEN (v_ans->>'selected_option_id')::uuid ELSE NULL END,
                v_rev,
                now(),
                now()
            );
            v_accepted_revisions := jsonb_set(v_accepted_revisions, ARRAY[v_q_id::text], to_jsonb(v_rev));
        ELSIF v_rev > v_existing_rev THEN
            UPDATE public.exam_answers
            SET answer_data = COALESCE(v_ans, '{}'::jsonb),
                essay_text = CASE WHEN jsonb_typeof(v_ans) = 'string' THEN v_ans #>> '{}' ELSE essay_text END,
                selected_option_id = CASE WHEN jsonb_typeof(v_ans->'selected_option_id') = 'string' THEN (v_ans->>'selected_option_id')::uuid ELSE selected_option_id END,
                revision = v_rev,
                updated_at = now(),
                last_saved_at = now()
            WHERE attempt_id = p_attempt_id AND question_id = v_q_id;
            v_accepted_revisions := jsonb_set(v_accepted_revisions, ARRAY[v_q_id::text], to_jsonb(v_rev));
        END IF;
    END LOOP;

    UPDATE public.exam_attempts
    SET last_heartbeat_at = now()
    WHERE id = p_attempt_id;

    RETURN jsonb_build_object(
        'ok', true,
        'accepted_revisions', v_accepted_revisions,
        'server_now', now(),
        'expires_at', v_effective_expiry
    );
END;
$$;

-- exam_heartbeat(attempt_id, session_id)
CREATE OR REPLACE FUNCTION public.exam_heartbeat(p_attempt_id UUID, p_session_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_attempt RECORD;
BEGIN
    SELECT * INTO v_attempt FROM public.exam_attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'ATTEMPT_NOT_FOUND');
    END IF;

    IF v_attempt.active_session_id IS DISTINCT FROM p_session_id THEN
        RETURN jsonb_build_object('ok', false, 'code', 'SESI_LAIN');
    END IF;

    UPDATE public.exam_attempts
    SET last_heartbeat_at = now()
    WHERE id = p_attempt_id;

    RETURN jsonb_build_object('ok', true, 'server_now', now());
END;
$$;

-- submit_exam(attempt_id, session_id, idempotency_key)
CREATE OR REPLACE FUNCTION public.submit_exam(
    p_attempt_id UUID,
    p_session_id UUID,
    p_idempotency_key TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_attempt RECORD;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    SELECT * INTO v_attempt FROM public.exam_attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_FOUND';
    END IF;

    IF v_attempt.student_id <> v_uid THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    -- Idempoten jika kunci sama atau sudah submitted
    IF v_attempt.status IN ('SUBMITTED', 'TIMED_OUT') THEN
        RETURN jsonb_build_object('ok', true, 'status', v_attempt.status, 'finished_at', v_attempt.finished_at, 'already_submitted', true);
    END IF;

    UPDATE public.exam_attempts
    SET status = 'SUBMITTED',
        finished_at = now(),
        submit_idempotency_key = p_idempotency_key
    WHERE id = p_attempt_id;

    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, after_json)
    VALUES (v_uid, 'STUDENT', 'exam.submit', 'exam_attempts', p_attempt_id, 'CLASS', v_attempt.quiz_id,
            jsonb_build_object('finished_at', now(), 'idempotency_key', p_idempotency_key));

    RETURN jsonb_build_object('ok', true, 'status', 'SUBMITTED', 'finished_at', now());
END;
$$;

-- grant_exam_extra_time(attempt_id, seconds, reason)
CREATE OR REPLACE FUNCTION public.grant_exam_extra_time(
    p_attempt_id UUID,
    p_seconds INT,
    p_reason TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_attempt RECORD;
    v_new_extra INT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    SELECT a.*, q.class_id INTO v_attempt
    FROM public.exam_attempts a
    JOIN public.quizzes q ON q.id = a.quiz_id
    WHERE a.id = p_attempt_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_FOUND';
    END IF;

    -- Hanya Dosen Pengampu (bukan Asisten)
    IF NOT (public.is_class_lecturer(v_attempt.class_id) OR public.has_global_role('ACADEMIC_STAFF')) THEN
        RAISE EXCEPTION 'FORBIDDEN_LECTURER_ONLY';
    END IF;

    v_new_extra := v_attempt.extra_time_seconds + p_seconds;

    UPDATE public.exam_attempts
    SET extra_time_seconds = v_new_extra
    WHERE id = p_attempt_id;

    INSERT INTO public.exam_events (attempt_id, kind, meta)
    VALUES (p_attempt_id, 'waktu_ditambah', jsonb_build_object('seconds', p_seconds, 'reason', p_reason, 'granted_by', v_uid));

    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, after_json)
    VALUES (v_uid, 'LECTURER', 'exam.extra_time', 'exam_attempts', p_attempt_id, 'CLASS', v_attempt.class_id,
            jsonb_build_object('seconds_added', p_seconds, 'total_extra', v_new_extra, 'reason', p_reason));

    RETURN jsonb_build_object('ok', true, 'extra_time_seconds', v_new_extra);
END;
$$;

-- enter_exam(quiz_id, token)
CREATE OR REPLACE FUNCTION public.enter_exam(
    p_quiz_id UUID,
    p_token TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_quiz RECORD;
    v_token_rec RECORD;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    SELECT * INTO v_quiz FROM public.quizzes WHERE id = p_quiz_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'EXAM_NOT_FOUND', 'pesan', 'Ujian tidak ditemukan.');
    END IF;

    -- Cek susulan / remedial
    IF v_quiz.kind IN ('susulan', 'remedial') THEN
        IF NOT EXISTS (SELECT 1 FROM public.exam_makeup_participants WHERE quiz_id = p_quiz_id AND student_id = v_uid) THEN
            RETURN jsonb_build_object('ok', false, 'code', 'NOT_REGISTERED', 'pesan', 'Kamu tidak terdaftar pada sesi ujian ini.');
        END IF;
    END IF;

    -- Jika mode open, izinkan langsung
    IF v_quiz.access_mode = 'open' THEN
        RETURN jsonb_build_object('ok', true);
    END IF;

    -- Validasi token
    SELECT * INTO v_token_rec FROM public.exam_access_tokens WHERE quiz_id = p_quiz_id;
    IF NOT FOUND OR upper(trim(v_token_rec.token)) <> upper(trim(p_token)) THEN
        RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TOKEN', 'pesan', 'Token ujian salah. Silakan periksa kembali.');
    END IF;

    RETURN jsonb_build_object('ok', true);
END;
$$;

-- get_exam_monitoring_summary(quiz_id)
CREATE OR REPLACE FUNCTION public.get_exam_monitoring_summary(p_quiz_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_quiz RECORD;
    v_result JSONB;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    SELECT * INTO v_quiz FROM public.quizzes WHERE id = p_quiz_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'EXAM_NOT_FOUND';
    END IF;

    IF NOT (public.is_class_staff(v_quiz.class_id) OR public.has_global_role('ACADEMIC_STAFF')) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'attempt_id', a.id,
            'student_id', a.student_id,
            'student_name', COALESCE(p.full_name, a.student_name, 'Mahasiswa'),
            'status', a.status,
            'auto_submitted', a.auto_submitted,
            'started_at', a.started_at,
            'finished_at', a.finished_at,
            'last_heartbeat_at', a.last_heartbeat_at,
            'extra_time_seconds', a.extra_time_seconds,
            'is_disconnected', (a.status = 'IN_PROGRESS' AND (a.last_heartbeat_at IS NULL OR now() - a.last_heartbeat_at > interval '45 seconds')),
            'answered_count', (SELECT count(*)::int FROM public.exam_answers ea WHERE ea.attempt_id = a.id AND (ea.essay_text IS NOT NULL OR ea.selected_option_id IS NOT NULL OR ea.answer_data <> '{}'::jsonb)),
            'tab_exits_count', (SELECT count(*)::int FROM public.exam_events ee WHERE ee.attempt_id = a.id AND ee.kind IN ('tab_hidden', 'fullscreen_exit'))
        ) ORDER BY p.full_name ASC
    ) INTO v_result
    FROM public.exam_attempts a
    LEFT JOIN public.profiles p ON p.id = a.student_id
    WHERE a.quiz_id = p_quiz_id;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- finalize_expired_attempts()
CREATE OR REPLACE FUNCTION public.finalize_expired_attempts()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_count INT := 0;
BEGIN
    WITH expired AS (
        SELECT a.id
        FROM public.exam_attempts a
        JOIN public.quizzes q ON q.id = a.quiz_id
        WHERE a.status = 'IN_PROGRESS'
          AND now() > COALESCE(a.expires_at, a.deadline_at) + (a.extra_time_seconds * interval '1 second') + interval '30 seconds'
    )
    UPDATE public.exam_attempts
    SET status = 'SUBMITTED',
        auto_submitted = true,
        finished_at = now()
    WHERE id IN (SELECT id FROM expired);

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Hak akses eksekusi RPC
GRANT EXECUTE ON FUNCTION public.claim_attempt_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_exam_answers(uuid, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exam_heartbeat(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exam(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_exam_extra_time(uuid, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enter_exam(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exam_monitoring_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_expired_attempts() TO authenticated, service_role;
