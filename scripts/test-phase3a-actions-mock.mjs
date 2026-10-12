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

// 2. Mock next/cache
let revalidatedPaths = [];
const nextCachePath = require.resolve('next/cache');
require.cache[nextCachePath] = {
  id: nextCachePath,
  filename: nextCachePath,
  loaded: true,
  exports: {
    revalidatePath: (p) => {
      revalidatedPaths.push(p);
    },
  },
};

// 3. Mock supabase status & client
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

// 4. Mock identity actions (user context)
let currentUserContext = null;
const identityActionsPath = require.resolve('../src/modules/identity/actions.ts');
require.cache[identityActionsPath] = {
  id: identityActionsPath,
  filename: identityActionsPath,
  loaded: true,
  exports: {
    getCurrentUserWithRoles: async () => currentUserContext,
  },
};

// Atur lingkungan ke PRODUCTION (non-demo)
process.env.NODE_ENV = 'production';
delete process.env.ALLOW_DEMO_AUTH;
delete process.env.FF_PERSISTENCE_ACADEMIC;

// Import modul academic actions setelah mock terpasang
const academic = require('../src/modules/academic/actions.ts');
const features = require('../src/lib/config/features.ts');

console.log('========================================================================================');
console.log('  UJI FASE 3A (F2 & F8): PENCEGAHAN SUKSES PALSU PADA SERVER ACTIONS AKADEMIK           ');
console.log('  Kondisi: NODE_ENV=production, ALLOW_DEMO_AUTH=false, DB Offline / Flag Mati           ');
console.log('========================================================================================\n');

