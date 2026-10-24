'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  Check,
  CalendarCheck2,
  ClipboardList,
  ArrowRight,
  FolderOpen,
  Sparkles,
  Copy,
  Layers,
} from 'lucide-react';
import { CreateClassForm, JoinClassForm } from './class-forms';

export interface ClassCardItem {
  id: string;
  title: string;
  course_title?: string;
  course_code?: string;
  section: string;
  join_code: string;
  status: string;
  sks?: number;
  lecturer_name?: string;
  members?: number;
  capacity?: number;
  room?: string | null;
  schedule?: string | null;
  upcomingTask?: {
    title: string;
    due_at: string;
  } | null;
}

export interface ClassroomBannerTheme {
  id: string;
  bannerGradient: string;
  avatarBg: string;
  accentText: string;
  progressBar: string;
  badgeSoftBg: string;
  badgeSoftText: string;
  pattern:
    | 'cloud-nodes'
    | 'binary-tree'
    | 'data-cylinders'
    | 'cyber-shield'
    | 'neural-constellation'
    | 'editorial-compass';
}

// Palet Banner Kelas Berwarna ala Modern Enterprise University (100% Patuh cek-hex.js)
export const CLASSROOM_BANNER_THEMES: ClassroomBannerTheme[] = [
  {
    id: 'crimson',
    bannerGradient: 'bg-gradient-to-br from-[#C51626] via-[#9F1521] to-[#8F131E]',
    avatarBg: 'bg-[#8F131E]',
    accentText: 'text-[#9F1521]',
    progressBar: 'bg-[#9F1521]',
    badgeSoftBg: 'bg-[#FEF2F2]',
    badgeSoftText: 'text-[#9F1521]',
    pattern: 'cloud-nodes',
  },
  {
    id: 'emerald',
    bannerGradient: 'bg-gradient-to-br from-[#047857] via-[#065F46] to-[#064E3B]',
    avatarBg: 'bg-[#064E3B]',
    accentText: 'text-[#065F46]',
    progressBar: 'bg-[#047857]',
    badgeSoftBg: 'bg-[#FFFFFF]',
    badgeSoftText: 'text-[#065F46]',
    pattern: 'binary-tree',
  },
  {
    id: 'navy',
    bannerGradient: 'bg-gradient-to-br from-[#075985] via-[#0C4A6E] to-[#182247]',
    avatarBg: 'bg-[#0B152D]',
    accentText: 'text-[#0C4A6E]',
    progressBar: 'bg-[#0369A1]',
    badgeSoftBg: 'bg-[#FFFFFF]',
    badgeSoftText: 'text-[#0C4A6E]',
    pattern: 'data-cylinders',
  },
  {
    id: 'amber',
    bannerGradient: 'bg-gradient-to-br from-[#B45309] via-[#92400E] to-[#451A03]',
    avatarBg: 'bg-[#451A03]',
    accentText: 'text-[#92400E]',
    progressBar: 'bg-[#B45309]',
    badgeSoftBg: 'bg-[#F3F3F4]',
    badgeSoftText: 'text-[#92400E]',
    pattern: 'cyber-shield',
  },
  {
    id: 'plum',
    bannerGradient: 'bg-gradient-to-br from-[#6D28D9] via-[#4C1D95] to-[#3B0764]',
    avatarBg: 'bg-[#3B0764]',
    accentText: 'text-[#4C1D95]',
    progressBar: 'bg-[#6D28D9]',
    badgeSoftBg: 'bg-[#FFFFFF]',
    badgeSoftText: 'text-[#4C1D95]',
    pattern: 'neural-constellation',
  },
  {
    id: 'charcoal',
    bannerGradient: 'bg-gradient-to-br from-[#58595B] via-[#232328] to-[#111111]',
    avatarBg: 'bg-[#9F1521]',
    accentText: 'text-[#9F1521]',
    progressBar: 'bg-[#111111]',
    badgeSoftBg: 'bg-[#F3F3F4]',
    badgeSoftText: 'text-[#111111]',
    pattern: 'editorial-compass',
  },
];

