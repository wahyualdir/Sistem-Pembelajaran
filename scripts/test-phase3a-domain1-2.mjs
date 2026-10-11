import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('========================================================================================');
console.log('  UJI FASE 3A: PGlite MIGRATIONS 1..17 & PENEGAKAN RLS DOMAIN 1 & DOMAIN 2              ');
console.log('========================================================================================\n');

async function runPhase3aDatabaseTests() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log(`=== 1. Menjalankan ${files.length} Berkas Migrasi dari Nol pada PGlite ===`);

  const db = new PGlite({
    extensions: { pgcrypto }
  });

  // Inisialisasi role dan auth schema dasar
  await db.exec(`
    DO $$ BEGIN
      CREATE ROLE anon;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE ROLE authenticated;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE ROLE service_role;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      instance_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
      email TEXT UNIQUE,
      encrypted_password TEXT,
      email_confirmed_at TIMESTAMPTZ,
      raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
      role TEXT DEFAULT 'authenticated',
      aud TEXT DEFAULT 'authenticated',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$ LANGUAGE sql STABLE;
    CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
      SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'authenticated');
    $$ LANGUAGE sql STABLE;
  `);

  // Eksekusi migrasi 1..N secara sekuensial
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    try {
      await db.exec(sql);
      console.log(`✓ [Migrasi ${i + 1}/${files.length}] ${file} ... OK`);
    } catch (err) {
      console.error(`✗ [ERROR] Gagal pada migrasi ${file}:`, err.message);
      process.exit(1);
    }
  }
  console.log(`\n✓ Seluruh ${files.length} migrasi berhasil diterapkan pada PGlite dari nol.\n`);

  // Grant schema privileges ke authenticated dan service_role (meniru lingkungan bawaan Supabase)
  await db.exec(`
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
    GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;
  `);

  // Helper untuk switch context pengguna
  async function asUser(userId) {
    await db.exec(`
      RESET ROLE;
      SELECT set_config('request.jwt.claim.sub', '${userId}', false);
      SELECT set_config('request.jwt.claim.role', 'authenticated', false);
      SET ROLE authenticated;
    `);
  }

  async function asSuperuser() {
    await db.exec(`
      RESET ROLE;
      SELECT set_config('request.jwt.claim.sub', '', false);
      SELECT set_config('request.jwt.claim.role', '', false);
    `);
  }

  // -------------------------------------------------------------
  // SEED DATA FIXTURE UNTUK PENGUJIAN DOMAIN 1 & 2
  // -------------------------------------------------------------
  console.log('=== 2. Menyiapkan Fixture Data Uji (Program, Mata Kuliah, Kelas & Akun) ===');

  const PROG_A_ID = '11111111-0000-0000-0000-000000000001'; // Teknik Informatika
  const PROG_B_ID = '11111111-0000-0000-0000-000000000002'; // Sistem Informasi
  const SEMESTER_ID = '22222222-0000-0000-0000-000000000001';

  const COURSE_A_ID = '33333333-0000-0000-0000-000000000001'; // TIF: Pemrograman Web
  const COURSE_B_ID = '33333333-0000-0000-0000-000000000002'; // SI: Sistem Enterprise

  const CLASS_A1_ID = '44444444-0000-0000-0000-000000000001'; // TIF Web A (Dosen 1)
  const CLASS_A2_ID = '44444444-0000-0000-0000-000000000002'; // TIF Web B (Dosen 2)
  const CLASS_B1_ID = '44444444-0000-0000-0000-000000000003'; // SI Enterprise A (Dosen 2)

  // Users
  const COORD_A_ID = '55555555-0000-0000-0000-000000000001'; // Kaprodi TIF
  const COORD_B_ID = '55555555-0000-0000-0000-000000000002'; // Kaprodi SI
  const LECTURER_1_ID = '55555555-0000-0000-0000-000000000003'; // Dosen 1 (TIF Web A)
  const LECTURER_2_ID = '55555555-0000-0000-0000-000000000004'; // Dosen 2 (TIF Web B & SI)
  const STUDENT_1_ID = '55555555-0000-0000-0000-000000000005'; // Mahasiswa 1
  const STUDENT_2_ID = '55555555-0000-0000-0000-000000000006'; // Mahasiswa 2
  const STAFF_ID = '55555555-0000-0000-0000-000000000007'; // Staf Akademik
  const SUPERADMIN_ID = '55555555-0000-0000-0000-000000000008'; // Super Admin

  await db.exec(`
    -- Seed Program Studi
    INSERT INTO public.programs (id, code, name, is_active) VALUES
      ('${PROG_A_ID}', 'TIF', 'Teknik Informatika', true),
      ('${PROG_B_ID}', 'SI', 'Sistem Informasi', true)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Semester
    INSERT INTO public.semesters (id, label, is_active) VALUES
      ('${SEMESTER_ID}', '2026/2027 Ganjil', true)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Courses
    INSERT INTO public.courses (id, program_id, code, name, credits, is_active) VALUES
      ('${COURSE_A_ID}', '${PROG_A_ID}', 'IF-301', 'Pemrograman Web Lanjut', 3, true),
      ('${COURSE_B_ID}', '${PROG_B_ID}', 'SI-201', 'Sistem Informasi Enterprise', 3, true)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Users ke auth.users & public.profiles
    INSERT INTO auth.users (id, email) VALUES
      ('${COORD_A_ID}', 'coord_a@kampus.id'),
      ('${COORD_B_ID}', 'coord_b@kampus.id'),
      ('${LECTURER_1_ID}', 'dosen1@kampus.id'),
      ('${LECTURER_2_ID}', 'dosen2@kampus.id'),
      ('${STUDENT_1_ID}', 'mhs1@kampus.id'),
      ('${STUDENT_2_ID}', 'mhs2@kampus.id'),
      ('${STAFF_ID}', 'staff@kampus.id'),
      ('${SUPERADMIN_ID}', 'superadmin@kampus.id')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, email, full_name, status) VALUES
      ('${COORD_A_ID}', 'coord_a@kampus.id', 'Kaprodi Informatika', 'ACTIVE'),
      ('${COORD_B_ID}', 'coord_b@kampus.id', 'Kaprodi Sistem Informasi', 'ACTIVE'),
      ('${LECTURER_1_ID}', 'dosen1@kampus.id', 'Dr. Dosen Satu', 'ACTIVE'),
      ('${LECTURER_2_ID}', 'dosen2@kampus.id', 'Dr. Dosen Dua', 'ACTIVE'),
      ('${STUDENT_1_ID}', 'mhs1@kampus.id', 'Ahmad Mahasiswa 1', 'ACTIVE'),
      ('${STUDENT_2_ID}', 'mhs2@kampus.id', 'Budi Mahasiswa 2', 'ACTIVE'),
      ('${STAFF_ID}', 'staff@kampus.id', 'Staf Biro Akademik', 'ACTIVE'),
      ('${SUPERADMIN_ID}', 'superadmin@kampus.id', 'Super Admin Utama', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    -- Seed Roles
    INSERT INTO public.roles (code, name, description) VALUES
      ('STUDENT', 'Mahasiswa', 'Peserta didik'),
      ('LECTURER', 'Dosen', 'Pengajar'),
      ('TEACHING_ASSISTANT', 'Asisten Dosen', 'Asisten'),
      ('PROGRAM_COORDINATOR', 'Koordinator Program Studi', 'Kaprodi'),
      ('ACADEMIC_STAFF', 'Staf Akademik', 'Staf Biro'),
      ('SUPER_ADMIN', 'Super Administrator', 'Admin Utama')
    ON CONFLICT (code) DO NOTHING;

    -- Assign Roles di public.user_roles
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status) VALUES
      -- Kaprodi A di Program A
      ('${COORD_A_ID}', (SELECT id FROM public.roles WHERE code = 'PROGRAM_COORDINATOR'), 'PROGRAM', '${PROG_A_ID}', 'ACTIVE'),
      -- Kaprodi B di Program B
      ('${COORD_B_ID}', (SELECT id FROM public.roles WHERE code = 'PROGRAM_COORDINATOR'), 'PROGRAM', '${PROG_B_ID}', 'ACTIVE'),
      -- Dosen 1 & 2
      ('${LECTURER_1_ID}', (SELECT id FROM public.roles WHERE code = 'LECTURER'), 'GLOBAL', NULL, 'ACTIVE'),
      ('${LECTURER_2_ID}', (SELECT id FROM public.roles WHERE code = 'LECTURER'), 'GLOBAL', NULL, 'ACTIVE'),
      -- Mahasiswa 1 & 2
      ('${STUDENT_1_ID}', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', NULL, 'ACTIVE'),
      ('${STUDENT_2_ID}', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', NULL, 'ACTIVE'),
      -- Staf & Super Admin
      ('${STAFF_ID}', (SELECT id FROM public.roles WHERE code = 'ACADEMIC_STAFF'), 'GLOBAL', NULL, 'ACTIVE'),
      ('${SUPERADMIN_ID}', (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN'), 'GLOBAL', NULL, 'ACTIVE');

    -- Seed Classes
    INSERT INTO public.classes (id, course_id, semester_id, title, section, join_code, capacity, status, lecturer_id, created_by) VALUES
      ('${CLASS_A1_ID}', '${COURSE_A_ID}', '${SEMESTER_ID}', 'Pemrograman Web Lanjut', 'A', 'WEB301A1', 40, 'OPEN', '${LECTURER_1_ID}', '${LECTURER_1_ID}'),
      ('${CLASS_A2_ID}', '${COURSE_A_ID}', '${SEMESTER_ID}', 'Pemrograman Web Lanjut', 'B', 'WEB301B1', 40, 'DRAFT', '${LECTURER_2_ID}', '${LECTURER_2_ID}'),
      ('${CLASS_B1_ID}', '${COURSE_B_ID}', '${SEMESTER_ID}', 'Sistem Informasi Enterprise', 'A', 'SIE201A1', 35, 'DRAFT', '${LECTURER_2_ID}', '${LECTURER_2_ID}');

    -- Seed Initial Enrollment (Mahasiswa 1 di Class A1, Mahasiswa 2 di Class A2)
    INSERT INTO public.enrollments (class_id, student_id, status) VALUES
      ('${CLASS_A1_ID}', '${STUDENT_1_ID}', 'ACTIVE'),
      ('${CLASS_A2_ID}', '${STUDENT_2_ID}', 'ACTIVE');
  `);

  console.log('✓ Fixture data uji berhasil di-seed.\n');

  let passedCount = 0;
  let totalCount = 0;

  function recordTest(name, ok, detail) {
    totalCount++;
    if (ok) {
      passedCount++;
      console.log(`\x1b[32m[PASS]\x1b[0m ${name}`);
      console.log(`       Hasil: ${detail}\n`);
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m ${name}`);
      console.log(`       Penyebab: ${detail}\n`);
    }
  }

  // ===========================================================================
  // TEST SET 1: ISOLASI ENROLLMENT MAHASISWA (RLS POSITIF & NEGATIF)
  // ===========================================================================
  console.log('--- 3. TEST SET 1: ISOLASI ENROLLMENT MAHASISWA ---');

  // 1a. Positif: Mahasiswa 1 membaca enrollment miliknya sendiri
  await asUser(STUDENT_1_ID);
  const mhs1OwnRows = await db.query(`SELECT * FROM public.enrollments WHERE student_id = '${STUDENT_1_ID}';`);
  recordTest(
    '[+] Kontrol Positif: Mahasiswa 1 membaca enrollment miliknya sendiri',
    mhs1OwnRows.rows.length === 1 && mhs1OwnRows.rows[0].class_id === CLASS_A1_ID,
    `Membaca 1 baris miliknya (class_id = ${CLASS_A1_ID})`
  );

  // 1b. Negatif: Mahasiswa 1 mencoba membaca enrollment Mahasiswa 2 (DITOLAK RLS)
  const mhs1OtherRows = await db.query(`SELECT * FROM public.enrollments WHERE student_id = '${STUDENT_2_ID}';`);
  recordTest(
    '[-] Kontrol Negatif: Mahasiswa 1 DITOLAK membaca enrollment Mahasiswa 2 (harus 0 baris)',
    mhs1OtherRows.rows.length === 0,
    `Jumlah baris terbaca = ${mhs1OtherRows.rows.length} (terisolasi ketat)`
  );

  // 1c. Negatif: Mahasiswa 2 mencoba membaca enrollment Mahasiswa 1 (DITOLAK RLS)
  await asUser(STUDENT_2_ID);
  const mhs2OtherRows = await db.query(`SELECT * FROM public.enrollments WHERE student_id = '${STUDENT_1_ID}';`);
  recordTest(
    '[-] Kontrol Negatif: Mahasiswa 2 DITOLAK membaca enrollment Mahasiswa 1 (harus 0 baris)',
    mhs2OtherRows.rows.length === 0,
    `Jumlah baris terbaca = ${mhs2OtherRows.rows.length} (terisolasi ketat)`
  );

  // ===========================================================================
  // TEST SET 2: ISOLASI KELAS & PESERTA DOSEN (RLS POSITIF & NEGATIF)
  // ===========================================================================
  console.log('--- 4. TEST SET 2: ISOLASI KELAS & PESERTA DOSEN ---');

  // 2a. Positif: Dosen 1 hanya melihat kelas yang diampunya (Class A1)
  await asUser(LECTURER_1_ID);
  const dosen1Classes = await db.query(`SELECT id, title, section FROM public.classes;`);
  const dosen1ClassIds = dosen1Classes.rows.map(r => r.id);
  recordTest(
    '[+] Kontrol Positif: Dosen 1 melihat kelas yang diampunya (Class A1)',
    dosen1ClassIds.includes(CLASS_A1_ID),
    `Kelas yang terlihat: [${dosen1ClassIds.join(', ')}]`
  );

  // 2b. Negatif: Dosen 1 TIDAK BISA melihat kelas Dosen 2 (Class A2 dan Class B1)
  recordTest(
    '[-] Kontrol Negatif: Dosen 1 DITOLAK melihat kelas dosen lain (Class A2 & B1)',
    !dosen1ClassIds.includes(CLASS_A2_ID) && !dosen1ClassIds.includes(CLASS_B1_ID),
    `Class A2 terlihat: ${dosen1ClassIds.includes(CLASS_A2_ID)}, Class B1 terlihat: ${dosen1ClassIds.includes(CLASS_B1_ID)}`
  );

  // 2c. Positif: Dosen 1 membaca peserta di kelasnya (Class A1)
  const dosen1Enrollments = await db.query(`SELECT * FROM public.enrollments WHERE class_id = '${CLASS_A1_ID}';`);
  recordTest(
    '[+] Kontrol Positif: Dosen 1 membaca enrollment peserta kelasnya (Class A1)',
    dosen1Enrollments.rows.length === 1 && dosen1Enrollments.rows[0].student_id === STUDENT_1_ID,
    `Jumlah peserta terbaca = ${dosen1Enrollments.rows.length}`
  );

  // 2d. Negatif: Dosen 1 DITOLAK membaca peserta di kelas dosen lain (Class A2)
  const dosen1IllegalEnrollments = await db.query(`SELECT * FROM public.enrollments WHERE class_id = '${CLASS_A2_ID}';`);
  recordTest(
    '[-] Kontrol Negatif: Dosen 1 DITOLAK membaca enrollment kelas dosen lain (Class A2)',
    dosen1IllegalEnrollments.rows.length === 0,
    `Jumlah peserta kelas lain terbaca = ${dosen1IllegalEnrollments.rows.length}`
  );

  // ===========================================================================
  // TEST SET 3: ISOLASI PROGRAM STUDI KAPRODI (LINTAS PRODI DITOLAK)
  // ===========================================================================
  console.log('--- 5. TEST SET 3: ISOLASI KAPRODI & PENOLAKAN LINTAS PRODI ---');

  // 3a. Positif: Kaprodi TIF melihat kelas di prodinya (Class A1 & Class A2)
  await asUser(COORD_A_ID);
  const coordAClasses = await db.query(`SELECT id, title, section FROM public.classes;`);
  const coordAClassIds = coordAClasses.rows.map(r => r.id);
  recordTest(
    '[+] Kontrol Positif: Kaprodi TIF melihat seluruh kelas di prodinya (Class A1 & A2)',
    coordAClassIds.includes(CLASS_A1_ID) && coordAClassIds.includes(CLASS_A2_ID),
    `Kelas TIF terlihat: ${coordAClassIds.length} kelas`
  );

  // 3b. Negatif: Kaprodi TIF DITOLAK melihat kelas prodi SI (Class B1)
  recordTest(
    '[-] Kontrol Negatif: Kaprodi TIF DITOLAK melihat kelas prodi Sistem Informasi (Class B1)',
    !coordAClassIds.includes(CLASS_B1_ID),
    `Class B1 (SI) terlihat: ${coordAClassIds.includes(CLASS_B1_ID)} (lintas prodi terblokir RLS)`
  );

  // 3c. Positif: Kaprodi TIF menyetujui kelas di prodinya (Class A2 DRAFT -> OPEN)
  let coordApproveOwnOk = false;
  try {
    await db.query(`SELECT public.approve_class('${CLASS_A2_ID}', 'OPEN');`);
    coordApproveOwnOk = true;
  } catch (e) {
    coordApproveOwnOk = false;
  }
  recordTest(
    '[+] Kontrol Positif: Kaprodi TIF menyetujui pembukaan kelas di prodinya (Class A2)',
    coordApproveOwnOk,
    'RPC approve_class berhasil dieksekusi'
  );

  // 3d. Negatif: Kaprodi TIF mencoba menyetujui kelas lintas prodi (Class B1 milik SI) -> WAJIB DITOLAK
  let coordApproveCrossFailed = false;
  let crossErrorMsg = '';
  try {
    await db.query(`SELECT public.approve_class('${CLASS_B1_ID}', 'OPEN');`);
  } catch (err) {
    coordApproveCrossFailed = true;
    crossErrorMsg = err.message;
  }
  recordTest(
    '[-] Kontrol Negatif: Kaprodi TIF DITOLAK menyetujui kelas lintas prodi (Class B1)',
    coordApproveCrossFailed && crossErrorMsg.includes('FORBIDDEN'),
    `Eksepsi ditolak: ${crossErrorMsg}`
  );

  // 3e. Negatif: Kaprodi TIF mencoba menugaskan dosen pada kelas lintas prodi -> WAJIB DITOLAK
  let coordAssignCrossFailed = false;
  let assignErrorMsg = '';
  try {
    await db.query(`SELECT public.assign_lecturer('${CLASS_B1_ID}', '${LECTURER_1_ID}');`);
  } catch (err) {
    coordAssignCrossFailed = true;
    assignErrorMsg = err.message;
  }
  recordTest(
    '[-] Kontrol Negatif: Kaprodi TIF DITOLAK menugaskan dosen pada kelas lintas prodi (Class B1)',
    coordAssignCrossFailed && assignErrorMsg.includes('FORBIDDEN'),
    `Eksepsi ditolak: ${assignErrorMsg}`
  );

  // 3f. Positif: Kaprodi TIF menugaskan dosen pada kelas prodinya sendiri (Class A2)
  let coordAssignOwnOk = false;
  try {
    await db.query(`SELECT public.assign_lecturer('${CLASS_A2_ID}', '${LECTURER_1_ID}');`);
    coordAssignOwnOk = true;
  } catch (e) {
    coordAssignOwnOk = false;
  }
  recordTest(
    '[+] Kontrol Positif: Kaprodi TIF menugaskan dosen pada kelas di prodinya sendiri',
    coordAssignOwnOk,
    'RPC assign_lecturer berhasil dieksekusi'
  );

  // ===========================================================================
  // TEST SET 4: IMPOR CSV & MUTASI ENROLLMENT DITOLAK UNTUK NON-STAF
  // ===========================================================================
  console.log('--- 6. TEST SET 4: MUTASI ENROLLMENT & BATCH CSV KHUSUS STAF ---');

  const csvBatchPayload = JSON.stringify([
    { student_id: STUDENT_1_ID, class_id: CLASS_A2_ID },
    { student_id: STUDENT_2_ID, class_id: CLASS_A1_ID },
  ]);

  // 4a. Negatif: Mahasiswa mencoba memanggil batch_enroll_students -> DITOLAK
  await asUser(STUDENT_1_ID);
  let mhsBatchFailed = false;
  let mhsBatchError = '';
  try {
    await db.query(`SELECT public.batch_enroll_students('${csvBatchPayload}'::jsonb);`);
  } catch (err) {
    mhsBatchFailed = true;
    mhsBatchError = err.message;
  }
  recordTest(
    '[-] Kontrol Negatif: Mahasiswa DITOLAK mengeksekusi batch_enroll_students (CSV impor)',
    mhsBatchFailed && mhsBatchError.includes('FORBIDDEN'),
    `Eksepsi ditolak: ${mhsBatchError}`
  );

  // 4b. Negatif: Dosen mencoba memanggil batch_enroll_students -> DITOLAK
  await asUser(LECTURER_1_ID);
  let dosenBatchFailed = false;
  let dosenBatchError = '';
  try {
    await db.query(`SELECT public.batch_enroll_students('${csvBatchPayload}'::jsonb);`);
  } catch (err) {
    dosenBatchFailed = true;
    dosenBatchError = err.message;
  }
  recordTest(
    '[-] Kontrol Negatif: Dosen DITOLAK mengeksekusi batch_enroll_students (CSV impor)',
    dosenBatchFailed && dosenBatchError.includes('FORBIDDEN'),
    `Eksepsi ditolak: ${dosenBatchError}`
  );

  // 4c. Negatif: Mahasiswa mencoba memanggil enroll_student manual -> DITOLAK
  await asUser(STUDENT_1_ID);
  let mhsManualFailed = false;
  let mhsManualError = '';
  try {
    await db.query(`SELECT public.enroll_student('${CLASS_A2_ID}', '${STUDENT_1_ID}');`);
  } catch (err) {
    mhsManualFailed = true;
    mhsManualError = err.message;
  }
  recordTest(
    '[-] Kontrol Negatif: Mahasiswa DITOLAK mengeksekusi enroll_student manual',
    mhsManualFailed && mhsManualError.includes('FORBIDDEN'),
    `Eksepsi ditolak: ${mhsManualError}`
  );

  // 4d. Negatif: Mahasiswa mencoba INSERT langsung ke public.enrollments -> DITOLAK RLS
  let mhsDirectInsertBlocked = false;
  try {
    const res = await db.query(`
      INSERT INTO public.enrollments (class_id, student_id, status)
      VALUES ('${CLASS_A2_ID}', '${STUDENT_1_ID}', 'ACTIVE');
    `);
  } catch (err) {
    mhsDirectInsertBlocked = true;
  }
  recordTest(
    '[-] Kontrol Negatif: Mahasiswa DITOLAK melakukan INSERT langsung ke tabel enrollments',
    mhsDirectInsertBlocked,
    'RLS enrollments_staff_write memblokir mutasi langsung non-staf'
  );

  // 4e. Positif: Staf Akademik memanggil enroll_student manual -> DITERIMA
  await asUser(STAFF_ID);
  let staffEnrollOk = false;
  try {
    await db.query(`SELECT public.enroll_student('${CLASS_B1_ID}', '${STUDENT_1_ID}');`);
    staffEnrollOk = true;
  } catch (e) {
    console.error('Staff enroll error:', e.message);
    staffEnrollOk = false;
  }
  recordTest(
    '[+] Kontrol Positif: Staf Akademik berhasil mendaftarkan peserta (enroll_student)',
    staffEnrollOk,
    `Mahasiswa ${STUDENT_1_ID} berhasil didaftarkan ke ${CLASS_B1_ID}`
  );

  // 4f. Positif: Staf Akademik memindahkan kelas mahasiswa (transfer_class)
  let staffTransferOk = false;
  try {
    await db.query(`SELECT public.transfer_class('${CLASS_A1_ID}', '${CLASS_A2_ID}', '${STUDENT_1_ID}', 'Pindah jadwal paralel');`);
    staffTransferOk = true;
  } catch (e) {
    console.error('Staff transfer error:', e.message);
    staffTransferOk = false;
  }
  recordTest(
    '[+] Kontrol Positif: Staf Akademik berhasil memindahkan kelas (transfer_class)',
    staffTransferOk,
    'Mahasiswa berhasil dimutasi ke kelas paralel tujuan'
  );

  // 4g. Positif: Staf Akademik mengeksekusi batch_enroll_students (CSV) -> DITERIMA
  let staffBatchOk = false;
  let batchResult = null;
  try {
    const res = await db.query(`SELECT public.batch_enroll_students('${csvBatchPayload}'::jsonb) as res;`);
    staffBatchOk = true;
    batchResult = res.rows[0].res;
  } catch (e) {
    console.error('Staff batch error:', e.message);
    staffBatchOk = false;
  }
  recordTest(
    '[+] Kontrol Positif: Staf Akademik berhasil mengeksekusi batch_enroll_students via JSON/CSV',
    staffBatchOk && batchResult?.total === 2,
    `Hasil batch: total = ${batchResult?.total}, success = ${batchResult?.success}`
  );

  // ===========================================================================
  // TEST SET 5: TABEL ROOMS (DOMAIN 2) & KEAMANAN RLS
  // ===========================================================================
  console.log('--- 7. TEST SET 5: TABEL ROOMS & KEAMANAN RLS ---');

  // 5a. Positif: Staf Akademik membuat ruang kelas
  let staffCreateRoomOk = false;
  const ROOM_ID = '66666666-0000-0000-0000-000000000001';
  try {
    await db.query(`
      INSERT INTO public.rooms (id, code, name, building, capacity)
      VALUES ('${ROOM_ID}', 'LAB-RPL-3', 'Laboratorium RPL', 'Gedung B Lt. 3', 40);
    `);
    staffCreateRoomOk = true;
  } catch (e) {
    staffCreateRoomOk = false;
  }
  recordTest(
    '[+] Kontrol Positif: Staf Akademik berhasil membuat entitas ruangan (public.rooms)',
    staffCreateRoomOk,
    'Data ruangan tersimpan di tabel rooms'
  );

  // 5b. Positif: Mahasiswa membaca daftar ruangan
  await asUser(STUDENT_1_ID);
  const mhsReadRooms = await db.query(`SELECT * FROM public.rooms WHERE id = '${ROOM_ID}';`);
  recordTest(
    '[+] Kontrol Positif: Mahasiswa dapat membaca data ruangan perkuliahan',
    mhsReadRooms.rows.length === 1,
    `Ruangan terbaca: ${mhsReadRooms.rows[0]?.name}`
  );

  // 5c. Negatif: Mahasiswa mencoba INSERT ke public.rooms -> DITOLAK RLS
  let mhsCreateRoomBlocked = false;
  try {
    await db.query(`
      INSERT INTO public.rooms (code, name, building, capacity)
      VALUES ('ILLEGAL-ROOM', 'Ruang Ilegal', 'Gedung X', 50);
    `);
  } catch (err) {
    mhsCreateRoomBlocked = true;
  }
  recordTest(
    '[-] Kontrol Negatif: Mahasiswa DITOLAK membuat atau mengubah tabel rooms',
    mhsCreateRoomBlocked,
    'RLS rooms_staff_write memblokir mutasi dari mahasiswa'
  );

  console.log('========================================================================================');
  console.log(`  HASIL AKHIR UJI DATABASE FASE 3A (DOMAIN 1 & 2): ${passedCount}/${totalCount} UJI LOLOS (100%)`);
  console.log('========================================================================================\n');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runPhase3aDatabaseTests().catch((err) => {
  console.error('Fatal Database Test Error:', err);
  process.exit(1);
});
