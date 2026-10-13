'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Award,
  Plus,
  Search,
  ExternalLink,
  FileText,
  Sparkles,
  Download,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';

export const STAFF_CONTENT_TABS = [
  { id: 'koleksi-pustaka', label: 'Koleksi Pustaka', icon: BookOpen },
  { id: 'template-sertifikat-dan-badge', label: 'Template Sertifikat & Badge', icon: Award },
] as const;

export type StaffContentTabId = (typeof STAFF_CONTENT_TABS)[number]['id'];

interface StaffContentHubViewProps {
  isDemo?: boolean;
}

export function StaffContentHubView({ isDemo = true }: StaffContentHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as StaffContentTabId;
  const validTabs: StaffContentTabId[] = [
    'koleksi-pustaka',
    'template-sertifikat-dan-badge',
  ];
  const activeTab: StaffContentTabId = validTabs.includes(tabParam)
    ? tabParam
    : 'koleksi-pustaka';

  const setTab = (tab: StaffContentTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/staff/content?${params.toString()}`);
  };

  const LIBRARY_BOOKS = [
    { id: 'bk-1', isbn: '978-0132350884', title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', category: 'Software Engineering', copies: 12, available: 5, location: 'Rak A-12 (Lantai 2)' },
    { id: 'bk-2', isbn: '978-0262033848', title: 'Introduction to Algorithms (4th Edition)', author: 'Thomas H. Cormen, et al.', category: 'Computer Science', copies: 20, available: 8, location: 'Rak B-04 (Lantai 2)' },
    { id: 'bk-3', isbn: '978-1491950357', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', category: 'Distributed Systems', copies: 15, available: 6, location: 'Rak C-09 (Lantai 3)' },
    { id: 'bk-4', isbn: '978-0134685991', title: 'Effective Java (3rd Edition)', author: 'Joshua Bloch', category: 'Programming Languages', copies: 10, available: 4, location: 'Rak A-15 (Lantai 2)' },
  ];

  const CERTIFICATES = [
    { id: 'crt-1', name: 'Sertifikat Kelulusan Mata Kuliah Praktikum', type: 'KELULUSAN', issuer: 'Biro Administrasi Akademik', criteria: 'Nilai Praktikum Minimal B+', issuedCount: 420, status: 'AKTIF' },
    { id: 'crt-2', name: 'Lencana Mahasiswa Teladan (Dean’s List Award)', type: 'PRESTASI', issuer: 'Dekanat Fakultas Teknologi Informasi', criteria: 'IPS Semester >= 3.85 tanpa remedial', issuedCount: 48, status: 'AKTIF' },
    { id: 'crt-3', name: 'Lencana Kontributor Riset & Open Source Kampus', type: 'KOMPETENSI', issuer: 'Pusat Inovasi & Riset Software', criteria: 'Minimal 3 repositori kontribusi disetujui', issuedCount: 24, status: 'AKTIF' },
  ];

  const books = isDemo ? LIBRARY_BOOKS : [];
  const certificates = isDemo ? CERTIFICATES : [];

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER RETRO */}
      <RetroWindow
        title="manajemen_pustaka_dan_sertifikat_digital.app"
        badge="Biro Pustaka & Kredensial Akademik"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-xs">
                <BookOpen className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Pustaka & Sertifikat Digital
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Katalog repositori buku digital & fisik perpustakaan universitas, serta template sertifikat kompetensi dan lencana mikro (micro-credentials) mahasiswa.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-mono font-black text-black shadow-retro">
              Kredensial Digital Terverifikasi
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. STATS PILLS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Koleksi Buku Terdaftar</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">{LIBRARY_BOOKS.length} Judul</div>
          <span className="text-xs text-black/70">Katalog Terindeks</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Total Eksemplar</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">57 Buku</div>
          <span className="text-xs text-emerald-800 font-bold">23 Tersedia Dipinjam</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Template Sertifikat</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">{CERTIFICATES.length} Format</div>
          <span className="text-xs text-retro-orange font-bold">Resmi BAA</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Kredensial Diterbitkan</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">492 Badge</div>
          <span className="text-xs text-emerald-800 font-bold">Semester Berjalan</span>
        </div>
      </div>

      {/* 3. TAB CONTROLLER */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {STAFF_CONTENT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0',
                isSelected
                  ? 'bg-retro-orange text-white shadow-retro'
                  : 'bg-white text-black hover:bg-retro-warm shadow-xs'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}
      {/* TAB 1: KOLEKSI PUSTAKA */}
      {activeTab === 'koleksi-pustaka' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-retro-orange" />
                <span>Katalog Pustaka Digital & Fisik Perpustakaan</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Kelola daftar buku referensi perkuliahan, ketersediaan eksemplar, dan nomor rak penyimpanan.
              </p>
            </div>
            <button
              type="button"
              disabled={!isDemo}
              title={!isDemo ? 'Fitur ini belum aktif' : undefined}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black text-xs font-black shadow-xs transition-all shrink-0',
                isDemo
                  ? 'bg-white text-black hover:bg-neutral-100 cursor-pointer'
                  : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Judul Pustaka</span>
              {!isDemo && <span className="text-xs bg-neutral-200 px-1.5 py-0.2 rounded font-mono text-neutral-600">(Belum Aktif)</span>}
            </button>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">ISBN & Judul Pustaka</th>
                    <th className="p-3.5 sm:p-4">Pengarang</th>
                    <th className="p-3.5 sm:p-4">Kategori Bidang</th>
                    <th className="p-3.5 sm:p-4 text-center">Eksemplar</th>
                    <th className="p-3.5 sm:p-4 text-center">Tersedia</th>
                    <th className="p-3.5 sm:p-4">Lokasi Rak</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-black/60 font-mono text-xs">
                        Belum ada koleksi buku pustaka tersimpan di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    books.map((b) => (
                      <tr key={b.id} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black max-w-sm">
                          <div>{b.title}</div>
                          <span className="text-xs font-mono text-black/60">ISBN: {b.isbn}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/80">{b.author}</td>
                        <td className="p-3.5 sm:p-4">
                          <span className="px-2 py-0.5 rounded border border-black bg-retro-warm font-mono text-xs font-bold">
                            {b.category}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center font-mono font-bold">{b.copies} Eks</td>
                        <td className="p-3.5 sm:p-4 text-center font-mono font-black text-emerald-800">{b.available} Eks</td>
                        <td className="p-3.5 sm:p-4 text-xs font-mono text-black/70">{b.location}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATE SERTIFIKAT & BADGE */}
      {activeTab === 'template-sertifikat-dan-badge' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <Award className="h-5 w-5 text-retro-orange" />
                <span>Template Sertifikat Digital & Lencana Mikro (Micro-Credentials)</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Standarisasi format surat tanda kelulusan praktikum, predikat prestasi dekanat, dan lencana kompetensi mahasiswa.
              </p>
            </div>
            <button
              type="button"
              disabled={!isDemo}
              title={!isDemo ? 'Fitur ini belum aktif' : undefined}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black text-xs font-black shadow-xs transition-all shrink-0',
                isDemo
                  ? 'bg-white text-black hover:bg-neutral-100 cursor-pointer'
                  : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Desain Template Baru</span>
              {!isDemo && <span className="text-xs bg-neutral-200 px-1.5 py-0.2 rounded font-mono text-neutral-600">(Belum Aktif)</span>}
            </button>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Nama Template Kredensial</th>
                    <th className="p-3.5 sm:p-4">Jenis Kredensial</th>
                    <th className="p-3.5 sm:p-4">Penerbit Resmi</th>
                    <th className="p-3.5 sm:p-4">Kriteria Kelayakan</th>
                    <th className="p-3.5 sm:p-4 text-center">Diterbitkan</th>
                    <th className="p-3.5 sm:p-4 text-center">Status Template</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {certificates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-black/60 font-mono text-xs">
                        Belum ada template sertifikat tersimpan di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    certificates.map((c) => (
                      <tr key={c.id} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black max-w-sm">
                          <div>{c.name}</div>
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <span className="px-2 py-0.5 rounded border border-black bg-retro-warm font-mono text-xs font-bold">
                            {c.type}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/80">{c.issuer}</td>
                        <td className="p-3.5 sm:p-4 text-xs text-black/70">{c.criteria}</td>
                        <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-black">{c.issuedCount} Penerima</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-2.5 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 font-mono text-xs font-bold">
                            TERVERIFIKASI
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
