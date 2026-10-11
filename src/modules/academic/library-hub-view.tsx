'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Bookmark,
  Download,
  PlusCircle,
  FolderArchive,
  Layers,
  UploadCloud,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';

interface BookItem {
  id: string;
  title: string;
  author: string;
  category: string;
  year: string;
  pages: number;
  badge: string;
  fileSize?: string;
}

interface LibraryHubViewProps {
  books: BookItem[];
  isStaffOrLecturer: boolean;
  isDemo?: boolean;
}

export function LibraryHubView({ books, isStaffOrLecturer, isDemo = true }: LibraryHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab = isStaffOrLecturer && tabParam === 'kelola' ? 'kelola' : 'koleksi';

  const setTab = (tab: 'koleksi' | 'kelola') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/library?${params.toString()}`);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Upload Form State (Kelola)
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Modul Kuliah');
  const [year, setYear] = useState('2026');
  const [pages, setPages] = useState('120');
  const [badge, setBadge] = useState('Modul Internal');
  const [file, setFile] = useState<File | null>(null);
  const [isSuccessUpload, setIsSuccessUpload] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // TODO(backend): Di Fase 3, unggah dokumen PDF pustaka ke Supabase Storage bucket 'library-books' dan simpan metadata ke tabel 'library_catalog'
      setIsSuccessUpload(true);
      setTimeout(() => {
        setIsSuccessUpload(false);
        setTitle('');
        setAuthor('');
        setFile(null);
        setTab('koleksi');
      }, 1500);
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER RETRO */}
      <RetroWindow
        title="pustaka_digital_referensi.app"
        badge={isStaffOrLecturer ? 'Portal Pengajar & Staf' : 'Koleksi Terbuka'}
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
                Pustaka Digital & Modul Terbuka
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Akses literatur akademik terverifikasi, e-book resmi, diktat perkuliahan, dan jurnal ilmiah untuk mendukung pembelajaran mandiri.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-mono font-black text-black shadow-retro">
              {books.length} Dokumen Tersedia
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB CONTROLLER (JIKA DOSEN / STAF) */}
      {isStaffOrLecturer && (
        <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('koleksi')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0',
              activeTab === 'koleksi'
                ? 'bg-retro-orange text-white shadow-retro'
                : 'bg-white text-black hover:bg-retro-warm shadow-xs'
            )}
          >
            <BookOpen className="h-4 w-4" />
            <span>Koleksi Pustaka ({filteredBooks.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('kelola')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0',
              activeTab === 'kelola'
                ? 'bg-retro-orange text-white shadow-retro'
                : 'bg-white text-black hover:bg-retro-warm shadow-xs'
            )}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Kelola & Unggah Pustaka</span>
          </button>
        </div>
      )}

      {/* 3. TAB 1: KOLEKSI PUSTAKA */}
      {activeTab === 'koleksi' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-retro-warm border-2 border-black rounded-xl shadow-retro">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/50" />
              <input
                type="text"
                placeholder="Cari buku, modul, penulis, atau kata kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border-2 border-black bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-retro-orange"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold shrink-0">Kategori:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border-2 border-black bg-white text-xs sm:text-sm font-bold"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Rekayasa Perangkat Lunak">Rekayasa Perangkat Lunak</option>
                <option value="Basis Data Terdistribusi">Basis Data Terdistribusi</option>
                <option value="Kecerdasan Buatan">Kecerdasan Buatan</option>
                <option value="Modul Kuliah">Modul Kuliah</option>
                <option value="Jaringan Komputer">Jaringan Komputer</option>
                <option value="Struktur Data & Algoritma">Struktur Data & Algoritma</option>
              </select>
            </div>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <BookOpen className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-black">Tidak Ada Buku Ditemukan</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Tidak ada dokumen pustaka yang cocok dengan kriteria pencarian atau filter yang dipilih.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
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
                        {book.pages} Hlm &bull; {book.year}
                      </span>
                    </div>

                    <h2 className="font-heading font-black text-xl text-black leading-snug line-clamp-2">
                      {book.title}
                    </h2>

                    <p className="text-sm text-black font-medium">
                      Penulis: <span className="font-bold text-black">{book.author}</span> &bull; {book.category}
                    </p>
                  </div>

                  <div className="pt-4 border-t-2 border-black/10 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => alert(`Buku "${book.title}" disimpan ke daftar bacaan pribadi.`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-white text-black text-xs font-black hover:bg-retro-warm shadow-xs transition-colors cursor-pointer"
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                      <span>Simpan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => alert(`Mengunduh berkas pustaka: ${book.title}.pdf`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-2 border-black bg-retro-yellow text-black text-xs font-black shadow-xs hover:bg-black hover:text-white transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Unduh PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: KELOLA & UNGGAH PUSTAKA (KHUSUS DOSEN/STAF) */}
      {isStaffOrLecturer && activeTab === 'kelola' && (
        <div className="max-w-3xl space-y-6">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl">
            <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-retro-orange" />
              <span>Unggah Modul Perkuliahan & Buku Referensi Baru</span>
            </h2>
            <p className="text-xs text-black/70 mt-1">
              Sebagai pengajar, Anda dapat mempublikasikan diktat, slide rangkuman, modul praktikum lab, atau buku digital ke katalog pustaka mahasiswa.
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="rounded-xl border-2 border-black bg-white p-6 shadow-retro space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-black font-mono">
                Judul Buku / Modul Perkuliahan
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Modul Praktikum Jaringan Komputer & Cloud 2026"
                className="w-full rounded-lg border-2 border-black p-3 text-xs sm:text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-retro-orange"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-black font-mono">
                  Nama Penulis / Tim Penyusun
                </label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Contoh: Tim Dosen Pemrograman Web"
                  className="w-full rounded-lg border-2 border-black p-3 text-xs sm:text-sm font-medium bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-black font-mono">
                  Kategori Pembahasan
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border-2 border-black p-3 text-xs sm:text-sm font-bold bg-white"
                >
                  <option value="Modul Kuliah">Modul Kuliah</option>
                  <option value="Rekayasa Perangkat Lunak">Rekayasa Perangkat Lunak</option>
                  <option value="Basis Data Terdistribusi">Basis Data Terdistribusi</option>
                  <option value="Kecerdasan Buatan">Kecerdasan Buatan</option>
                  <option value="Jaringan Komputer">Jaringan Komputer</option>
                  <option value="Struktur Data & Algoritma">Struktur Data & Algoritma</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-black font-mono">Tahun Terbit</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-lg border-2 border-black p-2.5 text-xs sm:text-sm font-mono bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-black font-mono">Jumlah Halaman</label>
                <input
                  type="number"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="w-full rounded-lg border-2 border-black p-2.5 text-xs sm:text-sm font-mono bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-black font-mono">Label Badge</label>
                <select
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full rounded-lg border-2 border-black p-2.5 text-xs sm:text-sm font-bold bg-white"
                >
                  <option value="Modul Internal">Modul Internal</option>
                  <option value="Buku Utama">Buku Utama</option>
                  <option value="Buku Rujukan">Buku Rujukan</option>
                  <option value="Referensi Standar">Referensi Standar</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-black font-mono">
                Berkas PDF Pustaka (Maks. 50 MB)
              </label>
              <div className="p-5 rounded-lg border-2 border-dashed border-black bg-neutral-50 text-center space-y-2">
                <UploadCloud className="h-8 w-8 text-black/50 mx-auto" />
                <p className="text-xs font-bold text-black">
                  {file ? file.name : 'Klik untuk memilih berkas PDF pustaka'}
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-xs cursor-pointer"
                />
              </div>
            </div>

            {!isDemo && (
              <div className="p-3 rounded-lg border-2 border-black bg-amber-50 text-xs text-amber-950 font-medium space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-900" />
                  <span>Pemberitahuan Persistensi Database (Fase 3)</span>
                </p>
                <p>
                  Penyimpanan dokumen e-book/modul ke Supabase Storage bucket &lsquo;library-books&rsquo; sedang dalam penyiapan. Di luar mode demo, publikasi dinonaktifkan untuk mencegah sukses palsu.
                </p>
              </div>
            )}

            <div className="pt-3 border-t-2 border-black flex items-center justify-between">
              {isSuccessUpload && (
                <span className="text-xs font-bold font-mono text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Koleksi berhasil diunggah ke katalog pustaka!
                </span>
              )}
              {!isDemo ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-2 border-black bg-neutral-200 text-neutral-500 text-xs sm:text-sm font-black cursor-not-allowed ml-auto"
                >
                  <span>Fitur Segera Aktif (Belum Tersimpan ke Database)</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border-2 border-black bg-black text-white text-xs sm:text-sm font-black shadow-retro hover:bg-neutral-800 transition-all cursor-pointer ml-auto"
                >
                  <span>{isPending ? 'Mengunggah...' : 'Publikasikan ke Katalog'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
