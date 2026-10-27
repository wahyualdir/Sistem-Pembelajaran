'use client';

import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  Code2,
  FileText,
  Save,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  gradeExamAnswerAction,
  PendingExamAnswerReview,
} from '@/modules/academic/exam-review-actions';

interface ReviewViewProps {
  initialReviews: PendingExamAnswerReview[];
}

export function ExamReviewView({ initialReviews }: ReviewViewProps) {
  const [reviews, setReviews] = useState<PendingExamAnswerReview[]>(initialReviews);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleGradeAnswer(item: PendingExamAnswerReview) {
    const score = scores[item.id] !== undefined ? scores[item.id] : item.max_points;
    const feedback = feedbacks[item.id] || '';

    setIsSubmitting((prev) => ({ ...prev, [item.id]: true }));
    const res = await gradeExamAnswerAction({
      answerId: item.id,
      score,
      feedback,
    });
    setIsSubmitting((prev) => ({ ...prev, [item.id]: false }));

    if (res.ok) {
      setSuccessMsg(`Jawaban milik ${item.student_name} (${item.student_nim}) berhasil dinilai: ${score}/${item.max_points}`);
      setReviews((prev) => prev.filter((r) => r.id !== item.id));
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Periksa Jawaban Ujian (Review Antrean)"
        badge="DOSEN / ASISTEN :: EVALUASI"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <FileCheck2 className="h-7 w-7 text-black" />
              <span>Antrean Koreksi Jawaban Esai & Koding</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-2xl leading-relaxed">
              Penilaian lembar jawaban mahasiswa yang membutuhkan evaluasi kualitatif dan penentuan skor berdasarkan rubrik capaian pembelajaran.
            </p>
          </div>
          <span className="px-4 py-2 rounded-xl border-2 border-black bg-white text-xs font-mono font-bold shadow-retro">
            Menunggu Koreksi: <strong>{reviews.length} Butir</strong>
          </span>
        </div>
      </RetroWindow>

      {successMsg && (
        <div className="p-4 rounded-xl border-2 border-black bg-gray-soft text-black text-xs font-bold shadow-retro flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Review Queue Items */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-black bg-white p-12 text-center space-y-3 shadow-retro">
            <CheckCircle2 className="h-12 w-12 text-black/40 mx-auto" />
            <h3 className="font-heading font-black text-lg text-black">Semua Jawaban Telah Selesai Diperiksa</h3>
            <p className="text-xs text-black/70 max-w-md mx-auto font-medium">
              Tidak ada jawaban esai atau pemrograman yang menunggu evaluasi saat ini. Seluruh nilai telah tervalidasi.
            </p>
          </div>
        ) : (
          reviews.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro space-y-5"
            >
              {/* Header Item */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/20 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-black bg-gray-soft px-2.5 py-0.5 rounded border border-black">
                      {item.question_type}
                    </span>
                    <span className="text-xs font-bold text-black/70">
                      {item.class_title} · {item.quiz_title}
                    </span>
                  </div>
                  <h3 className="font-heading font-black text-base text-black mt-1">
                    {item.student_name} <span className="font-mono text-xs font-normal text-black/70">({item.student_nim})</span>
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-black/60 block">Batas Maksimal</span>
                  <span className="text-base font-heading font-black text-black">{item.max_points} Poin</span>
                </div>
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-xl bg-gray-soft/50 border border-black/20 space-y-1">
                <span className="text-[11px] font-bold text-black/70 uppercase tracking-wider block">
                  Soal Evaluasi:
                </span>
                <p className="text-xs sm:text-sm font-bold text-black leading-relaxed">
                  {item.question_text}
                </p>
              </div>

              {/* Rubric Criteria if any */}
              {item.rubric_criteria && item.rubric_criteria.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-black block">Panduan Rubrik Penilaian:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {item.rubric_criteria.map((rc) => (
                      <div key={rc.id} className="p-2.5 rounded-lg border border-black/30 bg-white text-xs">
                        <span className="font-bold text-black block">{rc.title}</span>
                        <span className="text-[11px] text-black/70 font-mono">Maks: {rc.max_score} Poin</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Submission */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-black block">Jawaban Mahasiswa:</span>
                {item.question_type === 'LIVE_CODING' || item.submitted_code ? (
                  <pre className="p-4 rounded-xl bg-black text-green-400 font-mono text-xs overflow-x-auto border-2 border-black">
                    <code>{item.submitted_code || item.essay_text}</code>
                  </pre>
                ) : (
                  <div className="p-4 rounded-xl border-2 border-black bg-white text-xs sm:text-sm text-black leading-relaxed font-medium">
                    {item.essay_text}
                  </div>
                )}
              </div>

              {/* Grading Input Form */}
              <div className="pt-4 border-t-2 border-black/20 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <label className="block text-xs font-bold text-black">Catatan Umpan Balik (Feedback)</label>
                  <input
                    type="text"
                    placeholder="Tuliskan catatan apresiasi atau evaluasi untuk mahasiswa..."
                    value={feedbacks[item.id] || ''}
                    onChange={(e) => setFeedbacks({ ...feedbacks, [item.id]: e.target.value })}
                    className="w-full rounded-xl border-2 border-black bg-white p-2.5 text-xs text-black font-medium focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div>
                    <label className="block text-xs font-bold text-black mb-1">Skor Diperoleh</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={item.max_points}
                        defaultValue={item.max_points}
                        onChange={(e) => setScores({ ...scores, [item.id]: Number(e.target.value) })}
                        className="w-20 rounded-xl border-2 border-black bg-white p-2 text-center text-sm font-mono font-bold text-black focus:outline-hidden"
                      />
                      <span className="text-xs font-mono font-bold text-black/60">/ {item.max_points}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleGradeAnswer(item)}
                    disabled={isSubmitting[item.id]}
                    className="px-5 py-2.5 rounded-xl border-2 border-black bg-black text-white text-xs font-bold hover:bg-neutral-800 disabled:opacity-50 transition-all cursor-pointer shadow-retro flex items-center gap-2 self-end"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSubmitting[item.id] ? 'Menyimpan…' : 'Simpan Nilai'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
