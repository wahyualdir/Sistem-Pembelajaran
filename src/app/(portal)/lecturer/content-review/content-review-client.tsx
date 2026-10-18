'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  Check,
  X,
  Edit3,
  Sparkles,
  BookOpen,
  Volume2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  type PendingReviewCard,
  type PendingReviewPodcast,
  saveLecturerConsentAction,
  reviewContentCardAction,
  reviewPodcastScriptAction,
} from '@/modules/academic/content-review-actions';

export function ContentReviewClient({
  initialConsent,
  initialCards,
  initialPodcasts,
  isAiAvailable,
  aiUnavailableMessage,
}: {
  initialConsent: boolean;
  initialCards: PendingReviewCard[];
  initialPodcasts: PendingReviewPodcast[];
  isAiAvailable: boolean;
  aiUnavailableMessage?: string;
}) {
  const [consented, setConsented] = useState(initialConsent);
  const [activeTab, setActiveTab] = useState<'flashcard' | 'podcast'>('flashcard');
  const [cards, setCards] = useState<PendingReviewCard[]>(initialCards);
  const [podcasts, setPodcasts] = useState<PendingReviewPodcast[]>(initialPodcasts);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);

  // Edit dialog state
  const [editModal, setEditModal] = useState<{
    cardId: string;
    front: string;
    back: string;
  } | null>(null);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Consent handler
  const handleConsent = async () => {
    setIsProcessing(true);
    const res = await saveLecturerConsentAction();
    setIsProcessing(false);
    if (res.ok) {
      setConsented(true);
      setStatusMessage({ type: 'success', text: 'Persetujuan kurasi konten AI telah dicatat.' });
    }
  };

  // 2. Action handlers
  const handleApprove = useCallback(
    async (cardId: string) => {
      if (isProcessing) return;
      setIsProcessing(true);
      const res = await reviewContentCardAction({ cardId, action: 'approve' });
      setIsProcessing(false);
      if (res.ok) {
        setCards((prev) => prev.filter((c) => c.id !== cardId));
        setStatusMessage({ type: 'success', text: 'Kartu flashcard disetujui dan berhasil diterbitkan.' });
      }
    },
    [isProcessing]
  );

  const handleReject = useCallback(
    async (cardId: string) => {
      if (isProcessing) return;
      setIsProcessing(true);
      const res = await reviewContentCardAction({ cardId, action: 'reject' });
      setIsProcessing(false);
      if (res.ok) {
        setCards((prev) => prev.filter((c) => c.id !== cardId));
        setStatusMessage({ type: 'success', text: 'Kartu flashcard ditolak dan ditarik dari peredaran.' });
      }
    },
    [isProcessing]
  );

  const handleSaveEdit = async () => {
    if (!editModal || isProcessing) return;
    setIsProcessing(true);
    const res = await reviewContentCardAction({
      cardId: editModal.cardId,
      action: 'edit',
      editedContent: { front: editModal.front, back: editModal.back },
    });
    setIsProcessing(false);
    if (res.ok) {
      setCards((prev) => prev.filter((c) => c.id !== editModal.cardId));
      setEditModal(null);
      setStatusMessage({ type: 'success', text: 'Perubahan kartu berhasil disimpan dan diterbitkan.' });
    }
  };

  const handleApprovePodcast = async (podcastId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const res = await reviewPodcastScriptAction({ podcastId, action: 'approve' });
    setIsProcessing(false);
    if (res.ok) {
      setPodcasts((prev) => prev.filter((p) => p.id !== podcastId));
      setStatusMessage({ type: 'success', text: 'Naskah podcast disetujui. Siap disintesis menjadi audio.' });
    }
  };

  const handleRejectPodcast = async (podcastId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const res = await reviewPodcastScriptAction({ podcastId, action: 'reject' });
    setIsProcessing(false);
    if (res.ok) {
      setPodcasts((prev) => prev.filter((p) => p.id !== podcastId));
      setStatusMessage({ type: 'success', text: 'Naskah podcast ditolak.' });
    }
  };

  // Keyboard shortcuts (A: Approve, R: Reject, E: Edit, J: Next, K: Prev)
  useEffect(() => {
    if (editModal || cards.length === 0 || activeTab !== 'flashcard') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const activeCard = cards[selectedCardIndex];
      if (!activeCard) return;

      const key = e.key.toLowerCase();
      if (key === 'a') {
        e.preventDefault();
        handleApprove(activeCard.id);
      } else if (key === 'r') {
        e.preventDefault();
        handleReject(activeCard.id);
      } else if (key === 'e') {
        e.preventDefault();
        setEditModal({
          cardId: activeCard.id,
          front: activeCard.front,
          back: activeCard.back,
        });
      } else if (key === 'j') {
        e.preventDefault();
        setSelectedCardIndex((prev) => Math.min(cards.length - 1, prev + 1));
      } else if (key === 'k') {
        e.preventDefault();
        setSelectedCardIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards, selectedCardIndex, editModal, activeTab, handleApprove, handleReject]);

  // Jaga indeks kartu dalam batas
  useEffect(() => {
    if (selectedCardIndex >= cards.length && cards.length > 0) {
      setSelectedCardIndex(cards.length - 1);
    }
  }, [cards.length, selectedCardIndex]);

  // =========================================================================
  // VIEW: MODAL PERSETUJUAN KONTEN AI (JIKA BELUM PERNAH CONSENT)
  // =========================================================================
  if (!consented) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
        <RetroWindow
          title="Persetujuan Kurasi Konten AI"
          badge="KEBIJAKAN AKADEMIK"
          headerClassName="bg-amber-100"
        >
          <div className="p-6 sm:p-8 space-y-5">
            <div className="w-14 h-14 rounded-full border-2 border-black bg-amber-100 flex items-center justify-center mx-auto text-amber-800 shadow-xs">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2 text-center">
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-black">
                Integritas Kurasi Konten Pembelajaran
              </h2>
              <p className="text-xs sm:text-sm text-black/70 max-w-lg mx-auto leading-relaxed">
                Di SIAJAR, seluruh konten berbantuan kecerdasan buatan (flashcard dan podcast) berstatus <strong>Draf</strong> dan wajib ditinjau serta disetujui dosen sebelum dapat diakses mahasiswa.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-black/20 bg-gray-soft/60 text-xs text-black/80 space-y-2">
              <p className="font-bold text-black">Ketentuan Penggunaan:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Dosen memegang tanggung jawab akademik atas kebenaran materi yang diterbitkan.</li>
                <li>Setiap kartu mencantumkan kutipan sumber materi bahan ajar untuk verifikasi sitasi.</li>
                <li>Dosen berhak menyunting, menyetujui, atau menarik konten yang tidak sesuai capaian pembelajaran.</li>
              </ul>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConsent}
                className="px-6 py-2.5 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-retro transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Saya Menyetujui Ketentuan Kurasi AI</span>
              </button>
            </div>
          </div>
        </RetroWindow>
      </div>
    );
  }

  const activeCard = cards[selectedCardIndex];

  return (
    <div className="space-y-6">
      {/* Banner Fail-Closed jika Kunci AI Belum Tersedia */}
      {!isAiAvailable && (
        <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/80 text-amber-950 text-xs sm:text-sm space-y-1">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Konektivitas Layanan AI Nonaktif (Fail-Closed)</span>
          </div>
          <p className="text-xs text-amber-900/80 leading-relaxed">
            {aiUnavailableMessage || 'Kunci API AI belum dikonfigurasi oleh Administrator Kampus. Tombol pembuatan konten otomatis dinonaktifkan secara aman. Dosen tetap dapat meninjau kartu yang sudah ada.'}
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

      {/* Tab Switcher: Flashcard vs Podcast */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('flashcard')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 border-black transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'flashcard'
                ? 'bg-black text-white shadow-retro'
                : 'bg-white text-black hover:bg-gray-soft shadow-xs'
            )}
          >
            <span>Tinjau Flashcard</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-xs font-bold">
              {cards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('podcast')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 border-black transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'podcast'
                ? 'bg-black text-white shadow-retro'
                : 'bg-white text-black hover:bg-gray-soft shadow-xs'
            )}
          >
            <Volume2 className="w-4 h-4" />
            <span>Tinjau Naskah Podcast</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-xs font-bold">
              {podcasts.length}
            </span>
          </button>
        </div>

        {/* Petunjuk Shortcut Keyboard */}
        {activeTab === 'flashcard' && cards.length > 0 && (
          <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-black/60 bg-gray-soft/60 px-3 py-1.5 rounded-lg border border-black/20">
            <span>Shortcut:</span>
            <kbd className="px-1.5 py-0.5 rounded border border-black/30 bg-white font-mono">A</kbd> Setujui
            <kbd className="px-1.5 py-0.5 rounded border border-black/30 bg-white font-mono">E</kbd> Edit
            <kbd className="px-1.5 py-0.5 rounded border border-black/30 bg-white font-mono">R</kbd> Tolak
            <kbd className="px-1.5 py-0.5 rounded border border-black/30 bg-white font-mono">J / K</kbd> Navigasi
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KURASI FLASHCARD DENGAN SHORTCUT & GROUNDING SCORE                */}
      {/* ========================================================================= */}
      {activeTab === 'flashcard' && (
        <div className="space-y-4">
          {cards.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-black bg-gray-soft/40 space-y-3">
              <BadgeCheck className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-base sm:text-lg font-bold text-black">
                Semua Kartu Flashcard Telah Ditinjau
              </h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Tidak ada draf flashcard yang menunggu persetujuan dosen saat ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Navigator Kartu */}
              <div className="flex items-center justify-between text-xs font-bold text-black/70">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-black text-white font-bold">
                    Kartu {selectedCardIndex + 1} dari {cards.length}
                  </span>
                  <span>· {activeCard.class_title} ({activeCard.chapter_title})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={selectedCardIndex === 0}
                    onClick={() => setSelectedCardIndex((prev) => Math.max(0, prev - 1))}
                    className="p-1 rounded-lg border border-black/20 bg-white hover:bg-gray-soft disabled:opacity-30 cursor-pointer"
                    title="Kartu sebelumnya (K)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={selectedCardIndex === cards.length - 1}
                    onClick={() => setSelectedCardIndex((prev) => Math.min(cards.length - 1, prev + 1))}
                    className="p-1 rounded-lg border border-black/20 bg-white hover:bg-gray-soft disabled:opacity-30 cursor-pointer"
                    title="Kartu berikutnya (J)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CARD INSPECTOR PANEL */}
              <div className="p-6 rounded-2xl border-2 border-black bg-white shadow-retro space-y-6">
                {/* Header Kartu: Status & Grounding Score */}
                <div className="flex items-center justify-between border-b border-black/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold uppercase">
                      Status: {activeCard.status}
                    </span>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded border text-xs font-bold',
                        activeCard.grounding_score >= 80
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                          : 'border-rose-300 bg-rose-50 text-rose-900'
                      )}
                    >
                      Grounding: {activeCard.grounding_score}%
                    </span>
                  </div>
                  {activeCard.source_material_title && (
                    <span className="text-xs text-black/60 truncate max-w-[250px] font-medium">
                      Sumber: {activeCard.source_material_title}
                    </span>
                  )}
                </div>

                {/* Konten Bagian Depan & Belakang */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-black/20 bg-gray-soft/40 space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-black/60">
                      Bagian Depan (Pertanyaan)
                    </span>
                    <p className="font-bold text-sm sm:text-base text-black leading-relaxed">
                      {activeCard.front}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-black/20 bg-amber-50/40 space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-black/60">
                      Bagian Belakang (Kunci Jawaban)
                    </span>
                    <p className="font-bold text-sm sm:text-base text-black leading-relaxed">
                      {activeCard.back}
                    </p>
                  </div>
                </div>

                {/* Sitasi Kutipan Materi Sumber */}
                {activeCard.source_segment && (
                  <div className="p-3.5 rounded-xl border border-black/15 bg-gray-soft/60 text-xs text-black/80 space-y-1">
                    <div className="font-bold text-black flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span>Kutipan Bahan Ajar Rujukan:</span>
                    </div>
                    <p className="italic leading-relaxed">"{activeCard.source_segment}"</p>
                  </div>
                )}

                {/* Tombol Aksi Kurasi Dosen */}
                <div className="pt-2 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-black/60 font-medium">
                    Tindakan ini berlaku seketika pada basis data dan dapat dibatalkan sewaktu-waktu.
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleReject(activeCard.id)}
                      className="px-4 py-2 rounded-xl border-2 border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4 text-rose-600" />
                      <span>Tolak (R)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() =>
                        setEditModal({
                          cardId: activeCard.id,
                          front: activeCard.front,
                          back: activeCard.back,
                        })
                      }
                      className="px-4 py-2 rounded-xl border-2 border-black bg-white hover:bg-gray-soft text-black text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit (E)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleApprove(activeCard.id)}
                      className="px-5 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-retro transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Setujui & Terbitkan (A)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KURASI NASKAH PODCAST                                              */}
      {/* ========================================================================= */}
      {activeTab === 'podcast' && (
        <div className="space-y-4">
          {podcasts.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-black bg-gray-soft/40 space-y-3">
              <Volume2 className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-base sm:text-lg font-bold text-black">
                Tidak Ada Naskah Podcast yang Menunggu
              </h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Draf naskah podcast yang dibuat dari materi bab akan tampil di sini untuk peninjauan narasi sebelum sintesis audio.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {podcasts.map((pod) => {
                const isValidLength = pod.word_count >= 450 && pod.word_count <= 900;
                const estMin = Math.round((pod.word_count / 150) * 10) / 10;
                return (
                  <div
                    key={pod.id}
                    className="p-5 sm:p-6 rounded-2xl border-2 border-black bg-white shadow-retro space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded border border-black/20 bg-gray-soft text-xs font-bold text-black">
                            {pod.class_title}
                          </span>
                          <span className="text-xs font-bold text-black/60 truncate">
                            {pod.chapter_title}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-lg text-black mt-1">
                          {pod.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded border text-xs font-bold',
                            isValidLength
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : 'border-amber-300 bg-amber-50 text-amber-900'
                          )}
                        >
                          {pod.word_count} kata (~{estMin} menit)
                        </span>
                        <span className="px-2.5 py-0.5 rounded border border-black/20 bg-gray-soft text-xs font-bold text-black">
                          Narator: {pod.narrator}
                        </span>
                      </div>
                    </div>

                    {/* Pratinjau Naskah */}
                    <div className="p-4 rounded-xl border border-black/20 bg-gray-soft/40 max-h-60 overflow-y-auto font-sans text-xs sm:text-sm text-black leading-relaxed whitespace-pre-wrap">
                      {pod.script_text}
                    </div>

                    {/* Tombol Aksi Kurasi Podcast */}
                    <div className="pt-2 border-t border-black/10 flex items-center justify-between gap-3">
                      <div className="text-xs text-black/60 font-medium">
                        {isValidLength
                          ? 'Panjang naskah ideal untuk podcast bab pendek.'
                          : 'Perhatian: Naskah di luar rentang standar (450 - 900 kata).'}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRejectPodcast(pod.id)}
                          className="px-4 py-2 rounded-xl border-2 border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                        >
                          Tolak Naskah
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprovePodcast(pod.id)}
                          className="px-5 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-retro transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Setujui Naskah Podcast</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT KARTU FLASHCARD                                               */}
      {/* ========================================================================= */}
      {editModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border-2 border-black p-6 space-y-4 shadow-retro animate-scale-in font-sans">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="font-heading font-bold text-lg text-black">
                Edit Konten Flashcard
              </h3>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="p-1 rounded-lg hover:bg-gray-soft text-black/60 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-black uppercase">
                  Bagian Depan (Pertanyaan)
                </label>
                <textarea
                  rows={3}
                  value={editModal.front}
                  onChange={(e) => setEditModal({ ...editModal, front: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-black text-xs sm:text-sm font-medium focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-black uppercase">
                  Bagian Belakang (Jawaban)
                </label>
                <textarea
                  rows={4}
                  value={editModal.back}
                  onChange={(e) => setEditModal({ ...editModal, back: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-black text-xs sm:text-sm font-medium focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-black/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="px-4 py-2 rounded-xl border-2 border-black bg-white hover:bg-gray-soft text-xs sm:text-sm font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan & Terbitkan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
