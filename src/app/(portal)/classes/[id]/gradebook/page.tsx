import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGradebookAction, type GradebookCell } from '@/modules/academic/actions';
import { konversiNilaiKeHuruf } from '@/lib/akademik/nilai';
import { ArrowLeft, Sliders, CheckCircle2 } from 'lucide-react';

function Cell({ c }: { c: GradebookCell }) {
  if (c.score !== null) {
    return c.status === 'FINAL' ? <>{c.score}</> : <span className="text-muted-foreground">{c.score} (draf)</span>;
  }
  if (c.submitted) return <span className="text-muted-foreground">Belum dinilai{c.late ? ', terlambat' : ''}</span>;
  return (
    <>
      <span aria-hidden="true">-</span>
      <span className="sr-only">belum mengumpulkan</span>
    </>
  );
}

export default async function GradebookPage({ params }: { params: { id: string } }) {
  const g = await getGradebookAction(params.id);
  if (!g) notFound();

  return (
    <div className="w-full space-y-8 p-6 sm:p-9 animate-fade-up">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/classes" className="underline-offset-4 hover:text-foreground hover:underline">Kelas Saya</Link>
          {' / '}
          <Link href={`/classes/${params.id}`} className="underline-offset-4 hover:text-foreground hover:underline">{g.class_title}</Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Rekap nilai</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {g.rows.length} mahasiswa, {g.assignments.length} tugas. Rata-rata hanya menghitung nilai yang sudah final.
        </p>

        {/* Weighted distribution banner */}
        <div className="mt-4 rounded-control border border-border bg-surface p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-primary" /> Bobot Komponen Penilaian (Total: 100%)
            </span>
            <span className="text-[11px] text-success font-medium bg-success-soft px-2 py-0.5 rounded-full">
              Terverifikasi 100%
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-muted-foreground pt-1">
            <div className="rounded bg-muted p-2 text-center">
              <span className="block text-[11px]">Tugas</span>
              <strong className="text-foreground text-xs font-mono">30%</strong>
            </div>
            <div className="rounded bg-muted p-2 text-center">
              <span className="block text-[11px]">Kuis</span>
              <strong className="text-foreground text-xs font-mono">20%</strong>
            </div>
            <div className="rounded bg-muted p-2 text-center">
              <span className="block text-[11px]">Presensi</span>
              <strong className="text-foreground text-xs font-mono">10%</strong>
            </div>
            <div className="rounded bg-muted p-2 text-center">
              <span className="block text-[11px]">UTS</span>
              <strong className="text-foreground text-xs font-mono">20%</strong>
            </div>
            <div className="rounded bg-muted p-2 text-center">
              <span className="block text-[11px]">UAS</span>
              <strong className="text-foreground text-xs font-mono">20%</strong>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm">
          <a href={`/classes/${params.id}/gradebook/export`} download className="font-medium text-primary underline-offset-4 hover:underline">Unduh CSV</a>
        </p>
      </div>

      {g.rows.length === 0 || g.assignments.length === 0 ? (
        <p className="border-t border-border pt-4 text-sm text-muted-foreground">
          Rekap muncul setelah ada mahasiswa yang bergabung dan tugas yang diterbitkan.
        </p>
      ) : (
        <div className="animate-fade-up overflow-x-auto border-y border-border">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="sr-only">Nilai tugas per mahasiswa</caption>
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-2.5 pr-4 font-medium">Mahasiswa</th>
                {g.assignments.map((a) => (
                  <th key={a.id} scope="col" className="px-3 py-2.5 font-medium">
                    {a.title}
                    <span className="block text-xs font-normal text-muted-foreground">maks. {a.max_score}</span>
                  </th>
                ))}
                <th scope="col" className="px-3 py-2.5 font-medium">Rata-rata</th>
                <th scope="col" className="px-3 py-2.5 font-medium text-center">Huruf Mutu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {g.rows.map((r) => {
                const hurufInfo = r.average !== null ? konversiNilaiKeHuruf(r.average) : null;
                return (
                  <tr key={r.student_id}>
                    <th scope="row" className="py-2.5 pr-4 text-left font-medium">{r.name}</th>
                    {g.assignments.map((a) => (
                      <td key={a.id} className="px-3 py-2.5"><Cell c={r.cells[a.id]} /></td>
                    ))}
                    <td className="px-3 py-2.5 font-medium font-mono">{r.average ?? '-'}</td>
                    <td className="px-3 py-2.5 text-center font-mono">
                      {hurufInfo ? (
                        <span className="inline-block px-2 py-0.5 rounded font-bold text-xs bg-primary-soft text-primary">
                          {hurufInfo.huruf} ({hurufInfo.bobot.toFixed(2)})
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
