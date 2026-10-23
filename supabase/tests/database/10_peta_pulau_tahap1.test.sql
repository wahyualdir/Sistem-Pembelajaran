-- ============================================================================
-- SIAJAR pgTAP Test: 10_peta_pulau_tahap1.test.sql
-- Uji Kebijakan RLS & Logika Tahap 1: Penguasaan Topik, Hasil Percobaan, Override, & Masking
-- ============================================================================

BEGIN;
SELECT plan(12);

-- 1. Setup Data Pengujian
CREATE OR REPLACE FUNCTION public._test_setup_tahap1() RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    v_class_id uuid := 'c1111111-0000-0000-0000-000000000001';
    v_lecturer_id uuid := 'd1111111-0000-0000-0000-000000000001';
    v_student1_id uuid := 'a1111111-0000-0000-0000-000000000001';
    v_student2_id uuid := 'a1111111-0000-0000-0000-000000000002';
    v_chap1_id uuid := 'b1111111-0000-0000-0000-000000000001';
    v_topic1_id uuid := 'e1111111-0000-0000-0000-000000000001';
BEGIN
    INSERT INTO auth.users (id, email) VALUES
      (v_lecturer_id, 'lecturer_p1@test.com'),
      (v_student1_id, 'student1_p1@test.com'),
      (v_student2_id, 'student2_p1@test.com')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, email, full_name, status) VALUES
      (v_lecturer_id, 'lecturer_p1@test.com', 'Dosen P1', 'ACTIVE'),
      (v_student1_id, 'student1_p1@test.com', 'Mahasiswa 1 P1', 'ACTIVE'),
      (v_student2_id, 'student2_p1@test.com', 'Mahasiswa 2 P1', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.classes (id, title, section, join_code, status, created_by)
    VALUES (v_class_id, 'Basis Data Terdistribusi', 'A', 'P1P1P001', 'ACTIVE', v_lecturer_id)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.roles (code, name) VALUES
      ('LECTURER', 'Dosen'),
      ('STUDENT', 'Mahasiswa'),
      ('TEACHING_ASSISTANT', 'Asisten Dosen')
    ON CONFLICT (code) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status) VALUES
      (v_lecturer_id, (SELECT id FROM public.roles WHERE code = 'LECTURER'), 'CLASS', v_class_id, 'ACTIVE'),
      (v_student1_id, (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'CLASS', v_class_id, 'ACTIVE'),
      (v_student2_id, (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'CLASS', v_class_id, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.class_chapters (id, class_id, position, title, completion_rule, pass_score)
    VALUES (v_chap1_id, v_class_id, 1, 'Bab 1: Arsitektur Shared Nothing', 'kuis', 70)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.chapter_topics (id, chapter_id, name)
    VALUES (v_topic1_id, v_chap1_id, 'Replikasi Multi-Master')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.enrollments (class_id, student_id, status)
    VALUES 
        (v_class_id, v_student1_id, 'ACTIVE'),
        (v_class_id, v_student2_id, 'ACTIVE')
    ON CONFLICT DO NOTHING;
END;
$$;

SELECT public._test_setup_tahap1();

-- 2. Verifikasi Keberadaan Tabel & RLS
SELECT has_table('public', 'quiz_attempt_topic_results', 'Tabel quiz_attempt_topic_results harus ada');
SELECT has_table('public', 'topic_mastery', 'Tabel topic_mastery harus ada');
SELECT has_table('public', 'chapter_unlock_overrides', 'Tabel chapter_unlock_overrides harus ada');

SELECT results_eq(
    'SELECT rowsecurity FROM pg_tables WHERE schemaname = ''public'' AND tablename = ''topic_mastery''',
    $$VALUES (true)$$,
    'RLS harus aktif pada topic_mastery'
);

SELECT results_eq(
    'SELECT rowsecurity FROM pg_tables WHERE schemaname = ''public'' AND tablename = ''quiz_attempt_topic_results''',
    $$VALUES (true)$$,
    'RLS harus aktif pada quiz_attempt_topic_results'
);

-- 3. Uji RLS topic_mastery: Mahasiswa hanya boleh membaca miliknya sendiri
-- Sisipkan data penguasaan topik untuk Mahasiswa 1
INSERT INTO public.topic_mastery (student_id, topic_id, level, attempts_counted, correct, answered)
VALUES ('a1111111-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000001', 'kuat', 3, 9, 10)
ON CONFLICT (student_id, topic_id) DO NOTHING;

-- Mahasiswa 2 impersonated
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "a1111111-0000-0000-0000-000000000002", "role": "authenticated"}';

SELECT is_empty(
    'SELECT * FROM public.topic_mastery WHERE student_id = ''a1111111-0000-0000-0000-000000000001''',
    'Mahasiswa 2 DITOLAK membaca topic_mastery milik Mahasiswa 1 (isolasi data antar-mahasiswa)'
);

-- Mahasiswa 1 membaca miliknya sendiri
SET LOCAL "request.jwt.claims" = '{"sub": "a1111111-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT isnt_empty(
    'SELECT * FROM public.topic_mastery WHERE student_id = ''a1111111-0000-0000-0000-000000000001''',
    'Mahasiswa 1 BISA membaca topic_mastery miliknya sendiri'
);

RESET ROLE;
SET LOCAL "request.jwt.claims" = '{"sub": "d1111111-0000-0000-0000-000000000001", "role": "authenticated"}';
SELECT set_config('request.jwt.claim.sub', 'd1111111-0000-0000-0000-000000000001', true);

-- 4. Uji RPC grant_chapter_unlock_override
SELECT throws_ok(
    $$SELECT public.grant_chapter_unlock_override('b1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', ' ')$$,
    'P0001',
    NULL,
    'Alasan pembukaan manual wajib diisi (tidak boleh kosong)'
);

-- Dosen memberikan override dengan alasan valid
SELECT lives_ok(
    $$SELECT public.grant_chapter_unlock_override('b1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'Mahasiswa pindahan telah menyelesaikan materi setara')$$,
    'Dosen berhasil memberikan override pembukaan bab'
);

SELECT results_eq(
    'SELECT true FROM public.chapter_unlock_overrides WHERE chapter_id = ''b1111111-0000-0000-0000-000000000001'' AND student_id = ''a1111111-0000-0000-0000-000000000001''',
    $$VALUES (true)$$,
    'Override tercatat aktif di chapter_unlock_overrides'
);

-- 5. Uji RPC get_hardest_topics (Masking K-Anonymity)
-- Kurang dari 5 mahasiswa mencoba topik, hasil harus kosong (masking privasi mahasiswa)
SELECT is_empty(
    $$SELECT * FROM jsonb_array_elements(public.get_hardest_topics('c1111111-0000-0000-0000-000000000001'))$$,
    'Topik dengan sampel < 5 mahasiswa di-mask / disembunyikan untuk melindungi privasi individu'
);

-- 6. Uji RPC finish_chapter_quiz_attempt menangani ID attempt fiktif dengan exception aman
SELECT throws_ok(
    $$SELECT public.finish_chapter_quiz_attempt('ffffffff-0000-0000-0000-000000000000')$$,
    'P0001',
    NULL,
    'Percobaan fiktif melempar exception P0001 yang jelas'
);

SELECT * FROM finish();
ROLLBACK;
