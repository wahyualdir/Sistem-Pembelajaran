'use client';

import React, { useState } from 'react';
import {
  PlusCircle,
  ArrowUp,
  ArrowDown,
  Trash2,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  createClassChapterAction,
  addChapterTopicAction,
  deleteChapterTopicAction,
  reorderChaptersAction,
  type ClassChapterItem,
} from './peta-pulau-actions';

export function ClassChaptersTab({
  classId,
  initialChapters,
}: {
  classId: string;
  initialChapters: ClassChapterItem[];
}) {
  const [chapters, setChapters] = useState<ClassChapterItem[]>(initialChapters);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [isOptional, setIsOptional] = useState(false);
  const [passScore, setPassScore] = useState<number>(70);
  const [targetDate, setTargetDate] = useState('');
  const [completionRule, setCompletionRule] = useState<'kuis' | 'materi'>('kuis');
  const [activeTopicInput, setActiveTopicInput] = useState<{ chapterId: string; text: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setErrorMessage(null);
    const res = await createClassChapterAction({
      class_id: classId,
      title: newTitle.trim(),
      summary: newSummary.trim() || undefined,
      is_optional: isOptional,
      pass_score: passScore,
      target_date: targetDate || undefined,
      completion_rule: completionRule,
    });

    if (res.ok && res.chapterId) {
      setChapters([
        ...chapters,
        {
          id: res.chapterId,
          class_id: classId,
          position: chapters.length + 1,
          title: newTitle.trim(),
          summary: newSummary.trim() || null,
          is_optional: isOptional,
          pass_score: passScore,
          target_date: targetDate || null,
          completion_rule: completionRule,
          topics: [],
        },
      ]);
      setNewTitle('');
      setNewSummary('');
      setIsCreating(false);
    } else {
      setErrorMessage(res.message || 'Gagal menambahkan bab.');
    }
  };

  const handleAddTopic = async (chapterId: string) => {
    if (!activeTopicInput || !activeTopicInput.text.trim()) return;
    const topicText = activeTopicInput.text.trim();

    const res = await addChapterTopicAction(chapterId, classId, topicText);
    if (res.ok) {
      setChapters((prev) =>
        prev.map((c) =>
          c.id === chapterId
            ? { ...c, topics: [...(c.topics || []), { id: `tmp-${Date.now()}`, name: topicText }] }
            : c
        )
      );
      setActiveTopicInput(null);
    }
  };

  const handleDeleteTopic = async (chapterId: string, topicId: string) => {
    const res = await deleteChapterTopicAction(topicId, classId);
    if (res.ok) {
      setChapters((prev) =>
        prev.map((c) =>
          c.id === chapterId
            ? { ...c, topics: (c.topics || []).filter((t) => t.id !== topicId) }
            : c
        )
      );
    }
  };

  const handleReorder = async (chapterId: string, direction: 'up' | 'down') => {
    await reorderChaptersAction(classId, chapterId, direction);
    const idx = chapters.findIndex((c) => c.id === chapterId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= chapters.length) return;

    const newArr = [...chapters];
    const temp = newArr[idx];
    newArr[idx] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setChapters(newArr.map((c, i) => ({ ...c, position: i + 1 })));
  };

  return (
    <div className="space-y-6">
      {/* Header Tab Bab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-lg">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Susunan Bab Perkuliahan
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atur urutan bab, topik materi, syarat kelulusan, dan batas waktu target pembelajaran.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Tambah Bab Baru
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
          {errorMessage}
        </div>
      )}

      {/* Form Pembuatan Bab Baru */}
      {isCreating && (
        <form
          onSubmit={handleCreateChapter}
          className="bg-card border border-border p-5 rounded-lg space-y-4 animate-scale-in"
        >
          <h3 className="text-sm font-bold text-foreground">Form Bab Perkuliahan Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-foreground">Judul Bab *</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={120}
                placeholder="Contoh: Normalisasi Basis Data & Bentuk Boyce-Codd"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-foreground">Ringkasan Materi (Opsional)</label>
              <textarea
                rows={2}
                placeholder="Penjelasan ringkas konsep penting yang dipelajari pada bab ini..."
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Aturan Penyelesaian Bab</label>
              <select
                value={completionRule}
                onChange={(e) => setCompletionRule(e.target.value as 'kuis' | 'materi')}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="kuis">Kuis Bab (Skor Minimal)</option>
                <option value="materi">Selesai Membaca Seluruh Materi</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Nilai Ambang Kelulusan (0-100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={passScore}
                onChange={(e) => setPassScore(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Target Tanggal Penyelesaian</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="is_optional_check"
                checked={isOptional}
                onChange={(e) => setIsOptional(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="is_optional_check" className="font-medium text-foreground cursor-pointer">
                Tandai sebagai Bab Opsional (Tidak menghalangi bab berikutnya)
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90"
            >
              Simpan Bab
            </button>
          </div>
        </form>
      )}

      {/* Daftar Bab yang Sudah Ada */}
      {chapters.length === 0 ? (
        <div className="p-8 border border-dashed border-border rounded-lg text-center space-y-2 bg-muted/10">
          <Layers className="w-8 h-8 text-muted-foreground mx-auto" />
          <h4 className="text-sm font-semibold text-foreground">Belum ada bab yang disusun</h4>
          <p className="text-xs text-muted-foreground">
            Mulai susun bab untuk memetakan alur belajar terstruktur bagi mahasiswa Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {chapters.map((chap, idx) => (
            <div
              key={chap.id}
              className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-sm hover:border-primary/30 transition-all"
            >
              {/* Baris Utama: Posisi, Judul, Tombol Urutan */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {chap.position}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">{chap.title}</h4>
                      {chap.is_optional && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">
                          Opsional
                        </span>
                      )}
                    </div>
                    {chap.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{chap.summary}</p>
                    )}
                  </div>
                </div>

                {/* Tombol Naik / Turun Urutan */}
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleReorder(chap.id, 'up')}
                    aria-label={`Pindahkan ${chap.title} ke atas`}
                    className="p-1 rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === chapters.length - 1}
                    onClick={() => handleReorder(chap.id, 'down')}
                    aria-label={`Pindahkan ${chap.title} ke bawah`}
                    className="p-1 rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Detail Indikator Bab */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-md">
                <div>
                  <span className="font-semibold text-foreground">Syarat: </span>
                  {chap.completion_rule === 'kuis' ? `Kuis (≥ ${chap.pass_score ?? 70})` : 'Tuntas Materi'}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Target: </span>
                  {chap.target_date ? new Date(chap.target_date).toLocaleDateString('id-ID') : 'Tidak diatur'}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Topik: </span>
                  {(chap.topics || []).length} topik
                </div>
                <div className="flex items-center gap-1">
                  {chap.completion_rule === 'kuis' && !chap.has_quiz ? (
                    <span className="text-amber-600 flex items-center gap-1 text-[11px] font-medium" title="Bab ini belum punya kuis">
                      <AlertTriangle className="w-3.5 h-3.5" /> Belum ada kuis
                    </span>
                  ) : (
                    <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Kuis siap
                    </span>
                  )}
                </div>
              </div>

              {/* Manajemen Topik Bab */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    Topik Pembahasan:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTopicInput(
                        activeTopicInput?.chapterId === chap.id
                          ? null
                          : { chapterId: chap.id, text: '' }
                      )
                    }
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    + Tambah Topik
                  </button>
                </div>

                {/* Form Tambah Topik */}
                {activeTopicInput?.chapterId === chap.id && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Nama topik, misal: Normalisasi 3NF"
                      value={activeTopicInput.text}
                      onChange={(e) =>
                        setActiveTopicInput({ chapterId: chap.id, text: e.target.value })
                      }
                      className="px-2.5 py-1 text-xs bg-background border border-border rounded-md text-foreground flex-1 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTopic(chap.id)}
                      className="px-3 py-1 text-xs bg-primary text-primary-foreground font-semibold rounded-md"
                    >
                      Simpan
                    </button>
                  </div>
                )}

                {/* Daftar Chip Topik */}
                <div className="flex flex-wrap gap-1.5">
                  {(chap.topics || []).length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">
                      Belum ada topik yang ditambahkan.
                    </span>
                  ) : (
                    chap.topics?.map((topic) => (
                      <span
                        key={topic.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-muted border border-border rounded-md text-foreground"
                      >
                        {topic.name}
                        <button
                          type="button"
                          onClick={() => handleDeleteTopic(chap.id, topic.id)}
                          className="hover:text-destructive text-muted-foreground ml-1"
                          aria-label={`Hapus topik ${topic.name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
