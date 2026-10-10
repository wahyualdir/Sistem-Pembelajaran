-- pgTAP Test: Memverifikasi SEMUA tabel skema public memiliki Row Level Security (RLS) aktif
-- Aturan Keras 1: RLS aktif di SEMUA tabel schema public, deny-by-default.

BEGIN;
SELECT plan(2);

-- 1. Pastikan ekstensi pgtap terpasang
SELECT has_extension('pgtap');

-- 2. Verifikasi tidak ada tabel di public yang rowsecurity-nya false
SELECT is_empty(
    $$
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = false
    $$,
    'Semua tabel di schema public HARUS memiliki Row Level Security (RLS) aktif'
);

SELECT * FROM finish();
ROLLBACK;
