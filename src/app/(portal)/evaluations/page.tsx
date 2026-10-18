import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { StudentEvaluationsView } from '@/modules/academic/student-evaluations-view';

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

      <StudentEvaluationsView />
    </div>
  );
}

