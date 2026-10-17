import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listMyClassesAction } from '@/modules/academic/actions';
import { LecturerJournalsView } from '@/modules/academic/lecturer-journals-view';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Berita Acara</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catatan materi perkuliahan, moda pertemuan, kehadiran, dan kendala pertemuan 1–16.
        </p>
      </div>

      <LecturerJournalsView initialClasses={initialClasses} />
    </div>
  );
}
