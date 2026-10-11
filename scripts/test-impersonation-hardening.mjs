import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

// 1. Mock server-only
const serverOnlyPath = require.resolve('server-only');
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
};

// 2. Cookie Store Mock
let cookieStoreData = new Map();
const mockCookiesObj = {
  get: (name) => {
    const val = cookieStoreData.get(name);
    return val !== undefined ? { name, value: val } : undefined;
  },
  set: (name, value) => {
    cookieStoreData.set(name, value);
  },
  delete: (name) => {
    cookieStoreData.delete(name);
  },
  has: (name) => cookieStoreData.has(name),
  getAll: () => Array.from(cookieStoreData.entries()).map(([name, value]) => ({ name, value })),
};

const nextHeadersPath = require.resolve('next/headers');
require.cache[nextHeadersPath] = {
  id: nextHeadersPath,
  filename: nextHeadersPath,
  loaded: true,
  exports: {
    cookies: () => mockCookiesObj,
    headers: () => new Headers(),
  },
};

// 3. Next Navigation Mock
const nextNavPath = require.resolve('next/navigation');
require.cache[nextNavPath] = {
  id: nextNavPath,
  filename: nextNavPath,
  loaded: true,
  exports: {
    redirect: (url) => {
      const err = new Error(`NEXT_REDIRECT;${url}`);
      err.digest = `NEXT_REDIRECT;${url}`;
      throw err;
    },
  },
};

// 4. Mock Database Tables
const REAL_ADMIN_ID = 'a0000010-0000-0000-0000-000000000010';
const TARGET_STUDENT_ID = 'a0000001-0000-0000-0000-000000000001';
const TARGET_SUPERADMIN_ID = 'a0000099-0000-0000-0000-000000000099';
const ATTACKER_USER_ID = 'a0000002-0000-0000-0000-000000000002';

const mockDb = {
  profiles: new Map([
    [REAL_ADMIN_ID, { id: REAL_ADMIN_ID, full_name: 'Super Administrator Utama', email: 'admin@siajar.local', status: 'ACTIVE' }],
    [TARGET_STUDENT_ID, { id: TARGET_STUDENT_ID, full_name: 'Ahmad Mahasiswa', email: 'ahmad@student.siajar.local', status: 'ACTIVE' }],
    [TARGET_SUPERADMIN_ID, { id: TARGET_SUPERADMIN_ID, full_name: 'Budi SuperAdmin Kedua', email: 'budi.admin@siajar.local', status: 'ACTIVE' }],
    [ATTACKER_USER_ID, { id: ATTACKER_USER_ID, full_name: 'Dr. Dosen Penyerang', email: 'dosen@siajar.local', status: 'ACTIVE' }],
  ]),
  roles: new Map([
    ['SUPER_ADMIN', { id: '10000000-0000-0000-0000-000000000010', code: 'SUPER_ADMIN', name: 'Super Administrator' }],
    ['STUDENT', { id: '10000000-0000-0000-0000-000000000001', code: 'STUDENT', name: 'Mahasiswa' }],
    ['LECTURER', { id: '10000000-0000-0000-0000-000000000002', code: 'LECTURER', name: 'Dosen' }],
  ]),
  user_roles: [
    { id: 'ur-1', user_id: REAL_ADMIN_ID, role_id: '10000000-0000-0000-0000-000000000010', status: 'ACTIVE', code: 'SUPER_ADMIN' },
    { id: 'ur-2', user_id: TARGET_STUDENT_ID, role_id: '10000000-0000-0000-0000-000000000001', status: 'ACTIVE', code: 'STUDENT' },
    { id: 'ur-3', user_id: TARGET_SUPERADMIN_ID, role_id: '10000000-0000-0000-0000-000000000010', status: 'ACTIVE', code: 'SUPER_ADMIN' },
    { id: 'ur-4', user_id: ATTACKER_USER_ID, role_id: '10000000-0000-0000-0000-000000000002', status: 'ACTIVE', code: 'LECTURER' },
  ],
  audit_logs: [],
  simulateQueryError: false,
  simulateTargetQueryError: false,
  simulateAuditError: false,
};

