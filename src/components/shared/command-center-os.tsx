'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Terminal,
  ArrowRight,
  CalendarCheck2,
  ClipboardList,
  Activity,
  History,
  Calculator,
  BookOpen,
  Sparkles,
  CornerDownLeft,
  X,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommandNavGroup {
  id: string;
  title?: string;
  items: Array<{
    id: string;
    label: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }>;
}

interface CommandCenterOSProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  roleName: string;
  navGroups: CommandNavGroup[];
}

interface CommandEntry {
  id: string;
  category: 'command' | 'class' | 'menu';
  title: string;
  subtitle: string;
  keywords: string;
  href: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CONNECTED_UIR_CLASSES: CommandEntry[] = [
  {
    id: 'cls-web',
    category: 'class',
    title: 'Pemrograman Web & Arsitektur Cloud — Kelas IF-3A',
    subtitle: 'Kode MK: STI2544138 · 3 SKS · 3C.2.05 - TEKNIK C',
    keywords: 'web pemrograman cloud sti2544138 if 3a nextjs',
    href: '/classes/c0000000-0000-0000-0000-000000000001',
    badge: '3 SKS',
    icon: BookOpen,
  },
  {
    id: 'cls-sda',
    category: 'class',
    title: 'Algoritma & Struktur Data Lanjut — Kelas IF-3B',
    subtitle: 'Kode MK: STI2543131 · 3 SKS · Computer System LAB - TEKNIK C',
    keywords: 'sda struktur data algoritma sti2543131 if 3b pohon graf',
    href: '/classes/c0000000-0000-0000-0000-000000000002',
    badge: '3 SKS',
    icon: BookOpen,
  },
  {
    id: 'cls-sbd',
    category: 'class',
    title: 'Basis Data Terdistribusi & Big Data — Kelas IF-3C',
    subtitle: 'Kode MK: STI2541114 · 3 SKS · Mobile Lab - TEKNIK D',
    keywords: 'sbd basis data terdistribusi big data database sql sti2541114 if 3c',
    href: '/classes/c0000000-0000-0000-0000-000000000003',
    badge: '3 SKS',
    icon: BookOpen,
  },
];

export function CommandCenterOS({
  isOpen,
  onClose,
  role,
  roleName,
  navGroups,
}: CommandCenterOSProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
    }
  }, [isOpen]);

  // Deteksi perintah kalkulator IPK cepat: misalnya "target 3.75" atau "ipk 3.8"
  const ipkCalcResult = useMemo(() => {
    const clean = query.trim().toLowerCase();
    const match = clean.match(/^(?:target|ipk|simulasi)\s+([0-9]+(?:[.,][0-9]+)?)$/);
    if (!match) return null;
    const rawVal = parseFloat(match[1].replace(',', '.'));
    if (isNaN(rawVal) || rawVal <= 0 || rawVal > 4.0) return null;

    // Asumsi profil akademik berjalan: 84 SKS telah ditempuh dengan IPK 3.52, semester ini ambil 21 SKS
    const sksLama = 84;
    const ipkLama = 3.52;
    const sksSemesterIni = 21;
    const totalSks = sksLama + sksSemesterIni;
    const poinDibutuhkan = rawVal * totalSks - ipkLama * sksLama;
    const ipsMinimal = poinDibutuhkan / sksSemesterIni;

    return {
      targetIpk: rawVal.toFixed(2),
      ipsMinimal: Math.max(0, ipsMinimal).toFixed(2),
      isPossible: ipsMinimal <= 4.0,
      sksLama,
      ipkLama,
      sksSemesterIni,
    };
  }, [query]);

  // Susun daftar perintah pintar & menu
  const allEntries = useMemo<CommandEntry[]>(() => {
    const smartCommands: CommandEntry[] = [
      {
        id: 'cmd-absen',
        category: 'command',
        title: 'Perintah Cepat: Check-In Presensi Kuliah Hari Ini',
        subtitle: 'Ketik "absen" — Lompat ke sesi kehadiran aktif & verifikasi QR/GPS',
        keywords: 'absen presensi hadir kehadiran qr checkin kuliah hari ini',
        href: '/classes/c0000000-0000-0000-0000-000000000001?tab=presensi',
        badge: 'AKSI KILAT',
        icon: CalendarCheck2,
      },
      {
        id: 'cmd-radar',
        category: 'command',
        title: 'Barometer Pemahaman Materi Kelas (Anonim)',
        subtitle: 'Ketik "bingung" atau "radar" — Kirim sinyal anonim / pantau pemahaman kelas real-time',
        keywords: 'bingung radar paham kecepatan penjelasan interaktif pulse kelas',
        href: '/classes/c0000000-0000-0000-0000-000000000001?tab=interaksi',
        badge: 'INTERAKSI',
        icon: Activity,
      },
      {
        id: 'cmd-playback',
        category: 'command',
        title: 'Riwayat Ketikan & Verifikasi Pengerjaan Tugas',
        subtitle: 'Ketik "playback" — Rekam & putar riwayat ketikan pengerjaan tugas',
        keywords: 'playback time travel anti joki paste detector tugas riwayat ketikan kode',
        href: '/classes/c0000000-0000-0000-0000-000000000001?tab=tugas',
        badge: 'VERIFIKASI',
        icon: History,
      },
      {
        id: 'cmd-tugas',
        category: 'command',
        title: 'Perintah Cepat: Kumpul & Pantau Tenggat Tugas Terdekat',
        subtitle: 'Ketik "tugas" — Buka lembar pengerjaan & pengumpulan tugas aktif',
        keywords: 'tugas kumpul deadline praktikum lembar kerja',
        href: '/classes/c0000000-0000-0000-0000-000000000001?tab=tugas',
        badge: 'AKSI KILAT',
        icon: ClipboardList,
      },
      {
        id: 'cmd-ai',
        category: 'command',
        title: 'Tanya Asisten AI Akademik UIR',
        subtitle: 'Ketik "ai" — Diskusi materi perkuliahan, persiapan kuis, dan rangkuman modul',
        keywords: 'ai asisten tanya pintar rangkuman materi',
        href: '/ai-assistant',
        badge: 'AI RAG',
        icon: Sparkles,
      },
    ];

    const menuEntries: CommandEntry[] = [];
    for (const group of navGroups) {
      for (const item of group.items) {
        menuEntries.push({
          id: `menu-${item.id}`,
          category: 'menu',
          title: item.label,
          subtitle: group.title ? `Menu ${group.title} · ${roleName}` : `Menu Utama · ${roleName}`,
          keywords: `${item.label.toLowerCase()} ${group.title?.toLowerCase() || ''} ${item.href}`,
          href: item.href,
          badge: item.badge ? String(item.badge) : undefined,
          icon: item.icon || Compass,
        });
      }
    }

    return [...smartCommands, ...CONNECTED_UIR_CLASSES, ...menuEntries];
  }, [navGroups, roleName]);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return allEntries.slice(0, 10);
    }
    const terms = q.split(/\s+/);
    return allEntries
      .filter((entry) => {
        const haystack = `${entry.title} ${entry.subtitle} ${entry.keywords}`.toLowerCase();
        return terms.every((t) => haystack.includes(t));
      })
      .slice(0, 12);
  }, [allEntries, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = React.useCallback(
    (entry: CommandEntry) => {
      onClose();
      router.push(entry.href);
    },
    [onClose, router]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredEntries.length > 0 ? (prev + 1) % filteredEntries.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredEntries.length > 0
            ? (prev - 1 + filteredEntries.length) % filteredEntries.length
            : 0
        );
      } else if (e.key === 'Enter') {
        if (filteredEntries[selectedIndex]) {
          e.preventDefault();
          handleSelect(filteredEntries[selectedIndex]);
        } else if (query.trim()) {
          e.preventDefault();
          onClose();
          router.push(`/classes?q=${encodeURIComponent(query.trim())}`);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredEntries, selectedIndex, query, onClose, router, handleSelect]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-[#1C1917]/60 backdrop-blur-[2px] animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Velqora OS Command Center"
    >
      <div
        className="w-full max-w-2xl border-2 border-[#1C1917] bg-[#FAF8F5] shadow-retro-md overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar Retro Velqora OS */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#ECE9D8] border-b-2 border-[#7A756D]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onClose}
                className="h-3 w-3 rounded-full bg-[#FF5F56] border border-[#B31E17] cursor-pointer"
                title="Tutup (Esc)"
                aria-label="Tutup Command Center"
              />
              <span className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-[#B87A00]" />
              <span className="h-3 w-3 rounded-full bg-[#27C93F] border border-[#118022]" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917] tracking-wide">
              <Terminal className="h-3.5 w-3.5 text-[#C2553A]" />
              <span>Pencarian &amp; Navigasi Cepat — {roleName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-[#57534E] bg-[#FFFFFF] px-2 py-0.5 border border-[#B8B1A5]">
              ESC untuk tutup
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-0.5 text-[#1C1917] hover:bg-[#D6D3CB] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-[#FFFFFF] border-b-2 border-[#D6D3CB]">
          <div className="flex items-center gap-3 px-3 py-2 border-2 border-[#1C1917] bg-[#FAF8F5] focus-within:border-[#C2553A]">
            <Search className="h-5 w-5 text-[#C2553A] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Ketik perintah ("absen", "bingung", "playback", "target 3.80") atau cari mata kuliah & menu...'
              className="w-full bg-transparent text-sm sm:text-base font-bold text-[#1C1917] placeholder:text-[#78716C] placeholder:font-medium focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs font-bold text-[#57534E] hover:text-[#1C1917] px-1.5 py-0.5 bg-[#ECE9D8] border border-[#7A756D] cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Petunjuk Cepat */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] font-bold text-[#57534E] mr-1">Coba ketik:</span>
            {[
              { label: 'absen', cmd: 'absen' },
              { label: 'bingung (Radar Kelas)', cmd: 'bingung' },
              { label: 'playback (Anti-Joki)', cmd: 'playback' },
              { label: 'target 3.75', cmd: 'target 3.75' },
              { label: 'Struktur Data', cmd: 'Struktur Data' },
            ].map((chip) => (
              <button
                key={chip.cmd}
                type="button"
                onClick={() => setQuery(chip.cmd)}
                className="text-[11px] font-mono font-bold px-2 py-0.5 bg-[#F5F3EE] hover:bg-[#FEF2F0] text-[#1C1917] hover:text-[#C2553A] border border-[#B8B1A5] transition-colors cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Widget Kalkulator Target IPK Instan jika diketik "target X.XX" */}
        {ipkCalcResult && (
          <div className="p-4 bg-[#FEF2F0] border-b-2 border-[#C2553A] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#C2553A]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#853827]">
                  Simulasi Kalkulator Target IPK Instan
                </span>
              </div>
              <span
                className={cn(
                  'text-xs font-extrabold px-2.5 py-0.5 border',
                  ipkCalcResult.isPossible
                    ? 'bg-[#E8F5E9] text-[#065F46] border-[#059669]'
                    : 'bg-[#FEF2F2] text-[#991B1B] border-[#DC2626]'
                )}
              >
                {ipkCalcResult.isPossible ? 'REALISTIS DICAPAI' : 'MELAMPAUI BATAS 4.00'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 bg-[#FFFFFF] border border-[#D6D3CB]">
                <p className="text-[11px] font-bold text-[#57534E]">IPK Saat Ini ({ipkCalcResult.sksLama} SKS)</p>
                <p className="text-lg font-extrabold text-[#1C1917]">{ipkCalcResult.ipkLama}</p>
              </div>
              <div className="p-2.5 bg-[#FFFFFF] border border-[#D6D3CB]">
                <p className="text-[11px] font-bold text-[#57534E]">Target IPK Baru</p>
                <p className="text-lg font-extrabold text-[#C2553A]">{ipkCalcResult.targetIpk}</p>
              </div>
              <div className="p-2.5 bg-[#1C1917] text-white border border-[#1C1917]">
                <p className="text-[11px] font-bold text-[#D4D4D8]">Minimal IPS ({ipkCalcResult.sksSemesterIni} SKS)</p>
                <p className="text-lg font-extrabold text-[#FDE047]">{ipkCalcResult.ipsMinimal}</p>
              </div>
            </div>
          </div>
        )}

        {/* Daftar Hasil Pencarian & Perintah */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-[#E8E5DE] bg-[#FFFFFF]">
          {filteredEntries.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-bold text-[#1C1917]">
                Tidak ditemukan perintah atau menu untuk &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-[#57534E]">
                Tekan <strong>Enter</strong> untuk mencari langsung di katalog Kelas &amp; Mata Kuliah.
              </p>
            </div>
          ) : (
            filteredEntries.map((entry, idx) => {
              const Icon = entry.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleSelect(entry)}
                  className={cn(
                    'w-full px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer',
                    isSelected ? 'bg-[#FEF2F0]' : 'hover:bg-[#FAF8F5]'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'p-2 border shrink-0',
                        entry.category === 'command'
                          ? 'bg-[#C2553A] text-white border-[#6B2D20]'
                          : entry.category === 'class'
                          ? 'bg-[#ECE9D8] text-[#1C1917] border-[#7A756D]'
                          : 'bg-[#FAF8F5] text-[#1C1917] border-[#B8B1A5]'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold text-[#1C1917] truncate">
                          {entry.title}
                        </p>
                        {entry.badge && (
                          <span
                            className={cn(
                              'text-[10px] font-mono font-extrabold px-1.5 py-0.5 border shrink-0',
                              entry.category === 'command'
                                ? 'bg-[#FEF2F0] text-[#853827] border-[#C2553A]'
                                : 'bg-[#F5F3EE] text-[#1C1917] border-[#7A756D]'
                            )}
                          >
                            {entry.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#57534E] font-medium truncate mt-0.5">
                        {entry.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#853827] bg-[#FFFFFF] px-2 py-0.5 border border-[#C2553A]">
                        <span>Buka</span>
                        <CornerDownLeft className="h-3 w-3" />
                      </span>
                    )}
                    <ArrowRight
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isSelected ? 'text-[#C2553A] translate-x-0.5' : 'text-[#A8A29E]'
                      )}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Status Bar */}
        <div className="px-4 py-2 bg-[#ECE9D8] border-t-2 border-[#7A756D] flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-[#44403C]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-[#FFFFFF] border border-[#7A756D] text-[10px]">↑↓</kbd> Navigasi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-[#FFFFFF] border border-[#7A756D] text-[10px]">Enter</kbd> Eksekusi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-[#FFFFFF] border border-[#7A756D] text-[10px]">Esc</kbd> Tutup
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#853827]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Terhubung Kurikulum TI UIR 2026/2027</span>
          </div>
        </div>
      </div>
    </div>
  );
}
