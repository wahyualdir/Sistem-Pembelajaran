'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Calendar,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  AlertCircle,
  X,
  Users,
  ShieldAlert,
} from 'lucide-react';
import {
  type AbsenceRequestRecord,
  type AbsenceRequestItem,
  createAbsenceRequestAction,
  cancelAbsenceRequestAction,
  reviewAbsenceItemAction,
  batchReviewAbsenceItemsAction,
  listStudentAbsenceRequestsAction,
  listClassAbsenceRequestsAction,
  getAbsenceProofSignedUrlAction,
} from './absence-actions';

// ============================================================================
// 1. MODAL PENGAJUAN IZIN & SAKIT MAHASISWA (RETRO MONOCHROME)
// ============================================================================

interface StudentAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableSessions: Array<{ id: string; sessionNumber: number; sessionDate: string; className: string }>;
  onSuccess?: () => void;
}

export function StudentAbsenceModal({
  isOpen,
  onClose,
  availableSessions,
  onSuccess,
}: StudentAbsenceModalProps) {
  const [type, setType] = useState<'izin' | 'sakit'>('sakit');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Otomatis centang pertemuan yang jatuh pada rentang tanggal
  useEffect(() => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const matched = availableSessions
      .filter((s) => {
        const d = new Date(s.sessionDate).getTime();
        return d >= start && d <= end;
      })
      .map((s) => s.id);

    setSelectedSessionIds(matched);
  }, [startDate, endDate, availableSessions]);

  if (!isOpen) return null;

  const toggleSession = (id: string) => {
    setSelectedSessionIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (selectedSessionIds.length === 0) {
      setErrorMessage('Pilih minimal satu sesi perkuliahan yang terdampak.');
      return;
    }

    startTransition(async () => {
      let attachmentPath: string | null = null;
      if (file) {
        attachmentPath = `proofs/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      }

      const res = await createAbsenceRequestAction({
        type,
        startDate,
        endDate,
        reason,
        sessionIds: selectedSessionIds,
        attachmentPath,
      });

      if (res.ok) {
        setSuccessMessage('Permohonan berhasil diajukan dan sedang menunggu verifikasi dosen.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Gagal mengajukan permohonan.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white border-2 border-black rounded-2xl shadow-retro-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Retro Window Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-gray-soft p-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-black bg-black inline-block" />
            <span className="h-3 w-3 rounded-full border border-black bg-white inline-block" />
            <h3 className="font-heading font-black text-sm sm:text-base text-black ml-1">
              Formulir Permohonan Izin & Sakit
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg border border-black bg-white hover:bg-gray-soft text-black shadow-retro-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {successMessage && (
            <div className="p-3.5 rounded-xl border-2 border-black bg-gray-soft text-black font-bold shadow-retro-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="p-3.5 rounded-xl border-2 border-black bg-white text-black font-bold shadow-retro-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-black shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pilihan Jenis */}
            <div>
              <label className="font-mono font-bold text-black uppercase tracking-wider block mb-1.5">
                Jenis Permohonan *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 border-black cursor-pointer transition-all shadow-retro-sm ${
                    type === 'sakit'
                      ? 'bg-black text-white font-bold'
                      : 'bg-white text-black hover:bg-gray-soft font-bold'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="sakit"
                    checked={type === 'sakit'}
                    onChange={() => setType('sakit')}
                    className="sr-only"
                  />
                  <span className={`w-3 h-3 rounded-full border-2 ${type === 'sakit' ? 'border-white bg-white' : 'border-black bg-white'}`} />
                  <span>Sakit (Surat Dokter)</span>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 border-black cursor-pointer transition-all shadow-retro-sm ${
                    type === 'izin'
                      ? 'bg-black text-white font-bold'
                      : 'bg-white text-black hover:bg-gray-soft font-bold'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="izin"
                    checked={type === 'izin'}
                    onChange={() => setType('izin')}
                    className="sr-only"
                  />
                  <span className={`w-3 h-3 rounded-full border-2 ${type === 'izin' ? 'border-white bg-white' : 'border-black bg-white'}`} />
                  <span>Izin (Kegiatan Resmi)</span>
                </label>
              </div>
            </div>

            {/* Rentang Tanggal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono font-bold text-black uppercase tracking-wider block mb-1">
                  Tanggal Mulai *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border-2 border-black bg-white text-black font-mono font-bold text-xs shadow-retro-sm"
                />
              </div>
              <div>
                <label className="font-mono font-bold text-black uppercase tracking-wider block mb-1">
                  Tanggal Selesai *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border-2 border-black bg-white text-black font-mono font-bold text-xs shadow-retro-sm"
                />
              </div>
            </div>

            {/* Daftar Pertemuan Terdeteksi */}
            <div>
              <label className="font-mono font-bold text-black uppercase tracking-wider block mb-1">
                Pertemuan Terdampak ({selectedSessionIds.length} dipilih) *
              </label>
              <div className="rounded-xl border-2 border-black bg-gray-soft/40 p-3 max-h-36 overflow-y-auto space-y-1.5 shadow-retro-sm">
                {availableSessions.length === 0 ? (
                  <p className="text-xs text-black/70 py-2 text-center font-bold">
                    Tidak ada pertemuan perkuliahan pada rentang tanggal ini.
                  </p>
                ) : (
                  availableSessions.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-black/30 bg-white hover:bg-gray-soft text-xs cursor-pointer font-bold text-black"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSessionIds.includes(s.id)}
                        onChange={() => toggleSession(s.id)}
                        className="rounded border-2 border-black accent-black text-black"
                      />
                      <span className="flex-1">
                        {s.className} &bull; Pertemuan {s.sessionNumber}
                      </span>
                      <span className="font-mono text-black/70">
                        {s.sessionDate}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-black/70 font-medium mt-1">
                Centang pertemuan yang tidak dapat Anda hadiri.
              </p>
            </div>

            {/* Alasan */}
            <div>
              <label className="font-mono font-bold text-black uppercase tracking-wider block mb-1">
                Alasan Permohonan *
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Mengalami demam tinggi dan disarankan istirahat medis 3 hari."
                required
                minLength={10}
                className="w-full px-3 py-2 rounded-lg border-2 border-black bg-white text-black font-sans font-medium text-xs shadow-retro-sm"
              />
            </div>

            {/* Unggah Berkas Bukti */}
            <div>
              <label className="font-mono font-bold text-black uppercase tracking-wider block mb-1">
                Berkas Bukti (PDF, JPG, PNG &bull; Maks. 5 MB){' '}
                {type === 'sakit' ? '*' : '(Opsional)'}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required={type === 'sakit'}
                className="w-full px-3 py-2 rounded-lg border-2 border-black bg-white text-black font-mono font-bold text-xs shadow-retro-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t-2 border-black/15">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 rounded-xl border-2 border-black bg-white hover:bg-gray-soft text-black font-bold text-xs shadow-retro-sm cursor-pointer disabled:opacity-50"
              >
                Batalkan
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 font-bold text-xs shadow-retro cursor-pointer disabled:opacity-50"
              >
                {isPending ? 'Mengirim...' : 'Kirim Permohonan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. TAB PERMOHONAN IZIN DOSEN (LecturerAbsenceTabView - RETRO MONOCHROME)
// ============================================================================

interface LecturerAbsenceTabViewProps {
  classId: string;
}

export function LecturerAbsenceTabView({ classId }: LecturerAbsenceTabViewProps) {
  const [items, setItems] = useState<AbsenceRequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'menunggu' | 'disetujui' | 'ditolak'>('menunggu');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeProofUrl, setActiveProofUrl] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectingItemId, setRejectingItemId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;
    listClassAbsenceRequestsAction(
      classId,
      statusFilter === 'all' ? undefined : statusFilter
    ).then((res) => {
      if (active) setItems(res);
    });
    return () => {
      active = false;
    };
  }, [classId, statusFilter, refreshTrigger]);

  const loadData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleReview = (itemId: string, decision: 'disetujui' | 'ditolak', note?: string) => {
    setMessageError(null);
    setMessageSuccess(null);

    startTransition(async () => {
      const res = await reviewAbsenceItemAction(itemId, decision, note);
      if (res.ok) {
        setMessageSuccess(`Permohonan telah ${decision}. Rekap presensi diperbarui secara otomatis.`);
        loadData();
        setRejectingItemId(null);
        setRejectionNote('');
      } else {
        setMessageError(res.error || `Gagal memproses permohonan.`);
      }
    });
  };

  const handleBatchApprove = () => {
    if (selectedItemIds.length === 0) return;
    setMessageError(null);
    setMessageSuccess(null);

    startTransition(async () => {
      const res = await batchReviewAbsenceItemsAction(selectedItemIds, 'disetujui');
      if (res.ok) {
        setMessageSuccess(`${res.count} permohonan berhasil disetujui serentak.`);
        setSelectedItemIds([]);
        loadData();
      } else {
        setMessageError(res.error || 'Gagal memproses persetujuan massal.');
      }
    });
  };

  const handleViewProof = async (item: AbsenceRequestItem) => {
    setMessageError(null);
    const mockPath = `proofs/surat_dokter_${item.requestId}.pdf`;
    const res = await getAbsenceProofSignedUrlAction(mockPath, classId);
    if (res.ok && res.signedUrl) {
      setActiveProofUrl(res.signedUrl);
    } else {
      setMessageError(res.error || 'Gagal memuat berkas bukti.');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === items.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(items.map((i) => i.id));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black/15 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-black bg-gray-soft text-[11px] font-mono font-bold text-black uppercase mb-1">
            <ShieldAlert className="h-3.5 w-3.5 text-black" />
            <span>Verifikasi Kehadiran</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-black">Permohonan Izin & Sakit Mahasiswa</h2>
          <p className="text-xs sm:text-sm text-black/75 font-medium mt-0.5 max-w-2xl leading-relaxed">
            Verifikasi surat izin resmi atau bukti sakit mahasiswa untuk pembaruan status rekaman presensi kelas.
          </p>
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border-2 border-black bg-white text-black font-mono font-bold text-xs shadow-retro-sm cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="menunggu">Menunggu Verifikasi</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {messageSuccess && (
        <div className="p-3.5 rounded-xl border-2 border-black bg-gray-soft text-black font-bold text-xs shadow-retro-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          <span>{messageSuccess}</span>
        </div>
      )}
      {messageError && (
        <div className="p-3.5 rounded-xl border-2 border-black bg-white text-black font-bold text-xs shadow-retro-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-black shrink-0" />
          <span>{messageError}</span>
        </div>
      )}

      {/* Baris Tindakan Massal */}
      {selectedItemIds.length > 0 && (
        <div className="p-4 rounded-xl border-2 border-black bg-gray-soft flex items-center justify-between shadow-retro-sm">
          <span className="text-xs font-mono font-bold text-black">
            {selectedItemIds.length} permohonan dipilih
          </span>
          <button
            type="button"
            onClick={handleBatchApprove}
            disabled={isPending}
            className="px-4 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-bold flex items-center gap-2 shadow-retro cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Setujui Semua Terpilih</span>
          </button>
        </div>
      )}

      {/* Tabel Permohonan */}
      <div className="rounded-2xl border-2 border-black bg-white shadow-retro overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-xs text-black/70 font-bold space-y-2">
            <Clock className="h-8 w-8 text-black mx-auto" />
            <p>Belum ada permohonan izin atau sakit pada status ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-soft border-b-2 border-black text-black uppercase font-mono font-bold">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.length === items.length && items.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-2 border-black accent-black"
                    />
                  </th>
                  <th className="p-3.5">Pertemuan</th>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Bukti</th>
                  <th className="p-3.5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10 font-medium text-black">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-gray-soft/40 transition-colors">
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(it.id)}
                        onChange={() => toggleSelect(it.id)}
                        className="rounded border-2 border-black accent-black"
                      />
                    </td>
                    <td className="p-3.5 font-bold text-black">
                      Pertemuan {it.sessionNumber}
                    </td>
                    <td className="p-3.5 font-mono text-black/80 font-bold">
                      {it.sessionDate || '-'}
                    </td>
                    <td className="p-3.5">
                      {it.status === 'disetujui' && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border-2 border-black bg-white text-black font-mono font-bold shadow-retro-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Disetujui
                        </span>
                      )}
                      {it.status === 'ditolak' && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border-2 border-black bg-gray-soft text-black font-mono font-bold shadow-retro-sm">
                          <XCircle className="w-3.5 h-3.5" />
                          Ditolak
                        </span>
                      )}
                      {it.status === 'menunggu' && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border-2 border-black bg-white text-black font-mono font-bold shadow-retro-sm">
                          <Clock className="w-3.5 h-3.5" />
                          Menunggu
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => handleViewProof(it)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-black bg-white hover:bg-gray-soft text-black font-bold text-xs shadow-retro-sm cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Bukti</span>
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      {it.status === 'menunggu' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleReview(it.id, 'disetujui')}
                            disabled={isPending}
                            className="px-3 py-1.5 rounded-lg border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-bold shadow-retro-sm cursor-pointer disabled:opacity-50"
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectingItemId(it.id)}
                            disabled={isPending}
                            className="px-3 py-1.5 rounded-lg border-2 border-black bg-white text-black hover:bg-gray-soft text-xs font-bold shadow-retro-sm cursor-pointer disabled:opacity-50"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-mono font-bold text-black/70">
                          {it.reviewNote || 'Selesai ditinjau'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Input Alasan Penolakan */}
      {rejectingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border-2 border-black rounded-2xl shadow-retro-lg w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
              <h3 className="font-heading font-black text-sm text-black">
                Alasan Penolakan Permohonan Izin / Sakit
              </h3>
              <button
                type="button"
                onClick={() => setRejectingItemId(null)}
                className="p-1 rounded border border-black bg-white hover:bg-gray-soft text-black shadow-retro-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-black/75 font-medium leading-relaxed">
              Penolakan wajib menyertakan alasan yang jelas agar mahasiswa dapat memperbaiki dokumen bukti.
            </p>
            <textarea
              rows={3}
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Contoh: Bukti surat dokter buram atau tidak mencantumkan cap resmi fasilitas kesehatan."
              className="w-full px-3 py-2 rounded-lg border-2 border-black bg-white text-black font-sans font-medium text-xs shadow-retro-sm"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItemId(null)}
                className="px-4 py-2 rounded-xl border-2 border-black bg-white hover:bg-gray-soft text-black text-xs font-bold shadow-retro-sm cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleReview(rejectingItemId, 'ditolak', rejectionNote)}
                disabled={isPending || !rejectionNote.trim()}
                className="px-4 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-bold shadow-retro cursor-pointer disabled:opacity-50"
              >
                Tolak Permohonan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel Pratinjau Berkas Bukti (Signed URL) */}
      {activeProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border-2 border-black rounded-2xl shadow-retro-lg w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b-2 border-black bg-gray-soft flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-black" />
                <span className="font-heading font-black text-xs sm:text-sm text-black">
                  Berkas Bukti Permohonan (Signed URL 60s)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveProofUrl(null)}
                className="p-1 rounded-lg border border-black bg-white hover:bg-gray-soft text-black shadow-retro-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-gray-soft/20">
              <div className="text-center space-y-3 p-8 rounded-2xl border-2 border-dashed border-black bg-white shadow-retro max-w-md w-full">
                <FileText className="w-12 h-12 text-black mx-auto" />
                <p className="text-xs text-black font-bold">
                  Pratinjau Berkas Bukti Izin / Sakit Mahasiswa
                </p>
                <a
                  href={activeProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-bold inline-flex items-center gap-2 shadow-retro cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Buka Berkas di Tab Baru</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
