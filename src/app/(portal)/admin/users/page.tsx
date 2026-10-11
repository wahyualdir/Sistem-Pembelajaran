import React from 'react';
import { SuperadminUsersHubView } from '@/modules/admin/superadmin-users-hub-view';

export const metadata = {
  title: 'Kelola Pengguna & Impersonate - SIAJAR LMS',
  description: 'Manajemen akun civitas akademika dan sesi impersonasi teknis',
};

export default function SuperadminUsersPage() {
  return <SuperadminUsersHubView />;
}
