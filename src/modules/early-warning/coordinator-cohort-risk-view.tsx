'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  return (
    <div className="border-2 border-black bg-white p-5 sm:p-6 shadow-retro space-y-5 font-sans">
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 border-2 border-black bg-[#ED1C24] text-white shadow-retro-sm shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-[#111111] tracking-tight">
              Rekapitulasi Mahasiswa Berisiko per Angkatan
            </h2>
            <p className="text-xs sm:text-sm text-[#111111] font-medium mt-0.5">
              Monitoring sebaran mahasiswa yang memerlukan perhatian kehadiran, tugas, dan tren nilai di tingkat program studi.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full border-2 border-black bg-[#ED1C24] text-white text-xs font-bold shadow-retro-sm">
            {totalAtRisk} Mahasiswa Perlu Perhatian
          </span>

          <div className="flex items-center border-2 border-black p-0.5 bg-gray-soft shadow-retro-sm">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn(
                'px-2.5 py-1 text-xs font-bold font-sans transition-colors flex items-center gap-1.5 cursor-pointer',
                viewMode === 'cards'
                  ? 'bg-white text-[#111111] border border-black shadow-xs'
                  : 'text-[#111111] hover:bg-white/60'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'px-2.5 py-1 text-xs font-bold font-sans transition-colors flex items-center gap-1.5 cursor-pointer',
                viewMode === 'table'
                  ? 'bg-white text-[#111111] border border-black shadow-xs'
                  : 'text-[#111111] hover:bg-white/60'
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Konten Berdasarkan View Mode (Mencegah Card & Tabel Menumpuk) */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cohorts.map((c) => {
            const atRiskCount = c.perhatian + c.risikoTinggi;
            const percent = c.total > 0 ? Math.round((atRiskCount / c.total) * 100) : 0;

            return (
              <div
                key={c.angkatan}
                className="p-4 sm:p-5 border-2 border-black bg-white shadow-retro-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-black/10 pb-2.5">
                    <span className="font-heading font-black text-lg text-[#111111]">
                      Angkatan {c.angkatan}
                    </span>
                    <span className="text-xs font-bold text-[#111111] px-2 py-0.5 border border-black bg-gray-soft">
                      Total: {c.total} Mhs
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 border-2 border-black bg-white">
                      <p className="text-[10px] text-[#111111] font-bold uppercase tracking-wider">Aman</p>
                      <p className="font-black text-lg text-[#111111] tabular-nums mt-0.5">{c.aman}</p>
                    </div>
                    <div className="p-2 border-2 border-black bg-gray-soft">
                      <p className="text-[10px] text-[#111111] font-bold uppercase tracking-wider">Perhatian</p>
                      <p className="font-black text-lg text-[#111111] tabular-nums mt-0.5">{c.perhatian}</p>
                    </div>
                    <div className="p-2 border-2 border-black bg-[#ED1C24] text-white font-bold">
                      <p className="text-[10px] uppercase tracking-wider opacity-95">Tinggi</p>
                      <p className="font-black text-lg tabular-nums mt-0.5">{c.risikoTinggi}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs text-[#111111] font-bold">
                      <span>Persentase Berisiko:</span>
                      <span className="font-black">{percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-soft border border-black overflow-hidden">
                      <div
                        className="h-full bg-[#ED1C24] transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-black/10 text-xs font-semibold text-[#111111]">
                  <span className="font-bold">Tindakan: </span>
                  Koordinasikan dengan Dosen Wali angkatan {c.angkatan}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-black bg-white shadow-retro-sm">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-gray-soft border-b-2 border-black font-bold uppercase text-[#111111]">
              <tr>
                <th className="p-3.5">Angkatan Mahasiswa</th>
                <th className="p-3.5">Total Terdaftar</th>
                <th className="p-3.5">Status Aman</th>
                <th className="p-3.5">Perhatian</th>
                <th className="p-3.5 text-[#ED1C24]">Risiko Tinggi</th>
                <th className="p-3.5">Tindakan Prodi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 bg-white">
              {cohorts.map((c) => (
                <tr key={c.angkatan} className="hover:bg-gray-soft/40 transition-colors">
                  <td className="p-3.5 font-bold text-[#111111]">Angkatan {c.angkatan}</td>
                  <td className="p-3.5 tabular-nums font-bold text-[#111111]">{c.total}</td>
                  <td className="p-3.5 tabular-nums font-bold text-[#111111]">{c.aman}</td>
                  <td className="p-3.5 tabular-nums font-bold text-[#111111]">{c.perhatian}</td>
                  <td className="p-3.5 tabular-nums font-black text-[#ED1C24] text-sm">{c.risikoTinggi}</td>
                  <td className="p-3.5">
                    <span className="text-xs font-semibold text-[#111111]">
                      Koordinasikan dengan Dosen Wali angkatan {c.angkatan}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Catatan Panduan */}
      <div className="p-3.5 bg-gray-soft border-2 border-black text-[#111111] font-semibold text-xs flex items-center gap-2.5 shadow-retro-sm">
        <Sparkles className="h-4 w-4 text-[#ED1C24] shrink-0" />
        <span>
          Prinsip Peringatan Dini: Alat bantu intervensi prodi dan pembinaan dosen wali, bukan sanksi atau tindakan otomatis ke nilai/status mahasiswa.
        </span>
      </div>
    </div>
  );
}
