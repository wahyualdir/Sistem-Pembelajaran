-- ============================================================================
-- SIAJAR Migration: Fase 3 — Kehadiran dan Perkuliahan
-- File: supabase/migrations/20261017000025_phase3_attendance_and_teaching.sql
--
-- CARA MEMBATALKAN (ROLLBACK):
-- DROP FUNCTION IF EXISTS public.review_absence_item(uuid, text, text);
-- DROP FUNCTION IF EXISTS public.attendance_percent(uuid, uuid);
-- DROP TABLE IF EXISTS public.material_progress CASCADE;
-- DROP TABLE IF EXISTS public.journal_materials CASCADE;
-- DROP TABLE IF EXISTS public.class_session_journals CASCADE;
-- ALTER TABLE public.attendance_records DROP COLUMN IF EXISTS absence_item_id, DROP COLUMN IF EXISTS source;
-- DROP TABLE IF EXISTS public.absence_request_items CASCADE;
-- DROP TABLE IF EXISTS public.absence_requests CASCADE;
-- ALTER TABLE public.attendance_sessions DROP COLUMN IF EXISTS recording_visible_from, DROP COLUMN IF EXISTS recording_url, DROP COLUMN IF EXISTS meeting_url, DROP COLUMN IF EXISTS delivery_mode;
-- ALTER TABLE public.materials DROP COLUMN IF EXISTS require_completion, DROP COLUMN IF EXISTS unlock_after_material_id;
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABEL IZIN DAN SAKIT MAHASISWA (absence_requests & absence_request_items)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.absence_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('izin', 'sakit')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL CHECK (end_date >= start_date),
    reason TEXT NOT NULL CHECK (char_length(reason) >= 10),
    attachment_path TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Detail per pertemuan & per kelas
CREATE TABLE IF NOT EXISTS public.absence_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.absence_requests(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu', 'disetujui', 'ditolak')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reviewed_at TIMESTAMPTZ,
    review_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_absence_request_session UNIQUE (request_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_absence_requests_student ON public.absence_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_absence_requests_dates ON public.absence_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_absence_request_items_req ON public.absence_request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_absence_request_items_class ON public.absence_request_items(class_id);
CREATE INDEX IF NOT EXISTS idx_absence_request_items_session ON public.absence_request_items(session_id);

ALTER TABLE public.absence_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_request_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS absence_requests_select ON public.absence_requests;
CREATE POLICY absence_requests_select ON public.absence_requests
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.absence_request_items items
        WHERE items.request_id = public.absence_requests.id
        AND public.is_class_staff(items.class_id)
    )
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('SUPER_ADMIN')
    OR public.has_active_role('SYSTEM_ADMIN')
);

DROP POLICY IF EXISTS absence_requests_insert ON public.absence_requests;
CREATE POLICY absence_requests_insert ON public.absence_requests
FOR INSERT TO authenticated
WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS absence_requests_update ON public.absence_requests;
CREATE POLICY absence_requests_update ON public.absence_requests
FOR UPDATE TO authenticated
USING (student_id = (SELECT auth.uid()))
WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS absence_request_items_select ON public.absence_request_items;
CREATE POLICY absence_request_items_select ON public.absence_request_items
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.absence_requests req
        WHERE req.id = public.absence_request_items.request_id
        AND req.student_id = (SELECT auth.uid())
    )
    OR public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('SUPER_ADMIN')
);

DROP POLICY IF EXISTS absence_request_items_insert ON public.absence_request_items;
CREATE POLICY absence_request_items_insert ON public.absence_request_items
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.absence_requests req
        WHERE req.id = public.absence_request_items.request_id
        AND req.student_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS absence_request_items_update ON public.absence_request_items;
