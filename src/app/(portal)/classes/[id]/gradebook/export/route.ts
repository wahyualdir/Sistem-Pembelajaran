import { NextResponse } from 'next/server';
import { getGradebookAction, logGradeExportAction } from '@/modules/academic/actions';

// Sel yang diawali = + - @ dapat dieksekusi sebagai rumus oleh spreadsheet (CSV injection): beri awalan petik.
const cell = (v: string | number | null) => {
  let s = v === null ? '' : String(v);
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const g = await getGradebookAction(params.id);
  if (!g) return new NextResponse('Tidak ditemukan', { status: 404 });
  if (!(await logGradeExportAction(params.id))) return new NextResponse('Tidak diizinkan', { status: 403 });

  const lines: (string | number | null)[][] = [
    ['Nama', ...g.assignments.map((a) => a.title), 'Rata-rata final'],
    ...g.rows.map((r) => [
      r.name,
      ...g.assignments.map((a) => {
        const c = r.cells[a.id];
        return c.score === null ? '' : c.status === 'FINAL' ? c.score : `${c.score} (draf)`;
      }),
      r.average,
    ]),
  ];
  const slug = g.class_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'kelas';
  return new NextResponse('\uFEFF' + lines.map((l) => l.map(cell).join(',')).join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="nilai-${slug}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
