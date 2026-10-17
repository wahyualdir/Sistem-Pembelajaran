'use client';

import React, { useState, useTransition } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Eye,
  Sliders,
  FileCode,
  FileText,
  Clock,
  ArrowRight,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimilarityPair, SimilarityReviewStatus } from './similarity-engine';
import {
  reviewSimilarityPairAction,
  updateAssignmentSimilarityThresholdAction,
} from './similarity-actions';

interface SimilarityReviewViewProps {
  assignmentId: string;
  initialPairs: SimilarityPair[];
  initialThreshold: number;
  totalSubmissions: number;
}

export function SimilarityReviewView({
  assignmentId,
  initialPairs,
  initialThreshold,
  totalSubmissions,
}: SimilarityReviewViewProps) {
  const [pairs, setPairs] = useState<SimilarityPair[]>(initialPairs);
  const [threshold, setThreshold] = useState<number>(initialThreshold);
  const [selectedPair, setSelectedPair] = useState<SimilarityPair | null>(null);

  // Modal State untuk Peninjauan Dosen
  const [reviewModalPair, setReviewModalPair] = useState<SimilarityPair | null>(null);
  const [reviewStatus, setReviewStatus] = useState<SimilarityReviewStatus>('PERLU_KLARIFIKASI');
  const [reviewNote, setReviewNote] = useState('');
  const [isPending, startTransition] = useTransition();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const highSimilarityPairs = pairs.filter((p) => p.similarityScore >= threshold);

  const handleOpenReview = (pair: SimilarityPair) => {
    setReviewModalPair(pair);
    setReviewStatus(pair.reviewStatus === 'BELUM_DITINJAU' ? 'PERLU_KLARIFIKASI' : pair.reviewStatus);
    setReviewNote(pair.reviewNote || '');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalPair || !reviewNote.trim()) return;

    startTransition(async () => {
      const res = await reviewSimilarityPairAction({
        pairId: reviewModalPair.id,
        status: reviewStatus as any,
        note: reviewNote.trim(),
      });

      if (res.ok && res.pair) {
        setPairs((prev) =>
          prev.map((p) => (p.id === res.pair!.id ? res.pair! : p))
        );
        if (selectedPair?.id === res.pair.id) {
          setSelectedPair(res.pair);
        }
        setReviewModalPair(null);
        setToastMsg(`Status telaah kemiripan diperbarui menjadi "${reviewStatus}".`);
      }
    });
  };

  const handleUpdateThreshold = (newVal: number) => {
    setThreshold(newVal);
    startTransition(async () => {
      await updateAssignmentSimilarityThresholdAction({
        assignmentId,
        threshold: newVal,
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. KARTU RINGKASAN & PENGATURAN AMBANG BATAS */}
      <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                <ShieldAlert className="h-4 w-4" />
              </span>
              <h2 className="font-heading font-bold text-lg text-black">
                Pemeriksaan Integritas & Kemiripan Pengumpulan
              </h2>
            </div>
            <p className="text-xs text-black/70 mt-1 max-w-2xl leading-relaxed">
              Mendeteksi kemiripan teks menggunakan N-Gram shingling dan normalisasi sintaksis kode sumber. Skor berfungsi sebagai alat bantu telaah manusia (bukan penalti otomatis).
            </p>
          </div>

          {/* Pengaturan Ambang Batas Skor */}
          <div className="flex items-center gap-3 bg-gray-soft p-2.5 rounded-lg border-2 border-black shrink-0">
            <Sliders className="h-4 w-4 text-black" />
            <div className="text-xs font-sans">
              <span className="font-bold block text-black">Batas Peringatan:</span>
              <span className="text-black/60">&ge; {threshold}% Kemiripan</span>
            </div>
            <select
              value={threshold}
              onChange={(e) => handleUpdateThreshold(Number(e.target.value))}
              className="px-2 py-1 bg-white border-2 border-black rounded font-sans font-bold text-xs cursor-pointer outline-none"
            >
              <option value={30}>30% (Ketat)</option>
              <option value={40}>40% (Standar)</option>
              <option value={50}>50% (Sedang)</option>
              <option value={60}>60% (Longgar)</option>
              <option value={70}>70% (Tinggi)</option>
            </select>
          </div>
        </div>

        {/* Status Indikator */}
        <div className="mt-4 pt-4 border-t-2 border-black/10 flex flex-wrap items-center gap-4 text-xs font-sans font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-black bg-primary shrink-0" />
            <span>Terindikasi Tinggi (&ge;{threshold}%): <strong>{highSimilarityPairs.length} Pasangan</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-black bg-gray-soft shrink-0" />
            <span>Total Pengumpulan Diperiksa: <strong>{totalSubmissions} Mahasiswa</strong></span>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-surface border-2 border-black rounded-lg text-xs font-sans font-bold text-ink flex items-center justify-between">
          <span>{toastMsg}</span>
          <button type="button" onClick={() => setToastMsg(null)} className="cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. TABEL DAFTAR PASANGAN KEMIRIPAN */}
      <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black">
              <tr>
                <th className="p-3.5 sm:p-4">Pasangan Mahasiswa</th>
                <th className="p-3.5 sm:p-4 text-center">Tipe Berkas</th>
                <th className="p-3.5 sm:p-4 text-center">Skor Kemiripan</th>
                <th className="p-3.5 sm:p-4 text-center">Status Telaah</th>
                <th className="p-3.5 sm:p-4 text-center">Aksi Dosen</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 font-medium">
              {pairs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-black/60 font-sans">
                    Belum ada pasangan pengumpulan yang terdeteksi memiliki kemiripan.
                  </td>
                </tr>
              ) : (
                pairs.map((pair) => {
                  const isHigh = pair.similarityScore >= threshold;
                  const statusColors: Record<SimilarityReviewStatus, string> = {
                    BELUM_DITINJAU: 'bg-primary text-white',
                    TIDAK_MASALAH: 'bg-gray-soft text-black',
                    PERLU_KLARIFIKASI: 'bg-surface text-ink',
                    PELANGGARAN: 'bg-primary-dark text-white',
                  };

                  return (
                    <tr
                      key={pair.id}
                      className={cn(
                        'hover:bg-gray-soft/40 transition-colors',
                        isHigh && 'bg-primary/5'
                      )}
                    >
                      <td className="p-3.5 sm:p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-bold text-black">
                            <span>{pair.studentNameA}</span>
                            <span className="text-black/40 font-normal">vs</span>
                            <span>{pair.studentNameB}</span>
                          </div>
                          {pair.reviewNote && (
                            <p className="text-xs text-black/70 italic">
                              Catatan: &ldquo;{pair.reviewNote}&rdquo; &bull; oleh {pair.reviewedBy}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 sm:p-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-sans font-bold px-2 py-0.5 rounded border border-black bg-white">
                          {pair.isCode ? (
                            <>
                              <FileCode className="h-3 w-3 text-primary" />
                              <span>Kode Program</span>
                            </>
                          ) : (
                            <>
                              <FileText className="h-3 w-3 text-black" />
                              <span>Teks Laporan</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="p-3.5 sm:p-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-sans font-bold text-sm">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full border-2 border-black tabular-nums',
                              isHigh
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-gray-soft text-black'
                            )}
                          >
                            {pair.similarityScore}%
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 sm:p-4 text-center">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded border border-black text-xs font-sans font-bold uppercase',
                            statusColors[pair.reviewStatus]
                          )}
                        >
                          {pair.reviewStatus.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="p-3.5 sm:p-4 text-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPair(pair)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-2 border-black bg-white text-xs font-bold shadow-xs hover:bg-neutral-100 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Bandingkan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(pair)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border-2 border-black bg-ink text-white text-xs font-bold shadow-xs hover:bg-black cursor-pointer"
                        >
                          <span>Tinjau</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MODAL PERBANDINGAN BERDAMPINGAN (SIDE-BY-SIDE DIFF VIEW) */}
      {selectedPair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border-4 border-black bg-white shadow-retro overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-gray-soft border-b-2 border-black flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg border border-black bg-primary text-white">
                  <ShieldAlert className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-heading font-bold text-base text-black">
                    Perbandingan Berdampingan: {selectedPair.studentNameA} vs {selectedPair.studentNameB}
                  </h3>
                  <p className="text-xs text-black/60 font-sans">
                    Skor Kemiripan: <strong className="text-primary">{selectedPair.similarityScore}%</strong> &bull; {selectedPair.isCode ? 'Normalisasi Sintaksis Kode' : 'N-Gram Shingling Teks'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPair(null)}
                className="p-1.5 rounded-lg border-2 border-black bg-white hover:bg-gray-soft cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Kolom Kiri & Kanan */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-50">
              {/* Kolom Mahasiswa A */}
              <div className="rounded-xl border-2 border-black bg-white p-4 space-y-2">
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                  <span className="font-heading font-bold text-sm text-black">
                    {selectedPair.studentNameA}
                  </span>
                  <span className="text-xs font-sans text-black/50">Pengumpulan A</span>
                </div>
                <pre className="text-xs font-mono p-3 bg-gray-soft/50 rounded-lg border border-black/20 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[50vh]">
                  {selectedPair.textA}
                </pre>
              </div>

              {/* Kolom Mahasiswa B */}
              <div className="rounded-xl border-2 border-black bg-white p-4 space-y-2">
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                  <span className="font-heading font-bold text-sm text-black">
                    {selectedPair.studentNameB}
                  </span>
                  <span className="text-xs font-sans text-black/50">Pengumpulan B</span>
                </div>
                <pre className="text-xs font-mono p-3 bg-gray-soft/50 rounded-lg border border-black/20 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[50vh]">
                  {selectedPair.textB}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t-2 border-black flex items-center justify-between gap-3">
              <span className="text-xs font-sans text-black/60">
                Status saat ini: <strong>{selectedPair.reviewStatus.replace(/_/g, ' ')}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenReview(selectedPair)}
                  className="px-4 py-2 rounded-lg border-2 border-black bg-primary text-white text-xs font-bold shadow-retro hover:bg-primary-dark cursor-pointer"
                >
                  Tandai Keputusan Dosen
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPair(null)}
                  className="px-4 py-2 rounded-lg border-2 border-black bg-white text-xs font-bold hover:bg-neutral-100 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL KEPUTUSAN & CATATAN TELAAH DOSEN */}
      {reviewModalPair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border-4 border-black bg-white shadow-retro p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className="font-heading font-bold text-base text-black flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                <span>Keputusan Telaah Kemiripan Tugas</span>
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalPair(null)}
                className="cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <p className="text-xs text-black/70 mb-2">
                  Menelaah kemiripan antara <strong>{reviewModalPair.studentNameA}</strong> dan <strong>{reviewModalPair.studentNameB}</strong> (Skor: {reviewModalPair.similarityScore}%).
                </p>

                <label className="text-xs font-bold uppercase tracking-wider block mb-1">
                  Status Telaah
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'TIDAK_MASALAH', label: 'Tidak Masalah', color: 'bg-white text-black' },
                    { id: 'PERLU_KLARIFIKASI', label: 'Perlu Klarifikasi', color: 'bg-surface text-ink' },
                    { id: 'PELANGGARAN', label: 'Pelanggaran', color: 'bg-primary text-white' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setReviewStatus(s.id as SimilarityReviewStatus)}
                      className={cn(
                        'p-2 rounded-lg border-2 border-black text-xs font-bold transition-all cursor-pointer',
                        reviewStatus === s.id
                          ? `${s.color} ring-2 ring-black shadow-xs`
                          : 'bg-neutral-100 text-black/60'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1">
                  Catatan Telaah / Alasan Investigasi <span className="text-primary">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Misal: Mahasiswa mengonfirmasi bahwa mereka belajar bersama, namun kode memiliki struktur variabel yang persis sama. Diminta klarifikasi saat praktikum berikutnya."
                  className="w-full p-2.5 rounded-lg border-2 border-black text-xs font-sans outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <span className="text-[11px] text-black/50 block mt-1">
                  Catatan ini akan tersimpan permanen di Audit Trail dan hanya dapat dilihat oleh Dosen Pengampu & Kaprodi.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black/10">
                <button
                  type="button"
                  onClick={() => setReviewModalPair(null)}
                  className="px-4 py-2 rounded-lg border-2 border-black bg-white text-xs font-bold hover:bg-neutral-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || reviewNote.trim().length < 5}
                  className="px-4 py-2 rounded-lg border-2 border-black bg-primary text-white text-xs font-bold shadow-retro hover:bg-primary-dark cursor-pointer disabled:opacity-50"
                >
                  {isPending ? 'Menyimpan...' : 'Simpan Keputusan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
