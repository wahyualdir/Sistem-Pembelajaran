import React from 'react';
import Link from 'next/link';
import {
  FolderArchive,
  Code,
  Globe,
  Award,
  Layers,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const PROJECTS = [
  {
    id: 'proj-1',
    title: 'SIAJAR: LMS Next.js Enterprise & Proctoring',
    course: 'Pemrograman Web Lanjut (TI-301)',
    type: 'Tugas Akhir Proyek',
    description: 'Implementasi aplikasi manajemen perkuliahan dengan Next.js App Router, live panel proctoring ujian, compiler live coding sandbox, dan presensi QR haversine.',
    tech: ['Next.js 15', 'TypeScript', 'Prisma', 'PostgreSQL', 'Tailwind CSS'],
    status: 'Selesai (Skor: 95/100)',
    repo: 'github.com/wahyu/siajar-lms',
  },
  {
    id: 'proj-2',
    title: 'AI Resume & Quiz Generator Engine',
    course: 'Kecerdasan Buatan (TI-401)',
    type: 'Proyek Kelompok Riset',
    description: 'Aplikasi pembaca modul PDF otomatis dan ekstraksi bank soal kuis bergradasi taksonomi Bloom menggunakan model machine learning dan semantic search.',
    tech: ['Python', 'FastAPI', 'PyTorch', 'Transformers', 'ChromaDB'],
    status: 'Selesai (Skor: 92/100)',
    repo: 'github.com/wahyu/ai-quiz-engine',
  },
  {
    id: 'proj-3',
    title: 'High-Concurrency Distributed Database Sharding',
    course: 'Basis Data Terdistribusi (TI-305)',
    type: 'Eksperimen Benchmark',
    description: 'Simulasi replikasi multi-master, partisi hash, dan pemulihan failover transaksi perbankan untuk menguji latensi throughput di bawah beban 10.000 TPS.',
    tech: ['PostgreSQL', 'Docker', 'Redis', 'Node.js', 'Go'],
    status: 'Sedang Berjalan (Progres 80%)',
    repo: 'github.com/wahyu/db-sharding-lab',
  },
  {
    id: 'proj-4',
    title: 'Penetration Testing Tool & Vulnerability Scanner',
    course: 'Keamanan Siber & Kriptografi (TI-408)',
    type: 'Mini Riset Lab',
    description: 'Audit keamanan web app otomatis terhadap celah SQL Injection, XSS, dan CSRF berpedoman OWASP Top 10 dengan laporan PDF eksekutif.',
    tech: ['Python', 'Scapy', 'Nmap', 'Docker', 'Linux'],
    status: 'Selesai (Skor: 94/100)',
    repo: 'github.com/wahyu/owasp-security-audit',
  },
];

export default function PortfolioPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="portofolio_karya_mahasiswa.app"
        badge="Karya Terverifikasi"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-xs">
                <FolderArchive className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Portofolio Belajar & Proyek
              </h1>
            </div>
            <p className="text-base sm:text-lg text-black font-medium max-w-3xl leading-relaxed">
              Dokumentasi artefak pengerjaan tugas besar, hasil evaluasi coding, dan luaran pembelajaran yang siap dibagikan untuk kebutuhan rekrutmen profesional.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm sm:text-base font-mono font-black text-black shadow-retro">
              {PROJECTS.length} Proyek Terpublikasi
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. GRID KARTU PROYEK (PROPORSIONAL, LEGA & BOLD) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
        {PROJECTS.map((proj) => (
          <div
            key={proj.id}
            className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:shadow-retro-md transition-all"
          >
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs sm:text-sm font-black px-3 py-1 rounded border-2 border-black bg-retro-warm text-black shadow-xs">
                  {proj.type}
                </span>
                <span className="text-xs sm:text-sm font-mono font-black px-3 py-1 rounded border-2 border-black bg-emerald-100 text-emerald-950 shadow-xs">
                  {proj.status}
                </span>
              </div>

              <div>
                <h2 className="font-heading font-black text-xl sm:text-2xl text-black leading-snug">
                  {proj.title}
                </h2>
                <p className="text-xs sm:text-sm text-retro-orange font-bold mt-1">
                  Mata Kuliah: {proj.course}
                </p>
              </div>

              <p className="text-sm sm:text-base text-neutral-800 font-medium leading-relaxed">
                {proj.description}
              </p>

              {/* Tech Stack Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {proj.tech.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-mono font-bold px-2.5 py-0.5 rounded border-2 border-black/30 bg-retro-warm text-black"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3.5 border-t-2 border-black/10 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <span className="font-mono text-black font-bold truncate max-w-[240px] sm:max-w-[300px]">
                {proj.repo}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black bg-retro-yellow text-black font-heading font-black text-xs sm:text-sm shadow-xs hover:bg-black hover:text-white transition-all shrink-0"
              >
                <Code className="h-4 w-4" />
                <span>Lihat Kode & Repositori</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