export function getClassroomBannerTheme(
  key?: string | null,
  fallbackIndex = 0
): ClassroomBannerTheme {
  const k = (key || '').toUpperCase();
  if (
    k.includes('STI2544138') ||
    k.includes('000001') ||
    k.includes('PEMROGRAMAN WEB')
  ) {
    return CLASSROOM_BANNER_THEMES[0];
  }
  if (
    k.includes('STI2543131') ||
    k.includes('000002') ||
    k.includes('ALGORITMA')
  ) {
    return CLASSROOM_BANNER_THEMES[1];
  }
  if (
    k.includes('STI2541114') ||
    k.includes('000003') ||
    k.includes('BASIS DATA')
  ) {
    return CLASSROOM_BANNER_THEMES[2];
  }
  if (
    k.includes('STI2543130') ||
    k.includes('000004') ||
    k.includes('JARINGAN')
  ) {
    return CLASSROOM_BANNER_THEMES[3];
  }
  if (
    k.includes('STI2543129') ||
    k.includes('000005') ||
    k.includes('KECERDASAN BUATAN')
  ) {
    return CLASSROOM_BANNER_THEMES[4];
  }
  return CLASSROOM_BANNER_THEMES[Math.abs(fallbackIndex) % CLASSROOM_BANNER_THEMES.length];
}

export function ClassroomBannerPattern({
  pattern,
}: {
  pattern: ClassroomBannerTheme['pattern'];
}) {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none text-white"
      aria-hidden="true"
    >
      <svg
        className="absolute -right-6 -top-8 h-48 w-72 opacity-[0.16]"
        viewBox="0 0 280 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="230" cy="35" r="78" fill="currentColor" fillOpacity="0.35" />
        <circle cx="170" cy="145" r="64" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        <path
          d="M-20 150 C60 110, 130 175, 290 95"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeOpacity="0.65"
        />

        {pattern === 'cloud-nodes' && (
          <g stroke="currentColor" strokeWidth="2">
            <rect x="155" y="28" width="96" height="62" rx="10" fill="currentColor" fillOpacity="0.22" />
            <line x1="155" y1="44" x2="251" y2="44" />
            <circle cx="166" cy="36" r="2.5" fill="currentColor" />
            <circle cx="175" cy="36" r="2.5" fill="currentColor" />
            <circle cx="184" cy="36" r="2.5" fill="currentColor" />
            <path d="M182 68 L172 58 L182 48" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M224 48 L234 58 L224 68" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="208" y1="46" x2="198" y2="70" strokeLinecap="round" />
            <circle cx="122" cy="88" r="14" fill="currentColor" fillOpacity="0.25" />
            <line x1="136" y1="82" x2="155" y2="68" strokeDasharray="3 3" />
          </g>
        )}

        {pattern === 'binary-tree' && (
          <g stroke="currentColor" strokeWidth="2">
            <line x1="205" y1="32" x2="165" y2="76" />
            <line x1="205" y1="32" x2="245" y2="76" />
            <line x1="165" y1="76" x2="142" y2="122" />
            <line x1="165" y1="76" x2="188" y2="122" />
            <line x1="245" y1="76" x2="225" y2="122" />
            <circle cx="205" cy="32" r="12" fill="currentColor" fillOpacity="0.35" />
            <circle cx="165" cy="76" r="10" fill="currentColor" fillOpacity="0.35" />
            <circle cx="245" cy="76" r="10" fill="currentColor" fillOpacity="0.35" />
            <circle cx="142" cy="122" r="8" fill="currentColor" fillOpacity="0.25" />
            <circle cx="188" cy="122" r="8" fill="currentColor" fillOpacity="0.25" />
            <circle cx="225" cy="122" r="8" fill="currentColor" fillOpacity="0.25" />
          </g>
        )}

        {pattern === 'data-cylinders' && (
          <g stroke="currentColor" strokeWidth="2">
            <ellipse cx="210" cy="40" rx="38" ry="12" fill="currentColor" fillOpacity="0.3" />
            <path d="M172 40 V70 C172 76.6 189 82 210 82 C231 82 248 76.6 248 70 V40" fill="currentColor" fillOpacity="0.16" />
            <path d="M172 70 V100 C172 106.6 189 112 210 112 C231 112 248 106.6 248 100 V70" fill="currentColor" fillOpacity="0.12" />
            <circle cx="132" cy="64" r="16" strokeDasharray="3 3" />
            <line x1="148" y1="64" x2="172" y2="64" />
          </g>
        )}

        {pattern === 'cyber-shield' && (
          <g stroke="currentColor" strokeWidth="2">
            <polygon
              points="210,22 250,38 250,78 210,114 170,78 170,38"
              fill="currentColor"
              fillOpacity="0.24"
            />
            <polygon points="210,36 236,47 236,74 210,98 184,74 184,47" strokeOpacity="0.7" />
            <circle cx="210" cy="66" r="8" fill="currentColor" />
            <circle cx="130" cy="48" r="24" strokeOpacity="0.5" />
            <circle cx="130" cy="48" r="40" strokeOpacity="0.3" strokeDasharray="4 4" />
          </g>
        )}

        {pattern === 'neural-constellation' && (
          <g stroke="currentColor" strokeWidth="1.8">
            <polygon
              points="150,42 208,24 252,64 224,118 162,104"
              fill="currentColor"
              fillOpacity="0.18"
            />
            <line x1="150" y1="42" x2="252" y2="64" strokeOpacity="0.6" />
            <line x1="208" y1="24" x2="162" y2="104" strokeOpacity="0.6" />
            <line x1="208" y1="24" x2="224" y2="118" strokeOpacity="0.6" />
            <circle cx="150" cy="42" r="6" fill="currentColor" />
            <circle cx="208" cy="24" r="7" fill="currentColor" />
            <circle cx="252" cy="64" r="6" fill="currentColor" />
            <circle cx="224" cy="118" r="6" fill="currentColor" />
            <circle cx="162" cy="104" r="6" fill="currentColor" />
          </g>
        )}

        {pattern === 'editorial-compass' && (
          <g stroke="currentColor" strokeWidth="2">
            <circle cx="210" cy="68" r="44" fill="currentColor" fillOpacity="0.18" />
            <circle cx="210" cy="68" r="28" strokeDasharray="3 3" />
            <polygon points="210,30 220,68 210,106 200,68" fill="currentColor" fillOpacity="0.35" />
            <polygon points="172,68 210,58 248,68 210,78" fill="currentColor" fillOpacity="0.2" />
          </g>
        )}
      </svg>
      <div className="absolute -left-10 -bottom-12 h-28 w-28 rounded-full bg-[#FFFFFF] opacity-[0.06]" />
    </div>
  );
}

