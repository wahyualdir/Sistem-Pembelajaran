import React from 'react';
import { listMyClassesAction } from '@/modules/academic/actions';
import { getUserChatHistoryAction } from '@/modules/academic/ai-material-rag';
import { AiAssistantPageView } from '@/modules/academic/ai-assistant-page-view';

export default async function AiAssistantPage() {
  const [classes, history] = await Promise.all([
    listMyClassesAction().catch(() => []),
    getUserChatHistoryAction().catch(() => []),
  ]);

  const enrolledClasses = classes.map((c) => ({
    id: c.id,
    title: `${c.title} (${c.section})`,
  }));

  return (
    <AiAssistantPageView
      enrolledClasses={enrolledClasses}
      initialHistory={history}
    />
  );
}
