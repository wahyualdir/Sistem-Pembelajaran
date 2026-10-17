import React from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Users,
  PlusCircle,
  ThumbsUp,
  Pin,
  Clock,
  ArrowRight,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

const THREADS = [
  {
    id: 'th-1',
    title: 'Tips Menyusun Rancangan Skripsi TI: Deep Learning vs Cloud Security',
    author: 'Andi Mahasiswa',
    authorRole: 'Mahasiswa Angkatan 2023',
    excerpt: 'Diskusi seputar penentuan topik skripsi yang aplikatif dan relevan dengan industri software terkini di Riau, serta tips memilih dataset yang valid.',
    replies: 14,
    views: 180,
    category: 'Akademik',
    isPinned: true,
    lastActive: '10 menit lalu',
  },
  {
    id: 'th-2',
    title: 'Diskusi Praktikum Web Lanjut: Cara Mengatasi CORS di Supabase Local',
    author: 'Citra Asisten',
    authorRole: 'Asisten Laboratorium TI',
    excerpt: 'Solusi konfigurasi header Access-Control-Allow-Origin saat menghubungkan Next.js App Router dengan docker Supabase lokal di Windows/WSL2.',
    replies: 8,
    views: 95,
    category: 'Praktikum',
    isPinned: false,
    lastActive: '25 menit lalu',
  },
  {
    id: 'th-3',
    title: 'Rekomendasi Server Linux Murah untuk Deployment Microservices Mahasiswa',
    author: 'Budi Santoso',
    authorRole: 'Mahasiswa Senior',
    excerpt: 'Komparasi performa CPU, bandwidth, dan biaya bulanan antara VPS lokal Indonesia vs provider cloud global untuk hosting portfolio UAS.',
    replies: 22,
    views: 310,
    category: 'Teknologi',
    isPinned: false,
    lastActive: '2 jam lalu',
  },
  {
    id: 'th-4',
    title: 'Persiapan Sertifikasi AWS Certified Solutions Architect untuk Mahasiswa',
    author: 'Dimas Aditya',
    authorRole: 'Alumni TI UIR',
    excerpt: 'Sharing jalur sertifikasi cloud computing, cara klaim voucher diskon institusi UIR, dan bank soal simulasi ujian resmi AWS Associate.',
    replies: 11,
    views: 240,
    category: 'Karir & Sertifikasi',
    isPinned: false,
    lastActive: '4 jam lalu',
  },
];

export default function ForumPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="forum_diskusi_komunitas.app"
        badge="Komunitas Aktif"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Forum Komunitas Umum
              </h1>
            </div>
            <p className="text-base sm:text-lg text-black font-medium max-w-3xl leading-relaxed">
              Tanyakan kendala teknis perkuliahan, bagikan informasi teknologi terbaru, dan diskusikan topik riset bersama mahasiswa dan dosen pengampu.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black bg-black text-white font-heading font-bold text-sm sm:text-base shadow-retro hover:bg-neutral-800 transition-all shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Buat Topik Diskusi</span>
            </button>
          </div>
        </div>
      </RetroWindow>

      {/* 2. GRID KARTU THREAD DISKUSI (PROPORSIONAL & HIGH CONTRAST) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
        {THREADS.map((th) => (
          <div
            key={th.id}
            className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:shadow-retro-md transition-all"
          >
            <div className="space-y-3.5">
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-sans text-xs sm:text-sm font-bold px-3 py-1 rounded border-2 border-black bg-gray-soft text-black shadow-xs">
                  {th.category}
                </span>

                {th.isPinned && (
                  <span className="inline-flex items-center gap-1.5 font-sans text-xs sm:text-sm font-bold text-black bg-gray-soft px-2.5 py-1 rounded border-2 border-black shadow-xs">
                    <Pin className="h-3.5 w-3.5 fill-black text-black" />
                    <span>Disematkan</span>
                  </span>
                )}
              </div>

              {/* Title & Excerpt */}
              <div className="space-y-2">
                <h2 className="font-heading font-bold text-xl sm:text-2xl text-black leading-snug line-clamp-2">
                  {th.title}
                </h2>
                <p className="text-sm sm:text-base text-neutral-800 font-medium leading-relaxed">
                  {th.excerpt}
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-2 text-xs sm:text-sm text-neutral-900 font-medium flex items-center justify-between">
                <span>
                  Oleh <strong className="text-black font-bold">{th.author}</strong> ({th.authorRole})
                </span>
                <span className="text-neutral-700 font-sans">
                  Aktif: {th.lastActive}
                </span>
              </div>
            </div>

            {/* Bottom Meta & Action */}
            <div className="pt-3.5 border-t-2 border-black/10 flex items-center justify-between text-xs sm:text-sm font-sans font-bold">
              <div className="flex items-center gap-4 text-black">
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span>{th.replies} Balasan</span>
                </span>
                <span className="flex items-center gap-1.5 text-neutral-700">
                  <Eye className="h-4 w-4" />
                  <span>{th.views} Dilihat</span>
                </span>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black bg-gray-soft text-black font-heading font-bold text-xs sm:text-sm hover:bg-black hover:text-white shadow-xs transition-all"
              >
                <span>Lihat Diskusi</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
