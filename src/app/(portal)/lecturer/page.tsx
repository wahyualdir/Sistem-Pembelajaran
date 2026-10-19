import React from 'react';
import Link from 'next/link';
import { listPendingReviewsAction } from '@/modules/academic/actions';
import { RetroWindow } from '@/components/retro/retro-window';
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
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER HALAMAN BERANDA STANDARD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Ruang Pengampu Dosen
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Pantau antrean pengumpulan tugas mahasiswa, koreksi jawaban, dan finalisasi nilai
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/classes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-surface hover:bg-gray-soft text-ink font-sans font-bold text-xs sm:text-sm transition-all shadow-xs"
            >
              <Layers className="h-4 w-4 text-primary" />
              <span>Kelola {classes} Kelas</span>
            </Link>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              SEMESTER AKTIF 2026/2027
            </span>
          </div>
        </div>

        {/* 3 Kartu Metrik Ringkasan Dosen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg border-2 border-ink bg-gray-soft text-ink shadow-xs">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">Kelas Aktif</p>
              <p className="font-heading font-bold text-2xl sm:text-3xl text-ink leading-tight">{classes}</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg border-2 border-ink bg-gray-soft text-ink shadow-xs">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">Tugas Menunggu Koreksi</p>
              <p className="font-heading font-bold text-2xl sm:text-3xl text-ink leading-tight">{items.length}</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl border-2 border-ink bg-surface shadow-retro flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg border-2 border-ink bg-gray-soft text-ink shadow-xs">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">Total Submisi Pending</p>
              <p className="font-heading font-bold text-2xl sm:text-3xl text-ink leading-tight">{totalPending}</p>
            </div>
          </div>
        </div>

        {/* 2. DAFTAR TUGAS PERLU DIREVIEW */}
        <div className="rounded-xl border-2 border-ink bg-surface shadow-retro overflow-hidden">
          <div className="p-4 sm:p-5 border-b-2 border-ink bg-gray-soft flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-ink flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span>Tugas Mahasiswa yang Perlu Direview</span>
            </h2>
            <span className="text-xs font-sans font-bold text-gray-dark">
              {totalPending} submisi mahasiswa
            </span>
          </div>

          <div className="p-4 sm:p-5">
            {classes === 0 ? (
              <div className="p-8 text-center rounded-xl border-2 border-dashed border-ink bg-gray-soft/30 space-y-3">
                <BookOpen className="h-8 w-8 text-gray-dark mx-auto" />
                <p className="text-sm font-heading font-bold text-ink">Anda Belum Memiliki Kelas Aktif</p>
                <p className="text-xs text-gray-dark font-bold max-w-md mx-auto">
                  Mulai semester dengan membuka kelas perkuliahan baru, lalu bagikan kode kelas kepada mahasiswa Anda.
                </p>
                <Link
                  href="/classes"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-ink bg-primary text-white text-xs font-bold shadow-retro hover:bg-neutral-800 transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Buka Kelas Pertama Sekarang</span>
                </Link>
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center rounded-xl border-2 border-dashed border-ink bg-gray-soft/30 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-primary mx-auto" />
                <p className="text-sm font-heading font-bold text-ink">Seluruh Tugas Telah Dinilai!</p>
                <p className="text-xs text-gray-dark font-bold max-w-md mx-auto">
                  Tidak ada submisi tugas mahasiswa yang tertunda. Nilai akhir kelas siap untuk difinalisasi.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((t, i) => (
                  <Link
                    key={t.assignment_id}
                    href={`/classes/${t.class_id}/assignments/${t.assignment_id}`}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border-2 border-ink bg-surface shadow-retro hover:bg-gray-soft/40 transition-all focus-visible:outline-none"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded border border-ink bg-gray-soft text-xs font-sans font-bold text-ink">
                          {t.class_title}
                        </span>
                        <h3 className="font-heading font-bold text-sm text-ink group-hover:text-primary transition-colors">
                          {t.title}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-dark font-bold">
                        Periksa jawaban mahasiswa dan berikan skor nilai akhir.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="px-2.5 py-1 rounded border border-ink bg-gray-soft text-ink font-sans font-bold text-xs shadow-xs">
                        {t.pending} dari {t.total} belum dinilai
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                        <span>Nilai Sekarang</span>
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
