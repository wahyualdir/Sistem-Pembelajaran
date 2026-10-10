import React from 'react';
import Link from 'next/link';
import { Layers, Users, BookOpen, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const ASSISTED_CLASSES = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    code: 'TI-301',
    title: 'Pemrograman Web Lanjut',
    section: 'Kelas A',
    lecturer: 'Dr. Ardiansyah, S.T., M.Kom.',
    studentsCount: 36,
    pendingReviews: 4,
    schedule: 'Senin, 08:00 - 10:30 WIB · Lab Cloud',
    permissions: ['Bantu Presensi', 'Review Draf Tugas', 'Moderasi Forum'],
    status: 'Aktif Berjalan',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    code: 'TI-102',
    title: 'Algoritma & Pemrograman Dasar',
    section: 'Kelas C',
    lecturer: 'Bambang Sudarsono, M.Kom.',
    studentsCount: 40,
    pendingReviews: 2,
    schedule: 'Rabu, 10:45 - 13:15 WIB · Lab 1',
    permissions: ['Bantu Presensi', 'Review Draf Tugas'],
    status: 'Aktif Berjalan',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    code: 'TI-204',
    title: 'Praktikum Sistem Basis Data',
    section: 'Kelas B',
    lecturer: 'Fajar Ramadhan, M.Kom.',
    studentsCount: 32,
    pendingReviews: 0,
    schedule: 'Kamis, 13:30 - 16:00 WIB · Lab Basis Data',
    permissions: ['Bantu Presensi', 'Moderasi Forum', 'Pantau Ujian'],
    status: 'Aktif Berjalan',
  },
];

export default function AssistantClassesPage() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title="kelas_yang_diasistensi.app"
        subtitle="Mandat dan Delegasi Peran Asisten Dosen"
        headerBadge="Mode Asisten"
        headerBadgeVariant="warning"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
            <Layers className="h-7 w-7 text-retro-orange" />
            <span>Kelas yang Diasistensi</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-3xl leading-relaxed">
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
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded border border-black bg-retro-warm">
                  {cls.code} · {cls.section}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-400">
                  {cls.status}
                </span>
              </div>

              <div>
                <h2 className="font-heading font-black text-lg text-foreground leading-snug">
                  {cls.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Dosen: <strong className="text-foreground">{cls.lecturer}</strong>
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-xs">
                <p className="text-muted-foreground flex items-center gap-1.5 font-mono">
                  <Clock className="h-3.5 w-3.5 text-neutral-500" />
                  <span>{cls.schedule}</span>
                </p>
                <p className="text-muted-foreground flex items-center gap-1.5 font-mono">
                  <Users className="h-3.5 w-3.5 text-neutral-500" />
                  <span>{cls.studentsCount} Mahasiswa Terdaftar</span>
                </p>
              </div>

              {/* Izin Mandat Asdos */}
              <div className="pt-2">
                <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground block mb-1.5">
                  Izin Mandat Dosen:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cls.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-neutral-300 bg-neutral-100 text-neutral-800"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-black/10 flex items-center justify-between">
              {cls.pendingReviews > 0 ? (
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-300">
                  {cls.pendingReviews} Draf Menunggu
                </span>
              ) : (
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-300">
                  Semua Selesai Ditinjau
                </span>
              )}

              <Link
                href="/classes"
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
