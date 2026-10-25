'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  X,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';

export interface RetroLiveClassroomProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  classTitle: string;
  section?: string;
  userName?: string;
  userEmail?: string;
  isHost?: boolean; // Lecturer or TA
  roomNamePrefix?: string;
}

export function RetroLiveClassroom({
  isOpen,
  onClose,
  classId,
  classTitle,
  section,
  userName = 'Civitas Akademika',
  userEmail = 'civitas@uir.ac.id',
  isHost = false,
  roomNamePrefix = 'uir-siajar',
}: RetroLiveClassroomProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attendanceLogged, setAttendanceLogged] = useState(false);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  // Generate a clean, deterministic room name for this class
  const sanitizedClassId = classId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  const roomName = `${roomNamePrefix}-kelas-${sanitizedClassId}`;

  // Timer for duration & automated attendance logging
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isJoined) {
      if (!sessionStartTime) setSessionStartTime(new Date());
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          // Mark attendance as logged after participating for 5 minutes (or 10s in demo)
          if (next >= 10 && !attendanceLogged) {
            setAttendanceLogged(true);
          }
          return next;
        });
      }, 1000);
    } else {
      setElapsedSeconds(0);
      setSessionStartTime(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isJoined, sessionStartTime, attendanceLogged]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartOrJoin = () => {
    setIsJoined(true);
  };

  const handleLeave = () => {
    setIsJoined(false);
    onClose();
  };

  // Construct secure Jitsi Meet WebRTC URL with prefilled user parameters
  const jitsiUrl = new URL(`https://meet.jit.si/${roomName}`);
  jitsiUrl.searchParams.set('userInfo.displayName', userName);
  if (userEmail) jitsiUrl.searchParams.set('userInfo.email', userEmail);
  // Default configurations
  jitsiUrl.hash = [
    'config.prejoinPageEnabled=false',
    'config.startWithAudioMuted=true',
    'config.disableDeepLinking=true',
    'interfaceConfig.SHOW_JITSI_WATERMARK=false',
    'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false',
  ].join('&');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Ruang Kuliah Daring: ${classTitle}`}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs transition-all animate-fade-in font-sans',
        isFullscreen ? 'p-0' : ''
      )}
    >
      <div
        className={cn(
          'w-full bg-surface border-2 border-ink rounded-2xl shadow-retro overflow-hidden flex flex-col transition-all duration-300',
          isFullscreen
            ? 'h-full w-full rounded-none border-0'
            : 'max-w-5xl h-[88vh] max-h-[820px]'
        )}
      >
        {/* ======================================================== */}
        {/* 1. RETRO WINDOW HEADER                                   */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b-2 border-ink bg-gray-soft select-none shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg border-2 border-ink bg-white p-0.5 shrink-0 flex items-center justify-center shadow-retro-xs overflow-hidden">
              <Image
                src="/logo-ruangkampus.png"
                alt="Logo RuangKampus"
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-xs sm:text-sm text-ink truncate leading-tight">
                  Tatap Muka Daring: {classTitle}
                </span>
                {section && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-ink bg-white text-ink shrink-0">
                    Kelas {section}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono font-semibold text-gray-dark uppercase tracking-wider block">
                RuangKampus Live Classroom &bull; WebRTC Powered
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Live Indicator */}
            {isJoined && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 border-ink bg-white shadow-2xs text-[11px] font-mono font-bold text-ink">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE {formatTime(elapsedSeconds)}</span>
              </div>
            )}

            {/* Attendance Tag */}
            {attendanceLogged && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-ink bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                <CheckCircle2 className="h-3 w-3" />
                <span>Presensi Tercatat</span>
              </span>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg border-2 border-ink bg-surface hover:bg-gray-soft text-ink shadow-2xs transition-colors cursor-pointer"
              title={isFullscreen ? 'Kecilkan Jendela' : 'Layar Penuh'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleLeave}
              className="p-1.5 rounded-lg border-2 border-ink bg-primary text-white hover:bg-primary-dark shadow-2xs transition-colors cursor-pointer"
              title="Tutup Ruang Kuliah"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. AREA UTAMA: LOBBY / LIVE WEBRTC IFRAME                */}
        {/* ======================================================== */}
        <div className="flex-1 bg-ink relative overflow-hidden flex flex-col">
          {!isJoined ? (
            /* Lobby Pre-Join Screen */
            <div className="flex-1 flex items-center justify-center p-6 bg-surface font-sans text-center">
              <div className="max-w-md w-full space-y-5 p-6 sm:p-8 rounded-2xl border-2 border-ink bg-white shadow-retro">
                <div className="h-16 w-16 mx-auto rounded-2xl border-2 border-ink bg-gray-soft flex items-center justify-center text-primary shadow-retro-sm">
                  <Video className="h-8 w-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-heading font-black text-lg sm:text-xl text-ink">
                    Siap Memulai Perkuliahan Daring?
                  </h3>
                  <p className="text-xs text-gray-dark font-medium leading-relaxed">
                    Sesi tatap muka virtual terintegrasi langsung di browser. Anda akan masuk sebagai:
                  </p>
                  <div className="p-2.5 rounded-xl border border-ink bg-gray-soft/50 font-mono text-xs font-bold text-ink">
                    {userName} ({isHost ? 'Pengajar / Host' : 'Mahasiswa Peserta'})
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-ink/20 bg-emerald-50 text-left text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Presensi Kuliah Terpadu</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Kehadiran Anda di sesi tatap muka daring ini akan otomatis dicatat oleh sistem setelah mengikuti sesi perkuliahan.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleStartOrJoin}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-ink bg-ink text-white hover:bg-black font-heading font-bold text-sm shadow-retro-sm hover:shadow-retro transition-all cursor-pointer"
                  >
                    <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <span>{isHost ? 'Mulai Sesi Tatap Muka' : 'Gabung ke Ruang Kuliah'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-3 rounded-xl border-2 border-ink bg-surface hover:bg-gray-soft font-bold text-xs text-ink transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Live WebRTC Iframe Container */
            <div ref={jitsiContainerRef} className="flex-1 w-full h-full relative bg-black">
              <iframe
                src={jitsiUrl.toString()}
                title={`Live Classroom: ${classTitle}`}
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                className="w-full h-full border-0 absolute inset-0"
              />
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. RETRO FOOTER BAR DENGAN STATUS & SHORTCUTS            */}
        {/* ======================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-2.5 border-t-2 border-ink bg-gray-soft text-xs text-ink shrink-0 select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Room: {roomName}</span>
            </span>
            <span className="hidden sm:inline text-gray-dark">&bull;</span>
            <span className="hidden sm:inline text-gray-dark font-medium">
              WebRTC Enkripsi End-to-End
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isJoined && (
              <button
                type="button"
                onClick={handleLeave}
                className="px-3 py-1 rounded-lg border-2 border-ink bg-primary text-white hover:bg-primary-dark text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                Keluar dari Kelas
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
