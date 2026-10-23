-- pgTAP: kelas, enrollment, tugas, pengumpulan, dan nilai (vertical slice Bagian 13).
-- Mencakup skenario matriks otorisasi A1, A3, A6, A7, A21 dan aturan RPC (Bagian 8). Data uji dibatalkan di akhir.
BEGIN;
SELECT plan(98);

-- Fixture: dua dosen (L1, L2) dan tiga mahasiswa (S1, S2, S3) dengan role global aktif.
INSERT INTO auth.users (id, email) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'l1@uji.test'), ('b0000002-0000-0000-0000-000000000002', 'l2@uji.test'),
  ('b0000003-0000-0000-0000-000000000003', 's1@uji.test'), ('b0000004-0000-0000-0000-000000000004', 's2@uji.test'),
  ('b0000005-0000-0000-0000-000000000005', 's3@uji.test') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, status) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'l1@uji.test', 'Dosen Satu', 'ACTIVE'), ('b0000002-0000-0000-0000-000000000002', 'l2@uji.test', 'Dosen Dua', 'ACTIVE'),
  ('b0000003-0000-0000-0000-000000000003', 's1@uji.test', 'Mahasiswa Satu', 'ACTIVE'), ('b0000004-0000-0000-0000-000000000004', 's2@uji.test', 'Mahasiswa Dua', 'ACTIVE'),
  ('b0000005-0000-0000-0000-000000000005', 's3@uji.test', 'Mahasiswa Tiga', 'ACTIVE') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.roles (code, name) VALUES ('LECTURER', 'Dosen'), ('STUDENT', 'Mahasiswa') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.user_roles (user_id, role_id, scope_type, status) VALUES
  ('b0000001-0000-0000-0000-000000000001', (SELECT id FROM public.roles WHERE code = 'LECTURER'), 'GLOBAL', 'ACTIVE'),
  ('b0000002-0000-0000-0000-000000000002', (SELECT id FROM public.roles WHERE code = 'LECTURER'), 'GLOBAL', 'ACTIVE'),
  ('b0000003-0000-0000-0000-000000000003', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', 'ACTIVE'),
  ('b0000004-0000-0000-0000-000000000004', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', 'ACTIVE'),
  ('b0000005-0000-0000-0000-000000000005', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', 'ACTIVE');

CREATE TABLE public.tap_ctx (class_id uuid, code text, a_open uuid, a_closed uuid);
INSERT INTO public.tap_ctx DEFAULT VALUES;
GRANT ALL ON public.tap_ctx TO authenticated;
CREATE FUNCTION public.tap_as(p_uid text, p_role text DEFAULT 'authenticated') RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    RESET ROLE;
    PERFORM set_config('request.jwt.claim.sub', p_uid, true);
    EXECUTE format('SET LOCAL ROLE %I', p_role);
END $$;

-- ===== Membuat kelas =====
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT throws_ok($$ SELECT public.create_class('Kelas Ilegal') $$, 'FORBIDDEN', 'Mahasiswa tidak dapat membuat kelas');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
UPDATE public.tap_ctx SET class_id = (public.create_class('Pemrograman Web', 'A', 2::smallint)).id;
UPDATE public.tap_ctx SET code = (SELECT join_code FROM public.classes WHERE id = tap_ctx.class_id);
SELECT ok((SELECT class_id IS NOT NULL FROM public.tap_ctx), 'Dosen berhasil membuat kelas');
SELECT is((SELECT length(code) FROM public.tap_ctx), 8, 'Kode kelas terdiri dari 8 karakter');
SELECT is((SELECT count(*)::int FROM public.classes), 1, 'Dosen pembuat melihat kelasnya');
SELECT public.tap_as('b0000002-0000-0000-0000-000000000002');
SELECT is_empty($$ SELECT 1 FROM public.classes $$, 'A6: dosen kelas lain tidak melihat kelas ini');
SELECT public.tap_as('b0000004-0000-0000-0000-000000000004');
SELECT is_empty($$ SELECT 1 FROM public.classes $$, 'A3: mahasiswa belum terdaftar tidak melihat kelas');

-- ===== Enrollment =====
SELECT throws_ok($$ SELECT public.join_class_by_code('AAAAAAAA') $$, 'CODE_INVALID', 'Kode salah ditolak');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT lives_ok($$ SELECT public.join_class_by_code((SELECT code FROM public.tap_ctx)) $$, 'Mahasiswa bergabung dengan kode');
SELECT throws_ok($$ SELECT public.join_class_by_code((SELECT code FROM public.tap_ctx)) $$, 'ALREADY_ENROLLED', 'Enrollment ganda ditolak');
SELECT is((SELECT count(*)::int FROM public.classes), 1, 'Mahasiswa terdaftar melihat kelas');
SELECT public.tap_as('b0000005-0000-0000-0000-000000000005');
SELECT lives_ok($$ SELECT public.join_class_by_code((SELECT code FROM public.tap_ctx)) $$, 'Mahasiswa kedua bergabung (kapasitas 2)');
SELECT public.tap_as('b0000004-0000-0000-0000-000000000004');
SELECT throws_ok($$ SELECT public.join_class_by_code((SELECT code FROM public.tap_ctx)) $$, 'CLASS_FULL', 'Kapasitas penuh ditolak');

-- ===== Tugas dan pengumpulan =====
SELECT public.tap_as('b0000002-0000-0000-0000-000000000002');
SELECT throws_ok($$ SELECT public.create_assignment((SELECT class_id FROM public.tap_ctx), 'Tugas X', '', now(), now() + interval '1 day') $$, 'FORBIDDEN', 'Dosen kelas lain tidak dapat membuat tugas');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT throws_ok($$ SELECT public.create_assignment((SELECT class_id FROM public.tap_ctx), 'Tugas X', '', now(), now() + interval '1 day') $$, 'FORBIDDEN', 'Mahasiswa tidak dapat membuat tugas');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
SELECT lives_ok($$ UPDATE public.tap_ctx SET a_open = (public.create_assignment(class_id, 'Tugas 01', 'Kerjakan.', now() + interval '1 day', now() + interval '2 days')).id $$, 'Dosen menerbitkan tugas');
SELECT lives_ok($$ UPDATE public.tap_ctx SET a_closed = (public.create_assignment(class_id, 'Tugas Lama', '', now() - interval '2 days', now() - interval '1 day')).id $$, 'Dosen menerbitkan tugas yang sudah ditutup');
SELECT public.tap_as('b0000004-0000-0000-0000-000000000004');
SELECT is_empty($$ SELECT 1 FROM public.assignments $$, 'Mahasiswa non-peserta tidak melihat tugas');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT lives_ok($$ SELECT public.submit_assignment((SELECT a_open FROM public.tap_ctx), 'Jawaban saya') $$, 'Mahasiswa mengumpulkan tugas');
SELECT throws_ok($$ SELECT public.submit_assignment((SELECT a_open FROM public.tap_ctx), 'Kirim lagi') $$, 'ALREADY_SUBMITTED', 'Pengumpulan ganda ditolak');
SELECT throws_ok($$ SELECT public.submit_assignment((SELECT a_closed FROM public.tap_ctx), 'Terlambat') $$, 'CLOSED', 'Pengumpulan setelah close_at ditolak');
SELECT public.tap_as('b0000004-0000-0000-0000-000000000004');
SELECT throws_ok($$ SELECT public.submit_assignment((SELECT a_open FROM public.tap_ctx), 'Bukan peserta') $$, 'NOT_FOUND', 'Non-peserta tidak dapat mengumpulkan');
SELECT public.tap_as('b0000005-0000-0000-0000-000000000005');
SELECT is_empty($$ SELECT 1 FROM public.submissions $$, 'Mahasiswa tidak melihat pengumpulan mahasiswa lain');
SELECT public.tap_as('b0000002-0000-0000-0000-000000000002');
SELECT is_empty($$ SELECT 1 FROM public.submissions $$, 'Dosen kelas lain tidak melihat pengumpulan');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
SELECT is((SELECT count(*)::int FROM public.submissions), 1, 'Dosen kelas melihat pengumpulan');

-- ===== Penilaian =====
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT throws_ok($$ SELECT public.save_grade_draft((SELECT id FROM public.submissions), 90, 'Curang') $$, 'FORBIDDEN', 'Mahasiswa tidak dapat memberi nilai');
SELECT public.tap_as('b0000002-0000-0000-0000-000000000002');
SELECT throws_ok($$ SELECT public.save_grade_draft('00000000-0000-0000-0000-000000000000', 90, '') $$, 'NOT_FOUND', 'Pengumpulan yang tidak terlihat dianggap tidak ada');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
SELECT throws_ok($$ SELECT public.save_grade_draft((SELECT id FROM public.submissions), 150, '') $$, 'INVALID_SCORE', 'Nilai di atas maksimum ditolak');
SELECT lives_ok($$ SELECT public.save_grade_draft((SELECT id FROM public.submissions), 80, 'Cukup baik') $$, 'Dosen menyimpan nilai draf');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT is_empty($$ SELECT 1 FROM public.grades $$, 'Nilai draf tidak terlihat mahasiswa');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
SELECT lives_ok($$ SELECT public.finalize_grade((SELECT id FROM public.submissions)) $$, 'Dosen memfinalisasi nilai');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT is((SELECT score FROM public.grades), 80.00, 'Nilai final terlihat mahasiswa pemilik');
SELECT public.tap_as('b0000005-0000-0000-0000-000000000005');
SELECT is_empty($$ SELECT 1 FROM public.grades $$, 'A1: mahasiswa lain tidak melihat nilai ini');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
SELECT throws_ok($$ SELECT public.save_grade_draft((SELECT id FROM public.submissions), 95, '') $$, 'GRADE_FINAL', 'A7: nilai FINAL tidak dapat diubah lewat RPC draf');
SELECT lives_ok($$ UPDATE public.grades SET score = 100 $$, 'UPDATE langsung pada grades tidak menghasilkan galat');
SELECT is((SELECT score FROM public.grades), 80.00, 'UPDATE langsung tidak mengubah nilai FINAL (tanpa policy UPDATE)');
SELECT is((SELECT count(*)::int FROM public.grade_history), 2, 'Riwayat nilai mencatat draf dan finalisasi');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT is_empty($$ SELECT 1 FROM public.grade_history $$, 'Mahasiswa tidak membaca riwayat nilai');
-- ===== Notifikasi =====
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT is((SELECT count(*)::int FROM public.notifications), 3, 'Mahasiswa menerima notifikasi dua tugas baru dan satu nilai terbit');
SELECT public.tap_as('b0000005-0000-0000-0000-000000000005');
SELECT is((SELECT count(*)::int FROM public.notifications), 2, 'Mahasiswa lain hanya melihat notifikasinya sendiri');
SELECT public.tap_as('b0000004-0000-0000-0000-000000000004');
SELECT is_empty($$ SELECT 1 FROM public.notifications $$, 'Non-peserta tidak menerima notifikasi kelas');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT lives_ok($$ SELECT public.mark_notifications_read() $$, 'Mahasiswa menandai notifikasinya sudah dibaca');
SELECT is((SELECT count(*)::int FROM public.notifications WHERE read_at IS NULL), 0, 'Semua notifikasi milik sendiri terbaca');
SELECT public.tap_as('b0000005-0000-0000-0000-000000000005');
SELECT is((SELECT count(*)::int FROM public.notifications WHERE read_at IS NULL), 2, 'Notifikasi mahasiswa lain tidak ikut berubah');
-- ===== Materi dan privasi profil =====
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT throws_ok($$ SELECT public.create_material((SELECT class_id FROM public.tap_ctx), 'Materi X', 'isi') $$, 'FORBIDDEN', 'Mahasiswa tidak dapat menerbitkan materi');
SELECT public.tap_as('b0000002-0000-0000-0000-000000000002');
SELECT throws_ok($$ SELECT public.create_material((SELECT class_id FROM public.tap_ctx), 'Materi X', 'isi') $$, 'FORBIDDEN', 'Dosen kelas lain tidak dapat menerbitkan materi');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
SELECT lives_ok($$ SELECT public.create_material((SELECT class_id FROM public.tap_ctx), 'Pertemuan 1', 'Pengantar HTML') $$, 'Dosen kelas menerbitkan materi');
SELECT is((SELECT count(*)::int FROM public.profiles WHERE id = 'b0000003-0000-0000-0000-000000000003'), 1, 'Dosen dapat membaca profil mahasiswa (untuk daftar anggota dan tinjau)');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT is((SELECT count(*)::int FROM public.materials), 1, 'Mahasiswa peserta membaca materi terbit');
SELECT is_empty($$ SELECT 1 FROM public.profiles WHERE id = 'b0000005-0000-0000-0000-000000000005' $$, 'Mahasiswa tidak membaca profil mahasiswa lain');
SELECT public.tap_as('b0000004-0000-0000-0000-000000000004');
SELECT is_empty($$ SELECT 1 FROM public.materials $$, 'Non-peserta tidak melihat materi');
SELECT public.tap_as('b0000005-0000-0000-0000-000000000005');
SELECT is((SELECT count(*)::int FROM public.notifications WHERE read_at IS NULL), 3, 'Materi baru menambah notifikasi peserta');
-- ===== Perubahan nilai FINAL dengan persetujuan koordinator =====
RESET ROLE;
INSERT INTO auth.users (id, email) VALUES ('b0000021-0000-0000-0000-000000000021', 'k1@uji.test'), ('b0000022-0000-0000-0000-000000000022', 'k2@uji.test'), ('b0000023-0000-0000-0000-000000000023', 'staff1@uji.test') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, status) VALUES ('b0000021-0000-0000-0000-000000000021', 'k1@uji.test', 'Koordinator Satu', 'ACTIVE'), ('b0000022-0000-0000-0000-000000000022', 'k2@uji.test', 'Koordinator Dua', 'ACTIVE'), ('b0000023-0000-0000-0000-000000000023', 'staff1@uji.test', 'Staf Satu', 'ACTIVE') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.roles (code, name) VALUES ('PROGRAM_COORDINATOR', 'Koordinator Prodi'), ('ACADEMIC_STAFF', 'Staf Akademik') ON CONFLICT (code) DO NOTHING;
INSERT INTO public.programs (code, name) VALUES ('P1X', 'Prodi Satu'), ('P2X', 'Prodi Dua');
INSERT INTO public.courses (program_id, code, name, credits) VALUES ((SELECT id FROM public.programs WHERE code = 'P1X'), 'K1X', 'Kuliah Satu', 3);
SET LOCAL app.rpc_context = 'on';
UPDATE public.classes SET course_id = (SELECT id FROM public.courses WHERE code = 'K1X') WHERE id = (SELECT class_id FROM public.tap_ctx);
SET LOCAL app.rpc_context = 'off';
INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status) VALUES
  ('b0000021-0000-0000-0000-000000000021', (SELECT id FROM public.roles WHERE code = 'PROGRAM_COORDINATOR'), 'PROGRAM', (SELECT id FROM public.programs WHERE code = 'P1X'), 'ACTIVE'),
  ('b0000022-0000-0000-0000-000000000022', (SELECT id FROM public.roles WHERE code = 'PROGRAM_COORDINATOR'), 'PROGRAM', (SELECT id FROM public.programs WHERE code = 'P2X'), 'ACTIVE'),
  ('b0000023-0000-0000-0000-000000000023', (SELECT id FROM public.roles WHERE code = 'ACADEMIC_STAFF'), 'GLOBAL', NULL, 'ACTIVE');
ALTER TABLE public.tap_ctx ADD COLUMN sub uuid, ADD COLUMN req uuid;

SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
UPDATE public.tap_ctx SET sub = (SELECT id FROM public.submissions);
SELECT throws_ok($$ SELECT public.request_grade_change((SELECT sub FROM public.tap_ctx), 150, 'Ada bagian yang terlewat') $$, 'INVALID_SCORE', 'Nilai usulan di atas maksimum ditolak');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT throws_ok($$ SELECT public.request_grade_change((SELECT sub FROM public.tap_ctx), 90, 'Mahasiswa meminta nilai') $$, 'FORBIDDEN', 'Mahasiswa tidak dapat mengajukan perubahan nilai');
SELECT public.tap_as('b0000002-0000-0000-0000-000000000002');
SELECT throws_ok($$ SELECT public.request_grade_change((SELECT sub FROM public.tap_ctx), 90, 'Dosen kelas lain mencoba') $$, 'FORBIDDEN', 'Dosen kelas lain tidak dapat mengajukan perubahan nilai');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
SELECT lives_ok($$ SELECT public.request_grade_change((SELECT sub FROM public.tap_ctx), 90, 'Ada bagian jawaban yang belum dinilai') $$, 'Dosen mengajukan perubahan nilai FINAL');
SELECT throws_ok($$ SELECT public.request_grade_change((SELECT sub FROM public.tap_ctx), 95, 'Pengajuan kedua saat masih pending') $$, 'ALREADY_PENDING', 'Pengajuan ganda ditolak');
UPDATE public.tap_ctx SET req = (SELECT id FROM public.grade_change_requests);
SELECT is((SELECT count(*)::int FROM public.grade_change_requests), 1, 'Dosen kelas melihat pengajuannya');
SELECT throws_like($$ SELECT public.decide_grade_change((SELECT req FROM public.tap_ctx), true, 'Setuju sendiri') $$, 'FORBIDDEN%', 'Dosen pemohon tidak dapat menyetujui sendiri');
SELECT public.tap_as('b0000002-0000-0000-0000-000000000002');
SELECT is_empty($$ SELECT 1 FROM public.grade_change_requests $$, 'Dosen kelas lain tidak melihat pengajuan');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT is_empty($$ SELECT 1 FROM public.grade_change_requests $$, 'Mahasiswa tidak melihat pengajuan perubahan nilai');
SELECT public.tap_as('b0000022-0000-0000-0000-000000000022');
SELECT is_empty($$ SELECT 1 FROM public.grade_change_requests $$, 'A8: koordinator prodi lain tidak melihat pengajuan');
SELECT throws_like($$ SELECT public.decide_grade_change((SELECT req FROM public.tap_ctx), true, 'Mencoba lintas prodi') $$, 'FORBIDDEN%', 'Koordinator prodi lain tidak dapat memutuskan');
SELECT public.tap_as('b0000021-0000-0000-0000-000000000021');
SELECT is((SELECT count(*)::int FROM public.grade_change_requests), 1, 'Koordinator prodi terkait melihat pengajuan');
SELECT throws_like($$ SELECT public.decide_grade_change((SELECT req FROM public.tap_ctx), true, '') $$, 'NOTE_MIN_10_CHARS%', 'Catatan keputusan wajib diisi');
SELECT lives_ok($$ SELECT public.decide_grade_change((SELECT req FROM public.tap_ctx), true, 'Disetujui, revisi benar') $$, 'Koordinator menyetujui perubahan nilai');
SELECT throws_like($$ SELECT public.decide_grade_change((SELECT req FROM public.tap_ctx), true, 'Setujui lagi') $$, 'INVALID_STATE%', 'Pengajuan yang sudah diputuskan tidak dapat diputuskan lagi');
SELECT public.tap_as('b0000023-0000-0000-0000-000000000023');
SELECT public.execute_grade_change((SELECT req FROM public.tap_ctx));
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT is((SELECT score FROM public.grades), 90.00, 'Nilai mahasiswa berubah setelah persetujuan');
SELECT is((SELECT count(*)::int FROM public.notifications WHERE type = 'GRADE_UPDATED'), 1, 'Mahasiswa diberi tahu nilainya diperbarui');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
SELECT is((SELECT count(*)::int FROM public.grade_history), 3, 'Riwayat nilai mencatat perubahan yang disetujui');
SELECT lives_ok($$ SELECT public.request_grade_change((SELECT sub FROM public.tap_ctx), 95, 'Pertimbangan tambahan setelah rapat') $$, 'Dosen mengajukan perubahan kedua');
UPDATE public.tap_ctx SET req = (SELECT id FROM public.grade_change_requests WHERE status = 'PENDING');
SELECT public.tap_as('b0000021-0000-0000-0000-000000000021');
SELECT lives_ok($$ SELECT public.decide_grade_change((SELECT req FROM public.tap_ctx), false, 'Ditolak, tidak ada dasar baru') $$, 'Koordinator menolak pengajuan');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT is((SELECT score FROM public.grades), 90.00, 'Nilai tetap setelah pengajuan ditolak');
-- ===== Pengumuman =====
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT throws_ok($$ SELECT public.create_announcement((SELECT class_id FROM public.tap_ctx), 'Info X', 'isi') $$, 'FORBIDDEN', 'Mahasiswa tidak dapat membuat pengumuman');
SELECT public.tap_as('b0000002-0000-0000-0000-000000000002');
SELECT throws_ok($$ SELECT public.create_announcement((SELECT class_id FROM public.tap_ctx), 'Info X', 'isi') $$, 'FORBIDDEN', 'Dosen kelas lain tidak dapat membuat pengumuman');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
SELECT lives_ok($$ SELECT public.create_announcement((SELECT class_id FROM public.tap_ctx), 'Kuliah perdana', 'Senin pukul 08.00') $$, 'Dosen kelas membuat pengumuman');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT is((SELECT count(*)::int FROM public.announcements), 1, 'Mahasiswa peserta membaca pengumuman');
SELECT public.tap_as('b0000004-0000-0000-0000-000000000004');
SELECT is_empty($$ SELECT 1 FROM public.announcements $$, 'Non-peserta tidak melihat pengumuman');
SELECT public.tap_as('b0000005-0000-0000-0000-000000000005');
SELECT is((SELECT count(*)::int FROM public.notifications WHERE type = 'ANNOUNCEMENT_NEW'), 1, 'Pengumuman memberi notifikasi ke peserta');
-- ===== Diskusi =====
RESET ROLE;
ALTER TABLE public.tap_ctx ADD COLUMN did uuid, ADD COLUMN rid uuid;
SELECT public.tap_as('b0000004-0000-0000-0000-000000000004');
SELECT throws_ok($$ SELECT public.post_discussion((SELECT class_id FROM public.tap_ctx), 'Tanya X', 'isi') $$, 'FORBIDDEN', 'Non-peserta tidak dapat memulai diskusi');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT lives_ok($$ UPDATE public.tap_ctx SET did = (public.post_discussion(class_id, 'Soal nomor 2', 'Bagaimana caranya?')).id $$, 'Mahasiswa memulai diskusi');
SELECT public.tap_as('b0000005-0000-0000-0000-000000000005');
SELECT is((SELECT count(*)::int FROM public.discussions), 1, 'Peserta lain membaca diskusi kelas');
SELECT lives_ok($$ UPDATE public.tap_ctx SET rid = (public.reply_discussion(did, 'Coba lihat materi 1')).id $$, 'Peserta membalas diskusi');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT lives_ok($$ SELECT public.reply_discussion((SELECT did FROM public.tap_ctx), 'Terima kasih') $$, 'Penulis membalas diskusinya');
SELECT public.tap_as('b0000004-0000-0000-0000-000000000004');
SELECT is_empty($$ SELECT 1 FROM public.discussions $$, 'Non-peserta tidak melihat diskusi');
SELECT public.tap_as('b0000002-0000-0000-0000-000000000002');
SELECT throws_ok($$ SELECT public.reply_discussion((SELECT did FROM public.tap_ctx), 'Dosen lain ikut') $$, 'NOT_FOUND', 'Dosen kelas lain tidak dapat membalas');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT throws_ok($$ SELECT public.moderate_discussion('pin', (SELECT did FROM public.tap_ctx), true) $$, 'FORBIDDEN', 'Mahasiswa tidak dapat menyematkan diskusi');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
SELECT lives_ok($$ SELECT public.moderate_discussion('hide', (SELECT rid FROM public.tap_ctx), true) $$, 'Dosen menyembunyikan balasan');
SELECT is((SELECT count(*)::int FROM public.discussion_replies), 2, 'Dosen tetap melihat balasan yang disembunyikan');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT is((SELECT count(*)::int FROM public.discussion_replies), 1, 'Mahasiswa tidak melihat balasan yang disembunyikan');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
SELECT lives_ok($$ SELECT public.moderate_discussion('lock', (SELECT did FROM public.tap_ctx), true) $$, 'Dosen mengunci diskusi');
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT throws_ok($$ SELECT public.reply_discussion((SELECT did FROM public.tap_ctx), 'Balasan setelah dikunci') $$, 'LOCKED', 'Mahasiswa tidak dapat membalas diskusi terkunci');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
SELECT lives_ok($$ SELECT public.reply_discussion((SELECT did FROM public.tap_ctx), 'Dosen menutup pembahasan') $$, 'Dosen tetap dapat membalas diskusi terkunci');
RESET ROLE;
SELECT ok((SELECT count(*) FROM public.audit_logs WHERE action = 'discussion.moderate') >= 2, 'Moderasi diskusi tercatat di audit');
-- ===== Audit ekspor nilai =====
SELECT public.tap_as('b0000003-0000-0000-0000-000000000003');
SELECT throws_ok($$ SELECT public.log_grade_export((SELECT class_id FROM public.tap_ctx)) $$, 'FORBIDDEN', 'Mahasiswa tidak dapat mengekspor nilai kelas');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001');
SELECT lives_ok($$ SELECT public.log_grade_export((SELECT class_id FROM public.tap_ctx)) $$, 'Dosen kelas mencatat ekspor nilai');
RESET ROLE;
SELECT ok((SELECT count(*) FROM public.audit_logs WHERE action = 'grade.export') = 1, 'Ekspor nilai tercatat di audit');
RESET ROLE;
SELECT throws_ok($$ DELETE FROM public.grade_history $$, 'P0001', NULL, 'Riwayat nilai bersifat append-only');
SELECT public.tap_as('b0000001-0000-0000-0000-000000000001', 'anon');
SELECT is_empty($$ SELECT 1 FROM public.grades $$, 'A21: kunci anon tidak dapat membaca tabel grades');

SELECT * FROM finish();
ROLLBACK;
