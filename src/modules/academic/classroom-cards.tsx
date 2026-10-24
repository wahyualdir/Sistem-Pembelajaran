'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Users,
  Key,
  BookOpen,
  ArrowRight,
  GraduationCap,
  PlusCircle,
  FileText,
  FolderArchive,
  Clock,
  CheckCircle2,
  Copy,
  Search,
  ExternalLink,
  Calendar,
  MapPin,
  Sparkles,
  MoreVertical,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateClassForm, JoinClassForm } from './class-forms';
import type { CourseItem, SemesterItem } from './actions';

export interface ClassroomCardProps {
  id: string;
  title: string;
  section: string;
  join_code: string;
  status: string;
  members?: number;
  meta?: string;
  isLecturer?: boolean;
  upcomingTask?: {
    title: string;
    due_at: string;
  } | null;
  progressPercent?: number;
  index?: number;
  course_id?: string;
  course_code?: string;
  course_title?: string;
  sks?: number;
  lecturer_name?: string;
  lecturer_id?: string;
  room?: string;
  schedule?: string;
}

// Tema visual header khas Google Classroom dengan palet resmi kampus
const CLASSROOM_THEMES = [
  {
    gradient: 'bg-gradient-to-r from-[#1C1917] via-[#2E2822] to-[#14110F]',
    border: 'border-[#1C1917]',
    badgeBg: 'bg-[#C2553A] text-white',
    icon: Sparkles,
  },
  {
    gradient: 'bg-gradient-to-r from-[#3B0764] via-[#4C1D95] to-[#2D0A36]',
    border: 'border-[#3B0764]',
    badgeBg: 'bg-[#1D4ED8] text-white',
    icon: BookOpen,
  },
  {
    gradient: 'bg-gradient-to-r from-[#C2553A] via-[#B84A2B] to-[#853827]',
    border: 'border-[#6B2D20]',
    badgeBg: 'bg-[#064E3B] text-white',
    icon: Layers,
  },
  {
    gradient: 'bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#1E1B4B]',
    border: 'border-[#1D4ED8]',
    badgeBg: 'bg-[#B45309] text-white',
    icon: GraduationCap,
  },
  {
    gradient: 'bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#065F46]',
    border: 'border-[#064E3B]',
    badgeBg: 'bg-[#C2553A] text-white',
    icon: Clock,
  },
  {
    gradient: 'bg-gradient-to-r from-[#853827] via-[#6B2D20] to-[#4A1F16]',
    border: 'border-[#4A1F16]',
    badgeBg: 'bg-[#1D4ED8] text-white',
    icon: Calendar,
  },
];

