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
      <div className="p-8 text-center text-xs font-bold text-[#111111] border-2 border-black bg-white shadow-retro-sm font-sans">
        Memuat rekapitulasi evaluasi mutu perkuliahan...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Kartu Status Periode Aktif */}
      <div className="p-5 border-2 border-black bg-white shadow-retro flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-heading font-black text-[#111111]">
              {period?.title || 'Periode Evaluasi Semester'}
            </h2>
            <span
              className={`text-xs px-3 py-1 rounded-full border-2 border-black font-bold shadow-retro-sm ${
                period?.status === 'OPEN'
                  ? 'bg-[#ED1C24] text-white'
                  : 'bg-gray-soft text-[#111111]'
              }`}
            >
              {period?.status === 'OPEN' ? 'Terbuka (Aktif)' : 'Ditutup'}
            </span>
          </div>
          <p className="text-xs text-[#111111] font-medium">
            Semester: {period?.semester || 'Semester Aktif'} &bull; Pertanyaan Kuesioner: {period?.questions?.length || 5} butir
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {period && (
            <button
              type="button"
              disabled={isTogglingStatus}
              onClick={handleToggleStatus}
              className="px-3.5 py-1.5 border-2 border-black bg-white text-[#111111] hover:bg-gray-soft text-xs font-bold shadow-retro-sm cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              {period.status === 'OPEN' ? 'Tutup Periode' : 'Buka Periode'}
            </button>
          )}

          <button
            type="button"
            disabled={isSendingReminders}
            onClick={handleSendReminders}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-black bg-white text-[#111111] hover:bg-gray-soft text-xs font-bold shadow-retro-sm cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            <Bell className="h-3.5 w-3.5 text-[#ED1C24]" />
            <span>Kirim Pengingat</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-black bg-[#ED1C24] text-white hover:bg-[#c9141b] text-xs font-bold shadow-retro-sm cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            <Download className="h-3.5 w-3.5 text-white" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {reminderMessage && (
        <div className="p-3.5 border-2 border-black bg-neutral-100 text-[#111111] text-xs font-bold flex items-center gap-2 shadow-retro-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#111111]" />
          <span>{reminderMessage}</span>
        </div>
      )}

      {/* Tabel Rekapitulasi per Dosen & Mata Kuliah */}
      <div className="border-2 border-black bg-white shadow-retro overflow-hidden">
        <div className="p-4 border-b-2 border-black bg-gray-soft flex items-center justify-between">
          <h3 className="text-sm font-heading font-black text-[#111111]">
            Rekapitulasi Mutu per Dosen Pengampu & Mata Kuliah
          </h3>
          <span className="text-xs font-bold text-[#111111]">{recap.length} baris kelas</span>
        </div>

        {recap.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#111111] font-semibold">
            Belum ada rekapitulasi evaluasi dosen untuk periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-gray-soft border-b-2 border-black font-bold uppercase text-[#111111]">
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
              <tbody className="divide-y-2 divide-black/10">
                {recap.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-gray-soft/30 transition-colors">
                    <td className="px-4 py-3 text-[#111111] font-bold">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-[#111111]">{row.lecturerName}</td>
                    <td className="px-4 py-3 text-[#111111] font-medium">{row.subjectTitle}</td>
                    <td className="px-4 py-3 text-center tabular-nums font-bold text-[#111111]">{row.respondentsCount}</td>
                    <td className="px-4 py-3 text-center tabular-nums font-bold text-[#111111]">{row.pedagogyScore}</td>
                    <td className="px-4 py-3 text-center tabular-nums font-bold text-[#111111]">{row.professionalScore}</td>
                    <td className="px-4 py-3 text-center tabular-nums font-bold text-[#111111]">{row.socialScore}</td>
                    <td className="px-4 py-3 text-center font-black text-[#111111] tabular-nums text-sm">
                      {row.totalScore}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 border-2 border-black bg-white text-[#111111] shadow-retro-sm">
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
