import React from 'react';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getAllAttemptsAction, getAllQuizzesAction } from '@/modules/academic/quiz-actions';
import { GradesHubView, type CourseGrade } from '@/modules/academic/grades-hub-view';
import { deterministicUuid } from '@/lib/akademik/deterministic-uuid';
import { redirect } from 'next/navigation';
import { isDemoMode } from '@/lib/config/features';

const DEMO_GRADES: CourseGrade[] = [
  {
    classId: 'c0000000-0000-0000-0000-000000000001',
    code: 'STI2544138',
    name: 'Pemrograman Web & Arsitektur Cloud',
    sks: 3,
    attendancePercent: 92,
    assignmentsScore: 88,
    quizScore: 90,
    midtermScore: 85,
    finalScore: 87,
    scoreNumber: 87.2,
    gradeLetter: 'A',
    gradePoint: 4.0,
    status: 'LULUS',
  },
  {
    classId: 'c0000000-0000-0000-0000-000000000002',
    code: 'STI2543131',
    name: 'Algoritma & Struktur Data Lanjut',
    sks: 3,
    attendancePercent: 88,
    assignmentsScore: 82,
    quizScore: 78,
    midtermScore: 84,
    finalScore: 80,
    scoreNumber: 81.5,
    gradeLetter: 'A-',
    gradePoint: 3.7,
    status: 'LULUS',
  },
  {
    classId: 'c0000000-0000-0000-0000-000000000003',
    code: 'STI2541114',
    name: 'Basis Data Terdistribusi & Big Data',
    sks: 3,
    attendancePercent: 85,
    assignmentsScore: 76,
    quizScore: 75,
    midtermScore: 78,
    finalScore: 74,
    scoreNumber: 76.0,
    gradeLetter: 'B+',
    gradePoint: 3.3,
    status: 'LULUS',
  },
  {
    classId: deterministicUuid('kls-sti2543130-3a'),
    code: 'STI2543130',
    name: 'Sistem Operasi',
    sks: 3,
    attendancePercent: 90,
    assignmentsScore: 85,
    quizScore: 80,
    midtermScore: 82,
    finalScore: 85,
    scoreNumber: 83.2,
    gradeLetter: 'A-',
    gradePoint: 3.7,
    status: 'LULUS',
  },
  {
    classId: deterministicUuid('kls-sti2543129-3a'),
    code: 'STI2543129',
    name: 'Pengenalan Kecerdasan Buatan',
    sks: 3,
    attendancePercent: 95,
    assignmentsScore: 94,
    quizScore: 88,
    midtermScore: 92,
    finalScore: 90,
    scoreNumber: 91.4,
    gradeLetter: 'A',
    gradePoint: 4.0,
    status: 'LULUS',
  },
];

export default async function GradesPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role === 'LECTURER') {
    redirect('/analytics?tab=rekap-nilai');
  }
  if (role === 'PROGRAM_COORDINATOR') {
    redirect('/coordinator/reports');
  }
  if (role === 'ACADEMIC_STAFF') {
    redirect('/staff');
  }
  if (role === 'TEACHING_ASSISTANT') {
    redirect('/ta/grading');
  }

  const isNew = user?.isNewAccount ?? false;
  const attempts = isNew ? [] : await getAllAttemptsAction().catch(() => []);
  const quizzes = isNew ? [] : await getAllQuizzesAction().catch(() => []);
  const isDemo = isDemoMode();
  const grades = isDemo && !isNew ? DEMO_GRADES : [];

  return <GradesHubView grades={grades} attempts={attempts} quizzes={quizzes} isDemo={isDemo && !isNew} />;
}
