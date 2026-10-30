import React from 'react';
import { listChangeRequestsAction } from '@/modules/academic/actions';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getCoordinatorCohortRiskAction } from '@/modules/early-warning/actions';
import { CoordinatorDashboardClient } from '@/app/(portal)/coordinator/coordinator-dashboard-client';

export const metadata = {
  title: 'Beranda Sekretaris Prodi — SIAJAR',
};

export default async function SecretaryPortalPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role !== 'PROGRAM_SECRETARY' && !user?.isImpersonating) {
    if (role === 'PROGRAM_COORDINATOR') redirect('/coordinator');
    if (role === 'LECTURER') redirect('/lecturer');
    if (role === 'STUDENT') redirect('/student');
    if (role === 'TEACHING_ASSISTANT') redirect('/ta');
    if (role === 'ACADEMIC_STAFF') redirect('/staff');
    if (role === 'LAB_HEAD') redirect('/lab');
    redirect('/login');
  }

  const [all, cohortData] = await Promise.all([
    listChangeRequestsAction(),
    getCoordinatorCohortRiskAction(),
  ]);

  const rawName = user?.profile?.full_name;
  const isGenericAdmin = rawName && (rawName.toLowerCase().includes('administrator') || rawName.toLowerCase().includes('admin'));
  const secretaryName = rawName && !isGenericAdmin ? rawName : 'Sekretaris Program Studi';

  return (
    <CoordinatorDashboardClient
      requests={all as any}
      cohortData={cohortData}
      coordinatorName={secretaryName}
      isSecretary={true}
      canApprove={false}
    />
  );
}
