import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { RetroWindow } from '@/components/retro/retro-window';
import { HandHelping, ShieldCheck, Layers } from 'lucide-react';
import {
  listSkillRequestsAction,
  checkClassBlackoutAction,
} from '@/modules/academic/skill-exchange-actions';
import { SkillExchangeClient } from './skill-exchange-client';
import { createClient } from '@/lib/supabase/server';

export default async function SkillExchangePage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  // Proteksi akses peran: Mahasiswa, Asisten Dosen, Dosen, Kaprodi, Super Admin
  if (role === 'SYSTEM_ADMIN' || role === 'ACADEMIC_STAFF') {
    redirect(role === 'SYSTEM_ADMIN' ? '/admin/system' : '/staff');
  }

  const supabase = await createClient();

  // Ambil kelas aktif mahasiswa
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('class_id, classes(id, title)')
    .eq('student_id', user?.user?.id)
    .eq('status', 'ACTIVE');

  const classes = (enrollments || [])
    .map((e: any) => ({
      id: e.class_id,
      title: e.classes?.title || 'Kelas',
    }))
    .filter(Boolean);

  const primaryClassId = classes[0]?.id || '';
  let requests: any[] = [];
  let isBlackedOut = false;
  let blackoutReason = '';

  if (primaryClassId) {
    const [reqs, blackout] = await Promise.all([
      listSkillRequestsAction(primaryClassId).catch(() => []),
      checkClassBlackoutAction(primaryClassId).catch(() => ({
        isBlocked: false,
        activeExamTitle: undefined as string | undefined,
        reason: undefined as string | undefined,
      })),
    ]);
    requests = reqs;
    isBlackedOut = blackout.isBlocked;
    blackoutReason = blackout.reason || '';
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Tukar Keahlian"
        badge="Kolaborasi Sejawat"
        headerClassName="bg-gray-soft"
      >
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black/15 pb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-black flex items-center gap-2">
                <HandHelping className="w-6 h-6 text-primary" />
                <span>Tukar Keahlian</span>
              </h1>
              <p className="text-xs sm:text-sm text-black/70 mt-1">
                Forum bantuan belajar antarmahasiswa sekelas pada topik materi yang telah dikuasai.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-800 border-2 border-emerald-300 rounded-xl shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Tanpa Pesan Pribadi · Terpantau Dosen</span>
              </span>
            </div>
          </div>

          <SkillExchangeClient
            classes={classes}
            initialClassId={primaryClassId}
            initialRequests={requests}
            isBlackedOut={isBlackedOut}
            blackoutReason={blackoutReason}
            currentUserId={user?.user?.id}
          />
        </div>
      </RetroWindow>
    </div>
  );
}
