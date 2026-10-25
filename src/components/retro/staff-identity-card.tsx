'use client';

import React from 'react';
import Image from 'next/image';
import {
  Building2,
  ShieldCheck,
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
  campusOffice = 'Gedung Rektorat Lt. 1',
  programsCount = 8,
  semestersCount = 4,
  coursesCount = 36,
}: StaffIdentityCardProps) {
  return (
    <div className="w-full rounded-2xl border-2 border-[#7A756D] bg-white p-4 sm:p-5 shadow-xs space-y-4 font-sans relative overflow-hidden transition-all hover:shadow-xs">
      {/* 1. Header Identitas Kampus & Logo Resmi */}
      <div className="flex items-center gap-2.5 pb-3 border-b-2 border-[#D6D3CB]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-xl border-2 border-[#7A756D] bg-white p-0.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
            <Image
              src="/logo-ruangkampus.png"
              alt="Logo RuangKampus"
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-base font-heading font-black text-[#1C1917] tracking-tight block leading-tight whitespace-nowrap">
              Ruang<span className="text-[#C2553A]">Kampus</span>
            </span>
            <h3 className="text-xs sm:text-sm font-sans font-extrabold text-[#853827] uppercase tracking-wider block leading-tight mt-0.5 truncate">
              Biro BAAK Terpadu
            </h3>
          </div>
        </div>
      </div>

      {/* 2. Informasi Utama Petugas & Avatar */}
      <div className="flex items-center gap-3.5">
        <div className="h-14 w-14 sm:h-15 sm:w-15 rounded-xl border-2 border-[#7A756D] bg-[#ECE9D8] flex items-center justify-center shrink-0 shadow-2xs">
          <Briefcase className="h-7 w-7 text-[#1C1917]" />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <h4
            className="font-heading font-black text-sm sm:text-base text-[#1C1917] truncate leading-tight"
            title={staffName}
          >
            {staffName}
          </h4>
          <p className="font-sans text-xs font-extrabold text-[#57534E] flex items-center gap-1">
            <span>NIP</span>
            <span className="text-[#1C1917] font-black">{nip}</span>
          </p>
          <p className="text-xs font-bold text-[#1C1917]/85 truncate">
            {unit}
          </p>
          <p className="text-xs font-bold text-[#1C1917] truncate">
            {campusOffice}
          </p>
        </div>
      </div>

      {/* 3. Panel Status Operasional BAAK */}
      <div className="rounded-xl border-2 border-[#7A756D] bg-[#ECE9D8]/80 p-3 sm:p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading font-black text-xs text-[#1C1917] uppercase tracking-wider">
            Status Operasional BAAK
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#7A756D] bg-white text-[#1C1917] text-xs font-sans font-extrabold shadow-2xs shrink-0 whitespace-nowrap">
            <CalendarCheck2 className="h-3 w-3 text-emerald-600 shrink-0" />
            <span>Semester Ganjil 2026/2027</span>
          </span>
        </div>

        {/* 3 Metrik Master Data Akademik */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-ink/15 text-center">
          <div className="py-1 px-1 rounded-lg border border-[#7A756D] bg-white shadow-xs">
            <span className="block text-xs font-sans font-extrabold text-[#57534E] uppercase flex items-center justify-center gap-1">
              <GraduationCap className="h-3 w-3 text-[#1C1917]" />
              <span>Prodi</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-[#1C1917] block mt-0.5">
              {programsCount} Jurusan
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-[#7A756D] bg-white shadow-xs">
            <span className="block text-xs font-sans font-extrabold text-[#57534E] uppercase flex items-center justify-center gap-1">
              <CalendarCheck2 className="h-3 w-3 text-[#1C1917]" />
              <span>Semester</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-[#1C1917] block mt-0.5">
              {semestersCount} Aktif
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-[#7A756D] bg-white shadow-xs">
            <span className="block text-xs font-sans font-extrabold text-[#57534E] uppercase flex items-center justify-center gap-1">
              <BookOpen className="h-3 w-3 text-[#1C1917]" />
              <span>Katalog</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-[#1C1917] block mt-0.5">
              {coursesCount} MK
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
