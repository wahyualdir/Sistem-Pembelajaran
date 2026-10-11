import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { isDemoMode } from '@/lib/config/features';
import { StaffModerationHubView } from '@/modules/academic/staff-moderation-hub-view';

export default async function StaffModerationPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role === 'STUDENT') {
    redirect('/community');
  }
  if (role === 'LECTURER') {
    redirect('/community');
  }
  if (role === 'PROGRAM_COORDINATOR') {
    redirect('/coordinator');
  }
  if (role === 'TEACHING_ASSISTANT') {
    redirect('/community');
  }

  const isDemo = isDemoMode();

  return <StaffModerationHubView isDemo={isDemo} />;
}
