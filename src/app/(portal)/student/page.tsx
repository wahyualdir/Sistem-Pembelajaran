import React from 'react';
import {
  getHomeBannerAction,
  getHomeDeadlinesAction,
  getHomeTodayScheduleAction,
  getHomeActiveClassesAction,
  getHomeSummaryAction,
  getHomeAgendaAction,
} from '@/modules/academic/home-actions';
import { StudentDashboardClient } from './student-dashboard-client';

export default async function StudentPortalPage() {
  // Muat data tiap section secara paralel & independen
  const [
    bannerRes,
    deadlinesRes,
    scheduleRes,
    classesRes,
    summaryRes,
    agendaRes,
  ] = await Promise.allSettled([
    getHomeBannerAction(),
    getHomeDeadlinesAction(),
    getHomeTodayScheduleAction(),
    getHomeActiveClassesAction(),
    getHomeSummaryAction(),
    getHomeAgendaAction(),
  ]);

  const bannerData = bannerRes.status === 'fulfilled' ? bannerRes.value : undefined;
  const deadlines = deadlinesRes.status === 'fulfilled' ? deadlinesRes.value : [];
  const todaySchedule = scheduleRes.status === 'fulfilled' ? scheduleRes.value : [];
  const activeClasses = classesRes.status === 'fulfilled' ? classesRes.value : [];
  const summaryData = summaryRes.status === 'fulfilled' ? summaryRes.value : undefined;
  const agendaItems = agendaRes.status === 'fulfilled' ? agendaRes.value : [];

  return (
    <StudentDashboardClient
      bannerData={bannerData}
      deadlines={deadlines}
      todaySchedule={todaySchedule}
      activeClasses={activeClasses}
      summaryData={summaryData}
      agendaItems={agendaItems}
    />
  );
}
