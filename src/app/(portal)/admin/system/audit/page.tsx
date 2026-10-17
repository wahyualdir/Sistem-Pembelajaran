import React from 'react';
import { assertServerRole } from '@/lib/auth/server-guards';
import { SystemAuditHubView } from '@/modules/admin/system-audit-hub-view';
import { getAuditLogsAction } from '@/modules/admin/audit-actions';

export const metadata = {
  title: 'Log Audit Sistem (Read-Only) - SIAJAR LMS',
  description: 'Jejak audit append-only perubahan nilai, presensi, dan impersonasi',
};

export default async function SystemAuditPage() {
  // A3c: Defense in depth di level halaman data sensitif
  await assertServerRole(['SYSTEM_ADMIN', 'SUPER_ADMIN', 'SUPERADMIN']);
  const logs = await getAuditLogsAction();
  return <SystemAuditHubView initialLogs={logs} />;
}
