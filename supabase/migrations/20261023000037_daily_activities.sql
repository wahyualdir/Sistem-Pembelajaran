-- SIAJAR Migration: Fitur Grafik Kontribusi (Daily Activities / Aktivitas Harian)
-- Spesifikasi: Grafik heatmap kontribusi GitHub-style per hari dengan 11 jenis aktivitas, bobot, dan batas harian.

-- 1. Tabel daily_activities
CREATE TABLE IF NOT EXISTS public.daily_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    kind TEXT NOT NULL,
    count INT NOT NULL DEFAULT 1 CHECK (count > 0),
    points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT daily_activities_user_date_class_kind_key UNIQUE NULLS NOT DISTINCT (user_id, date, class_id, kind)
);

-- 2. Indeks performa untuk query berdasarkan user dan kelas
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date
    ON public.daily_activities (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_activities_class_date
    ON public.daily_activities (class_id, date DESC)
    WHERE class_id IS NOT NULL;

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan SELECT
-- - Pemilik data dapat melihat aktivitasnya sendiri
-- - Pengajar kelas (Dosen & Asisten) dapat melihat aktivitas anggota di kelas tersebut
-- - Admin/Staf akademik dan Kaprodi dapat melihat untuk keperluan audit
DROP POLICY IF EXISTS daily_activities_select ON public.daily_activities;
CREATE POLICY daily_activities_select ON public.daily_activities
FOR SELECT TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR (
        class_id IS NOT NULL AND (
            public.is_class_lecturer(class_id)
            OR EXISTS (
                SELECT 1 FROM public.class_assistants ca
                WHERE ca.class_id = daily_activities.class_id
                  AND ca.user_id = (SELECT auth.uid())
            )
        )
    )
    OR public.has_active_role('SUPER_ADMIN')
    OR public.has_active_role('ACADEMIC_STAFF')
    OR public.has_active_role('PROGRAM_COORDINATOR')
);

-- Deny-by-default untuk INSERT / UPDATE / DELETE dari klien langsung.
-- Seluruh mutasi aktivitas wajib melalui fungsi RPC terproteksi record_daily_activity.

-- 5. Fungsi RPC Pencatatan Atomik dengan Penegakan Batas Poin Harian (Capping)
CREATE OR REPLACE FUNCTION public.record_daily_activity(
    p_user_id UUID,
    p_kind TEXT,
    p_class_id UUID DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE,
    p_points_to_add INT DEFAULT 1,
    p_cap INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_id UUID;
    v_current_points INT := 0;
    v_current_count INT := 0;
    v_allowed_points INT;
    v_is_capped BOOLEAN := false;
    v_total_points INT;
    v_total_count INT;
BEGIN
    -- Validasi caller: hanya pengguna yang bersangkutan atau admin/service role
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
        -- Izinkan jika caller adalah pengajar kelas yang memberikan penilaian/review
        IF p_class_id IS NULL OR NOT (
            public.is_class_lecturer(p_class_id)
            OR EXISTS (
                SELECT 1 FROM public.class_assistants ca
                WHERE ca.class_id = p_class_id AND ca.user_id = auth.uid()
            )
            OR public.has_active_role('SUPER_ADMIN')
            OR public.has_active_role('ACADEMIC_STAFF')
        ) THEN
            RAISE EXCEPTION 'FORBIDDEN_USER_MISMATCH';
        END IF;
    END IF;

    -- Kunci baris jika sudah ada (mencegah race condition)
    SELECT id, points, count
    INTO v_existing_id, v_current_points, v_current_count
    FROM public.daily_activities
    WHERE user_id = p_user_id
      AND date = p_date
      AND kind = p_kind
      AND (
        (class_id IS NULL AND p_class_id IS NULL)
        OR class_id = p_class_id
      )
    FOR UPDATE;

    -- Hitung poin yang diizinkan berdasarkan cap harian
    IF p_cap IS NOT NULL AND p_cap >= 0 THEN
        IF v_current_points >= p_cap THEN
            v_allowed_points := 0;
            v_is_capped := true;
        ELSIF (v_current_points + p_points_to_add) > p_cap THEN
            v_allowed_points := p_cap - v_current_points;
        ELSE
            v_allowed_points := p_points_to_add;
        END IF;
    ELSE
        v_allowed_points := p_points_to_add;
    END IF;

    IF v_existing_id IS NOT NULL THEN
        UPDATE public.daily_activities
        SET count = count + 1,
            points = points + v_allowed_points,
            updated_at = now()
        WHERE id = v_existing_id
        RETURNING points, count INTO v_total_points, v_total_count;
    ELSE
        INSERT INTO public.daily_activities (
            user_id,
            class_id,
            date,
            kind,
            count,
            points,
            created_at,
            updated_at
        )
        VALUES (
            p_user_id,
            p_class_id,
            p_date,
            p_kind,
            1,
            v_allowed_points,
            now(),
            now()
        )
        RETURNING points, count INTO v_total_points, v_total_count;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'recorded_points', v_allowed_points,
        'total_points', v_total_points,
        'total_count', v_total_count,
        'is_capped', v_is_capped
    );
END;
$$;
