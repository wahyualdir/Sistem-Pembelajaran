import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { isDemoMode } from '@/lib/config/features';
import { StaffContentHubView } from '@/modules/academic/staff-content-hub-view';

export default async function StaffContentPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role === 'STUDENT') {
    redirect('/library');
  }
  if (role === 'LECTURER') {
    redirect('/library');
  }
  if (role === 'PROGRAM_COORDINATOR') {
    redirect('/coordinator');
  }
  if (role === 'TEACHING_ASSISTANT') {
    redirect('/library');
  }

  const isDemo = isDemoMode();

  return <StaffContentHubView isDemo={isDemo} />;
}
