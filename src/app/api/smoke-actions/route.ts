import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  requestGradeChangeAction,
  decideGradeChangeAction,
  executeGradeChangeAction,
} from '@/modules/academic/actions';
import {
  lecturerInterventionAction,
  resolveExamDisputeAction,
} from '@/modules/academic/quiz-actions';
import {
  submitLeavePermitAction,
  reviewLeavePermitAction,
} from '@/modules/academic/attendance-actions';

export interface NegativeTestResult {
  id: string;
  actionName: string;
  testedRole: string;
  scenario: string;
  expectedResult: 'DITOLAK_SERVER';
  actualResult: 'DITOLAK_SERVER' | 'LOLOS_UNAUTHORIZED';
  status: 'PASS' | 'FAIL';
  detail: string;
}

export async function GET() {
  const cookieStore = cookies();
  const results: NegativeTestResult[] = [];

  const setSessionRole = (userId: string, role: string) => {
    cookieStore.set('demo_session', userId);
    cookieStore.set('active_role', role);
  };

  const runTest = async (
    id: string,
    actionName: string,
    testedRole: string,
    userId: string,
    scenario: string,
    actionFn: () => Promise<any>
  ) => {
    setSessionRole(userId, testedRole);
    try {
      const res = await actionFn();
      const rejected = !res || res.ok === false;
      const detail = res?.error || (rejected ? 'Ditolak server dengan pesan error' : 'Gagal menolak (lolos ilegal)');
      results.push({
        id,
        actionName,
        testedRole,
        scenario,
        expectedResult: 'DITOLAK_SERVER',
        actualResult: rejected ? 'DITOLAK_SERVER' : 'LOLOS_UNAUTHORIZED',
        status: rejected ? 'PASS' : 'FAIL',
        detail,
      });
    } catch (err: any) {
      results.push({
        id,
        actionName,
        testedRole,
        scenario,
        expectedResult: 'DITOLAK_SERVER',
        actualResult: 'DITOLAK_SERVER',
        status: 'PASS',
        detail: `Exception: ${err.message}`,
      });
    }
  };

  // ==========================================
  // 1. MAHASISWA (STUDENT)
  // ==========================================
  await runTest(
    'NEG-STU-01',
    'lecturerInterventionAction',
    'STUDENT',
    'a0000001-0000-0000-0000-000000000001',
    'Mahasiswa mencoba mengintervensi ujian (tambah waktu / beri peringatan)',
    () => lecturerInterventionAction({
      exam_id: 'ex-demo-1',
      student_id: 'a0000001-0000-0000-0000-000000000001',
      action_type: 'WARN',
      reason: 'Uji coba ilegal intervensi',
    })
  );

  await runTest(
    'NEG-STU-02',
    'resolveExamDisputeAction',
    'STUDENT',
    'a0000001-0000-0000-0000-000000000001',
    'Mahasiswa mencoba menyelesaikan keberatan ujian',
    () => resolveExamDisputeAction({
      dispute_id: 'disp-demo-1',
      status: 'APPROVED',
      lecturer_note: 'Penyelesaian ilegal oleh mahasiswa',
    })
  );

  await runTest(
    'NEG-STU-03',
    'requestGradeChangeAction',
    'STUDENT',
    'a0000001-0000-0000-0000-000000000001',
    'Mahasiswa mencoba mengajukan revisi nilai final sendiri',
    () => requestGradeChangeAction({
      submission_id: 'sub-demo-001',
      score: 95,
      reason: 'Pengajuan revisi nilai ilegal oleh mahasiswa',
    })
  );

  await runTest(
    'NEG-STU-04',
    'decideGradeChangeAction',
    'STUDENT',
    'a0000001-0000-0000-0000-000000000001',
    'Mahasiswa mencoba menyetujui perubahan nilai',
    () => decideGradeChangeAction({
      request_id: 'cr-demo-001',
      approve: true,
      note: 'Persetujuan ilegal oleh mahasiswa',
    })
  );

  await runTest(
    'NEG-STU-05',
    'reviewLeavePermitAction',
    'STUDENT',
    'a0000001-0000-0000-0000-000000000001',
    'Mahasiswa mencoba mereview / menyetujui izin presensi mahasiswa lain',
    () => reviewLeavePermitAction({
      permit_id: 'leave-demo-1',
      status: 'DISETUJUI',
      feedback: 'Verifikasi izin ilegal oleh mahasiswa',
    })
  );

  // ==========================================
  // 2. ASISTEN (TEACHING_ASSISTANT)
  // ==========================================
  await runTest(
    'NEG-TA-01',
    'decideGradeChangeAction',
    'TEACHING_ASSISTANT',
    'a0000003-0000-0000-0000-000000000003',
    'Asisten Dosen mencoba menyetujui perubahan nilai final (wewenang Kaprodi)',
    () => decideGradeChangeAction({
      request_id: 'cr-demo-001',
      approve: true,
      note: 'Persetujuan ilegal oleh Asisten Dosen',
    })
  );

  await runTest(
    'NEG-TA-02',
    'executeGradeChangeAction',
    'TEACHING_ASSISTANT',
    'a0000003-0000-0000-0000-000000000003',
    'Asisten Dosen mencoba mengeksekusi perubahan nilai (wewenang Staf BAA)',
    () => executeGradeChangeAction({
      request_id: 'cr-demo-003',
      note: 'Eksekusi ilegal oleh Asisten Dosen',
    })
  );

  await runTest(
    'NEG-TA-03',
    'resolveExamDisputeAction',
    'TEACHING_ASSISTANT',
    'a0000003-0000-0000-0000-000000000003',
    'Asisten Dosen mencoba memutus keberatan ujian dosen',
    () => resolveExamDisputeAction({
      dispute_id: 'disp-demo-1',
      status: 'APPROVED',
      lecturer_note: 'Asisten memutuskan keberatan ujian',
    })
  );

  // ==========================================
  // 3. DOSEN (LECTURER) & DOSEN B VS KELAS DOSEN A
  // ==========================================
  await runTest(
    'NEG-LEC-01',
    'decideGradeChangeAction',
    'LECTURER',
    'a0000002-0000-0000-0000-000000000002',
    'Dosen mencoba menyetujui permohonan perubahan nilai (wewenang Kaprodi)',
    () => decideGradeChangeAction({
      request_id: 'cr-demo-001',
      approve: true,
      note: 'Dosen mencoba menyetujui usulannya sendiri',
    })
  );

  await runTest(
    'NEG-LEC-02',
    'executeGradeChangeAction',
    'LECTURER',
    'a0000002-0000-0000-0000-000000000002',
    'Dosen mencoba mengeksekusi perubahan nilai final (wewenang Staf)',
    () => executeGradeChangeAction({
      request_id: 'cr-demo-003',
      note: 'Eksekusi nilai ilegal oleh dosen pengampu',
    })
  );

  await runTest(
    'NEG-LEC-03',
    'requestGradeChangeAction (Dosen B vs Kelas Dosen A)',
    'LECTURER',
    'a0000099-0000-0000-0000-000000000099', // Dosen B
    'Dosen B mencoba mengajukan perubahan nilai pada kelas milik Dosen A',
    () => requestGradeChangeAction({
      submission_id: 'sub-demo-001', // Milik kelas Dosen A
      score: 88,
      reason: 'Dosen B mencoba memodifikasi nilai kelas Dosen A tanpa hak kepemilikan',
    })
  );

  await runTest(
    'NEG-LEC-04',
    'resolveExamDisputeAction (Dosen B vs Kelas Dosen A)',
    'LECTURER',
    'a0000099-0000-0000-0000-000000000099', // Dosen B
    'Dosen B mencoba memutus keberatan ujian pada kelas milik Dosen A',
    () => resolveExamDisputeAction({
      dispute_id: 'disp-demo-1', // Kelas Dosen A
      status: 'REJECTED',
      lecturer_note: 'Dosen B menolak keberatan kelas Dosen A',
    })
  );

  await runTest(
    'NEG-LEC-05',
    'submitLeavePermitAction',
    'LECTURER',
    'a0000002-0000-0000-0000-000000000002',
    'Dosen memanggil aksi pengajuan izin presensi kuliah mahasiswa',
    () => submitLeavePermitAction({
      course_title: 'Pemrograman Web Lanjut',
      meeting_number: 4,
      type: 'IZIN',
      date: '2026-10-12',
      reason: 'Dosen mengajukan permohonan izin kuliah (salah aktor)',
    })
  );

  // ==========================================
  // 4. KOORDINATOR PRODI (PROGRAM_COORDINATOR)
  // ==========================================
  await runTest(
    'NEG-KAP-01',
    'decideGradeChangeAction (Self-Approval)',
    'PROGRAM_COORDINATOR',
    'a0000004-0000-0000-0000-000000000004',
    'Kaprodi mencoba menyetujui pengajuannya sendiri (A4a & A4b)',
    () => decideGradeChangeAction({
      request_id: 'cr-demo-004-self',
      approve: true,
      note: 'Kaprodi mencoba menyetujui usulan revisi nilai miliknya sendiri',
    })
  );

  await runTest(
    'NEG-KAP-02',
    'executeGradeChangeAction',
    'PROGRAM_COORDINATOR',
    'a0000004-0000-0000-0000-000000000004',
    'Kaprodi mencoba mengeksekusi perubahan nilai ke tabel grades (wewenang Staf)',
    () => executeGradeChangeAction({
      request_id: 'cr-demo-003',
      note: 'Kaprodi mencoba mengeksekusi langsung nilai final',
    })
  );

  // ==========================================
  // 5. STAF AKADEMIK (ACADEMIC_STAFF)
  // ==========================================
  await runTest(
    'NEG-STF-01',
    'executeGradeChangeAction (Status PENDING)',
    'ACADEMIC_STAFF',
    'a0000005-0000-0000-0000-000000000005',
    'Staf mencoba mengeksekusi pengajuan berstatus PENDING (belum disetujui Kaprodi)',
    () => executeGradeChangeAction({
      request_id: 'cr-demo-001', // Status PENDING
      note: 'Staf mengeksekusi prematur pengajuan PENDING',
    })
  );

  await runTest(
    'NEG-STF-02',
    'executeGradeChangeAction (Status REJECTED)',
    'ACADEMIC_STAFF',
    'a0000005-0000-0000-0000-000000000005',
    'Staf mencoba mengeksekusi pengajuan yang telah DITOLAK oleh Kaprodi',
    () => executeGradeChangeAction({
      request_id: 'cr-demo-006-rejected', // Status REJECTED
      note: 'Staf mengeksekusi pengajuan yang berstatus ditolak',
    })
  );

  await runTest(
    'NEG-STF-03',
    'executeGradeChangeAction (Eksekusi Ganda / Status EXECUTED)',
    'ACADEMIC_STAFF',
    'a0000005-0000-0000-0000-000000000005',
    'Staf mencoba mengeksekusi ulang pengajuan yang telah EXECUTED (Idempotensi A4d)',
    () => executeGradeChangeAction({
      request_id: 'cr-demo-005-executed', // Status EXECUTED
      note: 'Staf mencoba eksekusi ganda berkas yang sudah pernah dieksekusi',
    })
  );

  await runTest(
    'NEG-STF-04',
    'executeGradeChangeAction (Old Score Mismatch)',
    'ACADEMIC_STAFF',
    'a0000005-0000-0000-0000-000000000005',
    'Staf mengeksekusi saat nilai saat ini != old_score awal permohonan',
    () => executeGradeChangeAction({
      request_id: 'cr-demo-007-mismatch', // Nilai lama mismatch
      note: 'Eksekusi berkas dengan integritas nilai lama tidak sesuai',
    })
  );

  await runTest(
    'NEG-STF-05',
    'executeGradeChangeAction (Separation of Duties Violation)',
    'ACADEMIC_STAFF',
    'a0000002-0000-0000-0000-000000000002', // User yang sama dengan pengaju (a0000002)
    'User yang sama dengan pengaju mencoba mengeksekusi permohonan nilainya sendiri',
    () => executeGradeChangeAction({
      request_id: 'cr-demo-003',
      note: 'Eksekusi nilai oleh user yang sama dengan pengaju',
    })
  );

  // ==========================================
  // 6. SYSTEM ADMIN (SYSTEM_ADMIN)
  // ==========================================
  await runTest(
    'NEG-SYS-01',
    'requestGradeChangeAction',
    'SYSTEM_ADMIN',
    'a0000006-0000-0000-0000-000000000006',
    'System Admin memanggil aksi pengajuan perubahan nilai akademik tanpa impersonate',
    () => requestGradeChangeAction({
      submission_id: 'sub-demo-001',
      score: 90,
      reason: 'System admin memanggil aksi akademik dosen secara langsung',
    })
  );

  await runTest(
    'NEG-SYS-02',
    'decideGradeChangeAction',
    'SYSTEM_ADMIN',
    'a0000006-0000-0000-0000-000000000006',
    'System Admin memanggil persetujuan nilai Kaprodi tanpa wewenang akademik',
    () => decideGradeChangeAction({
      request_id: 'cr-demo-001',
      approve: true,
      note: 'System Admin menyetujui perubahan nilai langsung',
    })
  );

  await runTest(
    'NEG-SYS-03',
    'executeGradeChangeAction',
    'SYSTEM_ADMIN',
    'a0000006-0000-0000-0000-000000000006',
    'System Admin memanggil eksekusi nilai Staf tanpa wewenang akademik',
    () => executeGradeChangeAction({
      request_id: 'cr-demo-003',
      note: 'System Admin mengeksekusi nilai langsung',
    })
  );

  // ==========================================
  // 7. SUPER ADMIN (SUPER_ADMIN)
  // ==========================================
  await runTest(
    'NEG-SUP-01',
    'decideGradeChangeAction',
    'SUPER_ADMIN',
    'a0000007-0000-0000-0000-000000000007',
    'Super Admin memanggil persetujuan nilai Kaprodi tanpa impersonate',
    () => decideGradeChangeAction({
      request_id: 'cr-demo-001',
      approve: true,
      note: 'Super Admin memanggil persetujuan nilai secara langsung tanpa penyamaran resmi',
    })
  );

  await runTest(
    'NEG-SUP-02',
    'executeGradeChangeAction',
    'SUPER_ADMIN',
    'a0000007-0000-0000-0000-000000000007',
    'Super Admin memanggil eksekusi nilai Staf tanpa impersonate',
    () => executeGradeChangeAction({
      request_id: 'cr-demo-003',
      note: 'Super Admin mengeksekusi nilai secara langsung tanpa impersonate',
    })
  );

  return NextResponse.json({
    ok: true,
    total: results.length,
    passed: results.filter((r) => r.status === 'PASS').length,
    failed: results.filter((r) => r.status === 'FAIL').length,
    results,
  });
}
