'use client';

import React, { useState } from 'react';
import { decideGradeChangeAction } from './actions';
import { useRun } from './assignment-forms';
import { Feedback } from './class-forms';

export function ChangeDecision({ id }: { id: string }) {
  const [note, setNote] = useState('');
  const { pending, error, success, tick, run } = useRun(() => setNote(''));
  const decide = (approve: boolean) =>
    run(() => decideGradeChangeAction({ request_id: id, approve, note }), approve ? 'Perubahan disetujui dan nilai diperbarui.' : 'Pengajuan ditolak.');

  return (
    <div className="space-y-2">
      <label htmlFor={`cat-${id}`} className="block text-sm font-medium">Catatan keputusan</label>
      <textarea id={`cat-${id}`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} disabled={pending} className="field !h-auto py-2" />
        <button type="button" disabled={pending} data-pending={pending} onClick={() => decide(true)} className="btn-solid !w-auto px-5 font-bold text-xs">
          Setujui Perubahan
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decide(false)}
          className="h-10 rounded-lg border-[1.5px] border-retro-border bg-retro-surface px-4 text-xs font-bold text-primary-dark transition-colors hover:bg-primary/10 shadow-xs disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5"
        >
          Tolak Pengajuan
        </button>
      <Feedback error={error} success={success} tick={tick} />
    </div>
  );
}
