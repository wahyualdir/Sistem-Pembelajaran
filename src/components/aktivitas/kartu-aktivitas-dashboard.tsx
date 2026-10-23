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
  deskripsi = 'Aktivitas pengumpulan tugas, kuis CBT, presensi kuliah, dan diskusi Anda selama 6 bulan terakhir.',
  role = 'mahasiswa',
  profileUrl = '/profile',
}: KartuAktivitasDashboardProps) {
  return (
    <section aria-label={judul} className="w-full">
      <HeatmapKontribusi
        data={data}
        mode="ringkas"
        judul={judul}
        deskripsi={deskripsi}
        aksiHeader={
          <Link
            href={profileUrl}
            className="text-xs font-bold text-ink hover:text-primary transition-colors inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200/80 border border-stone-300 shadow-2xs group shrink-0"
          >
            <span>12 Bulan Penuh</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-stone-500 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        }
        tampilkanFilterKelas={false}
        tampilkanStatistik={true}
      />
    </section>
  );
}
