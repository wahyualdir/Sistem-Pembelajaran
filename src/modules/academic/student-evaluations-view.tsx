'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardCheck, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import {
  EvaluationPeriod,
  getStudentPendingEvaluationsAction,
} from './evaluation-actions';
import { EvaluationFormModal } from './evaluation-form-modal';

export function StudentEvaluationsView() {
  const [period, setPeriod] = useState<EvaluationPeriod | null>(null);
  const [pendingClasses, setPendingClasses] = useState<
    Array<{ classId: string; classTitle: string; lecturerId: string; lecturerName: string }>
  >([]);
  const [selectedClass, setSelectedClass] = useState<{
    classId: string;
    classTitle: string;
    lecturerId: string;
    lecturerName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPending = async () => {
    setIsLoading(true);
    const res = await getStudentPendingEvaluationsAction();
    setIsLoading(false);
    if (res.ok) {
      if (res.period) setPeriod(res.period);
      if (res.pendingClasses) setPendingClasses(res.pendingClasses);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-gray-dark font-bold rounded-xl border-2 border-ink bg-surface shadow-retro">
        Memeriksa kuesioner evaluasi dosen...
      </div>
    );
  }

  if (!period || pendingClasses.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl border-2 border-ink bg-surface shadow-retro space-y-3">
        <div className="h-12 w-12 rounded-full border-2 border-ink bg-surface text-ink flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-base font-heading font-bold text-ink">Tidak Ada Kuesioner Tertunda</h3>
        <p className="text-xs sm:text-sm text-gray-dark font-bold max-w-sm mx-auto">
          Semua kelas perkuliahan telah dievaluasi, atau periode evaluasi semester ini belum dibuka.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Informasi Anonimitas */}
      <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-gray-soft/50 shadow-retro-sm flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-heading font-bold text-ink">Pengisian 100% Anonim</h3>
          <p className="text-xs text-gray-dark font-bold leading-relaxed">
            Jawaban dan komentar yang Anda kirimkan tidak pernah dikaitkan dengan identitas akun, NIM, atau nama mahasiswa. Dosen hanya melihat ringkasan rata-rata skor setelah periode evaluasi ditutup.
          </p>
        </div>
      </div>

      {/* Daftar Kelas yang Perlu Dievaluasi */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-heading font-bold text-ink">
          Daftar Mata Kuliah ({pendingClasses.length} kelas menunggu evaluasi)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {pendingClasses.map((cls) => (
            <div
              key={cls.classId}
              className="p-5 rounded-xl border-2 border-ink bg-surface shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-all"
            >
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-ink bg-gray-soft text-ink inline-block">
                  {period.semester}
                </span>
                <h3 className="text-base font-heading font-bold text-ink leading-snug">{cls.classTitle}</h3>
                <p className="text-xs text-gray-dark font-bold">Dosen Pengampu: {cls.lecturerName}</p>
              </div>

              <div className="pt-3 border-t-2 border-ink/10 flex items-center justify-between">
                <span className="text-xs font-sans font-bold text-gray-dark">5 Pertanyaan</span>
                <button
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-2 border-ink bg-ink text-white text-xs font-bold shadow-xs hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  <span>Isi Evaluasi</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedClass && (
        <EvaluationFormModal
          isOpen={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          period={period}
          targetClass={selectedClass}
          onSuccess={() => {
            setSelectedClass(null);
            loadPending();
          }}
        />
      )}
    </div>
  );
}
