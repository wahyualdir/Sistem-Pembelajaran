import React from 'react';
import {
  FolderArchive,
  Code,
} from 'lucide-react';

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
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* OPEN HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <FolderArchive className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Portofolio Belajar & Proyek
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Dokumentasi artefak pengerjaan tugas besar, hasil evaluasi coding, dan luaran pembelajaran profesional.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              KARYA TERVERIFIKASI
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-primary text-white border-2 border-ink shadow-xs">
              {PROJECTS.length} PROYEK TERPUBLIKASI
            </span>
          </div>
        </div>

        {/* GRID KARTU PROYEK */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {PROJECTS.map((proj) => (
            <div
              key={proj.id}
              className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-all"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-sans text-xs font-bold px-2.5 py-0.5 rounded-full border-2 border-ink bg-gray-soft text-ink shadow-xs">
                    {proj.type}
                  </span>
                  <span className="text-xs font-sans font-bold px-2.5 py-0.5 rounded-full border-2 border-ink bg-surface text-ink shadow-xs">
                    {proj.status}
                  </span>
                </div>

                <div>
                  <h2 className="font-heading font-bold text-lg sm:text-xl text-ink leading-snug">
                    {proj.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-primary font-bold mt-1">
                    Mata Kuliah: {proj.course}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-gray-dark font-bold leading-relaxed">
                  {proj.description}
                </p>

                {/* Tech Stack Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.tech.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-full border-2 border-ink/40 bg-gray-soft text-ink"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t-2 border-ink/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-sans text-ink font-bold truncate max-w-[220px] sm:max-w-[280px]">
                  {proj.repo}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-surface text-ink font-heading font-bold text-xs shadow-xs hover:bg-ink hover:text-white transition-all shrink-0 cursor-pointer"
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Lihat Kode</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
