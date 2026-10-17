import React from 'react';
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

  return <PreferencesView initialPreferences={preferences} />;
}
