'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  Clock,
  ShieldAlert,
  Play,
  PlusCircle,
  Users,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileCheck,
  Activity,
  UserX,
  Plus,
  Send,
  Eye,
  ArrowRight,
  Shield,
  Laptop,
  Flame,
  X,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';
import { lecturerInterventionAction } from './quiz-actions';

export const LECTURER_EXAM_TABS = [
  { id: 'daftar', label: 'Daftar & Buat Ujian', icon: Award },
  { id: 'live', label: 'Panel Live Proctoring', icon: Activity },
  { id: 'pelanggaran', label: 'Log Pelanggaran', icon: ShieldAlert },
] as const;

export type LecturerExamTabId = (typeof LECTURER_EXAM_TABS)[number]['id'];

interface LecturerExamsHubViewProps {
  quizzes: any[];
  liveData?: any;
  isDemo?: boolean;
}

export function LecturerExamsHubView({
  quizzes,
  liveData,
  isDemo = true,
}: LecturerExamsHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as LecturerExamTabId;
  const validTabs: LecturerExamTabId[] = ['daftar', 'live', 'pelanggaran'];
  const activeTab: LecturerExamTabId = validTabs.includes(tabParam) ? tabParam : 'daftar';

  const setTab = (tab: LecturerExamTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/exams?${params.toString()}`);
  };

  const [selectedExamId, setSelectedExamId] = useState<string>(quizzes[0]?.id || '');
  const [isPending, startTransition] = useTransition();

  // Demo active students in live proctoring if real live telemetry is empty
  const [liveStudents, setLiveStudents] = useState([
    {
      student_id: 'mhs-101',
      student_name: 'Ahmad Fauzi (2024001)',
      status: 'IN_PROGRESS',
      progress_percent: 65,
      answered_count: 10,
      total_questions: 15,
      time_left_seconds: 2450,
      violations_count: 0,
      last_event: 'Mengetik fungsi algoritma di sandbox kode',
    },
    {
      student_id: 'mhs-102',
      student_name: 'Rian Hidayat (2024018)',
      status: 'IN_PROGRESS',
      progress_percent: 40,
      answered_count: 6,
      total_questions: 15,
      time_left_seconds: 1980,
      violations_count: 2,
      last_event: 'Peringatan: Jendela beralih (blur) 2x',
    },
    {
      student_id: 'mhs-103',
      student_name: 'Siti Rahma (2024025)',
      status: 'IN_PROGRESS',
      progress_percent: 85,
      answered_count: 13,
      total_questions: 15,
      time_left_seconds: 1200,
      violations_count: 0,
      last_event: 'Menjawab soal essay arsitektur sistem',
    },
    {
      student_id: 'mhs-104',
      student_name: 'Dimas Aditya (2024039)',
      status: 'SUBMITTED',
      progress_percent: 100,
      answered_count: 15,
      total_questions: 15,
      time_left_seconds: 0,
      violations_count: 1,
      last_event: 'Telah submit jawaban akhir',
    },
  ]);

  const [violationsLog, setViolationsLog] = useState([
    {
      id: 'v-1',
      student_name: 'Rian Hidayat (2024018)',
      exam_title: quizzes[0]?.title || 'UTS Praktikum Web Lanjut',
      event_type: 'WINDOW_BLUR',
      details: 'Jendela ujian kehilangan fokus selama 5 detik',
      time: '10 menit lalu',
      severity: 'WARNING',
    },
    {
      id: 'v-2',
      student_name: 'Rian Hidayat (2024018)',
      exam_title: quizzes[0]?.title || 'UTS Praktikum Web Lanjut',
      event_type: 'EXIT_FULLSCREEN',
      details: 'Keluar dari mode layar penuh proctoring',
      time: '4 menit lalu',
      severity: 'CRITICAL',
    },
    {
      id: 'v-3',
      student_name: 'Dimas Aditya (2024039)',
      exam_title: quizzes[0]?.title || 'UTS Praktikum Web Lanjut',
      event_type: 'TAB_SWITCH',
      details: 'Mencoba berpindah tab peramban saat pengerjaan',
      time: '25 menit lalu',
      severity: 'WARNING',
    },
  ]);

  const [interventionsLog, setInterventionsLog] = useState([
    {
      id: 'int-1',
      actor_name: 'Dr. Budi Santoso, M.Kom.',
      student_name: 'Rian Hidayat (2024018)',
      exam_title: quizzes[0]?.title || 'UTS Praktikum Web Lanjut',
      subtype: 'ADD_TIME',
      reason: 'Kompensasi kendala jaringan internet saat pengerjaan',
      value_before: '15 menit tersisa',
      value_after: '25 menit tersisa (+10 menit)',
      time: '8 menit lalu',
    },
    {
      id: 'int-2',
      actor_name: 'Dr. Budi Santoso, M.Kom.',
      student_name: 'Rian Hidayat (2024018)',
      exam_title: quizzes[0]?.title || 'UTS Praktikum Web Lanjut',
      subtype: 'WARN',
      reason: 'Peringatan pertama fokus jendela browser terlepas',
      value_before: 'Tidak ada peringatan',
      value_after: 'Peringatan aktif terkirim',
      time: '12 menit lalu',
    },
  ]);

  // In-App Retro Modal State
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    action: 'WARN' | 'ADD_TIME' | 'TERMINATE';
    reason: string;
    value: number;
    error?: string;
  } | null>(null);

  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const openInterventionModal = (studentId: string, action: 'WARN' | 'ADD_TIME' | 'TERMINATE') => {
    const student = liveStudents.find((s) => s.student_id === studentId);
    const defaultReason =
      action === 'WARN'
        ? 'Terdeteksi beralih jendela/tab peramban saat pengerjaan'
        : action === 'ADD_TIME'
        ? 'Kompensasi kendala jaringan internet saat pengerjaan'
        : 'Pelanggaran berat integritas akademik saat ujian';

    setModalData({
      isOpen: true,
      studentId,
      studentName: student?.student_name ?? 'Mahasiswa',
      action,
      reason: defaultReason,
      value: 10,
    });
  };

  const handleConfirmIntervention = () => {
    if (!modalData) return;
    const { studentId, studentName, action, reason, value } = modalData;

    if (!isDemo) {
      setToastNotification({
        type: 'error',
        message: 'Pemberitahuan: Intervensi ujian live proctoring ke database permanen sedang dalam penyiapan Fase 3.',
      });
      setModalData(null);
      return;
    }

    if (!reason || reason.trim().length < 3) {
      setModalData((prev) => (prev ? { ...prev, error: 'Alasan intervensi wajib diisi minimal 3 karakter.' } : null));
      return;
    }

    startTransition(async () => {
      const res = await lecturerInterventionAction({
        exam_id: selectedExamId,
        student_id: studentId,
        action_type: action,
        reason: reason.trim(),
        value: action === 'ADD_TIME' ? value : reason.trim(),
      });

      if (res.ok) {
        let valBefore = '';
        let valAfter = '';

        if (action === 'ADD_TIME') {
          const target = liveStudents.find((s) => s.student_id === studentId);
          valBefore = `${Math.round((target?.time_left_seconds || 0) / 60)} menit tersisa`;
          valAfter = `${Math.round(((target?.time_left_seconds || 0) + value * 60) / 60)} menit tersisa (+${value} mnt)`;

          setLiveStudents((prev) =>
            prev.map((s) =>
              s.student_id === studentId ? { ...s, time_left_seconds: s.time_left_seconds + value * 60 } : s
            )
          );
        } else if (action === 'TERMINATE') {
          valBefore = 'IN_PROGRESS';
          valAfter = 'TERMINATED (Didiskualifikasi)';
          setLiveStudents((prev) =>
            prev.map((s) => (s.student_id === studentId ? { ...s, status: 'TERMINATED' } : s))
          );
        } else {
          valBefore = 'Tidak ada peringatan';
          valAfter = reason.trim();
        }

        // Catat ke log intervensi dosen tersendiri
        setInterventionsLog((prev) => [
          {
            id: `int-${Date.now()}`,
            actor_name: 'Dosen Pengampu',
            student_name: studentName,
            exam_title: quizzes.find((q) => q.id === selectedExamId)?.title || 'Sesi Ujian',
            subtype: action,
            reason: reason.trim(),
            value_before: valBefore,
            value_after: valAfter,
            time: 'Baru saja',
          },
          ...prev,
        ]);

        setToastNotification({
          type: 'success',
          message: `Tindakan ${action} pada ${studentName} berhasil dieksekusi dan dicatat di Audit Log sistem.`,
        });
        setModalData(null);
      } else {
        setModalData((prev) => (prev ? { ...prev, error: res.error || 'Gagal mengeksekusi intervensi.' } : null));
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      {/* 1. HEADER WINDOW RETRO DOSEN */}
      <RetroWindow
        title="manajemen_dan_monitoring_ujian_dosen.app"
        badge="Portal Dosen Pengampu"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-white text-black shadow-retro-sm">
                <Award className="h-6 w-6 text-black" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-black">
                Pusat Evaluasi & Proctoring Ujian
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-3xl leading-relaxed">
              Kelola lembar ujian CBT, pantau aktivitas mahasiswa secara langsung dengan telemetri anti-curang, dan tindak lanjuti log pelanggaran integritas akademik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/exams/question-bank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-black bg-white hover:bg-black hover:text-white text-black text-xs sm:text-sm font-bold shadow-retro-sm transition-all"
            >
              <Database className="h-4 w-4" />
              <span>Bank Soal</span>
            </Link>
            <Link
              href="/exams/review"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-black bg-white hover:bg-black hover:text-white text-black text-xs sm:text-sm font-bold shadow-retro-sm transition-all"
            >
              <FileCheck className="h-4 w-4" />
              <span>Periksa Jawaban</span>
            </Link>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB CONTROLLER DOSEN */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {LECTURER_EXAM_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0',
                isSelected
                  ? 'bg-black text-white shadow-retro'
                  : 'bg-white text-black hover:bg-gray-soft shadow-retro-sm'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: DAFTAR & BUAT UJIAN */}
      {activeTab === 'daftar' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading font-black text-lg sm:text-xl text-black">
                Daftar Sesi Ujian dan Terjadwal ({quizzes.length})
              </h2>
              <p className="text-xs text-black/70 font-medium">
                Pilih sesi ujian untuk memantau pengerjaan secara langsung atau membuat paket soal baru.
              </p>
            </div>
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black bg-black text-white text-xs sm:text-sm font-bold shadow-retro hover:bg-neutral-800 transition-all shrink-0 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Buat Ujian di Kelas &rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl border-2 border-black bg-white p-5 shadow-retro hover:-translate-y-0.5 transition-transform flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded border-2 border-black bg-gray-soft text-xs font-mono font-bold text-black shadow-retro-sm">
                      {q.exam_type ?? 'KUIS'}
                    </span>
                    <span className="text-xs font-mono font-bold flex items-center gap-1 text-black">
                      <Clock className="h-3.5 w-3.5 text-black" />
                      {q.duration_minutes} Menit
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-base sm:text-lg text-black leading-snug line-clamp-2">
                    {q.title}
                  </h3>

                  <p className="text-xs text-black/75 line-clamp-2 font-medium">
                    {q.description || 'Tidak ada deskripsi tambahan.'}
                  </p>

                  <div className="pt-2 border-t-2 border-black/10 flex items-center justify-between text-xs font-mono font-bold text-black">
                    <span>KKM: {q.kkm ?? 70}</span>
                    <span className="px-2 py-0.5 rounded border border-black bg-gray-soft">
                      Proctor: {q.proctoring_level ?? 'STANDARD'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-black flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExamId(q.id);
                      setTab('live');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border-2 border-black bg-black text-white text-xs font-bold shadow-retro-sm hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>Panel Live</span>
                  </button>
                  <Link
                    href={`/classes/${q.class_id}/quizzes/${q.id}`}
                    className="px-3 py-2 rounded-xl border-2 border-black bg-white text-black text-xs font-bold hover:bg-gray-soft shadow-retro-sm"
                    title="Buka Lembar Soal"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB 2: PANEL LIVE PROCTORING */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {/* Header Kontrol Live */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-black bg-white shadow-retro flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-black"></span>
              </span>
              <div>
                <h3 className="font-heading font-black text-base text-black">
                  Live Proctoring Monitor ({liveStudents.filter((s) => s.status === 'IN_PROGRESS').length} Sedang Mengerjakan)
                </h3>
                <p className="text-xs text-black/70 font-medium">
                  Telemetri pengerjaan real-time dengan append-only event stream anti-curang.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-mono font-bold text-black">Pilih Ujian:</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border-2 border-black text-xs font-bold bg-white text-black shadow-retro-sm cursor-pointer"
              >
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid Mahasiswa Sedang Ujian */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {liveStudents.map((st) => (
              <div
                key={st.student_id}
                className={cn(
                  'rounded-2xl border-2 border-black p-5 shadow-retro space-y-4 transition-all',
                  st.status === 'TERMINATED'
                    ? 'bg-gray-soft border-black'
                    : st.violations_count > 0
                    ? 'bg-gray-soft/60 border-black'
                    : 'bg-white'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-heading font-black text-base text-black">
                      {st.student_name}
                    </h4>
                    <p className="text-xs text-black/70 font-sans mt-0.5">
                      {st.last_event}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-mono font-bold px-2.5 py-0.5 rounded border-2 border-black shadow-retro-sm',
                      st.status === 'IN_PROGRESS'
                        ? 'bg-black text-white'
                        : st.status === 'SUBMITTED'
                        ? 'bg-white text-black'
                        : 'bg-gray-soft text-black'
                    )}
                  >
                    {st.status}
                  </span>
                </div>

                {/* Progress Bar & Sisa Waktu */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono font-bold text-black">
                    <span>
                      Soal {st.answered_count}/{st.total_questions} ({st.progress_percent}%)
                    </span>
                    <span>
                      {Math.floor(st.time_left_seconds / 60)}m {st.time_left_seconds % 60}s tersisa
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full border-2 border-black bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-300"
                      style={{ width: `${st.progress_percent}%` }}
                    />
                  </div>
                </div>

                {/* Pelanggaran Badge */}
                {st.violations_count > 0 && (
                  <div className="p-2.5 rounded-xl border-2 border-black bg-gray-soft flex items-center gap-2 text-xs font-bold text-black shadow-retro-sm">
                    <AlertTriangle className="h-4 w-4 text-black shrink-0" />
                    <span>Terdeteksi {st.violations_count} Pelanggaran Pengawasan</span>
                  </div>
                )}

                {/* Aksi Intervensi Dosen */}
                {st.status === 'IN_PROGRESS' && (
                  <div className="pt-3 border-t-2 border-black/10 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openInterventionModal(st.student_id, 'WARN')}
                      className="px-3 py-1.5 rounded-xl border-2 border-black bg-gray-soft text-black text-xs font-bold hover:bg-neutral-300 transition-all cursor-pointer shadow-retro-sm"
                    >
                      Beri Peringatan
                    </button>
                    <button
                      type="button"
                      onClick={() => openInterventionModal(st.student_id, 'ADD_TIME')}
                      className="px-3 py-1.5 rounded-xl border-2 border-black bg-white text-black text-xs font-bold hover:bg-gray-soft transition-all cursor-pointer shadow-retro-sm"
                    >
                      +10 Menit
                    </button>
                    <button
                      type="button"
                      onClick={() => openInterventionModal(st.student_id, 'TERMINATE')}
                      className="px-3 py-1.5 rounded-xl border-2 border-black bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer ml-auto shadow-retro-sm"
                    >
                      Diskualifikasi
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB 3: LOG PELANGGARAN PROCTORING & INTERVENSI DOSEN */}
      {activeTab === 'pelanggaran' && (
        <div className="space-y-8">
          {/* BAGIAN 1: LOG PELANGGARAN MAHASISWA */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-soft border-2 border-black rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-retro-sm">
              <div>
                <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-black" />
                  <span>Log Pelanggaran Mahasiswa (Proctoring Telemetry) ({violationsLog.length})</span>
                </h2>
                <p className="text-xs text-black/70 font-medium">
                  Data anomali integritas otomatis: fokus layar hilang (blur), perpindahan tab, atau keluar fullscreen.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded border-2 border-black bg-white text-black shrink-0 shadow-retro-sm">
                Immutable Stream
              </span>
            </div>

            <div className="rounded-2xl border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                    <tr>
                      <th className="p-3.5 sm:p-4">Mahasiswa</th>
                      <th className="p-3.5 sm:p-4">Sesi Ujian</th>
                      <th className="p-3.5 sm:p-4">Tipe Anomali</th>
                      <th className="p-3.5 sm:p-4">Detail Telemetri</th>
                      <th className="p-3.5 sm:p-4 text-center">Tingkat Bahaya</th>
                      <th className="p-3.5 sm:p-4">Waktu Terdeteksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 font-medium">
                    {violationsLog.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-soft/40 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">{v.student_name}</td>
                        <td className="p-3.5 sm:p-4 text-black/80 font-sans">{v.exam_title}</td>
                        <td className="p-3.5 sm:p-4">
                          <span className="px-2 py-0.5 rounded border border-black bg-gray-soft font-mono text-xs font-bold text-black">
                            {v.event_type}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/85">{v.details}</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded border-2 border-black text-xs font-mono font-bold shadow-retro-sm',
                              v.severity === 'CRITICAL'
                                ? 'bg-black text-white'
                                : 'bg-gray-soft text-black'
                            )}
                          >
                            {v.severity}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-mono text-xs text-black/70">{v.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: LOG INTERVENSI PENGAWAS / DOSEN (TERPISAH) */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-soft/60 border-2 border-black rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-retro-sm">
              <div>
                <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                  <Activity className="h-5 w-5 text-black" />
                  <span>Log Intervensi Pengawas & Dosen ({interventionsLog.length})</span>
                </h2>
                <p className="text-xs text-black/70 font-medium">
                  Riwayat tindakan pengawas: penambahan waktu (+mnt), peringatan langsung, dan diskualifikasi sesi.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded border-2 border-black bg-white text-black shrink-0 shadow-retro-sm">
                Log Audit
              </span>
            </div>

            <div className="rounded-2xl border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                    <tr>
                      <th className="p-3.5 sm:p-4">Waktu</th>
                      <th className="p-3.5 sm:p-4">Pengawas / Dosen</th>
                      <th className="p-3.5 sm:p-4">Mahasiswa Sasaran</th>
                      <th className="p-3.5 sm:p-4">Tindakan Intervensi</th>
                      <th className="p-3.5 sm:p-4">Alasan Tindakan</th>
                      <th className="p-3.5 sm:p-4">Nilai Sebelum & Sesudah</th>
                      <th className="p-3.5 sm:p-4 text-center">Status Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 font-medium">
                    {interventionsLog.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-soft/40 transition-colors">
                        <td className="p-3.5 sm:p-4 font-mono text-xs text-black/70">{item.time}</td>
                        <td className="p-3.5 sm:p-4 font-bold text-black">{item.actor_name}</td>
                        <td className="p-3.5 sm:p-4 text-black font-medium">{item.student_name}</td>
                        <td className="p-3.5 sm:p-4">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded border-2 border-black font-mono text-xs font-bold shadow-retro-sm',
                              item.subtype === 'ADD_TIME'
                                ? 'bg-white text-black'
                                : item.subtype === 'WARN'
                                ? 'bg-gray-soft text-black'
                                : 'bg-black text-white'
                            )}
                          >
                            {item.subtype === 'ADD_TIME'
                              ? '+TAMBAH WAKTU'
                              : item.subtype === 'WARN'
                              ? 'PERINGATAN'
                              : 'DISKUALIFIKASI'}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/80 max-w-xs">{item.reason}</td>
                        <td className="p-3.5 sm:p-4 font-mono text-xs text-black/70">
                          <div>
                            <span className="text-black/50">Sebelum:</span> {item.value_before}
                          </div>
                          <div>
                            <span className="text-black/50">Sesudah:</span> <strong className="text-black">{item.value_after}</strong>
                          </div>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-2 py-0.5 rounded border border-black bg-neutral-100 text-xs font-mono font-bold">
                            RECORDED
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

      {/* TOAST NOTIFIKASI IN-APP RETRO */}
      {toastNotification && (
        <div className="fixed bottom-[calc(var(--mobile-nav-h,3.5rem)+env(safe-area-inset-bottom,0px)+1rem)] md:bottom-6 right-4 sm:right-6 z-50 max-w-md animate-fade-in">
          <div className="p-4 rounded-xl border-2 border-black bg-white text-black shadow-retro flex items-center justify-between gap-3">
            <p className="text-xs sm:text-sm font-bold">{toastNotification.message}</p>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="text-xs font-mono font-bold px-2 py-0.5 border border-black rounded bg-gray-soft hover:bg-neutral-200 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL IN-APP RETRO INTERVENSI PENGAWAS */}
      {modalData && modalData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-black bg-white p-6 shadow-retro-window space-y-4 animate-scale-in font-sans">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-black bg-black inline-block" />
                <span className="h-3 w-3 rounded-full border border-black bg-white inline-block" />
                <h3 className="font-heading font-black text-lg text-black ml-1 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-black" />
                  <span>Konfirmasi Tindakan Pengawas</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalData(null)}
                className="p-1 rounded-lg hover:bg-gray-soft text-black cursor-pointer"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-soft rounded-xl border-2 border-black space-y-1 shadow-retro-sm">
                <p>
                  <span className="text-black/70 font-mono">Mahasiswa Sasaran:</span>{' '}
                  <strong className="text-black text-sm">{modalData.studentName}</strong>
                </p>
                <p>
                  <span className="text-black/70 font-mono">Jenis Tindakan:</span>{' '}
                  <span className="font-mono font-bold text-black uppercase">
                    {modalData.action === 'WARN'
                      ? 'Peringatan Pelanggaran'
                      : modalData.action === 'ADD_TIME'
                      ? 'Penambahan Waktu (+10 Menit)'
                      : 'Diskualifikasi Ujian'}
                  </span>
                </p>
              </div>

              {modalData.action === 'ADD_TIME' && (
                <div className="space-y-1">
                  <label className="font-mono font-bold text-black block uppercase text-[11px]">Durasi Tambahan (Menit):</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={modalData.value}
                    onChange={(e) =>
                      setModalData((prev) => (prev ? { ...prev, value: Number(e.target.value) || 10 } : null))
                    }
                    className="w-full px-3 py-2 rounded-xl border-2 border-black bg-white font-mono text-sm font-bold"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-mono font-bold text-black block uppercase text-[11px]">
                  Alasan Intervensi (Wajib Dicatat ke Audit Log):
                </label>
                <textarea
                  rows={3}
                  value={modalData.reason}
                  onChange={(e) =>
                    setModalData((prev) => (prev ? { ...prev, reason: e.target.value, error: undefined } : null))
                  }
                  placeholder="Masukkan alasan intervensi pengawas secara objektif..."
                  className="w-full p-2.5 rounded-xl border-2 border-black bg-white font-medium text-xs resize-none"
                />
              </div>

              {modalData.error && (
                <p className="text-black font-bold font-mono text-xs bg-gray-soft p-2 rounded border border-black">{modalData.error}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black/10">
              <button
                type="button"
                onClick={() => setModalData(null)}
                className="px-4 py-2 rounded-xl border-2 border-black bg-white hover:bg-gray-soft text-black text-xs font-bold cursor-pointer shadow-retro-sm"
              >
                Batalkan
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmIntervention}
                className="px-4 py-2 rounded-xl border-2 border-black bg-black text-white text-xs font-bold shadow-retro hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                {isPending ? 'Menyimpan...' : 'Eksekusi & Catat Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
