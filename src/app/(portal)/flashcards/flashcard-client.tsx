'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Brain,
  RotateCw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  BookOpen,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  type StudentDeckItem,
  type SessionCardItem,
  getFlashcardSessionAction,
  submitFlashcardReviewAction,
} from '@/modules/academic/flashcard-actions';
import type { LeitnerBox, LeitnerRating } from '@/lib/akademik/leitner';

export function FlashcardsClient({ initialDecks }: { initialDecks: StudentDeckItem[] }) {
  const [decks] = useState<StudentDeckItem[]>(initialDecks);
  const [activeSession, setActiveSession] = useState<{
    deckId: string;
    deckTitle: string;
    chapterTitle: string;
    cards: SessionCardItem[];
    currentIndex: number;
    isFlipped: boolean;
    reviewedCount: number;
    isCompleted: boolean;
  } | null>(null);

  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSource, setShowSource] = useState(false);

  const startSession = async (deckId: string) => {
    setIsLoadingSession(true);
    const res = await getFlashcardSessionAction(deckId);
    setIsLoadingSession(false);

    if (res && res.cards.length > 0) {
      setActiveSession({
        deckId,
        deckTitle: res.deckTitle,
        chapterTitle: res.chapterTitle,
        cards: res.cards,
        currentIndex: 0,
        isFlipped: false,
        reviewedCount: 0,
        isCompleted: false,
      });
      setShowSource(false);
    }
  };

  const handleFlip = useCallback(() => {
    if (!activeSession || activeSession.isCompleted) return;
    setActiveSession((prev) => (prev ? { ...prev, isFlipped: !prev.isFlipped } : null));
  }, [activeSession]);

  const handleRate = useCallback(
    async (rating: LeitnerRating) => {
      if (!activeSession || activeSession.isCompleted || isSubmitting) return;

      const currentCard = activeSession.cards[activeSession.currentIndex];
      if (!currentCard) return;

      setIsSubmitting(true);
      await submitFlashcardReviewAction(currentCard.id, rating);
      setIsSubmitting(false);

      const nextIndex = activeSession.currentIndex + 1;
      const isDone = nextIndex >= activeSession.cards.length;

      setActiveSession((prev) =>
        prev
          ? {
              ...prev,
              currentIndex: nextIndex,
              isFlipped: false,
              reviewedCount: prev.reviewedCount + 1,
              isCompleted: isDone,
            }
          : null
      );
      setShowSource(false);
    },
    [activeSession, isSubmitting]
  );

  // Keyboard listener (Space: Flip, 1: Gagal, 2: Sulit, 3: Baik, 4: Mudah)
  useEffect(() => {
    if (!activeSession || activeSession.isCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (activeSession.isFlipped) {
        if (e.key === '1') handleRate(1);
        if (e.key === '2') handleRate(2);
        if (e.key === '3') handleRate(3);
        if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSession, handleFlip, handleRate]);

  // =========================================================================
  // VIEW 1: TAMPILAN SESI BELAJAR AKTIF (RUNNER FLASHCARD)
  // =========================================================================
  if (activeSession) {
    if (activeSession.isCompleted) {
      return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
          <RetroWindow
            title="Sesi Flashcard Tuntas"
            badge="LEITNER SELESAI"
            headerClassName="bg-retro-mint"
          >
            <div className="p-6 sm:p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full border-2 border-black bg-retro-mint text-black flex items-center justify-center mx-auto shadow-retro">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-black">
                  Luar Biasa, Sesi Belajar Selesai!
                </h2>
                <p className="text-sm text-black/70 max-w-md mx-auto">
                  Anda telah mengulas {activeSession.reviewedCount} kartu pada {activeSession.chapterTitle}.
                  Jadwal pengulangan berjarak telah diperbarui otomatis.
                </p>
              </div>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setActiveSession(null)}
                  className="px-5 py-2.5 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-sm font-bold shadow-retro cursor-pointer inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Daftar Deck</span>
                </button>
              </div>
            </div>
          </RetroWindow>
        </div>
      );
    }

    const currentCard = activeSession.cards[activeSession.currentIndex];
    const progressPercent = Math.round(
      (activeSession.currentIndex / activeSession.cards.length) * 100
    );

    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-up">
        {/* Header Navigator Sesi */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setActiveSession(null)}
            className="text-xs font-bold text-black hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Keluar Sesi</span>
          </button>
          <div className="text-xs font-bold text-black/70">
            Kartu {activeSession.currentIndex + 1} dari {activeSession.cards.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-soft h-2 rounded-full border border-black/20 overflow-hidden">
          <div
            className="bg-black h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* KARTU UTAMA (FLIP CARD) */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleFlip}
          onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
          className={cn(
            'min-h-[280px] sm:min-h-[320px] p-6 sm:p-8 rounded-2xl border-2 border-black bg-white shadow-retro cursor-pointer select-none transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5',
            activeSession.isFlipped ? 'bg-amber-50/40' : 'bg-white'
          )}
        >
          {/* Label Bagian Depan / Belakang */}
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-black/60">
              {activeSession.isFlipped ? 'Jawaban / Penjelasan' : 'Pertanyaan / Konsep'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded border border-black/20 bg-gray-soft text-black">
                Kotak {currentCard.box}
              </span>
              <span className="text-xs text-black/40 flex items-center gap-1">
                <RotateCw className="w-3 h-3" />
                Spasi untuk Balik
              </span>
            </div>
          </div>

          {/* Teks Konten Kartu */}
          <div className="py-6 sm:py-8 text-center space-y-4">
            <p className="font-heading font-bold text-lg sm:text-2xl text-black leading-relaxed">
              {activeSession.isFlipped ? currentCard.back : currentCard.front}
            </p>
          </div>

          {/* Petunjuk Bawah */}
          <div className="border-t border-black/10 pt-3 flex items-center justify-between text-xs text-black/60">
            <span>{activeSession.chapterTitle}</span>
            {currentCard.source_segment && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSource((prev) => !prev);
                }}
                className="font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{showSource ? 'Sembunyikan Sitasi' : 'Lihat Sitasi Materi'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Drawer Sitasi Materi */}
        {showSource && currentCard.source_segment && (
          <div className="p-4 rounded-xl border border-black/20 bg-gray-soft/50 text-xs text-black/80 space-y-1 animate-fade-in">
            <p className="font-bold text-black flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-primary" />
              <span>Kutipan Materi Sumber:</span>
            </p>
            <p className="italic leading-relaxed">&ldquo;{currentCard.source_segment}&rdquo;</p>
          </div>
        )}

        {/* TOMBOL RATING (MUNCUL SETELAH KARTU DIBALIK) */}
        {activeSession.isFlipped ? (
          <div className="space-y-2 pt-2 animate-fade-in">
            <p className="text-xs font-bold text-center text-black/70">
              Bagaimana pemahaman Anda terhadap kartu ini? (Pilih atau tekan angka 1-4)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleRate(1)}
                className="p-3 rounded-xl border-2 border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold text-xs sm:text-sm text-center shadow-xs transition-all cursor-pointer flex flex-col items-center gap-1"
              >
                <span>1 · Gagal</span>
                <span className="text-[10px] font-medium text-rose-700">Kembali ke Kotak 1 (+1h)</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleRate(2)}
                className="p-3 rounded-xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm text-center shadow-xs transition-all cursor-pointer flex flex-col items-center gap-1"
              >
                <span>2 · Sulit</span>
                <span className="text-[10px] font-medium text-amber-700">Kotak tetap</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleRate(3)}
                className="p-3 rounded-xl border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs sm:text-sm text-center shadow-xs transition-all cursor-pointer flex flex-col items-center gap-1"
              >
                <span>3 · Baik</span>
                <span className="text-[10px] font-medium text-blue-700">Naik 1 kotak</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleRate(4)}
                className="p-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs sm:text-sm text-center shadow-xs transition-all cursor-pointer flex flex-col items-center gap-1"
              >
                <span>4 · Mudah</span>
                <span className="text-[10px] font-medium text-emerald-700">Lompat kotak</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleFlip}
              className="px-6 py-2.5 rounded-xl border-2 border-black bg-white hover:bg-gray-soft text-black font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            >
              Balik Kartu (Spasi)
            </button>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DAFTAR DECK FLASHCARD KELAS
  // =========================================================================
  return (
    <div className="space-y-6">
      {decks.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-black bg-gray-soft/40 p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-black bg-white flex items-center justify-center mx-auto text-primary shadow-xs">
            <Brain className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-black">
              Belum ada kartu belajar yang diterbitkan
            </h3>
            <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
              Kartu flashcard akan otomatis tersedia saat dosen mengaktifkan fitur flashcard dan menerbitkan kartu bab pada mata kuliah Anda.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-retro transition-all"
            >
              <span>Buka Kelas Saya</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="p-5 sm:p-6 rounded-2xl border-2 border-black bg-white shadow-retro flex flex-col justify-between gap-4 hover:-translate-y-0.5 transition-all"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md border border-black/20 bg-gray-soft text-xs font-bold text-black">
                    {deck.class_title}
                  </span>
                  <span className="text-xs font-bold text-black/60 truncate">
                    {deck.chapter_title}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-base sm:text-lg text-black">
                  {deck.title}
                </h3>

                <p className="text-xs text-black/70 font-medium">
                  Total: {deck.total_cards} kartu · {deck.due_cards} jatuh tempo hari ini
                </p>

                {/* Meter Sebaran 5 Kotak Leitner */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-black/60">
                    <span>Sebaran Kotak Leitner</span>
                    <span>K1: {deck.box_counts[1]} · K5: {deck.box_counts[5]}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 h-2 rounded-full overflow-hidden bg-gray-soft border border-black/20">
                    {[1, 2, 3, 4, 5].map((b) => {
                      const count = deck.box_counts[b as LeitnerBox] || 0;
                      const hasCount = count > 0;
                      return (
                        <div
                          key={b}
                          className={cn(
                            'h-full transition-all',
                            hasCount ? 'bg-black' : 'bg-transparent'
                          )}
                          title={`Kotak ${b}: ${count} kartu`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-black/10 flex items-center justify-between gap-3">
                <div className="text-xs font-bold text-black/70 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{deck.due_cards > 0 ? `${deck.due_cards} Perlu Diulas` : 'Selesai untuk Hari Ini'}</span>
                </div>

                <button
                  type="button"
                  disabled={isLoadingSession}
                  onClick={() => startSession(deck.id)}
                  className="px-4 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Mulai Belajar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
