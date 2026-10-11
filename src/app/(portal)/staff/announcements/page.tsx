import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { isDemoMode } from '@/lib/config/features';
import { StaffAnnouncementsHubView } from '@/modules/academic/staff-announcements-hub-view';

export default async function StaffAnnouncementsPage() {
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

  return <StaffAnnouncementsHubView isDemo={isDemo} />;
}
