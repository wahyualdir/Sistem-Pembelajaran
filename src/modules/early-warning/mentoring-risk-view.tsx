'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import type { StudentRiskEvaluation } from './types';

interface MentoringRiskViewProps {
  advisees: StudentRiskEvaluation[];
}

export function MentoringRiskView({ advisees }: MentoringRiskViewProps) {
  const [filter, setFilter] = useState<'all' | 'at_risk' | 'safe'>('all');

  const total = advisees.length;
  const highRisk = advisees.filter((a) => a.riskLevel === 'RISIKO_TINGGI');
  const warning = advisees.filter((a) => a.riskLevel === 'PERHATIAN');
  const safe = advisees.filter((a) => a.riskLevel === 'AMAN');

  const filteredItems = advisees.filter((item) => {
    if (filter === 'at_risk') return item.riskLevel !== 'AMAN';
    if (filter === 'safe') return item.riskLevel === 'AMAN';
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* 1. KARTU RINGKASAN DOSEN WALI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro">
          <p className="text-[11px] font-mono font-bold text-black/70 uppercase tracking-wider">Total Bimbingan</p>
          <p className="font-heading font-black text-2xl sm:text-3xl text-black mt-1 tabular-nums">{total}</p>
        </div>

        <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro">
          <p className="text-[11px] font-mono font-bold text-black/70 uppercase tracking-wider">Status Aman</p>
          <p className="font-heading font-black text-2xl sm:text-3xl text-black mt-1 tabular-nums">{safe.length}</p>
        </div>

        <div className="p-4 rounded-xl border-2 border-black bg-gray-soft shadow-retro">
          <p className="text-[11px] font-mono font-bold text-black/70 uppercase tracking-wider">Perhatian</p>
          <p className="font-heading font-black text-2xl sm:text-3xl text-black mt-1 tabular-nums">{warning.length}</p>
        </div>

        <div className="p-4 rounded-xl border-2 border-black bg-black text-white shadow-retro">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/80">Risiko Tinggi</p>
          <p className="font-heading font-black text-2xl sm:text-3xl text-white mt-1 tabular-nums">{highRisk.length}</p>
        </div>
      </div>

      {/* 2. FILTER & DAFTAR MAHASISWA BIMBINGAN */}
      <RetroWindow
        title="daftar_mahasiswa_bimbingan_akademik.list"
        badge={`${highRisk.length + warning.length} PERLU BIMBINGAN`}
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-6 space-y-4 bg-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black/10 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-black text-white border-2 border-black shadow-retro-sm'
                  : 'bg-white text-black border-2 border-black hover:bg-gray-soft'
              }`}
            >
              Semua ({total})
            </button>
            <button
              type="button"
              onClick={() => setFilter('at_risk')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filter === 'at_risk'
                  ? 'bg-black text-white border-2 border-black shadow-retro-sm'
                  : 'bg-white text-black border-2 border-black hover:bg-gray-soft'
              }`}
            >
              Perlu Perhatian ({highRisk.length + warning.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('safe')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filter === 'safe'
                  ? 'bg-black text-white border-2 border-black shadow-retro-sm'
                  : 'bg-white text-black border-2 border-black hover:bg-gray-soft'
              }`}
            >
              Aman ({safe.length})
            </button>
          </div>

          <span className="text-xs font-mono font-bold text-black/70">
            Menampilkan {filteredItems.length} mahasiswa
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center rounded-xl border-2 border-dashed border-black bg-gray-soft/40 space-y-2">
            <CheckCircle2 className="h-8 w-8 text-black mx-auto" />
            <p className="text-sm font-heading font-black text-black">Tidak Ada Mahasiswa pada Kategori Ini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm space-y-3 transition-all hover:bg-gray-soft/20 ${
                  item.riskLevel === 'RISIKO_TINGGI'
                    ? 'border-l-[6px] border-l-black'
                    : item.riskLevel === 'PERHATIAN'
                    ? 'border-l-[6px] border-l-black/40'
                    : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full border-2 border-black bg-gray-soft flex items-center justify-center font-bold text-xs text-black shrink-0 shadow-retro-sm">
                      {item.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-base text-black">
                        {item.studentName}
                      </h4>
                      <p className="text-xs text-black/70 font-sans">
                        NIM: {item.studentNim} · Angkatan {item.angkatan} · Kelas: {item.classTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded border-2 border-black text-xs font-mono font-bold shadow-retro-sm ${
                        item.riskLevel === 'RISIKO_TINGGI'
                          ? 'bg-black text-white'
                          : item.riskLevel === 'PERHATIAN'
                          ? 'bg-gray-soft text-black'
                          : 'bg-white text-black'
                      }`}
                    >
                      {item.riskLevel === 'RISIKO_TINGGI'
                        ? 'Risiko Tinggi'
                        : item.riskLevel === 'PERHATIAN'
                        ? 'Perhatian'
                        : 'Aman'}
                    </span>
                  </div>
                </div>

                {/* Rincian Indikator Masalah */}
                {item.indicators.length > 0 ? (
                  <div className="space-y-1.5 pl-3 border-l-2 border-black/20">
                    {item.indicators.map((ind, idx) => (
                      <div key={idx} className="text-xs font-medium text-black flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-black shrink-0" />
                        <span>{ind.reason}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-black/70 pl-3 border-l-2 border-black/20 font-medium">
                    Seluruh target kehadiran dan pengumpulan tugas terpenuhi dengan baik.
                  </p>
                )}

                {/* Rekomendasi Bimbingan & Aksi Dosen Wali */}
                <div className="pt-2 border-t-2 border-black/10 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-black/70 font-sans">
                    <span className="font-bold text-black">Saran Pembimbing:</span>{' '}
                    {item.recommendations[0] || 'Lakukan pemantauan berkala saat KRS revisi.'}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => alert(`Mencatat konsultasi untuk mahasiswa ${item.studentName} (${item.studentNim})`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white text-black text-xs font-bold transition-all shadow-retro-sm cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-black" />
                      <span>Catat Konsultasi</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </RetroWindow>
    </div>
  );
}
