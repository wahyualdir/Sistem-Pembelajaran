'use client';

import React from 'react';
import {
  CalendarCheck2,
  BookOpen,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

export interface StaffIdentityCardProps {
  staffName?: string;
  nip?: string;
  unit?: string;
  campusOffice?: string;
  programsCount?: number;
  semestersCount?: number;
  coursesCount?: number;
}

export function StaffIdentityCard({
  staffName = 'Staf Administrasi Akademik',
  nip = '198803152012011002',
  unit = 'Biro Administrasi Akademik & Kemahasiswaan',
  programsCount = 8,
  semestersCount = 4,
  coursesCount = 36,
}: StaffIdentityCardProps) {
  return (
    <div className="w-full rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] p-4 space-y-3.5 font-sans">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl border border-[#E2E3E4] bg-[#F3F3F4] flex items-center justify-center shrink-0">
          <Briefcase className="h-5 w-5 text-[#9F1521]" />
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F1521] block">
            Biro Akademik (BAAK)
          </span>
          <h4
            className="font-heading font-extrabold text-sm sm:text-base text-[#111111] truncate leading-tight"
            title={staffName}
          >
            {staffName}
          </h4>
          <p className="text-xs font-normal text-[#58595B] truncate">
            NIP {nip} • {unit}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-[#E2E3E4] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#808285]">
            Periode Aktif
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#059669]">
            <CalendarCheck2 className="h-3 w-3 shrink-0" />
            <span>Ganjil 2026/2027</span>
          </span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-[#E2E3E4] pt-2 border-t border-[#E2E3E4] text-center">
          <div className="px-1">
            <span className="text-[10px] font-normal text-[#808285] uppercase flex items-center justify-center gap-1">
              <GraduationCap className="h-2.5 w-2.5 text-[#9F1521]" />
              <span>Prodi</span>
            </span>
            <span className="font-heading font-bold text-xs text-[#111111] block mt-0.5">
              {programsCount} Jurusan
            </span>
          </div>

          <div className="px-1">
            <span className="text-[10px] font-normal text-[#808285] uppercase flex items-center justify-center gap-1">
              <CalendarCheck2 className="h-2.5 w-2.5 text-[#9F1521]" />
              <span>Semester</span>
            </span>
            <span className="font-heading font-bold text-xs text-[#111111] block mt-0.5">
              {semestersCount} Aktif
            </span>
          </div>

          <div className="px-1">
            <span className="text-[10px] font-normal text-[#808285] uppercase flex items-center justify-center gap-1">
              <BookOpen className="h-2.5 w-2.5 text-[#9F1521]" />
              <span>Katalog</span>
            </span>
            <span className="font-heading font-bold text-xs text-[#111111] block mt-0.5">
              {coursesCount} MK
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
