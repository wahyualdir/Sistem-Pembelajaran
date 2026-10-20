import React from 'react';
import { listChangeRequestsAction } from '@/modules/academic/actions';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getCoordinatorCohortRiskAction } from '@/modules/early-warning/actions';
import { CoordinatorDashboardClient } from './coordinator-dashboard-client';

export default async function CoordinatorPortalPage() {
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

  const [all, cohortData] = await Promise.all([
    listChangeRequestsAction(),
    getCoordinatorCohortRiskAction(),
  ]);

  const rawName = user?.profile?.full_name;
  const isGenericAdmin = rawName && (rawName.toLowerCase().includes('administrator') || rawName.toLowerCase().includes('admin'));
  const coordinatorName = rawName && !isGenericAdmin ? rawName : 'Dr. Ir. Kaprodi Informatika, M.Kom.';

  return (
    <CoordinatorDashboardClient
      requests={all as any}
      cohortData={cohortData}
      coordinatorName={coordinatorName}
    />
  );
}
