-- SIAJAR Migration: Delegasi izin asisten dosen per kelas (Bagian 2.1, 7.3; matriks A4, A5, A13, A14)
-- Dosen menugaskan asisten (role TEACHING_ASSISTANT, scope CLASS) dan memilih izin yang didelegasikan.
-- grade.finalize, grade.change_request, dan class.assign_staff tidak dapat didelegasikan (tidak ada di daftar izin).
-- class_assistants menggantikan class_staff_permissions pada rencana; keanggotaan tetap lewat user_roles.

CREATE TABLE IF NOT EXISTS public.class_assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL CHECK (permission IN ('material.manage', 'announcement.manage', 'assignment.create', 'submission.review', 'assignment.grade')),
    granted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_class_assistants UNIQUE (class_id, user_id, permission)
);
CREATE INDEX IF NOT EXISTS idx_class_assistants_user ON public.class_assistants(user_id);
ALTER TABLE public.class_assistants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_ta_permission(p_class_id uuid, p_code text)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.class_assistants ca
        JOIN public.user_roles ur ON ur.user_id = ca.user_id AND ur.scope_type = 'CLASS' AND ur.scope_id = ca.class_id
             AND ur.status = 'ACTIVE' AND (ur.valid_until IS NULL OR ur.valid_until > now())
        JOIN public.roles r ON r.id = ur.role_id AND r.code = 'TEACHING_ASSISTANT'
        WHERE ca.class_id = p_class_id AND ca.user_id = (SELECT auth.uid()) AND ca.permission = p_code
    );
$$;

CREATE OR REPLACE FUNCTION public.can_staff(p_class_id uuid, p_code text)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT public.is_class_lecturer(p_class_id) OR public.has_ta_permission(p_class_id, p_code);
$$;

DROP POLICY IF EXISTS class_assistants_select ON public.class_assistants;
CREATE POLICY class_assistants_select ON public.class_assistants
FOR SELECT TO authenticated
USING (public.is_class_lecturer(class_id) OR user_id = (SELECT auth.uid()));

-- Asisten membaca pengumpulan dan nilai hanya bila diberi izin.
DROP POLICY IF EXISTS submissions_select ON public.submissions;
CREATE POLICY submissions_select ON public.submissions
FOR SELECT TO authenticated
USING (student_id = (SELECT auth.uid()) OR public.can_staff(public.assignment_class(assignment_id), 'submission.review'));

DROP POLICY IF EXISTS grades_select ON public.grades;
CREATE POLICY grades_select ON public.grades
FOR SELECT TO authenticated
USING (
    public.is_class_lecturer(class_id)
    OR public.has_ta_permission(class_id, 'submission.review')
    OR public.has_ta_permission(class_id, 'assignment.grade')
    OR (is_visible_to_student AND student_id = (SELECT auth.uid()))
);

-- Fungsi yang dapat didelegasikan: izin dosen ATAU izin asisten yang sesuai.
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
    IF v_uid IS NULL OR NOT public.can_staff(v_a.class_id, 'assignment.grade') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    IF v_sub.student_id = v_uid THEN RAISE EXCEPTION 'SELF_REVIEW'; END IF;
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

CREATE OR REPLACE FUNCTION public.create_assignment(p_class uuid, p_title text, p_description text, p_due timestamptz, p_close timestamptz)
RETURNS public.assignments LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_row public.assignments;
BEGIN
    IF v_uid IS NULL OR NOT public.can_staff(p_class, 'assignment.create') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    IF p_close < p_due THEN RAISE EXCEPTION 'INVALID_DATES'; END IF;
    INSERT INTO public.assignments (class_id, title, description, due_at, close_at, created_by)
    VALUES (p_class, trim(p_title), COALESCE(trim(p_description), ''), p_due, p_close, v_uid)
    RETURNING * INTO v_row;
    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id)
    VALUES (v_uid, CASE WHEN public.is_class_lecturer(p_class) THEN 'LECTURER' ELSE 'TEACHING_ASSISTANT' END,
            'assignment.create', 'assignments', v_row.id, 'CLASS', p_class);
    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_material(p_class uuid, p_title text, p_body text DEFAULT '')
