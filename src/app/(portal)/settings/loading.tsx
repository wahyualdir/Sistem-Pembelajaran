import React from 'react';
import { Loader2 } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

export default function SettingsLoading() {
  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-pulse">
      <RetroWindow
        title="memuat_pengaturan.app"
        badge="MEMUAT..."
        headerClassName="bg-gray-soft"
        bodyClassName="p-6 bg-surface"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg border-2 border-black bg-gray-soft text-ink">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl text-ink">
              Memuat Pengaturan Akun...
            </h1>
            <p className="text-xs sm:text-sm text-gray font-medium">
              Menyiapkan preferensi kanal notifikasi dan pengaturan pengguna.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t-2 border-black/10 mt-5">
          <div className="h-28 rounded-xl border-2 border-black bg-gray-soft/50" />
          <div className="h-28 rounded-xl border-2 border-black bg-gray-soft/50" />
          <div className="h-28 rounded-xl border-2 border-black bg-gray-soft/50" />
        </div>
      </RetroWindow>
    </div>
  );
}
