import React from 'react';
import { redirect } from 'next/navigation';
import { assertServerRole } from '@/lib/auth/server-guards';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getAdviseesListAction } from '@/modules/academic/advisory-actions';
import { AdvisoryManagementHubView } from '@/modules/academic/advisory-management-hub-view';

export const metadata = {
  title: 'Manajemen Perwalian (Kaprodi) — SIAJAR',
};

export default async function CoordinatorAdvisoryPage() {
  await assertServerRole(['PROGRAM_COORDINATOR']);
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role !== 'PROGRAM_COORDINATOR' && !user?.isImpersonating) {
    redirect('/workspace');
  }

  const advisees = await getAdviseesListAction();

  return (
    <AdvisoryManagementHubView
      initialAdvisees={advisees}
      userRole="PROGRAM_COORDINATOR"
    />
  );
}
