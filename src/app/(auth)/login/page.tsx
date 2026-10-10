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
} from 'lucide-react';

const DEMO = [
  ['Super Admin', 'Wahyu (Super Admin)', 'wahyualdiriyanto80@gmail.com', 'Wahyu11'],
  ['Mahasiswa', 'NIM 2024001', '2024001', 'Password123!'],
  ['Dosen', 'NIDN 0012345678', '0012345678', 'Password123!'],
  ['Mahasiswa + Asisten', 'NIM 2024002', '2024002', 'Password123!'],
  ['Kaprodi', 'NIDN 0087654321', '0087654321', 'Password123!'],
  ['Staf Akademik', 'NIP 19850101…', '198501012010121001', 'Password123!'],
  ['System Admin', 'sysadmin', 'sysadmin', 'Password123!'],
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
    <div className="h-full rounded border-2 border-black bg-[#DFE4EE] shadow-[5px_5px_0px_#000000] flex flex-col overflow-hidden">
      {/* Header Jendela Retro Bersih & Minimalis */}
      <div className="h-11 flex items-center justify-between border-b-2 border-black bg-retro-warm px-4 sm:px-6 shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <span className="text-sm sm:text-base font-black font-heading text-black tracking-tight">
            siajar_interaktif.app
          </span>
        </div>

        {/* Tombol Kontrol Suara Resmi di Header */}
        <button
          type="button"
          onClick={toggleMute}
          className={`px-3 py-1 rounded border-2 border-black text-xs font-mono font-black shadow-[1.5px_1.5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer select-none ${
            !isMuted
              ? 'bg-retro-yellow text-black hover:bg-black hover:text-white'
              : 'bg-white text-black hover:bg-retro-warm'
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
              <VolumeX className="h-3.5 w-3.5 text-red-600" />
              <span>Suara: OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Konten Animasi: Nempel Menyatu ke Background Card Tanpa Badge Apapun */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center overflow-hidden bg-[#DFE4EE] select-none">
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
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

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

  const handleDemoFill = (id: string, pass: string = 'Password123!') => {
    setIdentifier(id);
    setPassword(pass);
    setErrorMessage('');
  };

  return (
    <div
      style={{ fontFamily: "'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif" }}
      className="h-screen max-h-screen w-full bg-[#F6F3EB] text-black font-sans selection:bg-retro-yellow selection:text-black flex flex-col overflow-hidden antialiased"
    >
      {/* Top Bar Navigasi Sistem Retro Konsisten dengan Dashboard */}
      <header className="h-[54px] flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b-2 sm:border-b-3 border-black bg-retro-yellow shrink-0 select-none shadow-[0px_2px_0px_#000]">
        <div className="flex items-center gap-3">
          {/* Mac Traffic Light Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="h-3.5 w-3.5 rounded-full border border-black bg-[#FF5F56] inline-block shadow-[0.5px_0.5px_0px_#000]" />
            <span className="h-3.5 w-3.5 rounded-full border border-black bg-[#FFBD2E] inline-block shadow-[0.5px_0.5px_0px_#000]" />
            <span className="h-3.5 w-3.5 rounded-full border border-black bg-[#27C93F] inline-block shadow-[0.5px_0.5px_0px_#000]" />
          </div>

          <div className="flex items-center gap-2.5 ml-1">
            <div className="flex h-8 w-8 items-center justify-center rounded border-2 border-black bg-black text-white shadow-[1.5px_1.5px_0px_#000]">
              <Flame className="h-4.5 w-4.5 fill-retro-orange text-retro-orange" />
            </div>
            <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-black">
              SIAJAR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center px-3 py-1 border-2 border-black bg-white text-xs font-mono font-bold text-black shadow-[1.5px_1.5px_0px_#000]">
            TA 2026/2027 GANJIL
          </span>
        </div>
      </header>

      {/* Main Body: Full Screen Grid 2 Kartu Retro Tanpa Scroll */}
      <main className="flex-1 h-[calc(100vh-54px)] p-3 sm:p-4 lg:p-5 overflow-hidden flex items-stretch">
        <div className="w-full h-full grid lg:grid-cols-12 gap-4 lg:gap-5 items-stretch overflow-hidden">
          
          {/* Kolom Kiri: Pemutar Video Profil SIAJAR Lengkap Audio Asli & Rasio 1:1 (7 Kolom Full Height) */}
          <section className="lg:col-span-7 h-full flex flex-col overflow-hidden">
            <RetroLoginVideoPlayer />
          </section>

          {/* Kolom Kanan: Formulir Masuk SIAJAR (5 Kolom Full Height) */}
          <section className="lg:col-span-5 h-full flex flex-col overflow-hidden">
            <div className="h-full rounded border-2 border-black bg-white shadow-[5px_5px_0px_#000000] flex flex-col overflow-hidden">
              {/* Header Jendela Login */}
              <div className="h-11 flex items-center justify-between border-b-2 border-black bg-retro-yellow px-4 sm:px-6 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm sm:text-base font-black font-heading text-black tracking-tight">
                    autentikasi_portal.app
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded border border-black bg-white text-xs font-mono font-black text-black shadow-[1px_1px_0px_#000]">
                  ROLE-BASED AUTH
                </span>
              </div>

              {/* Konten Form Full Height */}
              <div className="p-5 sm:p-6 lg:p-8 flex-1 flex flex-col justify-between overflow-hidden">
                {/* Header Judul Form */}
                <div className="space-y-1 shrink-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black tracking-tight text-black leading-tight">
                    Masuk ke SIAJAR
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-black/80 font-medium">
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
                    className="shake border-2 border-black bg-[#FFF0F0] text-danger p-2.5 sm:p-3 my-1 text-xs sm:text-sm font-bold shadow-[2px_2px_0px_#000] flex items-center gap-2 rounded shrink-0"
                  >
                    <AlertCircle className="h-4.5 w-4.5 text-danger shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                {successMessage && (
                  <div
                    role="status"
                    className="border-2 border-black bg-[#F0FDF4] text-success p-2.5 sm:p-3 my-1 text-xs sm:text-sm font-bold shadow-[2px_2px_0px_#000] flex items-center gap-2 rounded shrink-0"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-success" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Form Input Masuk */}
                <form onSubmit={handleSubmit} method="post" className="space-y-3 sm:space-y-4 my-auto shrink-0">
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
                      className="w-full h-11 sm:h-12 lg:h-13 rounded border-2 border-black bg-white px-4 text-sm sm:text-base lg:text-lg font-bold text-black shadow-[2.5px_2.5px_0px_#000] placeholder:text-black/45 placeholder:font-normal focus:outline-none focus:shadow-[4px_4px_0px_#000] transition-all"
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
                        className="text-xs sm:text-sm font-bold text-black hover:text-retro-orange underline underline-offset-2 transition-colors focus-visible:outline-none"
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
                      className="w-full h-11 sm:h-12 lg:h-13 rounded border-2 border-black bg-white px-4 text-sm sm:text-base lg:text-lg font-bold text-black shadow-[2.5px_2.5px_0px_#000] placeholder:text-black/45 placeholder:font-normal focus:outline-none focus:shadow-[4px_4px_0px_#000] transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending || !ready}
                    data-pending={isPending}
                    className="w-full h-11 sm:h-12 lg:h-13 py-2.5 px-4 rounded border-2 border-black bg-black text-white hover:bg-retro-yellow hover:text-black font-heading font-black text-sm sm:text-base lg:text-lg shadow-[3.5px_3.5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer mt-1"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>{isPending ? 'Memverifikasi kredensial...' : 'Masuk ke SIAJAR'}</span>
                  </button>
                </form>

                {/* Accordion Akun Demo Cepat */}
                <details className="mt-2 pt-2 border-t-2 border-black/15 group shrink-0">
                  <summary className="cursor-pointer text-xs sm:text-sm font-bold text-black inline-flex items-center gap-2 select-none">
                    <span className="px-2.5 py-1 rounded border-2 border-black bg-retro-warm hover:bg-retro-yellow transition-colors shadow-[2px_2px_0px_#000] flex items-center gap-2 font-mono text-xs font-bold">
                      <span>Akun demo untuk uji coba</span>
                      <span className="text-2xs transition-transform group-open:rotate-180">▾</span>
                    </span>
                  </summary>
                  <ul className="demo-list mt-2 grid grid-cols-2 gap-1.5 max-h-28 sm:max-h-32 overflow-y-auto pr-1">
                    {DEMO.map(([peran, ket, id, pass]) => (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => handleDemoFill(id, pass)}
                          className="w-full rounded border-2 border-black bg-white p-1.5 sm:p-2 text-left shadow-[1.5px_1.5px_0px_#000] hover:bg-retro-yellow active:translate-x-0.5 transition-all focus-visible:outline-none cursor-pointer"
                        >
                          <span className="block font-black text-xs sm:text-sm text-black leading-tight truncate">
                            {peran}
                          </span>
                          <span className="text-[10px] sm:text-xs text-black/80 font-mono font-medium block mt-0.5 truncate">
                            {ket}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
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
        <div className="flex min-h-screen items-center justify-center p-4 text-sm font-mono text-muted-foreground bg-retro-bg">
          Memuat halaman masuk SIAJAR...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
