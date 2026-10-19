-- ============================================================================
-- SIAJAR pgTAP Test: 12_peta_pulau_tahap3.test.sql
-- Uji Kebijakan RLS & Integritas Tahap 3: Tukar Keahlian, Rekap Semester, & Kaprodi
-- ============================================================================

BEGIN;
SELECT plan(15);

-- 1. Setup Data Pengujian
CREATE OR REPLACE FUNCTION public._test_setup_tahap3() RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    v_class1_id uuid := 'c3333333-0000-0000-0000-000000000001';
    v_class2_id uuid := 'c3333333-0000-0000-0000-000000000002';
    v_student1_id uuid := 'a3333333-0000-0000-0000-000000000001';
    v_student2_id uuid := 'a3333333-0000-0000-0000-000000000002';
    v_student_other_id uuid := 'a3333333-0000-0000-0000-000000000003';
    v_lecturer_id uuid := 'd3333333-0000-0000-0000-000000000001';
    v_chap1_id uuid := 'b3333333-0000-0000-0000-000000000001';
    v_req1_id uuid := 'e3333333-0000-0000-0000-000000000001';
    v_resp1_id uuid := 'f3333333-0000-0000-0000-000000000001';
BEGIN
    INSERT INTO auth.users (id, email) VALUES
      (v_lecturer_id, 'lecturer_p3@test.com'),
      (v_student1_id, 'student1_p3@test.com'),
      (v_student2_id, 'student2_p3@test.com'),
      (v_student_other_id, 'student_other_p3@test.com')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, email, full_name, status) VALUES
      (v_lecturer_id, 'lecturer_p3@test.com', 'Dosen P3', 'ACTIVE'),
      (v_student1_id, 'student1_p3@test.com', 'Mahasiswa 1 P3', 'ACTIVE'),
      (v_student2_id, 'student2_p3@test.com', 'Mahasiswa 2 P3', 'ACTIVE'),
      (v_student_other_id, 'student_other_p3@test.com', 'Mahasiswa Other P3', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.classes (id, title, section, join_code, status, created_by)
    VALUES 
        (v_class1_id, 'Pemrograman Web Lanjut A', 'A', 'P3P3P001', 'ACTIVE', v_lecturer_id),
        (v_class2_id, 'Kecerdasan Buatan B', 'B', 'P3P3P002', 'ACTIVE', v_lecturer_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status) VALUES
      (v_lecturer_id, (SELECT id FROM public.roles WHERE code = 'LECTURER'), 'CLASS', v_class1_id, 'ACTIVE'),
      (v_student1_id, (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'CLASS', v_class1_id, 'ACTIVE'),
      (v_student2_id, (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'CLASS', v_class1_id, 'ACTIVE'),
      (v_student_other_id, (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'CLASS', v_class2_id, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.class_chapters (id, class_id, position, title)
    VALUES (v_chap1_id, v_class1_id, 1, 'Bab 1: Next.js SSR & CSR')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.enrollments (class_id, student_id, status)
    VALUES 
        (v_class1_id, v_student1_id, 'ACTIVE'),
        (v_class1_id, v_student2_id, 'ACTIVE'),
        (v_class2_id, v_student_other_id, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- Aktifkan fitur tukar_keahlian di kelas 1
    INSERT INTO public.class_feature_flags (class_id, feature, enabled)
    VALUES (v_class1_id, 'tukar_keahlian', true)
    ON CONFLICT (class_id, feature) DO UPDATE SET enabled = true;

    -- Mahasiswa 1 opt-in di kelas 1
    INSERT INTO public.skill_exchange_optin (student_id, class_id, is_opted_in)
    VALUES (v_student1_id, v_class1_id, true)
    ON CONFLICT (student_id, class_id) DO NOTHING;

    -- Mahasiswa 1 membuat request di kelas 1
    INSERT INTO public.skill_requests (id, class_id, chapter_id, student_id, title, description)
    VALUES (v_req1_id, v_class1_id, v_chap1_id, v_student1_id, 'Bingung Hydration Error', 'Bagaimana mengatasi hydration mismatch?')
    ON CONFLICT (id) DO NOTHING;

    -- Mahasiswa 2 merespons di kelas 1
    INSERT INTO public.skill_responses (id, request_id, responder_id, content)
    VALUES (v_resp1_id, v_req1_id, v_student2_id, 'Pastikan waktu render server dan klien sinkron.')
    ON CONFLICT (id) DO NOTHING;

    -- Rekap semester mahasiswa 1
    INSERT INTO public.semester_recaps (student_id, semester_id, payload)
    VALUES (v_student1_id, '2026/2027 Ganjil', '{"title": "Rekap 2026/2027", "totalXp": 250}'::jsonb)
    ON CONFLICT (student_id, semester_id) DO NOTHING;
END;
$$;

SELECT public._test_setup_tahap3();

-- 2. Verifikasi Keberadaan Tabel
SELECT has_table('public', 'skill_exchange_optin', 'Tabel skill_exchange_optin harus ada');
SELECT has_table('public', 'skill_requests', 'Tabel skill_requests harus ada');
SELECT has_table('public', 'skill_responses', 'Tabel skill_responses harus ada');
SELECT has_table('public', 'skill_reports', 'Tabel skill_reports harus ada');
SELECT has_table('public', 'semester_recaps', 'Tabel semester_recaps harus ada');

-- 3. Verifikasi RLS Aktif
SELECT results_eq(
    'SELECT rowsecurity FROM pg_tables WHERE schemaname = ''public'' AND tablename = ''skill_requests''',
    $$VALUES (true)$$,
    'RLS harus aktif pada tabel skill_requests'
);
SELECT results_eq(
    'SELECT rowsecurity FROM pg_tables WHERE schemaname = ''public'' AND tablename = ''semester_recaps''',
    $$VALUES (true)$$,
    'RLS harus aktif pada tabel semester_recaps'
);

-- 4. Uji RLS: Isolasi Antarkelas
-- Mahasiswa dari Kelas 2 mencoba membaca pertanyaan di Kelas 1
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "a3333333-0000-0000-0000-000000000003", "role": "authenticated"}';

SELECT is_empty(
    'SELECT * FROM public.skill_requests WHERE class_id = ''c3333333-0000-0000-0000-000000000001''',
    'Mahasiswa Kelas 2 DITOLAK membaca skill_requests milik Kelas 1'
);

-- Mahasiswa di Kelas 1 BISA membaca pertanyaan di kelasnya
SET LOCAL "request.jwt.claims" = '{"sub": "a3333333-0000-0000-0000-000000000002", "role": "authenticated"}';

SELECT isnt_empty(
    'SELECT * FROM public.skill_requests WHERE class_id = ''c3333333-0000-0000-0000-000000000001''',
    'Mahasiswa Kelas 1 BISA membaca skill_requests di kelasnya'
);

-- 5. Uji RLS: Privasi Semester Recap (Orang lain tidak boleh membaca)
SELECT is_empty(
    'SELECT * FROM public.semester_recaps WHERE student_id = ''a3333333-0000-0000-0000-000000000001''',
    'Mahasiswa 2 DITOLAK membaca semester_recaps milik Mahasiswa 1'
);

SET LOCAL "request.jwt.claims" = '{"sub": "a3333333-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT isnt_empty(
    'SELECT * FROM public.semester_recaps WHERE student_id = ''a3333333-0000-0000-0000-000000000001''',
    'Mahasiswa 1 BISA membaca semester_recaps miliknya sendiri'
);

RESET ROLE;

-- 6. Uji RPC accept_skill_response: Validasi & Exception
-- A. Bukan pemohon mencoba menandai bantuan -> Harus ditolak
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "a3333333-0000-0000-0000-000000000002", "role": "authenticated"}';

SELECT throws_ok(
    $$SELECT public.accept_skill_response('f3333333-0000-0000-0000-000000000001')$$,
    'P0001',
    'Hanya pemohon bantuan yang berhak menerima jawaban ini',
    'Penandaan bantuan oleh bukan pemohon ditolak dengan exception'
);

-- B. Pemohon yang sah menandai jawaban Mahasiswa 2 sebagai terbantu
SET LOCAL "request.jwt.claims" = '{"sub": "a3333333-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT lives_ok(
    $$SELECT public.accept_skill_response('f3333333-0000-0000-0000-000000000001')$$,
    'Pemohon berhasil menandai jawaban teman sekelas sebagai terbantu'
);

SELECT results_eq(
    'SELECT is_accepted FROM public.skill_responses WHERE id = ''f3333333-0000-0000-0000-000000000001''',
    $$VALUES (true)$$,
    'Status is_accepted pada jawaban teman sekelas berubah menjadi true'
);

SELECT results_eq(
    'SELECT status FROM public.skill_requests WHERE id = ''e3333333-0000-0000-0000-000000000001''',
    $$VALUES ('terjawab'::text)$$,
    'Status skill_requests berubah menjadi terjawab setelah jawaban diterima'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
