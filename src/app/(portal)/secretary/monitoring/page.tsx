import React from 'react';
import { redirect } from 'next/navigation';
import { assertServerRole } from '@/lib/auth/server-guards';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { isDemoMode } from '@/lib/config/features';
import { CoordinatorMonitoringHubView } from '@/modules/academic/coordinator-monitoring-hub-view';

export const metadata = {
  title: 'Monitoring Prodi (Sekprodi) — SIAJAR',
};

export default async function SecretaryMonitoringPage() {
  await assertServerRole(['PROGRAM_SECRETARY']);
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role !== 'PROGRAM_SECRETARY' && !user?.isImpersonating) {
    redirect('/workspace');
  }

  const isDemo = isDemoMode();
  return <CoordinatorMonitoringHubView isDemo={isDemo} basePath="/secretary/monitoring" />;
}
