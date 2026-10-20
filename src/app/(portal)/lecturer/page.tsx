import React from 'react';
import Link from 'next/link';
import { listPendingReviewsAction } from '@/modules/academic/actions';
import {
  BookOpen,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  GraduationCap,
  PlusCircle,
} from 'lucide-react';

export default async function LecturerPortalPage() {
  const { classes, items } = await listPendingReviewsAction();
  const totalPending = items.reduce((sum, it) => sum + it.pending, 0);

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER HALAMAN BERANDA DOSEN RETRO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b-2 border-black/15 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 border border-black bg-gray-soft rounded text-[11px] font-mono font-bold text-black uppercase">
              <span>PORTAL PENGAJAR</span>
              <span>•</span>
              <span>SEMESTER 2026/2027 GANJIL</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-black flex items-center gap-2.5">
              <BookOpen className="h-7 w-7 text-black inline-block" />
              <span>Ruang Pengampu Dosen</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/80 font-bold max-w-2xl leading-relaxed">
              Pantau antrean pengumpulan tugas mahasiswa, koreksi jawaban, dan finalisasi nilai perkuliahan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/classes"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white text-black font-black text-xs sm:text-sm transition-all shadow-retro cursor-pointer"
            >
              <Layers className="h-4 w-4" />
              <span>Kelola {classes} Kelas</span>
            </Link>
          </div>
        </div>

        {/* 3 Kartu Metrik Ringkasan Dosen (Retro Cards Berbingkai Hitam Tegas) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg border-2 border-black bg-gray-soft text-black shadow-retro-sm">
              <Layers className="h-6 w-6 text-black" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Kelas Aktif</p>
              <p className="font-heading font-black text-2xl sm:text-3xl text-black leading-tight">{classes}</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg border-2 border-black bg-gray-soft text-black shadow-retro-sm">
              <Clock className="h-6 w-6 text-black" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Tugas Menunggu Koreksi</p>
              <p className="font-heading font-black text-2xl sm:text-3xl text-black leading-tight">{items.length}</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg border-2 border-black bg-gray-soft text-black shadow-retro-sm">
              <GraduationCap className="h-6 w-6 text-black" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider">Total Submisi Mahasiswa</p>
              <p className="font-heading font-black text-2xl sm:text-3xl text-black leading-tight">{totalPending}</p>
            </div>
          </div>
        </div>

        {/* 2. DAFTAR TUGAS PERLU DIREVIEW (RETRO WINDOW BOX) */}
        <div className="rounded-xl border-2 border-black bg-white shadow-retro-md overflow-hidden">
          <div className="p-4 sm:p-5 border-b-2 border-black bg-gray-soft flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-black bg-black inline-block" />
              <span className="h-3 w-3 rounded-full border border-black bg-white inline-block" />
              <h2 className="font-heading font-black text-sm sm:text-base text-black flex items-center gap-2 ml-1">
                <ClipboardList className="h-4 w-4 text-black" />
                <span>Tugas Mahasiswa yang Perlu Direview</span>
              </h2>
            </div>
            <span className="text-xs font-mono font-black text-black px-2.5 py-0.5 rounded border border-black bg-white shadow-retro-sm">
              {totalPending} Submisi
            </span>
          </div>

          <div className="p-4 sm:p-5">
            {classes === 0 ? (
              <div className="p-8 text-center rounded-xl border-2 border-dashed border-black bg-gray-soft/40 space-y-3">
                <BookOpen className="h-8 w-8 text-black mx-auto" />
                <p className="text-sm font-heading font-black text-black">Anda Belum Memiliki Kelas Aktif</p>
                <p className="text-xs text-black/80 font-bold max-w-md mx-auto">
                  Mulai semester dengan membuka kelas perkuliahan baru, lalu bagikan kode kelas kepada mahasiswa Anda.
                </p>
                <Link
                  href="/classes"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black bg-black text-white text-xs font-black shadow-retro hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Buka Kelas Pertama Sekarang</span>
                </Link>
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center rounded-xl border-2 border-dashed border-black bg-gray-soft/40 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-black mx-auto" />
                <p className="text-sm font-heading font-black text-black">Seluruh Tugas Telah Dinilai!</p>
                <p className="text-xs text-black/80 font-bold max-w-md mx-auto">
                  Tidak ada submisi tugas mahasiswa yang tertunda. Nilai akhir kelas siap untuk difinalisasi.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((t, i) => (
                  <Link
                    key={t.assignment_id}
                    href={`/classes/${t.class_id}/assignments/${t.assignment_id}`}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border-2 border-black bg-white shadow-retro hover:bg-gray-soft/50 transition-all focus-visible:outline-none cursor-pointer"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded border border-black bg-black text-white text-xs font-mono font-black">
                          {t.class_title}
                        </span>
                        <h3 className="font-heading font-black text-sm text-black group-hover:underline underline-offset-4">
                          {t.title}
                        </h3>
                      </div>
                      <p className="text-xs text-black/75 font-medium">
                        Periksa jawaban mahasiswa dan berikan skor nilai akhir.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="px-2.5 py-1 rounded border border-black bg-gray-soft text-black font-mono font-bold text-xs shadow-retro-sm">
                        {t.pending}/{t.total} Belum Dinilai
                      </span>
                      <div className="flex items-center gap-1 text-xs font-black text-black group-hover:translate-x-1 transition-transform">
                        <span>Nilai</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
