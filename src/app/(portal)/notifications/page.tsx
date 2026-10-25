import React from 'react';
import { listNotificationsAction } from '@/modules/notifications/actions';
import { NotificationsView } from '@/modules/notifications/notifications-view';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

export const metadata = {
  title: 'Pusat Notifikasi & Pengingat Otomatis - RuangKampus',
  description: 'Pemberitahuan tenggat tugas, jadwal ujian, sesi presensi, dan pengumuman akademik civitas kampus',
};

export default async function NotificationsPage() {
  const userContext = await getCurrentUserWithRoles();
  const items = await listNotificationsAction('all');

  return (
    <NotificationsView
      initialItems={items}
      userRole={userContext?.activeRole}
    />
  );
}
