import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { EmptyState } from '@/components/shared/empty-state';
import { ClipboardCheck } from 'lucide-react';

export default async function StudentEvaluationsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'STUDENT' && role !== 'TEACHING_ASSISTANT') {
    redirect(role === 'LECTURER' ? '/lecturer/evaluations' : '/coordinator/evaluations');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Evaluasi Dosen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kuesioner evaluasi proses belajar mengajar per dosen dan per kelas secara anonim.
        </p>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-6">
        <EmptyState
          icon={<ClipboardCheck className="h-6 w-6" />}
          title="Tidak ada kuesioner terbuka"
          description="Periode pengisian evaluasi dosen belum dimulai atau semua kelas sudah diisi."
        />
      </div>
    </div>
  );
}
