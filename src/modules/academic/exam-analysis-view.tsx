'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  X,
  Sliders,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { runItemAnalysisAction, markQuestionNeedsRevisionAction } from './exam-actions';

interface QuizOptionItem {
  id: string;
  title: string;
  class_title: string;
}

interface ExamAnalysisViewProps {
  quizzes: QuizOptionItem[];
}

export function ExamAnalysisView({ quizzes }: ExamAnalysisViewProps) {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || '');
  const [isCalculating, setIsCalculating] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterDiscrimination, setFilterDiscrimination] = useState<string>('all');

  const handleRunAnalysis = async () => {
    if (!selectedQuizId) return;
    setIsCalculating(true);
    const res = await runItemAnalysisAction(selectedQuizId);
    if (res.ok && res.data) {
      setAnalysisData(res.data);
    }
    setIsCalculating(false);
  };

  const handleToggleRevision = async (qId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const res = await markQuestionNeedsRevisionAction(qId, nextStatus);
    if (res.ok && analysisData) {
      setAnalysisData({
        ...analysisData,
        items: {
          ...analysisData.items,
          [qId]: {
            ...analysisData.items[qId],
            needsRevision: nextStatus,
          },
        },
      });
    }
  };

  const itemsList = analysisData ? Object.values(analysisData.items) : [];
  const filteredItems = itemsList.filter((it: any) => {
    if (filterDifficulty !== 'all' && it.difficultyCategory !== filterDifficulty) return false;
    if (filterDiscrimination !== 'all' && it.discriminationCategory !== filterDiscrimination) return false;
    return true;
  });

  const activeItem = activeQuestionId && analysisData?.items ? analysisData.items[activeQuestionId] : null;

  return (
    <div className="space-y-6 font-sans">
      {/* Pemilih Ujian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-black p-4 sm:p-5 rounded-2xl shadow-retro">
        <div className="space-y-1">
          <label className="text-xs font-mono font-bold text-black uppercase tracking-wider">Pilih Ujian untuk Dianalisis</label>
          <select
            value={selectedQuizId}
            onChange={(e) => {
              setSelectedQuizId(e.target.value);
              setAnalysisData(null);
            }}
            className="w-full sm:w-96 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border-2 border-black bg-white text-black shadow-retro-sm cursor-pointer"
          >
            {quizzes.length === 0 ? (
              <option value="">Belum ada ujian tersedia</option>
            ) : (
              quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.class_title})
                </option>
              ))
            )}
          </select>
        </div>

        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={!selectedQuizId || isCalculating}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 transition-all shadow-retro disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
          <span>{isCalculating ? 'Sedang Dihitung…' : 'Hitung Analisis Butir Soal'}</span>
        </button>
      </div>

      {analysisData ? (
        <div className="space-y-6">
          {/* Ringkasan Statistik Ujian */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border-2 border-black bg-white p-4 sm:p-5 shadow-retro">
              <div className="text-[11px] font-mono font-bold text-black/70 uppercase tracking-wider">Rata-Rata Nilai</div>
              <div className="text-2xl sm:text-3xl font-heading font-black text-black mt-1">
                {analysisData.summary.mean.toFixed(2)}
              </div>
              <div className="text-xs font-mono text-black/70 mt-1">
                Median: {analysisData.summary.median.toFixed(2)}
              </div>
            </div>

            <div className="rounded-xl border-2 border-black bg-white p-4 sm:p-5 shadow-retro">
              <div className="text-[11px] font-mono font-bold text-black/70 uppercase tracking-wider">Standar Deviasi</div>
              <div className="text-2xl sm:text-3xl font-heading font-black text-black mt-1">
                {analysisData.summary.stddev.toFixed(2)}
              </div>
              <div className="text-xs font-mono text-black/70 mt-1">
                Rentang: {analysisData.summary.min} s.d. {analysisData.summary.max}
              </div>
            </div>

            <div className="rounded-xl border-2 border-black bg-white p-4 sm:p-5 shadow-retro">
              <div className="text-[11px] font-mono font-bold text-black/70 uppercase tracking-wider">Reliabilitas (KR-20)</div>
              <div className="text-2xl sm:text-3xl font-heading font-black text-black mt-1">
                {analysisData.summary.kr20.toFixed(4)}
              </div>
              <div className="text-xs font-mono text-black/70 mt-1">
                {analysisData.summary.kr20 >= 0.7 ? 'Kategori Tinggi' : 'Kategori Rendah'}
              </div>
            </div>

            <div className="rounded-xl border-2 border-black bg-white p-4 sm:p-5 shadow-retro">
              <div className="text-[11px] font-mono font-bold text-black/70 uppercase tracking-wider">Total Peserta</div>
              <div className="text-2xl sm:text-3xl font-heading font-black text-black mt-1">{analysisData.summary.n}</div>
              <div className="text-xs font-mono text-black/70 mt-1">Peserta menyelesaikan</div>
            </div>
          </div>

          {/* Histogram Sebaran Nilai */}
          {analysisData.summary.histogram && analysisData.summary.histogram.length > 0 && (
            <div className="rounded-2xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro space-y-3">
              <h3 className="text-sm font-heading font-black text-black">Sebaran Skor Peserta</h3>
              <div className="grid grid-cols-5 gap-2 items-end h-28 pt-4">
                {analysisData.summary.histogram.map((bin: any, idx: number) => {
                  const maxCount = Math.max(...analysisData.summary.histogram.map((b: any) => b.count), 1);
                  const heightPercent = Math.round((bin.count / maxCount) * 100);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[11px] font-mono font-bold text-black">{bin.count}</span>
                      <div
                        style={{ height: `${Math.max(8, heightPercent)}%` }}
                        className="w-full bg-black rounded-t border-t-2 border-x-2 border-black hover:bg-neutral-800 transition-all"
                      />
                      <span className="text-[10px] font-mono text-black/70 font-bold truncate w-full text-center">
                        {bin.bin}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter Butir Soal */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-soft/60 rounded-xl border-2 border-black shadow-retro-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-black">Tingkat Kesukaran:</span>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border-2 border-black bg-white text-black shadow-retro-sm cursor-pointer"
              >
                <option value="all">Semua</option>
                <option value="sukar">Sukar (p &lt; 0.30)</option>
                <option value="sedang">Sedang (0.30 - 0.70)</option>
                <option value="mudah">Mudah (p &gt; 0.70)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-black">Daya Pembeda:</span>
              <select
                value={filterDiscrimination}
                onChange={(e) => setFilterDiscrimination(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border-2 border-black bg-white text-black shadow-retro-sm cursor-pointer"
              >
                <option value="all">Semua</option>
                <option value="sangat_baik">Sangat Baik (D &ge; 0.40)</option>
                <option value="baik">Baik (0.30 - 0.39)</option>
                <option value="cukup">Cukup (0.20 - 0.29)</option>
                <option value="perlu_revisi">Perlu Revisi (D &lt; 0.20)</option>
              </select>
            </div>
          </div>

          {/* Tabel Butir Soal */}
          <div className="rounded-2xl border-2 border-black bg-white overflow-hidden shadow-retro">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-neutral-100 text-xs font-mono font-bold text-black uppercase">
                    <th className="py-3.5 px-4">Nomor Soal</th>
                    <th className="py-3.5 px-4 text-center">Tingkat Kesukaran (p)</th>
                    <th className="py-3.5 px-4 text-center">Daya Pembeda (D)</th>
                    <th className="py-3.5 px-4 text-center">Point-Biserial</th>
                    <th className="py-3.5 px-4 text-center">Status Pengecoh</th>
                    <th className="py-3.5 px-4 text-center">Tanda Revisi</th>
                    <th className="py-3.5 px-4 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10">
                  {filteredItems.map((it: any, index: number) => (
                    <tr key={it.questionId} className="hover:bg-gray-soft/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-black">
                        Soal #{index + 1}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            'inline-flex px-2 py-0.5 rounded border-2 border-black text-xs font-mono font-bold shadow-retro-sm',
                            it.difficultyCategory === 'sukar'
                              ? 'bg-black text-white'
                              : it.difficultyCategory === 'sedang'
                              ? 'bg-gray-soft text-black'
                              : 'bg-white text-black'
                          )}
                        >
                          {it.difficultyP.toFixed(2)} ({it.difficultyCategory})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            'inline-flex px-2 py-0.5 rounded border-2 border-black text-xs font-mono font-bold shadow-retro-sm',
                            it.discriminationCategory === 'perlu_revisi'
                              ? 'bg-black text-white'
                              : it.discriminationCategory === 'sangat_baik'
                              ? 'bg-white text-black'
                              : 'bg-gray-soft text-black'
                          )}
                        >
                          {it.discriminationD.toFixed(2)} ({it.discriminationCategory.replace('_', ' ')})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs font-bold text-black">
                        {it.pointBiserial.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {it.distractorWarnings && it.distractorWarnings.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-black">
                            <AlertTriangle className="h-3.5 w-3.5 text-black" /> Ada Peringatan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-black/70 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-black" /> Efektif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRevision(it.questionId, it.needsRevision)}
                          className={cn(
                            'px-2.5 py-1 text-xs font-mono font-bold rounded-lg border-2 border-black transition-all cursor-pointer shadow-retro-sm',
                            it.needsRevision
                              ? 'bg-black text-white'
                              : 'bg-white text-black hover:bg-gray-soft'
                          )}
                        >
                          {it.needsRevision ? 'Perlu Revisi' : 'Normal'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setActiveQuestionId(it.questionId)}
                          className="inline-flex items-center gap-1 text-xs text-black font-bold hover:underline cursor-pointer"
                        >
                          <span>Lihat Pengecoh</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-black bg-gray-soft/40 p-10 text-center space-y-3">
          <BarChart3 className="h-10 w-10 text-black mx-auto" />
          <h3 className="text-base font-heading font-black text-black">Data Analisis Belum Dihitung</h3>
          <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto font-medium">
            Klik tombol &quot;Hitung Analisis Butir Soal&quot; di atas untuk memproses tingkat kesukaran, daya pembeda, dan pengecoh dari jawaban peserta.
          </p>
        </div>
      )}

      {/* Drawer Detail Pengecoh Soal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50">
          <div className="w-full max-w-md h-full bg-white border-l-2 border-black p-6 shadow-retro-window flex flex-col justify-between overflow-y-auto animate-fade-in font-sans">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border border-black bg-black inline-block" />
                  <span className="h-3 w-3 rounded-full border border-black bg-white inline-block" />
                  <h3 className="font-heading font-black text-base sm:text-lg text-black ml-1">
                    Detail Pilihan & Pengecoh
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveQuestionId(null)}
                  className="p-1 rounded-lg hover:bg-gray-soft text-black cursor-pointer border border-transparent hover:border-black"
                >
                  <X className="h-5 w-5 text-black" />
                </button>
              </div>

              {/* Sebaran Pilihan */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">
                  Sebaran Pilihan Jawaban Peserta
                </h4>
                {activeItem.optionCounts && Object.keys(activeItem.optionCounts).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(activeItem.optionCounts).map(([optKey, count]: [string, any]) => {
                      const total = activeItem.n || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={optKey} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-black font-mono">
                            <span>Pilihan {optKey}</span>
                            <span className="text-black/70">
                              {count} orang ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-2.5 border border-black overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className="bg-black h-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-black/70">Tidak ada data pilihan opsi (soal esai/koding).</p>
                )}
              </div>

              {/* Peringatan Pengecoh */}
              {activeItem.distractorWarnings && activeItem.distractorWarnings.length > 0 && (
                <div className="p-4 rounded-xl bg-gray-soft border-2 border-black space-y-2 shadow-retro-sm">
                  <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-black">
                    <AlertTriangle className="h-4 w-4 text-black" />
                    <span>Catatan Efektivitas Pengecoh</span>
                  </div>
                  <ul className="text-xs text-black/85 list-disc list-inside space-y-1 font-medium">
                    {activeItem.distractorWarnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setActiveQuestionId(null)}
                className="w-full py-2.5 text-xs font-bold rounded-xl border-2 border-black bg-white hover:bg-gray-soft text-black transition-all shadow-retro-sm cursor-pointer"
              >
                Tutup Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
