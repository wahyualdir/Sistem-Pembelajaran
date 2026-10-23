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
import { Calendar, Flame, Activity, Filter, Info, TrendingUp } from 'lucide-react';
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
  aksiHeader?: React.ReactNode;
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
  aksiHeader,
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

  const isRingkas = mode === 'ringkas';
  const cellDimClass = isRingkas
    ? 'w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[17px] md:h-[17px]'
    : 'w-3 h-3 sm:w-3.5 sm:h-3.5';
  const cellHeightClass = isRingkas
    ? 'h-3.5 sm:h-4 md:h-[17px]'
    : 'h-3 sm:h-3.5';
  const gapClass = isRingkas
    ? 'gap-1 sm:gap-1.5 md:gap-2'
    : 'gap-1 sm:gap-1.5';
  const daySpacerClass = isRingkas
    ? 'w-7 sm:w-8 md:w-9'
    : 'w-6 sm:w-7';

  return (
    <div
      className={cn(
        'rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4 font-sans',
        className
      )}
    >
      {/* HEADER & FILTER */}
      {(judul || deskripsi || tampilkanFilterKelas || aksiHeader) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink/10 pb-3.5">
          <div className="space-y-1">
            {judul ? (
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md border border-primary/25 bg-primary/10 text-primary shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-ink tracking-tight">
                  {judul}
                </h3>
              </div>
            ) : null}
            {deskripsi ? (
              <p className="text-xs text-stone-600 font-sans leading-relaxed">
                {deskripsi}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            {aksiHeader}
            {tampilkanFilterKelas && daftarKelas.length > 0 && (
              <div className="flex items-center gap-2">
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
        </div>
      )}

      {/* STATISTIK RINGKAS */}
      {tampilkanStatistik && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 py-1">
          {/* Total Aktivitas */}
          <div className="rounded-lg border border-stone-300/80 bg-stone-50/70 p-3 space-y-1 shadow-2xs hover:border-ink/30 transition-all">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider block">
                Total Aktivitas
              </span>
              <Activity className="h-4 w-4 text-stone-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading font-black text-xl sm:text-2xl text-ink tabular-nums">
                {stats.totalAktivitas}
              </span>
              <span className="text-xs font-semibold text-stone-500 font-sans">aksi</span>
            </div>
          </div>

          {/* Poin Kontribusi */}
          <div className="rounded-lg border border-[#853827]/30 bg-[#853827]/5 p-3 space-y-1 shadow-2xs hover:border-[#853827]/50 transition-all">
            <div className="flex items-center justify-between text-[#853827]">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider block">
                Poin Kontribusi
              </span>
              <Flame className="h-4 w-4 text-[#853827]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading font-black text-xl sm:text-2xl text-[#853827] tabular-nums">
                {stats.totalPoin}
              </span>
              <span className="text-xs font-semibold text-[#853827]/80 font-sans">poin</span>
            </div>
          </div>

          {/* Hari Aktif */}
          <div className="rounded-lg border border-stone-300/80 bg-stone-50/70 p-3 space-y-1 shadow-2xs hover:border-ink/30 transition-all">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider block">
                Hari Aktif
              </span>
              <Calendar className="h-4 w-4 text-stone-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading font-black text-xl sm:text-2xl text-ink tabular-nums">
                {stats.hariAktif}
              </span>
              <span className="text-xs font-semibold text-stone-500 font-sans">
                / {stats.rentangHari} hari
              </span>
            </div>
          </div>

          {/* Tingkat Keaktifan */}
          <div className="rounded-lg border border-stone-300/80 bg-stone-50/70 p-3 space-y-1 shadow-2xs hover:border-ink/30 transition-all">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider block">
                Tingkat Keaktifan
              </span>
              <TrendingUp className="h-4 w-4 text-stone-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading font-black text-xl sm:text-2xl text-ink tabular-nums">
                {rasioAktif}%
              </span>
              <span className="text-xs font-semibold text-stone-500 font-sans">konsisten</span>
            </div>
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
          className="overflow-x-auto pb-2 pt-2 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg scrollbar-thin"
        >
          <div className="inline-block min-w-max select-none">
            {/* BARIS LABEL BULAN (Tepat Presisi Mengikuti Kolom Minggu) */}
            <div className="flex items-center mb-1.5">
              {/* Spacer penyeimbang label hari di sebelah kiri */}
              <div className={cn('shrink-0 pr-2 select-none', daySpacerClass)} aria-hidden="true" />

              {/* Kolom Indikator Bulan yang Sejajar Kolom Sel */}
              <div className={cn('flex', gapClass)}>
                {weeks.map((_, colIdx) => {
                  const monthLabel = months.find((m) => m.colIndex === colIdx);
                  return (
                    <div
                      key={`m-${colIdx}`}
                      className={cn('shrink-0 relative h-4 text-left', cellDimClass)}
                    >
                      {monthLabel ? (
                        <span className="absolute left-0 top-0 text-[11px] font-sans font-extrabold text-stone-600 select-none whitespace-nowrap">
                          {monthLabel.label}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GRID UTAMA: 7 BARIS (SENIN S.D. MINGGU) */}
            <div className="flex">
              {/* LABEL HARI DI SEBELAH KIRI (Sinkronisasi Tinggi Baris & Gap 100%) */}
              <div className={cn('flex flex-col shrink-0 pr-2 text-right', daySpacerClass, gapClass)}>
                {NAMA_HARI_SENIN_PERTAMA.map((nama, idx) => {
                  const isVisible = idx === 0 || idx === 2 || idx === 4; // Sen, Rab, Jum
                  return (
                    <div
                      key={nama}
                      className={cn(
                        'w-full flex items-center justify-end text-[10px] sm:text-[11px] font-sans font-extrabold text-stone-500 select-none',
                        cellHeightClass
                      )}
                    >
                      {isVisible ? (
                        <span>{nama}</span>
                      ) : (
                        <span className="sr-only">{nama}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* KOLOM MINGGU */}
              <div
                className={cn('flex', gapClass)}
                role="grid"
                aria-label={`Grafik kontribusi dari ${formatTanggalIndo(startDate)} hingga ${formatTanggalIndo(endDate)}`}
              >
                <span className="sr-only">
                  Ringkasan: {stats.totalAktivitas} total aktivitas dan {stats.totalPoin} poin pada {stats.hariAktif} hari aktif.
                </span>

                {weeks.map((week) => (
                  <div
                    key={`w-${week.weekIndex}`}
                    className={cn('flex flex-col shrink-0', gapClass)}
                    role="row"
                  >
                    {week.days.map((sel, dayIdx) => {
                      if (!sel) {
                        return (
                          <div
                            key={`empty-${dayIdx}`}
                            className={cn(cellDimClass, 'opacity-0')}
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
                            cellDimClass,
                            'rounded-[3px] border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ink focus:z-10',
                            sel.isCurrentPeriod
                              ? KELAS_WARNA_LEVEL[sel.level]
                              : 'border border-dashed border-stone-200/90 bg-stone-100/40 pointer-events-none'
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-gray-dark border-t-2 border-ink/10 pt-3">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-gray-dark" />
          <span className="text-[11px] font-medium text-stone-600">
            Diperbarui secara langsung per aktivitas terverifikasi.
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto bg-stone-100/80 px-2.5 py-1 rounded-md border border-stone-200">
          <span className="text-[11px] font-bold text-stone-600">Kurang</span>
          <div className="flex items-center gap-1">
            <span
              title="Level 0: 0 poin"
              className={cn('w-3.5 h-3.5 rounded-[2px] border', KELAS_WARNA_LEVEL[0])}
            />
            <span
              title="Level 1: 1-2 poin"
              className={cn('w-3.5 h-3.5 rounded-[2px] border', KELAS_WARNA_LEVEL[1])}
            />
            <span
              title="Level 2: 3-5 poin"
              className={cn('w-3.5 h-3.5 rounded-[2px] border', KELAS_WARNA_LEVEL[2])}
            />
            <span
              title="Level 3: 6-9 poin"
              className={cn('w-3.5 h-3.5 rounded-[2px] border', KELAS_WARNA_LEVEL[3])}
            />
            <span
              title="Level 4: 10+ poin"
              className={cn('w-3.5 h-3.5 rounded-[2px] border', KELAS_WARNA_LEVEL[4])}
            />
          </div>
          <span className="text-[11px] font-bold text-stone-600">Lebih</span>
        </div>
      </div>
    </div>
  );
}
