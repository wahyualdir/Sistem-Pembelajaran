'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar as CalendarIcon,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RetroWindow } from '@/components/retro/retro-window';

export interface CalendarItem {
  assignment_id: string;
  class_id: string;
  class_title: string;
  title: string;
  due_at: string;
  close_at: string;
  done: boolean;
}

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

export function CalendarViewSwitcher({ items }: { items: CalendarItem[] }) {
  const [activeTab, setActiveTab] = useState<'kalender' | 'tenggat'>('kalender');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const classes = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) {
      map.set(it.class_id, it.class_title);
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedClass === 'all') return items;
    return items.filter((it) => it.class_id === selectedClass);
  }, [items, selectedClass]);

  // Bucketing untuk Tab Tenggat
  const buckets = useMemo(() => {
    const now = new Date();
    // Gunakan zona waktu WIB (UTC+7)
    const wibNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const todayStart = new Date(wibNow.getFullYear(), wibNow.getMonth(), wibNow.getDate()).getTime();
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
    const dayAfterTomorrowStart = tomorrowStart + 24 * 60 * 60 * 1000;
    const endOfWeek = todayStart + 7 * 24 * 60 * 60 * 1000;

    const res = {
      lewat: [] as CalendarItem[],
      hariIni: [] as CalendarItem[],
      besok: [] as CalendarItem[],
      mingguIni: [] as CalendarItem[],
      nanti: [] as CalendarItem[],
    };

    for (const it of filteredItems) {
      const itTime = new Date(it.due_at).getTime();
      if (itTime < todayStart && !it.done) {
        res.lewat.push(it);
      } else if (itTime >= todayStart && itTime < tomorrowStart) {
        res.hariIni.push(it);
      } else if (itTime >= tomorrowStart && itTime < dayAfterTomorrowStart) {
        res.besok.push(it);
      } else if (itTime >= dayAfterTomorrowStart && itTime <= endOfWeek) {
        res.mingguIni.push(it);
      } else {
        res.nanti.push(it);
      }
    }
    return res;
  }, [filteredItems]);

  // Grouping tanggal untuk Tab Kalender
  const dateGroups = useMemo(() => {
    const groups = new Map<string, CalendarItem[]>();
    for (const it of filteredItems) {
      const k = tanggal(it.due_at);
      groups.set(k, [...(groups.get(k) ?? []), it]);
    }
    return groups;
  }, [filteredItems]);

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('kalender')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 border-black transition-all cursor-pointer',
              activeTab === 'kalender'
                ? 'bg-black text-white shadow-retro'
                : 'bg-white text-black hover:bg-gray-soft shadow-xs'
            )}
          >
            Tampilan Kalender
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tenggat')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 border-black transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'tenggat'
                ? 'bg-black text-white shadow-retro'
                : 'bg-white text-black hover:bg-gray-soft shadow-xs'
            )}
          >
            <span>Tab Tenggat</span>
            {buckets.lewat.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-xs font-bold">
                {buckets.lewat.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter per kelas */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-black/60 shrink-0" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 rounded-lg border-2 border-black bg-white text-xs sm:text-sm font-bold text-black shadow-xs focus:outline-hidden"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. TAMPILAN TAB TENGGAT (BERDASARKAN KATEGORI WAKTU)     */}
      {/* ======================================================== */}
      {activeTab === 'tenggat' && (
        <div className="space-y-6">
          {/* Kelompok: Lewat */}
          {buckets.lewat.length > 0 && (
            <div className="rounded-2xl border-2 border-black/40 bg-gray-soft p-5 space-y-3">
              <div className="flex items-center gap-2 text-black font-bold text-sm sm:text-base">
                <AlertTriangle className="h-5 w-5 text-black" />
                <span>Lewat Tenggat ({buckets.lewat.length})</span>
              </div>
              <div className="space-y-2">
                {buckets.lewat.map((r) => (
                  <DeadlineCard key={r.assignment_id} item={r} badgeVariant="lewat" />
                ))}
              </div>
            </div>
          )}

          {/* Kelompok: Hari Ini */}
          <div className="rounded-2xl border-2 border-black bg-white shadow-retro p-5 space-y-3">
            <div className="flex items-center gap-2 text-black font-bold text-sm sm:text-base">
              <Clock className="h-5 w-5 text-black" />
              <span>Hari Ini ({buckets.hariIni.length})</span>
            </div>
            {buckets.hariIni.length === 0 ? (
              <p className="text-xs text-black/70 font-medium italic">Tidak ada tenggat hari ini.</p>
            ) : (
              <div className="space-y-2">
                {buckets.hariIni.map((r) => (
                  <DeadlineCard key={r.assignment_id} item={r} badgeVariant="hari_ini" />
                ))}
              </div>
            )}
          </div>

          {/* Kelompok: Besok */}
          <div className="rounded-2xl border-2 border-black/15 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-black font-bold text-sm sm:text-base">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <span>Besok ({buckets.besok.length})</span>
            </div>
            {buckets.besok.length === 0 ? (
              <p className="text-xs text-black/60 font-medium italic">Tidak ada tenggat besok.</p>
            ) : (
              <div className="space-y-2">
                {buckets.besok.map((r) => (
                  <DeadlineCard key={r.assignment_id} item={r} />
                ))}
              </div>
            )}
          </div>

          {/* Kelompok: Minggu Ini */}
          <div className="rounded-2xl border-2 border-black/15 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-black font-bold text-sm sm:text-base">
              <CalendarDays className="h-5 w-5 text-black" />
              <span>Minggu Ini ({buckets.mingguIni.length})</span>
            </div>
            {buckets.mingguIni.length === 0 ? (
              <p className="text-xs text-black/60 font-medium italic">Tidak ada tenggat sisa minggu ini.</p>
            ) : (
              <div className="space-y-2">
                {buckets.mingguIni.map((r) => (
                  <DeadlineCard key={r.assignment_id} item={r} />
                ))}
              </div>
            )}
          </div>

          {/* Kelompok: Nanti */}
          <div className="rounded-2xl border-2 border-black/15 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-black font-bold text-sm sm:text-base">
              <CalendarDays className="h-5 w-5 text-black/60" />
              <span>Nanti ({buckets.nanti.length})</span>
            </div>
            {buckets.nanti.length === 0 ? (
              <p className="text-xs text-black/60 font-medium italic">Tidak ada tenggat jauh mendatang.</p>
            ) : (
              <div className="space-y-2">
                {buckets.nanti.map((r) => (
                  <DeadlineCard key={r.assignment_id} item={r} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TAMPILAN TAB KALENDER (BERDASARKAN TANGGAL)           */}
      {/* ======================================================== */}
      {activeTab === 'kalender' && (
        <div className="space-y-6">
          {dateGroups.size === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-black bg-gray-soft/40 space-y-4">
              <CalendarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-black mx-auto" />
              <h3 className="text-lg sm:text-xl font-bold text-black">Belum Ada Tenggat Perkuliahan</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-lg mx-auto leading-relaxed">
                Tidak ada tenggat pengumpulan tugas atau kuis untuk filter ini.
              </p>
            </div>
          ) : (
            [...dateGroups.entries()].map(([hari, rows], gi) => (
              <div key={hari} className="space-y-3 animate-fade-up" style={{ animationDelay: `${gi * 40}ms` }}>
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-primary border-2 border-black" />
                  <h2 className="font-heading font-bold text-base sm:text-lg text-black">{hari}</h2>
                  <span className="rounded-full border-2 border-black bg-white px-2.5 py-0.5 text-xs font-bold text-black shadow-xs">
                    {rows.length} kegiatan
                  </span>
                </div>

                <div className="space-y-3 pl-3 sm:pl-4 border-l-2 border-black">
                  {rows.map((r) => (
                    <DeadlineCard key={r.assignment_id} item={r} showDate />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function DeadlineCard({
  item,
  badgeVariant,
  showDate = false,
}: {
  item: CalendarItem;
  badgeVariant?: 'lewat' | 'hari_ini';
  showDate?: boolean;
}) {
  const isClosed = Date.now() > Date.parse(item.close_at);

  return (
    <div
      className={cn(
        'p-3.5 sm:p-4 rounded-xl border-2 border-black bg-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-soft/20 transition-all',
        badgeVariant === 'lewat' && 'border-black bg-gray-soft/20',
        badgeVariant === 'hari_ini' && 'border-black shadow-retro-sm'
      )}
    >
      <div className="space-y-1 flex-1 min-w-0 w-full">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded border border-black/30 bg-gray-soft text-xs font-bold text-black truncate max-w-[200px]">
            {item.class_title}
          </span>
          <Link
            href={`/classes/${item.class_id}`}
            className="font-bold text-sm sm:text-base text-black hover:text-primary transition-colors truncate block"
          >
            {item.title}
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs text-black/70 font-medium">
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            {showDate ? `${tanggal(item.due_at)}, pukul ` : 'Pukul: '}
            {jam(item.due_at)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-start pt-1 sm:pt-0 border-t border-black/10 sm:border-t-0">
        {item.done ? (
          <span className="px-2.5 py-1 rounded-lg border-2 border-black bg-retro-mint text-black font-bold text-xs flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Selesai
          </span>
        ) : isClosed ? (
          <span className="px-2.5 py-1 rounded-lg border-2 border-black bg-black text-white font-bold text-xs flex items-center gap-1.5 shadow-retro-sm">
            <AlertCircle className="h-3.5 w-3.5" />
            Ditutup
          </span>
        ) : badgeVariant === 'lewat' ? (
          <span className="px-2.5 py-1 rounded-lg border-2 border-black bg-gray-soft text-black font-bold text-xs flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-black" />
            Terlambat
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-lg border border-black/30 bg-gray-soft text-black font-semibold text-xs flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-black" />
            Tenggat
          </span>
        )}
        <Link
          href={`/classes/${item.class_id}`}
          className="px-3 py-1.5 rounded-lg border-2 border-black bg-black text-white hover:bg-neutral-800 transition-all font-bold text-xs flex items-center gap-1.5 shadow-xs"
          title="Buka Kelas"
        >
          <span>Buka</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
