-- pgTAP Test: Memverifikasi Kebijakan RLS Tabel materi_progres dan Storage Buckets
-- Skenario: Uji positif dan negatif akses progres materi & penyimpanan berkas

BEGIN;
SELECT plan(6);

-- 1. Pastikan tabel public.materi_progres memiliki RLS aktif
SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'materi_progres'),
    'Tabel public.materi_progres HARUS memiliki Row Level Security (RLS) aktif'
);

-- 2. Pastikan bucket materi dan tugas terdaftar
SELECT isnt_empty(
    $$ SELECT id FROM storage.buckets WHERE id IN ('materi', 'tugas') $$,
    'Bucket materi dan tugas harus terdaftar di storage.buckets'
);

-- 3. Pastikan bucket materi dan tugas bersifat privat (public = false)
SELECT is_empty(
    $$ SELECT id FROM storage.buckets WHERE id IN ('materi', 'tugas') AND public = true $$,
    'Bucket materi dan tugas WAJIB berstatus privat (public = false)'
);

-- 4. Context Mahasiswa A
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'a0000001-0000-0000-0000-000000000001';

-- Mahasiswa A tidak dapat melihat progres milik Mahasiswa lain secara langsung
SELECT is_empty(
    $$ SELECT id FROM public.materi_progres WHERE mahasiswa_id = 'a0000002-0000-0000-0000-000000000002' $$,
    'Mahasiswa dilarang membaca progres belajar mahasiswa lain'
);

-- 5. Mahasiswa A tidak dapat membaca berkas tugas di storage milik Mahasiswa lain
SELECT is_empty(
    $$ SELECT id FROM storage.objects WHERE bucket_id = 'tugas' AND name LIKE 'tugas/%/a0000002-0000-0000-0000-000000000002/%' $$,
    'Mahasiswa dilarang membaca berkas pengumpulan tugas milik mahasiswa lain di storage'
);

-- 6. Context Admin
SET LOCAL "request.jwt.claim.sub" = 'a0000006-0000-0000-0000-000000000006';
SELECT isnt_empty(
    $$ SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materi_progres' $$,
    'Struktur tabel materi_progres terdaftar dalam schema public'
);

SELECT * FROM finish();
ROLLBACK;
