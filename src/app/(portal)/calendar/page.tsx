import React from 'react';
import Link from 'next/link';
import { listCalendarAction } from '@/modules/academic/actions';
import { RetroWindow } from '@/components/retro/retro-window';
import { CalendarSyncModal } from '@/modules/academic/calendar-sync-modal';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { CalendarViewSwitcher } from '@/modules/academic/calendar-view-switcher';

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const jam = (iso: string) =>
  `${new Date(iso).toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
  })} WIB`;

export default async function CalendarPage() {
  const items = await listCalendarAction();
  const now = Date.now();
  const groups = new Map<string, typeof items>();
  for (const it of items) {
    const k = tanggal(it.due_at);
    groups.set(k, [...(groups.get(k) ?? []), it]);
  }

  const totalTugas = items.length;
  const sudahSelesai = items.filter((i) => i.done).length;
  const belumSelesai = totalTugas - sudahSelesai;

  return (
    <div className="p-4 sm:p-6 lg:p-10 w-full space-y-6 sm:space-y-8 lg:space-y-9 animate-fade-up">
      {/* 1. HEADER WINDOW KALENDER */}
      <RetroWindow
        title="Kalender Pembelajaran"
        badge="AGENDA PEMBELAJARAN"
        headerClassName="bg-gray-soft"
        bodyClassName="p-4 sm:p-6 lg:p-8 bg-retro-surface"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2.5 sm:p-3 rounded-xl border-2 border-black bg-primary text-white shadow-retro-md shrink-0">
                <CalendarDays className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h1 className="font-heading font-bold text-xl sm:text-2xl lg:text-4xl tracking-tight text-black">
                Kalender Pembelajaran & Tenggat
              </h1>
            </div>
            <p className="text-sm sm:text-base lg:text-xl text-black font-bold max-w-3xl leading-relaxed">
              Jadwal sesi perkuliahan terintegrasi, tenggat pengumpulan tugas, kuis, dan pelaksanaan ujian semester.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <CalendarSyncModal />
            <span className="rounded-xl border-2 border-black bg-white px-3.5 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-base lg:text-lg font-bold text-black shadow-retro">
              Semester Ganjil 2026/2027
            </span>
          </div>
        </div>

        {/* 3 Kartu Metrik Tenggat - Responsif Phone, iPad & Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5 pt-6 sm:pt-8 border-t-2 border-black mt-6 sm:mt-8">
          {/* Card 1: Total Agenda */}
          <div className="p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-retro flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-all">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-xs sm:text-sm lg:text-base font-bold uppercase tracking-wide text-black">
                Total Agenda
              </p>
              <p className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-black tracking-tight leading-none">
                {totalTugas}
              </p>
              <p className="text-xs sm:text-xs lg:text-sm font-bold text-black pt-1">
                Semua kegiatan semester
              </p>
            </div>
            <div className="p-3 sm:p-3.5 lg:p-4 rounded-xl border-2 border-black bg-gray-soft text-black shrink-0 shadow-xs">
              <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
            </div>
          </div>

          {/* Card 2: Perlu Diselesaikan */}
          <div className="p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-retro flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-all">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-xs sm:text-sm lg:text-base font-bold uppercase tracking-wide text-black">
                Perlu Diselesaikan
              </p>
              <p className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-black tracking-tight leading-none">
                {belumSelesai}
              </p>
              <p className="text-xs sm:text-xs lg:text-sm font-bold text-primary pt-1">
                Tenggat tugas aktif
              </p>
            </div>
            <div className="p-3 sm:p-3.5 lg:p-4 rounded-xl border-2 border-black bg-gray-soft text-black shrink-0 shadow-xs">
              <Clock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-black" />
            </div>
          </div>

          {/* Card 3: Sudah Dikumpulkan */}
          <div className="p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border-2 border-black bg-white shadow-retro flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-all">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-xs sm:text-sm lg:text-base font-bold uppercase tracking-wide text-black">
                Sudah Dikumpulkan
              </p>
              <p className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-black tracking-tight leading-none">
                {sudahSelesai}
              </p>
              <p className="text-xs sm:text-xs lg:text-sm font-bold text-black pt-1">
                Tuntas terverifikasi
              </p>
            </div>
            <div className="p-3 sm:p-3.5 lg:p-4 rounded-xl border-2 border-black bg-retro-mint text-black shrink-0 shadow-xs">
              <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-black" />
            </div>
          </div>
        </div>
      </RetroWindow>

      {/* 2. DAFTAR AGENDA BERDASARKAN TANGGAL & TAB TENGGAT */}
      <RetroWindow
        title="Daftar Agenda & Tenggat Perkuliahan"
        badge="TIMELINE & TENGGAT"
        headerClassName="bg-gray-soft"
        bodyClassName="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-7"
      >
        <CalendarViewSwitcher items={items} />
      </RetroWindow>
    </div>
  );
}
