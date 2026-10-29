'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Users,
  Layers,
  CalendarClock,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Monitor,
  Wifi,
  Plus,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { AssistantForm, RevokeAssistant } from './assistant-forms';
import { DELEGABLE_LABELS } from './permissions';
import { cn } from '@/lib/utils';

export interface LabClassItem {
  id: string;
  code: string;
  title: string;
  section: string;
  room: string;
  schedule: string;
  lecturer: string;
  capacity: number;
  enrolled: number;
}

export interface LabAssistantItem {
  id: string;
  class_id: string;
  user_id: string;
  name: string;
  nim: string;
  assistant_type: 'ASISTEN_LAB' | 'ASISTEN_DOSEN';
  permissions: string[];
}

export const DEMO_LAB_CLASSES: LabClassItem[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    code: 'IF2101',
    title: 'Pemrograman Berorientasi Objek',
    section: 'IF-3A (Praktikum)',
    room: 'LAB-RPL (Lt. 3)',
    schedule: 'Senin, 08:00 - 10:30 WIB',
    lecturer: 'Dr. Budi Santoso, M.Kom.',
    capacity: 40,
    enrolled: 38,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    code: 'IF2102',
    title: 'Struktur Data & Algoritma',
    section: 'IF-3B (Praktikum)',
    room: 'LAB-RPL (Lt. 3)',
    schedule: 'Selasa, 13:00 - 15:30 WIB',
    lecturer: 'Ir. Hendra Wijaya, M.T.',
    capacity: 40,
    enrolled: 35,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    code: 'IF3105',
    title: 'Jaringan Komputer & Keamanan',
    section: 'IF-5A (Praktikum)',
    room: 'LAB-NET (Lt. 3)',
    schedule: 'Rabu, 10:00 - 12:30 WIB',
    lecturer: 'Ir. Hendra Wijaya, M.T.',
    capacity: 35,
    enrolled: 32,
  },
];

export const DEMO_LAB_ASSISTANTS: LabAssistantItem[] = [
  {
    id: 'ast-lab-1',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    user_id: 'a0000005-0000-0000-0000-000000000005',
    name: 'Citra Dewi',
    nim: '2024002',
    assistant_type: 'ASISTEN_LAB',
    permissions: ['submission.review', 'assignment.grade'],
  },
  {
    id: 'ast-lab-2',
    class_id: 'c0000000-0000-0000-0000-000000000002',
    user_id: 'a0000006-0000-0000-0000-000000000006',
    name: 'Dedi Kurniawan',
    nim: '2024003',
    assistant_type: 'ASISTEN_LAB',
    permissions: ['material.manage', 'submission.review'],
  },
];

