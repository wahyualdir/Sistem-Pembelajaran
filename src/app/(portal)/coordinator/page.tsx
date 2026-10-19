import React from 'react';
import { listChangeRequestsAction } from '@/modules/academic/actions';
import { ChangeDecision } from '@/modules/academic/change-decision';
import {
  Compass,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ArrowRight,
} from 'lucide-react';

const fmt = (iso: string) =>
  `${new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  })} WIB`;

import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getCoordinatorCohortRiskAction } from '@/modules/early-warning/actions';
import { CoordinatorCohortRiskView } from '@/modules/early-warning/coordinator-cohort-risk-view';

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

  const [all, cohortData] = await Promise.all([
    listChangeRequestsAction(),
    getCoordinatorCohortRiskAction(),
  ]);
  const pending = all.filter((r) => r.status === 'PENDING');
  const approved = all.filter((r) => r.status === 'APPROVED');
  const rejected = all.filter((r) => r.status === 'REJECTED');
  const done = all.filter((r) => r.status !== 'PENDING');

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* OPEN HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <Compass className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Persetujuan Perubahan Nilai
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Validasi pengajuan dosen untuk merevisi nilai mahasiswa yang telah difinalisasi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-primary text-white border-2 border-ink shadow-xs">
              ROLE: KAPRODI
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              SEMESTER GANJIL 2026/2027
            </span>
          </div>
        </div>

        {/* 4 KARTU METRIK RINGKASAN */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl border-2 border-ink bg-surface p-4 shadow-retro-sm text-center">
            <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">Total Pengajuan</p>
            <p className="font-heading font-bold text-2xl sm:text-3xl text-ink mt-1">{all.length}</p>
          </div>
          <div className="rounded-xl border-2 border-ink bg-surface p-4 shadow-retro-sm text-center">
            <p className="text-xs font-sans font-bold text-ink uppercase tracking-wider">Menunggu Review</p>
            <p className="font-heading font-bold text-2xl sm:text-3xl text-primary mt-1">{pending.length}</p>
          </div>
          <div className="rounded-xl border-2 border-ink bg-surface p-4 shadow-retro-sm text-center">
            <p className="text-xs font-sans font-bold text-ink uppercase tracking-wider">Disetujui</p>
            <p className="font-heading font-bold text-2xl sm:text-3xl text-ink mt-1">{approved.length}</p>
          </div>
          <div className="rounded-xl border-2 border-ink bg-surface p-4 shadow-retro-sm text-center">
            <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">Ditolak</p>
            <p className="font-heading font-bold text-2xl sm:text-3xl text-ink mt-1">{rejected.length}</p>
          </div>
        </div>

        {/* PERINGATAN DINI MAHASISWA BERISIKO PER ANGKATAN */}
        <CoordinatorCohortRiskView
          cohorts={cohortData.cohorts}
          totalAtRisk={cohortData.totalAtRisk}
        />

        {/* DAFTAR PERMINTAAN MENUNGGU KEPUTUSAN */}
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
            <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Pengajuan Menunggu Keputusan</span>
            </h2>
            <span className="text-xs font-sans font-bold px-2.5 py-1 rounded-full border-2 border-ink bg-gray-soft text-ink shadow-xs">
              {pending.length} Permintaan Pending
            </span>
          </div>

          {pending.length === 0 ? (
            <div className="p-8 text-center rounded-xl border-2 border-dashed border-ink/30 bg-gray-soft/40 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-ink mx-auto" />
              <p className="text-sm font-bold text-ink font-heading">Tidak Ada Antrean Menunggu</p>
              <p className="text-xs text-gray-dark font-bold max-w-md mx-auto">
                Semua pengajuan perubahan nilai dari dosen pengampu telah Anda tinjau dan putuskan.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {pending.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-gray-soft text-ink border-2 border-ink text-[11px] font-sans font-bold">
                        PERMINTAAN NILAI
                      </span>
                      <h3 className="font-heading font-bold text-sm text-ink">
                        {r.assignment_title}
                      </h3>
                    </div>
                    <span className="text-xs text-gray-dark font-sans font-bold flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {fmt(r.created_at)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                    <div className="space-y-1">
                      <p className="text-gray-dark font-bold">
                        Kelas: <strong className="text-ink">{r.class_title}</strong>
                      </p>
                      <p className="text-gray-dark font-bold">
                        Mahasiswa: <strong className="text-ink">{r.student_name}</strong>
                      </p>
                    </div>
                    <div className="flex items-center sm:justify-end gap-2">
                      <span className="px-2.5 py-1 rounded-lg border-2 border-ink bg-gray-soft font-sans font-bold text-gray-dark">
                        Nilai Awal: {r.old_score}
                      </span>
                      <ArrowRight className="h-4 w-4 text-ink" />
                      <span className="px-2.5 py-1 rounded-lg border-2 border-ink bg-surface text-ink font-sans font-bold shadow-xs">
                        Usulan: {r.proposed_score}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border-2 border-ink/30 bg-gray-soft/40 p-3 text-xs font-sans">
                    <p className="font-sans text-xs font-bold text-gray-dark uppercase tracking-wider mb-0.5">
                      Alasan Perubahan oleh Dosen:
                    </p>
                    <p className="text-ink italic whitespace-pre-wrap font-medium">{r.reason}</p>
                  </div>

                  <div className="pt-1">
                    <ChangeDecision id={r.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIWAYAT KEPUTUSAN */}
        {done.length > 0 && (
          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
              <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Riwayat Keputusan Perubahan Nilai</span>
              </h2>
              <span className="text-xs font-sans font-bold text-gray-dark">
                {done.length} Riwayat Selesai
              </span>
            </div>

            <div className="divide-y-2 divide-ink/20 border-2 border-ink rounded-xl bg-surface overflow-hidden shadow-xs">
              {done.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-sans hover:bg-gray-soft/30 transition-colors"
                >
                  <div className="space-y-0.5 min-w-[200px]">
                    <p className="font-bold text-ink text-sm">
                      {r.assignment_title} &bull; <span className="font-normal text-gray-dark">{r.student_name}</span>
                    </p>
                    <p className="text-xs text-gray-dark font-bold">
                      Perubahan: {r.old_score} &rarr; {r.proposed_score}
                    </p>
                    {r.review_note && (
                      <p className="text-xs text-gray-dark italic">Catatan: {r.review_note}</p>
                    )}
                  </div>

                  <div>
                    {r.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-ink bg-surface text-ink font-bold text-xs shadow-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        Disetujui
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-ink bg-primary text-white font-bold text-xs shadow-xs">
                        <XCircle className="h-3.5 w-3.5" />
                        Ditolak
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
