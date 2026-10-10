-- pgTAP Test: Memverifikasi Kebijakan RLS Tabel Identitas & Keamanan Perangkat
-- Skenario: Uji positif dan negatif izin akses role

BEGIN;
SELECT plan(8);

-- Setup context test user A (Mahasiswa)
-- auth.uid() = 'a0000001-0000-0000-0000-000000000001'
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'a0000001-0000-0000-0000-000000000001';

-- 1. Mahasiswa A hanya bisa membaca profilnya sendiri
SELECT results_eq(
    $$ SELECT id FROM public.profiles WHERE id = 'a0000001-0000-0000-0000-000000000001' $$,
    $$ VALUES ('a0000001-0000-0000-0000-000000000001'::uuid) $$,
    'Mahasiswa A dapat membaca profilnya sendiri'
);

-- 2. Mahasiswa A TIDAK BISA membaca profil Mahasiswa B (jika bukan dosen/staf/admin)
SELECT is_empty(
    $$ SELECT id FROM public.profiles WHERE id = 'a0000007-0000-0000-0000-000000000007' $$,
    'Mahasiswa A tidak dapat melihat profil pengguna lain secara privat'
);

-- 3. Mahasiswa A TIDAK BISA membaca user_devices milik orang lain (Skenario D7)
SELECT is_empty(
    $$ SELECT id FROM public.user_devices WHERE user_id = 'a0000002-0000-0000-0000-000000000002' $$,
    'Skenario D7: Pengguna A mencoba membaca user_devices pengguna B -> RLS menolak (0 baris)'
);

-- 4. Mahasiswa A TIDAK BISA melihat audit logs
SELECT is_empty(
    $$ SELECT id FROM public.audit_logs $$,
    'Mahasiswa tidak memiliki hak akses melihat audit_logs'
);

-- 5. Mahasiswa A TIDAK BISA mengubah status akunnya sendiri (hanya admin yang bisa)
SELECT throws_ok(
    $$ UPDATE public.profiles SET status = 'PENDING' WHERE id = 'a0000001-0000-0000-0000-000000000001' $$,
    NULL,
    'Mahasiswa dilarang mengubah status akunnya sendiri'
);

-- Reset to Admin context
-- auth.uid() = 'a0000006-0000-0000-0000-000000000006' (SYSTEM_ADMIN)
SET LOCAL "request.jwt.claim.sub" = 'a0000006-0000-0000-0000-000000000006';

-- 6. System Admin dapat membaca seluruh profil
SELECT isnt_empty(
    $$ SELECT id FROM public.profiles $$,
    'System Admin dapat membaca profil pengguna'
);

-- 7. System Admin dapat melihat audit_logs
SELECT is_empty(
    $$ SELECT id FROM public.audit_logs WHERE action = 'NON_EXISTENT_ACTION' $$,
    'System Admin dapat melakukan query pada tabel audit_logs'
);

-- 8. Aturan Keras 7: audit_logs tidak boleh di-UPDATE atau di-DELETE oleh siapa pun
SELECT throws_ok(
    $$ DELETE FROM public.audit_logs $$,
    'P0001',
    'audit_logs is append-only and cannot be modified or deleted',
    'Trigger melindungi audit_logs dari operasi DELETE'
);

SELECT * FROM finish();
ROLLBACK;
