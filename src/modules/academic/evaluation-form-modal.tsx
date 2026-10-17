'use client';

import React, { useState, useTransition } from 'react';
import { Award, Star, Send, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EvaluationPeriod } from './evaluation-actions';
import { submitStudentEvaluationAction } from './evaluation-actions';

interface EvaluationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: EvaluationPeriod;
  targetClass: {
    classId: string;
    classTitle: string;
    lecturerId: string;
    lecturerName: string;
  };
  onSuccess?: () => void;
}

export function EvaluationFormModal({
  isOpen,
  onClose,
  period,
  targetClass,
  onSuccess,
}: EvaluationFormModalProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleScoreChange = (qId: string, val: number) => {
    setScores((prev) => ({ ...prev, [qId]: val }));
  };

  const isComplete =
    period.questions.every((q) => scores[q.id] && scores[q.id] >= 1) &&
    comment.trim().length >= 5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;

    setErrorMsg(null);
    startTransition(async () => {
      const res = await submitStudentEvaluationAction({
        periodId: period.id,
        classId: targetClass.classId,
        className: targetClass.classTitle,
        lecturerId: targetClass.lecturerId,
        lecturerName: targetClass.lecturerName,
        scores,
        comment: comment.trim(),
      });

      if (res.ok) {
        setIsSubmitted(true);
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.error || 'Gagal mengirim evaluasi.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border-4 border-black bg-white shadow-retro overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gray-soft border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
              <Award className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-black">
                Kuesioner Evaluasi Dosen (EDOM)
              </h3>
              <p className="text-xs text-black/70 font-sans">
                {targetClass.classTitle} &bull; {targetClass.lecturerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border-2 border-black bg-white hover:bg-neutral-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-2 border-black bg-surface text-ink flex items-center justify-center mx-auto shadow-retro">
              <CheckCircle2 className="h-8 w-8 text-ink" />
            </div>
            <h4 className="font-heading font-bold text-xl text-black">
              Evaluasi Berhasil Dikirim!
            </h4>
            <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
              Terima kasih atas partisipasi objektif Anda. Kuitansi pengisian telah dicatat agar Anda tidak mengisi berulang, dan jawaban Anda tersimpan <strong>100% anonim</strong> tanpa terhubung dengan identitas mahasiswa.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border-2 border-black bg-ink text-white font-bold text-xs shadow-retro hover:bg-black cursor-pointer"
            >
              Kembali ke Kelas
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Banner Anonimitas Nyata */}
            <div className="p-3 bg-surface border-2 border-black rounded-lg flex items-start gap-2.5 text-xs text-ink">
              <ShieldCheck className="h-5 w-5 text-ink shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Privasi Terjamin: Anonim Secara Nyata</strong>
                <span>
                  SIAJAR memisahkan data kuitansi pengisian dari isi lembar evaluasi Anda. Dosen tidak dapat melihat nama atau NIM pemberi penilaian, dan hanya dapat melihat rekap setelah periode kuesioner resmi ditutup.
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-primary text-white border-2 border-black rounded-lg text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {/* Daftar Pertanyaan Skala 1-5 */}
            <div className="space-y-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                Penilaian Kinerja Pedagogik & Profesional Dosen (Skala 1 - 5)
              </h4>

              {period.questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-xl border-2 border-black bg-neutral-50 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="font-sans font-bold text-xs px-2 py-0.5 rounded border border-black bg-white">
                      #{idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-black leading-snug">
                      {q.text}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10">
                    <span className="text-[11px] text-black/50">1 (Sangat Kurang)</span>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {[1, 2, 3, 4, 5].map((val) => {
                        const isSelected = scores[q.id] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleScoreChange(q.id, val)}
                            className={cn(
                              'w-8 h-8 rounded-lg border-2 border-black text-xs font-bold transition-all cursor-pointer flex items-center justify-center',
                              isSelected
                                ? 'bg-primary text-white shadow-xs scale-105'
                                : 'bg-white text-black hover:bg-gray-soft'
                            )}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[11px] text-black/50">5 (Sangat Baik)</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Komentar & Saran Terbuka */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-black block">
                Komentar, Saran & Masukan Konstruktif <span className="text-primary">*</span>
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tuliskan masukan mengenai metode pembelajaran, kejelasan materi, atau hal yang perlu ditingkatkan secara objektif..."
                className="w-full p-3 rounded-lg border-2 border-black text-xs font-sans outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <span className="text-[11px] text-black/50 block">
                Minimal 5 karakter. Ulasan Anda akan digabungkan secara acak bersama responden lain.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t-2 border-black/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border-2 border-black bg-white text-xs font-bold hover:bg-neutral-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending || !isComplete}
                className="px-5 py-2.5 rounded-lg border-2 border-black bg-primary text-white font-bold text-xs shadow-retro hover:bg-primary-dark cursor-pointer disabled:opacity-50"
              >
                {isPending ? 'Mengirim...' : 'Kirim Evaluasi Dosen'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
