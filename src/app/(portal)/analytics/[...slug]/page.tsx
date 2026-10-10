import React from 'react';
import Link from 'next/link';
import {
  Activity,
  Award,
  Download,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

interface PageProps {
  params: {
    slug: string[];
  };
}

export default function AnalyticsSubpage({ params }: PageProps) {
  const subroute = params.slug?.[0] || 'classes';

  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title={`analitik_dan_laporan_${subroute}.app`}
        subtitle="Analisis Pembelajaran, Butir Soal & Rekap Capaian"
        headerBadge="Analitik"
        headerBadgeVariant="warning"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
            <Activity className="h-7 w-7 text-retro-orange" />
            <span className="capitalize">{subroute === 'classes' ? 'Analitik Kelas Perkuliahan' : subroute === 'questions' ? 'Analisis Butir Soal (Item Analysis)' : 'Ekspor Laporan & Nilai'}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-3xl leading-relaxed">
            {subroute === 'questions'
              ? 'Tingkat kesulitan butir soal, daya pembeda (discrimination index), dan reliabilitas instrumen evaluasi.'
              : subroute === 'export'
              ? 'Unduh format berkas rekap nilai dan presensi perkuliahan dalam format XLSX dan PDF siap cetak.'
              : 'Distribusi nilai kelas, ketuntasan indikator capaian pembelajaran (CPL), dan retensi mahasiswa.'}
          </p>
        </div>
      </RetroWindow>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-lg border-2 border-black bg-white shadow-retro space-y-2">
          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Rata-rata Nilai Kelas</span>
          <p className="font-heading font-black text-3xl text-foreground">84.2 <span className="text-xs font-mono font-normal">/ 100</span></p>
          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> +5.4% dari semester lalu
          </span>
        </div>

        <div className="p-5 rounded-lg border-2 border-black bg-white shadow-retro space-y-2">
          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Tingkat Kelulusan KKM</span>
          <p className="font-heading font-black text-3xl text-foreground">91.6%</p>
          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> 33 dari 36 mahasiswa lulus KKM
          </span>
        </div>

        <div className="p-5 rounded-lg border-2 border-black bg-white shadow-retro space-y-2">
          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Tingkat Kehadiran Rata-rata</span>
          <p className="font-heading font-black text-3xl text-foreground">94.8%</p>
          <span className="text-xs text-muted-foreground font-mono">
            Memenuhi syarat ujian
          </span>
        </div>
      </div>

      <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <h2 className="font-heading font-black text-lg text-foreground">
            {subroute === 'export' ? 'Format Ekspor Tersedia' : 'Rincian Analisis Per Indikator CPL'}
          </h2>
          <span className="text-xs font-mono text-muted-foreground">Semester Ganjil 2026/2027</span>
        </div>

        {subroute === 'export' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border-2 border-black bg-neutral-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">Rekap Nilai Lengkap (XLSX)</h3>
                <p className="text-xs text-muted-foreground">Komponen tugas, kuis, UTS, UAS, dan nilai akhir huruf.</p>
              </div>
              <button className="px-3 py-1.5 rounded-lg border-2 border-black bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all flex items-center gap-1">
                <Download className="h-3.5 w-3.5" /> Unduh
              </button>
            </div>
            <div className="p-4 rounded-lg border-2 border-black bg-neutral-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">Berita Acara Perkuliahan (PDF)</h3>
                <p className="text-xs text-muted-foreground">Format resmi berita acara dan presensi untuk prodi.</p>
              </div>
              <button className="px-3 py-1.5 rounded-lg border-2 border-black bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all flex items-center gap-1">
                <Download className="h-3.5 w-3.5" /> Unduh
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <span>CPL-01: Pemahaman Konsep Arsitektur Software</span>
              <span className="font-bold text-emerald-700">88.5% (Tercapai)</span>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <span>CPL-02: Implementasi REST API & Keamanan Data</span>
              <span className="font-bold text-emerald-700">82.1% (Tercapai)</span>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <span>CPL-03: Pengujian Kode Otomatis & Deployment</span>
              <span className="font-bold text-amber-700">76.4% (Perlu Penguatan)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
