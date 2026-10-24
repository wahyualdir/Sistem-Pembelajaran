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

const ACCENT_BORDER_CLASSES = [
  'border-l-[#C2553A]', // Terracotta
  'border-l-[#10B981]', // Emerald
  'border-l-[#1D4ED8]', // Navy
  'border-l-[#B45309]', // Amber
  'border-l-[#DC2626]', // Crimson
];

export function GoogleClassroomCard({
  item,
  isLecturer,
  index,
}: {
  item: ClassroomCardProps;
  isLecturer?: boolean;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const accentBorder = ACCENT_BORDER_CLASSES[index % ACCENT_BORDER_CLASSES.length];

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(item.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'border-2 border-[#7A756D] border-l-4 bg-[#FAF8F5] shadow-retro-sm hover:shadow-retro hover:-translate-y-0.5 transition-all p-3.5 sm:p-4.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 font-sans',
        accentBorder
      )}
    >
      {/* Sisi Kiri: Badge, Kode, Judul, Dosen & Rombel */}
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 text-xs font-black uppercase tracking-wider bg-[#FEF4F1] text-[#853827] border border-[#C2553A]">
            Kelas {item.section}
          </span>
          {item.course_code && (
            <span className="text-xs font-mono font-bold bg-[#FFFFFF] border border-[#D6D3CB] px-2 py-0.5 text-[#1C1917]">
              {item.course_code}
            </span>
          )}
          <span className="text-xs font-bold text-[#7A756D]">
            {item.sks ?? 3} SKS
          </span>
          <span className="text-xs font-black text-[#065F46] bg-[#E8F5E9] border border-[#10B981] px-2 py-0.5">
            Aktif
          </span>
        </div>

        <Link
          href={`/classes/${item.id}`}
          className="font-heading font-black text-base sm:text-lg text-[#1C1917] hover:text-[#C2553A] leading-tight block truncate"
        >
          {item.title}
        </Link>

        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#57534E]">
          {item.lecturer_name && (
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-[#C2553A] shrink-0" />
              <span>{item.lecturer_name}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-[#7A756D] shrink-0" />
            <span>{item.members !== undefined ? `${item.members} Mahasiswa` : 'Rombel Aktif'}</span>
          </span>
          {isLecturer && item.join_code && (
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-xs font-bold bg-[#FFFFFF] border border-[#7A756D] px-2 py-0.5 hover:bg-[#ECE9D8] transition-all flex items-center gap-1 text-[#1C1917] cursor-pointer"
              title="Salin Kode Kelas"
            >
              <Key className="h-3 w-3 text-[#C2553A]" />
              <span>{item.join_code}</span>
              {copied && <CheckCircle2 className="h-3.5 w-3.5 text-[#065F46]" />}
            </button>
          )}
        </div>
      </div>

      {/* Sisi Tengah: Spesifikasi Jadwal, Ruangan, & Tugas (Memanjang) */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#FFFFFF] border border-[#D6D3CB] p-2 text-xs text-center shrink-0">
          <div className="px-3">
            <span className="block text-[10px] font-bold uppercase text-[#7A756D] tracking-wider">JADWAL</span>
            <span className="font-black text-[#1C1917] whitespace-nowrap truncate max-w-[130px] block" title={item.schedule || 'Senin, 08:45 WIB'}>
              {item.schedule ? item.schedule.split(' ')[0] + ' ' + (item.schedule.split(' ')[1] || '') : 'Senin 08:45'}
            </span>
          </div>
          <div className="px-3 border-l border-[#D6D3CB]">
            <span className="block text-[10px] font-bold uppercase text-[#7A756D] tracking-wider">RUANGAN</span>
            <span className="font-black text-[#1C1917] whitespace-nowrap truncate max-w-[120px] block" title={item.room || 'Lab Komputer'}>
              {item.room || 'Lab Komputer'}
            </span>
          </div>
          <div className="px-3 border-l border-[#D6D3CB] col-span-2 sm:col-span-1">
            <span className="block text-[10px] font-bold uppercase text-[#7A756D] tracking-wider">TENGGAT</span>
            <span className="font-black text-[#853827] whitespace-nowrap truncate max-w-[130px] block" title={item.upcomingTask?.title || 'Tugas Aktif'}>
              {item.upcomingTask?.title ? item.upcomingTask.title.split(':')[0] : 'Tidak Ada'}
            </span>
          </div>
        </div>

        {/* Pintasan Cepat & Tombol Utama */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {/* Ikon Pintasan Folder/Tugas */}
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/classes/${item.id}?tab=tugas`}
              className="p-2 border-2 border-[#7A756D] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] transition-all shadow-retro-xs"
              title="Tugas Kelas"
            >
              <FileText className="h-4 w-4" />
            </Link>
            <Link
              href={`/classes/${item.id}?tab=tugas&filter=materi`}
              className="p-2 border-2 border-[#7A756D] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] transition-all shadow-retro-xs"
              title="Materi & Modul"
            >
              <FolderArchive className="h-4 w-4" />
            </Link>
          </div>

          {/* Tombol Utama Buka Kelas */}
          <Link
            href={`/classes/${item.id}`}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 py-2 px-5 bg-[#C2553A] hover:bg-[#853827] text-white font-black text-xs sm:text-sm border-2 border-[#6B2D20] shadow-retro-sm transition-all whitespace-nowrap min-w-[140px] min-h-[38px]"
          >
            <span>Buka Kelas</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ClassroomToolbar({
  lecturer,
  student,
  master,
  totalClasses: _totalClasses,
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
    <div className="space-y-3 font-sans">
      {/* Search & Actions Bar (Clean & Seamless) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Form Pencarian Cepat Mata Kuliah & Dosen */}
        <form method="GET" action="/classes" className="flex items-center gap-2 w-full sm:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7A756D] pointer-events-none" />
            <input
              type="search"
              name="q"
              defaultValue={initialQuery}
              placeholder="Cari matkul, kode (STI...), dosen..."
              className="w-full pl-9 pr-3 py-2 border-2 border-[#7A756D] bg-[#FFFFFF] text-xs font-bold text-[#1C1917] placeholder:text-[#7A756D] focus:outline-none focus:border-[#C2553A] shadow-retro-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 border-2 border-[#7A756D] bg-[#1C1917] hover:bg-[#2D2823] text-white text-xs font-black shadow-retro-sm transition-all shrink-0 cursor-pointer min-h-[38px]"
          >
            Cari
          </button>
        </form>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {student && (
            <button
              type="button"
              onClick={() => {
                setIsJoinOpen(!isJoinOpen);
                setIsCreateOpen(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#7A756D] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] font-black text-xs shadow-retro-sm transition-all cursor-pointer min-h-[38px]"
            >
              <Key className="h-4 w-4 text-[#C2553A]" />
              <span>{isJoinOpen ? 'Tutup Form' : 'Gabung Kelas dengan Kode'}</span>
            </button>
          )}

          {lecturer && (
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(!isCreateOpen);
                setIsJoinOpen(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#6B2D20] bg-[#C2553A] hover:bg-[#853827] text-white font-black text-xs shadow-retro-sm transition-all cursor-pointer min-h-[38px]"
            >
              <PlusCircle className="h-4 w-4 text-white" />
              <span>{isCreateOpen ? 'Tutup Form' : 'Buat Kelas Baru'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Join Form (Mahasiswa) */}
      {student && isJoinOpen && (
        <div className="p-5 sm:p-6 border-2 border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm animate-fade-up">
          <h3 className="font-heading font-black text-sm text-[#1C1917] mb-3 flex items-center gap-2">
            <Key className="h-4 w-4 text-[#C2553A]" />
            <span>Gabung Kelas dengan Kode dari Dosen</span>
          </h3>
          <JoinClassForm />
        </div>
      )}

      {/* Expandable Create Form (Dosen) */}
      {lecturer && isCreateOpen && (
        <div className="p-5 sm:p-6 border-2 border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm animate-fade-up">
          <h3 className="font-heading font-black text-sm text-[#1C1917] mb-3 flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-[#C2553A]" />
            <span>Buat Kelas Perkuliahan Baru</span>
          </h3>
          <CreateClassForm courses={master?.courses} semesters={master?.semesters} />
        </div>
      )}
    </div>
  );
}
