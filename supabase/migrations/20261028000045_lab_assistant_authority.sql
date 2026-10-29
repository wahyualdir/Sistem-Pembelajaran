-- Migration: Reformasi Wewenang Asisten Lab (Fase 4.1)
-- Rollback:
--   DROP FUNCTION IF EXISTS public.set_assistant(uuid, text, text[], text);
--   Kembalikan policy class_assistants_select ke versi sebelumnya.

-- 1. Perbarui policy class_assistants_select agar mencakup Kepala Lab kelas terkait
DROP POLICY IF EXISTS class_assistants_select ON public.class_assistants;
CREATE POLICY class_assistants_select ON public.class_assistants
FOR SELECT TO authenticated
USING (
    public.is_class_lecturer(class_id)
    OR user_id = (SELECT auth.uid())
    OR public.has_active_role('ACADEMIC_STAFF')
    OR public.has_active_role('SUPER_ADMIN')
    OR public.is_enrolled(class_id)
    OR public.is_lab_head_of_class(class_id)
);

-- 2. CREATE OR REPLACE FUNCTION public.set_assistant dengan pembatasan wewenang ketat
DROP FUNCTION IF EXISTS public.set_assistant(uuid, text, text[]);
CREATE OR REPLACE FUNCTION public.set_assistant(
    p_class uuid,
    p_identifier text,
    p_permissions text[],
    p_assistant_type text DEFAULT 'ASISTEN_DOSEN'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_ident text := lower(trim(COALESCE(p_identifier, '')));
    v_user uuid;
    v_role uuid;
    v_perm text;
    v_perms text[] := ARRAY(SELECT DISTINCT x FROM unnest(COALESCE(p_permissions, ARRAY[]::text[])) AS x);
    v_type text := COALESCE(p_assistant_type, 'ASISTEN_DOSEN');
    v_is_lecturer boolean;
    v_is_lab_head boolean;
    v_actor_role text;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;
    
    v_is_lecturer := public.is_class_lecturer(p_class);
    v_is_lab_head := public.is_lab_head_of_class(p_class);
    
    -- Validasi tipe asisten
    IF v_type NOT IN ('ASISTEN_DOSEN', 'ASISTEN_LAB') THEN
        RAISE EXCEPTION 'INVALID_ASSISTANT_TYPE';
    END IF;

    -- Aturan Wewenang Baru (Fase 4.1):
    -- Asisten Dosen: Dosen Pengampu kelas itu ATAU Super Admin.
    -- Asisten Lab: Dosen Pengampu kelas itu ATAU Kepala Lab kelas terkait (is_lab_head_of_class).
    -- Jalur ACADEMIC_STAFF dan SUPER_ADMIN untuk ASISTEN_LAB dihapus.
    IF v_type = 'ASISTEN_DOSEN' THEN
        IF NOT (v_is_lecturer OR public.has_active_role('SUPER_ADMIN')) THEN
            RAISE EXCEPTION 'FORBIDDEN';
        END IF;

        IF v_is_lecturer THEN
            v_actor_role := 'LECTURER';
        ELSE
            v_actor_role := 'SUPER_ADMIN';
        END IF;
    ELSIF v_type = 'ASISTEN_LAB' THEN
        IF NOT (v_is_lecturer OR v_is_lab_head) THEN
            RAISE EXCEPTION 'FORBIDDEN';
        END IF;

        -- Merangkap dosen pengampu dan Kepala Lab dicatat LECTURER
        IF v_is_lecturer THEN
            v_actor_role := 'LECTURER';
        ELSE
            v_actor_role := 'LAB_HEAD';
        END IF;
    END IF;

    -- Validasi daftar izin
    FOREACH v_perm IN ARRAY v_perms LOOP
        IF v_perm NOT IN ('material.manage', 'announcement.manage', 'assignment.create', 'submission.review', 'assignment.grade') THEN
            RAISE EXCEPTION 'INVALID_PERMISSION';
        END IF;
    END LOOP;

    -- Cari user asisten berdasarkan email atau identifier
    v_user := (
        SELECT id FROM (
            SELECT p.id FROM public.profiles p WHERE lower(p.email) = v_ident AND p.status = 'ACTIVE'
            UNION
            SELECT ui.user_id FROM public.user_identifiers ui
            JOIN public.profiles p2 ON p2.id = ui.user_id AND p2.status = 'ACTIVE' WHERE lower(ui.value) = v_ident
        ) q LIMIT 1
    );
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'USER_NOT_FOUND';
    END IF;
    IF v_user = v_uid THEN
        RAISE EXCEPTION 'INVALID_ASSISTANT';
    END IF;

    SELECT id INTO v_role FROM public.roles WHERE code = 'TEACHING_ASSISTANT';
    IF v_role IS NULL THEN
        RAISE EXCEPTION 'ROLE_MISSING';
    END IF;

    -- Hapus izin lama pada kelas ini
    DELETE FROM public.class_assistants WHERE class_id = p_class AND user_id = v_user;
    
    -- Jika daftar izin kosong, lakukan pencabutan
    IF COALESCE(array_length(v_perms, 1), 0) = 0 THEN
        UPDATE public.user_roles SET status = 'REVOKED'
        WHERE user_id = v_user AND role_id = v_role AND scope_type = 'CLASS' AND scope_id = p_class;
        
        INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id)
        VALUES (v_uid, v_actor_role, 'role.revoke', 'class_assistants', v_user, 'CLASS', p_class);
        
        RETURN 0;
    END IF;

    -- Update atau buat penugasan aktif
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

REVOKE ALL ON FUNCTION public.set_assistant(uuid, text, text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_assistant(uuid, text, text[], text) TO authenticated;
