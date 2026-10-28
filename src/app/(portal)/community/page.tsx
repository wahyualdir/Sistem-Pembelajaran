import React from 'react';
import { CommunityHubView } from '@/modules/academic/community-hub-view';
import { getCommunityDataAction } from '@/modules/academic/community-actions';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

export default async function CommunityPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';
  const isLecturer = role === 'LECTURER' || role === 'SYSTEM_ADMIN' || role === 'SUPER_ADMIN';

  const data = await getCommunityDataAction();

  return (
    <CommunityHubView
      announcements={data.announcements}
      threads={data.threads}
      groups={data.groups}
      mentors={data.mentors}
      events={data.events}
      isLecturer={isLecturer}
    />
  );
}