RETURNS public.materials LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_row public.materials;
BEGIN
    IF v_uid IS NULL OR NOT public.can_staff(p_class, 'material.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    INSERT INTO public.materials (class_id, title, body_md, created_by)
    VALUES (p_class, trim(p_title), COALESCE(trim(p_body), ''), v_uid)
    RETURNING * INTO v_row;
    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id)
    VALUES (v_uid, CASE WHEN public.is_class_lecturer(p_class) THEN 'LECTURER' ELSE 'TEACHING_ASSISTANT' END,
            'material.create', 'materials', v_row.id, 'CLASS', p_class);
    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_announcement(p_class uuid, p_title text, p_body text DEFAULT '')
RETURNS public.announcements LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_row public.announcements;
BEGIN
    IF v_uid IS NULL OR NOT public.can_staff(p_class, 'announcement.manage') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    INSERT INTO public.announcements (class_id, author_id, title, body)
    VALUES (p_class, v_uid, trim(p_title), COALESCE(trim(p_body), ''))
    RETURNING * INTO v_row;
    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id)
    VALUES (v_uid, CASE WHEN public.is_class_lecturer(p_class) THEN 'LECTURER' ELSE 'TEACHING_ASSISTANT' END,
            'announcement.create', 'announcements', v_row.id, 'CLASS', p_class);
    RETURN v_row;
END;
$$;

-- Dosen menetapkan asisten: daftar izin kosong mencabut penugasan. Pengguna dicari lewat email atau identifier (NIM/NIDN/NIP).
CREATE OR REPLACE FUNCTION public.set_assistant(p_class uuid, p_identifier text, p_permissions text[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_ident text := lower(trim(COALESCE(p_identifier, '')));
    v_user uuid;
    v_role uuid;
    v_perm text;
    v_perms text[] := ARRAY(SELECT DISTINCT x FROM unnest(COALESCE(p_permissions, ARRAY[]::text[])) AS x);
BEGIN
    IF v_uid IS NULL OR NOT public.is_class_lecturer(p_class) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    FOREACH v_perm IN ARRAY v_perms LOOP
        IF v_perm NOT IN ('material.manage', 'announcement.manage', 'assignment.create', 'submission.review', 'assignment.grade') THEN
            RAISE EXCEPTION 'INVALID_PERMISSION';
        END IF;
    END LOOP;
    v_user := (
        SELECT id FROM (
            SELECT p.id FROM public.profiles p WHERE lower(p.email) = v_ident AND p.status = 'ACTIVE'
            UNION
            SELECT ui.user_id FROM public.user_identifiers ui
            JOIN public.profiles p2 ON p2.id = ui.user_id AND p2.status = 'ACTIVE' WHERE lower(ui.value) = v_ident
        ) q LIMIT 1
    );
    IF v_user IS NULL THEN RAISE EXCEPTION 'USER_NOT_FOUND'; END IF;
    IF v_user = v_uid THEN RAISE EXCEPTION 'INVALID_ASSISTANT'; END IF;
    SELECT id INTO v_role FROM public.roles WHERE code = 'TEACHING_ASSISTANT';
    IF v_role IS NULL THEN RAISE EXCEPTION 'ROLE_MISSING'; END IF;

    DELETE FROM public.class_assistants WHERE class_id = p_class AND user_id = v_user;
    IF COALESCE(array_length(v_perms, 1), 0) = 0 THEN
        UPDATE public.user_roles SET status = 'REVOKED'
        WHERE user_id = v_user AND role_id = v_role AND scope_type = 'CLASS' AND scope_id = p_class;
        INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id)
        VALUES (v_uid, 'LECTURER', 'role.revoke', 'class_assistants', v_user, 'CLASS', p_class);
        RETURN 0;
    END IF;

    UPDATE public.user_roles SET status = 'ACTIVE', valid_until = NULL, granted_by = v_uid
    WHERE user_id = v_user AND role_id = v_role AND scope_type = 'CLASS' AND scope_id = p_class;
    IF NOT FOUND THEN
        INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, granted_by)
        VALUES (v_user, v_role, 'CLASS', p_class, v_uid);
    END IF;
    INSERT INTO public.class_assistants (class_id, user_id, permission, granted_by)
    SELECT p_class, v_user, x, v_uid FROM unnest(v_perms) AS x;
    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, after_json)
    VALUES (v_uid, 'LECTURER', 'role.assign', 'class_assistants', v_user, 'CLASS', p_class, jsonb_build_object('permissions', v_perms));
    RETURN array_length(v_perms, 1);
END;
$$;

REVOKE ALL ON FUNCTION public.has_ta_permission(uuid, text), public.can_staff(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_assistant(uuid, text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_ta_permission(uuid, text), public.can_staff(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_assistant(uuid, text, text[]) TO authenticated;
