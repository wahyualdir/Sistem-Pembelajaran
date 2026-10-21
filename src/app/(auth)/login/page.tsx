'use client';

import React, { useEffect, useState, useRef, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from '@/modules/identity/actions';
import {
  Flame,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';

const DEMO = [
  ['Mahasiswa UIR', 'NIM 243510001 (sandi: 123456)', '243510001'],
  ['Kaprodi UIR', 'NIDN 2008000307 (sandi: 123456)', '2008000307'],
  ['Asisten Dosen UIR', 'NIM 233510001 (sandi: 123456)', '233510001'],
  ['Super Admin UIR', 'NIP 20120009 (sandi: 123456)', '20120009'],
  ['Super Admin', 'superadmin (sandi: wahyu11)', 'superadmin'],
  ['Mahasiswa', 'NIM 2024001', '2024001'],
  ['Dosen', 'NIDN 0012345678', '0012345678'],
  ['Mahasiswa + Asisten', 'NIM 2024002', '2024002'],
  ['Kaprodi', 'NIDN 0087654321', '0087654321'],
  ['Staf Akademik', 'NIP 198501012010121001', '198501012010121001'],
  ['System Admin', 'sysadmin', 'sysadmin'],
] as const;

function RetroLoginVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMutedRef = useRef<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Sinkronisasi state mute dan volume video secara ketat
  const applyAudioState = (muted: boolean) => {
    const video = videoRef.current;
    isMutedRef.current = muted;
    setIsMuted(muted);
    if (!video) return;

    if (muted) {
      video.muted = true;
      video.volume = 0;
    } else {
      video.muted = false;
      video.volume = 1;
      video.play().catch(() => {});
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Awal load: pastikan video berjalan dalam kondisi mute agar tidak bocor dan mematuhi browser autoplay
    video.muted = true;
    video.volume = 0;
    video.play().catch(() => {});

    // Pastikan suara HANYA bersuara saat tab login aktif
    const handleVisibilityChange = () => {
      const v = videoRef.current;
      if (!v) return;

      if (document.hidden) {
        // Tab tidak aktif / user pindah tab / minimize browser: matikan suara & jeda seketika
        v.muted = true;
        v.volume = 0;
        v.pause();
      } else {
        // Tab aktif kembali: lanjutkan video, dan aktifkan audio HANYA jika status user sebelumnya ON
        v.play().catch(() => {});
        if (!isMutedRef.current) {
          v.muted = false;
          v.volume = 1;
        } else {
          v.muted = true;
          v.volume = 0;
        }
      }
    };

    const handleWindowBlur = () => {
      const v = videoRef.current;
      if (!v) return;
      if (document.hidden) {
        v.muted = true;
        v.volume = 0;
        v.pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      // Saat navigasi keluar dari halaman login: matikan audio total dan pause
      if (video) {
        video.pause();
        video.muted = true;
        video.volume = 0;
      }
    };
  }, []);

  const toggleMute = () => {
    applyAudioState(!isMuted);
  };

  return (
    <div className="h-full min-h-0 rounded border-2 border-black bg-retro-video shadow-retro-md sm:shadow-retro-lg flex flex-col overflow-hidden">
      {/* Header Jendela Retro Bersih & Minimalis */}
      <div className="h-11 flex items-center justify-between border-b-2 border-black bg-gray-soft px-4 sm:px-6 shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <span className="text-sm sm:text-base font-bold font-heading text-black tracking-tight">
            siajar_interaktif.app
          </span>
        </div>

        {/* Tombol Kontrol Suara Resmi di Header */}
        <button
          type="button"
          onClick={toggleMute}
          className={`px-3 py-1 rounded border-2 border-black text-xs font-sans font-bold shadow-retro-sm active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer select-none ${
            !isMuted
              ? 'bg-black text-white hover:bg-neutral-800'
              : 'bg-white text-black hover:bg-gray-soft'
          }`}
          title={!isMuted ? 'Suara Aktif (Klik untuk Matikan)' : 'Suara Mati (Klik untuk Nyalakan)'}
        >
          {!isMuted ? (
            <>
              <Volume2 className="h-3.5 w-3.5" />
              <span>Suara: ON</span>
            </>
          ) : (
            <>
              <VolumeX className="h-3.5 w-3.5 text-primary-dark" />
              <span>Suara: OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Konten Animasi: Nempel Menyatu 100% ke Background Video Tanpa Garis Belang */}
      <div className="flex-1 min-h-0 w-full relative flex items-center justify-center overflow-hidden bg-retro-video select-none p-3 sm:p-4">
        <video
          ref={videoRef}
          src="/login-video.mp4"
          autoPlay
          loop
          playsInline
          muted={isMuted}
          onVolumeChange={() => {
            const v = videoRef.current;
            if (!v) return;
            if (isMutedRef.current && (!v.muted || v.volume > 0)) {
              v.muted = true;
              v.volume = 0;
            }
          }}
          onPlay={() => {
            const v = videoRef.current;
            if (!v) return;
            if (isMutedRef.current) {
              v.muted = true;
              v.volume = 0;
            }
          }}
          className="w-full h-full object-contain pointer-events-none select-none"
        />
      </div>
    </div>
  );
}

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
        setErrorKey((k) => k + 1); // memicu ulang animasi getar
      } else if (res.redirectTo) {
        setSuccessMessage('Autentikasi berhasil. Mengalihkan ke ruang kerja...');
        window.location.href = res.redirectTo;
      }
    });
  };

  const handleDemoFill = (id: string) => {
    setIdentifier(id);
    if (id === 'superadmin') {
      setPassword('wahyu11');
    } else if (
      id.startsWith('2335') ||
      id.startsWith('2435') ||
      id.startsWith('2535') ||
      id.startsWith('2635') ||
      id.startsWith('20')
    ) {
      setPassword('123456');
    } else {
      setPassword('password123');
    }
    setErrorMessage('');
  };

  return (
    <div
      style={{ fontFamily: "'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif" }}
      className="min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] w-full bg-background text-black font-sans selection:bg-ink selection:text-white flex flex-col overflow-x-hidden lg:overflow-hidden antialiased"
    >
      {/* Top Bar Navigasi Sistem Retro Konsisten dengan Dashboard */}
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b-2 sm:border-b-3 border-black bg-gray-soft shrink-0 select-none shadow-retro-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-3">
          {/* Mac Traffic Light Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="h-3.5 w-3.5 rounded-full border border-black bg-primary inline-block shadow-retro-sm" />
            <span className="h-3.5 w-3.5 rounded-full border border-black bg-gray inline-block shadow-retro-sm" />
            <span className="h-3.5 w-3.5 rounded-full border border-black bg-gray-dark inline-block shadow-retro-sm" />
          </div>

          <div className="flex items-center gap-2.5 ml-1">
            <div className="flex h-8 w-8 items-center justify-center rounded border-2 border-black bg-black text-white shadow-retro-sm">
              <Flame className="h-4.5 w-4.5 fill-white text-white" />
            </div>
            <span className="font-heading font-bold text-lg sm:text-xl tracking-tight text-black">
              SIAJAR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="px-3 py-1 border-2 border-black bg-white text-black text-xs font-bold shadow-retro-sm hover:bg-black hover:text-white transition-all flex items-center gap-1.5"
            title="Buka Halaman Perkenalan Web SIAJAR"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Perkenalan Web ↗</span>
          </Link>
          <span className="hidden sm:inline-flex items-center px-3 py-1 border-2 border-black bg-black text-xs font-sans font-bold text-white shadow-retro-sm">
            TA 2026/2027 GANJIL
          </span>
        </div>
      </header>

      {/* Main Body: Full Screen Grid 2 Kartu Retro Tanpa Scroll di Layar Desktop */}
      <main className="flex-1 min-h-0 p-3 sm:p-4 lg:p-5 overflow-y-auto lg:overflow-hidden flex items-stretch">
        <div className="w-full h-full min-h-0 grid lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
          
          {/* Kolom Kiri: Pemutar Video Profil SIAJAR Lengkap Audio Asli & Rasio 1:1 (7 Kolom Full Height) */}
          <section className="lg:col-span-7 h-full min-h-0 flex flex-col overflow-hidden min-h-[280px] lg:min-h-0">
            <RetroLoginVideoPlayer />
          </section>

          {/* Kolom Kanan: Formulir Masuk SIAJAR (5 Kolom Full Height) */}
          <section className="lg:col-span-5 h-full min-h-0 flex flex-col overflow-hidden">
            <div className="h-full min-h-0 rounded border-2 border-black bg-white shadow-retro-md sm:shadow-retro-lg flex flex-col overflow-hidden">
              {/* Header Jendela Login */}
              <div className="h-11 flex items-center justify-between border-b-2 border-black bg-gray-soft px-4 sm:px-6 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm sm:text-base font-bold font-heading text-black tracking-tight">
                    autentikasi_portal.app
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded border border-black bg-white text-xs font-sans font-bold text-black shadow-retro-sm">
                  ROLE-BASED AUTH
                </span>
              </div>

              {/* Konten Form Full Height */}
              <div className="p-5 sm:p-6 lg:p-7 flex-1 min-h-0 flex flex-col justify-between overflow-y-auto">
                <div className="my-auto space-y-5 shrink-0">
                  {/* Header Judul Form */}
                  <div className="space-y-1.5">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight text-black leading-tight">
                      Masuk ke SIAJAR
                    </h1>
                    <p className="text-xs sm:text-sm text-black/80 font-medium">
                      Gunakan NIM, NIDN, NIP, username, atau email kampus Anda.
                    </p>
                  </div>

                  {/* Notifikasi Error & Sukses */}
                  {errorMessage && (
                    <div
                      key={errorKey}
                      id="login-error-alert"
                      data-testid="login-error-alert"
                      role="alert"
                      className="shake border-2 border-black bg-primary text-white font-bold p-2.5 sm:p-3 text-xs sm:text-sm font-bold shadow-retro-sm flex items-center gap-2 rounded"
                    >
                      <AlertCircle className="h-4.5 w-4.5 text-primary-dark shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                  {successMessage && (
                    <div
                      role="status"
                      className="border-2 border-black bg-surface text-ink border-2 border-ink p-2.5 sm:p-3 text-xs sm:text-sm font-bold shadow-retro-sm flex items-center gap-2 rounded"
                    >
                      <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-ink" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {/* Form Input Masuk */}
                  <form onSubmit={handleSubmit} method="post" className="space-y-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="identifier"
                      className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-black font-sans"
                    >
                      NIM / NIDN / NIP / Email / Username
                    </label>
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      placeholder="Contoh: 2024001 atau mhs@siajar.ac.id"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={isPending}
                      required
                      className="w-full h-10 min-h-[2.5rem] sm:h-11 rounded border-2 border-black bg-white px-3.5 text-base sm:text-sm font-bold text-black shadow-retro placeholder:text-black/45 placeholder:font-normal focus:outline-none focus:shadow-retro-md transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <label
                        htmlFor="password"
                        className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-black font-sans"
                      >
                        Kata Sandi
                      </label>
                      <Link
                        href="/reset-password"
                        className="text-xs sm:text-sm font-bold text-black hover:text-primary-dark underline underline-offset-2 transition-colors focus-visible:outline-none"
                      >
                        Lupa password?
                      </Link>
                    </div>
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
                      className="w-full h-10 min-h-[2.5rem] sm:h-11 rounded border-2 border-black bg-white px-3.5 text-base sm:text-sm font-bold text-black shadow-retro placeholder:text-black/45 placeholder:font-normal focus:outline-none focus:shadow-retro-md transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    data-pending={isPending}
                    className="w-full h-10 min-h-[2.5rem] sm:h-11 py-2 px-4 rounded border-2 border-black bg-black text-white hover:bg-gray-soft hover:text-black font-heading font-bold text-sm sm:text-base shadow-retro active:translate-x-0.5 active:translate-y-0.5 transition-all focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer mt-1"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>{isPending ? 'Memverifikasi kredensial...' : 'Masuk ke SIAJAR'}</span>
                  </button>

                  <div className="pt-1.5 text-center text-xs sm:text-sm font-medium text-black select-none">
                    <span>Belum punya akun? </span>
                    <Link
                      href="/register"
                      className="font-bold underline underline-offset-2 text-black hover:text-primary-dark transition-colors"
                    >
                      Daftar sekarang
                    </Link>
                  </div>
                </form>
                </div>

                {/* Accordion Akun Demo Cepat (Hanya tampil saat NODE_ENV === 'development', tanpa password) */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-2 pt-2 border-t-2 border-black/15 group shrink-0">
                    <summary className="cursor-pointer text-xs sm:text-sm font-bold text-black inline-flex items-center gap-2 select-none">
                      <span className="px-2.5 py-1 rounded border-2 border-black bg-gray-soft hover:bg-gray-soft transition-colors shadow-retro-sm flex items-center gap-2 font-sans text-xs font-bold">
                        <span>Akun demo untuk uji coba (Development)</span>
                        <span className="text-2xs transition-transform group-open:rotate-180">▾</span>
                      </span>
                    </summary>
                    <ul className="demo-list mt-2 grid grid-cols-2 gap-1.5 max-h-28 sm:max-h-32 overflow-y-auto pr-1">
                      {DEMO.map(([peran, ket, id]) => (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => handleDemoFill(id)}
                            className="w-full rounded border-2 border-black bg-white p-1.5 sm:p-2 text-left shadow-retro-sm hover:bg-gray-soft active:translate-x-0.5 transition-all focus-visible:outline-none cursor-pointer"
                          >
                            <span className="block font-bold text-xs sm:text-sm text-black leading-tight truncate">
                              {peran}
                            </span>
                            <span className="text-xs text-black/80 font-sans font-medium block mt-0.5 truncate">
                              {ket}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 text-sm font-sans text-muted-foreground bg-retro-bg">
          Memuat halaman masuk SIAJAR...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
