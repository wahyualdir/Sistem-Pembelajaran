'use client';

import React, { useId, useState } from 'react';
import { useRun } from './assignment-forms';
import { Feedback } from './class-forms';

type Field = { name: string; label: string; type?: string; placeholder?: string; options?: { value: string; label: string }[]; grow?: boolean; narrow?: boolean };

// Formulir tambah satu baris untuk master data: daftar kolom dari server, aksi berupa Server Action.
export function QuickAdd({ fields, action, submitLabel, okMessage }: {
  fields: Field[];
  action: (values: Record<string, string>) => Promise<{ ok: boolean; error?: string }>;
  submitLabel: string;
  okMessage: string;
}) {
  const uid = useId();
  const empty = () => Object.fromEntries(fields.map((f) => [f.name, f.options?.[0]?.value ?? '']));
  const [v, setV] = useState<Record<string, string>>(empty);
  const { pending, error, success, tick, run } = useRun(() => setV(empty()));

  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => action(v), okMessage); }} className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {fields.map((f) => (
          <div key={f.name} className={`space-y-1.5 ${f.narrow ? 'w-24' : f.grow ? 'min-w-[12rem] flex-[2]' : 'min-w-[8rem] flex-1'}`}>
            <label htmlFor={`${uid}${f.name}`} className="block text-sm font-medium">{f.label}</label>
            {f.options ? (
              <select id={`${uid}${f.name}`} value={v[f.name]} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} disabled={pending} className="field">
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input id={`${uid}${f.name}`} type={f.type ?? 'text'} value={v[f.name]} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} placeholder={f.placeholder} disabled={pending} required className="field" />
            )}
          </div>
        ))}
      </div>
      <button type="submit" disabled={pending} data-pending={pending} className="btn-solid !w-auto px-5">
        {pending ? 'Menyimpan...' : submitLabel}
      </button>
      <Feedback error={error} success={success} tick={tick} />
    </form>
  );
}