// 5. Mock supabaseAdmin
function createMockQueryBuilder(table) {
  const filters = [];
  let isSingle = false;
  let isMaybeSingle = false;

  const builder = {
    select: (cols) => builder,
    eq: (col, val) => {
      filters.push({ col, val });
      return builder, builder;
    },
    single: () => {
      isSingle = true;
      return builder.execute();
    },
    maybeSingle: () => {
      isMaybeSingle = true;
      return builder.execute();
    },
    upsert: async (record) => {
      if (mockDb.simulateQueryError) {
        return { data: null, error: { message: 'Database query failure (simulated)' } };
      }
      const existingIdx = mockDb.user_roles.findIndex((ur) => ur.user_id === record.user_id);
      if (existingIdx >= 0) {
        mockDb.user_roles[existingIdx] = { ...mockDb.user_roles[existingIdx], ...record };
      } else {
        mockDb.user_roles.push({ id: `ur-${Date.now()}`, ...record });
      }
      return { data: record, error: null };
    },
    insert: async (record) => {
      if (mockDb.simulateAuditError) {
        return { data: null, error: { message: 'Audit write disk full (simulated)' } };
      }
      mockDb.audit_logs.push(record);
      return { data: record, error: null };
    },
    execute: async () => {
      if (mockDb.simulateQueryError) {
        return { data: null, error: { message: 'Database query failure (simulated)' } };
      }

      if (mockDb.simulateTargetQueryError) {
        const userFilter = filters.find((f) => f.col === 'user_id');
        if (userFilter && userFilter.val === TARGET_STUDENT_ID) {
          return { data: null, error: { message: 'Target role query failure (simulated)' } };
        }
      }

      if (table === 'profiles') {
        const idFilter = filters.find((f) => f.col === 'id');
        const profile = idFilter ? mockDb.profiles.get(idFilter.val) : null;
        if (isSingle && !profile) {
          return { data: null, error: { message: 'Profile not found' } };
        }
        return { data: profile, error: null };
      }

      if (table === 'roles') {
        const codeFilter = filters.find((f) => f.col === 'code');
        const role = codeFilter ? mockDb.roles.get(codeFilter.val) : null;
        return { data: role, error: null };
      }

      if (table === 'user_roles') {
        let rows = [...mockDb.user_roles];
        for (const f of filters) {
          if (f.col === 'user_id') {
            rows = rows.filter((r) => r.user_id === f.val);
          } else if (f.col === 'status') {
            rows = rows.filter((r) => r.status === f.val);
          } else if (f.col === 'roles.code') {
            rows = rows.filter((r) => r.code === f.val);
          }
        }
        const data = rows.map((r) => ({
          id: r.id,
          role_id: r.role_id,
          scope_type: 'GLOBAL',
          scope_id: null,
          roles: { code: r.code, name: r.code, description: `${r.code} role` },
        }));
        if (isSingle) {
          return { data: data[0] || null, error: data[0] ? null : { message: 'Not found' } };
        }
        return { data, error: null };
      }

      return { data: [], error: null };
    },
    then: (resolve, reject) => builder.execute().then(resolve, reject),
  };

  return builder;
}

const mockSupabaseAdmin = {
  from: (table) => createMockQueryBuilder(table),
  rpc: async (fn, params) => {
    if (mockDb.simulateQueryError) {
      return { data: null, error: { message: 'RPC execution failed (simulated)' } };
    }
    if (fn === 'anonymize_user') {
      const p = mockDb.profiles.get(params.p_user_id);
      if (p) {
        p.full_name = 'Anonymized User';
        p.email = `anonymized-${params.p_user_id}@deleted.local`;
        p.status = 'DEACTIVATED';
      }
      return { data: null, error: null };
    }
    return { data: null, error: null };
  },
};

