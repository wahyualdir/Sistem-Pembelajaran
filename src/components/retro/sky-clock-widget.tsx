'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { SkyShaderCanvas } from './sky-shader-canvas';

export type SkyPhase = 'DAWN' | 'DAY' | 'SUNSET' | 'NIGHT';

interface SkyClockWidgetProps {
  className?: string;
  forcedPhase?: SkyPhase | null;
}

function getPhaseFromHour(hour: number): SkyPhase {
  if (hour >= 5 && hour < 7) return 'DAWN';
  if (hour >= 7 && hour < 16) return 'DAY';
  if (hour >= 16 && hour < 18.5) return 'SUNSET';
  return 'NIGHT';
}

export function SkyClockWidget({ className, forcedPhase = null }: SkyClockWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [overridePhase, setOverridePhase] = useState<SkyPhase | null>(forcedPhase);

  // Update clock every second
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime ? currentTime.getHours() + currentTime.getMinutes() / 60 : 12;
  const naturalPhase = useMemo(() => getPhaseFromHour(currentHour), [currentHour]);
  const activePhase = overridePhase ?? naturalPhase;

  // Format digital clock (HH:mm:ss)
  const timeString = useMemo(() => {
    if (!currentTime) return '12:00:00';
    return currentTime.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/\./g, ':');
  }, [currentTime]);

  // Format full date in Indonesian
  const dateString = useMemo(() => {
    if (!currentTime) return 'Senin, 19 Okt 2026';
    return currentTime.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [currentTime]);

  // Phase metadata for mountain horizon colors & greetings
  const phaseConfig = useMemo(() => {
    switch (activePhase) {
      case 'DAWN':
        return {
          id: 'DAWN' as SkyPhase,
          greeting: 'Selamat Pagi',
          gradient: 'linear-gradient(180deg, #1e1b4b 0%, #4c1d95 30%, #9f1239 65%, #ea580c 85%, #fde047 100%)',
          mountainFar: '#44144e',
          mountainMid: '#2d0a36',
          mountainNear: '#17051c',
          valleyMist: 'rgba(254, 215, 170, 0.25)',
        };
      case 'DAY':
        return {
          id: 'DAY' as SkyPhase,
          greeting: 'Selamat Siang',
          gradient: 'linear-gradient(180deg, #0284c7 0%, #0ea5e9 30%, #38bdf8 65%, #bae6fd 100%)',
          mountainFar: '#0369a1',
          mountainMid: '#075985',
          mountainNear: '#0c4a6e',
          valleyMist: 'rgba(255, 255, 255, 0.3)',
        };
      case 'SUNSET':
        return {
          id: 'SUNSET' as SkyPhase,
          greeting: 'Selamat Sore',
          gradient: 'linear-gradient(180deg, #0f172a 0%, #312e81 25%, #701a75 50%, #9f1239 70%, #ea580c 85%, #fef08a 100%)',
          mountainFar: '#3b0744',
          mountainMid: '#26042c',
          mountainNear: '#140217',
          valleyMist: 'rgba(251, 146, 60, 0.25)',
        };
      case 'NIGHT':
      default:
        return {
          id: 'NIGHT' as SkyPhase,
          greeting: 'Selamat Malam',
          gradient: 'linear-gradient(180deg, #020617 0%, #050b1a 30%, #0b152d 65%, #182247 100%)',
          mountainFar: '#0f172a',
          mountainMid: '#090d16',
          mountainNear: '#020617',
          valleyMist: 'rgba(148, 163, 184, 0.12)',
        };
    }
  }, [activePhase]);

  // Cycle phase on click for seamless testing
  const cyclePhase = () => {
    const phases: SkyPhase[] = ['DAWN', 'DAY', 'SUNSET', 'NIGHT'];
    const currentIdx = phases.indexOf(activePhase);
    const nextIdx = (currentIdx + 1) % phases.length;
    setOverridePhase(phases[nextIdx]);
  };

  return (
    <div
      onClick={cyclePhase}
      className={cn(
        'relative group cursor-pointer select-none flex flex-col justify-between rounded-2xl border-2 border-black shadow-retro transition-all duration-700 overflow-hidden',
        'w-full h-80 sm:h-88 md:h-[350px]',
        className
      )}
      style={{
        background: phaseConfig.gradient,
      }}
      title="Klik untuk melihat animasi fase langit lainnya"
    >
      {/* ======================================================== */}
      {/* 1. AREA LANGIT GLSL SHADER (ANIMASI ATMOSFERIK PER-PIKSEL) */}
      {/* ======================================================== */}
      <SkyShaderCanvas phase={activePhase} />

      {/* ======================================================== */}
      {/* 2. LAYER VEKTOR ELEGAN (BURUNG & SILUET CAKRAWALA KAMPUS) */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Burung Melayang Anggun (Hanya di Siang, Fajar, Senja) */}
        {activePhase !== 'NIGHT' && (
          <>
            <div className="absolute top-10 left-0 animate-sky-bird-1 opacity-70">
              <svg width="20" height="9" viewBox="0 0 24 10" fill="none" className="text-black/70">
                <path d="M0 6 Q6 0 12 5 Q18 0 24 6 Q18 3 12 8 Q6 3 0 6 Z" fill="currentColor" />
              </svg>
            </div>
            <div className="absolute top-16 left-0 animate-sky-bird-2 opacity-50">
              <svg width="15" height="7" viewBox="0 0 24 10" fill="none" className="text-black/60">
                <path d="M0 6 Q6 0 12 5 Q18 0 24 6 Q18 3 12 8 Q6 3 0 6 Z" fill="currentColor" />
              </svg>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* SILUET CAKRAWALA PEGUNUNGAN & LANDMARK KAMPUS             */}
        {/* ======================================================== */}
        {/* Layer 1: Pegunungan Jauh (Alpine Peaks) */}
        <div className="absolute bottom-16 left-0 right-0 h-28 opacity-50 transition-colors duration-1000">
          <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,70 L30,45 L65,60 L105,32 L145,55 L190,26 L235,58 L275,34 L325,60 L365,38 L400,65 L400,120 L0,120 Z"
              fill={phaseConfig.mountainFar}
            />
          </svg>
        </div>

        {/* Layer 2: Kabut Lembah Mengambang (Valley Mist) */}
        <div
          className="absolute bottom-14 left-0 right-0 h-8 opacity-75 blur-[1px] transition-colors duration-1000"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${phaseConfig.valleyMist} 50%, transparent 100%)`,
          }}
        />

        {/* Layer 3: Perbukitan Tengah (Rolling Mid Hills) */}
        <div className="absolute bottom-12 left-0 right-0 h-22 opacity-80 transition-colors duration-1000">
          <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,82 Q45,52 95,68 T205,50 T315,64 T400,56 L400,120 L0,120 Z"
              fill={phaseConfig.mountainMid}
            />
          </svg>
        </div>

        {/* Layer 4: Siluet Bukit Depan + Hutan Pinus + Menara Kampus & Observatorium */}
        <div className="absolute bottom-10 left-0 right-0 h-18 opacity-95 transition-colors duration-1000">
          <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,90 
                 L15,84 L20,90 L26,82 L32,90 L40,86 L48,92 
                 Q90,75 160,82 
                 L165,72 L170,82 L178,74 L184,83 
                 Q230,76 290,85 
                 L335,85 L335,62 L339,62 L339,52 L343,45 L347,52 L347,62 L351,62 L351,85 
                 Q380,88 400,84 L400,120 L0,120 Z"
              fill={phaseConfig.mountainNear}
            />
            {/* Lampu Peringatan Pesawat Merah Berkelip di Puncak Menara Kampus */}
            <circle cx="343" cy="43" r="1.8" fill="#ef4444" className="animate-sky-beacon" />
            <circle cx="343" cy="43" r="3.5" fill="#ef4444" opacity="0.35" className="animate-ping" />
          </svg>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. DOCK JAM DIGITAL BERSIH, SOLID & BEBAS TUMPANG TINDIH  */}
      {/* ======================================================== */}
      <div className="relative z-20 w-full mt-auto p-3 sm:p-3.5">
        <div className="rounded-xl border-2 border-black bg-surface/95 backdrop-blur-md px-4 py-2.5 shadow-retro text-center flex flex-col items-center justify-center gap-1 transition-all">
          {/* Baris 1: Live Status Dot + Jam Digital Monospace Tebal + WIB */}
          <div className="flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  overridePhase ? 'bg-amber-400' : 'bg-emerald-400'
                )}
              />
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2 border border-black',
                  overridePhase ? 'bg-amber-500' : 'bg-emerald-500'
                )}
              />
            </span>

            <span className="font-mono font-black text-2xl sm:text-3xl text-ink tracking-tight tabular-nums leading-none">
              {timeString}
            </span>

            <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded border border-black/30 bg-gray-soft text-black uppercase">
              WIB
            </span>
          </div>

          {/* Baris 2: Hari, Tanggal Lengkap & Sapaan Waktu */}
          <div className="flex items-center justify-center gap-1.5 text-xs font-sans font-bold text-ink/85 flex-wrap">
            <span>{dateString}</span>
            <span className="text-black/30 font-bold">•</span>
            <span className="text-black font-extrabold">{phaseConfig.greeting}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
