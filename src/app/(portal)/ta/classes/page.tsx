'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, Users, ArrowRight, Clock } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  getClassroomBannerTheme,
  ClassroomBannerPattern,
} from '@/modules/academic/classroom-cards';

const ASSISTED_CLASSES = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    code: 'STI2544138',
    title: 'Pemrograman Web & Arsitektur Cloud',
    section: 'IF-3A',
    lecturer: 'Dr. Budi Santoso, M.Kom.',
    studentsCount: 45,
    pendingReviews: 4,
    schedule: 'Senin, 08:45 - 11:15 WIB · 3C.2.05 - TEKNIK C',
    permissions: ['Bantu Presensi', 'Review Draf Tugas', 'Moderasi Forum'],
    status: 'Aktif Berjalan',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    code: 'STI2543131',
    title: 'Algoritma & Struktur Data Lanjut',
    section: 'IF-3B',
    lecturer: 'Dr. Budi Santoso, M.Kom.',
    studentsCount: 40,
    pendingReviews: 2,
    schedule: 'Selasa, 10:30 - 13:00 WIB · Computer System LAB - TEKNIK C',
    permissions: ['Bantu Presensi', 'Review Draf Tugas'],
    status: 'Aktif Berjalan',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    code: 'STI2541114',
    title: 'Basis Data Terdistribusi & Big Data',
    section: 'IF-3C',
    lecturer: 'Dr. Budi Santoso, M.Kom.',
    studentsCount: 42,
    pendingReviews: 0,
    schedule: 'Rabu, 13:00 - 15:30 WIB · Mobile Lab - TEKNIK D',
    permissions: ['Bantu Presensi', 'Moderasi Forum', 'Pantau Ujian'],
    status: 'Aktif Berjalan',
  },
];

export default function AssistantClassesPage() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title="Kelas yang Diasistensi"
        headerBadge="Mode Asisten"
        headerBadgeVariant="warning"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground flex items-center gap-3">
            <Layers className="h-7 w-7 text-primary" />
            <span>Kelas yang Diasistensi</span>
          </h1>
          <p className="text-sm sm:text-base text-black font-bold max-w-3xl leading-relaxed">
            Peran asisten Anda berlaku spesifik per kelas. Anda dapat membantu presensi, memeriksa draf tugas, dan menjawab forum mahasiswa sesuai izin dosen pengampu.
          </p>
        </div>
      </RetroWindow>

      {/* Grid Kartu Kelas Diasistensi Full-Width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ASSISTED_CLASSES.map((cls, idx) => {
          const theme = getClassroomBannerTheme(cls.code || cls.id, idx);
          return (
            <div
              key={cls.id}
              className="rounded-2xl border border-[#D6D3CB] hover:border-[#7A756D] bg-[#FFFFFF] shadow-sm flex flex-col justify-between overflow-hidden transition-all"
            >
              {/* Header Berwarna & Bercorak ala Google Classroom */}
              <div
                className={`${theme.bannerGradient} relative p-5 text-white border-b border-[#1C1917]/15 overflow-hidden space-y-3`}
              >
                <ClassroomBannerPattern pattern={theme.pattern} />
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#FFFFFF]/15 backdrop-blur-xs border border-[#FFFFFF]/25 text-white">
                    {cls.code} · {cls.section}
                  </span>
                  <span className="text-[11px] font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#1C1917]/30 border border-[#FFFFFF]/25 text-white">
                    {cls.status}
                  </span>
                </div>

                <div className="relative z-10">
                  <h2 className="font-heading font-black text-lg text-white leading-snug drop-shadow-xs">
                    <Link
                      href={`/classes/${cls.id}`}
                      className="hover:underline decoration-white/80 underline-offset-4 transition-all"
                    >
                      {cls.title}
                    </Link>
                  </h2>
                  <p className="text-xs text-white/90 mt-1 font-medium">
                    Dosen: <strong className="text-white">{cls.lecturer}</strong>
                  </p>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5 text-xs">
                    <p className="text-[#57534E] flex items-center gap-2 font-sans font-medium">
                      <Clock className={`h-3.5 w-3.5 ${theme.accentText} shrink-0`} />
                      <span>{cls.schedule}</span>
                    </p>
                    <p className="text-[#57534E] flex items-center gap-2 font-sans font-medium">
                      <Users className="h-3.5 w-3.5 text-[#78716C] shrink-0" />
                      <span>{cls.studentsCount} Mahasiswa Terdaftar</span>
                    </p>
                  </div>

                  {/* Izin Mandat Asdos */}
                  <div className="pt-2 border-t border-[#E8E5DE]">
                    <span className="text-[11px] font-sans font-bold uppercase text-[#6B6560] block mb-1.5">
                      Izin Mandat Dosen:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cls.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="text-xs font-sans font-semibold px-2 py-0.5 rounded-md border border-[#D6D3CB] bg-[#FAF8F5] text-[#1C1917]"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8E5DE] flex items-center justify-between gap-2">
                  {cls.pendingReviews > 0 ? (
                    <Link
                      href="/ta/grading"
                      className="font-sans text-xs font-bold text-[#853827] bg-[#FEF2F0] hover:bg-[#FDE6E0] px-2.5 py-1.5 rounded-lg border border-[#C2553A]/30 transition-colors"
                    >
                      {cls.pendingReviews} Draf Menunggu &rarr;
                    </Link>
                  ) : (
                    <span className="font-sans text-xs font-bold text-[#065F46] bg-[#FAF8F5] border border-[#065F46]/25 px-2.5 py-1.5 rounded-lg">
                      Semua Selesai Ditinjau
                    </span>
                  )}

                  <Link
                    href={`/classes/${cls.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1C1917] hover:bg-[#C2553A] text-white font-bold text-xs transition-all"
                  >
                    <span>Buka Kelas</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