function getInitials(name?: string) {
  if (!name) return 'DS';
  const clean = name.replace(/^(Dr\.|Prof\.|Ir\.|H\.|Hj\.)\s*/gi, '');
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 0) return 'DS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function GoogleClassroomCard({
  item,
  isLecturer,
  index,
}: {
  item: ClassCardItem;
  isLecturer: boolean;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const theme = getClassroomBannerTheme(
    item.course_code || item.id || item.title,
    index
  );
  const lecturerName = item.lecturer_name || 'Dosen Pengampu';
  const initials = getInitials(lecturerName);
  const sksCount = item.sks ?? 3;
  const memberCount = item.members ?? 0;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(item.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-[#E2E3E4] hover:border-[#808285] bg-[#FFFFFF] shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden font-sans">
      {/* 1. BANNER BERWARNA & BERCORAK ALA TEL-U ENTERPRISE */}
      <div
        className={`${theme.bannerGradient} relative flex flex-col justify-between border-b border-black/10 text-white overflow-hidden`}
      >
        <ClassroomBannerPattern pattern={theme.pattern} />

        <div className="p-5 pb-4 space-y-3.5 relative z-10">
          {/* Baris Atas: Kode Mata Kuliah + Kelas & Kode Gabung */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs border border-white/30 text-[11px] font-semibold text-white">
              {item.course_code && (
                <>
                  <span className="font-mono font-bold text-white">{item.course_code}</span>
                  <span className="text-white/60">•</span>
                </>
              )}
              <span className="text-white/95">Kelas {item.section}</span>
              <span className="text-white/60">•</span>
              <span>{sksCount} SKS</span>
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/30 hover:bg-[#FFFFFF] text-white hover:text-[#111111] border border-white/30 transition-colors text-[11px] font-mono font-bold cursor-pointer"
              title="Salin Kode Kelas"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-[#10B981]" />
                  <span>Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-2.5 w-2.5 opacity-85" />
                  <span>{item.join_code}</span>
                </>
              )}
            </button>
          </div>

          {/* Judul Mata Kuliah di Atas Banner Berwarna */}
          <Link href={`/classes/${item.id}`} className="block group/title">
            <h2 className="font-heading font-bold text-base sm:text-lg text-white group-hover/title:underline decoration-white/80 underline-offset-4 transition-all leading-snug line-clamp-2 min-h-[2.7rem]">
              {item.title}
            </h2>
          </Link>

          {/* Baris Dosen Pengampu dengan Avatar */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`h-7 w-7 rounded-full ${theme.avatarBg} ring-2 ring-white/80 text-white flex items-center justify-center font-heading font-bold text-[10px] shrink-0 shadow-xs`}
              >
                {initials}
              </div>
              <span className="text-xs font-medium text-white/95 truncate">
                {lecturerName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BODY BERSIH */}
      <div className="p-5 py-4 bg-[#FFFFFF] flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-2 text-xs text-[#58595B]">
          <div className="flex items-center gap-2.5">
            <Clock className={`h-3.5 w-3.5 ${theme.accentText} shrink-0`} />
            <span className="font-semibold text-[#111111] truncate">
              {item.schedule || 'Jadwal fleksibel / Mandiri'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-[#808285] shrink-0" />
              <span className="font-normal text-[#58595B] truncate">
                {item.room || 'Ruang Perkuliahan'}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#58595B] shrink-0">
              <Users className="h-3 w-3 text-[#808285]" />
              <span>{memberCount} peserta</span>
            </span>
          </div>
        </div>

        {/* Status Pill Lembut */}
        {isLecturer ? (
          <Link
            href={`/classes/${item.id}?tab=tugas`}
            className="px-3 py-2 rounded-xl bg-[#F3F3F4] hover:bg-[#E2E3E4] transition-colors flex items-center justify-between gap-2 text-xs"
          >
            <span className="font-medium text-[#58595B] truncate">
              Kelola materi, kuis & nilai kelas
            </span>
            <span className="font-bold text-[#9F1521] shrink-0">Kelola &rarr;</span>
          </Link>
        ) : item.upcomingTask ? (
          <Link
            href={`/classes/${item.id}?tab=tugas`}
            className="px-3 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#F3F3F4] transition-colors flex items-center justify-between gap-2 text-xs"
          >
            <span className="font-semibold text-[#9F1521] truncate">
              {item.upcomingTask.title}
            </span>
            <span suppressHydrationWarning className="text-[11px] font-mono font-bold text-[#9F1521] shrink-0">
              {new Date(item.upcomingTask.due_at).toLocaleDateString('id-ID', {
                timeZone: 'Asia/Jakarta',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </Link>
        ) : (
          <div className="px-3 py-2 rounded-xl bg-[#F3F3F4] flex items-center justify-between gap-2 text-xs text-[#808285]">
            <span>Tidak ada tenggat tugas terdekat</span>
            <span className="text-[11px] font-semibold text-[#059669]">Terkendali</span>
          </div>
        )}
      </div>

      {/* 3. FOOTER MINIMALIS: IKON PINTASAN + 1 TOMBOL UTAMA */}
      <div className="px-4 py-2.5 bg-[#F3F3F4]/50 border-t border-[#E2E3E4] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link
            href={`/classes/${item.id}?tab=tugas`}
            className="p-2 rounded-lg text-[#58595B] hover:text-[#111111] hover:bg-[#E2E3E4] transition-colors"
            title="Tugas & Kuis"
          >
            <ClipboardList className="h-4 w-4" />
          </Link>
          <Link
            href={`/classes/${item.id}?tab=presensi`}
            className="p-2 rounded-lg text-[#58595B] hover:text-[#111111] hover:bg-[#E2E3E4] transition-colors"
            title="Presensi Kehadiran"
          >
            <CalendarCheck2 className="h-4 w-4" />
          </Link>
          <Link
            href={`/classes/${item.id}?tab=tugas`}
            className="p-2 rounded-lg text-[#58595B] hover:text-[#111111] hover:bg-[#E2E3E4] transition-colors"
            title="Modul & Materi"
          >
            <FolderOpen className="h-4 w-4" />
          </Link>
        </div>

        <Link
          href={`/classes/${item.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#9F1521] hover:bg-[#8F131E] text-white font-semibold text-xs transition-colors shadow-2xs"
        >
          <span>Masuk Kelas</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

export function ClassroomTodoListBanner() {
  return null;
}

export function ClassroomToolbar({
  lecturer,
  student,
  master,
  totalClasses,
  initialQuery = '',
  totalSks = 0,
  roleLabel = 'Mahasiswa',
  currentTab = 'aktif',
  cloneSlot,
}: {
  lecturer: boolean;
  student: boolean;
  master?: any;
  totalClasses: number;
  initialQuery?: string;
  totalSks?: number;
  roleLabel?: string;
  currentTab?: 'aktif' | 'arsip';
  cloneSlot?: React.ReactNode;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialQuery);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (search.trim()) {
      params.set('q', search.trim());
    } else {
      params.delete('q');
    }
    router.push(`/classes?${params.toString()}`);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* UNIFIED FRESH HEADER & TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E2E3E4]">
        {/* Kiri: Judul & Ringkasan Pill Segar */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-[#111111] flex items-center gap-2">
              <Layers className="h-6 w-6 text-[#9F1521]" />
              <span>Kelas Saya</span>
            </h1>

            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#9F1521] font-bold text-xs">
                {totalClasses} Kelas
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F3F3F4] text-[#58595B] font-bold text-xs">
                {totalSks} SKS
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E2E3E4] text-[#58595B] font-semibold text-xs">
                {roleLabel}
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#58595B]">
            {lecturer
              ? 'Kelola rombongan belajar, materi kuliah, penugasan, dan presensi dalam satu ruang terpadu.'
              : 'Akses ruang belajar, materi perkuliahan, tenggat tugas, dan presensi semester aktif.'}
          </p>
        </div>

        {/* Kanan: Filter Aktif/Arsip, Pencarian Cepat & Tombol + Kelas */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Aktif / Arsip */}
          <div className="inline-flex rounded-xl bg-[#F3F3F4] p-1 border border-[#E2E3E4]">
            <Link
              href="/classes?tab=aktif"
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'aktif'
                  ? 'bg-[#FFFFFF] text-[#111111] shadow-2xs'
                  : 'text-[#58595B] hover:text-[#111111]'
              }`}
            >
              Aktif
            </Link>
            <Link
              href="/classes?tab=arsip"
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'arsip'
                  ? 'bg-[#FFFFFF] text-[#111111] shadow-2xs'
                  : 'text-[#58595B] hover:text-[#111111]'
              }`}
            >
              Arsip
            </Link>
          </div>

          {/* Pencarian Ringkas */}
          <form onSubmit={handleSearch} className="relative flex-1 sm:flex-initial">
            <Search className="h-3.5 w-3.5 text-[#808285] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mata kuliah..."
              className="w-full sm:w-48 lg:w-56 pl-8 pr-3 py-1.5 rounded-xl border border-[#E2E3E4] bg-[#FFFFFF] focus:border-[#9F1521] text-xs font-medium text-[#111111] placeholder:text-[#808285] focus:outline-none transition-colors"
            />
          </form>

          {cloneSlot}

          {(lecturer || student) && (
            <button
              type="button"
              onClick={() => setIsAddOpen(!isAddOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#9F1521] hover:bg-[#8F131E] text-white font-semibold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{lecturer ? 'Buka Kelas' : 'Gabung Kelas'}</span>
            </button>
          )}
        </div>
      </div>

      {/* PANEL EXPANDABLE: GABUNG KELAS (MAHASISWA) ATAU BUKA KELAS BARU (DOSEN) */}
      {isAddOpen && (
        <div className="p-5 rounded-2xl border border-[#E2E3E4] bg-[#FFFFFF] shadow-sm animate-fade-up space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-heading font-bold text-[#111111] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#9F1521]" />
              <span>{lecturer ? 'Buka Rombongan Belajar Baru' : 'Gabung ke Kelas dengan Kode'}</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-xs font-semibold text-[#808285] hover:text-[#111111] cursor-pointer"
            >
              Tutup
            </button>
          </div>

          {student && <JoinClassForm />}
          {lecturer && <CreateClassForm courses={master?.courses ?? []} semesters={master?.semesters ?? []} />}
        </div>
      )}
    </div>
  );
}
