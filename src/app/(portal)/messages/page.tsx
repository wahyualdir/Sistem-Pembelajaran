import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { MessagesHubView } from '@/modules/academic/messages-hub-view';

import { MessageCircle } from 'lucide-react';

export default async function MessagesPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role === 'SYSTEM_ADMIN' || role === 'SUPER_ADMIN') {
    redirect(role === 'SYSTEM_ADMIN' ? '/admin/system' : '/admin');
  }

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER BERANDA STYLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Pesan & Konsultasi
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Percakapan langsung dengan dosen pengampu, asisten, dan pemesanan jadwal konsultasi.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              KOMUNIKASI TERPADU
            </span>
          </div>
        </div>

        <MessagesHubView
          currentUserRole={role}
          currentUserId={user?.user?.id || ''}
        />
      </div>
    </div>
  );
}

