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
  Search,
  Calendar,
  MapPin,
  ClipboardList,
  CalendarCheck2,
  ShieldCheck,
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
  capacity?: number;
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

// Palet pita aksen atas yang selaras dengan identitas kampus Velqora
const CARD_ACCENTS = [
  {
    topBar: 'bg-[#C2553A]',
    avatarBg: 'bg-[#C2553A]',
    badgeBorder: 'border-[#C2553A]',
    badgeBg: 'bg-[#FEF4F1]',
  },
  {
    topBar: 'bg-[#1D4ED8]',
    avatarBg: 'bg-[#1D4ED8]',
    badgeBorder: 'border-[#1D4ED8]',
    badgeBg: 'bg-[#FAF8F5]',
  },
  {
    topBar: 'bg-[#065F46]',
    avatarBg: 'bg-[#065F46]',
    badgeBorder: 'border-[#10B981]',
    badgeBg: 'bg-[#E8F5E9]',
  },
  {
    topBar: 'bg-[#853827]',
    avatarBg: 'bg-[#853827]',
    badgeBorder: 'border-[#853827]',
    badgeBg: 'bg-[#FEF4F1]',
  },
  {
    topBar: 'bg-[#1C1917]',
    avatarBg: 'bg-[#1C1917]',
    badgeBorder: 'border-[#7A756D]',
    badgeBg: 'bg-[#ECE9D8]',
  },
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
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(item.join_code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Inisial Dosen untuk avatar
  const lecturerInitial = item.lecturer_name
    ? item.lecturer_name
        .replace(/^(Dr\.|Prof\.|Ir\.|H\.|Hj\.)\s*/gi, '')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'DS';

  const fmtDue = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <article className="border-2 border-[#7A756D] bg-[#FFFFFF] shadow-retro-sm hover:shadow-retro transition-all flex flex-col justify-between font-sans overflow-hidden">
      {/* Pita Aksen Atas */}
      <div>
        <div className={cn('h-2 w-full border-b border-[#7A756D]', accent.topBar)} />

        {/* 1. HEADER IDENTITAS MATA KULIAH & DOSEN PENGAMPU */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5] border-b-2 border-[#D6D3CB] space-y-3">
          {/* Baris Badge: Seksi, Kode MK, SKS, Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-0.5 text-xs font-black uppercase bg-[#1C1917] text-white border border-[#1C1917]">
                Kelas {item.section}
              </span>
              {item.course_code && (
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#FFFFFF] text-[#1C1917] border border-[#7A756D]">
                  {item.course_code}
                </span>
              )}
              <span className="px-2 py-0.5 text-xs font-bold bg-[#ECE9D8] text-[#1C1917] border border-[#7A756D]">
                {item.sks ?? 3} SKS
              </span>
            </div>

            <span className="px-2 py-0.5 text-xs font-black uppercase bg-[#E8F5E9] text-[#065F46] border border-[#10B981]">
              {item.status === 'ARCHIVED' ? 'Arsip' : 'Aktif'}
            </span>
          </div>

          {/* Judul Mata Kuliah (Tinggi Konsisten & Kontras Tinggi) */}
          <div className="min-h-[3.25rem] flex items-start">
            <Link
              href={`/classes/${item.id}`}
              className="font-heading font-black text-base sm:text-lg text-[#1C1917] hover:underline leading-snug line-clamp-2 block"
              title={item.title}
            >
              {item.title}
            </Link>
          </div>

          {/* Baris Dosen Pengampu & Kode Registrasi Kelas */}
          <div className="pt-2.5 border-t border-[#D6D3CB] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  'h-9 w-9 rounded-full border-2 border-[#1C1917] text-white flex items-center justify-center font-heading font-black text-xs shrink-0 shadow-retro-xs',
                  accent.avatarBg
                )}
                title={item.lecturer_name || 'Dosen Pengampu'}
              >
                {lecturerInitial}
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-[#1C1917] truncate">
                  {item.lecturer_name || 'Dosen Pengampu Kelas'}
                </span>
                <span className="block text-[11px] font-medium text-[#57534E]">
                  Dosen Pengampu
                </span>
              </div>
            </div>

            {item.join_code && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#ECE9D8] text-[#1C1917] border border-[#7A756D] font-mono text-xs font-bold shadow-retro-xs transition-all shrink-0 cursor-pointer"
                title="Klik untuk menyalin Kode Kelas"
              >
                <Key className="h-3 w-3 text-[#C2553A] shrink-0" />
                <span>{copied ? 'Tersalin!' : item.join_code}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. GRID SPESIFIKASI PERKULIAHAN (4 METRIK DETAIL) */}
        <div className="grid grid-cols-2 divide-x divide-y divide-[#D6D3CB] border-b-2 border-[#D6D3CB] bg-[#FFFFFF] text-xs">
          <div className="p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#57534E] block">
              Jadwal Kuliah
            </span>
            <p className="font-bold text-[#1C1917] flex items-center gap-1.5 truncate">
              <Clock className="h-3.5 w-3.5 text-[#C2553A] shrink-0" />
              <span className="truncate">{item.schedule || 'Senin, 08:45 WIB'}</span>
            </p>
          </div>

          <div className="p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#57534E] block">
              Ruang / Lab
            </span>
            <p className="font-bold text-[#1C1917] flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-[#C2553A] shrink-0" />
              <span className="truncate">{item.room || '3C.2.05 - TEKNIK C'}</span>
            </p>
          </div>

          <div className="p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#57534E] block">
              Peserta Kelas
            </span>
            <p className="font-bold text-[#1C1917] flex items-center gap-1.5 truncate">
              <Users className="h-3.5 w-3.5 text-[#1D4ED8] shrink-0" />
              <span>
                {item.members !== undefined ? `${item.members} Mahasiswa` : 'Rombel Aktif'}
              </span>
            </p>
          </div>

          <div className="p-3 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#57534E] block">
              Syarat Kehadiran
            </span>
            <p className="font-bold text-[#1C1917] flex items-center gap-1.5 truncate">
              <ShieldCheck className="h-3.5 w-3.5 text-[#065F46] shrink-0" />
              <span>Min. 75% (UAS)</span>
            </p>
          </div>
        </div>

        {/* 3. PANEL STATUS KONTEKSTUAL SESUAI PERAN (DOSEN / MAHASISWA / ASISTEN) */}
        <div className="px-4 py-3 bg-[#FAF8F5] border-b border-[#D6D3CB] text-xs">
          {isLecturer ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <GraduationCap className="h-4 w-4 text-[#C2553A] shrink-0" />
                <span className="font-bold text-[#1C1917] truncate">
                  Kelola Materi, Penugasan & Nilai Kelas
                </span>
              </div>
              <Link
                href={`/classes/${item.id}?tab=nilai`}
                className="font-bold text-[#1C1917] underline shrink-0"
              >
                Buku Nilai
              </Link>
            </div>
          ) : item.upcomingTask ? (
            <Link
              href={`/classes/${item.id}?tab=tugas`}
              className="flex items-center justify-between gap-2 hover:underline"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ClipboardList className="h-4 w-4 text-[#C2553A] shrink-0" />
                <span className="font-bold text-[#1C1917] truncate">
                  {item.upcomingTask.title}
                </span>
              </div>
              <span className="font-mono font-bold text-[#853827] shrink-0">
                {fmtDue(item.upcomingTask.due_at)}
              </span>
            </Link>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="h-4 w-4 text-[#065F46] shrink-0" />
                <span className="font-medium text-[#1C1917] truncate">
                  Tidak ada tugas mendesak minggu ini
                </span>
              </div>
              <span className="font-bold text-[#065F46] shrink-0">Terkendali</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. FOOTER AKSI CEPAT (PINTASAN LANGSUNG & TOMBOL MASUK KELAS) */}
      <div className="p-3 sm:p-3.5 bg-[#FFFFFF] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/classes/${item.id}?tab=tugas`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#7A756D] bg-[#FAF8F5] hover:bg-[#ECE9D8] text-[#1C1917] text-xs font-bold transition-all"
            title="Buka Tugas & Penilaian"
          >
            <ClipboardList className="h-3.5 w-3.5 text-[#C2553A]" />
            <span>Tugas</span>
          </Link>
          <Link
            href={`/classes/${item.id}?tab=presensi`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#7A756D] bg-[#FAF8F5] hover:bg-[#ECE9D8] text-[#1C1917] text-xs font-bold transition-all"
            title="Buka Sesi Presensi"
          >
            <CalendarCheck2 className="h-3.5 w-3.5 text-[#065F46]" />
            <span>Presensi</span>
          </Link>
          <Link
            href={`/classes/${item.id}?tab=tugas&filter=materi`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#7A756D] bg-[#FAF8F5] hover:bg-[#ECE9D8] text-[#1C1917] text-xs font-bold transition-all"
            title="Buka Modul & Materi"
          >
            <FolderArchive className="h-3.5 w-3.5 text-[#1D4ED8]" />
            <span className="hidden sm:inline">Materi</span>
          </Link>
        </div>

        <Link
          href={`/classes/${item.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-[#1C1917] bg-[#1C1917] hover:bg-[#C2553A] hover:border-[#6B2D20] text-white text-xs font-black shadow-retro-xs transition-all shrink-0"
        >
          <span>Buka Kelas</span>
          <ArrowRight className="h-3.5 w-3.5 text-white" />
        </Link>
      </div>
    </article>
  );
}

// Komponen Ringkasan Akademik Multi-Peran (Kompak & Informatif)
export function ClassroomTodoListBanner({
  roleLabel = 'Mahasiswa',
  isLecturer = false,
  totalClasses = 0,
  totalSks = 0,
  totalMembers = 0,
}: {
  hasUpcoming?: boolean;
  taskTitle?: string;
  dueDate?: string;
  roleLabel?: string;
  isLecturer?: boolean;
  totalClasses?: number;
  totalSks?: number;
  totalMembers?: number;
}) {
  return (
    <div className="border-2 border-[#7A756D] bg-[#FFFFFF] shadow-retro-sm grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#D6D3CB] font-sans">
      <div className="p-3.5 sm:p-4 bg-[#FAF8F5]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#57534E] block">
          Rombongan Belajar
        </span>
        <p className="font-heading font-black text-lg sm:text-xl text-[#1C1917] mt-0.5">
          {totalClasses} Kelas Aktif
        </p>
        <span className="text-xs font-medium text-[#57534E]">
          Semester Ganjil 2026/2027
        </span>
      </div>

      <div className="p-3.5 sm:p-4 bg-[#FFFFFF]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#57534E] block">
          Total Beban Kredit
        </span>
        <p className="font-heading font-black text-lg sm:text-xl text-[#1C1917] mt-0.5">
          {totalSks} SKS
        </p>
        <span className="text-xs font-medium text-[#57534E]">
          Terjadwal di SIAKAD
        </span>
      </div>

      <div className="p-3.5 sm:p-4 bg-[#FFFFFF]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#57534E] block">
          {isLecturer ? 'Total Peserta Didik' : 'Syarat Kehadiran UAS'}
        </span>
        <p className="font-heading font-black text-lg sm:text-xl text-[#1C1917] mt-0.5">
          {isLecturer ? `${totalMembers} Mahasiswa` : 'Minimal 75%'}
        </p>
        <span className="text-xs font-medium text-[#57534E]">
          {isLecturer ? 'Lintas Rombel Diampu' : 'Wajib Presensi Tiap Sesi'}
        </span>
      </div>

      <div className="p-3.5 sm:p-4 bg-[#FAF8F5] flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#57534E] block">
            Akses Peran Aktif
          </span>
          <p className="font-heading font-black text-sm sm:text-base text-[#1C1917] mt-0.5 truncate">
            {roleLabel}
          </p>
        </div>
        <span className="text-xs font-bold text-[#065F46] flex items-center gap-1 mt-1">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>Sinkronisasi Akademik Aktif</span>
        </span>
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
    <div className="space-y-3 font-sans">
      {/* Baris Filter, Pencarian & Tombol Aksi */}
      <div className="border-2 border-[#7A756D] bg-[#ECE9D8] p-3 sm:p-3.5 shadow-retro-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-4 w-4 text-[#C2553A] shrink-0" />
          <h2 className="font-heading font-black text-sm sm:text-base text-[#1C1917]">
            Daftar Rombongan Belajar ({totalClasses} Kelas)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Form Pencarian Cepat */}
          <form method="GET" action="/classes" className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#57534E] pointer-events-none" />
              <input
                type="search"
                name="q"
                defaultValue={initialQuery}
                placeholder="Cari matkul, kode STI, seksi, dosen..."
                className="w-full pl-9 pr-3 py-1.5 border-2 border-[#7A756D] bg-[#FFFFFF] text-xs font-bold text-[#1C1917] placeholder:text-[#57534E] focus:outline-none focus:border-[#1C1917]"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 border-2 border-[#1C1917] bg-[#1C1917] text-white text-xs font-black cursor-pointer"
            >
              Cari
            </button>
          </form>

          {/* Tombol Gabung Kelas (Mahasiswa) */}
          {student && (
            <button
              type="button"
              onClick={() => {
                setIsJoinOpen(!isJoinOpen);
                setIsCreateOpen(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-[#1C1917] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] font-black text-xs shadow-retro-xs transition-all cursor-pointer"
            >
              <Key className="h-3.5 w-3.5 text-[#C2553A]" />
              <span>{isJoinOpen ? 'Tutup Form' : '+ Gabung Kode Kelas'}</span>
            </button>
          )}

          {/* Tombol Buat Kelas Baru (Dosen / Admin) */}
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
              <span>{isCreateOpen ? 'Tutup Form' : '+ Buat Kelas Baru'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Form Gabung Kelas Mahasiswa */}
      {student && isJoinOpen && (
        <div className="p-5 border-2 border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm animate-fade-up">
          <h3 className="font-heading font-black text-sm text-[#1C1917] mb-3 flex items-center gap-2">
            <Key className="h-4 w-4 text-[#C2553A]" />
            <span>Gabung Rombongan Belajar dengan Kode Kelas</span>
          </h3>
          <JoinClassForm />
        </div>
      )}

      {/* Form Buat Kelas Dosen */}
      {lecturer && isCreateOpen && (
        <div className="p-5 border-2 border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm animate-fade-up">
          <h3 className="font-heading font-black text-sm text-[#1C1917] mb-3 flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-[#C2553A]" />
            <span>Buka Rombongan Belajar / Kelas Perkuliahan Baru</span>
          </h3>
          <CreateClassForm courses={master?.courses} semesters={master?.semesters} />
        </div>
      )}
    </div>
  );
}
