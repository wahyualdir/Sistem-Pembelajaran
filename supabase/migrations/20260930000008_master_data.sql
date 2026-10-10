-- SIAJAR Migration: Master data akademik minimal (Bagian 6.3, 12.1 MVP-1)
-- Tahun akademik dilipat ke label semester ("2026/2027 Ganjil"); tabel academic_years dan tanggal menyusul.
-- Data referensi terbaca semua pengguna login; tambah/ubah hanya Staf Akademik (tanpa DELETE, gunakan is_active).

CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE CHECK (char_length(code) BETWEEN 2 AND 20),
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 120),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL UNIQUE CHECK (char_length(label) BETWEEN 5 AND 40),
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
    code TEXT NOT NULL UNIQUE CHECK (char_length(code) BETWEEN 3 AND 20),
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 120),
    credits SMALLINT NOT NULL CHECK (credits BETWEEN 1 AND 6),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_courses_program ON public.courses(program_id);

ALTER TABLE public.classes
    ADD COLUMN IF NOT EXISTS course_id UUID NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS semester_id UUID NULL REFERENCES public.semesters(id) ON DELETE RESTRICT;

-- Pernyataan eksplisit agar terbaca oleh scripts/check-rls.ts (CI, Aturan Keras 1).
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['programs', 'semesters', 'courses'] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS tr_%1$s_updated_at ON public.%1$I', t);
        EXECUTE format('CREATE TRIGGER tr_%1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at()', t);
        EXECUTE format('DROP POLICY IF EXISTS %1$s_select ON public.%1$I', t);
        EXECUTE format('CREATE POLICY %1$s_select ON public.%1$I FOR SELECT TO authenticated USING (true)', t);
        EXECUTE format('DROP POLICY IF EXISTS %1$s_insert ON public.%1$I', t);
        EXECUTE format('CREATE POLICY %1$s_insert ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.has_active_role(''ACADEMIC_STAFF''))', t);
        EXECUTE format('DROP POLICY IF EXISTS %1$s_update ON public.%1$I', t);
        EXECUTE format('CREATE POLICY %1$s_update ON public.%1$I FOR UPDATE TO authenticated USING (public.has_active_role(''ACADEMIC_STAFF'')) WITH CHECK (public.has_active_role(''ACADEMIC_STAFF''))', t);
    END LOOP;
END $$;

-- create_class menerima mata kuliah dan semester opsional (nama bebas tetap didukung).
DROP FUNCTION IF EXISTS public.create_class(text, text, smallint);
CREATE OR REPLACE FUNCTION public.create_class(
    p_title text, p_section text DEFAULT 'A', p_capacity smallint DEFAULT NULL,
    p_course uuid DEFAULT NULL, p_semester uuid DEFAULT NULL)
RETURNS public.classes LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_class public.classes;
    v_role uuid;
BEGIN
    IF v_uid IS NULL OR NOT public.has_active_role('LECTURER') THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;
    IF p_course IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE id = p_course AND is_active) THEN
        RAISE EXCEPTION 'COURSE_NOT_FOUND';
    END IF;
    IF p_semester IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.semesters WHERE id = p_semester) THEN
        RAISE EXCEPTION 'SEMESTER_NOT_FOUND';
    END IF;

    INSERT INTO public.classes (title, section, join_code, capacity, created_by, course_id, semester_id)
    VALUES (trim(p_title), trim(COALESCE(p_section, 'A')), public.generate_join_code(), p_capacity, v_uid, p_course, p_semester)
    RETURNING * INTO v_class;

    SELECT id INTO v_role FROM public.roles WHERE code = 'LECTURER';
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, granted_by)
    VALUES (v_uid, v_role, 'CLASS', v_class.id, v_uid);

    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, after_json)
    VALUES (v_uid, 'LECTURER', 'class.create', 'classes', v_class.id, 'CLASS', v_class.id,
            jsonb_build_object('title', v_class.title, 'section', v_class.section, 'course_id', p_course, 'semester_id', p_semester));
    RETURN v_class;
END;
$$;
REVOKE ALL ON FUNCTION public.create_class(text, text, smallint, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_class(text, text, smallint, uuid, uuid) TO authenticated;
