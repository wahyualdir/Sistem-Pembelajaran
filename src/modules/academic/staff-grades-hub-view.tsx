'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckSquare,
  Clock,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Send,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';
import { executeGradeChangeAction, type ChangeRequestItem } from './actions';

export const STAFF_GRADES_TABS = [
  { id: 'rekap-nilai', label: 'Rekap Nilai', icon: CheckSquare },
  { id: 'rekap-presensi', label: 'Rekap Presensi', icon: Clock },
  { id: 'perubahan-nilai', label: 'Perubahan Nilai', icon: FileText },
  { id: 'ekspor-laporan', label: 'Ekspor Laporan', icon: FileSpreadsheet },
] as const;

export type StaffGradesTabId = (typeof STAFF_GRADES_TABS)[number]['id'];

interface StaffGradesHubViewProps {
  gradeChanges: ChangeRequestItem[];
  isDemo?: boolean;
}

export function StaffGradesHubView({
  gradeChanges = [],
  isDemo = true,
}: StaffGradesHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as StaffGradesTabId;
  const validTabs: StaffGradesTabId[] = [
    'rekap-nilai',
    'rekap-presensi',
    'perubahan-nilai',
    'ekspor-laporan',
  ];
  const activeTab: StaffGradesTabId = validTabs.includes(tabParam)
    ? tabParam
    : 'rekap-nilai';

  const setTab = (tab: StaffGradesTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/staff/grades?${params.toString()}`);
  };

  // State Eksekusi Perubahan Nilai
  const [requestsList, setRequestsList] = useState<ChangeRequestItem[]>(gradeChanges);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequestItem | null>(null);
  const [executionNote, setExecutionNote] = useState('');
  const [isPending, startTransition] = useTransition();
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const pendingExecutions = requestsList.filter((r) => r.status === 'APPROVED');

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setModalError(null);

    startTransition(async () => {
      const res = await executeGradeChangeAction({
        request_id: selectedRequest.id,
        note: executionNote.trim() || undefined,
      });

      if (!res.ok) {
        setModalError(res.error || 'Gagal mengeksekusi perubahan nilai.');
        return;
      }

      // Update state lokal
      setRequestsList((prev) =>
        prev.map((item) =>
          item.id === selectedRequest.id
            ? {
                ...item,
                status: 'EXECUTED',
                executed_at: new Date().toISOString(),
                execution_note: executionNote.trim() || 'Eksekusi administratif nilai perkuliahan oleh Staf Akademik',
              }
            : item
        )
      );

      setToastMessage({
        type: 'success',
        text: `Sukses mengeksekusi nilai ${selectedRequest.student_name} (${selectedRequest.old_score} -> ${selectedRequest.proposed_score}). Notifikasi dikirim ke mahasiswa dan dosen.`,
      });
      setSelectedRequest(null);
      setExecutionNote('');
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER RETRO */}
      <RetroWindow
        title="rekapitulasi_nilai_dan_presensi_kampus.app"
        badge="Biro Evaluasi & Transkrip Akademik"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-xs">
                <CheckSquare className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Nilai & Presensi Institusi
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Pusat audit rekapitulasi nilai dan presensi seluruh program studi, eksekusi sah permohonan revisi nilai yang disetujui Kaprodi, serta generator ekspor feeder PDDIKTI.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-mono font-black text-black shadow-retro">
              {pendingExecutions.length} Menunggu Eksekusi Staf
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. STATS PILLS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-[11px] font-mono font-bold uppercase text-black/60">Tingkat Kelulusan MK</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">96.4%</div>
          <span className="text-xs text-emerald-800 font-bold">Seluruh Fakultas</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-[11px] font-mono font-bold uppercase text-black/60">Rata-rata Kehadiran</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">91.8%</div>
          <span className="text-xs text-emerald-800 font-bold">Memenuhi Syarat Ujian</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-[11px] font-mono font-bold uppercase text-black/60">Menunggu Eksekusi Staf</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-retro-orange">{pendingExecutions.length} Berkas</div>
          <span className="text-xs text-black/70 font-semibold">Telah Disetujui Kaprodi</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-[11px] font-mono font-bold uppercase text-black/60">Total Nilai Dieksekusi</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">
            {requestsList.filter((r) => r.status === 'EXECUTED').length} Nilai
          </div>
          <span className="text-xs text-emerald-800 font-bold">Tercatat di Audit Log</span>
        </div>
      </div>

      {/* 3. TAB CONTROLLER */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {STAFF_GRADES_TABS.map((tab) => {
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
              {tab.id === 'perubahan-nilai' && pendingExecutions.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-black text-white text-[10px] font-mono font-bold">
                  {pendingExecutions.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}
      {/* TAB 1: REKAP NILAI (BACA SAJA UNTUK STAF) */}
      {activeTab === 'rekap-nilai' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-retro-orange" />
                <span>Rekapitulasi Nilai Akhir Mahasiswa (Read-Only Audit)</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Kompilasi nilai akhir seluruh mata kuliah semester aktif. Staf tidak dapat mengubah nilai langsung tanpa pengajuan revisi yang disetujui.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-white border border-black rounded-lg">
              Mode Baca Saja (Staf BAA)
            </span>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">NIM & Mahasiswa</th>
                    <th className="p-3.5 sm:p-4">Program Studi</th>
                    <th className="p-3.5 sm:p-4 text-center">SKS Diambil</th>
                    <th className="p-3.5 sm:p-4 text-center">IPS Semester</th>
                    <th className="p-3.5 sm:p-4 text-center">IPK Kumulatif</th>
                    <th className="p-3.5 sm:p-4 text-center">Status Akademik</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {[
                    { nim: '2024001', name: 'Ahmad Fauzi', prodi: 'Teknik Informatika (S1)', sks: 21, ips: 3.85, ipk: 3.78, status: 'AKTIF (MEMUASKAN)' },
                    { nim: '2024018', name: 'Rian Hidayat', prodi: 'Teknik Informatika (S1)', sks: 20, ips: 3.42, ipk: 3.35, status: 'AKTIF' },
                    { nim: '2024025', name: 'Siti Rahma', prodi: 'Teknik Informatika (S1)', sks: 24, ips: 3.92, ipk: 3.88, status: 'AKTIF (CUMLAUDE)' },
                    { nim: '2024039', name: 'Dimas Aditya', prodi: 'Teknik Informatika (S1)', sks: 18, ips: 3.25, ipk: 3.30, status: 'AKTIF' },
                  ].map((m) => (
                    <tr key={m.nim} className="hover:bg-retro-warm/30 transition-colors">
                      <td className="p-3.5 sm:p-4 font-bold text-black">
                        <div>{m.name}</div>
                        <span className="text-xs font-mono text-black/60">{m.nim}</span>
                      </td>
                      <td className="p-3.5 sm:p-4 text-black/80">{m.prodi}</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold">{m.sks} SKS</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-retro-orange">{m.ips.toFixed(2)}</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono font-black text-black">{m.ipk.toFixed(2)}</td>
                      <td className="p-3.5 sm:p-4 text-center">
                        <span className="px-2.5 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 font-mono text-[11px] font-bold">
                          {m.status}
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

      {/* TAB 2: REKAP PRESENSI (BACA SAJA UNTUK STAF) */}
      {activeTab === 'rekap-presensi' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <Clock className="h-5 w-5 text-retro-orange" />
                <span>Rekapitulasi Presensi Kuliah & Kelayakan Ujian (Read-Only)</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Audit persentase kehadiran mahasiswa per kelas. Syarat minimal mengikuti ujian akhir semester adalah 75% kehadiran kuliah.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-white border border-black rounded-lg">
              Syarat Ujian: Minimal 75% Hadir
            </span>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">NIM & Mahasiswa</th>
                    <th className="p-3.5 sm:p-4">Kelas Mata Kuliah</th>
                    <th className="p-3.5 sm:p-4 text-center">Total Sesi</th>
                    <th className="p-3.5 sm:p-4 text-center">Hadir</th>
                    <th className="p-3.5 sm:p-4 text-center">Izin / Sakit</th>
                    <th className="p-3.5 sm:p-4 text-center">Alpa</th>
                    <th className="p-3.5 sm:p-4 text-center">Persentase</th>
                    <th className="p-3.5 sm:p-4 text-center">Syarat Ujian</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {[
                    { nim: '2024001', name: 'Ahmad Fauzi', course: 'Pemrograman Web Lanjut (IF-3A)', total: 14, hadir: 13, izin: 1, alpa: 0, pct: 92.8, eligible: true },
                    { nim: '2024018', name: 'Rian Hidayat', course: 'Pemrograman Web Lanjut (IF-3A)', total: 14, hadir: 11, izin: 2, alpa: 1, pct: 78.5, eligible: true },
                    { nim: '2024025', name: 'Siti Rahma', course: 'Basis Data Terdistribusi (IF-3B)', total: 14, hadir: 14, izin: 0, alpa: 0, pct: 100.0, eligible: true },
                    { nim: '2024099', name: 'Zulkifli Mansur', course: 'Basis Data Terdistribusi (IF-3B)', total: 14, hadir: 9, izin: 1, alpa: 4, pct: 64.2, eligible: false },
                  ].map((p) => (
                    <tr key={p.nim} className="hover:bg-retro-warm/30 transition-colors">
                      <td className="p-3.5 sm:p-4 font-bold text-black">
                        <div>{p.name}</div>
                        <span className="text-xs font-mono text-black/60">{p.nim}</span>
                      </td>
                      <td className="p-3.5 sm:p-4 text-black/80">{p.course}</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono">{p.total}</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-emerald-800">{p.hadir}</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono text-amber-800">{p.izin}</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono text-rose-800">{p.alpa}</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-black">{p.pct.toFixed(1)}%</td>
                      <td className="p-3.5 sm:p-4 text-center">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded border text-[11px] font-mono font-bold',
                            p.eligible
                              ? 'border-emerald-500 bg-emerald-100 text-emerald-950'
                              : 'border-rose-500 bg-rose-100 text-rose-950'
                          )}
                        >
                          {p.eligible ? '✓ MEMENUHI SYARAT' : '✗ TIDAK MEMENUHI'}
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

      {/* TAB 3: PERUBAHAN NILAI (EKSEKUSI OLEH STAF) */}
      {activeTab === 'perubahan-nilai' && (
        <div className="space-y-6">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <FileText className="h-5 w-5 text-retro-orange" />
                <span>Eksekusi Perubahan Nilai Mahasiswa (Wewenang Staf BAA)</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Staf hanya dapat mengeksekusi pengajuan berstatus <strong>APPROVED</strong> dari Koordinator Program Studi. Nilai lama diverifikasi secara otomatis di server sebelum mutasi dieksekusi ke pangkalan data.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-white border border-black rounded-lg shrink-0">
              {pendingExecutions.length} Menunggu Eksekusi
            </span>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Mahasiswa & Kelas</th>
                    <th className="p-3.5 sm:p-4">Komponen Nilai</th>
                    <th className="p-3.5 sm:p-4 text-center">Nilai Lama</th>
                    <th className="p-3.5 sm:p-4 text-center">Nilai Usulan</th>
                    <th className="p-3.5 sm:p-4">Alasan Dosen</th>
                    <th className="p-3.5 sm:p-4 text-center">Status Prodi</th>
                    <th className="p-3.5 sm:p-4 text-center">Aksi Staf</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {requestsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-black/60">
                        Tidak ada berkas permohonan perubahan nilai.
                      </td>
                    </tr>
                  ) : (
                    requestsList.map((req) => (
                      <tr key={req.id} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          <div>{req.student_name}</div>
                          <div className="text-xs font-mono text-black/60">{req.class_title}</div>
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/80 font-semibold">{req.assignment_title}</td>
                        <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-rose-800 bg-rose-50/50">
                          {req.old_score}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center font-mono font-black text-emerald-800 bg-emerald-50/50">
                          {req.proposed_score}
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs text-black/80 max-w-xs">
                          <div>{req.reason}</div>
                          {req.review_note && (
                            <div className="mt-1 text-[11px] font-mono text-black/60 border-t border-black/10 pt-1">
                              <strong>Catatan Kaprodi:</strong> {req.review_note}
                            </div>
                          )}
                          {req.execution_note && (
                            <div className="mt-1 text-[11px] font-mono text-emerald-800 border-t border-black/10 pt-1">
                              <strong>Eksekusi BAA:</strong> {req.execution_note}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded border text-[11px] font-mono font-bold',
                              req.status === 'APPROVED'
                                ? 'border-amber-500 bg-amber-100 text-amber-950'
                                : req.status === 'EXECUTED'
                                ? 'border-emerald-500 bg-emerald-100 text-emerald-950'
                                : req.status === 'REJECTED'
                                ? 'border-rose-500 bg-rose-100 text-rose-950'
                                : 'border-neutral-400 bg-neutral-100 text-neutral-800'
                            )}
                          >
                            {req.status === 'APPROVED'
                              ? 'DISETUJUI KAPRODI'
                              : req.status === 'EXECUTED'
                              ? 'TELAH DIEKSEKUSI'
                              : req.status === 'REJECTED'
                              ? 'DITOLAK KAPRODI'
                              : 'MENUNGGU PERSETUJUAN'}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          {req.status === 'APPROVED' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRequest(req);
                                setModalError(null);
                                setExecutionNote('');
                              }}
                              className="px-3 py-1.5 rounded-lg border-2 border-black bg-retro-orange text-white text-xs font-black shadow-xs hover:bg-black transition-all cursor-pointer"
                            >
                              Eksekusi Nilai
                            </button>
                          ) : req.status === 'EXECUTED' ? (
                            <span className="text-xs font-mono font-bold text-emerald-700 flex items-center justify-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Selesai</span>
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-black/40">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EKSPOR LAPORAN */}
      {activeTab === 'ekspor-laporan' && (
        <div className="space-y-6">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl">
            <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-retro-orange" />
              <span>Ekspor Laporan Transaksional Akademik & Feeder PDDIKTI</span>
            </h2>
            <p className="text-xs text-black/70 mt-1">
              Unduh berkas spreadsheet resmi untuk pelaporan berkala pangkalan data kementerian dan audit internal universitas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-retro-orange" />
                  <h3 className="font-heading font-black text-base text-black">Format Feeder PDDIKTI</h3>
                </div>
                <p className="text-xs text-black/70 leading-relaxed">
                  Ekspor rekapan nilai semester, krs, dan aktivitas kuliah sesuai template resmi aplikasi Feeder PDDIKTI.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage({ type: 'info', text: 'Mengunduh laporan Feeder PDDIKTI format Excel (.xlsx)...' })}
                className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Unduh File Feeder</span>
              </button>
            </div>

            <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-retro-orange" />
                  <h3 className="font-heading font-black text-base text-black">Buku Nilai Universitas</h3>
                </div>
                <p className="text-xs text-black/70 leading-relaxed">
                  Laporan rekapitulasi nilai akhir seluruh kelas dan program studi untuk penerbitan KHS dan arsip dekanat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage({ type: 'info', text: 'Mengunduh Buku Nilai Universitas (.xlsx)...' })}
                className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Buku Nilai</span>
              </button>
            </div>

            <div className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-retro-orange" />
                  <h3 className="font-heading font-black text-base text-black">Audit Presensi Kuliah</h3>
                </div>
                <p className="text-xs text-black/70 leading-relaxed">
                  Daftar hadir per sesi kuliah, data verifikasi izin sakit dokter, dan rekap kepatuhan 75% syarat ujian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage({ type: 'info', text: 'Mengunduh Rekap Audit Presensi (.xlsx)...' })}
                className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 border-black bg-neutral-50 hover:bg-neutral-100 text-xs font-bold font-mono transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Audit Presensi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IN-APP NEO-BRUTALIST KONFIRMASI EKSEKUSI PERUBAHAN NILAI (A3e & 2D) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border-2 border-black bg-white p-6 sm:p-7 shadow-retro space-y-5">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg border-2 border-black bg-retro-orange text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg sm:text-xl text-black">
                    Eksekusi Perubahan Nilai
                  </h3>
                  <span className="text-xs font-mono font-bold text-black/60">
                    Otoritas Staf Biro Akademik (BAA)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded hover:bg-neutral-100 text-black cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Ringkasan Data Perubahan Nilai */}
            <div className="p-4 rounded-xl border-2 border-black bg-retro-warm space-y-2">
              <div className="flex justify-between text-xs font-bold text-black">
                <span>Mahasiswa:</span>
                <span className="font-mono">{selectedRequest.student_name}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-black">
                <span>Kelas:</span>
                <span className="font-mono">{selectedRequest.class_title}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-black">
                <span>Komponen:</span>
                <span className="font-mono">{selectedRequest.assignment_title}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-black pt-2 border-t border-black/20">
                <span>Perubahan Nilai:</span>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-rose-800 line-through">{selectedRequest.old_score}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-500">
                    {selectedRequest.proposed_score}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-black/10 text-xs text-black/80">
                <strong>Alasan Dosen:</strong> {selectedRequest.reason}
              </div>
              {selectedRequest.review_note && (
                <div className="text-xs text-black/80 font-mono">
                  <strong>Persetujuan Kaprodi:</strong> {selectedRequest.review_note}
                </div>
              )}
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border-2 border-rose-500 rounded-lg text-rose-950 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleExecute} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-black font-mono">
                  Catatan Berita Acara Eksekusi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={executionNote}
                  onChange={(e) => setExecutionNote(e.target.value)}
                  placeholder="Nomor surat berita acara atau keterangan tambahan staf..."
                  className="w-full rounded-lg border-2 border-black p-2.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-retro-orange"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-lg border-2 border-black bg-white text-xs font-black shadow-xs hover:bg-neutral-100 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-black bg-black text-white text-xs font-black shadow-retro hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>{isPending ? 'Mengeksekusi...' : 'Konfirmasi & Eksekusi Nilai Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div
            className={cn(
              'px-4 py-3 rounded-xl border-2 border-black font-bold text-xs sm:text-sm shadow-retro flex items-center gap-2.5',
              toastMessage.type === 'success'
                ? 'bg-emerald-100 text-emerald-950'
                : 'bg-white text-black'
            )}
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            <span>{toastMessage.text}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-2 font-mono hover:underline cursor-pointer"
            >
              [Tutup]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
