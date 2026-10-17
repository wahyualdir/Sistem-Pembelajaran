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
// 1. MODAL PENGAJUAN IZIN & SAKIT MAHASISWA
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
      // Simulasikan upload bukti ke storage bucket absence-proofs
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-bold text-base text-foreground">
              Formulir Permohonan Izin dan Sakit
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pengajuan ketidakhadiran resmi perkuliahan dengan verifikasi dosen pengampu.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage && (
          <div className="p-3 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-3 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Pilihan Jenis */}
          <div>
            <label className="font-semibold text-foreground block mb-1.5">
              Jenis Permohonan *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  type === 'sakit'
                    ? 'border-primary bg-primary/5 font-semibold text-foreground'
                    : 'border-border bg-surface text-muted-foreground'
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
                <span className="w-2.5 h-2.5 rounded-full border border-primary bg-primary" />
                <span>Sakit (Wajib Surat Dokter)</span>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  type === 'izin'
                    ? 'border-primary bg-primary/5 font-semibold text-foreground'
                    : 'border-border bg-surface text-muted-foreground'
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
                <span className="w-2.5 h-2.5 rounded-full border border-primary bg-primary" />
                <span>Izin (Keperluan Resmi)</span>
              </label>
            </div>
          </div>

          {/* Rentang Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Tanggal Mulai *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="field text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">
                Tanggal Selesai *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="field text-xs font-mono"
              />
            </div>
          </div>

          {/* Daftar Pertemuan Terdeteksi */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Pertemuan Perkuliahan Terdampak ({selectedSessionIds.length} dipilih) *
            </label>
            <div className="rounded-xl border border-border bg-muted/20 p-2.5 max-h-36 overflow-y-auto space-y-1.5">
              {availableSessions.length === 0 ? (
                <p className="text-[11px] text-muted-foreground py-2 text-center">
                  Tidak ada pertemuan perkuliahan pada rentang tanggal ini.
                </p>
              ) : (
                availableSessions.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSessionIds.includes(s.id)}
                      onChange={() => toggleSession(s.id)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-foreground font-medium flex-1">
                      {s.className} &bull; Pertemuan {s.sessionNumber}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {s.sessionDate}
                    </span>
                  </label>
                ))
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Anda dapat mencabut centang untuk pertemuan yang tetap Anda ikuti.
            </p>
          </div>

          {/* Alasan */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Alasan Permohonan *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Mengalami demam tinggi dan disarankan dokter beristirahat 3 hari."
              required
              minLength={10}
              className="field text-xs"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Cukup tulis alasan singkat. Tidak perlu menyebut diagnosis.
            </p>
          </div>

          {/* Unggah Berkas Bukti */}
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Unggah Berkas Bukti (PDF, JPG, PNG &bull; Maks. 5 MB){' '}
              {type === 'sakit' ? '*' : '(Opsional)'}
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required={type === 'sakit'}
              className="field text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="btn-outline !w-auto text-xs px-3.5 py-2"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-solid !w-auto text-xs px-4 py-2 font-semibold"
            >
              {isPending ? 'Mengirim...' : 'Kirim Permohonan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 2. TAB PERMOHONAN IZIN DOSEN (LecturerAbsenceTabView)
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
        setMessageSuccess(`Permohonan telah ${decision}. Presensi diperbarui secara otomatis.`);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Permohonan Izin dan Sakit</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Verifikasi surat izin atau bukti sakit mahasiswa untuk pembaruan rekaman presensi kelas.
          </p>
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="field text-xs max-w-[150px]"
          >
            <option value="all">Semua Status</option>
            <option value="menunggu">Menunggu Verifikasi</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {messageSuccess && (
        <div className="p-3 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {messageSuccess}
        </div>
      )}
      {messageError && (
        <div className="p-3 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {messageError}
        </div>
      )}

      {/* Baris Tindakan Massal */}
      {selectedItemIds.length > 0 && (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            {selectedItemIds.length} permohonan dipilih
          </span>
          <button
            type="button"
            onClick={handleBatchApprove}
            disabled={isPending}
            className="btn-solid !w-auto text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Setujui Terpilih</span>
          </button>
        </div>
      )}

      {/* Tabel Permohonan */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Belum ada permohonan izin atau sakit pada status ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.length === items.length && items.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border text-primary"
                    />
                  </th>
                  <th className="p-3">Pertemuan</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Bukti</th>
                  <th className="p-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-muted/30">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(it.id)}
                        onChange={() => toggleSelect(it.id)}
                        className="rounded border-border text-primary"
                      />
                    </td>
                    <td className="p-3 font-semibold text-foreground">
                      Pertemuan {it.sessionNumber}
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {it.sessionDate || '-'}
                    </td>
                    <td className="p-3">
                      {it.status === 'disetujui' && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Disetujui
                        </span>
                      )}
                      {it.status === 'ditolak' && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                          <XCircle className="w-3 h-3" />
                          Ditolak
                        </span>
                      )}
                      {it.status === 'menunggu' && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          <Clock className="w-3 h-3" />
                          Menunggu
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleViewProof(it)}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Bukti</span>
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      {it.status === 'menunggu' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReview(it.id, 'disetujui')}
                            disabled={isPending}
                            className="px-2.5 py-1 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700 text-[11px]"
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectingItemId(it.id)}
                            disabled={isPending}
                            className="px-2.5 py-1 rounded-lg font-semibold bg-rose-600 text-white hover:bg-rose-700 text-[11px]"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
            <h3 className="font-bold text-sm text-foreground">
              Alasan Penolakan Permohonan Izin / Sakit
            </h3>
            <p className="text-xs text-muted-foreground">
              Penolakan wajib menyertakan alasan yang jelas untuk mahasiswa.
            </p>
            <textarea
              rows={3}
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Contoh: Bukti surat dokter tidak terbaca atau melebihi batas tanggal."
              className="field text-xs"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingItemId(null)}
                className="btn-outline !w-auto text-xs px-3 py-1.5"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleReview(rejectingItemId, 'ditolak', rejectionNote)}
                disabled={isPending || !rejectionNote.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold"
              >
                Tolak Permohonan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel Pratinjau Berkas Bukti (Signed URL) */}
      {activeProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-bold text-xs text-foreground">
                  Berkas Bukti Permohonan (Tautan Bertanda Waktu 60 Detik)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveProofUrl(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-muted/20">
              <div className="text-center space-y-2 p-6 rounded-xl border border-dashed border-border">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-xs text-foreground font-medium">
                  Pratinjau Berkas Bukti Izin / Sakit
                </p>
                <a
                  href={activeProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-solid !w-auto text-xs px-3.5 py-1.5 inline-flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
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
