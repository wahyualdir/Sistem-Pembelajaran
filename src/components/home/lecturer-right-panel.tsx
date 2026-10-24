'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Download,
  Bookmark,
  ListPlus,
  CalendarDays,
  BookOpen,
  PlusCircle,
  QrCode,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveClassItem, AgendaItem } from '@/modules/academic/home-actions';
import {
  getJakartaTime,
  getCourseRealtimeScheduleStatus,
  getNextUpcomingCourse,
} from '@/modules/academic/home-schedule-utils';

interface LecturerRightPanelProps {
  selectedCourse?: ActiveClassItem;
  courses?: ActiveClassItem[];
  onSelectCourse?: (course: ActiveClassItem) => void;
  classesCount: number;
  pendingReviewsCount: number;
  totalPendingSubmissions: number;
  agenda?: AgendaItem[];
  activeTab: 'hari-ini' | 'detail-kelas';
  onTabChange: (tab: 'hari-ini' | 'detail-kelas') => void;
}

export function LecturerRightPanel({
  selectedCourse,
  courses = [],
  classesCount,
  pendingReviewsCount,
  totalPendingSubmissions,
  agenda = [],
  activeTab,
  onTabChange,
}: LecturerRightPanelProps) {
  const [saved, setSaved] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const jakarta = getJakartaTime(currentTime);

  const nextUpcoming = courses.length > 0 ? getNextUpcomingCourse(courses, currentTime) : null;
  const effectiveCourse = selectedCourse || nextUpcoming?.course || courses[0];
  const realtimeInfo = effectiveCourse
    ? getCourseRealtimeScheduleStatus(effectiveCourse.schedule, currentTime)
    : null;

  const getDisplaySchedule = () => {
    if (!effectiveCourse) return '';
    if (!realtimeInfo) return effectiveCourse.schedule;

    if (realtimeInfo.status === 'SEDANG_BERLANGSUNG') {
      return `${effectiveCourse.schedule} (Sedang Berlangsung)`;
    }
    if (realtimeInfo.status === 'SEGERA_DIMULAI') {
      return `${effectiveCourse.schedule} (${realtimeInfo.countdownText})`;
    }
    if (realtimeInfo.status === 'BESOK') {
      return `${effectiveCourse.schedule} (Besok)`;
    }
    return effectiveCourse.schedule;
  };

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* 1. Pengalih Dua Kondisi Bersih */}
      <div className="flex items-center p-1 rounded-xl border border-[#E8E5DE] bg-[#F2EFE8]">
        <button
          type="button"
          onClick={() => onTabChange('hari-ini')}
          className={cn(
            'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'hari-ini'
              ? 'bg-[#FFFFFF] text-[#1C1917] shadow-2xs'
              : 'text-[#6B6560] hover:text-[#1C1917]'
          )}
        >
          Hari Ini
        </button>
        <button
          type="button"
          onClick={() => onTabChange('detail-kelas')}
          className={cn(
            'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'detail-kelas'
              ? 'bg-[#FFFFFF] text-[#1C1917] shadow-2xs'
              : 'text-[#6B6560] hover:text-[#1C1917]'
          )}
        >
          Detail Kelas
        </button>
      </div>

      {/* ========================================================= */}
      {/* KONDISI A: HARI INI (OPEN DIVIDED SECTIONS)               */}
      {/* ========================================================= */}
      {activeTab === 'hari-ini' && (
        <div className="flex flex-col divide-y divide-[#E8E5DE] animate-fade-in pb-24">
          {/* 1. Stat Strip Dosen */}
          <div className="pb-5 grid grid-cols-3 divide-x divide-[#E8E5DE] text-center">
            <div className="px-2">
              <span className="text-[11px] text-[#6B6560] block">Kelas</span>
              <span className="font-heading font-bold text-lg text-[#1C1917] tabular-nums">
                {classesCount}
              </span>
            </div>
            <div className="px-2">
              <span className="text-[11px] text-[#6B6560] block">Antrean</span>
              <span className="font-heading font-bold text-lg text-[#C2553A] tabular-nums">
                {pendingReviewsCount}
              </span>
            </div>
            <div className="px-2">
              <span className="text-[11px] text-[#6B6560] block">Submisi</span>
              <span className="font-heading font-bold text-lg text-[#1C1917] tabular-nums">
                {totalPendingSubmissions}
              </span>
            </div>
          </div>

          {/* 2. Aksi Cepat Dosen */}
          <div className="py-5 space-y-2.5">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#6B6560]">
              Pintasan Pengajaran
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/classes/${effectiveCourse?.id || 'c0000000-0000-0000-0000-000000000001'}?tab=tugas`}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E8E5DE] bg-[#FFFFFF] hover:border-[#1C1917] text-xs font-semibold text-[#1C1917] transition-colors"
              >
                <PlusCircle className="h-4 w-4 shrink-0 text-[#C2553A]" />
                <span className="truncate">Buat Tugas</span>
              </Link>
              <Link
                href={`/classes/${effectiveCourse?.id || 'c0000000-0000-0000-0000-000000000001'}?tab=presensi`}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E8E5DE] bg-[#FFFFFF] hover:border-[#1C1917] text-xs font-semibold text-[#1C1917] transition-colors"
              >
                <QrCode className="h-4 w-4 shrink-0 text-[#C2553A]" />
                <span className="truncate">Buka Presensi</span>
              </Link>
              <Link
                href="/exams"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E8E5DE] bg-[#FFFFFF] hover:border-[#1C1917] text-xs font-semibold text-[#1C1917] transition-colors"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-[#C2553A]" />
                <span className="truncate">Bank Soal</span>
              </Link>
              <Link
                href="/grades"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E8E5DE] bg-[#FFFFFF] hover:border-[#1C1917] text-xs font-semibold text-[#1C1917] transition-colors"
              >
                <GraduationCap className="h-4 w-4 shrink-0 text-[#C2553A]" />
                <span className="truncate">Buku Nilai</span>
              </Link>
            </div>
          </div>

          {/* 3. Kalender Mini */}
          <div className="py-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-[#C2553A]" />
                <span className="font-heading font-bold text-sm text-[#1C1917]">
                  {jakarta.monthName} {jakarta.year}
                </span>
              </div>
              <span className="text-xs font-mono font-medium text-[#6B6560]">
                {jakarta.shortTimeString}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                <span key={d} className="font-medium text-[#78716C] py-0.5 text-[11px]">
                  {d}
                </span>
              ))}

              <div />
              <div />
              <div />
              <div />

              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isToday = day === jakarta.dateNum;
                const hasEvent = [8, 9, 15, 19, 22, 28].includes(day);

                return (
                  <div
                    key={day}
                    className={cn(
                      'h-7 rounded-lg flex flex-col items-center justify-center text-xs relative transition-colors',
                      isToday
                        ? 'bg-[#C2553A] text-white font-bold'
                        : hasEvent
                        ? 'bg-[#F2EFE8] text-[#1C1917] font-semibold'
                        : 'text-[#44403C] hover:bg-[#FAF8F5]'
                    )}
                  >
                    <span>{day}</span>
                    {hasEvent && !isToday && (
                      <span className="w-1 h-1 rounded-full bg-[#C2553A] absolute bottom-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Agenda Mengajar 7 Hari */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#6B6560]">
                Agenda Mengajar 7 Hari
              </h4>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-[#C2553A] hover:underline"
              >
                Kalender &rarr;
              </Link>
            </div>

            {agenda.length === 0 ? (
              <p className="text-xs text-[#6B6560] py-2">
                Tidak ada agenda pengajaran khusus 7 hari ke depan.
              </p>
            ) : (
              <div className="divide-y divide-[#E8E5DE]">
                {agenda.slice(0, 4).map((ag) => (
                  <Link
                    key={ag.id}
                    href={ag.href}
                    className="block group py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="text-[11px] font-medium text-[#6B6560] block">
                      {ag.dayName} • {ag.time}
                    </span>
                    <p className="font-heading font-semibold text-xs sm:text-sm text-[#1C1917] leading-snug group-hover:text-[#C2553A] transition-colors">
                      {ag.title}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* KONDISI B: DETAIL KELAS                                   */}
      {/* ========================================================= */}
      {activeTab === 'detail-kelas' && (
        <div className="flex flex-col gap-4 animate-fade-in pb-24">
          {!effectiveCourse ? (
            <div className="py-6 text-center space-y-2">
              <p className="font-heading font-bold text-sm text-[#1C1917]">
                Belum Ada Kelas Terpilih
              </p>
              <p className="text-xs text-[#6B6560]">
                Pilih salah satu kelas dari daftar untuk melihat rincian modul dan presensi.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2.5">
                <Link
                  href={`/classes/${effectiveCourse.id}?tab=presensi`}
                  className="flex w-full items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#C2553A] hover:bg-[#A34530] text-white font-semibold text-xs sm:text-sm transition-colors text-center"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Buka Presensi Kelas Aktif</span>
                </Link>

                <Link
                  href={`/classes/${effectiveCourse.id}?tab=tugas`}
                  className="flex w-full items-center justify-center py-2 px-4 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] font-semibold text-xs transition-colors text-center"
                >
                  Kelola Modul & Tugas Kelas
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 border-y border-[#E8E5DE] py-2.5">
                <button
                  type="button"
                  onClick={() => alert(`RPS & Silabus ${effectiveCourse.code} (${effectiveCourse.title}) siap diunduh.`)}
                  className="flex flex-col items-center justify-center py-1 rounded-lg hover:bg-[#FAF8F5] transition-colors text-[#44403C] cursor-pointer"
                >
                  <Download className="h-4 w-4 mb-1 text-[#C2553A]" />
                  <span className="text-[11px] font-medium">RPS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaved(!saved)}
                  className="flex flex-col items-center justify-center py-1 rounded-lg hover:bg-[#FAF8F5] transition-colors text-[#44403C] cursor-pointer"
                >
                  <Bookmark className={cn('h-4 w-4 mb-1 text-[#C2553A]', saved ? 'fill-current' : '')} />
                  <span className="text-[11px] font-medium">{saved ? 'Tersimpan' : 'Simpan'}</span>
                </button>

                <Link
                  href="/calendar"
                  className="flex flex-col items-center justify-center py-1 rounded-lg hover:bg-[#FAF8F5] transition-colors text-[#44403C]"
                >
                  <ListPlus className="h-4 w-4 mb-1 text-[#C2553A]" />
                  <span className="text-[11px] font-medium">Jadwal</span>
                </Link>
              </div>

              <div className="divide-y divide-[#E8E5DE] text-xs">
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-[#6B6560]">Kode MK</span>
                  <span className="font-mono font-bold text-[#1C1917]">{effectiveCourse.code}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-[#6B6560]">Progres Pertemuan</span>
                  <span className="font-semibold text-[#1C1917] tabular-nums">{effectiveCourse.progressPercent}% Selesai</span>
                </div>
                <div className="flex justify-between items-center gap-2 py-2.5">
                  <span className="text-[#6B6560] shrink-0">Jadwal Mengajar</span>
                  <span className="font-medium text-[#1C1917] text-right">
                    {getDisplaySchedule()}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 py-2.5">
                  <span className="text-[#6B6560] shrink-0">Ruang Kuliah</span>
                  <span className="font-medium text-[#1C1917] text-right">{effectiveCourse.room}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-[#6B6560]">Kehadiran Rata-rata</span>
                  <span className="font-semibold text-[#065F46] tabular-nums">
                    {effectiveCourse.attendance}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-[#6B6560]">Bobot SKS</span>
                  <span className="font-semibold text-[#1C1917] tabular-nums">{effectiveCourse.sks} SKS</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
