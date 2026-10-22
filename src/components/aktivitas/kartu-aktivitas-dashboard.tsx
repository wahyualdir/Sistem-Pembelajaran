'use client';

import React from 'react';
import Link from 'next/link';
import { ItemAktivitasHarian } from '@/lib/aktivitas';
import { HeatmapKontribusi } from './heatmap-kontribusi';
import { ArrowUpRight } from 'lucide-react';

export interface KartuAktivitasDashboardProps {
  data: ItemAktivitasHarian[];
  judul?: string;
  deskripsi?: string;
  role?: 'mahasiswa' | 'dosen' | 'umum';
  profileUrl?: string;
}

export function KartuAktivitasDashboard({
  data = [],
  judul = 'Grafik Kontribusi Belajar (26 Minggu)',
  deskripsi = 'Aktivitas pengumpulan tugas, kuis, presensi, dan diskusi Anda selama 6 bulan terakhir.',
  role = 'mahasiswa',
  profileUrl = '/profile',
}: KartuAktivitasDashboardProps) {
  return (
    <section aria-label={judul} className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg sm:text-xl tracking-tight text-ink">
          {judul}
        </h2>
        <Link
          href={profileUrl}
          className="text-xs font-bold text-primary-dark hover:text-ink transition-colors flex items-center gap-1 group"
        >
          <span>12 Bulan Penuh</span>
          <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      <HeatmapKontribusi
        data={data}
        mode="ringkas"
        judul=""
        deskripsi={deskripsi}
        tampilkanFilterKelas={false}
        tampilkanStatistik={true}
      />
    </section>
  );
}
