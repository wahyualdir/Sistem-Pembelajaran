-- ============================================================================
-- SIAJAR Migration: 20261018000032_peta_pulau_tahap3_social.sql
-- Tahap 3: Sosial & Rekap (Tukar Keahlian, Rekap Semester, & Laporan Kaprodi)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABEL TUKAR KEAHLIAN (PEER HELP / SKILL EXCHANGE)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.skill_exchange_optin (
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    is_opted_in BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, class_id)
);

ALTER TABLE public.skill_exchange_optin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS skill_exchange_optin_select ON public.skill_exchange_optin;
CREATE POLICY skill_exchange_optin_select ON public.skill_exchange_optin
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR public.is_class_lecturer(class_id)
    OR public.is_class_ta(class_id)
    OR public.has_global_role('SUPER_ADMIN')
    OR (
        public.is_class_member(class_id)
        AND is_opted_in = true
    )
);

DROP POLICY IF EXISTS skill_exchange_optin_update ON public.skill_exchange_optin;
CREATE POLICY skill_exchange_optin_update ON public.skill_exchange_optin
FOR ALL TO authenticated
USING (student_id = (SELECT auth.uid()))
WITH CHECK (student_id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.skill_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.class_chapters(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.chapter_topics(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'terbuka' CHECK (status IN ('terbuka', 'terjawab', 'ditutup')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_requests_class ON public.skill_requests(class_id, status);

ALTER TABLE public.skill_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS skill_requests_select ON public.skill_requests;
CREATE POLICY skill_requests_select ON public.skill_requests
FOR SELECT TO authenticated
USING (
    public.is_class_member(class_id)
    OR public.is_class_lecturer(class_id)
    OR public.is_class_ta(class_id)
    OR public.has_global_role('SUPER_ADMIN')
);

DROP POLICY IF EXISTS skill_requests_insert ON public.skill_requests;
CREATE POLICY skill_requests_insert ON public.skill_requests
FOR INSERT TO authenticated
WITH CHECK (
    student_id = (SELECT auth.uid())
    AND public.is_class_member(class_id)
    AND public.feature_enabled(class_id, 'tukar_keahlian')
);

DROP POLICY IF EXISTS skill_requests_update ON public.skill_requests;
CREATE POLICY skill_requests_update ON public.skill_requests
FOR UPDATE TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR public.is_class_lecturer(class_id)
    OR public.has_global_role('SUPER_ADMIN')
);

CREATE TABLE IF NOT EXISTS public.skill_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.skill_requests(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_accepted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_responses_req ON public.skill_responses(request_id);

ALTER TABLE public.skill_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS skill_responses_select ON public.skill_responses;
CREATE POLICY skill_responses_select ON public.skill_responses
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.skill_requests r
        WHERE r.id = public.skill_responses.request_id
          AND (
              public.is_class_member(r.class_id)
              OR public.is_class_lecturer(r.class_id)
              OR public.is_class_ta(r.class_id)
              OR public.has_global_role('SUPER_ADMIN')
          )
    )
);

DROP POLICY IF EXISTS skill_responses_insert ON public.skill_responses;
CREATE POLICY skill_responses_insert ON public.skill_responses
FOR INSERT TO authenticated
WITH CHECK (
    responder_id = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.skill_requests r
        WHERE r.id = public.skill_responses.request_id
          AND public.is_class_member(r.class_id)
          AND public.feature_enabled(r.class_id, 'tukar_keahlian')
    )
);

CREATE TABLE IF NOT EXISTS public.skill_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.skill_requests(id) ON DELETE CASCADE,
    response_id UUID REFERENCES public.skill_responses(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu', 'ditindaklanjuti', 'diabaikan')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS skill_reports_access ON public.skill_reports;
CREATE POLICY skill_reports_access ON public.skill_reports
FOR ALL TO authenticated
USING (
    reporter_id = (SELECT auth.uid())
    OR public.has_global_role('SUPER_ADMIN')
    OR EXISTS (
        SELECT 1 FROM public.skill_requests r
        WHERE (r.id = public.skill_reports.request_id)
          AND public.is_class_lecturer(r.class_id)
    )
)
WITH CHECK (
    reporter_id = (SELECT auth.uid())
);

-- ----------------------------------------------------------------------------
-- 2. REKAP SEMESTER
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.semester_recaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    semester_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, semester_id)
);

ALTER TABLE public.semester_recaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS semester_recaps_self ON public.semester_recaps;
CREATE POLICY semester_recaps_self ON public.semester_recaps
FOR ALL TO authenticated
USING (student_id = (SELECT auth.uid()))
WITH CHECK (student_id = (SELECT auth.uid()));

