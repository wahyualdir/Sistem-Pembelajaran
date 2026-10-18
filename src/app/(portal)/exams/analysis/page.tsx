import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { createClient } from '@/lib/supabase/server';
import { ExamAnalysisView } from '@/modules/academic/exam-analysis-view';

export const dynamic = 'force-dynamic';

export default async function ExamAnalysisPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole || 'STUDENT';

  if (role !== 'LECTURER' && role !== 'TEACHING_ASSISTANT' && role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    redirect(role === 'STUDENT' ? '/student' : '/admin');
  }

  const supabase = await createClient();
  const { data: quizzesData } = await supabase
    .from('quizzes')
    .select('id, title, classes(title)')
    .order('created_at', { ascending: false });

  const quizzes = (quizzesData || []).map((q: any) => ({
    id: q.id,
    title: q.title,
    class_title: q.classes?.title || 'Kelas',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analisis Soal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analisis butir soal: tingkat kesukaran, daya pembeda, efektivitas pengecoh, dan reliabilitas ujian.
        </p>
      </div>

      <ExamAnalysisView quizzes={quizzes} />
    </div>
  );
}
