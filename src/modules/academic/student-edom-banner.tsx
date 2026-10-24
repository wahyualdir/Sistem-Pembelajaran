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
      <div className="p-3 sm:p-3.5 border-2 border-[#7A756D] bg-[#FAF8F5] text-[#1C1917] shadow-retro-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-2.5 min-w-0">
          <Award className="h-4 w-4 text-[#C2553A] shrink-0" />
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#1C1917]">
            <span className="font-black text-sm">{period.title}</span>
            <span className="px-1.5 py-0.5 border border-[#7A756D] bg-[#FFFFFF] text-[10px] font-black uppercase text-[#065F46]">
              100% Anonim
            </span>
            <span className="text-[#57534E] hidden md:inline">
              · Anda memiliki <strong className="text-[#1C1917]">{classList.length} mata kuliah</strong> yang belum dievaluasi.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedClass(classList[0])}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-[#6B2D20] bg-[#C2553A] hover:bg-[#853827] text-white text-xs font-black shadow-retro-sm transition-all cursor-pointer min-h-[34px]"
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
