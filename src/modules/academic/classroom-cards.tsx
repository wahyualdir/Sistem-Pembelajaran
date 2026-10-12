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
import { CreateClassForm, JoinClassForm } from './class-forms';
import type { CourseItem, SemesterItem } from './actions';

// 6 Palet Warna Retro Khas Google Classroom Berbalut Macintosh
const RETRO_BANNER_THEMES = [
  {
    bg: 'bg-pastel-peach',
    text: 'text-black',
    accent: 'bg-retro-orange',
    border: 'border-black',
    badge: 'bg-pastel-peach',
  },
  {
    bg: 'bg-pastel-mint',
    text: 'text-black',
    accent: 'bg-traffic-green',
    border: 'border-black',
    badge: 'bg-pastel-mint',
  },
  {
    bg: 'bg-pastel-sky',
    text: 'text-black',
    accent: 'bg-retro-blue',
    border: 'border-black',
    badge: 'bg-pastel-sky',
  },
  {
    bg: 'bg-pastel-lavender',
    text: 'text-black',
    accent: 'bg-retro-purple',
    border: 'border-black',
    badge: 'bg-pastel-lavender',
  },
  {
    bg: 'bg-pastel-lemon',
    text: 'text-black',
    accent: 'bg-retro-yellow',
    border: 'border-black',
    badge: 'bg-pastel-lemon',
  },
  {
    bg: 'bg-pastel-rose',
    text: 'text-black',
    accent: 'bg-retro-pink',
    border: 'border-black',
    badge: 'bg-pastel-rose',
  },
];

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
}

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
  const theme = RETRO_BANNER_THEMES[index % RETRO_BANNER_THEMES.length];

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(item.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate avatar initials from title / lecturer
  const initials = item.title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className="group rounded-2xl border-2 border-black bg-white shadow-retro-md hover:shadow-retro-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden animate-fade-up font-sans"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div>
        {/* ======================================================== */}
        {/* 1. GOOGLE CLASSROOM RETRO HERO BANNER                    */}
        {/* ======================================================== */}
        <div className={`p-4 sm:p-5 ${theme.bg} border-b-2 border-black relative`}>
          {/* Header Baris & Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border border-retro-border bg-traffic-red inline-block shadow-retro-sm" />
              <span className="h-3 w-3 rounded-full border border-retro-border bg-traffic-yellow inline-block shadow-retro-sm" />
              <span className="h-3 w-3 rounded-full border border-retro-border bg-traffic-green inline-block shadow-retro-sm" />
              <span className="text-xs font-semibold text-black/80 ml-1.5 truncate">
                Kelas {item.section}
              </span>
            </div>

            <span className="text-xs font-medium bg-white/95 border border-black px-2 py-0.5 rounded shadow-retro-sm text-black">
              Aktif
            </span>
          </div>

          {/* Judul Mata Kuliah */}
          <div className="pr-12">
            <Link
              href={`/classes/${item.id}`}
              className="font-bold text-lg text-black hover:underline line-clamp-2 leading-snug block"
            >
              {item.title}
            </Link>
            <p className="text-xs text-black/70 mt-1 truncate font-normal">
              {item.meta || 'Semester Ganjil 2026/2027 · 3 SKS'}
            </p>
          </div>

          {/* Dosen Avatar Bulat Tumpang-Tindih */}
          <div className="absolute right-4 -bottom-6 h-12 w-12 rounded-full border-2 border-black bg-white shadow-retro flex items-center justify-center font-bold text-sm text-black select-none z-10">
            {initials}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. BODY KARTU: TENGGAT TUGAS & INFO KELAS                */}
        {/* ======================================================== */}
        <div className="p-4 sm:p-5 pt-8 space-y-3.5 bg-white">
          {/* Tenggat Waktu Mendatang */}
          <div className="p-3 rounded-xl border border-black/25 bg-retro-warm/30 space-y-1">
            <span className="text-xs font-semibold text-black/60 block">
              Tenggat Terdekat
            </span>
            <div className="flex items-center gap-2 text-xs font-medium text-black">
              <Clock className="h-3.5 w-3.5 text-retro-orange shrink-0" />
              <span className="truncate">
                {item.upcomingTask?.title || 'Tugas 1: Analisis Arsitektur Microservices (4 hari)'}
              </span>
            </div>
          </div>

          {/* Informasi Peserta & Kode Kelas */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-black/80">
            <span className="flex items-center gap-1.5 font-normal">
              <Users className="h-3.5 w-3.5 text-black/60" />
              <span>{item.members !== undefined ? `${item.members} Mahasiswa` : 'Rombel Aktif'}</span>
            </span>

            {isLecturer && item.join_code && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-xs font-medium bg-white border border-black px-2 py-0.5 rounded shadow-retro-sm hover:bg-retro-warm transition-all flex items-center gap-1 text-black"
                title="Salin Kode Kelas"
              >
                <Key className="h-3 w-3 text-retro-orange" />
                <span>{item.join_code}</span>
                {copied && <span className="text-xs text-retro-mint font-bold">✓</span>}
              </button>
            )}
          </div>

          {/* Progres Belajar Mahasiswa */}
          {!isLecturer && (
            <div className="pt-2.5 border-t border-black/15 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-black">
                <span className="text-black/70">Progres Belajar</span>
                <span className="font-bold">{item.progressPercent ?? 65}%</span>
              </div>
              <div className="w-full h-2 rounded-full border border-black bg-retro-warm overflow-hidden">
                <div
                  className="bg-black h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.progressPercent ?? 65}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. FOOTER KARTU: AKSES CEPAT (FOLDER, TUGAS, BUKA)        */}
      {/* ======================================================== */}
      <div className="px-4 sm:px-5 py-3 border-t-2 border-black/15 bg-neutral-50 flex items-center justify-between gap-2">
        {/* Ikon Pintasan Cepat ala Google Classroom */}
        <div className="flex items-center gap-1">
          <Link
            href={`/classes/${item.id}?tab=tugas`}
            className="p-1.5 rounded-lg border border-black/30 bg-white hover:bg-retro-warm hover:border-black text-black transition-all shadow-xs"
            title="Tugas Kelas"
          >
            <FileText className="h-4 w-4" />
          </Link>
          <Link
            href={`/classes/${item.id}?tab=tugas&filter=materi`}
            className="p-1.5 rounded-lg border border-black/30 bg-white hover:bg-retro-warm hover:border-black text-black transition-all shadow-xs"
            title="Materi & Modul"
          >
            <FolderArchive className="h-4 w-4" />
          </Link>
          <Link
            href={`/classes/${item.id}?tab=anggota`}
            className="p-1.5 rounded-lg border border-black/30 bg-white hover:bg-retro-warm hover:border-black text-black transition-all shadow-xs"
            title="Peserta Kelas"
          >
            <Users className="h-4 w-4" />
          </Link>
        </div>

        {/* Tombol Utama Buka Kelas */}
        <Link
          href={`/classes/${item.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-semibold shadow-retro transition-all"
        >
          <span>Buka Kelas</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function ClassroomToolbar({
  lecturer,
  student,
  master,
  totalClasses,
}: {
  lecturer: boolean;
  student: boolean;
  master?: { courses?: CourseItem[]; semesters?: SemesterItem[] } | null;
  totalClasses: number;
}) {
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Top Bar Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-retro">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg text-black">
              Daftar Kelas Perkuliahan
            </span>
            <span className="text-xs font-semibold bg-retro-warm border border-black px-2 py-0.5 rounded">
              {totalClasses} Kelas Aktif
            </span>
          </div>
          <p className="text-xs text-black/70 font-normal">
            Pilih kelas untuk mengakses materi, pengumpulan tugas, dan aktivitas kuliah.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {student && (
            <button
              type="button"
              onClick={() => {
                setIsJoinOpen(!isJoinOpen);
                setIsCreateOpen(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black bg-retro-yellow text-black font-semibold text-xs sm:text-sm shadow-retro hover:bg-white transition-all"
            >
              <Key className="h-4 w-4" />
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black bg-black text-white font-semibold text-xs sm:text-sm shadow-retro hover:bg-neutral-800 transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{isCreateOpen ? 'Tutup Form' : 'Buat Kelas Baru'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Join Form (Mahasiswa) */}
      {student && isJoinOpen && (
        <div className="p-5 sm:p-6 rounded-2xl border-2 border-black bg-retro-warm/50 shadow-retro animate-fade-up">
          <h3 className="font-bold text-sm text-black mb-3 flex items-center gap-2">
            <Key className="h-4 w-4 text-retro-orange" />
            <span>Gabung Kelas dengan Kode dari Dosen</span>
          </h3>
          <JoinClassForm />
        </div>
      )}

      {/* Expandable Create Form (Dosen) */}
      {lecturer && isCreateOpen && (
        <div className="p-5 sm:p-6 rounded-2xl border-2 border-black bg-retro-warm/50 shadow-retro animate-fade-up">
          <h3 className="font-bold text-sm text-black mb-3 flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-retro-orange" />
            <span>Buat Kelas Perkuliahan Baru</span>
          </h3>
          <CreateClassForm courses={master?.courses} semesters={master?.semesters} />
        </div>
      )}
    </div>
  );
}
