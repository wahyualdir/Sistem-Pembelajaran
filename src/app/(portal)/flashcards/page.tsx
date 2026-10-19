import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { RetroWindow } from '@/components/retro/retro-window';
import { Brain, ArrowRight, Layers, Sparkles } from 'lucide-react';

import { listStudentFlashcardDecksAction } from '@/modules/academic/flashcard-actions';
import { FlashcardsClient } from './flashcard-client';

export default async function FlashcardsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  // Proteksi akses peran: Mahasiswa, Asisten Dosen, Dosen, Kaprodi, Super Admin
  if (role === 'SYSTEM_ADMIN' || role === 'ACADEMIC_STAFF') {
    redirect(role === 'SYSTEM_ADMIN' ? '/admin/system' : '/staff');
  }

  const decks = await listStudentFlashcardDecksAction().catch(() => []);

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER BERANDA STYLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <Brain className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Flashcard Belajar
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Latihan mengingat konsep perkuliahan secara bertahap berbasis sistem kotak Leitner.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-ink bg-surface font-bold text-xs sm:text-sm text-ink shadow-retro hover:bg-gray-soft transition-all min-h-[44px]"
            >
              <Layers className="h-4 w-4" />
              <span>Peta Kelas</span>
            </Link>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              PENGULANGAN BERJARAK
            </span>
          </div>
        </div>

        {/* 2. KONTEN FLASHCARD CLIENT */}
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-6 shadow-retro">
          <FlashcardsClient initialDecks={decks} />
        </div>
      </div>
    </div>
  );
}
