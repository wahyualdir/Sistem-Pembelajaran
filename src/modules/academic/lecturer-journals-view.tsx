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
      // Simpan perubahan form terlebih dahulu jika ada
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
      {/* Baris Atas: Pemilihan Kelas & Tombol Ekspor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="select-class-journal" className="text-xs font-semibold text-foreground whitespace-nowrap">
            Mata Kuliah:
          </label>
          <select
            id="select-class-journal"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="field text-xs max-w-xs font-medium"
          >
            {initialClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} (Kelas {c.section})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={isPending || journals.length === 0}
          className="btn-outline !w-auto text-xs px-3.5 py-2 flex items-center gap-1.5"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Ekspor Excel (.xlsx)</span>
        </button>
      </div>

      {/* Kartu Ringkasan Kepatuhan Berita Acara */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-border bg-surface">
          <span className="text-[11px] text-muted-foreground block">Total Pertemuan</span>
          <span className="text-lg font-bold text-foreground font-mono">
            {journals.length} Pertemuan
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-surface">
          <span className="text-[11px] text-muted-foreground block">Sudah Difinalkan</span>
          <span className="text-lg font-bold text-emerald-600 font-mono">
            {finalCount} Pertemuan
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-surface">
          <span className="text-[11px] text-muted-foreground block">Terlambat Final</span>
          <span className="text-lg font-bold text-amber-600 font-mono">
            {lateCount} Pertemuan
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-surface">
          <span className="text-[11px] text-muted-foreground block">Tingkat Kepatuhan</span>
          <span className="text-lg font-bold text-primary font-mono">
            {compliancePercent}%
          </span>
        </div>
      </div>

      {/* Garis Waktu Pertemuan 1-16 */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">
          Daftar Berita Acara Pertemuan 1–16
        </h3>

        {journals.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-border bg-surface text-xs text-muted-foreground">
            Belum ada data pertemuan untuk kelas ini.
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
            {journals.map((j) => {
              const isFinal = j.status === 'final';
              return (
                <div
                  key={j.id}
                  onClick={() => openEditor(j)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        Pertemuan {j.sessionNumber}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {j.heldOn}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-muted text-foreground uppercase">
                        {j.mode}
                      </span>
                    </div>
                    <p className="text-xs text-foreground font-medium">
                      {j.topic || 'Belum ada topik materi'}
                    </p>
                    {j.summary && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {j.summary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Ringkasan Hadir */}
                    {j.attendanceCounts && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {j.attendanceCounts.hadir}/{j.attendanceCounts.total} Hadir
                      </span>
                    )}

                    {/* Status Chip */}
                    {isFinal ? (
                      j.isLate ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          Final (Terlambat)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Final
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold bg-muted text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Draf
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel Editor Samping / Modal Editor */}
      {isEditorOpen && selectedJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Berita Acara Pertemuan {selectedJournal.sessionNumber}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  Tanggal: {selectedJournal.heldOn} &bull; Status:{' '}
                  <strong className="text-foreground capitalize">{selectedJournal.status}</strong>
                  {selectedJournal.revisionCount > 0 && ` (Revisi ke-${selectedJournal.revisionCount})`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {messageSuccess && (
              <div className="p-3 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {messageSuccess}
              </div>
            )}
            {messageError && (
              <div className="p-3 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                {messageError}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleFillFromMaterial}
                  className="btn-outline !w-auto text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span>Isi dari Materi Pertemuan</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Moda Perkuliahan
                  </label>
                  <select
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value as any)}
                    className="field text-xs"
                  >
                    <option value="luring">Luring (Tatap Muka di Kelas)</option>
                    <option value="daring">Daring (Kuliah Virtual)</option>
                    <option value="hibrida">Hibrida (Tatap Muka & Virtual)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Tanggal Terlaksana
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="field text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Materi / Topik Perkuliahan *
                </label>
                <input
                  type="text"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="Contoh: Normalisasi Basis Data Bentuk 1NF, 2NF, 3NF"
                  className="field text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Ringkasan Pelaksanaan Perkuliahan
                </label>
                <textarea
                  rows={3}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Ringkasan poin-poin materi yang disampaikan kepada mahasiswa..."
                  className="field text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Metode Pembelajaran
                </label>
                <input
                  type="text"
                  value={formMethod}
                  onChange={(e) => setFormMethod(e.target.value)}
                  placeholder="Contoh: Ceramah, diskusi kelompok, tanya jawab"
                  className="field text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Kendala Perkuliahan (Bila Ada)
                </label>
                <input
                  type="text"
                  value={formObstacles}
                  onChange={(e) => setFormObstacles(e.target.value)}
                  placeholder="Contoh: Proyektor ruang kelas sempat mati 10 menit"
                  className="field text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-[11px] text-muted-foreground">
                Batas pengisian tepat waktu: 3 hari setelah tanggal pertemuan.
              </span>

              <div className="flex items-center gap-2">
                {selectedJournal.status === 'draf' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={isPending}
                      className="btn-outline !w-auto text-xs px-3.5 py-2 flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Draf</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalize}
                      disabled={isPending}
                      className="btn-solid !w-auto text-xs px-3.5 py-2 flex items-center gap-1.5"
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
                    className="btn-solid !w-auto text-xs px-3.5 py-2 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan (Revisi)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
