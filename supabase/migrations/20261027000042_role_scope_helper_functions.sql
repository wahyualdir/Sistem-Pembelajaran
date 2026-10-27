-- Migration: Helper Functions Otorisasi Scope Peran Baru (Fase 1.1)
-- Rollback:
--   DROP FUNCTION IF EXISTS public.is_lab_head_of_class(uuid);
--   DROP FUNCTION IF EXISTS public.is_lab_head(uuid);
--   DROP FUNCTION IF EXISTS public.is_dean_of_program(uuid);
--   DROP FUNCTION IF EXISTS public.is_program_secretary(uuid);

-- 1. Helper is_program_secretary
CREATE OR REPLACE FUNCTION public.is_program_secretary(p_program_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = (SELECT auth.uid())
          AND r.code = 'PROGRAM_SECRETARY'
          AND ur.status = 'ACTIVE'
          AND (ur.scope_type = 'GLOBAL' OR (ur.scope_type = 'PROGRAM' AND ur.scope_id = p_program_id))
          AND (ur.valid_until IS NULL OR ur.valid_until > now())
    );
$$;

-- 2. Helper is_dean_of_program (mengecek wewenang Dekan atas fakultas yang menaungi program studi)
CREATE OR REPLACE FUNCTION public.is_dean_of_program(p_program_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        JOIN public.programs p ON p.id = p_program_id
        WHERE ur.user_id = (SELECT auth.uid())
          AND r.code = 'DEAN'
          AND ur.status = 'ACTIVE'
          AND (ur.scope_type = 'GLOBAL' OR (ur.scope_type = 'FACULTY' AND ur.scope_id = p.faculty_id))
          AND (ur.valid_until IS NULL OR ur.valid_until > now())
    );
$$;

-- 3. Helper is_lab_head (mengecek wewenang Kepala Lab untuk suatu laboratorium)
CREATE OR REPLACE FUNCTION public.is_lab_head(p_lab_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = (SELECT auth.uid())
          AND r.code = 'LAB_HEAD'
          AND ur.status = 'ACTIVE'
          AND (ur.scope_type = 'GLOBAL' OR (ur.scope_type = 'LAB' AND ur.scope_id = p_lab_id))
          AND (ur.valid_until IS NULL OR ur.valid_until > now())
    );
$$;

-- 4. Helper is_lab_head_of_class (mengecek apakah user adalah Kepala Lab dari lab yang menaungi kelas praktikum tersebut)
CREATE OR REPLACE FUNCTION public.is_lab_head_of_class(p_class_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.class_laboratories cl
        JOIN public.laboratories l ON l.id = cl.laboratory_id
        JOIN public.user_roles ur ON (ur.scope_type = 'GLOBAL' OR (ur.scope_type = 'LAB' AND ur.scope_id = l.id))
        JOIN public.roles r ON r.id = ur.role_id
        WHERE cl.class_id = p_class_id
          AND ur.user_id = (SELECT auth.uid())
          AND r.code = 'LAB_HEAD'
          AND ur.status = 'ACTIVE'
          AND (ur.valid_until IS NULL OR ur.valid_until > now())
    );
$$;

-- Hak Eksekusi
REVOKE ALL ON FUNCTION public.is_program_secretary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_program_secretary(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_dean_of_program(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_dean_of_program(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_lab_head(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_lab_head(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_lab_head_of_class(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_lab_head_of_class(uuid) TO authenticated;
