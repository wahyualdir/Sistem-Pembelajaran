import React from 'react';
import { listChangeRequestsAction } from '@/modules/academic/actions';
import { ChangeDecision } from '@/modules/academic/change-decision';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  Compass,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  AlertCircle,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';

const fmt = (iso: string) =>
  `${new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  })} WIB`;

import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

export default async function CoordinatorPortalPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role !== 'PROGRAM_COORDINATOR' && !user?.isImpersonating) {
    if (role === 'LECTURER') redirect('/lecturer');
    if (role === 'STUDENT') redirect('/student');
    if (role === 'TEACHING_ASSISTANT') redirect('/ta');
    if (role === 'ACADEMIC_STAFF') redirect('/staff');
    redirect('/login');
  }

  const all = await listChangeRequestsAction();
  const pending = all.filter((r) => r.status === 'PENDING');
  const approved = all.filter((r) => r.status === 'APPROVED');
  const rejected = all.filter((r) => r.status === 'REJECTED');
  const done = all.filter((r) => r.status !== 'PENDING');

  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW KOORDINATOR PRODI */}
      <RetroWindow
        title="kaprodi_persetujuan_nilai.portal"
        badge="ROLE: KAPRODI"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-6 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border-[1.5px] border-retro-border bg-primary text-white shadow-xs">
                <Compass className="h-5 w-5" />
              </div>
              <h1 className="font-heading font-black text-2xl tracking-tight text-foreground">
                Persetujuan Perubahan Nilai
              </h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl mt-1">
              Validasi pengajuan dosen untuk merevisi nilai mahasiswa yang telah difinalisasi.
              Setiap keputusan akan tercatat di riwayat audit dan memperbarui transkrip mahasiswa secara otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-retro-border bg-retro-warm px-3 py-1 text-xs font-mono font-bold text-foreground">
              Semester Ganjil 2026/2027
            </span>
          </div>
        </div>

        {/* 4 Kartu Metrik Ringkasan Kaprodi */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-retro-border/40 mt-5">
          <div className="p-3 rounded-lg border border-retro-border bg-retro-warm/70 shadow-xs text-center">
            <p className="text-xs font-mono font-bold text-muted-foreground uppercase">Total Pengajuan</p>
            <p className="font-heading font-black text-2xl text-foreground mt-0.5">{all.length}</p>
          </div>
          <div className="p-3 rounded-lg border border-retro-border bg-retro-yellow/40 shadow-xs text-center">
            <p className="text-xs font-mono font-bold text-foreground uppercase">Menunggu Review</p>
            <p className="font-heading font-black text-2xl text-foreground mt-0.5">{pending.length}</p>
          </div>
          <div className="p-3 rounded-lg border border-retro-border bg-retro-mint/40 shadow-xs text-center">
            <p className="text-xs font-mono font-bold text-foreground uppercase">Disetujui</p>
            <p className="font-heading font-black text-2xl text-foreground mt-0.5">{approved.length}</p>
          </div>
          <div className="p-3 rounded-lg border border-retro-border bg-retro-pink/40 shadow-xs text-center">
            <p className="text-xs font-mono font-bold text-foreground uppercase">Ditolak</p>
            <p className="font-heading font-black text-2xl text-foreground mt-0.5">{rejected.length}</p>
          </div>
        </div>
      </RetroWindow>

      {/* 2. DAFTAR PERMINTAAN MENUNGGU KEPUTUSAN */}
      <RetroWindow
        title={`antrean_menunggu_keputusan.list (${pending.length})`}
        badge={pending.length > 0 ? 'MEMBUTUHKAN TINDAKAN' : 'BERSIH'}
        headerClassName="bg-retro-warm"
        bodyClassName="p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-black text-base text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>Pengajuan Menunggu Keputusan</span>
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {pending.length} permintaan pending
          </span>
        </div>

        {pending.length === 0 ? (
          <div className="p-8 text-center rounded-lg border border-dashed border-retro-border bg-retro-warm/30 space-y-2">
            <CheckCircle2 className="h-8 w-8 text-retro-mint mx-auto" />
            <p className="text-sm font-bold text-foreground">Tidak Ada Antrean Menunggu</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Semua pengajuan perubahan nilai dari dosen pengampu telah Anda tinjau dan putuskan.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {pending.map((r, i) => (
              <div
                key={r.id}
                className="p-4 rounded-lg border-[1.5px] border-retro-border bg-retro-surface shadow-retro space-y-3 animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-retro-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-retro-yellow text-black border border-retro-border text-xs font-mono font-bold">
                      PERMINTAAN NILAI
                    </span>
                    <h3 className="font-heading font-bold text-sm text-foreground">
                      {r.assignment_title}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {fmt(r.created_at)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">
                      Kelas: <strong className="text-foreground">{r.class_title}</strong>
                    </p>
                    <p className="text-muted-foreground">
                      Mahasiswa: <strong className="text-foreground">{r.student_name}</strong>
                    </p>
                  </div>
                  <div className="flex items-center sm:justify-end gap-2">
                    <span className="px-2.5 py-1 rounded border border-retro-border bg-retro-warm font-mono font-bold text-muted-foreground">
                      Nilai Awal: {r.old_score}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="px-2.5 py-1 rounded border border-retro-border bg-retro-mint text-black font-mono font-bold shadow-xs">
                      Usulan: {r.proposed_score}
                    </span>
                  </div>
                </div>

                <div className="rounded border border-retro-border/60 bg-retro-warm/50 p-2.5 text-xs">
                  <p className="font-mono text-xs font-bold text-muted-foreground uppercase mb-0.5">
                    Alasan Perubahan oleh Dosen:
                  </p>
                  <p className="text-foreground italic whitespace-pre-wrap">{r.reason}</p>
                </div>

                <div className="pt-1">
                  <ChangeDecision id={r.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </RetroWindow>

      {/* 3. RIWAYAT KEPUTUSAN */}
      {done.length > 0 && (
        <RetroWindow
          title={`riwayat_keputusan_perubahan.log (${done.length})`}
          headerClassName="bg-retro-warm"
          bodyClassName="p-5 space-y-3"
        >
          <h2 className="font-heading font-black text-base text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>Riwayat Keputusan Perubahan Nilai</span>
          </h2>

          <div className="divide-y divide-retro-border/40 border border-retro-border rounded-lg bg-retro-surface overflow-hidden">
            {done.map((r, i) => (
              <div
                key={r.id}
                className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-retro-warm/30 transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="space-y-0.5 min-w-[200px]">
                  <p className="font-bold text-foreground">
                    {r.assignment_title} &bull; <span className="font-normal text-muted-foreground">{r.student_name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Perubahan: {r.old_score} &rarr; {r.proposed_score}
                  </p>
                  {r.review_note && (
                    <p className="text-xs text-muted-foreground italic">Catatan: {r.review_note}</p>
                  )}
                </div>

                <div>
                  {r.status === 'APPROVED' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-retro-border bg-retro-mint text-black font-bold text-xs shadow-xs">
                      <CheckCircle2 className="h-3 w-3" />
                      Disetujui
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-retro-border bg-danger text-white font-bold text-xs shadow-xs">
                      <XCircle className="h-3 w-3" />
                      Ditolak
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </RetroWindow>
      )}
    </div>
  );
}
