-- SIAJAR Migration 21: Persistent Deduplication, Notification Preferences, System Settings & Early Warning Risk History
-- Tahap C:
-- 1. Kolom dedup_key (dengan unique index), target_url, dan snoozed_until pada public.notifications
-- 2. Tabel public.notification_preferences beserta kebijakan RLS pengguna
-- 3. Tabel public.system_settings (beserta kebijakan RLS untuk SUPER_ADMIN & SYSTEM_ADMIN dan seed early_warning.policy)
-- 4. Tabel public.student_risk_evaluations (riwayat evaluasi peringatan dini) beserta kebijakan RLS berjenjang (tanpa akses SYSTEM_ADMIN)

BEGIN;

-- ============================================================================
-- 1. PERSISTENT DEDUPLICATION & EXTENSIONS ON public.notifications
-- ============================================================================

ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS dedup_key VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS target_url TEXT NULL,
    ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ NULL;

-- Unique index memastikan pengingat dengan dedup_key yang sama tidak pernah disimpan/dikirim dua kali
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_dedup_key
    ON public.notifications (dedup_key);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS notifications_insert_authenticated ON public.notifications;
CREATE POLICY notifications_insert_authenticated ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (
    user_id = (SELECT auth.uid())
    OR public.has_global_role('SUPER_ADMIN')
    OR public.has_global_role('SYSTEM_ADMIN')
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('LECTURER')
);

-- ============================================================================
-- 2. TABEL public.notification_preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    channels JSONB NOT NULL DEFAULT '{"in_app": true, "email": true, "whatsapp": false}'::jsonb,
    events JSONB NOT NULL DEFAULT '{"assignment_new": true, "assignment_due": true, "exam_upcoming": true, "attendance_closing": true, "grade_published": true, "forum_reply": true, "early_warning": true}'::jsonb,
    phone_number VARCHAR(30) NULL,
    quiet_hours_start VARCHAR(10) NULL DEFAULT '22:00',
    quiet_hours_end VARCHAR(10) NULL DEFAULT '06:00',
    backup_email VARCHAR(255) NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_preferences_select ON public.notification_preferences;
CREATE POLICY notification_preferences_select ON public.notification_preferences
FOR SELECT TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR public.has_global_role('SUPER_ADMIN')
    OR public.has_global_role('SYSTEM_ADMIN')
);

DROP POLICY IF EXISTS notification_preferences_insert ON public.notification_preferences;
CREATE POLICY notification_preferences_insert ON public.notification_preferences
FOR INSERT TO authenticated
WITH CHECK (
    user_id = (SELECT auth.uid())
    OR public.has_global_role('SUPER_ADMIN')
);

DROP POLICY IF EXISTS notification_preferences_update ON public.notification_preferences;
CREATE POLICY notification_preferences_update ON public.notification_preferences
FOR UPDATE TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR public.has_global_role('SUPER_ADMIN')
)
WITH CHECK (
    user_id = (SELECT auth.uid())
    OR public.has_global_role('SUPER_ADMIN')
);

DROP TRIGGER IF EXISTS tr_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER tr_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================================
-- 3. TABEL public.system_settings & KEBIJAKAN AMBANG BATAS PERINGATAN DINI
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value_json JSONB NOT NULL,
    updated_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_settings_select ON public.system_settings;
CREATE POLICY system_settings_select ON public.system_settings
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS system_settings_manage ON public.system_settings;
CREATE POLICY system_settings_manage ON public.system_settings
FOR ALL TO authenticated
USING (
    public.has_global_role('SUPER_ADMIN')
    OR public.has_global_role('SYSTEM_ADMIN')
)
WITH CHECK (
    public.has_global_role('SUPER_ADMIN')
    OR public.has_global_role('SYSTEM_ADMIN')
);

INSERT INTO public.system_settings (key, value_json)
VALUES (
    'early_warning.policy',
    '{
      "minAttendancePercent": 75,
      "warningAttendancePercent": 80,
      "maxMissingAssignmentsWarning": 1,
      "maxMissingAssignmentsHighRisk": 3,
      "gradeDropThresholdPoints": 15,
      "minMaterialProgressPercent": 50
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 4. TABEL RIWAYAT EVALUASI RISIKO (public.student_risk_evaluations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_risk_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    risk_level VARCHAR(30) NOT NULL CHECK (risk_level IN ('AMAN', 'PERHATIAN', 'RISIKO_TINGGI')),
    previous_risk_level VARCHAR(30) NULL CHECK (previous_risk_level IN ('AMAN', 'PERHATIAN', 'RISIKO_TINGGI')),
    score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    attendance_percent NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    missing_assignments_count INTEGER NOT NULL DEFAULT 0,
    late_submissions_count INTEGER NOT NULL DEFAULT 0,
    average_grade NUMERIC(5,2) NULL,
    grade_trend VARCHAR(20) NOT NULL DEFAULT 'STABIL' CHECK (grade_trend IN ('NAIK', 'STABIL', 'TURUN')),
    material_progress_percent NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_notified_risk_level VARCHAR(30) NULL CHECK (last_notified_risk_level IN ('AMAN', 'PERHATIAN', 'RISIKO_TINGGI')),
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_risk_evaluations_student_class UNIQUE (student_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_student_risk_evaluations_class ON public.student_risk_evaluations(class_id, risk_level);
CREATE INDEX IF NOT EXISTS idx_student_risk_evaluations_student ON public.student_risk_evaluations(student_id);

ALTER TABLE public.student_risk_evaluations ENABLE ROW LEVEL SECURITY;

-- Catatan Aturan A2: SYSTEM_ADMIN ditolak dari pembacaan data evaluasi risiko akademik mahasiswa
DROP POLICY IF EXISTS student_risk_evaluations_select ON public.student_risk_evaluations;
CREATE POLICY student_risk_evaluations_select ON public.student_risk_evaluations
FOR SELECT TO authenticated
USING (
    NOT public.has_global_role('SYSTEM_ADMIN')
    AND (
        student_id = (SELECT auth.uid())
        OR public.is_class_staff(class_id)
        OR public.has_global_role('PROGRAM_COORDINATOR')
        OR public.has_global_role('ACADEMIC_STAFF')
        OR public.has_global_role('SUPER_ADMIN')
    )
);

DROP POLICY IF EXISTS student_risk_evaluations_write ON public.student_risk_evaluations;
CREATE POLICY student_risk_evaluations_write ON public.student_risk_evaluations
FOR ALL TO authenticated
USING (
    NOT public.has_global_role('SYSTEM_ADMIN')
    AND (
        public.is_class_staff(class_id)
        OR public.has_global_role('ACADEMIC_STAFF')
        OR public.has_global_role('SUPER_ADMIN')
    )
)
WITH CHECK (
    NOT public.has_global_role('SYSTEM_ADMIN')
    AND (
        public.is_class_staff(class_id)
        OR public.has_global_role('ACADEMIC_STAFF')
        OR public.has_global_role('SUPER_ADMIN')
    )
);

DROP TRIGGER IF EXISTS tr_student_risk_evaluations_updated_at ON public.student_risk_evaluations;
CREATE TRIGGER tr_student_risk_evaluations_updated_at
BEFORE UPDATE ON public.student_risk_evaluations
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

COMMIT;
