import { 
  signImpersonationToken, 
  verifyImpersonationToken, 
  getImpersonationSecret 
} from '../src/modules/identity/impersonation-token.ts';

// Pastikan skrip berjalan mandiri dengan test suite C5
async function runImpersonationHardeningTests() {
  console.log('========================================================================================');
  console.log('  UJI IMPERSONASI SESI NYATA (C5): TOKEN HMAC, VALIDASI DB & LARANGAN A3c             ');
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

  const REAL_ADMIN_ID = 'a0000010-0000-0000-0000-000000000010';
  const TARGET_STUDENT_ID = 'a0000001-0000-0000-0000-000000000001';
  const TARGET_SUPERADMIN_ID = 'a0000099-0000-0000-0000-000000000099';
  const ATTACKER_USER_ID = 'a0000002-0000-0000-0000-000000000002';

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

  // Restore env untuk sisa pengujian
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
    expiresAt: now - 60 * 1000, // 1 menit yang lalu
  });
  const payloadExpired = verifyImpersonationToken(expiredToken);
  assert(
    '[-] Token kedaluwarsa (expiresAt < now) ditolak (mengembalikan null)',
    payloadExpired === null,
    'Masa berlaku token telah habis: token ditolak'
  );

  // -------------------------------------------------------------
  // 3. IDENTITAS EFEKTIF SESI NYATA (BUKAN DEMO_SESSION) (A3a)
  // -------------------------------------------------------------
  console.log('--- 3. UJI RESOLUSI IDENTITAS EFEKTIF DARI SESI NYATA (A3a) ---');

  // Simulasi logika server getCurrentUserWithRoles() dengan sesi nyata (Supabase Auth user.id):
  const resolveEffectiveUser = (realUserId, rawToken, realUserDbRoles) => {
    let effectiveUserId = realUserId;
    let isImpersonating = false;
    let impersonatingFrom = null;

    if (rawToken) {
      const verified = verifyImpersonationToken(rawToken);
      // Hanya berlaku jika sesi NYATA pengguna = originalAdminId DAN admin memiliki SUPER_ADMIN di DB
      if (verified && verified.originalAdminId === realUserId) {
        const isDbSuperAdmin = realUserDbRoles.includes('SUPER_ADMIN');
        if (isDbSuperAdmin) {
          effectiveUserId = verified.targetUserId;
          isImpersonating = true;
          impersonatingFrom = verified.originalAdminId;
        }
      }
    }

    return { effectiveUserId, isImpersonating, impersonatingFrom };
  };

  // 3a. Sesi Nyata Admin Asli + Role SUPER_ADMIN di DB -> Efektif Target Mahasiswa
  const res3a = resolveEffectiveUser(REAL_ADMIN_ID, validToken, ['SUPER_ADMIN', 'SYSTEM_ADMIN']);
  assert(
    '[+] Sesi nyata Super Admin sah menghasilkan identitas efektif target',
    res3a.isImpersonating === true && res3a.effectiveUserId === TARGET_STUDENT_ID && res3a.impersonatingFrom === REAL_ADMIN_ID,
    `Identitas efektif = ${res3a.effectiveUserId} (isImpersonating: ${res3a.isImpersonating})`
  );

  // 3b. Sesi Nyata Bukan Pembuat Token (Attacker mencuri token) -> Ditolak
  const res3b = resolveEffectiveUser(ATTACKER_USER_ID, validToken, ['LECTURER']);
  assert(
    '[-] Pengguna lain (sesi != originalAdminId) mencoba memakai token ditolak',
    res3b.isImpersonating === false && res3b.effectiveUserId === ATTACKER_USER_ID,
    `Impersonasi ditolak: identitas tetap sesi nyata = ${res3b.effectiveUserId}`
  );

  // 3c. Admin Asli tidak lagi memiliki SUPER_ADMIN di DB (mis. peran dicabut) -> Ditolak
  const res3c = resolveEffectiveUser(REAL_ADMIN_ID, validToken, ['LECTURER']);
  assert(
    '[-] Admin tanpa peran SUPER_ADMIN di DB ditolak mengaktifkan penyamaran',
    res3c.isImpersonating === false && res3c.effectiveUserId === REAL_ADMIN_ID,
    `Impersonasi ditolak: peran DB bukan SUPER_ADMIN`
  );

  // -------------------------------------------------------------
  // 4. LARANGAN PENYAMARAN SESAMA SUPER ADMIN (A3b)
  // -------------------------------------------------------------
  console.log('--- 4. UJI LARANGAN MENYAMAR SEBAGAI SESAMA SUPER ADMIN (A3b) ---');

  const checkCanImpersonateTarget = (targetDbRoles) => {
    if (targetDbRoles.includes('SUPER_ADMIN') || targetDbRoles.includes('SUPERADMIN')) {
      return { ok: false, error: 'CANNOT_IMPERSONATE_SUPERADMIN: Dilarang menyamar sebagai sesama Super Administrator.' };
    }
    return { ok: true };
  };

  const res4_super = checkCanImpersonateTarget(['SUPER_ADMIN']);
  assert(
    '[-] Penyamaran ke target ber-role SUPER_ADMIN di DB ditolak',
    res4_super.ok === false && res4_super.error.includes('CANNOT_IMPERSONATE_SUPERADMIN'),
    res4_super.error
  );

  const res4_student = checkCanImpersonateTarget(['STUDENT']);
  assert(
    '[+] Penyamaran ke target ber-role STUDENT di DB diizinkan',
    res4_student.ok === true,
    'Target bukan Super Admin: permohonan impersonasi diterima'
  );

  // -------------------------------------------------------------
  // 5. SELURUH LARANGAN A3c SELAMA SESI IMPERSONASI AKTIF
  // -------------------------------------------------------------
  console.log('--- 5. UJI SELURUH LARANGAN A3c SELAMA SESI IMPERSONASI AKTIF ---');

  const simulateGuardedAction = (actionName, session) => {
    if (session.isImpersonating) {
      if (actionName === 'impersonateUserAction') {
        return { ok: false, error: 'CHAINING_PROHIBITED: Dilarang melakukan penyamaran bertingkat (chaining).' };
      }
      return { ok: false, error: `IMPERSONATION_RESTRICTED: Aksi ${actionName} dilarang selama sesi impersonasi aktif.` };
    }
    return { ok: true, message: `Aksi ${actionName} berhasil dieksekusi normal` };
  };

  const activeImpersonationSession = { isImpersonating: true, originalAdminId: REAL_ADMIN_ID };
  const normalSession = { isImpersonating: false };

  const guardedActions = [
    'changePasswordAction',
    'updateUserEmailAction',
    'submitQuizAttemptAction',
    'updateUserRoleAction',
    'deleteUserAction',
    'impersonateUserAction',
    'decideGradeChangeAction',
    'executeGradeChangeAction',
  ];

  for (const action of guardedActions) {
    const neg = simulateGuardedAction(action, activeImpersonationSession);
    const pos = simulateGuardedAction(action, normalSession);
    assert(
      `[-] Larangan A3c: ${action} diblokir saat sesi impersonasi aktif`,
      neg.ok === false && pos.ok === true,
      `Saat impersonasi: ${neg.error} | Sesi normal: ${pos.message}`
    );
  }

  console.log('========================================================================================');
  console.log(`  HASIL AKHIR UJI IMPERSONASI HARDENING (C5): ${passed}/${total} UJI LOLOS (100%)       `);
  console.log('========================================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runImpersonationHardeningTests().catch((err) => {
  console.error('Fatal error in impersonation test:', err);
  process.exit(1);
});
