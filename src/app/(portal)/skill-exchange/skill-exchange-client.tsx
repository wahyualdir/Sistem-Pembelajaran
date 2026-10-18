'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HandHelping,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Award,
  Flag,
  Send,
  X,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type SkillRequestItem,
  createSkillRequestAction,
  respondToSkillRequestAction,
  acceptSkillResponseAction,
  reportSkillContentAction,
} from '@/modules/academic/skill-exchange-actions';

export function SkillExchangeClient({
  classes,
  initialClassId,
  initialRequests,
  isBlackedOut,
  blackoutReason,
  currentUserId,
}: {
  classes: Array<{ id: string; title: string }>;
  initialClassId: string;
  initialRequests: SkillRequestItem[];
  isBlackedOut: boolean;
  blackoutReason?: string;
  currentUserId?: string;
}) {
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [requests, setRequests] = useState<SkillRequestItem[]>(initialRequests);
  const [filter, setFilter] = useState<'all' | 'terbuka' | 'terjawab'>('all');

  // Modal minta bantuan
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Response input form state per request
  const [respondingToId, setRespondingToId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const handleCreateRequest = async () => {
    if (!newTitle.trim() || !newDesc.trim()) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await createSkillRequestAction({
      classId: selectedClassId,
      chapterId: '00000000-0000-0000-0000-000000000000', // fallback or selected chapter
      title: newTitle,
      description: newDesc,
    });

    setIsSubmitting(false);

    if (res.ok) {
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDesc('');
      setStatusMessage({ type: 'success', text: 'Permohonan bantuan berhasil diajukan ke rekan sekelas.' });
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Gagal membuat permohonan.' });
    }
  };

  const handleSendResponse = async (requestId: string) => {
    if (!responseText.trim()) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await respondToSkillRequestAction({
      requestId,
      classId: selectedClassId,
      content: responseText,
    });

    setIsSubmitting(false);

    if (res.ok) {
      setRespondingToId(null);
      setResponseText('');
      setStatusMessage({ type: 'success', text: 'Jawaban bantuan berhasil dikirimkan.' });
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Gagal mengirimkan jawaban.' });
    }
  };

  const handleAcceptResponse = async (responseId: string) => {
    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await acceptSkillResponseAction(responseId);
    setIsSubmitting(false);

    if (res.ok) {
      setStatusMessage({ type: 'success', text: 'Jawaban diterima! Rekan pembantu telah dianugerahi 50 XP.' });
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Gagal menerima jawaban.' });
    }
  };

  const handleReport = async (requestId?: string, responseId?: string) => {
    const reason = prompt('Masukkan alasan pelaporan (misal: memuat kunci jawaban ujian atau link mencurigakan):');
    if (!reason) return;

    const res = await reportSkillContentAction({ requestId, responseId, reason });
    if (res.ok) {
      alert('Laporan berhasil dikirimkan ke dosen dan pengawas kelas.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner Blackout jika ada Ujian Bernilai Aktif */}
      {isBlackedOut && (
        <div className="p-4 rounded-xl border-2 border-rose-300 bg-rose-50 text-rose-950 text-xs sm:text-sm space-y-1">
          <div className="font-bold flex items-center gap-2 text-rose-900">
            <Lock className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Tukar Keahlian Dibekukan Sementara (Periode Penilaian Aktif)</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            {blackoutReason || 'Fitur permohonan dan jawaban bantuan dibekukan sementara karena ada ujian/kuis bernilai yang sedang berlangsung pada kelas ini.'}
          </p>
        </div>
      )}

      {/* Notifikasi Status Pesan */}
      {statusMessage && (
        <div
          className={cn(
            'p-3.5 rounded-xl border-2 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-fade-in',
            statusMessage.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-rose-300 bg-rose-50 text-rose-900'
          )}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs underline hover:no-underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Filter Bar: Pemilihan Kelas & Tombol Minta Bantuan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          {classes.length > 0 ? (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border-2 border-black bg-white text-xs sm:text-sm font-bold text-black shadow-xs focus:outline-hidden"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-bold text-black/60">Tidak ada kelas aktif</span>
          )}

          <div className="flex items-center gap-1 border-l-2 border-black/20 pl-2">
            {(['all', 'terbuka', 'terjawab'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  filter === st
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white text-black hover:bg-gray-soft'
                )}
              >
                {st === 'all' ? 'Semua' : st === 'terbuka' ? 'Belum Terjawab' : 'Terjawab'}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={isBlackedOut || isSubmitting}
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 disabled:opacity-40 text-xs sm:text-sm font-bold shadow-retro transition-all cursor-pointer inline-flex items-center gap-2 w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Minta Bantuan Rekan</span>
        </button>
      </div>

      {/* DAFTAR PERMOHONAN BANTUAN */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-black bg-gray-soft/40 space-y-3">
            <HandHelping className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-black">
              Belum Ada Permohonan Bantuan
            </h3>
            <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
              Semua mahasiswa di kelas ini saling memahami materi dengan baik, atau Anda dapat mengajukan pertanyaan konsep materi bab yang sedang Anda pelajari.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="p-5 sm:p-6 rounded-2xl border-2 border-black bg-white shadow-retro space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded border border-black/20 bg-gray-soft text-xs font-bold text-black">
                      {req.chapter_title}
                    </span>
                    {req.topic_name && (
                      <span className="px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-900 text-xs font-bold">
                        Topik: {req.topic_name}
                      </span>
                    )}
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-bold uppercase',
                        req.status === 'terjawab'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      )}
                    >
                      {req.status}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-black mt-1.5">
                    {req.title}
                  </h3>
                </div>

                <div className="text-xs text-black/60 font-medium">
                  Ditanyakan oleh: <span className="font-bold text-black">{req.student_name}</span>
                </div>
              </div>

              {/* Deskripsi Pertanyaan */}
              <p className="text-xs sm:text-sm text-black leading-relaxed font-sans whitespace-pre-wrap">
                {req.description}
              </p>

              {/* Utas Jawaban Rekan Sejawat */}
              {req.responses && req.responses.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-black/60">
                    Jawaban Rekan ({req.responses.length})
                  </div>
                  <div className="space-y-2 pl-3 sm:pl-4 border-l-2 border-black">
                    {req.responses.map((resp) => {
                      const isMyRequest = req.student_id === currentUserId;
                      return (
                        <div
                          key={resp.id}
                          className={cn(
                            'p-3.5 rounded-xl border border-black/20 bg-gray-soft/40 space-y-2 text-xs sm:text-sm',
                            resp.is_accepted && 'border-2 border-emerald-400 bg-emerald-50/50'
                          )}
                        >
                          <div className="flex items-center justify-between text-xs text-black/70">
                            <span className="font-bold text-black">{resp.responder_name}</span>
                            <div className="flex items-center gap-2">
                              {resp.is_accepted && (
                                <span className="px-2 py-0.5 rounded border border-emerald-400 bg-emerald-100 text-emerald-900 font-bold text-[11px] flex items-center gap-1">
                                  <Award className="w-3 h-3 text-emerald-700" />
                                  <span>Jawaban Diterima (+50 XP)</span>
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleReport(undefined, resp.id)}
                                className="text-black/40 hover:text-rose-600 transition-colors p-1"
                                title="Laporkan pelanggaran"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-black font-medium leading-relaxed whitespace-pre-wrap">
                            {resp.content}
                          </p>

                          {/* Tombol Terima Jawaban oleh Pemohon */}
                          {isMyRequest && !resp.is_accepted && req.status !== 'terjawab' && (
                            <div className="pt-1">
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleAcceptResponse(resp.id)}
                                className="px-3 py-1.5 rounded-lg border-2 border-emerald-400 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Tandai Sebagai Jawaban yang Membantu (+50 XP)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Menjawab */}
              {respondingToId === req.id ? (
                <div className="pt-2 border-t border-black/10 space-y-2 animate-fade-in">
                  <textarea
                    rows={3}
                    placeholder="Tuliskan penjelasan konseptual Anda (dilarang menyertakan link eksternal)..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-black text-xs sm:text-sm font-medium focus:outline-hidden"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRespondingToId(null)}
                      className="px-3 py-1.5 rounded-lg border border-black/30 bg-white text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || !responseText.trim()}
                      onClick={() => handleSendResponse(req.id)}
                      className="px-4 py-1.5 rounded-lg border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Jawaban</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-black/10 flex items-center justify-between">
                  <span className="text-[11px] text-black/50 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Terpantau Dosen Pengampu</span>
                  </span>
                  {!isBlackedOut && (
                    <button
                      type="button"
                      onClick={() => {
                        setRespondingToId(req.id);
                        setResponseText('');
                      }}
                      className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Beri Jawaban Bantuan</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL MINTA BANTUAN BARU */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border-2 border-black p-6 space-y-4 shadow-retro animate-scale-in font-sans">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="font-heading font-bold text-lg text-black">
                Minta Bantuan Pemahaman Konsep
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-soft text-black/60 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-black uppercase">
                  Topik / Pertanyaan Utama
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Perbedaan antara Index B-Tree dan Hash Index"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-black text-xs sm:text-sm font-medium focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-black uppercase">
                  Deskripsi Kesulitan Anda
                </label>
                <textarea
                  rows={4}
                  placeholder="Jelaskan konsep mana yang belum Anda pahami (dilarang meminta kunci jawaban langsung atau menyertakan tautan luar)..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-black text-xs sm:text-sm font-medium focus:outline-hidden"
                />
              </div>

              <div className="p-3 rounded-lg border border-black/15 bg-gray-soft/60 text-xs text-black/70 space-y-0.5">
                <p className="font-bold text-black">Aturan Tukar Keahlian:</p>
                <p>1. Rekan menjawab dengan penjelasan konsep, bukan membagikan file jawaban.</p>
                <p>2. Dilarang keras menyertakan link eksternal atau kontak pribadi.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-black/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-xl border-2 border-black bg-white hover:bg-gray-soft text-xs sm:text-sm font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting || !newTitle.trim() || !newDesc.trim()}
                onClick={handleCreateRequest}
                className="px-5 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Terbitkan Permohonan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
