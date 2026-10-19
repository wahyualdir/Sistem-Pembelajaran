'use client';

import React from 'react';
import {
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface CohortData {
  angkatan: number;
  total: number;
  aman: number;
  perhatian: number;
  risikoTinggi: number;
}

interface CoordinatorCohortRiskViewProps {
  cohorts: CohortData[];
  totalAtRisk: number;
}

export function CoordinatorCohortRiskView({ cohorts, totalAtRisk }: CoordinatorCohortRiskViewProps) {
  return (
    <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4 sm:space-y-5">
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-ink/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-lg border-2 border-ink bg-primary text-white shadow-retro-sm">
            <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg sm:text-xl text-ink">
              Rekapitulasi Mahasiswa Berisiko per Angkatan
            </h2>
            <p className="text-xs sm:text-sm text-gray-dark font-bold mt-0.5">
              Monitoring sebaran mahasiswa yang memerlukan perhatian kehadiran, tugas, dan tren nilai di tingkat program studi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full border-2 border-ink bg-primary text-white text-xs font-sans font-bold shadow-xs">
            {totalAtRisk} Mahasiswa Perlu Perhatian
          </span>
        </div>
      </div>

      {/* 3 Kartu Angkatan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {cohorts.map((c) => {
          const atRiskCount = c.perhatian + c.risikoTinggi;
          const percent = c.total > 0 ? Math.round((atRiskCount / c.total) * 100) : 0;

          return (
            <div
              key={c.angkatan}
              className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm space-y-3"
            >
              <div className="flex items-center justify-between border-b-2 border-ink/10 pb-2">
                <span className="font-heading font-bold text-base text-ink">
                  Angkatan {c.angkatan}
                </span>
                <span className="text-xs font-bold text-gray-dark font-sans">
                  Total: {c.total} Mhs
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-sans">
                <div className="p-2 rounded-lg border-2 border-ink bg-surface">
                  <p className="text-[11px] text-gray-dark font-bold uppercase">Aman</p>
                  <p className="font-bold text-base text-ink tabular-nums">{c.aman}</p>
                </div>
                <div className="p-2 rounded-lg border-2 border-ink bg-gray-soft">
                  <p className="text-[11px] text-gray-dark font-bold uppercase">Perhatian</p>
                  <p className="font-bold text-base text-ink tabular-nums">{c.perhatian}</p>
                </div>
                <div className="p-2 rounded-lg border-2 border-ink bg-primary text-white font-bold">
                  <p className="text-[11px] uppercase opacity-90">Tinggi</p>
                  <p className="text-base tabular-nums">{c.risikoTinggi}</p>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs text-gray-dark font-sans font-bold">
                <span>Persentase Berisiko:</span>
                <span className="text-ink">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabel Ringkasan Koordinator */}
      <div className="overflow-x-auto border-2 border-ink rounded-xl shadow-retro-sm">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-gray-soft border-b-2 border-ink font-heading font-bold text-ink">
            <tr>
              <th className="p-3">Angkatan Mahasiswa</th>
              <th className="p-3">Total Terdaftar</th>
              <th className="p-3">Status Aman</th>
              <th className="p-3">Perhatian</th>
              <th className="p-3">Risiko Tinggi</th>
              <th className="p-3">Tindakan Prodi</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-ink/20 bg-surface">
            {cohorts.map((c) => (
              <tr key={c.angkatan} className="hover:bg-gray-soft/40 transition-colors">
                <td className="p-3 font-bold text-ink">Angkatan {c.angkatan}</td>
                <td className="p-3 tabular-nums font-bold text-ink">{c.total}</td>
                <td className="p-3 tabular-nums font-bold text-ink">{c.aman}</td>
                <td className="p-3 tabular-nums font-bold text-gray-dark">{c.perhatian}</td>
                <td className="p-3 tabular-nums font-bold text-primary">{c.risikoTinggi}</td>
                <td className="p-3">
                  <span className="text-xs font-bold text-gray-dark">
                    Koordinasikan dengan Dosen Wali angkatan {c.angkatan}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-gray-soft border-2 border-ink rounded-lg text-ink font-bold text-xs flex items-center gap-2 shadow-xs">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <span>
          Prinsip Peringatan Dini: Alat bantu intervensi prodi dan pembinaan dosen wali, bukan sanksi atau tindakan otomatis ke nilai/status mahasiswa.
        </span>
      </div>
    </div>
  );
}
