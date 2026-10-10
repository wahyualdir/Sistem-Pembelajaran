-- SIAJAR Migration: Penilaian tugas — draf, finalisasi, riwayat (Bagian 6.5, 7.4, 8.2)
-- Komentar feedback disimpan di grades dulu; tabel feedback terpisah (utas, STAFF_ONLY) menyusul.
-- class_id dan student_id disalin ke grades agar RLS sederhana; enrollment_id ditambah saat gradebook dibuat.

DO $$ BEGIN
    CREATE TYPE public.grade_status AS ENUM ('DRAFT', 'FINAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    item_type TEXT NOT NULL DEFAULT 'ASSIGNMENT' CHECK (item_type IN ('ASSIGNMENT', 'QUIZ', 'EXAM', 'MANUAL')),
    item_id UUID NOT NULL,
    score NUMERIC(6,2) NOT NULL,
    max_score NUMERIC(6,2) NOT NULL,
    comment TEXT NOT NULL DEFAULT '' CHECK (char_length(comment) <= 5000),
    status public.grade_status NOT NULL DEFAULT 'DRAFT',
    graded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    finalized_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    finalized_at TIMESTAMPTZ NULL,
    is_visible_to_student BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_grades_item UNIQUE (student_id, item_type, item_id),
    CONSTRAINT ck_grades_score CHECK (score BETWEEN 0 AND max_score)
);

CREATE TABLE IF NOT EXISTS public.grade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    old_score NUMERIC(6,2) NULL,
    new_score NUMERIC(6,2) NOT NULL,
    old_status public.grade_status NULL,
    new_status public.grade_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grades_class ON public.grades(class_id);
CREATE INDEX IF NOT EXISTS idx_grade_history_grade ON public.grade_history(grade_id, changed_at);

DROP TRIGGER IF EXISTS tr_grades_updated_at ON public.grades;
CREATE TRIGGER tr_grades_updated_at BEFORE UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- Append-only: memakai fungsi pencegah ubah/hapus yang sama dengan audit_logs.
DROP TRIGGER IF EXISTS tr_grade_history_immutable ON public.grade_history;
CREATE TRIGGER tr_grade_history_immutable BEFORE UPDATE OR DELETE ON public.grade_history
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_audit_log_modification();

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;

-- Nilai draf tidak terlihat mahasiswa sampai difinalisasi; tidak ada INSERT/UPDATE/DELETE langsung.
DROP POLICY IF EXISTS grades_select ON public.grades;
CREATE POLICY grades_select ON public.grades
FOR SELECT TO authenticated
USING (public.is_class_lecturer(class_id) OR (is_visible_to_student AND student_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS grade_history_select ON public.grade_history;
CREATE POLICY grade_history_select ON public.grade_history
FOR SELECT TO authenticated
USING (public.is_class_lecturer(class_id));

CREATE OR REPLACE FUNCTION public.save_grade_draft(p_submission uuid, p_score numeric, p_comment text)
RETURNS public.grades LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_sub public.submissions;
    v_a public.assignments;
    v_old public.grades;
    v_row public.grades;
BEGIN
    SELECT * INTO v_sub FROM public.submissions WHERE id = p_submission;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    SELECT * INTO v_a FROM public.assignments WHERE id = v_sub.assignment_id;
    IF v_uid IS NULL OR NOT public.is_class_lecturer(v_a.class_id) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    IF p_score < 0 OR p_score > v_a.max_score THEN RAISE EXCEPTION 'INVALID_SCORE'; END IF;

    SELECT * INTO v_old FROM public.grades
    WHERE student_id = v_sub.student_id AND item_type = 'ASSIGNMENT' AND item_id = v_a.id FOR UPDATE;
    IF FOUND AND v_old.status = 'FINAL' THEN RAISE EXCEPTION 'GRADE_FINAL'; END IF;

    INSERT INTO public.grades (class_id, student_id, item_id, score, max_score, comment, graded_by)
    VALUES (v_a.class_id, v_sub.student_id, v_a.id, p_score, v_a.max_score, COALESCE(trim(p_comment), ''), v_uid)
    ON CONFLICT (student_id, item_type, item_id) DO UPDATE
        SET score = EXCLUDED.score, comment = EXCLUDED.comment, graded_by = EXCLUDED.graded_by
        WHERE public.grades.status = 'DRAFT'
    RETURNING * INTO v_row;
    IF v_row.id IS NULL THEN RAISE EXCEPTION 'GRADE_FINAL'; END IF;

    INSERT INTO public.grade_history (grade_id, class_id, old_score, new_score, old_status, new_status, changed_by)
    VALUES (v_row.id, v_a.class_id, v_old.score, v_row.score, v_old.status, v_row.status, v_uid);

    UPDATE public.submissions SET status = 'REVIEWED' WHERE id = p_submission AND status = 'SUBMITTED';
    RETURN v_row;
END;
$$;

-- Finalisasi hanya oleh dosen kelas (grade.finalize tidak dapat didelegasikan ke asisten).
CREATE OR REPLACE FUNCTION public.finalize_grade(p_submission uuid)
RETURNS public.grades LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_sub public.submissions;
    v_a public.assignments;
    v_row public.grades;
BEGIN
    SELECT * INTO v_sub FROM public.submissions WHERE id = p_submission;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    SELECT * INTO v_a FROM public.assignments WHERE id = v_sub.assignment_id;
    IF v_uid IS NULL OR NOT public.is_class_lecturer(v_a.class_id) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

    UPDATE public.grades
    SET status = 'FINAL', is_visible_to_student = true, finalized_by = v_uid, finalized_at = now()
    WHERE student_id = v_sub.student_id AND item_type = 'ASSIGNMENT' AND item_id = v_a.id AND status = 'DRAFT'
    RETURNING * INTO v_row;
    IF v_row.id IS NULL THEN RAISE EXCEPTION 'NO_DRAFT'; END IF;

    INSERT INTO public.grade_history (grade_id, class_id, old_score, new_score, old_status, new_status, changed_by)
    VALUES (v_row.id, v_a.class_id, v_row.score, v_row.score, 'DRAFT', 'FINAL', v_uid);
    UPDATE public.submissions SET status = 'GRADED' WHERE id = p_submission;

    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, after_json)
    VALUES (v_uid, 'LECTURER', 'grade.finalize', 'grades', v_row.id, 'CLASS', v_a.class_id,
            jsonb_build_object('score', v_row.score, 'max_score', v_row.max_score));
    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.save_grade_draft(uuid, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finalize_grade(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_grade_draft(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_grade(uuid) TO authenticated;
