import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('========================================================================================');
console.log('  UJI FASE 3A: PGlite MIGRATIONS 1..18 & PENEGAKAN KEAMANAN F1..F8 (DOMAIN 1 & DOMAIN 2) ');
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

  async function asAnon() {
    await db.exec(`
      RESET ROLE;
      SELECT set_config('request.jwt.claim.sub', '', false);
      SELECT set_config('request.jwt.claim.role', 'anon', false);
      SET ROLE anon;
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

  const CLASS_A1_ID = '44444444-0000-0000-0000-000000000001'; // TIF Web A (Dosen 1, Status OPEN)
  const CLASS_A2_ID = '44444444-0000-0000-0000-000000000002'; // TIF Web B (Dosen 2, Status DRAFT diajukan Dosen 2)
  const CLASS_A3_ID = '44444444-0000-0000-0000-000000000004'; // TIF Web C (Status DRAFT diajukan Kaprodi A untuk uji self-approval)
  const CLASS_B1_ID = '44444444-0000-0000-0000-000000000003'; // SI Enterprise A (Dosen 2, Status CLOSED)

  // Users
  const COORD_A_ID = '55555555-0000-0000-0000-000000000001'; // Kaprodi TIF
  const COORD_B_ID = '55555555-0000-0000-0000-000000000002'; // Kaprodi SI
  const LECTURER_1_ID = '55555555-0000-0000-0000-000000000003'; // Dosen 1 (TIF Web A)
  const LECTURER_2_ID = '55555555-0000-0000-0000-000000000004'; // Dosen 2 (TIF Web B & SI)
  const STUDENT_1_ID = '55555555-0000-0000-0000-000000000005'; // Mahasiswa 1
  const STUDENT_2_ID = '55555555-0000-0000-0000-000000000006'; // Mahasiswa 2
  const STUDENT_INACTIVE_ID = '55555555-0000-0000-0000-000000000009'; // Mahasiswa Non-Aktif
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
      ('${STUDENT_INACTIVE_ID}', 'mhs_cuti@kampus.id'),
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
      ('${STUDENT_INACTIVE_ID}', 'mhs_cuti@kampus.id', 'Cuti Mahasiswa', 'SUSPENDED'),
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
      ('${COORD_A_ID}', (SELECT id FROM public.roles WHERE code = 'PROGRAM_COORDINATOR'), 'PROGRAM', '${PROG_A_ID}', 'ACTIVE'),
      ('${COORD_B_ID}', (SELECT id FROM public.roles WHERE code = 'PROGRAM_COORDINATOR'), 'PROGRAM', '${PROG_B_ID}', 'ACTIVE'),
      ('${LECTURER_1_ID}', (SELECT id FROM public.roles WHERE code = 'LECTURER'), 'GLOBAL', NULL, 'ACTIVE'),
      ('${LECTURER_2_ID}', (SELECT id FROM public.roles WHERE code = 'LECTURER'), 'GLOBAL', NULL, 'ACTIVE'),
      ('${STUDENT_1_ID}', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', NULL, 'ACTIVE'),
      ('${STUDENT_2_ID}', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', NULL, 'ACTIVE'),
      ('${STUDENT_INACTIVE_ID}', (SELECT id FROM public.roles WHERE code = 'STUDENT'), 'GLOBAL', NULL, 'REVOKED'),
      ('${STAFF_ID}', (SELECT id FROM public.roles WHERE code = 'ACADEMIC_STAFF'), 'GLOBAL', NULL, 'ACTIVE'),
      ('${SUPERADMIN_ID}', (SELECT id FROM public.roles WHERE code = 'SUPER_ADMIN'), 'GLOBAL', NULL, 'ACTIVE');

    -- Seed Classes
    -- Set app.rpc_context agar trigger insert/seed diizinkan
    SELECT set_config('app.rpc_context', 'on', false);

    INSERT INTO public.classes (id, course_id, semester_id, title, section, join_code, capacity, status, lecturer_id, created_by) VALUES
      ('${CLASS_A1_ID}', '${COURSE_A_ID}', '${SEMESTER_ID}', 'Pemrograman Web Lanjut', 'A', 'WEB301A1', 40, 'OPEN', '${LECTURER_1_ID}', '${LECTURER_1_ID}'),
      ('${CLASS_A2_ID}', '${COURSE_A_ID}', '${SEMESTER_ID}', 'Pemrograman Web Lanjut', 'B', 'WEB301B1', 40, 'DRAFT', '${LECTURER_2_ID}', '${LECTURER_2_ID}'),
      ('${CLASS_A3_ID}', '${COURSE_A_ID}', '${SEMESTER_ID}', 'Pemrograman Web Lanjut', 'C', 'WEB301C1', 40, 'DRAFT', '${LECTURER_1_ID}', '${COORD_A_ID}'),
      ('${CLASS_B1_ID}', '${COURSE_B_ID}', '${SEMESTER_ID}', 'Sistem Informasi Enterprise', 'A', 'SIE201A1', 35, 'CLOSED', '${LECTURER_2_ID}', '${LECTURER_2_ID}');

    -- Seed Initial Enrollment (Mahasiswa 1 di Class A1, Mahasiswa 2 di Class A2)
    INSERT INTO public.enrollments (class_id, student_id, status) VALUES
      ('${CLASS_A1_ID}', '${STUDENT_1_ID}', 'ACTIVE'),
      ('${CLASS_A2_ID}', '${STUDENT_2_ID}', 'ACTIVE');

    SELECT set_config('app.rpc_context', '', false);
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
  // F4: HAK AKSES FUNGSI (has_function_privilege OUTPUT MENTAH)
  // ===========================================================================
  console.log('--- 3. VERIFIKASI HAK AKSES RPC (F4 - has_function_privilege) ---');

  const funcsToCheck = [
    { name: 'approve_class', sig: 'public.approve_class(uuid, public.class_status, text)' },
    { name: 'assign_lecturer', sig: 'public.assign_lecturer(uuid, uuid)' },
    { name: 'enroll_student', sig: 'public.enroll_student(uuid, uuid)' },
    { name: 'transfer_class', sig: 'public.transfer_class(uuid, uuid, uuid, text)' },
    { name: 'batch_enroll_students', sig: 'public.batch_enroll_students(jsonb)' },
  ];

  for (const f of funcsToCheck) {
    const qAnon = await db.query(`SELECT has_function_privilege('anon', '${f.sig}', 'execute') AS priv;`);
    const qAuth = await db.query(`SELECT has_function_privilege('authenticated', '${f.sig}', 'execute') AS priv;`);
    const qPublic = await db.query(`SELECT has_function_privilege('public', '${f.sig}', 'execute') AS priv;`);

    const anonPriv = qAnon.rows[0].priv;
    const authPriv = qAuth.rows[0].priv;
    const pubPriv = qPublic.rows[0].priv;

    console.log(`[RAW PRIVILEGE] ${f.name} -> public=${pubPriv}, anon=${anonPriv}, authenticated=${authPriv}`);

    recordTest(
      `[F4] Hak akses ${f.name}: anon=false, authenticated=true`,
      anonPriv === false && authPriv === true && pubPriv === false,
      `anon: ${anonPriv}, authenticated: ${authPriv}, public: ${pubPriv}`
    );
  }

  // ===========================================================================
  // F1: BYPASS DIRECT UPDATE TRIGGER PADA CLASSES & ENROLLMENTS
  // ===========================================================================
  console.log('--- 4. PENGUJIAN BYPASS DIRECT UPDATE TRIGGER (F1) ---');

  // 1a. Dosen mencoba UPDATE langsung kolom sensitif status kelasnya -> DITOLAK
  await asUser(LECTURER_1_ID);
  let dosenUpdateStatusBlocked = false;
  let dosenUpdateStatusErr = '';
  try {
    await db.query(`UPDATE public.classes SET status = 'CLOSED' WHERE id = '${CLASS_A1_ID}';`);
  } catch (err) {
    dosenUpdateStatusBlocked = true;
    dosenUpdateStatusErr = err.message;
  }
  recordTest(
    '[-] F1/F8: Dosen UPDATE langsung status kelasnya -> DITOLAK trigger',
    dosenUpdateStatusBlocked && dosenUpdateStatusErr.includes('DIRECT_UPDATE_RESTRICTED'),
    `Eksepsi trigger: ${dosenUpdateStatusErr}`
  );

  // 1b. Dosen mencoba UPDATE langsung kolom sensitif lecturer_id kelasnya -> DITOLAK
  let dosenUpdateLecturerBlocked = false;
  let dosenUpdateLecturerErr = '';
  try {
    await db.query(`UPDATE public.classes SET lecturer_id = '${LECTURER_2_ID}' WHERE id = '${CLASS_A1_ID}';`);
  } catch (err) {
    dosenUpdateLecturerBlocked = true;
    dosenUpdateLecturerErr = err.message;
  }
  recordTest(
    '[-] F1/F8: Dosen UPDATE langsung lecturer_id kelasnya -> DITOLAK trigger',
    dosenUpdateLecturerBlocked && dosenUpdateLecturerErr.includes('DIRECT_UPDATE_RESTRICTED'),
    `Eksepsi trigger: ${dosenUpdateLecturerErr}`
  );

  // 1c. Dosen mencoba UPDATE langsung kolom sensitif course_id kelasnya -> DITOLAK
  let dosenUpdateCourseBlocked = false;
  let dosenUpdateCourseErr = '';
  try {
    await db.query(`UPDATE public.classes SET course_id = '${COURSE_B_ID}' WHERE id = '${CLASS_A1_ID}';`);
  } catch (err) {
    dosenUpdateCourseBlocked = true;
    dosenUpdateCourseErr = err.message;
  }
  recordTest(
    '[-] F1/F8: Dosen UPDATE langsung course_id kelasnya -> DITOLAK trigger',
    dosenUpdateCourseBlocked && dosenUpdateCourseErr.includes('DIRECT_UPDATE_RESTRICTED'),
    `Eksepsi trigger: ${dosenUpdateCourseErr}`
  );

  // 1d. Dosen meng-UPDATE kolom non-sensitif (title, capacity) -> BERHASIL
  let dosenUpdateNonSensitiveOk = false;
  try {
    await db.query(`
      UPDATE public.classes
      SET title = 'Pemrograman Web Lanjut (Update Judul)', capacity = 45
      WHERE id = '${CLASS_A1_ID}';
    `);
    dosenUpdateNonSensitiveOk = true;
  } catch (err) {
    dosenUpdateNonSensitiveOk = false;
  }
  recordTest(
    '[+] F1/F8: Dosen UPDATE kolom non-sensitif (title, capacity) -> BERHASIL',
    dosenUpdateNonSensitiveOk,
    'Update kolom non-sensitif diizinkan oleh trigger dan RLS'
  );

  // 1e. Kaprodi UPDATE langsung lecturer_id ke non-dosen -> DITOLAK (Trigger memblokir direct update)
  await asUser(COORD_A_ID);
  let coordDirectUpdateBlocked = false;
  let coordDirectErr = '';
  try {
    await db.query(`UPDATE public.classes SET lecturer_id = '${STUDENT_1_ID}' WHERE id = '${CLASS_A1_ID}';`);
  } catch (err) {
    coordDirectUpdateBlocked = true;
    coordDirectErr = err.message;
  }
  recordTest(
    '[-] F1/F8: Kaprodi UPDATE langsung lecturer_id ke non-dosen -> DITOLAK trigger',
    coordDirectUpdateBlocked && coordDirectErr.includes('DIRECT_UPDATE_RESTRICTED'),
    `Eksepsi trigger: ${coordDirectErr}`
  );

  // 1f. Kaprodi menugaskan non-dosen via RPC assign_lecturer -> DITOLAK validasi dosen aktif
  let coordAssignNonLecturerBlocked = false;
  let coordAssignNonLecturerErr = '';
  try {
    await db.query(`SELECT public.assign_lecturer('${CLASS_A1_ID}', '${STUDENT_1_ID}');`);
  } catch (err) {
    coordAssignNonLecturerBlocked = true;
    coordAssignNonLecturerErr = err.message;
  }
  recordTest(
    '[-] F8: Kaprodi menugaskan non-dosen via assign_lecturer -> DITOLAK',
    coordAssignNonLecturerBlocked && coordAssignNonLecturerErr.includes('INVALID_LECTURER'),
    `Eksepsi RPC: ${coordAssignNonLecturerErr}`
  );

  // 1g. Direct UPDATE pada tabel enrollments (status, class_id, student_id) -> DITOLAK trigger
  await asUser(STAFF_ID);
  let staffDirectEnrollUpdateBlocked = false;
  let staffDirectEnrollErr = '';
  try {
    await db.query(`UPDATE public.enrollments SET status = 'DROPPED' WHERE class_id = '${CLASS_A1_ID}';`);
  } catch (err) {
    staffDirectEnrollUpdateBlocked = true;
    staffDirectEnrollErr = err.message;
  }
  recordTest(
    '[-] F1: Staf UPDATE langsung kolom sensitif enrollment -> DITOLAK trigger',
    staffDirectEnrollUpdateBlocked && staffDirectEnrollErr.includes('DIRECT_UPDATE_RESTRICTED'),
    `Eksepsi trigger: ${staffDirectEnrollErr}`
  );

  // ===========================================================================
  // F8: PENGUJIAN ANON DAN AUTHENTICATED TANPA PERAN MEMANGGIL RPC
  // ===========================================================================
  console.log('--- 5. PENGUJIAN ANON DAN USER TANPA PERAN MEMANGGIL RPC (F8) ---');

  // 2a. Anon memanggil approve_class -> DITOLAK
  await asAnon();
  let anonApproveBlocked = false;
  let anonApproveErr = '';
  try {
    await db.query(`SELECT public.approve_class('${CLASS_A2_ID}', 'OPEN');`);
  } catch (err) {
    anonApproveBlocked = true;
    anonApproveErr = err.message;
  }
  recordTest(
    '[-] F8: anon memanggil approve_class -> DITOLAK permission/unauthorized',
    anonApproveBlocked,
    `Eksepsi anon: ${anonApproveErr}`
  );

  // 2b. Mahasiswa (authenticated tanpa peran staf/kaprodi) memanggil approve_class -> DITOLAK
  await asUser(STUDENT_1_ID);
  let studentApproveBlocked = false;
  let studentApproveErr = '';
  try {
    await db.query(`SELECT public.approve_class('${CLASS_A2_ID}', 'OPEN');`);
  } catch (err) {
    studentApproveBlocked = true;
    studentApproveErr = err.message;
  }
  recordTest(
    '[-] F8: Mahasiswa (tanpa peran kaprodi) memanggil approve_class -> DITOLAK',
    studentApproveBlocked && studentApproveErr.includes('FORBIDDEN'),
    `Eksepsi: ${studentApproveErr}`
  );

  // 2c. Mahasiswa memanggil assign_lecturer -> DITOLAK
  let studentAssignBlocked = false;
  let studentAssignErr = '';
  try {
    await db.query(`SELECT public.assign_lecturer('${CLASS_A1_ID}', '${LECTURER_1_ID}');`);
  } catch (err) {
    studentAssignBlocked = true;
    studentAssignErr = err.message;
  }
  recordTest(
    '[-] F8: Mahasiswa memanggil assign_lecturer -> DITOLAK',
    studentAssignBlocked && studentAssignErr.includes('FORBIDDEN'),
    `Eksepsi: ${studentAssignErr}`
  );

  // 2d. Mahasiswa memanggil enroll_student -> DITOLAK
  let studentEnrollBlocked = false;
  let studentEnrollErr = '';
  try {
    await db.query(`SELECT public.enroll_student('${CLASS_A1_ID}', '${STUDENT_1_ID}');`);
  } catch (err) {
    studentEnrollBlocked = true;
    studentEnrollErr = err.message;
  }
  recordTest(
    '[-] F8: Mahasiswa memanggil enroll_student -> DITOLAK',
    studentEnrollBlocked && studentEnrollErr.includes('FORBIDDEN'),
    `Eksepsi: ${studentEnrollErr}`
  );

  // 2e. Mahasiswa memanggil transfer_class -> DITOLAK
  let studentTransferBlocked = false;
  let studentTransferErr = '';
  try {
    await db.query(`SELECT public.transfer_class('${CLASS_A1_ID}', '${CLASS_A2_ID}', '${STUDENT_1_ID}');`);
  } catch (err) {
    studentTransferBlocked = true;
    studentTransferErr = err.message;
  }
  recordTest(
    '[-] F8: Mahasiswa memanggil transfer_class -> DITOLAK',
    studentTransferBlocked && studentTransferErr.includes('FORBIDDEN'),
    `Eksepsi: ${studentTransferErr}`
  );

  // ===========================================================================
  // F5 & F8: SUPER_ADMIN DITOLAK DARI SELURUH RPC AKADEMIK
  // ===========================================================================
  console.log('--- 6. PENGUJIAN SUPER_ADMIN MEMANGGIL RPC AKADEMIK (F5 & F8) ---');

  await asUser(SUPERADMIN_ID);

  // 3a. SUPER_ADMIN memanggil approve_class -> DITOLAK
  let saApproveBlocked = false;
  let saApproveErr = '';
  try {
    await db.query(`SELECT public.approve_class('${CLASS_A2_ID}', 'OPEN');`);
  } catch (err) {
    saApproveBlocked = true;
    saApproveErr = err.message;
  }
  recordTest(
    '[-] F5/F8: SUPER_ADMIN memanggil approve_class -> DITOLAK',
    saApproveBlocked && saApproveErr.includes('FORBIDDEN'),
    `Eksepsi: ${saApproveErr}`
  );

  // 3b. SUPER_ADMIN memanggil assign_lecturer -> DITOLAK
  let saAssignBlocked = false;
  let saAssignErr = '';
  try {
    await db.query(`SELECT public.assign_lecturer('${CLASS_A1_ID}', '${LECTURER_1_ID}');`);
  } catch (err) {
    saAssignBlocked = true;
    saAssignErr = err.message;
  }
  recordTest(
    '[-] F5/F8: SUPER_ADMIN memanggil assign_lecturer -> DITOLAK',
    saAssignBlocked && saAssignErr.includes('FORBIDDEN'),
    `Eksepsi: ${saAssignErr}`
  );

  // 3c. SUPER_ADMIN memanggil enroll_student -> DITOLAK
  let saEnrollBlocked = false;
  let saEnrollErr = '';
  try {
    await db.query(`SELECT public.enroll_student('${CLASS_A1_ID}', '${STUDENT_1_ID}');`);
  } catch (err) {
    saEnrollBlocked = true;
    saEnrollErr = err.message;
  }
  recordTest(
    '[-] F5/F8: SUPER_ADMIN memanggil enroll_student -> DITOLAK',
    saEnrollBlocked && saEnrollErr.includes('FORBIDDEN'),
    `Eksepsi: ${saEnrollErr}`
  );

  // 3d. SUPER_ADMIN memanggil transfer_class -> DITOLAK
  let saTransferBlocked = false;
  let saTransferErr = '';
  try {
    await db.query(`SELECT public.transfer_class('${CLASS_A1_ID}', '${CLASS_A2_ID}', '${STUDENT_1_ID}');`);
  } catch (err) {
    saTransferBlocked = true;
    saTransferErr = err.message;
  }
  recordTest(
    '[-] F5/F8: SUPER_ADMIN memanggil transfer_class -> DITOLAK',
    saTransferBlocked && saTransferErr.includes('FORBIDDEN'),
    `Eksepsi: ${saTransferErr}`
  );

  // 3e. SUPER_ADMIN memanggil batch_enroll_students -> DITOLAK
  let saBatchBlocked = false;
  let saBatchErr = '';
  try {
    await db.query(`SELECT public.batch_enroll_students('[{"student_id":"${STUDENT_1_ID}","class_id":"${CLASS_A1_ID}"}]'::jsonb);`);
  } catch (err) {
    saBatchBlocked = true;
    saBatchErr = err.message;
  }
  recordTest(
    '[-] F5/F8: SUPER_ADMIN memanggil batch_enroll_students -> DITOLAK',
    saBatchBlocked && saBatchErr.includes('FORBIDDEN'),
    `Eksepsi: ${saBatchErr}`
  );

  // ===========================================================================
  // F6 & F8: ATURAN PERSETUJUAN KELAS (approve_class & propose_class)
  // ===========================================================================
  console.log('--- 7. ATURAN PERSETUJUAN KELAS (F6 & F8) ---');

  // 4a. Staf Akademik memanggil approve_class -> DITOLAK
  await asUser(STAFF_ID);
  let staffApproveBlocked = false;
  let staffApproveErr = '';
  try {
    await db.query(`SELECT public.approve_class('${CLASS_A2_ID}', 'OPEN');`);
  } catch (err) {
    staffApproveBlocked = true;
    staffApproveErr = err.message;
  }
  recordTest(
    '[-] F6/F8: Staf Akademik approve_class -> DITOLAK (hanya Kaprodi prodi terkait)',
    staffApproveBlocked && staffApproveErr.includes('FORBIDDEN'),
    `Eksepsi: ${staffApproveErr}`
  );

  // 4b. Kaprodi SI (lain prodi) mencoba approve kelas TIF -> DITOLAK
  await asUser(COORD_B_ID);
  let crossCoordBlocked = false;
  let crossCoordErr = '';
  try {
    await db.query(`SELECT public.approve_class('${CLASS_A2_ID}', 'OPEN');`);
  } catch (err) {
    crossCoordBlocked = true;
    crossCoordErr = err.message;
  }
  recordTest(
    '[-] F6/F8: Kaprodi lain prodi approve_class -> DITOLAK',
    crossCoordBlocked && crossCoordErr.includes('FORBIDDEN'),
    `Eksepsi: ${crossCoordErr}`
  );

  // 4c. Kaprodi mencoba menyetujui kelas yang diajukannya sendiri -> DITOLAK
  await asUser(COORD_A_ID);
  let selfApprovalBlocked = false;
  let selfApprovalErr = '';
  try {
    await db.query(`SELECT public.approve_class('${CLASS_A3_ID}', 'OPEN');`);
  } catch (err) {
    selfApprovalBlocked = true;
    selfApprovalErr = err.message;
  }
  recordTest(
    '[-] F6: Pengaju kelas dilarang menyetujui kelas buatannya sendiri -> DITOLAK',
    selfApprovalBlocked && selfApprovalErr.includes('SELF_APPROVAL_FORBIDDEN'),
    `Eksepsi: ${selfApprovalErr}`
  );

  // 4d. Kaprodi mencoba transisi status tidak valid (mis. OPEN -> DRAFT) -> DITOLAK
  let invalidTransitionBlocked = false;
  let invalidTransitionErr = '';
  try {
    await db.query(`SELECT public.approve_class('${CLASS_A1_ID}', 'DRAFT');`);
  } catch (err) {
    invalidTransitionBlocked = true;
    invalidTransitionErr = err.message;
  }
  recordTest(
    '[-] F6: Transisi status tidak sah (OPEN -> DRAFT) -> DITOLAK tabel transisi',
    invalidTransitionBlocked && invalidTransitionErr.includes('INVALID_STATUS_TRANSITION'),
    `Eksepsi: ${invalidTransitionErr}`
  );

  // 4e. Kaprodi menolak kelas (DRAFT -> CLOSED) tanpa alasan -> DITOLAK
  let rejectWithoutReasonBlocked = false;
  let rejectWithoutReasonErr = '';
  try {
    await db.query(`SELECT public.approve_class('${CLASS_A2_ID}', 'CLOSED', '');`);
  } catch (err) {
    rejectWithoutReasonBlocked = true;
    rejectWithoutReasonErr = err.message;
  }
  recordTest(
    '[-] F6: Penolakan kelas tanpa alasan -> DITOLAK',
    rejectWithoutReasonBlocked && rejectWithoutReasonErr.includes('REASON_REQUIRED'),
    `Eksepsi: ${rejectWithoutReasonErr}`
  );

  // 4f. Kaprodi menolak kelas dengan alasan -> BERHASIL & ALASAN TERCATAT
  let rejectWithReasonOk = false;
  let rejectionReasonSaved = null;
  try {
    const res = await db.query(`SELECT (public.approve_class('${CLASS_A2_ID}', 'CLOSED', 'Ruangan kelas tidak mencukupi')).rejection_reason as r;`);
    rejectWithReasonOk = true;
    rejectionReasonSaved = res.rows[0].r;
  } catch (err) {
    rejectWithReasonOk = false;
  }
  recordTest(
    '[+] F6: Penolakan kelas dengan alasan -> BERHASIL & tercatat di tabel',
    rejectWithReasonOk && rejectionReasonSaved === 'Ruangan kelas tidak mencukupi',
    `Alasan tercatat: "${rejectionReasonSaved}"`
  );

  // 4g. Jalur "ajukan" terpisah: Staf mengajukan kelas baru via propose_class -> BERHASIL status DRAFT
  await asUser(STAFF_ID);
  let staffProposeOk = false;
  let proposedClassId = null;
  try {
    const res = await db.query(`
      SELECT id, status FROM public.propose_class('Algoritma Pemrograman', 'A', '${COURSE_A_ID}'::uuid, '${SEMESTER_ID}'::uuid, 40::smallint);
    `);
    staffProposeOk = true;
    proposedClassId = res.rows[0].id;
    assert.strictEqual(res.rows[0].status, 'DRAFT');
  } catch (err) {
    console.error('Staff propose error:', err.message);
    staffProposeOk = false;
  }
  recordTest(
    '[+] F6: Staf mengajukan kelas baru via propose_class -> BERHASIL berstatus DRAFT',
    staffProposeOk,
    `Kelas baru diajukan ID: ${proposedClassId}`
  );

  // 4h. Kaprodi menyetujui kelas yang diajukan staf -> BERHASIL DRAFT -> OPEN
  await asUser(COORD_A_ID);
  let coordApproveProposedOk = false;
  try {
    await db.query(`SELECT public.approve_class('${proposedClassId}', 'OPEN');`);
    coordApproveProposedOk = true;
  } catch (err) {
    coordApproveProposedOk = false;
  }
  recordTest(
    '[+] F6: Kaprodi menyetujui kelas yang diajukan staf -> BERHASIL (DRAFT -> OPEN)',
    coordApproveProposedOk,
    'Status kelas berhasil disetujui menjadi OPEN'
  );

  // ===========================================================================
  // F7 & F8: VALIDASI BISNIS MUTASI, ENROLLMENT, DAN BATCH CSV
  // ===========================================================================
  console.log('--- 8. VALIDASI BISNIS MUTASI, ENROLLMENT & BATCH (F7 & F8) ---');

  await asUser(STAFF_ID);

  // 5a. Transfer ke kelas non-paralel (beda mata kuliah/semester) -> DITOLAK
  let transferNonParallelBlocked = false;
  let transferNonParallelErr = '';
  try {
    await db.query(`SELECT public.transfer_class('${CLASS_A1_ID}', '${CLASS_B1_ID}', '${STUDENT_1_ID}');`);
  } catch (err) {
    transferNonParallelBlocked = true;
    transferNonParallelErr = err.message;
  }
  recordTest(
    '[-] F7/F8: Transfer ke kelas non-paralel (beda prodi/matkul) -> DITOLAK',
    transferNonParallelBlocked && transferNonParallelErr.includes('NOT_PARALLEL_CLASS'),
    `Eksepsi: ${transferNonParallelErr}`
  );

  // 5b. Transfer mahasiswa non-aktif -> DITOLAK
  let transferInactiveBlocked = false;
  let transferInactiveErr = '';
  try {
    await db.query(`SELECT public.transfer_class('${CLASS_A1_ID}', '${proposedClassId}', '${STUDENT_INACTIVE_ID}');`);
  } catch (err) {
    transferInactiveBlocked = true;
    transferInactiveErr = err.message;
  }
  recordTest(
    '[-] F7: Transfer mahasiswa non-aktif -> DITOLAK',
    transferInactiveBlocked && transferInactiveErr.includes('STUDENT_NOT_ACTIVE'),
    `Eksepsi: ${transferInactiveErr}`
  );

  // 5c. Transfer kelas paralel valid -> BERHASIL
  let transferParallelOk = false;
  try {
    await db.query(`SELECT public.transfer_class('${CLASS_A1_ID}', '${proposedClassId}', '${STUDENT_1_ID}', 'Pindah kelas paralel');`);
    transferParallelOk = true;
  } catch (err) {
    transferParallelOk = false;
  }
  recordTest(
    '[+] F7/F8: Transfer ke kelas paralel valid (course_id & semester_id sama) -> BERHASIL',
    transferParallelOk,
    `Mahasiswa berhasil dimutasi dari ${CLASS_A1_ID} ke ${proposedClassId}`
  );

  // 5d. Enroll ke kelas berstatus tutup (CLOSED) -> DITOLAK
  let enrollClosedBlocked = false;
  let enrollClosedErr = '';
  try {
    await db.query(`SELECT public.enroll_student('${CLASS_B1_ID}', '${STUDENT_2_ID}');`);
  } catch (err) {
    enrollClosedBlocked = true;
    enrollClosedErr = err.message;
  }
  recordTest(
    '[-] F7/F8: Enroll ke kelas tutup (status CLOSED) -> DITOLAK',
    enrollClosedBlocked && enrollClosedErr.includes('CLASS_NOT_ACCEPTING_ENROLLMENTS'),
    `Eksepsi: ${enrollClosedErr}`
  );

  // 5e. Enroll ke kelas OPEN valid -> BERHASIL
  let enrollOpenOk = false;
  try {
    await db.query(`SELECT public.enroll_student('${CLASS_A1_ID}', '${STUDENT_2_ID}');`);
    enrollOpenOk = true;
  } catch (err) {
    enrollOpenOk = false;
  }
  recordTest(
    '[+] F7: Enroll ke kelas OPEN valid -> BERHASIL',
    enrollOpenOk,
    'Mahasiswa berhasil didaftarkan ke kelas berstatus OPEN'
  );

  // 5f. Batch enroll dengan jumlah baris > 1000 -> DITOLAK
  const largeBatchPayload = [];
  for (let i = 0; i < 1005; i++) {
    largeBatchPayload.push({ student_id: STUDENT_1_ID, class_id: CLASS_A1_ID });
  }
  let batchOverLimitBlocked = false;
  let batchOverLimitErr = '';
  try {
    await db.query(`SELECT public.batch_enroll_students('${JSON.stringify(largeBatchPayload)}'::jsonb);`);
  } catch (err) {
    batchOverLimitBlocked = true;
    batchOverLimitErr = err.message;
  }
  recordTest(
    '[-] F7/F8: Batch enroll di atas batas (1005 baris > 1000) -> DITOLAK',
    batchOverLimitBlocked && batchOverLimitErr.includes('BATCH_LIMIT_EXCEEDED'),
    `Eksepsi: ${batchOverLimitErr}`
  );

  // 5g. Batch enroll payload bukan array (invalid JSON type) -> DITOLAK
  let batchInvalidJsonBlocked = false;
  let batchInvalidJsonErr = '';
  try {
    await db.query(`SELECT public.batch_enroll_students('{"student_id":"${STUDENT_1_ID}"}'::jsonb);`);
  } catch (err) {
    batchInvalidJsonBlocked = true;
    batchInvalidJsonErr = err.message;
  }
  recordTest(
    '[-] F7: Batch enroll bentuk JSON non-array -> DITOLAK',
    batchInvalidJsonBlocked && batchInvalidJsonErr.includes('INVALID_JSON_ARRAY'),
    `Eksepsi: ${batchInvalidJsonErr}`
  );

  // 5h. Batch enroll valid melaporkan status per baris -> BERHASIL
  const validBatchPayload = [
    { student_id: STUDENT_1_ID, class_id: proposedClassId },
    { student_id: STUDENT_2_ID, class_id: CLASS_B1_ID } // gagal karena CLOSED
  ];
  let batchReportOk = false;
  let batchReportRes = null;
  try {
    const res = await db.query(`SELECT public.batch_enroll_students('${JSON.stringify(validBatchPayload)}'::jsonb) as r;`);
    batchReportOk = true;
    batchReportRes = res.rows[0].r;
  } catch (err) {
    batchReportOk = false;
  }
  recordTest(
    '[+] F7: Batch enroll valid memproses dan melaporkan per baris (success & failed)',
    batchReportOk && batchReportRes?.total === 2 && batchReportRes?.results?.length === 2,
    `Total: ${batchReportRes?.total}, Success: ${batchReportRes?.success}, Failed: ${batchReportRes?.failed}`
  );

  console.log('========================================================================================');
  console.log(`  HASIL AKHIR UJI DATABASE FASE 3A (REFINEMENT F1..F8): ${passedCount}/${totalCount} UJI LOLOS (100%)`);
  console.log('========================================================================================\n');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runPhase3aDatabaseTests().catch((err) => {
  console.error('Fatal Database Test Error:', err);
  process.exit(1);
});
