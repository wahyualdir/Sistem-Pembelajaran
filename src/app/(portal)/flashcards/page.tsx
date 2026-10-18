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
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Flashcard Belajar"
        badge="Pengulangan Berjarak"
        headerClassName="bg-gray-soft"
      >
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black/15 pb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-black flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                <span>Flashcard</span>
              </h1>
              <p className="text-xs sm:text-sm text-black/70 mt-1">
                Latihan mengingat konsep perkuliahan secara bertahap berbasis sistem kotak Leitner (1, 2, 4, 8, 16 hari).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold border-2 border-black rounded-xl bg-white hover:bg-gray-soft transition-all shadow-xs text-black"
              >
                <Layers className="w-4 h-4" />
                <span>Peta Kelas</span>
              </Link>
            </div>
          </div>

          <FlashcardsClient initialDecks={decks} />
        </div>
      </RetroWindow>
    </div>
  );
}
