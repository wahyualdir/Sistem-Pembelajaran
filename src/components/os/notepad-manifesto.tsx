'use client';

import React from 'react';
import { OSWindow } from './os-window';
import { FileText } from 'lucide-react';

export function NotepadManifesto() {
  return (
    <div id="notepad-section" className="w-full max-w-7xl mx-auto px-2 sm:px-4 my-8">
      <OSWindow
        title="README.TXT — NOTEPAD"
        icon={<FileText className="w-4 h-4 text-[#D97706]" />}
        statusText="LINES: 48 · CHARS: 2480 · ANSI / WINDOWS-1252"
        className="shadow-md"
        bodyClassName="p-4 sm:p-6 bg-[#FFFFFF] text-[#1C1917]"
      >
        {/* Windows Notepad Menu Bar: File Edit Format View Help */}
        <div className="flex items-center gap-4 text-xs font-mono text-[#57534E] pb-3 mb-4 border-b border-[#E5DDD5] select-none">
          <span className="hover:text-[#C2553A] cursor-pointer">File</span>
          <span className="hover:text-[#C2553A] cursor-pointer">Edit</span>
          <span className="hover:text-[#C2553A] cursor-pointer">Format</span>
          <span className="hover:text-[#C2553A] cursor-pointer">View</span>
          <span className="hover:text-[#C2553A] cursor-pointer">Help</span>
        </div>

        {/* Section Header Tag */}
        <div className="space-y-3 font-mono">
          <div className="text-xs text-[#C2553A] font-bold tracking-wider uppercase">
            01 — MANIFESTO AKADEMIK RUANGKAMPUS
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-sans text-[#1C1917] tracking-tight">
            Pendidikan Tinggi Bukan Sekadar Mengisi Presensi &amp; Menumpuk Nilai.
          </h2>

          <div className="space-y-4 text-xs sm:text-sm text-[#44403C] leading-relaxed pt-2 font-sans">
            <p>
              Di tengah distorsi digital dan aplikasi pembelajaran modern yang penuh distraksi visual,
              RuangKampus hadir mengembalikan esensi ruang belajar: <strong>ketenangan berpikir (*deep work*)</strong>,
              integritas waktu presisi mikro-detik, serta keterhubungan kurikulum semester yang transparan dan terukur.
            </p>

            <div className="p-4 bg-[#FAF8F5] border-l-4 border-[#C2553A] space-y-2 text-xs font-sans">
              <div className="font-bold text-[#C2553A] font-mono">PEDOMAN REKAYASA &amp; KURIKULUM RUANGKAMPUS OS:</div>
              <div>• <strong>Kain Semester Weave:</strong> Memetakan alur kompetensi kurikulum semester secara terstruktur tanpa ada prasyarat yang terabaikan.</div>
              <div>• <strong>Presensi Mikro-Detik Terverifikasi:</strong> Validasi kehadiran berbasis waktu server instan, mencegah kecurangan dan memastikan keadilan akademik.</div>
              <div>• <strong>Ergonomi Antarmuka Retro OS:</strong> Palet warna terracotta hangat, beveled tactile chrome, dan tipografi warm charcoal yang ramah mata untuk sesi belajar panjang.</div>
            </div>

            <p className="text-xs text-[#7A756D] italic pt-1 font-mono">
              — Diktat Kurikulum Resmi &amp; Tata Kelola Akademik (RuangKampus Academic Learning OS)
            </p>
          </div>
        </div>
      </OSWindow>
    </div>
  );
}
