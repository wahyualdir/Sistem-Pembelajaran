import React from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  GraduationCap,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

export default function GradesRecapSubpage() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title="Rekap Nilai Perkuliahan"
        headerBadge="Rekap Nilai"
        headerBadgeVariant="warning"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground flex items-center gap-3">
            <FileSpreadsheet className="h-7 w-7 text-primary" />
            <span>Rekap Nilai Perkuliahan</span>
          </h1>
          <p className="text-sm sm:text-base text-black font-bold max-w-3xl leading-relaxed">
            Ringkasan nilai seluruh komponen evaluasi (tugas, kuis, UTS, UAS, dan praktikum) beserta konversi otomatis ke huruf mutu (A, AB, B, BC, C, D, E) dan bobot IPK.
          </p>
        </div>
      </RetroWindow>

      <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black pb-3">
          <div>
            <h2 className="font-heading font-bold text-lg text-foreground">Pemrograman Web Lanjut (TI-301)</h2>
            <p className="text-xs text-black font-bold">36 Mahasiswa terdaftar · Semester Ganjil 2026/2027</p>
          </div>
          <Link
            href="/analytics/export"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-black bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor XLSX / PDF</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm sm:text-base font-sans">
            <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black text-xs sm:text-sm tracking-wide">
              <tr>
                <th className="py-3.5 px-4">NIM</th>
                <th className="py-3.5 px-4">Nama Mahasiswa</th>
                <th className="py-3.5 px-3 text-center">Tugas (25%)</th>
                <th className="py-3.5 px-3 text-center">Kuis (15%)</th>
                <th className="py-3.5 px-3 text-center">UTS (25%)</th>
                <th className="py-3.5 px-3 text-center">UAS (35%)</th>
                <th className="py-3.5 px-3 text-center">Nilai Akhir</th>
                <th className="py-3.5 px-3 text-center">Huruf</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/15 font-sans">
              <tr className="hover:bg-gray-soft/30 transition-colors">
                <td className="py-3.5 px-4 font-sans font-bold text-black">2024001</td>
                <td className="py-3.5 px-4 font-bold text-black text-base">Ahmad Fauzi</td>
                <td className="py-3.5 px-3 text-center font-bold text-black">90</td>
                <td className="py-3.5 px-3 text-center font-bold text-black">85</td>
                <td className="py-3.5 px-3 text-center font-bold text-black">88</td>
                <td className="py-3.5 px-3 text-center font-bold text-black">92</td>
                <td className="py-3.5 px-3 text-center font-bold text-base sm:text-lg text-black">89.45</td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[36px] h-8 px-2 rounded border-2 border-black font-sans font-bold text-sm bg-white text-black shadow-retro-sm">
                    A
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-soft/30 transition-colors">
                <td className="py-3.5 px-4 font-sans font-bold text-black">2024002</td>
                <td className="py-3.5 px-4 font-bold text-black text-base">Budi Santoso</td>
                <td className="py-3.5 px-3 text-center font-bold text-black">85</td>
                <td className="py-3.5 px-3 text-center font-bold text-black">80</td>
                <td className="py-3.5 px-3 text-center font-bold text-black">82</td>
                <td className="py-3.5 px-3 text-center font-bold text-black">86</td>
                <td className="py-3.5 px-3 text-center font-bold text-base sm:text-lg text-black">83.85</td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[36px] h-8 px-2 rounded border-2 border-black font-sans font-bold text-sm bg-white text-black shadow-retro-sm">
                    AB
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
