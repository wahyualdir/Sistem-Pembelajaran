'use client';

import React from 'react';
import {
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
    <div className="w-full rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] p-4 space-y-3.5 font-sans">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl border border-[#E2E3E4] bg-[#F3F3F4] flex items-center justify-center shrink-0">
          <Lock className="h-5 w-5 text-[#9F1521]" />
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F1521] block">
            Security Operations Center
          </span>
          <h4
            className="font-heading font-extrabold text-sm sm:text-base text-[#111111] truncate leading-tight"
            title={adminName}
          >
            {adminName}
          </h4>
          <p className="text-xs font-normal text-[#58595B] truncate">
            {roleTitle}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-[#E2E3E4] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#808285]">
            Proteksi Platform
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#059669]">
            <ShieldCheck className="h-3 w-3 shrink-0" />
            <span>100% Terlindungi</span>
          </span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-[#E2E3E4] pt-2 border-t border-[#E2E3E4] text-center">
          <div className="px-1">
            <span className="text-[10px] font-normal text-[#808285] uppercase flex items-center justify-center gap-1">
              <Activity className="h-2.5 w-2.5 text-[#9F1521]" />
              <span>Audit</span>
            </span>
            <span className="font-heading font-bold text-xs text-[#111111] block mt-0.5">
              {auditLogsCount} Event
            </span>
          </div>

          <div className="px-1">
            <span className="text-[10px] font-normal text-[#808285] uppercase flex items-center justify-center gap-1">
              <Server className="h-2.5 w-2.5 text-[#9F1521]" />
              <span>Sesi</span>
            </span>
            <span className="font-heading font-bold text-xs text-[#111111] block mt-0.5">
              {loginEventsCount} Aktif
            </span>
          </div>

          <div className="px-1">
            <span className="text-[10px] font-normal text-[#808285] uppercase flex items-center justify-center gap-1">
              <Database className="h-2.5 w-2.5 text-[#9F1521]" />
              <span>RLS</span>
            </span>
            <span className="font-heading font-bold text-xs text-[#111111] block mt-0.5">
              {rlsTablesCount} Tabel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
