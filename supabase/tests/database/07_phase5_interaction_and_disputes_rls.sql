-- pgTAP Test: Memverifikasi Kebijakan RLS Tabel Evaluasi, Polling, Izin Sakit, Pesan, dan Sanggahan
-- Spesifikasi: docs/INSTRUKSI_ANTIGRAVITY.md (Bagian 9.4, 10.1, 12.1, 12.2, 12.5)

BEGIN;
SELECT plan(12);

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

SELECT * FROM finish();
ROLLBACK;
