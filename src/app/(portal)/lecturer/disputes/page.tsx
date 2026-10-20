import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listClassDisputesAction } from '@/modules/academic/dispute-actions';
import { LecturerDisputesView } from '@/modules/academic/lecturer-disputes-view';
import { MessageSquareWarning } from 'lucide-react';

export default async function LecturerDisputesPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'LECTURER' && role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    redirect(role === 'STUDENT' ? '/student' : '/admin');
  }

  const disputes = await listClassDisputesAction();

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      {/* Header Halaman Sanggahan Retro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black/15 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 border border-black bg-gray-soft rounded text-[11px] font-mono font-bold text-black uppercase">
            <span>UJIAN DAN NILAI</span>
            <span>•</span>
            <span>SANGGAHAN NILAI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-2.5">
            <MessageSquareWarning className="w-7 h-7 text-black inline-block" />
            <span>Sanggahan Nilai Mahasiswa</span>
          </h1>
          <p className="text-xs sm:text-sm text-black/75 font-medium max-w-2xl leading-relaxed">
            Tinjau permohonan klarifikasi dan sanggahan nilai tugas atau kuis dari mahasiswa.
          </p>
        </div>
      </div>

      <LecturerDisputesView initialDisputes={disputes} />
    </div>
  );
}
