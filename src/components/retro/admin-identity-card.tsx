'use client';

import React from 'react';
import Image from 'next/image';
import {
  ShieldAlert,
  Lock,
  ShieldCheck,
  Server,
  Activity,
  Database,
} from 'lucide-react';

export interface AdminIdentityCardProps {
  adminName?: string;
  roleTitle?: string;
  auditLogsCount?: number;
  loginEventsCount?: number;
  rlsTablesCount?: number;
}

export function AdminIdentityCard({
  adminName = 'Super Administrator',
  roleTitle = 'Pusat Keamanan & Audit Sistem',
  auditLogsCount = 10,
  loginEventsCount = 10,
  rlsTablesCount = 147,
}: AdminIdentityCardProps) {
  return (
    <div className="w-full rounded-2xl border-2 border-[#7A756D] bg-white p-4 sm:p-5 shadow-xs space-y-4 font-sans relative overflow-hidden transition-all hover:shadow-xs">
      {/* 1. Header Identitas Kampus & Logo Resmi UIR */}
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
              Security Operations Center
            </h3>
          </div>
        </div>
      </div>

      {/* 2. Informasi Utama Admin & Avatar */}
      <div className="flex items-center gap-3.5">
        <div className="h-14 w-14 sm:h-15 sm:w-15 rounded-xl border-2 border-[#7A756D] bg-[#ECE9D8] flex items-center justify-center shrink-0 shadow-2xs">
          <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-[#1C1917]" />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <h4
            className="font-heading font-black text-sm sm:text-base text-[#1C1917] truncate leading-tight"
            title={adminName}
          >
            {adminName}
          </h4>
          <p className="font-sans text-xs font-extrabold text-[#57534E] flex items-center gap-1">
            <span>LEVEL</span>
            <span className="text-[#1C1917] font-black">SUPER_ADMIN (ROOT)</span>
          </p>
          <p className="text-xs font-bold text-[#1C1917]/85 truncate">
            {roleTitle}
          </p>
          <p className="text-xs font-bold text-[#1C1917] truncate">
            Integritas: Immutable Append-Only
          </p>
        </div>
      </div>

      {/* 3. Panel Status Keamanan Platform */}
      <div className="rounded-xl border-2 border-[#7A756D] bg-[#ECE9D8]/80 p-3 sm:p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading font-black text-xs text-[#1C1917] uppercase tracking-wider">
            Status Keamanan Platform
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#7A756D] bg-white text-[#1C1917] text-xs font-sans font-extrabold shadow-2xs shrink-0 whitespace-nowrap">
            <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
            <span>100% Terlindungi</span>
          </span>
        </div>

        {/* 3 Metrik Keamanan Bersih Berbaris Simetris */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-ink/15 text-center">
          <div className="py-1 px-1 rounded-lg border border-[#7A756D] bg-white shadow-xs">
            <span className="block text-xs font-sans font-extrabold text-[#57534E] uppercase flex items-center justify-center gap-1">
              <Activity className="h-3 w-3 text-[#1C1917]" />
              <span>Audit</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-[#1C1917] block mt-0.5">
              {auditLogsCount} Event
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-[#7A756D] bg-white shadow-xs">
            <span className="block text-xs font-sans font-extrabold text-[#57534E] uppercase flex items-center justify-center gap-1">
              <Server className="h-3 w-3 text-[#1C1917]" />
              <span>Sesi</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-[#1C1917] block mt-0.5">
              {loginEventsCount} Aktif
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-[#7A756D] bg-white shadow-xs">
            <span className="block text-xs font-sans font-extrabold text-[#57534E] uppercase flex items-center justify-center gap-1">
              <Database className="h-3 w-3 text-[#1C1917]" />
              <span>RLS</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-[#1C1917] block mt-0.5">
              {rlsTablesCount} Tabel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
