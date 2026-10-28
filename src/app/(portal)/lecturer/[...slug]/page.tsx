import { redirect, notFound } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

interface PageProps {
  params: Promise<{ slug: string[] }> | { slug: string[] };
}

const LEGACY_REDIRECTS: Record<string, string> = {
  mentoring: '/lecturer/mentoring',
  materials: '/classes',
  assignments: '/classes',
  students: '/classes',
  assistants: '/classes',
  forum: '/classes',
};

export default async function LecturerSubpage({ params }: PageProps) {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role === 'STUDENT') {
    redirect('/student');
  }

  const resolvedParams = await Promise.resolve(params);
  const subroute = resolvedParams?.slug?.[0] || '';

  if (LEGACY_REDIRECTS[subroute]) {
    redirect(LEGACY_REDIRECTS[subroute]);
  }

  notFound();
}
