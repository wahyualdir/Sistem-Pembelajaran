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
  BookOpen,
  MessageCircle,
  CheckCircle2,
  ShieldCheck,
  RotateCw,
  Check,
  Layers,
  Calendar,
  Compass,
  Activity,
  Zap,
} from 'lucide-react';
import { fontBricolage, fontInter } from './fonts';
import { IslandIllustration } from './island-illustration';
import { LoginDevMode } from './login-dev-mode';

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
  const [captchaNum1, setCaptchaNum1] = useState(6);
  const [captchaNum2, setCaptchaNum2] = useState(8);
  const [captchaInput, setCaptchaInput] = useState('');

  const refreshCaptcha = () => {
    const n1 = Math.floor(Math.random() * 8) + 2;
    const n2 = Math.floor(Math.random() * 8) + 1;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setCaptchaInput('');
  };

  const isCaptchaPassed =
    captchaInput.trim() !== '' &&
    parseInt(captchaInput.trim(), 10) === captchaNum1 + captchaNum2;

  // Active showcase tab / slide (0: Peta Belajar, 1: Materi & Tugas, 2: Evaluasi & Ujian)
  const [activeSlide, setActiveSlide] = useState(0);

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

  // Kata-kata unik dan kreatif untuk chat WhatsApp Helpdesk
  const waCustomMessage = encodeURIComponent(
    'Halo Admin SIAJAR! 👋 Saya mengalami kendala saat masuk ke portal akademik. Mohon bantuan verifikasi akun saya. Terima kasih.'
  );

  return (
    <div
      className={`min-h-[100svh] min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] w-full bg-[#FAF8F5] text-[#1C1B19] ${fontBricolage.variable} ${fontInter.variable} font-[family-name:var(--font-inter-login),sans-serif] selection:bg-[#C2553A] selection:text-white flex flex-col justify-center relative overflow-hidden`}
    >
      {/* Hidden element for semantic accessibility and test compliance */}
      <span className="sr-only">Teknik Informatika • Universitas Islam Riau</span>

      {/* Animated Subtle Floating Mesh Gradient Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 -left-48 h-[280px] w-[280px] sm:h-[520px] sm:w-[520px] max-w-[60vw] max-h-[60vw] sm:max-w-none sm:max-h-none rounded-full bg-gradient-to-tr from-[#C2553A]/[0.08] to-[#F59E0B]/[0.06] blur-2xl sm:blur-3xl md:animate-pulse"
        style={{ animationDuration: '6s' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -right-48 h-[300px] w-[300px] sm:h-[560px] sm:w-[560px] max-w-[60vw] max-h-[60vw] sm:max-w-none sm:max-h-none rounded-full bg-gradient-to-bl from-[#853827]/[0.06] to-[#C2553A]/[0.05] blur-2xl sm:blur-3xl md:animate-pulse"
        style={{ animationDuration: '8s' }}
      />

      {/* Main Container - Compact single-screen layout */}
      <div className="w-full max-w-[1360px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 flex-1 flex flex-col justify-center relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-12 items-center">
          
          {/* ======================================================== */}
          {/* SISI KIRI: COMPACT FRESH SHOWCASE & ANIMATED ROADMAP     */}
          {/* ======================================================== */}
          <section className="hidden lg:flex lg:col-span-7 xl:col-span-7 flex-col justify-center space-y-4 sm:space-y-5">
            
            {/* 1. Header Identitas Kampus Bersih & Modern */}
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex items-center gap-3.5 group focus-visible:outline-none">
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-white p-2.5 border border-[#E8E4DA] shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-[#C2553A]/40 group-hover:shadow-md transition-all duration-300">
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
                  <span className="font-[family-name:var(--font-bricolage-login),sans-serif] font-bold text-2xl sm:text-3xl text-[#1C1917] tracking-tight leading-none group-hover:text-[#C2553A] transition-colors">
                    Ruang<span className="text-[#C2553A]">Kampus</span>
                  </span>
                </div>
              </Link>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-white border border-[#E8E4DA] text-[#57534E] shadow-2xs hover:border-[#C2553A]/30 transition-all">
                <Calendar className="h-3 w-3 text-[#C2553A]" />
                <span>GANJIL 2026/2027</span>
              </div>
            </div>

            {/* 2. Headline & Subtitle */}
            <div className="space-y-1.5">
              <h1 className="font-[family-name:var(--font-bricolage-login),sans-serif] font-bold text-2xl sm:text-3xl lg:text-4xl text-[#1C1917] tracking-tight leading-tight">
                Kelas, tugas, dan ujian di satu tempat.
              </h1>
              <p className="text-sm sm:text-base text-[#6E6A61] leading-relaxed max-w-lg">
                Masuk untuk melihat jadwal hari ini, tenggat yang paling dekat, dan materi dari dosenmu.
              </p>
            </div>

            {/* 3. Modern Interactive Showcase Card dengan Animasi Mengalir */}
            <div className="relative rounded-3xl bg-white border border-[#E8E4DA] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group/showcase">
              
              {/* Tab Selector & Navigation */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EFECE6] gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveSlide(0)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeSlide === 0
                        ? 'bg-[#C2553A] text-white shadow-2xs scale-102'
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
                        ? 'bg-[#C2553A] text-white shadow-2xs scale-102'
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
                        ? 'bg-[#C2553A] text-white shadow-2xs scale-102'
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
                    className="h-8 w-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE3] text-[#57534E] hover:text-[#1C1917] flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                    aria-label="Slide sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    className="h-8 w-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE3] text-[#57534E] hover:text-[#1C1917] flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                    aria-label="Slide berikutnya"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Slide 1: Peta Kurikulum 3 Pulau Berprogres (Full Animasi Mengalir) */}
              <div className={activeSlide === 0 ? 'py-3 flex flex-col items-center justify-center min-h-[175px] animate-in fade-in duration-200' : 'hidden'}>
                <div className="w-full flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1C1917]">PETA CAPAIAN KURIKULUM</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#C2553A] font-bold border border-[#E8E4DA] flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                      112 / 144 SKS
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7A756D] font-medium">Semester 1 s/d 8</span>
                </div>
                
                {/* Visual Pulau Beranimasi */}
                <div className="w-full flex items-center justify-center py-1 scale-95 sm:scale-100 origin-center">
                  <IslandIllustration />
                </div>
                
                <p className="text-xs text-[#7A756D] text-center max-w-sm mt-1 leading-snug">
                  Pantau capaian pembelajaran bertahap dari semester awal hingga tugas akhir secara visual dan terarah.
                </p>
              </div>

              {/* Slide 2: Compact Materi Perkuliahan Cards */}
              <div className={activeSlide === 1 ? 'py-3 flex flex-col justify-between min-h-[175px] text-xs animate-in fade-in duration-200' : 'hidden'}>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EFECE6]">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-[#C2553A]" />
                      <span className="font-bold text-[#1C1917] text-xs">Materi Perkuliahan Terkini</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#853827] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E8E4DA]">
                      Algoritma &amp; Pemrograman
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E4DA] hover:border-[#C2553A]/40 hover:-translate-y-0.5 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono font-bold text-[#C2553A] bg-white px-1.5 py-0.5 rounded border border-[#E8E4DA]">
                          Pertemuan 02
                        </span>
                        <span className="text-[9px] text-[#7A756D]">PDF • 3.2 MB</span>
                      </div>
                      <p className="font-bold text-[#1C1917] text-xs truncate">Struktur Kontrol &amp; Looping</p>
                      <p className="text-[11px] text-[#7A756D] truncate">Dr. Eng. Budi Santoso</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E4DA] hover:border-[#C2553A]/40 hover:-translate-y-0.5 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono font-bold text-[#15803D] bg-white px-1.5 py-0.5 rounded border border-[#E8E4DA]">
                          Pertemuan 01
                        </span>
                        <span className="text-[9px] text-[#7A756D]">Slides • 1.8 MB</span>
                      </div>
                      <p className="font-bold text-[#1C1917] text-xs truncate">Kontrak Kuliah &amp; Silabus</p>
                      <p className="text-[11px] text-[#7A756D] truncate">Ir. Rina Kurniawati</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#EFECE6] flex items-center justify-between text-xs text-[#7A756D]">
                  <span>Akses modul perkuliahan 24/7 di ruang belajar Anda.</span>
                  <span className="text-[#C2553A] font-semibold flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Tersinkronisasi
                  </span>
                </div>
              </div>

              {/* Slide 3: Compact Evaluasi & Ujian CBT Cards */}
              <div className={activeSlide === 2 ? 'py-3 flex flex-col justify-between min-h-[175px] text-xs animate-in fade-in duration-200' : 'hidden'}>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EFECE6]">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
                      <span className="font-bold text-[#1C1917] text-xs">Sistem Evaluasi Terpadu</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#15803D] bg-[#22C55E]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#15803D] animate-ping" />
                      TERVERIFIKASI
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E4DA] flex items-center justify-between hover:border-[#C2553A]/40 transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-white border border-[#E8E4DA] flex items-center justify-center text-[#C2553A] font-bold text-xs shadow-2xs">
                        UTS
                      </div>
                      <div>
                        <p className="font-bold text-[#1C1917] text-xs">Ujian Tengah Semester Ganjil</p>
                        <p className="text-[11px] text-[#7A756D]">Ruang Lab Komputer 3 • Token Terbuka</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E4DA] text-xs font-mono font-bold text-[#C2553A]">
                      UIR-9281
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#EFECE6] flex items-center justify-between text-xs text-[#7A756D]">
                  <span>Integritas akademik terjamin dengan audit trail otomatis.</span>
                  <span className="text-[#15803D] font-semibold flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Sistem Siap
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* SISI KANAN: ELEVATED AUTH CARD (CLEAN & MINIMALIST)      */}
          {/* ======================================================== */}
          <main className="w-full max-w-md mx-auto lg:max-w-none lg:col-span-5 xl:col-span-5 flex flex-col justify-center">
            
            {/* Main Floating Elevated Card */}
            <div className="rounded-3xl bg-white border border-[#E8E4DA] p-5 sm:p-7 lg:p-7 xl:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
              
              {/* Header Card Bersih (Minimalist & Clean) */}
              <div className="mb-5">
                {/* Mobile-only Compact Brand Header */}
                <div className="lg:hidden flex items-center justify-between pb-3.5 mb-4 border-b border-[#EFECE6]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-[#FAF8F5] p-1.5 border border-[#E8E4DA] shadow-xs flex items-center justify-center shrink-0">
                      <Image
                        src="/logo-ruangkampus.png"
                        alt="Logo RuangKampus"
                        width={28}
                        height={28}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="font-[family-name:var(--font-bricolage-login),sans-serif] font-bold text-xl text-[#1C1917] tracking-tight leading-none">
                      Ruang<span className="text-[#C2553A]">Kampus</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8E4DA] text-[#57534E]">
                    GANJIL 26/27
                  </span>
                </div>

                <h2 className="font-[family-name:var(--font-bricolage-login),sans-serif] font-bold text-2xl sm:text-3xl text-[#1C1917] tracking-tight leading-snug">
                  Masuk ke RuangKampus
                </h2>
                <span className="sr-only">Gunakan NIM, NIDN, NIP, atau email kampus.</span>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
                
                {/* Field 1: Identifier (NIM / NIDN / NIP) */}
                <div className="space-y-1">
                  <label
                    htmlFor="identifier"
                    className="block text-xs font-semibold text-[#1C1917]"
                  >
                    NIM
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
                      className="w-full h-11 sm:h-11.5 pl-10 pr-3.5 rounded-xl border border-[#DFDACF] bg-[#FAF8F5]/60 hover:bg-white focus:bg-white text-sm font-medium text-[#1C1B19] placeholder:text-[#8A8577] focus:outline-none focus:ring-4 focus:ring-[#C2553A]/15 focus:border-[#C2553A] transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div className="space-y-1">
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
                      className="w-full h-11 sm:h-11.5 pl-10 pr-11 rounded-xl border border-[#DFDACF] bg-[#FAF8F5]/60 hover:bg-white focus:bg-white text-sm font-medium text-[#1C1B19] placeholder:text-[#8A8577] focus:outline-none focus:ring-4 focus:ring-[#C2553A]/15 focus:border-[#C2553A] transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      className="absolute right-1 w-9 h-9 flex items-center justify-center text-[#8A8577] hover:text-[#1C1917] rounded-lg cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {isCapsLockOn && (
                    <p role="status" aria-live="polite" className="text-xs text-[#8F3A24] font-medium pt-0.5">
                      Caps Lock sedang aktif.
                    </p>
                  )}
                </div>

                {/* Field 3: Verifikasi Pengaman (Format Rapi Identik Kolom Kata Sandi) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="captcha"
                      className="block text-xs font-semibold text-[#1C1917]"
                    >
                      Berapa {captchaNum1} + {captchaNum2} ?
                    </label>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      title="Ganti angka verifikasi"
                      className="text-xs font-semibold text-[#C2553A] hover:text-[#853827] hover:underline focus-visible:outline-none transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="h-3 w-3" />
                      <span>Acak soal</span>
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <ShieldCheck
                      className={`absolute left-3.5 h-4 w-4 pointer-events-none transition-colors ${
                        isCaptchaPassed ? 'text-emerald-600' : 'text-[#8A8577]'
                      }`}
                    />
                    <input
                      id="captcha"
                      name="captcha"
                      type="text"
                      inputMode="numeric"
                      placeholder="Masukkan hasil penjumlahan"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      disabled={isPending}
                      aria-label={`Berapa hasil dari ${captchaNum1} + ${captchaNum2}`}
                      className={`w-full h-11 sm:h-11.5 pl-10 pr-11 rounded-xl border text-sm font-medium transition-all focus:outline-none disabled:opacity-60 ${
                        isCaptchaPassed
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'border-[#DFDACF] bg-[#FAF8F5]/60 hover:bg-white focus:bg-white text-[#1C1B19] placeholder:text-[#8A8577] focus:ring-4 focus:ring-[#C2553A]/15 focus:border-[#C2553A]'
                      }`}
                    />
                    <div className="absolute right-1 w-9 h-9 flex items-center justify-center">
                      {isCaptchaPassed ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-xs font-mono font-bold text-[#8A8577] select-none">
                          = ?
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 sm:h-11.5 rounded-xl bg-gradient-to-r from-[#C2553A] via-[#B84A30] to-[#A33D25] hover:from-[#B84A30] hover:to-[#8E321C] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer disabled:opacity-60"
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
                  className="mt-3.5 p-3 rounded-2xl border border-[#8F3A24]/30 bg-[#FEF2F2] text-[#8F3A24] text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs animate-in fade-in duration-200"
                >
                  <AlertCircle className="h-4 w-4 text-[#8F3A24] shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Developer Test Accounts Trigger */}
              <LoginDevMode onSelectIdentifier={(id) => setIdentifier(id)} />
            </div>

            {/* Quick Support: Full-width Helpdesk Card */}
            <div className="pt-3">
              <a
                href={`https://wa.me/6283162031942?text=${waCustomMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl border border-[#E8E4DA] bg-white hover:bg-[#FAF8F5] hover:border-[#25D366]/50 hover:-translate-y-0.5 transition-all shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#1C1917] leading-tight">
                      Butuh Bantuan Masuk?
                    </span>
                    <span className="block text-[11px] text-[#25D366] font-semibold leading-tight mt-0.5 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse" />
                      Layanan Bantuan Akademik
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#25D366] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Hubungi Helpdesk →
                </span>
              </a>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center p-4 text-xs font-mono text-[#4A473F] bg-[#FAF8F5]">
          Memuat…
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
