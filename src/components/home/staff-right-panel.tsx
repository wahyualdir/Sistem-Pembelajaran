'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronRight,
  BookOpen,
  Clock,
  Layers,
  Megaphone,
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
          {/* 1. Ringkasan Metrik BAAK */}
          <div className="pb-5">
            <div className="grid grid-cols-3 divide-x divide-[#E2E3E4] text-center">
              <div className="px-2">
                <span className="text-[11px] font-normal text-[#808285] block">Prodi</span>
                <span className="font-heading font-extrabold text-xl text-[#111111] tabular-nums">
                  {programsCount}
                </span>
              </div>
              <div className="px-2">
                <span className="text-[11px] font-normal text-[#808285] block">Semester</span>
                <span className="font-heading font-extrabold text-xl text-[#111111] tabular-nums">
                  {semestersCount}
                </span>
              </div>
              <div className="px-2">
                <span className="text-[11px] font-normal text-[#808285] block">Katalog MK</span>
                <span className="font-heading font-extrabold text-xl text-[#9F1521] tabular-nums">
                  {coursesCount}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Aksi Cepat Administrasi BAAK */}
          <div className="py-5 space-y-3">
            <h4 className="font-heading font-bold text-[11px] uppercase tracking-wider text-[#808285]">
              Aksi Cepat BAAK
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/staff/schedules"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
              >
                <Clock className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Jadwal Kuliah</span>
              </Link>
              <Link
                href="/staff/classes"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
              >
                <Layers className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Asisten Lab</span>
              </Link>
              <Link
                href="/staff/announcements"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
              >
                <Megaphone className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Pengumuman</span>
              </Link>
              <Link
                href="/staff/grades"
                className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Rekap Nilai</span>
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
                const hasEvent = [5, 10, 15, 20, 25].includes(day);

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

          {/* 4. Agenda BAAK 7 Hari */}
          <div className="pt-5 space-y-3">
            <h4 className="font-heading font-bold text-[11px] uppercase tracking-wider text-[#808285]">
              Agenda Akademik 7 Hari
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
      {/* KONDISI B: AKSI CEPAT MASTER DATA                         */}
      {/* ========================================================= */}
      {activeTab === 'quick-actions' && (
        <div className="flex flex-col gap-4 animate-fade-in pb-24">
          <div className="space-y-2">
            <h4 className="font-heading font-bold text-base text-[#111111]">
              Manajemen Master Akademik
            </h4>
            <p className="text-xs text-[#58595B] font-normal leading-relaxed">
              Biro BAAK bertanggung jawab atas penetapan struktur kurikulum, semester, dan penjadwalan kelas universitas.
            </p>
          </div>

          <div className="divide-y divide-[#E2E3E4] border-y border-[#E2E3E4]">
            <Link
              href="/staff#prodi-form"
              className="flex items-center justify-between py-3 text-xs font-semibold text-[#111111] hover:text-[#9F1521] transition-colors"
            >
              <span>+ Buka Program Studi Baru</span>
              <ChevronRight className="h-4 w-4 text-[#808285]" />
            </Link>
            <Link
              href="/staff#semester-form"
              className="flex items-center justify-between py-3 text-xs font-semibold text-[#111111] hover:text-[#9F1521] transition-colors"
            >
              <span>+ Atur Semester Akademik</span>
              <ChevronRight className="h-4 w-4 text-[#808285]" />
            </Link>
            <Link
              href="/staff#course-form"
              className="flex items-center justify-between py-3 text-xs font-semibold text-[#111111] hover:text-[#9F1521] transition-colors"
            >
              <span>+ Tambah Mata Kuliah Kurikulum</span>
              <ChevronRight className="h-4 w-4 text-[#808285]" />
            </Link>
          </div>

          <Link
            href="/staff/classes"
            className="flex items-center justify-between py-2.5 px-4 rounded-full bg-[#9F1521] text-white hover:bg-[#8F131E] transition-colors text-xs font-bold"
          >
            <span>Delegasi Asisten Laboratorium</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
