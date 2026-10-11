-- SIAJAR Migration: Audit ekspor nilai (Bagian 15.5: unduhan massal dan ekspor laporan wajib tercatat)

CREATE OR REPLACE FUNCTION public.log_grade_export(p_class uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
BEGIN
    IF v_uid IS NULL OR NOT public.is_class_lecturer(p_class) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;
    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id)
    VALUES (v_uid, 'LECTURER', 'grade.export', 'classes', p_class, 'CLASS', p_class);
END;
$$;

REVOKE ALL ON FUNCTION public.log_grade_export(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_grade_export(uuid) TO authenticated;

-- Memastikan nilai enum EXECUTED telah terdaftar dan ter-commit sebelum migrasi 14
ALTER TYPE public.change_request_status ADD VALUE IF NOT EXISTS 'EXECUTED';

