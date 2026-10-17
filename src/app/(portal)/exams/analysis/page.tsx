import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { EmptyState } from '@/components/shared/empty-state';
import { BarChart3 } from 'lucide-react';

export default async function ExamAnalysisPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'LECTURER' && role !== 'TEACHING_ASSISTANT' && role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    redirect(role === 'STUDENT' ? '/student' : '/admin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analisis Soal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analisis butir soal: tingkat kesukaran, daya pembeda, efektivitas pengecoh, dan reliabilitas ujian.
        </p>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-6">
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="Belum ada data analisis ujian"
          description="Pilih ujian yang sudah selesai untuk menghitung parameter butir soal."
        />
      </div>
    </div>
  );
}
