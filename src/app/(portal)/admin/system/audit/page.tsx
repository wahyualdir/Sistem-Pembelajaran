import React from 'react';
import { SystemAuditHubView } from '@/modules/admin/system-audit-hub-view';

export const metadata = {
  title: 'Log Audit Sistem (Read-Only) - SIAJAR LMS',
  description: 'Jejak audit append-only perubahan nilai, presensi, dan impersonasi',
};

export default function SystemAuditPage() {
  return <SystemAuditHubView />;
}
