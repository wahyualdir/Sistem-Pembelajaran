import { redirect, notFound } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

interface PageProps {
  params: Promise<{ slug: string[] }> | { slug: string[] };
}

const LEGACY_REDIRECTS: Record<string, string> = {
  curriculum: '/coordinator/curriculum',
  courses: '/coordinator/courses',
  'monitoring/at-risk': '/coordinator/monitoring/at-risk',
  lecturers: '/coordinator/assignments?tab=dosen-pengampu',
  classes: '/coordinator/assignments?tab=kelas-prodi',
  'monitoring/classes': '/coordinator/monitoring?tab=kelas',
  'monitoring/lecturers': '/coordinator/monitoring?tab=dosen',
  'monitoring/attendance': '/coordinator/monitoring?tab=presensi',
  'monitoring/exams': '/coordinator/monitoring?tab=ujian',
  'approvals/classes': '/coordinator/approvals?tab=kelas-baru',
  'approvals/exams': '/coordinator/approvals?tab=soal-ujian',
  'approvals/grades': '/coordinator/approvals?tab=perubahan-nilai',
  'approvals/other': '/coordinator/approvals?tab=lainnya',
  evaluations: '/coordinator/reports?tab=evaluasi-dosen',
  cpl: '/coordinator/reports?tab=capaian-cpl',
  reports: '/coordinator/reports?tab=laporan-prodi',
};

export default async function CoordinatorSubpage({ params }: PageProps) {
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

  const resolvedParams = await Promise.resolve(params);
  const parts = resolvedParams?.slug || [];
  const fullSlug = parts.join('/');

  if (LEGACY_REDIRECTS[fullSlug]) {
    redirect(LEGACY_REDIRECTS[fullSlug]);
  }

  notFound();
}
