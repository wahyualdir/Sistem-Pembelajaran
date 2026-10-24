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
  ShieldCheck,
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
    <div className="min-h-[100dvh] w-full bg-[#FAF8F5] text-[#1C1917] font-sans flex flex-col justify-between selection:bg-[#C2553A] selection:text-white antialiased">
      {/* Header Institusi Minimalis */}
      <header className="w-full bg-[#FFFFFF] border-b border-[#E8E5DE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between text-xs">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading font-bold text-base text-[#1C1917]"
          >
            <img
              src="/logo-ruangkampus.png"
              alt="Logo RuangKampus"
              className="h-7 w-7 object-contain"
            />
            <span>
              Ruang<span className="text-[#C2553A]">Kampus</span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#57534E] hover:text-[#1C1917] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      {/* Kartu Login Editorial Bersih */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#D6D3CB] bg-[#FFFFFF] shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-[#C2553A]" />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Identitas Portal */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E5DE] text-[11px] font-mono font-semibold text-[#853827]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#C2553A]" />
                <span>PORTAL AKADEMIK TERPADU</span>
              </div>
              <h1 className="text-2xl font-bold font-heading text-[#1C1917] tracking-tight">
                Masuk ke Ruang Kerja
              </h1>
              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                Gunakan NIM, NIDN, NIP, atau alamat surel institusi Anda untuk mengakses perkuliahan.
              </p>
            </div>

            {/* Alert Notifikasi Error & Sukses */}
            {errorMessage && (
              <div
                key={errorKey}
                id="login-error-alert"
                data-testid="login-error-alert"
                role="alert"
                className="shake rounded-xl border border-[#DC2626] bg-[#FEF2F2] text-[#991B1B] font-semibold p-3.5 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="h-4 w-4 text-[#DC2626] shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div
                role="status"
                className="rounded-xl border border-[#059669] bg-[#E8F5E9] text-[#065F46] p-3.5 text-xs font-semibold flex items-center gap-2.5"
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
                  className="block text-xs font-semibold text-[#1C1917]"
                >
                  NIM / NIDN / NIP / Email
                </label>
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
                  className="w-full h-10 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] focus:bg-[#FFFFFF] px-3.5 text-xs sm:text-sm font-medium text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#1C1917] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-[#1C1917]"
                  >
                    Kata Sandi
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-xs font-medium text-[#853827] hover:text-[#C2553A] hover:underline transition-colors"
                  >
                    Lupa kata sandi?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  required
                  className="w-full h-10 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] focus:bg-[#FFFFFF] px-3.5 text-xs sm:text-sm font-medium text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#1C1917] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                data-pending={isPending}
                className="w-full h-10 px-4 rounded-xl bg-[#C2553A] hover:bg-[#853827] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <LogIn className="h-4 w-4" />
                <span>{isPending ? 'Memverifikasi Kredensial...' : 'Masuk ke Portal'}</span>
              </button>

              <div className="pt-1 text-center text-xs text-[#57534E]">
                <span>Belum memiliki akun terdaftar? </span>
                <Link
                  href="/register"
                  className="font-semibold underline text-[#C2553A] hover:text-[#853827] transition-colors"
                >
                  Daftar Akun Baru
                </Link>
              </div>
            </form>

            {/* Accordion Akun Demo Cepat */}
            {process.env.NODE_ENV === 'development' && (
              <details className="pt-4 border-t border-[#E8E5DE] group">
                <summary className="cursor-pointer text-xs font-semibold text-[#57534E] hover:text-[#1C1917] select-none flex items-center justify-between">
                  <span>Akun Simulasi Peran (Mode Pengembang)</span>
                  <span className="text-[11px] font-mono text-[#7A756D]">Pilih Cepat ▾</span>
                </summary>
                <div className="mt-3 p-2.5 bg-[#FAF8F5] border border-[#E8E5DE] rounded-xl">
                  <p className="text-[11px] text-[#57534E] mb-2">
                    Klik salah satu identitas peran untuk mengisi formulir secara otomatis:
                  </p>
                  <ul className="demo-list grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {DEMO.map(([peran, ket, id]) => (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => handleDemoFill(id)}
                          className="w-full rounded-lg border border-[#D6D3CB] bg-[#FFFFFF] hover:border-[#1C1917] p-2 text-left transition-colors cursor-pointer"
                        >
                          <span className="block font-semibold text-xs text-[#1C1917] leading-tight truncate">
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
        </div>
      </main>

      {/* Footer Minimalis */}
      <footer className="w-full border-t border-[#E8E5DE] bg-[#FFFFFF] py-3 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#7A756D]">
          <span>RuangKampus &copy; {new Date().getFullYear()} — Sistem Informasi &amp; Pembelajaran Akademik</span>
          <span className="font-mono text-[11px]">Teknik Informatika · Universitas Islam Riau</span>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 text-xs font-mono text-[#57534E] bg-[#FAF8F5]">
          Memuat halaman autentikasi...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
