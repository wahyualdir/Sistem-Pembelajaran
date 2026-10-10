'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface UirLogo3DProps {
  className?: string;
  autoPlayInterval?: number;
}

// -------------------------------------------------------------
// Data Bahasa Pemrograman Resmi (Official Devicon 128x128 SVGs)
// -------------------------------------------------------------
const PROGRAMMING_LANGUAGES = [
  {
    id: 'python',
    name: 'Python',
    svgPath: '/tech-logos/python.svg',
    glowColor: 'rgba(56, 126, 184, 0.35)',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    svgPath: '/tech-logos/javascript.svg',
    glowColor: 'rgba(240, 219, 79, 0.35)',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    svgPath: '/tech-logos/typescript.svg',
    glowColor: 'rgba(0, 122, 204, 0.35)',
  },
  {
    id: 'react',
    name: 'React.js',
    svgPath: '/tech-logos/react.svg',
    glowColor: 'rgba(97, 218, 251, 0.35)',
  },
  {
    id: 'cplusplus',
    name: 'C++',
    svgPath: '/tech-logos/cplusplus.svg',
    glowColor: 'rgba(0, 89, 156, 0.35)',
  },
  {
    id: 'java',
    name: 'Java',
    svgPath: '/tech-logos/java.svg',
    glowColor: 'rgba(234, 45, 46, 0.35)',
  },
  {
    id: 'rust',
    name: 'Rust',
    svgPath: '/tech-logos/rust.svg',
    glowColor: 'rgba(206, 65, 43, 0.35)',
  },
  {
    id: 'php',
    name: 'PHP',
    svgPath: '/tech-logos/php.svg',
    glowColor: 'rgba(119, 123, 180, 0.35)',
  },
];

export function UirLogo3D({ className, autoPlayInterval = 3200 }: UirLogo3DProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = PROGRAMMING_LANGUAGES[currentIndex];

  // Pergantian logo berikutnya dengan transisi crossfade 3D yang sangat mulus
  const nextLanguage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % PROGRAMMING_LANGUAGES.length);
  }, []);

  // Timer bergantian otomatis (otomatis pause saat di-hover pengguna)
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      nextLanguage();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [nextLanguage, autoPlayInterval, isHovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Interactive 3D perspective tilt up to +-24 degrees
    const rotateY = ((x - centerX) / centerX) * 24;
    const rotateX = -((y - centerY) / centerY) * 24;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onClick={nextLanguage}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative group cursor-pointer select-none flex flex-col items-center justify-between rounded-2xl border-2 border-retro-border bg-gradient-to-b from-retro-surface via-retro-warm/30 to-retro-surface shadow-retro transition-all duration-300',
        'w-full h-64 sm:h-72 md:h-80 overflow-hidden p-6',
        className
      )}
      style={{
        perspective: '1000px',
      }}
      title={`Logo 3D ${currentLang.name} - Klik untuk ganti bahasa pemrograman`}
    >
      {/* Background Retro Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#000000_1.2px,transparent_1.2px)] [background-size:12px_12px] opacity-15 pointer-events-none" />

      {/* Ambient Radial Glow yang Berubah Warna Halus Sesuai Bahasa Pemrograman */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-out pointer-events-none blur-xl"
        style={{
          background: `radial-gradient(circle, ${currentLang.glowColor} 0%, rgba(0,0,0,0) 70%)`,
          opacity: 0.9,
        }}
      />

      {/* Panggung Perspektif 3D Utama */}
      <div
        className="relative w-full flex-1 flex flex-col items-center justify-center my-auto"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Kontainer Logo Melayang 3D (Animasi Perspektif Mengambang Halus) */}
        <div
          className={cn(
            'relative w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] flex items-center justify-center transition-transform duration-300 ease-out',
            !isHovered && 'animate-uir-perspective'
          )}
          style={{
            transform: isHovered
              ? `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1.1, 1.1, 1.1)`
              : undefined,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Efek Kilau Cahaya 3D Menyapu Logo */}
          <div className="absolute -inset-4 overflow-hidden pointer-events-none z-30 rounded-3xl opacity-75 mix-blend-screen">
            <div className="w-full h-full animate-uir-shine bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          </div>

          {/* Seluruh Logo Resmi Ditumpuk dengan Transisi Silky-Smooth Crossfade 700ms */}
          {PROGRAMMING_LANGUAGES.map((lang, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={lang.id}
                className={cn(
                  'absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700',
                  isActive
                    ? 'opacity-100 scale-100 translate-y-0 rotate-0 filter drop-shadow-[0_16px_24px_rgba(0,0,0,0.32)]'
                    : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
                )}
                style={{
                  transitionProperty: 'opacity, transform',
                  transitionDuration: '700ms',
                  transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={lang.svgPath}
                    alt={`Logo Resmi ${lang.name}`}
                    fill
                    className="object-contain filter contrast-105 drop-shadow-[0_2px_4px_rgba(255,255,255,0.6)]"
                    priority={idx === 0}
                    sizes="(max-width: 640px) 150px, 170px"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bayangan Lantai 3D Dinamis */}
        <div
          className={cn(
            'absolute bottom-1 w-[130px] sm:w-[155px] h-[16px] rounded-full bg-black/45 blur-[4px] pointer-events-none transition-all',
            !isHovered && 'animate-uir-perspective-shadow'
          )}
          style={{
            transform: isHovered
              ? `scale(${1 - Math.abs(rotate.x) / 70}) translateX(${rotate.y * 0.8}px)`
              : undefined,
          }}
        />
      </div>

      {/* Pill Indikator Nama Bahasa Pemrograman (Murni Nama, Tanpa Bulatan Warna) */}
      <div className="relative z-20 flex items-center px-4 py-1.5 rounded-full border-2 border-retro-border bg-retro-surface shadow-retro mt-2">
        <span className="font-mono text-xs font-black uppercase tracking-wider text-foreground">
          {currentLang.name}
        </span>
      </div>
    </div>
  );
}

// Alias export untuk kompatibilitas
export const TechLogo3D = UirLogo3D;
