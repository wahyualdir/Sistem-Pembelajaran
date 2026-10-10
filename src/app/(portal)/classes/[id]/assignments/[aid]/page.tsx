import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listSubmissionsAction } from '@/modules/academic/actions';
import { ReviewForm } from '@/modules/academic/review-form';

const fmt = (iso: string) =>
  `${new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })} WIB`;

export default async function ReviewPage({ params }: { params: { id: string; aid: string } }) {
  const data = await listSubmissionsAction(params.id, params.aid);
  if (!data) notFound();

  return (
    <div className="max-w-3xl space-y-8 p-6 md:p-8">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/classes" className="underline-offset-4 hover:text-foreground hover:underline">Kelas Saya</Link>
          {' / '}
          <Link href={`/classes/${params.id}`} className="underline-offset-4 hover:text-foreground hover:underline">{data.class_title}</Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{data.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.rows.length} pengumpulan, nilai maksimum {data.max_score}. Draf nilai baru terlihat mahasiswa setelah difinalisasi.
        </p>
      </div>

      {data.rows.length === 0 ? (
        <p className="border-t border-border pt-4 text-sm text-muted-foreground">Belum ada mahasiswa yang mengumpulkan.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {data.rows.map((r, i) => (
            <li key={r.id} className="animate-fade-up space-y-3 py-5" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h2 className="font-medium">{r.student_name}</h2>
                <p className={r.is_late ? 'text-sm text-warning' : 'text-sm text-muted-foreground'}>
                  {r.is_late ? 'Terlambat, ' : ''}dikumpulkan {fmt(r.submitted_at)}
                </p>
              </div>
              <p className="whitespace-pre-wrap border-l-2 border-border pl-3 text-sm">{r.text_body}</p>
              <ReviewForm row={r} max={data.max_score} mode={data.mode} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
