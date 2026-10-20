'use client';

import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Award,
  Users,
  Building2,
  FileBadge,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LecturerIdentityCardProps {
  lecturerName?: string;
  nidn?: string;
  functionalTitle?: string;
  department?: string;
  sksCount?: number;
  maxSks?: number;
  totalStudents?: number;
  theoryClassesCount?: number;
  practicumClassesCount?: number;
}

export function LecturerIdentityCard({
  lecturerName = 'Dr. Ardiansyah, S.T., M.Kom.',
  nidn = '1018058501',
  functionalTitle = 'Lektor Kepala (IV/a)',
  department = 'Teknik Informatika (S1)',
  sksCount = 12,
  maxSks = 16,
  totalStudents = 108,
  theoryClassesCount = 3,
  practicumClassesCount = 1,
}: LecturerIdentityCardProps) {
  const percentBkd = Math.min(100, Math.round((sksCount / maxSks) * 100));
  const isBkdFulfilled = sksCount >= 12;

  return (
    <div className="w-full rounded-2xl border-2 border-black bg-surface p-4 sm:p-5 shadow-retro space-y-4 font-sans relative overflow-hidden transition-all hover:shadow-retro-md">
      {/* Background Accent Decorative Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-ink" />

      {/* 1. Header Kartu Identitas Akademik */}
      <div className="flex items-start justify-between gap-2 pt-1 border-b-2 border-black/15 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-black" />
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase text-black/75">
              UNIVERSITAS ISLAM RIAU
            </span>
          </div>
          <p className="font-heading font-black text-xs sm:text-sm text-black tracking-tight">
            KARTU IDENTITAS DOSEN PENGAMPU
          </p>
        </div>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-black bg-gray-soft text-black text-[10px] font-mono font-bold shrink-0 shadow-retro-sm">
          <ShieldCheck className="h-3 w-3 text-primary" />
          <span>TERVERIFIKASI</span>
        </span>
      </div>

      {/* 2. Informasi Utama Dosen & Avatar */}
      <div className="flex items-center gap-3.5">
        {/* Avatar Frame Retro */}
        <div className="relative shrink-0">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl border-2 border-black bg-gray-soft flex items-center justify-center shadow-retro-sm overflow-hidden">
            <GraduationCap className="h-8 w-8 text-black" />
          </div>
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border border-black bg-black flex items-center justify-center text-white" title="Dosen Tetap">
            <Award className="h-3 w-3" />
          </span>
        </div>

        {/* Biodata */}
        <div className="min-w-0 space-y-1">
          <h3 className="font-heading font-black text-sm sm:text-base text-black truncate leading-tight" title={lecturerName}>
            {lecturerName}
          </h3>
          <div className="space-y-0.5 text-xs">
            <p className="font-mono font-bold text-black/80 flex items-center gap-1.5">
              <span>NIDN:</span>
              <span className="text-black font-black">{nidn}</span>
            </p>
            <p className="text-black/80 font-bold truncate">
              {functionalTitle}
            </p>
            <p className="text-[11px] text-black/70 font-semibold truncate">
              Prodi: {department}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Status Beban Kerja Dosen (BKD Semester Ganjil) */}
      <div className="p-3 rounded-xl border-2 border-black bg-gray-soft/50 space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <FileBadge className="h-4 w-4 text-black shrink-0" />
            <span className="font-heading font-black text-black">Beban Mengajar (BKD)</span>
          </div>
          {isBkdFulfilled ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-black bg-white text-black text-[10px] font-mono font-bold shadow-retro-sm">
              <CheckCircle2 className="h-3 w-3 text-black" />
              <span>Memenuhi BKD ✓</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-black bg-white text-black text-[10px] font-mono font-bold">
              <span>{sksCount}/12 SKS Minimal</span>
            </span>
          )}
        </div>

        {/* Progress Bar BKD */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono font-bold text-black/80">
            <span>Realisasi: {sksCount} SKS</span>
            <span>Target: {maxSks} SKS</span>
          </div>
          <div className="w-full h-2 rounded-full border border-black bg-white overflow-hidden">
            <div
              className="bg-black h-full rounded-full transition-all duration-500"
              style={{ width: `${percentBkd}%` }}
            />
          </div>
        </div>

        {/* Mini Breakdown Tags */}
        <div className="flex items-center justify-between gap-1.5 pt-1 text-[11px] font-mono font-bold text-black/90">
          <span className="px-2 py-0.5 rounded border border-black/30 bg-white shadow-xs">
            {theoryClassesCount} Teori
          </span>
          <span className="px-2 py-0.5 rounded border border-black/30 bg-white shadow-xs">
            {practicumClassesCount} Lab
          </span>
          <span className="px-2 py-0.5 rounded border border-black/30 bg-white shadow-xs flex items-center gap-1">
            <Users className="h-3 w-3 text-black" />
            <span>{totalStudents} Mhs</span>
          </span>
        </div>
      </div>
    </div>
  );
}
