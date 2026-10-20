import React from 'react';
import { listPendingReviewsAction } from '@/modules/academic/actions';
import {
  getHomeTodayScheduleAction,
  getHomeActiveClassesAction,
  getHomeAgendaAction,
} from '@/modules/academic/home-actions';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { LecturerDashboardClient } from './lecturer-dashboard-client';

export default async function LecturerPortalPage() {
  const [reviewsData, todaySchedule, activeClasses, agendaItems, userContext] = await Promise.all([
    listPendingReviewsAction(),
    getHomeTodayScheduleAction(),
    getHomeActiveClassesAction(),
    getHomeAgendaAction(),
    getCurrentUserWithRoles(),
  ]);

  const lecturerName = userContext?.profile?.full_name || 'Dr. Ardiansyah, S.T., M.Kom.';

  return (
    <LecturerDashboardClient
      classes={reviewsData.classes}
      items={reviewsData.items}
      todaySchedule={todaySchedule}
      activeClasses={activeClasses}
      agendaItems={agendaItems}
      lecturerName={lecturerName}
    />
  );
}