export function GoogleClassroomCard({
  item,
  isLecturer: _isLecturer,
  index,
}: {
  item: ClassroomCardProps;
  isLecturer?: boolean;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = CLASSROOM_THEMES[index % CLASSROOM_THEMES.length];
  const WatermarkIcon = theme.icon;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(item.join_code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setMenuOpen(false);
    }, 2000);
  };

  // Inisial Dosen untuk avatar bulat
  const lecturerInitial = item.lecturer_name
    ? item.lecturer_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'DS';

  return (
    <div className="rounded-2xl border-2 border-[#7A756D] bg-[#FFFFFF] shadow-retro-sm hover:shadow-retro hover:-translate-y-1 transition-all overflow-hidden flex flex-col justify-between font-sans relative group">
      {/* 1. HEADER BANNER KELAS (WARNA-WARNI TEMATIK ALA GOOGLE CLASSROOM) */}
      <div className={cn('relative h-36 sm:h-40 p-4 text-white flex flex-col justify-between overflow-hidden', theme.gradient)}>
        {/* Subtle Watermark Ilustrasi */}
        <div className="absolute -right-3 -bottom-3 opacity-15 pointer-events-none select-none text-white">
          <WatermarkIcon className="h-28 w-28" />
        </div>

        {/* Baris Atas Header: Judul & Menu Opsi */}
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="min-w-0 pr-2">
            <Link
              href={`/classes/${item.id}`}
              className="font-heading font-black text-base sm:text-lg text-white hover:underline block leading-tight line-clamp-2 drop-shadow-xs"
              title={item.title}
            >
              {item.title}
            </Link>
            <p className="text-xs text-white/90 font-medium truncate mt-1">
              Kelas {item.section} {item.course_code ? `· ${item.course_code}` : ''}
            </p>
          </div>

          {/* Tombol Opsi Kebab Tiga Titik */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Opsi Kelas"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 z-30 w-44 border-2 border-[#7A756D] bg-[#FFFFFF] shadow-retro-sm p-1.5 text-xs text-[#1C1917] font-bold animate-fade-up"
              >
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-[#FAF8F5] flex items-center justify-between cursor-pointer"
                >
                  <span>Salin Kode Kelas</span>
                  <Key className="h-3.5 w-3.5 text-[#C2553A]" />
                </button>
                <Link
                  href={`/classes/${item.id}`}
                  className="block px-2.5 py-1.5 hover:bg-[#FAF8F5]"
                >
                  Buka Detail Kelas
                </Link>
                {copied && (
                  <div className="px-2.5 py-1 text-[10px] text-[#065F46] bg-[#E8F5E9] font-bold">
                    Kode disalin ke clipboard!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Baris Bawah Header: Nama Dosen Pengampu */}
        <div className="relative z-10">
          <span className="text-xs text-white/85 font-medium truncate block max-w-[70%]">
            {item.lecturer_name || 'Dosen Pengampu'}
          </span>
        </div>

        {/* FLOATING CIRCULAR AVATAR (MENIMPA SUDUT KANAN BAWAH HEADER BANNER) */}
        <div
          className={cn(
            'absolute -bottom-6 right-4 z-20 h-13 w-13 sm:h-14 sm:w-14 rounded-full border-2 border-white shadow-retro-xs flex items-center justify-center font-heading font-black text-sm select-none',
            theme.badgeBg
          )}
          title={item.lecturer_name || 'Dosen Pengampu'}
        >
          {lecturerInitial}
        </div>
      </div>

      {/* 2. BODY KARTU: TENGGAT TUGAS ATAU RUANG BERSIH */}
      <div className="p-4 pt-8 min-h-[90px] flex-1 flex flex-col justify-end text-xs text-[#57534E] font-sans">
        {item.upcomingTask ? (
          <Link
            href={`/classes/${item.id}?tab=tugas`}
            className="hover:underline space-y-1 block"
          >
            <span className="text-[10px] uppercase font-bold text-[#7A756D] tracking-wider block">
              Batas Waktu:
            </span>
            <p className="font-bold text-[#1C1917] truncate leading-tight">
              {item.upcomingTask.title}
            </p>
          </Link>
        ) : (
          <p className="text-[11px] text-[#7A756D] italic">
            Tidak ada tugas dengan batas waktu terdekat
          </p>
        )}
      </div>

      {/* 3. FOOTER KARTU: IKON AKSES CEPAT (TUGAS, MATERI, DLL) */}
      <div className="border-t border-[#D6D3CB] px-4 py-2.5 flex items-center justify-end gap-1.5 bg-[#FFFFFF]">
        <Link
          href={`/classes/${item.id}?tab=tugas`}
          className="p-2 rounded-lg hover:bg-[#FAF8F5] text-[#57534E] hover:text-[#1C1917] transition-all cursor-pointer"
          title="Buka Tugas Kelas"
        >
          <ClipboardList className="h-4 w-4" />
        </Link>
        <Link
          href={`/classes/${item.id}?tab=tugas&filter=materi`}
          className="p-2 rounded-lg hover:bg-[#FAF8F5] text-[#57534E] hover:text-[#1C1917] transition-all cursor-pointer"
          title="Buka Folder Materi & Modul"
        >
          <FolderArchive className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// Komponen Strip Atas "Harus dikumpulkan segera" khas Google Classroom
export function ClassroomTodoListBanner({
  hasUpcoming = false,
  taskTitle,
  dueDate,
}: {
  hasUpcoming?: boolean;
  taskTitle?: string;
  dueDate?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-[#7A756D] bg-[#FFFFFF] shadow-retro-sm p-4 sm:p-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-heading font-black text-base sm:text-lg text-[#1C1917]">
          Harus dikumpulkan segera
        </h2>
        <Link
          href="/classes"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-[#1C1917] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] text-xs font-black shadow-retro-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <span>Lihat Daftar Tugas</span>
          <ArrowRight className="h-3.5 w-3.5 text-[#C2553A]" />
        </Link>
      </div>

      <div className="py-3 text-center">
        {hasUpcoming && taskTitle ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FAF8F5] border border-[#D6D3CB] text-xs font-bold text-[#1C1917]">
            <Clock className="h-3.5 w-3.5 text-[#C2553A]" />
            <span>Tenggat terdekat: {taskTitle}</span>
            {dueDate && <span className="text-[#853827] font-mono">({dueDate})</span>}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-[#57534E] font-medium">
            Anda tidak memiliki tugas yang harus diselesaikan pada 7 hari ke depan
          </p>
        )}
      </div>
    </div>
  );
}

export function ClassroomToolbar({
  lecturer,
  student,
  master,
  totalClasses,
  initialQuery = '',
}: {
  lecturer: boolean;
  student: boolean;
  master?: { courses?: CourseItem[]; semesters?: SemesterItem[] } | null;
  totalClasses: number;
  initialQuery?: string;
}) {
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-4 font-sans">
      {/* Header Baris Kelas: Judul "Kelas" di Kiri & Aksi Tambah di Kanan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <h2 className="font-heading font-black text-xl sm:text-2xl text-[#1C1917]">
            Kelas
          </h2>
          <span className="text-xs font-bold bg-[#FAF8F5] border border-[#7A756D] px-2.5 py-0.5 text-[#1C1917]">
            {totalClasses} Kelas Terdaftar
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Form Pencarian Cepat */}
          <form method="GET" action="/classes" className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7A756D] pointer-events-none" />
              <input
                type="search"
                name="q"
                defaultValue={initialQuery}
                placeholder="Cari kelas atau dosen..."
                className="w-full pl-9 pr-3 py-1.5 border-2 border-[#7A756D] bg-[#FFFFFF] text-xs font-bold text-[#1C1917] placeholder:text-[#7A756D] focus:outline-none focus:border-[#C2553A] shadow-retro-xs"
              />
            </div>
          </form>

          {/* Tombol Tambahkan Kelas (+ Gabung / + Buat) */}
          {student && (
            <button
              type="button"
              onClick={() => {
                setIsJoinOpen(!isJoinOpen);
                setIsCreateOpen(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-[#7A756D] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] font-black text-xs shadow-retro-xs transition-all cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5 text-[#C2553A]" />
              <span>{isJoinOpen ? 'Tutup' : 'Tambahkan kelas'}</span>
            </button>
          )}

          {lecturer && (
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(!isCreateOpen);
                setIsJoinOpen(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-[#6B2D20] bg-[#C2553A] hover:bg-[#853827] text-white font-black text-xs shadow-retro-xs transition-all cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5 text-white" />
              <span>{isCreateOpen ? 'Tutup' : 'Tambahkan kelas'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Form Gabung Kelas Mahasiswa */}
      {student && isJoinOpen && (
        <div className="p-5 sm:p-6 border-2 border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm animate-fade-up">
          <h3 className="font-heading font-black text-sm text-[#1C1917] mb-3 flex items-center gap-2">
            <Key className="h-4 w-4 text-[#C2553A]" />
            <span>Gabung Kelas dengan Kode dari Dosen</span>
          </h3>
          <JoinClassForm />
        </div>
      )}

      {/* Form Buat Kelas Dosen */}
      {lecturer && isCreateOpen && (
        <div className="p-5 sm:p-6 border-2 border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm animate-fade-up">
          <h3 className="font-heading font-black text-sm text-[#1C1917] mb-3 flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-[#C2553A]" />
            <span>Buat Rombongan Belajar / Kelas Baru</span>
          </h3>
          <CreateClassForm courses={master?.courses} semesters={master?.semesters} />
        </div>
      )}
    </div>
  );
}
