import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getPendingExamReviewsAction } from '@/modules/academic/exam-review-actions';
import { ExamReviewView } from './review-view';

export const metadata = {
  title: 'Periksa Jawaban Ujian — SIAJAR',
};

export default async function ExamReviewPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role === 'STUDENT') {
    redirect('/exams');
  }
  if (role !== 'LECTURER' && role !== 'TEACHING_ASSISTANT' && !user?.isImpersonating) {
    if (role === 'PROGRAM_COORDINATOR') redirect('/coordinator');
    if (role === 'ACADEMIC_STAFF') redirect('/staff');
    redirect('/login');
  }

  const reviews = await getPendingExamReviewsAction();

  return <ExamReviewView initialReviews={reviews} />;
}
