import React from 'react';
import { SuperadminAnnouncementsHubView } from '@/modules/admin/superadmin-announcements-hub-view';

export const metadata = {
  title: 'Pengumuman Global Universitas - RuangKampus',
  description: 'Maklumat resmi dan surat edaran universitas',
};

import { assertServerRole } from '@/lib/auth/server-guards';

export default async function SuperadminAnnouncementsPage() {
  await assertServerRole(['SUPER_ADMIN', 'SUPERADMIN']);
  return <SuperadminAnnouncementsHubView />;
}
