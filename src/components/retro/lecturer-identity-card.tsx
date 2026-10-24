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
  role?: 'LECTURER' | 'TEACHING_ASSISTANT';
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
  role = 'LECTURER',
}: LecturerIdentityCardProps) {
  const percentBkd = Math.min(100, Math.round((sksCount / maxSks) * 100));
  const isBkdFulfilled = sksCount >= 12;
  const isTA = role === 'TEACHING_ASSISTANT';

  return (
    <div className="w-full rounded-2xl border-2 border-[#7A756D] bg-white p-4 sm:p-5 shadow-xs space-y-4 font-sans relative overflow-hidden transition-all hover:shadow-xs">
      {/* 1. Header Identitas Kampus & Logo Resmi UIR */}
      <div className="flex items-center gap-2.5 pb-3 border-b-2 border-[#D6D3CB]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-xl border-2 border-[#7A756D] bg-white p-0.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
            <img
              src="/logo-ruangkampus.png"
              alt="Logo RuangKampus"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-base font-heading font-black text-[#1C1917] tracking-tight block leading-tight whitespace-nowrap">
              Ruang<span className="text-[#C2553A]">Kampus</span>
            </span>
            <span className="text-xs sm:text-sm font-sans font-extrabold text-[#853827] uppercase tracking-wider block leading-tight mt-0.5 truncate">
              {isTA ? 'Asisten Dosen & Lab' : 'Kartu Dosen Pengampu'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Informasi Utama Dosen & Avatar */}
      <div className="flex items-center gap-3.5">
        {/* Avatar Frame Retro */}
        <div className="h-14 w-14 sm:h-15 sm:w-15 rounded-xl border-2 border-[#7A756D] bg-[#ECE9D8] flex items-center justify-center shrink-0 shadow-2xs">
          <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-[#1C1917]" />
        </div>

        {/* Biodata Dosen */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <h4
            className="font-heading font-black text-sm sm:text-base text-[#1C1917] truncate leading-tight"
            title={lecturerName}
          >
            {lecturerName}
          </h4>
          <p className="font-sans text-xs font-extrabold text-[#57534E] flex items-center gap-1">
            <span>{isTA ? 'NIM / ID' : 'NIDN'}</span>
            <span className="text-[#1C1917] font-black">{nidn}</span>
          </p>
          <p className="text-xs font-bold text-[#1C1917]/85 truncate">
            {functionalTitle}
          </p>
          <p className="text-xs font-bold text-[#1C1917] truncate">
            Prodi {department}
          </p>
        </div>
      </div>

      {/* 3. Panel Status Beban Kerja Dosen (BKD) */}
      <div className="rounded-xl border-2 border-[#7A756D] bg-[#ECE9D8]/80 p-3 sm:p-3.5 space-y-3">
        {/* Baris Status BKD */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading font-black text-xs text-[#1C1917] uppercase tracking-wider">
            {isTA ? 'Beban Praktikum & Lab' : 'Beban Mengajar (BKD)'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#7A756D] bg-white text-[#1C1917] text-xs font-sans font-extrabold shadow-2xs shrink-0 whitespace-nowrap">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
            <span>{isBkdFulfilled ? 'Memenuhi BKD ✓' : `${sksCount}/12 SKS`}</span>
          </span>
        </div>

        {/* Realisasi vs Target & Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-sans font-extrabold">
            <span className="text-[#1C1917]">Realisasi: {sksCount} SKS</span>
            <span className="text-[#57534E] font-medium">Target: {maxSks} SKS</span>
          </div>
          <div className="w-full h-2.5 rounded-full border-2 border-[#7A756D] bg-white overflow-hidden p-[1px]">
            <div
              className="bg-ink h-full rounded-full transition-all duration-500"
              style={{ width: `${percentBkd}%` }}
            />
          </div>
        </div>

        {/* 3 Metrik Kelas Berbaris Rapi & Simetris */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-ink/15 text-center">
          <div className="py-1 px-1 rounded-lg border border-[#7A756D] bg-white shadow-xs">
            <span className="block text-xs font-sans font-extrabold text-[#57534E] uppercase flex items-center justify-center gap-1">
              <BookOpen className="h-3 w-3 text-[#1C1917]" />
              <span>Teori</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-[#1C1917] block mt-0.5">
              {theoryClassesCount} Kelas
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-[#7A756D] bg-white shadow-xs">
            <span className="block text-xs font-sans font-extrabold text-[#57534E] uppercase flex items-center justify-center gap-1">
              <FlaskConical className="h-3 w-3 text-[#1C1917]" />
              <span>Praktikum</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-[#1C1917] block mt-0.5">
              {practicumClassesCount} Lab
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-[#7A756D] bg-white shadow-xs">
            <span className="block text-xs font-sans font-extrabold text-[#57534E] uppercase flex items-center justify-center gap-1">
              <Users className="h-3 w-3 text-[#1C1917]" />
              <span>Mhs</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-[#1C1917] block mt-0.5">
              {totalStudents} Mhs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
