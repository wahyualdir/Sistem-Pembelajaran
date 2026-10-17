'use client';

import React, { useState } from 'react';
import { saveGradeAction, finalizeGradeAction, requestGradeChangeAction, type SubmissionItem } from './actions';
import { useRun } from './assignment-forms';
import { Feedback } from './class-forms';

export function ReviewForm({ row, max, mode = 'full' }: { row: SubmissionItem; max: number; mode?: 'full' | 'draft' | 'read' }) {
  const g = row.grade;
  const [score, setScore] = useState(g ? String(g.score) : '');
  const [comment, setComment] = useState(g?.comment ?? '');
  const [confirm, setConfirm] = useState(false);
  const { pending, error, success, tick, run } = useRun(() => setConfirm(false));
  const payload = () => ({ submission_id: row.id, score: score === '' ? undefined : Number(score), comment });

  if (mode === 'read') {
    return <p className="text-sm text-muted-foreground">{g ? `Nilai ${g.status === 'FINAL' ? 'final' : 'draf'} ${g.score} dari ${g.max_score}.` : 'Belum dinilai. Anda hanya memiliki izin meninjau.'}</p>;
  }

  if (g?.status === 'FINAL') {
    return (
      <div className="space-y-3">
        <div className="animate-fade-up rounded-control border border-border bg-surface p-3 text-sm">
          <p className="font-medium text-ink">Nilai final {g.score} dari {g.max_score}</p>
          {g.comment && <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{g.comment}</p>}
        </div>
        {mode === 'full' && <ChangeRequest row={row} />}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveGradeAction(payload()), 'Draf nilai tersimpan. Mahasiswa belum dapat melihatnya.');
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <div className="space-y-1.5">
          <label htmlFor={`n-${row.id}`} className="block text-sm font-medium">Nilai (maks. {max})</label>
          <input id={`n-${row.id}`} type="number" min={0} max={max} step="0.01" value={score} onChange={(e) => setScore(e.target.value)} disabled={pending} required className="field" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`k-${row.id}`} className="block text-sm font-medium">Feedback untuk mahasiswa</label>
          <textarea id={`k-${row.id}`} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} disabled={pending} className="field !h-auto py-2" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} data-pending={pending} className="btn-solid !w-auto px-5">
          {pending ? 'Menyimpan...' : 'Simpan draf'}
        </button>
        <button type="button" hidden={mode !== 'full'} disabled={pending || score === ''} onClick={() => setConfirm(true)} className="h-10 rounded-control border border-border-strong px-4 text-sm font-medium transition-colors hover:bg-primary-soft disabled:opacity-50">
          Finalisasi
        </button>
      </div>
      {confirm && (
        <div className="animate-fade-up flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-strong bg-background p-3">
          <p className="text-sm text-muted-foreground">Nilai final terlihat oleh mahasiswa dan tidak dapat diubah langsung. Lanjutkan?</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const saved = await saveGradeAction(payload());
                  return saved.ok ? finalizeGradeAction(row.id) : saved;
                }, 'Nilai difinalisasi dan terlihat oleh mahasiswa.')
              }
              className="h-8 rounded-control bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Ya, finalisasi
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="h-8 rounded-control border border-border bg-surface px-3 text-xs">Batal</button>
          </div>
        </div>
      )}
      <Feedback error={error} success={success} tick={tick} />
    </form>
  );
}

// Nilai FINAL tidak diubah langsung: dosen mengajukan, koordinator prodi memutuskan (Bagian 8.2).
function ChangeRequest({ row }: { row: SubmissionItem }) {
  const [score, setScore] = useState('');
  const [reason, setReason] = useState('');
  const { pending, error, success, tick, run } = useRun(() => {
    setScore('');
    setReason('');
  });
  const c = row.change;

  if (c?.status === 'PENDING') {
    return <p className="animate-fade-up text-sm text-ink">Pengajuan perubahan ke {c.proposed_score} menunggu persetujuan koordinator prodi.</p>;
  }
  return (
    <div className="space-y-2 text-sm">
      {c?.status === 'REJECTED' && <p className="text-muted-foreground">Pengajuan terakhir ditolak: {c.review_note}</p>}
      <details>
        <summary className="cursor-pointer font-medium underline-offset-4 hover:underline">Ajukan perubahan nilai</summary>
        <form
          className="reveal mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => requestGradeChangeAction({ submission_id: row.id, score: score === '' ? undefined : Number(score), reason }), 'Pengajuan dikirim ke koordinator prodi.');
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
            <div className="space-y-1.5">
              <label htmlFor={`cn-${row.id}`} className="block font-medium">Nilai baru</label>
              <input id={`cn-${row.id}`} type="number" min={0} max={100} step="0.01" value={score} onChange={(e) => setScore(e.target.value)} disabled={pending} required className="field" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`cr-${row.id}`} className="block font-medium">Alasan perubahan</label>
              <textarea id={`cr-${row.id}`} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} disabled={pending} required className="field !h-auto py-2" />
            </div>
          </div>
          <button type="submit" disabled={pending} data-pending={pending} className="btn-solid !w-auto px-5">
            {pending ? 'Mengirim...' : 'Ajukan'}
          </button>
          <Feedback error={error} success={success} tick={tick} />
        </form>
      </details>
    </div>
  );
}
