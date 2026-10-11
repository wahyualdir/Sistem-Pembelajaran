-- SIAJAR Migration: Perubahan nilai FINAL lewat persetujuan (Bagian 7.4, 8.2, matriks A7)
-- Dosen mengajukan; koordinator prodi (scope PROGRAM lewat mata kuliah kelas) memutuskan; pemohon tidak boleh
-- memutuskan sendiri. Kelas tanpa mata kuliah belum memiliki koordinator yang berwenang.

DO $$ BEGIN
    CREATE TYPE public.change_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.grade_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    -- Salinan saat pengajuan: koordinator tidak perlu membaca tabel grades atau profil mahasiswa.
    class_title TEXT NOT NULL,
    assignment_title TEXT NOT NULL,
    student_name TEXT NOT NULL,
    old_score NUMERIC(6,2) NOT NULL,
    proposed_score NUMERIC(6,2) NOT NULL,
    reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 1000),
    status public.change_request_status NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    review_note TEXT NULL,
    reviewed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_gcr_pending ON public.grade_change_requests(grade_id) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_gcr_class ON public.grade_change_requests(class_id, status);
ALTER TABLE public.grade_change_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_class_coordinator(p_class_id uuid)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.classes c JOIN public.courses co ON co.id = c.course_id
        WHERE c.id = p_class_id AND public.is_program_coordinator(co.program_id)
    );
$$;

DROP POLICY IF EXISTS gcr_select ON public.grade_change_requests;
CREATE POLICY gcr_select ON public.grade_change_requests
FOR SELECT TO authenticated
USING (public.is_class_lecturer(class_id) OR public.is_class_coordinator(class_id));

CREATE OR REPLACE FUNCTION public.request_grade_change(p_submission uuid, p_score numeric, p_reason text)
RETURNS public.grade_change_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_sub public.submissions;
    v_a public.assignments;
    v_g public.grades;
    v_row public.grade_change_requests;
    v_name text;
    v_class text;
BEGIN
    SELECT * INTO v_sub FROM public.submissions WHERE id = p_submission;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    SELECT * INTO v_a FROM public.assignments WHERE id = v_sub.assignment_id;
    IF v_uid IS NULL OR NOT public.is_class_lecturer(v_a.class_id) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

    SELECT * INTO v_g FROM public.grades
    WHERE student_id = v_sub.student_id AND item_type = 'ASSIGNMENT' AND item_id = v_a.id FOR UPDATE;
    IF NOT FOUND OR v_g.status <> 'FINAL' THEN RAISE EXCEPTION 'NOT_FINAL'; END IF;
    IF p_score < 0 OR p_score > v_g.max_score THEN RAISE EXCEPTION 'INVALID_SCORE'; END IF;
    IF p_score = v_g.score THEN RAISE EXCEPTION 'NO_CHANGE'; END IF;

    SELECT full_name INTO v_name FROM public.profiles WHERE id = v_sub.student_id;
    SELECT title INTO v_class FROM public.classes WHERE id = v_a.class_id;
    BEGIN
        INSERT INTO public.grade_change_requests
            (grade_id, class_id, requested_by, class_title, assignment_title, student_name, old_score, proposed_score, reason)
        VALUES (v_g.id, v_a.class_id, v_uid, v_class, v_a.title, COALESCE(v_name, 'Mahasiswa'), v_g.score, p_score, trim(p_reason))
        RETURNING * INTO v_row;
    EXCEPTION WHEN unique_violation THEN
        RAISE EXCEPTION 'ALREADY_PENDING';
    END;

    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, after_json)
    VALUES (v_uid, 'LECTURER', 'grade.change_request', 'grade_change_requests', v_row.id, 'CLASS', v_a.class_id,
            jsonb_build_object('old_score', v_g.score, 'proposed_score', p_score));
    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_grade_change(p_request uuid, p_approve boolean, p_note text)
RETURNS public.grade_change_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_r public.grade_change_requests;
    v_g public.grades;
BEGIN
    SELECT * INTO v_r FROM public.grade_change_requests WHERE id = p_request FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    IF v_uid IS NULL OR NOT public.is_class_coordinator(v_r.class_id) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    IF v_r.requested_by = v_uid THEN RAISE EXCEPTION 'SELF_APPROVAL'; END IF;
    IF v_r.status <> 'PENDING' THEN RAISE EXCEPTION 'NOT_PENDING'; END IF;
    IF length(trim(COALESCE(p_note, ''))) < 3 THEN RAISE EXCEPTION 'NOTE_REQUIRED'; END IF;

    UPDATE public.grade_change_requests
    SET status = (CASE WHEN p_approve THEN 'APPROVED' ELSE 'REJECTED' END)::public.change_request_status,
        reviewed_by = v_uid, review_note = trim(p_note), reviewed_at = now()
    WHERE id = p_request RETURNING * INTO v_r;

    IF p_approve THEN
        UPDATE public.grades SET score = v_r.proposed_score WHERE id = v_r.grade_id RETURNING * INTO v_g;
        INSERT INTO public.grade_history (grade_id, class_id, old_score, new_score, old_status, new_status, changed_by, reason)
        VALUES (v_g.id, v_r.class_id, v_r.old_score, v_r.proposed_score, 'FINAL', 'FINAL', v_uid, v_r.reason);
        INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id, class_id)
        VALUES (v_g.student_id, 'GRADE_UPDATED', 'Nilai diperbarui: ' || v_r.assignment_title,
                'Nilai Anda diubah melalui persetujuan koordinator prodi.', 'grades', v_g.id, v_r.class_id);
    END IF;

    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, after_json)
    VALUES (v_uid, 'PROGRAM_COORDINATOR', CASE WHEN p_approve THEN 'grade.change_approve' ELSE 'grade.change_reject' END,
            'grade_change_requests', p_request, 'CLASS', v_r.class_id,
            jsonb_build_object('old_score', v_r.old_score, 'proposed_score', v_r.proposed_score));
    RETURN v_r;
END;
$$;

REVOKE ALL ON FUNCTION public.is_class_coordinator(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_grade_change(uuid, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.decide_grade_change(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_class_coordinator(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_grade_change(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decide_grade_change(uuid, boolean, text) TO authenticated;
