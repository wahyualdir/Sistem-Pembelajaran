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
          gradient: 'linear-gradient(180deg, #020617 0%, #050b1a 25%, #0b152d 55%, #182247 80%, #090d16 100%)',
          mountainFar: '#0b1329',
          mountainMid: '#070c1b',
          mountainNear: '#04070e',
          valleyMist: 'rgba(56, 189, 248, 0.08)',
        };
    }
  }, [activePhase]);

  return (
    <div
      className={cn(
        'relative w-full rounded-2xl border-2 border-[#7A756D] overflow-hidden shadow-xs flex flex-col justify-between transition-all select-none',
        className
      )}
      style={{ minHeight: '190px' }}
    >
      {/* 1. Sky Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <SkyShaderCanvas phase={activePhase} className="w-full h-full" />
      </div>

      {/* 2. Vector Mountain Silhouette Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end">
        {/* Layer 1: Pegunungan Jauh */}
        <div className="w-full h-[55%] opacity-40">
          <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,75 Q40,35 80,60 T160,45 T240,65 T320,40 T400,70 L400,120 L0,120 Z"
              fill={phaseConfig.mountainFar}
            />
          </svg>
        </div>

        {/* Kabut Lembah Tipis */}
        <div
          className="w-full h-[25px] -mt-5 pointer-events-none blur-[6px] opacity-70"
          style={{ backgroundColor: phaseConfig.valleyMist }}
        />

        {/* Layer 2: Pegunungan Tengah */}
        <div className="w-full h-[45%] opacity-75 -mt-3">
          <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,65 L35,45 L70,68 L115,38 L160,72 L210,48 L265,75 L310,42 L360,65 L400,50 L400,120 L0,120 Z"
              fill={phaseConfig.mountainMid}
            />
          </svg>
        </div>

        {/* Layer 3: Siluet Bukit & Menara Kampus Dekat */}
        <div className="w-full h-[38%] -mt-2">
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
        <div className="rounded-xl border-2 border-[#7A756D] bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-xs text-center flex flex-col items-center justify-center gap-1 transition-all">
          {/* Baris 1: Live Status Dot + Jam Digital SF Pro Tebal + WIB */}
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
                  'relative inline-flex rounded-full h-2 w-2 border border-[#7A756D]',
                  overridePhase ? 'bg-amber-500' : 'bg-emerald-500'
                )}
              />
            </span>

            <span className="font-sans font-black text-2xl sm:text-3xl text-[#1C1917] tracking-tight tabular-nums leading-none">
              {timeString}
            </span>

            <span className="text-xs font-sans font-extrabold px-1.5 py-0.5 rounded border border-[#7A756D] bg-[#ECE9D8] text-[#1C1917] uppercase">
              WIB
            </span>
          </div>

          {/* Baris 2: Hari, Tanggal Lengkap & Sapaan Waktu */}
          <div className="flex items-center justify-center gap-1.5 text-xs font-sans font-bold text-[#1C1917] flex-wrap">
            <span>{dateString}</span>
            <span className="text-[#7A756D] font-bold">•</span>
            <span className="text-[#853827] font-extrabold">{phaseConfig.greeting}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
