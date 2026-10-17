'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { StudentRiskEvaluation } from './types';

interface ClassRiskCardProps {
  evaluations: StudentRiskEvaluation[];
  classTitle?: string;
}

export function ClassRiskCard({ evaluations, classTitle }: ClassRiskCardProps) {
  const atRiskStudents = evaluations.filter((e) => e.riskLevel !== 'AMAN');
  const highRiskCount = evaluations.filter((e) => e.riskLevel === 'RISIKO_TINGGI').length;
  const warningCount = evaluations.filter((e) => e.riskLevel === 'PERHATIAN').length;

  return (
    <div className="space-y-4 p-5 rounded-2xl border-2 border-black bg-surface shadow-retro">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-black/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg border-2 border-black bg-primary text-white">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
              <span>Peringatan Dini Mahasiswa Berisiko</span>
              {atRiskStudents.length > 0 && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary text-white border border-black">
                  {atRiskStudents.length} Perlu Perhatian
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-dark font-medium">
              Deteksi dini berdasarkan ambang batas kehadiran (&lt;75%), tugas tertunda, dan tren nilai.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="px-2.5 py-1 rounded border border-black bg-surface text-ink font-bold">
            Risiko Tinggi: {highRiskCount}
          </span>
          <span className="px-2.5 py-1 rounded border border-black bg-gray-soft text-ink font-bold">
            Perhatian: {warningCount}
          </span>
        </div>
      </div>

      {atRiskStudents.length === 0 ? (
        <div className="p-4 rounded-xl border border-black bg-gray-soft/20 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-ink shrink-0" />
          <p className="text-xs text-ink font-medium">
            Seluruh mahasiswa pada kelas ini berada dalam status <b>Aman</b>. Tidak ada mahasiswa yang terindikasi berisiko.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {atRiskStudents.map((st) => (
            <div
              key={st.id}
              className={`p-4 rounded-xl border-2 border-black bg-surface shadow-retro-sm space-y-2.5 ${
                st.riskLevel === 'RISIKO_TINGGI' ? 'border-l-[6px] border-l-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-heading font-bold text-sm text-ink truncate">
                    {st.studentName}
                  </h4>
                  <span className="text-xs text-gray-dark font-sans">
                    NIM: {st.studentNim} · Angkatan {st.angkatan}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded border text-xs font-bold shrink-0 ${
                    st.riskLevel === 'RISIKO_TINGGI'
                      ? 'bg-primary text-white border-black'
                      : 'bg-gray-dark text-white border-black'
                  }`}
                >
                  {st.riskLevel === 'RISIKO_TINGGI' ? 'Risiko Tinggi' : 'Perhatian'}
                </span>
              </div>

              {/* Rincian Indikator */}
              <div className="space-y-1">
                {st.indicators.map((ind, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-gray-soft/30 border border-black/10 text-xs font-medium text-ink flex items-start gap-1.5"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{ind.reason}</span>
                  </div>
                ))}
              </div>

              {/* Saran Tindakan Dosen */}
              {st.recommendations.length > 0 && (
                <p className="text-xs text-gray-dark font-sans leading-relaxed pt-1 border-t border-black/10">
                  <span className="font-bold text-ink">Rekomendasi Dosen:</span> Berikan pendampingan tugas atau ingatkan mahasiswa terkait kehadiran.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
