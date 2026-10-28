import React from 'react';
import { redirect } from 'next/navigation';
import { assertServerRole } from '@/lib/auth/server-guards';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { isDemoMode } from '@/lib/config/features';
import { CoordinatorReportsHubView } from '@/modules/academic/coordinator-reports-hub-view';

export const metadata = {
  title: 'Laporan Akademik (Sekprodi) — SIAJAR',
};

export default async function SecretaryReportsPage() {
  await assertServerRole(['PROGRAM_SECRETARY']);
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role !== 'PROGRAM_SECRETARY' && !user?.isImpersonating) {
    redirect('/workspace');
  }

  const isDemo = isDemoMode();
  return <CoordinatorReportsHubView isDemo={isDemo} basePath="/secretary/reports" />;
}