CREATE POLICY absence_request_items_update ON public.absence_request_items
FOR UPDATE TO authenticated
USING (
    public.is_class_staff(class_id)
    OR EXISTS (
        SELECT 1 FROM public.absence_requests req
        WHERE req.id = public.absence_request_items.request_id
        AND req.student_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    public.is_class_staff(class_id)
    OR EXISTS (
        SELECT 1 FROM public.absence_requests req
        WHERE req.id = public.absence_request_items.request_id
        AND req.student_id = (SELECT auth.uid())
    )
);

-- Kolom tambahan pada attendance_records
ALTER TABLE public.attendance_records
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'qr', 'kode', 'izin_sakit')),
    ADD COLUMN IF NOT EXISTS absence_item_id UUID REFERENCES public.absence_request_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_records_absence_item ON public.attendance_records(absence_item_id);

-- ----------------------------------------------------------------------------
-- 2. BERITA ACARA PERKULIAHAN (class_session_journals & journal_materials)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.class_session_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_id UUID NOT NULL UNIQUE REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    held_on DATE NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('luring', 'daring', 'hibrida')),
    topic TEXT NOT NULL,
    summary TEXT,
    method TEXT,
    obstacles TEXT,
    status TEXT NOT NULL DEFAULT 'draf' CHECK (status IN ('draf', 'final')),
    is_late BOOLEAN NOT NULL DEFAULT false,
    finalized_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    finalized_at TIMESTAMPTZ,
    revision_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_journals_class ON public.class_session_journals(class_id);
CREATE INDEX IF NOT EXISTS idx_session_journals_held ON public.class_session_journals(held_on);

ALTER TABLE public.class_session_journals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS class_session_journals_select ON public.class_session_journals;
CREATE POLICY class_session_journals_select ON public.class_session_journals
FOR SELECT TO authenticated
USING (
    public.is_class_staff(class_id)
    OR public.is_class_coordinator(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_active_role('SUPER_ADMIN')
);

DROP POLICY IF EXISTS class_session_journals_write ON public.class_session_journals;
CREATE POLICY class_session_journals_write ON public.class_session_journals
FOR ALL TO authenticated
USING (public.is_class_lecturer(class_id) OR public.has_active_role('SUPER_ADMIN'))
WITH CHECK (public.is_class_lecturer(class_id) OR public.has_active_role('SUPER_ADMIN'));

-- Materi yang ditautkan ke berita acara
CREATE TABLE IF NOT EXISTS public.journal_materials (
    journal_id UUID NOT NULL REFERENCES public.class_session_journals(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (journal_id, material_id)
);

ALTER TABLE public.journal_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journal_materials_select ON public.journal_materials;
CREATE POLICY journal_materials_select ON public.journal_materials
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.class_session_journals j
        WHERE j.id = public.journal_materials.journal_id
        AND (
            public.is_class_staff(j.class_id)
            OR public.is_class_coordinator(j.class_id)
            OR public.has_global_role('ACADEMIC_STAFF')
            OR public.has_active_role('SUPER_ADMIN')
        )
    )
);

DROP POLICY IF EXISTS journal_materials_write ON public.journal_materials;
CREATE POLICY journal_materials_write ON public.journal_materials
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.class_session_journals j
        WHERE j.id = public.journal_materials.journal_id
        AND (public.is_class_lecturer(j.class_id) OR public.has_active_role('SUPER_ADMIN'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.class_session_journals j
        WHERE j.id = public.journal_materials.journal_id
        AND (public.is_class_lecturer(j.class_id) OR public.has_active_role('SUPER_ADMIN'))
    )
);

-- ----------------------------------------------------------------------------
-- 3. TAUTAN KULIAH DARING & REKAMAN PADA attendance_sessions
-- ----------------------------------------------------------------------------

ALTER TABLE public.attendance_sessions
    ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'luring' CHECK (delivery_mode IN ('luring', 'daring', 'hibrida')),
    ADD COLUMN IF NOT EXISTS meeting_url TEXT,
    ADD COLUMN IF NOT EXISTS recording_url TEXT,
    ADD COLUMN IF NOT EXISTS recording_visible_from TIMESTAMPTZ;

