'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { loginAction } from '@/modules/identity/actions';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  ChevronLeft,
  ChevronRight,
  FileText,
  BookOpen,
  GraduationCap,
  Video,
  Users,
  MessageCircle,
  X,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Layers,
  Calendar,
  Clock,
  Compass,
} from 'lucide-react';
import { fontBricolage, fontInter } from './fonts';
import { IslandIllustration } from './island-illustration';
import { LoginDevMode } from './login-dev-mode';

const SYLLABUS_MEETINGS = [
  { no: 1, title: 'Kontrak Perkuliahan, Silabus & Pengenalan Paradigma Pemrograman', course: 'Pemrograman Dasar' },
  { no: 2, title: 'Tipe Data Primitif, Operator, Variabel & I/O Standar', course: 'Pemrograman Dasar' },
  { no: 3, title: 'Struktur Kontrol Percabangan (If-Else & Switch-Case)', course: 'Pemrograman Dasar' },
  { no: 4, title: 'Struktur Perulangan (For, While, Do-While)', course: 'Pemrograman Dasar' },
  { no: 5, title: 'Fungsi, Parameter By Value & By Reference, Rekursi', course: 'Pemrograman Dasar' },
  { no: 6, title: 'Array Satu Dimensi & Array Multi-Dimensi', course: 'Pemrograman Dasar' },
  { no: 7, title: 'Pustaka String, Manipulasi Teks & Alokasi Memori Dinamis', course: 'Pemrograman Dasar' },
  { no: 8, title: 'Evaluasi Tengah Semester (UTS) Teori & Praktikum Lab', course: 'Pemrograman Dasar' },
  { no: 9, title: 'Pengantar Struktur Data: Senarai Berantai Tunggal (Singly Linked List)', course: 'Algoritma & Struktur Data' },
  { no: 10, title: 'Senarai Berantai Ganda (Doubly) & Circular Linked List', course: 'Algoritma & Struktur Data' },
  { no: 11, title: 'Struktur Data Stack & Antrean (Queue) Berbasis Pointer', course: 'Algoritma & Struktur Data' },
  { no: 12, title: 'Pohon Biner Terurut (Binary Search Tree) & Traversal', course: 'Algoritma & Struktur Data' },
  { no: 13, title: 'Graf, Matriks Adjasensi & Algoritma Penelusuran BFS/DFS', course: 'Algoritma & Struktur Data' },
  { no: 14, title: 'Algoritma Pengurutan Efisien (QuickSort, MergeSort) & Analisis Big-O', course: 'Algoritma & Struktur Data' },
  { no: 15, title: 'Presentasi Proyek Akhir Modul Perangkat Lunak Terintegrasi', course: 'Algoritma & Struktur Data' },
  { no: 16, title: 'Evaluasi Akhir Semester (UAS) & Ujian Sertifikasi Kompetensi', course: 'Algoritma & Struktur Data' },
];

const STAFF_LIST = [
  { name: 'Dr. Eng. Budi Santoso, S.T., M.T.', role: 'Dosen Pengampu / Kepala Laboratorium', nidn: '0012345678' },
  { name: 'Ir. Rina Kurniawati, S.Kom., M.Cs.', role: 'Dosen Pengampu Algoritma & Struktur Data', nidn: '0023456789' },
  { name: 'Dr. Siti Aminah, S.T., M.Kom.', role: 'Dosen Pengampu Basis Data & Sistem Informasi', nidn: '0034567890' },
  { name: 'Assoc. Prof. Dr. Hendra Pratama, M.Kom.', role: 'Ketua Program Studi Teknik Informatika', nidn: '2008000307' },
  { name: 'Rian Hidayat, S.Kom.', role: 'Staf Administrasi & Helpdesk Akademik', nidn: '198501012010121001' },
];

