'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { loginAction } from '@/modules/identity/actions';
import {
  CheckCircle2,
  AlertCircle,
  LogIn,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Lock,
  Sparkles,
} from 'lucide-react';
import { TechBackground } from '@/components/ui/tech-background';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(searchParams.get('error') || '');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorKey, setErrorKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    startTransition(async () => {
      const res = await loginAction({ identifier, password });
      if (!res.ok) {
        setErrorMessage(res.error || 'Gagal masuk ke sistem.');
        setErrorKey((k) => k + 1);
      } else if (res.redirectTo) {
        setSuccessMessage('Autentikasi berhasil. Mengalihkan ke ruang kerja...');
        window.location.href = res.redirectTo;
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center font-sans selection:bg-[#C2553A] selection:text-white antialiased bg-[#FAF8F5] relative p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* Background Grid & Ambient Glow */}
      <TechBackground />

      {/* Override Warna Biru Default Autofill Browser */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #FAF8F5 inset !important;
          -webkit-text-fill-color: #1C1917 !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #FFFFFF inset !important;
        }
      `}</style>

      {/* 1. Bar Navigasi Atas Minimalis */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 z-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
        >
          <div className="h-9 w-9 rounded-xl bg-[#FFFFFF] border border-[#D6D3CB] p-1.5 flex items-center justify-center shadow-2xs group-hover:border-[#C2553A] transition-colors">
            <Image
              src="/logo-ruangkampus.png"
              alt="Logo RuangKampus"
              width={36}
              height={36}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-black text-base text-[#1C1917] leading-none">
              Ruang<span className="text-[#C2553A]">Kampus</span>
            </span>
            <span className="text-[10px] font-semibold text-[#7A756D] tracking-wide mt-0.5">
              Teknik Informatika UIR
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF]/90 hover:bg-[#FFFFFF] text-xs font-semibold text-[#57534E] hover:text-[#1C1917] transition-all shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#C2553A]" />
          <span>Kembali ke Beranda</span>
        </Link>
      </header>

      {/* 2. Kartu Login Terpusat (Centered Minimalist Card) */}
      <main className="w-full max-w-[420px] my-auto py-6 z-10">
        <div className="relative rounded-3xl border border-[#D6D3CB] bg-[#FFFFFF] shadow-sm sm:shadow-md p-6 sm:p-8 overflow-hidden">
          {/* Garis Aksen Terracotta di Atas Kartu */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#853827] via-[#C2553A] to-[#853827]" />

          {/* Header Kartu */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF2F0] border border-[#FDDDD7] text-[10px] font-mono font-bold text-[#853827]">
              <Sparkles className="h-3 w-3 text-[#C2553A]" />
              <span>SISTEM INFORMASI AKADEMIK</span>
            </div>
            <h1 className="text-2xl font-heading font-black text-[#1C1917] tracking-tight">
              Masuk ke Akun
            </h1>
            <p className="text-xs text-[#57534E] font-medium leading-relaxed max-w-xs mx-auto">
              Silakan masukkan identitas resmi Anda untuk mengakses ruang perkuliahan.
            </p>
          </div>

          {/* Alert Error / Sukses */}
          {errorMessage && (
            <div
              key={errorKey}
              id="login-error-alert"
              data-testid="login-error-alert"
              role="alert"
              className="shake mb-4 rounded-xl border border-[#DC2626] bg-[#FEF2F2] text-[#991B1B] font-semibold p-3 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="h-4 w-4 text-[#DC2626] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div
              role="status"
              className="mb-4 rounded-xl border border-[#059669] bg-[#E8F5E9] text-[#065F46] p-3 text-xs font-semibold flex items-center gap-2.5"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#059669]" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Formulir Autentikasi */}
          <form onSubmit={handleSubmit} method="post" className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="identifier"
                className="block text-xs font-bold text-[#1C1917]"
              >
                NIM / NIDN / NIP / Email
              </label>
              <div className="relative flex items-center">
                <User className="h-4 w-4 text-[#7A756D] absolute left-3.5 pointer-events-none" />
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="Contoh: 243510001 atau nidn/nip"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isPending}
                  required
                  className="w-full h-11 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] focus:bg-[#FFFFFF] pl-10 pr-3.5 text-xs sm:text-sm font-medium text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C2553A] focus:ring-2 focus:ring-[#C2553A]/15 transition-all shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-[#1C1917]"
                >
                  Kata Sandi
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs font-semibold text-[#853827] hover:text-[#C2553A] hover:underline transition-colors"
                >
                  Lupa kata sandi?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="h-4 w-4 text-[#7A756D] absolute left-3.5 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  required
                  className="w-full h-11 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] focus:bg-[#FFFFFF] pl-10 pr-10 text-xs sm:text-sm font-medium text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C2553A] focus:ring-2 focus:ring-[#C2553A]/15 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 rounded-lg text-[#7A756D] hover:text-[#1C1917] transition-colors focus:outline-none cursor-pointer"
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              data-pending={isPending}
              className="w-full h-11 px-4 rounded-xl bg-[#C2553A] hover:bg-[#853827] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              <LogIn className="h-4 w-4" />
              <span>{isPending ? 'Memverifikasi...' : 'Masuk ke RuangKampus'}</span>
            </button>
          </form>
        </div>
      </main>

      {/* 3. Footer Sederhana & Bersih */}
      <footer className="w-full max-w-5xl text-center py-2 text-xs text-[#7A756D] z-10">
        <span>RuangKampus &copy; {new Date().getFullYear()} — Teknik Informatika Universitas Islam Riau</span>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 text-xs font-mono text-[#57534E] bg-[#FAF8F5]">
          Memuat portal login...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
