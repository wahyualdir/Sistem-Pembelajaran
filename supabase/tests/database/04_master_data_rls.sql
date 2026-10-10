-- pgTAP: master data akademik (program studi, semester, mata kuliah) dan kelas yang menautkannya.
BEGIN;
SELECT plan(11);

INSERT INTO auth.users (id, email) VALUES
  ('b0000011-0000-0000-0000-000000000011', 'staf@uji.test'), ('b0000012-0000-0000-0000-000000000012', 'dosen2@uji.test'),
  ('b0000013-0000-0000-0000-000000000013', 'mhs2@uji.test') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, status) VALUES
  ('b0000011-0000-0000-0000-000000000011', 'staf@uji.test', 'Staf Uji', 'ACTIVE'), ('b0000012-0000-0000-0000-000000000012', 'dosen2@uji.test', 'Dosen Uji', 'ACTIVE'),
  ('b0000013-0000-0000-0000-000000000013', 'mhs2@uji.test', 'Mahasiswa Uji', 'ACTIVE') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.roles (code, name) VALUES ('ACADEMIC_STAFF', 'Staf Akademik'), ('LECTURER', 'Dosen'), ('STUDENT', 'Mahasiswa') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.user_roles (user_id, role_id, scope_type, status) VALUES
  ('b0000011-0000-0000-0000-000000000011', (SELECT id FROM public.roles WHERE code = 'ACADEMIC_STAFF'), 'GLOBAL', 'ACTIVE'),
  ('b0000012-0000-0000-0000-000000000012', (SELECT id FROM public.roles WHERE code = 'LECTURER'), 'GLOBAL', 'ACTIVE'),
  ('b0000013-0000-0000-0000-000000000013', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', 'ACTIVE');

CREATE TABLE public.tap_ctx2 (program_id uuid, course_id uuid, semester_id uuid);
INSERT INTO public.tap_ctx2 DEFAULT VALUES;
GRANT ALL ON public.tap_ctx2 TO authenticated;
CREATE FUNCTION public.tap_as(p_uid text, p_role text DEFAULT 'authenticated') RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    RESET ROLE;
    PERFORM set_config('request.jwt.claim.sub', p_uid, true);
    EXECUTE format('SET LOCAL ROLE %I', p_role);
END $$;

SELECT public.tap_as('b0000012-0000-0000-0000-000000000012');
SELECT throws_ok($$ INSERT INTO public.programs (code, name) VALUES ('XX', 'Program Ilegal') $$, '42501', NULL, 'Dosen tidak dapat menambah program studi');
SELECT public.tap_as('b0000013-0000-0000-0000-000000000013');
SELECT throws_ok($$ INSERT INTO public.semesters (label) VALUES ('2099/2100 Ganjil') $$, '42501', NULL, 'Mahasiswa tidak dapat menambah semester');

SELECT public.tap_as('b0000011-0000-0000-0000-000000000011');
SELECT lives_ok($$ INSERT INTO public.programs (code, name) VALUES ('TI', 'Teknik Informatika') $$, 'Staf akademik menambah program studi');
UPDATE public.tap_ctx2 SET program_id = (SELECT id FROM public.programs WHERE code = 'TI');
SELECT lives_ok($$ INSERT INTO public.semesters (label) VALUES ('2026/2027 Ganjil') $$, 'Staf akademik menambah semester');
UPDATE public.tap_ctx2 SET semester_id = (SELECT id FROM public.semesters WHERE label = '2026/2027 Ganjil');
SELECT lives_ok($$ INSERT INTO public.courses (program_id, code, name, credits) VALUES ((SELECT program_id FROM public.tap_ctx2), 'TI101', 'Pemrograman Web', 3) $$, 'Staf akademik menambah mata kuliah');
UPDATE public.tap_ctx2 SET course_id = (SELECT id FROM public.courses WHERE code = 'TI101');
SELECT throws_ok($$ INSERT INTO public.courses (program_id, code, name, credits) VALUES ((SELECT program_id FROM public.tap_ctx2), 'TI101', 'Duplikat', 2) $$, '23505', NULL, 'Kode mata kuliah ganda ditolak');

SELECT public.tap_as('b0000013-0000-0000-0000-000000000013');
SELECT ok((SELECT count(*) FROM public.programs WHERE code = 'TI') = 1, 'Pengguna login membaca data referensi');

SELECT public.tap_as('b0000012-0000-0000-0000-000000000012');
SELECT lives_ok($$ SELECT public.create_class('Pemrograman Web', 'A', NULL, (SELECT course_id FROM public.tap_ctx2), (SELECT semester_id FROM public.tap_ctx2)) $$, 'Dosen membuat kelas dari mata kuliah dan semester');
SELECT is((SELECT course_id FROM public.classes WHERE title = 'Pemrograman Web'), (SELECT course_id FROM public.tap_ctx2), 'Kelas tersimpan dengan mata kuliah yang dipilih');
SELECT throws_ok($$ SELECT public.create_class('Kelas X', 'A', NULL, '00000000-0000-0000-0000-000000000000', NULL) $$, 'COURSE_NOT_FOUND', 'Mata kuliah yang tidak ada ditolak');

SELECT public.tap_as('b0000012-0000-0000-0000-000000000012', 'anon');
SELECT is_empty($$ SELECT 1 FROM public.programs $$, 'Kunci anon tidak membaca program studi');

SELECT * FROM finish();
ROLLBACK;
