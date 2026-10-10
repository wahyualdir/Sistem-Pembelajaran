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
          <div className="p-2 rounded-lg border-2 border-retro-border bg-retro-warm text-black shadow-xs">
            <CalendarDays className="h-5 w-5" />
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-foreground">
            Jadwal Hari Ini
          </h2>
        </div>
        <Link
          href="/calendar"
          className="text-base sm:text-lg font-black text-muted-foreground hover:text-foreground transition-colors"
        >
          more &rarr;
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-6 sm:p-8 rounded-2xl border-2 border-retro-border bg-retro-surface shadow-retro text-center space-y-3">
          <CalendarDays className="h-9 w-9 text-muted-foreground mx-auto" />
          <p className="font-heading font-black text-xl text-foreground">Tidak Ada Kuliah Hari Ini</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Jadwal berikutnya: <strong>Rekayasa Perangkat Lunak (Selasa, 10:45 WIB)</strong> di Ruang Teori 304.
          </p>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black bg-retro-warm font-heading font-bold text-xs hover:bg-black hover:text-white transition-all shadow-xs"
          >
            <span>Buka Kalender Akademik</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-retro-border">
          {items.map((item, index) => {
            const isOngoing = item.status === 'BERLANGSUNG';
            const isFinished = item.status === 'SELESAI';

            return (
              <div key={item.id} className="relative group">
                {/* Bullet titik timeline */}
                <div
                  className={cn(
                    'absolute -left-6 sm:-left-8 top-4.5 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center transition-transform group-hover:scale-125 z-10',
                    isOngoing
                      ? 'bg-retro-mint shadow-xs animate-pulse'
                      : isFinished
                      ? 'bg-retro-warm'
                      : 'bg-white'
                  )}
                >
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      isOngoing ? 'bg-black' : isFinished ? 'bg-black/40' : 'bg-black'
                    )}
                  />
                </div>

                {/* Kartu timeline item */}
                <div
                  className={cn(
                    'p-4 sm:p-5 rounded-xl border-2 border-retro-border bg-retro-surface shadow-retro transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5',
                    isOngoing && 'bg-retro-warm/60 border-black shadow-retro-md ring-1 ring-black'
                  )}
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-sans font-black text-black">
                        {item.time}
                      </span>

                      {/* Status Badge */}
                      {isOngoing && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans font-black bg-retro-mint text-black border border-black animate-pulse">
                          ● BERLANGSUNG
                        </span>
                      )}
                      {isFinished && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-bold bg-muted text-muted-foreground border border-black/30">
                          SELESAI
                        </span>
                      )}
                      {!isOngoing && !isFinished && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-sans font-bold bg-retro-yellow text-black border border-black">
                          AKAN DATANG
                        </span>
                      )}

                      <span className="text-xs font-sans font-bold px-2 py-0.5 rounded bg-black/5 border border-black/20">
                        {item.code}
                      </span>
                    </div>

                    <h3 className="font-heading font-black text-lg sm:text-xl text-foreground break-words leading-snug">
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs sm:text-sm text-black/80 flex-wrap">
                      <div className="flex items-center gap-1.5 font-bold">
                        <MapPin className="h-4 w-4 text-retro-orange shrink-0" />
                        <span>{item.room}</span>
                      </div>
                      <span className="text-black/30">•</span>
                      <span className="font-medium text-black/80 break-words">{item.lecturer}</span>
                    </div>
                  </div>

                  {/* Tombol aksi khusus untuk kelas BERLANGSUNG */}
                  <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/10">
                    {isOngoing && item.hasActiveAttendance ? (
                      <Link
                        href={`/classes`}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-retro-border bg-retro-yellow text-black font-heading font-black text-sm hover:bg-retro-yellow/90 active:translate-y-0.5 shadow-retro transition-all"
                      >
                        <Key className="h-4 w-4" />
                        <span>Absen Sekarang</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/classes`}
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-retro-border font-heading font-bold text-xs sm:text-sm transition-all shadow-xs',
                          isOngoing
                            ? 'bg-black text-white hover:bg-black/90'
                            : 'bg-retro-surface text-foreground hover:bg-retro-warm'
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
