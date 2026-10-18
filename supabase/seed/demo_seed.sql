-- ====================================================================
-- SIAJAR Demo Seed Script (Fase 7 - Data Contoh Realistis)
-- Spesifikasi: docs/INSTRUKSI_ANTIGRAVITY.md (Bagian 14.3)
-- 1 Prodi, 2 Semester, 8 Dosen, 3 Asisten, 120 Mahasiswa, 
-- 6 Kelas x 16 Pertemuan, Tugas Individu & Kelompok, Ujian 40 Soal CBT,
-- 1 Periode Evaluasi Dosen, Sanggahan Nilai, Permohonan Izin, Pesan, Polling.
-- ====================================================================

DO $$
DECLARE
    -- ID Master
    v_prog_id UUID := '11111111-1111-1111-1111-111111111111';
    v_sem_past_id UUID := '22222222-2222-2222-2222-222222222221';
    v_sem_act_id UUID := '22222222-2222-2222-2222-222222222222';
    
    -- Role IDs
    r_student UUID;
    r_lecturer UUID;
    r_ta UUID;
    r_coord UUID;
    r_staff UUID;
    r_admin UUID;
    r_super UUID;
    
    -- Profil Utama
    u_super UUID := 'a0000010-0000-0000-0000-000000000010';
    u_admin UUID := 'a0000006-0000-0000-0000-000000000006';
    u_staff UUID := 'a0000005-0000-0000-0000-000000000005';
    u_coord UUID := 'a0000004-0000-0000-0000-000000000004';
    u_dosen_utama UUID := 'a0000002-0000-0000-0000-000000000002';
    u_ta_utama UUID := 'a0000003-0000-0000-0000-000000000003';
    u_mhs_utama UUID := 'a0000001-0000-0000-0000-000000000001';
    
    -- Dosen 2 - 8
    v_dosen_ids UUID[] := ARRAY[
        'b0000001-0000-0000-0000-000000000001'::UUID,
        'b0000001-0000-0000-0000-000000000002'::UUID,
        'b0000001-0000-0000-0000-000000000003'::UUID,
        'b0000001-0000-0000-0000-000000000004'::UUID,
        'b0000001-0000-0000-0000-000000000005'::UUID,
        'b0000001-0000-0000-0000-000000000006'::UUID,
        'b0000001-0000-0000-0000-000000000007'::UUID
    ];
    
    -- Asisten 2 & 3
    v_ta2 UUID := 'c0000001-0000-0000-0000-000000000002';
    v_ta3 UUID := 'c0000001-0000-0000-0000-000000000003';
    
    -- Kelas IDs
    c_web UUID := 'd0000001-0000-0000-0000-000000000001';
    c_bd UUID  := 'd0000001-0000-0000-0000-000000000002';
    c_asd UUID := 'd0000001-0000-0000-0000-000000000003';
    c_ai UUID  := 'd0000001-0000-0000-0000-000000000004';
    c_rpl UUID := 'd0000001-0000-0000-0000-000000000005';
    c_jarkom UUID := 'd0000001-0000-0000-0000-000000000006'; -- Kelas arsip
    
    v_cur_mhs UUID;
    v_nim TEXT;
    v_name TEXT;
    i INT;
    s INT;
    v_session_id UUID;
    v_quiz_id UUID := 'e0000001-0000-0000-0000-000000000001';
    v_assign1 UUID := 'f0000001-0000-0000-0000-000000000001';
    v_assign2 UUID := 'f0000001-0000-0000-0000-000000000002';
    v_groupset UUID := 'f1000001-0000-0000-0000-000000000001';
    v_group1 UUID := 'f2000001-0000-0000-0000-000000000001';
    v_group2 UUID := 'f2000001-0000-0000-0000-000000000002';
    v_edom_period UUID := 'e1000001-0000-0000-0000-000000000001';
    v_edom_target UUID := 'e2000001-0000-0000-0000-000000000001';
    v_poll_id UUID := 'e3000001-0000-0000-0000-000000000001';
    v_conv_id UUID := 'e4000001-0000-0000-0000-000000000001';
