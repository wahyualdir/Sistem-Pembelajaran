'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ItemAktivitasHarian,
  SelGridKontribusi,
  bangunGridKontribusi,
  poinKeLevel,
  KELAS_WARNA_LEVEL,
  LABEL_AKTIVITAS,
  formatTanggalIndo,
  NAMA_HARI_SENIN_PERTAMA,
} from '@/lib/aktivitas';
import { Calendar, Flame, Activity, Filter, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OpsiFilterKelas {
  id: string;
  label: string;
}

export interface HeatmapKontribusiProps {
  data: ItemAktivitasHarian[];
  mode?: 'penuh' | 'ringkas';
  judul?: string;
  deskripsi?: string;
  daftarKelas?: OpsiFilterKelas[];
  kelasIdTerpilih?: string;
  onPilihKelas?: (classId: string) => void;
  tampilkanFilterKelas?: boolean;
  tampilkanStatistik?: boolean;
  className?: string;
}

export function HeatmapKontribusi({
  data = [],
  mode = 'penuh',
  judul = 'Grafik Kontribusi & Aktivitas Belajar',
  deskripsi = 'Visualisasi frekuensi kontribusi tugas, diskusi, presensi, dan ujian harian.',
  daftarKelas = [],
  kelasIdTerpilih = 'semua',
  onPilihKelas,
  tampilkanFilterKelas = false,
  tampilkanStatistik = true,
  className,
}: HeatmapKontribusiProps) {
  const [filterKelas, setFilterKelas] = useState<string>(kelasIdTerpilih);
  const [hoveredCell, setHoveredCell] = useState<{
    sel: SelGridKontribusi;
    x: number;
    y: number;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Perbarui filter saat prop berubah
  useEffect(() => {
    setFilterKelas(kelasIdTerpilih);
  }, [kelasIdTerpilih]);

  const handleFilterChange = (idKelas: string) => {
    setFilterKelas(idKelas);
    if (onPilihKelas) {
      onPilihKelas(idKelas);
    }
  };

  // Filter data berdasarkan kelas yang dipilih
  const dataTerfilter = useMemo(() => {
    if (filterKelas === 'semua' || !filterKelas) {
      return data;
    }
    return data.filter((item) => item.classId === filterKelas);
  }, [data, filterKelas]);

  // Bangun grid kontribusi
  const gridHasil = useMemo(() => {
    return bangunGridKontribusi(dataTerfilter, { mode });
  }, [dataTerfilter, mode]);

  // Otomatis geser kontainer scroll ke sisi paling kanan (hari ini) pada pemuatan pertama
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [gridHasil]);

  const { weeks, months, stats, startDate, endDate } = gridHasil;

  const rasioAktif =
    stats.rentangHari > 0 ? Math.round((stats.hariAktif / stats.rentangHari) * 100) : 0;

  return (
    <div
      className={cn(
        'rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4 font-sans',
        className
      )}
    >
      {/* HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink/10 pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary shrink-0" />
            <h3 className="font-heading font-bold text-base sm:text-lg text-ink tracking-tight">
              {judul}
            </h3>
          </div>
          {deskripsi && (
            <p className="text-xs text-gray-dark font-medium leading-relaxed">
              {deskripsi}
            </p>
          )}
        </div>

        {tampilkanFilterKelas && daftarKelas.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Filter className="h-4 w-4 text-gray-dark" />
            <select
              value={filterKelas}
              onChange={(e) => handleFilterChange(e.target.value)}
              aria-label="Filter berdasarkan kelas perkuliahan"
              className="text-xs font-bold text-ink bg-surface border-2 border-ink rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs cursor-pointer"
            >
              <option value="semua">Semua Kelas ({daftarKelas.length})</option>
              {daftarKelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* STATISTIK RINGKAS */}
      {tampilkanStatistik && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 py-1">
          <div className="rounded-lg border-2 border-ink/20 bg-gray-soft/40 p-2.5 space-y-0.5">
            <span className="text-[11px] font-bold text-gray-dark uppercase tracking-wider block">
              Total Aktivitas
            </span>
            <span className="font-heading font-bold text-lg sm:text-xl text-ink">
              {stats.totalAktivitas}{' '}
              <span className="text-xs font-normal text-gray-dark font-sans">aksi</span>
            </span>
          </div>

          <div className="rounded-lg border-2 border-ink/20 bg-gray-soft/40 p-2.5 space-y-0.5">
            <span className="text-[11px] font-bold text-gray-dark uppercase tracking-wider block">
              Poin Kontribusi
            </span>
            <span className="font-heading font-bold text-lg sm:text-xl text-primary">
              {stats.totalPoin}{' '}
              <span className="text-xs font-normal text-gray-dark font-sans">poin</span>
            </span>
          </div>

          <div className="rounded-lg border-2 border-ink/20 bg-gray-soft/40 p-2.5 space-y-0.5">
            <span className="text-[11px] font-bold text-gray-dark uppercase tracking-wider block">
              Hari Aktif
            </span>
            <span className="font-heading font-bold text-lg sm:text-xl text-ink">
              {stats.hariAktif}{' '}
              <span className="text-xs font-normal text-gray-dark font-sans">
                / {stats.rentangHari} hari
              </span>
            </span>
          </div>

          <div className="rounded-lg border-2 border-ink/20 bg-gray-soft/40 p-2.5 space-y-0.5">
            <span className="text-[11px] font-bold text-gray-dark uppercase tracking-wider block">
              Tingkat Keaktifan
            </span>
            <span className="font-heading font-bold text-lg sm:text-xl text-ink">
              {rasioAktif}%{' '}
              <span className="text-xs font-normal text-gray-dark font-sans">konsisten</span>
            </span>
          </div>
        </div>
      )}

      {/* HEATMAP GRID CONTAINER (RESPONSIF DENGAN HORIZONTAL SCROLL) */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          role="region"
          aria-label="Matriks grafik kontribusi harian"
          className="overflow-x-auto pb-2 pt-1 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg scrollbar-thin"
        >
          <div className="inline-block min-w-max select-none">
            {/* BARIS LABEL BULAN */}
            <div className="flex text-[11px] font-bold text-gray-dark mb-1.5 pl-7 sm:pl-8">
              {weeks.map((w, colIdx) => {
                const monthLabel = months.find((m) => m.colIndex === colIdx);
                return (
                  <div
                    key={`m-${colIdx}`}
                    className="w-3 sm:w-3.5 mr-1 sm:mr-1.5 text-left shrink-0"
                  >
                    {monthLabel ? (
                      <span className="whitespace-nowrap">{monthLabel.label}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* GRID UTAMA: 7 BARIS (SENIN S.D. MINGGU) */}
            <div className="flex">
              {/* LABEL HARI DI SEBELAH KIRI */}
              <div className="flex flex-col justify-between pr-2 text-[10px] sm:text-[11px] font-bold text-gray-dark w-6 sm:w-7 shrink-0 text-right">
                <span className="h-3 sm:h-3.5 leading-3 sm:leading-3.5">Sen</span>
                <span className="h-3 sm:h-3.5 leading-3 sm:leading-3.5 opacity-0">Sel</span>
                <span className="h-3 sm:h-3.5 leading-3 sm:leading-3.5">Rab</span>
                <span className="h-3 sm:h-3.5 leading-3 sm:leading-3.5 opacity-0">Kam</span>
                <span className="h-3 sm:h-3.5 leading-3 sm:leading-3.5">Jum</span>
                <span className="h-3 sm:h-3.5 leading-3 sm:leading-3.5 opacity-0">Sab</span>
                <span className="h-3 sm:h-3.5 leading-3 sm:leading-3.5 opacity-0">Min</span>
              </div>

              {/* KOLOM MINGGU */}
              <div
                className="flex gap-1 sm:gap-1.5"
                role="grid"
                aria-label={`Grafik kontribusi dari ${formatTanggalIndo(startDate)} hingga ${formatTanggalIndo(endDate)}`}
              >
                <span className="sr-only">
                  Ringkasan: {stats.totalAktivitas} total aktivitas dan {stats.totalPoin} poin pada {stats.hariAktif} hari aktif.
                </span>

                {weeks.map((week) => (
                  <div
                    key={`w-${week.weekIndex}`}
                    className="flex flex-col gap-1 sm:gap-1.5 shrink-0"
                    role="row"
                  >
                    {week.days.map((sel, dayIdx) => {
                      if (!sel) {
                        return (
                          <div
                            key={`empty-${dayIdx}`}
                            className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-0"
                          />
                        );
                      }

                      const ariaLabel = `${formatTanggalIndo(sel.date, { denganHari: true })}: ${sel.count} aktivitas, ${sel.points} poin`;

                      return (
                        <div
                          key={sel.date}
                          role="gridcell"
                          tabIndex={sel.isCurrentPeriod ? 0 : -1}
                          aria-label={ariaLabel}
                          onMouseEnter={(e) => {
                            if (!sel.isCurrentPeriod) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredCell({
                              sel,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                          onFocus={(e) => {
                            if (!sel.isCurrentPeriod) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredCell({
                              sel,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }}
                          onBlur={() => setHoveredCell(null)}
                          className={cn(
                            'w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ink focus:z-10',
                            KELAS_WARNA_LEVEL[sel.level],
                            !sel.isCurrentPeriod && 'opacity-15 pointer-events-none'
                          )}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FLOATING INTERACTIVE TOOLTIP */}
        {hoveredCell && (
          <div
            style={{
              position: 'fixed',
              left: `${hoveredCell.x}px`,
              top: `${hoveredCell.y - 8}px`,
              transform: 'translate(-50%, -100%)',
            }}
            className="z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100 max-w-xs"
          >
            <div className="rounded-lg border-2 border-ink bg-ink text-surface text-xs p-2.5 shadow-retro space-y-1.5">
              <div className="border-b border-surface/20 pb-1">
                <span className="font-bold text-white block text-[11px]">
                  {formatTanggalIndo(hoveredCell.sel.date, { denganHari: true })}
                </span>
                <span className="text-[10px] text-surface/80 font-medium">
                  {hoveredCell.sel.points > 0
                    ? `${hoveredCell.sel.points} poin • ${hoveredCell.sel.count} aktivitas`
                    : 'Tidak ada aktivitas'}
                </span>
              </div>

              {hoveredCell.sel.points > 0 && (
                <div className="space-y-0.5 text-[10px] text-surface/90 pt-0.5">
                  {Object.entries(hoveredCell.sel.details).map(([kind, d]) => {
                    const label =
                      LABEL_AKTIVITAS[kind as keyof typeof LABEL_AKTIVITAS] || kind;
                    return (
                      <div key={kind} className="flex items-center justify-between gap-3">
                        <span className="truncate">• {label}</span>
                        <span className="font-bold text-white shrink-0">
                          {d?.count}x (+{d?.points}p)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER: LEGENDA TINGKAT AKTIVITAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-dark border-t-2 border-ink/10 pt-3">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-gray-dark" />
          <span className="text-[11px] font-medium">
            Diperbarui secara langsung per aktivitas terverifikasi.
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] font-bold text-gray-dark">Kurang</span>
          <div className="flex items-center gap-1">
            <span
              title="Level 0: 0 poin"
              className={cn('w-3 h-3 rounded-[2px] border', KELAS_WARNA_LEVEL[0])}
            />
            <span
              title="Level 1: 1-2 poin"
              className={cn('w-3 h-3 rounded-[2px] border', KELAS_WARNA_LEVEL[1])}
            />
            <span
              title="Level 2: 3-5 poin"
              className={cn('w-3 h-3 rounded-[2px] border', KELAS_WARNA_LEVEL[2])}
            />
            <span
              title="Level 3: 6-9 poin"
              className={cn('w-3 h-3 rounded-[2px] border', KELAS_WARNA_LEVEL[3])}
            />
            <span
              title="Level 4: 10+ poin"
              className={cn('w-3 h-3 rounded-[2px] border', KELAS_WARNA_LEVEL[4])}
            />
          </div>
          <span className="text-[11px] font-bold text-gray-dark">Lebih</span>
        </div>
      </div>
    </div>
  );
}
