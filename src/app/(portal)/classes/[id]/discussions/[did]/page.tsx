import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDiscussionAction } from '@/modules/academic/actions';
import { ModerateButton, ReplyForm } from '@/modules/academic/discussion-forms';

const fmt = (iso: string) =>
  `${new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })} WIB`;

export default async function DiscussionPage({ params }: { params: { id: string; did: string } }) {
  const t = await getDiscussionAction(params.id, params.did);
  if (!t) notFound();
  const { discussion: d, replies, viewer } = t;
  const lecturer = viewer === 'LECTURER';

  return (
    <div className="max-w-3xl space-y-8 p-6 md:p-8">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/classes" className="underline-offset-4 hover:text-foreground hover:underline">Kelas Saya</Link>
          {' / '}
          <Link href={`/classes/${t.class_id}`} className="underline-offset-4 hover:text-foreground hover:underline">{t.class_title}</Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{d.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {d.author_name}, {fmt(d.created_at)}
          {d.is_pinned && ', disematkan'}
          {d.is_locked && ', dikunci'}
        </p>
      </div>

      <p className="whitespace-pre-wrap">{d.body}</p>

      {lecturer && (
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          <ModerateButton kind="pin" id={d.id} value={!d.is_pinned} label={d.is_pinned ? 'Lepas sematan' : 'Sematkan'} />
          <ModerateButton kind="lock" id={d.id} value={!d.is_locked} label={d.is_locked ? 'Buka kunci' : 'Kunci diskusi'} />
        </p>
      )}

      <section aria-label="Balasan" className="space-y-4">
        <h2 className="text-lg font-semibold">Balasan ({replies.length})</h2>
        {replies.length === 0 ? (
          <p className="border-t border-border pt-4 text-sm text-muted-foreground">Belum ada balasan.</p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {replies.map((r, i) => (
              <li key={r.id} className="animate-fade-up space-y-1 py-3.5" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <p className="text-sm font-medium">{r.author_name}</p>
                  <p className="text-sm text-muted-foreground">{fmt(r.created_at)}</p>
                </div>
                <p className={`whitespace-pre-wrap text-sm ${r.is_hidden ? 'text-muted-foreground line-through' : ''}`}>{r.body}</p>
                {lecturer && (
                  <p className="text-sm">
                    {r.is_hidden && <span className="mr-3 text-warning">Disembunyikan dari mahasiswa</span>}
                    <ModerateButton kind="hide" id={r.id} value={!r.is_hidden} label={r.is_hidden ? 'Tampilkan balasan' : 'Sembunyikan balasan'} />
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <ReplyForm discussionId={d.id} blocked={d.is_locked && !lecturer} />
      </section>
    </div>
  );
}
