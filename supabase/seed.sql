-- SIAJAR Seed Data: Roles, Permissions, Role-Permissions Matrix & Demo Accounts
-- Specification: docs/SIAJAR_Dokumen_Lengkap_v3.md (Bagian 2.1, 6.2, 7.2)

-- 1. Insert Roles
INSERT INTO public.roles (id, code, name, description) VALUES
    ('10000000-0000-0000-0000-000000000001', 'STUDENT', 'Mahasiswa', 'Peserta didik yang mengikuti kelas dan pembelajaran'),
    ('10000000-0000-0000-0000-000000000002', 'LECTURER', 'Dosen', 'Pengajar dan penanggung jawab kelas serta penilaian'),
    ('10000000-0000-0000-0000-000000000003', 'TEACHING_ASSISTANT', 'Asisten Dosen', 'Membantu pengelolaan kelas dan penilaian sesuai delegasi'),
    ('10000000-0000-0000-0000-000000000004', 'PROGRAM_COORDINATOR', 'Koordinator Program Studi', 'Memantau pelaksanaan perkuliahan tingkat prodi'),
    ('10000000-0000-0000-0000-000000000005', 'ACADEMIC_STAFF', 'Staf Akademik', 'Pengelola administrasi akademik dan data master'),
    ('10000000-0000-0000-0000-000000000006', 'SYSTEM_ADMIN', 'System Administrator', 'Pengelola teknis sistem, akun, konfigurasi dan audit')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 2. Insert Permissions (Matriks Bagian 7.2)
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

-- 3. Insert Role Permissions
DO $$
DECLARE
    r_student UUID;
    r_lecturer UUID;
    r_ta UUID;
    r_coord UUID;
    r_staff UUID;
    r_admin UUID;
BEGIN
    SELECT id INTO r_student FROM public.roles WHERE code = 'STUDENT';
    SELECT id INTO r_lecturer FROM public.roles WHERE code = 'LECTURER';
    SELECT id INTO r_ta FROM public.roles WHERE code = 'TEACHING_ASSISTANT';
    SELECT id INTO r_coord FROM public.roles WHERE code = 'PROGRAM_COORDINATOR';
    SELECT id INTO r_staff FROM public.roles WHERE code = 'ACADEMIC_STAFF';
    SELECT id INTO r_admin FROM public.roles WHERE code = 'SYSTEM_ADMIN';

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

    -- TEACHING_ASSISTANT default base permissions (delegable permissions assigned per class)
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
END $$;

-- 4. Insert Demo Accounts into auth.users (kata sandi dibaca dari konfigurasi sesi/environment, bukan ditulis di kode)
DO $$
DECLARE
    pwd_hash text := crypt(coalesce(nullif(current_setting('app.settings.demo_password', true), ''), md5(random()::text)), gen_salt('bf', 10));
    r_student UUID;
    r_lecturer UUID;
    r_ta UUID;
    r_coord UUID;
    r_staff UUID;
    r_admin UUID;
