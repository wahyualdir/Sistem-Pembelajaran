import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import {
  getAdviseesListAction,
  getPendingAdviseeKrsAction,
} from '@/modules/academic/advisory-actions';
import { getMentoringRiskListAction } from '@/modules/early-warning/actions';
import { LecturerAdvisoryHubView } from '@/modules/academic/lecturer-advisory-hub-view';
import { RetroWindow } from '@/components/retro/retro-window';
import { GraduationCap } from 'lucide-react';

export const metadata = {
  title: 'Ruang Perwalian & Bimbingan Akademik — SIAJAR',
};

export default async function LecturerAdvisoryPage() {
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

  const [advisees, riskEvaluations, pendingKrs] = await Promise.all([
    getAdviseesListAction(),
    getMentoringRiskListAction(),
    getPendingAdviseeKrsAction(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Ruang Perwalian & Pembimbing Akademik"
        badge="DOSEN WALI :: ADVISORY"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 space-y-2 bg-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-ink flex items-center gap-3">
              <GraduationCap className="h-7 w-7 text-primary" />
              <span>Perwalian & Bimbingan Rencana Studi</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-medium max-w-3xl leading-relaxed">
              Monitoring progres studi mahasiswa bimbingan, verifikasi antrean persetujuan KRS semester baru, evaluasi kehadiran & risiko akademik, serta riwayat catatan konsultasi perwalian.
            </p>
          </div>
        </div>
      </RetroWindow>

      <LecturerAdvisoryHubView
        advisees={advisees}
        riskEvaluations={riskEvaluations}
        pendingKrs={pendingKrs}
      />
    </div>
  );
}
