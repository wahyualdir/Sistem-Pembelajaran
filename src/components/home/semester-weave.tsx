'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RetroWindow } from '@/components/retro/retro-window';
import { SemesterWeaveSheet } from './semester-weave-sheet';
import type { SemesterWeaveData, WeaveCell, WeaveRow } from '@/lib/akademik/semester-weave';
import type { StudentRiskEvaluation } from '@/modules/early-warning/types';
import { AlertTriangle, ShieldAlert, BookOpen } from 'lucide-react';

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
        <RetroWindow
          title="kain_semestermu.view"
          badge="MEMUAT..."
          headerClassName="bg-gray-soft"
          bodyClassName="p-4 sm:p-5 bg-surface space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-black/10">
            <div className="h-6 w-40 bg-gray-soft animate-pulse rounded" />
            <div className="h-4 w-28 bg-gray-soft animate-pulse rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="h-4 w-24 bg-gray-soft animate-pulse rounded" />
                <div className="grid grid-cols-16 gap-1 flex-1">
                  {Array.from({ length: 16 }).map((_, cIdx) => (
                    <div
                      key={cIdx}
                      className="h-6 sm:h-7 bg-gray-soft animate-pulse rounded-[2px]"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </RetroWindow>
      </section>
    );
  }

  // 2. Keadaan Galat
  if (error || !data) {
    return (
      <section aria-label="Kain semester" className="w-full">
        <RetroWindow
          title="kain_semestermu.view"
          headerClassName="bg-gray-soft"
          bodyClassName="p-6 bg-surface text-center space-y-3"
        >
          <p className="text-sm font-medium text-ink">
            Kain semester belum bisa dimuat. Coba muat ulang halaman.
          </p>
        </RetroWindow>
      </section>
    );
  }

  // 3. Keadaan Kosong (Tanpa Kelas Aktif)
  if (data.rows.length === 0) {
    return (
      <section aria-label="Kain semester" className="w-full">
        <RetroWindow
          title="kain_semestermu.view"
          headerClassName="bg-gray-soft"
          bodyClassName="p-6 sm:p-8 bg-surface text-center space-y-4"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-black/15 bg-gray-soft">
            <BookOpen className="h-6 w-6 text-gray-dark" />
          </div>
          <div className="space-y-1">
            <p className="text-sm sm:text-base font-bold text-ink">
              Kamu belum terdaftar di kelas mana pun.
            </p>
            <p className="text-xs sm:text-sm text-gray-dark">
              Setelah mendaftar dan kelas aktif disetujui, progres mingguanmu akan muncul di sini.
            </p>
          </div>
          <Link
            href="/classes"
            className="inline-flex items-center justify-center px-4 py-2 rounded border border-black bg-ink text-surface text-xs font-semibold hover:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-black"
          >
            Buka Kelas Saya
          </Link>
        </RetroWindow>
      </section>
    );
  }

  const currentWeek = data.currentWeek;
  const isSemesterStarted = currentWeek !== null && currentWeek > 0;

  // Header teks pekan
  const weekLabelText = isSemesterStarted
    ? `Pekan ${currentWeek} dari 16`
    : 'Semester belum dimulai';

  // Kolom header yang menampilkan teks terlihat: 1, 5, 9, 13, 16 dan currentWeek
  const visibleHeaderWeeks = new Set([1, 5, 9, 13, 16]);
  if (currentWeek && currentWeek >= 1 && currentWeek <= 16) {
    visibleHeaderWeeks.add(currentWeek);
  }

  // Baris peringatan dini jika ada evaluasi akademik berisiko
  const highestRisk = academicEvaluations.find((e) => e.riskLevel === 'RISIKO_TINGGI')
    || academicEvaluations.find((e) => e.riskLevel === 'PERHATIAN');

  return (
    <section aria-label="Kain semester" className="w-full">
      <RetroWindow
        title="kain_semestermu.view"
        badge={weekLabelText}
        headerClassName="bg-gray-soft"
        bodyClassName="p-4 sm:p-5 bg-surface space-y-4"
      >
        {/* Header Sekunder: Judul & Keterangan Pekan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-black/10">
          <div>
            <h2 className="text-base sm:text-lg font-heading font-bold text-ink">
              Kain semestermu
            </h2>
            {!isSemesterStarted ? (
              <p className="text-xs text-gray-dark mt-0.5">
                Semester belum dimulai. Kisimu akan terisi mulai pekan pertama kuliah.
              </p>
            ) : null}
          </div>
          <span className="text-xs sm:text-sm font-sans font-bold text-ink self-start sm:self-auto tabular-nums">
            {weekLabelText}
          </span>
        </div>

        {/* Matriks Kisi Tabel (Wrap dengan overflow-x-auto untuk layar kecil) */}
        <div className="overflow-x-auto -mx-1 px-1">
          <table role="table" className="w-full border-collapse select-none min-w-[320px]">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="w-[84px] sm:w-[110px] pr-2 text-left text-2xs uppercase tracking-wider font-bold text-gray-dark"
                >
                  Mata Kuliah
                </th>
                {Array.from({ length: 16 }).map((_, idx) => {
                  const w = idx + 1;
                  const isVisible = visibleHeaderWeeks.has(w);
                  const isCurrent = w === currentWeek;

                  return (
                    <th
                      key={w}
                      scope="col"
                      className={`h-6 text-center text-2xs font-sans font-bold tabular-nums ${
                        isCurrent ? 'text-primary' : 'text-gray-dark'
                      }`}
                    >
                      {isVisible ? (
                        <span>{w}</span>
                      ) : (
                        <span className="sr-only">Pekan {w}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.classId} className="group">
                  {/* Kolom Nama Mata Kuliah */}
                  <th
                    scope="row"
                    className="w-[84px] sm:w-[110px] max-w-[110px] pr-2 py-1 text-left font-sans text-xs font-semibold text-ink truncate cursor-pointer hover:underline"
                    title={`${row.classTitle}${row.section ? ` (${row.section})` : ''}`}
                  >
                    <Link href={`/classes/${row.classId}`} tabIndex={0}>
                      {row.classTitle}
                    </Link>
                  </th>

                  {/* 16 Kolom Kotak Sel */}
                  {row.cells.map((cell) => {
                    const isCurrent = cell.weekNumber === currentWeek;

                    return (
                      <td key={cell.weekNumber} className="p-0.5 sm:p-1 text-center">
                        <button
                          type="button"
                          aria-label={cell.ariaLabel}
                          onClick={() => setSelectedCell({ row, cell })}
                          className={`relative w-full aspect-square max-w-[28px] max-h-[28px] sm:max-w-[32px] sm:max-h-[32px] mx-auto rounded-[2px] transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer ${
                            isCurrent
                              ? 'border-2 border-primary motion-safe:transition-opacity duration-300'
                              : ''
                          } ${getCellStateClasses(cell.state)}`}
                        >
                          {/* Sentuhan efektif ekstra lebar untuk layar sempit */}
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

        {/* Legenda Bentuk & Warna (Tanpa Hex) */}
        <div className="pt-2 border-t border-black/10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-2xs sm:text-xs text-gray-dark">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[1px] bg-ink shrink-0" />
              <span>Lengkap</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[1px] [background:linear-gradient(135deg,var(--ink)_50%,var(--gray-soft)_50%)] shrink-0" />
              <span>Hadir, tugas belum masuk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[1px] bg-gray-dark [background-image:repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.4)_2px,rgba(255,255,255,0.4)_4px)] shrink-0" />
              <span>Izin atau sakit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[1px] bg-surface border border-gray shrink-0" />
              <span>Terlewat</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[1px] bg-gray-soft shrink-0" />
              <span>Belum</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[1px] bg-gray-soft border-2 border-primary shrink-0" />
              <span className="text-primary font-semibold">Pekan ini</span>
            </div>
          </div>
        </div>

        {/* Baris Ringkasan Netral */}
        <div className="p-3 rounded-lg border border-black/15 bg-gray-soft/40 flex items-center justify-between text-xs sm:text-sm">
          <p className="font-semibold text-ink font-sans">
            {data.summary.text}
          </p>
        </div>

        {/* Baris Peringatan Dini (Jika Ada Risiko Akademik) */}
        {highestRisk ? (
          <div
            className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs sm:text-sm ${
              highestRisk.riskLevel === 'RISIKO_TINGGI'
                ? 'border-primary/50 bg-primary/5 text-ink'
                : 'border-black/20 bg-gray-soft text-ink'
            }`}
          >
            {highestRisk.riskLevel === 'RISIKO_TINGGI' ? (
              <ShieldAlert className="h-4 w-4 sm:h-5 sm:s-5 text-primary shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:s-5 text-gray-dark shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 flex-1">
              <p className="font-bold text-ink">
                {highestRisk.riskLevel === 'RISIKO_TINGGI'
                  ? 'Perhatian Khusus Diperlukan'
                  : 'Status Akademik Memerlukan Perhatian'}
              </p>
              <p className="text-gray-dark text-xs font-sans">
                {highestRisk.riskLevel === 'RISIKO_TINGGI'
                  ? 'Terdapat indikator kehadiran atau tugas yang memerlukan tindak lanjut segera untuk menjaga kelayakan akademik.'
                  : 'Beberapa parameter perkuliahan mendekati batas minimal. Tingkatkan kehadiran dan pastikan seluruh tugas diserahkan tepat waktu.'}
              </p>
            </div>
          </div>
        ) : null}

        {/* Catatan Mandiri Sistem */}
        <p className="text-2xs text-gray-dark italic text-right">
          Sistem ini merupakan alat bantu monitoring mandiri, bukan sanksi atau pengurangan nilai otomatis.
        </p>
      </RetroWindow>

      {/* Sheet Detail Saat Sel Diklik */}
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

/**
 * Pemetaan status sel ke kelas CSS token Tailwind (Tanpa Hex).
 */
function getCellStateClasses(state: WeaveCell['state']): string {
  switch (state) {
    case 'LENGKAP':
      return 'bg-ink';
    case 'SEBAGIAN':
      return '[background:linear-gradient(135deg,var(--ink)_50%,var(--gray-soft)_50%)]';
    case 'IZIN':
      return 'bg-gray-dark [background-image:repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.4)_2px,rgba(255,255,255,0.4)_4px)]';
    case 'TERLEWAT':
      return 'bg-surface border border-gray';
    case 'TANPA_SESI':
      return 'border border-dashed border-gray-dark bg-transparent';
    case 'BELUM':
      return 'bg-gray-soft';
    case 'SEKARANG':
      return 'bg-gray-soft';
    default:
      return 'bg-gray-soft';
  }
}
