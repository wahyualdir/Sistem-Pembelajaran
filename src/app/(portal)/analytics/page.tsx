import React from 'react';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listMyClassesAction } from '@/modules/academic/actions';
import { LecturerAnalyticsHubView } from '@/modules/academic/lecturer-analytics-hub-view';

export default async function AnalyticsRootPage() {
  const user = await getCurrentUserWithRoles();
  const classes = await listMyClassesAction().catch(() => []);

  return <LecturerAnalyticsHubView classes={classes} />;
}
