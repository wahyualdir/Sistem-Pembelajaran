import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { AchievementsView } from '@/modules/academic/achievements-view';

export default async function AchievementsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'STUDENT' && role !== 'TEACHING_ASSISTANT') {
    redirect(role === 'LECTURER' ? '/lecturer' : '/admin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pencapaian</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catatan kebiasaan belajar, lencana akademik, dan aktivitas perkuliahan.
        </p>
      </div>

      <AchievementsView />
    </div>
  );
}

