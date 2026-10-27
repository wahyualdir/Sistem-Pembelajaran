-- Migration: Seed Peran Baru (PROGRAM_SECRETARY, LAB_HEAD, DEAN) dan Matriks Izin (Fase 1.1)
-- Rollback:
--   DELETE FROM public.role_permissions WHERE role_id IN ('10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000013');
--   DELETE FROM public.roles WHERE id IN ('10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000013');
--   DELETE FROM public.permissions WHERE code IN ('advisory.assign', 'advisory.view', 'lab.manage', 'faculty.view');

-- 1. Insert New Roles
INSERT INTO public.roles (id, code, name, description) VALUES
    ('10000000-0000-0000-0000-000000000011', 'PROGRAM_SECRETARY', 'Sekretaris Program Studi', 'Membantu koordinasi akademik dan operasional program studi'),
    ('10000000-0000-0000-0000-000000000012', 'LAB_HEAD', 'Kepala Laboratorium', 'Mengelola fasilitas laboratorium, praktikum, dan asisten lab'),
    ('10000000-0000-0000-0000-000000000013', 'DEAN', 'Dekan', 'Memantau capaian akademik, risiko, dan evaluasi agregat tingkat fakultas')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 2. Insert Permissions Khusus
INSERT INTO public.permissions (code, resource, action, description) VALUES
    ('advisory.assign', 'advisory', 'assign', 'Menetapkan dan mengganti penugasan Dosen Wali'),
    ('advisory.view', 'advisory', 'view', 'Melihat data relasi perwalian akademik'),
    ('lab.manage', 'lab', 'manage', 'Mengelola fasilitas laboratorium dan penugasan asisten lab'),
    ('faculty.view', 'faculty', 'view', 'Melihat pemantauan dan analitik agregat tingkat fakultas')
ON CONFLICT (code) DO NOTHING;

-- 3. Hubungkan Role Permissions
DO $$
DECLARE
    r_coord UUID;
    r_sec UUID;
    r_lab UUID;
    r_dean UUID;
    r_staff UUID;
BEGIN
    SELECT id INTO r_coord FROM public.roles WHERE code = 'PROGRAM_COORDINATOR';
    SELECT id INTO r_sec FROM public.roles WHERE code = 'PROGRAM_SECRETARY';
    SELECT id INTO r_lab FROM public.roles WHERE code = 'LAB_HEAD';
    SELECT id INTO r_dean FROM public.roles WHERE code = 'DEAN';
    SELECT id INTO r_staff FROM public.roles WHERE code = 'ACADEMIC_STAFF';

    -- Tambahan izin advisory untuk PROGRAM_COORDINATOR dan ACADEMIC_STAFF (bila role sudah ada di DB)
    IF r_coord IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT r_coord, id FROM public.permissions WHERE code IN ('advisory.assign', 'advisory.view')
        ON CONFLICT DO NOTHING;
    END IF;

    IF r_staff IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT r_staff, id FROM public.permissions WHERE code IN ('advisory.assign', 'advisory.view')
        ON CONFLICT DO NOTHING;
    END IF;

    -- PROGRAM_SECRETARY permissions (menyiapkan & verifikasi, TANPA grade.change_approve dan audit.view)
    IF r_sec IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT r_sec, id FROM public.permissions WHERE code IN (
            'class.view', 'class.update', 'class.manage_members', 'class.assign_staff',
            'material.view', 'announcement.manage', 'analytics.program', 'report.export',
            'advisory.assign', 'advisory.view'
        ) ON CONFLICT DO NOTHING;
    END IF;

    -- LAB_HEAD permissions (kelola lab, asisten lab, rekap praktikum, TANPA ubah nilai)
    IF r_lab IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT r_lab, id FROM public.permissions WHERE code IN (
            'class.view', 'material.view', 'analytics.class', 'report.export',
            'lab.manage'
        ) ON CONFLICT DO NOTHING;
    END IF;

    -- DEAN permissions (hanya baca agregat fakultas & ekspor laporan, TANPA nilai per mahasiswa / audit log)
    IF r_dean IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        SELECT r_dean, id FROM public.permissions WHERE code IN (
            'analytics.program', 'report.export', 'faculty.view'
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;
