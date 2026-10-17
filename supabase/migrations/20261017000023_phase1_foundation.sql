-- ============================================================================
-- SIAJAR Migration: 20261017000023_phase1_foundation.sql
-- Fase 1: Fondasi Bersama (Kebijakan Institusi, Rilis Terjadwal, Notifikasi Terjadwal, Storage)
-- Spesifikasi: Dokumen Instruksi Antigravity Versi 2 (Bagian 8.1 - 8.5, Lampiran A, B, C)
--
-- CARA MEMBATALKAN (ROLLBACK):
-- DROP POLICY IF EXISTS import_staging_storage_delete ON storage.objects;
-- DROP POLICY IF EXISTS import_staging_storage_insert ON storage.objects;
-- DROP POLICY IF EXISTS import_staging_storage_select ON storage.objects;
-- DROP POLICY IF EXISTS question_assets_storage_delete ON storage.objects;
-- DROP POLICY IF EXISTS question_assets_storage_insert ON storage.objects;
-- DROP POLICY IF EXISTS question_assets_storage_select ON storage.objects;
-- DROP POLICY IF EXISTS message_attachments_storage_insert ON storage.objects;
-- DROP POLICY IF EXISTS message_attachments_storage_select ON storage.objects;
-- DROP POLICY IF EXISTS submission_feedback_storage_insert ON storage.objects;
-- DROP POLICY IF EXISTS submission_feedback_storage_select ON storage.objects;
-- DROP POLICY IF EXISTS absence_proofs_storage_delete ON storage.objects;
-- DROP POLICY IF EXISTS absence_proofs_storage_insert ON storage.objects;
-- DROP POLICY IF EXISTS absence_proofs_storage_select ON storage.objects;
-- DELETE FROM storage.buckets WHERE id IN ('absence-proofs', 'submission-feedback', 'message-attachments', 'question-assets', 'import-staging');
-- DROP TABLE IF EXISTS public.scheduled_notifications CASCADE;
-- DROP INDEX IF EXISTS idx_materials_release;
-- DROP INDEX IF EXISTS idx_assignments_release;
-- DROP INDEX IF EXISTS idx_quizzes_release;
-- ALTER TABLE public.materials DROP COLUMN IF EXISTS release_at;
-- ALTER TABLE public.assignments DROP COLUMN IF EXISTS release_at;
-- ALTER TABLE public.quizzes DROP COLUMN IF EXISTS release_at;
-- DROP TABLE IF EXISTS public.institution_policies CASCADE;
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABEL INSTITUTION_POLICIES (Bagian 8.1 & Lampiran A)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institution_policies (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_institution_policies_key ON public.institution_policies(key);

ALTER TABLE public.institution_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS institution_policies_select ON public.institution_policies;
CREATE POLICY institution_policies_select ON public.institution_policies
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS institution_policies_update ON public.institution_policies;
CREATE POLICY institution_policies_update ON public.institution_policies
FOR UPDATE TO authenticated
USING (
    public.has_global_role('SUPER_ADMIN')
    OR public.has_global_role('SYSTEM_ADMIN')
)
WITH CHECK (
    public.has_global_role('SUPER_ADMIN')
    OR public.has_global_role('SYSTEM_ADMIN')
);

DROP POLICY IF EXISTS institution_policies_insert ON public.institution_policies;
CREATE POLICY institution_policies_insert ON public.institution_policies
FOR INSERT TO authenticated
WITH CHECK (
    public.has_global_role('SUPER_ADMIN')
    OR public.has_global_role('SYSTEM_ADMIN')
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS tr_institution_policies_updated_at ON public.institution_policies;
CREATE TRIGGER tr_institution_policies_updated_at
BEFORE UPDATE ON public.institution_policies
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- Helper function get_policy
CREATE OR REPLACE FUNCTION public.get_policy(p_key text)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT value FROM public.institution_policies WHERE key = p_key;
$$;

-- Seed kebijakan akademik awal (Lampiran A)
INSERT INTO public.institution_policies (key, value, description)
VALUES
    ('min_attendance_percent', '75'::jsonb, 'Batas minimum persentase kehadiran mahasiswa untuk mengikuti ujian'),
    ('attendance_excused_mode', '"exclude"'::jsonb, 'Perhitungan kehadiran berstatus izin atau sakit (exclude: dikeluarkan dari penyebut, include: dihitung hadir)'),
    ('dispute_window_days', '7'::jsonb, 'Batas hari pengajuan sanggah nilai setelah nilai dipublikasikan'),
    ('absence_request_max_backdate_days', '7'::jsonb, 'Batas hari pengajuan izin susulan setelah hari ketidakhadiran'),
    ('sick_requires_attachment', 'true'::jsonb, 'Kewajiban melampirkan surat dokter untuk izin sakit'),
    ('absence_proof_retention_days', '180'::jsonb, 'Masa retensi berkas bukti izin atau sakit (hari) sebelum dibersihkan'),
    ('journal_deadline_days', '3'::jsonb, 'Batas hari pengisian berita acara dan jurnal mengajar dosen setelah sesi perkuliahan'),
    ('exam_grace_seconds', '20'::jsonb, 'Tenggat toleransi detik penyerahan ujian saat koneksi terputus'),
    ('evaluation_min_respondents', '5'::jsonb, 'Batas minimum responden mahasiswa sebelum hasil EDOM dapat dilihat dosen'),
    ('consultation_cancel_min_hours', '2'::jsonb, 'Batas jam pembatalan jadwal konsultasi sebelum waktu pelaksanaan'),
    ('consultation_max_future_days', '30'::jsonb, 'Batas hari ke depan mahasiswa dapat membuat janji konsultasi'),
    ('meeting_join_window_minutes', '15'::jsonb, 'Rentang menit sebelum dan sesudah jadwal kuliah daring tombol bergabung dibuka'),
    ('meeting_allowed_hosts', '["meet.google.com", "zoom.us", "teams.microsoft.com", "teams.live.com", "meet.jit.si", "youtube.com", "youtu.be", "drive.google.com"]'::jsonb, 'Daftar hostname tautan konferensi video dan rekaman kuliah yang diizinkan'),
    ('class_archive_after_days', '30'::jsonb, 'Batas hari setelah semester berakhir kelas otomatis diarsipkan'),
    ('auto_archive_enabled', 'false'::jsonb, 'Status pengarsipan otomatis kelas oleh sistem'),
    ('student_access_archived_days', '365'::jsonb, 'Masa akses mahasiswa terhadap materi dan tugas di kelas yang diarsipkan (hari)'),
    ('gamification_enabled', 'true'::jsonb, 'Mengaktifkan lencana capaian dan gamifikasi akademik ringan'),
    ('coding_autograder_enabled', 'false'::jsonb, 'Mengaktifkan auto-grader eksternal untuk soal koding live'),
    ('similarity_default_threshold', '0.60'::jsonb, 'Ambang batas kesamaan teks bawaan untuk penandaan plagiarisme'),
    ('cpmk_pass_threshold', '60'::jsonb, 'Nilai ambang batas ketercapaian CPMK (skala 100)'),
    ('ai_reminders_enabled', 'true'::jsonb, 'Mengaktifkan pengingat otomatis proaktif oleh asisten AI')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- 2. RILIS TERJADWAL & STATUS KELAS (Bagian 8.2)
-- ----------------------------------------------------------------------------
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS release_at TIMESTAMPTZ NULL;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS release_at TIMESTAMPTZ NULL;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS release_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_materials_release ON public.materials(release_at);
CREATE INDEX IF NOT EXISTS idx_assignments_release ON public.assignments(release_at);
CREATE INDEX IF NOT EXISTS idx_quizzes_release ON public.quizzes(release_at);

-- Perbarui RLS Policy materials_select dengan batas release_at untuk mahasiswa
DROP POLICY IF EXISTS materials_select ON public.materials;
CREATE POLICY materials_select ON public.materials
FOR SELECT TO authenticated
USING (
    public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
    OR (
        status = 'PUBLISHED'
        AND public.is_enrolled(class_id)
        AND (release_at IS NULL OR release_at <= now())
    )
);

-- Perbarui RLS Policy assignments_select dengan batas release_at untuk mahasiswa
DROP POLICY IF EXISTS assignments_select ON public.assignments;
CREATE POLICY assignments_select ON public.assignments
FOR SELECT TO authenticated
USING (
    public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
    OR (
        status = 'PUBLISHED'
        AND public.is_enrolled(class_id)
        AND (release_at IS NULL OR release_at <= now())
    )
);

-- Perbarui RLS Policy quizzes_select dengan batas release_at untuk mahasiswa
DROP POLICY IF EXISTS quizzes_select ON public.quizzes;
CREATE POLICY quizzes_select ON public.quizzes
FOR SELECT TO authenticated
USING (
    public.is_class_staff(class_id)
    OR public.has_global_role('ACADEMIC_STAFF')
    OR public.has_global_role('SUPER_ADMIN')
    OR public.has_active_role('PROGRAM_COORDINATOR')
    OR (
        public.is_enrolled(class_id)
        AND is_published = true
        AND (release_at IS NULL OR release_at <= now())
    )
);

-- ----------------------------------------------------------------------------
-- 3. NOTIFIKASI TERJADWAL (Bagian 8.3 & Lampiran B)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    send_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ NULL,
    dedupe_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending
ON public.scheduled_notifications(send_at)
WHERE sent_at IS NULL;

ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scheduled_notifications_select ON public.scheduled_notifications;
CREATE POLICY scheduled_notifications_select ON public.scheduled_notifications
FOR SELECT TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR public.has_global_role('SUPER_ADMIN')
    OR public.has_global_role('SYSTEM_ADMIN')
);

DROP POLICY IF EXISTS scheduled_notifications_insert ON public.scheduled_notifications;
CREATE POLICY scheduled_notifications_insert ON public.scheduled_notifications
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS scheduled_notifications_update ON public.scheduled_notifications;
CREATE POLICY scheduled_notifications_update ON public.scheduled_notifications
FOR UPDATE TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR public.has_global_role('SUPER_ADMIN')
    OR public.has_global_role('SYSTEM_ADMIN')
);

