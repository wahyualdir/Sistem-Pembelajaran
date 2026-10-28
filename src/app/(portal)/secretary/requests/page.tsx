import React from 'react';
import { redirect } from 'next/navigation';
import { assertServerRole } from '@/lib/auth/server-guards';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listChangeRequestsAction } from '@/modules/academic/actions';
import { isDemoMode } from '@/lib/config/features';
import { CoordinatorApprovalsHubView } from '@/modules/academic/coordinator-approvals-hub-view';

export const metadata = {
  title: 'Verifikasi Pengajuan (Sekprodi) — SIAJAR',
};

export default async function SecretaryRequestsPage() {
  await assertServerRole(['PROGRAM_SECRETARY']);
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role !== 'PROGRAM_SECRETARY' && !user?.isImpersonating) {
    redirect('/workspace');
  }

  const changeRequests = await listChangeRequestsAction().catch(() => []);
  const isDemo = isDemoMode();

  return (
    <CoordinatorApprovalsHubView
      changeRequests={changeRequests}
      isDemo={isDemo}
      canApprove={false}
      basePath="/secretary/requests"
    />
  );
}
