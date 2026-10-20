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
  X,
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
    <div className="space-y-6 font-sans">
      {/* Header Tab Bab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-black p-5 rounded-2xl shadow-retro">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-black bg-gray-soft text-[11px] font-mono font-bold text-black uppercase">
            <Layers className="w-3.5 h-3.5 text-black" />
            <span>Kurikulum Perkuliahan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-black">
            Susunan Bab & Alur Belajar
          </h2>
          <p className="text-xs sm:text-sm text-black/75 font-medium leading-relaxed">
            Atur urutan bab, topik materi, syarat kelulusan kuis, dan target tanggal pembelajaran mahasiswa.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-black text-white border-2 border-black rounded-xl hover:bg-neutral-800 transition-all shadow-retro self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tambah Bab Baru</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 text-xs bg-white text-black font-bold border-2 border-black rounded-xl shadow-retro-sm">
          {errorMessage}
        </div>
      )}

      {/* Form Pembuatan Bab Baru */}
      {isCreating && (
        <form
          onSubmit={handleCreateChapter}
          className="bg-white border-2 border-black p-6 rounded-2xl shadow-retro-md space-y-4 animate-scale-in"
        >
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="text-base font-heading font-black text-black">Formulir Bab Perkuliahan Baru</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="p-1 rounded border border-black bg-white hover:bg-gray-soft text-black shadow-retro-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-mono font-bold text-black uppercase tracking-wider">Judul Bab *</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={120}
                placeholder="Contoh: Normalisasi Basis Data & Bentuk Boyce-Codd"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-black font-sans font-bold shadow-retro-sm outline-none"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="font-mono font-bold text-black uppercase tracking-wider">Ringkasan Materi (Opsional)</label>
              <textarea
                rows={2}
                placeholder="Penjelasan ringkas konsep penting yang dipelajari pada bab ini..."
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-black font-sans font-medium shadow-retro-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono font-bold text-black uppercase tracking-wider">Aturan Penyelesaian Bab</label>
              <select
                value={completionRule}
                onChange={(e) => setCompletionRule(e.target.value as 'kuis' | 'materi')}
                className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-black font-mono font-bold shadow-retro-sm outline-none cursor-pointer"
              >
                <option value="kuis">Kuis Bab (Skor Minimal)</option>
                <option value="materi">Selesai Membaca Seluruh Materi</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-mono font-bold text-black uppercase tracking-wider">Nilai Ambang Kelulusan (0-100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={passScore}
                onChange={(e) => setPassScore(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-black font-mono font-bold shadow-retro-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono font-bold text-black uppercase tracking-wider">Target Tanggal Penyelesaian</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-black font-mono font-bold shadow-retro-sm outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="is_optional_check"
                checked={isOptional}
                onChange={(e) => setIsOptional(e.target.checked)}
                className="rounded border-2 border-black accent-black"
              />
              <label htmlFor="is_optional_check" className="font-bold text-black cursor-pointer text-xs">
                Tandai sebagai Bab Opsional (Tidak menghalangi bab berikutnya)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t-2 border-black">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-xs border-2 border-black rounded-xl bg-white hover:bg-gray-soft text-black font-bold shadow-retro-sm cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs bg-black text-white font-bold border-2 border-black rounded-xl hover:bg-neutral-800 shadow-retro cursor-pointer"
            >
              Simpan Bab
            </button>
          </div>
        </form>
      )}

      {/* Daftar Bab yang Sudah Ada */}
      {chapters.length === 0 ? (
        <div className="p-10 border-2 border-dashed border-black rounded-2xl text-center space-y-2 bg-gray-soft/40 shadow-retro">
          <Layers className="w-8 h-8 text-black mx-auto" />
          <h4 className="text-base font-heading font-black text-black">Belum ada bab yang disusun</h4>
          <p className="text-xs text-black/75 font-medium max-w-md mx-auto">
            Mulai susun bab perkuliahan untuk memetakan alur belajar terstruktur bagi mahasiswa Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {chapters.map((chap, idx) => (
            <div
              key={chap.id}
              className="bg-white border-2 border-black rounded-2xl p-5 space-y-4 shadow-retro hover:-translate-y-0.5 transition-transform"
            >
              {/* Baris Utama: Posisi, Judul, Tombol Urutan */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg border-2 border-black bg-black text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-retro-sm">
                    {chap.position}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-heading font-black text-black">{chap.title}</h4>
                      {chap.is_optional && (
                        <span className="text-[11px] font-mono font-bold bg-gray-soft text-black px-2 py-0.5 rounded border border-black shadow-retro-sm">
                          Opsional
                        </span>
                      )}
                    </div>
                    {chap.summary && (
                      <p className="text-xs text-black/75 line-clamp-1 mt-0.5 font-medium">{chap.summary}</p>
                    )}
                  </div>
                </div>

                {/* Tombol Naik / Turun Urutan */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleReorder(chap.id, 'up')}
                    aria-label={`Pindahkan ${chap.title} ke atas`}
                    className="p-1.5 rounded-lg border-2 border-black bg-white hover:bg-gray-soft text-black shadow-retro-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === chapters.length - 1}
                    onClick={() => handleReorder(chap.id, 'down')}
                    aria-label={`Pindahkan ${chap.title} ke bawah`}
                    className="p-1.5 rounded-lg border-2 border-black bg-white hover:bg-gray-soft text-black shadow-retro-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Detail Indikator Bab */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-black bg-gray-soft/40 p-3 rounded-xl border border-black/20 font-bold">
                <div>
                  <span className="text-black/70">Syarat: </span>
                  {chap.completion_rule === 'kuis' ? `Kuis (≥ ${chap.pass_score ?? 70})` : 'Tuntas Materi'}
                </div>
                <div>
                  <span className="text-black/70">Target: </span>
                  {chap.target_date ? new Date(chap.target_date).toLocaleDateString('id-ID') : 'Tidak diatur'}
                </div>
                <div>
                  <span className="text-black/70">Topik: </span>
                  {(chap.topics || []).length} topik
                </div>
                <div className="flex items-center gap-1">
                  {chap.completion_rule === 'kuis' && !chap.has_quiz ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-black text-black">
                      <AlertTriangle className="w-3 h-3 text-black" /> Belum ada kuis
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-black text-white px-2 py-0.5 rounded border border-black">
                      <CheckCircle2 className="w-3 h-3 text-white" /> Kuis siap
                    </span>
                  )}
                </div>
              </div>

              {/* Manajemen Topik Bab */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-black" />
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
                    className="text-xs font-bold text-black hover:underline cursor-pointer"
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
                      className="px-3 py-1.5 text-xs bg-white border-2 border-black rounded-lg text-black font-sans font-bold flex-1 shadow-retro-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTopic(chap.id)}
                      className="px-4 py-1.5 text-xs bg-black text-white font-bold border-2 border-black rounded-lg hover:bg-neutral-800 shadow-retro-sm cursor-pointer"
                    >
                      Simpan
                    </button>
                  </div>
                )}

                {/* Daftar Chip Topik */}
                <div className="flex flex-wrap gap-2">
                  {(chap.topics || []).length === 0 ? (
                    <span className="text-xs text-black/60 italic font-medium">
                      Belum ada topik yang ditambahkan.
                    </span>
                  ) : (
                    chap.topics?.map((topic) => (
                      <span
                        key={topic.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white border-2 border-black rounded-lg text-black font-bold shadow-retro-sm"
                      >
                        <span>{topic.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTopic(chap.id, topic.id)}
                          className="hover:text-black text-black/60 font-bold ml-1 cursor-pointer"
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
