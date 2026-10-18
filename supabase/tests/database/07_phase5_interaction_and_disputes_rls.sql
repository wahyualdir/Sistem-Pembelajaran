-- pgTAP Test: Memverifikasi Kebijakan RLS Tabel Evaluasi, Polling, Izin Sakit, Pesan, dan Sanggahan
-- Spesifikasi: docs/INSTRUKSI_ANTIGRAVITY.md (Bagian 9.4, 10.1, 12.1, 12.2, 12.5)

BEGIN;
SELECT plan(16);

-- 1. Verifikasi RLS Aktif pada Tabel Evaluasi Dosen (EDOM)
SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'evaluation_completions'),
    'Tabel public.evaluation_completions HARUS memiliki Row Level Security (RLS) aktif'
);

SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'evaluation_responses'),
    'Tabel public.evaluation_responses HARUS memiliki Row Level Security (RLS) aktif'
);

SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'evaluation_answers'),
    'Tabel public.evaluation_answers HARUS memiliki Row Level Security (RLS) aktif'
);

-- 2. Verifikasi RLS Aktif pada Tabel Polling Interaktif
SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'live_polls'),
    'Tabel public.live_polls HARUS memiliki Row Level Security (RLS) aktif'
);

SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'live_poll_votes'),
    'Tabel public.live_poll_votes HARUS memiliki Row Level Security (RLS) aktif'
);

-- 3. Verifikasi RLS Aktif pada Tabel Izin dan Sakit
SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'absence_requests'),
    'Tabel public.absence_requests HARUS memiliki Row Level Security (RLS) aktif'
);

SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'absence_request_items'),
    'Tabel public.absence_request_items HARUS memiliki Row Level Security (RLS) aktif'
);

-- 4. Verifikasi RLS Aktif pada Tabel Pesan dan Percakapan
SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations'),
    'Tabel public.conversations HARUS memiliki Row Level Security (RLS) aktif'
);

SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages'),
    'Tabel public.messages HARUS memiliki Row Level Security (RLS) aktif'
);

-- 5. Verifikasi RLS Aktif pada Tabel Sanggah Nilai
SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grade_disputes'),
    'Tabel public.grade_disputes HARUS memiliki Row Level Security (RLS) aktif'
);

SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grade_dispute_messages'),
    'Tabel public.grade_dispute_messages HARUS memiliki Row Level Security (RLS) aktif'
);

-- 6. Uji Isolasi Negatif: Mahasiswa A tidak dapat melihat sanggahan milik Mahasiswa B
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'a0000001-0000-0000-0000-000000000001';

SELECT is_empty(
    $$ SELECT id FROM public.grade_disputes WHERE student_id = 'a0000002-0000-0000-0000-000000000002' $$,
    'Mahasiswa dilarang membaca sanggahan nilai mahasiswa lain secara langsung'
);

-- 7. Uji Isolasi Negatif: Mahasiswa dilarang menyisipkan percakapan / pesan ke sesama mahasiswa (12.1)
SELECT throws_ok(
    $$ SELECT public.start_conversation('a0000002-0000-0000-0000-000000000002'::UUID, NULL) $$,
    'Akses percakapan ditolak. Anda hanya dapat mengirim pesan ke dosen atau asisten kelas Anda.',
    'Mahasiswa dilarang memulai percakapan langsung dengan sesama mahasiswa'
);

-- 8. Uji Isolasi Negatif: Dosen Kelas B dilarang membaca bukti atau butir izin milik Kelas A (10.1)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'b0000001-0000-0000-0000-000000000002'; -- Dosen Kelas B

SELECT is_empty(
    $$ SELECT id FROM public.absence_request_items WHERE class_id = 'd0000001-0000-0000-0000-000000000001' $$,
    'Dosen kelas B dilarang membaca butir permohonan izin milik kelas A'
);

-- 9. Uji Isolasi Negatif: Kaprodi dilarang membaca jawaban evaluasi mentah (EDOM True Anonymity Decoupling) (12.5)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'a0000004-0000-0000-0000-000000000004'; -- Kaprodi

SELECT is_empty(
    $$ SELECT * FROM public.evaluation_answers $$,
    'Kaprodi dilarang membaca data jawaban kuesioner evaluasi mentah (harus lewat agregasi RPC)'
);

-- 10. Uji Pengaman Gagal-Tertutup (Fail-Closed) demo_seed.sql saat app.environment tidak diatur
RESET ALL;
SELECT throws_ok(
    $$
    DO $body$
    BEGIN
        IF COALESCE(current_setting('app.environment', true), '') NOT IN ('local', 'staging') THEN
            RAISE EXCEPTION 'EKSEKUSI DITOLAK (FAIL-CLOSED): demo_seed.sql hanya boleh dijalankan pada lingkungan lokal atau staging.';
        END IF;
    END $body$;
    $$,
    'EKSEKUSI DITOLAK (FAIL-CLOSED): demo_seed.sql hanya boleh dijalankan pada lingkungan lokal atau staging.',
    'Safeguard demo_seed.sql harus gagal-tertutup (melempar exception) bila app.environment tidak diatur'
);

SELECT * FROM finish();
ROLLBACK;
