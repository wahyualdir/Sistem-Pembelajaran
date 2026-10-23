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
      <div className="flex items-center p-1.5 vt-window-inset p-1 bg-[#ECE9D8] rounded-none">
        <button
          type="button"
          onClick={() => onTabChange('hari-ini')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'hari-ini' ? 'vt-btn-terracotta text-white font-mono shadow-xs' : 'vt-btn-chrome text-[#1C1917] font-mono'
          )}
        >
          Hari Ini
        </button>
        <button
          type="button"
          onClick={() => onTabChange('detail-kelas')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'detail-kelas' ? 'vt-btn-terracotta text-white font-mono shadow-xs' : 'vt-btn-chrome text-[#1C1917] font-mono'
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
          <div className="p-4 sm:p-5 vt-window rounded-none bg-[#FAF8F5] shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 pb-2.5 border-b-2 border-ink">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="h-9 w-9 rounded-xl border-2 border-ink bg-white p-0.5 flex items-center justify-center shrink-0 shadow-retro-xs overflow-hidden">
                  <img
                    src="/logo-ruangkampus.png"
                    alt="Logo RuangKampus"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-base font-heading font-black text-ink tracking-tight block leading-tight whitespace-nowrap">
                    Ruang<span style={{ color: '#C2553A' }} className="text-[#C2553A]">Kampus</span>
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-black uppercase tracking-wider block leading-tight mt-0.5 truncate">
                    Kartu Mahasiswa Aktif
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <div className="min-w-0">
                <span className="text-xs font-mono font-bold text-black uppercase tracking-wider block">
                  Tahun Akademik
                </span>
                <p className="font-heading font-bold text-sm sm:text-base text-ink truncate mt-0.5">
                  {summary.semesterLabel}
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg border-2 border-ink bg-gray-soft text-ink shadow-2xs">
                Ruang<span style={{ color: '#C2553A' }} className="text-[#C2553A]">Kampus</span>
              </span>
            </div>
          </div>

          {/* 2. Ringkasan Baris Metrik (Statistik: Hadir, IPK, Streak) */}
          <div className="right-panel-stats-card p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro">
            <div className="stats-responsive-layout">
              {/* Item 1: Hadir */}
              <div className="stats-responsive-item">
                <span className="stats-label text-xs sm:text-sm font-sans font-bold text-black uppercase tracking-wider shrink-0">
                  Hadir
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-black text-base sm:text-lg text-ink tabular-nums">
                    {summary.averageAttendance}
                  </p>
                  {summary.attendanceQualified ? (
                    <span className="text-xs font-semibold text-ink bg-gray-soft px-1.5 py-0.5 rounded border border-ink/20 whitespace-normal text-center">
                      Syarat UAS ✓
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-gray-dark whitespace-normal text-center">
                      Belum Ada Data
                    </span>
                  )}
                </div>
              </div>

              {/* Item 2: IPK */}
              <div className="stats-responsive-item">
                <span className="stats-label text-xs sm:text-sm font-sans font-bold text-black uppercase tracking-wider shrink-0">
                  IPK
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-black text-base sm:text-lg text-ink tabular-nums">
                    {summary.ipk}
                  </p>
                  <span className="text-xs font-medium text-gray-dark whitespace-normal text-center">
                    Skala 4.0
                  </span>
                </div>
              </div>

              {/* Item 3: Streak */}
              <div className="stats-responsive-item">
                <span className="stats-label text-xs sm:text-sm font-sans font-bold text-black uppercase tracking-wider shrink-0">
                  Streak
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-black text-base sm:text-lg text-ink flex items-center justify-center gap-1 tabular-nums">
                    <Flame className="h-4 w-4 text-primary-dark fill-primary-dark shrink-0" />
                    <span>{summary.studyStreakDays}h</span>
                  </p>
                  <span className="text-xs font-semibold text-primary-dark whitespace-normal text-center">
                    Aktif Kuliah
                  </span>
                </div>
              </div>
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

            {/* Grid Hari Kalender Mini */}
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
                const hasEvent = [8, 9, 15, 19, 22, 28].includes(day);

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
                <span className="w-1.5 h-1.5 rounded-full bg-primary-dark" /> Ada Tenggat / Ujian
              </span>
            </div>
          </div>

          {/* 4. Agenda 7 Hari ke Depan */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro space-y-3">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2.5">
              <h4 className="font-heading font-bold text-sm text-ink uppercase tracking-wider">
                Agenda 7 Hari ke Depan
              </h4>
              <Link
                href="/calendar"
                className="text-xs font-bold text-ink hover:underline transition-all"
              >
                Kalender &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {agenda.length === 0 ? (
                <div className="p-4 rounded-xl border-2 border-dashed border-ink/15 bg-surface text-center">
                  <p className="text-xs font-bold text-gray-dark">
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
                      className="group flex items-start gap-3 p-3 rounded-xl border-2 border-ink/15 hover:border-ink bg-surface hover:bg-gray-soft transition-all"
                    >
                      <div
                        className={cn(
                          'shrink-0 p-2 rounded-lg border border-ink mt-0.5',
                          isExam
                            ? 'bg-primary text-white font-bold'
                            : isTask
                            ? 'bg-gray-soft text-ink'
                            : 'bg-ink text-white'
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
                          <span className="text-xs font-sans font-bold text-gray-dark">
                            {ag.dayName} • {ag.time}
                          </span>
                        </div>
                        <p className="font-heading font-bold text-sm text-ink leading-snug break-words group-hover:underline">
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
      {/* KONDISI B: DETAIL KELAS (RAPAT, BERSIH, SESUAI SCREENSHOT) */}
      {/* ========================================================= */}
      {activeTab === 'detail-kelas' && (
        <div className="flex flex-col gap-4 animate-fade-in pb-24">
          {!effectiveCourse ? (
            <div className="p-5 sm:p-6 rounded-xl border-2 border-dashed border-ink/30 bg-white text-center space-y-3 shadow-retro">
              <CalendarDays className="h-8 w-8 text-gray-dark mx-auto" />
              <p className="font-heading font-bold text-sm text-ink">
                Belum Ada Kelas Terpilih
              </p>
              <p className="text-xs text-gray-dark font-medium">
                Anda belum terdaftar pada kelas mata kuliah apa pun. Buka menu Kelas Saya untuk bergabung ke rombongan belajar dosen Anda.
              </p>
              <div className="pt-2">
                <Link
                  href="/classes"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold text-ink transition-all shadow-xs"
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
                  href="/classes"
                  className="flex w-full items-center justify-center py-2.5 px-4 rounded-xl border-2 border-ink bg-white text-ink font-heading font-bold text-sm shadow-[3px_3px_0px_#000] hover:bg-gray-soft hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-center focus-visible:outline-none"
                >
                  Buka Silabus & Modul Kuliah
                </Link>

                <Link
                  href="/classes"
                  className="flex w-full items-center justify-center gap-2.5 py-3 px-4 rounded-xl border-2 border-ink bg-black text-white font-heading font-bold text-base shadow-[3px_3px_0px_#000] hover:bg-black/90 active:translate-y-0.5 transition-all text-center focus-visible:outline-none"
                >
                  <Play className="h-5 w-5 fill-white" />
                  <span>Masuk Kelas / Presensi Aktif</span>
                </Link>
              </div>

              {/* THREE QUICK ACTIONS (DOWNLOAD, SAVE, ADD TO LIST) */}
              <div className="grid grid-cols-3 gap-2 border-y-2 border-ink py-3">
                <button
                  type="button"
                  onClick={() => alert(`Silabus & RPS ${effectiveCourse.code} (${effectiveCourse.title}) siap diunduh.`)}
                  className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-gray-soft transition-colors text-ink focus-visible:outline-none cursor-pointer"
                  title="Unduh RPS & Silabus"
                >
                  <Download className="h-5 w-5 mb-1" />
                  <span className="text-xs font-bold">Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaved(!saved)}
                  className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-gray-soft transition-colors text-ink focus-visible:outline-none cursor-pointer"
                  title="Simpan ke favorit"
                >
                  <Bookmark className={cn('h-5 w-5 mb-1', saved ? 'fill-current' : '')} />
                  <span className="text-xs font-bold">{saved ? 'Saved' : 'Save'}</span>
                </button>

                <Link
                  href="/calendar"
                  className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-gray-soft transition-colors text-ink focus-visible:outline-none"
                  title="Cek Jadwal Kuliah"
                >
                  <ListPlus className="h-5 w-5 mb-1" />
                  <span className="text-xs font-bold">Add to List</span>
                </Link>
              </div>

              {/* METADATA INFO TABLE (IDENTIK SCREENSHOT DENGAN DATA REALTIME) */}
              <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-white shadow-[4px_4px_0px_#000] space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-ink/40">
                  <span className="text-black font-medium">Kode MK</span>
                  <span className="font-sans font-semibold text-black">{effectiveCourse.code}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-ink/40">
                  <span className="text-black font-medium">Progres Belajar</span>
                  <span className="font-semibold text-black tabular-nums">{effectiveCourse.progressPercent}% Selesai</span>
                </div>
                <div className="flex justify-between items-center gap-2 py-1.5 border-b border-ink/40">
                  <span className="text-black font-medium shrink-0">Jadwal Kuliah</span>
                  <span className="font-medium text-black text-right text-xs">
                    {getDisplaySchedule()}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 py-1.5 border-b border-ink/40">
                  <span className="text-black font-medium shrink-0">Ruang Kelas</span>
                  <span className="font-medium text-black text-right">{effectiveCourse.room}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-ink/40">
                  <span className="text-black font-medium">Kehadiran</span>
                  <span className="font-semibold text-black underline decoration-2 tabular-nums">
                    {effectiveCourse.attendance}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-black font-medium">Bobot SKS</span>
                  <span className="font-semibold text-black tabular-nums">{effectiveCourse.sks} SKS</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
