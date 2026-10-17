import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getStudentRequestsAction } from '@/modules/requests/actions';
import { RequestsView } from '@/modules/requests/requests-view';

export const metadata = {
  title: 'Pengajuan Surat Akademik - SIAJAR LMS',
  description: 'Layanan mandiri pengajuan surat keterangan aktif, dispensasi, dan legalisasi berkas.',
};

export default async function RequestsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'STUDENT' && role !== 'TEACHING_ASSISTANT') {
    redirect(role === 'ACADEMIC_STAFF' ? '/staff/services/verification' : '/admin');
  }

  const requests = await getStudentRequestsAction();

  return <RequestsView initialRequests={requests} />;
}
