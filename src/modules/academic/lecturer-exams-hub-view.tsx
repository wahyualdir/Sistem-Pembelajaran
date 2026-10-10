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
  const [warningMessage, setWarningMessage] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

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
      event_type: 'FULLSCREEN_EXIT',
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

  const handleIntervention = (studentId: string, action: 'WARN' | 'ADD_TIME' | 'TERMINATE') => {
    if (!isDemo) {
      alert('Pemberitahuan: Intervensi ujian live proctoring ke database permanen sedang dalam penyiapan Fase 3.');
      return;
    }
    const student = liveStudents.find((s) => s.student_id === studentId);
    const actionLabel = action === 'WARN' ? 'memberi peringatan kepada' : action === 'ADD_TIME' ? 'menambahkan 10 menit waktu untuk' : 'mendiskualifikasi ujian';
    if (!confirm(`Konfirmasi Tindakan Pengawas:\nApakah Anda yakin ingin ${actionLabel} ${student?.student_name ?? 'mahasiswa'}?`)) {
      return;
    }

    const defaultReason = action === 'WARN' ? 'Terdeteksi beralih jendela/tab peramban saat pengerjaan' : action === 'ADD_TIME' ? 'Kompensasi kendala jaringan internet saat pengerjaan' : 'Pelanggaran berat integritas akademik saat ujian';
    const reason = prompt(`Masukkan alasan intervensi ujian (wajib diisi, minimal 3 karakter):`, defaultReason);
    if (!reason || reason.trim().length < 3) {
      alert('Alasan intervensi wajib diisi minimal 3 karakter.');
      return;
    }

    startTransition(async () => {
      const res = await lecturerInterventionAction({
        exam_id: selectedExamId,
        student_id: studentId,
        action_type: action,
        reason: reason.trim(),
        value: action === 'ADD_TIME' ? 10 : reason.trim(),
      });
      if (res.ok) {
        if (action === 'ADD_TIME') {
          setLiveStudents((prev) =>
            prev.map((s) => (s.student_id === studentId ? { ...s, time_left_seconds: s.time_left_seconds + 600 } : s))
          );
        } else if (action === 'TERMINATE') {
          setLiveStudents((prev) =>
            prev.map((s) => (s.student_id === studentId ? { ...s, status: 'TERMINATED' } : s))
          );
        }
        alert(`Tindakan ${action} berhasil dieksekusi dan dicatat di Audit Log.`);
      } else {
        alert(res.error || 'Gagal mengeksekusi intervensi.');
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO DOSEN */}
      <RetroWindow
        title="manajemen_dan_monitoring_ujian_dosen.app"
        badge="Portal Dosen Pengampu"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-xs">
                <Award className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Pusat Evaluasi & Proctoring Ujian
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Kelola lembar ujian CBT, pantau aktivitas mahasiswa secara langsung dengan telemetri anti-curang, dan tindak lanjuti log pelanggaran integritas akademik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/exams/question-bank"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-black bg-white text-xs sm:text-sm font-bold shadow-xs hover:bg-neutral-100"
            >
              <Database className="h-4 w-4" />
              <span>Bank Soal</span>
            </Link>
            <Link
              href="/exams/review"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-black bg-white text-xs sm:text-sm font-bold shadow-xs hover:bg-neutral-100"
            >
              <FileCheck className="h-4 w-4" />
              <span>Review Essay & Coding</span>
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

      {/* 3. TAB 1: DAFTAR & BUAT UJIAN */}
      {activeTab === 'daftar' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading font-black text-lg text-black">
                Daftar Sesi Ujian Aktif & Terjadwal ({quizzes.length})
              </h2>
              <p className="text-xs text-black/70">
                Pilih sesi ujian untuk memantau pengerjaan secara langsung atau membuat paket soal baru.
              </p>
            </div>
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black bg-black text-white text-xs sm:text-sm font-bold shadow-retro hover:bg-neutral-800 transition-all shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Buat Ujian di Kelas &rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border-2 border-black bg-white p-5 shadow-retro hover:-translate-y-1 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded border border-black bg-retro-warm text-xs font-mono font-bold">
                      {q.exam_type ?? 'KUIS'}
                    </span>
                    <span className="text-xs font-mono font-bold flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {q.duration_minutes} Menit
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-base sm:text-lg text-black leading-snug line-clamp-2">
                    {q.title}
                  </h3>

                  <p className="text-xs text-black/70 line-clamp-2">
                    {q.description || 'Tidak ada deskripsi tambahan.'}
                  </p>

                  <div className="pt-2 border-t border-black/10 flex items-center justify-between text-xs font-mono">
                    <span>KKM: {q.kkm ?? 70}</span>
                    <span className="font-bold text-retro-orange">
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
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-black bg-retro-orange text-white text-xs font-black shadow-xs hover:bg-black transition-all cursor-pointer"
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>Panel Live</span>
                  </button>
                  <Link
                    href={`/classes/${q.class_id}/quizzes/${q.id}`}
                    className="px-3 py-2 rounded-lg border-2 border-black bg-white text-black text-xs font-bold hover:bg-retro-warm shadow-xs"
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
          <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600"></span>
              </span>
              <div>
                <h3 className="font-heading font-black text-base text-black">
                  Live Proctoring Monitor ({liveStudents.filter((s) => s.status === 'IN_PROGRESS').length} Sedang Mengerjakan)
                </h3>
                <p className="text-xs text-black/60 font-medium">
                  Telemetri pengerjaan real-time dengan append-only event stream anti-curang.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold font-mono">Pilih Ujian:</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border-2 border-black text-xs font-bold bg-white"
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
                  'rounded-xl border-2 border-black p-5 shadow-retro space-y-4 transition-all',
                  st.status === 'TERMINATED'
                    ? 'bg-rose-50 border-rose-500'
                    : st.violations_count > 0
                    ? 'bg-amber-50/70 border-black'
                    : 'bg-white'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-heading font-black text-base text-black">
                      {st.student_name}
                    </h4>
                    <p className="text-xs text-black/60 font-mono mt-0.5">
                      {st.last_event}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-mono font-bold px-2.5 py-0.5 rounded border border-black',
                      st.status === 'IN_PROGRESS'
                        ? 'bg-emerald-100 text-emerald-950'
                        : st.status === 'SUBMITTED'
                        ? 'bg-blue-100 text-blue-950'
                        : 'bg-rose-100 text-rose-950'
                    )}
                  >
                    {st.status}
                  </span>
                </div>

                {/* Progress Bar & Sisa Waktu */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono font-bold text-black/80">
                    <span>
                      Soal {st.answered_count}/{st.total_questions} ({st.progress_percent}%)
                    </span>
                    <span>
                      {Math.floor(st.time_left_seconds / 60)}m {st.time_left_seconds % 60}s tersisa
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full border-2 border-black bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full bg-retro-orange transition-all duration-300"
                      style={{ width: `${st.progress_percent}%` }}
                    />
                  </div>
                </div>

                {/* Pelanggaran Badge */}
                {st.violations_count > 0 && (
                  <div className="p-2.5 rounded-lg border border-amber-500 bg-amber-100/70 flex items-center gap-2 text-xs font-bold text-amber-950 font-mono">
                    <AlertTriangle className="h-4 w-4 text-amber-800 shrink-0" />
                    <span>Terdeteksi {st.violations_count} Pelanggaran Pengawasan</span>
                  </div>
                )}

                {/* Aksi Intervensi Dosen */}
                {st.status === 'IN_PROGRESS' && (
                  <div className="pt-3 border-t-2 border-black/10 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleIntervention(st.student_id, 'WARN')}
                      className="px-3 py-1.5 rounded-lg border-2 border-black bg-retro-yellow text-black text-xs font-black hover:bg-amber-300 transition-all cursor-pointer"
                    >
                      Beri Peringatan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIntervention(st.student_id, 'ADD_TIME')}
                      className="px-3 py-1.5 rounded-lg border-2 border-black bg-white text-black text-xs font-bold hover:bg-neutral-100 transition-all cursor-pointer"
                    >
                      +10 Menit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIntervention(st.student_id, 'TERMINATE')}
                      className="px-3 py-1.5 rounded-lg border-2 border-rose-600 bg-rose-100 text-rose-950 text-xs font-bold hover:bg-rose-200 transition-all cursor-pointer ml-auto"
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

      {/* 5. TAB 3: LOG PELANGGARAN PROCTORING */}
      {activeTab === 'pelanggaran' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-base text-black">
                Catatan Log Pelanggaran Proctoring ({violationsLog.length})
              </h2>
              <p className="text-xs text-black/70">
                Log append-only yang mencatat perpindahan fokus layar (blur), keluar fullscreen, atau tab-switching.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded border border-black bg-white">
              Immutable Audit Stream
            </span>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Mahasiswa</th>
                    <th className="p-3.5 sm:p-4">Sesi Ujian</th>
                    <th className="p-3.5 sm:p-4">Tipe Insiden</th>
                    <th className="p-3.5 sm:p-4">Detail Telemetri</th>
                    <th className="p-3.5 sm:p-4 text-center">Tingkat Bahaya</th>
                    <th className="p-3.5 sm:p-4">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {violationsLog.map((v) => (
                    <tr key={v.id} className="hover:bg-retro-warm/30 transition-colors">
                      <td className="p-3.5 sm:p-4 font-bold text-black">
                        {v.student_name}
                      </td>
                      <td className="p-3.5 sm:p-4 text-black/80 font-mono">
                        {v.exam_title}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <span className="px-2 py-0.5 rounded border border-black bg-retro-warm font-mono text-xs font-bold">
                          {v.event_type}
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 text-black/80">
                        {v.details}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded border text-[11px] font-mono font-bold',
                            v.severity === 'CRITICAL'
                              ? 'border-rose-500 bg-rose-100 text-rose-950'
                              : 'border-amber-500 bg-amber-100 text-amber-950'
                          )}
                        >
                          {v.severity}
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 font-mono text-xs text-black/60">
                        {v.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
