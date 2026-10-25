import React from 'react';
import { SystemMonitoringHubView } from '@/modules/admin/system-monitoring-hub-view';

export const metadata = {
  title: 'Monitoring Sistem & Infrastruktur - RuangKampus',
  description: 'Monitoring CPU, RAM, WebSocket, dan antrean sandbox kode',
};

export default function SystemMonitoringPage() {
  return <SystemMonitoringHubView />;
}
