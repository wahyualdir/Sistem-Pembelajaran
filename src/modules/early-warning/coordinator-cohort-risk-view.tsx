'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  GraduationCap,
  ArrowRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

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
  const totalStudents = cohorts.reduce((acc, c) => acc + c.total, 0);

  return (
    <div className="space-y-6">
      {/* 1. HEADER WINDOW REKAP KAPRODI */}
      <RetroWindow
        title="rekapitulasi_mahasiswa_berisiko_per_angkatan.portal"
        badge="EARLY WARNING :: PRODI"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-6 bg-surface space-y-5"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-retro-sm">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg sm:text-xl text-ink">
                Rekapitulasi Mahasiswa Berisiko per Angkatan
              </h2>
              <p className="text-xs sm:text-sm text-gray-dark font-medium mt-0.5">
                Monitoring sebaran mahasiswa yang memerlukan perhatian kehadiran, tugas, dan tren nilai di tingkat program studi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg border-2 border-black bg-primary text-white text-xs font-bold shadow-retro-sm">
              {totalAtRisk} Mahasiswa Perlu Perhatian
            </span>
          </div>
        </div>

        {/* 3 KARTU ANGKATAN */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {cohorts.map((c) => {
            const atRiskCount = c.perhatian + c.risikoTinggi;
            const percent = c.total > 0 ? Math.round((atRiskCount / c.total) * 100) : 0;

            return (
              <div
                key={c.angkatan}
                className="p-4 rounded-xl border-2 border-black bg-surface shadow-retro-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <span className="font-heading font-bold text-base text-ink">
                    Angkatan {c.angkatan}
                  </span>
                  <span className="text-xs font-bold text-gray-dark font-sans">
                    Total: {c.total} Mahasiswa
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-sans">
                  <div className="p-2 rounded border border-black bg-surface">
                    <p className="text-xs text-gray-dark font-bold uppercase">Aman</p>
                    <p className="font-bold text-base text-ink tabular-nums">{c.aman}</p>
                  </div>
                  <div className="p-2 rounded border border-black bg-gray-soft">
                    <p className="text-xs text-gray-dark font-bold uppercase">Perhatian</p>
                    <p className="font-bold text-base text-ink tabular-nums">{c.perhatian}</p>
                  </div>
                  <div className="p-2 rounded border border-black bg-primary text-white font-bold">
                    <p className="text-xs uppercase opacity-90">Tinggi</p>
                    <p className="text-base tabular-nums">{c.risikoTinggi}</p>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs text-gray-dark font-sans">
                  <span>Persentase Berisiko:</span>
                  <span className="font-bold text-ink">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* TABEL RINGKASAN KOORDINATOR */}
        <div className="overflow-x-auto border-2 border-black rounded-xl">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-gray-soft border-b-2 border-black font-heading font-bold text-ink">
              <tr>
                <th className="p-3">Angkatan Mahasiswa</th>
                <th className="p-3">Total Terdaftar</th>
                <th className="p-3">Status Aman</th>
                <th className="p-3">Perhatian</th>
                <th className="p-3">Risiko Tinggi</th>
                <th className="p-3">Tindakan Prodi</th>
              </tr>
            </thead>
            <tbody className="divide-y border-black bg-surface">
              {cohorts.map((c) => (
                <tr key={c.angkatan} className="hover:bg-gray-soft/20">
                  <td className="p-3 font-bold text-ink">Angkatan {c.angkatan}</td>
                  <td className="p-3 tabular-nums">{c.total}</td>
                  <td className="p-3 tabular-nums font-bold text-ink">{c.aman}</td>
                  <td className="p-3 tabular-nums font-bold text-gray-dark">{c.perhatian}</td>
                  <td className="p-3 tabular-nums font-bold text-primary-dark">{c.risikoTinggi}</td>
                  <td className="p-3">
                    <span className="text-xs text-gray-dark">
                      Koordinasikan dengan Dosen Wali angkatan {c.angkatan}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-gray-soft border-2 border-ink rounded text-ink font-bold text-xs flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span>
            Prinsip Peringatan Dini: Alat bantu intervensi prodi dan pembinaan dosen wali, bukan sanksi atau tindakan otomatis ke nilai/status mahasiswa.
          </span>
        </div>
      </RetroWindow>
    </div>
  );
}
