'use client';

import React, { useState } from 'react';
import { Award, ArrowRight } from 'lucide-react';
import type { EvaluationPeriod } from './evaluation-actions';
import { EvaluationFormModal } from './evaluation-form-modal';

interface StudentEdomBannerProps {
  period: EvaluationPeriod;
  pendingClasses: Array<{
    classId: string;
    classTitle: string;
    lecturerId: string;
    lecturerName: string;
  }>;
}

export function StudentEdomBanner({ period, pendingClasses }: StudentEdomBannerProps) {
  const [selectedClass, setSelectedClass] = useState<typeof pendingClasses[0] | null>(null);
  const [classList, setClassList] = useState(pendingClasses);

  if (classList.length === 0) return null;

  return (
    <>
      <div className="p-3.5 sm:p-4 rounded-2xl border border-[#E2E3E4] bg-[#FFFFFF] text-[#111111] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-[#FEF2F2] flex items-center justify-center shrink-0">
            <Award className="h-5 w-5 text-[#9F1521]" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#111111]">
            <span className="font-heading font-bold text-sm">{period.title}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[10px] font-semibold uppercase text-[#065F46]">
              100% Anonim
            </span>
            <span className="text-[#58595B] hidden md:inline">
              · Anda memiliki <strong className="text-[#111111] font-semibold">{classList.length} mata kuliah</strong> yang belum dievaluasi.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedClass(classList[0])}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9F1521] hover:bg-[#8F131E] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <span>Isi Evaluasi Sekarang</span>
            <ArrowRight className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>

      {selectedClass && (
        <EvaluationFormModal
          isOpen={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          period={period}
          targetClass={selectedClass}
          onSuccess={() => {
            setClassList((prev) => prev.filter((c) => c.classId !== selectedClass.classId));
          }}
        />
      )}
    </>
  );
}
