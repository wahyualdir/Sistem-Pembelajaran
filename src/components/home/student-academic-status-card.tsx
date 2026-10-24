'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { StudentRiskEvaluation } from '@/modules/early-warning/types';

interface StudentAcademicStatusCardProps {
  evaluations: StudentRiskEvaluation[];
}

export function StudentAcademicStatusCard({ evaluations }: StudentAcademicStatusCardProps) {
  const highestRisk = evaluations.find((e) => e.riskLevel === 'RISIKO_TINGGI')
    || evaluations.find((e) => e.riskLevel === 'PERHATIAN')
    || evaluations[0];

  const riskLevel = highestRisk?.riskLevel || 'AMAN';
  const atRiskClasses = evaluations.filter((e) => e.riskLevel !== 'AMAN');

  if (riskLevel === 'AMAN' || atRiskClasses.length === 0) {
    return null;
  }

  const isHighRisk = riskLevel === 'RISIKO_TINGGI';

  return (
    <section
      aria-label="Status Akademik dan Peringatan Dini"
      className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] shadow-sm overflow-hidden p-5 sm:p-6 space-y-5 font-sans"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E3E4]">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isHighRisk
                ? 'bg-[#FEF2F2] border-[#FDDDD7] text-[#9F1521]'
                : 'bg-[#F3F3F4] border-[#E2E3E4] text-[#808285]'
            }`}
          >
            {isHighRisk ? <ShieldAlert className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-lg text-[#111111]">
                Status Akademik Semester Ini
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isHighRisk
                    ? 'bg-[#FEF2F2] text-[#9F1521] border border-[#FDDDD7]'
                    : 'bg-[#F3F3F4] text-[#58595B] border border-[#E2E3E4]'
                }`}
              >
                {isHighRisk ? 'RISIKO TINGGI' : 'PERHATIAN'}
              </span>
            </div>
            <p className="text-xs text-[#58595B] font-normal mt-0.5">
              {isHighRisk
                ? 'Terdapat indikator kehadiran atau tugas yang memerlukan tindak lanjut segera.'
                : 'Beberapa parameter perkuliahan mendekati batas minimal. Tingkatkan kehadiran dan pengumpulan tugas.'}
            </p>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#F3F3F4] border border-[#E2E3E4] text-xs text-[#58595B] font-normal max-w-xs">
          <strong className="text-[#111111] font-semibold">Monitoring Mandiri:</strong> Alat bantu evaluasi diri mahasiswa, bukan sanksi otomatis.
        </div>
      </div>

      {atRiskClasses.length > 0 && (
        <div className="space-y-3 pt-1">
          <p className="text-[11px] font-bold text-[#808285] uppercase tracking-wider">
            Mata Kuliah yang Memerlukan Perhatian ({atRiskClasses.length})
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {atRiskClasses.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] hover:border-[#9F1521] transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#E2E3E4] pb-2.5">
                  <h3 className="font-heading font-bold text-sm text-[#111111] truncate">
                    {item.classTitle}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                      item.riskLevel === 'RISIKO_TINGGI'
                        ? 'bg-[#FEF2F2] text-[#9F1521] border border-[#FDDDD7]'
                        : 'bg-[#F3F3F4] text-[#58595B] border border-[#E2E3E4]'
                    }`}
                  >
                    {item.riskLevel === 'RISIKO_TINGGI' ? 'Risiko Tinggi' : 'Perhatian'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {item.indicators.map((ind, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-normal text-[#111111] flex items-start gap-2 bg-[#F3F3F4] p-2.5 rounded-lg border border-[#E2E3E4]"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-[#9F1521] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[#111111] block">{ind.label}</span>
                        <span className="text-[#58595B] text-xs">{ind.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {item.recommendations.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-[#F3F3F4]/60 border border-[#E2E3E4] text-xs space-y-1">
                    <span className="font-bold text-[#111111] flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#9F1521]" />
                      Saran Tindakan:
                    </span>
                    <p className="text-xs text-[#58595B] font-normal leading-relaxed">
                      {item.recommendations[0]}
                    </p>
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <Link
                    href={`/classes/${item.classId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9F1521] hover:text-[#8F131E] transition-colors"
                  >
                    <span>Buka Kelas Kuliah</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
