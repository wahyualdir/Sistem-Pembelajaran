'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Download,
  Bookmark,
  ListPlus,
  CalendarDays,
  ClipboardList,
  QrCode,
  MessagesSquare,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveClassItem, AgendaItem } from '@/modules/academic/home-actions';
import {
  getJakartaTime,
  getCourseRealtimeScheduleStatus,
  getNextUpcomingCourse,
} from '@/modules/academic/home-schedule-utils';

interface TaRightPanelProps {
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

export function TaRightPanel({
  selectedCourse,
  courses = [],
  classesCount,
  pendingReviewsCount,
  totalPendingSubmissions,
  agenda = [],
  activeTab,
  onTabChange,
}: TaRightPanelProps) {
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
    <div className="flex flex-col gap-4 font-sans">
      {/* 1. Pengalih Dua Tab Bersih Enterprise */}
      <div className="flex items-center p-1 rounded-xl border border-[#E2E3E4] bg-[#F3F3F4]">
        <button
          type="button"
          onClick={() => onTabChange('hari-ini')}
          className={cn(
            'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'hari-ini'
              ? 'bg-[#FFFFFF] text-[#111111] shadow-2xs'
              : 'text-[#58595B] hover:text-[#111111]'
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
              ? 'bg-[#FFFFFF] text-[#111111] shadow-2xs'
              : 'text-[#58595B] hover:text-[#111111]'
          )}
        >
          Detail Kelas
        </button>
      </div>

      {/* ========================================================= */}
      {/* KONDISI A: HARI INI                                       */}
      {/* ========================================================= */}
      {activeTab === 'hari-ini' && (
        <div className="flex flex-col divide-y divide-[#E2E3E4] animate-fade-in pb-16">
          {/* 1. Stat Strip Asisten */}
          <div className="pb-4 grid grid-cols-3 divide-x divide-[#E2E3E4] text-center">
            <div className="px-2">
              <span className="text-[11px] text-[#808285] block">Kelas Lab</span>
              <span className="font-heading font-bold text-sm sm:text-base text-[#111111] tabular-nums">
                {classesCount}
              </span>
            </div>
            <div className="px-2">
              <span className="text-[11px] text-[#808285] block">Koreksi</span>
              <span className="font-heading font-bold text-sm sm:text-base text-[#9F1521] tabular-nums">
                {pendingReviewsCount}
              </span>
            </div>
            <div className="px-2">
              <span className="text-[11px] text-[#808285] block">Laporan</span>
              <span className="font-heading font-bold text-sm sm:text-base text-[#111111] tabular-nums">
                {totalPendingSubmissions}
              </span>
            </div>
          </div>

          {/* 2. Pintasan Asistensi */}
          <div className="py-4 space-y-2.5">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#808285]">
              Pintasan Asistensi Lab
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/classes/${effectiveCourse?.id || 'c0000000-0000-0000-0000-000000000001'}?tab=tugas`}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors shadow-2xs"
              >
                <ClipboardList className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Periksa Laporan</span>
              </Link>
              <Link
                href={`/classes/${effectiveCourse?.id || 'c0000000-0000-0000-0000-000000000001'}?tab=presensi`}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors shadow-2xs"
              >
                <QrCode className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Presensi Praktikum</span>
              </Link>
              <Link
                href="/messages"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors shadow-2xs"
              >
                <MessagesSquare className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Tanya Asisten</span>
              </Link>
              <Link
                href="/classes"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] text-xs font-semibold text-[#111111] transition-colors shadow-2xs"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-[#9F1521]" />
                <span className="truncate">Modul Praktikum</span>
              </Link>
            </div>
          </div>

          {/* 3. Kalender Mini */}
          <div className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-[#9F1521]" />
                <span className="font-heading font-bold text-xs sm:text-sm text-[#111111]">
                  {jakarta.monthName} {jakarta.year}
                </span>
              </div>
              <span className="text-xs font-mono font-medium text-[#58595B]">
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
                const hasEvent = [8, 9, 15, 19, 22, 28].includes(day);

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

          {/* 4. Agenda Asistensi 7 Hari */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#808285]">
                Jadwal Praktikum 7 Hari
              </h4>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-[#9F1521] hover:underline"
              >
                Kalender &rarr;
              </Link>
            </div>

            {agenda.length === 0 ? (
              <p className="text-xs text-[#58595B] py-2">
                Tidak ada sesi asistensi khusus 7 hari ke depan.
              </p>
            ) : (
              <div className="divide-y divide-[#E2E3E4]">
                {agenda.slice(0, 4).map((ag) => (
                  <Link
                    key={ag.id}
                    href={ag.href}
                    className="block group py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="text-[11px] font-medium text-[#808285] block">
                      {ag.dayName} • {ag.time}
                    </span>
                    <p className="font-heading font-semibold text-xs sm:text-sm text-[#111111] leading-snug group-hover:text-[#9F1521] transition-colors">
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
        <div className="flex flex-col gap-4 animate-fade-in pb-16">
          {!effectiveCourse ? (
            <div className="py-6 text-center space-y-2">
              <p className="font-heading font-bold text-sm text-[#111111]">
                Belum Ada Kelas Terpilih
              </p>
              <p className="text-xs text-[#58595B]">
                Pilih salah satu kelas praktikum untuk melihat data dan penilaian.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2.5">
                <Link
                  href={`/classes/${effectiveCourse.id}?tab=presensi`}
                  className="flex w-full items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#9F1521] hover:bg-[#8F131E] text-white font-semibold text-xs sm:text-sm transition-colors text-center shadow-xs"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Buka Presensi Praktikum Aktif</span>
                </Link>

                <Link
                  href={`/classes/${effectiveCourse.id}?tab=tugas`}
                  className="flex w-full items-center justify-center py-2 px-4 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] hover:bg-[#F3F3F4] text-[#111111] font-semibold text-xs transition-colors text-center"
                >
                  Koreksi Laporan Praktikum
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 border-y border-[#E2E3E4] py-2.5">
                <button
                  type="button"
                  onClick={() => alert(`Modul & Petunjuk Praktikum ${effectiveCourse.code} (${effectiveCourse.title}) siap diunduh.`)}
                  className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-[#F3F3F4] transition-colors text-[#58595B] hover:text-[#111111] cursor-pointer"
                >
                  <Download className="h-4 w-4 mb-1 text-[#9F1521]" />
                  <span className="text-[11px] font-medium">Modul</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaved(!saved)}
                  className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-[#F3F3F4] transition-colors text-[#58595B] hover:text-[#111111] cursor-pointer"
                >
                  <Bookmark className={cn('h-4 w-4 mb-1 text-[#9F1521]', saved ? 'fill-current' : '')} />
                  <span className="text-[11px] font-medium">{saved ? 'Tersimpan' : 'Simpan'}</span>
                </button>

                <Link
                  href="/calendar"
                  className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-[#F3F3F4] transition-colors text-[#58595B] hover:text-[#111111]"
                >
                  <ListPlus className="h-4 w-4 mb-1 text-[#9F1521]" />
                  <span className="text-[11px] font-medium">Jadwal</span>
                </Link>
              </div>

              <div className="divide-y divide-[#E2E3E4] text-xs">
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-[#58595B]">Kode MK Praktikum</span>
                  <span className="font-mono font-bold text-[#111111]">{effectiveCourse.code}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-[#58595B]">Modul Terselesaikan</span>
                  <span className="font-semibold text-[#111111] tabular-nums">{effectiveCourse.progressPercent}% Selesai</span>
                </div>
                <div className="flex justify-between items-center gap-2 py-2.5">
                  <span className="text-[#58595B] shrink-0">Jadwal Praktikum</span>
                  <span className="font-medium text-[#111111] text-right">
                    {getDisplaySchedule()}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 py-2.5">
                  <span className="text-[#58595B] shrink-0">Laboratorium</span>
                  <span className="font-medium text-[#111111] text-right">{effectiveCourse.room}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-[#58595B]">Kehadiran Praktikan</span>
                  <span className="font-semibold text-[#059669] tabular-nums">
                    {effectiveCourse.attendance}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-[#58595B]">Beban Praktikum</span>
                  <span className="font-semibold text-[#111111] tabular-nums">{effectiveCourse.sks} SKS</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
