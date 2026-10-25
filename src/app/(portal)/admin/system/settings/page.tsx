import React from 'react';
import { SystemSettingsHubView } from '@/modules/admin/system-settings-hub-view';

export const metadata = {
  title: 'Pengaturan Platform & Branding - RuangKampus',
  description: 'Pengaturan identitas institusi, parameter mesin AI, dan batas penyimpanan file',
};

export default function SystemSettingsPage() {
  return <SystemSettingsHubView />;
}
