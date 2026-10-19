import React from 'react';
import Link from 'next/link';
import { Settings, Sliders, Bell, Laptop } from 'lucide-react';
import { getNotificationPreferencesAction } from '@/modules/notifications/actions';
import { PreferencesView } from '@/modules/notifications/preferences-view';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

export const metadata = {
  title: 'Preferensi Notifikasi & Kanal Pengiriman - SIAJAR LMS',
  description: 'Kelola preferensi kanal (In-App, Email, WhatsApp) dan jenis pengingat perkuliahan',
};

export default async function NotificationPreferencesPage() {
  const userContext = await getCurrentUserWithRoles();
  const preferences = (await getNotificationPreferencesAction()) || {
    user_id: userContext?.user.id || 'default',
    channels: {
      in_app: true,
      email: true,
      whatsapp: false,
    },
    events: {
      assignment_due: true,
      exam_upcoming: true,
      attendance_open: true,
      announcement: true,
      grades: true,
      forum_and_early_warning: true,
    },
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* OPEN HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <Settings className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Pengaturan Akun & Preferensi
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Konfigurasi saluran notifikasi, tampilan antarmuka, bahasa, dan pengelolaan sesi perangkat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              PENGATURAN AKUN
            </span>
          </div>
        </div>

        {/* 3-TAB NAVIGATION BAR */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b-2 border-ink/20">
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-ink font-heading font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap bg-ink text-white shadow-retro border-b-4 border-b-primary"
          >
            <Bell className="h-3.5 w-3.5 text-primary" />
            <span>Notifikasi & Pengingat</span>
          </Link>
          <Link
            href="/settings/appearance"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-ink font-heading font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap bg-surface text-ink hover:bg-gray-soft shadow-xs"
          >
            <Sliders className="h-3.5 w-3.5 text-primary" />
            <span>Tampilan & Bahasa</span>
          </Link>
          <Link
            href="/devices"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 border-ink font-heading font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap bg-surface text-ink hover:bg-gray-soft shadow-xs"
          >
            <Laptop className="h-3.5 w-3.5 text-primary" />
            <span>Perangkat & Sesi</span>
          </Link>
        </div>

        {/* TAB CONTENT */}
        <PreferencesView initialPreferences={preferences} />
      </div>
    </div>
  );
}
