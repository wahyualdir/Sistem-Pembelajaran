import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listSubmissionsAction } from '@/modules/academic/actions';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { ReviewForm } from '@/modules/academic/review-form';
import { runAssignmentSimilarityCheckAction } from '@/modules/academic/similarity-actions';
import { SimilarityReviewView } from '@/modules/academic/similarity-review-view';
import { AssignmentExtensionsCard } from '@/modules/academic/assignment-extensions-card';
import { getClassDetailAction } from '@/modules/academic/actions';

const fmt = (iso: string) =>
  `${new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })} WIB`;

export default async function ReviewPage({ params }: { params: { id: string; aid: string } }) {
  const user = await getCurrentUserWithRoles();
  const data = await listSubmissionsAction(params.id, params.aid);
  if (!data) notFound();

  const classDetail = await getClassDetailAction(params.id);
  const members = classDetail?.members || [];

  const isStaff =
    user?.activeRole === 'LECTURER' ||
    user?.activeRole === 'TEACHING_ASSISTANT' ||
    user?.activeRole === 'SUPER_ADMIN';

  // Jalankan deteksi kemiripan hanya untuk Dosen Pengampu & Asdos
  const simRes = isStaff
    ? await runAssignmentSimilarityCheckAction(params.aid).catch(() => null)
    : null;

  return (
    <div className="max-w-5xl space-y-8 p-6 md:p-8 animate-fade-up">
      <div>
        <p className="text-sm text-muted-foreground font-sans">
          <Link href="/classes" className="underline-offset-4 hover:text-foreground hover:underline">Kelas Saya</Link>
          {' / '}
          <Link href={`/classes/${params.id}`} className="underline-offset-4 hover:text-foreground hover:underline">{data.class_title}</Link>
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-heading font-bold text-black">{data.title}</h1>
        <p className="mt-1 text-sm text-black/70 font-sans">
          {data.rows.length} pengumpulan, nilai maksimum {data.max_score}. Draf nilai baru terlihat mahasiswa setelah difinalisasi.
        </p>
      </div>

      {/* PERPANJANGAN TENGGAT */}
      <AssignmentExtensionsCard
        assignmentId={params.aid}
        isLecturer={user?.activeRole === 'LECTURER' || user?.activeRole === 'SUPER_ADMIN'}
        members={members}
      />

      {/* DETEKSI KEMIRIPAN (KHUSUS DOSEN & ASDOS, TIDAK TERLIHAT OLEH MAHASISWA) */}
      {isStaff && simRes?.ok && (
        <div className="pt-2">
          <SimilarityReviewView
            assignmentId={params.aid}
            initialPairs={simRes.pairs || []}
            initialThreshold={simRes.threshold || 40}
            totalSubmissions={simRes.totalSubmissions || data.rows.length}
          />
        </div>
      )}

      {/* DAFTAR PENGUMPULAN & PENILAIAN */}
      <div className="space-y-4 pt-4 border-t-2 border-black/10">
        <h2 className="font-heading font-bold text-lg text-black">
          Daftar Pengumpulan Tugas Mahasiswa
        </h2>

        {data.rows.length === 0 ? (
          <p className="border-t border-border pt-4 text-sm text-muted-foreground">Belum ada mahasiswa yang mengumpulkan.</p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {data.rows.map((r, i) => (
              <li key={r.id} className="animate-fade-up space-y-3 py-5" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h3 className="font-bold text-black">{r.student_name}</h3>
                  <p className={r.is_late ? 'text-sm text-primary font-bold' : 'text-sm text-muted-foreground'}>
                    {r.is_late ? 'Terlambat, ' : ''}dikumpulkan {fmt(r.submitted_at)}
                  </p>
                </div>
                <p className="whitespace-pre-wrap border-l-2 border-black pl-3 text-sm font-mono bg-gray-soft/30 p-2 rounded">{r.text_body}</p>
                <ReviewForm row={r} max={data.max_score} mode={data.mode} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
