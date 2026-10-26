'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { loginAction } from '@/modules/identity/actions';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { fontBricolage, fontInter } from './fonts';
import { IslandIllustration } from './island-illustration';
import { LoginDevMode } from './login-dev-mode';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...props} aria-hidden="true">
      <path
        fill="#4A473F"
        d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.21-.92 2.24-1.95 2.93v2.44h3.16c1.85-1.7 2.92-4.21 2.92-7.25 0-.7-.06-1.37-.23-2.1z"
      />
      <path
        fill="#4A473F"
        d="M12.18 21c2.65 0 4.87-.88 6.5-2.39l-3.16-2.45c-.88.59-2 .94-3.34.94-2.57 0-4.74-1.74-5.52-4.08H3.37v2.52C5 18.73 8.33 21 12.18 21z"
      />
      <path
        fill="#4A473F"
        d="M6.66 13.02c-.2-.59-.31-1.22-.31-1.87s.11-1.28.31-1.87V6.76H3.37C2.7 8.1 2.32 9.61 2.32 11.15s.38 3.05 1.05 4.39l3.29-2.52z"
      />
      <path
        fill="#4A473F"
        d="M12.18 5.48c1.44 0 2.74.5 3.76 1.48l2.82-2.82C17.04 2.5 14.82 1.5 12.18 1.5 8.33 1.5 5 3.77 3.37 6.96l3.29 2.52c.78-2.34 2.95-4 5.52-4z"
      />
    </svg>
  );
}

