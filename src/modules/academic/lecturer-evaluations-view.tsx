'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Star,
  Users,
  MessageSquare,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getLecturerEvaluationSummaryAction } from './evaluation-actions';

export function LecturerEvaluationsView() {
  const [summary, setSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLecturerEvaluationSummaryAction().then((res) => {
      setIsLoading(false);
      if (res.ok) {
        setSummary(res);
      }
    });
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs font-bold text-black rounded-xl border-2 border-black bg-white shadow-retro">
        Memuat rekapitulasi evaluasi dosen...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8 text-center rounded-xl border-2 border-black bg-white shadow-retro text-xs font-bold text-black/70">
        Belum ada data evaluasi untuk semester ini.
      </div>
    );
  }

  // Jika periode belum tutup
  if (!summary.isPeriodClosed) {
    return (
      <div className="p-6 rounded-xl border-2 border-black bg-gray-soft shadow-retro space-y-3">
        <div className="flex items-center gap-2 text-black">
          <Clock className="h-5 w-5" />
          <h3 className="text-sm font-heading font-black">Periode Evaluasi Masih Berlangsung</h3>
        </div>
        <p className="text-xs text-black/80 font-medium leading-relaxed">
          {summary.notice ||
            'Hasil evaluasi dosen dan komentar mahasiswa belum dapat diakses selama periode kuesioner masih dibuka.'}
        </p>
      </div>
    );
  }

  // Jika responden kurang dari batas minimal (5)
  if (!summary.hasMinimumRespondents) {
    return (
      <div className="p-6 rounded-xl border-2 border-black bg-white shadow-retro space-y-3">
        <div className="flex items-center gap-2 text-black">
          <AlertCircle className="h-5 w-5" />
          <h3 className="text-sm font-heading font-black text-black">Batas Minimal Responden Belum Terpenuhi</h3>
        </div>
        <p className="text-xs text-black/80 font-medium leading-relaxed">
          {summary.notice ||
            `Jumlah responden (${summary.respondentsCount} mahasiswa) belum memenuhi batas minimal privasi untuk mencegah de-anonimisasi mahasiswa.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 4 Kartu Skor Rata-rata Retro */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-1">
          <div className="flex items-center justify-between text-black/70">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Skor Keseluruhan</span>
            <Star className="h-4 w-4 text-black fill-black" />
          </div>
          <p className="text-3xl font-black font-heading text-black tabular-nums">
            {summary.averageScore}{' '}
            <span className="text-xs font-bold text-black/60">/ 5.00</span>
          </p>
          <p className="text-[11px] font-bold text-black/60">
            Dari {summary.respondentsCount} responden mahasiswa
          </p>
        </div>

        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">
            Kompetensi Pedagogik
          </span>
          <p className="text-2xl font-black font-heading text-black tabular-nums">
            {summary.categoryScores?.pedagogik || summary.categoryScores?.PEDAGOGIK || 0}
          </p>
          <p className="text-[11px] font-medium text-black/70">Penguasaan materi & kejelasan ajar</p>
        </div>

        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">
            Kompetensi Profesional
          </span>
          <p className="text-2xl font-black font-heading text-black tabular-nums">
            {summary.categoryScores?.profesional || summary.categoryScores?.PROFESIONAL || 0}
          </p>
          <p className="text-[11px] font-medium text-black/70">Ketepatan jadwal & objektivitas nilai</p>
        </div>

        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">
            Kompetensi Sosial
          </span>
          <p className="text-2xl font-black font-heading text-black tabular-nums">
            {summary.categoryScores?.sosial || summary.categoryScores?.SOSIAL || 0}
          </p>
          <p className="text-[11px] font-medium text-black/70">Keterbukaan komunikasi & diskusi</p>
        </div>
      </div>

      {/* Komentar Mahasiswa (Retro Window Box) */}
      <div className="rounded-xl border-2 border-black bg-white shadow-retro-md overflow-hidden">
        <div className="p-4 sm:p-5 border-b-2 border-black bg-gray-soft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-black bg-black inline-block" />
            <span className="h-3 w-3 rounded-full border border-black bg-white inline-block" />
            <h2 className="font-heading font-black text-sm sm:text-base text-black flex items-center gap-2 ml-1">
              <MessageSquare className="h-4 w-4 text-black" />
              <span>Komentar & Saran Konstruktif Mahasiswa</span>
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-black">
            Anonim Terverifikasi
          </span>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-black/75 font-medium leading-relaxed">
            Komentar ditampilkan secara acak tanpa penanda waktu pengiriman demi menjaga kerahasiaan identitas responden.
          </p>

          <div className="space-y-3 pt-1">
            {!summary.comments || summary.comments.length === 0 ? (
              <p className="text-xs text-black/60 italic font-medium">Tidak ada komentar tertulis.</p>
            ) : (
              summary.comments.map((comment: string, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-gray-soft/50 border-2 border-black shadow-retro-sm text-xs font-medium text-black leading-relaxed">
                  &ldquo;{comment}&rdquo;
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
