import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getQuestionBankAction } from '@/modules/academic/quiz-actions';
import { listMyClassesAction } from '@/modules/academic/actions';
import { QuestionBankView } from './question-bank-view';

export const metadata = {
  title: 'Bank Soal Perkuliahan — SIAJAR',
};

export default async function QuestionBankPage() {
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

  const [questions, myClasses] = await Promise.all([
    getQuestionBankAction().catch(() => []),
    listMyClassesAction().catch(() => []),
  ]);

  return <QuestionBankView questions={questions || []} classes={myClasses || []} />;
}
