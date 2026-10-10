'use client';

import React, { useState } from 'react';
import { createDiscussionAction, moderateDiscussionAction, replyDiscussionAction } from './actions';
import { useRun } from './assignment-forms';
import { Feedback } from './class-forms';

export function NewDiscussionForm({ classId }: { classId: string }) {
  const [f, setF] = useState({ title: '', body: '' });
  const { pending, error, success, tick, run } = useRun(() => setF({ title: '', body: '' }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => createDiscussionAction({ class_id: classId, title: f.title, body: f.body }), 'Diskusi dimulai.');
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <label htmlFor="d-title" className="block text-sm font-medium">Judul diskusi</label>
        <input id="d-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} disabled={pending} required className="field" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="d-body" className="block text-sm font-medium">Isi diskusi</label>
        <textarea id="d-body" rows={3} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} disabled={pending} required className="field !h-auto py-2" />
      </div>
      <button type="submit" disabled={pending} data-pending={pending} className="btn-solid !w-auto px-5">
        {pending ? 'Mengirim...' : 'Mulai diskusi'}
      </button>
      <Feedback error={error} success={success} tick={tick} />
    </form>
  );
}

export function ReplyForm({ discussionId, blocked }: { discussionId: string; blocked: boolean }) {
  const [body, setBody] = useState('');
  const { pending, error, success, tick, run } = useRun(() => setBody(''));
  if (blocked) return <p className="text-sm text-muted-foreground">Diskusi ini dikunci oleh dosen, balasan baru tidak dapat ditambahkan.</p>;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => replyDiscussionAction({ discussion_id: discussionId, body }), 'Balasan terkirim.');
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <label htmlFor="r-body" className="block text-sm font-medium">Balasan</label>
        <textarea id="r-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} disabled={pending} required className="field !h-auto py-2" />
      </div>
      <button type="submit" disabled={pending} data-pending={pending} className="btn-solid !w-auto px-5">
        {pending ? 'Mengirim...' : 'Kirim balasan'}
      </button>
      <Feedback error={error} success={success} tick={tick} />
    </form>
  );
}

// Tombol moderasi kecil: sematkan, kunci, atau sembunyikan balasan (hanya dosen kelas).
export function ModerateButton({ kind, id, value, label }: { kind: 'pin' | 'lock' | 'hide'; id: string; value: boolean; label: string }) {
  const { pending, error, run } = useRun(() => {});
  return (
    <span>
      <button type="button" disabled={pending} onClick={() => run(() => moderateDiscussionAction({ kind, id, value }), label)} className="text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50">
        {label}
      </button>
      {error && <span role="alert" className="ml-2 text-xs text-danger">{error}</span>}
    </span>
  );
}
