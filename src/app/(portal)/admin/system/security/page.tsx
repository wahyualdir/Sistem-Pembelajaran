import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';
import { SystemSecurityHubView } from '@/modules/admin/system-security-hub-view';

export const metadata = {
  title: 'Pusat Keamanan & Manajemen Sesi - RuangKampus',
  description: 'Audit sesi aktif, deteksi login mencurigakan, dan konfigurasi rate limiting',
};

export default async function SystemSecurityPage() {
  // A3c: Defense in depth di level halaman data sensitif
  await assertServerRole(['SYSTEM_ADMIN', 'SUPER_ADMIN', 'SUPERADMIN']);
  return <SystemSecurityHubView />;
}
