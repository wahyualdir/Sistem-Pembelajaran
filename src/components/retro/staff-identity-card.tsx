'use client';

import React from 'react';
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
  campusOffice = 'Gedung Rektorat UIR Lt. 1',
  programsCount = 8,
  semestersCount = 4,
  coursesCount = 36,
}: StaffIdentityCardProps) {
  return (
    <div className="w-full rounded-2xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4 font-sans relative overflow-hidden transition-all hover:shadow-retro-md">
      {/* 1. Header Identitas Kampus & Logo Resmi UIR */}
      <div className="flex items-center justify-between gap-2.5 pb-3 border-b-2 border-ink">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-xl border-2 border-ink bg-white p-0.5 flex items-center justify-center shrink-0 shadow-retro-xs overflow-hidden">
            <img
              src="/logo-uir.png"
              alt="Logo Universitas Islam Riau"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-heading font-black text-ink uppercase tracking-tight block leading-tight whitespace-nowrap">
              UNIVERSITAS ISLAM RIAU
            </span>
            <h3 className="text-[10px] font-mono font-bold text-gray-dark uppercase tracking-wider block leading-tight mt-0.5 truncate">
              Biro BAAK Terpadu
            </h3>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border-2 border-ink bg-surface text-ink text-[10px] font-mono font-bold shrink-0 shadow-retro-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>Aktif</span>
        </span>
      </div>

      {/* 2. Informasi Utama Petugas & Avatar */}
      <div className="flex items-center gap-3.5">
        <div className="h-14 w-14 sm:h-15 sm:w-15 rounded-xl border-2 border-ink bg-gray-soft flex items-center justify-center shrink-0 shadow-retro-sm">
          <Briefcase className="h-7 w-7 text-ink" />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <h4
            className="font-heading font-black text-sm sm:text-base text-ink truncate leading-tight"
            title={staffName}
          >
            {staffName}
          </h4>
          <p className="font-mono text-xs font-bold text-gray-dark flex items-center gap-1">
            <span>NIP</span>
            <span className="text-ink font-black">{nip}</span>
          </p>
          <p className="text-xs font-bold text-ink/85 truncate">
            {unit}
          </p>
          <p className="text-[11px] font-medium text-gray-dark truncate">
            {campusOffice}
          </p>
        </div>
      </div>

      {/* 3. Panel Status Operasional BAAK */}
      <div className="rounded-xl border-2 border-ink bg-gray-soft/60 p-3 sm:p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading font-black text-xs text-ink uppercase tracking-wider">
            Status Operasional BAAK
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-ink bg-surface text-ink text-[11px] font-mono font-bold shadow-retro-xs shrink-0 whitespace-nowrap">
            <CalendarCheck2 className="h-3 w-3 text-emerald-600 shrink-0" />
            <span>Semester Ganjil 2026/2027</span>
          </span>
        </div>

        {/* 3 Metrik Master Data Akademik */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-ink/15 text-center">
          <div className="py-1 px-1 rounded-lg border border-ink bg-surface shadow-xs">
            <span className="block text-[10px] font-mono font-bold text-gray-dark uppercase flex items-center justify-center gap-1">
              <GraduationCap className="h-3 w-3 text-ink" />
              <span>Prodi</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-ink block mt-0.5">
              {programsCount} Jurusan
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-ink bg-surface shadow-xs">
            <span className="block text-[10px] font-mono font-bold text-gray-dark uppercase flex items-center justify-center gap-1">
              <CalendarCheck2 className="h-3 w-3 text-ink" />
              <span>Semester</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-ink block mt-0.5">
              {semestersCount} Aktif
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-ink bg-surface shadow-xs">
            <span className="block text-[10px] font-mono font-bold text-gray-dark uppercase flex items-center justify-center gap-1">
              <BookOpen className="h-3 w-3 text-ink" />
              <span>Katalog</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-ink block mt-0.5">
              {coursesCount} MK
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
