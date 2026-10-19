'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { ShieldAlert } from 'lucide-react';
import {
  getExamLiveStatusAction,
  lecturerInterventionAction,
  type ExamStudentLiveStatus,
  type ExamEvent,
} from '../quiz-actions';

// ==========================================
// PANEL LIVE MONITORING (DOSEN)
// ==========================================
export function ExamLiveMonitorPanel({
  examId,
}: {
  examId: string;
  examTitle?: string;
  durationMinutes?: number;
}) {
  const [data, setData] = useState<{
    students: ExamStudentLiveStatus[];
    events: ExamEvent[];
    stats: { total: number; in_progress: number; submitted: number; terminated: number; total_violations: number };
  } | null>(null);
  const [, startTransition] = useTransition();

  const fetchLive = useCallback(async () => {
    const res = await getExamLiveStatusAction(examId);
    setData(res);
  }, [examId]);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 5000); // 5s polling for live proctoring
    return () => clearInterval(interval);
  }, [fetchLive]);

  const handleAction = (
    studentId: string,
    action: 'WARN' | 'ADD_TIME' | 'PAUSE' | 'RESUME' | 'TERMINATE' | 'RESET',
    val?: string | number
  ) => {
    startTransition(async () => {
      await lecturerInterventionAction({
        exam_id: examId,
        student_id: studentId,
        action_type: action,
        value: val,
      });
      fetchLive();
    });
  };

  if (!data) {
    return <div className="text-xs text-muted-foreground py-4">Memuat data live monitoring ujian...</div>;
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-control border border-border bg-surface text-center">
          <span className="text-xs text-muted-foreground block">Total Peserta</span>
          <span className="text-xl font-bold font-sans">{data.stats.total}</span>
        </div>
        <div className="p-3 rounded-control border border-border bg-surface text-center">
          <span className="text-xs text-muted-foreground block">Mengerjakan</span>
          <span className="text-xl font-bold font-sans text-primary">{data.stats.in_progress}</span>
        </div>
        <div className="p-3 rounded-control border border-border bg-surface text-center">
          <span className="text-xs text-muted-foreground block">Selesai</span>
          <span className="text-xl font-bold font-sans text-ink">{data.stats.submitted}</span>
        </div>
        <div className="p-3 rounded-control border border-border bg-surface text-center">
          <span className="text-xs text-muted-foreground block">Dihentikan</span>
          <span className="text-xl font-bold font-sans text-primary-dark">{data.stats.terminated}</span>
        </div>
        <div className="p-3 rounded-control border border-border bg-surface text-center">
          <span className="text-xs text-muted-foreground block">Total Pelanggaran</span>
          <span className="text-xl font-bold font-sans text-primary-dark">{data.stats.total_violations}</span>
        </div>
      </div>

      {/* Student Live Grid */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
          Grid Status Peserta Realtime
        </h4>

        {data.students.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground rounded-control border border-border bg-background">
            Belum ada mahasiswa yang masuk ke sesi pengerjaan ujian ini.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.students.map((st) => (
              <div
                key={st.student_id}
                className={`p-4 rounded-control border bg-surface space-y-2.5 transition-all ${
                  st.violations_count > 0 ? 'border-ink/60' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs block text-foreground">{st.student_name}</span>
                    <span className="text-xs font-sans text-muted-foreground">{st.student_id}</span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase font-sans ${
                      st.status === 'IN_PROGRESS'
                        ? 'text-primary bg-primary-soft'
                        : st.status === 'SUBMITTED'
                        ? 'text-ink bg-surface'
                        : 'text-primary-dark bg-surface'
                    }`}
                  >
                    {st.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Pelanggaran: <strong className={st.violations_count > 0 ? 'text-primary-dark font-sans' : ''}>{st.violations_count}x</strong></span>
                  {st.extra_minutes && <span>+{st.extra_minutes}m ekstra</span>}
                </div>

                {st.last_event && (
                  <p className="text-xs text-primary-dark bg-surface/60 px-2 py-1 rounded truncate">
                    {st.last_event.event_type}: {st.last_event.details}
                  </p>
                )}

                {/* Intervention Controls */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-border">
                  <button
                    type="button"
                    onClick={() => handleAction(st.student_id, 'ADD_TIME', 10)}
                    className="rounded-control border border-border px-2 py-0.5 text-xs hover:bg-muted font-medium"
                    title="Tambah 10 menit waktu"
                  >
                    +10m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(st.student_id, 'WARN', 'Perhatikan pandangan Anda dan jangan berpindah tab!')}
                    className="rounded-control border border-border px-2 py-0.5 text-xs hover:bg-muted font-medium text-ink"
                    title="Kirim Peringatan"
                  >
                    Peringatkan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(st.student_id, 'TERMINATE')}
                    className="rounded-control border border-border px-2 py-0.5 text-xs hover:bg-muted font-medium text-primary-dark"
                    title="Hentikan Ujian"
                  >
                    Hentikan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Events Feed Ticker */}
      <div className="p-4 rounded-control border border-border bg-background space-y-3">
        <h4 className="font-semibold text-xs flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-primary" /> Live Proctoring Feed & Ticker
        </h4>
        <div className="max-h-48 overflow-y-auto space-y-2 text-xs">
          {data.events.length === 0 ? (
            <p className="text-muted-foreground text-xs">Belum ada aktivitas proctoring tercatat.</p>
          ) : (
            data.events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between p-2 rounded border border-border/60 bg-surface">
                <div>
                  <span className="font-semibold text-foreground">{ev.student_name}</span>{' '}
                  <span className="text-primary-dark font-sans font-medium">[{ev.event_type}]</span>{' '}
                  <span className="text-muted-foreground">{ev.details}</span>
                </div>
                <span className="text-xs font-sans text-muted-foreground">
                  {new Date(ev.created_at).toLocaleTimeString('id-ID')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
