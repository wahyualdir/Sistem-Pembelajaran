import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { EmptyState } from '@/components/shared/empty-state';
import { ListChecks } from 'lucide-react';

export default async function LecturerRubricsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'LECTURER' && role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    redirect(role === 'STUDENT' ? '/student' : '/admin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Rubrik</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pengelolaan rubrik penilaian berjenjang kriteria capaian untuk tugas dan evaluasi.
        </p>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-6">
        <EmptyState
          icon={<ListChecks className="h-6 w-6" />}
          title="Belum ada rubrik"
          description="Buat rubrik baru untuk standardisasi penilaian tugas kuliah."
        />
      </div>
    </div>
  );
}
