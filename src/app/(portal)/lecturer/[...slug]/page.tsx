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
  Clock,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { getMentoringRiskListAction } from '@/modules/early-warning/actions';
import { MentoringRiskView } from '@/modules/early-warning/mentoring-risk-view';

interface PageProps {
  params: Promise<{ slug: string[] }> | { slug: string[] };
}

const LECTURER_CLASSES = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    code: 'STI2544138',
    title: 'Pemrograman Web & Arsitektur Cloud (IF-3A)',
    sks: 3,
    studentsCount: 45,
    assistant: 'Citra Asisten',
    schedule: 'Senin, 08:45 - 11:15 WIB · 3C.2.05 - TEKNIK C',
    pendingGrading: 4,
    materialsCount: 8,
    status: 'Pertemuan 7 / 16',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    code: 'STI2543131',
    title: 'Algoritma & Struktur Data Lanjut (IF-3B)',
    sks: 3,
    studentsCount: 40,
    assistant: 'Citra Asisten',
    schedule: 'Selasa, 10:30 - 13:00 WIB · Computer System LAB - TEKNIK C',
    pendingGrading: 2,
    materialsCount: 7,
    status: 'Pertemuan 7 / 16',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    code: 'STI2541114',
    title: 'Basis Data Terdistribusi & Big Data (IF-3C)',
    sks: 3,
    studentsCount: 42,
    assistant: 'Citra Asisten',
    schedule: 'Rabu, 13:00 - 15:30 WIB · Mobile Lab - TEKNIK D',
    pendingGrading: 0,
    materialsCount: 6,
    status: 'Pertemuan 6 / 16',
  },
];

export default async function LecturerSubpage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const subroute = resolvedParams?.slug?.[0] || 'materials';

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
      subtitle: 'Konsultasi Studi, Kehadiran & Status Risiko',
      icon: Users,
      desc: 'Monitoring progres akademik, evaluasi kehadiran, tugas tertunda, dan konsultasi rencana studi mahasiswa bimbingan.',
    },
  };

  const current = titles[subroute] || {
    title: 'Manajemen Pengajaran Dosen',
    subtitle: 'Sistem Pembelajaran Terpadu RuangKampus',
    icon: Layers,
    desc: 'Layanan administrasi dan pembelajaran untuk dosen pengampu mata kuliah.',
  };
  const Icon = current.icon;

  if (subroute === 'mentoring') {
    const advisees = await getMentoringRiskListAction();

    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
        <RetroWindow
          title={current.title}
          badge="DOSEN WALI :: MENTORING"
          headerClassName="bg-gray-soft"
          bodyClassName="p-5 sm:p-6 space-y-2 bg-white"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-black flex items-center gap-3">
                <Icon className="h-6 w-6 text-black" />
                <span>{current.title}</span>
              </h1>
              <p className="text-xs sm:text-sm text-black/75 font-medium max-w-3xl leading-relaxed">
                {current.desc}
              </p>
            </div>
          </div>
        </RetroWindow>

        <MentoringRiskView advisees={advisees} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title={current.title}
        badge="MODE DOSEN"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-6 space-y-2 bg-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <Icon className="h-6 w-6 text-black" />
              <span>{current.title}</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-3xl leading-relaxed">
              {current.desc}
            </p>
          </div>
        </div>
      </RetroWindow>

      {/* Grid Kelas Diampu Full Width */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-black text-xl text-black">Daftar Kelas Perkuliahan Diampu</h2>
            <p className="text-xs text-black/70 font-bold">Pilih kelas kuliah untuk mengelola {current.title.toLowerCase()}.</p>
          </div>
          <Link
            href="/classes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black bg-black text-white font-bold text-xs shadow-retro hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <span>Buka Hub Kelas &rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LECTURER_CLASSES.map((cls) => (
            <div
              key={cls.id}
              className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-0.5 transition-transform"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded border-2 border-black bg-gray-soft text-black shadow-retro-sm">
                    {cls.code}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white text-black border-2 border-black shadow-retro-sm">
                    {cls.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-heading font-black text-lg text-black leading-snug">
                    <Link href={`/classes/${cls.id}`} className="hover:underline">
                      {cls.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-black/75 mt-1 font-sans">
                    Asisten Dosen: <strong className="text-black">{cls.assistant}</strong>
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t-2 border-black/10 text-xs font-sans">
                  <p className="text-black/70 flex items-center gap-1.5 font-medium">
                    <Clock className="h-3.5 w-3.5 text-black" />
                    <span>{cls.schedule}</span>
                  </p>
                  <p className="text-black/70 flex items-center gap-1.5 font-medium">
                    <Users className="h-3.5 w-3.5 text-black" />
                    <span>{cls.studentsCount} Mahasiswa Terdaftar</span>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-black/10 flex items-center justify-between">
                {cls.pendingGrading > 0 ? (
                  <Link
                    href={`/classes/${cls.id}?tab=tugas`}
                    className="text-xs font-mono font-bold text-black bg-gray-soft hover:bg-neutral-200 px-2.5 py-1 rounded border border-black shadow-retro-sm"
                  >
                    {cls.pendingGrading} Tugas Perlu Nilai
                  </Link>
                ) : (
                  <span className="text-xs font-mono font-bold text-black bg-white px-2.5 py-1 rounded border border-black shadow-retro-sm">
                    Nilai Lengkap
                  </span>
                )}

                <Link
                  href={`/classes/${cls.id}`}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border-2 border-black bg-black text-white font-bold text-xs shadow-retro-sm hover:bg-neutral-800 transition-all cursor-pointer"
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
