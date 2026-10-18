import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { createClient } from '@/lib/supabase/server';
import { ExamProctorView } from '@/modules/academic/exam-proctor-view';

export const dynamic = 'force-dynamic';

export default async function AssistantExamMonitorPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'TEACHING_ASSISTANT' && role !== 'LECTURER' && role !== 'SUPER_ADMIN') {
    redirect(role === 'STUDENT' ? '/student' : '/admin');
  }

  const isLecturer = role === 'LECTURER' || role === 'SUPER_ADMIN';

  const supabase = await createClient();
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title, duration_minutes')
    .order('created_at', { ascending: false })
    .limit(1);

  const activeQuiz = quizzes && quizzes.length > 0 ? quizzes[0] : null;

  if (!activeQuiz) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pantau Ujian</h1>
        <div className="rounded-[12px] border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          Belum ada sesi ujian aktif yang dapat dipantau.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <ExamProctorView
        quizId={activeQuiz.id}
        quizTitle={activeQuiz.title}
        durationMinutes={activeQuiz.duration_minutes}
        isLecturer={isLecturer}
      />
    </div>
  );
}
