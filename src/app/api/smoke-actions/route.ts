import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  requestGradeChangeAction,
  decideGradeChangeAction,
  executeGradeChangeAction,
  createClassAction,
  joinClassAction,
} from '@/modules/academic/actions';
import {
  submitQuizAttemptAction,
  lecturerInterventionAction,
  resolveExamDisputeAction,
} from '@/modules/academic/quiz-actions';
import {
  submitLeavePermitAction,
  reviewLeavePermitAction,
} from '@/modules/academic/attendance-actions';
import {
  impersonateUserAction,
  stopImpersonatingAction,
  updateUserRoleAction,
  deleteUserAction,
  updateUserEmailAction,
  changePasswordAction,
} from '@/modules/identity/actions';
import { signImpersonationToken } from '@/modules/identity/impersonation-token';

export interface SmokeTestPair {
  id: string;
  actionName: string;
  scenario: string;
  negativeTest: {
    testedRole: string;
    userId: string;
    expectedResult: 'DITOLAK_SERVER';
    actualResult: 'DITOLAK_SERVER' | 'LOLOS_UNAUTHORIZED';
    status: 'PASS' | 'FAIL';
    rejectionReason: string;
  };
  positiveControl: {
    authorizedRole: string;
    userId: string;
    expectedResult: 'BERHASIL_SERVER';
    actualResult: 'BERHASIL_SERVER' | 'GAGAL_SERVER';
    status: 'PASS' | 'FAIL';
    detail: string;
  };
  overallStatus: 'PASS' | 'FAIL';
}

const USERS = {
  STUDENT: { id: 'a0000001-0000-0000-0000-000000000001', role: 'STUDENT' },
  LECTURER: { id: 'a0000002-0000-0000-0000-000000000002', role: 'LECTURER' },
  TA: { id: 'a0000003-0000-0000-0000-000000000003', role: 'TEACHING_ASSISTANT' },
  COORDINATOR: { id: 'a0000004-0000-0000-0000-000000000004', role: 'PROGRAM_COORDINATOR' },
  STAFF: { id: 'a0000005-0000-0000-0000-000000000005', role: 'ACADEMIC_STAFF' },
  SYSTEM_ADMIN: { id: 'a0000006-0000-0000-0000-000000000006', role: 'SYSTEM_ADMIN' },
  SUPER_ADMIN: { id: 'a0000010-0000-0000-0000-000000000010', role: 'SUPER_ADMIN' },
};

import { isDemoMode } from '@/lib/config/features';

