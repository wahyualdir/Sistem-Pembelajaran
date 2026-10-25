'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Copy,
  CheckCircle,
  Sliders,
  Play,
  RotateCw,
  Search,
  Eye,
  FileText,
} from 'lucide-react';
import {
  triggerSimilarityCheckAction,
  getSimilarityResultsAction,
  updateSimilarityReviewAction,
} from './exam-actions';

interface SimilarityPair {
  run_id: string;
  submission_a: string;
  submission_b: string;
  score: number;
  matched_segments: any[];
  review_status: 'baru' | 'wajar' | 'perlu_ditinjau';
  review_note: string | null;
}

interface SimilarityCheckPanelProps {
  assignmentId: string;
  isLecturer: boolean;
  canViewSimilarity?: boolean;
}

export function SimilarityCheckPanel({
  assignmentId,
  isLecturer,
  canViewSimilarity = true,
}: SimilarityCheckPanelProps) {
  const [threshold, setThreshold] = useState<number>(0.6);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pairs, setPairs] = useState<SimilarityPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<SimilarityPair | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const loadResults = React.useCallback(async () => {
    setIsLoading(true);
    const res = await getSimilarityResultsAction(assignmentId);
    if (res.ok && res.pairs) {
      setPairs(res.pairs as SimilarityPair[]);
    }
    setIsLoading(false);
  }, [assignmentId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleRunCheck = async () => {
    if (!isLecturer) return;
    setIsRunning(true);
    const res = await triggerSimilarityCheckAction(assignmentId, threshold);
    if (res.ok) {
      await loadResults();
    }
    setIsRunning(false);
  };

  const handleSetReviewStatus = async (status: 'wajar' | 'perlu_ditinjau') => {
    if (!selectedPair) return;
    setIsUpdating(true);
    const res = await updateSimilarityReviewAction(
      selectedPair.run_id,
      selectedPair.submission_a,
      selectedPair.submission_b,
      status,
      reviewNote || selectedPair.review_note || undefined
    );
    if (res.ok) {
      setPairs((prev) =>
        prev.map((p) =>
          p.submission_a === selectedPair.submission_a && p.submission_b === selectedPair.submission_b
            ? { ...p, review_status: status, review_note: reviewNote || p.review_note }
            : p
        )
      );
      setSelectedPair((prev) =>
        prev ? { ...prev, review_status: status, review_note: reviewNote || prev.review_note } : null
      );
    }
    setIsUpdating(false);
  };

  if (!canViewSimilarity && !isLecturer) {
    return (
      <div className="rounded-[12px] border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
        Anda tidak memiliki izin untuk melihat hasil pemeriksaan kemiripan tugas ini.
      </div>
    );
  }

  const filteredPairs = pairs.filter((p) => p.score >= threshold);

  return (
    <div className="space-y-6">
      {/* Disclaimer Wajib */}
      <div className="rounded-[8px] bg-muted/50 border border-border p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground font-semibold block mb-0.5">
            Pemberitahuan Analisis Kemiripan
          </strong>
          Kemiripan tinggi belum tentu plagiarisme. Tinjau isinya sebelum mengambil keputusan. Tidak ada penalti otomatis.
        </div>
      </div>

      {/* Kontrol & Slider Ambang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border p-4 rounded-[12px] shadow-sm">
        <div className="space-y-1 w-full sm:w-80">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>Ambang Kemiripan Minimum:</span>
            <span className="text-foreground">{Math.round(threshold * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.3}
            max={0.95}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {isLecturer && (
          <button
            onClick={handleRunCheck}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Sedang Memeriksa…' : 'Jalankan Cek Kemiripan'}</span>
          </button>
        )}
      </div>

      {/* Daftar Pasangan Kemiripan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pasangan Kemiripan ({filteredPairs.length})
          </h3>

          {filteredPairs.length === 0 ? (
            <div className="rounded-[8px] border border-border bg-surface p-6 text-center text-xs text-muted-foreground">
              Tidak ada pasangan pengumpulan di atas ambang batas {Math.round(threshold * 100)}%.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredPairs.map((pair, idx) => {
                const isSelected =
                  selectedPair?.submission_a === pair.submission_a &&
                  selectedPair?.submission_b === pair.submission_b;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPair(pair);
                      setReviewNote(pair.review_note || '');
                    }}
                    className={`w-full text-left p-3 rounded-[8px] border transition-all text-xs space-y-1.5 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border bg-surface hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        Pasangan #{idx + 1}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          pair.score >= 0.8
                            ? 'bg-destructive/10 text-destructive'
                            : pair.score >= 0.6
                            ? 'bg-warning/10 text-warning'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {Math.round(pair.score * 100)}% Mirip
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      Status Ulasan:{' '}
                      <span className="font-medium text-foreground">
                        {pair.review_status === 'wajar'
                          ? 'Wajar'
                          : pair.review_status === 'perlu_ditinjau'
                          ? 'Perlu Ditinjau'
                          : 'Belum Ditinjau'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel Detail Peninjauan Berdampingan */}
        <div className="md:col-span-2">
          {selectedPair ? (
            <div className="rounded-[12px] border border-border bg-surface p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Peninjauan Berdampingan ({Math.round(selectedPair.score * 100)}% Kemiripan)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Bandingkan konten pengumpulan untuk melihat pola kemiripan.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSetReviewStatus('wajar')}
                    disabled={isUpdating}
                    className="px-3 py-1.5 text-xs font-semibold rounded-[6px] border border-success/30 bg-success/10 text-success hover:bg-success/20 transition-colors"
                  >
                    Wajar
                  </button>
                  <button
                    onClick={() => handleSetReviewStatus('perlu_ditinjau')}
                    disabled={isUpdating}
                    className="px-3 py-1.5 text-xs font-semibold rounded-[6px] border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    Perlu Ditinjau
                  </button>
                </div>
              </div>

              {/* Tampilan Konten Berdampingan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Pengumpulan A</span>
                  </div>
                  <div className="h-48 overflow-y-auto p-3 rounded-[8px] border border-border bg-muted/20 font-mono text-xs leading-relaxed">
                    Konten berkas/jawaban pengumpulan A. Segmen kemiripan terdeteksi pada pola kalimat atau struktur logika program.
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Pengumpulan B</span>
                  </div>
                  <div className="h-48 overflow-y-auto p-3 rounded-[8px] border border-border bg-muted/20 font-mono text-xs leading-relaxed">
                    Konten berkas/jawaban pengumpulan B. Segmen kemiripan terdeteksi pada pola kalimat atau struktur logika program.
                  </div>
                </div>
              </div>

              {/* Catatan Peninjau */}
              <div className="space-y-1 pt-2 border-t border-border">
                <label className="text-xs font-semibold text-muted-foreground">Catatan Peninjauan Dosen</label>
                <textarea
                  rows={2}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Tulis alasan jika wajar (misal: format kutipan baku) atau temuan peninjauan…"
                  className="w-full px-3 py-2 text-xs rounded-[8px] border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[220px] rounded-[12px] border border-dashed border-border flex items-center justify-center p-6 text-center text-xs text-muted-foreground">
              Pilih salah satu pasangan di sisi kiri untuk melihat perbandingan berdampingan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
