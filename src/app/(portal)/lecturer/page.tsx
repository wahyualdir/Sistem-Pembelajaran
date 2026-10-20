import React from 'react';
import { listPendingReviewsAction } from '@/modules/academic/actions';
import {
  getHomeTodayScheduleAction,
  getHomeActiveClassesAction,
  getHomeAgendaAction,
} from '@/modules/academic/home-actions';
import { LecturerDashboardClient } from './lecturer-dashboard-client';

export default async function LecturerPortalPage() {
  const [reviewsData, todaySchedule, activeClasses, agendaItems] = await Promise.all([
    listPendingReviewsAction(),
    getHomeTodayScheduleAction(),
    getHomeActiveClassesAction(),
    getHomeAgendaAction(),
  ]);

  return (
    <LecturerDashboardClient
      classes={reviewsData.classes}
      items={reviewsData.items}
      todaySchedule={todaySchedule}
      activeClasses={activeClasses}
      agendaItems={agendaItems}
    />
  );
}
