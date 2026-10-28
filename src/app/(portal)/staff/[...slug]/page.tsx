import { redirect, notFound } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

interface PageProps {
  params: Promise<{ slug: string[] }> | { slug: string[] };
}

const LEGACY_REDIRECTS: Record<string, string> = {
  'master/students': '/staff/master/students',
  'master/lecturers': '/staff/master/lecturers',
  'services/verification': '/staff/services/verification',
  'master/departments': '/staff/master?tab=program-studi',
  'master/courses': '/staff/master?tab=mata-kuliah',
  'master/academic-years': '/staff/master?tab=tahun-ajaran',
  'master/rooms': '/staff/master?tab=ruang-dan-titik-lokasi',
  'schedules/classes': '/staff/schedules?tab=jadwal-kuliah',
  'schedules/exams': '/staff/schedules?tab=jadwal-ujian',
  'schedules/rooms': '/staff/schedules?tab=penggunaan-ruang',
  'classes/enroll': '/staff/classes?tab=enroll-peserta',
  'classes/import': '/staff/classes?tab=impor-csv',
  'classes/transfer': '/staff/classes?tab=pindah-kelas',
  'grades/recap': '/staff/grades?tab=rekap-nilai',
  'attendance/recap': '/staff/grades?tab=rekap-presensi',
  'grades/change-requests': '/staff/grades?tab=perubahan-nilai',
  'reports/export': '/staff/grades?tab=ekspor-laporan',
};

export default async function StaffSubpage({ params }: PageProps) {
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
  if (role === 'LECTURER') {
    redirect('/lecturer');
  }
  if (role === 'PROGRAM_COORDINATOR') {
    redirect('/coordinator');
  }
  if (role === 'TEACHING_ASSISTANT') {
    redirect('/ta');
  }

  const resolvedParams = await Promise.resolve(params);
  const parts = resolvedParams?.slug || [];
  const fullSlug = parts.join('/');

  if (LEGACY_REDIRECTS[fullSlug]) {
    redirect(LEGACY_REDIRECTS[fullSlug]);
  }

  notFound();
}
