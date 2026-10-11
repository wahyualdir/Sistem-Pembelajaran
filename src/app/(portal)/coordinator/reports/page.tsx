import React from 'react';
import { redirect } from 'next/navigation';
import { assertServerRole } from '@/lib/auth/server-guards';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { isDemoMode } from '@/lib/config/features';
import { CoordinatorReportsHubView } from '@/modules/academic/coordinator-reports-hub-view';

export default async function CoordinatorReportsPage() {
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

  const isDemo = isDemoMode();
  return <CoordinatorReportsHubView isDemo={isDemo} />;
}
