-- Migration: Hapus dan Batalkan Role DEAN (Dekan) Secara Permanen
-- Dijalankan atas instruksi penghapusan peran Dekan (DEAN) dari sistem
-- Rollback: Tidak berlaku (peran DEAN dibatalkan secara permanen)

-- 1. Hapus fungsi helper bila pernah dibuat
DROP FUNCTION IF EXISTS public.is_dean_of_program(uuid);

-- 2. Hapus relasi role_permissions untuk DEAN
DELETE FROM public.role_permissions 
WHERE role_id IN (SELECT id FROM public.roles WHERE code = 'DEAN');

-- 3. Hapus permission faculty.view bila tidak dipakai
DELETE FROM public.permissions 
WHERE code = 'faculty.view';

-- 4. Hapus user_roles yang memegang DEAN
DELETE FROM public.user_roles 
WHERE role_id IN (SELECT id FROM public.roles WHERE code = 'DEAN');

-- 5. Hapus role DEAN dari master roles
DELETE FROM public.roles 
WHERE code = 'DEAN';
