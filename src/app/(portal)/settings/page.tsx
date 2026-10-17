import React from 'react';
import Link from 'next/link';
import { Settings, Sliders, Bell, Shield, ArrowRight } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { getNotificationPreferencesAction } from '@/modules/notifications/actions';
import { PreferencesView } from '@/modules/notifications/preferences-view';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

export const metadata = {
  title: 'Pengaturan Akun dan Preferensi - SIAJAR LMS',
  description: 'Pengaturan preferensi notifikasi, saluran pengiriman, tampilan, dan keamanan akun',
};

export default async function SettingsPage() {
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
    <div className="space-y-6">
      {/* Tab Navigasi Pengaturan */}
      <div className="px-6 sm:px-9 pt-6">
        <div className="flex flex-wrap gap-2 border-b-2 border-black pb-3">
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black bg-ink text-white text-xs sm:text-sm font-heading font-bold shadow-retro-sm transition-all"
          >
            <Bell className="h-4 w-4 text-primary" />
            <span>Notifikasi dan Pengingat</span>
          </Link>

          <Link
            href="/settings/appearance"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black bg-surface text-ink hover:bg-gray-soft text-xs sm:text-sm font-heading font-bold shadow-retro-sm transition-all"
          >
            <Sliders className="h-4 w-4 text-primary" />
            <span>Tampilan dan Bahasa</span>
          </Link>

          <Link
            href="/devices"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black bg-surface text-ink hover:bg-gray-soft text-xs sm:text-sm font-heading font-bold shadow-retro-sm transition-all"
          >
            <Shield className="h-4 w-4 text-primary" />
            <span>Perangkat dan Keamanan</span>
          </Link>
        </div>
      </div>

      <PreferencesView initialPreferences={preferences} />
    </div>
  );
}
