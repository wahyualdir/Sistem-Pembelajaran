-- ============================================================================
-- SIAJAR Seed Referensi (Hanya Data Master/Katalog, Tanpa Akun Demo)
-- Spesifikasi: docs/SIAJAR_Dokumen_Lengkap_v3.md (Bagian 2.1, 6.2, 7.2)
-- Aman untuk Produksi: Tidak membuat pengguna auth.users maupun profil demo.
-- ============================================================================

-- 1. Insert 7 Roles Standar SIAJAR
INSERT INTO public.roles (id, code, name, description) VALUES
    ('10000000-0000-0000-0000-000000000001', 'STUDENT', 'Mahasiswa', 'Peserta didik yang mengikuti kelas dan pembelajaran'),
    ('10000000-0000-0000-0000-000000000002', 'LECTURER', 'Dosen', 'Pengajar dan penanggung jawab kelas serta penilaian'),
    ('10000000-0000-0000-0000-000000000003', 'TEACHING_ASSISTANT', 'Asisten Dosen', 'Membantu pengelolaan kelas dan penilaian sesuai delegasi'),
    ('10000000-0000-0000-0000-000000000004', 'PROGRAM_COORDINATOR', 'Koordinator Program Studi', 'Memantau pelaksanaan perkuliahan tingkat prodi'),
    ('10000000-0000-0000-0000-000000000005', 'ACADEMIC_STAFF', 'Staf Akademik', 'Pengelola administrasi akademik dan data master'),
    ('10000000-0000-0000-0000-000000000006', 'SYSTEM_ADMIN', 'System Administrator', 'Pengelola teknis sistem, akun, konfigurasi dan audit'),
    ('10000000-0000-0000-0000-000000000010', 'SUPER_ADMIN', 'Super Administrator', 'Akses tak terbatas untuk audit, pemulihan, dan bypass proteksi darurat')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 2. Insert 38 Permissions (Matriks Perizinan Resmi)
INSERT INTO public.permissions (code, resource, action, description) VALUES
    ('class.view', 'class', 'view', 'Melihat detail kelas'),
    ('class.create', 'class', 'create', 'Membuat kelas baru'),
    ('class.update', 'class', 'update', 'Memperbarui data kelas'),
    ('class.join', 'class', 'join', 'Bergabung ke dalam kelas'),
    ('class.manage_members', 'class', 'manage_members', 'Mengelola peserta kelas'),
    ('class.assign_staff', 'class', 'assign_staff', 'Menugaskan dosen atau asisten'),
    ('material.view', 'material', 'view', 'Melihat materi perkuliahan'),
    ('material.manage', 'material', 'manage', 'Membuat atau menyunting materi'),
    ('announcement.manage', 'announcement', 'manage', 'Membuat atau mengelola pengumuman'),
    ('assignment.create', 'assignment', 'create', 'Membuat tugas kuliah'),
    ('assignment.update', 'assignment', 'update', 'Memperbarui tugas kuliah'),
    ('assignment.submit', 'assignment', 'submit', 'Mengumpulkan tugas kuliah'),
    ('submission.view_own', 'submission', 'view_own', 'Melihat tugas yang dikumpulkan sendiri'),
    ('submission.review', 'submission', 'review', 'Memeriksa dan memberikan umpan balik tugas'),
    ('assignment.grade', 'assignment', 'grade', 'Memberi draf penilaian tugas'),
    ('grade.finalize', 'grade', 'finalize', 'Memfinalisasi nilai resmi perkuliahan'),
    ('grade.view_own', 'grade', 'view_own', 'Melihat nilai milik sendiri'),
    ('grade.view_class', 'grade', 'view_class', 'Melihat rekap nilai kelas'),
    ('grade.change_request', 'grade', 'change_request', 'Mengajukan permohonan perubahan nilai final'),
    ('grade.change_approve', 'grade', 'change_approve', 'Menyetujui perubahan nilai final'),
    ('quiz.manage', 'quiz', 'manage', 'Mengelola kuis dan ujian'),
    ('question.manage', 'question', 'manage', 'Mengelola bank soal'),
    ('quiz.attempt', 'quiz', 'attempt', 'Mengerjakan kuis atau ujian'),
    ('discussion.post', 'discussion', 'post', 'Membuat utas dan balasan diskusi'),
    ('discussion.moderate', 'discussion', 'moderate', 'Memoderasi diskusi kelas'),
    ('attendance.manage', 'attendance', 'manage', 'Mengelola sesi dan presensi kehadiran'),
    ('attendance.view_own', 'attendance', 'view_own', 'Melihat rekap kehadiran pribadi'),
    ('analytics.class', 'analytics', 'class', 'Melihat analitik kelas'),
    ('analytics.program', 'analytics', 'program', 'Melihat analitik program studi'),
    ('report.export', 'report', 'export', 'Mengekspor laporan akademik'),
    ('masterdata.manage', 'masterdata', 'manage', 'Mengelola master data akademik'),
    ('user.manage_academic', 'user', 'manage_academic', 'Mengelola data profil akademik'),
    ('user.manage_account', 'user', 'manage_account', 'Mengelola akun, status, dan reset'),
    ('role.assign', 'role', 'assign', 'Menetapkan role dan hak akses pengguna'),
    ('permission.manage', 'permission', 'manage', 'Mengelola matriks perizinan'),
    ('audit.view', 'audit', 'view', 'Melihat catatan audit log'),
    ('system.config', 'system', 'config', 'Mengelola konfigurasi sistem'),
    ('backup.manage', 'backup', 'manage', 'Mengelola backup dan pemulihan sistem')
