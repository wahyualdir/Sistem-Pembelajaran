'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createAnnouncementAction, createAssignmentAction, createMaterialAction, submitAssignmentAction } from './actions';
import { Feedback } from './class-forms';

export function useRun(onOk: () => void) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tick, setTick] = useState(0);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
    setError('');
    setSuccess('');
    start(async () => {
      const r = await fn();
      if (r.ok) {
        setSuccess(okMsg);
        onOk();
        router.refresh();
      } else {
        setError(r.error ?? 'Terjadi kesalahan.');
        setTick((t) => t + 1);
      }
    });
  };
  return { pending, error, success, tick, run };
}

const iso = (v: string) => (v ? new Date(v).toISOString() : '');
const EMPTY = { title: '', description: '', due: '', close: '', release: '' };

export function CreateAssignmentForm({ classId }: { classId: string }) {
  const [f, setF] = useState(EMPTY);
  const { pending, error, success, tick, run } = useRun(() => setF(EMPTY));
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => createAssignmentAction({
            class_id: classId,
            title: f.title,
            description: f.description,
            due_at: iso(f.due),
            close_at: iso(f.close),
            release_at: f.release ? iso(f.release) : undefined,
          }),
          'Tugas diterbitkan dan disimpan.'
        );
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <label htmlFor="a-title" className="block text-sm font-medium">Judul tugas</label>
        <input id="a-title" value={f.title} onChange={set('title')} placeholder="Contoh: Tugas 01 — Layout responsif" disabled={pending} required className="field" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="a-desc" className="block text-sm font-medium">Petunjuk (opsional)</label>
        <textarea id="a-desc" rows={3} value={f.description} onChange={set('description')} disabled={pending} className="field !h-auto py-2" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="a-due" className="block text-sm font-medium">Tenggat</label>
          <input id="a-due" type="datetime-local" value={f.due} onChange={set('due')} disabled={pending} required className="field" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="a-close" className="block text-sm font-medium">Ditutup pada</label>
          <input id="a-close" type="datetime-local" value={f.close} onChange={set('close')} disabled={pending} required className="field" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="a-release" className="block text-sm font-medium">Jadwal rilis ke mahasiswa (opsional)</label>
        <input id="a-release" type="datetime-local" value={f.release} onChange={set('release')} disabled={pending} className="field" />
        <span className="text-xs text-muted-foreground">Kosongkan jika ingin langsung tampil saat diterbitkan.</span>
      </div>
      <button type="submit" disabled={pending} data-pending={pending} className="btn-solid !w-auto px-5">
        {pending ? 'Menerbitkan...' : 'Terbitkan tugas'}
      </button>
      <Feedback error={error} success={success} tick={tick} />
    </form>
  );
}

export function SubmitForm({ assignmentId }: { assignmentId: string }) {
  const [text, setText] = useState('');
  const { pending, error, success, tick, run } = useRun(() => setText(''));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => submitAssignmentAction(assignmentId, text), 'Jawaban terkirim.');
      }}
      className="space-y-2"
    >
      <label htmlFor={`jawab-${assignmentId}`} className="block text-sm font-medium">Jawaban</label>
      <textarea id={`jawab-${assignmentId}`} rows={4} value={text} onChange={(e) => setText(e.target.value)} disabled={pending} required className="field !h-auto py-2" />
      <p className="text-xs text-muted-foreground">Jawaban tidak dapat diubah setelah dikirim.</p>
      <button type="submit" disabled={pending} data-pending={pending} className="btn-solid !w-auto px-5">
        {pending ? 'Mengirim...' : 'Kumpulkan'}
      </button>
      <Feedback error={error} success={success} tick={tick} />
    </form>
  );
}

export function CreateMaterialForm({ classId }: { classId: string }) {
  const [f, setF] = useState({ title: '', body: '', release: '' });
  const { pending, error, success, tick, run } = useRun(() => setF({ title: '', body: '', release: '' }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => createMaterialAction({
            class_id: classId,
            title: f.title,
            body: f.body,
            release_at: f.release ? iso(f.release) : undefined,
          }),
          'Materi diterbitkan dan disimpan.'
        );
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <label htmlFor="m-title" className="block text-sm font-medium">Judul materi</label>
        <input id="m-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Contoh: Pertemuan 1 — Pengantar HTML" disabled={pending} required className="field" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="m-body" className="block text-sm font-medium">Isi materi</label>
        <textarea id="m-body" rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} disabled={pending} className="field !h-auto py-2" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="m-release" className="block text-sm font-medium">Jadwal rilis ke mahasiswa (opsional)</label>
        <input id="m-release" type="datetime-local" value={f.release} onChange={(e) => setF({ ...f, release: e.target.value })} disabled={pending} className="field" />
        <span className="text-xs text-muted-foreground">Kosongkan jika ingin langsung tampil saat diterbitkan.</span>
      </div>
      <button type="submit" disabled={pending} data-pending={pending} className="btn-solid !w-auto px-5">
        {pending ? 'Menerbitkan...' : 'Terbitkan materi'}
      </button>
      <Feedback error={error} success={success} tick={tick} />
    </form>
  );
}

export function CreateAnnouncementForm({ classId }: { classId: string }) {
  const [f, setF] = useState({ title: '', body: '' });
  const { pending, error, success, tick, run } = useRun(() => setF({ title: '', body: '' }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => createAnnouncementAction({ class_id: classId, title: f.title, body: f.body }), 'Pengumuman terkirim ke mahasiswa kelas ini.');
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <label htmlFor="p-title" className="block text-sm font-medium">Judul pengumuman</label>
        <input id="p-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} disabled={pending} required className="field" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="p-body" className="block text-sm font-medium">Isi pengumuman</label>
        <textarea id="p-body" rows={3} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} disabled={pending} className="field !h-auto py-2" />
      </div>
      <button type="submit" disabled={pending} data-pending={pending} className="btn-solid !w-auto px-5">
        {pending ? 'Mengirim...' : 'Kirim pengumuman'}
      </button>
      <Feedback error={error} success={success} tick={tick} />
    </form>
  );
}
