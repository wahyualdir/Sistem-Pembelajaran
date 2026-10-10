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
        title="rekapitulasi_nilai_perkuliahan.app"
        subtitle="Rekap Nilai Kumulatif & Distribusi Huruf Mutu"
        headerBadge="Rekap Nilai"
        headerBadgeVariant="warning"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
            <FileSpreadsheet className="h-7 w-7 text-retro-orange" />
            <span>Rekap Nilai Perkuliahan</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-3xl leading-relaxed">
            Ringkasan nilai seluruh komponen evaluasi (tugas, kuis, UTS, UAS, dan praktikum) beserta konversi otomatis ke huruf mutu (A, AB, B, BC, C, D, E) dan bobot IPK.
          </p>
        </div>
      </RetroWindow>

      <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black pb-3">
          <div>
            <h2 className="font-heading font-black text-lg text-foreground">Pemrograman Web Lanjut (TI-301)</h2>
            <p className="text-xs text-muted-foreground">36 Mahasiswa terdaftar · Semester Ganjil 2026/2027</p>
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
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b-2 border-black bg-neutral-100 font-bold">
                <th className="p-3">NIM</th>
                <th className="p-3">Nama Mahasiswa</th>
                <th className="p-3">Tugas (25%)</th>
                <th className="p-3">Kuis (15%)</th>
                <th className="p-3">UTS (25%)</th>
                <th className="p-3">UAS (35%)</th>
                <th className="p-3">Nilai Akhir</th>
                <th className="p-3">Huruf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              <tr className="hover:bg-neutral-50">
                <td className="p-3 font-bold">2024001</td>
                <td className="p-3">Ahmad Fauzi</td>
                <td className="p-3">90</td>
                <td className="p-3">85</td>
                <td className="p-3">88</td>
                <td className="p-3">92</td>
                <td className="p-3 font-bold text-foreground">89.45</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold">A</span></td>
              </tr>
              <tr className="hover:bg-neutral-50">
                <td className="p-3 font-bold">2024002</td>
                <td className="p-3">Budi Santoso</td>
                <td className="p-3">85</td>
                <td className="p-3">80</td>
                <td className="p-3">82</td>
                <td className="p-3">86</td>
                <td className="p-3 font-bold text-foreground">83.85</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold">AB</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
