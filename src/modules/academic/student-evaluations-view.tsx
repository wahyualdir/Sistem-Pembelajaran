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
      <div className="p-8 text-center text-xs text-muted-foreground rounded-[12px] border border-border bg-surface">
        Memeriksa kuesioner evaluasi dosen...
      </div>
    );
  }

  if (!period || pendingClasses.length === 0) {
    return (
      <div className="p-8 text-center rounded-[12px] border border-border bg-surface space-y-3">
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-foreground">Tidak Ada Kuesioner Tertunda</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Semua kelas perkuliahan telah dievaluasi, atau periode evaluasi semester ini belum dibuka.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner Informasi Anonimitas */}
      <div className="p-4 rounded-[12px] border border-primary/20 bg-primary/5 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-foreground">Pengisian 100% Anonim</h3>
          <p className="text-xs text-muted-foreground">
            Jawaban dan komentar yang kamu kirimkan tidak pernah dikaitkan dengan identitas akun, NIM, atau nama mahasiswa. Dosen hanya melihat ringkasan rata-rata skor setelah periode evaluasi ditutup.
          </p>
        </div>
      </div>

      {/* Daftar Kelas yang Perlu Dievaluasi */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">
          Daftar Mata Kuliah ({pendingClasses.length} kelas menunggu evaluasi)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingClasses.map((cls) => (
            <div
              key={cls.classId}
              className="p-5 rounded-[12px] border border-border bg-surface flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {period.semester}
                </span>
                <h3 className="text-sm font-bold text-foreground leading-snug">{cls.classTitle}</h3>
                <p className="text-xs text-muted-foreground">Dosen Pengampu: {cls.lecturerName}</p>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">5 Pertanyaan</span>
                <button
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
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
