import React from 'react';
import { redirect } from 'next/navigation';
import { assertServerRole } from '@/lib/auth/server-guards';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import {
  getCoordinatorCohortRiskAction,
  getAllAtRiskStudentsAction,
} from '@/modules/early-warning/actions';
import { AtRiskView } from '@/app/(portal)/coordinator/monitoring/at-risk/at-risk-view';

export const metadata = {
  title: 'Risiko Mahasiswa (Sekprodi) — SIAJAR',
};

export default async function SecretaryRiskPage() {
  await assertServerRole(['PROGRAM_SECRETARY']);
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role !== 'PROGRAM_SECRETARY' && !user?.isImpersonating) {
    redirect('/workspace');
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
      badge="SEKPRODI :: EARLY WARNING"
      title="Pemantauan Mahasiswa Berisiko (EWS Sekprodi)"
    />
  );
}