BEGIN
    SELECT id INTO r_student FROM public.roles WHERE code = 'STUDENT';
    SELECT id INTO r_lecturer FROM public.roles WHERE code = 'LECTURER';
    SELECT id INTO r_ta FROM public.roles WHERE code = 'TEACHING_ASSISTANT';
    SELECT id INTO r_coord FROM public.roles WHERE code = 'PROGRAM_COORDINATOR';
    SELECT id INTO r_staff FROM public.roles WHERE code = 'ACADEMIC_STAFF';
    SELECT id INTO r_admin FROM public.roles WHERE code = 'SYSTEM_ADMIN';

    -- Check if auth schema exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        -- Demo 1: Student
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
        VALUES (
            'a0000001-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000000',
            'mhs2024001@siajar.test',
            pwd_hash,
            now(),
            '{"full_name": "Ahmad Mahasiswa", "must_change_password": false}'::jsonb,
            'authenticated',
            'authenticated',
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;

        -- Demo 2: Lecturer
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
        VALUES (
            'a0000002-0000-0000-0000-000000000002',
            '00000000-0000-0000-0000-000000000000',
            'dosen001@siajar.test',
            pwd_hash,
            now(),
            '{"full_name": "Dr. Budi Santoso, M.Kom.", "must_change_password": false}'::jsonb,
            'authenticated',
            'authenticated',
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;

        -- Demo 3: Multi-role Student + Teaching Assistant
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
        VALUES (
            'a0000003-0000-0000-0000-000000000003',
            '00000000-0000-0000-0000-000000000000',
            'mhs2024002@siajar.test',
            pwd_hash,
            now(),
            '{"full_name": "Citra Asisten", "must_change_password": false}'::jsonb,
            'authenticated',
            'authenticated',
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;

        -- Demo 4: Program Coordinator
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
        VALUES (
            'a0000004-0000-0000-0000-000000000004',
            '00000000-0000-0000-0000-000000000000',
            'kaprodi@siajar.test',
            pwd_hash,
            now(),
            '{"full_name": "Prof. Dewi Lestari, Ph.D.", "must_change_password": false}'::jsonb,
            'authenticated',
            'authenticated',
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;

        -- Demo 5: Academic Staff
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
        VALUES (
            'a0000005-0000-0000-0000-000000000005',
            '00000000-0000-0000-0000-000000000000',
            'staf@siajar.test',
            pwd_hash,
            now(),
            '{"full_name": "Eko Staf Akademik", "must_change_password": false}'::jsonb,
            'authenticated',
            'authenticated',
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;

        -- Demo 6: System Administrator
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
        VALUES (
            'a0000006-0000-0000-0000-000000000006',
            '00000000-0000-0000-0000-000000000000',
            'sysadmin@siajar.test',
            pwd_hash,
            now(),
            '{"full_name": "System Administrator", "must_change_password": false}'::jsonb,
            'authenticated',
            'authenticated',
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;

        -- Demo 7: Must Change Password User
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
        VALUES (
            'a0000007-0000-0000-0000-000000000007',
            '00000000-0000-0000-0000-000000000000',
            'newuser@siajar.test',
            pwd_hash,
            now(),
            '{"full_name": "Fajar Baru", "must_change_password": true}'::jsonb,
            'authenticated',
            'authenticated',
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;

        -- Demo 8: Locked Account User
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
        VALUES (
            'a0000008-0000-0000-0000-000000000008',
            '00000000-0000-0000-0000-000000000000',
            'locked@siajar.test',
            pwd_hash,
            now(),
            '{"full_name": "Gilang Terkunci", "must_change_password": false}'::jsonb,
            'authenticated',
            'authenticated',
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;

        -- Demo 9: Super Admin (Fiktif)
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
        VALUES (
            'a0000010-0000-0000-0000-000000000010',
            '00000000-0000-0000-0000-000000000000',
            'superadmin@siajar.test',
            pwd_hash,
            now(),
            '{"full_name": "Super Administrator", "must_change_password": false}'::jsonb,
            'authenticated',
            'authenticated',
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Profiles Insert
    INSERT INTO public.profiles (id, full_name, email, status, must_change_password, locked_until)
    VALUES
        ('a0000001-0000-0000-0000-000000000001', 'Ahmad Mahasiswa', 'mhs2024001@siajar.test', 'ACTIVE', false, null),
        ('a0000002-0000-0000-0000-000000000002', 'Dr. Budi Santoso, M.Kom.', 'dosen001@siajar.test', 'ACTIVE', false, null),
        ('a0000003-0000-0000-0000-000000000003', 'Citra Asisten', 'mhs2024002@siajar.test', 'ACTIVE', false, null),
        ('a0000004-0000-0000-0000-000000000004', 'Prof. Dewi Lestari, Ph.D.', 'kaprodi@siajar.test', 'ACTIVE', false, null),
        ('a0000005-0000-0000-0000-000000000005', 'Eko Staf Akademik', 'staf@siajar.test', 'ACTIVE', false, null),
        ('a0000006-0000-0000-0000-000000000006', 'System Administrator', 'sysadmin@siajar.test', 'ACTIVE', false, null),
        ('a0000007-0000-0000-0000-000000000007', 'Fajar Baru', 'newuser@siajar.test', 'ACTIVE', true, null),
        ('a0000008-0000-0000-0000-000000000008', 'Gilang Terkunci', 'locked@siajar.test', 'LOCKED', false, now() + INTERVAL '15 minutes'),
        ('a0000010-0000-0000-0000-000000000010', 'Super Administrator', 'superadmin@siajar.test', 'ACTIVE', false, null)
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        status = EXCLUDED.status,
        must_change_password = EXCLUDED.must_change_password,
        locked_until = EXCLUDED.locked_until;

    -- User Identifiers Insert
    INSERT INTO public.user_identifiers (user_id, type, value, is_primary) VALUES
        ('a0000001-0000-0000-0000-000000000001', 'NIM', '2024001', true),
        ('a0000001-0000-0000-0000-000000000001', 'EMAIL', 'mhs2024001@siajar.test', false),
        ('a0000002-0000-0000-0000-000000000002', 'NIDN', '0012345678', true),
        ('a0000002-0000-0000-0000-000000000002', 'EMAIL', 'dosen001@siajar.test', false),
        ('a0000003-0000-0000-0000-000000000003', 'NIM', '2024002', true),
        ('a0000003-0000-0000-0000-000000000003', 'EMAIL', 'mhs2024002@siajar.test', false),
        ('a0000004-0000-0000-0000-000000000004', 'NIDN', '0087654321', true),
        ('a0000004-0000-0000-0000-000000000004', 'EMAIL', 'kaprodi@siajar.test', false),
        ('a0000005-0000-0000-0000-000000000005', 'NIP', '198501012010121001', true),
        ('a0000005-0000-0000-0000-000000000005', 'EMAIL', 'staf@siajar.test', false),
        ('a0000006-0000-0000-0000-000000000006', 'USERNAME', 'sysadmin', true),
        ('a0000006-0000-0000-0000-000000000006', 'EMAIL', 'sysadmin@siajar.test', false),
        ('a0000007-0000-0000-0000-000000000007', 'NIM', '2024099', true),
        ('a0000007-0000-0000-0000-000000000007', 'EMAIL', 'newuser@siajar.test', false),
        ('a0000008-0000-0000-0000-000000000008', 'NIM', '2024088', true),
        ('a0000008-0000-0000-0000-000000000008', 'EMAIL', 'locked@siajar.test', false),
        ('a0000010-0000-0000-0000-000000000010', 'EMAIL', 'superadmin@siajar.test', true),
        ('a0000010-0000-0000-0000-000000000010', 'USERNAME', 'superadmin', false)
    ON CONFLICT (type, value) DO NOTHING;

    -- User Roles Assignments
    -- 1. Student -> STUDENT (Global)
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status)
    VALUES ('a0000001-0000-0000-0000-000000000001', r_student, 'GLOBAL', null, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- 2. Lecturer -> LECTURER (Global)
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status)
    VALUES ('a0000002-0000-0000-0000-000000000002', r_lecturer, 'GLOBAL', null, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- 3. Citra Asisten -> MULTI-ROLE: Both STUDENT and TEACHING_ASSISTANT!
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status)
    VALUES
        ('a0000003-0000-0000-0000-000000000003', r_student, 'GLOBAL', null, 'ACTIVE'),
        ('a0000003-0000-0000-0000-000000000003', r_ta, 'GLOBAL', null, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- 4. Kaprodi -> PROGRAM_COORDINATOR (Global)
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status)
    VALUES ('a0000004-0000-0000-0000-000000000004', r_coord, 'GLOBAL', null, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- 5. Staf -> ACADEMIC_STAFF (Global)
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status)
    VALUES ('a0000005-0000-0000-0000-000000000005', r_staff, 'GLOBAL', null, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- 6. Admin -> SYSTEM_ADMIN (Global)
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status)
    VALUES ('a0000006-0000-0000-0000-000000000006', r_admin, 'GLOBAL', null, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- 7. New User -> STUDENT (Global)
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status)
    VALUES ('a0000007-0000-0000-0000-000000000007', r_student, 'GLOBAL', null, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- 8. Locked User -> STUDENT (Global)
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status)
    VALUES ('a0000008-0000-0000-0000-000000000008', r_student, 'GLOBAL', null, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- 9. Super Admin -> SYSTEM_ADMIN, ACADEMIC_STAFF, PROGRAM_COORDINATOR, LECTURER, STUDENT (Global)
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status)
    VALUES
        ('a0000010-0000-0000-0000-000000000010', r_admin, 'GLOBAL', null, 'ACTIVE'),
        ('a0000010-0000-0000-0000-000000000010', r_staff, 'GLOBAL', null, 'ACTIVE'),
        ('a0000010-0000-0000-0000-000000000010', r_coord, 'GLOBAL', null, 'ACTIVE'),
        ('a0000010-0000-0000-0000-000000000010', r_lecturer, 'GLOBAL', null, 'ACTIVE'),
        ('a0000010-0000-0000-0000-000000000010', r_student, 'GLOBAL', null, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- System settings default
    INSERT INTO public.system_settings (key, value_json) VALUES
        ('login.max_attempts', '5'::jsonb),
        ('login.lockout_minutes', '15'::jsonb),
        ('security.force_mfa', 'false'::jsonb)
    ON CONFLICT (key) DO NOTHING;

END $$;
