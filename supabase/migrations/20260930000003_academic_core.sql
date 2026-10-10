-- SIAJAR Migration: Akademik inti — kelas dan enrollment (vertical slice Bagian 13)
-- Spesifikasi: Bagian 6.3, 8.3, 23.3-23.4. course_id dan semester_id menyusul bersama master data (Phase 3).

DO $$ BEGIN
    CREATE TYPE public.class_status AS ENUM ('DRAFT', 'OPEN', 'ACTIVE', 'CLOSED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.enrollment_status AS ENUM ('ACTIVE', 'DROPPED', 'COMPLETED', 'REMOVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
    section TEXT NOT NULL DEFAULT 'A' CHECK (char_length(section) BETWEEN 1 AND 20),
    join_code CHAR(8) NOT NULL UNIQUE,
    capacity SMALLINT NULL CHECK (capacity IS NULL OR capacity > 0),
    status public.class_status NOT NULL DEFAULT 'OPEN',
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status public.enrollment_status NOT NULL DEFAULT 'ACTIVE',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    dropped_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_enrollments_class_student UNIQUE (class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_classes_status ON public.classes(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id, status);

DROP TRIGGER IF EXISTS tr_classes_updated_at ON public.classes;
CREATE TRIGGER tr_classes_updated_at BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Tulis hanya lewat RPC di bawah (deny-by-default untuk INSERT/UPDATE/DELETE langsung).
DROP POLICY IF EXISTS classes_select ON public.classes;
CREATE POLICY classes_select ON public.classes
FOR SELECT TO authenticated
USING (
    deleted_at IS NULL
    AND (public.is_enrolled(id) OR public.is_class_staff(id) OR public.has_global_role('ACADEMIC_STAFF'))
);

DROP POLICY IF EXISTS enrollments_select ON public.enrollments;
CREATE POLICY enrollments_select ON public.enrollments
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
);

-- Pemeriksaan role aktif apa pun scope-nya (role Mahasiswa/Dosen pada seed bisa GLOBAL maupun CLASS).
CREATE OR REPLACE FUNCTION public.has_active_role(p_role_code text)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = (SELECT auth.uid())
          AND r.code = p_role_code
          AND ur.status = 'ACTIVE'
          AND (ur.valid_until IS NULL OR ur.valid_until > now())
    );
$$;

CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS text LANGUAGE plpgsql VOLATILE SET search_path = '' AS $$
DECLARE
    alphabet CONSTANT text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    code text;
BEGIN
    LOOP
        SELECT string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), '')
        INTO code FROM generate_series(1, 8);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.classes WHERE join_code = code);
    END LOOP;
    RETURN code;
END;
$$;

-- Dosen membuat kelas: kelas + penugasan LECTURER (scope CLASS) + audit dalam satu transaksi.
CREATE OR REPLACE FUNCTION public.create_class(p_title text, p_section text DEFAULT 'A', p_capacity smallint DEFAULT NULL)
RETURNS public.classes LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_class public.classes;
    v_role uuid;
BEGIN
    IF v_uid IS NULL OR NOT public.has_active_role('LECTURER') THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    INSERT INTO public.classes (title, section, join_code, capacity, created_by)
    VALUES (trim(p_title), trim(COALESCE(p_section, 'A')), public.generate_join_code(), p_capacity, v_uid)
    RETURNING * INTO v_class;

    SELECT id INTO v_role FROM public.roles WHERE code = 'LECTURER';
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, granted_by)
    VALUES (v_uid, v_role, 'CLASS', v_class.id, v_uid);

    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id, after_json)
    VALUES (v_uid, 'LECTURER', 'class.create', 'classes', v_class.id, 'CLASS', v_class.id,
            jsonb_build_object('title', v_class.title, 'section', v_class.section));

    RETURN v_class;
END;
$$;

-- Mahasiswa bergabung dengan kode: kunci baris kelas agar kapasitas dan duplikasi aman dari balapan data.
CREATE OR REPLACE FUNCTION public.join_class_by_code(p_code text)
RETURNS public.classes LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
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

    INSERT INTO public.enrollments (class_id, student_id) VALUES (v_class.id, v_uid)
    ON CONFLICT (class_id, student_id) DO UPDATE
        SET status = 'ACTIVE', dropped_at = NULL, enrolled_at = now()
        WHERE public.enrollments.status = 'DROPPED'
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN
        RAISE EXCEPTION 'ALREADY_ENROLLED';
    END IF;

    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, scope_type, scope_id)
    VALUES (v_uid, 'STUDENT', 'enrollment.join', 'enrollments', v_id, 'CLASS', v_class.id);

    RETURN v_class;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_join_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_class(text, text, smallint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_class_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_class(text, text, smallint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(text) TO authenticated;
