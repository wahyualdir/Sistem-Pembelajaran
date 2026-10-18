import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { CoordinatorEvaluationsView } from '@/modules/academic/coordinator-evaluations-view';

export default async function CoordinatorEvaluationsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    redirect(role === 'LECTURER' ? '/lecturer/evaluations' : '/admin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Evaluasi Dosen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pengelolaan periode kuesioner evaluasi dosen dan rekapitulasi capaian mutu pembelajaran prodi.
        </p>
      </div>

      <CoordinatorEvaluationsView />
    </div>
  );
}

