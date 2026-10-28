import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { MasterStore } from '@/features/master/master-store';
import { LecturersClient } from './lecturers-client';

export const metadata = {
  title: 'Data Master Dosen — SIAJAR',
};

export default async function StaffMasterLecturersPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'STUDENT') {
    redirect('/student');
  }
  if (role === 'LECTURER') {
    redirect('/lecturer');
  }
  if (role === 'TEACHING_ASSISTANT') {
    redirect('/ta');
  }
  if (role !== 'ACADEMIC_STAFF' && role !== 'SUPER_ADMIN' && role !== 'SYSTEM_ADMIN' && !user?.isImpersonating) {
    if (role === 'PROGRAM_COORDINATOR') redirect('/coordinator');
    redirect('/login');
  }

  const dosen = MasterStore.getDosen();

  return <LecturersClient initialDosen={dosen} />;
}
