-- Migration: Tabel, Helper, dan Kebijakan RLS Perwalian Akademik (Dosen Wali) (Fase 2)
-- Rollback:
--   DROP FUNCTION IF EXISTS public.assign_academic_advisor(uuid, uuid, uuid, integer, uuid);
--   DROP FUNCTION IF EXISTS public.advisor_of_current_student();
--   DROP FUNCTION IF EXISTS public.is_advisor_of(uuid);
--   DROP TABLE IF EXISTS public.advisory_notes CASCADE;
--   DROP TABLE IF EXISTS public.academic_advisories CASCADE;

-- 1. Tabel academic_advisories
CREATE TABLE IF NOT EXISTS public.academic_advisories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    student_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
    angkatan INTEGER,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ENDED')),
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indeks unik parsial: 1 mahasiswa hanya punya 1 Dosen Wali berstatus ACTIVE
CREATE UNIQUE INDEX IF NOT EXISTS idx_academic_advisories_unique_active_student
ON public.academic_advisories (student_user_id)
WHERE (status = 'ACTIVE');

CREATE INDEX IF NOT EXISTS idx_academic_advisories_advisor
ON public.academic_advisories (advisor_user_id, status);

CREATE INDEX IF NOT EXISTS idx_academic_advisories_program
ON public.academic_advisories (program_id);

CREATE INDEX IF NOT EXISTS idx_academic_advisories_angkatan
ON public.academic_advisories (angkatan);

-- 2. Tabel advisory_notes
CREATE TABLE IF NOT EXISTS public.advisory_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisory_id UUID NOT NULL REFERENCES public.academic_advisories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    note_for_student TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advisory_notes_advisory
ON public.advisory_notes (advisory_id);

CREATE INDEX IF NOT EXISTS idx_advisory_notes_author
ON public.advisory_notes (author_id);

-- 3. Helper Functions Otorisasi
CREATE OR REPLACE FUNCTION public.is_advisor_of(p_student_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.academic_advisories
        WHERE student_user_id = p_student_id
          AND advisor_user_id = (SELECT auth.uid())
          AND status = 'ACTIVE'
          AND (valid_until IS NULL OR valid_until > now())
    );
$$;

REVOKE ALL ON FUNCTION public.is_advisor_of(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_advisor_of(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.advisor_of_current_student()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT advisor_user_id
    FROM public.academic_advisories
    WHERE student_user_id = (SELECT auth.uid())
      AND status = 'ACTIVE'
      AND (valid_until IS NULL OR valid_until > now())
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.advisor_of_current_student() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.advisor_of_current_student() TO authenticated;

-- Fungsi atomik penetapan / pergantian wali
CREATE OR REPLACE FUNCTION public.assign_academic_advisor(
    p_student_id uuid,
    p_advisor_id uuid,
    p_program_id uuid DEFAULT NULL,
    p_angkatan integer DEFAULT NULL,
    p_assigned_by uuid DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_new_id uuid;
    v_actor uuid := COALESCE(p_assigned_by, (SELECT auth.uid()));
BEGIN
    -- 1. Akhiri perwalian aktif sebelumnya bila ada
    UPDATE public.academic_advisories
    SET status = 'ENDED',
        valid_until = now(),
        updated_at = now()
    WHERE student_user_id = p_student_id
      AND status = 'ACTIVE';

    -- 2. Buat relasi perwalian aktif baru
    INSERT INTO public.academic_advisories (
        advisor_user_id,
        student_user_id,
        program_id,
        angkatan,
        valid_from,
        status,
        assigned_by
    ) VALUES (
        p_advisor_id,
        p_student_id,
        p_program_id,
        p_angkatan,
        now(),
        'ACTIVE',
        v_actor
    ) RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_academic_advisor(uuid, uuid, uuid, integer, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_academic_advisor(uuid, uuid, uuid, integer, uuid) TO authenticated;

-- 4. Row Level Security (RLS)
ALTER TABLE public.academic_advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_notes ENABLE ROW LEVEL SECURITY;

-- Policy academic_advisories SELECT:
-- Dosen Wali (hanya bimbingannya), Mahasiswa (hanya dirinya), Kaprodi & Sekprodi (programnya), Staf & Super Admin
CREATE POLICY academic_advisories_select ON public.academic_advisories
FOR SELECT TO authenticated
USING (
    advisor_user_id = (SELECT auth.uid())
    OR student_user_id = (SELECT auth.uid())
    OR (program_id IS NOT NULL AND (
        public.is_program_coordinator(program_id)
        OR public.is_program_secretary(program_id)
    ))
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
);

-- Policy academic_advisories INSERT / UPDATE / DELETE:
-- Kaprodi, Sekprodi, Staf Akademik, Super Admin
CREATE POLICY academic_advisories_write ON public.academic_advisories
FOR ALL TO authenticated
USING (
    (program_id IS NOT NULL AND (
        public.is_program_coordinator(program_id)
        OR public.is_program_secretary(program_id)
    ))
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
)
WITH CHECK (
    (program_id IS NOT NULL AND (
        public.is_program_coordinator(program_id)
        OR public.is_program_secretary(program_id)
    ))
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
);

-- Policy advisory_notes SELECT:
-- Catatan internal dibaca oleh penulis (wali), wali aktif saat ini, Kaprodi & Sekprodi prodi terkait, Staf & Super Admin
CREATE POLICY advisory_notes_select ON public.advisory_notes
FOR SELECT TO authenticated
USING (
    author_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.academic_advisories a
        WHERE a.id = advisory_id
          AND (
              a.advisor_user_id = (SELECT auth.uid())
              OR (a.program_id IS NOT NULL AND (
                  public.is_program_coordinator(a.program_id)
                  OR public.is_program_secretary(a.program_id)
              ))
          )
    )
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
);

-- Policy advisory_notes INSERT / UPDATE / DELETE:
CREATE POLICY advisory_notes_write ON public.advisory_notes
FOR ALL TO authenticated
USING (
    author_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.academic_advisories a
        WHERE a.id = advisory_id
          AND (
              a.advisor_user_id = (SELECT auth.uid())
              OR (a.program_id IS NOT NULL AND (
                  public.is_program_coordinator(a.program_id)
                  OR public.is_program_secretary(a.program_id)
              ))
          )
    )
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
)
WITH CHECK (
    author_id = (SELECT auth.uid())
    OR public.has_global_role('SUPER_ADMIN')
);
