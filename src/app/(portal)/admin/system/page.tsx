import React from 'react';
import { SystemDashboardHubView } from '@/modules/admin/system-dashboard-hub-view';

export const metadata = {
  title: 'Pusat Kendali Administrator Sistem - SIAJAR LMS',
  description: 'Monitoring infrastruktur, basis data, keamanan, dan integrasi SIAJAR',
};

export default function SystemAdminDashboardPage() {
  return <SystemDashboardHubView />;
}
