import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Download,
  Bookmark,
  Search,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const BOOKS = [
  {
    id: 'lib-1',
    title: 'Clean Architecture: A Craftsman’s Guide to Software Structure',
    author: 'Robert C. Martin',
    category: 'Rekayasa Perangkat Lunak',
    year: '2023',
    pages: 432,
    badge: 'Buku Utama',
  },
  {
    id: 'lib-2',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: 'Basis Data Terdistribusi',
    year: '2022',
    pages: 616,
    badge: 'Buku Rujukan',
  },
  {
    id: 'lib-3',
    title: 'Artificial Intelligence: A Modern Approach (4th Ed)',
    author: 'Stuart Russell & Peter Norvig',
    category: 'Kecerdasan Buatan',
    year: '2024',
    pages: 1152,
    badge: 'Referensi Standar',
  },
  {
    id: 'lib-4',
    title: 'Fullstack Next.js 14 & Supabase Architecture',
    author: 'Tim Dosen Pemrograman Web',
    category: 'Modul Kuliah',
    year: '2026',
    pages: 198,
    badge: 'Modul Internal',
  },
  {
    id: 'lib-5',
    title: 'Computer Networking: A Top-Down Approach (8th Ed)',
    author: 'James Kurose & Keith Ross',
    category: 'Jaringan Komputer',
    year: '2023',
    pages: 864,
    badge: 'Buku Utama',
  },
  {
    id: 'lib-6',
    title: 'Introduction to Algorithms (CLRS 4th Ed)',
    author: 'Thomas H. Cormen et al.',
    category: 'Struktur Data & Algoritma',
    year: '2022',
    pages: 1312,
    badge: 'Referensi Standar',
  },
];

export default function LibraryPage() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title="pustaka_digital_referensi.app"
        subtitle="Koleksi Buku Elektronik, Modul Praktikum, dan Jurnal Rujukan"
        headerBadge="Koleksi Terbuka"
        headerBadgeVariant="success"
      >
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-retro-orange" />
              <span>Pustaka Digital & Modul Terbuka</span>
            </h1>
            <p className="text-base sm:text-lg text-black font-medium max-w-3xl leading-relaxed">
              Akses literatur akademik terverifikasi, e-book resmi, diktat perkuliahan, dan jurnal ilmiah untuk mendukung pembelajaran mandiri.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-full border-2 border-black bg-white px-4 py-1.5 text-sm sm:text-base font-mono font-black text-black shadow-xs">
              {BOOKS.length} Dokumen Tersedia
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* Grid 3 Kolom Pustaka Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BOOKS.map((book) => (
          <div
            key={book.id}
            className="rounded-xl border-2 border-black bg-white p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:shadow-retro-md transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded border-2 border-black bg-retro-mint text-xs sm:text-sm font-mono font-black text-black">
                  {book.badge}
                </span>
                <span className="text-sm font-mono font-bold text-black">
                  {book.pages} Hlm · {book.year}
                </span>
              </div>

              <h2 className="font-heading font-black text-xl sm:text-2xl text-black leading-snug">
                {book.title}
              </h2>

              <p className="text-sm sm:text-base text-black font-medium">
                Penulis: <span className="font-bold text-black">{book.author}</span> · {book.category}
              </p>
            </div>

            <div className="pt-4 border-t-2 border-black/10 flex items-center justify-between">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-black bg-white text-black text-sm font-black hover:bg-retro-warm shadow-xs transition-colors"
              >
                <Bookmark className="h-4 w-4" />
                <span>Simpan</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-black bg-retro-yellow text-black text-sm font-black shadow-xs hover:bg-black hover:text-white transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
