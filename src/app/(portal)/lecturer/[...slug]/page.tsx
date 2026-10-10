import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  Users,
  UserCheck,
  MessageSquare,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PlusCircle,
  FolderArchive,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

interface PageProps {
  params: {
    slug: string[];
  };
}

const LECTURER_CLASSES = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    code: 'TI-301',
    title: 'Pemrograman Web Lanjut (Kelas A)',
    sks: 3,
    studentsCount: 36,
    assistant: 'Budi Santoso',
    schedule: 'Senin, 08:00 - 10:30 WIB · Lab Cloud',
    pendingGrading: 4,
    materialsCount: 8,
    status: 'Pertemuan 7 / 16',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    code: 'TI-401',
    title: 'Kecerdasan Buatan & Machine Learning (Kelas B)',
    sks: 3,
    studentsCount: 32,
    assistant: 'Dinda Kirana',
    schedule: 'Rabu, 13:30 - 16:00 WIB · Lab Riset AI',
    pendingGrading: 2,
    materialsCount: 7,
    status: 'Pertemuan 7 / 16',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    code: 'TI-305',
    title: 'Basis Data Terdistribusi (Kelas C)',
    sks: 3,
    studentsCount: 38,
    assistant: 'Kevin Pratama',
    schedule: 'Kamis, 08:00 - 10:30 WIB · Lab 1',
    pendingGrading: 0,
    materialsCount: 6,
    status: 'Pertemuan 6 / 16',
  },
];

export default function LecturerSubpage({ params }: PageProps) {
  const subroute = params.slug?.[0] || 'materials';

  const titles: Record<string, { title: string; subtitle: string; icon: any; desc: string }> = {
    materials: {
      title: 'Konten & Materi Perkuliahan',
      subtitle: 'Distribusi Modul, Video & Berkas Ajar',
      icon: BookOpen,
      desc: 'Kelola materi pembelajaran terstruktur per pertemuan dengan penanda selesai dan materi unduhan.',
    },
    assignments: {
      title: 'Tugas & Penilaian Mahasiswa',
      subtitle: 'Pengumpulan Tugas & Rubrik Evaluasi',
      icon: FileText,
      desc: 'Pantau pengumpulan berkas tugas mahasiswa, beri umpan balik terstruktur, dan tetapkan skor penilaian.',
    },
    students: {
      title: 'Daftar Peserta Kelas Perkuliahan',
      subtitle: 'Roster Mahasiswa & Status Akademik',
      icon: Users,
      desc: 'Kelola data mahasiswa terdaftar pada setiap rombongan belajar kelas yang Anda ampu.',
    },
    assistants: {
      title: 'Kelola Asisten Dosen (TA)',
      subtitle: 'Delegasi Mandat & Hak Akses Asisten',
      icon: UserCheck,
      desc: 'Tunjuk mahasiswa asisten untuk membantu presensi, review draf tugas, dan menjawab forum praktikum.',
    },
    forum: {
      title: 'Forum Diskusi & Pengumuman Kelas',
      subtitle: 'Komunikasi Dua Arah & Klarifikasi Materi',
      icon: MessageSquare,
      desc: 'Ruang interaksi dosen dan mahasiswa untuk diskusi materi kuliah, tanya jawab tugas, dan informasi kelas.',
    },
    mentoring: {
      title: 'Mahasiswa Bimbingan Akademik (Dosen Wali)',
      subtitle: 'Konsultasi Studi & Rencana Perkuliahan',
      icon: Users,
      desc: 'Monitoring progres akademik, evaluasi indeks prestasi, dan konsultasi rencana studi mahasiswa bimbingan.',
    },
  };

  const current = titles[subroute] || {
    title: 'Manajemen Pengajaran Dosen',
    subtitle: 'Sistem Pembelajaran Terpadu LMS SIAJAR',
    icon: Layers,
    desc: 'Layanan administrasi dan pembelajaran untuk dosen pengampu mata kuliah.',
  };
  const Icon = current.icon;

  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title={`pengajaran_${subroute}.app`}
        subtitle={current.subtitle}
        headerBadge="Mode Dosen"
        headerBadgeVariant="warning"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
            <Icon className="h-7 w-7 text-retro-orange" />
            <span>{current.title}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-3xl leading-relaxed">
            {current.desc}
          </p>
        </div>
      </RetroWindow>

      {/* Grid Kelas Diampu Full Width */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-black text-xl text-foreground">Daftar Kelas Perkuliahan Diampu</h2>
            <p className="text-xs text-muted-foreground">Pilih kelas kuliah untuk mengelola {current.title.toLowerCase()}.</p>
          </div>
          <Link
            href="/classes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black bg-black text-white font-bold text-xs shadow-retro hover:bg-neutral-800 transition-all"
          >
            <span>Buka Hub Kelas &rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LECTURER_CLASSES.map((cls) => (
            <div
              key={cls.id}
              className="rounded-xl border-2 border-black bg-white p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-0.5 transition-transform"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded border border-black bg-retro-warm">
                    {cls.code}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-400">
                    {cls.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-heading font-black text-lg text-foreground leading-snug">
                    {cls.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Asisten Dosen: <strong className="text-foreground">{cls.assistant}</strong>
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-xs font-mono">
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-neutral-500" />
                    <span>{cls.schedule}</span>
                  </p>
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-neutral-500" />
                    <span>{cls.studentsCount} Mahasiswa Terdaftar</span>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-black/10 flex items-center justify-between">
                {cls.pendingGrading > 0 ? (
                  <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-300">
                    {cls.pendingGrading} Tugas Perlu Nilai
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300">
                    Nilai Lengkap
                  </span>
                )}

                <Link
                  href="/classes"
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border-2 border-black bg-black text-white font-bold text-xs shadow-xs hover:bg-neutral-800 transition-all"
                >
                  <span>Kelola</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
