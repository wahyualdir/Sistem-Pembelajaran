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
  Eye,
  EyeOff,
  User,
  Lock,
  BookOpen,
  GraduationCap,
  Award,
  Sparkles,
  ChevronDown,
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

const ACADEMIC_PILLARS = [
  {
    icon: GraduationCap,
    title: 'Kurikulum Berbasis OBE',
    desc: 'Pemetaan capaian pembelajaran CPMK & CPL lulusan terukur secara terintegrasi.',
  },
  {
    icon: Award,
    title: 'Presensi Cerdas & Ujian CBT',
    desc: 'Verifikasi kehadiran berbasis radius dan evaluasi ujian terpadu anti-curang.',
  },
  {
    icon: BookOpen,
    title: 'Ruang Belajar Interaktif',
    desc: 'Modul materi digital, pengumpulan tugas terstruktur, dan diskusi kelas kolaboratif.',
  },
];

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

  const handleDemoFill = (id: string) => {
    setIdentifier(id);
    setPassword('demo12345');
    setErrorMessage('');
  };

  return (
    <div className="min-h-[100dvh] w-full text-[#1C1917] font-sans flex flex-col justify-between selection:bg-[#C2553A] selection:text-white antialiased relative">
      <TechBackground />

      {/* 1. Header Institusi Minimalis */}
      <header className="w-full bg-[#FFFFFF]/80 backdrop-blur-md border-b border-[#E8E5DE] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 font-heading font-black text-lg text-[#1C1917]"
          >
            <div className="h-9 w-9 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] p-1 flex items-center justify-center shadow-2xs overflow-hidden">
              <img
                src="/logo-ruangkampus.png"
                alt="Logo RuangKampus"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight">
                Ruang<span className="text-[#C2553A]">Kampus</span>
              </span>
              <span className="text-[10px] font-sans font-bold text-[#7A756D] tracking-wide">
                Teknik Informatika · UIR
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-bold text-[#57534E] hover:text-[#1C1917] transition-all shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#C2553A]" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      {/* 2. Main Content Split-Screen Modern Academic */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 z-10">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* SISI KIRI: SHOWCASE VISUAL & PILAR AKADEMIK */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF2F0] border border-[#FDDDD7] text-xs font-mono font-bold text-[#853827]">
                <Sparkles className="h-3.5 w-3.5 text-[#C2553A]" />
                <span>Sistem Pembelajaran & Akademik Terpadu</span>
              </div>

              <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-[#1C1917] tracking-tight leading-tight">
                Satu Akses untuk Seluruh Ruang Perkuliahan Anda
              </h1>

              <p className="text-sm sm:text-base text-[#57534E] font-medium leading-relaxed max-w-xl">
                Platform perkuliahan digital modern bagi Mahasiswa, Dosen Pengampu, Asisten Dosen/Lab, dan Administrator Program Studi Teknik Informatika Universitas Islam Riau.
              </p>
            </div>

            {/* 3 Pilar Fitur Utama LMS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              {ACADEMIC_PILLARS.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-[#D6D3CB] bg-[#FFFFFF]/90 backdrop-blur-xs shadow-2xs space-y-2 hover:border-[#7A756D] transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-[#FEF2F0] border border-[#FDDDD7] text-[#C2553A] flex items-center justify-center">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h2 className="font-heading font-bold text-xs sm:text-sm text-[#1C1917] leading-snug">
                      {p.title}
                    </h2>
                    <p className="text-[11px] text-[#57534E] leading-relaxed line-clamp-3">
                      {p.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Banner Kutipan Visi Kampus */}
            <div className="p-4 rounded-2xl border border-[#E8E5DE] bg-[#FAF8F5]/80 flex items-center gap-3.5 text-xs text-[#57534E]">
              <div className="h-2 w-2 rounded-full bg-[#C2553A] shrink-0" />
              <p className="font-medium italic">
                Terintegrasi dengan SIAKAD UIR, pemantauan presensi GPS, penilaian draf rubrik tugas, serta kuis CBT berkemampuan audit real-time.
              </p>
            </div>
          </div>

          {/* SISI KANAN: FORMULIR AUTENTIKASI ELEGAN */}
          <div className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto">
            <div className="rounded-2xl border border-[#D6D3CB] bg-[#FFFFFF] shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Garis Aksen Terracotta */}
              <div className="h-1.5 w-full bg-[#C2553A]" />

              <div className="p-6 sm:p-8 space-y-6">
                {/* Header Kartu */}
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8E5DE] text-[10px] font-mono font-bold text-[#853827]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#C2553A]" />
                    <span>PORTAL AKADEMIK TERPADU</span>
                  </div>
                  <h2 className="text-2xl font-heading font-black text-[#1C1917] tracking-tight">
                    Masuk ke Ruang Kerja
                  </h2>
                  <p className="text-xs text-[#57534E] font-medium leading-relaxed">
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
                        placeholder="Contoh: 243510001 atau 2008000307"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        disabled={isPending}
                        required
                        className="w-full h-11 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] focus:bg-[#FFFFFF] pl-10 pr-3.5 text-xs sm:text-sm font-medium text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C2553A] focus:ring-2 focus:ring-[#C2553A]/15 transition-all"
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
                        className="w-full h-11 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] focus:bg-[#FFFFFF] pl-10 pr-10 text-xs sm:text-sm font-medium text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#C2553A] focus:ring-2 focus:ring-[#C2553A]/15 transition-all"
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
                    className="w-full h-11 px-4 rounded-xl bg-[#C2553A] hover:bg-[#853827] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>{isPending ? 'Memverifikasi Kredensial...' : 'Masuk ke Portal'}</span>
                  </button>

                  <div className="pt-1 text-center text-xs text-[#57534E]">
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
                  <details className="pt-4 border-t border-[#E8E5DE] group">
                    <summary className="cursor-pointer text-xs font-bold text-[#57534E] hover:text-[#1C1917] select-none flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-[#C2553A]" />
                        <span>Akun Simulasi Peran (Mode Pengembang)</span>
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-[#7A756D] group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-3 p-3 bg-[#FAF8F5] border border-[#E8E5DE] rounded-xl space-y-2">
                      <p className="text-[11px] text-[#57534E] font-medium leading-relaxed">
                        Klik salah satu identitas peran untuk mengisi formulir secara otomatis:
                      </p>
                      <ul className="demo-list grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {DEMO.map(([peran, ket, id]) => (
                          <li key={id}>
                            <button
                              type="button"
                              onClick={() => handleDemoFill(id)}
                              className="w-full rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] hover:border-[#1C1917] hover:bg-[#FAF8F5] p-2 text-left transition-all cursor-pointer shadow-2xs"
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
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer Minimalis */}
      <footer className="w-full border-t border-[#E8E5DE] bg-[#FFFFFF]/80 backdrop-blur-md py-3.5 px-4 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#7A756D]">
          <span>RuangKampus &copy; {new Date().getFullYear()} — Sistem Informasi &amp; Pembelajaran Akademik</span>
          <span className="font-mono text-[11px] font-semibold">Teknik Informatika · Universitas Islam Riau</span>
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
