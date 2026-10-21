-- pgTAP: class_schedule_slots dan course_code_aliases RLS
-- Spesifikasi: docs/INSTRUKSI_SEED_AKADEMIK.md (Fase S1)
BEGIN;
SELECT plan(12);

-- 1. Fixture Akun Uji
INSERT INTO auth.users (id, email) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'staf_slot@uji.test'),
  ('c0000002-0000-0000-0000-000000000002', 'dosen_slot@uji.test'),
  ('c0000003-0000-0000-0000-000000000003', 'mhs_enrolled@uji.test'),
  ('c0000004-0000-0000-0000-000000000004', 'mhs_other@uji.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, status) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'staf_slot@uji.test', 'Staf Slot', 'ACTIVE'),
  ('c0000002-0000-0000-0000-000000000002', 'dosen_slot@uji.test', 'Dosen Slot', 'ACTIVE'),
  ('c0000003-0000-0000-0000-000000000003', 'mhs_enrolled@uji.test', 'Mhs Enrolled', 'ACTIVE'),
  ('c0000004-0000-0000-0000-000000000004', 'mhs_other@uji.test', 'Mhs Other', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.roles (code, name) VALUES
  ('ACADEMIC_STAFF', 'Staf Akademik'),
  ('LECTURER', 'Dosen'),
  ('STUDENT', 'Mahasiswa')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id, scope_type, status) VALUES
  ('c0000001-0000-0000-0000-000000000001', (SELECT id FROM public.roles WHERE code = 'ACADEMIC_STAFF'), 'GLOBAL', 'ACTIVE'),
  ('c0000002-0000-0000-0000-000000000002', (SELECT id FROM public.roles WHERE code = 'LECTURER'), 'GLOBAL', 'ACTIVE'),
  ('c0000003-0000-0000-0000-000000000003', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', 'ACTIVE'),
  ('c0000004-0000-0000-0000-000000000004', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- 2. Master Data
INSERT INTO public.programs (id, code, name)
VALUES ('c1110000-0000-0000-0000-000000000001', 'TI_TEST', 'Teknik Informatika Uji')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.semesters (id, label, is_active)
VALUES ('c2220000-0000-0000-0000-000000000001', '2026/2027 Ganjil Uji', true)
ON CONFLICT (label) DO NOTHING;

INSERT INTO public.courses (id, program_id, code, name, credits)
VALUES ('c3330000-0000-0000-0000-000000000001', 'c1110000-0000-0000-0000-000000000001', 'TIF999', 'Pemrograman Lanjut Uji', 3)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.rooms (id, code, name)
VALUES ('c4440000-0000-0000-0000-000000000001', 'LAB_UJI', 'Laboratorium Uji')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.classes (id, course_id, semester_id, title, section, join_code, capacity, status, created_by)
VALUES
  ('c5550000-0000-0000-0000-000000000001', 'c3330000-0000-0000-0000-000000000001', 'c2220000-0000-0000-0000-000000000001', 'Pemrograman Lanjut - Kelas A', 'A', 'JNUJI01A', 40, 'ACTIVE', 'c0000001-0000-0000-0000-000000000001'),
  ('c5550000-0000-0000-0000-000000000002', 'c3330000-0000-0000-0000-000000000001', 'c2220000-0000-0000-0000-000000000001', 'Pemrograman Lanjut - Kelas B', 'B', 'JNUJI01B', 40, 'ACTIVE', 'c0000001-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Enrol mahasiswa 3 ke Kelas A (tidak ke Kelas B)
INSERT INTO public.enrollments (class_id, student_id, status)
VALUES ('c5550000-0000-0000-0000-000000000001', 'c0000003-0000-0000-0000-000000000003', 'ACTIVE')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.tap_as(p_uid text, p_role text DEFAULT 'authenticated') RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    RESET ROLE;
    PERFORM set_config('request.jwt.claim.sub', p_uid, true);
    EXECUTE format('SET LOCAL ROLE %I', p_role);
END $$;

-- 3. Staf Akademik menambahkan slot jadwal dan alias kode mata kuliah
SELECT public.tap_as('c0000001-0000-0000-0000-000000000001');

SELECT lives_ok(
  $$ INSERT INTO public.class_schedule_slots (class_id, component, day_of_week, start_time, end_time, room_id, sks)
     VALUES ('c5550000-0000-0000-0000-000000000001', 'TEORI', 1, '08:00', '09:40', 'c4440000-0000-0000-0000-000000000001', 2) $$,
  'Staf akademik dapat menambah slot jadwal Kelas A'
);

SELECT lives_ok(
  $$ INSERT INTO public.class_schedule_slots (class_id, component, day_of_week, start_time, end_time, room_id, sks)
     VALUES ('c5550000-0000-0000-0000-000000000002', 'PRAKTIKUM', 2, '10:00', '11:40', 'c4440000-0000-0000-0000-000000000001', 1) $$,
  'Staf akademik dapat menambah slot jadwal Kelas B'
);

SELECT lives_ok(
  $$ INSERT INTO public.course_code_aliases (course_id, alias_code, source)
     VALUES ('c3330000-0000-0000-0000-000000000001', 'JDW999', 'jadwal_source') $$,
  'Staf akademik dapat menambah alias kode kurikulum'
);

-- 4. Pengujian Otorisasi Mahasiswa Terdaftar (Mhs 3 pada Kelas A)
SELECT public.tap_as('c0000003-0000-0000-0000-000000000003');

SELECT is(
  (SELECT count(*)::int FROM public.class_schedule_slots WHERE class_id = 'c5550000-0000-0000-0000-000000000001'),
  1,
  'Mahasiswa terdaftar dapat membaca slot jadwal kelasnya sendiri'
);

SELECT is_empty(
  $$ SELECT 1 FROM public.class_schedule_slots WHERE class_id = 'c5550000-0000-0000-0000-000000000002' $$,
  'Mahasiswa terdaftar tidak dapat membaca slot jadwal kelas lain yang bukan anggotanya'
);

SELECT throws_ok(
  $$ INSERT INTO public.class_schedule_slots (class_id, component, day_of_week, start_time, end_time)
     VALUES ('c5550000-0000-0000-0000-000000000001', 'PRAKTIKUM', 3, '13:00', '14:40') $$,
  '42501',
  NULL,
  'Mahasiswa ditolak menulis slot jadwal (INSERT ditolak RLS)'
);

SELECT throws_ok(
  $$ DELETE FROM public.class_schedule_slots WHERE class_id = 'c5550000-0000-0000-0000-000000000001' $$,
  '42501',
  NULL,
  'Mahasiswa ditolak menghapus slot jadwal (DELETE ditolak RLS)'
);

SELECT ok(
  (SELECT count(*) FROM public.course_code_aliases WHERE alias_code = 'JDW999') = 1,
  'Mahasiswa dapat membaca alias kode mata kuliah'
);

SELECT throws_ok(
  $$ INSERT INTO public.course_code_aliases (course_id, alias_code, source)
     VALUES ('c3330000-0000-0000-0000-000000000001', 'JDW_ILLEGAL', 'hacker') $$,
  '42501',
  NULL,
  'Mahasiswa ditolak menambah alias kode mata kuliah'
);

-- 5. Pengujian Mahasiswa Lain (Mhs 4, tidak terdaftar di kelas manapun)
SELECT public.tap_as('c0000004-0000-0000-0000-000000000004');

SELECT is_empty(
  $$ SELECT 1 FROM public.class_schedule_slots WHERE class_id = 'c5550000-0000-0000-0000-000000000001' $$,
  'Mahasiswa bukan anggota tidak dapat melihat jadwal Kelas A'
);

SELECT is_empty(
  $$ SELECT 1 FROM public.class_schedule_slots WHERE class_id = 'c5550000-0000-0000-0000-000000000002' $$,
  'Mahasiswa bukan anggota tidak dapat melihat jadwal Kelas B'
);

SELECT ok(
  (SELECT count(*) FROM public.course_code_aliases WHERE alias_code = 'JDW999') = 1,
  'Mahasiswa bukan anggota tetap dapat membaca alias kode mata kuliah (katalog terbuka)'
);

ROLLBACK;
