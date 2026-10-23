'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from '@/modules/identity/actions';
import {
  CheckCircle2,
  AlertCircle,
  LogIn,
  ShieldCheck,
  KeyRound,
  User,
  Terminal,
  Cpu,
} from 'lucide-react';

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
    setPassword('');
    setErrorMessage('');
  };

  return (
    <div className="min-h-[100dvh] w-full vt-desktop-bg text-[#1C1917] font-sans relative flex flex-col justify-between selection:bg-[#C2553A] selection:text-white select-none antialiased">
      {/* 1. CRT Scanlines Overlay khas Velqora OS */}
      <div className="fixed inset-0 vt-scanlines pointer-events-none z-40" />

      {/* 2. Top Classic OS Bar */}
      <header className="sticky top-0 z-30 w-full bg-[#ECE9D8] border-b-2 border-[#FFFFFF] shadow-xs text-[#1C1917] select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-8 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-2 py-0.5 font-bold tracking-wide text-[#C2553A] hover:bg-[#E0DACB] rounded-xs transition-colors"
            >
              <span>RUANGKAMPUS_OS</span>
            </Link>
            <div className="h-3.5 w-px bg-[#B8B1A5] mx-1" />
            <span className="hidden sm:inline-flex text-[11px] text-[#57534E]">
              Academic Learning OS &amp; LMS Portal v2.4
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-[11px] text-[#57534E] hover:text-[#C2553A] hover:underline"
            >
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Main Desktop Area with Velqora Classic Window */}
      <main className="flex-1 relative z-10 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        <div className="w-full max-w-lg vt-window rounded-xs overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Classic Velqora Titlebar */}
          <div className="vt-titlebar px-3 py-1.5 flex items-center justify-between select-none">
            <div className="flex items-center gap-2 text-white font-mono text-xs font-bold tracking-tight">
              <Terminal className="w-3.5 h-3.5 opacity-90" />
              <span>LOGIN.EXE — RuangKampus Academic Learning OS</span>
            </div>
            {/* Classic OS Window Control Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Minimize window"
                className="vt-window-btn"
                tabIndex={-1}
              >
                _
              </button>
              <button
                type="button"
                aria-label="Maximize window"
                className="vt-window-btn"
                tabIndex={-1}
              >
                □
              </button>
              <Link
                href="/"
                aria-label="Close window"
                className="vt-window-btn text-center"
                tabIndex={-1}
              >
                ×
              </Link>
            </div>
          </div>

          {/* Window Body & Inset Canvas */}
          <div className="p-4 sm:p-5 space-y-4 bg-[#ECE9D8]">
            {/* Inner Inset Panel (Velqora Inset Framing) */}
            <div className="vt-window-inset bg-[#FAF8F5] p-5 sm:p-6 space-y-5 rounded-xs">
              {/* Brand Header */}
              <div className="flex flex-col items-center text-center space-y-2 select-none border-b border-[#D6D3CB] pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xs border-2 border-[#7A756D] border-r-[#FFFFFF] border-b-[#FFFFFF] bg-white p-1 shadow-xs">
                  <img
                    src="/logo-ruangkampus.png"
                    alt="Logo RuangKampus"
                    className="h-full w-full object-contain [image-rendering:-webkit-optimize-contrast]"
                  />
                </div>
                <div className="space-y-0.5">
                  <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#1C1917] tracking-tight">
                    Ruang<span className="text-[#C2553A]">Kampus</span> OS
                  </h1>
                  <p className="text-[11px] font-mono font-bold text-[#853827] uppercase tracking-wider">
                    Academic Learning &amp; Course Management System
                  </p>
                </div>
                <p className="text-xs text-[#57534E] max-w-sm pt-0.5">
                  Gunakan NIM, NIDN, NIP, atau identitas kampus Anda untuk mengakses ruang kerja.
                </p>
              </div>

              {/* Alert Notifikasi Error & Sukses */}
              {errorMessage && (
                <div
                  key={errorKey}
                  id="login-error-alert"
                  data-testid="login-error-alert"
                  role="alert"
                  className="shake border-2 border-[#6B2D20] bg-[#C2553A] text-white font-bold p-3 text-xs shadow-xs flex items-center gap-2 rounded-xs"
                >
                  <AlertCircle className="h-4 w-4 text-white shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div
                  role="status"
                  className="border-2 border-[#2E6930] bg-[#3B7A57] text-white p-3 text-xs font-bold shadow-xs flex items-center gap-2 rounded-xs"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Formulir Autentikasi */}
              <form onSubmit={handleSubmit} method="post" className="space-y-4">
                <div className="space-y-1">
                  <label
                    htmlFor="identifier"
                    className="block text-xs font-mono font-bold uppercase tracking-wide text-[#1C1917]"
                  >
                    NIM / NIDN / NIP / Email / Username
                  </label>
                  <div className="relative">
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      placeholder="Contoh: 243510001 atau 2008000307"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={isPending}
                      required
                      className="w-full h-10 rounded-xs border-2 border-[#7A756D] border-r-[#FFFFFF] border-b-[#FFFFFF] bg-white px-3 text-xs sm:text-sm font-semibold text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#C2553A] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <label
                      htmlFor="password"
                      className="block text-xs font-mono font-bold uppercase tracking-wide text-[#1C1917]"
                    >
                      Kata Sandi
                    </label>
                    <Link
                      href="/reset-password"
                      className="text-xs font-semibold text-[#853827] hover:text-[#C2553A] hover:underline transition-colors focus-visible:outline-none"
                    >
                      Lupa password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Kata sandi akun Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isPending}
                      required
                      className="w-full h-10 rounded-xs border-2 border-[#7A756D] border-r-[#FFFFFF] border-b-[#FFFFFF] bg-white px-3 text-xs sm:text-sm font-semibold text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#C2553A] transition-all"
                    />
                  </div>
                </div>

                {/* Tombol Masuk Bertema Terracotta Velqora */}
                <button
                  type="submit"
                  disabled={isPending}
                  data-pending={isPending}
                  className="w-full h-10 px-4 rounded-xs vt-btn-terracotta text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{isPending ? 'MEMVERIFIKASI KREDENSIAL...' : 'MASUK KE RUANGKAMPUS OS'}</span>
                </button>

                <div className="pt-2 text-center text-xs font-medium text-[#57534E] select-none">
                  <span>Belum memiliki akun terdaftar? </span>
                  <Link
                    href="/register"
                    className="font-bold underline text-[#C2553A] hover:text-[#853827] transition-colors"
                  >
                    Daftar Akun Baru
                  </Link>
                </div>
              </form>

              {/* Accordion Akun Demo Cepat */}
              {process.env.NODE_ENV === 'development' && (
                <details className="pt-3 border-t border-[#D6D3CB] group">
                  <summary className="cursor-pointer text-xs font-mono font-bold text-[#57534E] inline-flex items-center gap-2 select-none hover:text-[#1C1917]">
                    <span className="px-2 py-0.5 rounded-xs vt-btn-chrome text-[11px] flex items-center gap-1.5 font-mono">
                      <span>▸ Kredensial Uji Coba Cepat (Dev Mode)</span>
                    </span>
                  </summary>
                  <div className="mt-2.5 p-2 bg-[#ECE9D8] border border-[#D6D3CB] rounded-xs">
                    <p className="text-[10px] font-mono text-[#57534E] mb-2">
                      Klik salah satu akun di bawah untuk mengisi identitas secara otomatis:
                    </p>
                    <ul className="demo-list grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {DEMO.map(([peran, ket, id]) => (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => handleDemoFill(id)}
                            className="w-full rounded-xs vt-btn-chrome p-2 text-left hover:bg-[#FAF8F5] active:translate-y-0.5 transition-all focus-visible:outline-none cursor-pointer"
                          >
                            <span className="block font-bold text-xs text-[#1C1917] leading-tight truncate">
                              {peran}
                            </span>
                            <span className="text-[10px] text-[#57534E] font-mono block mt-0.5 truncate">
                              {ket}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              )}
            </div>

            {/* Window Status Bar */}
            <div className="px-2 py-1 bg-[#ECE9D8] border-t border-[#D6D3CB] flex items-center justify-between text-[11px] font-mono text-[#57534E]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#3B7A57]" />
                <span>STATUS: READY</span>
              </span>
              <span>PORT: 3000 / HTTPS</span>
              <span>SECURE PROTOCOL</span>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Classic Bottom Taskbar */}
      <footer className="vt-taskbar h-8 px-3 flex items-center justify-between text-xs font-mono text-[#1C1917] z-30">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 bg-[#FAF8F5] border border-[#7A756D] border-r-[#FFFFFF] border-b-[#FFFFFF] text-[10px] font-bold text-[#C2553A]">
            START
          </div>
          <span className="text-[11px] text-[#57534E] hidden sm:inline">
            RuangKampus OS &copy; {new Date().getFullYear()} — Academic Learning OS
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#57534E]">
          <span className="px-2 py-0.5 border border-[#7A756D] border-r-[#FFFFFF] border-b-[#FFFFFF] bg-[#FAF8F5]">
            ONLINE
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 text-xs font-mono text-[#57534E] vt-desktop-bg">
          Memuat modul autentikasi RuangKampus OS...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