export async function GET() {
  // C7: Di environment produksi, rute ini SELALU 404 tanpa melihat ALLOW_DEMO_AUTH atau flag apa pun
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Di non-produksi, wajib dalam mode demo aktif
  if (!isDemoMode()) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const cookieStore = cookies();
  const testPairs: SmokeTestPair[] = [];

  const setSession = (userId: string, role: string, isImpersonating = false) => {
    if (isImpersonating) {
      // Sesi nyata di server adalah Super Admin (A3a), target penyamaran adalah userId
      cookieStore.set('demo_session', USERS.SUPER_ADMIN.id);
      cookieStore.set('active_role', role);
      const signed = signImpersonationToken({
        originalAdminId: USERS.SUPER_ADMIN.id,
        originalAdminRole: 'SUPER_ADMIN',
        originalAdminName: 'Super Admin Asli',
        targetUserId: userId,
        reason: 'Pengujian impersonasi resmi keamanan sistem',
        startedAt: Date.now(),
        expiresAt: Date.now() + 1800 * 1000,
      });
      cookieStore.set('impersonation_token', signed);
      cookieStore.set('impersonating_from', USERS.SUPER_ADMIN.id);
      cookieStore.set('impersonating_expires_at', String(Date.now() + 1800 * 1000));
    } else {
      cookieStore.set('demo_session', userId);
      cookieStore.set('active_role', role);
      cookieStore.delete('impersonation_token');
      cookieStore.delete('impersonating_from');
      cookieStore.delete('impersonating_expires_at');
    }
  };

  const runPair = async (
    id: string,
    actionName: string,
    scenario: string,
    negConfig: { role: string; userId: string; isImpersonating?: boolean; fn: () => Promise<any> },
    posConfig: { role: string; userId: string; fn: () => Promise<any> }
  ) => {
    // 1. Eksekusi Uji Negatif (Unauthorized / Guarded)
    setSession(negConfig.userId, negConfig.role, !!negConfig.isImpersonating);
    let negRejected = false;
    let negReason = '';
    try {
      const res = await negConfig.fn();
      negRejected = !res || res.ok === false;
      negReason = res?.error || (negRejected ? 'Ditolak server dengan status ok: false' : 'LOLOS ILEGAL (Server tidak menolak)');
    } catch (err: any) {
      negRejected = true;
      negReason = `Exception: ${err.message}`;
    }

    // 2. Eksekusi Kontrol Positif (Authorized Role yang berwenang)
    // Reset state in-memory agar kontrol positif independen & idempotent
    if (actionName === 'decideGradeChangeAction') {
      const c = (globalThis as any).__siajarUbah?.find((x: any) => x.id === 'cr-demo-001');
      if (c) { c.status = 'PENDING'; c.review_note = null; }
    }
    if (actionName === 'executeGradeChangeAction') {
      const c = (globalThis as any).__siajarUbah?.find((x: any) => x.id === 'cr-demo-003');
      if (c) { c.status = 'APPROVED'; c.executed_at = null; c.executed_by = null; }
    }
    if (actionName === 'joinClassAction') {
      const akd = (globalThis as any).__siajarAkademik;
      if (akd && Array.isArray(akd.enrollments)) {
        akd.enrollments = akd.enrollments.filter((e: any) => !(e.student_id === posConfig.userId));
      }
    }
    if (actionName === 'submitQuizAttemptAction') {
      const kuisStore = (globalThis as any).__siajarKuis;
      if (kuisStore && Array.isArray(kuisStore.attempts)) {
        kuisStore.attempts = kuisStore.attempts.filter((a: any) => !(a.student_id === posConfig.userId));
      }
    }

    setSession(posConfig.userId, posConfig.role, false);
    let posSuccess = false;
    let posDetail = '';
    try {
      const res = await posConfig.fn();
      posSuccess = !!(res && res.ok !== false);
      posDetail = posSuccess ? 'Berhasil dieksekusi oleh role berwenang (Status: OK)' : `GAGAL KONTROL POSITIF: ${res?.error || 'Unknown error'}`;
    } catch (err: any) {
      posSuccess = false;
      posDetail = `Exception Kontrol Positif: ${err.message}`;
    }

    const pairPassed = negRejected && posSuccess;

    testPairs.push({
      id,
      actionName,
      scenario,
      negativeTest: {
        testedRole: negConfig.role + (negConfig.isImpersonating ? ' [IMPERSONATED]' : ''),
        userId: negConfig.userId,
        expectedResult: 'DITOLAK_SERVER',
        actualResult: negRejected ? 'DITOLAK_SERVER' : 'LOLOS_UNAUTHORIZED',
        status: negRejected ? 'PASS' : 'FAIL',
        rejectionReason: negReason,
      },
      positiveControl: {
        authorizedRole: posConfig.role,
        userId: posConfig.userId,
        expectedResult: 'BERHASIL_SERVER',
        actualResult: posSuccess ? 'BERHASIL_SERVER' : 'GAGAL_SERVER',
        status: posSuccess ? 'PASS' : 'FAIL',
        detail: posDetail,
      },
      overallStatus: pairPassed ? 'PASS' : 'FAIL',
    });
  };

  // =========================================================================
  // KELOMPOK 1: PRODI A VS PRODI B (CROSS-PRODI ISOLATION)
  // =========================================================================
  await runPair(
    'SEC-PRODI-01',
    'decideGradeChangeAction',
    'Kaprodi TI (Prodi A) mencoba memutuskan permohonan kelas SI (Prodi B)',
    {
      role: 'PROGRAM_COORDINATOR',
      userId: USERS.COORDINATOR.id,
      fn: () => decideGradeChangeAction({
        request_id: 'cr-demo-prodi-b', // Milik prodi SI (Prodi B)
        approve: true,
        note: 'Persetujuan lintas prodi oleh Kaprodi TI',
      }),
    },
    {
      role: 'PROGRAM_COORDINATOR',
      userId: USERS.COORDINATOR.id,
      fn: () => decideGradeChangeAction({
        request_id: 'cr-demo-001', // Milik prodi TI (Prodi A)
        approve: true,
        note: 'Persetujuan resmi sesuai kewenangan Kaprodi TI',
      }),
    }
  );

  // =========================================================================
  // KELOMPOK 2: ASISTEN KE AKSI DOSEN / KAPRODI / STAF
  // =========================================================================
  await runPair(
    'SEC-TA-01',
    'createClassAction',
    'Asisten Dosen mencoba membuat kelas perkuliahan baru (Wewenang Dosen)',
    {
      role: 'TEACHING_ASSISTANT',
      userId: USERS.TA.id,
      fn: () => createClassAction({
        title: 'Kelas Ilegal Buatan Asisten',
        section: 'TA-1',
      }),
    },
    {
      role: 'LECTURER',
      userId: USERS.LECTURER.id,
      fn: () => createClassAction({
        title: 'Pemrograman Web Lanjut Kontrol Positif',
        section: 'IF-3P',
      }),
    }
  );

  await runPair(
    'SEC-TA-02',
    'decideGradeChangeAction',
    'Asisten Dosen mencoba memutuskan permohonan nilai (Wewenang Kaprodi)',
    {
      role: 'TEACHING_ASSISTANT',
      userId: USERS.TA.id,
      fn: () => decideGradeChangeAction({
        request_id: 'cr-demo-001',
        approve: true,
        note: 'Persetujuan ilegal oleh Asisten Dosen',
      }),
    },
    {
      role: 'PROGRAM_COORDINATOR',
      userId: USERS.COORDINATOR.id,
      fn: () => decideGradeChangeAction({
        request_id: 'cr-demo-001',
        approve: false,
        note: 'Penolakan resmi sesuai kewenangan Kaprodi',
      }),
    }
  );

  await runPair(
    'SEC-TA-03',
    'executeGradeChangeAction',
    'Asisten Dosen mencoba mengeksekusi perubahan nilai ke DB (Wewenang Staf)',
    {
      role: 'TEACHING_ASSISTANT',
      userId: USERS.TA.id,
      fn: () => executeGradeChangeAction({
        request_id: 'cr-demo-003',
        note: 'Eksekusi nilai ilegal oleh Asisten',
      }),
    },
    {
      role: 'ACADEMIC_STAFF',
      userId: USERS.STAFF.id,
      fn: () => executeGradeChangeAction({
        request_id: 'cr-demo-003',
        note: 'Eksekusi nilai resmi oleh Biro Akademik',
      }),
    }
  );

  // =========================================================================
  // KELOMPOK 3: SYSTEM_ADMIN & SUPER_ADMIN KE AKSI AKADEMIK (TANPA IMPERSONATE)
  // =========================================================================
  await runPair(
    'SEC-SYS-01',
    'createClassAction',
    'SYSTEM_ADMIN mencoba membuat kelas perkuliahan (Aksi Dosen)',
    {
      role: 'SYSTEM_ADMIN',
      userId: USERS.SYSTEM_ADMIN.id,
      fn: () => createClassAction({
        title: 'Kelas Sistem Admin',
        section: 'SYS-1',
      }),
    },
    {
      role: 'LECTURER',
      userId: USERS.LECTURER.id,
      fn: () => createClassAction({
        title: 'Basis Data Cloud Kontrol Positif',
        section: 'IF-2K',
      }),
    }
  );

  await runPair(
    'SEC-SYS-02',
    'decideGradeChangeAction',
    'SYSTEM_ADMIN mencoba memutuskan permohonan nilai (Aksi Kaprodi)',
    {
      role: 'SYSTEM_ADMIN',
      userId: USERS.SYSTEM_ADMIN.id,
      fn: () => decideGradeChangeAction({
        request_id: 'cr-demo-001',
        approve: true,
        note: 'Intervensi nilai oleh System Administrator',
      }),
    },
    {
      role: 'PROGRAM_COORDINATOR',
      userId: USERS.COORDINATOR.id,
      fn: () => decideGradeChangeAction({
        request_id: 'cr-demo-001',
        approve: true,
        note: 'Persetujuan sah oleh Kaprodi Teknik Informatika',
      }),
    }
  );

  await runPair(
    'SEC-SYS-03',
    'executeGradeChangeAction',
    'SYSTEM_ADMIN mencoba mengeksekusi nilai ke master database (Aksi Staf)',
    {
      role: 'SYSTEM_ADMIN',
      userId: USERS.SYSTEM_ADMIN.id,
      fn: () => executeGradeChangeAction({
        request_id: 'cr-demo-003',
        note: 'Eksekusi administratif oleh SysAdmin',
      }),
    },
    {
      role: 'ACADEMIC_STAFF',
      userId: USERS.STAFF.id,
      fn: () => executeGradeChangeAction({
        request_id: 'cr-demo-003',
        note: 'Eksekusi sah oleh Staf Biro Administrasi Akademik',
      }),
    }
  );

  await runPair(
    'SEC-SYS-04',
    'joinClassAction',
    'SYSTEM_ADMIN mencoba bergabung ke kelas via kode kelas (Aksi Mahasiswa)',
    {
      role: 'SYSTEM_ADMIN',
      userId: USERS.SYSTEM_ADMIN.id,
      fn: () => joinClassAction('WEB2026A'),
    },
    {
      role: 'STUDENT',
      userId: USERS.STUDENT.id,
      fn: () => joinClassAction('WEB2026A'),
    }
  );

  await runPair(
    'SEC-SUPER-01',
    'createClassAction',
    'SUPER_ADMIN tanpa impersonasi mencoba membuat kelas (Aksi Dosen)',
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => createClassAction({
        title: 'Kelas Super Admin Langsung',
        section: 'SA-1',
      }),
    },
    {
      role: 'LECTURER',
      userId: USERS.LECTURER.id,
      fn: () => createClassAction({
        title: 'Jaringan Komputer Kontrol Positif',
        section: 'IF-3J',
      }),
    }
  );

  await runPair(
    'SEC-SUPER-02',
    'decideGradeChangeAction',
    'SUPER_ADMIN tanpa impersonasi mencoba memutuskan nilai (Aksi Kaprodi)',
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => decideGradeChangeAction({
        request_id: 'cr-demo-001',
        approve: true,
        note: 'Putusan langsung oleh Super Administrator',
      }),
    },
    {
      role: 'PROGRAM_COORDINATOR',
      userId: USERS.COORDINATOR.id,
      fn: () => decideGradeChangeAction({
        request_id: 'cr-demo-001',
        approve: true,
        note: 'Persetujuan sah oleh Koordinator Program Studi',
      }),
    }
  );

  await runPair(
    'SEC-SUPER-03',
    'executeGradeChangeAction',
    'SUPER_ADMIN tanpa impersonasi mencoba mengeksekusi nilai (Aksi Staf)',
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => executeGradeChangeAction({
        request_id: 'cr-demo-003',
        note: 'Eksekusi langsung oleh Super Administrator',
      }),
    },
    {
      role: 'ACADEMIC_STAFF',
      userId: USERS.STAFF.id,
      fn: () => executeGradeChangeAction({
        request_id: 'cr-demo-003',
        note: 'Eksekusi sah oleh Staf Biro Administrasi Akademik',
      }),
    }
  );

  await runPair(
    'SEC-SUPER-04',
    'joinClassAction',
    'SUPER_ADMIN tanpa impersonasi mencoba bergabung ke kelas (Aksi Mahasiswa)',
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => joinClassAction('WEB2026A'),
    },
    {
      role: 'STUDENT',
      userId: USERS.STUDENT.id,
      fn: () => joinClassAction('WEB2026A'),
    }
  );

  // =========================================================================
  // KELOMPOK 4: SEMUA LARANGAN A3c (SELAMA SESI IMPERSONASI AKTIF)
  // =========================================================================
  await runPair(
    'SEC-IMP-01',
    'changePasswordAction',
    'A3c: Dilarang mengubah kata sandi selama sesi impersonasi aktif',
    {
      role: 'STUDENT',
      userId: USERS.STUDENT.id,
      isImpersonating: true,
      fn: () => changePasswordAction({
        currentPassword: 'PasswordLama123!@#',
        newPassword: 'PasswordBaru123!@#',
        confirmPassword: 'PasswordBaru123!@#',
      }),
    },
    {
      role: 'STUDENT',
      userId: USERS.STUDENT.id,
      fn: () => changePasswordAction({
        currentPassword: 'PasswordLama123!@#',
        newPassword: 'PasswordValid999!@#',
        confirmPassword: 'PasswordValid999!@#',
      }),
    }
  );

  await runPair(
    'SEC-IMP-02',
    'updateUserEmailAction',
    'A3c: Dilarang mengubah email selama sesi impersonasi aktif',
    {
      role: 'STUDENT',
      userId: USERS.STUDENT.id,
      isImpersonating: true,
      fn: () => updateUserEmailAction('email.ilegal@mhs.utsn.ac.id'),
    },
    {
      role: 'STUDENT',
      userId: USERS.STUDENT.id,
      fn: () => updateUserEmailAction('ahmad.valid@mhs.utsn.ac.id'),
    }
  );

  await runPair(
    'SEC-IMP-03',
    'decideGradeChangeAction',
    'A3c: Dilarang memutuskan nilai selama sesi impersonasi aktif',
    {
      role: 'PROGRAM_COORDINATOR',
      userId: USERS.COORDINATOR.id,
      isImpersonating: true,
      fn: () => decideGradeChangeAction({
        request_id: 'cr-demo-001',
        approve: true,
        note: 'Putusan nilai saat sedang menyamar',
      }),
    },
    {
      role: 'PROGRAM_COORDINATOR',
      userId: USERS.COORDINATOR.id,
      fn: () => decideGradeChangeAction({
        request_id: 'cr-demo-001',
        approve: true,
        note: 'Persetujuan resmi non-impersonasi oleh Kaprodi',
      }),
    }
  );

  await runPair(
    'SEC-IMP-04',
    'executeGradeChangeAction',
    'A3c: Dilarang mengeksekusi nilai ke database selama sesi impersonasi aktif',
    {
      role: 'ACADEMIC_STAFF',
      userId: USERS.STAFF.id,
      isImpersonating: true,
      fn: () => executeGradeChangeAction({
        request_id: 'cr-demo-003',
        note: 'Eksekusi saat sedang menyamar',
      }),
    },
    {
      role: 'ACADEMIC_STAFF',
      userId: USERS.STAFF.id,
      fn: () => executeGradeChangeAction({
        request_id: 'cr-demo-003',
        note: 'Eksekusi resmi non-impersonasi oleh Staf Akademik',
      }),
    }
  );

  await runPair(
    'SEC-IMP-05',
    'submitQuizAttemptAction',
    'A3c: Dilarang mengirim jawaban atau menyelesaikan ujian saat impersonasi',
    {
      role: 'STUDENT',
      userId: USERS.STUDENT.id,
      isImpersonating: true,
      fn: () => submitQuizAttemptAction('exam-demo-001', { 'qb-001': 1 }),
    },
    {
      role: 'STUDENT',
      userId: USERS.STUDENT.id,
      fn: () => submitQuizAttemptAction('exam-demo-001', { 'qb-001': 1 }),
    }
  );

  await runPair(
    'SEC-IMP-06',
    'updateUserRoleAction',
    'A3c: Dilarang mengakses Kelola Pengguna & Role saat impersonasi',
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      isImpersonating: true,
      fn: () => updateUserRoleAction({
        targetUserId: USERS.STUDENT.id,
        newRole: 'LECTURER',
      }),
    },
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => updateUserRoleAction({
        targetUserId: USERS.STUDENT.id,
        newRole: 'STUDENT',
      }),
    }
  );

  await runPair(
    'SEC-IMP-07',
    'deleteUserAction',
    'A3c: Dilarang menghapus akun saat impersonasi',
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      isImpersonating: true,
      fn: () => deleteUserAction({ targetUserId: USERS.STUDENT.id }),
    },
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => deleteUserAction({ targetUserId: 'non-existent-user-to-test' }),
    }
  );

  await runPair(
    'SEC-IMP-08',
    'impersonateUserAction',
    'A3c: Dilarang melakukan impersonasi bertingkat (chaining)',
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      isImpersonating: true,
      fn: () => impersonateUserAction(USERS.LECTURER.id, 'Chaining impersonasi tingkat kedua'),
    },
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => impersonateUserAction(USERS.STUDENT.id, 'Investigasi kendala presensi mahasiswa valid'),
    }
  );

  // =========================================================================
  // KELOMPOK 5: KELOLA PENGGUNA (A5) & PROTOKOL IMPERSONASI (A3b)
  // =========================================================================
  await runPair(
    'SEC-USER-01',
    'updateUserRoleAction',
    'A5: Dosen mencoba mengubah peran pengguna (Non-Super Admin)',
    {
      role: 'LECTURER',
      userId: USERS.LECTURER.id,
      fn: () => updateUserRoleAction({
        targetUserId: USERS.STUDENT.id,
        newRole: 'LECTURER',
      }),
    },
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => updateUserRoleAction({
        targetUserId: USERS.STUDENT.id,
        newRole: 'STUDENT',
      }),
    }
  );

  await runPair(
    'SEC-USER-02',
    'updateUserRoleAction',
    'A5: System Administrator mencoba mengubah peran pengguna (Non-Super Admin)',
    {
      role: 'SYSTEM_ADMIN',
      userId: USERS.SYSTEM_ADMIN.id,
      fn: () => updateUserRoleAction({
        targetUserId: USERS.STUDENT.id,
        newRole: 'LECTURER',
      }),
    },
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => updateUserRoleAction({
        targetUserId: USERS.STUDENT.id,
        newRole: 'STUDENT',
      }),
    }
  );

  await runPair(
    'SEC-USER-03',
    'updateUserRoleAction',
    'A5: Super Admin mencoba menurunkan peran akunnya sendiri',
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => updateUserRoleAction({
        targetUserId: USERS.SUPER_ADMIN.id,
        newRole: 'STUDENT',
      }),
    },
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => updateUserRoleAction({
        targetUserId: USERS.STUDENT.id,
        newRole: 'STUDENT',
      }),
    }
  );

  await runPair(
    'SEC-USER-04',
    'deleteUserAction',
    'A5: Super Admin mencoba menghapus akunnya sendiri',
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => deleteUserAction({ targetUserId: USERS.SUPER_ADMIN.id }),
    },
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => deleteUserAction({ targetUserId: 'sample-user-99' }),
    }
  );

  await runPair(
    'SEC-USER-05',
    'impersonateUserAction',
    'A3b: Super Admin mencoba menyamar sebagai diri sendiri',
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => impersonateUserAction(USERS.SUPER_ADMIN.id, 'Alasan menyamar diri sendiri lebih dari 10 karakter'),
    },
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => impersonateUserAction(USERS.STUDENT.id, 'Alasan investigasi sah minimal 10 karakter'),
    }
  );

  await runPair(
    'SEC-USER-06',
    'impersonateUserAction',
    'A3b: Super Admin menyamar tanpa alasan minimal 10 karakter',
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => impersonateUserAction(USERS.STUDENT.id, 'pendek'),
    },
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => impersonateUserAction(USERS.STUDENT.id, 'Alasan investigasi sah minimal 10 karakter'),
    }
  );

  await runPair(
    'SEC-USER-07',
    'impersonateUserAction',
    'A3b: Super Admin mencoba menyamar sebagai sesama Super Admin',
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => impersonateUserAction('a0000009-0000-0000-0000-000000000009', 'Alasan investigasi sesama super admin panjang'),
    },
    {
      role: 'SUPER_ADMIN',
      userId: USERS.SUPER_ADMIN.id,
      fn: () => impersonateUserAction(USERS.STUDENT.id, 'Alasan investigasi mahasiswa sah 10 karakter'),
    }
  );

  // Bersihkan cookie di akhir pengujian
  cookieStore.delete('impersonation_token');
  cookieStore.delete('impersonating_from');
  cookieStore.delete('impersonating_expires_at');

  const total = testPairs.length;
  const passed = testPairs.filter((t) => t.overallStatus === 'PASS').length;
  const failed = total - passed;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    total,
    passed,
    failed,
    results: testPairs,
  });
}