-- ----------------------------------------------------------------------------
-- 4. BUCKET STORAGE BARU (Bagian 8.5)
-- absence-proofs, submission-feedback, message-attachments, question-assets, import-staging
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('absence-proofs', 'absence-proofs', false),
    ('submission-feedback', 'submission-feedback', false),
    ('message-attachments', 'message-attachments', false),
    ('question-assets', 'question-assets', false),
    ('import-staging', 'import-staging', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- RLS Policy: absence-proofs
-- Path format: {student_id}/{filename}
DROP POLICY IF EXISTS absence_proofs_storage_select ON storage.objects;
CREATE POLICY absence_proofs_storage_select ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'absence-proofs' AND (
        (SELECT auth.uid())::text = ((storage.foldername(name))[1])
        OR public.has_global_role('LECTURER')
        OR public.has_global_role('ACADEMIC_STAFF')
        OR public.has_global_role('SUPER_ADMIN')
        OR public.has_global_role('SYSTEM_ADMIN')
    )
);

DROP POLICY IF EXISTS absence_proofs_storage_insert ON storage.objects;
CREATE POLICY absence_proofs_storage_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'absence-proofs' AND (
        (SELECT auth.uid())::text = ((storage.foldername(name))[1])
        OR public.has_global_role('SUPER_ADMIN')
        OR public.has_global_role('SYSTEM_ADMIN')
    )
);

