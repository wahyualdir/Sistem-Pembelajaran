-- Migration: Tipe Asisten (Asisten Dosen & Asisten Lab) serta Delegasi Penugasan oleh Staf Akademik dan Dosen
-- 1. Tambah kolom assistant_type pada class_assistants
ALTER TABLE public.class_assistants
ADD COLUMN IF NOT EXISTS assistant_type VARCHAR(20) NOT NULL DEFAULT 'ASISTEN_DOSEN'
CHECK (assistant_type IN ('ASISTEN_DOSEN', 'ASISTEN_LAB'));

-- 2. Perbarui policy class_assistants_select agar Staf Akademik dan Super Admin dapat melihat asisten kelas
DROP POLICY IF EXISTS class_assistants_select ON public.class_assistants;
CREATE POLICY class_assistants_select ON public.class_assistants
FOR SELECT TO authenticated
USING (
    public.is_class_lecturer(class_id)
    OR user_id = (SELECT auth.uid())
    OR public.has_active_role('ACADEMIC_STAFF')
    OR public.has_active_role('SUPER_ADMIN')
    OR public.is_enrolled(class_id)
);

-- 3. Perbarui fungsi set_assistant dengan parameter assistant_type dan otorisasi Dosen serta Staf Akademik
CREATE OR REPLACE FUNCTION public.set_assistant(
    p_class uuid,
    p_identifier text,
    p_permissions text[],
    p_assistant_type text DEFAULT 'ASISTEN_DOSEN'
)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_ident text := lower(trim(COALESCE(p_identifier, '')));
    v_user uuid;
    v_role uuid;
    v_perm text;
    v_perms text[] := ARRAY(SELECT DISTINCT x FROM unnest(COALESCE(p_permissions, ARRAY[]::text[])) AS x);
    v_type text := COALESCE(p_assistant_type, 'ASISTEN_DOSEN');
    v_is_lecturer boolean;
    v_is_staff boolean;
    v_actor_role text;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    
    v_is_lecturer := public.is_class_lecturer(p_class);
    v_is_staff := public.has_active_role('ACADEMIC_STAFF') OR public.has_active_role('SUPER_ADMIN');
    
    -- Validasi tipe asisten
    IF v_type NOT IN ('ASISTEN_DOSEN', 'ASISTEN_LAB') THEN
        RAISE EXCEPTION 'INVALID_ASSISTANT_TYPE';
    END IF;

    -- Aturan Wewenang:
    -- Asisten Dosen langsung dari Dosen (atau Super Admin).
    -- Asisten Lab dapat ditugaskan oleh Staf Akademik dan Dosen.
    IF v_type = 'ASISTEN_DOSEN' AND NOT (v_is_lecturer OR public.has_active_role('SUPER_ADMIN')) THEN
        RAISE EXCEPTION 'FORBIDDEN_DOSEN_ONLY';
    END IF;

    IF v_type = 'ASISTEN_LAB' AND NOT (v_is_lecturer OR v_is_staff) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    IF v_is_lecturer THEN
        v_actor_role := 'LECTURER';
    ELSIF v_is_staff THEN
        v_actor_role := 'ACADEMIC_STAFF';
    ELSE
        v_actor_role := 'SUPER_ADMIN';
    END IF;

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
        VALUES (v_uid, v_actor_role, 'role.revoke', 'class_assistants', v_user, 'CLASS', p_class);
        RETURN 0;
    END IF;

    UPDATE public.user_roles SET status = 'ACTIVE', valid_until = NULL, granted_by = v_uid
    WHERE user_id = v_user AND role_id = v_role AND scope_type = 'CLASS' AND scope_id = p_class;
    IF NOT FOUND THEN
        INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, granted_by)
        VALUES (v_user, v_role, 'CLASS', p_class, v_uid);
    END IF;

    INSERT INTO public.class_assistants (class_id, user_id, permission, granted_by, assistant_type)
    SELECT p_class, v_user, x, v_uid, v_type FROM unnest(v_perms) AS x;

    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, after_json)
    VALUES (v_uid, v_actor_role, 'role.assign', 'class_assistants', v_user, 'CLASS', p_class, 
            jsonb_build_object('permissions', v_perms, 'assistant_type', v_type));

    RETURN array_length(v_perms, 1);
END;
$$;

-- Backward-compatible overload for 3-argument call
CREATE OR REPLACE FUNCTION public.set_assistant(p_class uuid, p_identifier text, p_permissions text[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    RETURN public.set_assistant(p_class, p_identifier, p_permissions, 'ASISTEN_DOSEN');
END;
$$;

REVOKE ALL ON FUNCTION public.set_assistant(uuid, text, text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_assistant(uuid, text, text[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_assistant(uuid, text, text[]) TO authenticated;
