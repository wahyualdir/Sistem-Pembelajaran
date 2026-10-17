import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listClassDisputesAction } from '@/modules/academic/dispute-actions';
import { LecturerDisputesView } from '@/modules/academic/lecturer-disputes-view';

export default async function LecturerDisputesPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'LECTURER' && role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    redirect(role === 'STUDENT' ? '/student' : '/admin');
  }

  const disputes = await listClassDisputesAction();

  return (
    <div className="max-w-6xl space-y-6">
      <LecturerDisputesView initialDisputes={disputes} />
    </div>
  );
}
