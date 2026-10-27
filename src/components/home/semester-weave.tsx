'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RetroWindow } from '@/components/retro/retro-window';
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
        <RetroWindow
          title="kain_semestermu.view"
          badge="MEMUAT..."
          headerClassName="vt-titlebar"
          bodyClassName="p-4 sm:p-6 bg-surface space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-black/10">
            <div className="h-6 w-48 bg-gray-soft animate-pulse rounded" />
            <div className="h-4 w-32 bg-gray-soft animate-pulse rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="h-5 w-40 bg-gray-soft animate-pulse rounded" />
                <div className="grid grid-cols-16 gap-1 flex-1">
                  {Array.from({ length: 16 }).map((_, cIdx) => (
                    <div
                      key={cIdx}
                      className="h-7 bg-gray-soft animate-pulse rounded-[3px]"
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
          headerClassName="vt-titlebar"
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
          headerClassName="vt-titlebar"
          bodyClassName="p-6 sm:p-8 bg-surface text-center space-y-4"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-black/15 bg-gray-soft">
            <BookOpen className="h-6 w-6 text-gray-dark" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
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

  // Hitung metrik ringkasan untuk chip status interaktif
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

  // Persentase berjalannya semester
  const progressPercent = isSemesterStarted
    ? Math.min(100, Math.round(((currentWeek || 1) / 16) * 100))
    : 0;

  // Baris peringatan dini jika ada evaluasi akademik berisiko
  const highestRisk = academicEvaluations.find((e) => e.riskLevel === 'RISIKO_TINGGI')
    || academicEvaluations.find((e) => e.riskLevel === 'PERHATIAN');

  return (
    <section aria-label="Kain semester" className="w-full">
      <RetroWindow
        title="kain_semestermu.view"
        badge={weekLabelText}
        headerClassName="vt-titlebar"
        bodyClassName="p-4 sm:p-5 bg-surface space-y-4"
      >
        {/* Header Sekunder: Judul & Keterangan Pekan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E8E5DE]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-heading font-extrabold text-[#1C1917]">
                Kain semestermu
              </h2>
              {isSemesterStarted && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-bold bg-[#853827]/10 text-[#853827] border border-[#853827]/20">
                  {progressPercent}% Berjalan
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 mt-0.5 font-sans">
              {!isSemesterStarted
                ? 'Semester belum dimulai. Kisimu akan terisi mulai pekan pertama kuliah.'
                : 'Pemetaan ritme kehadiran dan penyelesaian tugas per mata kuliah sepanjang semester.'}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-100 border border-stone-200 text-xs sm:text-sm font-sans font-extrabold text-[#853827] tabular-nums shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-[#853827] animate-pulse" />
              {weekLabelText}
            </span>
          </div>
        </div>

        {/* Matriks Kisi Tabel (Wrap dengan overflow-x-auto untuk layar kecil) */}
        <div className="overflow-x-auto overscroll-x-contain table-scroll -mx-1 px-1">
          <table role="table" className="w-full border-collapse select-none min-w-[560px] sm:min-w-[640px]">
            <thead>
              <tr className="border-b border-[#E8E5DE]">
                <th
                  scope="col"
                  className="w-[140px] sm:w-[190px] md:w-[220px] pr-3 pb-2 text-left text-xs uppercase tracking-wider font-extrabold text-[#57534E]"
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
                      className={`h-7 pb-2 text-center text-xs font-sans font-extrabold tabular-nums relative ${
                        isCurrent
                          ? 'text-[#C2553A]'
                          : 'text-[#7A756D]'
                      } ${w === 8 ? 'border-r border-stone-300' : ''}`}
                    >
                      {isVisible ? (
                        isCurrent ? (
                          <span className="inline-flex items-center justify-center min-w-[20px] px-1 py-0.5 rounded bg-[#853827] text-white text-[11px] font-black shadow-xs">
                            {w}
                          </span>
                        ) : (
                          <span className={`${isUts || isUas ? 'font-black text-ink' : ''}`}>
                            {w}
                          </span>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <span className="sr-only">Pekan {w}</span>
                          <span
                            aria-hidden="true"
                            className={`text-[10px] select-none font-mono font-medium ${
                              isUts ? 'text-ink font-bold' : 'text-stone-400'
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
            <tbody className="divide-y divide-stone-100">
              {data.rows.map((row) => (
                <tr key={row.classId} className="group hover:bg-stone-50/60 transition-colors">
                  {/* Kolom Nama Mata Kuliah: Lebar cukup, tidak terpotong kerdil */}
                  <th
                    scope="row"
                    className="w-[140px] sm:w-[190px] md:w-[220px] max-w-[240px] pr-3 py-2 text-left font-sans text-xs font-bold text-[#1C1917] cursor-pointer"
                    title={`${row.classTitle}${row.section ? ` (${row.section})` : ''}`}
                  >
                    <Link
                      href={`/classes/${row.classId}`}
                      tabIndex={0}
                      className="inline-flex items-center gap-1.5 hover:underline hover:text-[#C2553A] group-hover:text-[#853827] transition-colors max-w-full"
                    >
                      <span className="truncate" title={row.classTitle}>
                        {row.classTitle}
                      </span>
                      {row.section ? (
                        <span className="shrink-0 text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-stone-100 border border-stone-200 text-stone-600">
                          {row.section}
                        </span>
                      ) : null}
                    </Link>
                  </th>

                  {/* 16 Kolom Kotak Sel */}
                  {row.cells.map((cell) => {
                    const isCurrent = cell.weekNumber === currentWeek;
                    const isDividingWeek = cell.weekNumber === 8;

                    return (
                      <td
                        key={cell.weekNumber}
                        className={`p-0.5 sm:p-1 text-center ${
                          isDividingWeek ? 'border-r border-stone-200' : ''
                        } ${isCurrent ? 'bg-[#853827]/5' : ''}`}
                      >
                        <button
                          type="button"
                          aria-label={cell.ariaLabel}
                          onClick={() => setSelectedCell({ row, cell })}
                          className={`relative w-full aspect-square max-w-[26px] max-h-[26px] sm:max-w-[30px] sm:max-h-[30px] mx-auto rounded-[3px] border transition-all duration-150 active:scale-95 hover:scale-110 hover:z-10 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#853827] cursor-pointer ${
                            isCurrent
                              ? 'border-2 border-primary shadow-xs ring-1 ring-primary/40'
                              : 'border-stone-400/30'
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

        {/* Legenda Bentuk & Warna (Pill Chips yang Rapi & Indah) */}
        <div className="pt-3 border-t border-[#E8E5DE]">
          <div className="flex flex-wrap items-center gap-2 text-xs font-sans font-medium text-stone-600">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mr-1">
              Legenda:
            </span>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-100 border border-stone-200 text-stone-700">
              <span className="h-3 w-3 rounded-[2px] bg-ink shrink-0 shadow-2xs" />
              <span className="font-semibold text-ink">Lengkap</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-100 border border-stone-200 text-stone-700">
              <span className="h-3 w-3 rounded-[2px] border border-stone-300 [background:linear-gradient(135deg,var(--ink)_50%,var(--gray-soft)_50%)] shrink-0 shadow-2xs" />
              <span>Hadir, tugas belum masuk</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-100 border border-stone-200 text-stone-700">
              <span className="h-3 w-3 rounded-[2px] bg-gray-dark [background-image:repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.4)_2px,rgba(255,255,255,0.4)_4px)] shrink-0 shadow-2xs" />
              <span>Izin atau sakit</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-100 border border-stone-200 text-stone-700">
              <span className="h-3 w-3 rounded-[2px] bg-surface border-2 border-stone-400 shrink-0 shadow-2xs" />
              <span>Terlewat</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-100 border border-stone-200 text-stone-700">
              <span className="h-3 w-3 rounded-[2px] bg-stone-200 border border-stone-300 shrink-0" />
              <span>Belum</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900">
              <span className="h-3 w-3 rounded-[2px] bg-white border-2 border-primary shrink-0 shadow-2xs" />
              <span className="text-primary font-bold">Pekan ini</span>
            </div>
          </div>
        </div>

        {/* Baris Ringkasan Komprehensif (Ikhtisar Aktivitas & Tindak Lanjut) */}
        <div className="p-3.5 sm:p-4 rounded-lg border border-[#E8E5DE] bg-[#FAF8F5] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-md bg-[#853827]/10 text-[#853827] shrink-0 mt-0.5">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold text-ink font-sans">
                {data.summary.text}
              </p>
              <p className="text-xs text-stone-500 font-sans">
                Klik salah satu kotak pekan pada tabel di atas untuk membuka rincian presensi dan tugas.
              </p>
            </div>
          </div>

          {/* Quick Counter Chips */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-semibold bg-white border border-stone-200 text-stone-700 shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>{totalLengkap} Selesai</span>
            </span>
            {data.summary.pendingTasksCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-semibold bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>{data.summary.pendingTasksCount} Tugas Menunggu</span>
              </span>
            ) : null}
            {data.summary.missedWeeksCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-semibold bg-rose-50 border border-rose-200 text-rose-800 shadow-2xs">
                <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                <span>{data.summary.missedWeeksCount} Terlewat</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Baris Peringatan Dini (Jika Ada Risiko Akademik) */}
        {highestRisk ? (
          <div
            className={`p-3.5 rounded-lg border flex items-start gap-3 text-xs sm:text-sm ${
              highestRisk.riskLevel === 'RISIKO_TINGGI'
                ? 'border-[#C2553A]/40 bg-[#C2553A]/5 text-ink'
                : 'border-stone-300 bg-stone-100 text-ink'
            }`}
          >
            {highestRisk.riskLevel === 'RISIKO_TINGGI' ? (
              <ShieldAlert className="h-5 w-5 text-[#C2553A] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-stone-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 flex-1">
              <p className="font-bold text-ink">
                {highestRisk.riskLevel === 'RISIKO_TINGGI'
                  ? 'Perhatian Khusus Diperlukan'
                  : 'Status Akademik Memerlukan Perhatian'}
              </p>
              <p className="text-stone-600 text-xs font-sans leading-relaxed">
                {highestRisk.riskLevel === 'RISIKO_TINGGI'
                  ? 'Terdapat indikator kehadiran atau tugas yang memerlukan tindak lanjut segera untuk menjaga kelayakan akademik.'
                  : 'Beberapa parameter perkuliahan mendekati batas minimal. Tingkatkan kehadiran dan pastikan seluruh tugas diserahkan tepat waktu.'}
              </p>
            </div>
          </div>
        ) : null}

        {/* Catatan Mandiri Sistem */}
        <p className="text-xs text-[#57534E] font-sans font-bold italic text-right">
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
