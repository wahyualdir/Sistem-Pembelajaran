import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { AchievementsView } from '@/modules/academic/achievements-view';

import { Trophy } from 'lucide-react';

export default async function AchievementsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'STUDENT' && role !== 'TEACHING_ASSISTANT') {
    redirect(role === 'LECTURER' ? '/lecturer' : '/admin');
  }

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER BERANDA STYLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Pencapaian Akademik
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Catatan kebiasaan belajar, lencana akademik, dan rekap aktivitas perkuliahan.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              LENCANA & REKAP
            </span>
          </div>
        </div>

        <AchievementsView />
      </div>
    </div>
  );
}