BEGIN
    -- =================================================================
    -- PENGAMAN PRODUKSI (FAIL-CLOSED PRODUCTION SAFEGUARD)
    -- demo_seed.sql hanya boleh dijalankan jika app.environment bernilai tepat 'local' atau 'staging'.
    -- Kosong, NULL, nilai lain, atau tidak diatur HARUS melempar exception.
    -- =================================================================
    IF COALESCE(current_setting('app.environment', true), '') NOT IN ('local', 'staging') THEN
        RAISE EXCEPTION 'EKSEKUSI DITOLAK (FAIL-CLOSED): demo_seed.sql hanya boleh dijalankan pada lingkungan lokal atau staging (current_setting(''app.environment'') bernilai tepat ''local'' atau ''staging''). Nilai saat ini: ''%''.',
            COALESCE(current_setting('app.environment', true), '<tidak diatur>');
    END IF;

    -- Ambil referensi peran
    SELECT id INTO r_student FROM public.roles WHERE code = 'STUDENT';

    SELECT id INTO r_lecturer FROM public.roles WHERE code = 'LECTURER';
    SELECT id INTO r_ta FROM public.roles WHERE code = 'TEACHING_ASSISTANT';
    SELECT id INTO r_coord FROM public.roles WHERE code = 'PROGRAM_COORDINATOR';
    SELECT id INTO r_staff FROM public.roles WHERE code = 'ACADEMIC_STAFF';
    SELECT id INTO r_admin FROM public.roles WHERE code = 'SYSTEM_ADMIN';
    SELECT id INTO r_super FROM public.roles WHERE code = 'SUPER_ADMIN';

    -- 1. Program Studi: Teknik Informatika
    INSERT INTO public.programs (id, code, name, is_active)
    VALUES (v_prog_id, 'TI', 'Teknik Informatika', true)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active;

    -- 2. Dua Semester: 2025/2026 Genap (Arsip) & 2026/2027 Ganjil (Aktif)
    INSERT INTO public.semesters (id, label, is_active)
    VALUES 
        (v_sem_past_id, '2025/2026 Genap', false),
        (v_sem_act_id, '2026/2027 Ganjil', true)
    ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, is_active = EXCLUDED.is_active;

    -- 3. Akun Demo Inti (7 Role Standar)
    -- Super Admin
    INSERT INTO public.profiles (id, full_name, email, status)
    VALUES (u_super, 'Prof. Dr. Syafrinaldi, S.H., M.C.L.', 'superadmin@uir.ac.id', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- System Admin
    INSERT INTO public.profiles (id, full_name, email, status)
    VALUES (u_admin, 'Eko Prasetyo, S.T.', 'sysadmin@uir.ac.id', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Staf Akademik
    INSERT INTO public.profiles (id, full_name, email, status)
    VALUES (u_staff, 'Siti Rahmawati, S.Kom.', 'staf.akademik@uir.ac.id', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Kaprodi
    INSERT INTO public.profiles (id, full_name, email, status)
    VALUES (u_coord, 'Dr. Eng. H. Faisal Rahman, S.T., M.T.', 'kaprodi.ti@uir.ac.id', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Dosen Utama
    INSERT INTO public.profiles (id, full_name, email, status)
    VALUES (u_dosen_utama, 'Dr. Ir. Budi Santoso, M.Kom.', 'dosen.utama@uir.ac.id', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Asisten Utama
    INSERT INTO public.profiles (id, full_name, email, status)
    VALUES (u_ta_utama, 'Citra Lestari', 'asisten.lab@student.uir.ac.id', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Mahasiswa Utama
    INSERT INTO public.profiles (id, full_name, email, status)
    VALUES (u_mhs_utama, 'Ahmad Dahlan', 'mhs.alpha@student.uir.ac.id', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Identifiers akun demo
    INSERT INTO public.user_identifiers (user_id, type, value, is_primary) VALUES
        (u_mhs_utama, 'NIM', '2024010001', true),
        (u_ta_utama, 'NIM', '2022010001', true),
        (u_dosen_utama, 'NIDN', '0012345678', true),
        (u_coord, 'NIDN', '0087654321', true),
        (u_staff, 'NIP', '198501012010121001', true),
        (u_admin, 'USERNAME', 'sysadmin', true),
        (u_super, 'USERNAME', 'superadmin', true)
    ON CONFLICT (type, value) DO NOTHING;

    -- 4. Tambahan 7 Dosen (Total 8 Dosen Pengampu)
    INSERT INTO public.profiles (id, full_name, email, status) VALUES
        (v_dosen_ids[1], 'Dr. Hendra Wijaya, M.T.', 'hendra.wijaya@uir.ac.id', 'ACTIVE'),
        (v_dosen_ids[2], 'Dewi Sartika, S.T., M.Cs.', 'dewi.sartika@uir.ac.id', 'ACTIVE'),
        (v_dosen_ids[3], 'Arif Wicaksono, M.Kom.', 'arif.wicaksono@uir.ac.id', 'ACTIVE'),
        (v_dosen_ids[4], 'Rini Anggraini, S.Kom., M.T.', 'rini.anggraini@uir.ac.id', 'ACTIVE'),
        (v_dosen_ids[5], 'Muhammad Ridwan, Ph.D.', 'muhammad.ridwan@uir.ac.id', 'ACTIVE'),
        (v_dosen_ids[6], 'Fitri Handayani, M.Kom.', 'fitri.handayani@uir.ac.id', 'ACTIVE'),
        (v_dosen_ids[7], 'Agus Setiawan, S.T., M.Eng.', 'agus.setiawan@uir.ac.id', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    FOR i IN 1..7 LOOP
        INSERT INTO public.user_identifiers (user_id, type, value, is_primary)
        VALUES (v_dosen_ids[i], 'NIDN', '002000000' || i::text, true)
        ON CONFLICT (type, value) DO NOTHING;

        INSERT INTO public.user_roles (user_id, role_id, scope_type, status)
        VALUES (v_dosen_ids[i], r_lecturer, 'GLOBAL', 'ACTIVE')
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- 5. Tambahan 2 Asisten Dosen (Total 3 Asisten Dosen)
    INSERT INTO public.profiles (id, full_name, email, status) VALUES
        (v_ta2, 'Dimas Pratama', 'dimas.pratama@student.uir.ac.id', 'ACTIVE'),
        (v_ta3, 'Nabila Putri', 'nabila.putri@student.uir.ac.id', 'ACTIVE')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    INSERT INTO public.user_identifiers (user_id, type, value, is_primary) VALUES
        (v_ta2, 'NIM', '2022010002', true),
        (v_ta3, 'NIM', '2022010003', true)
    ON CONFLICT (type, value) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role_id, scope_type, status) VALUES
        (v_ta2, r_student, 'GLOBAL', 'ACTIVE'),
        (v_ta2, r_ta, 'GLOBAL', 'ACTIVE'),
        (v_ta3, r_student, 'GLOBAL', 'ACTIVE'),
        (v_ta3, r_ta, 'GLOBAL', 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- 6. Generate 120 Mahasiswa Fiktif
    FOR i IN 1..120 LOOP
        v_cur_mhs := ('a1000000-0000-0000-0000-' || LPAD(i::text, 12, '0'))::UUID;
        v_nim := '202401' || LPAD(i::text, 4, '0');
        v_name := 'Mahasiswa Contoh ' || i::text;

        INSERT INTO public.profiles (id, full_name, email, status)
        VALUES (v_cur_mhs, v_name, 'mhs' || i::text || '@student.uir.ac.id', 'ACTIVE')
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.user_identifiers (user_id, type, value, is_primary)
        VALUES (v_cur_mhs, 'NIM', v_nim, true)
        ON CONFLICT (type, value) DO NOTHING;

        INSERT INTO public.user_roles (user_id, role_id, scope_type, status)
        VALUES (v_cur_mhs, r_student, 'GLOBAL', 'ACTIVE')
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- 7. Mata Kuliah
    INSERT INTO public.courses (id, program_id, code, name, credits, is_active) VALUES
        ('c1111111-0000-0000-0000-000000000001', v_prog_id, 'TIF2101', 'Pemrograman Web', 3, true),
        ('c1111111-0000-0000-0000-000000000002', v_prog_id, 'TIF2102', 'Basis Data Lanjut', 3, true),
        ('c1111111-0000-0000-0000-000000000003', v_prog_id, 'TIF2103', 'Algoritma dan Struktur Data', 3, true),
        ('c1111111-0000-0000-0000-000000000004', v_prog_id, 'TIF3101', 'Kecerdasan Buatan', 3, true),
        ('c1111111-0000-0000-0000-000000000005', v_prog_id, 'TIF3102', 'Rekayasa Perangkat Lunak', 3, true),
        ('c1111111-0000-0000-0000-000000000006', v_prog_id, 'TIF2201', 'Jaringan Komputer', 3, true)
    ON CONFLICT (id) DO NOTHING;

    -- 8. 6 Kelas (5 Aktif Semester 2026/2027 Ganjil, 1 Arsip Semester 2025/2026 Genap)
    INSERT INTO public.classes (id, course_id, semester_id, title, section, join_code, capacity, status, created_by)
    VALUES 
        (c_web, 'c1111111-0000-0000-0000-000000000001', v_sem_act_id, 'Pemrograman Web', 'A', 'WEB2026A', 40, 'ACTIVE', u_dosen_utama),
        (c_bd,  'c1111111-0000-0000-0000-000000000002', v_sem_act_id, 'Basis Data Lanjut', 'B', 'BDL2026B', 40, 'ACTIVE', v_dosen_ids[2]),
        (c_asd, 'c1111111-0000-0000-0000-000000000003', v_sem_act_id, 'Algoritma dan Struktur Data', 'C', 'ASD2026C', 40, 'ACTIVE', v_dosen_ids[3]),
        (c_ai,  'c1111111-0000-0000-0000-000000000004', v_sem_act_id, 'Kecerdasan Buatan', 'A', 'AI2026AA', 40, 'ACTIVE', v_dosen_ids[5]),
        (c_rpl, 'c1111111-0000-0000-0000-000000000005', v_sem_act_id, 'Rekayasa Perangkat Lunak', 'B', 'RPL2026B', 40, 'ACTIVE', v_dosen_ids[1]),
        (c_jarkom, 'c1111111-0000-0000-0000-000000000006', v_sem_past_id, 'Jaringan Komputer', 'A', 'JAR2025A', 40, 'ARCHIVED', v_dosen_ids[7])
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- Penetapan Asisten Dosen pada Kelas Pemrograman Web
    INSERT INTO public.class_assistants (class_id, assistant_id, can_open_attendance, can_grade)
    VALUES (c_web, u_ta_utama, true, true)
    ON CONFLICT DO NOTHING;

    -- 9. Enrollments Mahasiswa ke Kelas
    -- Mahasiswa Utama enroll ke Pemrograman Web, Basis Data Lanjut, dan Jaringan Komputer
    INSERT INTO public.enrollments (class_id, student_id, status) VALUES
        (c_web, u_mhs_utama, 'ACTIVE'),
        (c_bd,  u_mhs_utama, 'ACTIVE'),
        (c_jarkom, u_mhs_utama, 'COMPLETED')
    ON CONFLICT DO NOTHING;

    -- Bagi 120 mahasiswa ke dalam 6 kelas
    FOR i IN 1..120 LOOP
        v_cur_mhs := ('a1000000-0000-0000-0000-' || LPAD(i::text, 12, '0'))::UUID;
        IF i <= 40 THEN
            INSERT INTO public.enrollments (class_id, student_id, status) VALUES (c_web, v_cur_mhs, 'ACTIVE') ON CONFLICT DO NOTHING;
            INSERT INTO public.enrollments (class_id, student_id, status) VALUES (c_bd, v_cur_mhs, 'ACTIVE') ON CONFLICT DO NOTHING;
        ELSIF i <= 80 THEN
            INSERT INTO public.enrollments (class_id, student_id, status) VALUES (c_asd, v_cur_mhs, 'ACTIVE') ON CONFLICT DO NOTHING;
            INSERT INTO public.enrollments (class_id, student_id, status) VALUES (c_ai, v_cur_mhs, 'ACTIVE') ON CONFLICT DO NOTHING;
        ELSE
            INSERT INTO public.enrollments (class_id, student_id, status) VALUES (c_rpl, v_cur_mhs, 'ACTIVE') ON CONFLICT DO NOTHING;
            INSERT INTO public.enrollments (class_id, student_id, status) VALUES (c_jarkom, v_cur_mhs, 'COMPLETED') ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;

    -- 10. 16 Sesi Pertemuan untuk Setiap Kelas
    FOR s IN 1..16 LOOP
        -- Sesi Kelas Pemrograman Web
        INSERT INTO public.attendance_sessions (
            id, class_id, session_number, title, description, session_date, status, code, created_by
        ) VALUES (
            ('d1000001-0000-0000-0000-' || LPAD(s::text, 12, '0'))::UUID,
            c_web,
            s,
            'Pertemuan ke-' || s::text || ': Konsep dan Praktik Web Modern',
            'Pembahasan materi kurikulum pertemuan ke-' || s::text,
            (current_date - INTERVAL '7 day' * (16 - s)),
            CASE WHEN s <= 8 THEN 'CLOSED'::public.attendance_session_status ELSE 'OPEN'::public.attendance_session_status END,
            'WEB' || LPAD(s::text, 3, '0'),
            u_dosen_utama
        ) ON CONFLICT (class_id, session_number) DO NOTHING;

        -- Berita Acara Perkuliahan untuk Sesi yang sudah selesai
        IF s <= 8 THEN
            INSERT INTO public.class_session_journals (
                class_id, session_number, lecture_date, material_covered, teaching_method, student_attendance_count, lecturer_id
            ) VALUES (
                c_web, s, (current_date - INTERVAL '7 day' * (16 - s)),
                'Materi tatap muka sesi ' || s::text || ' sesuai dengan Rencana Pembelajaran Semester.',
                'Ceramah interaktif dan demonstrasi koding langsung di laboratorium.',
                38, u_dosen_utama
            ) ON CONFLICT (class_id, session_number) DO NOTHING;
        END IF;
    END LOOP;

    -- 11. Penugasan Individu & Kelompok
    -- Tugas 1 Individu dengan Penalti Keterlambatan
    INSERT INTO public.assignments (
        id, class_id, title, description, due_at, late_policy, late_penalty_value, late_penalty_cap, allow_resubmit, submission_mode, created_by
    ) VALUES (
        v_assign1, c_web, 'Tugas 1: Desain Halaman Profil Responsif',
        'Buat halaman profil HTML dan CSS responsif dengan Semantic HTML.',
        now() + INTERVAL '3 day', 'per_day', 10, 50, true, 'individual', u_dosen_utama
    ) ON CONFLICT (id) DO NOTHING;

    -- Tugas 2 Kelompok dengan Set Kelompok
    INSERT INTO public.group_sets (id, class_id, name, formation, min_size, max_size, created_by)
    VALUES (v_groupset, c_web, 'Proyek Aplikasi Web', 'self', 2, 4, u_dosen_utama)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.groups (id, set_id, name, join_code) VALUES
        (v_group1, v_groupset, 'Kelompok Alpha', 'ALPH01'),
        (v_group2, v_groupset, 'Kelompok Beta', 'BETA02')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.group_members (group_id, set_id, student_id, role) VALUES
        (v_group1, v_groupset, u_mhs_utama, 'leader')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assignments (
        id, class_id, title, description, due_at, submission_mode, group_set_id, created_by
    ) VALUES (
        v_assign2, c_web, 'Tugas Besar: Aplikasi Manajemen Kampus',
        'Bangun sistem web dinamis menggunakan arsitektur MVC secara berkelompok.',
        now() + INTERVAL '14 day', 'group', v_groupset, u_dosen_utama
    ) ON CONFLICT (id) DO NOTHING;

    -- Perpanjangan Tenggat Tugas untuk Kelompok Alpha
    INSERT INTO public.assignment_extensions (assignment_id, group_id, new_due_at, reason, granted_by)
    VALUES (v_assign2, v_group1, now() + INTERVAL '17 day', 'Perpanjangan resmi untuk finalisasi integrasi API', u_dosen_utama)
    ON CONFLICT DO NOTHING;

    -- 12. Ujian CBT Komprehensif (40 Butir Soal Beragam)
    INSERT INTO public.quizzes (
        id, class_id, title, description, duration_minutes, starts_at, ends_at, is_published, requires_webcam, max_attempts, created_by
    ) VALUES (
        v_quiz_id, c_web, 'Ujian Tengah Semester: Pemrograman Web',
        'Evaluasi komprehensif teori web, logika javascript, dan pengujian koding otomatis.',
        90, now() - INTERVAL '1 hour', now() + INTERVAL '5 hour', true, true, 1, u_dosen_utama
    ) ON CONFLICT (id) DO NOTHING;

    -- 40 Butir Soal: 20 Pilihan Ganda, 8 Benar/Salah, 5 Isian, 4 Esai, 3 Koding
    FOR i IN 1..40 LOOP
        INSERT INTO public.quiz_questions (
            id, quiz_id, question_text, question_type, points, order_index
        ) VALUES (
            ('e0100001-0000-0000-0000-' || LPAD(i::text, 12, '0'))::UUID,
            v_quiz_id,
            CASE 
                WHEN i <= 20 THEN 'Soal ' || i::text || ' (Pilihan Ganda): Manakah protokol standar komunikasi web modern?'
                WHEN i <= 28 THEN 'Soal ' || i::text || ' (Benar/Salah): HTTP/2 mendukung multiplexing dalam satu koneksi TCP.'
                WHEN i <= 33 THEN 'Soal ' || i::text || ' (Isian Singkat): Sebutkan tag HTML5 yang digunakan untuk memuat script modul!'
                WHEN i <= 37 THEN 'Soal ' || i::text || ' (Esai): Jelaskan perbedaan rendering sisi klien (CSR) dan rendering sisi server (SSR) beserta dampaknya pada SEO!'
                ELSE 'Soal ' || i::text || ' (Koding): Buat fungsi JavaScript hitungFaktorial(n) yang mengembalikan faktorial dari bilangan bulat positif n!'
            END,
            CASE 
                WHEN i <= 20 THEN 'MULTIPLE_CHOICE'
                WHEN i <= 28 THEN 'TRUE_FALSE'
                WHEN i <= 33 THEN 'SHORT_ANSWER'
                WHEN i <= 37 THEN 'ESSAY'
                ELSE 'CODING'
            END,
            CASE WHEN i <= 20 THEN 2 WHEN i <= 28 THEN 2 WHEN i <= 33 THEN 3 WHEN i <= 37 THEN 5 ELSE 10 END,
            i
        ) ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- 13. Periode Evaluasi Dosen (EDOM) dengan True Anonymity Decoupling
    INSERT INTO public.evaluation_periods (
        id, name, opens_at, closes_at, status, require_before_final_grades, created_by
    ) VALUES (
        v_edom_period, 'Evaluasi Perkuliahan Semester 2026/2027 Ganjil',
        now() - INTERVAL '2 day', now() + INTERVAL '12 day', 'buka', true, u_coord
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.evaluation_targets (id, period_id, class_id, lecturer_id)
    VALUES (v_edom_target, v_edom_period, c_web, u_dosen_utama)
    ON CONFLICT DO NOTHING;

    -- Mahasiswa Utama tercatat sudah mengisi (status pengisian decouple)
    INSERT INTO public.evaluation_completions (target_id, student_id, completed_at)
    VALUES (v_edom_target, u_mhs_utama, now() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;

    -- Respon anonim (tanpa student_id)
    INSERT INTO public.evaluation_responses (id, target_id, submitted_on)
    VALUES ('e2100001-0000-0000-0000-000000000001', v_edom_target, current_date - 1)
    ON CONFLICT (id) DO NOTHING;

    -- 14. Sanggahan Nilai dan Permohonan Izin
    -- Sanggahan Nilai
    INSERT INTO public.grade_disputes (
        id, class_id, student_id, title, description, status, requested_at, reviewed_by, resolution_note
    ) VALUES (
        'f3000001-0000-0000-0000-000000000001',
        c_web, u_mhs_utama,
        'Sanggahan Penilaian Kuis 1: Soal Nomor 4',
        'Terdapat ketidaksesuaian kunci jawaban pada soal normalisasi tabel.',
        'resolved', now() - INTERVAL '2 day', u_dosen_utama,
        'Sanggahan diterima. Skor disesuaikan menjadi 85.'
    ) ON CONFLICT (id) DO NOTHING;

    -- Permohonan Izin dengan Berkas Bukti Medis
    INSERT INTO public.absence_requests (
        id, student_id, class_id, reason_type, notes, proof_attachment_path, status, reviewed_by
    ) VALUES (
        'f4000001-0000-0000-0000-000000000001',
        u_mhs_utama, c_web, 'sakit',
        'Permohonan izin istirahat sakit demam berdasarkan rujukan klinik.',
        'absence-proofs/2026/surat_dokter_ahmad.pdf', 'disetujui', u_dosen_utama
    ) ON CONFLICT (id) DO NOTHING;

    -- 15. Percakapan Pesan & Polling Kelas
    -- Percakapan Privat Dosen dan Mahasiswa
    INSERT INTO public.conversations (id, type, created_by)
    VALUES (v_conv_id, 'direct', u_dosen_utama)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES
        (v_conv_id, u_dosen_utama),
        (v_conv_id, u_mhs_utama)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.messages (conversation_id, sender_id, content, sent_at) VALUES
        (v_conv_id, u_dosen_utama, 'Selamat siang Ahmad, silakan siapkan proposal proyek web kelompok Anda.', now() - INTERVAL '4 hour'),
        (v_conv_id, u_mhs_utama, 'Baik Pak Dokter Budi, proposal sudah kami diskusikan dan siap dikonsultasikan.', now() - INTERVAL '3 hour')
    ON CONFLICT DO NOTHING;

    -- Live Poll Anonim di Kelas Pemrograman Web
    INSERT INTO public.live_polls (
        id, class_id, question, options, is_active, is_anonymous, created_by
    ) VALUES (
        v_poll_id, c_web,
        'Framework CSS manakah yang paling Anda kuasai untuk proyek akhir?',
        '[{"id":"opt1","text":"Tailwind CSS"},{"id":"opt2","text":"Bootstrap 5"},{"id":"opt3","text":"Vanilla CSS"}]'::jsonb,
        true, true, u_dosen_utama
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.live_poll_votes (poll_id, user_id, option_id)
    VALUES (v_poll_id, u_mhs_utama, 'opt1')
    ON CONFLICT DO NOTHING;

END $$;
