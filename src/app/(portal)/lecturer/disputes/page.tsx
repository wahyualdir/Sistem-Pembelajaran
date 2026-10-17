import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { EmptyState } from '@/components/shared/empty-state';
import { MessageSquareWarning } from 'lucide-react';

export default async function LecturerDisputesPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'LECTURER' && role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    redirect(role === 'STUDENT' ? '/student' : '/admin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sanggahan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Peninjauan permohonan sanggahan nilai tugas, kuis, dan ujian dari mahasiswa.
        </p>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-6">
        <EmptyState
          icon={<MessageSquareWarning className="h-6 w-6" />}
          title="Tidak ada sanggahan masuk"
          description="Sanggahan nilai yang diajukan mahasiswa akan muncul di sini."
        />
      </div>
    </div>
  );
}