const adminPath = require.resolve('../src/lib/supabase/admin.ts');
require.cache[adminPath] = {
  id: adminPath,
  filename: adminPath,
  loaded: true,
  exports: {
    supabaseAdmin: mockSupabaseAdmin,
  },
};

// 6. Mock status.ts: checkSupabaseOnline returns true
const statusPath = require.resolve('../src/lib/supabase/status.ts');
require.cache[statusPath] = {
  id: statusPath,
  filename: statusPath,
  loaded: true,
  exports: {
    checkSupabaseOnline: async () => true,
  },
};

async function runImpersonationHardeningTests() {
  // 7. Dynamic Import KODE ASLI setelah semua mock terpasang di require.cache
  const {
    getCurrentUserWithRoles,
    impersonateUserAction,
    stopImpersonatingAction,
    changePasswordAction,
    updateUserEmailAction,
    updateUserRoleAction,
    deleteUserAction,
  } = await import('../src/modules/identity/actions.ts');
  const {
    signImpersonationToken,
    verifyImpersonationToken,
    getImpersonationSecret,
  } = await import('../src/modules/identity/impersonation-token.ts');
  const { submitQuizAttemptAction } = await import('../src/modules/academic/quiz-actions.ts');
  const {
    decideGradeChangeAction,
    executeGradeChangeAction,
  } = await import('../src/modules/academic/actions.ts');
  console.log('========================================================================================');
  console.log('  UJI IMPERSONASI (DENGAN MOCK): TOKEN HMAC, VALIDASI DB & LARANGAN A3c             ');
  console.log('========================================================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (name, ok, detail) => {
    total++;
    if (ok) {
      passed++;
      console.log(`\x1b[32m[PASS]\x1b[0m ${name}`);
      console.log(`       Hasil: ${detail}\n`);
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m ${name}`);
      console.log(`       Penyebab: ${detail}\n`);
    }
  };

  // -------------------------------------------------------------
  // 1. APP_SECRET KOSONG DI PRODUCTION (GAGAL-TUTUP / FAIL-CLOSED)
  // -------------------------------------------------------------
  console.log('--- 1. UJI FAIL-CLOSED: APP_SECRET DI PRODUCTION (A3c) ---');
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.APP_SECRET;

  process.env.NODE_ENV = 'production';
  delete process.env.APP_SECRET;

  let failClosedOk = false;
  let failClosedReason = '';
  try {
    getImpersonationSecret();
  } catch (err) {
    failClosedOk = err.message.includes('APP_SECRET');
    failClosedReason = err.message;
  }
  assert('[-] Gagal-tutup: APP_SECRET kosong di production melempar eksepsi kritis', failClosedOk, failClosedReason);

  // Restore env
  process.env.NODE_ENV = prevEnv || 'test';
  process.env.APP_SECRET = prevSecret || 'test-super-secret-key-at-least-32-chars-long-for-hmac-sha256';

  // -------------------------------------------------------------
  // 2. PEMBUATAN TOKEN & VALIDASI INTEGRITAS HMAC (A3a)
  // -------------------------------------------------------------
  console.log('--- 2. UJI TOKEN HMAC: VALID, PALSU & KEDALUWARSA (A3a) ---');

  const now = Date.now();
  const validToken = signImpersonationToken({
    originalAdminId: REAL_ADMIN_ID,
    originalAdminRole: 'SUPER_ADMIN',
    originalAdminName: 'Super Administrator Utama',
    targetUserId: TARGET_STUDENT_ID,
    reason: 'Investigasi tiket bantuan mahasiswa kendala nilai',
    startedAt: now,
    expiresAt: now + 1800 * 1000,
  });

  // 2a. Token Valid
  const payloadValid = verifyImpersonationToken(validToken);
  assert(
    '[+] Token valid diverifikasi berhasil dengan payload utuh',
    payloadValid !== null && payloadValid.targetUserId === TARGET_STUDENT_ID && payloadValid.originalAdminId === REAL_ADMIN_ID,
    `Token valid: Admin asli = ${payloadValid?.originalAdminId}, Target = ${payloadValid?.targetUserId}`
  );

  // 2b. Token Dipalsukan (Tampered signature)
  const tamperedToken = validToken.substring(0, validToken.length - 8) + 'abcdef12';
  const payloadTampered = verifyImpersonationToken(tamperedToken);
  assert(
    '[-] Token dipalsukan (signature mismatch) ditolak (mengembalikan null)',
    payloadTampered === null,
    'HMAC signature verification failed: token ditolak'
  );

  // 2c. Token Kedaluwarsa
  const expiredToken = signImpersonationToken({
    originalAdminId: REAL_ADMIN_ID,
    originalAdminRole: 'SUPER_ADMIN',
    originalAdminName: 'Super Administrator Utama',
    targetUserId: TARGET_STUDENT_ID,
    reason: 'Sesi investigasi lama',
    startedAt: now - 3600 * 1000,
    expiresAt: now - 60 * 1000,
  });
  const payloadExpired = verifyImpersonationToken(expiredToken);
  assert(
    '[-] Token kedaluwarsa (expiresAt < now) ditolak (mengembalikan null)',
    payloadExpired === null,
    'Masa berlaku token telah habis: token ditolak'
  );

  // -------------------------------------------------------------
  // 3. PEMANGGILAN KODE ASLI: getCurrentUserWithRoles() DENGAN MOCK DB
  // -------------------------------------------------------------
  console.log('--- 3. UJI RESOLUSI IDENTITAS EFEKTIF: KODE ASLI getCurrentUserWithRoles() ---');

  // 3a. Admin Asli Login + Token Valid -> Berhasil Impersonasi ke Mahasiswa
  cookieStoreData.clear();
  cookieStoreData.set('demo_session', REAL_ADMIN_ID);
  cookieStoreData.set('impersonation_token', validToken);

  const context3a = await getCurrentUserWithRoles();
  assert(
    '[+] Sesi Super Admin sah dengan token valid menghasilkan identitas efektif target mahasiswa (KODE ASLI)',
    context3a?.isImpersonating === true &&
      context3a?.user.id === TARGET_STUDENT_ID &&
      context3a?.impersonatingFrom === REAL_ADMIN_ID,
    `Identitas efektif = ${context3a?.user.id} (isImpersonating: ${context3a?.isImpersonating}, from: ${context3a?.impersonatingFrom})`
  );

  // 3b. Pengguna Lain (Attacker) Mencuri Token -> Ditolak di Kode Asli
  cookieStoreData.clear();
  cookieStoreData.set('demo_session', ATTACKER_USER_ID);
  cookieStoreData.set('impersonation_token', validToken);

  const context3b = await getCurrentUserWithRoles();
  assert(
    '[-] Pengguna lain (sesi != originalAdminId) mencoba memakai token ditolak oleh kode asli',
    context3b?.isImpersonating === false && context3b?.user.id === ATTACKER_USER_ID,
    `Impersonasi ditolak: identitas tetap sesi pemanggil = ${context3b?.user.id}`
  );

  // 3c. Admin Asli Dicabut Perannya di DB -> Ditolak di Kode Asli
  const backupRoles = [...mockDb.user_roles];
  // Cabut role SUPER_ADMIN dari REAL_ADMIN_ID di mock DB
  mockDb.user_roles = mockDb.user_roles.filter(
    (ur) => !(ur.user_id === REAL_ADMIN_ID && ur.code === 'SUPER_ADMIN')
  );

  cookieStoreData.clear();
  cookieStoreData.set('demo_session', REAL_ADMIN_ID);
  cookieStoreData.set('impersonation_token', validToken);

  const context3c = await getCurrentUserWithRoles();
  assert(
    '[-] Admin tanpa peran SUPER_ADMIN di DB ditolak mengaktifkan penyamaran oleh kode asli',
    context3c?.isImpersonating === false && context3c?.user.id === REAL_ADMIN_ID,
    `Impersonasi ditolak: peran DB bukan SUPER_ADMIN`
  );

  // Restore roles di mock DB
  mockDb.user_roles = backupRoles;

  // -------------------------------------------------------------
  // 4. PEMANGGILAN KODE ASLI: impersonateUserAction()
  // -------------------------------------------------------------
  console.log('--- 4. UJI KODE ASLI: impersonateUserAction() DENGAN VALIDASI DB & FAIL-CLOSED ---');

  // Set sesi Super Admin
  cookieStoreData.clear();
  cookieStoreData.set('demo_session', REAL_ADMIN_ID);
  cookieStoreData.set('active_role', 'SUPER_ADMIN');

  // 4a. Target Super Admin Ditolak
  const res4_super = await impersonateUserAction(TARGET_SUPERADMIN_ID, 'Investigasi tiket teknis nomor 101');
  assert(
    '[-] Penyamaran ke target ber-role SUPER_ADMIN di DB ditolak oleh kode asli',
    res4_super.ok === false && res4_super.error?.includes('CANNOT_IMPERSONATE_SUPERADMIN'),
    res4_super.error
  );

  // 4b. Target Student Diizinkan & Menghasilkan Token
  const res4_student = await impersonateUserAction(TARGET_STUDENT_ID, 'Investigasi tiket teknis nomor 102');
  assert(
    '[+] Penyamaran ke target ber-role STUDENT di DB diterima oleh kode asli',
    res4_student.ok === true && cookieStoreData.has('impersonation_token'),
    'Token impersonasi berhasil dibuat dan disimpan di cookie'
  );

  // 4c. Fail-Closed: Query DB Error Ditolak
  cookieStoreData.delete('impersonation_token');
  mockDb.simulateTargetQueryError = true;
  const res4_failClosed = await impersonateUserAction(TARGET_STUDENT_ID, 'Investigasi tiket teknis nomor 103');
  mockDb.simulateTargetQueryError = false;
  assert(
    '[-] Fail-closed: Query DB error pada pemeriksaan target ditolak (bukan lanjut)',
    res4_failClosed.ok === false && res4_failClosed.error?.includes('QUERY_FAILED'),
    res4_failClosed.error
  );

  // 4d. Fail-Closed: Audit Write Error Membatalkan Impersonasi (A5a)
  cookieStoreData.delete('impersonation_token');
  mockDb.simulateAuditError = true;
  const res4_auditFail = await impersonateUserAction(TARGET_STUDENT_ID, 'Investigasi tiket teknis nomor 104');
  mockDb.simulateAuditError = false;
  assert(
    '[-] Fail-closed A5a: Kegagalan penulisan audit membatalkan sesi dan menghapus cookie token',
    res4_auditFail.ok === false &&
      res4_auditFail.error?.includes('AUDIT_FAILED') &&
      !cookieStoreData.has('impersonation_token'),
    res4_auditFail.error
  );

  // -------------------------------------------------------------
  // 5. PENGUJIAN KODE ASLI: SELURUH LARANGAN A3c SAAT IMPERSONASI AKTIF
  // -------------------------------------------------------------
  console.log('--- 5. UJI KODE ASLI: SELURUH LARANGAN A3c SAAT IMPERSONASI AKTIF ---');

  // Pasang sesi impersonasi aktif ke mahasiswa
  cookieStoreData.clear();
  cookieStoreData.set('demo_session', REAL_ADMIN_ID);
  cookieStoreData.set('impersonation_token', validToken);

  // 5a. changePasswordAction
  const res5_pwd = await changePasswordAction('oldPassword123!', 'newPassword123!');
  assert(
    '[-] Larangan A3c: changePasswordAction diblokir saat sesi impersonasi aktif',
    res5_pwd.ok === false && res5_pwd.error?.includes('IMPERSONATION_RESTRICTED'),
    res5_pwd.error
  );

  // 5b. updateUserEmailAction
  const res5_email = await updateUserEmailAction('newemail@student.siajar.local');
  assert(
    '[-] Larangan A3c: updateUserEmailAction diblokir saat sesi impersonasi aktif',
    res5_email.ok === false && res5_email.error?.includes('IMPERSONATION_RESTRICTED'),
    res5_email.error
  );

  // 5c. submitQuizAttemptAction
  const res5_quiz = await submitQuizAttemptAction({ attemptId: 'att-001' });
  assert(
    '[-] Larangan A3c: submitQuizAttemptAction diblokir saat sesi impersonasi aktif',
    res5_quiz.ok === false && res5_quiz.error?.includes('IMPERSONATION_RESTRICTED'),
    res5_quiz.error
  );

  // 5d. updateUserRoleAction
  const res5_role = await updateUserRoleAction({ targetUserId: TARGET_STUDENT_ID, newRole: 'LECTURER' });
  assert(
    '[-] Larangan A3c: updateUserRoleAction diblokir saat sesi impersonasi aktif',
    res5_role.ok === false && res5_role.error?.includes('IMPERSONATION_RESTRICTED'),
    res5_role.error
  );

  // 5e. deleteUserAction
  const res5_del = await deleteUserAction({ targetUserId: TARGET_STUDENT_ID });
  assert(
    '[-] Larangan A3c: deleteUserAction diblokir saat sesi impersonasi aktif',
    res5_del.ok === false && res5_del.error?.includes('IMPERSONATION_RESTRICTED'),
    res5_del.error
  );

  // 5f. Chaining impersonateUserAction
  const res5_chain = await impersonateUserAction(ATTACKER_USER_ID, 'Coba chaining penyamaran kedua kali');
  assert(
    '[-] Larangan A3c: impersonateUserAction (chaining) diblokir saat sesi impersonasi aktif',
    res5_chain.ok === false && res5_chain.error?.includes('CHAINING_PROHIBITED'),
    res5_chain.error
  );

  // 5g. decideGradeChangeAction
  const res5_decide = await decideGradeChangeAction({
    request_id: 'cr-001',
    approve: true,
    note: 'Catatan keputusan penolakan atau persetujuan nilai',
  });
  assert(
    '[-] Larangan A3c: decideGradeChangeAction diblokir saat sesi impersonasi aktif',
    res5_decide.ok === false && res5_decide.error?.includes('IMPERSONATION_RESTRICTED'),
    res5_decide.error
  );

  // 5h. executeGradeChangeAction
  const res5_exec = await executeGradeChangeAction({
    request_id: 'cr-001',
    note: 'Catatan eksekusi perubahan nilai',
  });
  assert(
    '[-] Larangan A3c: executeGradeChangeAction diblokir saat sesi impersonasi aktif',
    res5_exec.ok === false && res5_exec.error?.includes('IMPERSONATION_RESTRICTED'),
    res5_exec.error
  );

  // -------------------------------------------------------------
  // 6. UJI PERLINDUNGAN SUPER ADMIN TERAKHIR DARI DB (A4b)
  // -------------------------------------------------------------
  console.log('--- 6. UJI KODE ASLI: PERLINDUNGAN SUPER ADMIN TERAKHIR DARI DB (A4b) ---');

  // Bersihkan sesi impersonasi, login sebagai Super Admin asli
  cookieStoreData.clear();
  cookieStoreData.set('demo_session', REAL_ADMIN_ID);
  cookieStoreData.set('active_role', 'SUPER_ADMIN');

  // 6a. Demote Super Admin diri sendiri ditolak
  const res6_demoteSelf = await updateUserRoleAction({ targetUserId: REAL_ADMIN_ID, newRole: 'STUDENT' });
  assert(
    '[-] Kode Asli: Demote Super Admin diri sendiri ditolak (CANNOT_MODIFY_SELF)',
    res6_demoteSelf.ok === false && res6_demoteSelf.error?.includes('CANNOT_MODIFY_SELF'),
    res6_demoteSelf.error
  );

  // 6b. Hapus Super Admin diri sendiri ditolak
  const res6_delSelf = await deleteUserAction({ targetUserId: REAL_ADMIN_ID });
  assert(
    '[-] Kode Asli: Hapus Super Admin diri sendiri ditolak (CANNOT_DELETE_SELF)',
    res6_delSelf.ok === false && res6_delSelf.error?.includes('CANNOT_DELETE_SELF'),
    res6_delSelf.error
  );

  // 6c. Demote Super Admin terakhir di DB (A4b)
  // Kondisi: Hanya TARGET_SUPERADMIN_ID yang tersisa sebagai Super Admin di DB
  mockDb.user_roles = [
    { id: 'ur-3', user_id: TARGET_SUPERADMIN_ID, role_id: '10000000-0000-0000-0000-000000000010', status: 'ACTIVE', code: 'SUPER_ADMIN' },
  ];
  const res6_demoteLast = await updateUserRoleAction({ targetUserId: TARGET_SUPERADMIN_ID, newRole: 'STUDENT' });
  assert(
    '[-] Kode Asli A4b: Demote Super Admin terakhir dari DB ditolak (CANNOT_DEMOTE_LAST_SUPERADMIN)',
    res6_demoteLast.ok === false && res6_demoteLast.error?.includes('CANNOT_DEMOTE_LAST_SUPERADMIN'),
    res6_demoteLast.error
  );

  const res6_delLast = await deleteUserAction({ targetUserId: TARGET_SUPERADMIN_ID });
  assert(
    '[-] Kode Asli A4b: Hapus Super Admin terakhir dari DB ditolak (CANNOT_DELETE_LAST_SUPERADMIN)',
    res6_delLast.ok === false && res6_delLast.error?.includes('CANNOT_DELETE_LAST_SUPERADMIN'),
    res6_delLast.error
  );

  // 6d. Fail-Closed A4a: Query error pada updateUserRoleAction
  mockDb.simulateTargetQueryError = true;
  const res6_roleQueryErr = await updateUserRoleAction({ targetUserId: TARGET_STUDENT_ID, newRole: 'LECTURER' });
  mockDb.simulateTargetQueryError = false;
  assert(
    '[-] Kode Asli A4a: Query error pada updateUserRoleAction ditolak fail-closed (QUERY_FAILED)',
    res6_roleQueryErr.ok === false && res6_roleQueryErr.error?.includes('QUERY_FAILED'),
    res6_roleQueryErr.error
  );

  // 6e. Fail-Closed A5a: Audit failure pada updateUserRoleAction membatalkan aksi
  mockDb.user_roles = [...backupRoles];
  mockDb.simulateAuditError = true;
  const res6_roleAuditErr = await updateUserRoleAction({ targetUserId: TARGET_STUDENT_ID, newRole: 'LECTURER' });
  mockDb.simulateAuditError = false;
  assert(
    '[-] Kode Asli A5a: Audit log failure pada updateUserRoleAction membatalkan aksi (AUDIT_FAILED)',
    res6_roleAuditErr.ok === false && res6_roleAuditErr.error?.includes('AUDIT_FAILED'),
    res6_roleAuditErr.error
  );

  // 6f. Fail-Closed A5a: Audit failure pada deleteUserAction membatalkan aksi
  mockDb.simulateAuditError = true;
  const res6_delAuditErr = await deleteUserAction({ targetUserId: TARGET_STUDENT_ID });
  mockDb.simulateAuditError = false;
  assert(
    '[-] Kode Asli A5a: Audit log failure pada deleteUserAction membatalkan aksi (AUDIT_FAILED)',
    res6_delAuditErr.ok === false && res6_delAuditErr.error?.includes('AUDIT_FAILED'),
    res6_delAuditErr.error
  );

  // Restore DB
  mockDb.user_roles = backupRoles;

  console.log('========================================================================================');
  console.log(`  HASIL AKHIR UJI IMPERSONASI DENGAN MOCK KODE ASLI (A1): ${passed}/${total} UJI LOLOS (${Math.round((passed / total) * 100)}%)       `);
  console.log('========================================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runImpersonationHardeningTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
