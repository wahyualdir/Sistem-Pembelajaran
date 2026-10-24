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
                  'p-4 rounded-xl border bg-[#FFFFFF] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5',
                  isOngoing
                    ? 'border-[#C2553A] border-l-4 bg-[#FAF8F5]'
                    : 'border-[#D6D3CB] hover:border-[#7A756D]'
                )}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-[#1C1917] tabular-nums">
                      {item.time}
                    </span>

                    {isOngoing && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#C2553A] text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        BERLANGSUNG
                      </span>
                    )}
                    {isFinished && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#ECE9D8] text-[#44403C]">
                        <CheckCircle2 className="h-3 w-3" />
                        SELESAI
                      </span>
                    )}
                    {!isOngoing && !isFinished && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#FAF8F5] text-[#57534E] border border-[#D6D3CB]">
                        AKAN DATANG
                      </span>
                    )}

                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E8E5DE] text-[#853827]">
                      {item.code}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-[#1C1917] break-words leading-snug">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-[#57534E] flex-wrap">
                    <div className="flex items-center gap-1 font-semibold text-[#1C1917]">
                      <MapPin className="h-3.5 w-3.5 text-[#C2553A] shrink-0" />
                      <span>{item.room}</span>
                    </div>
                    <span className="text-[#B8B1A5]">•</span>
                    <span className="truncate">{item.lecturer}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8E5DE]">
                  {isOngoing && item.hasActiveAttendance ? (
                    <Link
                      href="/classes"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C2553A] text-white font-semibold text-xs hover:bg-[#853827] transition-colors"
                    >
                      <Key className="h-3.5 w-3.5" />
                      <span>Presensi</span>
                    </Link>
                  ) : (
                    <Link
                      href="/classes"
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border font-semibold text-xs transition-colors',
                        isOngoing
                          ? 'bg-[#1C1917] text-white border-[#1C1917] hover:bg-[#C2553A]'
                          : 'bg-[#FAF8F5] text-[#1C1917] border-[#D6D3CB] hover:bg-[#ECE9D8]'
                      )}
                    >
                      <Play className="h-3.5 w-3.5" />
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
