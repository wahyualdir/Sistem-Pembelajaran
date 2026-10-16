import React from 'react';
import Link from 'next/link';
import { listPendingReviewsAction } from '@/modules/academic/actions';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  Users,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  FileCheck,
} from 'lucide-react';

export default async function AssistantPortalPage() {
  const { classes, items } = await listPendingReviewsAction();
  const totalPending = items.reduce((sum, it) => sum + it.pending, 0);

  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW ASISTEN DOSEN */}
      <RetroWindow
        title="asisten_dosen_portal.app"
        badge="ROLE: ASISTEN DOSEN"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-6 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border-[1.5px] border-retro-border bg-primary text-white shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <h1 className="font-heading font-black text-2xl tracking-tight text-foreground">
                Antrean Peninjauan Tugas Asistensi
              </h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl mt-1">
              Daftar pengumpulan tugas mahasiswa di kelas asistensi Anda yang memerlukan review, koreksi, dan penilaian.
              Anda memiliki hak review sesuai mandat dan delegasi dosen pengampu kelas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-retro-border bg-retro-warm px-3 py-1 text-xs font-mono font-bold text-foreground">
              {classes} Kelas Asistensi
            </span>
          </div>
        </div>

        {/* Metrik Ringkasan Asdos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-retro-border/40 mt-5">
          <div className="p-3.5 rounded-lg border border-retro-border bg-retro-warm/70 shadow-xs flex items-center gap-3">
            <div className="p-2 rounded border border-retro-border bg-retro-surface text-foreground">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-muted-foreground uppercase">Kelas Terdaftar</p>
              <p className="font-heading font-black text-2xl text-foreground leading-tight">{classes}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-retro-border bg-retro-yellow/40 shadow-xs flex items-center gap-3">
            <div className="p-2 rounded border border-retro-border bg-retro-surface text-foreground">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-foreground uppercase">Tugas Perlu Review</p>
              <p className="font-heading font-black text-2xl text-foreground leading-tight">{items.length}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-retro-border bg-retro-mint/40 shadow-xs flex items-center gap-3">
            <div className="p-2 rounded border border-retro-border bg-retro-surface text-foreground">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-foreground uppercase">Total Submisi Pending</p>
              <p className="font-heading font-black text-2xl text-foreground leading-tight">{totalPending}</p>
            </div>
          </div>
        </div>
      </RetroWindow>

      {/* 2. DAFTAR ANTREAN REVIEW */}
      <RetroWindow
        title={`antrean_peninjauan_tugas.list (${items.length})`}
        badge={items.length > 0 ? 'TUGAS AKTIF' : 'SELESAI'}
        headerClassName="bg-retro-warm"
        bodyClassName="p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-black text-base text-foreground flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <span>Daftar Pengumpulan Menunggu Penilaian</span>
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {totalPending} berkas belum dinilai
          </span>
        </div>

        {classes === 0 ? (
          <div className="p-8 text-center rounded-lg border border-dashed border-retro-border bg-retro-warm/30 space-y-2">
            <Users className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-bold text-foreground">Belum Ada Penugasan Asisten</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Anda belum ditugaskan sebagai asisten di kelas mana pun. Dosen pengampu menugaskan asisten langsung dari halaman manajemen kelasnya.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center rounded-lg border border-dashed border-retro-border bg-retro-warm/30 space-y-2">
            <CheckCircle2 className="h-8 w-8 text-retro-mint mx-auto" />
            <p className="text-sm font-bold text-foreground">Semua Tugas Selesai Ditinjau!</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Tidak ada pengumpulan tugas mahasiswa yang menunggu peninjauan saat ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((t, i) => (
              <Link
                key={t.assignment_id}
                href={`/classes/${t.class_id}/assignments/${t.assignment_id}`}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border-[1.5px] border-retro-border bg-retro-surface shadow-retro hover:bg-retro-warm/40 transition-all focus-visible:outline-none"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-retro-warm border border-retro-border text-xs font-mono font-bold text-foreground">
                      {t.class_title}
                    </span>
                    <h3 className="font-heading font-bold text-sm text-foreground group-hover:text-primary-dark transition-colors">
                      {t.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tinjau jawaban dan masukkan evaluasi penilaian untuk mahasiswa.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="px-2.5 py-1 rounded border border-retro-border bg-retro-yellow text-black font-mono font-bold text-xs shadow-xs">
                    {t.pending} dari {t.total} belum dinilai
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                    <span>Buka</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </RetroWindow>
    </div>
  );
}
