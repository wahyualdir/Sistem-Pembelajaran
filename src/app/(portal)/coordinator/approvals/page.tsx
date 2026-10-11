import React from 'react';
import { redirect } from 'next/navigation';
import { assertServerRole } from '@/lib/auth/server-guards';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listChangeRequestsAction } from '@/modules/academic/actions';
import { isDemoMode } from '@/lib/config/features';
import { CoordinatorApprovalsHubView } from '@/modules/academic/coordinator-approvals-hub-view';

export default async function CoordinatorApprovalsPage() {
  // A3c: Defense in depth di level halaman sensitif
  await assertServerRole(['PROGRAM_COORDINATOR']);
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

  const changeRequests = await listChangeRequestsAction().catch(() => []);
  const isDemo = isDemoMode();

  return (
    <CoordinatorApprovalsHubView
      changeRequests={changeRequests}
      isDemo={isDemo}
    />
  );
}
