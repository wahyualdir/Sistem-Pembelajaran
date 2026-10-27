import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getCoursesWithPrerequisitesAction } from '@/modules/academic/curriculum-actions';
import { CoursesView } from './courses-view';

export const metadata = {
  title: 'Mata Kuliah Program Studi — SIAJAR',
};

export default async function CoordinatorCoursesPage() {
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

  const courses = await getCoursesWithPrerequisitesAction();

  return <CoursesView initialCourses={courses} />;
}