// ==========================================
// 1. LAB DASHBOARD CLIENT
// ==========================================
export function LabDashboardClient({
  labHeadName = 'Ir. Hendra Wijaya, M.T.',
  labName = 'Laboratorium Rekayasa Perangkat Lunak (LAB-RPL)',
}: {
  labHeadName?: string;
  labName?: string;
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Portal Manajemen Kepala Laboratorium"
        badge="LAB_HEAD :: WORKSPACE"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white space-y-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-black pb-5">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-[#ED1C24] uppercase tracking-wider block">
              PORTAL KEPALA LABORATORIUM
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#111111]">
              {labName}
            </h1>
            <p className="text-xs sm:text-sm text-[#111111] font-medium">
              Kepala Lab: <strong className="font-bold">{labHeadName}</strong> &bull; Gedung Lab Komputer Lantai 3
            </p>
          </div>
          <Link
            href="/lab/assistants"
            className="px-4 py-2 border-2 border-black bg-[#111111] text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition-all shadow-retro-sm cursor-pointer flex items-center gap-2 shrink-0 active:translate-x-0.5 active:translate-y-0.5"
          >
            <Users className="h-4 w-4" />
            <span>Kelola Asisten Lab</span>
          </Link>
        </div>

        {/* 4 Kartu Metrik Utama */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 border-2 border-black bg-gray-soft shadow-retro-sm">
            <span className="text-xs font-bold uppercase text-[#111111] block">Kelas Praktikum</span>
            <span className="text-2xl font-heading font-black text-[#111111] mt-1 block">
              {DEMO_LAB_CLASSES.length} Kelas
            </span>
          </div>

          <div className="p-4 border-2 border-black bg-gray-soft shadow-retro-sm">
            <span className="text-xs font-bold uppercase text-[#111111] block">Asisten Lab Aktif</span>
            <span className="text-2xl font-heading font-black text-[#111111] mt-1 block">
              {DEMO_LAB_ASSISTANTS.length} Orang
            </span>
          </div>

          <div className="p-4 border-2 border-black bg-gray-soft shadow-retro-sm">
            <span className="text-xs font-bold uppercase text-[#111111] block">Kapasitas Lab</span>
            <span className="text-2xl font-heading font-black text-[#111111] mt-1 block">
              40 Workstation
            </span>
          </div>

          <div className="p-4 border-2 border-black bg-gray-soft shadow-retro-sm">
            <span className="text-xs font-bold uppercase text-[#111111] block">Okupansi Lab</span>
            <span className="text-2xl font-heading font-black text-[#ED1C24] mt-1 block">
              85% Jadwal
            </span>
          </div>
        </div>

        {/* Pintasan Cepat Menu Lab */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <Link
            href="/lab/profile"
            className="p-4 border-2 border-black bg-white hover:bg-gray-soft transition-all shadow-retro-sm block space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <Building2 className="h-6 w-6 text-[#111111] group-hover:text-[#ED1C24] transition-colors" />
              <span className="text-xs font-mono font-bold text-[#111111]">&rarr;</span>
            </div>
            <h3 className="font-heading font-black text-base text-[#111111]">Profil Laboratorium</h3>
            <p className="text-xs text-[#111111] font-medium">
              Informasi sarana, spesifikasi workstation, dan inventaris fasilitas lab.
            </p>
          </Link>

          <Link
            href="/lab/classes"
            className="p-4 border-2 border-black bg-white hover:bg-gray-soft transition-all shadow-retro-sm block space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <Layers className="h-6 w-6 text-[#111111] group-hover:text-[#ED1C24] transition-colors" />
              <span className="text-xs font-mono font-bold text-[#111111]">&rarr;</span>
            </div>
            <h3 className="font-heading font-black text-base text-[#111111]">Kelas Praktikum</h3>
            <p className="text-xs text-[#111111] font-medium">
              Daftar rombongan belajar kelas praktikum yang diselenggarakan di lab ini.
            </p>
          </Link>

          <Link
            href="/lab/schedules"
            className="p-4 border-2 border-black bg-white hover:bg-gray-soft transition-all shadow-retro-sm block space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <CalendarClock className="h-6 w-6 text-[#111111] group-hover:text-[#ED1C24] transition-colors" />
              <span className="text-xs font-mono font-bold text-[#111111]">&rarr;</span>
            </div>
            <h3 className="font-heading font-black text-base text-[#111111]">Jadwal &amp; Penggunaan</h3>
            <p className="text-xs text-[#111111] font-medium">
              Matriks pemakaian ruang laboratorium per hari dan per slot sesi perkuliahan.
            </p>
          </Link>
        </div>
      </RetroWindow>
    </div>
  );
}

// ==========================================
// 2. LAB PROFILE VIEW
// ==========================================
export function LabProfileView() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Profil Laboratorium Resmi"
        badge="LAB_HEAD :: PROFIL"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white space-y-6"
      >
        <div className="border-b-2 border-black pb-4 space-y-1">
          <h1 className="text-xl sm:text-2xl font-heading font-black text-[#111111] flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#ED1C24]" />
            <span>Laboratorium Rekayasa Perangkat Lunak (LAB-RPL)</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#111111] font-medium">
            Fasilitas praktikum komputasi, pengembangan perangkat lunak, basis data, dan rekayasa web terpadu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-4 border-2 border-black bg-gray-soft shadow-retro-sm space-y-3">
            <h3 className="font-heading font-black text-sm uppercase text-[#111111] border-b border-black pb-2">
              Identitas &amp; Pengelola
            </h3>
            <dl className="text-xs space-y-2 font-sans">
              <div className="flex justify-between">
                <dt className="text-[#111111] font-medium">Kode Laboratorium:</dt>
                <dd className="font-bold text-[#111111]">LAB-RPL</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#111111] font-medium">Program Studi Terkait:</dt>
                <dd className="font-bold text-[#111111]">Teknik Informatika (S1)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#111111] font-medium">Lokasi / Ruang:</dt>
                <dd className="font-bold text-[#111111]">Gedung Laboratorium Komputer Lt. 3</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#111111] font-medium">Kepala Laboratorium:</dt>
                <dd className="font-bold text-[#111111]">Ir. Hendra Wijaya, M.T. (NIDN: 0022334455)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#111111] font-medium">Status Operasional:</dt>
                <dd className="font-bold text-[#111111]">AKTIF :: SIAP PRAKTIKUM</dd>
              </div>
            </dl>
          </div>

          <div className="p-4 border-2 border-black bg-white shadow-retro-sm space-y-3">
            <h3 className="font-heading font-black text-sm uppercase text-[#111111] border-b border-black pb-2">
              Spesifikasi Fasilitas &amp; Komputasi
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 border border-black bg-gray-soft space-y-1">
                <Monitor className="h-4 w-4 text-[#ED1C24]" />
                <span className="font-bold text-[#111111] block">40 Unit Workstation</span>
                <span className="text-[11px] text-[#111111]">Core i7 13th Gen, 32GB RAM, SSD 1TB</span>
              </div>
              <div className="p-2.5 border border-black bg-gray-soft space-y-1">
                <Cpu className="h-4 w-4 text-[#ED1C24]" />
                <span className="font-bold text-[#111111] block">Server Praktikum</span>
                <span className="text-[11px] text-[#111111]">Dual Xeon, 64GB ECC, Proxmox VE</span>
              </div>
              <div className="p-2.5 border border-black bg-gray-soft space-y-1">
                <Wifi className="h-4 w-4 text-[#ED1C24]" />
                <span className="font-bold text-[#111111] block">Jaringan 1 Gbps</span>
                <span className="text-[11px] text-[#111111]">Switch Cisco Managed, Subnet Terisolasi</span>
              </div>
              <div className="p-2.5 border border-black bg-gray-soft space-y-1">
                <ShieldCheck className="h-4 w-4 text-[#ED1C24]" />
                <span className="font-bold text-[#111111] block">Lingkungan Terstandar</span>
                <span className="text-[11px] text-[#111111]">UPS 10 kVA, AC 2 Unit, Proyektor 4K</span>
              </div>
            </div>
          </div>
        </div>
      </RetroWindow>
    </div>
  );
}

// ==========================================
// 3. LAB ASSISTANTS VIEW (MANAJEMEN ASISTEN LAB)
// ==========================================
export function LabAssistantsView({
  classes = DEMO_LAB_CLASSES,
  initialAssistants = DEMO_LAB_ASSISTANTS,
}: {
  classes?: LabClassItem[];
  initialAssistants?: LabAssistantItem[];
}) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [assistantsList, setAssistantsList] = useState<LabAssistantItem[]>(initialAssistants);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classAssistants = assistantsList.filter((a) => a.class_id === selectedClassId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Penugasan & Otoritas Asisten Laboratorium"
        badge="LAB_HEAD :: ASISTEN"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white space-y-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-black pb-5">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-[#111111] flex items-center gap-2">
              <Users className="h-6 w-6 text-[#ED1C24]" />
              <span>Kelola Asisten Lab untuk Kelas Praktikum</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#111111] font-medium">
              Sesuai wewenang Fase 4.1: Asisten Lab hanya ditugaskan, diubah, dan dicabut oleh Kepala Lab dan Dosen Pengampu kelas praktikum terkait.
            </p>
          </div>
        </div>

        {/* Pilih Kelas Praktikum yang dinaungi Lab */}
        <div className="p-4 border-2 border-black bg-gray-soft shadow-retro-sm space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#111111] block">
            Pilih Kelas Praktikum di Laboratorium:
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full border-2 border-black p-2.5 bg-white text-xs sm:text-sm font-bold focus:outline-hidden"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title} ({c.section}) &bull; Dosen: {c.lecturer} &bull; {c.room}
              </option>
            ))}
          </select>
        </div>

        {/* Daftar Asisten Lab Kelas Terpilih */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-sm uppercase text-[#111111]">
              Asisten Lab Aktif di {selectedClass?.section}
            </h3>
            <span className="text-xs font-bold text-[#111111]">
              Total: {classAssistants.length} Asisten
            </span>
          </div>

          <div className="border-2 border-black overflow-hidden shadow-retro">
            <table className="w-full text-left text-xs font-sans">
              <thead className="border-b-2 border-black bg-gray-soft font-bold uppercase text-[#111111]">
                <tr>
                  <th className="p-3.5">Nama Asisten</th>
                  <th className="p-3.5">NIM / Identitas</th>
                  <th className="p-3.5">Tipe Penugasan</th>
                  <th className="p-3.5">Izin Delegasi</th>
                  <th className="p-3.5 text-center">Aksi Otoritas</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                {classAssistants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[#111111] font-medium">
                      Belum ada Asisten Lab yang ditugaskan pada kelas praktikum ini. Gunakan form di bawah untuk menugaskan.
                    </td>
                  </tr>
                ) : (
                  classAssistants.map((ast) => (
                    <tr key={ast.id} className="hover:bg-gray-soft/40 transition-colors">
                      <td className="p-3.5 font-bold text-[#111111]">{ast.name}</td>
                      <td className="p-3.5 font-mono text-[#111111]">{ast.nim}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 border border-black bg-white text-xs font-bold shadow-retro-sm">
                          {ast.assistant_type === 'ASISTEN_LAB' ? '🔬 Asisten Lab' : '🎓 Asisten Dosen'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {ast.permissions.map((p) => (
                            <span key={p} className="px-1.5 py-0.5 border border-black text-[10px] font-medium bg-white">
                              {(DELEGABLE_LABELS as Record<string, string>)[p] || p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <RevokeAssistant
                          classId={selectedClassId}
                          identifier={ast.nim}
                          name={ast.name}
                          assistantType="ASISTEN_LAB"
                          onSuccess={() => {
                            setAssistantsList((prev) => prev.filter((a) => a.id !== ast.id));
                          }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Tambah Asisten Lab untuk Kepala Lab */}
        <div className="p-5 border-2 border-black bg-gray-soft shadow-retro space-y-3">
          <div>
            <h4 className="font-heading font-black text-sm uppercase text-[#111111] flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#ED1C24]" />
              <span>Tugaskan Asisten Lab Baru</span>
            </h4>
            <p className="text-xs text-[#111111] font-medium mt-0.5">
              Kepala Lab menugaskan mahasiswa berprestasi / laboran sebagai Asisten Lab untuk kelas praktikum ini.
            </p>
          </div>
          <AssistantForm
            classId={selectedClassId}
            allowedTypes={['ASISTEN_LAB']}
            defaultType="ASISTEN_LAB"
            onSuccess={() => {
              // Refresh or mock update
            }}
          />
        </div>
      </RetroWindow>
    </div>
  );
}

// ==========================================
// 4. LAB CLASSES VIEW (KELAS PRAKTIKUM)
// ==========================================
export function LabClassesView({ classes = DEMO_LAB_CLASSES }: { classes?: LabClassItem[] }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Daftar Kelas Praktikum Laboratorium"
        badge="LAB_HEAD :: KELAS"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white space-y-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-black pb-5">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-[#111111] flex items-center gap-2">
              <Layers className="h-6 w-6 text-[#ED1C24]" />
              <span>Kelas Praktikum Terhubung (via class_laboratories)</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#111111] font-medium">
              Hubungan penugasan kelas ke laboratorium ditetapkan oleh Staf Akademik / Koordinator Prodi. Kepala Lab mengelola pelaksanaan teknis dan asistennya.
            </p>
          </div>
        </div>

        <div className="border-2 border-black overflow-hidden shadow-retro">
          <table className="w-full text-left text-xs font-sans">
            <thead className="border-b-2 border-black bg-gray-soft font-bold uppercase text-[#111111]">
              <tr>
                <th className="p-3.5">Kode &amp; Mata Kuliah</th>
                <th className="p-3.5">Kelas / Seksi</th>
                <th className="p-3.5">Dosen Pengampu</th>
                <th className="p-3.5">Ruang &amp; Jadwal</th>
                <th className="p-3.5 text-center">Kapasitas</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10">
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-gray-soft/40 transition-colors">
                  <td className="p-3.5">
                    <span className="font-mono text-xs font-bold text-[#111111] block">{cls.code}</span>
                    <span className="font-bold text-[#111111]">{cls.title}</span>
                  </td>
                  <td className="p-3.5 font-bold text-[#111111]">{cls.section}</td>
                  <td className="p-3.5 font-medium text-[#111111]">{cls.lecturer}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-[#111111] block">{cls.room}</span>
                    <span className="text-xs text-[#111111]">{cls.schedule}</span>
                  </td>
                  <td className="p-3.5 text-center font-bold text-[#111111]">
                    {cls.enrolled} / {cls.capacity} Mahasiswa
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 border border-black bg-white text-xs font-bold shadow-retro-sm">
                      TERHUBUNG
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RetroWindow>
    </div>
  );
}

// ==========================================
// 5. LAB SCHEDULES VIEW (JADWAL PENGGUNAAN LAB)
// ==========================================
export function LabSchedulesView() {
  const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const SLOTS = [
    { time: '08:00 - 10:30', day: 'Senin', class: 'IF2101 - Pemrograman Berorientasi Objek (IF-3A)', lecturer: 'Dr. Budi Santoso', assistant: 'Citra Dewi' },
    { time: '13:00 - 15:30', day: 'Selasa', class: 'IF2102 - Struktur Data & Algoritma (IF-3B)', lecturer: 'Ir. Hendra Wijaya', assistant: 'Dedi Kurniawan' },
    { time: '10:00 - 12:30', day: 'Rabu', class: 'IF3105 - Jaringan Komputer & Keamanan (IF-5A)', lecturer: 'Ir. Hendra Wijaya', assistant: 'Eko Prasetyo' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Jadwal & Penggunaan Ruang Laboratorium"
        badge="LAB_HEAD :: JADWAL"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white space-y-6"
      >
        <div className="border-b-2 border-black pb-4 space-y-1">
          <h1 className="text-xl sm:text-2xl font-heading font-black text-[#111111] flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-[#ED1C24]" />
            <span>Okupansi &amp; Slot Jadwal Praktikum Mingguan</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#111111] font-medium">
            Jadwal ditarik langsung dari penetapan slot jadwal resmi perkuliahan universitas (baca saja).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {DAYS.map((day) => {
            const daySlots = SLOTS.filter((s) => s.day === day);
            return (
              <div key={day} className="border-2 border-black bg-white shadow-retro-sm">
                <div className="p-2.5 bg-gray-soft border-b-2 border-black font-bold uppercase text-xs text-center text-[#111111]">
                  {day}
                </div>
                <div className="p-3 space-y-2 min-h-[140px]">
                  {daySlots.length === 0 ? (
                    <span className="text-[11px] text-[#111111]/40 block text-center mt-6">
                      Tidak ada jadwal praktikum
                    </span>
                  ) : (
                    daySlots.map((s, idx) => (
                      <div key={idx} className="p-2 border border-black bg-gray-soft text-xs space-y-1">
                        <span className="font-mono font-bold text-[#ED1C24] text-[10px] block">
                          {s.time}
                        </span>
                        <span className="font-bold text-[#111111] block leading-tight">
                          {s.class}
                        </span>
                        <span className="text-[11px] text-[#111111] block">
                          Dosen: {s.lecturer}
                        </span>
                        <span className="text-[10px] font-bold text-[#111111] block">
                          Asisten: {s.assistant}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </RetroWindow>
    </div>
  );
}

// ==========================================
// 6. LAB RECAP VIEW (REKAP PRAKTIKUM)
// ==========================================
export function LabRecapView() {
  const RECAP_DATA = [
    {
      code: 'IF2101',
      title: 'Pemrograman Berorientasi Objek',
      section: 'IF-3A',
      modulesCount: 14,
      avgAttendance: '94.5%',
      avgScore: 84.2,
      lecturer: 'Dr. Budi Santoso',
      status: 'PRAKTIKUM BERJALAN',
    },
    {
      code: 'IF2102',
      title: 'Struktur Data & Algoritma',
      section: 'IF-3B',
      modulesCount: 12,
      avgAttendance: '91.8%',
      avgScore: 81.5,
      lecturer: 'Ir. Hendra Wijaya',
      status: 'PRAKTIKUM BERJALAN',
    },
    {
      code: 'IF3105',
      title: 'Jaringan Komputer & Keamanan',
      section: 'IF-5A',
      modulesCount: 10,
      avgAttendance: '96.2%',
      avgScore: 86.8,
      lecturer: 'Ir. Hendra Wijaya',
      status: 'PRAKTIKUM BERJALAN',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Rekapitulasi Presensi & Nilai Praktikum"
        badge="LAB_HEAD :: REKAP"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white space-y-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-black pb-5">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-[#111111] flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-[#ED1C24]" />
              <span>Rekapitulasi Kinerja & Presensi Praktikum Laboratorium</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#111111] font-medium">
              Batasan ketat: Rekapitulasi ini bersifat baca saja (*read-only*). Kepala Lab tidak mengubah nilai atau menyetujui koreksi nilai perkuliahan.
            </p>
          </div>
        </div>

        <div className="border-2 border-black overflow-hidden shadow-retro">
          <table className="w-full text-left text-xs font-sans">
            <thead className="border-b-2 border-black bg-gray-soft font-bold uppercase text-[#111111]">
              <tr>
                <th className="p-3.5">Mata Kuliah Praktikum</th>
                <th className="p-3.5">Kelas</th>
                <th className="p-3.5">Dosen Pengampu</th>
                <th className="p-3.5 text-center">Modul Praktikum</th>
                <th className="p-3.5 text-center">Rata-rata Presensi</th>
                <th className="p-3.5 text-center">Rata-rata Nilai</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10">
              {RECAP_DATA.map((r, idx) => (
                <tr key={idx} className="hover:bg-gray-soft/40 transition-colors">
                  <td className="p-3.5">
                    <span className="font-mono text-xs font-bold text-[#111111] block">{r.code}</span>
                    <span className="font-bold text-[#111111]">{r.title}</span>
                  </td>
                  <td className="p-3.5 font-bold text-[#111111]">{r.section}</td>
                  <td className="p-3.5 font-medium text-[#111111]">{r.lecturer}</td>
                  <td className="p-3.5 text-center font-bold text-[#111111]">{r.modulesCount} Modul</td>
                  <td className="p-3.5 text-center font-bold text-[#111111]">{r.avgAttendance}</td>
                  <td className="p-3.5 text-center font-black text-sm text-[#ED1C24]">{r.avgScore}</td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 border border-black bg-white text-xs font-bold shadow-retro-sm">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RetroWindow>
    </div>
  );
}
