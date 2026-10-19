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
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER BERANDA STYLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <HandHelping className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Tukar Keahlian
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Forum bantuan belajar antarmahasiswa sekelas pada topik materi yang telah dikuasai.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-soft text-ink border-2 border-ink rounded-full shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>TERPANTAU DOSEN</span>
            </span>
          </div>
        </div>

        {/* 2. KONTEN CLIENT */}
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-6 shadow-retro">
          <SkillExchangeClient
            classes={classes}
            initialClassId={primaryClassId}
            initialRequests={requests}
            isBlackedOut={isBlackedOut}
            blackoutReason={blackoutReason}
            currentUserId={user?.user?.id}
          />
        </div>
      </div>
    </div>
  );
}
