-- Migration: Master Data Fakultas, Laboratorium, dan Relasi Kelas Praktikum (Fase 1.1)
-- Rollback:
--   DROP TABLE IF EXISTS public.class_laboratories CASCADE;
--   DROP TABLE IF EXISTS public.laboratories CASCADE;
--   ALTER TABLE public.programs DROP COLUMN IF EXISTS faculty_id CASCADE;
--   DROP TABLE IF EXISTS public.faculties CASCADE;

-- 1. Tabel faculties
CREATE TABLE IF NOT EXISTS public.faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tambah faculty_id ke tabel programs
ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS faculty_id UUID NULL REFERENCES public.faculties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_programs_faculty_id ON public.programs(faculty_id);

-- Backfill fakultas default (Fakultas Teknik) dan hubungkan program bawaan jika ada
INSERT INTO public.faculties (id, code, name, is_active)
VALUES ('20000000-0000-0000-0000-000000000001', 'FT', 'Fakultas Teknik', true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active;

UPDATE public.programs
SET faculty_id = '20000000-0000-0000-0000-000000000001'
WHERE faculty_id IS NULL;

-- 3. Tabel laboratories
CREATE TABLE IF NOT EXISTS public.laboratories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    room_id UUID NULL REFERENCES public.rooms(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_laboratories_program_id ON public.laboratories(program_id);
CREATE INDEX IF NOT EXISTS idx_laboratories_room_id ON public.laboratories(room_id);

-- 4. Tabel class_laboratories (penghubung kelas praktikum dengan laboratorium)
CREATE TABLE IF NOT EXISTS public.class_laboratories (
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    laboratory_id UUID NOT NULL REFERENCES public.laboratories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (class_id, laboratory_id)
);

CREATE INDEX IF NOT EXISTS idx_class_laboratories_lab_id ON public.class_laboratories(laboratory_id);

-- 5. Aktifkan RLS
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_laboratories ENABLE ROW LEVEL SECURITY;

-- 6. Kebijakan RLS (Deny-by-default, selektif terotorisasi)
-- Faculties
DROP POLICY IF EXISTS faculties_select ON public.faculties;
CREATE POLICY faculties_select ON public.faculties
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS faculties_write ON public.faculties;
CREATE POLICY faculties_write ON public.faculties
FOR ALL TO authenticated
USING (public.has_active_role('SUPER_ADMIN') OR public.has_active_role('ACADEMIC_STAFF'))
WITH CHECK (public.has_active_role('SUPER_ADMIN') OR public.has_active_role('ACADEMIC_STAFF'));

-- Laboratories
DROP POLICY IF EXISTS laboratories_select ON public.laboratories;
CREATE POLICY laboratories_select ON public.laboratories
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS laboratories_write ON public.laboratories;
CREATE POLICY laboratories_write ON public.laboratories
FOR ALL TO authenticated
USING (public.has_active_role('SUPER_ADMIN') OR public.has_active_role('ACADEMIC_STAFF'))
WITH CHECK (public.has_active_role('SUPER_ADMIN') OR public.has_active_role('ACADEMIC_STAFF'));

-- Class Laboratories
DROP POLICY IF EXISTS class_laboratories_select ON public.class_laboratories;
CREATE POLICY class_laboratories_select ON public.class_laboratories
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS class_laboratories_write ON public.class_laboratories;
CREATE POLICY class_laboratories_write ON public.class_laboratories
FOR ALL TO authenticated
USING (public.has_active_role('SUPER_ADMIN') OR public.has_active_role('ACADEMIC_STAFF') OR public.is_class_lecturer(class_id))
WITH CHECK (public.has_active_role('SUPER_ADMIN') OR public.has_active_role('ACADEMIC_STAFF') OR public.is_class_lecturer(class_id));
