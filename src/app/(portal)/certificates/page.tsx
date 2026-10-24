import React from 'react';
import {
  CertificatesHubView,
  type CertificateItem,
  type PortfolioProjectItem,
} from '@/modules/academic/certificates-hub-view';
import { redirect } from 'next/navigation';
import { isDemoMode } from '@/lib/config/features';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getStudentCertificatesAction } from '@/modules/academic/badge-certificate-actions';

const DEMO_CERTIFICATES: CertificateItem[] = [
  {
    id: 'cert-1',
    title: 'Sertifikat Kompetensi Pemrograman Web & Arsitektur Cloud (STI2544138)',
    issuer: 'Laboratorium Rekayasa Perangkat Lunak UIR',
    date: '30 September 2026',
    credentialId: 'CERT-UIR-2026-WEB-0018',
    grade: 'Lulus dengan Pujian (Grade A)',
    hours: '64 Jam Pelajaran',
  },
  {
    id: 'cert-2',
    title: 'Lencana Prestasi Terbaik: Algoritma & Struktur Data Lanjut (STI2543131)',
    issuer: 'Fakultas Teknik Informatika UIR',
    date: '15 September 2026',
    credentialId: 'BADGE-DSA-TOP10-2026',
    grade: 'Peringkat 5 dari 120 Peserta',
    hours: 'Top 5% Performer',
  },
  {
    id: 'cert-3',
    title: 'Sertifikat Asisten Laboratorium Komputasi Terpadu',
    issuer: 'Ketua Program Studi Teknik Informatika',
    date: '01 Juli 2026',
    credentialId: 'ASDOS-TI-GANJIL-2026',
    grade: 'Aktif Menjalankan Tugas Asistensi',
    hours: '1 Semester Penuh',
  },
  {
    id: 'cert-4',
    title: 'Sertifikat Praktikum Basis Data Terdistribusi & Big Data (STI2541114)',
    issuer: 'Laboratorium Basis Data & Sistem Terdistribusi',
    date: '20 Agustus 2026',
    credentialId: 'CERT-DB-UIR-8821',
    grade: 'Kompeten (Skor 92/100)',
    hours: '32 Jam Praktikum',
  },
];

const DEMO_PROJECTS: PortfolioProjectItem[] = [
  {
    id: 'proj-1',
    title: 'SIAJAR: LMS Next.js Enterprise & Proctoring',
    course: 'Pemrograman Web & Arsitektur Cloud (STI2544138)',
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
    course: 'Pengenalan Kecerdasan Buatan (STI2543129)',
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
    course: 'Basis Data Terdistribusi & Big Data (STI2541114)',
    type: 'Eksperimen Benchmark',
    description:
      'Simulasi replikasi multi-master, partisi hash, dan pemulihan failover transaksi perbankan untuk menguji latensi throughput di bawah beban 10.000 TPS.',
    tech: ['PostgreSQL', 'Docker', 'Redis', 'Node.js', 'Go'],
    status: 'Sedang Berjalan (Progres 80%)',
    repo: 'github.com/wahyu/db-sharding-lab',
  },
  {
    id: 'proj-4',
    title: 'Kernel Scheduler & Virtual Memory Paging Simulator',
    course: 'Sistem Operasi (STI2543130)',
    type: 'Mini Riset Lab',
    description:
      'Simulasi algoritma penjadwalan proses Round-Robin vs Multilevel Feedback Queue serta analisis page fault LRU di lingkungan kernel Linux.',
    tech: ['C', 'Python', 'Docker', 'Linux'],
    status: 'Selesai (Skor: 94/100)',
    repo: 'github.com/wahyu/os-kernel-sim',
  },
];

interface CertificatesPageProps {
  searchParams?: Promise<{
    code?: string;
  }>;
}

export default async function CertificatesPage({ searchParams }: CertificatesPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  if (resolvedParams.code) {
    redirect(`/verify/certificate/${encodeURIComponent(resolvedParams.code)}`);
  }

  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'LECTURER') {
    redirect('/lecturer');
  }
  if (role === 'PROGRAM_COORDINATOR') {
    redirect('/coordinator');
  }
  if (role === 'ACADEMIC_STAFF') {
    redirect('/staff');
  }
  if (role === 'TEACHING_ASSISTANT') {
    redirect('/ta');
  }

  const isDemo = isDemoMode();
  const realCerts = await getStudentCertificatesAction().catch(() => []);
  const certificates: CertificateItem[] = realCerts.length > 0
    ? realCerts.map((c) => ({
        id: c.id,
        title: c.title,
        issuer: c.issuer,
        date: c.issueDate,
        credentialId: c.verificationCode,
        grade: c.grade,
        hours: c.creditHours,
      }))
    : isDemo
    ? DEMO_CERTIFICATES
    : [];

  return (
    <CertificatesHubView
      certificates={certificates}
      projects={isDemo ? DEMO_PROJECTS : []}
    />
  );
}
