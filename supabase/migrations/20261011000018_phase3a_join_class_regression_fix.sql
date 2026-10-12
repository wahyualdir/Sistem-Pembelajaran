-- SIAJAR Migration: Phase 3A Fix join_class_by_code Regression (G1)
-- Perbaikan: join_class_by_code gagal untuk mahasiswa berstatus DROPPED karena trigger tr_enrollments_protect_sensitive.
-- Mekanisme: set_config('app.rpc_context', 'on', true) sebelum penulisan dan kembalikan ke '' setelahnya.

BEGIN;

CREATE OR REPLACE FUNCTION public.join_class_by_code(p_code text)
RETURNS public.classes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_class public.classes;
    v_count int;
    v_id uuid;
BEGIN
    IF v_uid IS NULL OR NOT public.has_active_role('STUDENT') THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    SELECT * INTO v_class FROM public.classes
    WHERE join_code = upper(trim(p_code)) AND deleted_at IS NULL AND status = 'OPEN'
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CODE_INVALID';
    END IF;

    SELECT count(*) INTO v_count FROM public.enrollments WHERE class_id = v_class.id AND status = 'ACTIVE';
    IF v_class.capacity IS NOT NULL AND v_count >= v_class.capacity THEN
        RAISE EXCEPTION 'CLASS_FULL';
    END IF;

    -- Buka konteks RPC agar trigger tr_enrollments_protect_sensitive mengizinkan pembaruan status
    PERFORM set_config('app.rpc_context', 'on', true);

    INSERT INTO public.enrollments (class_id, student_id) VALUES (v_class.id, v_uid)
    ON CONFLICT (class_id, student_id) DO UPDATE
        SET status = 'ACTIVE', dropped_at = NULL, enrolled_at = now()
        WHERE public.enrollments.status = 'DROPPED'
    RETURNING id INTO v_id;

    -- Segera kembalikan rpc_context ke '' setelah penulisan selesai
    PERFORM set_config('app.rpc_context', '', true);

    IF v_id IS NULL THEN
        RAISE EXCEPTION 'ALREADY_ENROLLED';
    END IF;

    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id)
    VALUES (v_uid, 'STUDENT', 'enrollment.join', 'enrollments', v_id, 'CLASS', v_class.id);

    RETURN v_class;
END;
$$;

-- Hak akses eksekusi join_class_by_code
REVOKE ALL ON FUNCTION public.join_class_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(text) TO authenticated, service_role;

COMMIT;
