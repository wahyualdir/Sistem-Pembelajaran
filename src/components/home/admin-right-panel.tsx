'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronRight,
  ShieldAlert,
  Users,
  Lock,
  FileText,
  Server,
  Activity,
  UserCheck,
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
    <div className="flex flex-col gap-5">
      {/* 1. Pengalih Dua Tab Retro */}
      <div className="flex items-center p-1.5 rounded-xl border-2 border-ink bg-gray-soft shadow-xs">
        <button
          type="button"
          onClick={() => onTabChange('keamanan')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'keamanan'
              ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
              : 'text-ink hover:bg-ink/5'
          )}
        >
          Keamanan
        </button>
        <button
          type="button"
          onClick={() => onTabChange('quick-actions')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'quick-actions'
              ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
              : 'text-ink hover:bg-ink/5'
          )}
        >
          Aksi Cepat
        </button>
      </div>

      {/* ========================================================= */}
      {/* KONDISI A: KEAMANAN                                       */}
      {/* ========================================================= */}
      {activeTab === 'keamanan' && (
        <div className="flex flex-col gap-5 animate-fade-in pb-24">
          {/* 1. Ringkasan Baris Metrik Keamanan */}
          <div className="right-panel-stats-card p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro">
            <div className="stats-responsive-layout">
              <div className="stats-responsive-item">
                <span className="stats-label text-xs sm:text-sm font-sans font-bold text-black uppercase tracking-wider shrink-0">
                  Audit
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-black text-base sm:text-lg text-ink tabular-nums">
                    {auditLogsCount}
                  </p>
                  <span className="text-xs font-semibold text-ink bg-gray-soft px-1.5 py-0.5 rounded border border-ink/20 whitespace-normal text-center">
                    Immutable
                  </span>
                </div>
              </div>

              <div className="stats-responsive-item">
                <span className="stats-label text-xs sm:text-sm font-sans font-bold text-black uppercase tracking-wider shrink-0">
                  Sesi
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-black text-base sm:text-lg text-ink tabular-nums">
                    {loginEventsCount}
                  </p>
                  <span className="text-xs font-medium text-gray-dark whitespace-normal text-center">
                    Aktif
                  </span>
                </div>
              </div>

              <div className="stats-responsive-item">
                <span className="stats-label text-xs sm:text-sm font-sans font-bold text-black uppercase tracking-wider shrink-0">
                  Status
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-bold text-sm sm:text-base text-emerald-600 whitespace-normal text-center">
                    100% OK
                  </p>
                  <span className="text-xs font-semibold text-ink whitespace-normal text-center">
                    RLS Aktif
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Aksi Cepat Administrator */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro space-y-3">
            <h4 className="font-heading font-bold text-xs sm:text-sm uppercase tracking-wider text-black">
              Aksi Cepat Admin
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/users"
                className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold transition-all shadow-xs"
              >
                <Users className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Pengguna</span>
              </Link>
              <Link
                href="/admin/system"
                className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold transition-all shadow-xs"
              >
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Audit Trail</span>
              </Link>
              <Link
                href="/admin/policies"
                className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold transition-all shadow-xs"
              >
                <Lock className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Kebijakan</span>
              </Link>
              <Link
                href="/admin/roles"
                className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold transition-all shadow-xs"
              >
                <Server className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Manajemen Role</span>
              </Link>
            </div>
          </div>

          {/* 3. Kalender Mini Bulan Berjalan */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro space-y-3">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2.5">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-ink" />
                <span className="font-heading font-bold text-sm text-ink">
                  {jakarta.monthName} {jakarta.year}
                </span>
              </div>
              <span className="text-xs font-sans font-bold bg-gray-soft px-1.5 py-0.5 rounded border border-ink text-gray-dark">
                {jakarta.shortTimeString}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-sans">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                <span key={d} className="font-bold text-gray-dark py-0.5 text-xs">
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
                      'h-7 rounded-md flex flex-col items-center justify-center font-bold text-xs relative transition-colors',
                      isToday
                        ? 'bg-ink text-white shadow-xs'
                        : hasEvent
                        ? 'bg-gray-soft text-ink border border-ink/40'
                        : 'text-ink hover:bg-ink/5'
                    )}
                  >
                    <span>{day}</span>
                    {hasEvent && !isToday && (
                      <span className="w-1 h-1 rounded-full bg-primary-dark absolute bottom-0.5" />
                    )}
                    {isToday && (
                      <span className="w-1 h-1 rounded-full bg-primary absolute bottom-0.5" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 pt-2 text-xs font-sans text-gray-dark border-t border-ink/10">
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-ink" /> Hari Ini
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-dark" /> Pemeliharaan
              </span>
            </div>
          </div>

          {/* 4. Agenda Sistem 7 Hari */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro space-y-3">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2.5">
              <h4 className="font-heading font-bold text-sm text-ink uppercase tracking-wider">
                Agenda Pemeliharaan Sistem
              </h4>
            </div>

            <div className="space-y-2.5">
              {defaultAgenda.map((ag) => (
                <Link
                  key={ag.id}
                  href={ag.href}
                  className="block group p-2.5 rounded-lg border border-ink/20 hover:border-ink bg-gray-soft/40 hover:bg-gray-soft transition-all"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-sans font-bold text-gray-dark">
                      {ag.dayName} • {ag.time}
                    </span>
                    <p className="font-heading font-bold text-sm text-ink leading-snug break-words group-hover:underline">
                      {ag.title}
                    </p>
                  </div>
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
          <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-white shadow-retro space-y-3">
            <h4 className="font-heading font-bold text-sm text-ink uppercase tracking-wider">
              Kontrol Keamanan Platform
            </h4>
            <p className="text-xs text-gray-dark font-medium">
              Administrator mengontrol otentikasi peran, pembatasan rate limit, isolasi multi-tenant, dan perlindungan RLS.
            </p>
            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white transition-all text-xs font-bold shadow-xs"
              >
                <span>Daftar Pengguna & Reset Akses</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin/system"
                className="flex items-center justify-between p-3 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white transition-all text-xs font-bold shadow-xs"
              >
                <span>Audit Trail & Log Transaksi</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin/policies"
                className="flex items-center justify-between p-3 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white transition-all text-xs font-bold shadow-xs"
              >
                <span>Kebijakan Institusional (Policies)</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin/roles"
                className="flex items-center justify-between p-3 rounded-lg border-2 border-ink bg-black text-white hover:bg-neutral-800 transition-all text-xs font-bold shadow-retro-xs"
              >
                <span>Matriks Otorisasi Peran (RBAC)</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
