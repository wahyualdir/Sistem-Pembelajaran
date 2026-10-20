'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Save,
  CheckCheck,
  Send,
  X,
  BookOpen,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  type JournalItem,
  listClassJournalsAction,
  saveJournalDraftAction,
  finalizeJournalAction,
  updateFinalizedJournalAction,
  exportClassJournalsExcelAction,
} from './journal-actions';

interface LecturerJournalsViewProps {
  initialClasses: Array<{ id: string; title: string; section: string }>;
}

export function LecturerJournalsView({ initialClasses }: LecturerJournalsViewProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClasses[0]?.id || ''
  );
  const [journals, setJournals] = useState<JournalItem[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<JournalItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [formTopic, setFormTopic] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formMethod, setFormMethod] = useState('');
  const [formObstacles, setFormObstacles] = useState('');
  const [formMode, setFormMode] = useState<'luring' | 'daring' | 'hibrida'>('luring');
  const [formDate, setFormDate] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedClassId) return;
    let active = true;
    listClassJournalsAction(selectedClassId).then((res) => {
      if (active) {
        setJournals(res);
      }
    });
    return () => {
      active = false;
    };
  }, [selectedClassId]);

  const openEditor = (j: JournalItem) => {
    setSelectedJournal(j);
    setFormTopic(j.topic || '');
    setFormSummary(j.summary || '');
    setFormMethod(j.method || '');
    setFormObstacles(j.obstacles || '');
    setFormMode(j.mode || 'luring');
    setFormDate(j.heldOn || '');
    setMessageError(null);
    setMessageSuccess(null);
    setIsEditorOpen(true);
  };

  const handleFillFromMaterial = () => {
    if (!selectedJournal) return;
    setFormTopic(`Pembahasan Capaian Pembelajaran Modul ${selectedJournal.sessionNumber}`);
    setFormSummary(`Pemaparan konsep utama, studi kasus terapan, dan tanya jawab interaktif mahasiswa pertemuan ${selectedJournal.sessionNumber}.`);
    setFormMethod('Ceramah interaktif, diskusi kelompok, dan demonstrasi praktikum.');
  };

  const handleSaveDraft = () => {
    if (!selectedJournal) return;
    setMessageError(null);
    setMessageSuccess(null);

    startTransition(async () => {
      const res = await saveJournalDraftAction({
        classId: selectedClassId,
        sessionId: selectedJournal.sessionId,
        sessionNumber: selectedJournal.sessionNumber,
        heldOn: formDate || selectedJournal.heldOn,
        mode: formMode,
        topic: formTopic,
        summary: formSummary,
        method: formMethod,
        obstacles: formObstacles,
      });

      if (res.ok && res.data) {
        setMessageSuccess('Draf berita acara berhasil disimpan.');
        setJournals((prev) =>
          prev.map((j) => (j.id === res.data!.id ? res.data! : j))
        );
        setSelectedJournal(res.data);
      } else {
        setMessageError(res.error || 'Gagal menyimpan draf berita acara.');
      }
    });
  };

  const handleFinalize = () => {
    if (!selectedJournal) return;
    setMessageError(null);
    setMessageSuccess(null);

    startTransition(async () => {
      if (selectedJournal.status === 'draf') {
        await saveJournalDraftAction({
          classId: selectedClassId,
          sessionId: selectedJournal.sessionId,
          sessionNumber: selectedJournal.sessionNumber,
          heldOn: formDate || selectedJournal.heldOn,
          mode: formMode,
          topic: formTopic,
          summary: formSummary,
          method: formMethod,
          obstacles: formObstacles,
        });
      }

      const res = await finalizeJournalAction(selectedJournal.id);
      if (res.ok && res.data) {
        setMessageSuccess(
          res.data.isLate
            ? 'Berita acara difinalkan dengan catatan terlambat.'
            : 'Berita acara berhasil difinalkan.'
        );
        setJournals((prev) =>
          prev.map((j) => (j.id === res.data!.id ? res.data! : j))
        );
        setSelectedJournal(res.data);
      } else {
        setMessageError(res.error || 'Gagal memfinalkan berita acara.');
      }
    });
  };

  const handleUpdateFinalized = () => {
    if (!selectedJournal) return;
    setMessageError(null);
    setMessageSuccess(null);

    startTransition(async () => {
      const res = await updateFinalizedJournalAction(selectedJournal.id, {
        topic: formTopic,
        summary: formSummary,
        method: formMethod,
        obstacles: formObstacles,
      });

      if (res.ok && res.data) {
        setMessageSuccess(`Perubahan berita acara final disimpan (revisi ke-${res.data.revisionCount}).`);
        setJournals((prev) =>
          prev.map((j) => (j.id === res.data!.id ? res.data! : j))
        );
        setSelectedJournal(res.data);
      } else {
        setMessageError(res.error || 'Gagal memperbarui berita acara.');
      }
    });
  };

  const handleExportExcel = async () => {
    if (!selectedClassId) return;
    setMessageError(null);
    startTransition(async () => {
      const res = await exportClassJournalsExcelAction(selectedClassId);
      if (res.ok && res.base64 && res.filename) {
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.base64}`;
        link.download = res.filename;
        link.click();
      } else {
        setMessageError(res.error || 'Gagal mengekspor berkas Excel.');
      }
    });
  };

  // Statistik ringkas
  const finalCount = journals.filter((j) => j.status === 'final').length;
  const lateCount = journals.filter((j) => j.isLate).length;
  const compliancePercent = journals.length > 0 ? Math.round((finalCount / journals.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. KONTROL ATAS: PEMILIHAN KELAS & TOMBOL EKSPOR RETRO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-2 border-black bg-white shadow-retro rounded-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="select-class-journal" className="text-xs font-heading font-black text-black uppercase tracking-wider whitespace-nowrap">
            Mata Kuliah:
          </label>
          <div className="relative inline-block">
            <select
              id="select-class-journal"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="border-2 border-black bg-gray-soft text-black text-xs font-bold px-3 py-2 pr-8 rounded-lg shadow-retro-sm focus:outline-none focus:ring-2 focus:ring-black cursor-pointer appearance-none"
            >
              {initialClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} (Kelas {c.section})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-black absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={isPending || journals.length === 0}
          className="px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-bold text-xs shadow-retro active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 rounded-lg cursor-pointer disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4 text-black group-hover:text-white" />
          <span>Ekspor Excel (.xlsx)</span>
        </button>
      </div>

      {/* 2. KARTU RINGKASAN METRIK KEPATUHAN (4 KARTU RETRO BERBINGKAI TEGAS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Pertemuan */}
        <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col justify-between">
          <span className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider block">
            Total Pertemuan
          </span>
          <span className="text-2xl sm:text-3xl font-mono font-black text-black mt-1">
            {journals.length} <span className="text-xs font-sans font-bold text-black/60">Sesi</span>
          </span>
          <span className="text-[11px] font-bold text-black/60 mt-2">Target Semester</span>
        </div>

        {/* Sudah Difinalkan */}
        <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col justify-between">
          <span className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider block">
            Sudah Difinalkan
          </span>
          <span className="text-2xl sm:text-3xl font-mono font-black text-black mt-1">
            {finalCount} <span className="text-xs font-sans font-bold text-black/60">Sesi</span>
          </span>
          <span className="text-[11px] font-bold text-black/60 mt-2">Tersimpan Final</span>
        </div>

        {/* Terlambat Final */}
        <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col justify-between">
          <span className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider block">
            Terlambat Final
          </span>
          <span className="text-2xl sm:text-3xl font-mono font-black text-black mt-1">
            {lateCount} <span className="text-xs font-sans font-bold text-black/60">Sesi</span>
          </span>
          <span className="text-[11px] font-bold text-black/60 mt-2">Lewat Batas Waktu</span>
        </div>

        {/* Tingkat Kepatuhan */}
        <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col justify-between">
          <span className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider block">
            Tingkat Kepatuhan
          </span>
          <span className="text-2xl sm:text-3xl font-mono font-black text-black mt-1">
            {compliancePercent}%
          </span>
          <span className="text-[11px] font-bold text-black/60 mt-2">Kinerja Administrasi</span>
        </div>
      </div>

      {/* 3. DAFTAR BERITA ACARA PERTEMUAN 1-16 (RETRO WINDOW CARD LIST) */}
      <div className="border-2 border-black bg-white shadow-retro-md rounded-xl overflow-hidden">
        {/* Header Jendela Retro */}
        <div className="px-5 py-3 border-b-2 border-black bg-gray-soft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-black bg-black inline-block" />
            <span className="h-3 w-3 rounded-full border border-black bg-white inline-block" />
            <span className="font-mono text-xs font-black text-black ml-1.5">
              daftar_berita_acara_pertemuan_1-16.log
            </span>
          </div>
          <span className="text-xs font-bold font-mono text-black">
            {journals.length} Sesi Terdaftar
          </span>
        </div>

        {journals.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-black/60">
            Belum ada data pertemuan untuk kelas ini.
          </div>
        ) : (
          <div className="divide-y-2 divide-black/10">
            {journals.map((j) => {
              const isFinal = j.status === 'final';
              return (
                <div
                  key={j.id}
                  onClick={() => openEditor(j)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-soft/40 transition-colors cursor-pointer group"
                >
                  {/* Info Pertemuan */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 border border-black bg-black text-white text-xs font-mono font-black rounded shadow-retro-sm">
                        Pertemuan {j.sessionNumber}
                      </span>
                      <span className="text-xs text-black/80 font-mono font-bold">
                        {j.heldOn}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded border border-black bg-gray-soft text-black font-black uppercase">
                        {j.mode}
                      </span>
                    </div>

                    <h4 className="font-heading font-black text-sm sm:text-base text-black group-hover:underline underline-offset-4">
                      {j.topic || 'Belum ada topik materi'}
                    </h4>

                    {j.summary && (
                      <p className="text-xs text-black/75 line-clamp-1 font-medium">
                        {j.summary}
                      </p>
                    )}
                  </div>

                  {/* Ringkasan Kehadiran & Status Chip */}
                  <div className="flex items-center gap-3 shrink-0">
                    {j.attendanceCounts && (
                      <span className="px-2.5 py-1 rounded border border-black bg-white text-black font-mono font-bold text-xs shadow-retro-sm">
                        {j.attendanceCounts.hadir}/{j.attendanceCounts.total} Hadir
                      </span>
                    )}

                    {isFinal ? (
                      j.isLate ? (
                        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded border-2 border-black bg-gray-soft text-black font-black shadow-retro-sm">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Final (Terlambat)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded border-2 border-black bg-gray-soft text-black font-black shadow-retro-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Final</span>
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded border border-black/40 bg-white text-black/75 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Draf</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODAL EDITOR BERITA ACARA (JENDELA RETRO RESMI) */}
      {isEditorOpen && selectedJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl border-2 border-black bg-white shadow-retro-window rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-black bg-gray-soft shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-black bg-black" />
                <span className="h-3 w-3 rounded-full border border-black bg-white" />
                <span className="font-mono text-xs font-black text-black ml-1.5">
                  berita-acara-p{selectedJournal.sessionNumber}.doc
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded hover:bg-black hover:text-white transition-colors cursor-pointer"
                aria-label="Tutup jendela"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 font-sans">
              <div className="border-b-2 border-black/10 pb-3">
                <h3 className="font-heading font-black text-lg text-black">
                  Berita Acara Pertemuan {selectedJournal.sessionNumber}
                </h3>
                <p className="text-xs text-black/75 font-mono mt-0.5">
                  Tanggal: {selectedJournal.heldOn} &bull; Status:{' '}
                  <strong className="text-black uppercase">{selectedJournal.status}</strong>
                  {selectedJournal.revisionCount > 0 && ` (Revisi ke-${selectedJournal.revisionCount})`}
                </p>
              </div>

              {messageSuccess && (
                <div className="p-3 border-2 border-black bg-gray-soft text-black text-xs font-bold rounded shadow-retro-sm">
                  ✓ {messageSuccess}
                </div>
              )}
              {messageError && (
                <div className="p-3 border-2 border-black bg-white text-black text-xs font-black rounded shadow-retro-sm">
                  ⚠️ {messageError}
                </div>
              )}

              <div className="space-y-4 pt-1">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleFillFromMaterial}
                    className="px-3 py-1.5 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-bold text-xs shadow-retro-sm rounded transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Isi Otomatis dari Materi</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-heading font-black text-black block mb-1">
                      Moda Perkuliahan
                    </label>
                    <select
                      value={formMode}
                      onChange={(e) => setFormMode(e.target.value as any)}
                      className="w-full border-2 border-black bg-white text-black text-xs font-bold p-2.5 rounded shadow-retro-sm focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="luring">Luring (Tatap Muka di Kelas)</option>
                      <option value="daring">Daring (Kuliah Virtual)</option>
                      <option value="hibrida">Hibrida (Tatap Muka & Virtual)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-heading font-black text-black block mb-1">
                      Tanggal Terlaksana
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full border-2 border-black bg-white text-black text-xs font-mono font-bold p-2.5 rounded shadow-retro-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-heading font-black text-black block mb-1">
                    Materi / Topik Perkuliahan *
                  </label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="Contoh: Normalisasi Basis Data Bentuk 1NF, 2NF, 3NF"
                    className="w-full border-2 border-black bg-white text-black text-xs font-medium p-2.5 rounded shadow-retro-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-heading font-black text-black block mb-1">
                    Ringkasan Pelaksanaan Perkuliahan
                  </label>
                  <textarea
                    rows={3}
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder="Ringkasan poin-poin materi yang disampaikan kepada mahasiswa..."
                    className="w-full border-2 border-black bg-white text-black text-xs font-medium p-2.5 rounded shadow-retro-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-heading font-black text-black block mb-1">
                    Metode Pembelajaran
                  </label>
                  <input
                    type="text"
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    placeholder="Contoh: Ceramah, diskusi kelompok, tanya jawab"
                    className="w-full border-2 border-black bg-white text-black text-xs font-medium p-2.5 rounded shadow-retro-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-heading font-black text-black block mb-1">
                    Kendala Perkuliahan (Bila Ada)
                  </label>
                  <input
                    type="text"
                    value={formObstacles}
                    onChange={(e) => setFormObstacles(e.target.value)}
                    placeholder="Contoh: Proyektor ruang kelas sempat mati 10 menit"
                    className="w-full border-2 border-black bg-white text-black text-xs font-medium p-2.5 rounded shadow-retro-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-t-2 border-black/10 pt-4 gap-3">
                <span className="text-[11px] font-bold text-black/60">
                  Batas pengisian tepat waktu: 3 hari setelah tanggal pertemuan.
                </span>

                <div className="flex items-center gap-2">
                  {selectedJournal.status === 'draf' ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isPending}
                        className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-soft text-black font-bold text-xs shadow-retro rounded transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Draf</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleFinalize}
                        disabled={isPending}
                        className="px-5 py-2 border-2 border-black bg-black text-white hover:bg-neutral-800 font-black text-xs shadow-retro rounded transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Finalisasi</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleUpdateFinalized}
                      disabled={isPending}
                      className="px-5 py-2 border-2 border-black bg-black text-white hover:bg-neutral-800 font-black text-xs shadow-retro rounded transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan (Revisi)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
