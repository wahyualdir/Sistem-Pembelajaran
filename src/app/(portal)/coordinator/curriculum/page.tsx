import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getCurriculumDataAction } from '@/modules/academic/curriculum-actions';
import { CurriculumView } from './curriculum-view';

export const metadata = {
  title: 'Kurikulum & Capaian Pembelajaran (CPL/CPMK) — SIAJAR',
};

export default async function CoordinatorCurriculumPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role !== 'PROGRAM_COORDINATOR' && !user?.isImpersonating) {
    if (role === 'LECTURER') redirect('/lecturer');
    if (role === 'STUDENT') redirect('/student');
    if (role === 'TEACHING_ASSISTANT') redirect('/ta');
    if (role === 'ACADEMIC_STAFF') redirect('/staff');
    redirect('/login');
  }

  const data = await getCurriculumDataAction();

  return (
    <CurriculumView
      cpl={data.cpl}
      cpmk={data.cpmk}
      coursesPerSemester={data.coursesPerSemester}
    />
  );
}
