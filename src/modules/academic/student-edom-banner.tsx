'use client';

import React, { useState } from 'react';
import { Award, ArrowRight, ShieldCheck } from 'lucide-react';
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
      <div className="p-4 rounded-xl border-2 border-black bg-surface text-ink shadow-retro flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-lg border-2 border-black bg-primary text-white shrink-0 mt-0.5">
            <Award className="h-5 w-5" />
          </span>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-sm text-black">
                {period.title}
              </h3>
              <span className="px-2 py-0.5 rounded border border-black bg-white text-[11px] font-sans font-bold">
                100% Anonim
              </span>
            </div>
            <p className="text-xs text-black/70">
              Anda memiliki <strong>{classList.length} mata kuliah</strong> yang belum dievaluasi. Luangkan 3 menit untuk membantu peningkatan mutu pembelajaran.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedClass(classList[0])}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-black bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-dark cursor-pointer"
          >
            <span>Isi Evaluasi Sekarang</span>
            <ArrowRight className="h-3.5 w-3.5" />
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
