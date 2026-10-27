'use client';

import React, { useState } from 'react';
import { RetroWindow } from '@/components/retro/retro-window';
import { DosenTable } from '@/features/master/components/dosen-table';
import { DosenItem } from '@/features/master/types';
import { UserCheck } from 'lucide-react';

interface LecturersClientProps {
  initialDosen: DosenItem[];
}

export function LecturersClient({ initialDosen }: LecturersClientProps) {
  const [dosen, setDosen] = useState<DosenItem[]>(initialDosen);

  function handleRefresh() {
    setDosen([...initialDosen]);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Data Master Dosen & Tenaga Pengajar"
        badge="STAF AKADEMIK :: MASTER DOSEN"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 space-y-2 bg-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <UserCheck className="h-7 w-7 text-black" />
              <span>Direktori Master Tenaga Pengajar</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-3xl leading-relaxed">
              Pengelolaan NIDN, identitas dosen pengampu, penandaan hak dosen wali dan koordinator program studi (Kaprodi), serta impor berkas data dosen.
            </p>
          </div>
        </div>
      </RetroWindow>

      <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro overflow-x-auto">
        <DosenTable dosenList={dosen} onRefresh={handleRefresh} />
      </div>
    </div>
  );
}
