'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  QrCode,
  Fingerprint,
  ArrowRight,
  FileText,
  UploadCloud,
  FileCheck,
  Send,
  X,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';
import { submitLeavePermitAction } from './attendance-actions';

export interface AttendanceHistoryRecord {
  id: string;
  courseTitle: string;
  meetingNumber: number;
  date: string;
  time: string;
  method: 'QR' | 'LOKASI' | 'BIOMETRIK' | 'MANUAL';
  status: 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALPA';
  room: string;
}

export interface LeaveRequestRecord {
  id: string;
  type: 'SAKIT' | 'IZIN';
  courseTitle: string;
  meetingNumber: number;
  date: string;
  reason: string;
  attachmentName: string;
  status: 'MENUNGGU VERIFIKASI' | 'DISETUJUI' | 'DITOLAK';
  submittedAt: string;
  feedback?: string;
}

export const ATTENDANCE_TABS = [
  { id: 'riwayat', label: 'Riwayat Presensi Kuliah', icon: Clock },
  { id: 'izin', label: 'Pengajuan Izin & Sakit', icon: FileText },
] as const;

export type AttendanceTabId = (typeof ATTENDANCE_TABS)[number]['id'];

interface AttendanceHubViewProps {
  records: AttendanceHistoryRecord[];
  leaves: LeaveRequestRecord[];
  isDemo?: boolean;
}

