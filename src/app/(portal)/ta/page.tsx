import React from 'react';
import { listPendingReviewsAction } from '@/modules/academic/actions';
import {
  getHomeTodayScheduleAction,
  getHomeActiveClassesAction,
  getHomeAgendaAction,
} from '@/modules/academic/home-actions';
import { TaDashboardClient } from './ta-dashboard-client';

export default async function AssistantPortalPage() {
  const [reviewsData, todaySchedule, activeClasses, agendaItems] = await Promise.all([
    listPendingReviewsAction(),
    getHomeTodayScheduleAction(),
    getHomeActiveClassesAction(),
    getHomeAgendaAction(),
  ]);

  return (
    <TaDashboardClient
      classes={reviewsData.classes}
      items={reviewsData.items}
      todaySchedule={todaySchedule}
      activeClasses={activeClasses}
      agendaItems={agendaItems}
    />
  );
}
