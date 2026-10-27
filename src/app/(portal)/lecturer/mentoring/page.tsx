import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getMentoringRiskListAction } from '@/modules/early-warning/actions';
import { MentoringRiskView } from '@/modules/early-warning/mentoring-risk-view';
import { RetroWindow } from '@/components/retro/retro-window';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'Mahasiswa Bimbingan Akademik — SIAJAR',
};

export default async function LecturerMentoringPage() {
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
  if (role !== 'LECTURER' && role !== 'PROGRAM_COORDINATOR' && !user?.isImpersonating) {
    if (role === 'TEACHING_ASSISTANT') redirect('/ta');
    if (role === 'ACADEMIC_STAFF') redirect('/staff');
    redirect('/login');
  }

  const advisees = await getMentoringRiskListAction();

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Mahasiswa Bimbingan Akademik (Dosen Wali)"
        badge="DOSEN WALI :: MENTORING"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 space-y-2 bg-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <Users className="h-7 w-7 text-black" />
              <span>Mahasiswa Bimbingan Akademik</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-3xl leading-relaxed">
              Monitoring progres studi, evaluasi kehadiran (&lt;75%), peringatan tugas tertunda, serta penjadwalan bimbingan rencana studi bagi mahasiswa perwalian.
            </p>
          </div>
        </div>
      </RetroWindow>

      <MentoringRiskView advisees={advisees || []} />
    </div>
  );
}
