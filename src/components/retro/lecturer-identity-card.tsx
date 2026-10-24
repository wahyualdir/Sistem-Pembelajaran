'use client';

import React from 'react';
import {
  GraduationCap,
  CheckCircle2,
  Users,
  BookOpen,
  FlaskConical,
} from 'lucide-react';

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
    <div className="w-full rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] p-4 space-y-3.5 font-sans">
      {/* 1. Informasi Utama Dosen & Avatar */}
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl border border-[#E2E3E4] bg-[#F3F3F4] flex items-center justify-center shrink-0">
          <GraduationCap className="h-5 w-5 text-[#9F1521]" />
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F1521] block">
            {isTA ? 'Asisten Dosen & Lab' : 'Dosen Pengampu'}
          </span>
          <h4
            className="font-heading font-extrabold text-sm sm:text-base text-[#111111] truncate leading-tight"
            title={lecturerName}
          >
            {lecturerName}
          </h4>
          <p className="text-xs font-normal text-[#58595B] truncate">
            {isTA ? 'NIM / ID' : 'NIDN'} {nidn} • {functionalTitle}
          </p>
        </div>
      </div>

      {/* 2. Panel Status Beban Kerja Dosen (BKD) Bersih */}
      <div className="pt-3 border-t border-[#E2E3E4] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#808285]">
            {isTA ? 'Beban Praktikum' : 'Beban Mengajar (BKD)'}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#059669]">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>{isBkdFulfilled ? 'Memenuhi BKD' : `${sksCount}/12 SKS`}</span>
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#111111]">Realisasi: {sksCount} SKS</span>
            <span className="text-[#808285] font-normal">Target: {maxSks} SKS</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#F3F3F4] overflow-hidden">
            <div
              className="bg-[#9F1521] h-full rounded-full transition-all duration-500"
              style={{ width: `${percentBkd}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-[#E2E3E4] pt-2 border-t border-[#E2E3E4] text-center">
          <div className="px-1">
            <span className="text-[10px] font-normal text-[#808285] uppercase flex items-center justify-center gap-1">
              <BookOpen className="h-2.5 w-2.5 text-[#9F1521]" />
              <span>Teori</span>
            </span>
            <span className="font-heading font-bold text-xs text-[#111111] block mt-0.5">
              {theoryClassesCount} Kelas
            </span>
          </div>

          <div className="px-1">
            <span className="text-[10px] font-normal text-[#808285] uppercase flex items-center justify-center gap-1">
              <FlaskConical className="h-2.5 w-2.5 text-[#9F1521]" />
              <span>Praktikum</span>
            </span>
            <span className="font-heading font-bold text-xs text-[#111111] block mt-0.5">
              {practicumClassesCount} Lab
            </span>
          </div>

          <div className="px-1">
            <span className="text-[10px] font-normal text-[#808285] uppercase flex items-center justify-center gap-1">
              <Users className="h-2.5 w-2.5 text-[#9F1521]" />
              <span>Peserta</span>
            </span>
            <span className="font-heading font-bold text-xs text-[#111111] block mt-0.5">
              {totalStudents} Mhs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
