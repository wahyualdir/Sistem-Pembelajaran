'use client';

import React, { useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { getExamAnalyticsAction } from '../quiz-actions';

// ==========================================
// EXAM ANALYTICS & REKAP MODAL (DOSEN)
// ==========================================
export function ExamAnalyticsModal({ examId }: { examId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  const loadAnalytics = async () => {
    const res = await getExamAnalyticsAction(examId);
    setAnalytics(res);
    setIsOpen(true);
  };

  const exportCSV = () => {
    if (!analytics) return;
    const rows = [
      ['ID Soal', 'Teks Soal', 'Indeks Kesukaran', 'Kategori'],
      ...analytics.difficulty_analysis.map((d: any) => [
        d.question_id,
        `"${d.question_text.replace(/"/g, '""')}"`,
        d.difficulty_index,
        d.category,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Analisis_Butir_Soal_${examId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <button
        type="button"
        onClick={loadAnalytics}
        className="rounded-control border border-border px-3 py-1.5 text-xs hover:bg-muted font-medium flex items-center gap-1.5"
      >
        <BarChart3 className="h-3.5 w-3.5 text-primary" /> Analisis Butir Soal & Nilai
      </button>

      {isOpen && analytics && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
          <div className="rounded-t-2xl sm:rounded-control rounded-b-none sm:rounded-b-control border-2 border-black bg-surface p-5 sm:p-6 space-y-4 max-w-2xl w-full shadow-retro max-h-[90dvh] overflow-y-auto">
            <div className="sm:hidden flex justify-center -mt-2 pb-1" data-sheet-handle aria-hidden="true"><div className="h-1.5 w-12 rounded-full bg-border" /></div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">Analisis Hasil: {analytics.exam_title}</h3>
                <p className="text-xs text-muted-foreground">Distribusi skor, tingkat kelulusan KKM, dan daya beda soal.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-sans font-bold hover:opacity-70 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center px-2 py-1"
              >
                [X]
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-control border border-border bg-background">
                <span className="text-xs text-muted-foreground block">Rata-Rata</span>
                <span className="text-xl font-bold font-sans">{analytics.average_score}</span>
              </div>
              <div className="p-3 rounded-control border border-border bg-background">
                <span className="text-xs text-muted-foreground block">Tertinggi</span>
                <span className="text-xl font-bold font-sans text-ink">{analytics.highest_score}</span>
              </div>
              <div className="p-3 rounded-control border border-border bg-background">
                <span className="text-xs text-muted-foreground block">Terendah</span>
                <span className="text-xl font-bold font-sans text-primary-dark">{analytics.lowest_score}</span>
              </div>
              <div className="p-3 rounded-control border border-border bg-background">
                <span className="text-xs text-muted-foreground block">Lulus KKM</span>
                <span className="text-xl font-bold font-sans text-primary">{analytics.passing_rate_percentage}%</span>
              </div>
            </div>

            {/* Item Analysis Table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs">Analisis Daya Pembeda & Kesukaran Soal</h4>
                <button
                  type="button"
                  onClick={exportCSV}
                  className="rounded-control border border-border px-2.5 py-1 text-xs hover:bg-muted font-medium flex items-center gap-1"
                >
                  <Download className="h-3 w-3" /> Ekspor CSV
                </button>
              </div>

              <div className="border border-border rounded-control overflow-hidden overflow-x-auto overscroll-x-contain table-scroll">
                <table className="w-full text-xs text-left min-w-[480px]">
                  <thead className="bg-muted text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="p-2.5">Teks Soal</th>
                      <th className="p-2.5 text-center">Indeks Kesukaran</th>
                      <th className="p-2.5 text-center">Kategori</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analytics.difficulty_analysis.map((row: any) => (
                      <tr key={row.question_id} className="hover:bg-muted/40">
                        <td className="p-2.5">{row.question_text}</td>
                        <td className="p-2.5 text-center font-sans font-bold">{row.difficulty_index}</td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              row.category === 'Mudah'
                                ? 'bg-surface text-ink'
                                : row.category === 'Sukar'
                                ? 'bg-surface text-primary-dark'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {row.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
