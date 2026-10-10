import React from 'react';
import { notFound } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { getClassDetailAction } from '@/modules/academic/actions';
import { listClassQuizzesAction } from '@/modules/academic/quiz-actions';
import { listAttendanceSessionsAction, getClassAttendanceSummaryAction } from '@/modules/academic/attendance-actions';
import { ClassHubTabs } from '@/modules/academic/class-hub-tabs';

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
  const ctx = await getCurrentUserWithRoles();
  const detail = await getClassDetailAction(params.id);
  if (!detail) notFound();

  const quizzes = await listClassQuizzesAction(params.id).catch(() => []);
  const attendanceSessions = await listAttendanceSessionsAction(params.id).catch(() => []);
  const summaries = await getClassAttendanceSummaryAction(params.id, detail.members || []).catch(() => []);
  const mySummary = ctx ? summaries.find((s) => s.student_id === ctx.user.id) ?? null : null;

  return (
    <div className="w-full">
      <ClassHubTabs
        data={{
          ...detail,
          quizzes,
          attendanceSessions,
          attendanceSummary: mySummary,
        }}
      />
    </div>
  );
}
