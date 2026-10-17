'use client';

import React, { useState, useTransition } from 'react';
import {
  HelpCircle,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  FileSpreadsheet,
  Award,
  Layers,
  Sparkles,
  Edit3,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ExamItemAnalysisResult,
  QuestionAnalysisItem,
  CoordinatorCplItem,
} from './item-analysis-actions';
import {
  flagQuestionForRevisionAction,
  exportItemAnalysisCsvAction,
} from './item-analysis-actions';

interface ItemAnalysisViewProps {
  initialData: ExamItemAnalysisResult;
  isCoordinator?: boolean;
  coordinatorCpl?: CoordinatorCplItem[];
  coordinatorQuality?: {
    totalQuestions: number;
    acceptablePercentage: number;
    needsReviewCount: number;
  };
}

export function ItemAnalysisView({
  initialData,
  isCoordinator = false,
  coordinatorCpl = [],
  coordinatorQuality,
}: ItemAnalysisViewProps) {
  const [data, setData] = useState<ExamItemAnalysisResult>(initialData);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionAnalysisItem | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [isPending, startTransition] = useTransition();
  const [exportMessage, setExportMessage] = useState('');

  const handleOpenRevisionModal = (q: QuestionAnalysisItem) => {
    setSelectedQuestion(q);
    setRevisionNote(q.revisionNote || '');
  };

  const handleSaveRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !revisionNote.trim()) return;

    startTransition(async () => {
      const res = await flagQuestionForRevisionAction({
        questionId: selectedQuestion.questionId,
        quizId: data.quizId,
        note: revisionNote.trim(),
      });

      if (res.ok) {
        setData((prev) => ({
          ...prev,
          questions: prev.questions.map((q) =>
            q.questionId === selectedQuestion.questionId
              ? {
                  ...q,
                  isFlaggedForRevision: true,
                  overallStatus: 'Revisi',
                  revisionNote: revisionNote.trim(),
                }
              : q
          ),
        }));
        setSelectedQuestion(null);
        setRevisionNote('');
      }
    });
  };

  const handleExportCsv = () => {
    startTransition(async () => {
      const res = await exportItemAnalysisCsvAction(data.quizId);
      if (res.ok && res.csvContent && res.filename) {
        const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', res.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportMessage(`Berhasil mengekspor: ${res.filename}`);
        setTimeout(() => setExportMessage(''), 4000);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER & ACTIONS BAR */}
      <div className="p-5 sm:p-6 rounded-2xl border-2 border-black bg-surface shadow-retro flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded border border-black bg-gray-soft text-xs font-bold text-ink uppercase">
              Ujian: {data.quizTitle}
            </span>
            <span className="text-xs font-sans font-bold text-gray-dark">
              Reliabilitas: &alpha; = {data.reliabilityAlpha} (Sangat Baik)
            </span>
          </div>
          <h2 className="font-heading font-bold text-xl text-ink mt-1">
            Analisis Butir Soal & Daya Pembeda
          </h2>
          <p className="text-xs text-gray-dark font-medium">
            Evaluasi proporsi benar (P), daya diskriminasi kelompok atas/bawah (D), efisiensi distraktor, dan ketercapaian CPMK.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black bg-ink text-white font-bold text-xs sm:text-sm shadow-retro hover:bg-gray-dark disabled:opacity-50 transition-all cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>{isPending ? 'Mengekspor...' : 'Ekspor Laporan CSV'}</span>
        </button>
      </div>

      {exportMessage && (
        <div className="p-3.5 rounded-xl border-2 border-black bg-surface text-ink text-xs font-bold flex items-center gap-2 animate-fade-up">
          <CheckCircle2 className="h-4 w-4 text-ink" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* 2. REKAP KELAS & METRIK CPMK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border-2 border-black bg-surface shadow-retro-sm space-y-1">
          <span className="text-xs font-bold text-gray-dark uppercase tracking-wider">
            Rata-rata Nilai Ujian
          </span>
          <p className="font-heading font-bold text-2xl text-ink">
            {data.averageScore} <span className="text-xs font-normal">/ 100</span>
          </p>
          <span className="text-xs text-ink font-bold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> Tingkat Ketuntasan: {data.passRatePercentage}%
          </span>
        </div>

        <div className="p-4 rounded-xl border-2 border-black bg-surface shadow-retro-sm space-y-1 sm:col-span-2">
          <span className="text-xs font-bold text-gray-dark uppercase tracking-wider block mb-1">
            Ketercapaian CPMK Kelas (Standar Kurikulum OBE)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {data.cpmkList.map((c) => (
              <div
                key={c.cpmk}
                className={cn(
                  'p-2.5 rounded-lg border',
                  c.status === 'TERCAPAI'
                    ? 'border-black bg-surface text-ink'
                    : 'border-2 border-black bg-gray-soft text-ink'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{c.cpmk}</span>
                  <span>{c.averageScorePercent}%</span>
                </div>
                <p className="text-xs text-gray-dark truncate mt-0.5" title={c.description}>
                  {c.description}
                </p>
                <span
                  className={cn(
                    'mt-1 inline-block text-xs font-bold px-1.5 py-0.2 rounded border',
                    c.status === 'TERCAPAI'
                      ? 'border-black bg-surface text-ink'
                      : 'border-black bg-primary text-white'
                  )}
                >
                  {c.status === 'TERCAPAI' ? 'Tuntas' : 'Perlu Penguatan'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. REKAP CPL LINTAS KELAS (KHUSUS KAPRODI) */}
      {isCoordinator && coordinatorCpl.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl border-2 border-black bg-surface shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Rekapitulasi Lintas Kelas untuk CPL (Program Studi)</span>
              </h3>
              <p className="text-xs text-gray-dark font-medium">
                Monitoring ketercapaian Capaian Pembelajaran Lulusan (CPL) dari seluruh kelas paralel program studi.
              </p>
            </div>
            {coordinatorQuality && (
              <span className="px-3 py-1 rounded-lg border-2 border-black bg-surface text-xs font-bold text-ink">
                Mutu Soal Prodi: {coordinatorQuality.acceptablePercentage}% Memenuhi Standar
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {coordinatorCpl.map((cpl) => (
              <div
                key={cpl.cplCode}
                className="p-3.5 rounded-xl border-2 border-black bg-surface shadow-retro-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-sm text-ink">{cpl.cplCode}</span>
                  <span
                    className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded border border-black',
                      cpl.status === 'Tercapai'
                        ? 'bg-surface text-ink'
                        : 'bg-primary text-white'
                    )}
                  >
                    {cpl.status}
                  </span>
                </div>
                <p className="text-xs text-gray-dark font-medium line-clamp-2 leading-relaxed">
                  {cpl.description}
                </p>
                <div className="pt-1 border-t border-black/10 flex items-center justify-between text-xs font-bold">
                  <span className="text-xs text-gray-dark">{cpl.classesAssessed} Kelas Paralel</span>
                  <span className="text-ink">{cpl.achievementPercentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TABEL ANALITIK BUTIR SOAL */}
      <div className="rounded-2xl border-2 border-black bg-surface shadow-retro overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm font-sans">
            <thead className="bg-gray-soft border-b-2 border-black font-heading font-bold text-ink uppercase">
              <tr>
                <th className="p-3.5 sm:p-4">No.</th>
                <th className="p-3.5 sm:p-4">Teks Pertanyaan & CPMK</th>
                <th className="p-3.5 sm:p-4 text-center">Tingkat Kesulitan (P)</th>
                <th className="p-3.5 sm:p-4 text-center">Daya Pembeda (D)</th>
                <th className="p-3.5 sm:p-4">Sebaran Pengecoh</th>
                <th className="p-3.5 sm:p-4 text-center">Waktu Rata-rata</th>
                <th className="p-3.5 sm:p-4 text-center">Status & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 font-medium bg-surface">
              {data.questions.map((q) => {
                const isNeedsReview =
                  q.difficultyLabel === 'Terlalu sulit' ||
                  q.difficultyLabel === 'Terlalu mudah' ||
                  q.discriminationLabel === 'Perlu ditinjau' ||
                  q.isFlaggedForRevision;

                return (
                  <tr
                    key={q.questionId}
                    className={cn(
                      'hover:bg-gray-soft/30 transition-colors',
                      q.isFlaggedForRevision && 'bg-primary/5'
                    )}
                  >
                    <td className="p-3.5 sm:p-4 font-bold text-ink">{q.questionNumber}</td>

                    <td className="p-3.5 sm:p-4 max-w-xs space-y-1">
                      <p className="font-bold text-ink line-clamp-2 leading-snug">{q.questionText}</p>
                      <span className="inline-block text-xs font-bold px-2 py-0.5 rounded border border-black/30 bg-gray-soft text-ink">
                        {q.cpmk}
                      </span>
                    </td>

                    {/* Tingkat Kesulitan P */}
                    <td className="p-3.5 sm:p-4 text-center">
                      <span className="font-bold text-ink block tabular-nums">{q.difficultyIndex}</span>
                      <span
                        className={cn(
                          'inline-block text-xs font-bold px-2 py-0.5 rounded border mt-0.5',
                          q.difficultyLabel === 'Terlalu mudah'
                            ? 'bg-gray-soft text-ink border-black'
                            : q.difficultyLabel === 'Terlalu sulit'
                            ? 'bg-primary text-white border-black'
                            : 'bg-surface text-ink border-black'
                        )}
                      >
                        {q.difficultyLabel}
                      </span>
                    </td>

                    {/* Daya Pembeda D */}
                    <td className="p-3.5 sm:p-4 text-center">
                      <span className="font-bold text-ink block tabular-nums">{q.discriminationIndex}</span>
                      <span
                        className={cn(
                          'inline-block text-xs font-bold px-2 py-0.5 rounded border mt-0.5',
                          q.discriminationLabel === 'Perlu ditinjau'
                            ? 'bg-primary text-white border-black font-bold'
                            : 'bg-surface text-ink border-black'
                        )}
                      >
                        {q.discriminationLabel}
                      </span>
                    </td>

                    {/* Distractor Stats */}
                    <td className="p-3.5 sm:p-4 min-w-[160px] space-y-1">
                      <div className="flex items-center gap-1 text-xs font-mono font-bold">
                        {q.distractors.map((d) => (
                          <span
                            key={d.option}
                            className={cn(
                              'px-1.5 py-0.5 rounded border text-xs',
                              d.isKey
                                ? 'bg-ink text-white border-black'
                                : 'bg-surface text-ink border-black/30'
                            )}
                            title={`Opsi ${d.option}: ${d.count} siswa (${d.percentage}%)${d.isKey ? ' (Kunci Jawaban)' : ''}`}
                          >
                            {d.option}:{d.percentage}%
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-dark leading-tight">
                        {q.distractorEvaluation}
                      </p>
                    </td>

                    {/* Waktu Rata-rata */}
                    <td className="p-3.5 sm:p-4 text-center tabular-nums font-bold text-ink">
                      {q.avgTimeSeconds} detik
                    </td>

                    {/* Status & Aksi Dosen */}
                    <td className="p-3.5 sm:p-4 text-center space-y-1.5">
                      <span
                        className={cn(
                          'inline-block px-2.5 py-0.5 rounded border text-xs font-bold',
                          q.isFlaggedForRevision
                            ? 'bg-primary text-white border-black'
                            : q.overallStatus === 'Perlu ditinjau'
                            ? 'bg-gray-soft text-ink border-black'
                            : 'bg-surface text-ink border-black'
                        )}
                      >
                        {q.isFlaggedForRevision ? 'Ditandai Revisi' : q.overallStatus}
                      </span>

                      <div>
                        <button
                          type="button"
                          onClick={() => handleOpenRevisionModal(q)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-ink hover:text-primary underline cursor-pointer"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>{q.isFlaggedForRevision ? 'Ubah Catatan' : 'Tandai Revisi'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PENANDAAN REVISI SOAL OLEH DOSEN */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSaveRevision}
            className="w-full max-w-lg rounded-2xl border-2 border-black bg-surface p-6 shadow-retro-window space-y-4 animate-fade-up"
          >
            <div className="flex items-center gap-2 text-ink font-heading font-bold text-base">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <span>Tandai Butir Soal #{selectedQuestion.questionNumber} untuk Direvisi</span>
            </div>

            <div className="p-3 rounded-lg border border-black/20 bg-gray-soft/40 text-xs space-y-1">
              <p className="font-bold text-ink">{selectedQuestion.questionText}</p>
              <p className="text-xs text-gray-dark">
                P-Value: {selectedQuestion.difficultyIndex} ({selectedQuestion.difficultyLabel}) · Daya Pembeda: {selectedQuestion.discriminationIndex} ({selectedQuestion.discriminationLabel})
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink uppercase tracking-wide">
                Catatan Revisi Dosen <span className="text-primary">*</span>
              </label>
              <textarea
                rows={3}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Tuliskan alasan revisi (contoh: daya pembeda rendah, opsi C membingungkan, kunci jawaban perlu dicek ulang)..."
                className="w-full p-3 rounded-lg border-2 border-black text-xs font-medium text-ink focus:outline-none"
                required
              />
              <span className="text-xs text-gray-dark block">
                Catatan ini akan otomatis muncul sebagai peringatan di Bank Soal (/exams/question-bank) dan dicatat pada audit trail.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                className="px-4 py-2 rounded-lg border border-black text-xs font-bold text-ink hover:bg-gray-soft"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending || !revisionNote.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg border-2 border-black bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-dark disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isPending ? 'Menyimpan...' : 'Simpan Peringatan Revisi'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
