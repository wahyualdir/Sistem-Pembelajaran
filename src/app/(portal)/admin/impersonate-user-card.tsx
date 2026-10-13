'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, ShieldAlert, Users, ArrowRight } from 'lucide-react';
import { impersonateUserAction } from '@/modules/identity/actions';

interface DemoUserItem {
  id: string;
  name: string;
  role: string;
  identifier: string;
}

const DEMO_TARGETS: DemoUserItem[] = [
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Ahmad Mahasiswa',
    role: 'Mahasiswa (STUDENT)',
    identifier: 'NIM: 2024001',
  },
  {
    id: 'a0000002-0000-0000-0000-000000000002',
    name: 'Dr. Budi Santoso, M.Kom.',
    role: 'Dosen Pengampu (LECTURER)',
    identifier: 'NIDN: 0012345678',
  },
  {
    id: 'a0000003-0000-0000-0000-000000000003',
    name: 'Citra Asisten',
    role: 'Mahasiswa + Asisten (TEACHING_ASSISTANT)',
    identifier: 'NIM: 2024002',
  },
  {
    id: 'a0000004-0000-0000-0000-000000000004',
    name: 'Prof. Dewi Lestari, Ph.D.',
    role: 'Koordinator Prodi (PROGRAM_COORDINATOR)',
    identifier: 'NIDN: 0087654321',
  },
  {
    id: 'a0000005-0000-0000-0000-000000000005',
    name: 'Eko Staf Akademik',
    role: 'Staf Akademik (ACADEMIC_STAFF)',
    identifier: 'NIP: 198501012010121001',
  },
  {
    id: 'a0000006-0000-0000-0000-000000000006',
    name: 'System Administrator',
    role: 'Administrator Sistem (SYSTEM_ADMIN)',
    identifier: 'Username: sysadmin',
  },
];

import { isDemoMode } from '@/lib/config/features';

export function ImpersonateUserCard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isDemo = isDemoMode();

  const handleImpersonate = (userId: string) => {
    if (!isDemo) return;
    startTransition(async () => {
      const res = await impersonateUserAction(userId);
      if (res.ok) {
        router.push('/workspace');
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_TARGETS.map((u) => (
          <div
            key={u.id}
            className="p-3.5 rounded-lg border-[1.5px] border-retro-border bg-retro-surface shadow-xs flex flex-col justify-between space-y-3 hover:bg-retro-warm/30 transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase bg-retro-warm px-2 py-0.5 rounded border border-retro-border">
                  {u.identifier}
                </span>
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h4 className="font-heading font-bold text-sm text-foreground mt-2 line-clamp-1">
                {u.name}
              </h4>
              <p className="text-xs text-muted-foreground">{u.role}</p>
            </div>

            <button
              type="button"
              disabled={!isDemo || pending}
              onClick={() => handleImpersonate(u.id)}
              title={!isDemo ? 'Fitur ini belum aktif' : undefined}
              className={`w-full rounded border-2 border-retro-border px-2.5 py-1.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                !isDemo
                  ? 'bg-neutral-300 text-neutral-600 border-neutral-400 cursor-not-allowed opacity-75'
                  : 'bg-black text-white hover:bg-retro-warm hover:text-black cursor-pointer'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{!isDemo ? 'Fitur ini belum aktif' : pending ? 'Beralih Sesi...' : 'Impersonate Pengguna'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
