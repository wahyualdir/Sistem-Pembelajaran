import React from 'react';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getAllAttemptsAction, getAllQuizzesAction } from '@/modules/academic/quiz-actions';
import { getMyStudentGradesAction } from '@/modules/academic/actions';
import { GradesHubView } from '@/modules/academic/grades-hub-view';
import { redirect } from 'next/navigation';
import { isDemoMode } from '@/lib/config/features';

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
  const grades = isNew ? [] : await getMyStudentGradesAction().catch(() => []);

  return <GradesHubView grades={grades} attempts={attempts} quizzes={quizzes} isDemo={isDemo && !isNew} />;
}
