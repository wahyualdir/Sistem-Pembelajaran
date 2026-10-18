import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getStudentRequestsAction } from '@/modules/requests/actions';
import { RequestsView } from '@/modules/requests/requests-view';
import { KrsStore } from '@/features/krs/krs-store';

export const metadata = {
  title: 'Pengajuan Surat Akademik dan KRS - SIAJAR LMS',
  description: 'Layanan mandiri pengajuan surat keterangan aktif, dispensasi, legalisasi berkas, dan Kartu Rencana Studi.',
};

export default async function RequestsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'STUDENT' && role !== 'TEACHING_ASSISTANT') {
    redirect(role === 'ACADEMIC_STAFF' ? '/staff/services/verification' : '/admin');
  }

  const studentId = user?.user?.id || 'mhs-1';
  const requests = await getStudentRequestsAction();
  const krs = KrsStore.getKrsByMahasiswa(studentId);

  return <RequestsView initialRequests={requests} initialKrs={krs} />;
}
