-- ============================================================================
-- SIAJAR pgTAP Test: 09_peta_pulau_p0.test.sql
-- Uji Kebijakan RLS & Integritas Fase P0: Penanda Fitur, Log Aktivitas, Isolasi Bab
-- ============================================================================

BEGIN;
SELECT plan(15);

-- 1. Setup Data Pengujian
CREATE OR REPLACE FUNCTION public._test_setup_p0() RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    v_class_id uuid := 'c0000000-0000-0000-0000-000000000001';
    v_lecturer_id uuid := 'd0000000-0000-0000-0000-000000000001';
    v_student1_id uuid := 'a0000000-0000-0000-0000-000000000001';
    v_student2_id uuid := 'a0000000-0000-0000-0000-000000000002';
    v_chap1_id uuid := 'b0000000-0000-0000-0000-000000000001';
    v_chap2_id uuid := 'b0000000-0000-0000-0000-000000000002';
BEGIN
    -- Matikan RLS sementara untuk setup
    INSERT INTO public.classes (id, name, code, status)
    VALUES (v_class_id, 'Algoritma & Struktur Data', 'TI-101', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.class_chapters (id, class_id, position, title, completion_rule)
    VALUES 
        (v_chap1_id, v_class_id, 1, 'Bab 1: Pengenalan', 'kuis'),
        (v_chap2_id, v_class_id, 2, 'Bab 2: Struktur Linear', 'kuis')
    ON CONFLICT (id) DO NOTHING;

    -- Mahasiswa 1 & 2 terdaftar
    INSERT INTO public.enrollments (class_id, student_id, status)
    VALUES 
        (v_class_id, v_student1_id, 'ACTIVE'),
        (v_class_id, v_student2_id, 'ACTIVE')
    ON CONFLICT DO NOTHING;

    -- Materi pada Bab 2 (Terkunci untuk Mahasiswa yang belum lulus Bab 1)
    INSERT INTO public.materials (id, class_id, title, status, chapter_id, created_by)
    VALUES ('e0000000-0000-0000-0000-000000000002', v_class_id, 'Materi Linked List', 'PUBLISHED', v_chap2_id, v_lecturer_id)
    ON CONFLICT (id) DO NOTHING;
END;
$$;

SELECT public._test_setup_p0();

-- 2. Uji Penanda Fitur Kelas
SELECT is(
    public.feature_enabled('c0000000-0000-0000-0000-000000000001', 'peta_pulau'),
    false,
    'Fitur peta_pulau bawaan nonaktif untuk kelas lama'
);

-- Dosen mengaktifkan peta_pulau
INSERT INTO public.class_feature_flags (class_id, feature, enabled)
VALUES ('c0000000-0000-0000-0000-000000000001', 'peta_pulau', true)
ON CONFLICT (class_id, feature) DO UPDATE SET enabled = true;

SELECT is(
    public.feature_enabled('c0000000-0000-0000-0000-000000000001', 'peta_pulau'),
    true,
    'Fitur peta_pulau aktif setelah flag diatur true'
);

-- 3. Uji Status Bab & Prasyarat Linear
SELECT is(
    public.chapter_state('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
    'terbuka',
    'Bab 1 (pertama) selalu terbuka'
);

SELECT is(
    public.chapter_state('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'),
    'terkunci',
    'Bab 2 terkunci karena Bab 1 belum selesai'
);

-- 4. Uji Proteksi RLS Materi Bab Terkunci
-- Mahasiswa 1 mencoba SELECT materi Bab 2 yang terkunci
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

SELECT is_empty(
    $$ SELECT id FROM public.materials WHERE id = 'e0000000-0000-0000-0000-000000000002' $$,
    'Mahasiswa tidak bisa membaca materi pada bab yang masih terkunci'
);

-- Selesaikan Bab 1 untuk Mahasiswa 1
SELECT set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000001', true);
INSERT INTO public.chapter_progress (student_id, chapter_id, best_score, passed_at)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 85.00, now())
ON CONFLICT (student_id, chapter_id) DO UPDATE SET passed_at = now();

SELECT is(
    public.chapter_state('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'),
    'terbuka',
    'Bab 2 terbuka otomatis setelah Bab 1 selesai'
);

-- Mahasiswa 1 sekarang bisa membaca materi Bab 2
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
SELECT isnt_empty(
    $$ SELECT id FROM public.materials WHERE id = 'e0000000-0000-0000-0000-000000000002' $$,
    'Mahasiswa dapat membaca materi pada bab setelah terbuka'
);

-- 5. Uji Log Aktivitas & Daftar Putih
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

-- Log kejadian sah dengan meta yang disanitasi
SELECT lives_ok(
    $$ SELECT public.log_activity('kartu_direview', 'c0000000-0000-0000-0000-000000000001', 'flashcards', NULL, '{"jumlah": 10, "ingat": 8, "disallowed_key": "hacked"}'::jsonb) $$,
    'Pencatatan aktivitas berjenis sah berhasil'
);

-- Kunci meta tidak sah harus dibuang
SELECT is(
    (SELECT meta->>'disallowed_key' FROM public.activity_events WHERE student_id = 'a0000000-0000-0000-0000-000000000001' AND kind = 'kartu_direview' LIMIT 1),
    NULL,
    'Kunci meta di luar daftar putih dibuang otomatis oleh log_activity'
);

-- Jenis aktivitas tidak sah harus melempar exception
SELECT throws_ok(
    $$ SELECT public.log_activity('jenis_liar_tidak_dikenal', NULL, NULL, NULL, '{}'::jsonb) $$,
    'Jenis kejadian di luar daftar putih ditolak ketat'
);

-- 6. Uji Isolasi Privasi Tabel activity_events
-- Dosen mencoba SELECT data mentah activity_events -> HARUS KOSONG (RLS tolak)
SELECT set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000001', true);
SELECT is_empty(
    $$ SELECT id FROM public.activity_events $$,
    'Dosen TIDAK BISA membaca tabel mentah activity_events (kebijakan privasi)'
);

-- Mahasiswa 2 tidak bisa membaca log aktivitas Mahasiswa 1
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);
SELECT is_empty(
    $$ SELECT id FROM public.activity_events WHERE student_id = 'a0000000-0000-0000-0000-000000000001' $$,
    'Mahasiswa lain tidak bisa membaca log aktivitas mahasiswa yang berbeda'
);

-- 7. Uji Hapus Riwayat Aktivitas Saya
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
SELECT lives_ok(
    $$ SELECT public.clear_my_activity_log() $$,
    'Mahasiswa berhasil menjalankan fungsi hapus riwayat data aktivitasnya'
);

SELECT is_empty(
    $$ SELECT id FROM public.activity_events WHERE student_id = 'a0000000-0000-0000-0000-000000000001' $$,
    'Data aktivitas mahasiswa terhapus bersih setelah dipanggil'
);

-- 8. Uji Preferensi Matikan Log Aktivitas
UPDATE public.activity_logging_prefs SET enabled = false WHERE student_id = 'a0000000-0000-0000-0000-000000000001';
SELECT is(
    public.log_activity('materi_dibuka', 'c0000000-0000-0000-0000-000000000001', 'materials', 'e0000000-0000-0000-0000-000000000002', '{}'::jsonb),
    NULL,
    'Log aktivitas mengembalikan NULL dan tidak mencatat saat preferensi logging dimatikan'
);

SELECT * FROM finish();
ROLLBACK;
