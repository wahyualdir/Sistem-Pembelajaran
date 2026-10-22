'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from '@/modules/identity/actions';
import { WindowTrafficLights } from '@/components/retro/window-traffic-lights';
import {
  CheckCircle2,
  AlertCircle,
  LogIn,
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

// 4 Jalur Aliran Logo Resmi Developer & AI Tools: Meluncur Mulus Melintasi Layar
const STREAM_1 = [
  { name: 'OpenAI', svgPath: '/tech-logos/openai.svg', rot: '-rotate-6', offset: 'mt-1' },
  { name: 'Visual Studio Code', svgPath: '/tech-logos/vscode.svg', rot: 'rotate-4', offset: '-mt-1' },
  { name: 'Google Gemini', svgPath: '/tech-logos/gemini.svg', rot: '-rotate-8', offset: 'mt-2' },
  { name: 'Python', svgPath: '/tech-logos/python.svg', rot: 'rotate-6', offset: '-mt-1' },
  { name: 'Claude AI', svgPath: '/tech-logos/claude.svg', rot: '-rotate-4', offset: 'mt-1' },
  { name: 'React.js', svgPath: '/tech-logos/react.svg', rot: 'rotate-5', offset: '-mt-2' },
  { name: 'PyTorch', svgPath: '/tech-logos/pytorch.svg', rot: '-rotate-6', offset: 'mt-1' },
  { name: 'TypeScript', svgPath: '/tech-logos/typescript.svg', rot: 'rotate-4', offset: 'mt-0' },
  { name: 'Docker', svgPath: '/tech-logos/docker.svg', rot: '-rotate-5', offset: 'mt-1' },
  { name: 'Go Language', svgPath: '/tech-logos/go.svg', rot: 'rotate-6', offset: '-mt-1' },
];

const STREAM_2 = [
  { name: 'GitHub Copilot', svgPath: '/tech-logos/copilot.svg', rot: 'rotate-6', offset: '-mt-1' },
  { name: 'JavaScript', svgPath: '/tech-logos/javascript.svg', rot: '-rotate-6', offset: 'mt-1' },
  { name: 'DeepSeek AI', svgPath: '/tech-logos/deepseek.svg', rot: 'rotate-8', offset: '-mt-1' },
  { name: 'GitHub', svgPath: '/tech-logos/github.svg', rot: '-rotate-4', offset: 'mt-2' },
  { name: 'TensorFlow', svgPath: '/tech-logos/tensorflow.svg', rot: 'rotate-5', offset: '-mt-2' },
  { name: 'Node.js', svgPath: '/tech-logos/nodejs.svg', rot: '-rotate-8', offset: 'mt-1' },
  { name: 'Hugging Face', svgPath: '/tech-logos/huggingface.svg', rot: 'rotate-4', offset: '-mt-1' },
  { name: 'Figma', svgPath: '/tech-logos/figma.svg', rot: '-rotate-5', offset: 'mt-1' },
  { name: 'Next.js', svgPath: '/tech-logos/nextjs.svg', rot: 'rotate-7', offset: '-mt-2' },
  { name: 'Tailwind CSS', svgPath: '/tech-logos/tailwind.svg', rot: '-rotate-4', offset: 'mt-1' },
];

const STREAM_3 = [
  { name: 'Perplexity AI', svgPath: '/tech-logos/perplexity.svg', rot: '-rotate-6', offset: 'mt-1' },
  { name: 'HTML5', svgPath: '/tech-logos/html5.svg', rot: 'rotate-6', offset: '-mt-1' },
  { name: 'ChatGPT', svgPath: '/tech-logos/chatgpt.svg', rot: '-rotate-4', offset: 'mt-1' },
  { name: 'PostgreSQL', svgPath: '/tech-logos/postgres.svg', rot: 'rotate-8', offset: '-mt-2' },
  { name: 'CSS3', svgPath: '/tech-logos/css3.svg', rot: '-rotate-5', offset: 'mt-2' },
  { name: 'Vue.js', svgPath: '/tech-logos/vuejs.svg', rot: 'rotate-6', offset: '-mt-1' },
  { name: 'Ollama AI', svgPath: '/tech-logos/ollama.svg', rot: '-rotate-7', offset: 'mt-1' },
  { name: 'Kotlin', svgPath: '/tech-logos/kotlin.svg', rot: 'rotate-4', offset: '-mt-1' },
  { name: 'Rust', svgPath: '/tech-logos/rust.svg', rot: '-rotate-6', offset: 'mt-1' },
  { name: 'Flutter', svgPath: '/tech-logos/flutter.svg', rot: 'rotate-5', offset: '-mt-1' },
];

const STREAM_4 = [
  { name: 'Android Studio', svgPath: '/tech-logos/android.svg', rot: 'rotate-5', offset: '-mt-1' },
  { name: 'MySQL', svgPath: '/tech-logos/mysql.svg', rot: '-rotate-6', offset: 'mt-1' },
  { name: 'C# / .NET', svgPath: '/tech-logos/csharp.svg', rot: 'rotate-7', offset: '-mt-1' },
  { name: 'Redis', svgPath: '/tech-logos/redis.svg', rot: '-rotate-5', offset: 'mt-2' },
  { name: 'Swift', svgPath: '/tech-logos/swift.svg', rot: 'rotate-4', offset: '-mt-2' },
  { name: 'MongoDB', svgPath: '/tech-logos/mongodb.svg', rot: '-rotate-8', offset: 'mt-1' },
  { name: 'Java', svgPath: '/tech-logos/java.svg', rot: 'rotate-6', offset: '-mt-1' },
  { name: 'Postman', svgPath: '/tech-logos/postman.svg', rot: '-rotate-4', offset: 'mt-1' },
  { name: 'Linux', svgPath: '/tech-logos/linux.svg', rot: 'rotate-5', offset: '-mt-1' },
  { name: 'PHP', svgPath: '/tech-logos/php.svg', rot: '-rotate-6', offset: 'mt-1' },
];

interface LogoItem {
  name: string;
  svgPath: string;
  rot: string;
  offset: string;
}

function StreamRow({
  items,
  direction,
  duration,
  topPos,
}: {
  items: LogoItem[];
  direction: 'left' | 'right';
  duration: string;
  topPos: string;
}) {
  const animName = direction === 'left' ? 'drift-to-left' : 'drift-to-right';

  return (
    <div
      className={`absolute ${topPos} left-0 w-full overflow-hidden pointer-events-none select-none z-0 group`}
    >
      <div
        className="flex w-max group-hover:[animation-play-state:paused]"
        style={{
          animation: `${animName} ${duration} linear infinite`,
          willChange: 'transform',
        }}
      >
        {/* Set 1 */}
        <div className="flex gap-10 sm:gap-14 items-center pr-10 sm:pr-14 py-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`transform ${item.rot} ${item.offset} pointer-events-auto`}
              style={{
                animation: `logo-float-bob 3.6s ease-in-out infinite`,
                animationDelay: `${(idx * 0.45) % 2.5}s`,
              }}
            >
              <div
                title={item.name}
                className="w-14 h-14 sm:w-16 sm:h-16 lg:w-[68px] lg:h-[68px] rounded-2xl border-2 sm:border-3 border-black bg-white/95 p-2.5 sm:p-3 shadow-retro sm:shadow-retro-md flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-125 hover:rotate-6 hover:shadow-retro-lg active:scale-95 group/tile ring-1 ring-white/80"
              >
                <img
                  src={item.svgPath}
                  alt={item.name}
                  className="h-full w-full object-contain pointer-events-none select-none transition-transform group-hover/tile:scale-105 [image-rendering:-webkit-optimize-contrast]"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Set 2 (Duplikasi untuk Seamless Infinite Loop) */}
        <div className="flex gap-10 sm:gap-14 items-center pr-10 sm:pr-14 py-2" aria-hidden="true">
          {items.map((item, idx) => (
            <div
              key={`dup-${idx}`}
              className={`transform ${item.rot} ${item.offset} pointer-events-auto`}
              style={{
                animation: `logo-float-bob 3.6s ease-in-out infinite`,
                animationDelay: `${(idx * 0.45) % 2.5}s`,
              }}
            >
              <div
                title={item.name}
                className="w-14 h-14 sm:w-16 sm:h-16 lg:w-[68px] lg:h-[68px] rounded-2xl border-2 sm:border-3 border-black bg-white/95 p-2.5 sm:p-3 shadow-retro sm:shadow-retro-md flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-125 hover:rotate-6 hover:shadow-retro-lg active:scale-95 group/tile ring-1 ring-white/80"
              >
                <img
                  src={item.svgPath}
                  alt={item.name}
                  className="h-full w-full object-contain pointer-events-none select-none transition-transform group-hover/tile:scale-105 [image-rendering:-webkit-optimize-contrast]"
                />
              </div>
            </div>
          ))}
        </div>
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
        setErrorKey((k) => k + 1);
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
      style={{ fontFamily: "var(--font-sf-pro), 'SF Pro Display', 'SF Pro', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif" }}
      className="min-h-[100dvh] w-full bg-background text-black font-sans selection:bg-ink selection:text-white flex flex-col relative overflow-x-hidden select-none antialiased"
    >
      {/* Definisi Animasi Bergerak Melintasi Layar & Goyangan Halus */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drift-to-left {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes drift-to-right {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes logo-float-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}} />

      {/* Background Retro Dot Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#121212_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none z-0" />

      {/* Area Konten Utama: 4 Jalur Logo Tech & AI Bergerak Melintasi Layar Penuh */}
      <main className="flex-1 min-h-[100dvh] relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
        
        {/* Jalur 1: Mengalir Kiri ke Kanan di Area Atas */}
        <StreamRow
          items={STREAM_1}
          direction="right"
          duration="36s"
          topPos="top-4 sm:top-6 md:top-8"
        />

        {/* Jalur 2: Mengalir Kanan ke Kiri Meluncur di Balik Header Jendela Login */}
        <StreamRow
          items={STREAM_2}
          direction="left"
          duration="44s"
          topPos="top-[25%] sm:top-[26%]"
        />

        {/* Jalur 3: Mengalir Kiri ke Kanan Meluncur di Balik Bidang Input Formulir */}
        <StreamRow
          items={STREAM_3}
          direction="right"
          duration="40s"
          topPos="top-[52%] sm:top-[53%]"
        />

        {/* Jalur 4: Mengalir Kanan ke Kiri di Area Bawah (Aman dari Potongan Tepi Bawah Layar) */}
        <StreamRow
          items={STREAM_4}
          direction="left"
          duration="46s"
          topPos="bottom-4 sm:bottom-6 md:bottom-8"
        />

        {/* Jendela Form Login Retro Transparan Ultra-HD */}
        <div className="relative z-10 w-full max-w-md sm:max-w-lg rounded-2xl border-2 sm:border-3 border-black bg-gradient-to-b from-white/[0.28] via-white/[0.16] to-white/[0.22] backdrop-blur-[10px] backdrop-saturate-[180%] shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(255,255,255,0.25),0_20px_50px_rgba(0,0,0,0.2),4px_4px_0px_#000] ring-1 ring-white/60 flex flex-col overflow-hidden my-auto animate-fade-up">
          {/* Header Bar Jendela Retro Transparan HD */}
          <div className="h-11 flex items-center justify-between border-b-2 border-black bg-white/[0.22] backdrop-blur-md px-4 sm:px-5 shrink-0 select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
            {/* HD Mac Window Traffic Light Controls (Merah, Kuning, Hijau dengan Refleksi Kaca 3D) */}
            <div className="flex items-center gap-2">
              <WindowTrafficLights size="md" />
              <span className="text-xs sm:text-sm font-bold font-sans text-black ml-1.5 tracking-tight flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>autentikasi_portal.app</span>
              </span>
            </div>
            <span className="px-2 py-0.5 rounded border border-black bg-white/[0.45] backdrop-blur-xs text-[10px] sm:text-xs font-sans font-bold text-black shadow-retro-xs tracking-wider">
              ROLE-BASED AUTH
            </span>
          </div>

          {/* Konten Form Transparan Nyata (Logo-Logo di Belakang Tampak Meluncur Tembus Kaca) */}
          <div className="p-5 sm:p-7 space-y-5 bg-transparent">
            {/* Logo Resmi RuangKampus & Judul */}
            <div className="flex flex-col items-center text-center space-y-2 select-none">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border-2 sm:border-3 border-black bg-white/[0.80] backdrop-blur-md p-1.5 shadow-retro ring-1 ring-white/80">
                <img
                  src="/logo-ruangkampus.png"
                  alt="Logo RuangKampus"
                  className="h-full w-full object-contain [image-rendering:-webkit-optimize-contrast]"
                />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-black leading-tight">
                  Ruang<span style={{ color: '#ED1C24' }} className="text-[#ED1C24]">Kampus</span>
                </h1>
                <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-[0.14em]">
                  Sistem Pembelajaran
                </p>
              </div>
              <p className="text-xs sm:text-sm text-black/85 font-medium max-w-sm pt-0.5">
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
                className="shake border-2 border-black bg-primary text-white font-bold p-3 text-xs sm:text-sm shadow-retro-sm flex items-center gap-2 rounded-lg"
              >
                <AlertCircle className="h-4.5 w-4.5 text-white shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div
                role="status"
                className="border-2 border-black bg-surface text-ink p-3 text-xs sm:text-sm font-bold shadow-retro-sm flex items-center gap-2 rounded-lg"
              >
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-ink" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form Input Masuk Transparan Tembus Pandang */}
            <form onSubmit={handleSubmit} method="post" className="space-y-4">
              <div className="space-y-1.5">
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
                  placeholder="Contoh: 2024001 atau mhs@ruangkampus.ac.id"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isPending}
                  required
                  className="w-full h-11 rounded-lg border-2 border-black bg-white/[0.30] hover:bg-white/[0.45] focus:bg-white/[0.92] backdrop-blur-md px-3.5 text-sm sm:text-base font-bold text-black shadow-retro-xs focus:shadow-retro placeholder:text-black/55 placeholder:font-normal focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-black font-sans"
                  >
                    Kata Sandi
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-xs sm:text-sm font-bold text-black hover:text-[#ED1C24] underline underline-offset-2 transition-colors focus-visible:outline-none"
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
                  className="w-full h-11 rounded-lg border-2 border-black bg-white/[0.30] hover:bg-white/[0.45] focus:bg-white/[0.92] backdrop-blur-md px-3.5 text-sm sm:text-base font-bold text-black shadow-retro-xs focus:shadow-retro placeholder:text-black/55 placeholder:font-normal focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                data-pending={isPending}
                className="w-full h-11 py-2 px-4 rounded-lg border-2 border-black bg-black text-white hover:bg-zinc-800 font-heading font-bold text-sm sm:text-base shadow-retro hover:shadow-retro-md active:translate-x-0.5 active:translate-y-0.5 transition-all focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer mt-1"
              >
                <LogIn className="h-5 w-5" />
                <span>{isPending ? 'Memverifikasi kredensial...' : 'Masuk ke RuangKampus'}</span>
              </button>

              <div className="pt-1 text-center text-xs sm:text-sm font-medium text-black select-none">
                <span>Belum punya akun? </span>
                <Link
                  href="/register"
                  className="font-bold underline underline-offset-2 text-black hover:text-[#ED1C24] transition-colors"
                >
                  Daftar sekarang
                </Link>
              </div>
            </form>

            {/* Accordion Akun Demo Cepat */}
            {process.env.NODE_ENV === 'development' && (
              <details className="pt-2 border-t-2 border-black/15 group">
                <summary className="cursor-pointer text-xs sm:text-sm font-bold text-black inline-flex items-center gap-2 select-none">
                  <span className="px-2.5 py-1 rounded-lg border-2 border-black bg-white/[0.35] hover:bg-white/[0.60] backdrop-blur-xs transition-colors shadow-retro-xs flex items-center gap-2 font-sans text-xs font-bold">
                    <span>Akun demo untuk uji coba (Development)</span>
                    <span className="text-2xs transition-transform group-open:rotate-180">▾</span>
                  </span>
                </summary>
                <ul className="demo-list mt-2.5 grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {DEMO.map(([peran, ket, id]) => (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => handleDemoFill(id)}
                        className="w-full rounded-lg border-2 border-black bg-white/[0.45] backdrop-blur-xs p-2 text-left shadow-retro-xs hover:bg-white/85 active:translate-x-0.5 transition-all focus-visible:outline-none cursor-pointer"
                      >
                        <span className="block font-bold text-xs sm:text-sm text-black leading-tight truncate">
                          {peran}
                        </span>
                        <span className="text-[11px] text-black/75 font-sans font-medium block mt-0.5 truncate">
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
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 text-sm font-sans text-muted-foreground bg-retro-bg">
          Memuat halaman masuk RuangKampus...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
