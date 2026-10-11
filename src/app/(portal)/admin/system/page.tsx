import React from 'react';
import { SystemDashboardHubView } from '@/modules/admin/system-dashboard-hub-view';

export const metadata = {
  title: 'Pusat Kendali Administrator Sistem - SIAJAR LMS',
  description: 'Monitoring infrastruktur, basis data, keamanan, dan integrasi SIAJAR',
};

import { assertServerRole } from '@/lib/auth/server-guards';

export default async function SystemAdminDashboardPage() {
  await assertServerRole(['SYSTEM_ADMIN', 'SUPER_ADMIN', 'SUPERADMIN']);
  return <SystemDashboardHubView />;
}