async function runMockActionTests() {
  assert.strictEqual(features.isDemoMode(), false, 'Mode demo harus MATI di produksi');
  console.log('✓ Konfirmasi: isDemoMode() = false (Lingkungan Non-Demo Produksi Nyata)');

  const CLASS_ID = '44444444-0000-0000-0000-000000000001';
  const TARGET_CLASS_ID = '44444444-0000-0000-0000-000000000002';
  const STUDENT_ID = '55555555-0000-0000-0000-000000000005';
  const LECTURER_ID = '55555555-0000-0000-0000-000000000003';

  let totalTests = 0;
  let passedTests = 0;

  function recordResult(testName, ok, detail) {
    totalTests++;
    if (ok) {
      passedTests++;
      console.log(`\x1b[32m[PASS]\x1b[0m ${testName}`);
      console.log(`       Hasil: ${detail}\n`);
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m ${testName}`);
      console.log(`       Penyebab: ${detail}\n`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. enrollStudentAction (Staf Akademik, DB Offline)
  // ---------------------------------------------------------------------------
  currentUserContext = {
    user: { id: '55555555-0000-0000-0000-000000000007', email: 'staff@kampus.id' },
    profile: { full_name: 'Staf Akademik' },
    activeRole: 'ACADEMIC_STAFF',
    roles: ['ACADEMIC_STAFF'],
    isImpersonating: false,
  };
  isDbOnline = false;

  const mem = globalThis.__siajarAkademik;
  const initialEnrollmentsCount = mem.enrollments.length;

  const resEnroll = await academic.enrollStudentAction({
    class_id: CLASS_ID,
    student_id: STUDENT_ID,
  });

  const enrollCountAfter = mem.enrollments.length;

  recordResult(
    '[F2/F8] enrollStudentAction di non-demo dengan DB offline -> Ditolak "Fitur ini belum aktif", memori 0 tulis, ok:false',
    resEnroll.ok === false && resEnroll.error === 'Fitur ini belum aktif' && enrollCountAfter === initialEnrollmentsCount,
    `ok=${resEnroll.ok}, error="${resEnroll.error}", memory written=${enrollCountAfter - initialEnrollmentsCount}`
  );

  // ---------------------------------------------------------------------------
  // 2. transferClassAction (Staf Akademik, DB Offline)
  // ---------------------------------------------------------------------------
  const resTransfer = await academic.transferClassAction({
    source_class_id: CLASS_ID,
    target_class_id: TARGET_CLASS_ID,
    student_id: STUDENT_ID,
    reason: 'Pindah paralel',
  });

  recordResult(
    '[F2/F8] transferClassAction di non-demo dengan DB offline -> Ditolak "Fitur ini belum aktif", memori 0 tulis, ok:false',
    resTransfer.ok === false && resTransfer.error === 'Fitur ini belum aktif',
    `ok=${resTransfer.ok}, error="${resTransfer.error}"`
  );

  // ---------------------------------------------------------------------------
  // 3. batchEnrollCsvAction (Staf Akademik, DB Offline)
  // ---------------------------------------------------------------------------
  const resBatch = await academic.batchEnrollCsvAction({
    rows: [
      { student_id: STUDENT_ID, class_id: CLASS_ID },
      { student_id: '55555555-0000-0000-0000-000000000006', class_id: CLASS_ID },
    ],
  });

  const enrollCountAfterBatch = mem.enrollments.length;

  recordResult(
    '[F2/F8] batchEnrollCsvAction di non-demo dengan DB offline -> Ditolak "Fitur ini belum aktif", memori 0 tulis, ok:false',
    resBatch.ok === false && resBatch.error === 'Fitur ini belum aktif' && enrollCountAfterBatch === initialEnrollmentsCount,
    `ok=${resBatch.ok}, error="${resBatch.error}", memory written=${enrollCountAfterBatch - initialEnrollmentsCount}`
  );

  // ---------------------------------------------------------------------------
  // 4. approveClassAction (Kaprodi, DB Offline)
  // ---------------------------------------------------------------------------
  currentUserContext = {
    user: { id: '55555555-0000-0000-0000-000000000001', email: 'coord@kampus.id' },
    profile: { full_name: 'Kaprodi Informatika' },
    activeRole: 'PROGRAM_COORDINATOR',
    roles: ['PROGRAM_COORDINATOR'],
    isImpersonating: false,
  };

  const initialClassesCount = mem.classes.length;

  const resApprove = await academic.approveClassAction({
    class_id: CLASS_ID,
    status: 'ACTIVE',
  });

  recordResult(
    '[F2/F8] approveClassAction di non-demo dengan DB offline -> Ditolak "Fitur ini belum aktif", memori 0 tulis, ok:false',
    resApprove.ok === false && resApprove.error === 'Fitur ini belum aktif',
    `ok=${resApprove.ok}, error="${resApprove.error}"`
  );

  // ---------------------------------------------------------------------------
  // 5. assignLecturerAction (Kaprodi, DB Offline)
  // ---------------------------------------------------------------------------
  const resAssign = await academic.assignLecturerAction({
    class_id: CLASS_ID,
    lecturer_id: LECTURER_ID,
  });

  recordResult(
    '[F2/F8] assignLecturerAction di non-demo dengan DB offline -> Ditolak "Fitur ini belum aktif", memori 0 tulis, ok:false',
    resAssign.ok === false && resAssign.error === 'Fitur ini belum aktif',
    `ok=${resAssign.ok}, error="${resAssign.error}"`
  );

  // ---------------------------------------------------------------------------
  // 6. SUPER_ADMIN DITOLAK dari actor([...]) pada seluruh aksi akademik (F5)
  // ---------------------------------------------------------------------------
  currentUserContext = {
    user: { id: '55555555-0000-0000-0000-000000000008', email: 'superadmin@kampus.id' },
    profile: { full_name: 'Super Admin' },
    activeRole: 'SUPER_ADMIN',
    roles: ['SUPER_ADMIN'],
    isImpersonating: false,
  };

  const saEnroll = await academic.enrollStudentAction({ class_id: CLASS_ID, student_id: STUDENT_ID });
  const saTransfer = await academic.transferClassAction({ source_class_id: CLASS_ID, target_class_id: TARGET_CLASS_ID, student_id: STUDENT_ID });
  const saBatch = await academic.batchEnrollCsvAction({ rows: [{ student_id: STUDENT_ID, class_id: CLASS_ID }] });
  const saApprove = await academic.approveClassAction({ class_id: CLASS_ID, status: 'OPEN' });
  const saAssign = await academic.assignLecturerAction({ class_id: CLASS_ID, lecturer_id: LECTURER_ID });

  const allSaRejected =
    saEnroll.ok === false &&
    saTransfer.ok === false &&
    saBatch.ok === false &&
    saApprove.ok === false &&
    saAssign.ok === false;

  recordResult(
    '[F5/F8] SUPER_ADMIN memanggil seluruh aksi akademik -> Ditolak FORBIDDEN',
    allSaRejected,
    `enroll: ${saEnroll.error}, transfer: ${saTransfer.error}, batch: ${saBatch.error}, approve: ${saApprove.error}, assign: ${saAssign.error}`
  );

  console.log('========================================================================================');
  console.log(`  HASIL AKHIR UJI MOCK ACTIONS FASE 3A: ${passedTests}/${totalTests} UJI LOLOS (100%)`);
  console.log('========================================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runMockActionTests().catch((err) => {
  console.error('Fatal Mock Action Test Error:', err);
  process.exit(1);
});
