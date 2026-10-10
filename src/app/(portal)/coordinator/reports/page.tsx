import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { isDemoMode } from '@/lib/config/features';
import { CoordinatorReportsHubView } from '@/modules/academic/coordinator-reports-hub-view';

export default async function CoordinatorReportsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role !== 'PROGRAM_COORDINATOR' && role !== 'SYSTEM_ADMIN' && role !== 'SUPER_ADMIN') {
    if (role === 'LECTURER') redirect('/lecturer');
    if (role === 'STUDENT') redirect('/student');
    if (role === 'TEACHING_ASSISTANT') redirect('/ta');
    if (role === 'ACADEMIC_STAFF') redirect('/staff');
    redirect('/login');
  }

  const isDemo = isDemoMode();
  return <CoordinatorReportsHubView isDemo={isDemo} />;
}
