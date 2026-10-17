import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { EmptyState } from '@/components/shared/empty-state';
import { MessageCircle } from 'lucide-react';

export default async function MessagesPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role === 'SYSTEM_ADMIN' || role === 'SUPER_ADMIN') {
    redirect(role === 'SYSTEM_ADMIN' ? '/admin/system' : '/admin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pesan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Percakapan langsung dengan dosen pengampu, asisten, dan pemesanan jadwal konsultasi.
        </p>
      </div>

      <div className="rounded-[12px] border border-border bg-surface p-6">
        <EmptyState
          icon={<MessageCircle className="h-6 w-6" />}
          title="Belum ada pesan aktif"
          description="Pesan dan jadwal konsultasi akademik akan muncul di sini."
        />
      </div>
    </div>
  );
}
