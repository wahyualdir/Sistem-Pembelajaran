import React from 'react';
import { SystemBackupHubView } from '@/modules/admin/system-backup-hub-view';

export const metadata = {
  title: 'Cadangan & Pemulihan Basis Data - SIAJAR LMS',
  description: 'Snapshot berkala basis data PostgreSQL dan pemulihan bencana',
};

export default function SystemBackupPage() {
  return <SystemBackupHubView />;
}
