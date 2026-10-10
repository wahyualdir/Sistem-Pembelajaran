-- SIAJAR Migration: Materi kelas (Bagian 5.1, 6.4). body_md ditampilkan sebagai teks biasa
-- sampai render Markdown tersanitasi tersedia. Terbit langsung; DRAFT/HIDDEN disiapkan untuk jadwal terbit.

DO $$ BEGIN
    CREATE TYPE public.material_status AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
    body_md TEXT NOT NULL DEFAULT '' CHECK (char_length(body_md) <= 20000),
    status public.material_status NOT NULL DEFAULT 'PUBLISHED',
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_materials_class ON public.materials(class_id, created_at DESC);

DROP TRIGGER IF EXISTS tr_materials_updated_at ON public.materials;
CREATE TRIGGER tr_materials_updated_at BEFORE UPDATE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS materials_select ON public.materials;
CREATE POLICY materials_select ON public.materials
FOR SELECT TO authenticated
USING (public.is_class_staff(class_id) OR (status = 'PUBLISHED' AND public.is_enrolled(class_id)));

CREATE OR REPLACE FUNCTION public.create_material(p_class uuid, p_title text, p_body text DEFAULT '')
RETURNS public.materials LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_row public.materials;
BEGIN
    IF v_uid IS NULL OR NOT public.is_class_lecturer(p_class) THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;
    INSERT INTO public.materials (class_id, title, body_md, created_by)
    VALUES (p_class, trim(p_title), COALESCE(trim(p_body), ''), v_uid)
    RETURNING * INTO v_row;
    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id)
    VALUES (v_uid, 'LECTURER', 'material.create', 'materials', v_row.id, 'CLASS', p_class);
    RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_notify_material() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NEW.status = 'PUBLISHED' THEN
        INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id, class_id)
        SELECT e.student_id, 'MATERIAL_NEW', 'Materi baru: ' || NEW.title, 'Buka kelas untuk membacanya.', 'materials', NEW.id, NEW.class_id
        FROM public.enrollments e WHERE e.class_id = NEW.class_id AND e.status = 'ACTIVE';
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_materials_notify ON public.materials;
CREATE TRIGGER tr_materials_notify AFTER INSERT ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_material();

REVOKE ALL ON FUNCTION public.fn_notify_material() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_material(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_material(uuid, text, text) TO authenticated;
