'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  UserCheck,
  FolderArchive,
  BookOpen,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';

export const COORDINATOR_ASSIGNMENTS_TABS = [
  { id: 'dosen-pengampu', label: 'Dosen Pengampu', icon: Users },
  { id: 'dosen-wali', label: 'Dosen Wali / PA', icon: UserCheck },
  { id: 'kelas-prodi', label: 'Kelas Prodi', icon: FolderArchive },
] as const;

export type CoordinatorAssignmentsTabId = (typeof COORDINATOR_ASSIGNMENTS_TABS)[number]['id'];

interface CoordinatorAssignmentsHubViewProps {
  isDemo?: boolean;
  basePath?: string;
}

export function CoordinatorAssignmentsHubView({
  isDemo = true,
  basePath = '/coordinator/assignments',
}: CoordinatorAssignmentsHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as CoordinatorAssignmentsTabId;
  const validTabs: CoordinatorAssignmentsTabId[] = ['dosen-pengampu', 'dosen-wali', 'kelas-prodi'];
  const activeTab: CoordinatorAssignmentsTabId = validTabs.includes(tabParam)
    ? tabParam
    : 'dosen-pengampu';

  const setTab = (tab: CoordinatorAssignmentsTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${basePath}?${params.toString()}`);
  };

  const LECTURER_ASSIGNMENTS = isDemo
    ? [
        {
          id: 'lec-1',
          name: 'Dr. Budi Santoso, M.Kom.',
          nidn: '0012345678',
          sksTotal: 14,
          classes: ['Pemrograman Web Lanjut (IF-3A)', 'Algoritma & Pemrograman (IF-1A)'],
          status: 'MEMENUHI_BKD',
        },
        {
          id: 'lec-2',
          name: 'Prof. Dewi Lestari, Ph.D.',
          nidn: '0087654321',
          sksTotal: 12,
          classes: ['Basis Data Terdistribusi (IF-3B)', 'Metodologi Penelitian (IF-5A)'],
          status: 'MEMENUHI_BKD',
        },
        {
          id: 'lec-3',
          name: 'Ir. Hendra Wijaya, M.T.',
          nidn: '0034567890',
          sksTotal: 8,
          classes: ['Jaringan Komputer & Cloud (IF-3C)'],
          status: 'KURANG_SKS',
        },
      ]
    : [];

  const ACADEMIC_ADVISORS = isDemo
    ? [
        {
          id: 'adv-1',
          name: 'Dr. Budi Santoso, M.Kom.',
          batch: 'Angkatan 2024 (Semester 3)',
          studentCount: 35,
          approvedKrs: 32,
          pendingKrs: 3,
        },
        {
          id: 'adv-2',
          name: 'Prof. Dewi Lestari, Ph.D.',
          batch: 'Angkatan 2023 (Semester 5)',
          studentCount: 38,
          approvedKrs: 38,
          pendingKrs: 0,
        },
        {
          id: 'adv-3',
          name: 'Ir. Hendra Wijaya, M.T.',
          batch: 'Angkatan 2025 (Semester 1)',
          studentCount: 40,
          approvedKrs: 36,
          pendingKrs: 4,
        },
      ]
    : [];

  const STUDY_PROGRAM_CLASSES = isDemo
    ? [
        {
          id: 'cls-1',
          code: 'IF-301',
          name: 'Pemrograman Web Lanjut',
          section: 'IF-3A',
          lecturer: 'Dr. Budi Santoso, M.Kom.',
          capacity: 40,
          enrolled: 38,
          schedule: 'Senin, 08:00 - 10:30 WIB (Lab RPL)',
        },
        {
          id: 'cls-2',
          code: 'IF-302',
          name: 'Basis Data Terdistribusi',
          section: 'IF-3B',
          lecturer: 'Prof. Dewi Lestari, Ph.D.',
          capacity: 40,
          enrolled: 40,
          schedule: 'Rabu, 13:00 - 15:30 WIB (Ruang 304)',
        },
        {
          id: 'cls-3',
          code: 'IF-303',
          name: 'Jaringan Komputer & Cloud',
          section: 'IF-3C',
          lecturer: 'Ir. Hendra Wijaya, M.T.',
          capacity: 40,
          enrolled: 36,
          schedule: 'Kamis, 10:00 - 12:30 WIB (Lab Jaringan)',
        },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up font-sans">
      {/* 1. HEADER RETRO */}
      <RetroWindow
        title="penugasan_dan_kelas_prodi.app"
        badge="Manajemen Program Studi"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 border-2 border-black bg-[#ED1C24] text-white shadow-retro-sm">
                <Users className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-[#111111]">
                Penugasan Dosen Program Studi
              </h1>
            </div>
            <p className="text-sm sm:text-base text-[#111111] font-semibold max-w-3xl leading-relaxed">
              Distribusi beban mengajar dosen (BKD), penugasan pembimbing akademik (dosen wali), serta supervisi rombongan belajar kelas prodi semester aktif.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-bold text-[#111111] shadow-retro-sm">
              Teknik Informatika (S1)
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB CONTROLLER */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {COORDINATOR_ASSIGNMENTS_TABS.map((tab) => {
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

      {/* 3. TAB 1: DOSEN PENGAMPU */}
      {activeTab === 'dosen-pengampu' && (
        <div className="space-y-5">
          <div className="p-4 bg-gray-soft border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-retro-sm">
            <div>
              <h2 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#ED1C24]" />
                <span>Distribusi Beban Kerja Dosen (BKD Standar 12-16 SKS)</span>
              </h2>
              <p className="text-xs text-[#111111] font-semibold mt-1">
                Pantau pemenuhan syarat SKS mengajar dosen tetap prodi per semester berjalan.
              </p>
            </div>
            <span className="text-xs font-bold text-[#111111]">
              Total Dosen Aktif: {LECTURER_ASSIGNMENTS.length}
            </span>
          </div>

          {LECTURER_ASSIGNMENTS.length === 0 ? (
            <div className="p-10 text-center space-y-3 border-2 border-dashed border-black/30 bg-white">
              <Users className="h-10 w-10 text-[#111111]/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-[#111111]">Belum Ada Penugasan Dosen</h3>
              <p className="text-xs sm:text-sm text-[#111111] font-semibold max-w-md mx-auto">
                Data penugasan dosen pengampu untuk program studi ini belum tersedia di pangkalan data semester ini.
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
                      <th className="p-3.5 sm:p-4 text-center">Beban SKS</th>
                      <th className="p-3.5 sm:p-4">Kelas Diampu</th>
                      <th className="p-3.5 sm:p-4 text-center">Status BKD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10">
                    {LECTURER_ASSIGNMENTS.map((lec) => (
                      <tr key={lec.id} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-[#111111]">{lec.name}</td>
                        <td className="p-3.5 sm:p-4 font-semibold text-[#111111]">{lec.nidn}</td>
                        <td className="p-3.5 sm:p-4 text-center font-black text-[#111111]">{lec.sksTotal} SKS</td>
                        <td className="p-3.5 sm:p-4 text-[#111111]">
                          <ul className="list-disc list-inside space-y-0.5 text-xs font-medium">
                            {lec.classes.map((clsName, idx) => (
                              <li key={idx}>{clsName}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-1 border-2 border-black text-xs font-bold shadow-retro-sm',
                              lec.status === 'MEMENUHI_BKD'
                                ? 'bg-white text-[#111111]'
                                : 'bg-gray-soft text-[#111111]'
                            )}
                          >
                            {lec.status === 'MEMENUHI_BKD' ? 'Optimal (12-16 SKS)' : 'Kurang (< 12 SKS)'}
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

      {/* 4. TAB 2: DOSEN WALI / PA */}
      {activeTab === 'dosen-wali' && (
        <div className="space-y-5">
          <div className="p-4 bg-gray-soft border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-retro-sm">
            <div>
              <h2 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#ED1C24]" />
                <span>Distribusi Dosen Wali / Pembimbing Akademik (PA)</span>
              </h2>
              <p className="text-xs text-[#111111] font-semibold mt-1">
                Pantau progres bimbingan pengisian KRS dan konsultasi akademik per angkatan mahasiswa.
              </p>
            </div>
            <span className="text-xs font-bold text-[#111111]">
              Total Dosen Wali: {ACADEMIC_ADVISORS.length}
            </span>
          </div>

          {ACADEMIC_ADVISORS.length === 0 ? (
            <div className="p-10 text-center space-y-3 border-2 border-dashed border-black/30 bg-white">
              <UserCheck className="h-10 w-10 text-[#111111]/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-[#111111]">Belum Ada Dosen Wali</h3>
              <p className="text-xs sm:text-sm text-[#111111] font-semibold max-w-md mx-auto">
                Data pembimbing akademik mahasiswa belum diset untuk program studi ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {ACADEMIC_ADVISORS.map((adv) => (
                <div key={adv.id} className="border-2 border-black bg-white p-5 shadow-retro space-y-4">
                  <div className="space-y-1">
                    <span className="px-2.5 py-1 border-2 border-black bg-gray-soft text-xs font-bold shadow-retro-sm">
                      {adv.batch}
                    </span>
                    <h3 className="font-heading font-black text-base text-[#111111] mt-3">{adv.name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-neutral-50 border-2 border-black text-xs">
                    <div>
                      <span className="text-[#111111] text-xs font-medium block">Total Mahasiswa:</span>
                      <span className="font-black text-sm text-[#111111]">{adv.studentCount} Mhs</span>
                    </div>
                    <div>
                      <span className="text-[#111111] text-xs font-medium block">KRS Disetujui:</span>
                      <span className="font-black text-sm text-[#111111]">{adv.approvedKrs} Mhs</span>
                    </div>
                  </div>

                  {adv.pendingKrs > 0 ? (
                    <div className="flex items-center gap-1.5 text-xs text-[#ED1C24] font-bold">
                      <Clock className="h-4 w-4 text-[#ED1C24]" />
                      <span>{adv.pendingKrs} KRS Menunggu Persetujuan</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-[#111111] font-bold">
                      <CheckCircle2 className="h-4 w-4 text-[#111111]" />
                      <span>Semua KRS Angkatan Telah Disetujui</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: KELAS PRODI */}
      {activeTab === 'kelas-prodi' && (
        <div className="space-y-5">
          <div className="p-4 bg-gray-soft border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-retro-sm">
            <div>
              <h2 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
                <FolderArchive className="h-5 w-5 text-[#ED1C24]" />
                <span>Daftar Rombongan Belajar Kelas Aktif Program Studi</span>
              </h2>
              <p className="text-xs text-[#111111] font-semibold mt-1">
                Daftar seluruh kelas paralel yang diselenggarakan prodi pada semester berjalan.
              </p>
            </div>
            <span className="text-xs font-bold text-[#111111]">
              Total Kelas: {STUDY_PROGRAM_CLASSES.length}
            </span>
          </div>

          {STUDY_PROGRAM_CLASSES.length === 0 ? (
            <div className="p-10 text-center space-y-3 border-2 border-dashed border-black/30 bg-white">
              <FolderArchive className="h-10 w-10 text-[#111111]/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-[#111111]">Belum Ada Kelas Aktif</h3>
              <p className="text-xs sm:text-sm text-[#111111] font-semibold max-w-md mx-auto">
                Belum ada rombongan belajar kelas yang diterbitkan untuk semester aktif ini.
              </p>
            </div>
          ) : (
            <div className="border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm font-sans">
                  <thead className="border-b-2 border-black bg-gray-soft font-bold uppercase text-[#111111]">
                    <tr>
                      <th className="p-3.5 sm:p-4">Kode & Mata Kuliah</th>
                      <th className="p-3.5 sm:p-4">Kelas</th>
                      <th className="p-3.5 sm:p-4">Dosen Pengampu</th>
                      <th className="p-3.5 sm:p-4 text-center">Kapasitas</th>
                      <th className="p-3.5 sm:p-4">Jadwal & Ruang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10">
                    {STUDY_PROGRAM_CLASSES.map((cls) => (
                      <tr key={cls.id} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4">
                          <span className="text-xs font-bold text-[#111111] block">{cls.code}</span>
                          <span className="font-bold text-[#111111]">{cls.name}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-bold text-[#111111]">{cls.section}</td>
                        <td className="p-3.5 sm:p-4 font-medium text-[#111111]">{cls.lecturer}</td>
                        <td className="p-3.5 sm:p-4 text-center font-bold text-[#111111]">
                          {cls.enrolled} / {cls.capacity}
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs font-medium text-[#111111]">{cls.schedule}</td>
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
