import React from 'react';
import Link from 'next/link';
import { Users, PlusCircle, ArrowRight, BookOpen, Clock, Sparkles } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const GROUPS = [
  {
    id: 'g-1',
    name: 'Study Group: Algoritma & LeetCode Practice',
    topic: 'Pemrograman',
    description: 'Latihan rutin bedah algoritma struktur data, dynamic programming, dan problem solving intensif persiapan kompetisi Gemastik dan magang.',
    members: 18,
    schedule: 'Setiap Rabu, 19:30 - 21:00 WIB',
    tags: ['LeetCode', 'C++', 'Python', 'Kompetitif'],
  },
  {
    id: 'g-2',
    name: 'Komunitas Riset AI & NLP',
    topic: 'Machine Learning',
    description: 'Eksplorasi paper riset AI terkini, implementasi fine-tuning model bahasa (LLM), computer vision, dan kolaborasi publikasi ilmiah.',
    members: 24,
    schedule: 'Setiap Sabtu, 09:00 - 11:30 WIB',
    tags: ['PyTorch', 'Transformers', 'HuggingFace', 'Ollama'],
  },
  {
    id: 'g-3',
    name: 'Grup Kolaborasi Proyek Web Enterprise',
    topic: 'Next.js & Supabase',
    description: 'Pengerjaan rintisan proyek software skala kampus, arsitektur microservices, integrasi payment gateway, dan deployment cloud modern.',
    members: 12,
    schedule: 'Fleksibel Online & Diskusi Async',
    tags: ['Next.js 15', 'TypeScript', 'Tailwind', 'PostgreSQL'],
  },
  {
    id: 'g-4',
    name: 'Cyber Defense & CTF Practice Team',
    topic: 'Keamanan Siber',
    description: 'Simulasi penetration testing, reverse engineering, audit keamanan jaringan server, dan persiapan turnamen Capture The Flag nasional.',
    members: 15,
    schedule: 'Setiap Jumat, 16:30 - 18:30 WIB',
    tags: ['Kali Linux', 'Web Exploit', 'Cryptography', 'Forensics'],
  },
];

export default function GroupsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="grup_belajar_kolaboratif.app"
        badge="Grup Aktif"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                <Users className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Grup Belajar Bersama
              </h1>
            </div>
            <p className="text-base sm:text-lg text-black font-medium max-w-3xl leading-relaxed">
              Bergabunglah dengan grup belajar rekan sekelas untuk berdiskusi tugas praktikum, bedah algoritma, dan persiapan ujian akhir semester.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black bg-black text-white font-heading font-bold text-sm sm:text-base shadow-retro hover:bg-neutral-800 transition-all shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Buat Grup Belajar</span>
            </button>
          </div>
        </div>
      </RetroWindow>

      {/* 2. GRID KARTU GRUP BELAJAR (PROPORSIONAL, CRISP & HIGH CONTRAST) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
        {GROUPS.map((g) => (
          <div
            key={g.id}
            className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:shadow-retro-md transition-all"
          >
            <div className="space-y-4">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded border-2 border-black bg-gray-soft text-xs sm:text-sm font-sans font-bold text-black shadow-xs">
                  {g.topic}
                </span>
                <span className="px-3 py-1 rounded border-2 border-black bg-white text-xs sm:text-sm font-sans font-bold text-black shadow-xs flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>{g.members} Mahasiswa Aktif</span>
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h2 className="font-heading font-bold text-xl sm:text-2xl text-black leading-snug">
                  {g.name}
                </h2>
                <p className="text-sm sm:text-base text-neutral-800 font-medium leading-relaxed">
                  {g.description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                {g.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded border-2 border-black bg-retro-surface text-xs font-sans font-bold text-black"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Schedule */}
              <div className="pt-3 border-t-2 border-black/10 flex items-center gap-2 text-sm font-sans font-bold text-black">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span>{g.schedule}</span>
              </div>
            </div>

            {/* Bottom Button */}
            <button
              type="button"
              className="w-full py-3.5 px-4 rounded-lg border-2 border-black bg-retro-surface hover:bg-gray-soft font-heading font-bold text-sm sm:text-base shadow-retro hover:shadow-retro-md transition-all flex items-center justify-center gap-2 text-black"
            >
              <span>Gabung Grup Belajar Ini</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
