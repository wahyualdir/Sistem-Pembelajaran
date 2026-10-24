'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface UirLogo3DProps {
  className?: string;
  autoPlayInterval?: number;
}

const PROGRAMMING_LANGUAGES = [
  {
    id: 'python',
    name: 'Python',
    svgPath: '/tech-logos/python.svg',
    brandColor: '#3776AB',
    badgeBg: '#3776AB',
    badgeText: '#FFFFFF',
    glowColor: 'rgba(55, 118, 171, 0.18)',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    svgPath: '/tech-logos/javascript.svg',
    brandColor: '#F7DF1E',
    badgeBg: '#F7DF1E',
    badgeText: '#111111',
    glowColor: 'rgba(247, 223, 30, 0.18)',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    svgPath: '/tech-logos/typescript.svg',
    brandColor: '#3178C6',
    badgeBg: '#3178C6',
    badgeText: '#FFFFFF',
    glowColor: 'rgba(49, 120, 198, 0.18)',
  },
  {
    id: 'react',
    name: 'React.js',
    svgPath: '/tech-logos/react.svg',
    brandColor: '#61DAFB',
    badgeBg: '#20232A',
    badgeText: '#61DAFB',
    glowColor: 'rgba(97, 218, 251, 0.18)',
  },
  {
    id: 'cplusplus',
    name: 'C++',
    svgPath: '/tech-logos/cplusplus.svg',
    brandColor: '#00599C',
    badgeBg: '#00599C',
    badgeText: '#FFFFFF',
    glowColor: 'rgba(0, 89, 156, 0.18)',
  },
  {
    id: 'java',
    name: 'Java',
    svgPath: '/tech-logos/java.svg',
    brandColor: '#EA2D2E',
    badgeBg: '#EA2D2E',
    badgeText: '#FFFFFF',
    glowColor: 'rgba(234, 45, 46, 0.18)',
  },
  {
    id: 'rust',
    name: 'Rust',
    svgPath: '/tech-logos/rust.svg',
    brandColor: '#CE412B',
    badgeBg: '#CE412B',
    badgeText: '#FFFFFF',
    glowColor: 'rgba(206, 65, 43, 0.18)',
  },
  {
    id: 'php',
    name: 'PHP',
    svgPath: '/tech-logos/php.svg',
    brandColor: '#777BB4',
    badgeBg: '#777BB4',
    badgeText: '#FFFFFF',
    glowColor: 'rgba(119, 123, 180, 0.18)',
  },
];

export function UirLogo3D({ className, autoPlayInterval = 3200 }: UirLogo3DProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = PROGRAMMING_LANGUAGES[currentIndex];

  const nextLanguage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % PROGRAMMING_LANGUAGES.length);
  }, []);

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

    const rotateY = ((x - centerX) / centerX) * 20;
    const rotateX = -((y - centerY) / centerY) * 20;

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
        'relative group cursor-pointer select-none flex flex-col items-center justify-between rounded-2xl border border-[#E2E3E4] bg-[#FFFFFF] transition-all duration-300',
        'w-full h-56 sm:h-64 overflow-hidden p-5',
        className
      )}
      style={{
        perspective: '1000px',
      }}
      title={`Logo 3D ${currentLang.name} - Klik untuk ganti bahasa pemrograman`}
    >
      {/* Ambient Glow Sesuai Warna Brand Logo Aktif */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 transition-all duration-700 rounded-2xl"
        style={{
          background: `radial-gradient(circle at center, ${currentLang.glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* Panggung Perspektif 3D Utama */}
      <div
        className="relative w-full flex-1 flex flex-col items-center justify-center my-auto z-10"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className={cn(
            'relative w-[130px] h-[130px] sm:w-[145px] sm:h-[145px] flex items-center justify-center transition-transform duration-300 ease-out',
            !isHovered && 'animate-uir-perspective'
          )}
          style={{
            transform: isHovered
              ? `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1.08, 1.08, 1.08)`
              : undefined,
            transformStyle: 'preserve-3d',
          }}
        >
          {PROGRAMMING_LANGUAGES.map((lang, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={lang.id}
                className={cn(
                  'absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-700',
                  isActive
                    ? 'opacity-100 scale-100 translate-y-0 rotate-0 filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.16)]'
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
                    className="object-contain"
                    priority={idx === 0}
                    sizes="(max-width: 640px) 130px, 145px"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={cn(
            'absolute bottom-1 w-[110px] sm:w-[130px] h-[12px] rounded-full bg-[#111111]/15 blur-[4px] pointer-events-none transition-all',
            !isHovered && 'animate-uir-perspective-shadow'
          )}
          style={{
            transform: isHovered
              ? `scale(${1 - Math.abs(rotate.x) / 70}) translateX(${rotate.y * 0.8}px)`
              : undefined,
          }}
        />
      </div>

      {/* Pill Indikator Nama Bahasa Pemrograman */}
      <div
        className="relative z-20 flex items-center px-3.5 py-1 rounded-full border border-[#E2E3E4] mt-1 transition-all duration-500"
        style={{
          backgroundColor: currentLang.badgeBg,
          color: currentLang.badgeText,
        }}
      >
        <span className="font-heading font-bold text-[11px] uppercase tracking-wider">
          {currentLang.name}
        </span>
      </div>
    </div>
  );
}

export const TechLogo3D = UirLogo3D;
