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
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
      <div className="max-w-[1340px] mx-auto space-y-5 sm:space-y-6">
        {/* HEADER RETRO BRUTALIST WITH CAMPUS RED ACCENT */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-[#111111] flex items-center gap-2.5">
              <Compass className="h-7 w-7 text-[#ED1C24] inline-block shrink-0" />
              <span>Persetujuan Perubahan Nilai</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#111111] font-semibold leading-relaxed">
              Validasi pengajuan dosen untuk merevisi nilai mahasiswa yang telah difinalisasi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-[#ED1C24] text-white border-2 border-black shadow-retro-sm">
              ROLE: KAPRODI
            </span>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-white text-[#111111] border-2 border-black shadow-retro-sm">
              SEMESTER GANJIL 2026/2027
            </span>
          </div>
        </div>

        {/* 4 KARTU METRIK RINGKASAN */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="border-2 border-black bg-white p-4 sm:p-5 shadow-retro-sm text-center flex flex-col justify-between">
            <p className="text-xs font-bold text-[#111111] uppercase tracking-wider">Total Pengajuan</p>
            <p className="font-heading font-black text-3xl sm:text-4xl text-[#111111] mt-2">{all.length}</p>
          </div>
          <div className="border-2 border-black bg-white p-4 sm:p-5 shadow-retro-sm text-center flex flex-col justify-between">
            <p className="text-xs font-bold text-[#111111] uppercase tracking-wider">Menunggu Review</p>
            <p className="font-heading font-black text-3xl sm:text-4xl text-[#ED1C24] mt-2">{pending.length}</p>
          </div>
          <div className="border-2 border-black bg-white p-4 sm:p-5 shadow-retro-sm text-center flex flex-col justify-between">
            <p className="text-xs font-bold text-[#111111] uppercase tracking-wider">Disetujui</p>
            <p className="font-heading font-black text-3xl sm:text-4xl text-[#111111] mt-2">{approved.length}</p>
          </div>
          <div className="border-2 border-black bg-white p-4 sm:p-5 shadow-retro-sm text-center flex flex-col justify-between">
            <p className="text-xs font-bold text-[#111111] uppercase tracking-wider">Ditolak</p>
            <p className="font-heading font-black text-3xl sm:text-4xl text-[#111111] mt-2">{rejected.length}</p>
          </div>
        </div>

        {/* PERINGATAN DINI MAHASISWA BERISIKO PER ANGKATAN (DENGAN VIEW TOGGLE AGAR TIDAK MENUMPUK) */}
        <CoordinatorCohortRiskView
          cohorts={cohortData.cohorts}
          totalAtRisk={cohortData.totalAtRisk}
        />

        {/* DAFTAR PERMINTAAN & RIWAYAT KEPUTUSAN (SIDE-BY-SIDE DESKTOP AGAR TIDAK MENUMPUK VERTIKAL) */}
        <div className={`grid grid-cols-1 ${done.length > 0 ? 'lg:grid-cols-12' : ''} gap-5 sm:gap-6`}>
          {/* KOLOM KIRI: DAFTAR PERMINTAAN MENUNGGU KEPUTUSAN */}
          <div className={`${done.length > 0 ? 'lg:col-span-7' : 'w-full'} border-2 border-black bg-white p-5 sm:p-6 shadow-retro space-y-4`}>
            <div className="flex items-center justify-between border-b-2 border-black pb-3.5">
              <h2 className="font-heading font-black text-lg sm:text-xl text-[#111111] flex items-center gap-2.5">
                <Clock className="h-5 w-5 text-[#ED1C24]" />
                <span>Pengajuan Menunggu Keputusan</span>
              </h2>
              <span className="text-xs font-bold px-3 py-1 border-2 border-black bg-gray-soft text-[#111111] shadow-retro-sm">
                {pending.length} Permintaan Pending
              </span>
            </div>

            {pending.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-black/30 bg-gray-soft/40 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-[#111111] mx-auto" />
                <p className="text-base font-bold text-[#111111] font-heading">Tidak Ada Antrean Menunggu</p>
                <p className="text-xs text-[#111111] font-semibold max-w-md mx-auto">
                  Semua pengajuan perubahan nilai dari dosen pengampu telah Anda tinjau dan putuskan.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 sm:p-5 border-2 border-black bg-white shadow-retro-sm space-y-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 border-2 border-black bg-gray-soft text-[#111111] text-[11px] font-bold uppercase">
                          PERMINTAAN NILAI
                        </span>
                        <h3 className="font-heading font-black text-sm sm:text-base text-[#111111]">
                          {r.assignment_title}
                        </h3>
                      </div>
                      <span className="text-xs text-[#111111] font-bold flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#ED1C24]" />
                        {fmt(r.created_at)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <p className="text-[#111111] font-medium">
                          Kelas: <strong className="font-bold text-[#111111]">{r.class_title}</strong>
                        </p>
                        <p className="text-[#111111] font-medium">
                          Mahasiswa: <strong className="font-bold text-[#111111]">{r.student_name}</strong>
                        </p>
                      </div>
                      <div className="flex items-center sm:justify-end gap-2">
                        <span className="px-2.5 py-1 border-2 border-black bg-gray-soft font-bold text-[#111111]">
                          Nilai Awal: {r.old_score}
                        </span>
                        <ArrowRight className="h-4 w-4 text-[#111111]" />
                        <span className="px-2.5 py-1 border-2 border-black bg-white text-[#ED1C24] font-black shadow-retro-sm">
                          Usulan: {r.proposed_score}
                        </span>
                      </div>
                    </div>

                    <div className="border-2 border-black bg-neutral-100 p-3 text-xs">
                      <p className="font-bold text-[#111111] uppercase tracking-wider mb-1">
                        Alasan Perubahan oleh Dosen:
                      </p>
                      <p className="text-[#111111] italic whitespace-pre-wrap font-medium">{r.reason}</p>
                    </div>

                    <div className="pt-1">
                      <ChangeDecision id={r.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KOLOM KANAN: RIWAYAT KEPUTUSAN */}
          {done.length > 0 && (
            <div className="lg:col-span-5 border-2 border-black bg-white p-5 sm:p-6 shadow-retro space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-3.5">
                <h2 className="font-heading font-black text-lg sm:text-xl text-[#111111] flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-[#ED1C24]" />
                  <span>Riwayat Keputusan</span>
                </h2>
                <span className="text-xs font-bold text-[#111111] px-2.5 py-1 border-2 border-black bg-gray-soft shadow-retro-sm">
                  {done.length} Selesai
                </span>
              </div>

              <div className="divide-y-2 divide-black/10 border-2 border-black bg-white overflow-hidden shadow-retro-sm max-h-[640px] overflow-y-auto">
                {done.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 space-y-2 text-xs hover:bg-gray-soft/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-[#111111] text-sm">
                          {r.assignment_title}
                        </p>
                        <p className="text-xs text-[#111111] font-semibold mt-0.5">
                          {r.student_name} &bull; <span className="font-normal">{r.class_title}</span>
                        </p>
                      </div>

                      <div className="shrink-0">
                        {r.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black bg-white text-[#111111] font-bold text-xs shadow-retro-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#111111]" />
                            Disetujui
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black bg-[#ED1C24] text-white font-bold text-xs shadow-retro-sm">
                            <XCircle className="h-3.5 w-3.5 text-white" />
                            Ditolak
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#111111] font-bold border-t border-black/10 pt-1.5">
                      <span>Perubahan Skor:</span>
                      <span className="font-black">{r.old_score} &rarr; {r.proposed_score}</span>
                    </div>

                    {r.review_note && (
                      <p className="text-xs text-[#111111] italic bg-neutral-100 p-2 border border-black/20">
                        Catatan: &ldquo;{r.review_note}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