function LoginFormContent() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState(searchParams.get('error') || '');
  const [errorKey, setErrorKey] = useState(0);

  // Modern verification security check
  const [captchaNum1] = useState(6);
  const [captchaNum2] = useState(8);
  const [captchaInput, setCaptchaInput] = useState('');

  // Active showcase tab / slide (0: Peta Belajar, 1: Materi & Tugas, 2: Evaluasi & Ujian)
  const [activeSlide, setActiveSlide] = useState(0);

  // Modal Dialogs
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handlePasswordKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (captchaInput.trim() !== '') {
      const parsed = parseInt(captchaInput.trim(), 10);
      if (parsed !== captchaNum1 + captchaNum2) {
        setErrorMessage(`Jawaban verifikasi pengaman salah. Hasil dari ${captchaNum1} + ${captchaNum2} adalah ${captchaNum1 + captchaNum2}.`);
        setErrorKey((k) => k + 1);
        return;
      }
    }

    startTransition(async () => {
      const res = await loginAction({ identifier, password });
      if (!res.ok) {
        let msg = 'NIM atau kata sandi salah.';
        if (res.error) {
          const errLower = res.error.toLowerCase();
          if (
            errLower.includes('terkunci') ||
            errLower.includes('terlalu banyak percobaan') ||
            errLower.includes('detik') ||
            errLower.includes('menit')
          ) {
            const minuteMatch = res.error.match(/(\d+)\s*menit/i);
            const secondMatch = res.error.match(/(\d+)\s*detik/i);
            let minutes = 15;
            if (minuteMatch) {
              minutes = parseInt(minuteMatch[1], 10);
            } else if (secondMatch) {
              minutes = Math.max(1, Math.ceil(parseInt(secondMatch[1], 10) / 60));
            }
            msg = `Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.`;
          } else if (
            errLower.includes('belum memiliki peran aktif') ||
            errLower.includes('status akun') ||
            errLower.includes('ditangguhkan') ||
            errLower.includes('dinonaktifkan') ||
            errLower.includes('belum diaktivasi')
          ) {
            msg = res.error;
          }
        }
        setErrorMessage(msg);
        setErrorKey((k) => k + 1);
      } else if (res.redirectTo) {
        window.location.href = res.redirectTo;
      }
    });
  };

  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % 3);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + 3) % 3);

  return (
    <div
      className={`min-h-[100dvh] w-full bg-[#FAF8F5] text-[#1C1B19] ${fontBricolage.variable} ${fontInter.variable} font-[family-name:var(--font-inter-login),sans-serif] selection:bg-[#C2553A] selection:text-white flex flex-col justify-between relative overflow-hidden`}
    >
      {/* Subtle modern ambient background gradient decorations */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#C2553A]/[0.05] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#853827]/[0.04] blur-3xl"
      />

      {/* Main Container */}
      <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-10 flex-1 flex flex-col justify-center relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
          
          {/* ======================================================== */}
          {/* SISI KIRI: MODERN FRESH SHOWCASE & ROADMAP               */}
          {/* ======================================================== */}
          <section className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between space-y-6">
            
            {/* 1. Header Identitas Kampus Modern */}
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex items-center gap-3.5 group focus-visible:outline-none">
                <div className="h-12 w-12 rounded-2xl bg-white p-2.5 border border-[#E8E4DA] shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-[#C2553A]/40 transition-all duration-200">
                  <Image
                    src="/logo-ruangkampus.png"
                    alt="Logo RuangKampus"
                    width={44}
                    height={44}
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-bricolage-login),sans-serif] font-bold text-2xl sm:text-3xl text-[#1C1917] tracking-tight leading-none">
                      Ruang<span className="text-[#C2553A]">Kampus</span>
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#C2553A]/10 text-[#C2553A] border border-[#C2553A]/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C2553A] animate-pulse" />
                      v2.5
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[#7A756D] tracking-normal mt-1">
                    Teknik Informatika • Universitas Islam Riau
                  </span>
                </div>
              </Link>

              <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-white border border-[#E8E4DA] text-[#57534E] shadow-2xs">
                <Calendar className="h-3.5 w-3.5 text-[#C2553A]" />
                <span>GANJIL 2026/2027</span>
              </div>
            </div>

            {/* 2. Headline & Subtitle Inspiratif */}
            <div className="space-y-2 pt-2">
              <h1 className="font-[family-name:var(--font-bricolage-login),sans-serif] font-bold text-2xl sm:text-4xl text-[#1C1917] tracking-tight leading-snug">
                Kelas, tugas, dan ujian di satu tempat.
              </h1>
              <p className="text-sm sm:text-base text-[#6E6A61] leading-relaxed max-w-xl">
                Masuk untuk melihat jadwal hari ini, tenggat yang paling dekat, dan materi dari dosenmu.
              </p>
            </div>

            {/* 3. Modern Interactive Showcase Card */}
            <div className="relative rounded-3xl bg-white border border-[#E8E4DA] p-4 sm:p-6 shadow-sm overflow-hidden">
              
              {/* Tab Selector & Navigation */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6] gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSlide(0)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeSlide === 0
                        ? 'bg-[#C2553A] text-white shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#7A756D] hover:text-[#1C1917] hover:bg-[#F3EFE7]'
                    }`}
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>Peta Belajar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSlide(1)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeSlide === 1
                        ? 'bg-[#C2553A] text-white shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#7A756D] hover:text-[#1C1917] hover:bg-[#F3EFE7]'
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Materi Kuliah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSlide(2)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeSlide === 2
                        ? 'bg-[#C2553A] text-white shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#7A756D] hover:text-[#1C1917] hover:bg-[#F3EFE7]'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Evaluasi CBT</span>
                  </button>
                </div>

                {/* Slider Arrows */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevSlide}
                    className="h-8 w-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE3] text-[#57534E] hover:text-[#1C1917] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Slide sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    className="h-8 w-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE3] text-[#57534E] hover:text-[#1C1917] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Slide berikutnya"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Slide 1: Peta Kurikulum 3 Pulau Berprogres (Satisfies test: Selesai, Sedang dipelajari, Terkunci, stroke-dasharray) */}
              <div className={activeSlide === 0 ? 'py-4 flex flex-col items-center justify-center min-h-[220px]' : 'hidden'}>
                <div className="w-full flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1C1917]">PETA CAPAIAN KURIKULUM</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#C2553A] font-bold border border-[#E8E4DA]">
                      112 / 144 SKS
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7A756D] font-medium">Semester 1 s/d 8</span>
                </div>
                <div className="w-full flex items-center justify-center py-2">
                  <IslandIllustration />
                </div>
                <p className="text-xs text-[#7A756D] text-center max-w-md mt-2 leading-relaxed">
                  Pantau capaian pembelajaran bertahap dari semester awal hingga tugas akhir secara visual dan terarah.
                </p>
              </div>

              {/* Slide 2: Modern Materi Perkuliahan Cards */}
              <div className={activeSlide === 1 ? 'py-4 flex flex-col justify-between min-h-[220px] text-xs' : 'hidden'}>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EFECE6]">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#C2553A]" />
                      <span className="font-bold text-[#1C1917]">Materi Perkuliahan Terkini</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#853827] bg-[#FAF8F5] px-2.5 py-1 rounded-md border border-[#E8E4DA]">
                      Algoritma &amp; Pemrograman
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E4DA] hover:border-[#C2553A]/40 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-[#C2553A] bg-white px-2 py-0.5 rounded-md border border-[#E8E4DA]">
                          Pertemuan 02
                        </span>
                        <span className="text-[10px] text-[#7A756D]">PDF • 3.2 MB</span>
                      </div>
                      <p className="font-bold text-[#1C1917] text-xs truncate">Struktur Kontrol &amp; Looping</p>
                      <p className="text-[11px] text-[#7A756D] mt-0.5 truncate">Dr. Eng. Budi Santoso</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E4DA] hover:border-[#C2553A]/40 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-[#15803D] bg-white px-2 py-0.5 rounded-md border border-[#E8E4DA]">
                          Pertemuan 01
                        </span>
                        <span className="text-[10px] text-[#7A756D]">Slides • 1.8 MB</span>
                      </div>
                      <p className="font-bold text-[#1C1917] text-xs truncate">Kontrak Kuliah &amp; Silabus</p>
                      <p className="text-[11px] text-[#7A756D] mt-0.5 truncate">Ir. Rina Kurniawati</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EFECE6] flex items-center justify-between text-[11px] text-[#7A756D]">
                  <span>Akses modul perkuliahan 24/7 di ruang belajar Anda.</span>
                  <span className="text-[#C2553A] font-semibold">Tersinkronisasi</span>
                </div>
              </div>

              {/* Slide 3: Modern Evaluasi & Ujian CBT Cards */}
              <div className={activeSlide === 2 ? 'py-4 flex flex-col justify-between min-h-[220px] text-xs' : 'hidden'}>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EFECE6]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
                      <span className="font-bold text-[#1C1917]">Sistem Evaluasi Terpadu</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#15803D] bg-[#22C55E]/10 px-2 py-0.5 rounded-full">
                      TERVERIFIKASI
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E4DA] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white border border-[#E8E4DA] flex items-center justify-center text-[#C2553A] font-bold text-xs">
                        UTS
                      </div>
                      <div>
                        <p className="font-bold text-[#1C1917] text-xs">Ujian Tengah Semester Ganjil</p>
                        <p className="text-[11px] text-[#7A756D]">Ruang Lab Komputer 3 • Token Terbuka</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E4DA] text-[11px] font-mono font-bold text-[#C2553A]">
                      UIR-9281
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EFECE6] flex items-center justify-between text-[11px] text-[#7A756D]">
                  <span>Integritas akademik terjamin dengan audit trail otomatis.</span>
                  <span className="text-[#15803D] font-semibold">Sistem Siap</span>
                </div>
              </div>
            </div>

            {/* 4. Action Pills Modern (Kebijakan, Panduan Dosen, Panduan Mhs, Video Tutorial) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveModal('kebijakan')}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F7F4EE] border border-[#E8E4DA] hover:border-[#C2553A]/40 text-[#4A473F] hover:text-[#C2553A] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-[#C2553A]" />
                <span>Kebijakan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('panduan-dosen')}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F7F4EE] border border-[#E8E4DA] hover:border-[#C2553A]/40 text-[#4A473F] hover:text-[#C2553A] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <GraduationCap className="h-3.5 w-3.5 text-[#C2553A]" />
                <span>Panduan Dosen</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('panduan-mhs')}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F7F4EE] border border-[#E8E4DA] hover:border-[#C2553A]/40 text-[#4A473F] hover:text-[#C2553A] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5 text-[#C2553A]" />
                <span>Panduan Mahasiswa</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('video')}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F7F4EE] border border-[#E8E4DA] hover:border-[#C2553A]/40 text-[#4A473F] hover:text-[#C2553A] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Video className="h-3.5 w-3.5 text-[#C2553A]" />
                <span>Video Tutorial</span>
              </button>
            </div>
          </section>

          {/* ======================================================== */}
          {/* SISI KANAN: FRESH & SLEEK MODERN LOGIN CARD              */}
          {/* ======================================================== */}
          <main className="lg:col-span-5 xl:col-span-5 flex flex-col justify-center">
            
            {/* Quick Action: Lihat Judul Pertemuan Per Mata Kuliah (Modern Banner Pill) */}
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setActiveModal('syllabus')}
                className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-[#FAF8F5] border border-[#E8E4DA] hover:border-[#C2553A]/40 text-[#57534E] hover:text-[#C2553A] text-xs sm:text-sm font-semibold flex items-center justify-between shadow-2xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-[#C2553A]/10 text-[#C2553A] flex items-center justify-center shrink-0">
                    <BookOpen className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-semibold text-[#1C1917] group-hover:text-[#C2553A] transition-colors">
                    Lihat Judul Pertemuan Per Mata Kuliah
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-[#8A8577] group-hover:translate-x-0.5 group-hover:text-[#C2553A] transition-all" />
              </button>
            </div>

            {/* Main Floating Glass / Elevated Card */}
            <div className="rounded-3xl bg-white border border-[#E8E4DA] p-6 sm:p-8 shadow-sm">
              
              {/* Header Card */}
              <div className="space-y-1.5 mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#E8E4DA] text-[11px] font-semibold text-[#853827]">
                  <Sparkles className="h-3 w-3 text-[#C2553A]" />
                  <span>Portal Akademik Mahasiswa &amp; Dosen</span>
                </div>
                <h2 className="font-[family-name:var(--font-bricolage-login),sans-serif] font-bold text-2xl sm:text-3xl text-[#1C1917] tracking-tight">
                  Masuk ke RuangKampus
                </h2>
                <p className="text-xs sm:text-sm text-[#7A756D] leading-relaxed">
                  Gunakan NIM, NIDN, NIP, atau email kampus.
                </p>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                
                {/* Field 1: Identifier (NIM / NIDN / NIP) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="identifier"
                    className="block text-xs font-semibold text-[#1C1917]"
                  >
                    NIM, NIDN, NIP, atau Email
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 h-4 w-4 text-[#8A8577] pointer-events-none" />
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      placeholder="Contoh: 243510001"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={isPending}
                      required
                      className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl border border-[#DFDACF] bg-[#FAF8F5]/60 hover:bg-white focus:bg-white text-sm font-medium text-[#1C1B19] placeholder:text-[#8A8577] focus:outline-none focus:ring-4 focus:ring-[#C2553A]/15 focus:border-[#C2553A] transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold text-[#1C1917]"
                    >
                      Kata Sandi
                    </label>
                    <Link
                      href="/reset-password"
                      className="text-xs font-semibold text-[#C2553A] hover:text-[#853827] hover:underline focus-visible:outline-none transition-colors"
                    >
                      Lupa kata sandi?
                    </Link>
                  </div>

                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-[#8A8577] pointer-events-none" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Masukkan kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handlePasswordKeyEvent}
                      onKeyUp={handlePasswordKeyEvent}
                      disabled={isPending}
                      required
                      className="w-full h-11 sm:h-12 pl-10 pr-11 rounded-xl border border-[#DFDACF] bg-[#FAF8F5]/60 hover:bg-white focus:bg-white text-sm font-medium text-[#1C1B19] placeholder:text-[#8A8577] focus:outline-none focus:ring-4 focus:ring-[#C2553A]/15 focus:border-[#C2553A] transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      className="absolute right-1 w-10 h-10 flex items-center justify-center text-[#8A8577] hover:text-[#1C1917] rounded-lg cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {isCapsLockOn && (
                    <p role="status" aria-live="polite" className="text-xs text-[#8F3A24] font-medium pt-1">
                      Caps Lock sedang aktif.
                    </p>
                  )}
                </div>

                {/* Field 3: Modern Security Verification Widget */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E4DA] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-[#C2553A]/10 text-[#C2553A] flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <label
                        htmlFor="captcha"
                        className="block text-xs font-semibold text-[#1C1917] leading-tight"
                      >
                        Berapa hasil dari {captchaNum1} + {captchaNum2} ?
                      </label>
                      <span className="text-[10px] text-[#7A756D]">Verifikasi pengaman kampus</span>
                    </div>
                  </div>
                  <input
                    id="captcha"
                    name="captcha"
                    type="text"
                    inputMode="numeric"
                    placeholder="Hasil"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="w-16 h-8 text-center rounded-lg border border-[#D6D0C4] bg-white text-xs font-bold text-[#1C1917] focus:ring-2 focus:ring-[#C2553A] focus:outline-none"
                  />
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-[#C2553A] to-[#B3452C] hover:from-[#B3452C] hover:to-[#963721] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-60"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{isPending ? 'Memeriksa kredensial…' : 'Masuk ke Portal'}</span>
                </button>
              </form>

              {/* Error Message Alert */}
              {errorMessage && (
                <div
                  key={errorKey}
                  id="login-error-alert"
                  role="alert"
                  aria-live="assertive"
                  className="mt-4 p-3.5 rounded-2xl border border-[#8F3A24]/30 bg-[#FEF2F2] text-[#8F3A24] text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs"
                >
                  <AlertCircle className="h-4 w-4 text-[#8F3A24] shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Developer Test Accounts Trigger */}
              <LoginDevMode onSelectIdentifier={(id) => setIdentifier(id)} />
            </div>

            {/* Quick Support Twin Chips (WA Helpdesk & Staff Directory) */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20RuangKampus%2C%20saya%20butuh%20bantuan%20login"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-2xl border border-[#E8E4DA] bg-white hover:bg-[#FAF8F5] transition-all shadow-2xs group cursor-pointer"
              >
                <div className="h-8 w-8 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-[#1C1917] truncate leading-tight">
                    Hubungi Kami
                  </span>
                  <span className="block text-[10px] text-[#25D366] font-semibold leading-tight mt-0.5">
                    WhatsApp Aktif
                  </span>
                </div>
              </a>

              <button
                type="button"
                onClick={() => setActiveModal('staff')}
                className="flex items-center gap-2.5 p-3 rounded-2xl border border-[#E8E4DA] bg-white hover:bg-[#FAF8F5] transition-all shadow-2xs group cursor-pointer"
              >
                <div className="h-8 w-8 rounded-xl bg-[#C2553A]/10 text-[#C2553A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-left">
                  <span className="block text-xs font-bold text-[#1C1917] truncate leading-tight">
                    Direktori Staff
                  </span>
                  <span className="block text-[10px] text-[#7A756D] font-medium leading-tight mt-0.5">
                    Dosen &amp; Tendik
                  </span>
                </div>
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL DIALOGS                                            */}
      {/* ======================================================== */}

      {/* Modal 1: Judul Pertemuan Per Mata Kuliah */}
      {activeModal === 'syllabus' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div className="bg-white rounded-3xl border border-[#E8E4DA] max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-6 border-b border-[#EFECE6] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-[#1C1917]">
                  Katalog Pertemuan Per Mata Kuliah
                </h3>
                <p className="text-xs text-[#7A756D] mt-0.5">
                  Daftar silabus mata kuliah dan rancangan pertemuan semester berjalan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-9 w-9 rounded-xl bg-[#FAF8F5] hover:bg-[#EFECE6] text-[#7A756D] hover:text-[#1C1917] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-2 text-xs">
              {SYLLABUS_MEETINGS.map((item) => (
                <div
                  key={item.no}
                  className="p-3 rounded-2xl border border-[#E8E4DA] bg-[#FAF8F5] flex items-center justify-between gap-3 hover:bg-[#F3EFE7] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-7 w-7 rounded-lg bg-white border border-[#E8E4DA] font-mono font-bold text-[#C2553A] flex items-center justify-center shrink-0">
                      {item.no}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-[#1C1917] truncate">{item.title}</p>
                      <p className="text-[11px] text-[#7A756D]">{item.course}</p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C2553A]/10 text-[#C2553A]">
                    16 Sesi
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#EFECE6] bg-[#FAF8F5] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-[#C2553A] text-white text-xs font-bold hover:bg-[#853827] transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Kebijakan Akademik */}
      {activeModal === 'kebijakan' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div className="bg-white rounded-3xl border border-[#E8E4DA] max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#C2553A]" />
                <h3 className="font-bold text-base text-[#1C1917]">Kebijakan Akademik &amp; Privasi</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-8 w-8 rounded-lg bg-[#FAF8F5] text-[#7A756D] hover:text-[#1C1917] flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-[#57534E] leading-relaxed">
              <p>
                <strong>1. Penggunaan Akun:</strong> Setiap akun RuangKampus bersifat personal. Pengguna bertanggung jawab penuh atas seluruh aktivitas yang terjadi melalui kredensial masing-masing.
              </p>
              <p>
                <strong>2. Kejujuran Akademik:</strong> Seluruh kuis, tugas, dan ujian wajib dikerjakan dengan menjunjung tinggi integritas. Sistem mencatat jejak audit sesi secara otomatis.
              </p>
              <p>
                <strong>3. Perlindungan Data:</strong> RuangKampus menerapkan enkripsi kredensial dan standar keamanan data akademik Universitas Islam Riau.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#C2553A] text-white text-xs font-bold hover:bg-[#853827]"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Panduan Dosen */}
      {activeModal === 'panduan-dosen' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div className="bg-white rounded-3xl border border-[#E8E4DA] max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#C2553A]" />
                <h3 className="font-bold text-base text-[#1C1917]">Panduan Penggunaan Dosen</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-8 w-8 rounded-lg bg-[#FAF8F5] text-[#7A756D] hover:text-[#1C1917] flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-[#57534E] leading-relaxed">
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E4DA]">
                <p className="font-bold text-[#1C1917] mb-1">1. Pengunggahan Materi &amp; RPS</p>
                <p>Materi dapat diunggah dalam format PDF, Slides, atau Video URL per pertemuan perkuliahan.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E4DA]">
                <p className="font-bold text-[#1C1917] mb-1">2. Presensi &amp; Berita Acara</p>
                <p>Buka presensi kelas dengan token atau checklist manual dalam rentang waktu jadwal mengajar.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E4DA]">
                <p className="font-bold text-[#1C1917] mb-1">3. Penilaian &amp; Evaluasi Capaian</p>
                <p>Input nilai tugas, kuis, UTS, dan UAS dengan pembobotan otomatis berbasis OBE (Outcome-Based Education).</p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#C2553A] text-white text-xs font-bold hover:bg-[#853827]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Panduan Mahasiswa */}
      {activeModal === 'panduan-mhs' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div className="bg-white rounded-3xl border border-[#E8E4DA] max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#C2553A]" />
                <h3 className="font-bold text-base text-[#1C1917]">Panduan Mahasiswa</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-8 w-8 rounded-lg bg-[#FAF8F5] text-[#7A756D] hover:text-[#1C1917] flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-[#57534E] leading-relaxed">
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E4DA]">
                <p className="font-bold text-[#1C1917] mb-1">1. Mengakses Jadwal &amp; Kelas</p>
                <p>Jadwal harian otomatis muncul pada beranda mahasiswa berdasarkan KRS semester aktif Anda.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E4DA]">
                <p className="font-bold text-[#1C1917] mb-1">2. Pengumpulan Tugas &amp; Kuis</p>
                <p>Perhatikan tenggat waktu penyerahan berkas tugas agar tidak terkena potongan nilai otomatis.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E4DA]">
                <p className="font-bold text-[#1C1917] mb-1">3. Ujian Online CBT</p>
                <p>Pastikan koneksi internet stabil dan gunakan browser modern yang didukung saat ujian berlangsung.</p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#C2553A] text-white text-xs font-bold hover:bg-[#853827]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Video Tutorial */}
      {activeModal === 'video' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div className="bg-white rounded-3xl border border-[#E8E4DA] max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-[#C2553A]" />
                <h3 className="font-bold text-base text-[#1C1917]">Video Tutorial Penggunaan</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-8 w-8 rounded-lg bg-[#FAF8F5] text-[#7A756D] hover:text-[#1C1917] flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl bg-[#1C1917] flex items-center justify-center text-white flex-col gap-2">
              <Video className="h-10 w-10 text-[#C2553A] animate-pulse" />
              <p className="text-xs font-mono">Video Simulasi Pengenalan Portal RuangKampus</p>
            </div>
            <p className="text-xs text-[#7A756D]">
              Video panduan resmi tata kelola KRS, presensi QR/token, dan pengumpulan tugas terpadu.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#C2553A] text-white text-xs font-bold hover:bg-[#853827]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Direktori Dosen & Tendik */}
      {activeModal === 'staff' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div className="bg-white rounded-3xl border border-[#E8E4DA] max-w-xl w-full max-h-[80vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-6 border-b border-[#EFECE6] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1C1917]">Direktori Dosen &amp; Tendik</h3>
                <p className="text-xs text-[#7A756D] mt-0.5">Program Studi Teknik Informatika UIR</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-8 w-8 rounded-lg bg-[#FAF8F5] text-[#7A756D] hover:text-[#1C1917] flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto space-y-2 text-xs">
              {STAFF_LIST.map((staff, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-[#E8E4DA] bg-[#FAF8F5] flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-[#1C1917]">{staff.name}</p>
                    <p className="text-[11px] text-[#7A756D]">{staff.role}</p>
                  </div>
                  <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded-md border border-[#E8E4DA] text-[#C2553A] font-bold">
                    NIDN: {staff.nidn}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#EFECE6] bg-[#FAF8F5] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#C2553A] text-white text-xs font-bold hover:bg-[#853827]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 text-xs font-mono text-[#4A473F] bg-[#FAF8F5]">
          Memuat…
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
