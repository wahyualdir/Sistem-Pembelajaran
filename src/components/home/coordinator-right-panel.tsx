'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronRight,
  Award,
  AlertTriangle,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/modules/academic/home-actions';
import { getJakartaTime } from '@/modules/academic/home-schedule-utils';

interface CoordinatorRightPanelProps {
  pendingApprovalsCount: number;
  approvedCount: number;
  rejectedCount: number;
  atRiskCount: number;
  agenda?: AgendaItem[];
  activeTab: 'hari-ini' | 'quick-actions';
  onTabChange: (tab: 'hari-ini' | 'quick-actions') => void;
}

export function CoordinatorRightPanel({
  pendingApprovalsCount,
  approvedCount,
  rejectedCount,
  atRiskCount,
  agenda = [],
  activeTab,
  onTabChange,
}: CoordinatorRightPanelProps) {
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
            id: 'coord-ag-1',
            dateStr: 'Hari Ini',
            dayName: 'Hari Ini',
            time: '10:00 WIB',
            title: 'Validasi Pengajuan Revisi Nilai Dosen Pengampu',
            type: 'UJIAN',
            href: '/coordinator/approvals',
          },
          {
            id: 'coord-ag-2',
            dateStr: 'Besok',
            dayName: 'Besok',
            time: '13:30 WIB',
            title: 'Monitoring Mahasiswa Berisiko (Early Warning System)',
            type: 'KELAS',
            href: '/coordinator/monitoring',
          },
          {
            id: 'coord-ag-3',
            dateStr: 'Kamis',
            dayName: 'Kamis',
            time: '09:00 WIB',
            title: 'Rapat Tinjauan Manajemen Mutu & Kurikulum OBE',
            type: 'KELAS',
            href: '/coordinator/reports',
          },
        ];

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* 1. Pengalih Dua Tab Tel-U Bersih */}
      <div className="flex items-center p-1 rounded-xl border border-[#E2E3E4] bg-[#F3F3F4]">
        <button
          type="button"
          onClick={() => onTabChange('hari-ini')}
          className={cn(
            'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'hari-ini'
              ? 'bg-[#FFFFFF] text-[#9F1521] font-bold shadow-2xs'
              : 'text-[#808285] hover:text-[#111111]'
          )}
        >
          Hari Ini
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
      {/* KONDISI A: HARI INI (OPEN DIVIDED SECTIONS)               */}
      {/* ========================================================= */}
      {activeTab === 'hari-ini' && (
        <div className="flex flex-col divide-y divide-[#E2E3E4] animate-fade-in pb-24">
          {/* 1. Ringkasan Metrik Kaprodi */}
          <div className="pb-5">
            <div className="grid grid-cols-3 divide-x divide-[#E2E3E4] text-center">
              <div className="px-2">
                <span className="text-[11px] font-normal text-[#808285] block">Antrean ACC</span>
                <span className="font-heading font-extrabold text-xl text-[#9F1521] tabular-nums">
                  {pendingApprovalsCount}
                </span>
              </div>
              <div className="px-2">
                <span className="text-[11px] font-normal text-[#808285] block">Diputuskan</span>
                <span className="font-heading font-extrabold text-xl text-[#111111] tabular-nums">
                  {approvedCount + rejectedCount}
                </span>
              </div>
              <div className="px-2">
                <span className="text-[11px] font-normal text-[#808285] block">At-Risk</span>
                <span className="font-heading font-extrabold text-xl text-[#111111] tabular-nums">
                  {atRiskCount}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Aksi Cepat Kaprodi */}
          <div className="py-5 space-y-3">
            <h4 className="font-heading font-bold text-[11px] uppercase tracking-wider text-[#808285]">
              Aksi Cepat Kaprodi
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/coordinator/approvals"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
              >
                <FileCheck className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">ACC Nilai</span>
              </Link>
              <Link
                href="/coordinator/monitoring"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Early Warning</span>
              </Link>
              <Link
                href="/coordinator/evaluations"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
              >
                <Award className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">EDOM Dosen</span>
              </Link>
              <Link
                href="/coordinator/reports"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
              >
                <TrendingUp className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Laporan Mutu</span>
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
                const hasEvent = [4, 11, 18, 24, 29].includes(day);

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

          {/* 4. Agenda Kaprodi 7 Hari */}
          <div className="pt-5 space-y-3">
            <h4 className="font-heading font-bold text-[11px] uppercase tracking-wider text-[#808285]">
              Agenda Pimpinan Prodi
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
      {/* KONDISI B: AKSI CEPAT PRODI                               */}
      {/* ========================================================= */}
      {activeTab === 'quick-actions' && (
        <div className="flex flex-col gap-4 animate-fade-in pb-24">
          <div className="space-y-2">
            <h4 className="font-heading font-bold text-base text-[#111111]">
              Evaluasi &amp; Mutu Akademik
            </h4>
            <p className="text-xs text-[#58595B] font-normal leading-relaxed">
              Kaprodi memantau kelancaran belajar mengajar, penegakan integritas nilai, dan peringatan dini mahasiswa berisiko.
            </p>
          </div>

          <div className="divide-y divide-[#E2E3E4] border-y border-[#E2E3E4]">
            <Link
              href="/coordinator/approvals"
              className="flex items-center justify-between py-3 text-xs font-semibold text-[#111111] hover:text-[#9F1521] transition-colors"
            >
              <span>Daftar Persetujuan Perubahan Nilai</span>
              <ChevronRight className="h-4 w-4 text-[#808285]" />
            </Link>
            <Link
              href="/coordinator/monitoring"
              className="flex items-center justify-between py-3 text-xs font-semibold text-[#111111] hover:text-[#9F1521] transition-colors"
            >
              <span>Monitoring Mahasiswa Berisiko (EWS)</span>
              <ChevronRight className="h-4 w-4 text-[#808285]" />
            </Link>
            <Link
              href="/coordinator/evaluations"
              className="flex items-center justify-between py-3 text-xs font-semibold text-[#111111] hover:text-[#9F1521] transition-colors"
            >
              <span>Hasil Kuesioner EDOM Dosen</span>
              <ChevronRight className="h-4 w-4 text-[#808285]" />
            </Link>
          </div>

          <Link
            href="/coordinator/reports"
            className="flex items-center justify-between py-2.5 px-4 rounded-full bg-[#9F1521] text-white hover:bg-[#8F131E] transition-colors text-xs font-bold"
          >
            <span>Unduh Laporan Mutu Program Studi</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
