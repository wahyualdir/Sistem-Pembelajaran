import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { EmptyState } from '@/components/shared/empty-state';
import { NotebookPen } from 'lucide-react';

export default async function LecturerJournalsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'LECTURER' && role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    redirect(role === 'STUDENT' ? '/student' : '/admin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Berita Acara</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catatan materi perkuliahan, moda pertemuan, kehadiran, dan kendala pertemuan 1–16.
        </p>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-6">
        <EmptyState
          icon={<NotebookPen className="h-6 w-6" />}
          title="Belum ada berita acara"
          description="Pilih kelas diampu untuk mengisi berita acara pertemuan perkuliahan."
        />
      </div>
    </div>
  );
}
