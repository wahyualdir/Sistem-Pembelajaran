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
  ChevronDown,
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
              ? {
                  ...d,
                  messages: [...(d.messages || []), res.data!],
                }
              : d
          )
        );
        setChatMessage('');
      }
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. BARIS ATAS: STATUS ANTRIAN & FILTER RETRO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-2 border-black bg-white shadow-retro rounded-xl">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-black uppercase text-black px-2.5 py-1 rounded border border-black bg-gray-soft shadow-retro-sm">
            {activeCount} SANGGAHAN AKTIF
          </span>
          <span className="text-xs font-bold text-black/75">
            Total {disputes.length} permohonan tercatat
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-black" />
          <span className="text-xs font-black uppercase text-black">Filter:</span>
          <div className="relative inline-block">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-2 border-black bg-white text-black text-xs font-bold px-3 py-1.5 pr-8 rounded-lg shadow-retro-sm focus:outline-none focus:ring-2 focus:ring-black cursor-pointer appearance-none"
            >
              <option value="all">Semua Status</option>
              <option value="diajukan">Diajukan</option>
              <option value="ditinjau">Ditinjau</option>
              <option value="diterima">Diterima</option>
              <option value="ditolak">Ditolak</option>
            </select>
            <ChevronDown className="w-4 h-4 text-black absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {filteredDisputes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-black bg-gray-soft/40 p-12 text-center space-y-2">
          <MessageSquareWarning className="mx-auto h-10 w-10 text-black mb-2" />
          <h3 className="font-heading font-black text-black text-base">Tidak ada sanggahan nilai</h3>
          <p className="text-xs text-black/75 font-medium max-w-sm mx-auto">
            Belum ada permohonan sanggahan nilai yang cocok dengan filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
                  className={`p-4 rounded-xl border-2 border-black cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gray-soft shadow-retro ring-2 ring-black'
                      : 'bg-white shadow-retro-sm hover:bg-gray-soft/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-heading font-black text-sm text-black">
                      {d.student_name || 'Mahasiswa'}
                    </span>
                    <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border border-black bg-white text-black shadow-retro-sm">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-xs text-black/70 mt-1 font-mono font-bold">
                    {d.target_type}: {d.target_title || d.target_id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-black font-medium mt-2 line-clamp-2">
                    {d.reason}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-black/70 border-t border-black/10 pt-2 font-mono font-bold">
                    <span>Skor: {d.old_score ?? '-'}</span>
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

          {/* Kolom Kanan: Detail & Penetapan Keputusan */}
          <div className="lg:col-span-2">
            {selectedDispute ? (
              <div className="rounded-xl border-2 border-black bg-white shadow-retro-md p-5 sm:p-6 space-y-5">
                {/* Header Detail */}
                <div className="border-b-2 border-black/10 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-lg sm:text-xl font-heading font-black text-black">
                        {selectedDispute.student_name || 'Mahasiswa'}
                      </h2>
                      <p className="text-xs text-black/70 mt-0.5 font-mono font-bold">
                        Sasaran: {selectedDispute.target_type} ({selectedDispute.target_title || selectedDispute.target_id})
                      </p>
                    </div>
                    <div className="text-right border-2 border-black px-3 py-1.5 rounded-lg bg-gray-soft shadow-retro-sm">
                      <span className="text-[10px] font-mono font-bold text-black/70 block uppercase">Skor Sebelum</span>
                      <span className="text-xl font-black font-mono text-black">
                        {selectedDispute.old_score ?? '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alasan Mahasiswa */}
                <div className="space-y-1.5 bg-gray-soft p-4 rounded-xl border-2 border-black shadow-retro-sm">
                  <p className="text-xs font-heading font-black text-black uppercase tracking-wider">
                    Alasan Sanggahan Mahasiswa
                  </p>
                  <p className="text-xs sm:text-sm text-black font-medium whitespace-pre-wrap leading-relaxed">
                    {selectedDispute.reason}
                  </p>
                  {selectedDispute.evidence_path && (
                    <div className="pt-2 flex items-center gap-2 text-xs font-bold text-black border-t border-black/10 mt-2">
                      <FileText className="w-4 h-4" />
                      <span>Lampiran bukti dokumen tersedia</span>
                    </div>
                  )}
                </div>

                {/* Percakapan / Tanya Jawab Klarifikasi */}
                <div className="space-y-3">
                  <p className="text-xs font-heading font-black text-black uppercase tracking-wider">
                    Percakapan Klarifikasi
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-gray-soft/40 rounded-xl border-2 border-black">
                    {(!selectedDispute.messages || selectedDispute.messages.length === 0) ? (
                      <p className="text-xs text-black/60 italic text-center py-2 font-medium">
                        Belum ada pesan klarifikasi tambahan.
                      </p>
                    ) : (
                      selectedDispute.messages.map((m) => (
                        <div key={m.id} className="text-xs p-2.5 rounded-lg bg-white border border-black shadow-retro-sm">
                          <span className="font-heading font-black text-black">{m.author_name}: </span>
                          <span className="text-black font-medium">{m.body}</span>
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
                      className="flex-1 border-2 border-black bg-white text-black text-xs font-medium p-2.5 rounded-lg shadow-retro-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={isPending || !chatMessage.trim()}
                      className="px-4 py-2 border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-black rounded-lg shadow-retro flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim</span>
                    </button>
                  </div>
                </div>

                {/* Formulir Keputusan Dosen */}
                <div className="border-t-2 border-black/10 pt-4 space-y-4">
                  <p className="text-xs font-heading font-black text-black uppercase tracking-wider">
                    Penetapan Keputusan Dosen
                  </p>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => setDecision('diterima')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-black border-2 border-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        decision === 'diterima'
                          ? 'bg-black text-white shadow-retro'
                          : 'bg-white text-black hover:bg-gray-soft shadow-retro-sm'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Terima Sanggahan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision('ditolak')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-black border-2 border-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        decision === 'ditolak'
                          ? 'bg-black text-white shadow-retro'
                          : 'bg-white text-black hover:bg-gray-soft shadow-retro-sm'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak Sanggahan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision('ditinjau')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-black border-2 border-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        decision === 'ditinjau'
                          ? 'bg-black text-white shadow-retro'
                          : 'bg-white text-black hover:bg-gray-soft shadow-retro-sm'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Minta Penjelasan (Tinjau)</span>
                    </button>
                  </div>

                  {decision === 'diterima' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-heading font-black text-black">Nilai Akhir Baru</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Contoh: 85"
                        value={newScore}
                        onChange={(e) => setNewScore(e.target.value === '' ? '' : Number(e.target.value))}
                        disabled={isPending}
                        className="w-full max-w-xs border-2 border-black bg-white text-black text-xs font-mono font-bold p-2.5 rounded-lg shadow-retro-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-heading font-black text-black">
                      Catatan Keputusan {decision === 'ditolak' ? '(Wajib minimal 20 karakter)' : ''}
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
                      className="w-full border-2 border-black bg-white text-black text-xs font-medium p-2.5 rounded-lg shadow-retro-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    {decision === 'ditolak' && (
                      <p className="text-[11px] font-mono font-bold text-black/70">
                        {responseMsg.trim().length} / 20 karakter minimum
                      </p>
                    )}
                  </div>

                  {actionError && (
                    <div className="p-3 border-2 border-black bg-gray-soft text-black text-xs font-black rounded-lg shadow-retro-sm">
                      ⚠️ {actionError}
                    </div>
                  )}
                  {actionSuccess && (
                    <div className="p-3 border-2 border-black bg-white text-black text-xs font-black rounded-lg shadow-retro-sm">
                      ✓ {actionSuccess}
                    </div>
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
                    className="px-6 py-2.5 border-2 border-black bg-black text-white hover:bg-neutral-800 font-black text-xs shadow-retro rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? 'Memproses...' : 'Simpan Keputusan Resmi'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-black bg-white shadow-retro p-12 text-center text-xs font-bold text-black/70">
                Pilih salah satu sanggahan di kolom kiri untuk melihat detail dan menetapkan keputusan.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
