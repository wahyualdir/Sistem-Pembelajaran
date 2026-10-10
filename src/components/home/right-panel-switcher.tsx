'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Download,
  Bookmark,
  ListPlus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
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

interface RightPanelSwitcherProps {
  selectedCourse: ActiveClassItem;
  summary: HomeSummaryData;
  agenda: AgendaItem[];
  activeTab: 'hari-ini' | 'detail-kelas';
  onTabChange: (tab: 'hari-ini' | 'detail-kelas') => void;
}

export function RightPanelSwitcher({
  selectedCourse,
  summary,
  agenda,
  activeTab,
  onTabChange,
}: RightPanelSwitcherProps) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-4">
      {/* 1. Pengalih Dua Kondisi (Tab Chip Retro) */}
      <div className="flex items-center p-1 rounded-xl border-2 border-retro-border bg-retro-warm shadow-xs">
        <button
          type="button"
          onClick={() => onTabChange('hari-ini')}
          className={cn(
            'flex-1 py-1.5 px-2.5 rounded-lg text-xs sm:text-sm font-heading font-black transition-all focus-visible:outline-none text-center',
            activeTab === 'hari-ini'
              ? 'bg-black text-white shadow-retro'
              : 'text-foreground hover:bg-black/5'
          )}
        >
          Hari Ini
        </button>
        <button
          type="button"
          onClick={() => onTabChange('detail-kelas')}
          className={cn(
            'flex-1 py-1.5 px-2.5 rounded-lg text-xs sm:text-sm font-heading font-black transition-all focus-visible:outline-none text-center',
            activeTab === 'detail-kelas'
              ? 'bg-black text-white shadow-retro'
              : 'text-foreground hover:bg-black/5'
          )}
        >
          Detail Kelas
        </button>
      </div>

      {/* ========================================================= */}
      {/* KONDISI A: HARI INI                                       */}
      {/* ========================================================= */}
      {activeTab === 'hari-ini' && (
        <div className="space-y-4 animate-fade-in pb-48">
          {/* 1. Status Semester (Dipindah ke atas, aman dari tombol floating AI) */}
          <div className="p-3 sm:p-3.5 rounded-xl border-2 border-retro-border bg-retro-warm flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 shadow-retro">
            <div className="min-w-0">
              <span className="text-[11px] font-sans font-black text-black uppercase tracking-wider block">
                Status Akademik
              </span>
              <p className="font-heading font-black text-sm sm:text-base text-black mt-0.5 whitespace-nowrap">
                {summary.semesterLabel}
              </p>
            </div>
            <span className="text-xs font-black text-black bg-retro-mint px-2.5 py-1 rounded-lg border-2 border-retro-border shadow-xs shrink-0">
              {summary.semesterStatus}
            </span>
          </div>

          {/* 2. Ringkasan Baris Metrik (3 kolom rapi, teks proporsional tanpa terpotong) */}
          <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl border-2 border-retro-border bg-white shadow-retro text-center">
            <div className="p-1 border-r border-black/10 min-w-0">
              <span className="text-[10px] font-sans font-black text-black uppercase tracking-tight block truncate">
                Kehadiran
              </span>
              <p className="font-heading font-black text-sm sm:text-base text-black my-0.5 tabular-nums">
                {summary.averageAttendance}
              </p>
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 block truncate">Syarat UAS ✓</span>
            </div>

            <div className="p-1 border-r border-black/10 min-w-0">
              <span className="text-[10px] font-sans font-black text-black uppercase tracking-tight block truncate">
                IPK Berjalan
              </span>
              <p className="font-heading font-black text-sm sm:text-base text-black my-0.5 tabular-nums">
                {summary.ipk}
              </p>
              <span className="text-[9px] sm:text-[10px] font-bold text-black/70 block truncate">Skala 4.0</span>
            </div>

            <div className="p-1 min-w-0">
              <span className="text-[10px] font-sans font-black text-black uppercase tracking-tight block truncate">
                Streak Belajar
              </span>
              <p className="font-heading font-black text-sm sm:text-base text-black flex items-center justify-center gap-1 my-0.5 tabular-nums">
                <Flame className="h-3.5 w-3.5 text-retro-orange fill-retro-orange shrink-0" />
                <span>{summary.studyStreakDays}h</span>
              </p>
              <span className="text-[9px] sm:text-[10px] font-bold text-retro-orange block truncate">Aktif Kuliah</span>
            </div>
          </div>

          {/* 3. Kalender Mini Bulan Berjalan (Oktober 2026 Lengkap) */}
          <div className="p-3 sm:p-3.5 rounded-xl border-2 border-retro-border bg-white shadow-retro space-y-2.5">
            <div className="flex items-center justify-between border-b-2 border-retro-border pb-2">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-black" />
                <span className="font-heading font-black text-sm text-black">
                  Oktober 2026
                </span>
              </div>
              <span className="text-[11px] font-sans font-bold bg-retro-warm px-1.5 py-0.5 rounded border border-black text-black">
                WIB
              </span>
            </div>

            {/* Grid Hari Kalender Mini */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-sans">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                <span key={d} className="font-black text-black py-0.5 text-[11px]">
                  {d}
                </span>
              ))}

              {/* 4 kotak kosong sebelum Kamis 1 Oktober 2026 */}
              <div />
              <div />
              <div />
              <div />

              {/* Tanggal 1 - 31 Oktober 2026 */}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isToday = day === 8;
                const hasEvent = [8, 9, 15, 22, 28].includes(day);

                return (
                  <div
                    key={day}
                    className={cn(
                      'h-7 rounded-md flex flex-col items-center justify-center font-bold text-xs relative transition-colors',
                      isToday
                        ? 'bg-black text-white shadow-xs'
                        : hasEvent
                        ? 'bg-retro-warm text-black border border-black/40'
                        : 'text-black hover:bg-black/5'
                    )}
                  >
                    <span>{day}</span>
                    {hasEvent && !isToday && (
                      <span className="w-1 h-1 rounded-full bg-retro-orange absolute bottom-0.5" />
                    )}
                    {isToday && (
                      <span className="w-1 h-1 rounded-full bg-retro-yellow absolute bottom-0.5" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 pt-1.5 text-[11px] font-sans text-black border-t border-black/10">
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-black" /> Hari Ini
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-retro-orange" /> Ada Tenggat / Ujian
              </span>
            </div>
          </div>

          {/* 4. Agenda 7 Hari ke Depan (Dengan Teks Penuh Tanpa Truncate) */}
          <div className="p-3 sm:p-3.5 rounded-xl border-2 border-retro-border bg-white shadow-retro space-y-2.5">
            <div className="flex items-center justify-between border-b-2 border-retro-border pb-2">
              <h4 className="font-heading font-black text-sm text-black uppercase tracking-wider">
                Agenda 7 Hari ke Depan
              </h4>
              <Link
                href="/calendar"
                className="text-xs font-black text-black hover:underline transition-all"
              >
                Kalender &rarr;
              </Link>
            </div>

            <div className="space-y-2.5">
              {agenda.map((ag) => {
                const isExam = ag.type === 'UJIAN';
                const isTask = ag.type === 'TUGAS';

                return (
                  <Link
                    key={ag.id}
                    href={ag.href}
                    className="group flex items-start gap-3 p-3 rounded-xl border-2 border-black/15 hover:border-black bg-retro-surface hover:bg-retro-warm transition-all"
                  >
                    <div
                      className={cn(
                        'shrink-0 p-2 rounded-lg border border-black mt-0.5',
                        isExam
                          ? 'bg-retro-yellow text-black'
                          : isTask
                          ? 'bg-retro-orange text-white'
                          : 'bg-black text-white'
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
                        <span className="text-xs font-sans font-bold text-black/70">
                          {ag.dayName} • {ag.time}
                        </span>
                      </div>
                      <p className="font-heading font-black text-sm text-black leading-snug break-words group-hover:underline">
                        {ag.title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* KONDISI B: DETAIL KELAS (Isi Asli Dipertahankan Persis)    */}
      {/* ========================================================= */}
      {activeTab === 'detail-kelas' && (
        <div className="space-y-4 animate-fade-in pb-48">
          {/* TWO MAIN ACTION BUTTONS */}
          <div className="space-y-2.5">
            <Link
              href={`/classes`}
              className="flex w-full items-center justify-center py-2.5 px-4 rounded-xl border-2 border-retro-border bg-retro-surface text-foreground font-heading font-black text-sm shadow-retro hover:bg-retro-warm hover:-translate-y-0.5 transition-all text-center focus-visible:outline-none"
            >
              Buka Silabus & Modul Kuliah
            </Link>

            <Link
              href={`/classes`}
              className="flex w-full items-center justify-center gap-2.5 py-3 px-4 rounded-xl border-2 border-retro-border bg-black text-white font-heading font-black text-base shadow-retro-md hover:bg-black/90 active:translate-y-0.5 transition-all text-center focus-visible:outline-none"
            >
              <Play className="h-5 w-5 fill-white" />
              <span>Masuk Kelas / Presensi Aktif</span>
            </Link>
          </div>

          {/* THREE QUICK ACTIONS (DOWNLOAD, SAVE, ADD TO LIST) */}
          <div className="grid grid-cols-3 gap-2 border-y-2 border-retro-border py-2.5">
            <button
              type="button"
              className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-retro-warm transition-colors text-foreground focus-visible:outline-none"
              title="Unduh RPS & Silabus"
            >
              <Download className="h-5 w-5 mb-1" />
              <span className="text-xs font-black">Download</span>
            </button>

            <button
              type="button"
              onClick={() => setSaved(!saved)}
              className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-retro-warm transition-colors text-foreground focus-visible:outline-none"
              title="Simpan ke favorit"
            >
              <Bookmark className={cn('h-5 w-5 mb-1', saved ? 'fill-current' : '')} />
              <span className="text-xs font-black">Save</span>
            </button>

            <Link
              href="/calendar"
              className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-retro-warm transition-colors text-foreground focus-visible:outline-none"
              title="Cek Jadwal Kuliah"
            >
              <ListPlus className="h-5 w-5 mb-1" />
              <span className="text-xs font-black">Add to List</span>
            </Link>
          </div>

          {/* METADATA INFO TABLE */}
          <div className="space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-retro-border/60">
              <span className="text-black font-bold">Rating</span>
              <span className="font-black text-black">★★★★★ ({selectedCourse.ratingCount})</span>
            </div>
            <div className="flex justify-between items-center gap-2 py-1.5 border-b border-retro-border/60">
              <span className="text-black font-bold shrink-0">Jadwal Kuliah</span>
              <span className="font-black text-black text-right text-xs">{selectedCourse.schedule}</span>
            </div>
            <div className="flex justify-between items-center gap-2 py-1.5 border-b border-retro-border/60">
              <span className="text-black font-bold shrink-0">Ruang Kelas</span>
              <span className="font-black text-black text-right">{selectedCourse.room}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-retro-border/60">
              <span className="text-black font-bold">Kehadiran</span>
              <span className="font-black text-black underline decoration-2">{selectedCourse.attendance}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-black font-bold">Bobot SKS</span>
              <span className="font-black text-black">{selectedCourse.sks} SKS</span>
            </div>
          </div>

          {/* EDITORIAL DESCRIPTION */}
          <div className="p-3 sm:p-3.5 rounded-xl border-2 border-retro-border bg-white text-xs leading-relaxed text-black space-y-1.5 shadow-retro">
            <p className="font-heading font-black text-black text-xs uppercase tracking-wider">
              Deskripsi & Silabus Kuliah
            </p>
            <p className="text-xs text-black leading-relaxed font-medium">
              {selectedCourse.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
