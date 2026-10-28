import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getAllStudentRequestsAction } from '@/modules/requests/actions';
import { VerificationClient } from './verification-client';

export const metadata = {
  title: 'Verifikasi Pengajuan Masuk — SIAJAR',
};

export default async function StaffVerificationPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'STUDENT') {
    redirect('/requests');
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

  const requests = await getAllStudentRequestsAction();

  return <VerificationClient initialRequests={requests || []} />;
}
