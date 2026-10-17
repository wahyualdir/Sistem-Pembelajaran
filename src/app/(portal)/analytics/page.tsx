import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listMyClassesAction } from '@/modules/academic/actions';
import { listExamDisputesAction } from '@/modules/academic/quiz-actions';
import { getExamItemAnalysisAction, getCoordinatorCplRecapAction } from '@/modules/academic/item-analysis-actions';
import { isDemoMode } from '@/lib/config/features';
import { LecturerAnalyticsHubView } from '@/modules/academic/lecturer-analytics-hub-view';

export default async function AnalyticsRootPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role === 'STUDENT') {
    redirect('/grades');
  }
  if (role === 'TEACHING_ASSISTANT') {
    redirect('/ta');
  }
  if (role === 'ACADEMIC_STAFF') {
    redirect('/staff');
  }

  const isCoordinator = role === 'PROGRAM_COORDINATOR';
  const classes = await listMyClassesAction().catch(() => []);
  const disputes = await listExamDisputesAction().catch(() => []);
  const isDemo = isDemoMode();

  const itemAnalysisRes = await getExamItemAnalysisAction().catch(() => ({ ok: false, data: undefined }));
  const coordinatorCplRes = isCoordinator
    ? await getCoordinatorCplRecapAction().catch(() => ({
        ok: false,
        cplList: [],
        qualityIndex: { totalQuestions: 0, acceptablePercentage: 0, needsReviewCount: 0 },
      }))
    : undefined;

  return (
    <LecturerAnalyticsHubView
      classes={classes}
      disputes={disputes}
      isDemo={isDemo}
      itemAnalysisData={itemAnalysisRes.ok ? itemAnalysisRes.data : null}
      isCoordinator={isCoordinator}
      coordinatorCplData={coordinatorCplRes?.ok ? coordinatorCplRes : null}
    />
  );
}
