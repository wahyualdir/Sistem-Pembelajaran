'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarDays,
  Award,
  Layers,
  Clock,
  MapPin,
  Users,
  Search,
  AlertTriangle,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';

export const STAFF_SCHEDULES_TABS = [
  { id: 'jadwal-kuliah', label: 'Jadwal Kuliah', icon: CalendarDays },
  { id: 'jadwal-ujian', label: 'Jadwal Ujian', icon: Award },
  { id: 'penggunaan-ruang', label: 'Penggunaan Ruang', icon: Layers },
] as const;

export type StaffSchedulesTabId = (typeof STAFF_SCHEDULES_TABS)[number]['id'];

interface StaffSchedulesHubViewProps {
  isDemo?: boolean;
}

export function StaffSchedulesHubView({ isDemo = true }: StaffSchedulesHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as StaffSchedulesTabId;
  const validTabs: StaffSchedulesTabId[] = [
    'jadwal-kuliah',
    'jadwal-ujian',
    'penggunaan-ruang',
  ];
  const activeTab: StaffSchedulesTabId = validTabs.includes(tabParam)
    ? tabParam
    : 'jadwal-kuliah';

  const setTab = (tab: StaffSchedulesTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/staff/schedules?${params.toString()}`);
  };

  const [selectedDay, setSelectedDay] = useState('Semua');

  const CLASS_SCHEDULES = [
    { id: 'sch-1', day: 'Senin', time: '08:00 - 10:30 WIB', course: 'Pemrograman Web Lanjut (IF-3A)', room: 'Lab RPL (Gedung B Lt. 3)', lecturer: 'Dr. Budi Santoso, M.Kom.', capacity: 40, enrolled: 38, status: 'AKTIF' },
    { id: 'sch-2', day: 'Senin', time: '13:00 - 15:30 WIB', course: 'Kecerdasan Buatan (IF-4A)', room: 'Lab AI (Gedung Riset Lt. 4)', lecturer: 'Prof. Dewi Lestari, Ph.D.', capacity: 35, enrolled: 35, status: 'AKTIF' },
    { id: 'sch-3', day: 'Selasa', time: '10:00 - 12:30 WIB', course: 'Rekayasa Perangkat Lunak (IF-3B)', room: 'Ruang Teori 304 Multimedia', lecturer: 'Dr. Budi Santoso, M.Kom.', capacity: 50, enrolled: 42, status: 'AKTIF' },
    { id: 'sch-4', day: 'Rabu', time: '08:00 - 10:30 WIB', course: 'Basis Data Terdistribusi (IF-3A)', room: 'Lab RPL (Gedung B Lt. 3)', lecturer: 'Ir. Hendra Wijaya, M.T.', capacity: 40, enrolled: 40, status: 'AKTIF' },
    { id: 'sch-5', day: 'Kamis', time: '13:00 - 14:40 WIB', course: 'Keamanan Siber & Kriptografi (IF-4B)', room: 'Ruang Teori 304 Multimedia', lecturer: 'Ir. Hendra Wijaya, M.T.', capacity: 50, enrolled: 30, status: 'AKTIF' },
  ];

  const EXAM_SCHEDULES = [
    { id: 'ex-1', type: 'UTS SEMESTER', date: 'Senin, 19 Okt 2026', time: '08:30 - 10:30 WIB', course: 'Pemrograman Web Lanjut', room: 'Lab RPL (40 Kursi)', proctor: 'Dr. Budi Santoso, M.Kom. & Tim Asisten', format: 'Live Coding CBT' },
    { id: 'ex-2', type: 'UTS SEMESTER', date: 'Selasa, 20 Okt 2026', time: '10:00 - 12:00 WIB', course: 'Basis Data Terdistribusi', room: 'Ruang Teori 304 Multimedia', proctor: 'Ir. Hendra Wijaya, M.T.', format: 'CBT Pilihan Ganda & Kasus' },
    { id: 'ex-3', type: 'UTS SEMESTER', date: 'Rabu, 21 Okt 2026', time: '13:00 - 15:00 WIB', course: 'Kecerdasan Buatan', room: 'Lab AI (Gedung Riset)', proctor: 'Prof. Dewi Lestari, Ph.D.', format: 'CBT Essay Rubrik' },
  ];

  const ROOM_OCCUPANCY = [
    { room: 'Lab RPL (Gedung B Lt. 3)', type: 'Laboratorium Komputer', capacity: 40, monday: '08:00 - 15:30 (Penuh)', tuesday: '10:00 - 12:30 (Terisi)', wednesday: '08:00 - 12:00 (Terisi)', thursday: 'Kosong (Maintenance)', friday: '13:00 - 16:00 (Terisi)', status: 'OKUPANSI_TINGGI' },
    { room: 'Lab AI (Gedung Riset Lt. 4)', type: 'Laboratorium Riset', capacity: 35, monday: '13:00 - 15:30 (Terisi)', tuesday: 'Kosong (Tersedia)', wednesday: '09:00 - 15:00 (Terisi)', thursday: '10:00 - 14:00 (Terisi)', friday: 'Kosong (Tersedia)', status: 'TERSEDIA_SEBAGIAN' },
    { room: 'Ruang Teori 304 Multimedia', type: 'Ruang Kelas Teori', capacity: 50, monday: '08:00 - 12:00 (Terisi)', tuesday: '10:00 - 16:00 (Penuh)', wednesday: 'Kosong (Tersedia)', thursday: '13:00 - 15:00 (Terisi)', friday: '08:00 - 11:30 (Terisi)', status: 'OKUPANSI_TINGGI' },
    { room: 'Auditorium Utama Rektorat', type: 'Aula Serbaguna', capacity: 300, monday: 'Kosong (Tersedia)', tuesday: 'Kosong (Tersedia)', wednesday: 'Kuliah Umum 09:00-12:00', thursday: 'Kosong (Tersedia)', friday: 'Kosong (Tersedia)', status: 'TERSEDIA' },
  ];

  const classSchedules = isDemo ? CLASS_SCHEDULES : [];
  const examSchedules = isDemo ? EXAM_SCHEDULES : [];
  const roomOccupancy = isDemo ? ROOM_OCCUPANCY : [];

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER RETRO */}
      <RetroWindow
        title="penjadwalan_kuliah_dan_ujian_kampus.app"
        badge="Biro Penjadwalan & Sarana Prasarana"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-xs">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Jadwal Kuliah & Ujian
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Manajemen waktu perkuliahan mingguan, jadwal pelaksanaan ujian tengah dan akhir semester terpadu, serta okupansi utilisasi laboratorium dan ruang teori.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-mono font-black text-black shadow-retro">
              Bebas Bentrok Ruang & Dosen
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. STATS PILLS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Sesi Kuliah Mingguan</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">{CLASS_SCHEDULES.length} Sesi</div>
          <span className="text-xs text-black/70">Terjadwal Aktif</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Jadwal Ujian Terpadu</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">{EXAM_SCHEDULES.length} Sesi</div>
          <span className="text-xs text-retro-orange font-bold">UTS Semester</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Ruang & Lab Dipakai</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">4 Ruang</div>
          <span className="text-xs text-emerald-800 font-bold">Terjadwal Optimal</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Konflik / Bentrok</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-emerald-800">0 Konflik</div>
          <span className="text-xs text-emerald-800 font-bold">Jadwal Bersih</span>
        </div>
      </div>

      {/* 3. TAB CONTROLLER */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {STAFF_SCHEDULES_TABS.map((tab) => {
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
      {/* TAB 1: JADWAL KULIAH */}
      {activeTab === 'jadwal-kuliah' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-retro-orange" />
                <span>Distribusi Waktu Perkuliahan Mingguan</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Jadwal reguler tatap muka kelas, alokasi ruang, dan penugasan dosen pengampu terverifikasi.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-3 py-1 bg-white border border-black rounded-lg">
                Alur: Diusulkan Staf &rarr; Disetujui Prodi &rarr; Aktif
              </span>
            </div>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Hari & Jam</th>
                    <th className="p-3.5 sm:p-4">Mata Kuliah & Rombel</th>
                    <th className="p-3.5 sm:p-4">Ruang Kuliah</th>
                    <th className="p-3.5 sm:p-4">Dosen Pengampu</th>
                    <th className="p-3.5 sm:p-4 text-center">Kapasitas / Peserta</th>
                    <th className="p-3.5 sm:p-4 text-center">Status Jadwal</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {classSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-black/60 font-mono text-xs">
                        Belum ada jadwal perkuliahan tersimpan di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    classSchedules.map((s) => (
                      <tr key={s.id} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          <div>{s.day}</div>
                          <span className="text-xs font-mono text-black/60">{s.time}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-bold text-black">{s.course}</td>
                        <td className="p-3.5 sm:p-4 text-black/80">{s.room}</td>
                        <td className="p-3.5 sm:p-4 font-semibold text-black">{s.lecturer}</td>
                        <td className="p-3.5 sm:p-4 text-center font-mono font-bold">
                          {s.enrolled} / {s.capacity}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-2.5 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 font-mono text-xs font-bold">
                            AKTIF BERJALAN
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

      {/* TAB 2: JADWAL UJIAN */}
      {activeTab === 'jadwal-ujian' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <Award className="h-5 w-5 text-retro-orange" />
                <span>Penjadwalan Ujian Tengah & Akhir Semester Terpadu</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Alokasi waktu pelaksanaan evaluasi daring CBT, penugasan pengawas ruang, dan kapasitas kursi peserta.
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
              <span>Jadwalkan Ujian Baru</span>
              {!isDemo && <span className="text-xs bg-neutral-200 px-1.5 py-0.2 rounded font-mono text-neutral-600">(Belum Aktif)</span>}
            </button>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Tanggal & Jam</th>
                    <th className="p-3.5 sm:p-4">Jenis & Mata Kuliah</th>
                    <th className="p-3.5 sm:p-4">Ruang Ujian</th>
                    <th className="p-3.5 sm:p-4">Format Pengerjaan</th>
                    <th className="p-3.5 sm:p-4">Pengawas Ruang</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {examSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-black/60 font-mono text-xs">
                        Belum ada jadwal ujian semester tersimpan di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    examSchedules.map((e) => (
                      <tr key={e.id} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          <div>{e.date}</div>
                          <span className="text-xs font-mono text-black/60">{e.time}</span>
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <div className="font-bold text-black">{e.course}</div>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-retro-warm border border-black/30 font-bold">
                            {e.type}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/80">{e.room}</td>
                        <td className="p-3.5 sm:p-4 font-mono text-xs">{e.format}</td>
                        <td className="p-3.5 sm:p-4 font-semibold text-black">{e.proctor}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PENGGUNAAN RUANG */}
      {activeTab === 'penggunaan-ruang' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <Layers className="h-5 w-5 text-retro-orange" />
                <span>Monitoring Okupansi & Pemakaian Ruang Kuliah / Lab</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Peta pemanfaatan ruang kelas harian untuk memastikan tidak ada jam bentrok serta identifikasi ruang kosong yang dapat dipinjam.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-white border border-black rounded-lg">
              Live Room Occupancy Matrix
            </span>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Ruang & Tipe</th>
                    <th className="p-3.5 sm:p-4">Senin</th>
                    <th className="p-3.5 sm:p-4">Selasa</th>
                    <th className="p-3.5 sm:p-4">Rabu</th>
                    <th className="p-3.5 sm:p-4">Kamis</th>
                    <th className="p-3.5 sm:p-4">Jumat</th>
                    <th className="p-3.5 sm:p-4 text-center">Status Okupansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {roomOccupancy.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-black/60 font-mono text-xs">
                        Belum ada matriks pemakaian ruang tersimpan di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    roomOccupancy.map((r, idx) => (
                      <tr key={idx} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black">
                          <div>{r.room}</div>
                          <span className="text-xs font-mono text-black/60">{r.type} ({r.capacity} Kursi)</span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs font-mono">{r.monday}</td>
                        <td className="p-3.5 sm:p-4 text-xs font-mono">{r.tuesday}</td>
                        <td className="p-3.5 sm:p-4 text-xs font-mono">{r.wednesday}</td>
                        <td className="p-3.5 sm:p-4 text-xs font-mono">{r.thursday}</td>
                        <td className="p-3.5 sm:p-4 text-xs font-mono">{r.friday}</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded border text-xs font-mono font-bold',
                              r.status === 'OKUPANSI_TINGGI'
                                ? 'border-amber-500 bg-amber-100 text-amber-950'
                                : 'border-emerald-500 bg-emerald-100 text-emerald-950'
                            )}
                          >
                            {r.status === 'OKUPANSI_TINGGI' ? 'PADAT (>75%)' : 'TERSEDIA (<50%)'}
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
