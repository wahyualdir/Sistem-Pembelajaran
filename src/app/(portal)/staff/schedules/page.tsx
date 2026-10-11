import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { isDemoMode } from '@/lib/config/features';
import { StaffSchedulesHubView } from '@/modules/academic/staff-schedules-hub-view';

export default async function StaffSchedulesPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role === 'STUDENT') {
    redirect('/student');
  }
  if (role === 'LECTURER') {
    redirect('/lecturer');
  }
  if (role === 'PROGRAM_COORDINATOR') {
    redirect('/coordinator');
  }
  if (role === 'TEACHING_ASSISTANT') {
    redirect('/ta');
  }

  const isDemo = isDemoMode();

  return <StaffSchedulesHubView isDemo={isDemo} />;
}
