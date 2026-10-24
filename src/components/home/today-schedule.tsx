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
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#9F1521] block">
            AGENDA PERKULIAHAN
          </span>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-[#111111]">
            Jadwal Hari Ini
          </h2>
        </div>
        <Link
          href="/calendar"
          className="text-xs font-bold text-[#9F1521] hover:text-[#111111] transition-colors shrink-0"
        >
          Kalender Akademik &rarr;
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-8 px-5 rounded-2xl border border-[#E2E3E4] bg-[#FFFFFF] text-center space-y-2">
          <CalendarDays className="h-7 w-7 text-[#808285] mx-auto" />
          <p className="font-heading font-bold text-base text-[#111111]">Tidak Ada Kuliah Hari Ini</p>
          <p className="text-xs font-normal text-[#58595B] max-w-md mx-auto">
            Tidak ada jadwal perkuliahan aktif yang dijadwalkan untuk hari ini.
          </p>
          <div className="pt-1">
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#9F1521] text-white text-xs font-bold hover:bg-[#8F131E] transition-colors"
            >
              <span>Buka Kalender Akademik</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E2E3E4] bg-[#FFFFFF] divide-y divide-[#E2E3E4] overflow-hidden shadow-2xs">
          {items.map((item) => {
            const isOngoing = item.status === 'BERLANGSUNG';
            const isFinished = item.status === 'SELESAI';
            const timeParts = item.time.split('-').map((s) => s.trim());
            const startTime = timeParts[0] || item.time;
            const endTime = timeParts[1] || '';

            return (
              <div
                key={item.id}
                className={cn(
                  'p-4 sm:p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                  isOngoing ? 'bg-[#FEF2F2]/40' : 'hover:bg-[#F3F3F4]/50'
                )}
              >
                {/* Kiri: Blok Kalender/Jam Gaya rtin-calender Telkom University */}
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <div
                    className={cn(
                      'w-20 sm:w-24 rounded-xl border p-2.5 text-center shrink-0 flex flex-col justify-center',
                      isOngoing
                        ? 'bg-[#9F1521] border-[#9F1521] text-white'
                        : 'bg-[#F3F3F4] border-[#E2E3E4] text-[#111111]'
                    )}
                  >
                    <span
                      className={cn(
                        'font-heading font-black text-base sm:text-lg leading-tight tabular-nums',
                        isOngoing ? 'text-white' : 'text-[#9F1521]'
                      )}
                    >
                      {startTime.replace(' WIB', '')}
                    </span>
                    {endTime && (
                      <span
                        className={cn(
                          'text-[11px] font-normal leading-tight mt-0.5 tabular-nums',
                          isOngoing ? 'text-white/85' : 'text-[#58595B]'
                        )}
                      >
                        s/d {endTime}
                      </span>
                    )}
                    <span
                      className={cn(
                        'text-[10px] font-mono font-bold uppercase tracking-wider mt-1 pt-1 border-t',
                        isOngoing
                          ? 'border-white/20 text-white'
                          : 'border-[#E2E3E4] text-[#808285]'
                      )}
                    >
                      {item.code}
                    </span>
                  </div>

                  {/* Tengah: Kontras Font Besar (Judul) vs Kecil (Dosen & Ruangan) */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {isOngoing ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#9F1521] text-white uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Sedang Berlangsung
                        </span>
                      ) : isFinished ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#808285]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Selesai
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#808285]">
                          Terjadwal Hari Ini
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading font-bold text-base sm:text-[17px] text-[#111111] leading-snug">
                      <Link href={`/classes/${item.id}`} className="hover:text-[#9F1521] transition-colors">
                        {item.title}
                      </Link>
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-normal text-[#58595B]">
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#808285]" />
                        <span>{item.lecturer}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#111111]">
                        <MapPin className="h-3.5 w-3.5 text-[#9F1521]" />
                        <span>{item.room}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kanan: Tombol Pill Bulat Khas Telkom University */}
                <div className="flex items-center justify-end shrink-0">
                  {isOngoing && item.hasActiveAttendance ? (
                    <Link
                      href={`/classes/${item.id}?tab=presensi`}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#9F1521] text-white font-bold text-xs hover:bg-[#8F131E] transition-colors"
                    >
                      <Key className="h-3.5 w-3.5" />
                      <span>Presensi</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/classes/${item.id}`}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-5 py-2 rounded-full border font-bold text-xs transition-colors',
                        isOngoing
                          ? 'bg-[#9F1521] text-white border-[#9F1521] hover:bg-[#8F131E]'
                          : 'bg-[#FFFFFF] text-[#111111] border-[#D0D6DD] hover:border-[#9F1521] hover:text-[#9F1521]'
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
