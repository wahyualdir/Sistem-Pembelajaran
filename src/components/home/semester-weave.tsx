'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SemesterWeaveSheet } from './semester-weave-sheet';
import type { SemesterWeaveData, WeaveCell, WeaveRow } from '@/lib/akademik/semester-weave';
import type { StudentRiskEvaluation } from '@/modules/early-warning/types';
import { AlertTriangle, ShieldAlert, BookOpen, CalendarCheck, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface SemesterWeaveProps {
  data: SemesterWeaveData | null;
  isLoading?: boolean;
  error?: string | null;
  academicEvaluations?: StudentRiskEvaluation[];
}

export function SemesterWeave({
  data,
  isLoading = false,
  error = null,
  academicEvaluations = [],
}: SemesterWeaveProps) {
  const [selectedCell, setSelectedCell] = useState<{
    row: WeaveRow;
    cell: WeaveCell;
  } | null>(null);

  // 1. Keadaan Memuat (Skeleton)
  if (isLoading) {
    return (
      <section aria-label="Kain semester" className="w-full">
        <div className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] shadow-sm p-5 space-y-4 font-sans">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E3E4]">
            <div className="h-6 w-48 bg-[#F3F3F4] animate-pulse rounded" />
            <div className="h-4 w-32 bg-[#F3F3F4] animate-pulse rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="h-5 w-40 bg-[#F3F3F4] animate-pulse rounded" />
                <div className="grid grid-cols-16 gap-1 flex-1">
                  {Array.from({ length: 16 }).map((_, cIdx) => (
                    <div
                      key={cIdx}
                      className="h-7 bg-[#F3F3F4] animate-pulse rounded-[3px]"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 2. Keadaan Galat
  if (error || !data) {
    return (
      <section aria-label="Kain semester" className="w-full">
        <div className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] shadow-sm p-6 text-center space-y-3 font-sans">
          <p className="text-sm font-medium text-[#111111]">
            Kain semester belum bisa dimuat. Coba muat ulang halaman.
          </p>
        </div>
      </section>
    );
  }

  // 3. Keadaan Kosong (Tanpa Kelas Aktif)
  if (data.rows.length === 0) {
    return (
      <section aria-label="Kain semester" className="w-full">
        <div className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] shadow-sm p-6 sm:p-8 text-center space-y-4 font-sans">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F3F4] text-[#808285]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <p className="text-sm sm:text-base font-bold text-[#111111]">
              Kamu belum terdaftar di kelas mana pun.
            </p>
            <p className="text-xs sm:text-sm text-[#58595B]">
              Setelah mendaftar dan kelas aktif disetujui, progres mingguanmu akan muncul di sini.
            </p>
          </div>
          <Link
            href="/classes"
            className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-[#9F1521] text-white text-xs font-bold hover:bg-[#8F131E] transition-colors"
          >
            Buka Kelas Saya
          </Link>
        </div>
      </section>
    );
  }

  const currentWeek = data.currentWeek;
  const isSemesterStarted = currentWeek !== null && currentWeek > 0;

  const weekLabelText = isSemesterStarted
    ? `Pekan ${currentWeek} dari 16`
    : 'Semester belum dimulai';

  const visibleHeaderWeeks = new Set([1, 5, 9, 13, 16]);
  if (currentWeek && currentWeek >= 1 && currentWeek <= 16) {
    visibleHeaderWeeks.add(currentWeek);
  }

  let totalLengkap = 0;
  let totalSebagian = 0;
  let totalTerlewat = 0;
  for (const row of data.rows) {
    for (const cell of row.cells) {
      if (cell.state === 'LENGKAP') totalLengkap++;
      else if (cell.state === 'SEBAGIAN') totalSebagian++;
      else if (cell.state === 'TERLEWAT') totalTerlewat++;
    }
  }

  const progressPercent = isSemesterStarted
    ? Math.min(100, Math.round(((currentWeek || 1) / 16) * 100))
    : 0;

  const highestRisk = academicEvaluations.find((e) => e.riskLevel === 'RISIKO_TINGGI')
    || academicEvaluations.find((e) => e.riskLevel === 'PERHATIAN');

  return (
    <section aria-label="Kain semester" className="w-full font-sans">
      <div className="rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] shadow-sm p-4 sm:p-5 space-y-4">
        {/* Header Sekunder: Judul & Keterangan Pekan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E3E4]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-heading font-extrabold text-[#111111]">
                Kain Semester &amp; Ritme Belajar
              </h2>
              {isSemesterStarted && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#9F1521] border border-[#FDDDD7]">
                  {progressPercent}% Berjalan
                </span>
              )}
            </div>
            <p className="text-xs text-[#58595B] mt-0.5 font-normal">
              {!isSemesterStarted
                ? 'Semester belum dimulai. Matriks kisi akan terisi mulai pekan pertama kuliah.'
                : 'Pemetaan ritme kehadiran dan penyelesaian tugas per mata kuliah sepanjang semester.'}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] border border-[#FDDDD7] text-xs font-bold text-[#9F1521] tabular-nums">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9F1521] animate-pulse" />
              {weekLabelText}
            </span>
          </div>
        </div>

        {/* Matriks Kisi Tabel */}
        <div className="overflow-x-auto -mx-1 px-1">
          <table role="table" className="w-full border-collapse select-none min-w-[560px] sm:min-w-[640px]">
            <thead>
              <tr className="border-b border-[#E2E3E4]">
                <th
                  scope="col"
                  className="w-[140px] sm:w-[190px] md:w-[220px] pr-3 pb-2 text-left text-xs uppercase tracking-wider font-bold text-[#808285]"
                >
                  Mata Kuliah
                </th>
                {Array.from({ length: 16 }).map((_, idx) => {
                  const w = idx + 1;
                  const isVisible = visibleHeaderWeeks.has(w);
                  const isCurrent = w === currentWeek;
                  const isUts = w === 8;
                  const isUas = w === 16;

                  return (
                    <th
                      key={w}
                      scope="col"
                      className={`h-7 pb-2 text-center text-xs font-sans font-bold tabular-nums relative ${
                        isCurrent
                          ? 'text-[#9F1521]'
                          : 'text-[#808285]'
                      } ${w === 8 ? 'border-r border-[#E2E3E4]' : ''}`}
                    >
                      {isVisible ? (
                        isCurrent ? (
                          <span className="inline-flex items-center justify-center min-w-[20px] px-1 py-0.5 rounded bg-[#9F1521] text-white text-[11px] font-bold">
                            {w}
                          </span>
                        ) : (
                          <span className={`${isUts || isUas ? 'font-bold text-[#111111]' : ''}`}>
                            {w}
                          </span>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <span className="sr-only">Pekan {w}</span>
                          <span
                            aria-hidden="true"
                            className={`text-[10px] select-none font-mono font-medium ${
                              isUts ? 'text-[#111111] font-bold' : 'text-[#D0D6DD]'
                            }`}
                          >
                            ·
                          </span>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E3E4]">
              {data.rows.map((row) => (
                <tr key={row.classId} className="group hover:bg-[#F3F3F4]/50 transition-colors">
                  <th
                    scope="row"
                    className="w-[140px] sm:w-[190px] md:w-[220px] max-w-[240px] pr-3 py-2 text-left font-sans text-xs font-bold text-[#111111] cursor-pointer"
                    title={`${row.classTitle}${row.section ? ` (${row.section})` : ''}`}
                  >
                    <Link
                      href={`/classes/${row.classId}`}
                      tabIndex={0}
                      className="inline-flex items-center gap-1.5 hover:text-[#9F1521] transition-colors max-w-full"
                    >
                      <span className="truncate" title={row.classTitle}>
                        {row.classTitle}
                      </span>
                      {row.section ? (
                        <span className="shrink-0 text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#F3F3F4] text-[#58595B]">
                          {row.section}
                        </span>
                      ) : null}
                    </Link>
                  </th>

                  {row.cells.map((cell) => {
                    const isCurrent = cell.weekNumber === currentWeek;
                    const isDividingWeek = cell.weekNumber === 8;

                    return (
                      <td
                        key={cell.weekNumber}
                        className={`p-0.5 sm:p-1 text-center ${
                          isDividingWeek ? 'border-r border-[#E2E3E4]' : ''
                        } ${isCurrent ? 'bg-[#FEF2F2]' : ''}`}
                      >
                        <button
                          type="button"
                          aria-label={cell.ariaLabel}
                          onClick={() => setSelectedCell({ row, cell })}
                          className={`relative w-full aspect-square max-w-[26px] max-h-[26px] sm:max-w-[30px] sm:max-h-[30px] mx-auto rounded-[3px] border transition-all duration-150 active:scale-95 hover:scale-110 hover:z-10 focus:outline-none focus:ring-2 focus:ring-[#9F1521] cursor-pointer ${
                            isCurrent
                              ? 'border-2 border-[#9F1521] shadow-xs'
                              : 'border-[#E2E3E4]'
                          } ${getCellStateClasses(cell.state)}`}
                        >
                          <span className="absolute -inset-1 z-0" aria-hidden="true" />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legenda Bentuk & Warna */}
        <div className="pt-3 border-t border-[#E2E3E4]">
          <div className="flex flex-wrap items-center gap-2 text-xs font-sans font-medium text-[#58595B]">
            <span className="text-[11px] font-bold text-[#808285] uppercase tracking-wider mr-1">
              Legenda:
            </span>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#F3F3F4] text-[#111111]">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#111111] shrink-0" />
              <span className="font-semibold text-xs">Lengkap</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#F3F3F4] text-[#58595B]">
              <span className="h-2.5 w-2.5 rounded-[2px] border border-[#D0D6DD] [background:linear-gradient(135deg,#111111_50%,#F3F3F4_50%)] shrink-0" />
              <span>Hadir, tugas tertunda</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#F3F3F4] text-[#58595B]">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#808285] shrink-0" />
              <span>Izin / Sakit</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#F3F3F4] text-[#58595B]">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-white border border-[#D0D6DD] shrink-0" />
              <span>Terlewat</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FEF2F2] border border-[#FDDDD7] text-[#9F1521]">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-white border-2 border-[#9F1521] shrink-0" />
              <span className="font-bold">Pekan ini</span>
            </div>
          </div>
        </div>

        {/* Baris Ringkasan */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-[#E2E3E4] bg-[#F3F3F4]/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-[#FEF2F2] text-[#9F1521] shrink-0 mt-0.5">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold text-[#111111] font-sans">
                {data.summary.text}
              </p>
              <p className="text-xs text-[#58595B] font-normal">
                Klik salah satu kotak pekan pada tabel di atas untuk membuka rincian presensi dan tugas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-[#E2E3E4] text-[#059669]">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
              <span>{totalLengkap} Selesai</span>
            </span>
            {data.summary.pendingTasksCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-[#E2E3E4] text-[#9F1521]">
                <Clock className="h-3.5 w-3.5 text-[#9F1521]" />
                <span>{data.summary.pendingTasksCount} Tugas Menunggu</span>
              </span>
            ) : null}
            {data.summary.missedWeeksCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-[#E2E3E4] text-[#ED1C24]">
                <AlertCircle className="h-3.5 w-3.5 text-[#ED1C24]" />
                <span>{data.summary.missedWeeksCount} Terlewat</span>
              </span>
            ) : null}
          </div>
        </div>

        {highestRisk ? (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs sm:text-sm ${
              highestRisk.riskLevel === 'RISIKO_TINGGI'
                ? 'border-[#FDDDD7] bg-[#FEF2F2] text-[#9F1521]'
                : 'border-[#E2E3E4] bg-[#F3F3F4] text-[#111111]'
            }`}
          >
            {highestRisk.riskLevel === 'RISIKO_TINGGI' ? (
              <ShieldAlert className="h-5 w-5 text-[#9F1521] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-[#808285] shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 flex-1">
              <p className="font-bold text-[#111111]">
                {highestRisk.riskLevel === 'RISIKO_TINGGI'
                  ? 'Perhatian Khusus Diperlukan'
                  : 'Status Akademik Memerlukan Perhatian'}
              </p>
              <p className="text-[#58595B] text-xs font-normal leading-relaxed">
                {highestRisk.riskLevel === 'RISIKO_TINGGI'
                  ? 'Terdapat indikator kehadiran atau tugas yang memerlukan tindak lanjut segera untuk menjaga kelayakan akademik.'
                  : 'Beberapa parameter perkuliahan mendekati batas minimal. Tingkatkan kehadiran dan pastikan seluruh tugas diserahkan tepat waktu.'}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {selectedCell ? (
        <SemesterWeaveSheet
          isOpen={Boolean(selectedCell)}
          onClose={() => setSelectedCell(null)}
          classTitle={selectedCell.row.classTitle}
          classSection={selectedCell.row.section}
          classId={selectedCell.row.classId}
          weekNumber={selectedCell.cell.weekNumber}
          cell={selectedCell.cell}
        />
      ) : null}
    </section>
  );
}

function getCellStateClasses(state: WeaveCell['state']): string {
  switch (state) {
    case 'LENGKAP':
      return 'bg-[#111111]';
    case 'SEBAGIAN':
      return '[background:linear-gradient(135deg,#111111_50%,#F3F3F4_50%)]';
    case 'IZIN':
      return 'bg-[#808285]';
    case 'TERLEWAT':
      return 'bg-white border border-[#D0D6DD]';
    case 'TANPA_SESI':
      return 'border border-dashed border-[#D0D6DD] bg-transparent';
    case 'BELUM':
      return 'bg-[#F3F3F4]';
    case 'SEKARANG':
      return 'bg-[#F3F3F4]';
    default:
      return 'bg-[#F3F3F4]';
  }
}
