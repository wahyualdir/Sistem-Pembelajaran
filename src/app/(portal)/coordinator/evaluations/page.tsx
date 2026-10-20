import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { CoordinatorEvaluationsView } from '@/modules/academic/coordinator-evaluations-view';
import { RetroWindow } from '@/components/retro/retro-window';
import { Award } from 'lucide-react';

export default async function CoordinatorEvaluationsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    redirect(role === 'LECTURER' ? '/lecturer/evaluations' : '/admin');
  }

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="evaluasi_dosen_edom.app"
        badge="Evaluasi Mutu Prodi"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 border-2 border-black bg-[#ED1C24] text-white shadow-retro-sm">
                <Award className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-[#111111]">
                Evaluasi Dosen oleh Mahasiswa (EDOM)
              </h1>
            </div>
            <p className="text-sm sm:text-base text-[#111111] font-semibold max-w-3xl leading-relaxed">
              Pengelolaan periode kuesioner evaluasi dosen dan rekapitulasi capaian mutu pembelajaran prodi.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-bold text-[#111111] shadow-retro-sm">
              Akreditasi Prodi
            </span>
          </div>
        </div>
      </RetroWindow>

      <CoordinatorEvaluationsView />
    </div>
  );
}
