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
import { resolveExamDisputeAction } from './quiz-actions';

export const LECTURER_ANALYTICS_TABS = [
  { id: 'kelas', label: 'Analitik Kelas', icon: BarChart3 },
  { id: 'butir-soal', label: 'Analisis Butir Soal', icon: HelpCircle },
  { id: 'rekap-nilai', label: 'Rekap Nilai', icon: Award },
  { id: 'keberatan-nilai', label: 'Keberatan Nilai', icon: AlertCircle },
  { id: 'perubahan-nilai', label: 'Perubahan Nilai', icon: Clock },
  { id: 'ekspor', label: 'Ekspor Laporan', icon: Download },
] as const;

export type LecturerAnalyticsTabId = (typeof LECTURER_ANALYTICS_TABS)[number]['id'];

interface LecturerAnalyticsHubViewProps {
  classes: any[];
  changeRequests?: any[];
  disputes?: any[];
  isDemo?: boolean;
}

export function LecturerAnalyticsHubView({
  classes,
  changeRequests = [],
  disputes = [],
  isDemo = true,
}: LecturerAnalyticsHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as LecturerAnalyticsTabId;
  const validTabs: LecturerAnalyticsTabId[] = [
    'kelas',
    'butir-soal',
    'rekap-nilai',
    'keberatan-nilai',
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

  const [localDisputes, setLocalDisputes] = useState(
    disputes.length > 0
      ? disputes
      : isDemo
      ? [
          {
            id: 'disp-demo-1',
            student_name: 'Wahyu Hidayat (Mahasiswa)',
            exam_title: 'UTS Praktikum Web & Algoritma',
            reason: 'Jawaban soal live coding nomor 3 telah memenuhi seluruh test case tersembunyi, namun autograder hanya mendeteksi 2/4 test case karena timeout koneksi.',
            status: 'PENDING',
            submitted_at: '2026-10-09T08:30:00Z',
          },
          {
            id: 'disp-demo-2',
            student_name: 'Rian Hidayat (2024018)',
            exam_title: 'Kuis Evaluasi Algoritma Sorting',
            reason: 'Rubrik esai nomor 4 mencantumkan penjelasan konkurensi dengan tepat pada paragraf kedua.',
            status: 'PENDING',
            submitted_at: '2026-10-08T14:15:00Z',
          },
        ]
      : []
  );

  // In-app Neo-Brutalist Modal State untuk Tanggapan Keberatan Nilai (Ganti prompt/alert - Bagian A3e)
  const [disputeModalState, setDisputeModalState] = useState<{
    isOpen: boolean;
    dispute: any | null;
    status: 'APPROVED' | 'REJECTED';
    note: string;
    scoreAdjustment: number;
    error: string | null;
  }>({
    isOpen: false,
    dispute: null,
    status: 'APPROVED',
    note: '',
    scoreAdjustment: 10,
    error: null,
  });

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  const openDisputeModal = (dispute: any, status: 'APPROVED' | 'REJECTED') => {
    if (!isDemo) {
      setToastMessage({
        type: 'info',
        text: 'Penyelesaian keberatan nilai ke database permanen sedang dalam penyiapan Fase 3.',
      });
      return;
    }
    setDisputeModalState({
      isOpen: true,
      dispute,
      status,
      note: status === 'APPROVED' ? 'Disetujui setelah verifikasi rekaman dan rubrik jawaban esai.' : 'Bukti jawaban tidak memenuhi kriteria penambahan nilai.',
      scoreAdjustment: 10,
      error: null,
    });
  };

  const closeDisputeModal = () => {
    setDisputeModalState({
      isOpen: false,
      dispute: null,
      status: 'APPROVED',
      note: '',
      scoreAdjustment: 10,
      error: null,
    });
  };

  const handleConfirmDispute = () => {
    if (!disputeModalState.dispute) return;
    const cleanNote = disputeModalState.note.trim();
    if (cleanNote.length < 10) {
      setDisputeModalState((prev) => ({
        ...prev,
        error: 'Catatan atau alasan tanggapan wajib diisi minimal 10 karakter.',
      }));
      return;
    }

    const { dispute, status, scoreAdjustment } = disputeModalState;
    startTransition(async () => {
      await resolveExamDisputeAction({
        dispute_id: dispute.id,
        status,
        lecturer_note: cleanNote,
        score_adjustment: status === 'APPROVED' ? Number(scoreAdjustment) : 0,
      }).catch(() => {});

      setLocalDisputes((prev) =>
        prev.map((d) => (d.id === dispute.id ? { ...d, status, lecturer_note: cleanNote } : d))
      );
      closeDisputeModal();
      setToastMessage({
        type: 'success',
        text: `Keberatan nilai mahasiswa berhasil ditanggapi dengan status ${status}.`,
      });
    });
  };

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
    setFormError(null);
    if (!newScore || Number(newScore) < 0 || Number(newScore) > 100) {
      setFormError('Masukkan nilai baru antara rentang 0 dan 100.');
      return;
    }
    if (changeReason.trim().length < 10) {
      setFormError('Alasan pengajuan perubahan nilai wajib minimal 10 karakter.');
      return;
    }

    startTransition(async () => {
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
      setToastMessage({
        type: 'success',
        text: 'Pengajuan perubahan nilai berhasil dikirim ke Koordinator Program Studi untuk diverifikasi.',
      });
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
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
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
                  ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
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
              <span className="text-xs text-primary font-bold flex items-center gap-1">
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
                        <span className={cn('px-2.5 py-0.5 rounded border border-black font-mono text-xs font-bold', row.color)}>
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
              onClick={() => setToastMessage({ type: 'info', text: 'Mengunduh format rekap nilai Excel (.xlsx)...' })}
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

      {/* 4. TAB 4: KEBERATAN NILAI (DOSEN MENANGGAPI MAHASISWA) */}
      {activeTab === 'keberatan-nilai' && (
        <div className="space-y-6">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <span>Kotak Masuk Keberatan Nilai Mahasiswa ({localDisputes.length})</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Tinjau sanggahan nilai ujian dan kuis dari mahasiswa. Berikan tanggapan persetujuan atau penolakan dengan alasan yang dapat dipertanggungjawabkan.
              </p>
            </div>
            {!isDemo && (
              <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-100 border border-amber-500 text-amber-950 rounded-lg shrink-0">
                Mode Non-Demo (Segera Aktif Fase 3)
              </span>
            )}
          </div>

          {!isDemo && (
            <div className="p-4 rounded-xl border-2 border-black bg-amber-50 space-y-1">
              <p className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-900" />
                <span>Pemberitahuan Persistensi Database (Fase 3)</span>
              </p>
              <p className="text-xs text-amber-900 leading-relaxed">
                Penyimpanan tanggapan keberatan nilai ke database Supabase sedang dalam penyiapan. Di luar mode demo, tombol tanggapan dinonaktifkan untuk mencegah sukses palsu.
              </p>
            </div>
          )}

          {localDisputes.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <CheckCircle2 className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-black">Tidak Ada Keberatan Nilai</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Saat ini tidak ada sanggahan atau keberatan penilaian yang diajukan oleh mahasiswa untuk kelas yang Anda ampu.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                    <tr>
                      <th className="p-3.5 sm:p-4">Mahasiswa</th>
                      <th className="p-3.5 sm:p-4">Sesi Evaluasi</th>
                      <th className="p-3.5 sm:p-4">Alasan Keberatan</th>
                      <th className="p-3.5 sm:p-4 text-center">Status</th>
                      <th className="p-3.5 sm:p-4 text-center">Aksi Tanggapi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 font-medium">
                    {localDisputes.map((d) => (
                      <tr key={d.id} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          {d.student_name}
                        </td>
                        <td className="p-3.5 sm:p-4 text-black font-semibold">
                          {d.exam_title || 'Ujian Terkait'}
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/80 max-w-sm">
                          <div>{d.reason}</div>
                          {d.lecturer_note && (
                            <div className="text-xs font-mono text-emerald-900 mt-1 bg-emerald-50 p-1.5 rounded border border-emerald-300">
                              Tanggapan Dosen: {d.lecturer_note}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded border text-xs font-mono font-bold',
                              d.status === 'APPROVED'
                                ? 'border-emerald-500 bg-emerald-100 text-emerald-950'
                                : d.status === 'REJECTED'
                                ? 'border-rose-500 bg-rose-100 text-rose-950'
                                : 'border-amber-500 bg-amber-100 text-amber-950'
                            )}
                          >
                            {d.status === 'APPROVED' ? 'DITERIMA' : d.status === 'REJECTED' ? 'DITOLAK' : 'MENUNGGU'}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          {d.status === 'PENDING' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={isPending || !isDemo}
                                onClick={() => openDisputeModal(d, 'APPROVED')}
                                className={cn(
                                  'px-2.5 py-1 rounded-lg border-2 border-black text-xs font-bold transition-all shadow-xs',
                                  isDemo
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer'
                                    : 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                                )}
                                title={!isDemo ? 'Segera aktif di Fase 3' : 'Terima Keberatan'}
                              >
                                Terima
                              </button>
                              <button
                                type="button"
                                disabled={isPending || !isDemo}
                                onClick={() => openDisputeModal(d, 'REJECTED')}
                                className={cn(
                                  'px-2.5 py-1 rounded-lg border-2 border-black text-xs font-bold transition-all shadow-xs',
                                  isDemo
                                    ? 'bg-rose-500 text-white hover:bg-rose-600 cursor-pointer'
                                    : 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                                )}
                                title={!isDemo ? 'Segera aktif di Fase 3' : 'Tolak Keberatan'}
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-mono text-black/60">Selesai Ditanggapi</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 5: PERUBAHAN NILAI (DOSEN MENGAJUKAN KE PRODI) */}
      {activeTab === 'perubahan-nilai' && (
        <div className="space-y-6">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl">
            <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
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

              {formError && (
                <div className="p-3 bg-rose-50 border-2 border-rose-500 rounded-lg text-rose-950 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-black font-mono">Nilai Lama</label>
                    <span className="text-xs font-mono font-bold text-neutral-600 bg-neutral-200 px-1.5 py-0.5 rounded border border-black/20">Server Read-Only</span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={`${oldScore} (Otomatis dari Sistem)`}
                    className="w-full rounded-lg border-2 border-black p-2.5 text-xs font-mono font-bold bg-neutral-200 text-neutral-700 cursor-not-allowed select-none"
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
                          <div className="text-xs font-normal text-black/60 font-mono">{r.assignment_title}</div>
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
                              'px-2 py-0.5 rounded border text-xs font-mono font-bold',
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
              <Download className="h-5 w-5 text-primary" />
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
                onClick={() => setToastMessage({ type: 'info', text: 'Mengunduh Format Rekap Nilai Excel PDDIKTI (.xlsx)...' })}
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
                onClick={() => setToastMessage({ type: 'info', text: 'Mencetak Berita Acara Ujian Resmi (.pdf)...' })}
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
                onClick={() => setToastMessage({ type: 'info', text: 'Mengunduh Rekap Presensi Kuliah (.csv)...' })}
                className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-black bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFIKASI IN-APP (Ganti alert bawaan) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in">
          <div
            className={cn(
              'p-4 rounded-xl border-2 border-black shadow-retro flex items-start gap-3',
              toastMessage.type === 'success'
                ? 'bg-emerald-100 text-emerald-950'
                : toastMessage.type === 'error'
                ? 'bg-rose-100 text-rose-950'
                : 'bg-retro-warm text-black'
            )}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-bold leading-relaxed">{toastMessage.text}</div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-black/10 rounded font-mono font-bold text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* MODAL IN-APP TANGGAPAN KEBERATAN NILAI (Ganti window.prompt & alert) */}
      {disputeModalState.isOpen && disputeModalState.dispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg">
            <RetroWindow
              title={`tanggapan_keberatan_${disputeModalState.status === 'APPROVED' ? 'terima' : 'tolak'}.app`}
              badge={disputeModalState.status === 'APPROVED' ? 'Terima Keberatan' : 'Tolak Keberatan'}
              headerClassName={disputeModalState.status === 'APPROVED' ? 'bg-emerald-300' : 'bg-rose-300'}
              bodyClassName="p-5 sm:p-6 bg-white space-y-4"
            >
              <div className="space-y-3">
                <div className="p-3 bg-neutral-100 rounded-lg border-2 border-black text-xs space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="font-bold text-black">{disputeModalState.dispute.student_name}</span>
                    <span className="font-mono text-black/60">{disputeModalState.dispute.exam_title}</span>
                  </div>
                  <div className="text-xs text-black/80 italic border-t border-black/20 pt-1">
                    Keluhan Mahasiswa: &ldquo;{disputeModalState.dispute.reason}&rdquo;
                  </div>
                </div>

                {disputeModalState.status === 'APPROVED' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-black font-mono">
                      Penyesuaian Penambahan Skor Nilai (Poin)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={disputeModalState.scoreAdjustment}
                      onChange={(e) => setDisputeModalState((prev) => ({ ...prev, scoreAdjustment: Number(e.target.value) }))}
                      className="w-full rounded-lg border-2 border-black p-2.5 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                )}

                {disputeModalState.error && (
                  <div className="p-3 bg-rose-50 border-2 border-rose-500 rounded-lg text-rose-950 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{disputeModalState.error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase text-black font-mono">
                      {disputeModalState.status === 'APPROVED' ? 'Catatan Persetujuan Dosen' : 'Alasan Penolakan Dosen (Wajib)'}
                    </label>
                    <span className={cn(
                      'text-xs font-mono font-bold',
                      disputeModalState.note.trim().length >= 10 ? 'text-emerald-700' : 'text-rose-600'
                    )}>
                      {disputeModalState.note.trim().length}/10 Karakter
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={disputeModalState.note}
                    onChange={(e) => setDisputeModalState((prev) => ({ ...prev, note: e.target.value, error: null }))}
                    placeholder="Tuliskan catatan verifikasi (minimal 10 karakter)..."
                    className="w-full rounded-lg border-2 border-black p-2.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t-2 border-black">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={closeDisputeModal}
                    className="px-4 py-2 rounded-lg border-2 border-black bg-neutral-200 text-black text-xs font-bold hover:bg-neutral-300 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isPending || disputeModalState.note.trim().length < 10}
                    onClick={handleConfirmDispute}
                    className={cn(
                      'px-4 py-2 rounded-lg border-2 border-black text-white text-xs font-black shadow-retro transition-all cursor-pointer flex items-center gap-1.5',
                      disputeModalState.status === 'APPROVED'
                        ? 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50'
                        : 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50'
                    )}
                  >
                    {isPending ? 'Menyimpan...' : disputeModalState.status === 'APPROVED' ? 'Konfirmasi Terima' : 'Konfirmasi Tolak'}
                  </button>
                </div>
              </div>
            </RetroWindow>
          </div>
        </div>
      )}
    </div>
  );
}
