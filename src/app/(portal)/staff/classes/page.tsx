import React from 'react';
import { redirect } from 'next/navigation';
import { assertServerRole } from '@/lib/auth/server-guards';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { isDemoMode, isFeatureFlagActive } from '@/lib/config/features';
import { StaffClassesHubView } from '@/modules/academic/staff-classes-hub-view';

export default async function StaffClassesPage() {
  // A3c: Defense in depth di level halaman sensitif
  await assertServerRole(['ACADEMIC_STAFF']);
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
  const isPersistenceActive = isFeatureFlagActive('FF_PERSISTENCE_ACADEMIC');

  return <StaffClassesHubView isDemo={isDemo} isPersistenceActive={isPersistenceActive} />;
}

