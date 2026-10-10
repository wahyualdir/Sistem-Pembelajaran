import React from 'react';
import { CommunityHubView } from '@/modules/academic/community-hub-view';

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

const THREADS = [
  {
    id: 'th-1',
    title: 'Tips Menyusun Rancangan Skripsi TI: Deep Learning vs Cloud Security',
    author: 'Andi Mahasiswa',
    authorRole: 'Mahasiswa Angkatan 2023',
    excerpt:
      'Diskusi seputar penentuan topik skripsi yang aplikatif dan relevan dengan industri software terkini di Riau, serta tips memilih dataset yang valid.',
    replies: 14,
    views: 180,
    category: 'Akademik',
    isPinned: true,
    lastActive: '10 menit lalu',
  },
  {
    id: 'th-2',
    title: 'Diskusi Praktikum Web Lanjut: Cara Mengatasi CORS di Supabase Local',
    author: 'Citra Asisten',
    authorRole: 'Asisten Laboratorium TI',
    excerpt:
      'Solusi konfigurasi header Access-Control-Allow-Origin saat menghubungkan Next.js App Router dengan docker Supabase lokal di Windows/WSL2.',
    replies: 8,
    views: 95,
    category: 'Praktikum',
    isPinned: false,
    lastActive: '25 menit lalu',
  },
  {
    id: 'th-3',
    title: 'Rekomendasi Server Linux Murah untuk Deployment Microservices Mahasiswa',
    author: 'Budi Santoso',
    authorRole: 'Mahasiswa Senior',
    excerpt:
      'Komparasi performa CPU, bandwidth, dan biaya bulanan antara VPS lokal Indonesia vs provider cloud global untuk hosting portfolio UAS.',
    replies: 22,
    views: 310,
    category: 'Teknologi',
    isPinned: false,
    lastActive: '2 jam lalu',
  },
  {
    id: 'th-4',
    title: 'Persiapan Sertifikasi AWS Certified Solutions Architect untuk Mahasiswa',
    author: 'Dimas Aditya',
    authorRole: 'Alumni TI UIR',
    excerpt:
      'Sharing jalur sertifikasi cloud computing, cara klaim voucher diskon institusi UIR, dan bank soal simulasi ujian resmi AWS Associate.',
    replies: 11,
    views: 240,
    category: 'Karir & Sertifikasi',
    isPinned: false,
    lastActive: '1 hari lalu',
  },
];

const GROUPS = [
  {
    id: 'g-1',
    name: 'Study Group: Algoritma & LeetCode Practice',
    topic: 'Pemrograman',
    description:
      'Latihan rutin bedah algoritma struktur data, dynamic programming, dan problem solving intensif persiapan kompetisi Gemastik dan magang.',
    members: 18,
    schedule: 'Setiap Rabu, 19:30 - 21:00 WIB',
    tags: ['LeetCode', 'C++', 'Python', 'Kompetitif'],
  },
  {
    id: 'g-2',
    name: 'Komunitas Riset AI & NLP UIR',
    topic: 'Machine Learning',
    description:
      'Eksplorasi paper riset AI terkini, implementasi fine-tuning model bahasa (LLM), computer vision, dan kolaborasi publikasi ilmiah.',
    members: 24,
    schedule: 'Setiap Sabtu, 09:00 - 11:30 WIB',
    tags: ['PyTorch', 'Transformers', 'HuggingFace', 'Ollama'],
  },
  {
    id: 'g-3',
    name: 'Grup Kolaborasi Proyek Web Enterprise',
    topic: 'Next.js & Supabase',
    description:
      'Pengerjaan rintisan proyek software skala kampus, arsitektur microservices, integrasi payment gateway, dan deployment cloud modern.',
    members: 12,
    schedule: 'Fleksibel Online & Diskusi Async',
    tags: ['Next.js 15', 'TypeScript', 'Tailwind', 'PostgreSQL'],
  },
  {
    id: 'g-4',
    name: 'Cyber Defense & CTF Practice Team',
    topic: 'Keamanan Siber',
    description:
      'Simulasi penetration testing, reverse engineering, audit keamanan jaringan server, dan persiapan turnamen Capture The Flag nasional.',
    members: 15,
    schedule: 'Setiap Jumat, 16:30 - 18:30 WIB',
    tags: ['Kali Linux', 'Web Exploit', 'Cryptography', 'Forensics'],
  },
];

