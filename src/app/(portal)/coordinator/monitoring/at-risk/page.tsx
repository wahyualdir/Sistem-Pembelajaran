import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import {
  getCoordinatorCohortRiskAction,
  getAllAtRiskStudentsAction,
} from '@/modules/early-warning/actions';
import { AtRiskView } from './at-risk-view';

export const metadata = {
  title: 'Mahasiswa Berisiko (EWS) — SIAJAR',
};

export default async function CoordinatorAtRiskPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role !== 'PROGRAM_COORDINATOR' && !user?.isImpersonating) {
    if (role === 'LECTURER') redirect('/lecturer');
    if (role === 'STUDENT') redirect('/student');
    if (role === 'TEACHING_ASSISTANT') redirect('/ta');
    if (role === 'ACADEMIC_STAFF') redirect('/staff');
    redirect('/login');
  }

  const [cohortSummary, students] = await Promise.all([
    getCoordinatorCohortRiskAction(),
    getAllAtRiskStudentsAction(),
  ]);

  return (
    <AtRiskView
      cohorts={cohortSummary.cohorts}
      totalAtRisk={cohortSummary.totalAtRisk}
      students={students}
    />
  );
}
