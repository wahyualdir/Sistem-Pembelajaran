'use client';

import React, { useState } from 'react';
import { ItemAktivitasHarian } from '@/lib/aktivitas';
import { HeatmapKontribusi } from './heatmap-kontribusi';

export interface ProfileAktivitasSectionProps {
  aktivitas: ItemAktivitasHarian[];
  daftarKelas: { id: string; label: string }[];
}

export function ProfileAktivitasSection({
  aktivitas = [],
  daftarKelas = [],
}: ProfileAktivitasSectionProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>('semua');

  return (
    <div className="space-y-4">
      <HeatmapKontribusi
        data={aktivitas}
        mode="penuh"
        judul="Grafik Kontribusi & Riwayat Aktivitas (12 Bulan)"
        deskripsi="Matriks rekam jejak pengumpulan tugas, kuis CBT, presensi kuliah, dan diskusi forum selama setahun terakhir."
        daftarKelas={daftarKelas}
        kelasIdTerpilih={selectedClassId}
        onPilihKelas={setSelectedClassId}
        tampilkanFilterKelas={true}
        tampilkanStatistik={true}
      />
    </div>
  );
}
