import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { createClient } from '@/lib/supabase/server';
import { ExamAnalysisView } from '@/modules/academic/exam-analysis-view';
import { BarChart3 } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';

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
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="analisis_butir_soal.exe"
        badge="Evaluasi Butir Soal & Pembeda"
        headerClassName="bg-gray-soft"
      >
        <div className="p-5 sm:p-7 space-y-2 bg-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-2.5">
                <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-black inline-block" />
                <span>Analisis Butir Soal</span>
              </h1>
              <p className="text-xs sm:text-sm text-black/75 font-medium max-w-3xl leading-relaxed">
                Evaluasi komprehensif tingkat kesukaran, daya pembeda (D), korelasi point-biserial, efektivitas pengecoh, dan reliabilitas KR-20.
              </p>
            </div>
          </div>
        </div>
      </RetroWindow>

      <ExamAnalysisView quizzes={quizzes} />
    </div>
  );
}
