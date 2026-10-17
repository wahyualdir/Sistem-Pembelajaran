import React from 'react';
import { notFound } from 'next/navigation';
import { getForumTopicDetailAction } from '@/modules/academic/forum-actions';
import { ForumThreadClientView } from '@/modules/academic/forum-thread-client-view';

export default async function DiscussionPage({ params }: { params: { id: string; did: string } }) {
  const res = await getForumTopicDetailAction(params.id, params.did);
  if (!res.ok || !res.topic || !res.viewer) {
    notFound();
  }

  return (
    <ForumThreadClientView
      topic={res.topic}
      initialReplies={res.replies}
      viewer={res.viewer}
    />
  );
}
