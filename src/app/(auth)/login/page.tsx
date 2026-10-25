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
  MapPin,
  TrendingUp,
  CheckCheck,
  Calendar,
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
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-12 font-sans selection:bg-[#C2553A] selection:text-white antialiased bg-[#FAF8F5]">
      {/* CSS Khusus Mengatasi Tampilan Biru Default Autofill Browser */}
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

      {/* ======================================================== */}
      {/* 1. SISI KIRI: EDITORIAL KANVAS TERRACOTTA & PREVIEW LMS  */}
      {/* ======================================================== */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-[#853827] text-[#FAF8F5] p-8 xl:p-12 flex-col justify-between relative overflow-hidden">
        {/* Ornamen Latar Belakang Geometris Halus */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:24px_24px]"
        />
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#C2553A]/30 blur-3xl pointer-events-none"
        />

        {/* Header Kiri: Brand & Akreditasi */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FFFFFF] p-1.5 flex items-center justify-center shadow-md">
              <img
                src="/logo-ruangkampus.png"
                alt="Logo RuangKampus"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="font-heading font-black text-xl text-[#FAF8F5] tracking-tight leading-tight">
                Ruang<span className="text-[#FDDDD7]">Kampus</span>
              </div>
              <div className="text-[11px] font-sans font-semibold text-[#FDDDD7]/80 tracking-wide">
                Teknik Informatika · Universitas Islam Riau
              </div>
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6B2D20] border border-[#C2553A]/40 text-[10px] font-mono font-bold text-[#FDDDD7] tracking-wider uppercase">
            <Sparkles className="h-3 w-3 text-[#FDDDD7]" />
            <span>Kurikulum OBE Terpadu</span>
          </div>
        </div>

        {/* Konten Kiri Tengah: Judul & Mini Mockup Widget LMS */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-xl">
          <div className="space-y-3">
            <h1 className="font-heading font-black text-3xl xl:text-4xl text-[#FFFFFF] leading-tight tracking-tight">
              Transformasi Pembelajaran Digital yang Terarah &amp; Terukur.
            </h1>
            <p className="text-sm xl:text-base text-[#FDDDD7] font-medium leading-relaxed">
              Akses perkuliahan berbasis Capaian Pembelajaran Lulusan (CPL), presensi berbasis radius GPS, pengumpulan tugas terstruktur, dan ujian CBT terintegrasi.
            </p>
          </div>

          {/* MOCKUP WIDGET INTERAKTIF LMS */}
          <div className="rounded-2xl border border-[#C2553A]/40 bg-[#4A1F16]/75 backdrop-blur-md p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-[#6B2D20] pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#C2553A]/30 border border-[#FDDDD7]/20 flex items-center justify-center text-[#FDDDD7]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#6B2D20] text-[#FDDDD7]">
                      IF-401 · 3 SKS
                    </span>
                    <span className="text-[11px] text-[#FDDDD7]/70 font-medium">
                      Kelas 5A
                    </span>
                  </div>
                  <div className="font-heading font-bold text-sm text-[#FFFFFF] mt-0.5">
                    Pemrograman Web Lanjut
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#10B981] bg-[#064E3B]/80 px-2.5 py-1 rounded-full border border-[#10B981]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Sesi Berlangsung
              </span>
            </div>

            {/* Metrik Capaian CPMK & Presensi */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#2D2823]/60 border border-[#6B2D20]">
                <div className="flex items-center justify-between text-[11px] text-[#FDDDD7]/80">
                  <span className="flex items-center gap-1 font-medium">
                    <TrendingUp className="h-3 w-3 text-[#10B981]" />
                    Target CPMK
                  </span>
                  <span className="font-mono font-bold text-[#FFFFFF]">88%</span>
                </div>
                <div className="w-full bg-[#6B2D20] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[#10B981] h-full rounded-full w-[88%]" />
                </div>
                <span className="text-[9px] text-[#FDDDD7]/60 mt-1 block">
                  3 Indikator Terpenuhi
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#2D2823]/60 border border-[#6B2D20]">
                <div className="flex items-center justify-between text-[11px] text-[#FDDDD7]/80">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="h-3 w-3 text-[#FDDDD7]" />
                    Radius GPS
                  </span>
                  <span className="font-mono font-bold text-[#10B981]">12m</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-[#FAF8F5]">
                  <CheckCheck className="h-3 w-3 text-[#10B981]" />
                  <span>Kampus UIR (Terverifikasi)</span>
                </div>
                <span className="text-[9px] text-[#FDDDD7]/60 mt-0.5 block">
                  Presensi Sesi Ke-8
                </span>
              </div>
            </div>

            {/* Notifikasi Tugas Mendatang */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#6B2D20]/50 border border-[#C2553A]/30 text-xs text-[#FDDDD7]">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-[#FDDDD7]" />
                <span className="font-medium text-[#FAF8F5]">
                  Praktikum 05: RESTful API &amp; Server Actions
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#FDDDD7]/80">
                Tenggat: 23:59 WIB
              </span>
            </div>
          </div>

          {/* 3 Keunggulan Ringkas */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-2.5 rounded-xl bg-[#6B2D20]/40 border border-[#C2553A]/20 text-center">
              <div className="text-[10px] font-mono font-bold text-[#FDDDD7] uppercase">
                Standarisasi
              </div>
              <div className="text-xs font-bold text-[#FFFFFF] mt-0.5">
                Akreditasi Unggul
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#6B2D20]/40 border border-[#C2553A]/20 text-center">
              <div className="text-[10px] font-mono font-bold text-[#FDDDD7] uppercase">
                Keamanan
              </div>
              <div className="text-xs font-bold text-[#FFFFFF] mt-0.5">
                CBT Anti-Curang
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#6B2D20]/40 border border-[#C2553A]/20 text-center">
              <div className="text-[10px] font-mono font-bold text-[#FDDDD7] uppercase">
                Sinkronisasi
              </div>
              <div className="text-xs font-bold text-[#FFFFFF] mt-0.5">
                SIAKAD UIR
              </div>
            </div>
          </div>
        </div>

        {/* Footer Kiri: Visi Institusi */}
        <div className="relative z-10 border-t border-[#6B2D20] pt-4 flex items-center justify-between text-xs text-[#FDDDD7]/80 font-medium">
          <span>&ldquo;Membangun ekosistem belajar adaptif, transparan, dan berdaya saing global.&rdquo;</span>
          <span className="text-[11px] font-mono text-[#FDDDD7]">UIR · {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SISI KANAN: FORMULIR AUTENTIKASI MINIMALIS ELEGAN     */}
      {/* ======================================================== */}
      <div className="lg:col-span-6 xl:col-span-5 min-h-screen flex flex-col justify-between p-6 sm:p-10 xl:p-14 bg-[#FAF8F5]">
        {/* Bar Navigasi Atas Sisi Kanan */}
        <div className="flex items-center justify-between">
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#FFFFFF] border border-[#D6D3CB] p-1 flex items-center justify-center shadow-xs">
              <img
                src="/logo-ruangkampus.png"
                alt="Logo RuangKampus"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="font-heading font-black text-base text-[#1C1917]">
              Ruang<span className="text-[#C2553A]">Kampus</span>
            </span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] hover:bg-[#F5F3EE] text-xs font-bold text-[#57534E] hover:text-[#1C1917] transition-all shadow-2xs ml-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#C2553A]" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Konten Form Terpusat */}
        <div className="my-auto py-8 w-full max-w-md mx-auto space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF2F0] border border-[#FDDDD7] text-[10px] font-mono font-bold text-[#853827]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#C2553A]" />
              <span>PORTAL MASUK TERINTEGRASI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#1C1917] tracking-tight">
              Masuk ke Ruang Kerja
            </h2>
            <p className="text-xs sm:text-sm text-[#57534E] font-medium leading-relaxed">
              Gunakan NIM, NIDN, NIP, atau email resmi kampus untuk melanjutkan aktivitas perkuliahan Anda.
            </p>
          </div>

          {/* Notifikasi Error & Sukses */}
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
                  placeholder="Masukkan kata sandi akun"
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
              <span>{isPending ? 'Memverifikasi Kredensial...' : 'Masuk ke RuangKampus'}</span>
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

          {/* Accordion Akun Demo Cepat (Pengembang) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="pt-4 border-t border-[#E8E5DE] group">
              <summary className="cursor-pointer text-xs font-bold text-[#57534E] hover:text-[#1C1917] select-none flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-[#C2553A]" />
                  <span>Akun Simulasi Peran (Mode Dev)</span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#7A756D] group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-3 p-3 bg-[#FFFFFF] border border-[#E8E5DE] rounded-xl space-y-2 shadow-2xs">
                <p className="text-[11px] text-[#57534E] font-medium leading-relaxed">
                  Pilih salah satu identitas peran di bawah ini untuk mengisi formulir otomatis:
                </p>
                <ul className="demo-list grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {DEMO.map(([peran, ket, id]) => (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => handleDemoFill(id)}
                        className="w-full rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] hover:border-[#1C1917] hover:bg-[#FFFFFF] p-2 text-left transition-all cursor-pointer shadow-2xs"
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

        {/* Footer Sisi Kanan */}
        <div className="pt-4 border-t border-[#E8E5DE] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#7A756D]">
          <span>RuangKampus &copy; {new Date().getFullYear()}</span>
          <span className="font-mono text-[11px]">Teknik Informatika · UIR</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 text-xs font-mono text-[#57534E] bg-[#FAF8F5]">
          Memuat portal autentikasi...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
