'use client';

import React, { useState, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { registerAction } from '@/modules/identity/actions';
import {
  Flame,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Users,
  Award,
  ArrowLeft,
} from 'lucide-react';

const ROLES = [
  { value: 'STUDENT', label: 'Mahasiswa', idLabel: 'NIM (Nomor Induk Mahasiswa)', placeholder: 'Contoh: 2024099' },
  { value: 'LECTURER', label: 'Dosen Pengajar', idLabel: 'NIDN (Nomor Induk Dosen Nasional)', placeholder: 'Contoh: 0099887766' },
  { value: 'TEACHING_ASSISTANT', label: 'Asisten Dosen (Asdos)', idLabel: 'NIM Mahasiswa Asisten', placeholder: 'Contoh: 2024088' },
  { value: 'PROGRAM_COORDINATOR', label: 'Ketua Program Studi (Kaprodi)', idLabel: 'NIDN Kaprodi', placeholder: 'Contoh: 0077665544' },
  { value: 'ACADEMIC_STAFF', label: 'Staf Administrasi Akademik', idLabel: 'NIP / Nomor Pegawai', placeholder: 'Contoh: 198901012015011001' },
  { value: 'SYSTEM_ADMIN', label: 'System / Technical Admin', idLabel: 'Username Akun Admin', placeholder: 'Contoh: sysadmin_baru' },
] as const;

function RegisterFormContent() {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('STUDENT');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorKey, setErrorKey] = useState(0);

  const currentRoleConfig = ROLES.find((r) => r.value === role) || ROLES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      setErrorKey((k) => k + 1);
      return;
    }

    startTransition(async () => {
      const res = await registerAction({
        name,
        role: role as any,
        identifier,
        email,
        password,
        confirmPassword,
      });

      if (!res.ok) {
        setErrorMessage(res.error || 'Gagal mendaftarkan akun.');
        setErrorKey((k) => k + 1);
      } else if (res.redirectTo) {
        setSuccessMessage('Pendaftaran berhasil! Mengalihkan ke ruang kerja Anda...');
        window.location.href = res.redirectTo;
      }
    });
  };

  return (
    <div
      style={{ fontFamily: "'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif" }}
      className="min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] w-full bg-background text-black font-sans selection:bg-ink selection:text-black flex flex-col overflow-x-hidden lg:overflow-hidden antialiased"
    >
      {/* Top Bar Navigasi Sistem Retro */}
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b-2 sm:border-b-3 border-black bg-gray-soft shrink-0 select-none shadow-retro-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="h-3.5 w-3.5 rounded-full border border-black bg-primary inline-block shadow-retro-sm" />
            <span className="h-3.5 w-3.5 rounded-full border border-black bg-gray inline-block shadow-retro-sm" />
            <span className="h-3.5 w-3.5 rounded-full border border-black bg-gray-dark inline-block shadow-retro-sm" />
          </div>

          <div className="flex items-center gap-2.5 ml-1">
            <div className="flex h-8 w-8 items-center justify-center rounded border-2 border-black bg-black text-white shadow-retro-sm">
              <Flame className="h-4.5 w-4.5 fill-primary text-primary" />
            </div>
            <span className="font-heading font-bold text-lg sm:text-xl tracking-tight text-black">
              SIAJAR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-black bg-white hover:bg-black hover:text-white text-xs font-sans font-bold text-black shadow-retro-sm transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Login</span>
          </Link>
        </div>
      </header>

      {/* Main Grid: 2 Kolom Retro Desktop */}
      <main className="flex-1 min-h-0 p-3 sm:p-4 lg:p-5 overflow-y-auto lg:overflow-hidden flex items-stretch">
        <div className="w-full h-full min-h-0 grid lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
          
          {/* Kolom Kiri: Informasi Pendaftaran & Hak Akses (5 Kolom) */}
          <section className="lg:col-span-5 h-full min-h-0 flex flex-col overflow-hidden">
            <div className="h-full min-h-0 rounded border-2 border-black bg-gray-soft shadow-retro-md sm:shadow-retro-lg flex flex-col overflow-hidden">
              <div className="h-11 flex items-center justify-between border-b-2 border-black bg-white px-4 sm:px-6 shrink-0 select-none">
                <span className="text-sm sm:text-base font-bold font-heading text-black tracking-tight">
                  informasi_pendaftaran.app
                </span>
                <span className="px-2 py-0.5 rounded border border-black bg-gray-soft text-xs font-sans font-bold text-black shadow-retro-sm">
                  PORTAL AKADEMIK
                </span>
              </div>

              <div className="p-4 sm:p-5 lg:p-6 flex-1 min-h-0 flex flex-col justify-between overflow-y-auto space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-black leading-tight">
                    Registrasi Terbuka untuk Semua Civitas Academica
                  </h2>
                  <p className="text-xs sm:text-sm text-black/80 font-medium leading-relaxed">
                    Pilih peran akademik Anda untuk mendapatkan akses instan ke modul perkuliahan, presensi terpadu, KRS online, dan portal nilai.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="block text-2xs uppercase tracking-wider font-sans font-bold text-black/70">
                    Peran & Hak Akses yang Didukung:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5 text-xs">
                    <div className="p-2 border-2 border-black bg-white rounded shadow-retro-sm flex items-center gap-2.5">
                      <GraduationCap className="h-4 w-4 text-black shrink-0" />
                      <div>
                        <span className="font-bold block">Mahasiswa & Asisten</span>
                        <span className="text-2xs text-black/70 font-sans">KRS, Tugas, Presensi & Forum</span>
                      </div>
                    </div>
                    <div className="p-2 border-2 border-black bg-white rounded shadow-retro-sm flex items-center gap-2.5">
                      <Briefcase className="h-4 w-4 text-black shrink-0" />
                      <div>
                        <span className="font-bold block">Dosen & Pengajar</span>
                        <span className="text-2xs text-black/70 font-sans">Bimbingan, Input Nilai & Silabus</span>
                      </div>
                    </div>
                    <div className="p-2 border-2 border-black bg-white rounded shadow-retro-sm flex items-center gap-2.5">
                      <Award className="h-4 w-4 text-black shrink-0" />
                      <div>
                        <span className="font-bold block">Kaprodi & Staf Akademik</span>
                        <span className="text-2xs text-black/70 font-sans">Persetujuan KRS, Kurikulum & Arsip</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 border-2 border-black bg-white rounded shadow-retro-sm space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-black">
                    <ShieldCheck className="h-4 w-4 text-ink" />
                    <span>Aktivasi Instan Tanpa Menunggu</span>
                  </div>
                  <p className="text-2xs text-black/80">
                    Akun yang didaftarkan langsung terhubung dan siap digunakan untuk masuk ke sistem kapan pun.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Kolom Kanan: Formulir Registrasi (7 Kolom) */}
          <section className="lg:col-span-7 h-full min-h-0 flex flex-col overflow-hidden">
            <div className="h-full min-h-0 rounded border-2 border-black bg-white shadow-retro-md sm:shadow-retro-lg flex flex-col overflow-hidden">
              <div className="h-11 flex items-center justify-between border-b-2 border-black bg-gray-soft px-4 sm:px-6 shrink-0 select-none">
                <span className="text-sm sm:text-base font-bold font-heading text-black tracking-tight">
                  formulir_pendaftaran.app
                </span>
                <span className="px-2 py-0.5 rounded border border-black bg-white text-xs font-sans font-bold text-black shadow-retro-sm">
                  SELF-REGISTRATION
                </span>
              </div>

              <div className="p-4 sm:p-5 lg:p-6 flex-1 min-h-0 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-1 shrink-0">
                  <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-black leading-tight">
                    Buat Akun SIAJAR Baru
                  </h1>
                  <p className="text-xs sm:text-sm text-black/80 font-medium">
                    Lengkapi identitas diri Anda untuk mendaftar ke portal terpadu.
                  </p>
                </div>

                {errorMessage && (
                  <div
                    key={errorKey}
                    role="alert"
                    className="shake border-2 border-black bg-primary text-white font-bold p-2.5 sm:p-3 my-1 text-xs sm:text-sm font-bold shadow-retro-sm flex items-center gap-2 rounded shrink-0"
                  >
                    <AlertCircle className="h-4.5 w-4.5 text-primary-dark shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                {successMessage && (
                  <div
                    role="status"
                    className="border-2 border-black bg-surface text-ink border-2 border-ink p-2.5 sm:p-3 my-1 text-xs sm:text-sm font-bold shadow-retro-sm flex items-center gap-2 rounded shrink-0"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-ink" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3 my-auto shrink-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label
                        htmlFor="name"
                        className="block text-2xs sm:text-xs font-bold uppercase tracking-wider text-black font-sans"
                      >
                        Nama Lengkap
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Contoh: Rian Pratama"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isPending}
                        required
                        className="w-full h-9 sm:h-10 rounded border-2 border-black bg-white px-3 text-xs sm:text-sm font-bold text-black shadow-retro placeholder:text-black/45 placeholder:font-normal focus:outline-none focus:shadow-retro-md transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="role"
                        className="block text-2xs sm:text-xs font-bold uppercase tracking-wider text-black font-sans"
                      >
                        Peran Akademik
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={isPending}
                        className="w-full h-9 sm:h-10 rounded border-2 border-black bg-white px-3 text-xs sm:text-sm font-bold text-black shadow-retro focus:outline-none focus:shadow-retro-md transition-all cursor-pointer"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label
                        htmlFor="identifier"
                        className="block text-2xs sm:text-xs font-bold uppercase tracking-wider text-black font-sans truncate"
                        title={currentRoleConfig.idLabel}
                      >
                        {currentRoleConfig.idLabel}
                      </label>
                      <input
                        id="identifier"
                        name="identifier"
                        type="text"
                        placeholder={currentRoleConfig.placeholder}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        disabled={isPending}
                        required
                        className="w-full h-9 sm:h-10 rounded border-2 border-black bg-white px-3 text-xs sm:text-sm font-bold text-black shadow-retro placeholder:text-black/45 placeholder:font-normal focus:outline-none focus:shadow-retro-md transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="email"
                        className="block text-2xs sm:text-xs font-bold uppercase tracking-wider text-black font-sans"
                      >
                        Email Aktif
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Contoh: user@kampus.ac.id"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isPending}
                        required
                        className="w-full h-9 sm:h-10 rounded border-2 border-black bg-white px-3 text-xs sm:text-sm font-bold text-black shadow-retro placeholder:text-black/45 placeholder:font-normal focus:outline-none focus:shadow-retro-md transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label
                        htmlFor="password"
                        className="block text-2xs sm:text-xs font-bold uppercase tracking-wider text-black font-sans"
                      >
                        Kata Sandi
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Minimal 6 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isPending}
                        required
                        className="w-full h-9 sm:h-10 rounded border-2 border-black bg-white px-3 text-xs sm:text-sm font-bold text-black shadow-retro placeholder:text-black/45 placeholder:font-normal focus:outline-none focus:shadow-retro-md transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="confirmPassword"
                        className="block text-2xs sm:text-xs font-bold uppercase tracking-wider text-black font-sans"
                      >
                        Konfirmasi Kata Sandi
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Ulangi kata sandi"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isPending}
                        required
                        className="w-full h-9 sm:h-10 rounded border-2 border-black bg-white px-3 text-xs sm:text-sm font-bold text-black shadow-retro placeholder:text-black/45 placeholder:font-normal focus:outline-none focus:shadow-retro-md transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    data-pending={isPending}
                    className="w-full h-10 py-2 px-4 rounded border-2 border-black bg-black text-white hover:bg-gray-soft hover:text-black font-heading font-bold text-xs sm:text-sm shadow-retro active:translate-x-0.5 active:translate-y-0.5 transition-all focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{isPending ? 'Mendaftarkan Akun...' : 'Daftar & Masuk ke SIAJAR'}</span>
                  </button>

                  <div className="pt-1 text-center text-xs font-medium text-black select-none">
                    <span>Sudah memiliki akun? </span>
                    <Link
                      href="/login"
                      className="font-bold underline underline-offset-2 text-black hover:text-primary-dark transition-colors"
                    >
                      Masuk sekarang
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 text-sm font-sans text-muted-foreground bg-retro-bg">
          Memuat halaman pendaftaran SIAJAR...
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
