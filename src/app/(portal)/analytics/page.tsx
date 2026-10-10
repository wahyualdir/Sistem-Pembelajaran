import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listMyClassesAction } from '@/modules/academic/actions';
import { listExamDisputesAction } from '@/modules/academic/quiz-actions';
import { isDemoMode } from '@/lib/config/features';
import { LecturerAnalyticsHubView } from '@/modules/academic/lecturer-analytics-hub-view';

export default async function AnalyticsRootPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'STUDENT') {
    redirect('/grades');
  }
  if (role === 'TEACHING_ASSISTANT') {
    redirect('/ta');
  }
  if (role === 'PROGRAM_COORDINATOR') {
    redirect('/coordinator/reports');
  }
  if (role === 'ACADEMIC_STAFF') {
    redirect('/staff');
  }

  const classes = await listMyClassesAction().catch(() => []);
  const disputes = await listExamDisputesAction().catch(() => []);
  const isDemo = isDemoMode();

  return (
    <LecturerAnalyticsHubView
      classes={classes}
      disputes={disputes}
      isDemo={isDemo}
    />
  );
}