export function AttendanceHubView({ records, leaves, isDemo = true }: AttendanceHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab synchronization with URL (?tab=...)
  const tabParam = searchParams.get('tab') as AttendanceTabId;
  const validTabs: AttendanceTabId[] = ['riwayat', 'izin'];
  const activeTab: AttendanceTabId = validTabs.includes(tabParam) ? tabParam : 'riwayat';

  const setTab = (tab: AttendanceTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/attendance?${params.toString()}`);
  };

  // State Modal "Ajukan Izin/Sakit"
  const [isPermitModalOpen, setIsPermitModalOpen] = useState(false);
  const [permitType, setPermitType] = useState<'SAKIT' | 'IZIN'>('SAKIT');
  const [permitCourse, setPermitCourse] = useState('Pemrograman Web Lanjut');
  const [permitMeeting, setPermitMeeting] = useState('8');
  const [permitDate, setPermitDate] = useState('2026-10-12');
  const [permitReason, setPermitReason] = useState('');
  const [permitFile, setPermitFile] = useState<File | null>(null);
  const [isPermitSuccess, setIsPermitSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Real state for leaves list
  const [leavesList, setLeavesList] = useState<LeaveRequestRecord[]>(leaves);

  // Metrik kehadiran
  const totalHadir = records.filter((a) => a.status === 'HADIR' || a.status === 'TERLAMBAT').length;
  const attendanceRate = records.length > 0 ? Math.round((totalHadir / records.length) * 100) : 0;

  const handlePermitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await submitLeavePermitAction({
        course_title: permitCourse,
        meeting_number: Number(permitMeeting),
        type: permitType,
        date: permitDate,
        reason: permitReason,
        attachment_name: permitFile?.name || 'surat_keterangan.pdf',
      });
      if (res.ok && res.data) {
        setLeavesList((prev) => [res.data as any, ...prev]);
        setIsPermitSuccess(true);
        setTimeout(() => {
          setIsPermitModalOpen(false);
          setIsPermitSuccess(false);
          setPermitReason('');
          setPermitFile(null);
        }, 1500);
      } else {
        alert(res.error || 'Gagal mengirim permohonan izin');
      }
    });
  };

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER BERANDA STYLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <CalendarCheck2 className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Presensi & Perizinan Kuliah
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Log kehadiran mahasiswa berbasis multi-faktor (QR Dinamis, Geolokasi GPS Haversine, Biometrik WebAuthn, dan Kode PIN).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsPermitModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-ink bg-ink text-white font-bold text-xs sm:text-sm shadow-retro hover:bg-ink/90 transition-all cursor-pointer min-h-[44px]"
            >
              <FileText className="h-4 w-4" />
              <span>Ajukan Izin/Sakit</span>
            </button>
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-ink bg-surface font-bold text-xs sm:text-sm text-ink shadow-retro hover:bg-gray-soft transition-all min-h-[44px]"
            >
              <span>Kelas Kuliah</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              KEHADIRAN {attendanceRate}%
            </span>
          </div>
        </div>

        {/* 2. STATS RINGKASAN */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-1">
            <div className="text-xs font-sans font-medium uppercase tracking-[0.04em] text-gray-dark">Total Sesi Diikuti</div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-ink">{records.length} Sesi</div>
            <div className="text-xs text-gray-dark font-bold">Semester Berjalan</div>
          </div>

          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-1">
            <div className="text-xs font-sans font-medium uppercase tracking-[0.04em] text-gray-dark">Tepat Waktu</div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-ink">
              {records.filter((r) => r.status === 'HADIR').length} Sesi
            </div>
            <div className="text-xs text-gray-dark font-bold">Presensi Valid</div>
          </div>

          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-1">
            <div className="text-xs font-sans font-medium uppercase tracking-[0.04em] text-gray-dark">Terlambat / Izin</div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-ink">
              {records.filter((r) => r.status === 'TERLAMBAT' || r.status === 'IZIN' || r.status === 'SAKIT').length} Sesi
            </div>
            <div className="text-xs text-gray-dark font-bold">Dispensasi Diterima</div>
          </div>

          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-1">
            <div className="text-xs font-sans font-medium uppercase tracking-[0.04em] text-gray-dark">Syarat Ujian (&gt;75%)</div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-ink">{attendanceRate}%</div>
            <div className="text-xs text-primary font-bold">
              {records.length === 0
                ? 'Belum Ada Presensi'
                : attendanceRate >= 75
                ? '✓ Memenuhi Syarat'
                : '⚠️ Terancam Tidak Ikut Ujian'}
            </div>
          </div>
        </div>

        {/* 3. CONTROLLER TAB */}
        <div className="flex items-center gap-2 border-b-2 border-ink pb-2 overflow-x-auto">
          {ATTENDANCE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-ink text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0',
                  isSelected
                    ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
                    : 'bg-surface text-ink hover:bg-gray-soft shadow-xs'
                )}
              >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}
      {/* TAB 1: RIWAYAT PRESENSI */}
      {activeTab === 'riwayat' && (
        <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
          <div className="p-4 bg-gray-soft border-b-2 border-black flex items-center justify-between">
            <h2 className="font-heading font-bold text-sm sm:text-base text-black">
              Riwayat Presensi Masuk ({records.length})
            </h2>
            <span className="text-xs font-sans font-bold text-black">
              Validasi Geofence & Dynamic QR
            </span>
          </div>

          {records.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Clock className="h-10 w-10 text-black mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-black">
                Belum Ada Catatan Presensi
              </h3>
              <p className="text-xs sm:text-sm text-black font-bold max-w-md mx-auto">
                Anda belum memiliki log presensi masuk perkuliahan pada semester berjalan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black">
                  <tr>
                  <th className="p-3.5 sm:p-4">Pertemuan & Mata Kuliah</th>
                  <th className="p-3.5 sm:p-4">Waktu Presensi</th>
                  <th className="p-3.5 sm:p-4 text-center">Metode Verifikasi</th>
                  <th className="p-3.5 sm:p-4">Ruang Kuliah</th>
                  <th className="p-3.5 sm:p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10 font-bold">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-soft/30 transition-colors">
                    <td className="p-3.5 sm:p-4 font-bold text-black">
                      <div>Pertemuan #{r.meetingNumber} — {r.courseTitle}</div>
                      <div className="text-xs font-sans font-bold text-black">{r.date}</div>
                    </td>
                    <td className="p-3.5 sm:p-4 text-xs font-sans font-bold text-black">
                      {r.time}
                    </td>
                    <td className="p-3.5 sm:p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border-2 border-black bg-gray-soft text-black font-sans text-xs font-bold shadow-xs">
                        {r.method === 'QR' && <QrCode className="h-3.5 w-3.5" />}
                        {r.method === 'LOKASI' && <MapPin className="h-3.5 w-3.5" />}
                        {r.method === 'BIOMETRIK' && <Fingerprint className="h-3.5 w-3.5" />}
                        <span>{r.method}</span>
                      </span>
                    </td>
                    <td className="p-3.5 sm:p-4 text-xs font-bold text-black">
                      {r.room}
                    </td>
                    <td className="p-3.5 sm:p-4 text-center">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded border-2 border-black text-xs font-bold font-sans',
                          r.status === 'HADIR'
                            ? 'bg-surface text-ink'
                            : r.status === 'TERLAMBAT'
                            ? 'bg-gray-soft text-ink'
                            : 'bg-gray-soft text-ink'
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
          )}
        </div>
      )}

      {/* TAB 2: PENGAJUAN IZIN & SAKIT */}
      {activeTab === 'izin' && (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="p-4 bg-gray-soft border-b-2 border-black flex items-center justify-between">
              <h2 className="font-heading font-bold text-sm sm:text-base text-black">
                Daftar Permohonan Izin & Sakit ({leavesList.length})
              </h2>
              <button
                type="button"
                onClick={() => setIsPermitModalOpen(true)}
                className="text-xs font-bold text-black hover:underline cursor-pointer"
              >
                + Ajukan Izin Baru
              </button>
            </div>

            {leavesList.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <FileCheck className="h-10 w-10 text-black/40 mx-auto" />
                <h3 className="font-heading font-bold text-base sm:text-lg text-black">
                  Tidak Ada Pengajuan Izin Aktif
                </h3>
                <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                  Anda belum pernah mengajukan izin sakit atau dispensasi semester ini. Gunakan tombol di atas untuk mengajukan izin dengan surat dokter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black">
                    <tr>
                      <th className="p-3.5 sm:p-4">Tipe & Mata Kuliah</th>
                      <th className="p-3.5 sm:p-4">Tanggal Izin</th>
                      <th className="p-3.5 sm:p-4">Alasan & Keterangan</th>
                      <th className="p-3.5 sm:p-4">Lampiran Bukti</th>
                      <th className="p-3.5 sm:p-4 text-center">Status Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 font-medium">
                    {leavesList.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded border border-black bg-gray-soft text-xs font-sans">
                              {l.type}
                            </span>
                            <span>{l.courseTitle}</span>
                          </div>
                          <div className="text-xs font-sans text-black/60 mt-0.5">
                            Pertemuan #{l.meetingNumber}
                          </div>
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs font-sans text-black/80">
                          {l.date}
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs text-black/80 max-w-xs">
                          {l.reason}
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-black bg-white text-black font-sans">
                            <FileText className="h-3.5 w-3.5" />
                            <span>{l.attachmentName}</span>
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded border text-xs font-bold font-sans',
                              l.status === 'DISETUJUI'
                                ? 'border-ink bg-surface text-ink'
                                : l.status === 'DITOLAK'
                                ? 'border-ink bg-gray-soft text-black'
                                : 'border-ink bg-gray-soft text-ink'
                            )}
                          >
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL AJUKAN IZIN / SAKIT */}
      {isPermitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border-2 border-black bg-white p-6 sm:p-7 shadow-retro space-y-5">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg border-2 border-black bg-primary text-white">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-lg sm:text-xl text-black">
                  Ajukan Izin / Sakit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPermitModalOpen(false)}
                className="p-1 rounded hover:bg-neutral-100 text-black cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isPermitSuccess ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-ink mx-auto" />
                <h4 className="font-heading font-bold text-lg text-black">Permohonan Izin Terkirim!</h4>
                <p className="text-xs sm:text-sm text-black/70">
                  Surat keterangan perizinan telah diteruskan ke dosen pengampu mata kuliah terkait.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePermitSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-black font-sans">
                      Jenis Izin
                    </label>
                    <select
                      value={permitType}
                      onChange={(e) => setPermitType(e.target.value as any)}
                      className="w-full rounded-lg border-2 border-black p-2.5 text-xs sm:text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="SAKIT">Sakit (Surat Dokter)</option>
                      <option value="IZIN">Izin / Dispensasi Resmi</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-black font-sans">
                      Tanggal Tidak Hadir
                    </label>
                    <input
                      type="date"
                      required
                      value={permitDate}
                      onChange={(e) => setPermitDate(e.target.value)}
                      className="w-full rounded-lg border-2 border-black p-2.5 text-xs sm:text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                    </input>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold uppercase text-black font-sans">
                      Mata Kuliah
                    </label>
                    <select
                      value={permitCourse}
                      onChange={(e) => setPermitCourse(e.target.value)}
                      className="w-full rounded-lg border-2 border-black p-2.5 text-xs sm:text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Pemrograman Web Lanjut">Pemrograman Web Lanjut</option>
                      <option value="Rekayasa Perangkat Lunak">Rekayasa Perangkat Lunak</option>
                      <option value="Kecerdasan Buatan">Kecerdasan Buatan</option>
                      <option value="Basis Data Terdistribusi">Basis Data Terdistribusi</option>
                      <option value="Keamanan Siber">Keamanan Siber</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-black font-sans">
                      Pertemuan Ke-
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      required
                      value={permitMeeting}
                      onChange={(e) => setPermitMeeting(e.target.value)}
                      className="w-full rounded-lg border-2 border-black p-2.5 text-xs sm:text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-black font-sans">
                    Alasan / Keterangan Tidak Hadir
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={permitReason}
                    onChange={(e) => setPermitReason(e.target.value)}
                    placeholder="Sebutkan diagnosis dokter / kegiatan dispensasi resmi kampus..."
                    className="w-full rounded-lg border-2 border-black p-3 text-xs sm:text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-black font-sans">
                    Upload Lampiran Surat Keterangan Dokter / Dispensasi (PDF/JPG)
                  </label>
                  <div className="rounded-lg border-2 border-dashed border-black p-4 text-center bg-gray-soft/20 space-y-2">
                    <UploadCloud className="h-7 w-7 text-black/60 mx-auto" />
                    <input
                      type="file"
                      id="permit-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setPermitFile(e.target.files[0]);
                      }}
                    />
                    <label
                      htmlFor="permit-upload"
                      className="inline-block px-3 py-1.5 rounded border border-black bg-white text-xs font-bold text-black shadow-xs cursor-pointer hover:bg-neutral-100"
                    >
                      {permitFile ? permitFile.name : 'Pilih File Dokumen Bukti'}
                    </label>
                    <p className="text-xs text-black/60">
                      Maksimal ukuran file 5MB (Format PDF, PNG, JPG)
                    </p>
                  </div>
                </div>

                {!isDemo && (
                  <div className="p-3 rounded-lg border-2 border-black bg-gray-soft text-xs text-ink font-medium space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-ink" />
                      <span>Pemberitahuan Persistensi Database (Fase 3)</span>
                    </p>
                    <p>
                      Penyimpanan surat izin/sakit ke database Supabase sedang dalam penyiapan. Di luar mode demo, formulir dinonaktifkan untuk mencegah sukses palsu.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-3 border-t-2 border-black/10">
                  <button
                    type="button"
                    onClick={() => setIsPermitModalOpen(false)}
                    className="px-4 py-2 rounded-lg border-2 border-black bg-white text-xs sm:text-sm font-bold hover:bg-neutral-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  {!isDemo ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border-2 border-black bg-neutral-200 text-neutral-500 text-xs sm:text-sm font-bold cursor-not-allowed"
                    >
                      <span>Fitur Segera Aktif (Belum Tersimpan ke Database)</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border-2 border-black bg-black text-white text-xs sm:text-sm font-bold shadow-retro hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                      <span>{isPending ? 'Mengirim...' : 'Kirim Permohonan Izin'}</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
