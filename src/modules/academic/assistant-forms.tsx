'use client';

import React, { useState } from 'react';
import { setAssistantAction } from './actions';
import { DELEGABLE_CODES, DELEGABLE_LABELS } from './permissions';
import { useRun } from './assignment-forms';
import { Feedback } from './class-forms';

export function AssistantForm({ classId }: { classId: string }) {
  const [identifier, setIdentifier] = useState('');
  const [perms, setPerms] = useState<string[]>(['submission.review']);
  const { pending, error, success, tick, run } = useRun(() => setIdentifier(''));
  const toggle = (c: string) => setPerms((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => setAssistantAction({ class_id: classId, identifier, permissions: perms }), 'Asisten disimpan.');
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <label htmlFor="as-id" className="block text-sm font-medium">Email atau NIM asisten</label>
        <input id="as-id" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Contoh: asdos@kampus.ac.id" disabled={pending} required className="field" />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Izin yang diberikan</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {DELEGABLE_CODES.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={perms.includes(c)} onChange={() => toggle(c)} disabled={pending} className="h-4 w-4 accent-[var(--primary)]" />
              {DELEGABLE_LABELS[c]}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Finalisasi nilai dan pengajuan perubahan nilai tetap hanya untuk dosen.</p>
      </fieldset>
      <button type="submit" disabled={pending} data-pending={pending} className="btn-solid !w-auto px-5">
        {pending ? 'Menyimpan...' : 'Simpan asisten'}
      </button>
      <Feedback error={error} success={success} tick={tick} />
    </form>
  );
}

export function RevokeAssistant({ classId, email, name }: { classId: string; email: string; name: string }) {
  const { pending, error, run } = useRun(() => {});
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        aria-label={`Cabut penugasan ${name}`}
        onClick={() => run(() => setAssistantAction({ class_id: classId, identifier: email, permissions: [] }), 'Penugasan dicabut.')}
        className="text-sm font-medium text-danger underline-offset-4 hover:underline disabled:opacity-50"
      >
        Cabut
      </button>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}
