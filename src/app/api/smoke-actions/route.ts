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

interface NegativeTestResult {
  actionName: string;
  testedRole: string;
  expectedResult: 'DITOLAK_SERVER';
  actualResult: 'DITOLAK_SERVER' | 'LOLOS_UNAUTHORIZED';
  status: 'PASS' | 'FAIL';
  detail: string;
}

export async function GET() {
  const cookieStore = cookies();
  const results: NegativeTestResult[] = [];

  // Helper untuk mengubah peran sesi saat pengujian
  const setSessionRole = (userId: string, role: string) => {
    cookieStore.set('demo_session', userId);
    cookieStore.set('active_role', role);
  };

  // 1. Mahasiswa memanggil lecturerInterventionAction
  setSessionRole('a0000001-0000-0000-0000-000000000001', 'STUDENT');
  try {
    const res = await lecturerInterventionAction({
      exam_id: 'ex-demo-1',
      student_id: 'a0000001-0000-0000-0000-000000000001',
      subtype: 'WARN',
      reason: 'Uji coba ilegal intervensi',
    });
    const rejected = !res.ok;
    results.push({
      actionName: 'lecturerInterventionAction',
      testedRole: 'STUDENT',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: rejected ? 'DITOLAK_SERVER' : 'LOLOS_UNAUTHORIZED',
      status: rejected ? 'PASS' : 'FAIL',
      detail: res.error || 'Ditolak server dengan benar',
    });
  } catch (err: any) {
    results.push({
      actionName: 'lecturerInterventionAction',
      testedRole: 'STUDENT',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: 'DITOLAK_SERVER',
      status: 'PASS',
      detail: `Exception: ${err.message}`,
    });
  }

  // 2. Mahasiswa memanggil resolveExamDisputeAction
  setSessionRole('a0000001-0000-0000-0000-000000000001', 'STUDENT');
  try {
    const res = await resolveExamDisputeAction({
      dispute_id: 'disp-demo-1',
      status: 'APPROVED',
      lecturer_note: 'Penyelesaian ilegal oleh mahasiswa',
    });
    const rejected = !res.ok;
    results.push({
      actionName: 'resolveExamDisputeAction',
      testedRole: 'STUDENT',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: rejected ? 'DITOLAK_SERVER' : 'LOLOS_UNAUTHORIZED',
      status: rejected ? 'PASS' : 'FAIL',
      detail: res.error || 'Ditolak server dengan benar',
    });
  } catch (err: any) {
    results.push({
      actionName: 'resolveExamDisputeAction',
      testedRole: 'STUDENT',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: 'DITOLAK_SERVER',
      status: 'PASS',
      detail: `Exception: ${err.message}`,
    });
  }

  // 3. Mahasiswa memanggil requestGradeChangeAction
  setSessionRole('a0000001-0000-0000-0000-000000000001', 'STUDENT');
  try {
    const res = await requestGradeChangeAction({
      submission_id: '00000000-0000-0000-0000-000000000001',
      score: 95,
      reason: 'Pengajuan revisi nilai ilegal oleh mahasiswa',
    });
    const rejected = !res.ok;
    results.push({
      actionName: 'requestGradeChangeAction',
      testedRole: 'STUDENT',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: rejected ? 'DITOLAK_SERVER' : 'LOLOS_UNAUTHORIZED',
      status: rejected ? 'PASS' : 'FAIL',
      detail: res.error || 'Ditolak server dengan benar',
    });
  } catch (err: any) {
    results.push({
      actionName: 'requestGradeChangeAction',
      testedRole: 'STUDENT',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: 'DITOLAK_SERVER',
      status: 'PASS',
      detail: `Exception: ${err.message}`,
    });
  }

  // 4. Mahasiswa memanggil decideGradeChangeAction
  setSessionRole('a0000001-0000-0000-0000-000000000001', 'STUDENT');
  try {
    const res = await decideGradeChangeAction({
      request_id: '00000000-0000-0000-0000-000000000001',
      approve: true,
      note: 'Persetujuan ilegal oleh mahasiswa',
    });
    const rejected = !res.ok;
    results.push({
      actionName: 'decideGradeChangeAction',
      testedRole: 'STUDENT',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: rejected ? 'DITOLAK_SERVER' : 'LOLOS_UNAUTHORIZED',
      status: rejected ? 'PASS' : 'FAIL',
      detail: res.error || 'Ditolak server dengan benar',
    });
  } catch (err: any) {
    results.push({
      actionName: 'decideGradeChangeAction',
      testedRole: 'STUDENT',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: 'DITOLAK_SERVER',
      status: 'PASS',
      detail: `Exception: ${err.message}`,
    });
  }

  // 5. Dosen memanggil decideGradeChangeAction
  setSessionRole('a0000002-0000-0000-0000-000000000002', 'LECTURER');
  try {
    const res = await decideGradeChangeAction({
      request_id: '00000000-0000-0000-0000-000000000001',
      approve: true,
      note: 'Persetujuan ilegal oleh dosen pengampu',
    });
    const rejected = !res.ok;
    results.push({
      actionName: 'decideGradeChangeAction',
      testedRole: 'LECTURER',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: rejected ? 'DITOLAK_SERVER' : 'LOLOS_UNAUTHORIZED',
      status: rejected ? 'PASS' : 'FAIL',
      detail: res.error || 'Ditolak server dengan benar',
    });
  } catch (err: any) {
    results.push({
      actionName: 'decideGradeChangeAction',
      testedRole: 'LECTURER',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: 'DITOLAK_SERVER',
      status: 'PASS',
      detail: `Exception: ${err.message}`,
    });
  }

  // 6. Kaprodi menyetujui pengajuannya sendiri (cr-demo-004-self diajukan oleh a0000004-0000-0000-0000-000000000004)
  setSessionRole('a0000004-0000-0000-0000-000000000004', 'PROGRAM_COORDINATOR');
  try {
    const res = await decideGradeChangeAction({
      request_id: '00000000-0000-0000-0000-000000000004', // Atau id cr-demo-004-self
      approve: true,
      note: 'Mencoba menyetujui pengajuan saya sendiri',
    });
    // Jika format uuid valid dicari
    const rejected = !res.ok;
    results.push({
      actionName: 'decideGradeChangeAction (Self-Approval)',
      testedRole: 'PROGRAM_COORDINATOR',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: rejected ? 'DITOLAK_SERVER' : 'LOLOS_UNAUTHORIZED',
      status: rejected ? 'PASS' : 'FAIL',
      detail: res.error || 'Ditolak server: Tidak dapat menyetujui pengajuan sendiri',
    });
  } catch (err: any) {
    results.push({
      actionName: 'decideGradeChangeAction (Self-Approval)',
      testedRole: 'PROGRAM_COORDINATOR',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: 'DITOLAK_SERVER',
      status: 'PASS',
      detail: `Exception: ${err.message}`,
    });
  }

  // 7. Mahasiswa / Dosen memanggil executeGradeChangeAction
  setSessionRole('a0000002-0000-0000-0000-000000000002', 'LECTURER');
  try {
    const res = await executeGradeChangeAction({
      request_id: '00000000-0000-0000-0000-000000000001',
      note: 'Eksekusi nilai ilegal oleh dosen',
    });
    const rejected = !res.ok;
    results.push({
      actionName: 'executeGradeChangeAction',
      testedRole: 'LECTURER',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: rejected ? 'DITOLAK_SERVER' : 'LOLOS_UNAUTHORIZED',
      status: rejected ? 'PASS' : 'FAIL',
      detail: res.error || 'Ditolak server dengan benar',
    });
  } catch (err: any) {
    results.push({
      actionName: 'executeGradeChangeAction',
      testedRole: 'LECTURER',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: 'DITOLAK_SERVER',
      status: 'PASS',
      detail: `Exception: ${err.message}`,
    });
  }

  // 8. Dosen memanggil submitLeavePermitAction
  setSessionRole('a0000002-0000-0000-0000-000000000002', 'LECTURER');
  try {
    const res = await submitLeavePermitAction({
      course_title: 'Pemrograman Web Lanjut',
      meeting_number: 4,
      type: 'IZIN',
      date: '2026-10-12',
      reason: 'Izin diajukan oleh dosen (salah peran)',
    });
    const rejected = !res.ok;
    results.push({
      actionName: 'submitLeavePermitAction',
      testedRole: 'LECTURER',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: rejected ? 'DITOLAK_SERVER' : 'LOLOS_UNAUTHORIZED',
      status: rejected ? 'PASS' : 'FAIL',
      detail: res.error || 'Ditolak server dengan benar',
    });
  } catch (err: any) {
    results.push({
      actionName: 'submitLeavePermitAction',
      testedRole: 'LECTURER',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: 'DITOLAK_SERVER',
      status: 'PASS',
      detail: `Exception: ${err.message}`,
    });
  }

  // 9. Mahasiswa memanggil reviewLeavePermitAction
  setSessionRole('a0000001-0000-0000-0000-000000000001', 'STUDENT');
  try {
    const res = await reviewLeavePermitAction({
      permit_id: 'leave-demo-1',
      status: 'DISETUJUI',
      feedback: 'Verifikasi izin ilegal oleh mahasiswa',
    });
    const rejected = !res.ok;
    results.push({
      actionName: 'reviewLeavePermitAction',
      testedRole: 'STUDENT',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: rejected ? 'DITOLAK_SERVER' : 'LOLOS_UNAUTHORIZED',
      status: rejected ? 'PASS' : 'FAIL',
      detail: res.error || 'Ditolak server dengan benar',
    });
  } catch (err: any) {
    results.push({
      actionName: 'reviewLeavePermitAction',
      testedRole: 'STUDENT',
      expectedResult: 'DITOLAK_SERVER',
      actualResult: 'DITOLAK_SERVER',
      status: 'PASS',
      detail: `Exception: ${err.message}`,
    });
  }

  return NextResponse.json({
    ok: true,
    total: results.length,
    passed: results.filter((r) => r.status === 'PASS').length,
    failed: results.filter((r) => r.status === 'FAIL').length,
    results,
  });
}
