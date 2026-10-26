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
  Info,
  FileText,
  BookOpen,
  GraduationCap,
  Video,
  Users,
  MessageCircle,
  Calculator,
  X,
  CheckCircle2,
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

  // Math Verification Challenge (matching reference screenshot: "Berapa hasil dari 6 + 8 ?")
  const [captchaNum1] = useState(6);
  const [captchaNum2] = useState(8);
  const [captchaInput, setCaptchaInput] = useState('');

  // Carousel slide state (0: Materi, 1: Peta Kurikulum, 2: Tugas & Ujian)
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

    // Optional verification check if input entered
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
      className={`min-h-[100dvh] w-full bg-[#FAF8F5] text-[#1C1B19] ${fontBricolage.variable} ${fontInter.variable} font-[family-name:var(--font-inter-login),sans-serif] selection:bg-[#C2553A] selection:text-white flex flex-col justify-between`}
    >
      <div className="w-full max-w-[1480px] mx-auto p-3 sm:p-5 lg:p-8 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-stretch">
          
          {/* ======================================================== */}
          {/* SISI KIRI: SHOWCASE FITUR & PREVIEW PORTAL                */}
          {/* ======================================================== */}
          <section className="lg:col-span-7 xl:col-span-7 rounded-3xl bg-[#F5F2EA] border border-[#E8E5DE] p-4 sm:p-6 lg:p-8 flex flex-col justify-between shadow-xs">
            {/* 1. Header Identitas Kampus */}
            <div className="flex items-center justify-between gap-3 pb-4">
              <Link href="/" className="flex items-center gap-3 group focus-visible:outline-none">
                <div className="h-11 w-11 rounded-2xl bg-white p-2 border border-[#E8E5DE] shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Image
                    src="/logo-ruangkampus.png"
                    alt="Logo RuangKampus"
                    width={40}
                    height={40}
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-[family-name:var(--font-bricolage-login),sans-serif] font-bold text-xl sm:text-2xl text-[#1C1917] tracking-tight leading-none">
                    Ruang<span className="text-[#C2553A]">Kampus</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#7A756D] tracking-wide mt-1">
                    Teknik Informatika • Universitas Islam Riau
                  </span>
                </div>
              </Link>

              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FFFFFF] border border-[#D6D3CB] text-[#C2553A]">
                TA 2026/2027 GANJIL
              </span>
            </div>

            {/* 2. Interactive Mockup Showcase with < and > Navigation */}
            <div className="relative my-auto py-3">
              {/* Previous Button */}
              <button
                type="button"
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-3 z-20 h-10 w-10 rounded-full bg-white border border-[#D6D3CB] text-[#1C1917] hover:text-[#C2553A] hover:border-[#C2553A] shadow-md flex items-center justify-center transition-all cursor-pointer"
                title="Slide sebelumnya"
                aria-label="Slide sebelumnya"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-3 z-20 h-10 w-10 rounded-full bg-white border border-[#D6D3CB] text-[#1C1917] hover:text-[#C2553A] hover:border-[#C2553A] shadow-md flex items-center justify-center transition-all cursor-pointer"
                title="Slide berikutnya"
                aria-label="Slide berikutnya"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Mockup Card Container */}
              <div className="w-full max-w-[560px] mx-auto rounded-2xl bg-white border border-[#D6D3CB] shadow-md overflow-hidden transition-all duration-300">
                {/* Slide 1: Mockup Layar Materi (Persis layout di screenshot CERDAS) */}
                <div className={activeSlide === 0 ? 'flex flex-col' : 'hidden'}>
                  {/* Topbar Mockup */}
                  <div className="bg-[#C2553A] text-white px-3.5 py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">RK</div>
                      <span className="font-bold tracking-tight">RuangKampus</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold">
                        MAHASISWA (243510001)
                      </span>
                      <div className="h-4 w-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">⏻</div>
                    </div>
                  </div>

                  {/* Content Mockup: Sidebar + Content */}
                  <div className="flex min-h-[220px]">
                    {/* Sidebar Mini */}
                    <div className="w-28 sm:w-32 bg-[#FAF8F5] border-r border-[#E8E5DE] p-2 space-y-1 text-[10px] text-[#7A756D]">
                      <div className="px-2 py-1 hover:bg-[#ECE7DF] rounded cursor-default">Dashboard</div>
                      <div className="px-2 py-1 hover:bg-[#ECE7DF] rounded cursor-default">Mata Kuliah</div>
                      <div className="px-2 py-1 bg-white text-[#C2553A] font-bold rounded shadow-2xs border border-[#E8E5DE] flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>Materi</span>
                      </div>
                      <div className="px-2 py-1 hover:bg-[#ECE7DF] rounded cursor-default">Tugas</div>
                      <div className="px-2 py-1 hover:bg-[#ECE7DF] rounded cursor-default">Kuis CBT</div>
                      <div className="px-2 py-1 hover:bg-[#ECE7DF] rounded cursor-default">Histori Studi</div>
                    </div>

                    {/* Main Table Mini */}
                    <div className="flex-1 p-3 flex flex-col justify-between text-[11px]">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-[#E8E5DE] mb-2">
                          <span className="font-bold text-[#1C1917] text-xs">MATERI KELAS</span>
                          <span className="text-[10px] font-semibold bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#D6D3CB] text-[#57534E]">
                            LITERASI DATA &amp; TEKNOLOGI ▼
                          </span>
                        </div>

                        <div className="w-full overflow-hidden rounded border border-[#E8E5DE] text-[10px]">
                          <div className="grid grid-cols-12 bg-[#FAF8F5] p-1 font-bold text-[#7A756D] border-b border-[#E8E5DE]">
                            <span className="col-span-1 text-center">NO</span>
                            <span className="col-span-2 text-center">AKSI</span>
                            <span className="col-span-5">JUDUL</span>
                            <span className="col-span-4">PERTEMUAN</span>
                          </div>
                          <div className="grid grid-cols-12 p-1.5 border-b border-[#E8E5DE] items-center hover:bg-[#FAF8F5]/50">
                            <span className="col-span-1 text-center font-mono">1</span>
                            <span className="col-span-2 text-center">
                              <span className="bg-[#C2553A] text-white px-1.5 py-0.5 rounded text-[9px] font-bold">Detail</span>
                            </span>
                            <span className="col-span-5 font-semibold text-[#1C1917] truncate">Sistem Komputer</span>
                            <span className="col-span-4 text-[#57534E] truncate">2 - Dr. Eng. Budi Santoso</span>
                          </div>
                          <div className="grid grid-cols-12 p-1.5 items-center hover:bg-[#FAF8F5]/50">
                            <span className="col-span-1 text-center font-mono">2</span>
                            <span className="col-span-2 text-center">
                              <span className="bg-[#C2553A] text-white px-1.5 py-0.5 rounded text-[9px] font-bold">Detail</span>
                            </span>
                            <span className="col-span-5 font-semibold text-[#1C1917] truncate">RPS &amp; Kontrak Kuliah</span>
                            <span className="col-span-4 text-[#57534E] truncate">1 - Ir. Rina Kurniawati</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E8E5DE] text-[10px] text-[#7A756D]">
                        <span>Showing 1 to 2 of 2 entries</span>
                        <span className="inline-flex items-center gap-1 text-[#25D366] font-semibold">
                          <MessageCircle className="h-3 w-3" />
                          <span>Hubungi Kami</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide 2: Peta Kurikulum Tiga Pulau (Memenuhi test: Selesai, Sedang dipelajari, Terkunci, stroke-dasharray) */}
                <div className={activeSlide === 1 ? 'p-4 sm:p-5 flex flex-col items-center justify-center bg-white min-h-[260px]' : 'hidden'}>
                  <div className="w-full flex items-center justify-between pb-2 border-b border-[#E8E5DE] mb-2">
                    <span className="text-xs font-bold text-[#1C1917]">PETA CAPAIAN KURIKULUM</span>
                    <span className="text-[10px] font-mono text-[#C2553A] font-bold">SEMESTER 1 - 8</span>
                  </div>
                  <div className="w-full flex items-center justify-center py-2">
                    <IslandIllustration />
                  </div>
                  <p className="text-[11px] text-[#57534E] text-center max-w-sm mt-1">
                    Visualisasi progres pemenuhan SKS dan capaian pembelajaran mata kuliah secara terpadu.
                  </p>
                </div>

                {/* Slide 3: Ujian & Evaluasi CBT Terverifikasi */}
                <div className={activeSlide === 2 ? 'p-4 sm:p-5 flex flex-col justify-between bg-white min-h-[260px] text-xs' : 'hidden'}>
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[#E8E5DE] mb-3">
                      <span className="font-bold text-[#1C1917]">SISTEM EVALUASI &amp; UJIAN CBT</span>
                      <span className="bg-[#22C55E]/10 text-[#15803D] px-2 py-0.5 rounded-full text-[10px] font-bold">AKTIF</span>
                    </div>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[#C2553A]" />
                          <span className="font-semibold text-[#1C1917]">UTS Algoritma &amp; Pemrograman</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#C2553A]">Token: UIR-9281</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[#C2553A]" />
                          <span className="font-semibold text-[#1C1917]">Presensi Sesi Praktikum Lab</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#15803D]">Terverifikasi</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#E8E5DE] text-[10px] text-[#7A756D] flex justify-between">
                    <span>Integritas Akademik &amp; Audit Trail</span>
                    <span className="font-semibold text-[#C2553A]">Status: Normal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Deskripsi Fitur di Bawah Mockup (Persis di screenshot CERDAS) */}
            <div className="pt-4 border-t border-[#E8E5DE] space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#C2553A]">
                  <BookOpen className="h-5 w-5 shrink-0" />
                  <h2 className="font-heading font-bold text-base sm:text-lg text-[#1C1917]">
                    Materi Perkuliahan
                  </h2>
                </div>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  Pada menu Materi, Anda dapat mengakses materi perkuliahan yang telah diunggah oleh dosen pengampu
                  serta melihat deskripsi materi pada setiap judul perkuliahan.
                </p>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  Kelas, tugas, dan ujian di satu tempat. Masuk untuk melihat jadwal hari ini, tenggat yang paling dekat, dan materi dari dosenmu.
                </p>
              </div>

              {/* 4 Tombol Pill Aksi: Kebijakan, Panduan Dosen, Panduan Mahasiswa, Video Tutorial */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveModal('kebijakan')}
                  className="px-3 py-2 rounded-xl bg-[#C2553A] hover:bg-[#853827] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span>Kebijakan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('panduan-dosen')}
                  className="px-3 py-2 rounded-xl bg-[#C2553A] hover:bg-[#853827] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                  <span>Panduan Dosen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('panduan-mhs')}
                  className="px-3 py-2 rounded-xl bg-[#C2553A] hover:bg-[#853827] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  <span>Panduan Mahasiswa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('video')}
                  className="px-3 py-2 rounded-xl bg-[#C2553A] hover:bg-[#853827] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Video className="h-3.5 w-3.5 shrink-0" />
                  <span>Video Tutorial</span>
                </button>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* SISI KANAN: FORMULIR MASUK DENGAN GAYA KARTU ELEGAN      */}
          {/* ======================================================== */}
          <main className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between space-y-4">
            <div>
              {/* Header Sisi Kanan (Persis format "Selamat Datang di CERDAS") */}
              <div className="text-center space-y-1 pb-2">
                <h1 className="font-[family-name:var(--font-bricolage-login),sans-serif] font-bold text-2xl sm:text-3xl text-[#1C1917] tracking-tight">
                  Selamat Datang di RuangKampus
                </h1>
                <p className="text-xs text-[#7A756D] font-medium">
                  Sistem Pembelajaran &amp; Evaluasi Akademik Mahasiswa
                </p>
                <p className="text-[11px] font-mono font-semibold text-[#853827]">
                  Teknik Informatika • Universitas Islam Riau
                </p>
              </div>

              {/* Banner Pill: "Lihat Judul Pertemuan Per Mata Kuliah" */}
              <button
                type="button"
                onClick={() => setActiveModal('syllabus')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C2553A] hover:bg-[#853827] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer mt-2 mb-4"
              >
                <Info className="h-4 w-4 shrink-0" />
                <span>Lihat Judul Pertemuan Per Mata Kuliah</span>
              </button>

              {/* Formulir Masuk Card Putih */}
              <div className="rounded-2xl bg-white border border-[#E8E5DE] p-5 sm:p-7 shadow-sm">
                <p className="text-xs text-[#7A756D] mb-4">
                  Gunakan NIM, NIDN, NIP, atau email kampus.
                </p>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* Field 1: Username / NIM */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="identifier"
                      className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1C1917]"
                    >
                      <User className="h-4 w-4 text-[#C2553A]" />
                      <span>Username</span>
                    </label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 h-4 w-4 text-[#8A8577]" />
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
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#D6D3CB] bg-white text-sm text-[#1C1B19] placeholder:text-[#8A8577] focus:outline-none focus:ring-2 focus:ring-[#C2553A] focus:border-[#C2553A] transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Field 2: Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1C1917]"
                      >
                        <Lock className="h-4 w-4 text-[#C2553A]" />
                        <span>Password</span>
                      </label>
                      <Link
                        href="/reset-password"
                        className="text-xs font-medium text-[#8F3A24] hover:underline focus-visible:outline-none min-h-[44px] inline-flex items-center"
                      >
                        Lupa kata sandi?
                      </Link>
                    </div>

                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 h-4 w-4 text-[#8A8577]" />
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
                        className="w-full h-11 pl-10 pr-12 rounded-xl border border-[#D6D3CB] bg-white text-sm text-[#1C1B19] placeholder:text-[#8A8577] focus:outline-none focus:ring-2 focus:ring-[#C2553A] focus:border-[#C2553A] transition-all disabled:opacity-60"
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

                  {/* Field 3: Verifikasi Keamanan Angka (Persis di screenshot: "Berapa hasil dari 6 + 8 ?") */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="captcha"
                      className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1C1917]"
                    >
                      <Calculator className="h-4 w-4 text-[#C2553A]" />
                      <span>Berapa hasil dari {captchaNum1} + {captchaNum2} ?</span>
                    </label>
                    <input
                      id="captcha"
                      name="captcha"
                      type="text"
                      inputMode="numeric"
                      placeholder="Masukkan jawaban perhitungan"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#D6D3CB] bg-white text-sm text-[#1C1B19] placeholder:text-[#8A8577] focus:outline-none focus:ring-2 focus:ring-[#C2553A] focus:border-[#C2553A] transition-all"
                    />
                  </div>

                  {/* Tombol Utama: LOGIN */}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-11 rounded-xl bg-[#C2553A] hover:bg-[#853827] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>{isPending ? 'Memeriksa…' : 'LOGIN'}</span>
                  </button>
                </form>

                {/* Kotak Galat */}
                {errorMessage && (
                  <div
                    key={errorKey}
                    id="login-error-alert"
                    role="alert"
                    aria-live="assertive"
                    className="mt-4 p-3.5 rounded-xl border border-[#8F3A24]/30 bg-[#FEF2F2] text-[#8F3A24] text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs"
                  >
                    <AlertCircle className="h-4 w-4 text-[#8F3A24] shrink-0 mt-0.5" />
                    <span className="font-medium leading-snug">{errorMessage}</span>
                  </div>
                )}

                {/* Mode Pengembang */}
                <LoginDevMode onSelectIdentifier={(id) => setIdentifier(id)} />
              </div>
            </div>

            {/* 4. Dua Kartu Bawah: "Hubungi Kami (WA)" & "Lihat Staff Kami" (Persis di screenshot) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <a
                href="https://wa.me/6281234567890?text=Halo%20Admin%20RuangKampus%2C%20saya%20butuh%20bantuan%20login"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl border border-[#D6D3CB] bg-white hover:bg-[#FAF8F5] transition-all shadow-2xs group cursor-pointer"
              >
                <div className="h-9 w-9 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0 text-left">
                  <span className="block text-xs font-bold text-[#1C1917] truncate leading-tight">
                    Hubungi Kami
                  </span>
                  <span className="block text-[11px] text-[#7A756D] font-medium leading-tight mt-0.5">
                    (WA)
                  </span>
                </div>
              </a>

              <button
                type="button"
                onClick={() => setActiveModal('staff')}
                className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl border border-[#D6D3CB] bg-white hover:bg-[#FAF8F5] transition-all shadow-2xs group cursor-pointer"
              >
                <div className="h-9 w-9 rounded-xl bg-[#C2553A]/10 text-[#C2553A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 text-left">
                  <span className="block text-xs font-bold text-[#1C1917] truncate leading-tight">
                    Lihat Staff
                  </span>
                  <span className="block text-[11px] text-[#7A756D] font-medium leading-tight mt-0.5">
                    Kami
                  </span>
                </div>
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL DIALOGS UNTUK TOMBOL-TOMBOL INTERAKTIF             */}
      {/* ======================================================== */}

      {/* Modal 1: Judul Pertemuan Per Mata Kuliah */}
      {activeModal === 'syllabus' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#D6D3CB] shadow-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DE]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#C2553A]/10 text-[#C2553A] flex items-center justify-center">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#1C1917]">
                    Katalog Pertemuan Per Mata Kuliah
                  </h3>
                  <p className="text-xs text-[#7A756D]">
                    Rencana Pembelajaran Semester (RPS) Program Studi Teknik Informatika
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-8 w-8 rounded-lg hover:bg-[#FAF8F5] flex items-center justify-center text-[#7A756D] hover:text-[#1C1917]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2.5 pr-1">
              {SYLLABUS_MEETINGS.map((m) => (
                <div key={m.no} className="p-3 rounded-xl border border-[#E8E5DE] bg-[#FAF8F5] flex items-start gap-3">
                  <span className="h-6 w-6 rounded-md bg-[#C2553A] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {m.no}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1C1917]">{m.title}</p>
                    <p className="text-[11px] text-[#7A756D] mt-0.5">{m.course}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E8E5DE] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#1C1917] text-white text-xs font-semibold hover:bg-[#C2553A] transition-colors"
              >
                Tutup Katalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Kebijakan Akademik */}
      {activeModal === 'kebijakan' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#D6D3CB] shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DE]">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#C2553A]" />
                <h3 className="font-heading font-bold text-base text-[#1C1917]">Kebijakan Akademik &amp; Etika</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-[#7A756D] hover:text-[#1C1917]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="py-4 space-y-2.5 text-xs text-[#57534E] leading-relaxed">
              <p>
                <strong>1. Integritas Pengerjaan Tugas:</strong> Seluruh karya pemrograman, laporan modul, dan jawaban kuis wajib merupakan hasil mandiri mahasiswa.
              </p>
              <p>
                <strong>2. Presensi Terverifikasi:</strong> Kehadiran praktikum dan perkuliahan minimal 75% dari total 16 pertemuan sebagai prasyarat kelayakan mengikuti ujian akhir.
              </p>
              <p>
                <strong>3. Jam Tenang Komunikasi:</strong> Menghormati jam istirahat sivitas akademika pukul 21.00 – 06.00 WIB untuk pesan non-darurat.
              </p>
            </div>
            <div className="pt-3 border-t border-[#E8E5DE] flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#C2553A] text-white text-xs font-semibold"
              >
                Saya Memahami
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Panduan Dosen & Mahasiswa */}
      {(activeModal === 'panduan-dosen' || activeModal === 'panduan-mhs') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#D6D3CB] shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DE]">
              <div className="flex items-center gap-2">
                {activeModal === 'panduan-dosen' ? (
                  <GraduationCap className="h-5 w-5 text-[#C2553A]" />
                ) : (
                  <BookOpen className="h-5 w-5 text-[#C2553A]" />
                )}
                <h3 className="font-heading font-bold text-base text-[#1C1917]">
                  {activeModal === 'panduan-dosen' ? 'Buku Panduan Dosen' : 'Buku Panduan Mahasiswa'}
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-[#7A756D] hover:text-[#1C1917]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="py-4 space-y-2.5 text-xs text-[#57534E] leading-relaxed">
              <p>
                Dokumen petunjuk teknis mencakup tata cara masuk akun, pengelolaan rombongan belajar, pengunggahan bahan kuliah (PDF, modul kode), serta penilaian berbasis CPMK OBE.
              </p>
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E5DE] space-y-1">
                <span className="font-bold text-[#1C1917] block">Pusat Unduhan Resmi:</span>
                <span className="text-[11px] text-[#7A756D] block">Format PDF buku saku panduan sistem v2.4 (Terakhir diperbarui Oktober 2026).</span>
              </div>
            </div>
            <div className="pt-3 border-t border-[#E8E5DE] flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#1C1917] text-white text-xs font-semibold hover:bg-[#C2553A]"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Video Tutorial */}
      {activeModal === 'video' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#D6D3CB] shadow-2xl p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-[#C2553A]/10 text-[#C2553A] flex items-center justify-center mx-auto">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#1C1917]">Video Tutorial RuangKampus</h3>
              <p className="text-xs text-[#7A756D] mt-1">
                Panduan singkat 3 menit cara mengakses kelas, presensi QR, dan pengumpulan tugas praktikum.
              </p>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#C2553A] hover:bg-[#853827] text-white text-xs font-semibold"
            >
              Kembali ke Halaman Masuk
            </button>
          </div>
        </div>
      )}

      {/* Modal 5: Lihat Staff Kami */}
      {activeModal === 'staff' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#D6D3CB] shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DE]">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#C2553A]" />
                <h3 className="font-heading font-bold text-base text-[#1C1917]">Direktori Dosen &amp; Tendik</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-[#7A756D] hover:text-[#1C1917]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="py-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
              {STAFF_LIST.map((s) => (
                <div key={s.nidn} className="p-3 rounded-xl border border-[#E8E5DE] bg-[#FAF8F5]">
                  <p className="text-xs font-bold text-[#1C1917]">{s.name}</p>
                  <p className="text-[11px] text-[#C2553A] font-medium mt-0.5">{s.role}</p>
                  <p className="text-[10px] font-mono text-[#7A756D]">NIDN/NIP: {s.nidn}</p>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-[#E8E5DE] flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-[#1C1917] text-white text-xs font-semibold hover:bg-[#C2553A]"
              >
                Tutup Direktori
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
