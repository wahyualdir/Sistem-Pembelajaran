'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  Play,
  Key,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TodayScheduleItem } from '@/modules/academic/home-actions';

interface TodayScheduleProps {
  items: TodayScheduleItem[];
}

export function TodaySchedule({ items }: TodayScheduleProps) {
  return (
    <section aria-label="Jadwal Hari Ini" className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg border-2 border-ink bg-gray-soft text-primary shadow-xs">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink">
            Jadwal Hari Ini
          </h2>
        </div>
        <Link
          href="/calendar"
          className="text-base sm:text-lg font-bold text-primary-dark hover:text-ink transition-colors"
        >
          more &rarr;
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-6 sm:p-8 rounded-2xl border-2 border-ink bg-surface shadow-retro text-center space-y-3">
          <CalendarDays className="h-9 w-9 text-gray-dark mx-auto" />
          <p className="font-heading font-bold text-xl text-ink">Tidak Ada Kuliah Hari Ini</p>
          <p className="text-sm text-gray-dark font-bold max-w-md mx-auto">
            Tidak ada jadwal perkuliahan aktif yang dijadwalkan untuk hari ini.
          </p>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-ink bg-gray-soft font-heading font-bold text-xs hover:bg-ink hover:text-white transition-all shadow-xs"
          >
            <span>Buka Kalender Akademik</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-ink">
          {items.map((item) => {
            const isOngoing = item.status === 'BERLANGSUNG';
            const isFinished = item.status === 'SELESAI';

            return (
              <div key={item.id} className="relative group">
                {/* Bullet titik timeline */}
                <div
                  className={cn(
                    'absolute -left-6 sm:-left-8 top-4.5 w-5 h-5 rounded-full border-2 border-ink flex items-center justify-center transition-transform group-hover:scale-125 z-10',
                    isOngoing
                      ? 'bg-gray-dark shadow-xs'
                      : isFinished
                      ? 'bg-surface'
                      : 'bg-gray-soft'
                  )}
                >
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      isOngoing ? 'bg-white' : isFinished ? 'bg-ink' : 'bg-gray'
                    )}
                  />
                </div>

                {/* Kartu timeline item */}
                <div
                  className={cn(
                    'p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5',
                    isOngoing && 'bg-gray-soft/60 border-ink shadow-retro-md ring-1 ring-ink'
                  )}
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-sans font-semibold text-ink tabular-nums">
                        {item.time}
                      </span>

                      {/* Status Badge */}
                      {isOngoing && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans font-bold bg-gray-dark text-white border-2 border-ink">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          BERLANGSUNG
                        </span>
                      )}
                      {isFinished && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-sans font-bold bg-surface text-ink border-2 border-ink">
                          <CheckCircle2 className="h-3 w-3" />
                          SELESAI
                        </span>
                      )}
                      {!isOngoing && !isFinished && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-bold bg-gray-soft text-ink border border-ink">
                          AKAN DATANG
                        </span>
                      )}

                      <span className="text-xs font-sans font-bold px-2 py-0.5 rounded bg-gray-soft border border-ink/20 text-gray-dark">
                        {item.code}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-lg sm:text-xl text-ink break-words leading-snug">
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-dark flex-wrap">
                      <div className="flex items-center gap-1.5 font-bold text-ink">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span>{item.room}</span>
                      </div>
                      <span className="text-gray">•</span>
                      <span className="font-medium text-gray-dark break-words">{item.lecturer}</span>
                    </div>
                  </div>

                  {/* Tombol aksi khusus untuk kelas BERLANGSUNG */}
                  <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-ink/10">
                    {isOngoing && item.hasActiveAttendance ? (
                      <Link
                        href={`/classes`}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-ink bg-primary text-white font-heading font-bold text-sm hover:bg-primary-dark active:translate-y-0.5 shadow-retro transition-all"
                      >
                        <Key className="h-4 w-4" />
                        <span>Absen Sekarang</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/classes`}
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-ink font-heading font-bold text-xs sm:text-sm transition-all shadow-xs',
                          isOngoing
                            ? 'bg-ink text-white hover:bg-ink/90'
                            : 'bg-surface text-ink hover:bg-gray-soft'
                        )}
                      >
                        <Play className="h-4 w-4" />
                        <span>Masuk Kelas</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
