import React from 'react';
import { notFound } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getClassDetailAction } from '@/modules/academic/actions';
import { listClassQuizzesAction } from '@/modules/academic/quiz-actions';
import { listAttendanceSessionsAction, getClassAttendanceSummaryAction } from '@/modules/academic/attendance-actions';
import { getClassRiskSummaryAction } from '@/modules/early-warning/actions';
import { listClassForumTopicsAction } from '@/modules/academic/forum-actions';
import {
  getClassFeatureFlagsAction,
  getClassMapAction,
  listClassChaptersAction,
  getClassChapterDistributionAction,
  getHardestTopicsAction,
  getLaggingStudentsAction,
} from '@/modules/academic/peta-pulau-actions';
import { ClassHubTabs } from '@/modules/academic/class-hub-tabs';

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
  const ctx = await getCurrentUserWithRoles();
  const detail = await getClassDetailAction(params.id);
  if (!detail) notFound();

  const [
    quizzes,
    attendanceSessions,
    summaries,
    riskEvaluations,
    forumData,
    flags,
    mapItems,
    chapters,
    distribution,
    hardestTopics,
    laggingStudents,
  ] = await Promise.all([
    listClassQuizzesAction(params.id).catch(() => []),
    listAttendanceSessionsAction(params.id).catch(() => []),
    getClassAttendanceSummaryAction(params.id, detail.members || []).catch(() => []),
    getClassRiskSummaryAction(params.id).catch(() => []),
    listClassForumTopicsAction(params.id).catch(() => ({ ok: false, topics: [], tags: [] })),
    getClassFeatureFlagsAction(params.id).catch(() => ({})),
    getClassMapAction(params.id).catch(() => []),
    listClassChaptersAction(params.id).catch(() => []),
    getClassChapterDistributionAction(params.id).catch(() => []),
    getHardestTopicsAction(params.id).catch(() => []),
    getLaggingStudentsAction(params.id).catch(() => []),
  ]);

  const mySummary = ctx ? summaries.find((s) => s.student_id === ctx.user.id) ?? null : null;

  return (
    <div className="w-full">
      <ClassHubTabs
        data={{
          ...detail,
          currentUserId: ctx?.user.id,
          quizzes,
          attendanceSessions,
          attendanceSummary: mySummary,
          riskEvaluations,
          forumTopics: forumData.topics || [],
          forumTags: forumData.tags || [],
          petaPulauData: {
            flags,
            mapItems,
            chapters,
            distribution,
            hardestTopics,
            laggingStudents,
          },
        }}
      />
    </div>
  );
}
