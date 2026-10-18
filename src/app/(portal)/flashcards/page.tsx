import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { RetroWindow } from '@/components/retro/retro-window';
import { Brain, ArrowRight, Layers, Sparkles } from 'lucide-react';

export default async function FlashcardsPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  // Proteksi akses peran: Mahasiswa, Asisten Dosen, Dosen, Kaprodi, Super Admin
  if (role === 'SYSTEM_ADMIN' || role === 'ACADEMIC_STAFF') {
    redirect(role === 'SYSTEM_ADMIN' ? '/admin/system' : '/staff');
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Flashcard Belajar"
        badge="Pengulangan Berjarak"
        headerClassName="bg-gray-soft"
      >
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                Flashcard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Latihan mengingat konsep perkuliahan secara bertahap berbasis sistem kotak Leitner.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors"
              >
                <Layers className="w-4 h-4" />
                Peta Kelas
              </Link>
            </div>
          </div>

          {/* Keadaan Kosong (Empty State) Sesuai Panduan Tulisan */}
          <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-4 bg-muted/20">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <Brain className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Belum ada kartu belajar yang jatuh tempo hari ini
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Kartu ulasan akan muncul saat kelas mengaktifkan fitur Peta Pulau dan dosen menerbitkan materi bab.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/classes"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Buka Kelas Saya
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </RetroWindow>
    </div>
  );
}
