import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire(import.meta.url);

// 1. Mock server-only
const serverOnlyPath = require.resolve('server-only');
require.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  exports: {},
};

// 2. Mock next/headers
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

// 3. Mock next/cache
try {
  const nextCachePath = require.resolve('next/cache');
  require.cache[nextCachePath] = {
    id: nextCachePath,
    filename: nextCachePath,
    loaded: true,
    exports: {
      revalidatePath: () => {},
      revalidateTag: () => {},
    },
  };
} catch (e) {}

// 4. Mock status.ts: simulate DB offline
let isDbOnline = false;
const statusPath = require.resolve('../src/lib/supabase/status.ts');
require.cache[statusPath] = {
  id: statusPath,
  filename: statusPath,
  loaded: true,
  exports: {
    checkSupabaseOnline: async () => isDbOnline,
  },
};

async function runAuditFailClosedTests() {
  console.log('========================================================================================');
  console.log('  UJI AUDIT LOG: PENEGAKAN FAIL-CLOSED PRODUCTION SAAT DATABASE OFFLINE (A1)             ');
  console.log('========================================================================================\n');

  const { recordSystemAuditLog, HIGH_RISK_AUDIT_ACTIONS } = await import('../src/lib/audit.ts');
  const {
    impersonateUserAction,
    updateUserRoleAction,
    deleteUserAction,
  } = await import('../src/modules/identity/actions.ts');
  const { executeGradeChangeAction } = await import('../src/modules/academic/actions.ts');

  let passed = 0;
  let total = 0;

  const testAssert = (name, ok, detail) => {
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

  // -------------------------------------------------------------------
  // 1. UJI UNIT: recordSystemAuditLog() melempar AUDIT_LOG_WRITE_FAILED
  // -------------------------------------------------------------------
  console.log('--- 1. UJI UNIT recordSystemAuditLog: AKSI BERISIKO DI PRODUCTION SAAT OFFLINE ---');
  process.env.NODE_ENV = 'production';
  isDbOnline = false;

  const highRiskActions = [
    'auth.impersonate_start',
    'auth.impersonate_stop',
    'user.role_change',
    'user.delete',
    'user.anonymize',
    'grade.change_execute',
    'grade.change_executed',
    'academic.grade_execute',
  ];

  for (const act of highRiskActions) {
    let threw = false;
    let errCode = '';
    try {
      await recordSystemAuditLog({
        actorId: 'a0000010-0000-0000-0000-000000000010',
        actorName: 'Super Admin Utama',
        actorRole: 'SUPER_ADMIN',
        action: act,
        entityType: 'test_entity',
        entityId: 'a0000001-0000-0000-0000-000000000001',
        description: `Uji aksi berisiko ${act}`,
      });
    } catch (err) {
      threw = true;
      errCode = err.message;
    }
    testAssert(
      `A1 Unit: Aksi berisiko '${act}' di production offline wajib melempar AUDIT_LOG_WRITE_FAILED`,
      threw && errCode.includes('AUDIT_LOG_WRITE_FAILED'),
      threw ? errCode : 'TIDAK melempar galat (gagal-buka / silent pass)'
    );
  }

  // -------------------------------------------------------------------
  // 2. UJI KONTROL: Aksi non-berisiko di production & dev mode
  // -------------------------------------------------------------------
  console.log('--- 2. UJI KONTROL POSITIF/NEGATIF: AKSI NON-BERISIKO & DEV MODE ---');
  let lowRiskThrew = false;
  try {
    await recordSystemAuditLog({
      actorId: 'a0000001-0000-0000-0000-000000000001',
      actorName: 'Mahasiswa',
      actorRole: 'STUDENT',
      action: 'course.view',
      entityType: 'course',
      entityId: 'c0000001-0000-0000-0000-000000000001',
      description: 'Melihat materi mata kuliah',
    });
  } catch (err) {
    lowRiskThrew = true;
  }
  testAssert(
    'A1 Kontrol: Aksi biasa (non-berisiko) tidak melempar galat di production offline',
    !lowRiskThrew,
    'Selesai dengan aman tanpa melempar eksepsi'
  );

  // Dev mode
  process.env.NODE_ENV = 'development';
  let devThrew = false;
  try {
    await recordSystemAuditLog({
      actorId: 'a0000010-0000-0000-0000-000000000010',
      actorName: 'Super Admin',
      actorRole: 'SUPER_ADMIN',
      action: 'auth.impersonate_start',
      entityType: 'users',
      entityId: 'a0000001-0000-0000-0000-000000000001',
      description: 'Mulai impersonasi dev mode',
    });
  } catch (err) {
    devThrew = true;
  }
  testAssert(
    'A1 Kontrol: Mode development tetap mengizinkan audit in-memory tanpa lempar eksepsi',
    !devThrew,
    'In-memory fallback berfungsi normal untuk demonstrasi offline'
  );

  // -------------------------------------------------------------------
  // 3. UJI INTEGRASI KODE ASLI: SERVER ACTIONS MEMBATALKAN OPERASI
  // -------------------------------------------------------------------
  console.log('--- 3. UJI KODE ASLI SERVER ACTIONS: PEMBATALAN AKSI DI PRODUCTION SAAT OFFLINE ---');
  process.env.NODE_ENV = 'production';
  process.env.ALLOW_DEMO_AUTH = 'true';
  process.env.APP_SECRET = 'test-secret-min-32-chars-long-1234567890';
  isDbOnline = false;

  // Mock sesi login Super Admin
  const adminId = 'a0000010-0000-0000-0000-000000000010';
  const studentId = 'a0000001-0000-0000-0000-000000000001';
  const targetUserId = 'a0000002-0000-0000-0000-000000000002';

  // Seed cookie auth untuk Super Admin
  cookieStoreData.set('demo_session', adminId);
  cookieStoreData.set('active_role', 'SUPER_ADMIN');

  // 3a. impersonateUserAction
  const impRes = await impersonateUserAction(studentId, 'Investigasi nilai mahasiswa yang terkendala');
  testAssert(
    'A1 Kode Asli: impersonateUserAction membatalkan aksi saat audit gagal di production offline',
    !impRes.ok && impRes.error?.includes('AUDIT_LOG_WRITE_FAILED'),
    `ok: ${impRes.ok}, error: ${impRes.error}`
  );
  testAssert(
    'A1 Kode Asli: Cookie impersonation_token dihapus / dibatalkan saat audit gagal',
    !cookieStoreData.has('impersonation_token'),
    `Cookie token exists: ${cookieStoreData.has('impersonation_token')}`
  );

  // 3b. updateUserRoleAction
  const roleRes = await updateUserRoleAction({
    targetUserId: targetUserId,
    newRole: 'LECTURER',
  });
  testAssert(
    'A1 Kode Asli: updateUserRoleAction membatalkan aksi saat audit gagal di production offline',
    !roleRes.ok && roleRes.error?.includes('AUDIT_LOG_WRITE_FAILED'),
    `ok: ${roleRes.ok}, error: ${roleRes.error}`
  );

  // 3c. deleteUserAction
  const delRes = await deleteUserAction({
    targetUserId: targetUserId,
  });
  testAssert(
    'A1 Kode Asli: deleteUserAction membatalkan aksi saat audit gagal di production offline',
    !delRes.ok && delRes.error?.includes('AUDIT_LOG_WRITE_FAILED'),
    `ok: ${delRes.ok}, error: ${delRes.error}`
  );

  // 3d. executeGradeChangeAction
  cookieStoreData.set('demo_session', 'a0000005-0000-0000-0000-000000000005'); // Staf Akademik (Eko)
  cookieStoreData.set('active_role', 'ACADEMIC_STAFF');
  const memPerubahan = ((globalThis).__siajarUbah ??= []);
  const reqId = 'req-audit-fail-closed-verify';
  memPerubahan.push({
    id: reqId,
    submission_id: 'sub-demo-001',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    class_title: 'Pemrograman Web Lanjut',
    assignment_title: 'Tugas 1',
    student_name: 'Ahmad Mahasiswa',
    old_score: 80,
    proposed_score: 95,
    reason: 'Koreksi rubrik penilaian',
    status: 'APPROVED',
    requested_by: 'a0000002-0000-0000-0000-000000000002', // Dosen
    reviewed_by: 'a0000004-0000-0000-0000-000000000004',  // Kaprodi
  });

  const gradeExecRes = await executeGradeChangeAction({
    request_id: reqId,
    note: 'Eksekusi nilai produksi offline',
  });

  testAssert(
    'A1 Kode Asli: executeGradeChangeAction membatalkan aksi saat audit gagal di production offline',
    !gradeExecRes.ok && gradeExecRes.error?.includes('AUDIT_LOG_WRITE_FAILED'),
    `ok: ${gradeExecRes.ok}, error: ${gradeExecRes.error}`
  );

  const foundReq = memPerubahan.find((r) => r.id === reqId);
  testAssert(
    'A1 Kode Asli: Status permohonan nilai dibatalkan / dikembalikan ke APPROVED (rollback)',
    foundReq?.status === 'APPROVED' && foundReq?.executed_by === undefined,
    `status: ${foundReq?.status}, executed_by: ${foundReq?.executed_by}`
  );

  console.log('========================================================================================');
  console.log(`  HASIL AKHIR UJI A1 AUDIT FAIL-CLOSED: ${passed}/${total} UJI LOLOS (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runAuditFailClosedTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
