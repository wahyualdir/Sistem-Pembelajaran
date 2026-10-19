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
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER HALAMAN: KALENDER PEMBELAJARAN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <CalendarDays className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Kalender Pembelajaran & Tenggat
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Jadwal sesi perkuliahan terintegrasi, tenggat pengumpulan tugas, kuis, dan pelaksanaan ujian semester.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <CalendarSyncModal />
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              SEMESTER GANJIL 2026/2027
            </span>
          </div>
        </div>

        {/* 3 Kartu Metrik Tenggat */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Total Agenda */}
          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-sans font-medium uppercase tracking-[0.04em] text-gray-dark">
                Total Agenda
              </p>
              <p className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight leading-none">
                {totalTugas}
              </p>
              <p className="text-xs text-gray-dark font-bold pt-0.5">
                Semua kegiatan semester
              </p>
            </div>
            <div className="p-2.5 rounded-lg border-2 border-ink bg-gray-soft text-ink shrink-0 shadow-xs">
              <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>

          {/* Card 2: Perlu Diselesaikan */}
          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-sans font-medium uppercase tracking-[0.04em] text-gray-dark">
                Perlu Diselesaikan
              </p>
              <p className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight leading-none">
                {belumSelesai}
              </p>
              <p className="text-xs text-primary font-bold pt-0.5">
                Tenggat tugas aktif
              </p>
            </div>
            <div className="p-2.5 rounded-lg border-2 border-ink bg-gray-soft text-ink shrink-0 shadow-xs">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
          </div>

          {/* Card 3: Sudah Dikumpulkan */}
          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-sans font-medium uppercase tracking-[0.04em] text-gray-dark">
                Sudah Dikumpulkan
              </p>
              <p className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight leading-none">
                {sudahSelesai}
              </p>
              <p className="text-xs text-gray-dark font-bold pt-0.5">
                Tuntas terverifikasi
              </p>
            </div>
            <div className="p-2.5 rounded-lg border-2 border-ink bg-gray-soft text-ink shrink-0 shadow-xs">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-ink" />
            </div>
          </div>
        </div>

        {/* 2. DAFTAR AGENDA BERDASARKAN TANGGAL & TAB TENGGAT */}
        <section aria-label="Agenda dan Jadwal Perkuliahan" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-ink flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary inline-block" />
              Agenda & Jadwal Perkuliahan
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans font-bold bg-gray-soft border border-ink text-ink">
              TIMELINE & TENGGAT
            </span>
          </div>

          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-6 shadow-retro">
            <CalendarViewSwitcher items={items} />
          </div>
        </section>
      </div>
    </div>
  );
}
