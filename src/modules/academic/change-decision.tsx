'use client';

import React, { useState } from 'react';
import { decideGradeChangeAction } from './actions';
import { useRun } from './assignment-forms';
import { Feedback } from './class-forms';
import { Check, X } from 'lucide-react';

export function ChangeDecision({ id }: { id: string }) {
  const [note, setNote] = useState('');
  const { pending, error, success, tick, run } = useRun(() => setNote(''));
  const decide = (approve: boolean) =>
    run(
      () => decideGradeChangeAction({ request_id: id, approve, note }),
      approve ? 'Perubahan disetujui dan nilai diperbarui.' : 'Pengajuan ditolak.'
    );

  return (
    <div className="space-y-2.5 font-sans">
      <label htmlFor={`cat-${id}`} className="block text-xs font-bold text-[#111111] uppercase tracking-wider">
        Catatan Keputusan Kaprodi:
      </label>
      <textarea
        id={`cat-${id}`}
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={pending}
        placeholder="Tuliskan catatan persetujuan atau alasan penolakan..."
        className="w-full border-2 border-black bg-white p-2.5 text-xs font-sans text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#ED1C24] rounded-none shadow-retro-sm disabled:opacity-50"
      />
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => decide(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black bg-[#111111] text-white hover:bg-black font-sans font-bold text-xs shadow-retro-sm transition-all cursor-pointer disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5"
        >
          <Check className="h-4 w-4" />
          <span>Setujui Perubahan</span>
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decide(false)}
          className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black bg-[#ED1C24] text-white hover:bg-[#A91117] font-sans font-bold text-xs shadow-retro-sm transition-all cursor-pointer disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5"
        >
          <X className="h-4 w-4" />
          <span>Tolak Pengajuan</span>
        </button>
      </div>
      <Feedback error={error} success={success} tick={tick} />
    </div>
  );
}
