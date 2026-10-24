'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  MapPin,
  CheckCircle2,
  Play,
  Key,
  ArrowRight,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TodayScheduleItem } from '@/modules/academic/home-actions';

interface TodayScheduleProps {
  items: TodayScheduleItem[];
}

export function TodaySchedule({ items }: TodayScheduleProps) {
  return (
    <section aria-label="Jadwal Hari Ini" className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#C2553A]" />
          <h2 className="font-heading font-bold text-lg sm:text-xl tracking-tight text-[#1C1917]">
            Jadwal Hari Ini
          </h2>
        </div>
        <Link
          href="/calendar"
          className="text-xs font-semibold text-[#C2553A] hover:text-[#1C1917] transition-colors shrink-0"
        >
          Kalender &rarr;
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-6 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] text-center space-y-2.5">
          <CalendarDays className="h-7 w-7 text-[#7A756D] mx-auto" />
          <p className="font-heading font-bold text-base text-[#1C1917]">Tidak Ada Kuliah Hari Ini</p>
          <p className="text-xs text-[#57534E] max-w-md mx-auto">
            Tidak ada jadwal perkuliahan aktif yang dijadwalkan untuk hari ini.
          </p>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#D6D3CB] bg-[#FAF8F5] font-semibold text-xs text-[#1C1917] hover:bg-[#ECE9D8] transition-colors"
          >
            <span>Buka Kalender Akademik</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isOngoing = item.status === 'BERLANGSUNG';
            const isFinished = item.status === 'SELESAI';

            return (
              <div
                key={item.id}
                className={cn(
                  'p-4 rounded-xl border bg-[#FFFFFF] transition-all flex flex-col justify-between gap-3',
                  isOngoing
                    ? 'border-[#C2553A] border-l-4 bg-[#FAF8F5]'
                    : 'border-[#D6D3CB] hover:border-[#7A756D]'
                )}
              >
                {/* Baris 1: Jam & Kode MK di Kiri, Status di Kanan */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono font-bold text-[#1C1917] tabular-nums">
                      {item.time}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#D6D3CB] text-[#853827]">
                      {item.code}
                    </span>
                  </div>

                  {isOngoing && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C2553A] text-white shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      BERLANGSUNG
                    </span>
                  )}
                  {isFinished && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#ECE9D8] text-[#44403C] shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      SELESAI
                    </span>
                  )}
                  {!isOngoing && !isFinished && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#FAF8F5] text-[#57534E] border border-[#D6D3CB] shrink-0">
                      AKAN DATANG
                    </span>
                  )}
                </div>

                {/* Baris 2: Judul Mata Kuliah Utuh & Dosen Pengampu */}
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base text-[#1C1917] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#57534E] font-medium flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#78716C] shrink-0" />
                    <span className="truncate">{item.lecturer}</span>
                  </p>
                </div>

                {/* Baris 3: Ruangan di Kiri & Tombol Aksi di Kanan */}
                <div className="pt-2.5 border-t border-[#E8E5DE] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917] min-w-0">
                    <MapPin className="h-3.5 w-3.5 text-[#C2553A] shrink-0" />
                    <span className="truncate">{item.room}</span>
                  </div>

                  {isOngoing && item.hasActiveAttendance ? (
                    <Link
                      href="/classes"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#C2553A] text-white font-bold text-xs hover:bg-[#853827] transition-colors shrink-0"
                    >
                      <Key className="h-3.5 w-3.5" />
                      <span>Presensi</span>
                    </Link>
                  ) : (
                    <Link
                      href="/classes"
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border font-bold text-xs transition-colors shrink-0',
                        isOngoing
                          ? 'bg-[#1C1917] text-white border-[#1C1917] hover:bg-[#C2553A]'
                          : 'bg-[#FFFFFF] text-[#1C1917] border-[#D6D3CB] hover:bg-[#ECE9D8]'
                      )}
                    >
                      <Play className="h-3 w-3" />
                      <span>Masuk Kelas</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
