import React from 'react';
import { listPendingReviewsAction } from '@/modules/academic/actions';
import {
  getHomeTodayScheduleAction,
  getHomeActiveClassesAction,
  getHomeAgendaAction,
} from '@/modules/academic/home-actions';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getAktivitasSayaAction } from '@/modules/academic/aktivitas-actions';
import { LecturerDashboardClient } from './lecturer-dashboard-client';

export default async function LecturerPortalPage() {
  const [reviewsData, todaySchedule, activeClasses, agendaItems, userContext, aktivitasRes] = await Promise.all([
    listPendingReviewsAction(),
    getHomeTodayScheduleAction(),
    getHomeActiveClassesAction(),
    getHomeAgendaAction(),
    getCurrentUserWithRoles(),
    getAktivitasSayaAction().catch(() => ({ aktivitas: [], daftarKelas: [] })),
  ]);

  const rawName = userContext?.profile?.full_name;
  const isGenericAdmin = rawName && (rawName.toLowerCase().includes('administrator') || rawName.toLowerCase().includes('admin'));
  const lecturerName = rawName && !isGenericAdmin ? rawName : 'Dr. Ardiansyah, S.T., M.Kom.';

  return (
    <LecturerDashboardClient
      classes={reviewsData.classes}
      items={reviewsData.items}
      todaySchedule={todaySchedule}
      activeClasses={activeClasses}
      agendaItems={agendaItems}
      lecturerName={lecturerName}
      aktivitas={aktivitasRes.aktivitas}
    />
  );
}
