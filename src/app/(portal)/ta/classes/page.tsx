import React from 'react';
import Link from 'next/link';
import { Layers, Users, ArrowRight, Clock } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

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
        {ASSISTED_CLASSES.map((cls) => (
          <div
            key={cls.id}
            className="rounded-xl border-2 border-black bg-white p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-0.5 transition-transform"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-bold px-2.5 py-1 rounded border border-black bg-gray-soft">
                  {cls.code} · {cls.section}
                </span>
                <span className="text-xs font-sans font-bold px-2 py-0.5 rounded bg-surface text-ink border border-ink">
                  {cls.status}
                </span>
              </div>

              <div>
                <h2 className="font-heading font-bold text-lg text-foreground leading-snug">
                  <Link href={`/classes/${cls.id}`} className="hover:text-primary transition-colors">
                    {cls.title}
                  </Link>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Dosen: <strong className="text-foreground">{cls.lecturer}</strong>
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-xs">
                <p className="text-muted-foreground flex items-center gap-1.5 font-sans">
                  <Clock className="h-3.5 w-3.5 text-neutral-500" />
                  <span>{cls.schedule}</span>
                </p>
                <p className="text-muted-foreground flex items-center gap-1.5 font-sans">
                  <Users className="h-3.5 w-3.5 text-neutral-500" />
                  <span>{cls.studentsCount} Mahasiswa Terdaftar</span>
                </p>
              </div>

              {/* Izin Mandat Asdos */}
              <div className="pt-2">
                <span className="text-xs font-sans font-bold uppercase text-muted-foreground block mb-1.5">
                  Izin Mandat Dosen:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cls.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="text-xs font-sans font-semibold px-2 py-0.5 rounded border border-neutral-300 bg-neutral-100 text-neutral-800"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-black/10 flex items-center justify-between">
              {cls.pendingReviews > 0 ? (
                <Link
                  href="/ta/grading"
                  className="font-sans text-xs font-bold text-ink bg-gray-soft hover:bg-neutral-200 px-2.5 py-1 rounded border border-ink transition-colors"
                >
                  {cls.pendingReviews} Draf Menunggu &rarr;
                </Link>
              ) : (
                <span className="font-sans text-xs font-bold text-ink bg-surface px-2 py-1 rounded border border-ink">
                  Semua Selesai Ditinjau
                </span>
              )}

              <Link
                href={`/classes/${cls.id}`}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border-2 border-black bg-black text-white font-bold text-xs shadow-xs hover:bg-neutral-800 transition-all"
              >
                <span>Buka Kelas</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
