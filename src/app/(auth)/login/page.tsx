'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  X,
  Layers,
} from 'lucide-react';
import { TechBackground } from '@/components/ui/tech-background';

const DEMO = [
  ['Mahasiswa UIR', 'NIM 243510001', '243510001'],
  ['Kaprodi UIR', 'NIDN 2008000307', '2008000307'],
  ['Asisten Dosen UIR', 'NIM 233510001', '233510001'],
  ['Super Admin UIR', 'NIP 20120009', '20120009'],
  ['Super Admin', 'superadmin', 'superadmin'],
  ['Mahasiswa', 'NIM 2024001', '2024001'],
  ['Dosen', 'NIDN 0012345678', '0012345678'],
  ['Mahasiswa + Asisten', 'NIM 2024002', '2024002'],
  ['Kaprodi', 'NIDN 0087654321', '0087654321'],
  ['Staf Akademik', 'NIP 198501012010121001', '198501012010121001'],
  ['System Admin', 'sysadmin', 'sysadmin'],
] as const;

function LoginFormContent() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
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

  const handleDemoFill = (id: string) => {
    setIdentifier(id);
    setPassword('demo12345');
    setErrorMessage('');
    setShowDemoModal(false);
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
            <img
              src="/logo-ruangkampus.png"
              alt="Logo RuangKampus"
              className="h-full w-full object-contain"
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

            <div className="pt-2 text-center text-xs text-[#57534E]">
              <span>Belum memiliki akun terdaftar? </span>
              <Link
                href="/register"
                className="font-bold underline text-[#C2553A] hover:text-[#853827] transition-colors"
              >
                Daftar Akun Baru
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* 3. Footer Sederhana & Bersih */}
      <footer className="w-full max-w-5xl text-center py-2 text-xs text-[#7A756D] z-10">
        <span>RuangKampus &copy; {new Date().getFullYear()} — Teknik Informatika Universitas Islam Riau</span>
      </footer>

      {/* 4. Floating Pill Akun Simulasi Peran (Hanya Muncul di Mode Dev) */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <button
            type="button"
            onClick={() => setShowDemoModal(true)}
            className="fixed bottom-4 right-4 z-40 bg-[#1C1917] hover:bg-[#2D2823] text-[#FAF8F5] text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg border border-[#3F3F46] flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
            title="Pilih akun simulasi peran"
          >
            <Layers className="h-3.5 w-3.5 text-[#C2553A]" />
            <span>Akun Demo</span>
          </button>

          {/* Modal / Pop-over Akun Demo */}
          {showDemoModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/50 backdrop-blur-xs">
              <div className="bg-[#FFFFFF] border border-[#D6D3CB] rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8E5DE] pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#C2553A]" />
                    <h2 className="font-heading font-bold text-sm text-[#1C1917]">
                      Pilih Akun Simulasi Peran
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDemoModal(false)}
                    className="p-1 rounded-lg text-[#7A756D] hover:text-[#1C1917] transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-[#57534E] leading-relaxed">
                  Klik peran di bawah untuk mengisi kolom login secara otomatis dengan kata sandi pengembang:
                </p>

                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {DEMO.map(([peran, ket, id]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleDemoFill(id)}
                      className="p-2.5 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] hover:bg-[#FFFFFF] hover:border-[#C2553A] text-left transition-all cursor-pointer shadow-2xs group"
                    >
                      <span className="block font-bold text-xs text-[#1C1917] group-hover:text-[#C2553A] truncate">
                        {peran}
                      </span>
                      <span className="block text-[10px] text-[#57534E] font-mono mt-0.5 truncate">
                        {ket}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E8E5DE] text-right">
                  <button
                    type="button"
                    onClick={() => setShowDemoModal(false)}
                    className="px-4 py-1.5 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] hover:bg-[#E8E5DE] text-xs font-semibold text-[#1C1917] cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
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
