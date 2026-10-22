'use client';

import React from 'react';
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
            <span className="text-sm font-heading font-black text-ink tracking-tight block leading-tight whitespace-nowrap">
              Ruang<span style={{ color: '#ED1C24' }} className="text-[#ED1C24]">Kampus</span>
            </span>
            <h3 className="text-xs font-mono font-bold text-gray-dark uppercase tracking-wider block leading-tight mt-0.5 truncate">
              Security Operations Center
            </h3>
          </div>
        </div>
      </div>

      {/* 2. Informasi Utama Admin & Avatar */}
      <div className="flex items-center gap-3.5">
        <div className="h-14 w-14 sm:h-15 sm:w-15 rounded-xl border-2 border-ink bg-gray-soft flex items-center justify-center shrink-0 shadow-retro-sm">
          <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-ink" />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <h4
            className="font-heading font-black text-sm sm:text-base text-ink truncate leading-tight"
            title={adminName}
          >
            {adminName}
          </h4>
          <p className="font-mono text-xs font-bold text-gray-dark flex items-center gap-1">
            <span>LEVEL</span>
            <span className="text-ink font-black">SUPER_ADMIN (ROOT)</span>
          </p>
          <p className="text-xs font-bold text-ink/85 truncate">
            {roleTitle}
          </p>
          <p className="text-[11px] font-medium text-gray-dark truncate">
            Integritas: Immutable Append-Only
          </p>
        </div>
      </div>

      {/* 3. Panel Status Keamanan Platform */}
      <div className="rounded-xl border-2 border-ink bg-gray-soft/60 p-3 sm:p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading font-black text-xs text-ink uppercase tracking-wider">
            Status Keamanan Platform
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-ink bg-surface text-ink text-[11px] font-mono font-bold shadow-retro-xs shrink-0 whitespace-nowrap">
            <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
            <span>100% Terlindungi</span>
          </span>
        </div>

        {/* 3 Metrik Keamanan Bersih Berbaris Simetris */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-ink/15 text-center">
          <div className="py-1 px-1 rounded-lg border border-ink bg-surface shadow-xs">
            <span className="block text-[10px] font-mono font-bold text-gray-dark uppercase flex items-center justify-center gap-1">
              <Activity className="h-3 w-3 text-ink" />
              <span>Audit</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-ink block mt-0.5">
              {auditLogsCount} Event
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-ink bg-surface shadow-xs">
            <span className="block text-[10px] font-mono font-bold text-gray-dark uppercase flex items-center justify-center gap-1">
              <Server className="h-3 w-3 text-ink" />
              <span>Sesi</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-ink block mt-0.5">
              {loginEventsCount} Aktif
            </span>
          </div>

          <div className="py-1 px-1 rounded-lg border border-ink bg-surface shadow-xs">
            <span className="block text-[10px] font-mono font-bold text-gray-dark uppercase flex items-center justify-center gap-1">
              <Database className="h-3 w-3 text-ink" />
              <span>RLS</span>
            </span>
            <span className="font-heading font-black text-xs sm:text-sm text-ink block mt-0.5">
              {rlsTablesCount} Tabel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
