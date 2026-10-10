-- pgTAP: delegasi izin asisten dosen (matriks A4, A5, A13, A14) dan izin yang tidak dapat didelegasikan.
BEGIN;
SELECT plan(28);

INSERT INTO auth.users (id, email) VALUES ('b0000031-0000-0000-0000-000000000031', 'la@uji.test'), ('b0000032-0000-0000-0000-000000000032', 'sa@uji.test'), ('b0000033-0000-0000-0000-000000000033', 'ta1@uji.test'), ('b0000034-0000-0000-0000-000000000034', 'ta2@uji.test'), ('b0000035-0000-0000-0000-000000000035', 'sb@uji.test') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, status) VALUES
  ('b0000031-0000-0000-0000-000000000031', 'la@uji.test', 'Dosen Lima', 'ACTIVE'), ('b0000032-0000-0000-0000-000000000032', 'sa@uji.test', 'Mahasiswa Lima', 'ACTIVE'), ('b0000033-0000-0000-0000-000000000033', 'ta1@uji.test', 'Asisten Satu', 'ACTIVE'),
  ('b0000034-0000-0000-0000-000000000034', 'ta2@uji.test', 'Asisten Dua', 'ACTIVE'), ('b0000035-0000-0000-0000-000000000035', 'sb@uji.test', 'Mahasiswa Enam', 'ACTIVE') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.roles (code, name) VALUES ('LECTURER', 'Dosen'), ('STUDENT', 'Mahasiswa'), ('TEACHING_ASSISTANT', 'Asisten Dosen') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.user_roles (user_id, role_id, scope_type, status) VALUES
  ('b0000031-0000-0000-0000-000000000031', (SELECT id FROM public.roles WHERE code = 'LECTURER'), 'GLOBAL', 'ACTIVE'),
  ('b0000032-0000-0000-0000-000000000032', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', 'ACTIVE'),
  ('b0000033-0000-0000-0000-000000000033', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', 'ACTIVE'),
  ('b0000034-0000-0000-0000-000000000034', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', 'ACTIVE'),
  ('b0000035-0000-0000-0000-000000000035', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', 'ACTIVE');

CREATE TABLE public.tap_ctx5 (class_id uuid, code text, a1 uuid, sub_a uuid, sub_b uuid);
INSERT INTO public.tap_ctx5 DEFAULT VALUES;
GRANT ALL ON public.tap_ctx5 TO authenticated;
CREATE FUNCTION public.tap_as(p_uid text, p_role text DEFAULT 'authenticated') RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    RESET ROLE;
    PERFORM set_config('request.jwt.claim.sub', p_uid, true);
    EXECUTE format('SET LOCAL ROLE %I', p_role);
END $$;

-- Persiapan: kelas, tugas, dan dua pengumpulan (SA dan SB)
SELECT public.tap_as('b0000031-0000-0000-0000-000000000031');
UPDATE public.tap_ctx5 SET class_id = (public.create_class('Basis Data', 'A')).id;
UPDATE public.tap_ctx5 SET code = (SELECT join_code FROM public.classes WHERE id = tap_ctx5.class_id);
UPDATE public.tap_ctx5 SET a1 = (public.create_assignment(class_id, 'Tugas A', '', now() + interval '1 day', now() + interval '2 days')).id;
SELECT public.tap_as('b0000032-0000-0000-0000-000000000032');
SELECT public.join_class_by_code((SELECT code FROM public.tap_ctx5));
SELECT public.submit_assignment((SELECT a1 FROM public.tap_ctx5), 'Jawaban SA');
SELECT public.tap_as('b0000035-0000-0000-0000-000000000035');
SELECT public.join_class_by_code((SELECT code FROM public.tap_ctx5));
SELECT public.submit_assignment((SELECT a1 FROM public.tap_ctx5), 'Jawaban SB');
SELECT public.tap_as('b0000031-0000-0000-0000-000000000031');
UPDATE public.tap_ctx5 SET sub_a = (SELECT id FROM public.submissions WHERE student_id = 'b0000032-0000-0000-0000-000000000032'), sub_b = (SELECT id FROM public.submissions WHERE student_id = 'b0000035-0000-0000-0000-000000000035');

SELECT public.tap_as('b0000032-0000-0000-0000-000000000032');
SELECT throws_ok($$ SELECT public.set_assistant((SELECT class_id FROM public.tap_ctx5), 'ta1@uji.test', ARRAY['submission.review']) $$, 'FORBIDDEN', 'Mahasiswa tidak dapat menugaskan asisten');
SELECT public.tap_as('b0000033-0000-0000-0000-000000000033');
SELECT is_empty($$ SELECT 1 FROM public.classes $$, 'Calon asisten yang belum ditugaskan tidak melihat kelas');

SELECT public.tap_as('b0000031-0000-0000-0000-000000000031');
SELECT throws_ok($$ SELECT public.set_assistant((SELECT class_id FROM public.tap_ctx5), 'ta1@uji.test', ARRAY['grade.finalize']) $$, 'INVALID_PERMISSION', 'A5: izin finalisasi nilai tidak dapat didelegasikan');
SELECT throws_ok($$ SELECT public.set_assistant((SELECT class_id FROM public.tap_ctx5), 'tidak.ada@uji.test', ARRAY['submission.review']) $$, 'USER_NOT_FOUND', 'Pengguna yang tidak ada ditolak');
SELECT lives_ok($$ SELECT public.set_assistant((SELECT class_id FROM public.tap_ctx5), 'ta1@uji.test', ARRAY['submission.review']) $$, 'Dosen menugaskan asisten dengan izin review');
SELECT lives_ok($$ SELECT public.set_assistant((SELECT class_id FROM public.tap_ctx5), 'ta2@uji.test', ARRAY['material.manage']) $$, 'Dosen menugaskan asisten kedua dengan izin materi');

SELECT public.tap_as('b0000033-0000-0000-0000-000000000033');
SELECT is((SELECT count(*)::int FROM public.classes), 1, 'Asisten melihat kelas tempat ditugaskan');
SELECT is((SELECT count(*)::int FROM public.submissions), 2, 'Asisten dengan izin review membaca pengumpulan kelas');
SELECT throws_ok($$ SELECT public.save_grade_draft((SELECT sub_a FROM public.tap_ctx5), 80, 'Draf') $$, 'FORBIDDEN', 'Asisten tanpa izin nilai draf tidak dapat menilai');
SELECT public.tap_as('b0000034-0000-0000-0000-000000000034');
SELECT is_empty($$ SELECT 1 FROM public.submissions $$, 'A4: asisten tanpa izin review tidak melihat pengumpulan');

SELECT public.tap_as('b0000031-0000-0000-0000-000000000031');
SELECT lives_ok($$ SELECT public.set_assistant((SELECT class_id FROM public.tap_ctx5), 'ta1@uji.test', ARRAY['submission.review', 'assignment.grade']) $$, 'Dosen menambah izin nilai draf');
SELECT public.tap_as('b0000033-0000-0000-0000-000000000033');
SELECT lives_ok($$ SELECT public.save_grade_draft((SELECT sub_a FROM public.tap_ctx5), 80, 'Draf asisten') $$, 'Asisten dengan izin menyimpan nilai draf');
SELECT is((SELECT count(*)::int FROM public.grades), 1, 'Asisten membaca nilai draf yang dibuatnya');
SELECT throws_ok($$ SELECT public.finalize_grade((SELECT sub_a FROM public.tap_ctx5)) $$, 'FORBIDDEN', 'A5: asisten tidak dapat memfinalisasi nilai');
SELECT throws_ok($$ SELECT public.request_grade_change((SELECT sub_a FROM public.tap_ctx5), 90, 'Mengajukan perubahan nilai') $$, 'FORBIDDEN', 'Asisten tidak dapat mengajukan perubahan nilai final');
SELECT throws_ok($$ SELECT public.set_assistant((SELECT class_id FROM public.tap_ctx5), 'ta2@uji.test', ARRAY['submission.review']) $$, 'FORBIDDEN', 'Asisten tidak dapat menugaskan asisten lain');
SELECT throws_ok($$ SELECT public.create_assignment((SELECT class_id FROM public.tap_ctx5), 'Tugas X', '', now(), now() + interval '1 day') $$, 'FORBIDDEN', 'Asisten tanpa izin tidak dapat menerbitkan tugas');
SELECT public.tap_as('b0000034-0000-0000-0000-000000000034');
SELECT lives_ok($$ SELECT public.create_material((SELECT class_id FROM public.tap_ctx5), 'Materi asisten', 'isi') $$, 'Asisten dengan izin materi menerbitkan materi');
SELECT throws_ok($$ SELECT public.create_announcement((SELECT class_id FROM public.tap_ctx5), 'Info asisten', 'isi') $$, 'FORBIDDEN', 'Asisten tanpa izin pengumuman ditolak');
SELECT public.tap_as('b0000032-0000-0000-0000-000000000032');
SELECT is_empty($$ SELECT 1 FROM public.grades $$, 'Nilai draf asisten tidak terlihat mahasiswa');

SELECT public.tap_as('b0000031-0000-0000-0000-000000000031');
SELECT lives_ok($$ SELECT public.finalize_grade((SELECT sub_a FROM public.tap_ctx5)) $$, 'Dosen memfinalisasi nilai yang dibuat asisten');
SELECT public.tap_as('b0000033-0000-0000-0000-000000000033');
SELECT throws_ok($$ SELECT public.save_grade_draft((SELECT sub_a FROM public.tap_ctx5), 95, '') $$, 'GRADE_FINAL', 'Asisten tidak dapat mengubah nilai final');

SELECT public.tap_as('b0000031-0000-0000-0000-000000000031');
SELECT lives_ok($$ SELECT public.set_assistant((SELECT class_id FROM public.tap_ctx5), 'ta1@uji.test', ARRAY[]::text[]) $$, 'Dosen mencabut penugasan asisten');
SELECT public.tap_as('b0000033-0000-0000-0000-000000000033');
SELECT is_empty($$ SELECT 1 FROM public.submissions $$, 'A13: asisten yang dicabut tidak melihat pengumpulan');
SELECT throws_ok($$ SELECT public.save_grade_draft((SELECT sub_b FROM public.tap_ctx5), 70, '') $$, 'FORBIDDEN', 'A13: asisten yang dicabut tidak dapat menilai');

SELECT public.tap_as('b0000031-0000-0000-0000-000000000031');
SELECT lives_ok($$ SELECT public.set_assistant((SELECT class_id FROM public.tap_ctx5), 'sb@uji.test', ARRAY['submission.review', 'assignment.grade']) $$, 'Dosen menugaskan mahasiswa kelas sebagai asisten');
SELECT public.tap_as('b0000035-0000-0000-0000-000000000035');
SELECT throws_ok($$ SELECT public.save_grade_draft((SELECT sub_b FROM public.tap_ctx5), 100, 'Menilai diri sendiri') $$, 'SELF_REVIEW', 'A14: asisten tidak dapat menilai pengumpulannya sendiri');

RESET ROLE;
SELECT ok((SELECT count(*) FROM public.audit_logs WHERE action IN ('role.assign', 'role.revoke')) >= 4, 'Penugasan dan pencabutan asisten tercatat di audit');

SELECT * FROM finish();
ROLLBACK;
