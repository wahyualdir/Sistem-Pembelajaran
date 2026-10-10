'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  FolderPlus,
  FileCheck,
  CheckSquare,
  FileText,
  Clock,
  AlertCircle,
  XCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';
import { decideGradeChangeAction, type ChangeRequestItem } from './actions';

export const COORDINATOR_APPROVALS_TABS = [
  { id: 'kelas-baru', label: 'Kelas Baru', icon: FolderPlus },
  { id: 'soal-ujian', label: 'Soal Ujian', icon: FileCheck },
  { id: 'perubahan-nilai', label: 'Perubahan Nilai', icon: CheckSquare },
  { id: 'lainnya', label: 'Lainnya', icon: FileText },
] as const;

export type CoordinatorApprovalsTabId = (typeof COORDINATOR_APPROVALS_TABS)[number]['id'];

interface CoordinatorApprovalsHubViewProps {
  changeRequests: ChangeRequestItem[];
  isDemo?: boolean;
}

export function CoordinatorApprovalsHubView({
  changeRequests,
  isDemo = true,
}: CoordinatorApprovalsHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as CoordinatorApprovalsTabId;
  const validTabs: CoordinatorApprovalsTabId[] = [
    'kelas-baru',
    'soal-ujian',
    'perubahan-nilai',
    'lainnya',
  ];
  const activeTab: CoordinatorApprovalsTabId = validTabs.includes(tabParam)
    ? tabParam
    : 'perubahan-nilai';

  const setTab = (tab: CoordinatorApprovalsTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/coordinator/approvals?${params.toString()}`);
  };

  const [requestsList, setRequestsList] = useState<ChangeRequestItem[]>(changeRequests);
  const [isPending, startTransition] = useTransition();

  // Hitung total berkas menunggu persetujuan nyata
  const pendingGradeCount = requestsList.filter((r) => r.status === 'PENDING').length;
  const totalPending = pendingGradeCount; // Jika tab lain ada data nyata, tambahkan di sini

  const handleDecideGradeChange = (requestId: string, approve: boolean) => {
    const actionLabel = approve ? 'menyetujui' : 'menolak';
    if (!confirm(`Konfirmasi Tindakan Kaprodi:\nApakah Anda yakin ingin ${actionLabel} permohonan perubahan nilai ini?`)) {
      return;
    }

    const promptMessage = approve
      ? 'Catatan persetujuan Kaprodi (minimal 3 karakter):'
      : 'Alasan penolakan pengajuan perubahan nilai (wajib diisi, minimal 3 karakter):';
    const defaultNote = approve
      ? 'Disetujui Kaprodi, berkas diteruskan ke Staf Akademik untuk eksekusi final.'
      : 'Bukti pendukung revisi nilai tidak mencukupi.';

    const note = prompt(promptMessage, defaultNote);
    if (!note || note.trim().length < 3) {
      alert('Catatan/alasan tanggapan wajib diisi minimal 3 karakter.');
      return;
    }

    startTransition(async () => {
      const res = await decideGradeChangeAction({
        request_id: requestId,
        approve,
        note: note.trim(),
      });

      if (res.ok) {
        setRequestsList((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: approve ? 'APPROVED' : 'REJECTED',
                  review_note: note.trim(),
                }
              : r
          )
        );
        alert(
          approve
            ? 'Permohonan perubahan nilai BERHASIL DISETUJUI. Status: "Disetujui, menunggu eksekusi Staf".'
            : 'Permohonan perubahan nilai BERHASIL DITOLAK.'
        );
      } else {
        alert(res.error || 'Gagal memproses persetujuan perubahan nilai.');
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER RETRO */}
      <RetroWindow
        title="kotak_masuk_persetujuan_prodi.app"
        badge="Otorisasi Program Studi"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-xs">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Persetujuan Program Studi
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Pusat otorisasi akademik: validasi pembukaan rombel kelas baru, moderasi naskah soal ujian semester, dan persetujuan perubahan nilai final perkuliahan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {totalPending > 0 && (
              <span className="rounded-lg border-2 border-black bg-rose-500 text-white px-4 py-2 text-xs sm:text-sm font-mono font-black shadow-retro animate-pulse">
                {totalPending} Berkas Menunggu Review
              </span>
            )}
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB CONTROLLER */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {COORDINATOR_APPROVALS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          const count = tab.id === 'perubahan-nilai' ? pendingGradeCount : 0;
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
              {count > 0 && (
                <span className="px-1.5 py-0.2 bg-black text-white text-[10px] rounded-full font-mono">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: KELAS BARU */}
      {activeTab === 'kelas-baru' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-retro-orange" />
                <span>Persetujuan Pembukaan Kelas Baru & Pemecahan Rombel</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Verifikasi kelayakan usulan penambahan kapasitas atau kelas paralel baru dari staf akademik.
              </p>
            </div>
          </div>

          {/* Empty state & TODO(backend) sesuai spesifikasi */}
          <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
            <CheckCircle2 className="h-10 w-10 text-black/40 mx-auto" />
            <h3 className="font-heading font-black text-base sm:text-lg text-black">Tidak Ada Pengajuan Kelas Baru</h3>
            <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
              Saat ini tidak ada permohonan pembukaan rombel kelas baru yang menunggu persetujuan Kaprodi.
            </p>
            {/* TODO(backend): Di Fase 3, integrasikan dengan alur permohonan rombel dari Bagian Staf */}
          </div>
        </div>
      )}

      {/* 4. TAB 2: SOAL UJIAN */}
      {activeTab === 'soal-ujian' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-retro-orange" />
                <span>Moderasi & Verifikasi Naskah Soal Ujian (CPL Alignment)</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Validasi kesesuaian butir soal UTS dan UAS dosen pengampu dengan rubrik capaian pembelajaran lulusan (CPL).
              </p>
            </div>
          </div>

          {/* Empty state & TODO(backend) sesuai spesifikasi */}
          <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
            <FileCheck className="h-10 w-10 text-black/40 mx-auto" />
            <h3 className="font-heading font-black text-base sm:text-lg text-black">Semua Naskah Soal Telah Dimoderasi</h3>
            <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
              Belum ada draf naskah soal ujian baru yang diajukan dosen untuk moderasi semester ini.
            </p>
            {/* TODO(backend): Di Fase 3, hubungkan status publikasi kuis ke antrean moderasi soal Kaprodi */}
          </div>
        </div>
      )}

      {/* 5. TAB 3: PERUBAHAN NILAI (DATA REAL DARI DOSEN) */}
      {activeTab === 'perubahan-nilai' && (
        <div className="space-y-5">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-retro-orange" />
                <span>Permohonan Koreksi / Revisi Nilai Akhir Perkuliahan</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Permohonan resmi dosen pengampu. Setelah disetujui Kaprodi, berkas menunggu eksekusi perubahan nilai oleh Staf Akademik (Fase 2D).
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-black/60">
              Total Pengajuan: {requestsList.length}
            </span>
          </div>

          {requestsList.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <CheckCircle2 className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-black">Tidak Ada Pengajuan Perubahan Nilai</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Saat ini belum ada dosen yang mengajukan usulan revisi nilai perkuliahan ke program studi.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                    <tr>
                      <th className="p-3.5 sm:p-4">Mahasiswa & Kelas</th>
                      <th className="p-3.5 sm:p-4">Komponen Evaluasi</th>
                      <th className="p-3.5 sm:p-4 text-center">Nilai Lama &rarr; Usulan</th>
                      <th className="p-3.5 sm:p-4">Alasan Dosen & Catatan</th>
                      <th className="p-3.5 sm:p-4 text-center">Status</th>
                      <th className="p-3.5 sm:p-4 text-center">Aksi Otorisasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 font-medium">
                    {requestsList.map((r) => (
                      <tr key={r.id} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4">
                          <span className="font-bold text-black block">{r.student_name}</span>
                          <span className="text-xs text-black/60 font-mono">{r.class_title}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-semibold text-black">
                          {r.assignment_title}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center font-mono">
                          <span className="text-rose-700 font-bold">{r.old_score}</span>
                          <span className="text-black/40 mx-1.5">&rarr;</span>
                          <span className="text-emerald-700 font-black text-sm">{r.proposed_score}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/80 max-w-sm">
                          <div>{r.reason}</div>
                          {r.review_note && (
                            <div className="text-[11px] font-mono text-emerald-950 mt-1 bg-emerald-50 p-1.5 rounded border border-emerald-300">
                              Catatan Kaprodi: {r.review_note}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded border text-[11px] font-mono font-bold inline-block text-center',
                              r.status === 'APPROVED'
                                ? 'border-emerald-500 bg-emerald-100 text-emerald-950'
                                : r.status === 'REJECTED'
                                ? 'border-rose-500 bg-rose-100 text-rose-950'
                                : 'border-amber-500 bg-amber-100 text-amber-950'
                            )}
                          >
                            {r.status === 'APPROVED'
                              ? 'Disetujui (Menunggu Eksekusi Staf)'
                              : r.status === 'REJECTED'
                              ? 'Ditolak Kaprodi'
                              : 'Menunggu Persetujuan'}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          {r.status === 'PENDING' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleDecideGradeChange(r.id, true)}
                                className="px-2.5 py-1 rounded-lg border-2 border-black bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all cursor-pointer shadow-xs"
                              >
                                Setujui
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleDecideGradeChange(r.id, false)}
                                className="px-2.5 py-1 rounded-lg border-2 border-black bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-all cursor-pointer shadow-xs"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-mono text-black/60">Selesai Ditinjau</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 4: LAINNYA */}
      {activeTab === 'lainnya' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <FileText className="h-5 w-5 text-retro-orange" />
                <span>Persetujuan Dispensasi Akademik & Cuti Kuliah</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Verifikasi permohonan cuti semester, dispensasi kegiatan lomba/MBKM, dan surat keterangan prodi.
              </p>
            </div>
          </div>

          <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
            <CheckCircle2 className="h-10 w-10 text-black/40 mx-auto" />
            <h3 className="font-heading font-black text-base sm:text-lg text-black">Tidak Ada Pengajuan Dispensasi</h3>
            <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
              Saat ini belum ada pengajuan dispensasi atau cuti kuliah yang memerlukan tanda tangan elektronik Kaprodi.
            </p>
            {/* TODO(backend): Di Fase 3, sambungkan ke modul pengajuan cuti & dispensasi mahasiswa */}
          </div>
        </div>
      )}
    </div>
  );
}
