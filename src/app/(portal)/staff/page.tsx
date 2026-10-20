import React from 'react';
import { listMasterDataAction } from '@/modules/academic/actions';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { StaffDashboardClient } from './staff-dashboard-client';

export default async function StaffPortalPage() {
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

  const { programs, semesters, courses } = await listMasterDataAction();

  const rawName = user?.profile?.full_name;
  const isGenericAdmin = rawName && (rawName.toLowerCase().includes('administrator') || rawName.toLowerCase().includes('admin'));
  const staffName = rawName && !isGenericAdmin ? rawName : 'Staf Administrasi Akademik';

  return (
    <StaffDashboardClient
      programs={programs}
      semesters={semesters}
      courses={courses}
      staffName={staffName}
    />
  );
}
