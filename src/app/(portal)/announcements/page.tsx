import React from 'react';
import Link from 'next/link';
import {
  Bell,
  Calendar,
  Layers,
  ArrowRight,
  Pin,
  Clock,
  Megaphone,
  User,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Pelaksanaan Ujian Tengah Semester (UTS) Semester Ganjil 2026/2027',
    date: '06 Oktober 2026',
    author: 'Bagian Akademik & Evaluasi',
    category: 'Akademik',
    isPinned: true,
    content:
      'Diberitahukan kepada seluruh mahasiswa bahwa UTS akan diselenggarakan secara hybrid menggunakan modul Ujian LMS SIAJAR. Mahasiswa wajib memastikan baterai laptop terisi penuh, koneksi stabil, dan mematuhi aturan proctoring.',
  },
  {
    id: 'ann-2',
    title: 'Workshop Cloud Native & Container Security untuk Mahasiswa TI',
    date: '03 Oktober 2026',
    author: 'Himpunan Mahasiswa Teknik Informatika',
    category: 'Kegiatan',
    isPinned: false,
    content:
      'HMTI menyelenggarakan workshop praktis bersama praktisi industri mengenai Kubernetes, Docker containerization, dan scanning vulnerabilitas. Registrasi dibuka secara gratis dengan kuota 100 peserta.',
  },
  {
    id: 'ann-3',
    title: 'Pemeliharaan Server Sandbox Kode & Layanan Evaluasi',
    date: '28 September 2026',
    author: 'System Administrator',
    category: 'Sistem',
    isPinned: false,
    content:
      'Akan dilakukan upgrade resource pada engine compiler live coding pada hari Sabtu pukul 22:00 - 24:00 WIB. Selama proses pemeliharaan, submit kode akan dialihkan ke antrean offline tanpa kehilangan progres pengerjaan.',
  },
  {
    id: 'ann-4',
    title: 'Batas Akhir Pengajuan Dispensasi & Verifikasi Surat Sakit UTS',
    date: '25 September 2026',
    author: 'Biro Administrasi Akademik',
    category: 'Layanan',
    isPinned: false,
    content:
      'Mahasiswa yang memerlukan izin sakit wajib mengunggah surat keterangan dokter paling lambat H+2 setelah jadwal ujian melalui portal Presensi SIAJAR untuk validasi ujian susulan.',
  },
];

export default function AnnouncementsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="pengumuman_dan_warta_kampus.app"
        badge="Warta Kampus"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                <Bell className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Pengumuman Kampus & Kelas
              </h1>
            </div>
            <p className="text-base sm:text-lg text-black font-medium max-w-3xl leading-relaxed">
              Warta resmi akademik, edaran jadwal ujian terpadu, agenda seminar teknologi, dan pemberitahuan penting dari rektorat dan dosen pengampu.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm sm:text-base font-sans font-bold text-black shadow-retro">
              {ANNOUNCEMENTS.length} Edaran Aktif
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. GRID KARTU PENGUMUMAN (CRISP, LEGA & BOLD) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
        {ANNOUNCEMENTS.map((ann) => (
          <div
            key={ann.id}
            className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:shadow-retro-md transition-all"
          >
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-sans text-xs sm:text-sm font-bold px-3 py-1 rounded border-2 border-black bg-gray-soft text-black shadow-xs">
                  {ann.category}
                </span>

                {ann.isPinned && (
                  <span className="inline-flex items-center gap-1.5 font-sans text-xs sm:text-sm font-bold text-black bg-gray-soft px-2.5 py-1 rounded border-2 border-black shadow-xs">
                    <Pin className="h-3.5 w-3.5 fill-black text-black" />
                    <span>Disematkan</span>
                  </span>
                )}
              </div>

              <h2 className="font-heading font-bold text-xl sm:text-2xl text-black leading-snug">
                {ann.title}
              </h2>

              <p className="text-sm sm:text-base text-neutral-800 font-medium leading-relaxed">
                {ann.content}
              </p>
            </div>

            <div className="pt-3.5 border-t-2 border-black/10 flex flex-wrap items-center justify-between text-xs sm:text-sm font-sans text-neutral-900 font-bold gap-2">
              <span className="truncate max-w-[260px] flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>{ann.author}</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0 text-black">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>{ann.date}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