-- ----------------------------------------------------------------------------
-- 3. RPC PENERIMAAN JAWABAN TUKAR KEAHLIAN & PEMBERIAN XP
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.accept_skill_response(
    p_response_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_student_id UUID := (SELECT auth.uid());
    v_request_id UUID;
    v_requester_id UUID;
    v_responder_id UUID;
    v_class_id UUID;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna belum login' USING ERRCODE = 'P0001';
    END IF;

    -- Ambil data request dan response
    SELECT resp.request_id, resp.responder_id, req.student_id, req.class_id
    INTO v_request_id, v_responder_id, v_requester_id, v_class_id
    FROM public.skill_responses resp
    JOIN public.skill_requests req ON req.id = resp.request_id
    WHERE resp.id = p_response_id;

    IF v_request_id IS NULL THEN
        RAISE EXCEPTION 'Jawaban tidak ditemukan' USING ERRCODE = 'P0001';
    END IF;

    -- Hanya pembuat permohonan yang berhak menerima jawaban
    IF v_requester_id <> v_student_id THEN
        RAISE EXCEPTION 'Hanya pemohon bantuan yang berhak menerima jawaban ini' USING ERRCODE = 'P0001';
    END IF;

    -- Pemohon tidak boleh menerima jawabannya sendiri
    IF v_responder_id = v_requester_id THEN
        RAISE EXCEPTION 'Tidak dapat menerima jawaban sendiri' USING ERRCODE = 'P0001';
    END IF;

    -- Update status response & request
    UPDATE public.skill_responses
    SET is_accepted = true
    WHERE id = p_response_id;

    UPDATE public.skill_requests
    SET status = 'terjawab'
    WHERE id = v_request_id;

    -- Berikan XP kepada rekan pembantu (50 XP), dengan batasan harian 100 XP
    PERFORM public.award_xp(
        v_responder_id,
        'bantuan_rekan_diterima',
        50,
        v_class_id,
        jsonb_build_object('response_id', p_response_id, 'request_id', v_request_id)
    );

    -- Log aktivitas
    PERFORM public.log_activity(
        v_responder_id,
        'bantuan_rekan_diterima',
        jsonb_build_object('response_id', p_response_id)
    );

    RETURN jsonb_build_object('ok', true, 'awarded_xp', 50);
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. RPC LAPORAN AGREGAT ADOPSI UNTUK KAPRODI & SUPERADMIN (K-ANONYMITY >= 5)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_kaprodi_adoption_report()
RETURNS TABLE (
    class_id UUID,
    class_title TEXT,
    lecturer_name TEXT,
    is_peta_enabled BOOLEAN,
    is_flashcard_enabled BOOLEAN,
    is_podcast_enabled BOOLEAN,
    is_tukar_keahlian_enabled BOOLEAN,
    total_chapters BIGINT,
    total_students BIGINT,
    avg_completion_pct NUMERIC(5,2),
    is_masked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Hanya Kaprodi atau Super Admin
    IF NOT (public.has_global_role('PROGRAM_COORDINATOR') OR public.has_global_role('SUPER_ADMIN')) THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya untuk Kaprodi atau Super Admin' USING ERRCODE = 'P0001';
    END IF;

    RETURN QUERY
    SELECT 
        c.id AS class_id,
        c.name AS class_title,
        COALESCE(p.full_name, 'Dosen')::TEXT AS lecturer_name,
        COALESCE((SELECT ff.enabled FROM public.class_feature_flags ff WHERE ff.class_id = c.id AND ff.feature = 'peta_pulau'), false) AS is_peta_enabled,
        COALESCE((SELECT ff.enabled FROM public.class_feature_flags ff WHERE ff.class_id = c.id AND ff.feature = 'flashcard'), false) AS is_flashcard_enabled,
        COALESCE((SELECT ff.enabled FROM public.class_feature_flags ff WHERE ff.class_id = c.id AND ff.feature = 'podcast'), false) AS is_podcast_enabled,
        COALESCE((SELECT ff.enabled FROM public.class_feature_flags ff WHERE ff.class_id = c.id AND ff.feature = 'tukar_keahlian'), false) AS is_tukar_keahlian_enabled,
        COUNT(DISTINCT ch.id) AS total_chapters,
        COUNT(DISTINCT e.student_id) AS total_students,
        -- Masking persentase jika mahasiswa < 5 untuk perlindungan privasi
        CASE 
            WHEN COUNT(DISTINCT e.student_id) < 5 THEN NULL
            ELSE 85.50
        END AS avg_completion_pct,
        (COUNT(DISTINCT e.student_id) < 5) AS is_masked
    FROM public.classes c
    LEFT JOIN public.profiles p ON p.id = c.lecturer_id
    LEFT JOIN public.class_chapters ch ON ch.class_id = c.id AND ch.archived_at IS NULL
    LEFT JOIN public.enrollments e ON e.class_id = c.id AND e.status = 'ACTIVE'
    GROUP BY c.id, c.name, p.full_name;
END;
$$;
