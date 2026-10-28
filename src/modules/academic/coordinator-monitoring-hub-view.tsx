'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  UserCheck,
  FileSpreadsheet,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart2,
  ArrowRight,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';

export const COORDINATOR_MONITORING_TABS = [
  { id: 'kelas', label: 'Kelas', icon: Activity },
  { id: 'dosen', label: 'Dosen', icon: UserCheck },
  { id: 'presensi', label: 'Presensi Prodi', icon: FileSpreadsheet },
  { id: 'ujian', label: 'Ujian Berlangsung', icon: ShieldAlert },
] as const;

export type CoordinatorMonitoringTabId = (typeof COORDINATOR_MONITORING_TABS)[number]['id'];

interface CoordinatorMonitoringHubViewProps {
  isDemo?: boolean;
  basePath?: string;
}

export function CoordinatorMonitoringHubView({
  isDemo = true,
  basePath = '/coordinator/monitoring',
}: CoordinatorMonitoringHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as CoordinatorMonitoringTabId;
  const validTabs: CoordinatorMonitoringTabId[] = ['kelas', 'dosen', 'presensi', 'ujian'];
  const activeTab: CoordinatorMonitoringTabId = validTabs.includes(tabParam) ? tabParam : 'kelas';

  const setTab = (tab: CoordinatorMonitoringTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${basePath}?${params.toString()}`);
  };

  const CLASS_PROGRESS = isDemo
    ? [
        {
          id: 'cp-1',
          code: 'IF-301',
          name: 'Pemrograman Web Lanjut (IF-3A)',
          lecturer: 'Dr. Budi Santoso, M.Kom.',
          meetingsHeld: 8,
          totalMeetings: 16,
          percent: 50,
          status: 'ON_TRACK',
        },
        {
          id: 'cp-2',
          code: 'IF-302',
          name: 'Basis Data Terdistribusi (IF-3B)',
          lecturer: 'Prof. Dewi Lestari, Ph.D.',
          meetingsHeld: 9,
          totalMeetings: 16,
          percent: 56.25,
          status: 'ON_TRACK',
        },
        {
          id: 'cp-3',
          code: 'IF-303',
          name: 'Jaringan Komputer & Cloud (IF-3C)',
          lecturer: 'Ir. Hendra Wijaya, M.T.',
          meetingsHeld: 5,
          totalMeetings: 16,
          percent: 31.25,
          status: 'BEHIND',
        },
      ]
    : [];

  const LECTURER_PERFORMANCE = isDemo
    ? [
        {
          id: 'lp-1',
          name: 'Dr. Budi Santoso, M.Kom.',
          nidn: '0012345678',
          attendanceRate: '100%',
          syllabusCoverage: '92%',
          studentEvaluation: '4.8 / 5.0',
          status: 'SANGAT_BAIK',
        },
        {
          id: 'lp-2',
          name: 'Prof. Dewi Lestari, Ph.D.',
          nidn: '0087654321',
          attendanceRate: '95%',
          syllabusCoverage: '90%',
          studentEvaluation: '4.9 / 5.0',
          status: 'SANGAT_BAIK',
        },
        {
          id: 'lp-3',
          name: 'Ir. Hendra Wijaya, M.T.',
          nidn: '0034567890',
          attendanceRate: '80%',
          syllabusCoverage: '75%',
          studentEvaluation: '4.1 / 5.0',
          status: 'PERLU_PERHATIAN',
        },
      ]
    : [];

  const ATTENDANCE_STATS = isDemo
    ? [
        {
          batch: 'Angkatan 2024 (Semester 3)',
          studentCount: 120,
          avgAttendance: '91.4%',
          eligibleForExams: '112 Mahasiswa',
          warningStudents: '8 Mahasiswa',
        },
        {
          batch: 'Angkatan 2023 (Semester 5)',
          studentCount: 115,
          avgAttendance: '88.7%',
          eligibleForExams: '108 Mahasiswa',
          warningStudents: '7 Mahasiswa',
        },
        {
          batch: 'Angkatan 2022 (Semester 7)',
          studentCount: 105,
          avgAttendance: '94.2%',
          eligibleForExams: '103 Mahasiswa',
          warningStudents: '2 Mahasiswa',
        },
      ]
    : [];

  const ACTIVE_EXAMS = isDemo
    ? [
        {
          id: 'ex-1',
          code: 'IF-301',
          title: 'UTS Teori: Pemrograman Web Lanjut',
          lecturer: 'Dr. Budi Santoso, M.Kom.',
          totalStudents: 38,
          activeNow: 38,
          proctoringStatus: 'AMAN',
          violations: 0,
          schedule: 'Hari Ini, 08:00 - 09:30 WIB',
        },
        {
          id: 'ex-2',
          code: 'IF-302',
          title: 'UTS Praktikum: Basis Data Terdistribusi',
          lecturer: 'Prof. Dewi Lestari, Ph.D.',
          totalStudents: 40,
          activeNow: 39,
          proctoringStatus: 'WARNING',
          violations: 2,
          schedule: 'Hari Ini, 10:00 - 11:30 WIB',
        },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up font-sans">
      {/* 1. HEADER RETRO */}
      <RetroWindow
        title="monitoring_akademik_prodi.app"
        badge="Supervisi Pembelajaran"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 border-2 border-black bg-[#ED1C24] text-white shadow-retro-sm">
                <Activity className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-[#111111]">
                Monitoring Akademik Program Studi
              </h1>
            </div>
            <p className="text-sm sm:text-base text-[#111111] font-semibold max-w-3xl leading-relaxed">
              Supervisi keterlaksanaan perkuliahan real-time: capaian silabus kelas, kedisiplinan mengajar dosen, kepatuhan presensi mahasiswa prodi, dan integritas sesi ujian.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-bold text-[#111111] shadow-retro-sm">
              Semester Ganjil 2026/2027
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB CONTROLLER */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {COORDINATOR_MONITORING_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 border-2 border-black text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 font-sans',
                isSelected
                  ? 'bg-black text-white border-b-4 border-b-[#ED1C24] shadow-retro-sm'
                  : 'bg-white text-[#111111] hover:bg-gray-soft shadow-retro-sm'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: KELAS */}
      {activeTab === 'kelas' && (
        <div className="space-y-5">
          <div className="p-4 bg-gray-soft border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-retro-sm">
            <div>
              <h2 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#ED1C24]" />
                <span>Keterlaksanaan Kelas (Target Minimal 16 Pertemuan)</span>
              </h2>
              <p className="text-xs text-[#111111] font-semibold mt-1">
                Monitoring kemajuan pertemuan tatap muka/daring seluruh kelas di lingkungan prodi.
              </p>
            </div>
            <span className="text-xs font-bold text-[#111111]">
              Total Rombel: {CLASS_PROGRESS.length}
            </span>
          </div>

          {CLASS_PROGRESS.length === 0 ? (
            <div className="p-10 text-center space-y-3 border-2 border-dashed border-black/30 bg-white">
              <Activity className="h-10 w-10 text-[#111111]/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-[#111111]">Belum Ada Kelas Dimonitor</h3>
              <p className="text-xs sm:text-sm text-[#111111] font-semibold max-w-md mx-auto">
                Data kemajuan pertemuan kelas belum tercatat di semester ini.
              </p>
            </div>
          ) : (
            <div className="border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm font-sans">
                  <thead className="border-b-2 border-black bg-gray-soft font-bold uppercase text-[#111111]">
                    <tr>
                      <th className="p-3.5 sm:p-4">Kode & Nama Kelas</th>
                      <th className="p-3.5 sm:p-4">Dosen Pengampu</th>
                      <th className="p-3.5 sm:p-4 text-center">Realisasi Pertemuan</th>
                      <th className="p-3.5 sm:p-4">Kemajuan Silabus</th>
                      <th className="p-3.5 sm:p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10">
                    {CLASS_PROGRESS.map((cp) => (
                      <tr key={cp.id} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4">
                          <span className="text-xs font-bold text-[#111111] block">{cp.code}</span>
                          <span className="font-bold text-[#111111]">{cp.name}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-medium text-[#111111]">{cp.lecturer}</td>
                        <td className="p-3.5 sm:p-4 text-center font-bold text-[#111111]">
                          {cp.meetingsHeld} / {cp.totalMeetings} Sesi
                        </td>
                        <td className="p-3.5 sm:p-4 max-w-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-full bg-neutral-200 overflow-hidden border border-black">
                              <div
                                className="h-full bg-[#ED1C24]"
                                style={{ width: `${cp.percent}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-[#111111]">{cp.percent.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-1 border-2 border-black text-xs font-bold shadow-retro-sm',
                              cp.status === 'ON_TRACK'
                                ? 'bg-white text-[#111111]'
                                : 'bg-[#ED1C24] text-white'
                            )}
                          >
                            {cp.status === 'ON_TRACK' ? 'Sesuai Jadwal' : 'Tertinggal'}
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

      {/* 4. TAB 2: DOSEN */}
      {activeTab === 'dosen' && (
        <div className="space-y-5">
          <div className="p-4 bg-gray-soft border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-retro-sm">
            <div>
              <h2 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#ED1C24]" />
                <span>Monitoring Kedisiplinan & Kinerja Mengajar Dosen</span>
              </h2>
              <p className="text-xs text-[#111111] font-semibold mt-1">
                Evaluasi tingkat kehadiran mengajar dosen pengampu dan ketuntasan pengisian materi ajar.
              </p>
            </div>
            <span className="text-xs font-bold text-[#111111]">
              Total Dosen: {LECTURER_PERFORMANCE.length}
            </span>
          </div>

          {LECTURER_PERFORMANCE.length === 0 ? (
            <div className="p-10 text-center space-y-3 border-2 border-dashed border-black/30 bg-white">
              <UserCheck className="h-10 w-10 text-[#111111]/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-[#111111]">Belum Ada Data Kinerja Dosen</h3>
              <p className="text-xs sm:text-sm text-[#111111] font-semibold max-w-md mx-auto">
                Evaluasi presensi mengajar dosen belum tersedia untuk semester ini.
              </p>
            </div>
          ) : (
            <div className="border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm font-sans">
                  <thead className="border-b-2 border-black bg-gray-soft font-bold uppercase text-[#111111]">
                    <tr>
                      <th className="p-3.5 sm:p-4">Dosen Pengampu</th>
                      <th className="p-3.5 sm:p-4">NIDN</th>
                      <th className="p-3.5 sm:p-4 text-center">Tingkat Kehadiran</th>
                      <th className="p-3.5 sm:p-4 text-center">Ketuntasan Silabus</th>
                      <th className="p-3.5 sm:p-4 text-center">Indeks Kepuasan Mahasiswa</th>
                      <th className="p-3.5 sm:p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10">
                    {LECTURER_PERFORMANCE.map((lp) => (
                      <tr key={lp.id} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-[#111111]">{lp.name}</td>
                        <td className="p-3.5 sm:p-4 font-semibold text-[#111111]">{lp.nidn}</td>
                        <td className="p-3.5 sm:p-4 text-center font-bold text-[#111111]">{lp.attendanceRate}</td>
                        <td className="p-3.5 sm:p-4 text-center font-bold text-[#111111]">{lp.syllabusCoverage}</td>
                        <td className="p-3.5 sm:p-4 text-center font-black text-[#111111]">
                          {lp.studentEvaluation}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-1 border-2 border-black text-xs font-bold shadow-retro-sm',
                              lp.status === 'SANGAT_BAIK'
                                ? 'bg-white text-[#111111]'
                                : 'bg-[#ED1C24] text-white'
                            )}
                          >
                            {lp.status === 'SANGAT_BAIK' ? 'Sangat Baik' : 'Perlu Pendampingan'}
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

      {/* 5. TAB 3: PRESENSI PRODI */}
      {activeTab === 'presensi' && (
        <div className="space-y-5">
          <div className="p-4 bg-gray-soft border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-retro-sm">
            <div>
              <h2 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#ED1C24]" />
                <span>Statistik Agregasi Presensi Mahasiswa per Angkatan</span>
              </h2>
              <p className="text-xs text-[#111111] font-semibold mt-1">
                Kepatuhan ambang batas kehadiran minimal 75% sebagai prasyarat mengikuti Ujian Akhir Semester (UAS).
              </p>
            </div>
            <span className="text-xs font-bold text-[#111111]">
              Syarat Ujian: &ge; 75%
            </span>
          </div>

          {ATTENDANCE_STATS.length === 0 ? (
            <div className="p-10 text-center space-y-3 border-2 border-dashed border-black/30 bg-white">
              <FileSpreadsheet className="h-10 w-10 text-[#111111]/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-[#111111]">Belum Ada Rekap Presensi</h3>
              <p className="text-xs sm:text-sm text-[#111111] font-semibold max-w-md mx-auto">
                Data kehadiran mahasiswa per angkatan belum dapat diagregasi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {ATTENDANCE_STATS.map((stat, idx) => (
                <div key={idx} className="border-2 border-black bg-white p-5 shadow-retro space-y-4">
                  <h3 className="font-heading font-black text-base text-[#111111]">{stat.batch}</h3>
                  <div className="space-y-2 p-3 bg-neutral-50 border-2 border-black text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#111111] font-medium">Total Mahasiswa:</span>
                      <span className="font-black text-[#111111]">{stat.studentCount} Orang</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#111111] font-medium">Rata-rata Presensi:</span>
                      <span className="font-black text-[#111111]">{stat.avgAttendance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#111111] font-medium">Layak Mengikuti UAS:</span>
                      <span className="font-black text-[#111111]">{stat.eligibleForExams}</span>
                    </div>
                    <div className="flex justify-between border-t border-black/20 pt-1.5 text-[#ED1C24] font-bold">
                      <span>Peringatan Kehadiran (&lt;75%):</span>
                      <span className="font-black">{stat.warningStudents}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 4: UJIAN BERLANGSUNG */}
      {activeTab === 'ujian' && (
        <div className="space-y-5">
          <div className="p-4 bg-gray-soft border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-retro-sm">
            <div>
              <h2 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-[#ED1C24]" />
                <span>Supervisi Ujian Semester Sedang Berlangsung</span>
              </h2>
              <p className="text-xs text-[#111111] font-semibold mt-1">
                Pengawasan langsung sesi ujian berbasis komputer (CBT) dan integritas telemetri proctoring prodi.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-[#ED1C24] text-white border-2 border-black shadow-retro-sm rounded-full">
              Live Proctoring Aktif
            </span>
          </div>

          {ACTIVE_EXAMS.length === 0 ? (
            <div className="p-10 text-center space-y-3 border-2 border-dashed border-black/30 bg-white">
              <ShieldAlert className="h-10 w-10 text-[#111111]/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-[#111111]">Tidak Ada Ujian Aktif Saat Ini</h3>
              <p className="text-xs sm:text-sm text-[#111111] font-semibold max-w-md mx-auto">
                Saat ini tidak ada sesi ujian CBT yang sedang diselenggarakan oleh program studi.
              </p>
            </div>
          ) : (
            <div className="border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm font-sans">
                  <thead className="border-b-2 border-black bg-gray-soft font-bold uppercase text-[#111111]">
                    <tr>
                      <th className="p-3.5 sm:p-4">Kode & Judul Ujian</th>
                      <th className="p-3.5 sm:p-4">Dosen Pengawas</th>
                      <th className="p-3.5 sm:p-4 text-center">Peserta Ujian</th>
                      <th className="p-3.5 sm:p-4">Jadwal Sesi</th>
                      <th className="p-3.5 sm:p-4 text-center">Status Integritas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10">
                    {ACTIVE_EXAMS.map((ex) => (
                      <tr key={ex.id} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4">
                          <span className="text-xs font-bold text-[#111111] block">{ex.code}</span>
                          <span className="font-bold text-[#111111]">{ex.title}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-medium text-[#111111]">{ex.lecturer}</td>
                        <td className="p-3.5 sm:p-4 text-center font-bold text-[#111111]">
                          {ex.activeNow} / {ex.totalStudents} Mahasiswa
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs font-medium text-[#111111]">{ex.schedule}</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-1 border-2 border-black text-xs font-bold shadow-retro-sm',
                              ex.proctoringStatus === 'AMAN'
                                ? 'bg-white text-[#111111]'
                                : 'bg-[#ED1C24] text-white'
                            )}
                          >
                            {ex.proctoringStatus === 'AMAN' ? 'Integritas Terjaga' : `${ex.violations} Insiden Terdeteksi`}
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
    </div>
  );
}
