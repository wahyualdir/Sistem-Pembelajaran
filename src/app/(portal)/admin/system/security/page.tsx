import React from 'react';
import { SystemSecurityHubView } from '@/modules/admin/system-security-hub-view';

export const metadata = {
  title: 'Pusat Keamanan & Manajemen Sesi - SIAJAR LMS',
  description: 'Audit sesi aktif, deteksi login mencurigakan, dan konfigurasi rate limiting',
};

export default function SystemSecurityPage() {
  return <SystemSecurityHubView />;
}
