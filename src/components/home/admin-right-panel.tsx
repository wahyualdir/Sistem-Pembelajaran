'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronRight,
  Users,
  Lock,
  FileText,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/modules/academic/home-actions';
import { getJakartaTime } from '@/modules/academic/home-schedule-utils';

interface AdminRightPanelProps {
  auditLogsCount: number;
  loginEventsCount: number;
  agenda?: AgendaItem[];
  activeTab: 'keamanan' | 'quick-actions';
  onTabChange: (tab: 'keamanan' | 'quick-actions') => void;
}

export function AdminRightPanel({
  auditLogsCount,
  loginEventsCount,
  agenda = [],
  activeTab,
  onTabChange,
}: AdminRightPanelProps) {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const jakarta = getJakartaTime(currentTime);

  const defaultAgenda: AgendaItem[] =
    agenda.length > 0
      ? agenda
      : [
          {
            id: 'adm-ag-1',
            dateStr: 'Hari Ini',
            dayName: 'Hari Ini',
            time: '00:00 WIB',
            title: 'Automated Security Snapshot & Log Deduplication',
            type: 'KELAS',
            href: '/admin/system',
          },
          {
            id: 'adm-ag-2',
            dateStr: 'Besok',
            dayName: 'Besok',
            time: '03:00 WIB',
            title: 'Verifikasi Integritas RLS & Rotasi Kunci Sesi',
            type: 'KELAS',
            href: '/admin/policies',
          },
          {
            id: 'adm-ag-3',
            dateStr: 'Minggu',
            dayName: 'Minggu',
            time: '01:00 WIB',
            title: 'Audit Rutin Hak Akses Role & Log Impersonasi',
            type: 'KELAS',
            href: '/admin/roles',
          },
        ];

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* 1. Pengalih Dua Tab Tel-U Bersih */}
      <div className="flex items-center p-1 rounded-xl border border-[#E2E3E4] bg-[#F3F3F4]">
        <button
          type="button"
          onClick={() => onTabChange('keamanan')}
          className={cn(
            'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'keamanan'
              ? 'bg-[#FFFFFF] text-[#9F1521] font-bold shadow-2xs'
              : 'text-[#808285] hover:text-[#111111]'
          )}
        >
          Keamanan
        </button>
        <button
          type="button"
          onClick={() => onTabChange('quick-actions')}
          className={cn(
            'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'quick-actions'
              ? 'bg-[#FFFFFF] text-[#9F1521] font-bold shadow-2xs'
              : 'text-[#808285] hover:text-[#111111]'
          )}
        >
          Aksi Cepat
        </button>
      </div>

      {/* ========================================================= */}
      {/* KONDISI A: KEAMANAN (OPEN DIVIDED SECTIONS)               */}
      {/* ========================================================= */}
      {activeTab === 'keamanan' && (
        <div className="flex flex-col divide-y divide-[#E2E3E4] animate-fade-in pb-24">
          {/* 1. Ringkasan Metrik Keamanan */}
          <div className="pb-5">
            <div className="grid grid-cols-3 divide-x divide-[#E2E3E4] text-center">
              <div className="px-2">
                <span className="text-[11px] font-normal text-[#808285] block">Audit Log</span>
                <span className="font-heading font-extrabold text-xl text-[#111111] tabular-nums">
                  {auditLogsCount}
                </span>
              </div>
              <div className="px-2">
                <span className="text-[11px] font-normal text-[#808285] block">Sesi Aktif</span>
                <span className="font-heading font-extrabold text-xl text-[#111111] tabular-nums">
                  {loginEventsCount}
                </span>
              </div>
              <div className="px-2">
                <span className="text-[11px] font-normal text-[#808285] block">RLS Status</span>
                <span className="font-heading font-bold text-sm text-[#059669] block mt-1">
                  100% OK
                </span>
              </div>
            </div>
          </div>

          {/* 2. Aksi Cepat Administrator */}
          <div className="py-5 space-y-3">
            <h4 className="font-heading font-bold text-[11px] uppercase tracking-wider text-[#808285]">
              Aksi Cepat Admin
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/users"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
              >
                <Users className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Pengguna</span>
              </Link>
              <Link
                href="/admin/system"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
              >
                <FileText className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Audit Trail</span>
              </Link>
              <Link
                href="/admin/policies"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
              >
                <Lock className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Kebijakan</span>
              </Link>
              <Link
                href="/admin/roles"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
              >
                <Server className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Manajemen Role</span>
              </Link>
            </div>
          </div>

          {/* 3. Kalender Mini Bulan Berjalan */}
          <div className="py-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-[#9F1521]" />
                <span suppressHydrationWarning className="font-heading font-bold text-sm text-[#111111]">
                  {jakarta.monthName} {jakarta.year}
                </span>
              </div>
              <span suppressHydrationWarning className="text-xs font-mono font-normal text-[#808285]">
                {jakarta.shortTimeString}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                <span key={d} className="font-medium text-[#808285] py-0.5 text-[11px]">
                  {d}
                </span>
              ))}

              <div />
              <div />
              <div />
              <div />

              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isToday = day === jakarta.dateNum;
                const hasEvent = [1, 7, 14, 21, 28].includes(day);

                return (
                  <div
                    key={day}
                    className={cn(
                      'h-7 rounded-lg flex flex-col items-center justify-center text-xs relative transition-colors',
                      isToday
                        ? 'bg-[#9F1521] text-white font-bold'
                        : hasEvent
                        ? 'bg-[#F3F3F4] text-[#111111] font-semibold'
                        : 'text-[#58595B] hover:bg-[#F3F3F4]'
                    )}
                  >
                    <span>{day}</span>
                    {hasEvent && !isToday && (
                      <span className="w-1 h-1 rounded-full bg-[#9F1521] absolute bottom-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Agenda Sistem 7 Hari */}
          <div className="pt-5 space-y-3">
            <h4 className="font-heading font-bold text-[11px] uppercase tracking-wider text-[#808285]">
              Agenda Pemeliharaan Sistem
            </h4>

            <div className="divide-y divide-[#E2E3E4]">
              {defaultAgenda.map((ag) => (
                <Link
                  key={ag.id}
                  href={ag.href}
                  className="block group py-2.5 first:pt-0 last:pb-0 transition-colors"
                >
                  <span className="text-[11px] font-normal text-[#808285] block">
                    {ag.dayName} • {ag.time}
                  </span>
                  <p className="font-heading font-bold text-xs sm:text-sm text-[#111111] leading-snug group-hover:text-[#9F1521] transition-colors">
                    {ag.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* KONDISI B: AKSI CEPAT SISTEM                              */}
      {/* ========================================================= */}
      {activeTab === 'quick-actions' && (
        <div className="flex flex-col gap-4 animate-fade-in pb-24">
          <div className="space-y-2">
            <h4 className="font-heading font-bold text-base text-[#111111]">
              Kontrol Keamanan Platform
            </h4>
            <p className="text-xs text-[#58595B] font-normal leading-relaxed">
              Administrator mengontrol otentikasi peran, pembatasan rate limit, isolasi multi-tenant, dan perlindungan RLS.
            </p>
          </div>

          <div className="divide-y divide-[#E2E3E4] border-y border-[#E2E3E4]">
            <Link
              href="/admin/users"
              className="flex items-center justify-between py-3 text-xs font-semibold text-[#111111] hover:text-[#9F1521] transition-colors"
            >
              <span>Daftar Pengguna &amp; Reset Akses</span>
              <ChevronRight className="h-4 w-4 text-[#808285]" />
            </Link>
            <Link
              href="/admin/system"
              className="flex items-center justify-between py-3 text-xs font-semibold text-[#111111] hover:text-[#9F1521] transition-colors"
            >
              <span>Audit Trail &amp; Log Transaksi</span>
              <ChevronRight className="h-4 w-4 text-[#808285]" />
            </Link>
            <Link
              href="/admin/policies"
              className="flex items-center justify-between py-3 text-xs font-semibold text-[#111111] hover:text-[#9F1521] transition-colors"
            >
              <span>Kebijakan Institusional (Policies)</span>
              <ChevronRight className="h-4 w-4 text-[#808285]" />
            </Link>
          </div>

          <Link
            href="/admin/roles"
            className="flex items-center justify-between py-2.5 px-4 rounded-full bg-[#9F1521] text-white hover:bg-[#8F131E] transition-colors text-xs font-bold"
          >
            <span>Matriks Otorisasi Peran (RBAC)</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
