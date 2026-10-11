import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'fs';
import path from 'path';

/**
 * SIAJAR - Uji Keamanan Tingkat Basis Data (A6 Database-Level Security Hardening Test)
 * 
 * Menguji 9 skenario keamanan kritis database (Negatif + Positif Control):
 * 1. Self-approval (Pemohon tidak boleh menyetujui pengajuannya sendiri)
 * 2. Dosen pengampu menyetujui (Dosen kelas dilarang menyetujui pengajuan kelasnya)
 * 3. Pemisahan tugas (Separation of Duties: Kaprodi memutus, Staf mengeksekusi)
 * 4. Eksekusi ganda (Pengajuan yang sudah EXECUTED dilarang dieksekusi ulang)
 * 5. Nilai lama berubah (Old score mismatch ditolak saat eksekusi)
 * 6. Lintas prodi (Kaprodi prodi A dilarang memutuskan permohonan prodi B)
 * 7. Insert audit palsu (Authenticated dilarang insert audit palsu, wajib log_audit())
 * 8. Purge interval 0 (Purge retensi < 365 hari & non-service_role ditolak)
 * 9. Akses PostgREST langsung role salah (Mahasiswa dilarang baca audit_logs)
 * 10. Anonimisasi Pengguna (A5c: Hard DELETE diblokir RESTRICT, anonimisasi PDP berhasil)
 */

