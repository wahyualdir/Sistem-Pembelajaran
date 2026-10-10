-- SIAJAR Migration: Tugas dan pengumpulan (vertical slice Bagian 13, langkah 3-4)
-- Spesifikasi: Bagian 6.5, 8.1, 8.4. File lampiran, pengumpulan ulang, dan nilai menyusul.

DO $$ BEGIN
    CREATE TYPE public.assignment_status AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.submission_status AS ENUM ('DRAFT', 'SUBMITTED', 'RETURNED', 'REVIEWED', 'GRADED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
    description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 5000),
    due_at TIMESTAMPTZ NOT NULL,
    close_at TIMESTAMPTZ NOT NULL,
    max_score NUMERIC(6,2) NOT NULL DEFAULT 100,
    status public.assignment_status NOT NULL DEFAULT 'PUBLISHED',
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_assignments_due_close CHECK (due_at <= close_at)
);

CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    attempt_no SMALLINT NOT NULL DEFAULT 1,
    status public.submission_status NOT NULL DEFAULT 'SUBMITTED',
    text_body TEXT NOT NULL CHECK (char_length(text_body) BETWEEN 1 AND 20000),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_late BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_submissions_attempt UNIQUE (assignment_id, student_id, attempt_no)
);

CREATE INDEX IF NOT EXISTS idx_assignments_class ON public.assignments(class_id, due_at);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);

DROP TRIGGER IF EXISTS tr_assignments_updated_at ON public.assignments;
CREATE TRIGGER tr_assignments_updated_at BEFORE UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_class_lecturer(p_class_id uuid)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = (SELECT auth.uid()) AND r.code = 'LECTURER'
          AND ur.status = 'ACTIVE' AND ur.scope_type = 'CLASS' AND ur.scope_id = p_class_id
          AND (ur.valid_until IS NULL OR ur.valid_until > now())
    );
$$;

CREATE OR REPLACE FUNCTION public.assignment_class(p_assignment_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT class_id FROM public.assignments WHERE id = p_assignment_id;
$$;

-- Mahasiswa hanya melihat tugas terbit di kelasnya; asisten tanpa izin delegasi belum membaca pengumpulan.
DROP POLICY IF EXISTS assignments_select ON public.assignments;
CREATE POLICY assignments_select ON public.assignments
FOR SELECT TO authenticated
USING (public.is_class_staff(class_id) OR (status = 'PUBLISHED' AND public.is_enrolled(class_id)));

DROP POLICY IF EXISTS submissions_select ON public.submissions;
CREATE POLICY submissions_select ON public.submissions
FOR SELECT TO authenticated
USING (student_id = (SELECT auth.uid()) OR public.is_class_lecturer(public.assignment_class(assignment_id)));

CREATE OR REPLACE FUNCTION public.create_assignment(p_class uuid, p_title text, p_description text, p_due timestamptz, p_close timestamptz)
RETURNS public.assignments LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_row public.assignments;
BEGIN
    IF v_uid IS NULL OR NOT public.is_class_lecturer(p_class) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;
    IF p_close < p_due THEN
        RAISE EXCEPTION 'INVALID_DATES';
    END IF;

    INSERT INTO public.assignments (class_id, title, description, due_at, close_at, created_by)
    VALUES (p_class, trim(p_title), COALESCE(trim(p_description), ''), p_due, p_close, v_uid)
    RETURNING * INTO v_row;

    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id)
    VALUES (v_uid, 'LECTURER', 'assignment.create', 'assignments', v_row.id, 'CLASS', p_class);
    RETURN v_row;
END;
$$;

-- Waktu dievaluasi dengan jam server; klik ganda hanya menghasilkan satu pengumpulan (UNIQUE).
CREATE OR REPLACE FUNCTION public.submit_assignment(p_assignment uuid, p_text text)
RETURNS public.submissions LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_a public.assignments;
    v_row public.submissions;
BEGIN
    SELECT * INTO v_a FROM public.assignments WHERE id = p_assignment AND status = 'PUBLISHED';
    IF v_uid IS NULL OR NOT FOUND OR NOT public.is_enrolled(v_a.class_id) THEN
        RAISE EXCEPTION 'NOT_FOUND';
    END IF;
    IF now() > v_a.close_at THEN
        RAISE EXCEPTION 'CLOSED';
    END IF;

    INSERT INTO public.submissions (assignment_id, student_id, text_body, is_late)
    VALUES (p_assignment, v_uid, trim(p_text), now() > v_a.due_at)
    ON CONFLICT (assignment_id, student_id, attempt_no) DO NOTHING
    RETURNING * INTO v_row;
    IF v_row.id IS NULL THEN
        RAISE EXCEPTION 'ALREADY_SUBMITTED';
    END IF;

    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id)
    VALUES (v_uid, 'STUDENT', 'submission.submit', 'submissions', v_row.id, 'CLASS', v_a.class_id);
    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.is_class_lecturer(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assignment_class(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_assignment(uuid, text, text, timestamptz, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_assignment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_class_lecturer(uuid), public.assignment_class(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_assignment(uuid, text, text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_assignment(uuid, text) TO authenticated;
