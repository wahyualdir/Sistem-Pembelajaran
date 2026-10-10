import React from 'react';
import Link from 'next/link';
import { UserCheck, Calendar, Clock, ArrowRight, Award, Sparkles } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const MENTORS = [
  {
    id: 'm-1',
    name: 'Dr. Ardiansyah, S.T., M.Kom.',
    initials: 'AR',
    role: 'Dosen Pembimbing Akademik',
    focus: 'Rancang Bangun Sistem Informasi, Arsitektur Perangkat Lunak, dan Konsultasi Tugas Akhir Skripsi.',
    slots: 'Tersedia 3 Kuota',
    schedule: 'Senin & Kamis, 14:00 - 16:00 WIB',
    topics: ['Skripsi TI', 'System Architecture', 'Review Proposal'],
  },
  {
    id: 'm-2',
    name: 'Citra Asisten',
    initials: 'CA',
    role: 'Mentor Praktikum & Live Coding',
    focus: 'Persiapan Tugas Praktikum Mingguan, Pemecahan Masalah Algoritma, dan Debugging Lingkungan Lokal.',
    slots: 'Tersedia 5 Kuota',
    schedule: 'Selasa & Jumat, 16:00 - 18:00 WIB',
    topics: ['Struktur Data', 'Python & C++', 'Supabase / PostgreSQL'],
  },
  {
    id: 'm-3',
    name: 'Fajar Ramadhan, M.Kom.',
    initials: 'FR',
    role: 'Dosen Pembimbing Basis Data',
    focus: 'Relational Database Modeling, Skalabilitas Sistem, Replikasi Data, dan Optimasi Kueri SQL Kompleks.',
    slots: 'Tersedia 2 Kuota',
    schedule: 'Rabu & Sabtu, 10:00 - 12:00 WIB',
    topics: ['Database Design', 'Query Tuning', 'Security Audit'],
  },
  {
    id: 'm-4',
    name: 'Budi Santoso',
    initials: 'BS',
    role: 'Mentor Peer-to-Peer Senior',
    focus: 'Bimbingan Rekan Sebaya untuk Fullstack Next.js, API Integration, Git Version Control, dan Persiapan Magang.',
    slots: 'Tersedia 4 Kuota',
    schedule: 'Kamis & Sabtu, 13:00 - 15:00 WIB',
    topics: ['Next.js App Router', 'REST & GraphQL', 'Git Workflow'],
  },
];

export default function MentoringPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="program_mentoring_akademik.app"
        badge="Bimbingan Aktif"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-xs">
                <UserCheck className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Mentoring & Bimbingan Belajar
              </h1>
            </div>
            <p className="text-base sm:text-lg text-black font-medium max-w-3xl leading-relaxed">
              Dapatkan bimbingan intensif dari dosen pembimbing dan asisten mahasiswa senior untuk membantu kelancaran studi, penguasaan materi praktikum, dan konsultasi tugas akhir.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm sm:text-base font-mono font-black text-black shadow-retro">
              {MENTORS.length} Mentor Siaga
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. GRID KARTU MENTOR (PROPORSIONAL, CRISP & HIGH CONTRAST) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
        {MENTORS.map((m) => (
          <div
            key={m.id}
            className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:shadow-retro-md transition-all"
          >
            <div className="space-y-4">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded border-2 border-black bg-retro-mint text-xs sm:text-sm font-mono font-black text-black shadow-xs">
                  {m.role}
                </span>
                <span className="px-3 py-1 rounded border-2 border-black bg-emerald-100 text-xs sm:text-sm font-mono font-black text-emerald-950 shadow-xs">
                  {m.slots}
                </span>
              </div>

              {/* Mentor Avatar + Name */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl border-2 border-black bg-retro-warm flex items-center justify-center font-heading font-black text-xl text-black shrink-0 shadow-xs">
                  {m.initials}
                </div>
                <div className="space-y-1">
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-black leading-snug">
                    {m.name}
                  </h2>
                  <p className="text-sm sm:text-base text-neutral-800 font-medium leading-relaxed">
                    {m.focus}
                  </p>
                </div>
              </div>

              {/* Topics Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {m.topics.map((top) => (
                  <span
                    key={top}
                    className="px-2.5 py-0.5 rounded border-2 border-black bg-retro-warm text-xs font-mono font-bold text-black"
                  >
                    #{top}
                  </span>
                ))}
              </div>

              {/* Schedule Info */}
              <div className="pt-3 border-t-2 border-black/10 flex items-center gap-2 text-sm font-mono font-bold text-black">
                <Clock className="h-4 w-4 text-retro-orange shrink-0" />
                <span>{m.schedule}</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              className="w-full py-3.5 px-4 rounded-lg border-2 border-black bg-retro-yellow hover:bg-black hover:text-white text-black font-heading font-black text-sm sm:text-base shadow-retro hover:shadow-retro-md transition-all flex items-center justify-center gap-2"
            >
              <span>Ajukan Konsultasi Sekarang</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
