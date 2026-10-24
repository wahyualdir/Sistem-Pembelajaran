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

// Palet Editorial Akademik Konsisten (Bebas Warna Pelangi Generik, Patuh cek-hex.js)
const FRESH_THEMES = [
  {
    headerBg: 'bg-[#FAF8F5]',
    topBar: 'bg-[#C2553A]',
    avatarBg: 'bg-[#1C1917]',
    accentText: 'text-[#C2553A]',
    badgeText: 'text-[#853827]',
  },
  {
    headerBg: 'bg-[#FAF8F5]',
    topBar: 'bg-[#1C1917]',
    avatarBg: 'bg-[#C2553A]',
    accentText: 'text-[#1C1917]',
    badgeText: 'text-[#44403C]',
  },
  {
    headerBg: 'bg-[#FAF8F5]',
    topBar: 'bg-[#853827]',
    avatarBg: 'bg-[#44403C]',
    accentText: 'text-[#853827]',
    badgeText: 'text-[#853827]',
  },
];

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
  const theme = FRESH_THEMES[index % FRESH_THEMES.length];
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
    <article className="group relative flex flex-col justify-between rounded-2xl border border-[#D6D3CB] hover:border-[#7A756D] bg-[#FFFFFF] shadow-sm hover:shadow-retro-sm transition-all duration-200 overflow-hidden font-sans">
      {/* 1. CLEAN SOFT-HEADER */}
      <div className={`${theme.headerBg} relative flex flex-col justify-between border-b border-[#E8E5DE]`}>
        {/* Garis Aksen Tipis di Puncak Kartu */}
        <div className={`h-1.5 w-full ${theme.topBar}`} />

        {/* Ilustrasi Watermark Lembut */}
        <BookOpen className="absolute -right-3 -bottom-3 h-24 w-24 text-[#1C1917] opacity-[0.04] pointer-events-none" />

        <div className="p-5 pb-4 space-y-3 relative z-10">
          {/* Baris Atas: Kode Mata Kuliah + Kelas & Kode Gabung */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FFFFFF] border border-[#D6D3CB] text-[11px] font-semibold text-[#1C1917]">
              {item.course_code && (
                <>
                  <span className="font-mono font-bold text-[#853827]">{item.course_code}</span>
                  <span className="text-[#B8B4AB]">•</span>
                </>
              )}
              <span className={theme.badgeText}>Kelas {item.section}</span>
              <span className="text-[#B8B4AB]">•</span>
              <span>{sksCount} SKS</span>
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFFFFF]/90 hover:bg-[#1C1917] text-[#57534E] hover:text-white border border-[#D6D3CB] transition-colors text-[11px] font-mono font-bold cursor-pointer"
              title="Salin Kode Kelas"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-[#059669]" />
                  <span>Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-2.5 w-2.5 opacity-70" />
                  <span>{item.join_code}</span>
                </>
              )}
            </button>
          </div>

          {/* Judul Mata Kuliah Bersih */}
          <Link href={`/classes/${item.id}`} className="block group/title">
            <h2 className="font-heading font-black text-base sm:text-[17px] text-[#1C1917] group-hover/title:text-[#C2553A] transition-colors leading-snug line-clamp-2 min-h-[2.6rem]">
              {item.title}
            </h2>
          </Link>

          {/* Baris Dosen Pengampu menyatu di bawah Header */}
          <div className="flex items-center gap-2 pt-0.5">
            <div
              className={`h-6 w-6 rounded-full ${theme.avatarBg} text-white flex items-center justify-center font-heading font-black text-[10px] shrink-0`}
            >
              {initials}
            </div>
            <span className="text-xs font-semibold text-[#44403C] truncate">
              {lecturerName}
            </span>
          </div>
        </div>
      </div>

      {/* 2. BODY BERSIH TANPA GARIS TABEL KOTAK-KOTAK */}
      <div className="p-5 py-4 bg-[#FFFFFF] flex-1 flex flex-col justify-between space-y-3.5">
        {/* Info Jadwal & Ruangan Utuh (Tidak Terpotong) */}
        <div className="space-y-2 text-xs text-[#57534E]">
          <div className="flex items-center gap-2.5">
            <Clock className={`h-3.5 w-3.5 ${theme.accentText} shrink-0`} />
            <span className="font-semibold text-[#1C1917] truncate">
              {item.schedule || 'Jadwal fleksibel / Mandiri'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-[#78716C] shrink-0" />
              <span className="font-medium text-[#57534E] truncate">
                {item.room || 'Ruang Perkuliahan'}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6B6560] shrink-0">
              <Users className="h-3 w-3 text-[#78716C]" />
              <span>{memberCount} peserta</span>
            </span>
          </div>
        </div>

        {/* Status Pill Lembut (Tanpa Border Kaku) */}
        {isLecturer ? (
          <Link
            href={`/classes/${item.id}?tab=tugas`}
            className="px-3 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EFE8] transition-colors flex items-center justify-between gap-2 text-xs"
          >
            <span className="font-medium text-[#57534E] truncate">
              Kelola materi, kuis & nilai kelas
            </span>
            <span className="font-bold text-[#C2553A] shrink-0">Kelola &rarr;</span>
          </Link>
        ) : item.upcomingTask ? (
          <Link
            href={`/classes/${item.id}?tab=tugas`}
            className="px-3 py-2 rounded-xl bg-[#FEF4F1] hover:bg-[#FDE6E0] transition-colors flex items-center justify-between gap-2 text-xs"
          >
            <span className="font-semibold text-[#853827] truncate">
              {item.upcomingTask.title}
            </span>
            <span className="text-[11px] font-mono font-bold text-[#C2553A] shrink-0">
              {new Date(item.upcomingTask.due_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </Link>
        ) : (
          <div className="px-3 py-2 rounded-xl bg-[#FAF8F5] flex items-center justify-between gap-2 text-xs text-[#78716C]">
            <span>Tidak ada tenggat tugas terdekat</span>
            <span className="text-[11px] font-semibold text-[#059669]">Terkendali</span>
          </div>
        )}
      </div>

      {/* 3. FOOTER MINIMALIS: IKON PINTASAN + 1 TOMBOL UTAMA */}
      <div className="px-4 py-2.5 bg-[#FAF8F5]/70 border-t border-[#E8E5DE] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link
            href={`/classes/${item.id}?tab=tugas`}
            className="p-2 rounded-lg text-[#57534E] hover:text-[#1C1917] hover:bg-[#ECE9D8]/70 transition-colors"
            title="Tugas & Kuis"
          >
            <ClipboardList className="h-4 w-4" />
          </Link>
          <Link
            href={`/classes/${item.id}?tab=presensi`}
            className="p-2 rounded-lg text-[#57534E] hover:text-[#1C1917] hover:bg-[#ECE9D8]/70 transition-colors"
            title="Presensi Kehadiran"
          >
            <CalendarCheck2 className="h-4 w-4" />
          </Link>
          <Link
            href={`/classes/${item.id}?tab=tugas`}
            className="p-2 rounded-lg text-[#57534E] hover:text-[#1C1917] hover:bg-[#ECE9D8]/70 transition-colors"
            title="Modul & Materi"
          >
            <FolderOpen className="h-4 w-4" />
          </Link>
        </div>

        <Link
          href={`/classes/${item.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1C1917] hover:bg-[#C2553A] text-white font-bold text-xs transition-colors"
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
      {/* UNIFIED FRESH HEADER & TOOLBAR (1 BAR RINGKAS) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E8E5DE]">
        {/* Kiri: Judul & Ringkasan Pill Segar */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-[#1C1917] flex items-center gap-2">
              <Layers className="h-6 w-6 text-[#C2553A]" />
              <span>Kelas Saya</span>
            </h1>

            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FEF2F0] text-[#C2553A] font-bold text-xs">
                {totalClasses} Kelas
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F2EFE8] text-[#57534E] font-bold text-xs">
                {totalSks} SKS
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#D6D3CB] text-[#57534E] font-semibold text-xs">
                {roleLabel}
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#6B6560]">
            {lecturer
              ? 'Kelola rombongan belajar, materi kuliah, penugasan, dan presensi dalam satu ruang terpadu.'
              : 'Akses ruang belajar, materi perkuliahan, tenggat tugas, dan presensi semester aktif.'}
          </p>
        </div>

        {/* Kanan: Filter Aktif/Arsip, Pencarian Cepat & Tombol + Kelas */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Aktif / Arsip */}
          <div className="inline-flex rounded-xl bg-[#F2EFE8] p-1 border border-[#D6D3CB]">
            <Link
              href="/classes?tab=aktif"
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'aktif'
                  ? 'bg-[#FFFFFF] text-[#1C1917] shadow-xs'
                  : 'text-[#6B6560] hover:text-[#1C1917]'
              }`}
            >
              Aktif
            </Link>
            <Link
              href="/classes?tab=arsip"
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'arsip'
                  ? 'bg-[#FFFFFF] text-[#1C1917] shadow-xs'
                  : 'text-[#6B6560] hover:text-[#1C1917]'
              }`}
            >
              Arsip
            </Link>
          </div>

          {/* Pencarian Ringkas */}
          <form onSubmit={handleSearch} className="relative flex-1 sm:flex-initial">
            <Search className="h-3.5 w-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mata kuliah..."
              className="w-full sm:w-48 lg:w-56 pl-8 pr-3 py-1.5 rounded-xl border border-[#D6D3CB] bg-[#FFFFFF] focus:border-[#1C1917] text-xs font-medium text-[#1C1917] placeholder:text-[#78716C] focus:outline-none transition-colors"
            />
          </form>

          {cloneSlot}

          {(lecturer || student) && (
            <button
              type="button"
              onClick={() => setIsAddOpen(!isAddOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C2553A] hover:bg-[#A34530] text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{lecturer ? 'Buka Kelas' : 'Gabung Kelas'}</span>
            </button>
          )}
        </div>
      </div>

      {/* PANEL EXPANDABLE: GABUNG KELAS (MAHASISWA) ATAU BUKA KELAS BARU (DOSEN) */}
      {isAddOpen && (
        <div className="p-5 rounded-2xl border border-[#D6D3CB] bg-[#FFFFFF] shadow-sm animate-fade-up space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-heading font-bold text-[#1C1917] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#C2553A]" />
              <span>{lecturer ? 'Buka Rombongan Belajar Baru' : 'Gabung ke Kelas dengan Kode'}</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-xs font-semibold text-[#78716C] hover:text-[#1C1917] cursor-pointer"
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
