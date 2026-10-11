import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listStaffGradeChangesAction } from '@/modules/academic/actions';
import { isDemoMode } from '@/lib/config/features';
import { StaffGradesHubView } from '@/modules/academic/staff-grades-hub-view';

export default async function StaffGradesPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role === 'STUDENT') {
    redirect('/grades');
  }
  if (role === 'LECTURER') {
    redirect('/analytics?tab=rekap-nilai');
  }
  if (role === 'PROGRAM_COORDINATOR') {
    redirect('/coordinator/reports');
  }
  if (role === 'TEACHING_ASSISTANT') {
    redirect('/ta/grading');
  }

  const isDemo = isDemoMode();
  const gradeChanges = await listStaffGradeChangesAction().catch(() => []);

  return <StaffGradesHubView gradeChanges={gradeChanges} isDemo={isDemo} />;
}
