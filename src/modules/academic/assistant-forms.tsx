'use client';

import React, { useState } from 'react';
import { setAssistantAction } from './actions';
import { DELEGABLE_CODES, DELEGABLE_LABELS } from './permissions';
import { useRun } from './assignment-forms';
import { Feedback } from './class-forms';
import { cn } from '@/lib/utils';

export interface AssistantFormProps {
  classId: string;
  allowedTypes?: ('ASISTEN_DOSEN' | 'ASISTEN_LAB')[];
  defaultType?: 'ASISTEN_DOSEN' | 'ASISTEN_LAB';
  onSuccess?: () => void;
}

export function AssistantForm({
  classId,
  allowedTypes = ['ASISTEN_DOSEN', 'ASISTEN_LAB'],
  defaultType,
  onSuccess,
}: AssistantFormProps) {
  const initialType = defaultType || (allowedTypes.includes('ASISTEN_DOSEN') ? 'ASISTEN_DOSEN' : allowedTypes[0]);
  const [assistantType, setAssistantType] = useState<'ASISTEN_DOSEN' | 'ASISTEN_LAB'>(initialType);
  const [identifier, setIdentifier] = useState('');
  const [perms, setPerms] = useState<string[]>(['submission.review']);

  const { pending, error, success, tick, run } = useRun(() => {
    setIdentifier('');
    onSuccess?.();
  });

  const toggle = (c: string) => setPerms((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () =>
            setAssistantAction({
              class_id: classId,
              identifier,
              permissions: perms,
              assistant_type: assistantType,
            }),
          `${assistantType === 'ASISTEN_LAB' ? 'Asisten Lab' : 'Asisten Dosen'} berhasil disimpan.`
        );
      }}
      className="space-y-4"
    >
      {/* Pemilih Tipe Asisten */}
      {allowedTypes.length > 1 ? (
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-black">Kategori Penugasan Asisten</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setAssistantType('ASISTEN_DOSEN')}
              className={cn(
                'p-3 text-left rounded-xl border-2 transition-all flex flex-col gap-1 cursor-pointer',
                assistantType === 'ASISTEN_DOSEN'
                  ? 'border-black bg-retro-mint shadow-retro-sm font-bold'
                  : 'border-black/30 bg-white hover:border-black text-black/70'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-black flex items-center gap-1.5">
                  🎓 Asisten Dosen
                </span>
                {assistantType === 'ASISTEN_DOSEN' && (
                  <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-sans uppercase">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-black/70 font-normal leading-relaxed">
                Ditugaskan langsung oleh Dosen Pengampu untuk perkuliahan teori, tugas, dan asistensi kelas.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAssistantType('ASISTEN_LAB')}
              className={cn(
                'p-3 text-left rounded-xl border-2 transition-all flex flex-col gap-1 cursor-pointer',
                assistantType === 'ASISTEN_LAB'
                  ? 'border-sky-600 bg-sky-100 text-sky-800 shadow-retro-sm font-bold'
                  : 'border-black/30 bg-white hover:border-black text-black/70'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-black flex items-center gap-1.5">
                  🔬 Asisten Lab
                </span>
                {assistantType === 'ASISTEN_LAB' && (
                  <span className="text-[10px] bg-sky-600 text-white px-1.5 py-0.5 rounded font-sans uppercase">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-black/70 font-normal leading-relaxed">
                Ditugaskan untuk praktikum laboratorium. Dapat ditugaskan oleh Staf Akademik & Dosen.
              </p>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg border border-black/20 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs font-sans text-black/60 block">Kategori Penugasan:</span>
            <span className="text-xs font-bold text-black flex items-center gap-1">
              {allowedTypes[0] === 'ASISTEN_LAB' ? '🔬 Asisten Lab (Praktikum)' : '🎓 Asisten Dosen'}
            </span>
          </div>
          <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-gray-soft border border-black/20 text-black/70">
            {allowedTypes[0] === 'ASISTEN_LAB' ? 'Staf Akademik & Dosen' : 'Dosen Pengampu'}
          </span>
        </div>
      )}

      {/* Input NIM / NIDN */}
      <div className="space-y-1.5">
        <label htmlFor="as-id" className="block text-sm font-medium">
          NIM atau NIDN asisten
        </label>
        <input
          id="as-id"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Contoh: 2024002 atau citra@ac.id"
          disabled={pending}
          required
          className="field"
        />
      </div>

      {/* Checklist Izin yang Diberikan */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Izin yang didelegasikan</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {DELEGABLE_CODES.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={perms.includes(c)}
                onChange={() => toggle(c)}
                disabled={pending}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              <span>{DELEGABLE_LABELS[c]}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Finalisasi nilai dan pengajuan perubahan nilai tetap khusus wewenang dosen pengampu.
        </p>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        data-pending={pending}
        className="btn-solid !w-auto px-5"
      >
        {pending ? 'Menyimpan...' : `Simpan ${assistantType === 'ASISTEN_LAB' ? 'Asisten Lab' : 'Asisten Dosen'}`}
      </button>

      <Feedback error={error} success={success} tick={tick} />
    </form>
  );
}

export function RevokeAssistant({
  classId,
  identifier,
  name,
  assistantType,
  onSuccess,
}: {
  classId: string;
  identifier: string;
  name: string;
  assistantType?: 'ASISTEN_DOSEN' | 'ASISTEN_LAB';
  onSuccess?: () => void;
}) {
  const { pending, error, run } = useRun(() => {
    onSuccess?.();
  });

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        aria-label={`Cabut penugasan ${name}`}
        onClick={() =>
          run(
            () =>
              setAssistantAction({
                class_id: classId,
                identifier,
                permissions: [],
                assistant_type: assistantType,
              }),
            'Penugasan dicabut.'
          )
        }
        className="text-sm font-medium text-primary-dark underline-offset-4 hover:underline disabled:opacity-50"
      >
        Cabut
      </button>
      {error && <p role="alert" className="text-xs text-primary-dark">{error}</p>}
    </div>
  );
}
