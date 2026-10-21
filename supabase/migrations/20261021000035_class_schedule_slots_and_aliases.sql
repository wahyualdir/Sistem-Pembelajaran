-- ============================================================================
-- SIAJAR Migration: 20261021000035_class_schedule_slots_and_aliases.sql
-- Fitur: Slot Jadwal Perkuliahan Mingguan & Alias Kode Mata Kuliah
-- Spesifikasi: docs/INSTRUKSI_SEED_AKADEMIK.md (Fase S1)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABEL CLASS_SCHEDULE_SLOTS (Slot Jadwal Kuliah Mingguan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_schedule_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    component TEXT NOT NULL CHECK (component IN ('TEORI', 'PRAKTIKUM')),
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5), -- 1 = Senin, 5 = Jumat
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    lecturer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sks SMALLINT CHECK (sks IS NULL OR (sks >= 1 AND sks <= 6)),
    source_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_schedule_slot_time CHECK (end_time > start_time),
    CONSTRAINT uq_class_schedule_slot UNIQUE (class_id, component, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_schedule_slots_class ON public.class_schedule_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_room ON public.class_schedule_slots(room_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_lecturer ON public.class_schedule_slots(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_day ON public.class_schedule_slots(day_of_week, start_time);

DROP TRIGGER IF EXISTS tr_class_schedule_slots_updated_at ON public.class_schedule_slots;
CREATE TRIGGER tr_class_schedule_slots_updated_at
BEFORE UPDATE ON public.class_schedule_slots
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. TABEL COURSE_CODE_ALIASES (Pemetaan Alias Kode Jadwal ke Kode Kurikulum)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_code_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    alias_code TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_aliases_course ON public.course_code_aliases(course_id);
CREATE INDEX IF NOT EXISTS idx_course_aliases_code ON public.course_code_aliases(alias_code);

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) & KEBIJAKAN AKSES
-- ----------------------------------------------------------------------------
ALTER TABLE public.class_schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_code_aliases ENABLE ROW LEVEL SECURITY;

-- Kebijakan Baca class_schedule_slots:
-- Anggota kelas (is_class_member), Staf Akademik, Koordinator Prodi, atau Admin
DROP POLICY IF EXISTS class_schedule_slots_select ON public.class_schedule_slots;
CREATE POLICY class_schedule_slots_select ON public.class_schedule_slots
FOR SELECT TO authenticated
USING (
    public.is_class_member(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
    OR public.has_active_role('SYSTEM_ADMIN')
    OR public.has_active_role('SUPER_ADMIN')
    OR public.has_global_role('SUPER_ADMIN')
);

-- Kebijakan Tulis class_schedule_slots: Hanya Staf Akademik & Super Admin
DROP POLICY IF EXISTS class_schedule_slots_insert ON public.class_schedule_slots;
CREATE POLICY class_schedule_slots_insert ON public.class_schedule_slots
FOR INSERT TO authenticated
WITH CHECK (
    public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('SUPER_ADMIN')
    OR public.has_global_role('SUPER_ADMIN')
);

DROP POLICY IF EXISTS class_schedule_slots_update ON public.class_schedule_slots;
CREATE POLICY class_schedule_slots_update ON public.class_schedule_slots
FOR UPDATE TO authenticated
USING (
    public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('SUPER_ADMIN')
    OR public.has_global_role('SUPER_ADMIN')
)
WITH CHECK (
    public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('SUPER_ADMIN')
    OR public.has_global_role('SUPER_ADMIN')
);

DROP POLICY IF EXISTS class_schedule_slots_delete ON public.class_schedule_slots;
CREATE POLICY class_schedule_slots_delete ON public.class_schedule_slots
FOR DELETE TO authenticated
USING (
    public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('SUPER_ADMIN')
    OR public.has_global_role('SUPER_ADMIN')
);

-- Kebijakan Baca course_code_aliases: Terbuka untuk semua pengguna login (sama seperti courses)
DROP POLICY IF EXISTS course_code_aliases_select ON public.course_code_aliases;
CREATE POLICY course_code_aliases_select ON public.course_code_aliases
FOR SELECT TO authenticated
USING (true);

-- Kebijakan Tulis course_code_aliases: Hanya Staf Akademik & Super Admin
DROP POLICY IF EXISTS course_code_aliases_write ON public.course_code_aliases;
CREATE POLICY course_code_aliases_write ON public.course_code_aliases
FOR ALL TO authenticated
USING (
    public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('SUPER_ADMIN')
    OR public.has_global_role('SUPER_ADMIN')
)
WITH CHECK (
    public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('SUPER_ADMIN')
    OR public.has_global_role('SUPER_ADMIN')
);
