'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Compass,
  BookOpen,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';

export const STAFF_MASTER_TABS = [
  { id: 'program-studi', label: 'Program Studi', icon: Compass },
  { id: 'mata-kuliah', label: 'Mata Kuliah', icon: BookOpen },
  { id: 'tahun-ajaran', label: 'Tahun Ajaran', icon: Calendar },
  { id: 'ruang-dan-titik-lokasi', label: 'Ruang & Titik Lokasi', icon: MapPin },
] as const;

export type StaffMasterTabId = (typeof STAFF_MASTER_TABS)[number]['id'];

interface StaffMasterHubViewProps {
  isDemo?: boolean;
}

export function StaffMasterHubView({ isDemo = true }: StaffMasterHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as StaffMasterTabId;
  const validTabs: StaffMasterTabId[] = [
    'program-studi',
    'mata-kuliah',
    'tahun-ajaran',
    'ruang-dan-titik-lokasi',
  ];
  const activeTab: StaffMasterTabId = validTabs.includes(tabParam)
    ? tabParam
    : 'program-studi';

  const setTab = (tab: StaffMasterTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/staff/master?${params.toString()}`);
  };

  const [searchQuery, setSearchQuery] = useState('');

  // Sample data
  const PROGRAMS = [
    { code: 'IF-S1', name: 'Teknik Informatika', degree: 'S1', faculty: 'Fakultas Teknologi Informasi', coordinator: 'Dr. Budi Santoso, M.Kom.', accreditation: 'Unggul', activeStudents: 840 },
    { code: 'SI-S1', name: 'Sistem Informasi', degree: 'S1', faculty: 'Fakultas Teknologi Informasi', coordinator: 'Dr. Siti Aminah, M.T.', accreditation: 'A', activeStudents: 620 },
    { code: 'TI-S1', name: 'Teknologi Informasi', degree: 'S1', faculty: 'Fakultas Teknologi Informasi', coordinator: 'Ir. Hendra Wijaya, M.T.', accreditation: 'Baik Sekali', activeStudents: 480 },
    { code: 'DKV-S1', name: 'Desain Komunikasi Visual', degree: 'S1', faculty: 'Fakultas Seni & Desain', coordinator: 'Dian Permata, M.Sn.', accreditation: 'A', activeStudents: 510 },
  ];

  const COURSES = [
    { code: 'IF-301', name: 'Pemrograman Web Lanjut', sks: 3, type: 'Teori & Praktikum', semester: 5, prodi: 'Teknik Informatika', status: 'VALIDATED', proposalStatus: 'APPROVED' },
    { code: 'IF-302', name: 'Basis Data Terdistribusi', sks: 3, type: 'Teori & Praktikum', semester: 5, prodi: 'Teknik Informatika', status: 'VALIDATED', proposalStatus: 'APPROVED' },
    { code: 'IF-401', name: 'Kecerdasan Buatan & Machine Learning', sks: 3, type: 'Teori', semester: 7, prodi: 'Teknik Informatika', status: 'VALIDATED', proposalStatus: 'APPROVED' },
    { code: 'IF-408', name: 'Keamanan Siber & Kriptografi', sks: 2, type: 'Teori', semester: 7, prodi: 'Teknik Informatika', status: 'VALIDATED', proposalStatus: 'APPROVED' },
    { code: 'IF-502', name: 'Komputasi Awan Skala Besar', sks: 3, type: 'Pilihan Khusus', semester: 7, prodi: 'Teknik Informatika', status: 'PENDING_VALIDATION', proposalStatus: 'USULAN_PRODI' },
  ];

  const ACADEMIC_YEARS = [
    { code: '2026/2027-1', name: 'Tahun Ajaran 2026/2027 Ganjil', startDate: '01 Sep 2026', endDate: '31 Jan 2027', isCurrent: true, krsLock: '15 Sep 2026', gradeLock: '25 Jan 2027' },
    { code: '2025/2026-2', name: 'Tahun Ajaran 2025/2026 Genap', startDate: '01 Feb 2026', endDate: '30 Jun 2026', isCurrent: false, krsLock: '15 Feb 2026', gradeLock: '25 Jun 2026' },
    { code: '2025/2026-1', name: 'Tahun Ajaran 2025/2026 Ganjil', startDate: '01 Sep 2025', endDate: '31 Jan 2026', isCurrent: false, krsLock: '15 Sep 2025', gradeLock: '25 Jan 2026' },
  ];

  const ROOMS = [
    { code: 'LAB-RPL', name: 'Laboratorium Rekayasa Perangkat Lunak', building: 'Gedung Kuliah Bersama B', floor: 'Lantai 3', capacity: 40, lat: -6.200000, lng: 106.816666, radius: 25, status: 'KALIBRASI_AKTIF' },
    { code: 'LAB-AI', name: 'Laboratorium Artificial Intelligence', building: 'Gedung Riset Informatika', floor: 'Lantai 4', capacity: 35, lat: -6.200120, lng: 106.816780, radius: 20, status: 'KALIBRASI_AKTIF' },
    { code: 'R-304', name: 'Ruang Teori 304 Multimedia', building: 'Gedung A Fakultas Teknik', floor: 'Lantai 3', capacity: 50, lat: -6.200340, lng: 106.816450, radius: 30, status: 'KALIBRASI_AKTIF' },
    { code: 'R-AUD-01', name: 'Auditorium Utama Universitas', building: 'Gedung Rektorat & Konvensi', floor: 'Lantai 1', capacity: 300, lat: -6.200500, lng: 106.817000, radius: 50, status: 'KALIBRASI_AKTIF' },
  ];

  const programs = isDemo ? PROGRAMS : [];
  const courses = isDemo ? COURSES : [];
  const academicYears = isDemo ? ACADEMIC_YEARS : [];
  const rooms = isDemo ? ROOMS : [];

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER RETRO */}
      <RetroWindow
        title="data_master_akademik_universitas.app"
        badge="Biro Administrasi Akademik (BAA)"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-xs">
                <Compass className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Data Master Akademik
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Pusat data referensi institusi: struktur program studi, validasi katalog mata kuliah yang diusulkan prodi, kalender tahun ajaran, serta koordinat geofencing ruang kelas.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-mono font-black text-black shadow-retro">
              T.A. 2026/2027 Ganjil
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. STATS PILLS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Program Studi</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">4 Prodi</div>
          <span className="text-xs text-black/70">Fakultas Terpadu</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Mata Kuliah Aktif</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">5 Mata Kuliah</div>
          <span className="text-xs text-emerald-800 font-bold">Terverifikasi BAA</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Tahun Ajaran Aktif</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">2026/2027</div>
          <span className="text-xs text-retro-orange font-bold">Semester Ganjil</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Ruang & Lab Geofence</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">4 Titik GPS</div>
          <span className="text-xs text-emerald-800 font-bold">100% Terkalibrasi</span>
        </div>
      </div>

      {/* 3. TAB CONTROLLER */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {STAFF_MASTER_TABS.map((tab) => {
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

      {/* 4. TAB CONTENTS */}
      {/* TAB 1: PROGRAM STUDI */}
      {activeTab === 'program-studi' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <Compass className="h-5 w-5 text-retro-orange" />
                <span>Direktori Program Studi & Pimpinan Akademik</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Data induk prodi, jenjang strata, fakultas pengampu, dan koordinator prodi aktif.
              </p>
            </div>
            <button
              type="button"
              disabled={!isDemo}
              title={!isDemo ? 'Fitur ini belum aktif' : undefined}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black text-xs font-black shadow-xs transition-all shrink-0',
                isDemo
                  ? 'bg-white text-black hover:bg-neutral-100 cursor-pointer'
                  : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Program Studi</span>
              {!isDemo && <span className="text-xs bg-neutral-200 px-1.5 py-0.2 rounded font-mono text-neutral-600">(Belum Aktif)</span>}
            </button>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Kode & Program Studi</th>
                    <th className="p-3.5 sm:p-4">Jenjang</th>
                    <th className="p-3.5 sm:p-4">Fakultas</th>
                    <th className="p-3.5 sm:p-4">Koordinator (Kaprodi)</th>
                    <th className="p-3.5 sm:p-4 text-center">Akreditasi</th>
                    <th className="p-3.5 sm:p-4 text-center">Mahasiswa Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {programs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-black/60 font-mono text-xs">
                        Belum ada data program studi tersimpan di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    programs.map((p) => (
                      <tr key={p.code} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          <div>{p.name}</div>
                          <span className="text-xs font-mono text-black/60">{p.code}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-mono font-bold">{p.degree}</td>
                        <td className="p-3.5 sm:p-4 text-black/80">{p.faculty}</td>
                        <td className="p-3.5 sm:p-4 font-semibold text-black">{p.coordinator}</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-2.5 py-0.5 rounded border border-black bg-retro-warm font-mono font-bold text-xs">
                            {p.accreditation}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center font-mono font-bold">{p.activeStudents} Mhs</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATA KULIAH */}
      {activeTab === 'mata-kuliah' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-retro-orange" />
                <span>Katalog Mata Kuliah & Validasi Usulan Prodi</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Staf memvalidasi data master (kode, SKS, status aktif). Prodi mengusulkan mata kuliah baru.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-3 py-1 bg-white border border-black rounded-lg">
                Alur: Usulan Prodi &rarr; Validasi Staf BAA &rarr; Terbit
              </span>
            </div>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Kode & Mata Kuliah</th>
                    <th className="p-3.5 sm:p-4 text-center">Bobot SKS</th>
                    <th className="p-3.5 sm:p-4">Tipe Perkuliahan</th>
                    <th className="p-3.5 sm:p-4">Program Studi</th>
                    <th className="p-3.5 sm:p-4 text-center">Semester Rekomendasi</th>
                    <th className="p-3.5 sm:p-4 text-center">Status Validasi</th>
                    <th className="p-3.5 sm:p-4 text-center">Aksi Staf</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-black/60 font-mono text-xs">
                        Belum ada data mata kuliah tersimpan di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    courses.map((c) => (
                    <tr key={c.code} className="hover:bg-retro-warm/30 transition-colors">
                      <td className="p-3.5 sm:p-4 font-bold text-black">
                        <div>{c.name}</div>
                        <span className="text-xs font-mono text-black/60">{c.code}</span>
                      </td>
                      <td className="p-3.5 sm:p-4 text-center font-mono font-bold">{c.sks} SKS</td>
                      <td className="p-3.5 sm:p-4 text-black/80">{c.type}</td>
                      <td className="p-3.5 sm:p-4 font-semibold text-black">{c.prodi}</td>
                      <td className="p-3.5 sm:p-4 text-center font-mono">Semester {c.semester}</td>
                      <td className="p-3.5 sm:p-4 text-center">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded border text-xs font-mono font-bold',
                            c.status === 'VALIDATED'
                              ? 'border-emerald-500 bg-emerald-100 text-emerald-950'
                              : 'border-amber-500 bg-amber-100 text-amber-950'
                          )}
                        >
                          {c.status === 'VALIDATED' ? 'TERVALIDASI BAA' : 'USULAN PRODI (MENUNGGU)'}
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 text-center">
                        {c.status === 'VALIDATED' ? (
                          <span className="text-xs font-mono font-bold text-emerald-700">✓ Aktif</span>
                        ) : (
                          <button
                            type="button"
                            disabled={!isDemo}
                            title={!isDemo ? 'Fitur ini belum aktif' : undefined}
                            className={cn(
                              'px-3 py-1 rounded-lg border-2 border-black text-xs font-bold transition-all',
                              isDemo
                                ? 'bg-retro-orange text-white hover:bg-black cursor-pointer'
                                : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
                            )}
                          >
                            <span>Validasi MK</span>
                            {!isDemo && <span className="ml-1 text-xs font-mono">(Belum Aktif)</span>}
                          </button>
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

      {/* TAB 3: TAHUN AJARAN */}
      {activeTab === 'tahun-ajaran' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <Calendar className="h-5 w-5 text-retro-orange" />
                <span>Periode Tahun Ajaran & Batas Administrasi Nilai</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Atur kalender semester, periode pengisian KRS, serta batas akhir finalisasi nilai oleh dosen.
              </p>
            </div>
            <button
              type="button"
              disabled={!isDemo}
              title={!isDemo ? 'Fitur ini belum aktif' : undefined}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black text-xs font-black shadow-xs transition-all shrink-0',
                isDemo
                  ? 'bg-white text-black hover:bg-neutral-100 cursor-pointer'
                  : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Buka Semester Baru</span>
              {!isDemo && <span className="text-xs bg-neutral-200 px-1.5 py-0.2 rounded font-mono text-neutral-600">(Belum Aktif)</span>}
            </button>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Kode & Tahun Ajaran</th>
                    <th className="p-3.5 sm:p-4">Rentang Waktu Semester</th>
                    <th className="p-3.5 sm:p-4">Batas Pengisian KRS</th>
                    <th className="p-3.5 sm:p-4">Batas Kunci Nilai Dosen</th>
                    <th className="p-3.5 sm:p-4 text-center">Status Periode</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {academicYears.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-black/60 font-mono text-xs">
                        Belum ada periode tahun ajaran tersimpan di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    academicYears.map((y) => (
                      <tr key={y.code} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          <div>{y.name}</div>
                          <span className="text-xs font-mono text-black/60">{y.code}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-mono text-xs">{y.startDate} - {y.endDate}</td>
                        <td className="p-3.5 sm:p-4 font-mono text-xs text-retro-orange font-bold">{y.krsLock}</td>
                        <td className="p-3.5 sm:p-4 font-mono text-xs font-bold">{y.gradeLock}</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded border text-xs font-mono font-bold',
                              y.isCurrent
                                ? 'border-emerald-500 bg-emerald-100 text-emerald-950'
                                : 'border-neutral-400 bg-neutral-100 text-neutral-800'
                            )}
                          >
                            {y.isCurrent ? 'SEMESTER AKTIF BERJALAN' : 'ARSIP PERIODE'}
                          </span>
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

      {/* TAB 4: RUANG & TITIK LOKASI */}
      {activeTab === 'ruang-dan-titik-lokasi' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <MapPin className="h-5 w-5 text-retro-orange" />
                <span>Master Ruang Kuliah & Geofence GPS Presensi</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Koordinat lintang/bujur dan radius toleransi geofencing untuk validasi kehadiran mahasiswa via presensi mobile/QR.
              </p>
            </div>
            <button
              type="button"
              disabled={!isDemo}
              title={!isDemo ? 'Fitur ini belum aktif' : undefined}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black text-xs font-black shadow-xs transition-all shrink-0',
                isDemo
                  ? 'bg-white text-black hover:bg-neutral-100 cursor-pointer'
                  : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Titik Ruang</span>
              {!isDemo && <span className="text-xs bg-neutral-200 px-1.5 py-0.2 rounded font-mono text-neutral-600">(Belum Aktif)</span>}
            </button>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Kode & Ruang</th>
                    <th className="p-3.5 sm:p-4">Gedung & Lokasi</th>
                    <th className="p-3.5 sm:p-4 text-center">Kapasitas</th>
                    <th className="p-3.5 sm:p-4">Koordinat GPS (Lat, Lng)</th>
                    <th className="p-3.5 sm:p-4 text-center">Radius Geofence</th>
                    <th className="p-3.5 sm:p-4 text-center">Status Kalibrasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {rooms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-black/60 font-mono text-xs">
                        Belum ada data ruang dan titik geofence tersimpan di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    rooms.map((r) => (
                      <tr key={r.code} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          <div>{r.name}</div>
                          <span className="text-xs font-mono text-black/60">{r.code}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/80">
                          <div>{r.building}</div>
                          <span className="text-xs text-black/60">{r.floor}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center font-mono font-bold">{r.capacity} Kursi</td>
                        <td className="p-3.5 sm:p-4 font-mono text-xs">{r.lat.toFixed(6)}, {r.lng.toFixed(6)}</td>
                        <td className="p-3.5 sm:p-4 text-center font-mono font-bold">{r.radius} Meter</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-2.5 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 font-mono text-xs font-bold">
                            TERKALIBRASI AKTIF
                          </span>
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
    </div>
  );
}