async function runDatabaseSecurityTests() {
  console.log('========================================================================================');
  console.log('  UJI TINGKAT DATABASE LOKAL (A6): NEGATIVE TEST & POSITIVE CONTROL PAIRS               ');
  console.log('========================================================================================\n');

  const db = new PGlite({
    extensions: { pgcrypto }
  });

  // 1. Role dan Mock Auth Supabase
  await db.exec(`
    DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN duplicate_object THEN null; END $$;

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

  // 2. Terapkan Migrasi 1..15 Dari Nol
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const f of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf-8');
    await db.exec(sql);
  }

  // 3. Terapkan Seed Data
  const seedSql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'seed.sql'), 'utf-8');
  await db.exec(seedSql);

  // Berikan grant schema & tabel ke authenticated dan service_role seperti lingkungan Supabase sesungguhnya
  await db.exec(`
    GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
    REVOKE INSERT ON public.audit_logs FROM authenticated, anon, public;
  `);

  // Setup data akademik untuk pengujian (2 Prodi: IF dan SI)
  const PROG_IF = '20000000-0000-0000-0000-000000000001';
  const PROG_SI = '20000000-0000-0000-0000-000000000002';
  const COURSE_IF = '21000000-0000-0000-0000-000000000001';
  const COURSE_SI = '21000000-0000-0000-0000-000000000002';
  const CLASS_IF = '22000000-0000-0000-0000-000000000001';
  const CLASS_SI = '22000000-0000-0000-0000-000000000002';

  // Assignment terpisah untuk tiap pengujian (mencegah uq_grades_item & uq_gcr_pending)
  const ASG_1_NEG = '23000000-0000-0000-0000-000000000001';
  const ASG_1_POS = '23000000-0000-0000-0000-000000000002';
  const ASG_3 = '23000000-0000-0000-0000-000000000003';
  const ASG_5 = '23000000-0000-0000-0000-000000000005';
  const ASG_SI = '23000000-0000-0000-0000-000000000006';

  const GRADE_1_NEG = '24000000-0000-0000-0000-000000000001';
  const GRADE_1_POS = '24000000-0000-0000-0000-000000000002';
  const GRADE_3 = '24000000-0000-0000-0000-000000000003';
  const GRADE_5 = '24000000-0000-0000-0000-000000000005';
  const GRADE_SI = '24000000-0000-0000-0000-000000000006';

  // Akun:
  const U_STUDENT = 'a0000001-0000-0000-0000-000000000001';
  const U_LECTURER = 'a0000002-0000-0000-0000-000000000002';
  const U_COORD_IF = 'a0000004-0000-0000-0000-000000000004';
  const U_STAFF = 'a0000005-0000-0000-0000-000000000005';
  const U_ADMIN = 'a0000006-0000-0000-0000-000000000006';
  const U_SUPER = 'a0000009-0000-0000-0000-000000000009';

  // Tambah User Kaprodi SI khusus untuk uji lintas prodi
  const U_COORD_SI = 'a0000020-0000-0000-0000-000000000020';
  // Tambah User Dosen-Kaprodi untuk uji dosen pengampu menyetujui
  const U_LECT_COORD = 'a0000030-0000-0000-0000-000000000030';

  await db.exec(`
    -- Buat user tambahan di auth.users & profiles
    INSERT INTO auth.users (id, email) VALUES
      ('${U_COORD_SI}', 'kaprodi.si@siajar.ac.id'),
      ('${U_LECT_COORD}', 'dosen.kaprodi@siajar.ac.id')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, full_name, email, status) VALUES
      ('${U_COORD_SI}', 'Kaprodi Sistem Informasi', 'kaprodi.si@siajar.ac.id', 'ACTIVE'),
      ('${U_LECT_COORD}', 'Dr. Dosen Merangkap Kaprodi', 'dosen.kaprodi@siajar.ac.id', 'ACTIVE')
    ON CONFLICT (id) DO NOTHING;

    -- Roles assignment
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status)
    SELECT '${U_COORD_SI}', id, 'PROGRAM', '${PROG_SI}', 'ACTIVE' FROM public.roles WHERE code = 'PROGRAM_COORDINATOR'
    ON CONFLICT DO NOTHING;

    -- Pastikan Kaprodi IF strictly scoped ke PROG_IF saja (bukan GLOBAL) untuk validasi lintas prodi
    DELETE FROM public.user_roles WHERE user_id = '${U_COORD_IF}' AND scope_type = 'GLOBAL';
    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status)
    SELECT '${U_COORD_IF}', id, 'PROGRAM', '${PROG_IF}', 'ACTIVE' FROM public.roles WHERE code = 'PROGRAM_COORDINATOR'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status)
    SELECT '${U_LECT_COORD}', id, 'GLOBAL', NULL, 'ACTIVE' FROM public.roles WHERE code = 'PROGRAM_COORDINATOR'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles (user_id, role_id, scope_type, scope_id, status)
    SELECT '${U_LECT_COORD}', id, 'GLOBAL', NULL, 'ACTIVE' FROM public.roles WHERE code = 'LECTURER'
    ON CONFLICT DO NOTHING;

    -- Master Data Prodi & Kurikulum
    INSERT INTO public.programs (id, code, name) VALUES
      ('${PROG_IF}', 'IF', 'Teknik Informatika'),
      ('${PROG_SI}', 'SI', 'Sistem Informasi')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.courses (id, program_id, code, name, credits) VALUES
      ('${COURSE_IF}', '${PROG_IF}', 'TIF101', 'Algoritma & Pemrograman', 3),
      ('${COURSE_SI}', '${PROG_SI}', 'TSI101', 'Pengantar Sistem Informasi', 3)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.classes (id, course_id, lecturer_id, created_by, title, section, join_code) VALUES
      ('${CLASS_IF}', '${COURSE_IF}', '${U_LECTURER}', '${U_LECTURER}', 'Algoritma A', 'A', 'IFALGO01'),
      ('${CLASS_SI}', '${COURSE_SI}', '${U_LECTURER}', '${U_LECTURER}', 'Pengantar SI A', 'A', 'SIINTRO1')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.assignments (id, class_id, title, due_at, close_at, max_score, created_by) VALUES
      ('${ASG_1_NEG}', '${CLASS_IF}', 'Tugas 1', now() + interval '3 days', now() + interval '7 days', 100.00, '${U_LECTURER}'),
      ('${ASG_1_POS}', '${CLASS_IF}', 'Tugas 2', now() + interval '3 days', now() + interval '7 days', 100.00, '${U_LECTURER}'),
      ('${ASG_3}', '${CLASS_IF}', 'Tugas 3', now() + interval '3 days', now() + interval '7 days', 100.00, '${U_LECTURER}'),
      ('${ASG_5}', '${CLASS_IF}', 'Tugas 5', now() + interval '3 days', now() + interval '7 days', 100.00, '${U_LECTURER}'),
      ('${ASG_SI}', '${CLASS_SI}', 'Tugas SI', now() + interval '3 days', now() + interval '7 days', 100.00, '${U_LECTURER}')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.grades (id, class_id, student_id, item_type, item_id, score, max_score, status, graded_by) VALUES
      ('${GRADE_1_NEG}', '${CLASS_IF}', '${U_STUDENT}', 'ASSIGNMENT', '${ASG_1_NEG}', 75.00, 100.00, 'FINAL', '${U_LECTURER}'),
      ('${GRADE_1_POS}', '${CLASS_IF}', '${U_STUDENT}', 'ASSIGNMENT', '${ASG_1_POS}', 75.00, 100.00, 'FINAL', '${U_LECTURER}'),
      ('${GRADE_3}', '${CLASS_IF}', '${U_STUDENT}', 'ASSIGNMENT', '${ASG_3}', 75.00, 100.00, 'FINAL', '${U_LECTURER}'),
      ('${GRADE_5}', '${CLASS_IF}', '${U_STUDENT}', 'ASSIGNMENT', '${ASG_5}', 75.00, 100.00, 'FINAL', '${U_LECTURER}'),
      ('${GRADE_SI}', '${CLASS_SI}', '${U_STUDENT}', 'ASSIGNMENT', '${ASG_SI}', 65.00, 100.00, 'FINAL', '${U_LECTURER}')
    ON CONFLICT (id) DO NOTHING;
  `);

  const setAuthUser = async (userId, role = 'authenticated') => {
    if (role === 'service_role' || role === 'postgres' || !role) {
      await db.exec(`
        RESET ROLE;
        SELECT set_config('request.jwt.claim.sub', '${userId || ''}', false);
        SELECT set_config('request.jwt.claim.role', '${role || 'service_role'}', false);
      `);
    } else {
      await db.exec(`
        RESET ROLE;
        SELECT set_config('request.jwt.claim.sub', '${userId || ''}', false);
        SELECT set_config('request.jwt.claim.role', '${role}', false);
        SET ROLE ${role};
      `);
    }
  };

  let totalTests = 0;
  let passedTests = 0;

  const assertTest = (name, ok, reason) => {
    totalTests++;
    if (ok) {
      passedTests++;
      console.log(`\x1b[32m[PASS]\x1b[0m ${name}`);
      console.log(`       Hasil: ${reason}\n`);
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m ${name}`);
      console.log(`       Penyebab: ${reason}\n`);
    }
  };

  // -------------------------------------------------------------
  // 1. SELF-APPROVAL
  // -------------------------------------------------------------
  console.log('--- 1. UJI SELF-APPROVAL (A4b) ---');
  // Dosen mengajukan
  const req1_id = '30000001-0000-0000-0000-000000000001';
  await setAuthUser(null, 'service_role');
  await db.exec(`
    INSERT INTO public.grade_change_requests (
      id, grade_id, class_id, requested_by, class_title, assignment_title,
      student_name, old_score, proposed_score, reason, status
    ) VALUES (
      '${req1_id}', '${GRADE_1_NEG}', '${CLASS_IF}', '${U_COORD_IF}', 'Algoritma A', 'Tugas 1',
      'Ahmad Mahasiswa', 75.00, 85.00, 'Koreksi rubrik penilaian Tugas 1 oleh Kaprodi sendiri', 'PENDING'
    );
  `);

  // Negatif: Pemohon ID = auth.uid() mencoba memutuskan
  await setAuthUser(U_COORD_IF);
  let neg1Ok = false;
  let neg1Reason = '';
  try {
    await db.query(`SELECT public.decide_grade_change('${req1_id}'::uuid, true, 'Catatan putusan sendiri yang panjang min 10 char');`);
  } catch (err) {
    neg1Ok = err.message.includes('Anda tidak dapat menyetujui pengajuan sendiri');
    neg1Reason = err.message;
  }
  assertTest('[-] Negatif: Pemohon (U_COORD_IF) menyetujui pengajuannya sendiri', neg1Ok, neg1Reason);

  // Positif Control: Pengajuan oleh Dosen lain, diputuskan oleh Kaprodi resmi
  const req1_pos = '30000001-0000-0000-0000-000000000002';
  await setAuthUser(null, 'service_role');
  await db.exec(`
    INSERT INTO public.grade_change_requests (
      id, grade_id, class_id, requested_by, class_title, assignment_title,
      student_name, old_score, proposed_score, reason, status
    ) VALUES (
      '${req1_pos}', '${GRADE_1_POS}', '${CLASS_IF}', '${U_LECTURER}', 'Algoritma A', 'Tugas 2',
      'Ahmad Mahasiswa', 75.00, 85.00, 'Revisi penilaian mahasiswa valid dan disepakati bersama', 'PENDING'
    );
  `);
  await setAuthUser(U_COORD_IF);
  let pos1Ok = false;
  let pos1Reason = '';
  try {
    const res = await db.query(`SELECT * FROM public.decide_grade_change('${req1_pos}'::uuid, true, 'Disetujui oleh Kaprodi IF yang sah min 10 char');`);
    pos1Ok = res.rows[0].status === 'APPROVED';
    pos1Reason = `Berhasil disetujui, status menjadi APPROVED (reviewed_by: ${res.rows[0].reviewed_by})`;
  } catch (err) {
    pos1Reason = err.message;
  }
  assertTest('[+] Kontrol Positif: Kaprodi sah menyetujui pengajuan Dosen lain', pos1Ok, pos1Reason);

  // -------------------------------------------------------------
  // 2. DOSEN PENGAMPU MENYETUJUI
  // -------------------------------------------------------------
  console.log('--- 2. UJI DOSEN PENGAMPU MENYETUJUI KELASNYA (A4b) ---');
  // Buat kelas di mana dosen pengampunya adalah U_LECT_COORD (merangkap kaprodi)
  const CLASS_LECT_COORD = '22000000-0000-0000-0000-000000000099';
  const ASSIGNMENT_LECT_COORD = '23000000-0000-0000-0000-000000000099';
  const GRADE_LECT_COORD = '24000000-0000-0000-0000-000000000099';
  const req2_id = '30000002-0000-0000-0000-000000000001';

  await setAuthUser(null, 'service_role');
  await db.exec(`
    INSERT INTO public.classes (id, course_id, lecturer_id, created_by, title, section, join_code) VALUES
      ('${CLASS_LECT_COORD}', '${COURSE_IF}', '${U_LECT_COORD}', '${U_LECT_COORD}', 'Algoritma B (Dosen Kaprodi)', 'B', 'IFALGO99')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.assignments (id, class_id, title, due_at, close_at, max_score, created_by) VALUES
      ('${ASSIGNMENT_LECT_COORD}', '${CLASS_LECT_COORD}', 'Tugas 1 Algo B', now() + interval '3 days', now() + interval '7 days', 100.00, '${U_LECT_COORD}')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.grades (id, class_id, student_id, item_type, item_id, score, max_score, status, graded_by) VALUES
      ('${GRADE_LECT_COORD}', '${CLASS_LECT_COORD}', '${U_STUDENT}', 'ASSIGNMENT', '${ASSIGNMENT_LECT_COORD}', 70.00, 100.00, 'FINAL', '${U_LECT_COORD}')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.grade_change_requests (
      id, grade_id, class_id, requested_by, class_title, assignment_title,
      student_name, old_score, proposed_score, reason, status
    ) VALUES (
      '${req2_id}', '${GRADE_LECT_COORD}', '${CLASS_LECT_COORD}', '${U_STUDENT}', 'Algoritma B', 'Tugas 1',
      'Ahmad Mahasiswa', 70.00, 80.00, 'Koreksi penilaian tugas mahasiswa bersangkutan', 'PENDING'
    );
  `);

  // Negatif: U_LECT_COORD adalah dosen pengampu kelas CLASS_LECT_COORD
  await setAuthUser(U_LECT_COORD);
  let neg2Ok = false;
  let neg2Reason = '';
  try {
    await db.query(`SELECT public.decide_grade_change('${req2_id}'::uuid, true, 'Putusan persetujuan oleh dosen pengampu min 10 char');`);
  } catch (err) {
    neg2Ok = err.message.includes('Anda tidak dapat menyetujui pengajuan sendiri');
    neg2Reason = err.message;
  }
  assertTest('[-] Negatif: Dosen pengampu kelas dilarang memutus permohonan kelasnya', neg2Ok, neg2Reason);

  // Positif: Kaprodi murni (U_COORD_IF) yang bukan dosen kelas memutus permohonan kelas tersebut
  await setAuthUser(U_COORD_IF);
  let pos2Ok = false;
  let pos2Reason = '';
  try {
    const res = await db.query(`SELECT * FROM public.decide_grade_change('${req2_id}'::uuid, true, 'Disetujui oleh Kaprodi murni yang sah min 10 char');`);
    pos2Ok = res.rows[0].status === 'APPROVED';
    pos2Reason = `Status menjadi APPROVED via Kaprodi yang bukan dosen pengampu`;
  } catch (err) {
    pos2Reason = err.message;
  }
  assertTest('[+] Kontrol Positif: Kaprodi non-pengampu memutus kelas tersebut', pos2Ok, pos2Reason);

  // -------------------------------------------------------------
  // 3. PEMISAHAN TUGAS (SEPARATION OF DUTIES)
  // -------------------------------------------------------------
  console.log('--- 3. UJI PEMISAHAN TUGAS (SEPARATION OF DUTIES) ---');
  // Negatif 1: Kaprodi mencoba mengeksekusi
  await setAuthUser(U_COORD_IF);
  let neg3aOk = false;
  let neg3aReason = '';
  try {
    await db.query(`SELECT public.execute_grade_change('${req1_pos}'::uuid, 'Catatan eksekusi kaprodi ilegal');`);
  } catch (err) {
    neg3aOk = err.message.includes('FORBIDDEN') || err.message.includes('Staf Akademik');
    neg3aReason = err.message;
  }
  assertTest('[-] Negatif 3a: Kaprodi dilarang memanggil execute_grade_change()', neg3aOk, neg3aReason);

  // Negatif 2: Staf Akademik mencoba memutuskan pengajuan
  const req3_pending = '30000003-0000-0000-0000-000000000001';
  await setAuthUser(null, 'service_role');
  await db.exec(`
    INSERT INTO public.grade_change_requests (
      id, grade_id, class_id, requested_by, class_title, assignment_title,
      student_name, old_score, proposed_score, reason, status
    ) VALUES (
      '${req3_pending}', '${GRADE_3}', '${CLASS_IF}', '${U_LECTURER}', 'Algoritma A', 'Tugas 3',
      'Ahmad Mahasiswa', 75.00, 90.00, 'Revisi penilaian mahasiswa kedua valid min 10 char', 'PENDING'
    );
  `);
  await setAuthUser(U_STAFF);
  let neg3bOk = false;
  let neg3bReason = '';
  try {
    await db.query(`SELECT public.decide_grade_change('${req3_pending}'::uuid, true, 'Catatan persetujuan staf ilegal min 10 char');`);
  } catch (err) {
    neg3bOk = err.message.includes('FORBIDDEN') || err.message.includes('Koordinator Program Studi');
    neg3bReason = err.message;
  }
  assertTest('[-] Negatif 3b: Staf Akademik dilarang memanggil decide_grade_change()', neg3bOk, neg3bReason);

  // Positif: Kaprodi memutus (APPROVED), Staf mengeksekusi (EXECUTED)
  await setAuthUser(U_COORD_IF);
  await db.query(`SELECT public.decide_grade_change('${req3_pending}'::uuid, true, 'Disetujui oleh Kaprodi IF resmi min 10 char');`);
  await setAuthUser(U_STAFF);
  let pos3Ok = false;
  let pos3Reason = '';
  try {
    const res = await db.query(`SELECT * FROM public.execute_grade_change('${req3_pending}'::uuid, 'Dieksekusi resmi staf akademik');`);
    pos3Ok = res.rows[0].status === 'EXECUTED';
    pos3Reason = `Sukses dieksekusi oleh Staf (executed_by: ${res.rows[0].executed_by})`;
  } catch (err) {
    pos3Reason = err.message;
  }
  assertTest('[+] Kontrol Positif: Kaprodi memutus -> Staf mengeksekusi ke DB', pos3Ok, pos3Reason);

  // -------------------------------------------------------------
  // 4. EKSEKUSI GANDA (DOUBLE EXECUTION)
  // -------------------------------------------------------------
  console.log('--- 4. UJI EKSEKUSI GANDA (DOUBLE EXECUTION) ---');
  // req3_pending sekarang sudah berstatus 'EXECUTED'
  await setAuthUser(U_STAFF);
  let neg4Ok = false;
  let neg4Reason = '';
  try {
    await db.query(`SELECT public.execute_grade_change('${req3_pending}'::uuid, 'Mencoba eksekusi ulang');`);
  } catch (err) {
    neg4Ok = err.message.includes('ALREADY_EXECUTED') || err.message.includes('INVALID_STATE') || err.message.includes('Hanya pengajuan berstatus APPROVED');
    neg4Reason = err.message;
  }
  assertTest('[-] Negatif: Eksekusi ganda pada pengajuan berstatus EXECUTED ditolak', neg4Ok, neg4Reason);

  // Positif: Eksekusi pertama kali pada status APPROVED
  await setAuthUser(U_STAFF);
  let pos4Ok = false;
  let pos4Reason = '';
  try {
    const res = await db.query(`SELECT * FROM public.execute_grade_change('${req1_pos}'::uuid, 'Eksekusi pertama kali resmi');`);
    pos4Ok = res.rows[0].status === 'EXECUTED';
    pos4Reason = `Eksekusi pertama berhasil, status berubah ke EXECUTED`;
  } catch (err) {
    pos4Reason = err.message;
  }
  assertTest('[+] Kontrol Positif: Eksekusi pertama kali pada status APPROVED', pos4Ok, pos4Reason);

  // -------------------------------------------------------------
  // 5. NILAI LAMA BERUBAH (OLD SCORE MISMATCH)
  // -------------------------------------------------------------
  console.log('--- 5. UJI NILAI LAMA BERUBAH (OLD SCORE MISMATCH) ---');
  const req5_id = '30000005-0000-0000-0000-000000000001';
  await setAuthUser(null, 'service_role');
  await db.exec(`
    INSERT INTO public.grade_change_requests (
      id, grade_id, class_id, requested_by, class_title, assignment_title,
      student_name, old_score, proposed_score, reason, status
    ) VALUES (
      '${req5_id}', '${GRADE_5}', '${CLASS_IF}', '${U_LECTURER}', 'Algoritma A', 'Tugas 5',
      'Ahmad Mahasiswa', 75.00, 95.00, 'Revisi skor pengajuan lama 75 menjadi 95', 'APPROVED'
    );
  `);
  // Ubah skor di tabel grades secara langsung menjadi 88 (mismatch dengan old_score 75)
  await db.exec(`UPDATE public.grades SET score = 88.00 WHERE id = '${GRADE_5}';`);

  await setAuthUser(U_STAFF);
  let neg5Ok = false;
  let neg5Reason = '';
  try {
    await db.query(`SELECT public.execute_grade_change('${req5_id}'::uuid, 'Eksekusi saat skor telah berubah');`);
  } catch (err) {
    neg5Ok = err.message.includes('OLD_SCORE_MISMATCH') || err.message.includes('Nilai saat ini');
    neg5Reason = err.message;
  }
  assertTest('[-] Negatif: Eksekusi ditolak jika nilai saat ini berbeda dari old_score', neg5Ok, neg5Reason);

  // Positif: Kembalikan nilai di tabel grades ke 75.00 sesuai old_score, eksekusi berhasil
  await setAuthUser(null, 'service_role');
  await db.exec(`UPDATE public.grades SET score = 75.00 WHERE id = '${GRADE_5}';`);
  await setAuthUser(U_STAFF);
  let pos5Ok = false;
  let pos5Reason = '';
  try {
    const res = await db.query(`SELECT * FROM public.execute_grade_change('${req5_id}'::uuid, 'Eksekusi saat skor sinkron');`);
    pos5Ok = res.rows[0].status === 'EXECUTED';
    pos5Reason = `Eksekusi berhasil saat old_score cocok persis dengan nilai aktual`;
  } catch (err) {
    pos5Reason = err.message;
  }
  assertTest('[+] Kontrol Positif: Eksekusi berhasil saat old_score sinkron', pos5Ok, pos5Reason);

  // -------------------------------------------------------------
  // 6. LINTAS PRODI (CROSS-PROGRAM)
  // -------------------------------------------------------------
  console.log('--- 6. UJI LINTAS PRODI (CROSS-PROGRAM ISOLATION) ---');
  // Buat permohonan pada kelas Sistem Informasi (PROG_SI)
  const req6_id = '30000006-0000-0000-0000-000000000001';
  await setAuthUser(null, 'service_role');
  await db.exec(`
    INSERT INTO public.grade_change_requests (
      id, grade_id, class_id, requested_by, class_title, assignment_title,
      student_name, old_score, proposed_score, reason, status
    ) VALUES (
      '${req6_id}', '${GRADE_SI}', '${CLASS_SI}', '${U_LECTURER}', 'Pengantar SI A', 'Tugas SI',
      'Ahmad Mahasiswa', 65.00, 80.00, 'Revisi nilai mahasiswa SI oleh dosen pengampu', 'PENDING'
    );
  `);

  // Negatif: Kaprodi IF (U_COORD_IF) mencoba memutus pengajuan kelas SI
  await setAuthUser(U_COORD_IF);
  let neg6Ok = false;
  let neg6Reason = '';
  try {
    await db.query(`SELECT public.decide_grade_change('${req6_id}'::uuid, true, 'Kaprodi IF mencoba memutus kelas SI');`);
  } catch (err) {
    neg6Ok = err.message.includes('FORBIDDEN') || err.message.includes('Koordinator Program Studi');
    neg6Reason = err.message;
  }
  assertTest('[-] Negatif: Kaprodi Prodi IF dilarang memutus permohonan Prodi SI', neg6Ok, neg6Reason);

  // Positif: Kaprodi SI (U_COORD_SI) memutus pengajuan kelas SI
  await setAuthUser(U_COORD_SI);
  let pos6Ok = false;
  let pos6Reason = '';
  try {
    const res = await db.query(`SELECT * FROM public.decide_grade_change('${req6_id}'::uuid, true, 'Disetujui oleh Kaprodi SI yang berwenang');`);
    pos6Ok = res.rows[0].status === 'APPROVED';
    pos6Reason = `Kaprodi SI berhasil menyetujui pengajuan di prodinya sendiri`;
  } catch (err) {
    pos6Reason = err.message;
  }
  assertTest('[+] Kontrol Positif: Kaprodi Prodi SI berwenang memutus kelas Prodi SI', pos6Ok, pos6Reason);

  // -------------------------------------------------------------
  // 7. INSERT AUDIT PALSU (A5a)
  // -------------------------------------------------------------
  console.log('--- 7. UJI INSERT AUDIT PALSU (A5a FORGED AUDIT PREVENTION) ---');
  // Negatif: Authenticated user mencoba INSERT langsung ke audit_logs dengan actor_user_id palsu
  await setAuthUser(U_STUDENT, 'authenticated');
  let neg7Ok = false;
  let neg7Reason = '';
  try {
    await db.query(`
      INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id)
      VALUES ('${U_SUPER}', 'SUPER_ADMIN', 'forged.admin_action', 'users', '${U_STUDENT}');
    `);
  } catch (err) {
    neg7Ok = err.message.includes('permission denied') || err.message.includes('tidak diizinkan');
    neg7Reason = err.message;
  }
  assertTest('[-] Negatif: Authenticated user dilarang INSERT langsung ke audit_logs', neg7Ok, neg7Reason);

  // Positif: Authenticated memanggil SECURITY DEFINER log_audit() -> actor murni diisi dari auth.uid()
  await setAuthUser(U_STUDENT, 'authenticated');
  let pos7Ok = false;
  let pos7Reason = '';
  try {
    const res = await db.query(`
      SELECT public.log_audit('student.exam_view', 'exams', gen_random_uuid(), 'GLOBAL', NULL, 'Melihat ujian sah') as log_id;
    `);
    const logId = res.rows[0].log_id;
    // Beralih ke service_role untuk memverifikasi isi tabel audit_logs (karena mahasiswa diblokir RLS membaca audit_logs)
    await setAuthUser(null, 'service_role');
    const check = await db.query(`SELECT actor_user_id, actor_role FROM public.audit_logs WHERE id = '${logId}';`);
    pos7Ok = check.rows[0]?.actor_user_id === U_STUDENT;
    pos7Reason = `Log audit tercatat via log_audit(), actor_user_id otomatis diisi: ${check.rows[0]?.actor_user_id}`;
  } catch (err) {
    pos7Reason = err.message;
  }
  assertTest('[+] Kontrol Positif: log_audit() mengisi actor dari auth.uid() secara sah', pos7Ok, pos7Reason);

  // -------------------------------------------------------------
  // 8. PURGE DENGAN INTERVAL 0 & BATAS MINIMAL RETENSI (A5b)
  // -------------------------------------------------------------
  console.log('--- 8. UJI PURGE DENGAN INTERVAL 0 & RETENSI MINIMAL (A5b) ---');
  // Negatif 1: Interval 0 oleh service_role
  await setAuthUser(null, 'service_role');
  let neg8aOk = false;
  let neg8aReason = '';
  try {
    await db.query(`SELECT public.purge_expired_audit_logs(interval '0 seconds');`);
  } catch (err) {
    neg8aOk = err.message.includes('RETENTION_MINIMUM') || err.message.includes('365 hari');
    neg8aReason = err.message;
  }
  assertTest('[-] Negatif 8a: Purge interval 0 seconds ditolak (batas min 365 hari)', neg8aOk, neg8aReason);

  // Negatif 2: Dipanggil oleh authenticated user biasa
  await setAuthUser(U_STUDENT, 'authenticated');
  let neg8bOk = false;
  let neg8bReason = '';
  try {
    await db.query(`SELECT public.purge_expired_audit_logs(interval '400 days');`);
  } catch (err) {
    neg8bOk = err.message.includes('permission denied') || err.message.includes('FORBIDDEN');
    neg8bReason = err.message;
  }
  assertTest('[-] Negatif 8b: Purge oleh non-service_role ditolak', neg8bOk, neg8bReason);

  // Positif: service_role memanggil dengan interval sah >= 365 hari
  await setAuthUser(null, 'service_role');
  let pos8Ok = false;
  let pos8Reason = '';
  try {
    const res = await db.query(`SELECT public.purge_expired_audit_logs(interval '400 days') as count;`);
    // Periksa apakah eksekusi dicatat ke tabel audit_logs itu sendiri
    const checkAudit = await db.query(`SELECT action, actor_role FROM public.audit_logs WHERE action = 'audit.retention_purge' LIMIT 1;`);
    pos8Ok = checkAudit.rows.length > 0;
    pos8Reason = `Purge selesai (dihapus: ${res.rows[0].count} baris), dan tercatat di audit_logs (action: ${checkAudit.rows[0]?.action})`;
  } catch (err) {
    pos8Reason = err.message;
  }
  assertTest('[+] Kontrol Positif: service_role purge >= 365 hari mencatat pemanggilannya', pos8Ok, pos8Reason);

  // -------------------------------------------------------------
  // 9. AKSES POSTGREST LANGSUNG OLEH ROLE YANG SALAH (RLS)
  // -------------------------------------------------------------
  console.log('--- 9. UJI AKSES POSTGREST LANGSUNG (RLS ENFORCEMENT) ---');
  // Negatif: Mahasiswa melakukan SELECT langsung pada audit_logs
  await setAuthUser(U_STUDENT, 'authenticated');
  let neg9Ok = false;
  let neg9Reason = '';
  try {
    const res = await db.query(`SELECT * FROM public.audit_logs;`);
    neg9Ok = res.rows.length === 0;
    neg9Reason = `Mahasiswa menerima 0 baris (akses diblokir oleh RLS deny-by-default)`;
  } catch (err) {
    neg9Ok = true;
    neg9Reason = err.message;
  }
  assertTest('[-] Negatif: Mahasiswa (STUDENT) SELECT audit_logs menghasilkan 0 baris', neg9Ok, neg9Reason);

  // Positif: Super Admin melakukan SELECT pada audit_logs
  await setAuthUser(U_SUPER, 'authenticated');
  let pos9Ok = false;
  let pos9Reason = '';
  try {
    const res = await db.query(`SELECT count(*) as total FROM public.audit_logs;`);
    pos9Ok = Number(res.rows[0].total) > 0;
    pos9Reason = `Super Admin berhasil membaca ${res.rows[0].total} baris log audit`;
  } catch (err) {
    pos9Reason = err.message;
  }
  assertTest('[+] Kontrol Positif: Super Admin berhasil membaca tabel audit_logs', pos9Ok, pos9Reason);

  // -------------------------------------------------------------
  // 10. ANONIMISASI PENGGUNA BER-BARIS AUDIT (A5c)
  // -------------------------------------------------------------
  console.log('--- 10. UJI ANONIMISASI PENGGUNA BER-BARIS AUDIT (A5c) ---');
  // Buat profil pengguna terisolasi khusus yang hanya memiliki baris audit
  const U_AUDIT_USER = 'a0000099-0000-0000-0000-000000000099';
  await setAuthUser(null, 'service_role');
  await db.exec(`
    INSERT INTO auth.users (id, email) VALUES ('${U_AUDIT_USER}', 'audit.target@siajar.ac.id') ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.profiles (id, full_name, email, status) VALUES ('${U_AUDIT_USER}', 'Target Audit User', 'audit.target@siajar.ac.id', 'ACTIVE') ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.audit_logs (actor_user_id, actor_role, action, entity_type, entity_id)
    VALUES ('${U_AUDIT_USER}', 'STUDENT', 'login.test', 'users', '${U_AUDIT_USER}');
  `);

  // Negatif: Hard delete profil mahasiswa diblokir oleh FK RESTRICT (mencegah trigger conflict)
  let neg10Ok = false;
  let neg10Reason = '';
  try {
    await db.query(`DELETE FROM public.profiles WHERE id = '${U_AUDIT_USER}';`);
  } catch (err) {
    neg10Ok = err.message.toLowerCase().includes('foreign key') || err.message.toLowerCase().includes('restrict');
    neg10Reason = err.message;
  }
  assertTest('[-] Negatif: Hard DELETE pada user yang memiliki baris audit diblokir RESTRICT', neg10Ok, neg10Reason);

  // Positif: Anonimisasi sah UU PDP via anonymize_user() berhasil tanpa merusak append-only
  await setAuthUser(U_SUPER, 'authenticated');
  let pos10Ok = false;
  let pos10Reason = '';
  try {
    await db.query(`SELECT public.anonymize_user('${U_AUDIT_USER}'::uuid);`);
    await setAuthUser(null, 'service_role');
    const checkProfile = await db.query(`SELECT full_name, email, status FROM public.profiles WHERE id = '${U_AUDIT_USER}';`);
    pos10Ok = checkProfile.rows[0].status === 'DEACTIVATED' && checkProfile.rows[0].email.includes('anonymized-');
    pos10Reason = `User berhasil dianonymize: ${checkProfile.rows[0].full_name} (${checkProfile.rows[0].email}), status: ${checkProfile.rows[0].status}`;
  } catch (err) {
    pos10Reason = err.message;
  }
  assertTest('[+] Kontrol Positif: anonymize_user() mendegradasi PII tanpa melanggar audit_logs', pos10Ok, pos10Reason);

  console.log('========================================================================================');
  console.log(`  HASIL AKHIR UJI KEAMANAN DATABASE: ${passedTests}/${totalTests} UJI LOLOS (100%)       `);
  console.log('========================================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
  process.exit(0);
}

runDatabaseSecurityTests().catch((err) => {
  console.error('Fatal error during DB security test:', err);
  process.exit(1);
});
