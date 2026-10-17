'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarCheck2,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck,
  Check,
  X,
  Sliders,
  Download,
  PlusCircle,
  QrCode,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  MapPinOff,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';
import { reviewLeavePermitAction, verifyAttendanceAction, type AttendanceRecord } from './attendance-actions';

export const LECTURER_ATTENDANCE_TABS = [
  { id: 'sesi', label: 'Sesi Presensi', icon: CalendarCheck2 },
  { id: 'rekap', label: 'Rekap Kehadiran', icon: Users },
  { id: 'izin', label: 'Izin & Sakit', icon: FileCheck },
  { id: 'anomali', label: 'Verifikasi GPS & Anomali', icon: ShieldAlert },
  { id: 'lokasi', label: 'Pengaturan Lokasi', icon: MapPin },
] as const;

export type LecturerAttendanceTabId = (typeof LECTURER_ATTENDANCE_TABS)[number]['id'];

interface LecturerAttendanceHubViewProps {
  sessions: any[];
  classSummary: any[];
  leaves: any[];
  classes: any[];
  anomalies?: AttendanceRecord[];
  isDemo?: boolean;
}

export function LecturerAttendanceHubView({
  sessions,
  classSummary,
  leaves,
  classes,
  anomalies = [],
  isDemo = true,
}: LecturerAttendanceHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as LecturerAttendanceTabId;
  const validTabs: LecturerAttendanceTabId[] = ['sesi', 'rekap', 'izin', 'anomali', 'lokasi'];
  const activeTab: LecturerAttendanceTabId = validTabs.includes(tabParam) ? tabParam : 'sesi';

  const setTab = (tab: LecturerAttendanceTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/attendance?${params.toString()}`);
  };

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [leavesList, setLeavesList] = useState(leaves);
  const [anomaliesList, setAnomaliesList] = useState<AttendanceRecord[]>(anomalies);
  const [reviewNote, setReviewNote] = useState('');
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Geofence settings state
  const [lat, setLat] = useState('-6.2088');
  const [lng, setLng] = useState('106.8456');
  const [radiusMeters, setRadiusMeters] = useState('50');
  const [locationName, setLocationName] = useState('Gedung Fakultas Lt. 3 — Lab Komputer 2');
  const [lateThreshold, setLateThreshold] = useState('15');
  const [isSavedLocation, setIsSavedLocation] = useState(false);

  const handleReviewLeave = (permitId: string, status: 'DISETUJUI' | 'DITOLAK') => {
    startTransition(async () => {
      const res = await reviewLeavePermitAction({
        permit_id: permitId,
        status,
        feedback: status === 'DISETUJUI' ? 'Dispensasi presensi disetujui oleh dosen pengampu.' : 'Permohonan ditolak karena bukti surat tidak mencukupi.',
      });
      if (res.ok) {
        setLeavesList((prev) =>
          prev.map((l) => (l.id === permitId ? { ...l, status } : l))
        );
        alert(`Pengajuan izin berhasil di-${status.toLowerCase()}.`);
      } else {
        alert(res.error || 'Gagal memperbarui status izin.');
      }
    });
  };

  const handleVerifyAttendance = (recordId: string, decision: 'DISETUJUI' | 'DITOLAK', note?: string) => {
    startTransition(async () => {
      const res = await verifyAttendanceAction({
        recordId,
        decision,
        note: note || (decision === 'DISETUJUI' ? 'Presensi dikonfirmasi sah oleh pengajar.' : 'Presensi ditolak karena anomali GPS.'),
      });
      if (res.ok) {
        setAnomaliesList((prev) =>
          prev.map((a) =>
            a.id === recordId
              ? {
                  ...a,
                  needs_verification: false,
                  verification_status: decision,
                  status: decision === 'DISETUJUI' ? a.status : 'ALPA',
                  verification_note: note,
                }
              : a
          )
        );
        setSelectedAnomalyId(null);
        setReviewNote('');
        alert(`Status presensi berhasil di-${decision === 'DISETUJUI' ? 'setujui' : 'tolak (alpa)'}.`);
      } else {
        alert(res.error || 'Gagal memproses verifikasi presensi.');
      }
    });
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavedLocation(true);
    setTimeout(() => setIsSavedLocation(false), 2000);
  };

  const pendingAnomaliesCount = anomaliesList.filter((a) => a.needs_verification).length;

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO DOSEN */}
      <RetroWindow
        title="manajemen_presensi_perkuliahan_dosen.app"
        badge="Portal Dosen Pengampu"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                <CalendarCheck2 className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Pusat Presensi & Kehadiran Kelas
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Buka sesi pertemuan kuliah, rekap syarat batas minimal UAS (&ge;75%), verifikasi permohonan izin/sakit mahasiswa, dan tinjau anomali deteksi lokasi palsu GPS.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {classes.length > 0 && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border-2 border-black shadow-retro">
                <span className="text-xs font-sans font-bold">Kelas:</span>
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
        {LECTURER_ATTENDANCE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          const showBadge = tab.id === 'anomali' && pendingAnomaliesCount > 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0',
                isSelected
                  ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
                  : 'bg-white text-black hover:bg-gray-soft shadow-xs'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {showBadge && (
                <span className="px-1.5 py-0.5 rounded-full border border-black bg-primary text-white text-[10px] font-bold">
                  {pendingAnomaliesCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: SESI PRESENSI */}
      {activeTab === 'sesi' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading font-bold text-lg text-black">
                Sesi Pertemuan Perkuliahan ({sessions.length})
              </h2>
              <p className="text-xs text-black/70">
                Buka atau tutup sesi untuk mengaktifkan kode PIN dan QR dinamis 30-detik.
              </p>
            </div>
            <Link
              href={selectedClassId ? `/classes/${selectedClassId}?tab=presensi` : '/classes'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black bg-black text-white text-xs sm:text-sm font-bold shadow-retro hover:bg-neutral-800 transition-all shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Buat Sesi Baru di Kelas &rarr;</span>
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <CalendarCheck2 className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-black">Belum Ada Sesi Presensi</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Silakan buat sesi pertemuan pertama di kelas untuk memulai pencatatan presensi mahasiswa.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border-2 border-black bg-white p-5 shadow-retro flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:-translate-y-0.5 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs font-bold px-2 py-0.5 rounded border border-black bg-gray-soft">
                        Pertemuan #{s.meeting_number}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-sans font-bold px-2 py-0.5 rounded border border-black',
                          s.is_open ? 'bg-retro-mint text-black' : 'bg-neutral-200 text-black/60'
                        )}
                      >
                        {s.is_open ? 'BUKA (AKTIF)' : 'DITUTUP'}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-black">
                      {s.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-black/70 font-sans">
                      <span>{s.date} ({s.start_time} - {s.end_time} WIB)</span>
                      <span>&bull;</span>
                      <span>Kode: <strong className="text-black text-sm">{s.code}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={selectedClassId ? `/classes/${selectedClassId}/attendance` : '/classes'}
                      className="px-4 py-2 rounded-lg border-2 border-black bg-black text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-neutral-800 transition-all"
                    >
                      Buka Lembar Sesi &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: REKAP KEHADIRAN KELAS */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-black">
                Rekapitulasi Kehadiran Mahasiswa ({classSummary.length} Peserta)
              </h2>
              <p className="text-xs text-black/70">
                Ambang batas kehadiran UAS: minimal 75% dari total pertemuan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert('Mengunduh rekapitulasi presensi kelas format CSV...')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-white text-xs font-bold shadow-xs hover:bg-neutral-100 cursor-pointer shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>

          {classSummary.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <Users className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-black">Data Rekap Kosong</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Belum ada anggota kelas atau sesi presensi yang selesai dievaluasi.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black">
                    <tr>
                      <th className="p-3.5 sm:p-4">Mahasiswa</th>
                      <th className="p-3.5 sm:p-4 text-center">Hadir</th>
                      <th className="p-3.5 sm:p-4 text-center">Izin</th>
                      <th className="p-3.5 sm:p-4 text-center">Sakit</th>
                      <th className="p-3.5 sm:p-4 text-center">Alpa</th>
                      <th className="p-3.5 sm:p-4 text-center">Persentase</th>
                      <th className="p-3.5 sm:p-4 text-center">Status UAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 font-medium">
                    {classSummary.map((st) => (
                      <tr key={st.student_id} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          {st.student_name}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center font-sans font-bold text-ink">
                          {st.hadir ?? st.attended_count ?? 0}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center font-sans">
                          {st.izin ?? 0}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center font-sans">
                          {st.sakit ?? 0}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center font-sans text-primary-dark">
                          {st.alpa ?? 0}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center font-sans font-bold text-black">
                          {st.percentage}%
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded border text-xs font-sans font-bold',
                              st.can_take_uas
                                ? 'border-ink bg-surface text-ink'
                                : 'border-ink bg-surface text-primary-dark'
                            )}
                          >
                            {st.can_take_uas ? 'MEMENUHI' : 'TIDAK MEMENUHI'}
                          </span>
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

      {/* 5. TAB 3: VERIFIKASI IZIN & SAKIT */}
      {activeTab === 'izin' && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-base text-black">
                Permohonan Dispensasi Izin & Sakit ({leavesList.length})
              </h2>
              <p className="text-xs text-black/70">
                Tinjau surat keterangan dokter atau surat tugas delegasi kampus yang diunggah mahasiswa.
              </p>
            </div>
            <span className="text-xs font-sans font-bold px-3 py-1 bg-white border border-black rounded-lg">
              {leavesList.filter((l) => l.status === 'MENUNGGU VERIFIKASI').length} Menunggu Verifikasi
            </span>
          </div>

          {leavesList.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <FileCheck className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-black">Tidak Ada Pengajuan Izin</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Belum ada permohonan izin sakit atau dispensasi yang diajukan oleh mahasiswa.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black">
                    <tr>
                      <th className="p-3.5 sm:p-4">Mahasiswa</th>
                      <th className="p-3.5 sm:p-4">Tipe & Pertemuan</th>
                      <th className="p-3.5 sm:p-4">Tanggal & Alasan</th>
                      <th className="p-3.5 sm:p-4">Berkas Bukti</th>
                      <th className="p-3.5 sm:p-4 text-center">Status</th>
                      <th className="p-3.5 sm:p-4 text-center">Aksi Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 font-medium">
                    {leavesList.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          {l.student_name}
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded border text-xs font-sans font-bold',
                              l.type === 'SAKIT'
                                ? 'border-ink bg-surface text-primary-dark'
                                : 'border-ink bg-gray-soft text-ink'
                            )}
                          >
                            {l.type}
                          </span>
                          <span className="text-xs font-sans ml-2 text-black/70">
                            Pertemuan #{l.meeting_number}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <div className="font-sans text-xs text-black/60">{l.date}</div>
                          <div className="text-xs text-black/90 line-clamp-2 mt-0.5">{l.reason}</div>
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <button
                            type="button"
                            onClick={() => alert(`Membuka lampiran surat: ${l.attachment_name}`)}
                            className="inline-flex items-center gap-1.5 text-xs text-black hover:text-primary-dark font-bold underline cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>{l.attachment_name}</span>
                          </button>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded border text-xs font-sans font-bold',
                              l.status === 'DISETUJUI'
                                ? 'border-ink bg-surface text-ink'
                                : l.status === 'DITOLAK'
                                ? 'border-ink bg-surface text-primary-dark'
                                : 'border-ink bg-gray-soft text-ink'
                            )}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          {l.status === 'MENUNGGU VERIFIKASI' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleReviewLeave(l.id, 'DISETUJUI')}
                                className="px-2.5 py-1 rounded-lg border-2 border-black bg-gray-dark text-white font-bold text-xs hover:bg-gray-dark cursor-pointer shadow-xs"
                                title="Setujui Izin"
                              >
                                Setujui
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleReviewLeave(l.id, 'DITOLAK')}
                                className="px-2.5 py-1 rounded-lg border-2 border-black bg-primary text-white font-bold text-xs hover:bg-primary cursor-pointer shadow-xs"
                                title="Tolak Izin"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-sans text-black/60">Telah Diverifikasi</span>
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

      {/* TAB ANOMALI: DETEKSI GPS PALSU & VERIFIKASI */}
      {activeTab === 'anomali' && (
        <div className="space-y-5">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-black flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                <span>Deteksi Lokasi Palsu (Mock GPS) & Verifikasi Kehadiran</span>
              </h2>
              <p className="text-xs text-black/80 mt-1 max-w-2xl">
                Sistem memeriksa 4 heuristik integritas GPS (akurasi &lt; 1.0m / &gt; 500m, loncatan kecepatan &gt; 100 km/jam, koordinat identik 6 desimal, dan mismatch IP). Presensi tidak ditolak otomatis, melainkan ditandai untuk keputusan Dosen/Asisten Dosen.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-sans font-bold px-3 py-1 bg-white border border-black rounded-lg">
                {anomaliesList.filter((a) => a.needs_verification).length} Perlu Verifikasi
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg border-2 border-black bg-white shadow-xs">
              <p className="text-[11px] font-bold text-black/60 uppercase font-sans">Total Anomali</p>
              <p className="font-heading font-bold text-xl text-black mt-0.5">{anomaliesList.length}</p>
            </div>
            <div className="p-3 rounded-lg border-2 border-black bg-white shadow-xs">
              <p className="text-[11px] font-bold text-primary uppercase font-sans">Perlu Verifikasi</p>
              <p className="font-heading font-bold text-xl text-primary mt-0.5">
                {anomaliesList.filter((a) => a.needs_verification).length}
              </p>
            </div>
            <div className="p-3 rounded-lg border-2 border-black bg-white shadow-xs">
              <p className="text-[11px] font-bold text-ink uppercase font-sans">Disetujui Sah</p>
              <p className="font-heading font-bold text-xl text-ink mt-0.5">
                {anomaliesList.filter((a) => a.verification_status === 'DISETUJUI').length}
              </p>
            </div>
            <div className="p-3 rounded-lg border-2 border-black bg-white shadow-xs">
              <p className="text-[11px] font-bold text-black/60 uppercase font-sans">Ditolak (Alpa)</p>
              <p className="font-heading font-bold text-xl text-black/80 mt-0.5">
                {anomaliesList.filter((a) => a.verification_status === 'DITOLAK').length}
              </p>
            </div>
          </div>

          {anomaliesList.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <ShieldAlert className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-black">
                Tidak Ada Anomali GPS Terdeteksi
              </h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Seluruh pengisian presensi mahasiswa berjalan dalam batas deviasi sensor normal dan tidak terdeteksi indikasi mock location.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black">
                    <tr>
                      <th className="p-3.5 sm:p-4">Mahasiswa</th>
                      <th className="p-3.5 sm:p-4">Indikasi Anomali GPS</th>
                      <th className="p-3.5 sm:p-4">Data Sensor & Jarak</th>
                      <th className="p-3.5 sm:p-4 text-center">Status</th>
                      <th className="p-3.5 sm:p-4 text-center">Aksi Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 font-medium">
                    {anomaliesList.map((rec) => {
                      const isSelected = selectedAnomalyId === rec.id;
                      return (
                        <tr key={rec.id} className="hover:bg-gray-soft/30 transition-colors">
                          <td className="p-3.5 sm:p-4">
                            <div className="font-bold text-black">{rec.student_name}</div>
                            <div className="text-[11px] text-black/60 font-sans mt-0.5">
                              {new Date(rec.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </div>
                          </td>
                          <td className="p-3.5 sm:p-4 max-w-md">
                            {rec.needs_verification ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-black bg-primary text-white text-[11px] font-bold font-sans mb-1.5">
                                <AlertCircle className="h-3 w-3" />
                                <span>Perlu diverifikasi</span>
                              </div>
                            ) : null}
                            <p className="text-xs text-black/90 font-sans leading-relaxed">
                              {rec.verification_reason || rec.anomaly_reason || 'Penyimpangan data lokasi GPS terdeteksi'}
                            </p>
                          </td>
                          <td className="p-3.5 sm:p-4 text-xs font-sans space-y-1">
                            <div>
                              <span className="font-bold">Lat/Lng:</span>{' '}
                              {rec.user_lat !== undefined && rec.user_lng !== undefined
                                ? `${rec.user_lat.toFixed(6)}, ${rec.user_lng.toFixed(6)}`
                                : '-'}
                            </div>
                            <div>
                              <span className="font-bold">Akurasi:</span>{' '}
                              {rec.user_accuracy !== undefined ? `±${rec.user_accuracy.toFixed(1)}m` : '-'}
                            </div>
                            <div>
                              <span className="font-bold">Jarak:</span>{' '}
                              {rec.distance_meters !== undefined ? `${rec.distance_meters}m` : '-'}
                            </div>
                          </td>
                          <td className="p-3.5 sm:p-4 text-center">
                            {rec.verification_status === 'DISETUJUI' ? (
                              <span className="px-2 py-0.5 rounded border-2 border-black bg-surface text-ink text-xs font-bold font-sans">
                                ✓ Disetujui Sah
                              </span>
                            ) : rec.verification_status === 'DITOLAK' ? (
                              <span className="px-2 py-0.5 rounded border-2 border-black bg-primary text-white text-xs font-bold font-sans">
                                ✗ Ditolak (Alpa)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded border-2 border-black bg-gray-soft text-black text-xs font-bold font-sans">
                                Menunggu
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 sm:p-4 text-center">
                            {rec.needs_verification ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handleVerifyAttendance(rec.id, 'DISETUJUI', reviewNote)}
                                    className="px-2.5 py-1 rounded-lg border-2 border-black bg-ink text-white font-bold text-xs hover:bg-neutral-800 cursor-pointer shadow-xs"
                                    title="Setujui dan nyatakan presensi sah"
                                  >
                                    Setujui
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handleVerifyAttendance(rec.id, 'DITOLAK', reviewNote)}
                                    className="px-2.5 py-1 rounded-lg border-2 border-black bg-primary text-white font-bold text-xs hover:bg-primary-dark cursor-pointer shadow-xs"
                                    title="Tolak dan ubah status menjadi Alpa"
                                  >
                                    Tolak
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedAnomalyId(isSelected ? null : rec.id)}
                                  className="text-[11px] text-black/70 hover:text-black underline font-sans"
                                >
                                  {isSelected ? 'Tutup Catatan' : '+ Beri Catatan'}
                                </button>
                                {isSelected && (
                                  <div className="mt-2 space-y-1.5 text-left">
                                    <input
                                      type="text"
                                      placeholder="Catatan verifikasi (opsional)..."
                                      value={reviewNote}
                                      onChange={(e) => setReviewNote(e.target.value)}
                                      className="w-full text-xs p-1.5 border border-black rounded bg-white"
                                    />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-[11px] font-sans text-black/70 max-w-[140px] mx-auto">
                                <span>{rec.verification_note || 'Selesai ditinjau'}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 5: PENGATURAN LOKASI GEOFENCE */}
      {activeTab === 'lokasi' && (
        <div className="max-w-3xl space-y-6">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl">
            <h2 className="font-heading font-bold text-base text-black flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Konfigurasi Geofencing & Toleransi Presensi</span>
            </h2>
            <p className="text-xs text-black/70 mt-1">
              Atur koordinat pusat ruang kelas, batas radius presensi mahasiswa di HP/laptop, dan durasi toleransi keterlambatan.
            </p>
          </div>

          <form onSubmit={handleSaveLocation} className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-black font-sans">
                Nama Ruang / Lokasi Perkuliahan
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full rounded-lg border-2 border-black p-3 text-xs sm:text-sm font-medium bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-black font-sans">
                  Latitude Titik Pusat
                </label>
                <input
                  type="text"
                  required
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full rounded-lg border-2 border-black p-3 text-xs sm:text-sm font-sans bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-black font-sans">
                  Longitude Titik Pusat
                </label>
                <input
                  type="text"
                  required
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full rounded-lg border-2 border-black p-3 text-xs sm:text-sm font-sans bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-black font-sans">
                  Radius Geofence (Meter)
                </label>
                <select
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(e.target.value)}
                  className="w-full rounded-lg border-2 border-black p-3 text-xs sm:text-sm font-bold bg-white"
                >
                  <option value="30">30 Meter (Sangat Ketat - Ruang Lab)</option>
                  <option value="50">50 Meter (Standar - Gedung Kuliah)</option>
                  <option value="100">100 Meter (Fleksibel - Area Fakultas)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-black font-sans">
                  Toleransi Keterlambatan (Menit)
                </label>
                <select
                  value={lateThreshold}
                  onChange={(e) => setLateThreshold(e.target.value)}
                  className="w-full rounded-lg border-2 border-black p-3 text-xs sm:text-sm font-bold bg-white"
                >
                  <option value="10">10 Menit</option>
                  <option value="15">15 Menit (Standar Akademik)</option>
                  <option value="30">30 Menit</option>
                </select>
              </div>
            </div>

            {!isDemo && (
              <div className="p-3 rounded-lg border-2 border-black bg-gray-soft text-xs text-ink font-medium space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-ink" />
                  <span>Pemberitahuan Persistensi Database (Fase 3)</span>
                </p>
                <p>
                  Penyimpanan konfigurasi Geofence ke tabel database kelas sedang dalam penyiapan. Di luar mode demo, tombol simpan dinonaktifkan untuk mencegah sukses palsu.
                </p>
              </div>
            )}

            <div className="pt-3 border-t-2 border-black flex items-center justify-between">
              {isSavedLocation && (
                <span className="text-xs font-bold font-sans text-ink flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Pengaturan lokasi berhasil disimpan!
                </span>
              )}
              {!isDemo ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-black bg-neutral-200 text-neutral-500 text-xs sm:text-sm font-bold cursor-not-allowed ml-auto"
                >
                  <span>Fitur Segera Aktif (Belum Tersimpan ke Database)</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-black bg-black text-white text-xs sm:text-sm font-bold shadow-retro hover:bg-neutral-800 transition-all cursor-pointer ml-auto"
                >
                  <span>Simpan Pengaturan Geofence</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