function LoginFormContent() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState(searchParams.get('error') || '');
  const [errorKey, setErrorKey] = useState(0);

  const handlePasswordKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

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

  const handleGoogleLogin = () => {
    setErrorMessage('Layanan Google kampus memerlukan konfigurasi domain resmi.');
  };

  return (
    <div
      className={`min-h-[100dvh] w-full flex flex-col md:flex-row ${fontBricolage.variable} ${fontInter.variable} font-[family-name:var(--font-inter-login),sans-serif] overflow-x-hidden bg-[#F6F2EA]`}
    >
      {/* ======================================================== */}
      {/* 1. PANEL MEREK (RESPONSIF MOBILE HEADER & DESKTOP PANEL) */}
      {/* ======================================================== */}
      <aside className="w-full md:w-[48%] lg:w-[50%] xl:w-[55%] bg-[#1E4638] text-[#F6F2EA] flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 shrink-0 md:min-h-[100dvh]">
        {/* Identitas Merek Atas */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 sm:gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B44A2F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E4638] rounded-lg p-1 min-h-[44px]"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-[10px] bg-[#FFFFFF] p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
              <Image
                src="/logo-ruangkampus.png"
                alt="Logo RuangKampus"
                width={40}
                height={40}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <span className="font-[family-name:var(--font-bricolage-login),sans-serif] font-bold text-lg sm:text-xl text-[#F6F2EA] tracking-tight">
              RuangKampus
            </span>
          </Link>

          {/* Badge Prodi di Layar Ponsel (< 768px) */}
          <div className="md:hidden">
            <span className="inline-flex items-center text-[11px] font-semibold text-[#D9E3DC] bg-[#FFFFFF]/10 border border-[#D9E3DC]/20 px-2.5 py-1 rounded-full">
              Teknik Informatika UIR
            </span>
          </div>
        </div>

        {/* Konten Utama Merek Kiri */}
        <div className="my-3 sm:my-4 md:my-auto space-y-2 sm:space-y-3 md:space-y-5 max-w-xl">
          <h1 className="font-[family-name:var(--font-bricolage-login),sans-serif] font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[46px] leading-[1.18] text-[#F6F2EA]">
            Kelas, tugas, dan ujian di satu tempat.
          </h1>
          <p className="text-xs sm:text-sm md:text-base lg:text-[17px] leading-relaxed text-[#D9E3DC]">
            Masuk untuk melihat jadwal hari ini, tenggat yang paling dekat, dan materi dari dosenmu.
          </p>

          {/* Ilustrasi Garis Peta Pulau (Tampil di Tablet/Desktop >= 1024px) */}
          <div className="hidden lg:block pt-2 xl:pt-4">
            <IslandIllustration />
          </div>
        </div>

        {/* Baris Nama Prodi & Kampus Bawah (Tablet & Desktop >= 768px) */}
        <div className="hidden md:block pt-4 border-t border-[#D9E3DC]/20">
          <p className="text-xs sm:text-sm text-[#D9E3DC] font-medium">
            Teknik Informatika • Universitas Islam Riau
          </p>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. PANEL FORMULIR KANAN (RESPONSIF MOBILE & PAD)          */}
      {/* ======================================================== */}
      <main className="w-full md:w-[52%] lg:w-[50%] xl:w-[45%] bg-[#F6F2EA] text-[#1C1B19] flex flex-col justify-center px-4 py-6 sm:px-8 sm:py-8 md:p-8 lg:p-12 xl:p-16 md:min-h-[100dvh]">
        <div className="w-full max-w-[380px] sm:max-w-[420px] mx-auto">
          {/* Judul Formulir */}
          <header className="mb-5 sm:mb-6 md:mb-8">
            <h2 className="font-[family-name:var(--font-bricolage-login),sans-serif] font-bold text-2xl sm:text-3xl md:text-[34px] leading-tight text-[#1C1B19]">
              Masuk
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-[#4A473F] mt-1.5 leading-relaxed">
              Gunakan NIM, NIDN, NIP, atau email kampus.
            </p>
          </header>

          {/* Formulir Masuk */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
            {/* Kolom Isian 1: Identitas */}
            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="identifier"
                className="block text-xs sm:text-sm font-semibold text-[#1C1917]"
              >
                NIM, NIDN, NIP, atau email
              </label>
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
                className="w-full h-[46px] sm:h-[48px] px-3.5 rounded-[10px] border border-[#8A8577] bg-[#FFFFFF] text-sm sm:text-base text-[#1C1B19] placeholder:text-[#8A8577] focus:outline-none focus:ring-2 focus:ring-[#B44A2F] focus:ring-offset-2 focus:ring-offset-[#F6F2EA] focus:border-[#B44A2F] transition-all duration-150 motion-reduce:transition-none disabled:opacity-60"
              />
            </div>

            {/* Kolom Isian 2: Kata Sandi */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs sm:text-sm font-semibold text-[#1C1917]"
                >
                  Kata sandi
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs sm:text-sm font-medium text-[#8F3A24] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B44A2F] rounded p-1 min-h-[44px] inline-flex items-center"
                >
                  Lupa kata sandi?
                </Link>
              </div>

              <div className="relative flex items-center">
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
                  className="w-full h-[46px] sm:h-[48px] pl-3.5 pr-12 rounded-[10px] border border-[#8A8577] bg-[#FFFFFF] text-sm sm:text-base text-[#1C1B19] placeholder:text-[#8A8577] focus:outline-none focus:ring-2 focus:ring-[#B44A2F] focus:ring-offset-2 focus:ring-offset-[#F6F2EA] focus:border-[#B44A2F] transition-all duration-150 motion-reduce:transition-none disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-1 w-11 h-11 flex items-center justify-center text-[#4A473F] hover:text-[#1C1B19] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B44A2F] rounded-[8px] cursor-pointer transition-colors duration-150 motion-reduce:transition-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Indikator Caps Lock */}
              {isCapsLockOn && (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-xs text-[#8F3A24] font-medium pt-1"
                >
                  Caps Lock sedang aktif.
                </p>
              )}
            </div>

            {/* Aksi Utama: Tombol Masuk */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full h-[48px] sm:h-[50px] px-4 rounded-[10px] bg-[#B44A2F] hover:bg-[#853827] text-[#FFFFFF] font-semibold text-sm sm:text-base flex items-center justify-center cursor-pointer transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B44A2F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F2EA] disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
            >
              {isPending ? 'Memeriksa…' : 'Masuk'}
            </button>

            {/* Pemisah "atau" */}
            <div className="relative flex items-center justify-center my-4 sm:my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#8A8577]/30" />
              </div>
              <span className="relative bg-[#F6F2EA] px-3 text-xs text-[#4A473F]">
                atau
              </span>
            </div>

            {/* Aksi Sekunder: Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-[48px] sm:h-[50px] px-4 rounded-[10px] border border-[#8A8577] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1B19] font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B44A2F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F2EA] shadow-2xs"
            >
              <GoogleIcon />
              <span>Masuk dengan akun Google kampus</span>
            </button>

            {/* Tautan Pendaftaran Akun */}
            <div className="text-center pt-1.5 sm:pt-2">
              <span className="text-xs sm:text-sm text-[#4A473F]">
                Belum punya akun?{' '}
              </span>
              <Link
                href="/register"
                className="text-xs sm:text-sm font-semibold text-[#8F3A24] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B44A2F] rounded p-1 min-h-[44px] inline-flex items-center"
              >
                Daftar di sini
              </Link>
            </div>
          </form>

          {/* Kotak Galat di Bawah Formulir (role="alert") */}
          {errorMessage && (
            <div
              key={errorKey}
              id="login-error-alert"
              role="alert"
              aria-live="assertive"
              className="mt-4 sm:mt-6 p-3.5 rounded-[10px] border border-[#8A8577] bg-[#FFFFFF] text-[#1C1917] text-xs sm:text-sm flex items-start gap-3 shadow-2xs"
            >
              <AlertCircle className="h-5 w-5 text-[#8F3A24] shrink-0 mt-0.5" />
              <span className="font-medium text-[#1C1917] leading-snug">
                {errorMessage}
              </span>
            </div>
          )}

          {/* Mode Pengembang (Hanya tampil di NODE_ENV === 'development') */}
          <LoginDevMode onSelectIdentifier={(id) => setIdentifier(id)} />
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 text-xs font-mono text-[#4A473F] bg-[#F6F2EA]">
          Memuat…
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