DROP POLICY IF EXISTS absence_proofs_storage_delete ON storage.objects;
CREATE POLICY absence_proofs_storage_delete ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'absence-proofs' AND (
        (SELECT auth.uid())::text = ((storage.foldername(name))[1])
        OR public.has_global_role('SUPER_ADMIN')
        OR public.has_global_role('SYSTEM_ADMIN')
    )
);

-- RLS Policy: submission-feedback
-- Path format: {assignment_id}/{submission_id}/{filename}
DROP POLICY IF EXISTS submission_feedback_storage_select ON storage.objects;
CREATE POLICY submission_feedback_storage_select ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'submission-feedback' AND (
        public.is_class_staff(public.assignment_class(((storage.foldername(name))[1])::uuid))
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = ((storage.foldername(name))[2])::uuid
              AND s.student_id = (SELECT auth.uid())
        )
    )
);

DROP POLICY IF EXISTS submission_feedback_storage_insert ON storage.objects;
CREATE POLICY submission_feedback_storage_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'submission-feedback' AND (
        public.is_class_staff(public.assignment_class(((storage.foldername(name))[1])::uuid))
        OR public.is_admin()
    )
);

-- RLS Policy: message-attachments
-- Path format: {sender_id}/{filename}
DROP POLICY IF EXISTS message_attachments_storage_select ON storage.objects;
CREATE POLICY message_attachments_storage_select ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'message-attachments'
);

DROP POLICY IF EXISTS message_attachments_storage_insert ON storage.objects;
CREATE POLICY message_attachments_storage_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'message-attachments' AND (
        (SELECT auth.uid())::text = ((storage.foldername(name))[1])
        OR public.is_admin()
    )
);

-- RLS Policy: question-assets
-- Path format: {question_id}/{filename}
DROP POLICY IF EXISTS question_assets_storage_select ON storage.objects;
CREATE POLICY question_assets_storage_select ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'question-assets'
);

DROP POLICY IF EXISTS question_assets_storage_insert ON storage.objects;
CREATE POLICY question_assets_storage_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'question-assets' AND (
        public.has_global_role('LECTURER')
        OR public.has_global_role('TEACHING_ASSISTANT')
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS question_assets_storage_delete ON storage.objects;
CREATE POLICY question_assets_storage_delete ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'question-assets' AND (
        public.has_global_role('LECTURER')
        OR public.is_admin()
    )
);

-- RLS Policy: import-staging
-- Path format: {user_id}/{filename}
DROP POLICY IF EXISTS import_staging_storage_select ON storage.objects;
CREATE POLICY import_staging_storage_select ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'import-staging' AND (
        (SELECT auth.uid())::text = ((storage.foldername(name))[1])
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS import_staging_storage_insert ON storage.objects;
CREATE POLICY import_staging_storage_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'import-staging' AND (
        (SELECT auth.uid())::text = ((storage.foldername(name))[1])
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS import_staging_storage_delete ON storage.objects;
CREATE POLICY import_staging_storage_delete ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'import-staging' AND (
        (SELECT auth.uid())::text = ((storage.foldername(name))[1])
        OR public.is_admin()
    )
);
