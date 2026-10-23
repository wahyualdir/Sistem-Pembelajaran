-- pgTAP: daily_activities RLS and record_daily_activity RPC
BEGIN;
SELECT plan(8);

-- 1. Fixture Akun Uji
INSERT INTO auth.users (id, email) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'mhs_act_1@uji.test'),
  ('d0000002-0000-0000-0000-000000000002', 'mhs_act_2@uji.test'),
  ('d0000003-0000-0000-0000-000000000003', 'dosen_act@uji.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, status) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'mhs_act_1@uji.test', 'Mhs Act 1', 'ACTIVE'),
  ('d0000002-0000-0000-0000-000000000002', 'mhs_act_2@uji.test', 'Mhs Act 2', 'ACTIVE'),
  ('d0000003-0000-0000-0000-000000000003', 'dosen_act@uji.test', 'Dosen Act', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 2. Master Kelas Uji
INSERT INTO public.programs (id, code, name)
VALUES ('d1110000-0000-0000-0000-000000000001', 'TI_ACT', 'Teknik Informatika Act')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.semesters (id, label, is_active)
VALUES ('d2220000-0000-0000-0000-000000000001', '2026/2027 Ganjil Act', true)
ON CONFLICT (label) DO NOTHING;

INSERT INTO public.courses (id, program_id, code, name, credits)
VALUES ('d3330000-0000-0000-0000-000000000001', 'd1110000-0000-0000-0000-000000000001', 'TIF888', 'Arsitektur Cloud Act', 3)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.classes (id, course_id, semester_id, title, section, join_code, created_by, lecturer_id)
VALUES (
  'd4440000-0000-0000-0000-000000000001',
  'd3330000-0000-0000-0000-000000000001',
  'd2220000-0000-0000-0000-000000000001',
  'Arsitektur Cloud Act Kelas A',
  'A',
  'ACTCLD',
  'd0000003-0000-0000-0000-000000000003',
  'd0000003-0000-0000-0000-000000000003'
)
ON CONFLICT DO NOTHING;

-- 3. Catat aktivitas lewat RPC (SECURITY DEFINER)
SELECT public.record_daily_activity(
  'd0000001-0000-0000-0000-000000000001',
  'kumpul_tugas',
  'd4440000-0000-0000-0000-000000000001',
  '2026-10-22',
  3,
  NULL
);

SELECT public.record_daily_activity(
  'd0000002-0000-0000-0000-000000000002',
  'selesai_kuis',
  NULL,
  '2026-10-22',
  3,
  NULL
);

-- Uji 1: Tabel daily_activities memiliki RLS aktif
SELECT has_table('public', 'daily_activities', 'Tabel public.daily_activities harus ada');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.daily_activities'::regclass), 'RLS aktif');

-- Uji 2: Pengguna mhs 1 membaca datanya sendiri
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "d0000001-0000-0000-0000-000000000001"}';

SELECT results_eq(
  $$ SELECT kind FROM public.daily_activities WHERE user_id = 'd0000001-0000-0000-0000-000000000001' $$,
  $$ VALUES ('kumpul_tugas') $$,
  'Mhs 1 dapat melihat aktivitasnya sendiri'
);

-- Uji 3: Pengguna mhs 1 tidak dapat melihat aktivitas mhs 2 (privat tanpa kelas)
SELECT is_empty(
  $$ SELECT * FROM public.daily_activities WHERE user_id = 'd0000002-0000-0000-0000-000000000002' $$,
  'Mhs 1 tidak dapat melihat aktivitas privat Mhs 2'
);

-- Uji 4: Dosen kelas dapat melihat aktivitas mahasiswa di kelas yang diampu
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "d0000003-0000-0000-0000-000000000003"}';

SELECT results_eq(
  $$ SELECT kind FROM public.daily_activities WHERE class_id = 'd4440000-0000-0000-0000-000000000001' $$,
  $$ VALUES ('kumpul_tugas') $$,
  'Dosen pengampu dapat melihat aktivitas kelas dari mahasiswa bimbingan'
);

-- Uji 5: Dosen tidak dapat melihat aktivitas privat mahasiswa di luar kelasnya
SELECT is_empty(
  $$ SELECT * FROM public.daily_activities WHERE user_id = 'd0000002-0000-0000-0000-000000000002' AND class_id IS NULL $$,
  'Dosen tidak dapat melihat aktivitas privat mahasiswa di luar kelas'
);

-- Uji 6: Anonymous (unauthenticated) tidak dapat membaca data
SET LOCAL ROLE anon;
SELECT is_empty(
  $$ SELECT * FROM public.daily_activities $$,
  'Pengguna anonim tidak dapat membaca data aktivitas'
);

-- Uji 7: Direct INSERT dari authenticated ditolak
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "d0000001-0000-0000-0000-000000000001"}';
SELECT throws_ok(
  $$ INSERT INTO public.daily_activities (user_id, date, kind) VALUES ('d0000001-0000-0000-0000-000000000001', '2026-10-22', 'kumpul_tugas') $$,
  '42501',
  NULL,
  'Direct insert ditolak oleh RLS policy'
);

SELECT * FROM finish();
ROLLBACK;
