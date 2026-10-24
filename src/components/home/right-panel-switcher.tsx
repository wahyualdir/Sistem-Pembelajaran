'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Download,
  Bookmark,
  ListPlus,
  Calendar,
  ChevronRight,
  Flame,
  Award,
  FileText,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ActiveClassItem,
  HomeSummaryData,
  AgendaItem,
} from '@/modules/academic/home-actions';
import {
  getJakartaTime,
  getCourseRealtimeScheduleStatus,
  getNextUpcomingCourse,
} from '@/modules/academic/home-schedule-utils';

interface RightPanelSwitcherProps {
  selectedCourse?: ActiveClassItem;
  courses?: ActiveClassItem[];
  onSelectCourse?: (course: ActiveClassItem) => void;
  summary: HomeSummaryData;
  agenda: AgendaItem[];
  activeTab: 'hari-ini' | 'detail-kelas';
  onTabChange: (tab: 'hari-ini' | 'detail-kelas') => void;
}

export function RightPanelSwitcher({
  selectedCourse,
  courses = [],
  onSelectCourse,
  summary,
  agenda,
  activeTab,
  onTabChange,
}: RightPanelSwitcherProps) {
  const [saved, setSaved] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const jakarta = getJakartaTime(currentTime);

  // Ambil kelas yang sedang berlangsung atau jadwal mendatang berikutnya secara realtime
  const nextUpcoming = courses.length > 0 ? getNextUpcomingCourse(courses, currentTime) : null;
  const effectiveCourse = selectedCourse || nextUpcoming?.course || courses[0];
  const realtimeInfo = effectiveCourse
    ? getCourseRealtimeScheduleStatus(effectiveCourse.schedule, currentTime)
    : null;

  // Format jadwal realtime ringkas dan rapi tanpa merusak tata letak
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
    <div className="flex flex-col gap-5">
      {/* 1. Pengalih Dua Kondisi (Tab Chip Retro) */}
      <div className="flex items-center p-1.5 rounded-xl border-2 border-[#7A756D] bg-[#ECE9D8] shadow-xs">
        <button
          type="button"
          onClick={() => onTabChange('hari-ini')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-sans font-extrabold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'hari-ini'
              ? 'bg-[#1C1917] text-white border-b-4 border-b-[#C2553A] shadow-xs'
              : 'text-[#1C1917] hover:bg-black/5'
          )}
        >
          Hari Ini
        </button>
        <button
          type="button"
          onClick={() => onTabChange('detail-kelas')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-sans font-extrabold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'detail-kelas'
              ? 'bg-[#1C1917] text-white border-b-4 border-b-[#C2553A] shadow-xs'
              : 'text-[#1C1917] hover:bg-black/5'
          )}
        >
          Detail Kelas
        </button>
      </div>

      {/* ========================================================= */}
      {/* KONDISI A: HARI INI                                       */}
      {/* ========================================================= */}
      {activeTab === 'hari-ini' && (
        <div className="flex flex-col gap-5 animate-fade-in pb-24">
          {/* 1. Header Identitas Kampus & Status Semester Mahasiswa */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#D6D3CB] bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E8E5DE]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src="/logo-ruangkampus.png"
                    alt="Logo RuangKampus"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-heading font-black text-[#1C1917] tracking-tight block leading-tight">
                    Ruang<span className="text-[#C2553A]">Kampus</span>
                  </span>
                  <span className="text-[11px] font-sans font-bold text-[#853827] uppercase tracking-wider block leading-tight mt-0.5">
                    Kartu Mahasiswa Aktif
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F5E9] border border-[#10B981] text-[#065F46] text-[10px] font-bold shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                <span>AKTIF</span>
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-sans font-bold text-[#7A756D] uppercase tracking-wider block">
                Tahun Akademik Berjalan
              </span>
              <p className="font-heading font-bold text-sm text-[#1C1917]">
                {summary.semesterLabel}
              </p>
            </div>
          </div>

          {/* 2. Ringkasan Baris Metrik (Statistik: Hadir, IPK, Streak) */}
          <div className="p-4 rounded-2xl border border-[#D6D3CB] bg-white shadow-2xs space-y-2.5">
            {/* Item 1: Hadir */}
            <div className="flex items-center justify-between py-1.5 border-b border-[#E8E5DE]">
              <span className="text-xs font-sans font-bold text-[#57534E] uppercase tracking-wider">
                Kehadiran
              </span>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-base text-[#1C1917] tabular-nums">
                  {summary.averageAttendance}
                </span>
                {summary.attendanceQualified ? (
                  <span className="text-[11px] font-bold text-[#065F46] bg-[#E8F5E9] px-2 py-0.5 rounded-md border border-[#10B981]">
                    Syarat UAS
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-[#7A756D]">
                    Belum Cukup
                  </span>
                )}
              </div>
            </div>

            {/* Item 2: IPK */}
            <div className="flex items-center justify-between py-1.5 border-b border-[#E8E5DE]">
              <span className="text-xs font-sans font-bold text-[#57534E] uppercase tracking-wider">
                IPK Kumulatif
              </span>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-base text-[#1C1917] tabular-nums">
                  {summary.ipk}
                </span>
                <span className="text-[11px] font-semibold text-[#7A756D] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#D6D3CB]">
                  Skala 4.0
                </span>
              </div>
            </div>

            {/* Item 3: Streak */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-sans font-bold text-[#57534E] uppercase tracking-wider">
                Konsistensi
              </span>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-base text-[#1C1917] flex items-center gap-1 tabular-nums">
                  <Flame className="h-4 w-4 text-[#C2553A] fill-[#C2553A] shrink-0" />
                  <span>{summary.studyStreakDays} Hari</span>
                </span>
                <span className="text-[11px] font-bold text-[#853827] bg-[#FEF2F0] px-2 py-0.5 rounded-md border border-[#FDDDD7]">
                  Aktif Kuliah
                </span>
              </div>
            </div>
          </div>

          {/* 3. Kalender Mini Bulan Berjalan */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-[#7A756D] bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b-2 border-[#D6D3CB] pb-2.5">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-[#1C1917]" />
                <span suppressHydrationWarning className="font-heading font-extrabold text-sm text-[#1C1917]">
                  {jakarta.monthName} {jakarta.year}
                </span>
              </div>
              <span suppressHydrationWarning className="text-xs font-sans font-extrabold bg-[#ECE9D8] px-2 py-0.5 rounded border border-[#7A756D] text-[#1C1917]">
                {jakarta.shortTimeString}
              </span>
            </div>

            {/* Grid Hari Kalender Mini */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-sans">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                <span key={d} className="font-extrabold text-[#7A756D] py-0.5 text-xs">
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
                      'h-7 rounded-md flex flex-col items-center justify-center font-extrabold text-xs relative transition-colors',
                      isToday
                        ? 'bg-[#C2553A] text-white shadow-xs'
                        : hasEvent
                        ? 'bg-[#ECE9D8] text-[#1C1917] border border-[#7A756D]'
                        : 'text-[#1C1917] hover:bg-black/5'
                    )}
                  >
                    <span>{day}</span>
                    {hasEvent && !isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#853827] absolute bottom-0.5" />
                    )}
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white absolute bottom-0.5" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 pt-2 text-xs font-sans text-[#7A756D] border-t border-[#D6D3CB]">
              <span className="flex items-center gap-1 font-bold text-[#1C1917]">
                <span className="w-2 h-2 rounded-full bg-[#C2553A]" /> Hari Ini
              </span>
              <span className="flex items-center gap-1 font-bold text-[#853827]">
                <span className="w-2 h-2 rounded-full bg-[#853827]" /> Ada Tenggat / Ujian
              </span>
            </div>
          </div>

          {/* 4. Agenda 7 Hari ke Depan */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-[#7A756D] bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b-2 border-[#D6D3CB] pb-2.5">
              <h4 className="font-heading font-extrabold text-sm text-[#1C1917] uppercase tracking-wider">
                Agenda 7 Hari ke Depan
              </h4>
              <Link
                href="/calendar"
                className="text-xs font-extrabold text-[#C2553A] hover:underline transition-all"
              >
                Kalender &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {agenda.length === 0 ? (
                <div className="p-4 rounded-xl border-2 border-dashed border-[#D6D3CB] bg-white text-center">
                  <p className="text-xs font-bold text-[#7A756D]">
                    Tidak ada agenda perkuliahan dalam 7 hari ke depan.
                  </p>
                </div>
              ) : (
                agenda.map((ag) => {
                  const isExam = ag.type === 'UJIAN';
                  const isTask = ag.type === 'TUGAS';

                  return (
                    <Link
                      key={ag.id}
                      href={ag.href}
                      className="group flex items-start gap-3 p-3 rounded-xl border-2 border-[#D6D3CB] hover:border-[#7A756D] bg-white hover:bg-[#FAF8F5] transition-all"
                    >
                      <div
                        className={cn(
                          'shrink-0 p-2 rounded-lg border mt-0.5',
                          isExam
                            ? 'bg-[#C2553A] text-white border-[#853827] font-bold'
                            : isTask
                            ? 'bg-[#ECE9D8] text-[#1C1917] border-[#7A756D]'
                            : 'bg-[#1C1917] text-white border-[#1C1917]'
                        )}
                      >
                        {isExam ? (
                          <Award className="h-4 w-4" />
                        ) : isTask ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <Calendar className="h-4 w-4" />
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-sans font-bold text-[#7A756D]">
                            {ag.dayName} • {ag.time}
                          </span>
                        </div>
                        <p className="font-heading font-extrabold text-sm text-[#1C1917] leading-snug break-words group-hover:underline">
                          {ag.title}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* KONDISI B: DETAIL KELAS                                   */}
      {/* ========================================================= */}
      {activeTab === 'detail-kelas' && (
        <div className="flex flex-col gap-4 animate-fade-in pb-24">
          {!effectiveCourse ? (
            <div className="p-5 sm:p-6 rounded-xl border-2 border-dashed border-[#D6D3CB] bg-white text-center space-y-3 shadow-xs">
              <CalendarDays className="h-8 w-8 text-[#7A756D] mx-auto" />
              <p className="font-heading font-extrabold text-sm text-[#1C1917]">
                Belum Ada Kelas Terpilih
              </p>
              <p className="text-xs text-[#57534E] font-bold">
                Anda belum terdaftar pada kelas mata kuliah apa pun. Buka menu Kelas Saya untuk bergabung ke rombongan belajar dosen Anda.
              </p>
              <div className="pt-2">
                <Link
                  href="/classes"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-[#7A756D] bg-[#ECE9D8] hover:bg-white text-xs font-sans font-extrabold text-[#1C1917] transition-all shadow-xs"
                >
                  <span>Buka Kelas Saya</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* TWO MAIN ACTION BUTTONS */}
              <div className="flex flex-col gap-3">
                <Link
                  href={`/classes/${effectiveCourse.id}?tab=materi`}
                  className="flex w-full items-center justify-center py-2.5 px-4 rounded-xl border-2 border-[#7A756D] bg-white text-[#1C1917] font-sans font-extrabold text-sm shadow-xs hover:bg-[#FAF8F5] hover:text-[#C2553A] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-center focus-visible:outline-none cursor-pointer"
                >
                  Buka Silabus & Modul Kuliah
                </Link>

                <Link
                  href={`/classes/${effectiveCourse.id}?tab=presensi`}
                  className="flex w-full items-center justify-center gap-2.5 py-3 px-4 rounded-xl border-2 border-[#853827] bg-[#C2553A] text-white font-sans font-extrabold text-base shadow-xs hover:bg-[#B84A2B] active:translate-y-0.5 transition-all text-center focus-visible:outline-none cursor-pointer"
                >
                  <Play className="h-5 w-5 fill-white" />
                  <span>Masuk Kelas / Presensi Aktif</span>
                </Link>
              </div>

              {/* THREE QUICK ACTIONS (DOWNLOAD, SAVE, ADD TO LIST) */}
              <div className="grid grid-cols-3 gap-2 border-y-2 border-[#D6D3CB] py-3">
                <button
                  type="button"
                  onClick={() => alert(`Silabus & RPS ${effectiveCourse.code} (${effectiveCourse.title}) siap diunduh.`)}
                  className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-[#ECE9D8] transition-colors text-[#1C1917] focus-visible:outline-none cursor-pointer"
                  title="Unduh RPS & Silabus"
                >
                  <Download className="h-5 w-5 mb-1 text-[#853827]" />
                  <span className="text-xs font-sans font-extrabold">Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaved(!saved)}
                  className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-[#ECE9D8] transition-colors text-[#1C1917] focus-visible:outline-none cursor-pointer"
                  title="Simpan ke favorit"
                >
                  <Bookmark className={cn('h-5 w-5 mb-1 text-[#853827]', saved ? 'fill-current' : '')} />
                  <span className="text-xs font-sans font-extrabold">{saved ? 'Saved' : 'Save'}</span>
                </button>

                <Link
                  href="/calendar"
                  className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-[#ECE9D8] transition-colors text-[#1C1917] focus-visible:outline-none cursor-pointer"
                  title="Cek Jadwal Kuliah"
                >
                  <ListPlus className="h-5 w-5 mb-1 text-[#853827]" />
                  <span className="text-xs font-sans font-extrabold">Add to List</span>
                </Link>
              </div>

              {/* METADATA INFO TABLE */}
              <div className="p-4 sm:p-5 rounded-xl border-2 border-[#7A756D] bg-white shadow-xs space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-[#D6D3CB]">
                  <span className="text-[#57534E] font-bold">Kode MK</span>
                  <span className="font-sans font-extrabold text-[#1C1917]">{effectiveCourse.code}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#D6D3CB]">
                  <span className="text-[#57534E] font-bold">Progres Belajar</span>
                  <span className="font-sans font-extrabold text-[#1C1917] tabular-nums">{effectiveCourse.progressPercent}% Selesai</span>
                </div>
                <div className="flex justify-between items-center gap-2 py-1.5 border-b border-[#D6D3CB]">
                  <span className="text-[#57534E] font-bold shrink-0">Jadwal Kuliah</span>
                  <span suppressHydrationWarning className="font-sans font-bold text-[#1C1917] text-right text-xs">
                    {getDisplaySchedule()}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 py-1.5 border-b border-[#D6D3CB]">
                  <span className="text-[#57534E] font-bold shrink-0">Ruang Kelas</span>
                  <span className="font-sans font-bold text-[#1C1917] text-right">{effectiveCourse.room}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#D6D3CB]">
                  <span className="text-[#57534E] font-bold">Kehadiran</span>
                  <span className="font-sans font-extrabold text-[#1C1917] underline decoration-2 tabular-nums">
                    {effectiveCourse.attendance}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[#57534E] font-bold">Bobot SKS</span>
                  <span className="font-sans font-extrabold text-[#1C1917] tabular-nums">{effectiveCourse.sks} SKS</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