-- ----------------------------------------------------------------------------
-- 4. PENGUNCIAN BERURUTAN & PROGRES MATERI
-- ----------------------------------------------------------------------------

ALTER TABLE public.materials
    ADD COLUMN IF NOT EXISTS unlock_after_material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS require_completion BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.material_progress (
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'dibuka' CHECK (status IN ('dibuka', 'selesai')),
    first_opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (material_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_material_progress_student ON public.material_progress(student_id);

ALTER TABLE public.material_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS material_progress_select ON public.material_progress;
CREATE POLICY material_progress_select ON public.material_progress
FOR SELECT TO authenticated
USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.materials m
        WHERE m.id = public.material_progress.material_id
        AND (public.is_class_staff(m.class_id) OR public.has_global_role('ACADEMIC_STAFF'))
    )
);

DROP POLICY IF EXISTS material_progress_write ON public.material_progress;
CREATE POLICY material_progress_write ON public.material_progress
FOR ALL TO authenticated
USING (student_id = (SELECT auth.uid()))
WITH CHECK (student_id = (SELECT auth.uid()));

-- ----------------------------------------------------------------------------
-- 5. FUNGSI SQL ATOMIK (attendance_percent & review_absence_item)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.attendance_percent(
    p_student_id UUID,
    p_class_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_mode TEXT := 'exclude';
    v_total_sessions INT := 0;
    v_hadir INT := 0;
    v_terlambat INT := 0;
    v_izin INT := 0;
    v_sakit INT := 0;
    v_alpa INT := 0;
    v_denominator INT := 0;
    v_numerator NUMERIC := 0;
BEGIN
    -- Ambil mode dari institution_policies bila ada
    BEGIN
        SELECT value::text INTO v_mode
        FROM public.institution_policies
        WHERE key = 'attendance_excused_mode'
        LIMIT 1;
        v_mode := COALESCE(trim(both '"' from v_mode), 'exclude');
    EXCEPTION WHEN OTHERS THEN
        v_mode := 'exclude';
    END;

    -- Hitung komposisi kehadiran dari sesi yang sudah terlaksana (session_date <= CURRENT_DATE)
    SELECT
        COUNT(s.id),
        COUNT(r.id) FILTER (WHERE r.status = 'HADIR'),
        COUNT(r.id) FILTER (WHERE r.status = 'TERLAMBAT'),
        COUNT(r.id) FILTER (WHERE r.status = 'IZIN'),
        COUNT(r.id) FILTER (WHERE r.status = 'SAKIT'),
        COUNT(r.id) FILTER (WHERE r.status = 'ALPA' OR r.id IS NULL)
    INTO
        v_total_sessions,
        v_hadir,
        v_terlambat,
        v_izin,
        v_sakit,
        v_alpa
    FROM public.attendance_sessions s
    LEFT JOIN public.attendance_records r
        ON r.session_id = s.id AND r.student_id = p_student_id
    WHERE s.class_id = p_class_id
      AND s.session_date <= CURRENT_DATE;

    IF v_total_sessions = 0 THEN
        RETURN 100.00;
    END IF;

    -- Hitung sesuai mode
    IF v_mode = 'present' THEN
        -- Izin dan sakit dihitung hadir
        v_numerator := v_hadir + v_terlambat + v_izin + v_sakit;
        v_denominator := v_total_sessions;
    ELSIF v_mode = 'absent' THEN
        -- Izin dan sakit dihitung tidak hadir
        v_numerator := v_hadir + v_terlambat;
        v_denominator := v_total_sessions;
    ELSE
        -- Mode bawaan 'exclude': izin & sakit dikeluarkan dari pembagi
        v_numerator := v_hadir + v_terlambat;
        v_denominator := v_total_sessions - (v_izin + v_sakit);
    END IF;

    IF v_denominator <= 0 THEN
        RETURN 100.00;
    END IF;

    RETURN ROUND((v_numerator::numeric / v_denominator::numeric) * 100.00, 2);
END;
$$;

-- RPC Peninjauan Izin / Sakit
CREATE OR REPLACE FUNCTION public.review_absence_item(
    p_item_id UUID,
    p_decision TEXT,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := (SELECT auth.uid());
    v_item RECORD;
    v_req RECORD;
    v_current_rec RECORD;
    v_new_status TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Sesi login tidak sah.');
    END IF;

    IF p_decision NOT IN ('disetujui', 'ditolak') THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Keputusan harus disetujui atau ditolak.');
    END IF;

    -- Ambil butir
    SELECT * INTO v_item
    FROM public.absence_request_items
    WHERE id = p_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Butir permohonan tidak ditemukan.');
    END IF;

    -- Validasi hak akses dosen / staf kelas
    IF NOT public.is_class_staff(v_item.class_id) AND NOT public.has_active_role('SUPER_ADMIN') THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Hanya dosen pengampu atau staf yang dapat meninjau permohonan ini.');
    END IF;

    -- Ambil induk permohonan
    SELECT * INTO v_req
    FROM public.absence_requests
    WHERE id = v_item.request_id;

    -- Cek catatan presensi saat ini
    SELECT * INTO v_current_rec
    FROM public.attendance_records
    WHERE session_id = v_item.session_id AND student_id = v_req.student_id;

    IF p_decision = 'disetujui' THEN
        -- Jika presensi mahasiswa untuk pertemuan ini sudah HADIR, tolak otomatis
        IF FOUND AND v_current_rec.status = 'HADIR' THEN
            UPDATE public.absence_request_items
            SET status = 'ditolak',
                reviewed_by = v_uid,
                reviewed_at = now(),
                review_note = 'Ditolak sistem: mahasiswa sudah tercatat HADIR pada pertemuan ini.'
            WHERE id = p_item_id;

            RETURN jsonb_build_object('ok', false, 'error', 'Mahasiswa telah tercatat HADIR pada sesi ini. Permohonan ditolak otomatis.');
        END IF;

        v_new_status := CASE WHEN v_req.type = 'izin' THEN 'IZIN' ELSE 'SAKIT' END;

        -- Update status butir
        UPDATE public.absence_request_items
        SET status = 'disetujui',
            reviewed_by = v_uid,
            reviewed_at = now(),
            review_note = p_note
        WHERE id = p_item_id;

        -- Upsert ke attendance_records
        IF FOUND THEN
            UPDATE public.attendance_records
            SET status = v_new_status,
                source = 'izin_sakit',
                absence_item_id = p_item_id,
                notes = COALESCE(p_note, 'Disetujui dari permohonan ' || v_req.type)
            WHERE id = v_current_rec.id;
        ELSE
            INSERT INTO public.attendance_records (
                session_id,
                student_id,
                status,
                source,
                absence_item_id,
                notes
            ) VALUES (
                v_item.session_id,
                v_req.student_id,
                v_new_status,
                'izin_sakit',
                p_item_id,
                COALESCE(p_note, 'Disetujui dari permohonan ' || v_req.type)
            );
        END IF;

    ELSE
        -- Ditolak
        IF p_note IS NULL OR length(trim(p_note)) < 3 THEN
            RETURN jsonb_build_object('ok', false, 'error', 'Penolakan wajib menyertakan catatan alasan.');
        END IF;

        UPDATE public.absence_request_items
        SET status = 'ditolak',
            reviewed_by = v_uid,
            reviewed_at = now(),
            review_note = p_note
        WHERE id = p_item_id;

        -- Bila sebelumnya pernah disetujui lewat item ini, kembalikan ke ALPA
        IF FOUND AND v_current_rec.absence_item_id = p_item_id THEN
            UPDATE public.attendance_records
            SET status = 'ALPA',
                notes = 'Permohonan dibatalkan/ditolak: ' || p_note
            WHERE id = v_current_rec.id;
        END IF;
    END IF;

    RETURN jsonb_build_object('ok', true, 'status', p_decision);
END;
$$;
