'use client';

import React from 'react';
import {
  Award,
  Users,
  GraduationCap,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export interface CoordinatorIdentityCardProps {
  coordinatorName?: string;
  nidn?: string;
  functionalTitle?: string;
  department?: string;
  accreditation?: string;
  averageIpk?: string;
  pendingApprovalsCount?: number;
  atRiskCount?: number;
  cohortsCount?: number;
}

export function CoordinatorIdentityCard({
  coordinatorName = 'Dr. Ir. Kaprodi Informatika, M.Kom.',
  nidn = '1005087502',
  functionalTitle = 'Ketua Program Studi (Kaprodi)',
  department = 'Teknik Informatika (S1)',
  accreditation = 'UNGGUL',
  averageIpk = '3.58',
  pendingApprovalsCount = 0,
  atRiskCount = 12,
  cohortsCount = 4,
}: CoordinatorIdentityCardProps) {
  return (
    <div className="w-full rounded-2xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4 font-sans relative overflow-hidden transition-all hover:shadow-retro-md">
      {/* 1. Header Identitas Kampus & Logo Resmi UIR */}
      <div className="flex items-center gap-2.5 pb-3 border-b-2 border-ink">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-xl border-2 border-ink bg-white p-0.5 flex items-center justify-center shrink-0 shadow-retro-xs overflow-hidden">
            <img
              src="/logo-ruangkampus.png"
              alt="Logo RuangKampus"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-base font-heading font-black text-ink tracking-tight block leading-tight whitespace-nowrap">
              Ruang<span style={{ color: '#ED1C24' }} className="text-[#ED1C24]">Kampus</span>
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-black uppercase tracking-wider block leading-tight mt-0.5 truncate">
              Ruang Kaprodi Terpadu
            </span>
          </div>
        </div>
      </div>

      {/* 2. Informasi Utama Kaprodi & Avatar */}
      <div className="flex items-center gap-3.5">
        <div className="h-14 w-14 sm:h-15 sm:w-15 rounded-xl border-2 border-ink bg-gray-soft flex items-center justify-center shrink-0 shadow-retro-sm">
          <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-ink" />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <h4
            className="font-heading font-black text-sm sm:text-base text-ink truncate leading-tight"
            title={coordinatorName}
          >
            {coordinatorName}
          </h4>
          <p className="font-mono text-xs font-bold text-gray-dark flex items-center gap-1">
            <span>NIDN</span>
            <span className="text-ink font-black">{nidn}</span>
          </p>
          <p className="text-xs font-bold text-ink/85 truncate">
            {functionalTitle}
          </p>
          <p className="text-xs font-bold text-black truncate">
            Prodi {department}
          </p>
        </div>
      </div>

      {/* 3. Panel Status Mutu & Akreditasi Program Studi */}
      <div className="rounded-xl border-2 border-ink bg-gray-soft/60 p-3 sm:p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading font-black text-xs text-ink uppercase tracking-wider">
            Akreditasi & Mutu Prodi
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-ink bg-surface text-ink text-xs font-mono font-bold shadow-retro-xs shrink-0 whitespace-nowrap">
            <Award className="h-3 w-3 text-primary shrink-0" />
            <span>Akreditasi: {accreditation}</span>
          </span>
        </div>

        {/* 3 Metrik Prodi Bersih Berbaris Simetris */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-ink/15 text-center">
          <div className="py-1 px-1 rounded-lg border border-ink bg-surface shadow-xs">
            <span className="block text-[10px] font-mono font-bold text-gray-dark uppercase">IPK Prodi</span>
            <span className="font-heading font-black text-xs sm:text-sm text-ink block mt-0.5">
              {averageIpk} / 4.0
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-ink bg-surface shadow-xs">
            <span className="block text-[10px] font-mono font-bold text-gray-dark uppercase">Revisi Nilai</span>
            <span className="font-heading font-black text-xs sm:text-sm text-ink block mt-0.5">
              {pendingApprovalsCount} Antrean
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-ink bg-surface shadow-xs">
            <span className="block text-[10px] font-mono font-bold text-gray-dark uppercase">At-Risk</span>
            <span className="font-heading font-black text-xs sm:text-sm text-ink block mt-0.5">
              {atRiskCount} Mhs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
