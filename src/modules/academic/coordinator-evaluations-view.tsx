'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Download,
  Bell,
  CheckCircle2,
  Users,
  Star,
  FileSpreadsheet,
} from 'lucide-react';
import {
  CoordinatorEdomRecapItem,
  EvaluationPeriod,
  getCoordinatorEvaluationReportAction,
  toggleEvaluationPeriodStatusAction,
  sendEvaluationRemindersAction,
  exportCoordinatorEvaluationCsvAction,
} from './evaluation-actions';

export function CoordinatorEvaluationsView() {
  const [period, setPeriod] = useState<EvaluationPeriod | null>(null);
  const [recap, setRecap] = useState<CoordinatorEdomRecapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getCoordinatorEvaluationReportAction();
    setIsLoading(false);
    if (res.ok) {
      if (res.period) setPeriod(res.period);
      if (res.lecturerRecap) setRecap(res.lecturerRecap);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async () => {
    if (!period) return;
    const nextStatus = period.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    setIsTogglingStatus(true);
    const res = await toggleEvaluationPeriodStatusAction(period.id, nextStatus);
    setIsTogglingStatus(false);
    if (res.ok) {
      setPeriod({ ...period, status: nextStatus });
    } else {
      alert(res.error || 'Gagal mengubah status periode.');
    }
  };

  const handleSendReminders = async () => {
    setIsSendingReminders(true);
    const res = await sendEvaluationRemindersAction();
    setIsSendingReminders(false);
    if (res.ok) {
      setReminderMessage(res.message || 'Pengingat berhasil dikirim.');
      setTimeout(() => setReminderMessage(null), 3000);
    } else {
      alert(res.error || 'Gagal mengirim pengingat.');
    }
  };

  const handleExportCsv = async () => {
    const res = await exportCoordinatorEvaluationCsvAction();
    if (res.ok && res.csvContent) {
      const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.filename || 'Rekap_EDOM.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(res.error || 'Gagal mengekspor CSV.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground rounded-[12px] border border-border bg-surface">
        Memuat rekapitulasi evaluasi mutu perkuliahan...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kartu Status Periode Aktif */}
      <div className="p-5 rounded-[12px] border border-border bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">
              {period?.title || 'Periode Evaluasi Semester'}
            </h2>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                period?.status === 'OPEN'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {period?.status === 'OPEN' ? 'Terbuka (Aktif)' : 'Ditutup'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Semester: {period?.semester || 'Semester Aktif'} · Pertanyaan Kuesioner: {period?.questions?.length || 5} butir
          </p>
        </div>

        <div className="flex items-center gap-2">
          {period && (
            <button
              type="button"
              disabled={isTogglingStatus}
              onClick={handleToggleStatus}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold border ${
                period.status === 'OPEN'
                  ? 'border-rose-500/40 text-rose-600 hover:bg-rose-50'
                  : 'border-emerald-500/40 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              {period.status === 'OPEN' ? 'Tutup Periode' : 'Buka Periode'}
            </button>
          )}

          <button
            type="button"
            disabled={isSendingReminders}
            onClick={handleSendReminders}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-border bg-surface text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Kirim Pengingat</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {reminderMessage && (
        <div className="p-3 rounded-[8px] bg-emerald-500/10 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{reminderMessage}</span>
        </div>
      )}

      {/* Tabel Rekapitulasi per Dosen & Mata Kuliah */}
      <div className="rounded-[12px] border border-border bg-surface overflow-hidden space-y-4">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            Rekapitulasi Mutu per Dosen Pengampu & Mata Kuliah
          </h3>
          <span className="text-xs text-muted-foreground">{recap.length} baris kelas</span>
        </div>

        {recap.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Belum ada rekapitulasi evaluasi dosen untuk periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border font-medium text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Nama Dosen</th>
                  <th className="px-4 py-3">Mata Kuliah</th>
                  <th className="px-4 py-3 text-center">Responden</th>
                  <th className="px-4 py-3 text-center">Pedagogik</th>
                  <th className="px-4 py-3 text-center">Profesional</th>
                  <th className="px-4 py-3 text-center">Sosial</th>
                  <th className="px-4 py-3 text-center">Skor Total</th>
                  <th className="px-4 py-3 text-center">Kategori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recap.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{row.lecturerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.subjectTitle}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{row.respondentsCount}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{row.pedagogyScore}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{row.professionalScore}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{row.socialScore}</td>
                    <td className="px-4 py-3 text-center font-bold text-foreground tabular-nums">
                      {row.totalScore}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          row.category === 'Sangat Baik'
                            ? 'bg-emerald-100 text-emerald-700'
                            : row.category === 'Baik'
                            ? 'bg-blue-100 text-blue-700'
                            : row.category === 'Cukup'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {row.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