ON CONFLICT (code) DO NOTHING;

-- 3. Matriks Peran & Perizinan (Role Permissions)
DO $$
DECLARE
    r_student UUID;
    r_lecturer UUID;
    r_ta UUID;
    r_coord UUID;
    r_staff UUID;
    r_admin UUID;
    r_super UUID;
BEGIN
    SELECT id INTO r_student FROM public.roles WHERE code = 'STUDENT';
    SELECT id INTO r_lecturer FROM public.roles WHERE code = 'LECTURER';
    SELECT id INTO r_ta FROM public.roles WHERE code = 'TEACHING_ASSISTANT';
    SELECT id INTO r_coord FROM public.roles WHERE code = 'PROGRAM_COORDINATOR';
    SELECT id INTO r_staff FROM public.roles WHERE code = 'ACADEMIC_STAFF';
    SELECT id INTO r_admin FROM public.roles WHERE code = 'SYSTEM_ADMIN';
    SELECT id INTO r_super FROM public.roles WHERE code = 'SUPER_ADMIN';

    -- STUDENT permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT r_student, id FROM public.permissions WHERE code IN (
        'class.view', 'class.join', 'material.view', 'assignment.submit',
        'submission.view_own', 'grade.view_own', 'quiz.attempt',
        'discussion.post', 'attendance.view_own', 'analytics.class'
    ) ON CONFLICT DO NOTHING;

    -- LECTURER permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT r_lecturer, id FROM public.permissions WHERE code IN (
        'class.view', 'class.create', 'class.update', 'class.manage_members',
        'class.assign_staff', 'material.view', 'material.manage', 'announcement.manage',
        'assignment.create', 'assignment.update', 'submission.review', 'assignment.grade',
        'grade.finalize', 'grade.view_class', 'grade.change_request', 'quiz.manage',
        'question.manage', 'discussion.post', 'discussion.moderate', 'attendance.manage',
        'analytics.class'
    ) ON CONFLICT DO NOTHING;

    -- TEACHING_ASSISTANT default base permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT r_ta, id FROM public.permissions WHERE code IN (
        'class.view', 'material.view', 'discussion.post', 'grade.view_class',
        'submission.review', 'assignment.grade', 'analytics.class'
    ) ON CONFLICT DO NOTHING;

    -- PROGRAM_COORDINATOR permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT r_coord, id FROM public.permissions WHERE code IN (
        'class.view', 'class.assign_staff', 'material.view', 'grade.view_class',
        'grade.change_approve', 'analytics.class', 'analytics.program',
        'report.export', 'masterdata.manage', 'audit.view'
    ) ON CONFLICT DO NOTHING;

    -- ACADEMIC_STAFF permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT r_staff, id FROM public.permissions WHERE code IN (
        'class.view', 'class.create', 'class.update', 'class.manage_members',
        'class.assign_staff', 'grade.view_class', 'analytics.class',
        'analytics.program', 'report.export', 'masterdata.manage', 'user.manage_academic'
    ) ON CONFLICT DO NOTHING;

    -- SYSTEM_ADMIN permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT r_admin, id FROM public.permissions WHERE code IN (
        'class.view', 'user.manage_account', 'role.assign', 'permission.manage',
        'audit.view', 'system.config', 'backup.manage'
    ) ON CONFLICT DO NOTHING;

    -- SUPER_ADMIN permissions (semua perizinan sistem)
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT r_super, id FROM public.permissions
    ON CONFLICT DO NOTHING;
END $$;

-- 4. Pengaturan Sistem Awal (System Settings Default)
INSERT INTO public.system_settings (key, value_json) VALUES
    ('login.max_attempts', '5'::jsonb),
    ('login.lockout_minutes', '15'::jsonb),
    ('security.force_mfa', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
