'use client';

import React from 'react';
import {
  Award,
  GraduationCap,
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
}: CoordinatorIdentityCardProps) {
  return (
    <div className="w-full rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] p-4 space-y-3.5 font-sans">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl border border-[#E2E3E4] bg-[#F3F3F4] flex items-center justify-center shrink-0">
          <GraduationCap className="h-5 w-5 text-[#9F1521]" />
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F1521] block">
            Pimpinan Program Studi
          </span>
          <h4
            className="font-heading font-extrabold text-sm sm:text-base text-[#111111] truncate leading-tight"
            title={coordinatorName}
          >
            {coordinatorName}
          </h4>
          <p className="text-xs font-normal text-[#58595B] truncate">
            NIDN {nidn} • Prodi {department}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-[#E2E3E4] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#808285]">
            Akreditasi Prodi
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9F1521]">
            <Award className="h-3 w-3 shrink-0" />
            <span>{accreditation}</span>
          </span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-[#E2E3E4] pt-2 border-t border-[#E2E3E4] text-center">
          <div className="px-1">
            <span className="text-[10px] font-normal text-[#808285] uppercase block">IPK Prodi</span>
            <span className="font-heading font-bold text-xs text-[#111111] block mt-0.5">
              {averageIpk} / 4.0
            </span>
          </div>

          <div className="px-1">
            <span className="text-[10px] font-normal text-[#808285] uppercase block">Revisi Nilai</span>
            <span className="font-heading font-bold text-xs text-[#111111] block mt-0.5">
              {pendingApprovalsCount} Antrean
            </span>
          </div>

          <div className="px-1">
            <span className="text-[10px] font-normal text-[#808285] uppercase block">At-Risk</span>
            <span className="font-heading font-bold text-xs text-[#111111] block mt-0.5">
              {atRiskCount} Mhs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
