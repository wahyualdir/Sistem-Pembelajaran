'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Download,
  Bookmark,
  ListPlus,
  CalendarDays,
  ChevronRight,
  BookOpen,
  ClipboardList,
  FileCheck,
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
  onSelectCourse,
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
    <div className="flex flex-col gap-5">
      {/* 1. Pengalih Dua Kondisi (Tab Chip Retro) */}
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
          onClick={() => onTabChange('detail-kelas')}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-heading font-bold transition-all focus-visible:outline-none text-center cursor-pointer',
            activeTab === 'detail-kelas'
              ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
              : 'text-ink hover:bg-ink/5'
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
          {/* 1. Ringkasan Baris Metrik Dosen (Kelas, Tugas, Submisi) */}
          <div className="right-panel-stats-card p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro">
            <div className="stats-responsive-layout">
              {/* Item 1: Kelas Aktif */}
              <div className="stats-responsive-item">
                <span className="stats-label text-xs sm:text-sm font-sans font-bold text-black uppercase tracking-wider shrink-0">
                  Kelas
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-black text-base sm:text-lg text-ink tabular-nums">
                    {classesCount}
                  </p>
                  <span className="text-xs font-semibold text-ink bg-gray-soft px-1.5 py-0.5 rounded border border-ink/20 whitespace-normal text-center">
                    Aktif
                  </span>
                </div>
              </div>

              {/* Item 2: Tugas Perlu Koreksi */}
              <div className="stats-responsive-item">
                <span className="stats-label text-xs sm:text-sm font-sans font-bold text-black uppercase tracking-wider shrink-0">
                  Tugas
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-black text-base sm:text-lg text-ink tabular-nums">
                    {pendingReviewsCount}
                  </p>
                  <span className="text-xs font-medium text-gray-dark whitespace-normal text-center">
                    Antrean
                  </span>
                </div>
              </div>

              {/* Item 3: Total Submisi */}
              <div className="stats-responsive-item">
                <span className="stats-label text-xs sm:text-sm font-sans font-bold text-black uppercase tracking-wider shrink-0">
                  Submisi
                </span>
                <div className="stats-right-group">
                  <p className="stats-value font-heading font-black text-base sm:text-lg text-ink flex items-center justify-center gap-1 tabular-nums">
                    <FileCheck className="h-3.5 w-3.5 text-ink shrink-0" />
                    <span>{totalPendingSubmissions}</span>
                  </p>
                  <span className="text-xs font-semibold text-ink whitespace-normal text-center">
                    Pending
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Aksi Cepat Dosen */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro space-y-3">
            <h4 className="font-heading font-bold text-xs sm:text-sm uppercase tracking-wider text-black">
              Aksi Cepat Dosen
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/classes"
                className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold transition-all shadow-xs"
              >
                <PlusCircle className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Buat Tugas</span>
              </Link>
              <Link
                href="/classes"
                className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold transition-all shadow-xs"
              >
                <QrCode className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Buka Presensi</span>
              </Link>
              <Link
                href="/exams"
                className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold transition-all shadow-xs"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Bank Soal</span>
              </Link>
              <Link
                href="/classes"
                className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-ink bg-gray-soft hover:bg-ink hover:text-white text-xs font-bold transition-all shadow-xs"
              >
                <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Rekap Nilai</span>
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
                <span className="w-1.5 h-1.5 rounded-full bg-primary-dark" /> Jadwal Mengajar
              </span>
            </div>
          </div>

          {/* 4. Agenda Mengajar 7 Hari ke Depan */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro space-y-3">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2.5">
              <h4 className="font-heading font-bold text-sm text-ink uppercase tracking-wider">
                Agenda Mengajar 7 Hari
              </h4>
              <Link
                href="/calendar"
                className="text-xs font-bold text-primary-dark hover:underline flex items-center gap-0.5"
              >
                <span>Kalender</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {agenda.length === 0 ? (
                <p className="text-xs text-gray-dark font-medium py-2">
                  Tidak ada agenda pengajaran khusus 7 hari ke depan.
                </p>
              ) : (
                agenda.slice(0, 4).map((ag) => (
                  <Link
                    key={ag.id}
                    href={ag.href}
                    className="block group p-2.5 rounded-lg border border-ink/20 hover:border-ink bg-gray-soft/40 hover:bg-gray-soft transition-all"
                  >
                    <div className="space-y-1">
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
                ))
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
            <div className="p-5 sm:p-6 rounded-xl border-2 border-dashed border-ink/30 bg-white text-center space-y-3 shadow-retro">
              <CalendarDays className="h-8 w-8 text-gray-dark mx-auto" />
              <p className="font-heading font-bold text-sm text-ink">
                Belum Ada Kelas Terpilih
              </p>
              <p className="text-xs text-gray-dark font-medium">
                Pilih salah satu kelas dari daftar untuk melihat detail modul, presensi, dan pengelolaan tugas mahasiswa.
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
                  Kelola Modul & Tugas Kelas
                </Link>

                <Link
                  href="/classes"
                  className="flex w-full items-center justify-center gap-2.5 py-3 px-4 rounded-xl border-2 border-ink bg-black text-white font-heading font-bold text-base shadow-[3px_3px_0px_#000] hover:bg-black/90 active:translate-y-0.5 transition-all text-center focus-visible:outline-none"
                >
                  <Play className="h-5 w-5 fill-white" />
                  <span>Buka Presensi Kelas Aktif</span>
                </Link>
              </div>

              {/* THREE QUICK ACTIONS */}
              <div className="grid grid-cols-3 gap-2 border-y-2 border-ink py-3">
                <button
                  type="button"
                  onClick={() => alert(`RPS & Silabus ${effectiveCourse.code} (${effectiveCourse.title}) siap diunduh.`)}
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
                  title="Cek Jadwal Mengajar"
                >
                  <ListPlus className="h-5 w-5 mb-1" />
                  <span className="text-xs font-bold">Jadwal</span>
                </Link>
              </div>

              {/* METADATA INFO TABLE */}
              <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-white shadow-[4px_4px_0px_#000] space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-ink/40">
                  <span className="text-black font-medium">Kode MK</span>
                  <span className="font-sans font-semibold text-black">{effectiveCourse.code}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-ink/40">
                  <span className="text-black font-medium">Progres Pertemuan</span>
                  <span className="font-semibold text-black tabular-nums">{effectiveCourse.progressPercent}% Selesai</span>
                </div>
                <div className="flex justify-between items-center gap-2 py-1.5 border-b border-ink/40">
                  <span className="text-black font-medium shrink-0">Jadwal Mengajar</span>
                  <span className="font-medium text-black text-right text-xs">
                    {getDisplaySchedule()}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 py-1.5 border-b border-ink/40">
                  <span className="text-black font-medium shrink-0">Ruang Kuliah</span>
                  <span className="font-medium text-black text-right">{effectiveCourse.room}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-ink/40">
                  <span className="text-black font-medium">Kehadiran Rata-rata</span>
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