const MENTORS = [
  {
    id: 'm-1',
    name: 'Dr. Ardiansyah, S.T., M.Kom.',
    initials: 'AR',
    role: 'Dosen Pembimbing Akademik',
    focus:
      'Rancang Bangun Sistem Informasi, Arsitektur Perangkat Lunak, dan Konsultasi Tugas Akhir Skripsi.',
    slots: 'Tersedia 3 Kuota',
    schedule: 'Senin & Kamis, 14:00 - 16:00 WIB',
    topics: ['Skripsi TI', 'System Architecture', 'Review Proposal'],
  },
  {
    id: 'm-2',
    name: 'Citra Asisten',
    initials: 'CA',
    role: 'Mentor Praktikum & Live Coding',
    focus:
      'Persiapan Tugas Praktikum Mingguan, Pemecahan Masalah Algoritma, dan Debugging Lingkungan Lokal.',
    slots: 'Tersedia 5 Kuota',
    schedule: 'Selasa & Jumat, 16:00 - 18:00 WIB',
    topics: ['Struktur Data', 'Python & C++', 'Supabase / PostgreSQL'],
  },
  {
    id: 'm-3',
    name: 'Fajar Ramadhan, M.Kom.',
    initials: 'FR',
    role: 'Dosen Pembimbing Basis Data',
    focus:
      'Relational Database Modeling, Skalabilitas Sistem, Replikasi Data, dan Optimasi Kueri SQL Kompleks.',
    slots: 'Tersedia 2 Kuota',
    schedule: 'Rabu & Sabtu, 10:00 - 12:00 WIB',
    topics: ['Database Design', 'Query Tuning', 'Security Audit'],
  },
  {
    id: 'm-4',
    name: 'Budi Santoso',
    initials: 'BS',
    role: 'Mentor Peer-to-Peer Senior',
    focus:
      'Bimbingan Rekan Sebaya untuk Fullstack Next.js, API Integration, Git Version Control, dan Persiapan Magang.',
    slots: 'Tersedia 4 Kuota',
    schedule: 'Kamis & Sabtu, 13:00 - 15:00 WIB',
    topics: ['Next.js App Router', 'REST & GraphQL', 'Git Workflow'],
  },
];

const EVENTS = [
  {
    id: 'ev-1',
    title:
      'Webinar Nasional: Menghadapi Era Generative AI dalam Rekayasa Perangkat Lunak',
    date: '15 Oktober 2026',
    time: '09:00 - 12:00 WIB',
    speaker: 'Prof. Dewi Lestari, Ph.D.',
    role: 'Guru Besar AI & Machine Learning',
    location: 'Zoom Meeting & Live YouTube',
    type: 'Webinar Nasional',
    seats: '350/500 Kursi',
    status: 'Pendaftaran Dibuka',
  },
  {
    id: 'ev-2',
    title:
      'Workshop Hands-on: Building Enterprise APIs with Next.js & Supabase',
    date: '24 Oktober 2026',
    time: '13:30 - 16:30 WIB',
    speaker: 'Dr. Ardiansyah & Tim Asisten',
    role: 'Kepala Laboratorium Rekayasa Web',
    location: 'Lab Komputer 2 (Hybrid)',
    type: 'Workshop Praktis',
    seats: '42/50 Kursi',
    status: 'Sisa 8 Kursi',
  },
  {
    id: 'ev-3',
    title: 'Hackathon Kampus 2026: Inovasi Sistem Cerdas untuk SDGs',
    date: '05 - 07 November 2026',
    time: '08:00 WIB - Selesai',
    speaker: 'Dewan Juri Akademik & Industri',
    role: 'Kolaborasi Fakultas & Industri Mitra',
    location: 'Auditorium Gedung Rektorat UIR',
    type: 'Kompetisi Tim',
    seats: '24 Tim Terdaftar',
    status: 'Pendaftaran Ditutup H-5',
  },
  {
    id: 'ev-4',
    title:
      'Alumni Talk & Career Coaching: Menembus Karir Global Software Engineer',
    date: '18 November 2026',
    time: '19:00 - 21:00 WIB',
    speaker: 'Rian Pratama, S.Kom.',
    role: 'Staff Engineer at Tech Unicorn',
    location: 'Google Meet',
    type: 'Career Talk',
    seats: '120/150 Kursi',
    status: 'Pendaftaran Dibuka',
  },
];

export default function CommunityPage() {
  return (
    <CommunityHubView
      announcements={ANNOUNCEMENTS}
      threads={THREADS}
      groups={GROUPS}
      mentors={MENTORS}
      events={EVENTS}
    />
  );
}
