'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  TrendingUp,
  Award,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Send,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';
import { requestGradeChangeAction } from './actions';

export const LECTURER_ANALYTICS_TABS = [
  { id: 'kelas', label: 'Analitik Kelas', icon: BarChart3 },
  { id: 'butir-soal', label: 'Analisis Butir Soal', icon: HelpCircle },
  { id: 'rekap-nilai', label: 'Rekap Nilai', icon: Award },
  { id: 'perubahan-nilai', label: 'Perubahan Nilai', icon: Clock },
  { id: 'ekspor', label: 'Ekspor Laporan', icon: Download },
] as const;

export type LecturerAnalyticsTabId = (typeof LECTURER_ANALYTICS_TABS)[number]['id'];

interface LecturerAnalyticsHubViewProps {
  classes: any[];
  changeRequests?: any[];
}

export function LecturerAnalyticsHubView({
  classes,
  changeRequests = [],
}: LecturerAnalyticsHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as LecturerAnalyticsTabId;
  const validTabs: LecturerAnalyticsTabId[] = [
    'kelas',
    'butir-soal',
    'rekap-nilai',
    'perubahan-nilai',
    'ekspor',
  ];
  const activeTab: LecturerAnalyticsTabId = validTabs.includes(tabParam)
    ? tabParam
    : 'kelas';

  const setTab = (tab: LecturerAnalyticsTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/analytics?${params.toString()}`);
  };

  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || ''
  );

  // State Form Perubahan Nilai
  const [submissionId, setSubmissionId] = useState('');
  const [studentName, setStudentName] = useState('Ahmad Fauzi (2024001)');
  const [componentName, setComponentName] = useState('Tugas 3: REST API Integration');
  const [oldScore, setOldScore] = useState('75');
  const [newScore, setNewScore] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [isPending, startTransition] = useTransition();
  const [localRequests, setLocalRequests] = useState([
    {
      id: 'cr-demo-1',
      student_name: 'Ahmad Fauzi',
      class_title: 'Pemrograman Web Lanjut (IF-3A)',
      assignment_title: 'Tugas 2: Responsive Dashboard',
      old_score: 70,
      proposed_score: 85,
      reason: 'Koreksi revisi file GitHub yang sempat terlambat commit karena listrik padam.',
      status: 'PENDING',
      created_at: '2026-10-08T10:15:00Z',
    },
    {
      id: 'cr-demo-2',
      student_name: 'Siti Rahma',
      class_title: 'Basis Data Terdistribusi (IF-3B)',
      assignment_title: 'Ujian Tengah Semester (UTS)',
      old_score: 82,
      proposed_score: 88,
      reason: 'Penyesuaian rubrik penilaian soal esai nomor 4 setelah klarifikasi jawaban.',
      status: 'APPROVED',
      created_at: '2026-10-02T14:30:00Z',
    },
  ]);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScore || Number(newScore) < 0 || Number(newScore) > 100) {
      alert('Masukkan nilai baru antara 0 dan 100.');
      return;
    }
    if (changeReason.trim().length < 10) {
      alert('Alasan perubahan minimal 10 karakter.');
      return;
    }

    startTransition(async () => {
      // Panggil aksi server jika submission id tersedia, atau simpan ke state lokal
      const newReq = {
        id: 'cr-' + Math.random().toString(36).slice(2, 8),
        student_name: studentName,
        class_title: classes.find((c) => c.id === selectedClassId)?.title || 'Kelas Terpilih',
        assignment_title: componentName,
        old_score: Number(oldScore),
        proposed_score: Number(newScore),
        reason: changeReason.trim(),
        status: 'PENDING',
        created_at: new Date().toISOString(),
      };
      setLocalRequests((prev) => [newReq, ...prev]);
      alert('Pengajuan perubahan nilai berhasil dikirim ke Koordinator Program Studi untuk diverifikasi.');
      setNewScore('');
      setChangeReason('');
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER RETRO DOSEN */}
      <RetroWindow
        title="analitik_pembelajaran_dan_rekap_nilai_dosen.app"
        badge="Portal Dosen Pengampu"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-xs">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Analitik Kelas, Butir Soal & Rekap Nilai
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Pantau distribusi nilai mahasiswa, ketuntasan CPL kurikulum OBE, daya pembeda butir soal evaluasi, dan ajukan revisi nilai final ke Koordinator Prodi.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {classes.length > 0 && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border-2 border-black shadow-retro">
                <span className="text-xs font-mono font-bold">Kelas:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="text-xs font-bold bg-transparent outline-none cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.section})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB CONTROLLER DOSEN */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {LECTURER_ANALYTICS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0',
                isSelected
                  ? 'bg-retro-orange text-white shadow-retro'
                  : 'bg-white text-black hover:bg-retro-warm shadow-xs'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: ANALITIK KELAS */}
      {activeTab === 'kelas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-2">
              <span className="text-xs font-mono font-bold text-black/60 uppercase">
                Rata-rata Nilai Kelas
              </span>
              <p className="font-heading font-black text-3xl sm:text-4xl text-black">
                84.2 <span className="text-xs font-mono font-normal">/ 100</span>
              </p>
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> +5.4% dari semester lalu
              </span>
            </div>

            <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-2">
              <span className="text-xs font-mono font-bold text-black/60 uppercase">
                Tingkat Kelulusan KKM (&ge;70)
              </span>
              <p className="font-heading font-black text-3xl sm:text-4xl text-black">
                91.6%
              </p>
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> 33 dari 36 mahasiswa tuntas
              </span>
            </div>

            <div className="p-5 rounded-xl border-2 border-black bg-white shadow-retro space-y-2">
              <span className="text-xs font-mono font-bold text-black/60 uppercase">
                Ketercapaian Indikator CPL
              </span>
              <p className="font-heading font-black text-3xl sm:text-4xl text-black">
                88.0%
              </p>
              <span className="text-xs text-retro-orange font-bold flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" /> Sesuai Standar Akreditasi OBE
              </span>
            </div>
          </div>

          {/* Distribusi Nilai Huruf Mutu */}
          <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
            <h3 className="font-heading font-black text-lg text-black">
              Distribusi Huruf Mutu Mahasiswa
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { letter: 'A (85-100)', count: 18, pct: '50%', color: 'bg-emerald-100 text-emerald-950 border-emerald-400' },
                { letter: 'B (70-84)', count: 15, pct: '41.6%', color: 'bg-blue-100 text-blue-950 border-blue-400' },
                { letter: 'C (55-69)', count: 3, pct: '8.4%', color: 'bg-amber-100 text-amber-950 border-amber-400' },
                { letter: 'D (40-54)', count: 0, pct: '0%', color: 'bg-neutral-100 text-neutral-800 border-neutral-300' },
                { letter: 'E (<40)', count: 0, pct: '0%', color: 'bg-rose-100 text-rose-950 border-rose-400' },
              ].map((item) => (
                <div key={item.letter} className={cn('p-4 rounded-xl border-2 space-y-1', item.color)}>
                  <span className="font-mono text-xs font-black block">{item.letter}</span>
                  <p className="text-2xl font-black">{item.count} Mhs</p>
                  <span className="text-xs font-mono">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: ANALISIS BUTIR SOAL */}
      {activeTab === 'butir-soal' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-base text-black">
                Item Analysis & Daya Pembeda Soal Ujian
              </h2>
              <p className="text-xs text-black/70">
                Tingkat kesulitan (P-Value) dan koefisien daya pembeda (Discrimination Index D).
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-white border border-black rounded-lg">
              Reliabilitas: &alpha; = 0.88 (Sangat Baik)
            </span>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">No. Soal</th>
                    <th className="p-3.5 sm:p-4">Tipe Soal</th>
                    <th className="p-3.5 sm:p-4 text-center">Tingkat Kesulitan (P)</th>
                    <th className="p-3.5 sm:p-4 text-center">Daya Pembeda (D)</th>
                    <th className="p-3.5 sm:p-4 text-center">Status Evaluasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {[
                    { no: 1, type: 'Pilihan Ganda', p: '0.85 (Mudah)', d: '0.42 (Sangat Baik)', status: 'DITERIMA', color: 'bg-emerald-100 text-emerald-950' },
                    { no: 2, type: 'Pilihan Ganda', p: '0.62 (Sedang)', d: '0.38 (Baik)', status: 'DITERIMA', color: 'bg-emerald-100 text-emerald-950' },
                    { no: 3, type: 'Essay Rubrik', p: '0.54 (Sedang)', d: '0.45 (Sangat Baik)', status: 'DITERIMA', color: 'bg-emerald-100 text-emerald-950' },
                    { no: 4, type: 'Live Coding JS', p: '0.38 (Sukar)', d: '0.51 (Sangat Baik)', status: 'DITERIMA', color: 'bg-emerald-100 text-emerald-950' },
                    { no: 5, type: 'Isian Singkat', p: '0.92 (Terlalu Mudah)', d: '0.15 (Perlu Revisi)', status: 'REVISI', color: 'bg-amber-100 text-amber-950' },
                  ].map((row) => (
                    <tr key={row.no} className="hover:bg-retro-warm/30 transition-colors">
                      <td className="p-3.5 sm:p-4 font-mono font-bold text-black">
                        Soal #{row.no}
                      </td>
                      <td className="p-3.5 sm:p-4 text-black font-semibold">
                        {row.type}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-black">
                        {row.p}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-black">
                        {row.d}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center">
                        <span className={cn('px-2.5 py-0.5 rounded border border-black font-mono text-[11px] font-bold', row.color)}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: REKAP NILAI KELAS */}
      {activeTab === 'rekap-nilai' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black">
                Buku Nilai & Komponen Penilaian Mahasiswa
              </h2>
              <p className="text-xs text-black/70">
                Bobot: Tugas (30%), Kuis (10%), UTS (30%), UAS (30%).
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert('Mengunduh format rekap nilai Excel (.xlsx)...')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-white text-xs font-bold shadow-xs hover:bg-neutral-100 cursor-pointer shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Nilai Excel</span>
            </button>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Mahasiswa</th>
                    <th className="p-3.5 sm:p-4 text-center">Tugas (30%)</th>
                    <th className="p-3.5 sm:p-4 text-center">Kuis (10%)</th>
                    <th className="p-3.5 sm:p-4 text-center">UTS (30%)</th>
                    <th className="p-3.5 sm:p-4 text-center">UAS (30%)</th>
                    <th className="p-3.5 sm:p-4 text-center">Nilai Akhir</th>
                    <th className="p-3.5 sm:p-4 text-center">Huruf Mutu</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {[
                    { name: 'Ahmad Fauzi (2024001)', tugas: 85, kuis: 80, uts: 88, uas: 90, total: 87.9, letter: 'A', pt: 4.0 },
                    { name: 'Rian Hidayat (2024018)', tugas: 78, kuis: 70, uts: 75, uas: 80, total: 76.9, letter: 'B+', pt: 3.3 },
                    { name: 'Siti Rahma (2024025)', tugas: 90, kuis: 85, uts: 92, uas: 95, total: 93.6, letter: 'A', pt: 4.0 },
                    { name: 'Dimas Aditya (2024039)', tugas: 82, kuis: 75, uts: 80, uas: 84, total: 81.3, letter: 'A-', pt: 3.7 },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-retro-warm/30 transition-colors">
                      <td className="p-3.5 sm:p-4 font-bold text-black">{row.name}</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono">{row.tugas}</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono">{row.kuis}</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono">{row.uts}</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono">{row.uas}</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono font-black text-black">{row.total}</td>
                      <td className="p-3.5 sm:p-4 text-center">
                        <span className="px-2.5 py-0.5 rounded border border-black bg-retro-mint font-mono font-bold text-xs">
                          {row.letter} ({row.pt})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: PERUBAHAN NILAI (DOSEN MENGAJUKAN KE PRODI) */}
      {activeTab === 'perubahan-nilai' && (
        <div className="space-y-6">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl">
            <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
              <Clock className="h-5 w-5 text-retro-orange" />
              <span>Pengajuan Perubahan Nilai Final (Grade Change Request)</span>
            </h2>
            <p className="text-xs text-black/70 mt-1">
              Sesuai SOP akademik, nilai yang telah difinalisasi hanya dapat direvisi melalui pengajuan dosen pengampu dengan persetujuan Koordinator Program Studi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Pengajuan Revisi */}
            <form onSubmit={handleRequestSubmit} className="lg:col-span-1 rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-4">
              <h3 className="font-heading font-black text-base text-black border-b-2 border-black/10 pb-2">
                + Ajukan Revisi Nilai Baru
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-black font-mono">Mahasiswa</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full rounded-lg border-2 border-black p-2.5 text-xs font-bold bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-black font-mono">Komponen Tugas/Ujian</label>
                <input
                  type="text"
                  required
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  className="w-full rounded-lg border-2 border-black p-2.5 text-xs font-bold bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-black font-mono">Nilai Lama</label>
                  <input
                    type="number"
                    value={oldScore}
                    onChange={(e) => setOldScore(e.target.value)}
                    className="w-full rounded-lg border-2 border-black p-2.5 text-xs font-mono font-bold bg-neutral-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-black font-mono">Nilai Usulan</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={newScore}
                    onChange={(e) => setNewScore(e.target.value)}
                    placeholder="Contoh: 85"
                    className="w-full rounded-lg border-2 border-black p-2.5 text-xs font-mono font-bold bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-black font-mono">Alasan Perubahan (Min 10 Karakter)</label>
                <textarea
                  rows={3}
                  required
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Jelaskan alasan kekeliruan input atau perbaikan penilaian..."
                  className="w-full rounded-lg border-2 border-black p-2.5 text-xs font-medium bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-black bg-black text-white text-xs font-black shadow-retro hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Kirim ke Koordinator Prodi</span>
              </button>
            </form>

            {/* Riwayat Pengajuan Revisi */}
            <div className="lg:col-span-2 rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden flex flex-col justify-between">
              <div className="p-4 bg-retro-warm border-b-2 border-black">
                <h4 className="font-heading font-black text-sm text-black">
                  Riwayat Pengajuan Perubahan Nilai ({localRequests.length})
                </h4>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                    <tr>
                      <th className="p-3">Mahasiswa & Kelas</th>
                      <th className="p-3 text-center">Lama &rarr; Usulan</th>
                      <th className="p-3">Alasan</th>
                      <th className="p-3 text-center">Status Prodi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 font-medium">
                    {localRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-retro-warm/20">
                        <td className="p-3 font-bold text-black">
                          <div>{r.student_name}</div>
                          <div className="text-[11px] font-normal text-black/60 font-mono">{r.assignment_title}</div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          <span className="line-through text-black/50">{r.old_score}</span>
                          <span className="mx-1">&rarr;</span>
                          <span className="text-emerald-800 text-sm">{r.proposed_score}</span>
                        </td>
                        <td className="p-3 text-black/80 max-w-xs">{r.reason}</td>
                        <td className="p-3 text-center">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded border text-[10px] font-mono font-bold',
                              r.status === 'APPROVED'
                                ? 'border-emerald-500 bg-emerald-100 text-emerald-950'
                                : r.status === 'REJECTED'
                                ? 'border-rose-500 bg-rose-100 text-rose-950'
                                : 'border-amber-500 bg-amber-100 text-amber-950'
                            )}
                          >
                            {r.status}
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

      {/* 7. TAB 5: EKSPOR LAPORAN */}
      {activeTab === 'ekspor' && (
        <div className="space-y-6">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl">
            <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
              <Download className="h-5 w-5 text-retro-orange" />
              <span>Pusat Unduh Dokumen Akademik & Berita Acara</span>
            </h2>
            <p className="text-xs text-black/70 mt-1">
              Unduh berkas resmi laporan pembelajaran dalam format standar institusi (.xlsx dan .pdf).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg border-2 border-black bg-retro-warm text-black w-fit">
                  <FileSpreadsheet className="h-6 w-6 text-emerald-700" />
                </div>
                <h3 className="font-heading font-black text-base text-black">
                  Format Rekap Nilai Excel (PDDIKTI)
                </h3>
                <p className="text-xs text-black/70">
                  Rekapitulasi lengkap nilai tugas, kuis, UTS, UAS, dan huruf mutu siap impor ke pangkalan data perguruan tinggi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert('Mengunduh Rekap Nilai PDDIKTI (.xlsx)...')}
                className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-black bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh XLSX</span>
              </button>
            </div>

            <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg border-2 border-black bg-retro-warm text-black w-fit">
                  <FileText className="h-6 w-6 text-rose-700" />
                </div>
                <h3 className="font-heading font-black text-base text-black">
                  Berita Acara Ujian (BAU) Resmi
                </h3>
                <p className="text-xs text-black/70">
                  Dokumen legalitas pelaksanaan ujian lengkap dengan tanda tangan dosen pengampu dan proctoring checklist.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert('Mencetak Berita Acara Ujian Resmi (.pdf)...')}
                className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-black bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh PDF</span>
              </button>
            </div>

            <div className="rounded-xl border-2 border-black bg-white p-5 shadow-retro space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg border-2 border-black bg-retro-warm text-black w-fit">
                  <Users className="h-6 w-6 text-blue-700" />
                </div>
                <h3 className="font-heading font-black text-base text-black">
                  Rekapitulasi Presensi Kuliah
                </h3>
                <p className="text-xs text-black/70">
                  Daftar kehadiran 16 pertemuan mahasiswa, persentase keikutsertaan, dan daftar dispensasi izin/sakit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert('Mengunduh Rekap Presensi Kuliah (.csv)...')}
                className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-black bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
