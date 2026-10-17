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
    <div className="space-y-6">
      {/* 1. KARTU RINGKASAN DOSEN WALI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border-2 border-black bg-surface shadow-retro-sm">
          <p className="text-xs font-bold text-gray-dark uppercase tracking-wider">Total Bimbingan</p>
          <p className="font-heading font-bold text-2xl text-ink mt-0.5 tabular-nums">{total}</p>
        </div>

        <div className="p-4 rounded-xl border-2 border-black bg-surface shadow-retro-sm">
          <p className="text-xs font-bold text-gray-dark uppercase tracking-wider">Status Aman</p>
          <p className="font-heading font-bold text-2xl text-ink mt-0.5 tabular-nums">{safe.length}</p>
        </div>

        <div className="p-4 rounded-xl border-2 border-black bg-gray-soft shadow-retro-sm">
          <p className="text-xs font-bold text-gray-dark uppercase tracking-wider">Perhatian</p>
          <p className="font-heading font-bold text-2xl text-ink mt-0.5 tabular-nums">{warning.length}</p>
        </div>

        <div className="p-4 rounded-xl border-2 border-black bg-primary text-white shadow-retro-sm">
          <p className="text-xs font-bold uppercase tracking-wider opacity-90">Risiko Tinggi</p>
          <p className="font-heading font-bold text-2xl mt-0.5 tabular-nums">{highRisk.length}</p>
        </div>
      </div>

      {/* 2. FILTER & DAFTAR MAHASISWA BIMBINGAN */}
      <RetroWindow
        title="daftar_mahasiswa_bimbingan_akademik.list"
        badge={`${highRisk.length + warning.length} PERLU BIMBINGAN`}
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-6 space-y-4 bg-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-ink text-white border-2 border-black shadow-retro-sm'
                  : 'bg-surface text-ink border-2 border-black hover:bg-gray-soft'
              }`}
            >
              Semua ({total})
            </button>
            <button
              type="button"
              onClick={() => setFilter('at_risk')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer ${
                filter === 'at_risk'
                  ? 'bg-ink text-white border-2 border-black shadow-retro-sm'
                  : 'bg-surface text-ink border-2 border-black hover:bg-gray-soft'
              }`}
            >
              Perlu Perhatian ({highRisk.length + warning.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('safe')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer ${
                filter === 'safe'
                  ? 'bg-ink text-white border-2 border-black shadow-retro-sm'
                  : 'bg-surface text-ink border-2 border-black hover:bg-gray-soft'
              }`}
            >
              Aman ({safe.length})
            </button>
          </div>

          <span className="text-xs font-bold text-gray-dark">
            Menampilkan {filteredItems.length} mahasiswa
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center rounded-xl border-2 border-dashed border-black bg-gray-soft/30 space-y-2">
            <CheckCircle2 className="h-8 w-8 text-ink mx-auto" />
            <p className="text-sm font-bold text-ink">Tidak Ada Mahasiswa pada Kategori Ini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border-2 border-black bg-surface shadow-retro-sm space-y-3 transition-all hover:bg-gray-soft/10 ${
                  item.riskLevel === 'RISIKO_TINGGI'
                    ? 'border-l-[6px] border-l-primary'
                    : item.riskLevel === 'PERHATIAN'
                    ? 'border-l-[6px] border-l-gray-dark'
                    : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full border-2 border-black bg-gray-soft flex items-center justify-center font-bold text-xs text-ink shrink-0">
                      {item.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-base text-ink">
                        {item.studentName}
                      </h4>
                      <p className="text-xs text-gray-dark font-sans">
                        NIM: {item.studentNim} · Angkatan {item.angkatan} · Kelas: {item.classTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded border text-xs font-bold ${
                        item.riskLevel === 'RISIKO_TINGGI'
                          ? 'bg-primary text-white border-black'
                          : item.riskLevel === 'PERHATIAN'
                          ? 'bg-gray-dark text-white border-black'
                          : 'bg-surface text-ink border-ink'
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
                      <div key={idx} className="text-xs font-medium text-ink flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{ind.reason}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-dark pl-3 border-l-2 border-black/20">
                    Seluruh target kehadiran dan pengumpulan tugas terpenuhi dengan baik.
                  </p>
                )}

                {/* Rekomendasi Bimbingan & Aksi Dosen Wali */}
                <div className="pt-2 border-t border-black/10 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-gray-dark font-sans">
                    <span className="font-bold text-ink">Saran Pembimbing:</span>{' '}
                    {item.recommendations[0] || 'Lakukan pemantauan berkala saat KRS revisi.'}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => alert(`Mencatat konsultasi untuk mahasiswa ${item.studentName} (${item.studentNim})`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-surface hover:bg-gray-soft text-ink text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
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
