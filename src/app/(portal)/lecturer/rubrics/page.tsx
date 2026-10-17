import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listRubricsAction } from '@/modules/academic/rubric-actions';
import { LecturerRubricsView } from '@/modules/academic/lecturer-rubrics-view';

export default async function LecturerRubricsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'LECTURER' && role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    redirect(role === 'STUDENT' ? '/student' : '/admin');
  }

  const rubrics = await listRubricsAction();

  return (
    <div className="max-w-6xl space-y-6">
      <LecturerRubricsView initialRubrics={rubrics} />
    </div>
  );
}
