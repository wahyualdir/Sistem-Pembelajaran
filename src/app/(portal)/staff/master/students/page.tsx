import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { MasterStore } from '@/features/master/master-store';
import { StudentsClient } from './students-client';

export const metadata = {
  title: 'Data Master Mahasiswa — SIAJAR',
};

export default async function StaffMasterStudentsPage() {
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

  const mahasiswa = MasterStore.getMahasiswa();
  const dosen = MasterStore.getDosen();
  const prodi = MasterStore.getProdi();

  return (
    <StudentsClient
      initialMahasiswa={mahasiswa}
      initialDosen={dosen}
      initialProdi={prodi}
    />
  );
}
