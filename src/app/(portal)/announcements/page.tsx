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
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER BERANDA STYLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <Megaphone className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Pengumuman Kampus & Kelas
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Warta resmi akademik, edaran jadwal ujian terpadu, agenda seminar teknologi, dan pemberitahuan penting.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              {ANNOUNCEMENTS.length} EDARAN AKTIF
            </span>
          </div>
        </div>

        {/* 2. GRID KARTU PENGUMUMAN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {ANNOUNCEMENTS.map((ann) => (
            <div
              key={ann.id}
              className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-all"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans font-bold bg-gray-soft border border-ink text-ink">
                    {ann.category}
                  </span>

                  {ann.isPinned && (
                    <span className="inline-flex items-center gap-1.5 font-sans text-xs font-bold text-ink bg-gray-soft px-2.5 py-0.5 rounded-full border border-ink">
                      <Pin className="h-3 w-3 fill-ink text-ink" />
                      <span>Disematkan</span>
                    </span>
                  )}
                </div>

                <h2 className="font-heading font-bold text-lg sm:text-xl text-ink leading-snug">
                  {ann.title}
                </h2>

                <p className="text-xs sm:text-sm text-gray-dark font-medium leading-relaxed">
                  {ann.content}
                </p>
              </div>

              <div className="pt-3 border-t-2 border-ink/10 flex flex-wrap items-center justify-between text-xs font-sans text-gray-dark font-bold gap-2">
                <span className="truncate max-w-[260px] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>{ann.author}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0 text-ink">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>{ann.date}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
