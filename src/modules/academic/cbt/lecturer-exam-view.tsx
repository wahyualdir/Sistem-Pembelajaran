'use client';

import React, { useState } from 'react';
import { Users, FileText } from 'lucide-react';
import type { QuizItem } from '../quiz-actions';
import { ExamLiveMonitorPanel } from './exam-live-monitor-panel';
import { TakeQuizForm } from './take-quiz-form';

// ==========================================
// LECTURER EXAM VIEW (PANEL DOSEN BER-TAB CLEAN)
// ==========================================
export function LecturerExamView({
  quiz,
  courseTitle,
}: {
  quiz: QuizItem;
  courseTitle: string;
}) {
  const [activeTab, setActiveTab] = useState<'monitor' | 'preview'>('preview');

  return (
    <div className="space-y-6 animate-fade-up font-sans">
      {/* Clean Retro Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2.5 border-b-2 border-black/15 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black text-xs sm:text-sm font-bold transition-all shadow-retro ${
            activeTab === 'monitor'
              ? 'bg-black text-white shadow-retro'
              : 'bg-white text-black hover:bg-gray-soft'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Panel Pengawas Live (Real-Time)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black text-xs sm:text-sm font-bold transition-all shadow-retro ${
            activeTab === 'preview'
              ? 'bg-black text-white shadow-retro'
              : 'bg-white text-black hover:bg-gray-soft'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Pratinjau Lembar Ujian Mahasiswa</span>
        </button>
      </div>

      {activeTab === 'monitor' ? (
        <ExamLiveMonitorPanel examId={quiz.id} />
      ) : (
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg border-2 border-black bg-gray-soft text-xs font-bold text-black flex items-center gap-2 shadow-retro">
            <span>ℹ️ Mode Pratinjau: Menampilkan simulasi lembar ujian yang akan dikerjakan oleh mahasiswa.</span>
          </div>
          <TakeQuizForm quiz={quiz} existingAttempt={null} courseTitle={courseTitle} hideHeaderWindow={true} />
        </div>
      )}
    </div>
  );
}
