'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronRight,
  BookOpen,
  GraduationCap,
  PlusCircle,
  Clock,
  Layers,
  Megaphone,
  CalendarCheck2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/modules/academic/home-actions';
import { getJakartaTime } from '@/modules/academic/home-schedule-utils';

interface StaffRightPanelProps {
  programsCount: number;
  semestersCount: number;
  coursesCount: number;
  agenda?: AgendaItem[];
  activeTab: 'hari-ini' | 'quick-actions';
  onTabChange: (tab: 'hari-ini' | 'quick-actions') => void;
}

export function StaffRightPanel({
  programsCount,
  semestersCount,
  coursesCount,
  agenda = [],
  activeTab,
  onTabChange,
}: StaffRightPanelProps) {
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
            id: 'staff-ag-1',
            dateStr: 'Hari Ini',
            dayName: 'Hari Ini',
            time: '08:00 - 16:00 WIB',
            title: 'Pelayanan BAAK: Verifikasi KRS & Kuota Kelas',
            type: 'KELAS',
            href: '/staff/classes',
          },
          {
            id: 'staff-ag-2',
            dateStr: 'Besok',
            dayName: 'Besok',
            time: '09:00 WIB',
            title: 'Rapat Koordinasi Penjadwalan Ruang Kuliah',
            type: 'KELAS',
            href: '/staff/schedules',
          },
          {
            id: 'staff-ag-3',
            dateStr: 'Jumat',
            dayName: 'Jumat',
            time: '15:00 WIB',
            title: 'Finalisasi Delegasi Asisten Lab Semester Ganjil',
            type: 'KELAS',
            href: '/staff/classes',
          },
        ];

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Pengalih Dua Tab Retro */}
      <div className="flex items-center p-1 rounded-xl border border-[#E8E5DE] bg-[#FAF8F5] shadow-2xs">
        <button
          type="button"
          onClick={() => onTabChange('hari-ini')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'hari-ini'
              ? 'bg-[#FFFFFF] text-[#1C1917] border border-[#E8E5DE] shadow-2xs'
              : 'text-[#57534E] hover:text-[#1C1917] hover:bg-black/5'
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
              ? 'bg-[#FFFFFF] text-[#1C1917] border border-[#E8E5DE] shadow-2xs'
              : 'text-[#57534E] hover:text-[#1C1917] hover:bg-black/5'
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
          {/* 1. Ringkasan Baris Metrik BAAK */}
          <div className="right-panel-stats-card p-4 sm:p-5 rounded-2xl border border-[#E8E5DE] bg-white shadow-2xs">
            <div className="stats-responsive-layout">
              <div className="stats-responsive-item">
                <span className="stats-label text-xs sm:text-sm font-sans font-bold text-black uppercase tracking-wider shrink-0">
                  Prodi
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-black text-base sm:text-lg text-ink tabular-nums">
                    {programsCount}
                  </p>
                  <span className="text-xs font-semibold text-ink bg-gray-soft px-1.5 py-0.5 rounded border border-ink/20 whitespace-normal text-center">
                    Terdaftar
                  </span>
                </div>
              </div>

              <div className="stats-responsive-item">
                <span className="stats-label text-xs sm:text-sm font-sans font-bold text-black uppercase tracking-wider shrink-0">
                  Semester
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-black text-base sm:text-lg text-ink tabular-nums">
                    {semestersCount}
                  </p>
                  <span className="text-xs font-medium text-gray-dark whitespace-normal text-center">
                    Aktif
                  </span>
                </div>
              </div>

              <div className="stats-responsive-item">
                <span className="stats-label text-xs sm:text-sm font-sans font-bold text-black uppercase tracking-wider shrink-0">
                  Katalog
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-black text-base sm:text-lg text-ink tabular-nums">
                    {coursesCount}
                  </p>
                  <span className="text-xs font-semibold text-ink whitespace-normal text-center">
                    Mata Kuliah
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Aksi Cepat Administrasi BAAK */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#E8E5DE] bg-white shadow-2xs space-y-3">
            <h4 className="font-heading font-bold text-xs sm:text-sm uppercase tracking-wider text-black">
              Aksi Cepat BAAK
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/staff/schedules"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E8E5DE] bg-[#FAF8F5] hover:bg-white hover:border-[#D6D3CB] text-xs font-bold transition-all shadow-2xs"
              >
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Jadwal Kuliah</span>
              </Link>
              <Link
                href="/staff/classes"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E8E5DE] bg-[#FAF8F5] hover:bg-white hover:border-[#D6D3CB] text-xs font-bold transition-all shadow-2xs"
              >
                <Layers className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Asisten Lab</span>
              </Link>
              <Link
                href="/staff/announcements"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E8E5DE] bg-[#FAF8F5] hover:bg-white hover:border-[#D6D3CB] text-xs font-bold transition-all shadow-2xs"
              >
                <Megaphone className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Pengumuman</span>
              </Link>
              <Link
                href="/staff/grades"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E8E5DE] bg-[#FAF8F5] hover:bg-white hover:border-[#D6D3CB] text-xs font-bold transition-all shadow-2xs"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Rekap Nilai</span>
              </Link>
            </div>
          </div>

          {/* 3. Kalender Mini Bulan Berjalan */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#E8E5DE] bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8E5DE] pb-2.5">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-ink" />
                <span className="font-heading font-bold text-sm text-ink">
                  {jakarta.monthName} {jakarta.year}
                </span>
              </div>
              <span className="text-xs font-sans font-bold bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E8E5DE] text-gray-dark">
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
                const hasEvent = [5, 10, 15, 20, 25].includes(day);

                return (
                  <div
                    key={day}
                    className={cn(
                      'h-7 rounded-md flex flex-col items-center justify-center font-bold text-xs relative transition-colors',
                      isToday
                        ? 'bg-ink text-white shadow-xs'
                        : hasEvent
                        ? 'bg-[#FAF8F5] text-ink border border-[#E8E5DE]'
                        : 'text-[#57534E] hover:text-[#1C1917] hover:bg-black/5'
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

            <div className="flex items-center gap-2.5 pt-2 text-xs font-sans text-gray-dark border-t border-[#E8E5DE]">
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-ink" /> Hari Ini
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-dark" /> Tenggat BAAK
              </span>
            </div>
          </div>

          {/* 4. Agenda BAAK 7 Hari */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#E8E5DE] bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8E5DE] pb-2.5">
              <h4 className="font-heading font-bold text-sm text-ink uppercase tracking-wider">
                Agenda Akademik 7 Hari
              </h4>
            </div>

            <div className="space-y-2.5">
              {defaultAgenda.map((ag) => (
                <Link
                  key={ag.id}
                  href={ag.href}
                  className="block group p-2.5 rounded-lg border border-[#E8E5DE] hover:border-[#D6D3CB] bg-[#FAF8F5] hover:bg-white shadow-2xs transition-all"
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
      {/* KONDISI B: AKSI CEPAT MASTER DATA                         */}
      {/* ========================================================= */}
      {activeTab === 'quick-actions' && (
        <div className="flex flex-col gap-4 animate-fade-in pb-24">
          <div className="p-4 sm:p-5 rounded-2xl border border-[#E8E5DE] bg-white shadow-2xs space-y-3">
            <h4 className="font-heading font-bold text-sm text-ink uppercase tracking-wider">
              Manajemen Master Akademik
            </h4>
            <p className="text-xs text-gray-dark font-medium">
              Biro BAAK bertanggung jawab atas penetapan struktur kurikulum, semester, dan penjadwalan kelas universitas.
            </p>
            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href="/staff#prodi-form"
                className="flex items-center justify-between p-3 rounded-xl border border-[#E8E5DE] hover:border-[#D6D3CB] bg-[#FAF8F5] hover:bg-white text-[#1C1917] transition-all text-xs font-bold shadow-2xs"
              >
                <span>+ Buka Program Studi Baru</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/staff#semester-form"
                className="flex items-center justify-between p-3 rounded-xl border border-[#E8E5DE] hover:border-[#D6D3CB] bg-[#FAF8F5] hover:bg-white text-[#1C1917] transition-all text-xs font-bold shadow-2xs"
              >
                <span>+ Atur Semester Akademik</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/staff#course-form"
                className="flex items-center justify-between p-3 rounded-xl border border-[#E8E5DE] hover:border-[#D6D3CB] bg-[#FAF8F5] hover:bg-white text-[#1C1917] transition-all text-xs font-bold shadow-2xs"
              >
                <span>+ Tambah Mata Kuliah Kurikulum</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/staff/classes"
                className="flex items-center justify-between p-3 rounded-xl border border-[#A34530] bg-[#C2553A] text-white hover:bg-[#B84A2B] transition-all text-xs font-bold shadow-2xs"
              >
                <span>Delegasi Asisten Laboratorium</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
