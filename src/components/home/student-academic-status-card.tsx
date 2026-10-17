'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import type { StudentRiskEvaluation } from '@/modules/early-warning/types';

interface StudentAcademicStatusCardProps {
  evaluations: StudentRiskEvaluation[];
}

export function StudentAcademicStatusCard({ evaluations }: StudentAcademicStatusCardProps) {
  // Ambil evaluasi risiko tertinggi di antara seluruh kelas
  const highestRisk = evaluations.find((e) => e.riskLevel === 'RISIKO_TINGGI')
    || evaluations.find((e) => e.riskLevel === 'PERHATIAN')
    || evaluations[0];

  const riskLevel = highestRisk?.riskLevel || 'AMAN';

  const atRiskClasses = evaluations.filter((e) => e.riskLevel !== 'AMAN');

  const getRiskHeader = () => {
    switch (riskLevel) {
      case 'RISIKO_TINGGI':
        return {
          title: 'Perhatian Khusus Diperlukan',
          badgeText: 'STATUS: RISIKO TINGGI',
          badgeClass: 'bg-primary text-white border-black font-bold',
          icon: ShieldAlert,
          desc: 'Terdapat indikator kehadiran atau tugas yang memerlukan tindak lanjut segera untuk menjaga kelayakan akademik.',
        };
      case 'PERHATIAN':
        return {
          title: 'Status Akademik Memerlukan Perhatian',
          badgeText: 'STATUS: PERHATIAN',
          badgeClass: 'bg-gray-dark text-white border-black font-bold',
          icon: AlertTriangle,
          desc: 'Beberapa parameter perkuliahan mendekati batas minimal. Tingkatkan kehadiran dan pastikan seluruh tugas diserahkan tepat waktu.',
        };
      case 'AMAN':
      default:
        return {
          title: 'Performa Akademik Berjalan Baik',
          badgeText: 'STATUS: AMAN',
          badgeClass: 'bg-surface text-ink border-ink font-bold',
          icon: ShieldCheck,
          desc: 'Seluruh parameter kehadiran, tugas, dan aktivitas belajar Anda memenuhi standar baku perkuliahan.',
        };
    }
  };

  const header = getRiskHeader();
  const Icon = header.icon;

  return (
    <RetroWindow
      title="status_akademik_dan_peringatan_dini.card"
      badge={header.badgeText}
      headerClassName="bg-gray-soft"
      bodyClassName="p-5 sm:p-6 bg-surface space-y-5"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg border-2 border-black ${
              riskLevel === 'RISIKO_TINGGI'
                ? 'bg-primary text-white'
                : riskLevel === 'PERHATIAN'
                ? 'bg-gray-dark text-white'
                : 'bg-surface text-ink'
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-lg sm:text-xl text-ink">
                Status Akademik Semester Ini
              </h2>
              <span className={`px-2.5 py-0.5 rounded border text-xs ${header.badgeClass}`}>
                {header.badgeText}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-dark font-medium mt-0.5">
              {header.desc}
            </p>
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-black bg-gray-soft/50 text-xs text-gray-dark font-sans max-w-xs">
          <span className="font-bold text-ink">Catatan:</span> Sistem ini merupakan alat bantu monitoring mandiri, bukan sanksi atau pengurangan nilai otomatis.
        </div>
      </div>

      {/* Rincian Indikator per Kelas Berisiko */}
      {atRiskClasses.length > 0 ? (
        <div className="space-y-3 pt-2">
          <p className="text-xs font-bold text-gray-dark uppercase tracking-wider">
            Mata Kuliah yang Memerlukan Perhatian ({atRiskClasses.length})
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {atRiskClasses.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border-2 border-black bg-surface shadow-retro-sm space-y-3"
              >
                <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-2">
                  <h3 className="font-heading font-bold text-sm text-ink truncate">
                    {item.classTitle}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded border text-[11px] shrink-0 font-bold ${
                      item.riskLevel === 'RISIKO_TINGGI'
                        ? 'bg-primary text-white border-black'
                        : 'bg-gray-dark text-white border-black'
                    }`}
                  >
                    {item.riskLevel === 'RISIKO_TINGGI' ? 'Risiko Tinggi' : 'Perhatian'}
                  </span>
                </div>

                {/* Daftar Alasan Indikator */}
                <div className="space-y-1.5">
                  {item.indicators.map((ind, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-medium text-ink flex items-start gap-2 bg-gray-soft/30 p-2 rounded border border-black/10"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-ink block">{ind.label}</span>
                        <span className="text-gray-dark text-[11px] font-sans">{ind.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Saran Tindakan */}
                {item.recommendations.length > 0 && (
                  <div className="p-2.5 rounded-lg border border-black/20 bg-surface text-xs space-y-1">
                    <span className="font-bold text-ink flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Saran Tindakan:
                    </span>
                    <p className="text-[11px] text-gray-dark leading-relaxed font-sans">
                      {item.recommendations[0]}
                    </p>
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <Link
                    href={`/classes/${item.classId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-ink hover:text-primary-dark transition-colors"
                  >
                    <span>Buka Kelas Kuliah</span>
                    <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-black bg-gray-soft/20 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-ink shrink-0" />
          <p className="text-xs text-ink font-medium">
            Tidak ada mata kuliah yang terindikasi berisiko saat ini. Pertahankan kehadiran di atas 75% dan kumpulkan tugas tepat waktu!
          </p>
        </div>
      )}
    </RetroWindow>
  );
}
