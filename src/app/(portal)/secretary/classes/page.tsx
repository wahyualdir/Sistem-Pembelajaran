import React from 'react';
import { redirect } from 'next/navigation';
import { assertServerRole } from '@/lib/auth/server-guards';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { isDemoMode } from '@/lib/config/features';
import { CoordinatorAssignmentsHubView } from '@/modules/academic/coordinator-assignments-hub-view';

export const metadata = {
  title: 'Jadwal & Penugasan Kelas (Sekprodi) — SIAJAR',
};

export default async function SecretaryClassesPage() {
  await assertServerRole(['PROGRAM_SECRETARY']);
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role !== 'PROGRAM_SECRETARY' && !user?.isImpersonating) {
    redirect('/workspace');
  }

  const isDemo = isDemoMode();
  return <CoordinatorAssignmentsHubView isDemo={isDemo} basePath="/secretary/classes" />;
}
