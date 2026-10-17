'use client';

import React, { useState, useTransition } from 'react';
import {
  MessageSquareWarning,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  FileText,
  Clock,
  User,
  Filter,
} from 'lucide-react';
import {
  type GradeDisputeItem,
  type DisputeStatus,
  resolveGradeDisputeAction,
  sendDisputeMessageAction,
} from './dispute-actions';

interface LecturerDisputesViewProps {
  initialDisputes: GradeDisputeItem[];
}

export function LecturerDisputesView({ initialDisputes }: LecturerDisputesViewProps) {
  const [disputes, setDisputes] = useState<GradeDisputeItem[]>(initialDisputes);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(
    initialDisputes[0]?.id || null
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isPending, startTransition] = useTransition();

  // Form keputusan
  const [decision, setDecision] = useState<'diterima' | 'ditolak' | 'ditinjau'>('diterima');
  const [newScore, setNewScore] = useState<number | ''>('');
  const [responseMsg, setResponseMsg] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form pesan percakapan
  const [chatMessage, setChatMessage] = useState('');

  const selectedDispute = disputes.find((d) => d.id === selectedDisputeId);

  const filteredDisputes = disputes.filter((d) => {
    if (statusFilter === 'all') return true;
    return d.status === statusFilter;
  });

  const activeCount = disputes.filter((d) => d.status === 'diajukan' || d.status === 'ditinjau').length;

  const handleResolve = () => {
    if (!selectedDispute) return;
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await resolveGradeDisputeAction({
        disputeId: selectedDispute.id,
        decision,
        newScore: decision === 'diterima' ? Number(newScore) : null,
        response: responseMsg,
        isGradebookFinal: false,
      });

      if (res.ok) {
        setActionSuccess(`Sanggahan berhasil diputuskan sebagai '${res.data?.status}'.`);
        setDisputes((prev) =>
          prev.map((d) =>
            d.id === selectedDispute.id
              ? {
                  ...d,
                  status: res.data!.status,
                  response: responseMsg,
                  new_score: decision === 'diterima' ? Number(newScore) : d.new_score,
                }
              : d
          )
        );
        setResponseMsg('');
        setNewScore('');
      } else {
        setActionError(res.error || 'Gagal memproses keputusan sanggahan.');
      }
    });
  };

  const handleSendMessage = () => {
    if (!selectedDispute || !chatMessage.trim()) return;

    startTransition(async () => {
      const res = await sendDisputeMessageAction({
        disputeId: selectedDispute.id,
        body: chatMessage.trim(),
      });

      if (res.ok && res.data) {
        setDisputes((prev) =>
          prev.map((d) =>
            d.id === selectedDispute.id
              ? { ...d, messages: [...(d.messages || []), res.data!] }
              : d
          )
        );
        setChatMessage('');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Sanggahan
            {activeCount > 0 && (
              <span className="rounded-full bg-danger/10 text-danger text-xs px-2.5 py-0.5 font-semibold">
                {activeCount} aktif
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Peninjauan dan penetapan keputusan atas sanggahan nilai dari mahasiswa.
          </p>
        </div>

        {/* Filter status */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="field text-sm !w-auto"
          >
            <option value="all">Semua Status</option>
            <option value="diajukan">Diajukan</option>
            <option value="ditinjau">Ditinjau</option>
            <option value="diterima">Diterima</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {filteredDisputes.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface p-12 text-center">
          <MessageSquareWarning className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="font-semibold text-foreground text-base">Tidak ada sanggahan nilai</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Belum ada permohonan sanggahan nilai yang cocok dengan filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Antrean Sanggahan */}
          <div className="lg:col-span-1 space-y-3">
            {filteredDisputes.map((d) => {
              const isSelected = d.id === selectedDisputeId;
              return (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelectedDisputeId(d.id);
                    setActionError(null);
                    setActionSuccess(null);
                  }}
                  className={`p-4 rounded-[12px] border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-surface hover:border-foreground/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {d.student_name || 'Mahasiswa'}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        d.status === 'diajukan'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : d.status === 'ditinjau'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                          : d.status === 'diterima'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {d.target_type}: {d.target_title || d.target_id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-foreground/80 mt-2 line-clamp-2">
                    {d.reason}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
                    <span>Skor saat ini: {d.old_score ?? '-'}</span>
                    <span>
                      {new Date(d.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kolom Kanan: Detail & Keputusan */}
          <div className="lg:col-span-2">
            {selectedDispute ? (
              <div className="rounded-[12px] border border-border bg-surface p-6 space-y-6">
                {/* Header Detail */}
                <div className="border-b border-border pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        {selectedDispute.student_name || 'Mahasiswa'}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sasaran: {selectedDispute.target_type} ({selectedDispute.target_title || selectedDispute.target_id})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Skor Sebelum</span>
                      <span className="text-xl font-bold font-heading text-foreground">
                        {selectedDispute.old_score ?? '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alasan Mahasiswa */}
                <div className="space-y-1.5 bg-muted/30 p-4 rounded-lg border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Alasan Sanggahan Mahasiswa
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedDispute.reason}
                  </p>
                  {selectedDispute.evidence_path && (
                    <div className="pt-2 flex items-center gap-2 text-xs text-primary">
                      <FileText className="w-4 h-4" />
                      <span>Lampiran bukti tersedia</span>
                    </div>
                  )}
                </div>

                {/* Percakapan / Tanya Jawab Singkat */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Percakapan Klarifikasi
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-muted/10 rounded border border-border/50">
                    {(!selectedDispute.messages || selectedDispute.messages.length === 0) ? (
                      <p className="text-xs text-muted-foreground italic text-center py-2">
                        Belum ada pesan klarifikasi tambahan.
                      </p>
                    ) : (
                      selectedDispute.messages.map((m) => (
                        <div key={m.id} className="text-xs p-2 rounded bg-surface border border-border/40">
                          <span className="font-semibold text-foreground">{m.author_name}: </span>
                          <span className="text-foreground/90">{m.body}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tulis pesan atau pertanyaan klarifikasi..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      disabled={isPending}
                      className="field text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={isPending || !chatMessage.trim()}
                      className="btn-solid !w-auto px-4 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim</span>
                    </button>
                  </div>
                </div>

                {/* Formulir Keputusan Dosen */}
                <div className="border-t border-border pt-4 space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Penetapan Keputusan Dosen
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setDecision('diterima')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                        decision === 'diterima'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-border bg-surface text-muted-foreground'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Terima Sanggahan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision('ditolak')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                        decision === 'ditolak'
                          ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'border-border bg-surface text-muted-foreground'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak Sanggahan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision('ditinjau')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                        decision === 'ditinjau'
                          ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'border-border bg-surface text-muted-foreground'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Minta Penjelasan (Tinjau)</span>
                    </button>
                  </div>

                  {decision === 'diterima' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium">Nilai Akhir Baru</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Contoh: 85"
                        value={newScore}
                        onChange={(e) => setNewScore(e.target.value === '' ? '' : Number(e.target.value))}
                        disabled={isPending}
                        className="field text-sm max-w-xs"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium">
                      Keterangan Keputusan {decision === 'ditolak' ? '(Wajib minimal 20 karakter)' : ''}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={
                        decision === 'ditolak'
                          ? 'Sebutkan alasan penolakan secara jelas minimal 20 karakter...'
                          : 'Keterangan atau catatan dosen untuk mahasiswa...'
                      }
                      value={responseMsg}
                      onChange={(e) => setResponseMsg(e.target.value)}
                      disabled={isPending}
                      className="field !h-auto py-2 text-sm"
                    />
                    {decision === 'ditolak' && (
                      <p className="text-[11px] text-muted-foreground">
                        {responseMsg.trim().length} / 20 karakter minimum
                      </p>
                    )}
                  </div>

                  {actionError && (
                    <p className="text-xs text-danger font-medium bg-danger/10 p-2.5 rounded">
                      {actionError}
                    </p>
                  )}
                  {actionSuccess && (
                    <p className="text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded">
                      {actionSuccess}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={
                      isPending ||
                      (decision === 'diterima' && (newScore === '' || Number(newScore) < 0)) ||
                      (decision === 'ditolak' && responseMsg.trim().length < 20) ||
                      (decision === 'ditinjau' && responseMsg.trim().length < 5)
                    }
                    className="btn-solid !w-auto px-5"
                  >
                    {isPending ? 'Memproses...' : 'Simpan Keputusan'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-[12px] border border-border bg-surface p-12 text-center text-muted-foreground">
                Pilih salah satu sanggahan untuk melihat detail dan menetapkan keputusan.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
