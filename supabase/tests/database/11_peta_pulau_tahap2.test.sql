-- ============================================================================
-- SIAJAR pgTAP Test: 11_peta_pulau_tahap2.test.sql
-- Uji Kebijakan RLS & Integritas Tahap 2: Flashcard Leitner, Tinjau AI, & Podcast
-- ============================================================================

BEGIN;
SELECT plan(14);

-- 1. Setup Data Pengujian
CREATE OR REPLACE FUNCTION public._test_setup_tahap2() RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    v_class_id uuid := 'c2222222-0000-0000-0000-000000000001';
    v_lecturer_id uuid := 'd2222222-0000-0000-0000-000000000001';
    v_student1_id uuid := 'a2222222-0000-0000-0000-000000000001';
    v_student2_id uuid := 'a2222222-0000-0000-0000-000000000002';
    v_chap1_id uuid := 'b2222222-0000-0000-0000-000000000001';
    v_deck1_id uuid := 'e2222222-0000-0000-0000-000000000001';
    v_fc_draft_id uuid := 'f2222222-0000-0000-0000-000000000001';
    v_fc_pub_id uuid := 'f2222222-0000-0000-0000-000000000002';
BEGIN
    INSERT INTO public.classes (id, name, code, status)
    VALUES (v_class_id, 'Arsitektur Komputer & Cloud', 'IF-204', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.class_chapters (id, class_id, position, title, completion_rule)
    VALUES (v_chap1_id, v_class_id, 1, 'Bab 1: Set Instruksi RISC', 'kuis')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.enrollments (class_id, student_id, status)
    VALUES 
        (v_class_id, v_student1_id, 'ACTIVE'),
        (v_class_id, v_student2_id, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.chapter_decks (id, chapter_id, title, status)
    VALUES (v_deck1_id, v_chap1_id, 'Deck Konsep RISC vs CISC', 'terbit')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.flashcards (id, deck_id, front, back, status)
    VALUES
        (v_fc_draft_id, v_deck1_id, 'Draf: Mengapa pipelining penting?', 'Meningkatkan throughput instruksi.', 'draf'),
        (v_fc_pub_id, v_deck1_id, 'Terbit: Apa itu register forwarding?', 'Menghindari hazard data.', 'terbit')
    ON CONFLICT (id) DO NOTHING;
END;
$$;

SELECT public._test_setup_tahap2();

-- 2. Verifikasi Keberadaan Tabel & RLS
SELECT has_table('public', 'chapter_decks', 'Tabel chapter_decks harus ada');
SELECT has_table('public', 'flashcards', 'Tabel flashcards harus ada');
SELECT has_table('public', 'flashcard_reviews', 'Tabel flashcard_reviews harus ada');
SELECT has_table('public', 'flashcard_review_log', 'Tabel flashcard_review_log harus ada');
SELECT has_table('public', 'chapter_podcasts', 'Tabel chapter_podcasts harus ada');
SELECT has_table('public', 'podcast_progress', 'Tabel podcast_progress harus ada');

SELECT results_eq(
    'SELECT rowsecurity FROM pg_tables WHERE schemaname = ''public'' AND tablename = ''flashcards''',
    $$VALUES (true)$$,
    'RLS harus aktif pada tabel flashcards'
);

SELECT results_eq(
    'SELECT rowsecurity FROM pg_tables WHERE schemaname = ''public'' AND tablename = ''flashcard_reviews''',
    $$VALUES (true)$$,
    'RLS harus aktif pada tabel flashcard_reviews'
);

-- 3. Uji RLS: Mahasiswa TIDAK BOLEH membaca kartu berstatus draf
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "a2222222-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT is_empty(
    'SELECT * FROM public.flashcards WHERE id = ''f2222222-0000-0000-0000-000000000001''',
    'Mahasiswa DITOLAK membaca kartu berstatus draf (hanya kartu terbit yang dapat diakses)'
);

SELECT isnt_empty(
    'SELECT * FROM public.flashcards WHERE id = ''f2222222-0000-0000-0000-000000000002''',
    'Mahasiswa BISA membaca kartu berstatus terbit'
);

-- 4. Uji RLS: Isolasi review kartu antar-mahasiswa
INSERT INTO public.flashcard_reviews (student_id, flashcard_id, box, repetitions, last_rating)
VALUES ('a2222222-0000-0000-0000-000000000001', 'f2222222-0000-0000-0000-000000000002', 3, 2, 3)
ON CONFLICT (student_id, flashcard_id) DO NOTHING;

-- Mahasiswa 2 mencoba membaca data review Mahasiswa 1
SET LOCAL "request.jwt.claims" = '{"sub": "a2222222-0000-0000-0000-000000000002", "role": "authenticated"}';

SELECT is_empty(
    'SELECT * FROM public.flashcard_reviews WHERE student_id = ''a2222222-0000-0000-0000-000000000001''',
    'Mahasiswa 2 DITOLAK membaca data pengulangan flashcard milik Mahasiswa 1'
);

RESET ROLE;

-- 5. Uji RPC submit_flashcard_review: Rating di luar 1-4 ditolak
SELECT throws_ok(
    $$SELECT public.submit_flashcard_review('f2222222-0000-0000-0000-000000000002', 5)$$,
    'P0001',
    'Rating tidak valid (harus 1 sampai 4)',
    'Rating 5 ditolak dengan exception'
);

-- 6. Uji RPC submit_flashcard_review oleh Mahasiswa 1 (Rating 1 mengembalikan ke Kotak 1)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "a2222222-0000-0000-0000-000000000001", "role": "authenticated"}';

SELECT lives_ok(
    $$SELECT public.submit_flashcard_review('f2222222-0000-0000-0000-000000000002', 1)$$,
    'Mahasiswa 1 berhasil mencatat review rating 1'
);

SELECT results_eq(
    'SELECT box FROM public.flashcard_reviews WHERE student_id = ''a2222222-0000-0000-0000-000000000001'' AND flashcard_id = ''f2222222-0000-0000-0000-000000000002''',
    $$VALUES (1)$$,
    'Rating 1 berhasil menurunkan kartu kembali ke Kotak 1'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
