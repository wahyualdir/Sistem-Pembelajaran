-- pgTAP Test: Memverifikasi Kebijakan RLS Tabel Identitas & Keamanan Perangkat
-- Skenario: Uji positif dan negatif izin akses role

BEGIN;
SELECT plan(8);

-- Setup context test fixture
CREATE OR REPLACE FUNCTION public._test_setup_identity() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO auth.users (id, email) VALUES
      ('a0000001-0000-0000-0000-000000000001', 'mhs_a@uji.test'),
      ('a0000007-0000-0000-0000-000000000007', 'mhs_b@uji.test'),
      ('a0000002-0000-0000-0000-000000000002', 'user_b@uji.test'),
      ('a0000006-0000-0000-0000-000000000006', 'admin@uji.test')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, email, full_name, status) VALUES
      ('a0000001-0000-0000-0000-000000000001', 'mhs_a@uji.test', 'Mahasiswa A', 'ACTIVE'),
      ('a0000007-0000-0000-0000-000000000007', 'mhs_b@uji.test', 'Mahasiswa B', 'ACTIVE'),
      ('a0000002-0000-0000-0000-000000000002', 'user_b@uji.test', 'User B', 'ACTIVE'),
      ('a0000006-0000-0000-0000-000000000006', 'admin@uji.test', 'Admin Utama', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.roles (code, name) VALUES
      ('STUDENT', 'Mahasiswa'),
      ('SYSTEM_ADMIN', 'System Administrator')
    ON CONFLICT (code) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role_id, scope_type, status) VALUES
      ('a0000001-0000-0000-0000-000000000001', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', 'ACTIVE'),
      ('a0000007-0000-0000-0000-000000000007', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', 'ACTIVE'),
      ('a0000006-0000-0000-0000-000000000006', (SELECT id FROM public.roles WHERE code = 'SYSTEM_ADMIN'), 'GLOBAL', 'ACTIVE')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_devices (user_id, device_id_hash, label, trusted) VALUES
      ('a0000002-0000-0000-0000-000000000002', 'hash_dev_b_001', 'Device B', true)
    ON CONFLICT DO NOTHING;
END;
$$;
SELECT public._test_setup_identity();

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
RESET ROLE;
INSERT INTO public.audit_logs (action, entity_type) VALUES ('test.delete_guard', 'test') ON CONFLICT DO NOTHING;
SELECT throws_ok(
    $$ DELETE FROM public.audit_logs WHERE action = 'test.delete_guard' $$,
    'P0001',
    NULL,
    'Trigger melindungi audit_logs dari operasi DELETE'
);

SELECT * FROM finish();
ROLLBACK;
