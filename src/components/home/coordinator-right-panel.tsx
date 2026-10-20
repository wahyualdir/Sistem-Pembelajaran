'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronRight,
  Compass,
  Award,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  FileText,
  Clock,
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
    <div className="flex flex-col gap-5">
      {/* 1. Pengalih Dua Tab Retro */}
      <div className="flex items-center p-1.5 rounded-xl border-2 border-ink bg-gray-soft shadow-xs">
        <button
          type="button"
          onClick={() => onTabChange('hari-ini')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'hari-ini'
              ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
              : 'text-ink hover:bg-ink/5'
          )}
        >
          Hari Ini
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
      {/* KONDISI A: HARI INI                                       */}
      {/* ========================================================= */}
      {activeTab === 'hari-ini' && (
        <div className="flex flex-col gap-5 animate-fade-in pb-24">
          {/* 1. Ringkasan Baris Metrik Kaprodi */}
          <div className="right-panel-stats-card p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro">
            <div className="stats-responsive-layout">
              <div className="stats-responsive-item">
                <span className="stats-label text-xs font-sans font-medium text-gray-dark uppercase tracking-[0.04em] shrink-0">
                  Antrean
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-bold text-sm sm:text-base text-ink tabular-nums">
                    {pendingApprovalsCount}
                  </p>
                  <span className="text-xs font-semibold text-ink bg-gray-soft px-1.5 py-0.5 rounded border border-ink/20 whitespace-normal text-center">
                    Perlu ACC
                  </span>
                </div>
              </div>

              <div className="stats-responsive-item">
                <span className="stats-label text-xs font-sans font-medium text-gray-dark uppercase tracking-[0.04em] shrink-0">
                  Selesai
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-bold text-sm sm:text-base text-ink tabular-nums">
                    {approvedCount + rejectedCount}
                  </p>
                  <span className="text-xs font-medium text-gray-dark whitespace-normal text-center">
                    Diputuskan
                  </span>
                </div>
              </div>

              <div className="stats-responsive-item">
                <span className="stats-label text-xs font-sans font-medium text-gray-dark uppercase tracking-[0.04em] shrink-0">
                  At-Risk
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-bold text-sm sm:text-base text-ink tabular-nums">
                    {atRiskCount}
                  </p>
                  <span className="text-xs font-semibold text-ink whitespace-normal text-center">
                    Pantauan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Aksi Cepat Kaprodi */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-gray-dark">
              Aksi Cepat Kaprodi
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/coordinator/approvals"
                className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold transition-all shadow-xs"
              >
                <FileCheck className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">ACC Nilai</span>
              </Link>
              <Link
                href="/coordinator/monitoring"
                className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold transition-all shadow-xs"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Early Warning</span>
              </Link>
              <Link
                href="/coordinator/evaluations"
                className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold transition-all shadow-xs"
              >
                <Award className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">EDOM Dosen</span>
              </Link>
              <Link
                href="/coordinator/reports"
                className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold transition-all shadow-xs"
              >
                <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Laporan Mutu</span>
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
                const hasEvent = [4, 11, 18, 24, 29].includes(day);

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
                <span className="w-1.5 h-1.5 rounded-full bg-primary-dark" /> Rapat Prodi
              </span>
            </div>
          </div>

          {/* 4. Agenda Kaprodi 7 Hari */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro space-y-3">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2.5">
              <h4 className="font-heading font-bold text-sm text-ink uppercase tracking-wider">
                Agenda Pimpinan Prodi
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
      {/* KONDISI B: AKSI CEPAT PRODI                               */}
      {/* ========================================================= */}
      {activeTab === 'quick-actions' && (
        <div className="flex flex-col gap-4 animate-fade-in pb-24">
          <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-white shadow-retro space-y-3">
            <h4 className="font-heading font-bold text-sm text-ink uppercase tracking-wider">
              Evaluasi & Mutu Akademik
            </h4>
            <p className="text-xs text-gray-dark font-medium">
              Kaprodi memantau kelancaran belajar mengajar, penegakan integritas nilai, dan peringatan dini mahasiswa berisiko.
            </p>
            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href="/coordinator/approvals"
                className="flex items-center justify-between p-3 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white transition-all text-xs font-bold shadow-xs"
              >
                <span>Daftar Persetujuan Perubahan Nilai</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/coordinator/monitoring"
                className="flex items-center justify-between p-3 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white transition-all text-xs font-bold shadow-xs"
              >
                <span>Monitoring Mahasiswa Berisiko (EWS)</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/coordinator/evaluations"
                className="flex items-center justify-between p-3 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white transition-all text-xs font-bold shadow-xs"
              >
                <span>Hasil Kuesioner EDOM Dosen</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/coordinator/reports"
                className="flex items-center justify-between p-3 rounded-lg border-2 border-ink bg-black text-white hover:bg-neutral-800 transition-all text-xs font-bold shadow-retro-xs"
              >
                <span>Unduh Laporan Mutu Program Studi</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
