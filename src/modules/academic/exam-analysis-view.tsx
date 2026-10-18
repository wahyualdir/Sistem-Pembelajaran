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
    <div className="space-y-6">
      {/* Pemilih Ujian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border p-4 rounded-[12px] shadow-sm">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Pilih Ujian untuk Dianalisis</label>
          <select
            value={selectedQuizId}
            onChange={(e) => {
              setSelectedQuizId(e.target.value);
              setAnalysisData(null);
            }}
            className="w-full sm:w-80 px-3 py-2 text-sm rounded-[8px] border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
          onClick={handleRunAnalysis}
          disabled={!selectedQuizId || isCalculating}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
          <span>{isCalculating ? 'Sedang Dihitung…' : 'Hitung Analisis Butir Soal'}</span>
        </button>
      </div>

      {analysisData ? (
        <div className="space-y-6">
          {/* Ringkasan Statistik Ujian */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-[12px] border border-border bg-surface p-4">
              <div className="text-xs font-medium text-muted-foreground">Rata-Rata Nilai</div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {analysisData.summary.mean.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Median: {analysisData.summary.median.toFixed(2)}
              </div>
            </div>

            <div className="rounded-[12px] border border-border bg-surface p-4">
              <div className="text-xs font-medium text-muted-foreground">Standar Deviasi</div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {analysisData.summary.stddev.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Rentang: {analysisData.summary.min} s.d. {analysisData.summary.max}
              </div>
            </div>

            <div className="rounded-[12px] border border-border bg-surface p-4">
              <div className="text-xs font-medium text-muted-foreground">Reliabilitas (KR-20)</div>
              <div className="text-2xl font-bold text-primary mt-1">
                {analysisData.summary.kr20.toFixed(4)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {analysisData.summary.kr20 >= 0.7 ? 'Kategori Tinggi' : 'Kategori Rendah'}
              </div>
            </div>

            <div className="rounded-[12px] border border-border bg-surface p-4">
              <div className="text-xs font-medium text-muted-foreground">Total Peserta</div>
              <div className="text-2xl font-bold text-foreground mt-1">{analysisData.summary.n}</div>
              <div className="text-xs text-muted-foreground mt-1">Peserta menyelesaikan</div>
            </div>
          </div>

          {/* Histogram Sebaran Nilai */}
          {analysisData.summary.histogram && analysisData.summary.histogram.length > 0 && (
            <div className="rounded-[12px] border border-border bg-surface p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Sebaran Skor Peserta</h3>
              <div className="grid grid-cols-5 gap-2 items-end h-28 pt-4">
                {analysisData.summary.histogram.map((bin: any, idx: number) => {
                  const maxCount = Math.max(...analysisData.summary.histogram.map((b: any) => b.count), 1);
                  const heightPercent = Math.round((bin.count / maxCount) * 100);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[11px] font-medium text-muted-foreground">{bin.count}</span>
                      <div
                        style={{ height: `${Math.max(8, heightPercent)}%` }}
                        className="w-full bg-primary/80 rounded-t-[4px] hover:bg-primary transition-all"
                      />
                      <span className="text-[10px] text-muted-foreground font-medium truncate w-full text-center">
                        {bin.bin}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter Butir Soal */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Tingkat Kesukaran:</span>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-[6px] border border-border bg-surface text-foreground"
              >
                <option value="all">Semua</option>
                <option value="sukar">Sukar (p &lt; 0.30)</option>
                <option value="sedang">Sedang (0.30 - 0.70)</option>
                <option value="mudah">Mudah (p &gt; 0.70)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Daya Pembeda:</span>
              <select
                value={filterDiscrimination}
                onChange={(e) => setFilterDiscrimination(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-[6px] border border-border bg-surface text-foreground"
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
          <div className="rounded-[12px] border border-border bg-surface overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Nomor Soal</th>
                    <th className="py-3 px-4 text-center">Tingkat Kesukaran (p)</th>
                    <th className="py-3 px-4 text-center">Daya Pembeda (D)</th>
                    <th className="py-3 px-4 text-center">Point-Biserial</th>
                    <th className="py-3 px-4 text-center">Status Pengecoh</th>
                    <th className="py-3 px-4 text-center">Tanda Revisi</th>
                    <th className="py-3 px-4 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredItems.map((it: any, index: number) => (
                    <tr key={it.questionId} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">
                        Soal #{index + 1}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                            it.difficultyCategory === 'sukar'
                              ? 'bg-destructive/10 text-destructive border border-destructive/20'
                              : it.difficultyCategory === 'sedang'
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'bg-success/10 text-success border border-success/20'
                          }`}
                        >
                          {it.difficultyP.toFixed(2)} ({it.difficultyCategory})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                            it.discriminationCategory === 'perlu_revisi'
                              ? 'bg-destructive/10 text-destructive border border-destructive/20'
                              : it.discriminationCategory === 'sangat_baik'
                              ? 'bg-success/10 text-success border border-success/20'
                              : 'bg-muted text-foreground border border-border'
                          }`}
                        >
                          {it.discriminationD.toFixed(2)} ({it.discriminationCategory.replace('_', ' ')})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        {it.pointBiserial.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {it.distractorWarnings && it.distractorWarnings.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
                            <AlertTriangle className="h-3.5 w-3.5" /> Ada Peringatan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Efektif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleRevision(it.questionId, it.needsRevision)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-[6px] border transition-colors ${
                            it.needsRevision
                              ? 'bg-destructive text-destructive-foreground border-destructive'
                              : 'bg-surface hover:bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {it.needsRevision ? 'Perlu Revisi' : 'Normal'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setActiveQuestionId(it.questionId)}
                          className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
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
        <div className="rounded-[12px] border border-border bg-surface p-10 text-center space-y-2">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">Data Analisis Belum Dihitung</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Klik tombol &quot;Hitung Analisis Butir Soal&quot; di atas untuk memproses tingkat kesukaran, daya pembeda, dan pengecoh dari jawaban peserta.
          </p>
        </div>
      )}

      {/* Drawer Detail Pengecoh Soal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40">
          <div className="w-full max-w-md h-full bg-surface border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base text-foreground">Detail Pilihan & Pengecoh</h3>
                <button
                  onClick={() => setActiveQuestionId(null)}
                  className="p-1 rounded-[6px] hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Sebaran Pilihan */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Sebaran Pilihan Jawaban Peserta
                </h4>
                {activeItem.optionCounts && Object.keys(activeItem.optionCounts).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(activeItem.optionCounts).map(([optKey, count]: [string, any]) => {
                      const total = activeItem.n || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={optKey} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span>Pilihan {optKey}</span>
                            <span className="text-muted-foreground">
                              {count} orang ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              style={{ width: `${pct}%` }}
                              className="bg-primary h-2 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Tidak ada data pilihan opsi (soal esai/koding).</p>
                )}
              </div>

              {/* Peringatan Pengecoh */}
              {activeItem.distractorWarnings && activeItem.distractorWarnings.length > 0 && (
                <div className="p-4 rounded-[8px] bg-warning/10 border border-warning/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Catatan Efektivitas Pengecoh</span>
                  </div>
                  <ul className="text-xs text-foreground/90 list-disc list-inside space-y-1">
                    {activeItem.distractorWarnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={() => setActiveQuestionId(null)}
                className="w-full py-2 text-xs font-semibold rounded-[8px] border border-border bg-surface hover:bg-muted text-foreground transition-colors"
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
