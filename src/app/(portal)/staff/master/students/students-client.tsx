'use client';

import React, { useState } from 'react';
import { RetroWindow } from '@/components/retro/retro-window';
import { MahasiswaTable } from '@/features/master/components/mahasiswa-table';
import { MahasiswaItem, DosenItem, ProgramStudiItem } from '@/features/master/types';
import { Users } from 'lucide-react';

interface StudentsClientProps {
  initialMahasiswa: MahasiswaItem[];
  initialDosen: DosenItem[];
  initialProdi: ProgramStudiItem[];
}

export function StudentsClient({
  initialMahasiswa,
  initialDosen,
  initialProdi,
}: StudentsClientProps) {
  const [mahasiswa, setMahasiswa] = useState<MahasiswaItem[]>(initialMahasiswa);

  function handleRefresh() {
    // Re-render local state
    setMahasiswa([...initialMahasiswa]);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Data Master Mahasiswa"
        badge="STAF AKADEMIK :: MASTER MAHASISWA"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 space-y-2 bg-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <Users className="h-7 w-7 text-black" />
              <span>Direktori Master Mahasiswa</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-3xl leading-relaxed">
              Manajemen basis data mahasiswa aktif, penetapan dosen wali, registrasi NIM, dan penonaktifan berstatus (soft delete) sesuai regulasi akademik.
            </p>
          </div>
        </div>
      </RetroWindow>

      <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro overflow-x-auto">
        <MahasiswaTable
          mahasiswaList={mahasiswa}
          dosenList={initialDosen}
          prodiList={initialProdi}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
