import React from 'react';
import { SystemIntegrationsHubView } from '@/modules/admin/system-integrations-hub-view';

export const metadata = {
  title: 'Integrasi Layanan & Gateway Eksternal - RuangKampus',
  description: 'Pengaturan Zoom, Google Maps, Sandbox Judge0, Email/WA Gateway, SSO, dan API Keys',
};

export default function SystemIntegrationsPage() {
  return <SystemIntegrationsHubView />;
}
