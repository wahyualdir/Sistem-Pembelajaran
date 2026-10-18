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
      <div className="p-8 text-center text-xs text-muted-foreground rounded-[12px] border border-border bg-surface">
        Memuat rekapitulasi evaluasi dosen...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-8 text-center rounded-[12px] border border-border bg-surface text-xs text-muted-foreground">
        Belum ada data evaluasi untuk semester ini.
      </div>
    );
  }

  // Jika periode belum tutup
  if (!summary.isPeriodClosed) {
    return (
      <div className="p-6 rounded-[12px] border border-amber-500/20 bg-amber-500/5 space-y-3">
        <div className="flex items-center gap-2 text-amber-700">
          <Clock className="h-5 w-5" />
          <h3 className="text-sm font-bold">Periode Evaluasi Masih Berlangsung</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {summary.notice ||
            'Hasil evaluasi dosen dan komentar mahasiswa belum dapat diakses selama periode kuesioner masih dibuka.'}
        </p>
      </div>
    );
  }

  // Jika responden kurang dari batas minimal (5)
  if (!summary.hasMinimumRespondents) {
    return (
      <div className="p-6 rounded-[12px] border border-border bg-surface space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <h3 className="text-sm font-bold text-foreground">Batas Minimal Responden Belum Terpenuhi</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {summary.notice ||
            `Jumlah responden (${summary.respondentsCount} mahasiswa) belum memenuhi batas minimal privasi untuk mencegah de-anonimisasi mahasiswa.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kartu Skor Rata-rata */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-[12px] border border-border bg-surface space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Skor Keseluruhan</span>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-3xl font-bold font-heading text-foreground tabular-nums">
            {summary.averageScore}{' '}
            <span className="text-xs font-normal text-muted-foreground">/ 5.00</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Dari {summary.respondentsCount} responden mahasiswa
          </p>
        </div>

        <div className="p-5 rounded-[12px] border border-border bg-surface space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Kompetensi Pedagogik
          </span>
          <p className="text-2xl font-bold font-heading text-foreground tabular-nums">
            {summary.categoryScores?.pedagogik || summary.categoryScores?.PEDAGOGIK || 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Penguasaan materi & kejelasan pengajaran</p>
        </div>

        <div className="p-5 rounded-[12px] border border-border bg-surface space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Kompetensi Profesional
          </span>
          <p className="text-2xl font-bold font-heading text-foreground tabular-nums">
            {summary.categoryScores?.profesional || summary.categoryScores?.PROFESIONAL || 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Ketepatan jadwal & objektivitas penilaian</p>
        </div>

        <div className="p-5 rounded-[12px] border border-border bg-surface space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Kompetensi Sosial
          </span>
          <p className="text-2xl font-bold font-heading text-foreground tabular-nums">
            {summary.categoryScores?.sosial || summary.categoryScores?.SOSIAL || 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Keterbukaan komunikasi & apresiasi diskusi</p>
        </div>
      </div>

      {/* Komentar Mahasiswa (Urutan Acak Tanpa Tanggal/Nama) */}
      <div className="rounded-[12px] border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Komentar & Saran Konstruktif Mahasiswa</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Komentar ditampilkan secara acak tanpa penanda waktu pengiriman demi menjaga kerahasiaan identitas responden.
        </p>

        <div className="space-y-3 pt-2">
          {!summary.comments || summary.comments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Tidak ada komentar tertulis.</p>
          ) : (
            summary.comments.map((comment: string, idx: number) => (
              <div key={idx} className="p-3.5 rounded-[8px] bg-muted/40 border border-border/70 text-xs text-foreground leading-relaxed">
                &ldquo;{comment}&rdquo;
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
