'use client';

import React from 'react';
import {
  GraduationCap,
  CheckCircle2,
  Users,
  BookOpen,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LecturerIdentityCardProps {
  lecturerName?: string;
  nidn?: string;
  functionalTitle?: string;
  department?: string;
  sksCount?: number;
  maxSks?: number;
  totalStudents?: number;
  theoryClassesCount?: number;
  practicumClassesCount?: number;
}

export function LecturerIdentityCard({
  lecturerName = 'Dr. Ardiansyah, S.T., M.Kom.',
  nidn = '1018058501',
  functionalTitle = 'Lektor Kepala (IV/a)',
  department = 'Teknik Informatika (S1)',
  sksCount = 14,
  maxSks = 16,
  totalStudents = 108,
  theoryClassesCount = 4,
  practicumClassesCount = 1,
}: LecturerIdentityCardProps) {
  const percentBkd = Math.min(100, Math.round((sksCount / maxSks) * 100));
  const isBkdFulfilled = sksCount >= 12;

  return (
    <div className="w-full rounded-2xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4 font-sans relative overflow-hidden transition-all hover:shadow-retro-md">
      {/* 1. Header Identitas Kampus (Clean & Ringkas - 1 Baris Sejajar) */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-ink">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg border-2 border-ink bg-ink text-white flex items-center justify-center shrink-0 shadow-retro-xs">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-bold text-gray-dark uppercase tracking-wider block leading-none truncate">
              UNIVERSITAS ISLAM RIAU
            </span>
            <h3 className="font-heading font-black text-xs sm:text-sm text-ink leading-tight mt-0.5 truncate">
              Kartu Dosen Pengampu
            </h3>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 border-ink bg-surface text-ink text-[11px] font-mono font-bold shrink-0 shadow-retro-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
          <span>Terverifikasi</span>
        </span>
      </div>

      {/* 2. Informasi Utama Dosen & Avatar */}
      <div className="flex items-center gap-3.5">
        {/* Avatar Frame Retro */}
        <div className="h-14 w-14 sm:h-15 sm:w-15 rounded-xl border-2 border-ink bg-gray-soft flex items-center justify-center shrink-0 shadow-retro-sm">
          <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-ink" />
        </div>

        {/* Biodata Dosen */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <h4
            className="font-heading font-black text-sm sm:text-base text-ink truncate leading-tight"
            title={lecturerName}
          >
            {lecturerName}
          </h4>
          <p className="font-mono text-xs font-bold text-gray-dark flex items-center gap-1">
            <span>NIDN</span>
            <span className="text-ink font-black">{nidn}</span>
          </p>
          <p className="text-xs font-bold text-ink/85 truncate">
            {functionalTitle}
          </p>
          <p className="text-[11px] font-medium text-gray-dark truncate">
            Prodi {department}
          </p>
        </div>
      </div>

      {/* 3. Panel Status Beban Kerja Dosen (BKD) */}
      <div className="rounded-xl border-2 border-ink bg-gray-soft/60 p-3 sm:p-3.5 space-y-3">
        {/* Baris Status BKD */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading font-black text-xs text-ink uppercase tracking-wider">
            Beban Mengajar (BKD)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-ink bg-surface text-ink text-[11px] font-mono font-bold shadow-retro-xs shrink-0 whitespace-nowrap">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
            <span>{isBkdFulfilled ? 'Memenuhi BKD ✓' : `${sksCount}/12 SKS`}</span>
          </span>
        </div>

        {/* Realisasi vs Target & Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-mono font-bold">
            <span className="text-ink">Realisasi: {sksCount} SKS</span>
            <span className="text-gray-dark font-medium">Target: {maxSks} SKS</span>
          </div>
          <div className="w-full h-2.5 rounded-full border-2 border-ink bg-surface overflow-hidden p-[1px]">
            <div
              className="bg-ink h-full rounded-full transition-all duration-500"
              style={{ width: `${percentBkd}%` }}
            />
          </div>
        </div>

        {/* 3 Metrik Kelas Berbaris Rapi & Simetris */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-ink/15 text-center">
          <div className="py-1 px-1 rounded-lg border border-ink bg-surface shadow-xs">
            <span className="block text-[10px] font-mono font-bold text-gray-dark uppercase flex items-center justify-center gap-1">
              <BookOpen className="h-3 w-3 text-ink" />
              <span>Teori</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-ink block mt-0.5">
              {theoryClassesCount} Kelas
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-ink bg-surface shadow-xs">
            <span className="block text-[10px] font-mono font-bold text-gray-dark uppercase flex items-center justify-center gap-1">
              <FlaskConical className="h-3 w-3 text-ink" />
              <span>Praktikum</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-ink block mt-0.5">
              {practicumClassesCount} Lab
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-ink bg-surface shadow-xs">
            <span className="block text-[10px] font-mono font-bold text-gray-dark uppercase flex items-center justify-center gap-1">
              <Users className="h-3 w-3 text-ink" />
              <span>Mhs</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-ink block mt-0.5">
              {totalStudents} Mhs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
