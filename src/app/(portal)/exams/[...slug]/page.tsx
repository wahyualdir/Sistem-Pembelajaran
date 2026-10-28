import { redirect, notFound } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

interface PageProps {
  params: Promise<{ slug: string[] }> | { slug: string[] };
}

const LEGACY_REDIRECTS: Record<string, string> = {
  'question-bank': '/exams/question-bank',
  review: '/exams/review',
  live: '/ta/exam-monitor',
  violations: '/analytics',
  disputes: '/grades',
};

export default async function ExamSubpage({ params }: PageProps) {
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

  const resolvedParams = await Promise.resolve(params);
  const subroute = resolvedParams?.slug?.[0] || '';

  if (LEGACY_REDIRECTS[subroute]) {
    redirect(LEGACY_REDIRECTS[subroute]);
  }

  notFound();
}
