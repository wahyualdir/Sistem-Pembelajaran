import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { EmptyState } from '@/components/shared/empty-state';
import { ClipboardCheck } from 'lucide-react';

export default async function LecturerEvaluationsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'LECTURER' && role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    redirect(role === 'STUDENT' ? '/student' : '/admin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Hasil Evaluasi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rekapitulasi hasil kuesioner evaluasi pembelajaran kelas pengampu setelah periode ditutup.
        </p>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-6">
        <EmptyState
          icon={<ClipboardCheck className="h-6 w-6" />}
          title="Belum ada hasil evaluasi"
          description="Hasil evaluasi kelas akan ditampilkan setelah periode evaluasi resmi ditutup."
        />
      </div>
    </div>
  );
}
