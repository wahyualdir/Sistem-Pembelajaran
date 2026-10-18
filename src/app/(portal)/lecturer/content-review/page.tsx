import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { RetroWindow } from '@/components/retro/retro-window';
import { BadgeCheck, Layers } from 'lucide-react';
import {
  getLecturerConsentAction,
  listPendingContentReviewsAction,
  checkAiAvailabilityAction,
} from '@/modules/academic/content-review-actions';
import { ContentReviewClient } from './content-review-client';

export default async function ContentReviewPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  // Hanya Dosen Pengampu, Asisten Dosen (can_prepare_content), Kaprodi, dan Super Admin
  if (role !== 'LECTURER' && role !== 'TEACHING_ASSISTANT' && role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    redirect(role === 'STUDENT' ? '/student' : '/admin');
  }

  const [consentRes, pendingRes, aiAvail] = await Promise.all([
    getLecturerConsentAction().catch(() => ({ consented: false })),
    listPendingContentReviewsAction().catch(() => ({ cards: [], podcasts: [] })),
    checkAiAvailabilityAction().catch(() => ({ isAvailable: false, message: undefined })),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Tinjau Konten Pembelajaran"
        badge="Kurasi Pengajar"
        headerClassName="bg-gray-soft"
      >
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black/15 pb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-black flex items-center gap-2">
                <BadgeCheck className="w-6 h-6 text-primary" />
                <span>Tinjau Konten</span>
              </h1>
              <p className="text-xs sm:text-sm text-black/70 mt-1">
                Tinjau, sunting, dan setujui draf flashcard dan naskah podcast hasil kurasi materi bab sebelum diterbitkan untuk mahasiswa.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold border-2 border-black rounded-xl bg-white hover:bg-gray-soft transition-all shadow-xs text-black"
              >
                <Layers className="w-4 h-4" />
                <span>Kelas Saya</span>
              </Link>
            </div>
          </div>

          <ContentReviewClient
            initialConsent={consentRes.consented}
            initialCards={pendingRes.cards}
            initialPodcasts={pendingRes.podcasts}
            isAiAvailable={aiAvail.isAvailable}
            aiUnavailableMessage={aiAvail.message}
          />
        </div>
      </RetroWindow>
    </div>
  );
}
