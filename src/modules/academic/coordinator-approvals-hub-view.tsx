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
  const totalPending = pendingGradeCount;

  // In-app Neo-Brutalist Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    request: ChangeRequestItem | null;
    approve: boolean;
    note: string;
    error: string | null;
  }>({
    isOpen: false,
    request: null,
    approve: true,
    note: '',
    error: null,
  });

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const openDecisionModal = (request: ChangeRequestItem, approve: boolean) => {
    setModalState({
      isOpen: true,
      request,
      approve,
      note: approve
        ? 'Disetujui Kaprodi, berkas diteruskan ke Biro Akademik untuk eksekusi nilai resmi.'
        : 'Bukti pendukung revisi nilai tidak mencukupi standar pembuktian.',
      error: null,
    });
  };

  const closeDecisionModal = () => {
    setModalState({
      isOpen: false,
      request: null,
      approve: true,
      note: '',
      error: null,
    });
  };

  const handleConfirmDecision = () => {
    if (!modalState.request) return;
    const cleanNote = modalState.note.trim();
    if (cleanNote.length < 10) {
      setModalState((prev) => ({
        ...prev,
        error: 'Alasan penolakan / catatan keputusan wajib diisi minimal 10 karakter.',
      }));
      return;
    }

    startTransition(async () => {
      const res = await decideGradeChangeAction({
        request_id: modalState.request!.id,
        approve: modalState.approve,
        note: cleanNote,
      });

      if (res.ok) {
        const approved = modalState.approve;
        const targetId = modalState.request!.id;
        setRequestsList((prev) =>
          prev.map((r) =>
            r.id === targetId
              ? {
                  ...r,
                  status: approved ? 'APPROVED' : 'REJECTED',
                  review_note: cleanNote,
                }
              : r
          )
        );
        closeDecisionModal();
        setToastMessage({
          type: 'success',
          text: approved
            ? 'Permohonan perubahan nilai BERHASIL DISETUJUI. Status: "Disetujui, menunggu eksekusi Staf".'
            : 'Permohonan perubahan nilai BERHASIL DITOLAK.',
        });
      } else {
        setModalState((prev) => ({
          ...prev,
          error: res.error || 'Gagal memproses persetujuan perubahan nilai.',
        }));
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up font-sans">
      {/* 1. HEADER RETRO */}
      <RetroWindow
        title="kotak_masuk_persetujuan_prodi.app"
        badge="Otorisasi Program Studi"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 border-2 border-black bg-[#ED1C24] text-white shadow-retro-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-[#111111]">
                Persetujuan Program Studi
              </h1>
            </div>
            <p className="text-sm sm:text-base text-[#111111] font-semibold max-w-3xl leading-relaxed">
              Pusat otorisasi akademik: validasi pembukaan rombel kelas baru, moderasi naskah soal ujian semester, dan persetujuan perubahan nilai final perkuliahan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {totalPending > 0 && (
              <span className="border-2 border-black bg-[#ED1C24] text-white px-4 py-2 text-xs sm:text-sm font-bold shadow-retro-sm rounded-full">
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
                'inline-flex items-center gap-2 px-4 py-2.5 border-2 border-black text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 font-sans',
                isSelected
                  ? 'bg-black text-white border-b-4 border-b-[#ED1C24] shadow-retro-sm'
                  : 'bg-white text-[#111111] hover:bg-gray-soft shadow-retro-sm'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 text-xs font-bold rounded-full',
                  isSelected ? 'bg-[#ED1C24] text-white' : 'bg-black text-white'
                )}>
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
          <div className="p-4 bg-gray-soft border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-retro-sm">
            <div>
              <h2 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-[#ED1C24]" />
                <span>Persetujuan Pembukaan Kelas Baru & Pemecahan Rombel</span>
              </h2>
              <p className="text-xs text-[#111111] font-semibold mt-1">
                Verifikasi kelayakan usulan penambahan kapasitas atau kelas paralel baru dari staf akademik.
              </p>
            </div>
          </div>

          <div className="p-10 text-center space-y-3 border-2 border-dashed border-black/30 bg-white">
            <CheckCircle2 className="h-10 w-10 text-[#111111]/40 mx-auto" />
            <h3 className="font-heading font-black text-base sm:text-lg text-[#111111]">Tidak Ada Pengajuan Kelas Baru</h3>
            <p className="text-xs sm:text-sm text-[#111111] font-semibold max-w-md mx-auto">
              Saat ini tidak ada permohonan pembukaan rombel kelas baru yang menunggu persetujuan Kaprodi.
            </p>
          </div>
        </div>
      )}

      {/* 4. TAB 2: SOAL UJIAN */}
      {activeTab === 'soal-ujian' && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-soft border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-retro-sm">
            <div>
              <h2 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-[#ED1C24]" />
                <span>Moderasi & Verifikasi Naskah Soal Ujian (CPL Alignment)</span>
              </h2>
              <p className="text-xs text-[#111111] font-semibold mt-1">
                Validasi kesesuaian butir soal UTS dan UAS dosen pengampu dengan rubrik capaian pembelajaran lulusan (CPL).
              </p>
            </div>
          </div>

          <div className="p-10 text-center space-y-3 border-2 border-dashed border-black/30 bg-white">
            <FileCheck className="h-10 w-10 text-[#111111]/40 mx-auto" />
            <h3 className="font-heading font-black text-base sm:text-lg text-[#111111]">Semua Naskah Soal Telah Dimoderasi</h3>
            <p className="text-xs sm:text-sm text-[#111111] font-semibold max-w-md mx-auto">
              Belum ada draf naskah soal ujian baru yang diajukan dosen untuk moderasi semester ini.
            </p>
          </div>
        </div>
      )}

      {/* 5. TAB 3: PERUBAHAN NILAI (DATA REAL DARI DOSEN) */}
      {activeTab === 'perubahan-nilai' && (
        <div className="space-y-5">
          <div className="p-4 bg-gray-soft border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-retro-sm">
            <div>
              <h2 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-[#ED1C24]" />
                <span>Permohonan Koreksi / Revisi Nilai Akhir Perkuliahan</span>
              </h2>
              <p className="text-xs text-[#111111] font-semibold mt-1">
                Permohonan resmi dosen pengampu. Setelah disetujui Kaprodi, berkas menunggu eksekusi perubahan nilai oleh Staf Akademik.
              </p>
            </div>
            <span className="text-xs font-bold text-[#111111]">
              Total Pengajuan: {requestsList.length}
            </span>
          </div>

          {requestsList.length === 0 ? (
            <div className="p-10 text-center space-y-3 border-2 border-dashed border-black/30 bg-white">
              <CheckCircle2 className="h-10 w-10 text-[#111111]/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-[#111111]">Tidak Ada Pengajuan Perubahan Nilai</h3>
              <p className="text-xs sm:text-sm text-[#111111] font-semibold max-w-md mx-auto">
                Saat ini belum ada dosen yang mengajukan usulan revisi nilai perkuliahan ke program studi.
              </p>
            </div>
          ) : (
            <div className="border-2 border-black bg-white shadow-retro overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm font-sans">
                  <thead className="border-b-2 border-black bg-gray-soft font-bold uppercase text-[#111111]">
                    <tr>
                      <th className="p-3.5 sm:p-4">Mahasiswa & Kelas</th>
                      <th className="p-3.5 sm:p-4">Komponen Evaluasi</th>
                      <th className="p-3.5 sm:p-4 text-center">Nilai Lama &rarr; Usulan</th>
                      <th className="p-3.5 sm:p-4">Alasan Dosen & Catatan</th>
                      <th className="p-3.5 sm:p-4 text-center">Status</th>
                      <th className="p-3.5 sm:p-4 text-center">Aksi Otorisasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10">
                    {requestsList.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4">
                          <span className="font-bold text-[#111111] block">{r.student_name}</span>
                          <span className="text-xs text-[#111111] font-medium">{r.class_title}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-bold text-[#111111]">
                          {r.assignment_title}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="line-through text-[#111111]/60 font-bold">{r.old_score}</span>
                          <span className="text-black/40 mx-1.5">&rarr;</span>
                          <span className="text-[#ED1C24] font-black text-sm">{r.proposed_score}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-[#111111] max-w-sm">
                          <div>{r.reason}</div>
                          {r.review_note && (
                            <div className="text-xs text-[#111111] mt-1 bg-neutral-100 p-1.5 border border-black/20 font-medium">
                              Catatan Kaprodi: {r.review_note}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-1 border-2 border-black text-xs font-bold inline-block text-center shadow-retro-sm',
                              r.status === 'APPROVED'
                                ? 'bg-white text-[#111111]'
                                : r.status === 'REJECTED'
                                ? 'bg-[#ED1C24] text-white'
                                : 'bg-gray-soft text-[#111111]'
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
                            !isDemo ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center justify-center gap-1.5 opacity-50">
                                  <button
                                    type="button"
                                    disabled
                                    className="px-2.5 py-1 border-2 border-black bg-neutral-200 text-neutral-500 text-xs font-bold cursor-not-allowed shadow-retro-sm"
                                  >
                                    Setujui
                                  </button>
                                  <button
                                    type="button"
                                    disabled
                                    className="px-2.5 py-1 border-2 border-black bg-neutral-200 text-neutral-500 text-xs font-bold cursor-not-allowed shadow-retro-sm"
                                  >
                                    Tolak
                                  </button>
                                </div>
                                <span className="text-xs text-[#111111] font-bold bg-gray-soft border border-black px-1.5 py-0.5">
                                  Menunggu Migrasi DB
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => openDecisionModal(r, true)}
                                  className="px-3.5 py-1 border-2 border-black bg-[#111111] text-white text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-retro-sm active:translate-x-0.5 active:translate-y-0.5"
                                >
                                  Setujui
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => openDecisionModal(r, false)}
                                  className="px-3.5 py-1 border-2 border-black bg-[#ED1C24] text-white text-xs font-bold hover:bg-[#c9141b] transition-all cursor-pointer shadow-retro-sm active:translate-x-0.5 active:translate-y-0.5"
                                >
                                  Tolak
                                </button>
                              </div>
                            )
                          ) : (
                            <span className="text-xs text-[#111111] font-bold">Selesai Ditinjau</span>
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
          <div className="p-4 bg-gray-soft border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-retro-sm">
            <div>
              <h2 className="font-heading font-black text-base text-[#111111] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#ED1C24]" />
                <span>Persetujuan Dispensasi Akademik & Cuti Kuliah</span>
              </h2>
              <p className="text-xs text-[#111111] font-semibold mt-1">
                Verifikasi permohonan cuti semester, dispensasi kegiatan lomba/MBKM, dan surat keterangan prodi.
              </p>
            </div>
          </div>

          <div className="p-10 text-center space-y-3 border-2 border-dashed border-black/30 bg-white">
            <CheckCircle2 className="h-10 w-10 text-[#111111]/40 mx-auto" />
            <h3 className="font-heading font-black text-base sm:text-lg text-[#111111]">Tidak Ada Pengajuan Dispensasi</h3>
            <p className="text-xs sm:text-sm text-[#111111] font-semibold max-w-md mx-auto">
              Saat ini belum ada pengajuan dispensasi atau cuti kuliah yang memerlukan tanda tangan elektronik Kaprodi.
            </p>
          </div>
        </div>
      )}

      {/* TOAST NOTIFIKASI IN-APP */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in font-sans">
          <div className="p-4 border-2 border-black shadow-retro flex items-start gap-3 bg-white text-[#111111]">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-[#111111] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-[#ED1C24] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-bold leading-relaxed">{toastMessage.text}</div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-black/10 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* MODAL IN-APP OTORISASI REVISI NILAI */}
      {modalState.isOpen && modalState.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="w-full max-w-lg">
            <RetroWindow
              title={`otorisasi_${modalState.approve ? 'setujui' : 'tolak'}_nilai.app`}
              badge={modalState.approve ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
              headerClassName="bg-gray-soft"
              bodyClassName="p-5 sm:p-6 bg-white space-y-4"
            >
              <div className="space-y-3.5">
                <div className="p-3.5 bg-neutral-100 border-2 border-black text-xs space-y-1.5 font-medium text-[#111111]">
                  <div className="flex justify-between">
                    <span className="font-bold text-[#111111]">{modalState.request.student_name}</span>
                    <span className="text-[#111111] font-medium">{modalState.request.class_title}</span>
                  </div>
                  <div>
                    Komponen: <span className="font-bold">{modalState.request.assignment_title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Nilai:</span>
                    <span className="line-through text-[#111111]/60 font-bold">{modalState.request.old_score}</span>
                    <span>&rarr;</span>
                    <span className="text-[#ED1C24] font-black text-sm">{modalState.request.proposed_score}</span>
                  </div>
                  <div className="text-xs text-[#111111] italic border-t border-black/20 pt-1">
                    Alasan Dosen: &ldquo;{modalState.request.reason}&rdquo;
                  </div>
                </div>

                {modalState.error && (
                  <div className="p-3 bg-neutral-100 border-2 border-black text-[#ED1C24] text-xs font-bold flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-[#ED1C24] shrink-0 mt-0.5" />
                    <div>
                      <div>{modalState.error}</div>
                      {modalState.error.includes('sendiri') && (
                        <div className="text-xs font-normal text-[#111111] mt-1">
                          Catatan Eskalasi: Berkas pengajuan yang diajukan oleh dosen yang merangkap Kaprodi harus dialihkan persetujuannya ke Dekan / Wakil Dekan Akademik.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase text-[#111111]">
                      {modalState.approve ? 'Catatan Persetujuan Kaprodi' : 'Alasan Penolakan Kaprodi (Wajib)'}
                    </label>
                    <span className="text-xs font-bold text-[#111111]">
                      {modalState.note.trim().length}/10 Karakter
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={modalState.note}
                    onChange={(e) => setModalState((prev) => ({ ...prev, note: e.target.value, error: null }))}
                    placeholder={modalState.approve ? 'Tuliskan catatan persetujuan...' : 'Jelaskan alasan penolakan...'}
                    className="w-full border-2 border-black p-2.5 text-xs font-sans text-[#111111] bg-white focus:outline-none focus:ring-2 focus:ring-[#ED1C24] rounded-none shadow-retro-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t-2 border-black">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={closeDecisionModal}
                    className="px-4 py-2 border-2 border-black bg-white text-[#111111] text-xs font-bold hover:bg-gray-soft shadow-retro-sm transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isPending || modalState.note.trim().length < 10}
                    onClick={handleConfirmDecision}
                    className={cn(
                      'px-4 py-2 border-2 border-black text-white text-xs font-bold shadow-retro-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50',
                      modalState.approve
                        ? 'bg-[#111111] hover:bg-black'
                        : 'bg-[#ED1C24] hover:bg-[#c9141b]'
                    )}
                  >
                    {isPending ? 'Memproses...' : modalState.approve ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
                  </button>
                </div>
              </div>
            </RetroWindow>
          </div>
        </div>
      )}
    </div>
  );
}
