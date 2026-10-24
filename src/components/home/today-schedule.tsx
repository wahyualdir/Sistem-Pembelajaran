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
    <section aria-label="Jadwal Hari Ini" className="space-y-3">
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
        <div className="py-6 px-4 border-y border-[#E8E5DE] text-center space-y-2">
          <p className="font-heading font-bold text-sm text-[#1C1917]">Tidak Ada Kuliah Hari Ini</p>
          <p className="text-xs text-[#6B6560] max-w-md mx-auto">
            Tidak ada jadwal perkuliahan aktif yang dijadwalkan untuk hari ini.
          </p>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C2553A] hover:underline"
          >
            <span>Buka Kalender Akademik</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E8E5DE] bg-[#FFFFFF] divide-y divide-[#E8E5DE] overflow-hidden">
          {items.map((item) => {
            const isOngoing = item.status === 'BERLANGSUNG';
            const isFinished = item.status === 'SELESAI';

            return (
              <div
                key={item.id}
                className={cn(
                  'p-4 sm:px-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3.5',
                  isOngoing ? 'bg-[#FEF2F0]/40' : 'hover:bg-[#FAF8F5]'
                )}
              >
                {/* Kiri: Indikator Jam + Detail Mata Kuliah */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={cn(
                      'w-1 self-stretch rounded-full shrink-0',
                      isOngoing
                        ? 'bg-[#C2553A]'
                        : isFinished
                        ? 'bg-[#D6D3CB]'
                        : 'bg-[#1C1917]'
                    )}
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#1C1917] tabular-nums">
                        {item.time}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-[#853827]">
                        • {item.code}
                      </span>
                      {isOngoing && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C2553A] text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          BERLANGSUNG
                        </span>
                      )}
                      {isFinished && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#6B6560]">
                          <CheckCircle2 className="h-3 w-3" />
                          SELESAI
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading font-bold text-sm sm:text-base text-[#1C1917] leading-snug">
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B6560]">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-[#78716C]" />
                        <span>{item.lecturer}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-[#44403C]">
                        <MapPin className="h-3.5 w-3.5 text-[#C2553A]" />
                        <span>{item.room}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kanan: Aksi */}
                <div className="flex items-center justify-end shrink-0">
                  {isOngoing && item.hasActiveAttendance ? (
                    <Link
                      href={`/classes/${item.id}?tab=presensi`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C2553A] text-white font-semibold text-xs hover:bg-[#853827] transition-colors"
                    >
                      <Key className="h-3.5 w-3.5" />
                      <span>Presensi</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/classes/${item.id}`}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-semibold text-xs transition-colors',
                        isOngoing
                          ? 'bg-[#1C1917] text-white border-[#1C1917] hover:bg-[#C2553A]'
                          : 'bg-[#FFFFFF] text-[#1C1917] border-[#D6D3CB] hover:bg-[#FAF8F5]'
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
