-- Migration: 20261017000022_phase0_gap_alignment.sql
-- Fase 0: Penyelarasan celah database (can_open_attendance, audit_logs_for_sysadmin, student_requests, allowed_email_domains, email_allowlist)
-- 
-- Cara membatalkan (Rollback):
-- DROP TABLE IF EXISTS public.email_allowlist CASCADE;
-- DROP TABLE IF EXISTS public.allowed_email_domains CASCADE;
-- DROP TABLE IF EXISTS public.student_requests CASCADE;
-- DROP VIEW IF EXISTS public.audit_logs_for_sysadmin CASCADE;
-- ALTER TABLE public.class_assistants DROP COLUMN IF EXISTS can_open_attendance;

-- 1. Tambah kolom can_open_attendance ke class_assistants
ALTER TABLE public.class_assistants 
ADD COLUMN IF NOT EXISTS can_open_attendance BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. View audit_logs_for_sysadmin (menyamarkan nilai sebelum/sesudah entitas akademik sensitif)
CREATE OR REPLACE VIEW public.audit_logs_for_sysadmin AS
SELECT
    id,
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    scope_type,
    scope_id,
    CASE 
        WHEN entity_type IN ('grades', 'submissions', 'exam_attempts', 'questions', 'absence_requests', 'grade_disputes', 'grade_change_requests') 
        THEN '{"disamarkan": true, "nilai": "[disembunyikan]"}'::jsonb
        ELSE before_json 
    END AS before_json,
    CASE 
        WHEN entity_type IN ('grades', 'submissions', 'exam_attempts', 'questions', 'absence_requests', 'grade_disputes', 'grade_change_requests') 
        THEN '{"disamarkan": true, "nilai": "[disembunyikan]"}'::jsonb
        ELSE after_json 
    END AS after_json,
    ip_address,
    user_agent,
    request_id,
    created_at
FROM public.audit_logs;

GRANT SELECT ON public.audit_logs_for_sysadmin TO authenticated;

-- 3. Tabel student_requests untuk alur pengajuan mahasiswa (/requests) dan verifikasi staf (/staff/services/verification)
CREATE TABLE IF NOT EXISTS public.student_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('surat_aktif', 'dispensasi', 'cuti', 'legalisir')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    attachment_path TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'MENUNGGU' CHECK (status IN ('MENUNGGU', 'DIPROSES', 'DISETUJUI', 'DITOLAK')),
    staff_note TEXT NULL,
    result_path TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_requests_student ON public.student_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_student_requests_status ON public.student_requests(status);
ALTER TABLE public.student_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_requests_select ON public.student_requests;
CREATE POLICY student_requests_select ON public.student_requests
    FOR SELECT TO authenticated
    USING (
        student_id = (SELECT auth.uid()) 
        OR public.has_global_role('ACADEMIC_STAFF') 
        OR public.has_global_role('SUPER_ADMIN')
    );

DROP POLICY IF EXISTS student_requests_insert ON public.student_requests;
CREATE POLICY student_requests_insert ON public.student_requests
    FOR INSERT TO authenticated
    WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS student_requests_update ON public.student_requests;
CREATE POLICY student_requests_update ON public.student_requests
    FOR UPDATE TO authenticated
    USING (
        public.has_global_role('ACADEMIC_STAFF') 
        OR public.has_global_role('SUPER_ADMIN')
    )
    WITH CHECK (
        public.has_global_role('ACADEMIC_STAFF') 
        OR public.has_global_role('SUPER_ADMIN')
    );

-- 4. Tabel domain email yang diizinkan dan daftar allowlist khusus
CREATE TABLE IF NOT EXISTS public.allowed_email_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL UNIQUE,
    role_hint VARCHAR(50) NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_allowlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role_hint VARCHAR(50) NULL,
    notes TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.allowed_email_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allowed_email_domains_select ON public.allowed_email_domains;
CREATE POLICY allowed_email_domains_select ON public.allowed_email_domains
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS allowed_email_domains_admin ON public.allowed_email_domains;
CREATE POLICY allowed_email_domains_admin ON public.allowed_email_domains
    FOR ALL TO authenticated 
    USING (public.has_global_role('SUPER_ADMIN') OR public.has_global_role('SYSTEM_ADMIN'));

DROP POLICY IF EXISTS email_allowlist_select ON public.email_allowlist;
CREATE POLICY email_allowlist_select ON public.email_allowlist
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS email_allowlist_admin ON public.email_allowlist;
CREATE POLICY email_allowlist_admin ON public.email_allowlist
    FOR ALL TO authenticated 
    USING (public.has_global_role('SUPER_ADMIN') OR public.has_global_role('SYSTEM_ADMIN'));

-- Seed data domain kampus
INSERT INTO public.allowed_email_domains (domain, role_hint) VALUES
    ('student.uir.ac.id', 'STUDENT'),
    ('dosen.uir.ac.id', 'LECTURER'),
    ('uir.ac.id', 'ACADEMIC_STAFF'),
    ('siakad.uir.ac.id', 'SUPER_ADMIN')
ON CONFLICT (domain) DO NOTHING;
