import React from 'react';
import {
  CertificatesHubView,
  type CertificateItem,
  type PortfolioProjectItem,
} from '@/modules/academic/certificates-hub-view';

const DEMO_CERTIFICATES: CertificateItem[] = [
  {
    id: 'cert-1',
    title: 'Sertifikat Kompetensi Pemrograman Web Lanjut (Fullstack)',
    issuer: 'Laboratorium Rekayasa Perangkat Lunak',
    date: '30 September 2026',
    credentialId: 'CERT-UIR-2026-WEB-0018',
    grade: 'Lulus dengan Pujian (Grade A)',
    hours: '64 Jam Pelajaran',
  },
  {
    id: 'cert-2',
    title: 'Lencana Prestasi Terbaik: Kuis Algoritma & Struktur Data',
    issuer: 'Fakultas Teknik Informatika',
    date: '15 September 2026',
    credentialId: 'BADGE-DSA-TOP10-2026',
    grade: 'Peringkat 5 dari 120 Peserta',
    hours: 'Top 5% Performer',
  },
  {
    id: 'cert-3',
    title: 'Sertifikat Asisten Laboratorium Komputer Komputasi',
    issuer: 'Ketua Program Studi Teknik Informatika',
    date: '01 Juli 2026',
    credentialId: 'ASDOS-TI-GANJIL-2026',
    grade: 'Aktif Menjalankan Tugas Asistensi',
    hours: '1 Semester Penuh',
  },
  {
    id: 'cert-4',
    title: 'Sertifikat Pelatihan Keamanan Siber & Kriptografi Modern',
    issuer: 'Pusat Studi Cyber Defense & Forensik',
    date: '20 Agustus 2026',
    credentialId: 'CERT-CYBER-UIR-8821',
    grade: 'Kompeten (Skor 92/100)',
    hours: '32 Jam Praktikum',
  },
];

const DEMO_PROJECTS: PortfolioProjectItem[] = [
  {
    id: 'proj-1',
    title: 'SIAJAR: LMS Next.js Enterprise & Proctoring',
    course: 'Pemrograman Web Lanjut (TI-301)',
    type: 'Tugas Akhir Proyek',
    description:
      'Implementasi aplikasi manajemen perkuliahan dengan Next.js App Router, live panel proctoring ujian, compiler live coding sandbox, dan presensi QR haversine.',
    tech: ['Next.js 15', 'TypeScript', 'Prisma', 'PostgreSQL', 'Tailwind CSS'],
    status: 'Selesai (Skor: 95/100)',
    repo: 'github.com/wahyu/siajar-lms',
  },
  {
    id: 'proj-2',
    title: 'AI Resume & Quiz Generator Engine',
    course: 'Kecerdasan Buatan (TI-401)',
    type: 'Proyek Kelompok Riset',
    description:
      'Aplikasi pembaca modul PDF otomatis dan ekstraksi bank soal kuis bergradasi taksonomi Bloom menggunakan model machine learning dan semantic search.',
    tech: ['Python', 'FastAPI', 'PyTorch', 'Transformers', 'ChromaDB'],
    status: 'Selesai (Skor: 92/100)',
    repo: 'github.com/wahyu/ai-quiz-engine',
  },
  {
    id: 'proj-3',
    title: 'High-Concurrency Distributed Database Sharding',
    course: 'Basis Data Terdistribusi (TI-305)',
    type: 'Eksperimen Benchmark',
    description:
      'Simulasi replikasi multi-master, partisi hash, dan pemulihan failover transaksi perbankan untuk menguji latensi throughput di bawah beban 10.000 TPS.',
    tech: ['PostgreSQL', 'Docker', 'Redis', 'Node.js', 'Go'],
    status: 'Sedang Berjalan (Progres 80%)',
    repo: 'github.com/wahyu/db-sharding-lab',
  },
  {
    id: 'proj-4',
    title: 'Penetration Testing Tool & Vulnerability Scanner',
    course: 'Keamanan Siber & Kriptografi (TI-408)',
    type: 'Mini Riset Lab',
    description:
      'Audit keamanan web app otomatis terhadap celah SQL Injection, XSS, dan CSRF berpedoman OWASP Top 10 dengan laporan PDF eksekutif.',
    tech: ['Python', 'Scapy', 'Nmap', 'Docker', 'Linux'],
    status: 'Selesai (Skor: 94/100)',
    repo: 'github.com/wahyu/owasp-security-audit',
  },
];

import { isDemoMode } from '@/lib/config/features';

export default function CertificatesPage() {
  const isDemo = isDemoMode();
  return (
    <CertificatesHubView
      certificates={isDemo ? DEMO_CERTIFICATES : []}
      projects={isDemo ? DEMO_PROJECTS : []}
    />
  );
}
