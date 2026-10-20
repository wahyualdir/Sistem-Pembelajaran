import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listMyClassesAction } from '@/modules/academic/actions';
import { LecturerJournalsView } from '@/modules/academic/lecturer-journals-view';
import { NotebookPen } from 'lucide-react';

export default async function LecturerJournalsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'LECTURER' && role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    redirect(role === 'STUDENT' ? '/student' : '/admin');
  }

  const rawClasses = await listMyClassesAction().catch(() => []);
  const initialClasses = rawClasses.length > 0
    ? rawClasses.map((c) => ({ id: c.id, title: c.title, section: c.section }))
    : [
        { id: 'c-101', title: 'Pemrograman Web & Arsitektur Cloud', section: 'A' },
        { id: 'c-102', title: 'Basis Data Terdistribusi', section: 'B' },
      ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      {/* Header Halaman Berita Acara Retro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black/15 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 border border-black bg-gray-soft rounded text-[11px] font-mono font-bold text-black uppercase">
            <span>ADMINISTRASI MENGAJAR</span>
            <span>•</span>
            <span>PERTEMUAN 1-16</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-2.5">
            <NotebookPen className="w-7 h-7 text-black inline-block" />
            <span>Berita Acara Perkuliahan</span>
          </h1>
          <p className="text-xs sm:text-sm text-black/75 font-medium max-w-2xl leading-relaxed">
            Catatan materi perkuliahan, moda pertemuan, kehadiran mahasiswa, dan kendala pertemuan 1–16.
          </p>
        </div>
      </div>

      <LecturerJournalsView initialClasses={initialClasses} />
    </div>
  );
}
