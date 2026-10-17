'use client';

import React, { useState, useTransition } from 'react';
import {
  ListChecks,
  Plus,
  Copy,
  Trash2,
  CheckCircle2,
  FileCheck,
  BookOpen,
} from 'lucide-react';
import {
  type RubricItem,
  type RubricCriterionItem,
  createRubricAction,
  duplicateRubricAction,
} from './rubric-actions';

interface LecturerRubricsViewProps {
  initialRubrics: RubricItem[];
}

export function LecturerRubricsView({ initialRubrics }: LecturerRubricsViewProps) {
  const [rubrics, setRubrics] = useState<RubricItem[]>(initialRubrics);
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(
    initialRubrics[0]?.id || null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // State pembuatan rubrik baru
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<
    Array<{
      title: string;
      description: string;
      maxPoints: number;
      levels: Array<{ label: string; description: string; points: number }>;
    }>
  >([
    {
      title: 'Kerapian dan Struktur',
      description: 'Tata letak dan kesesuaian format dokumen.',
      maxPoints: 30,
      levels: [
        { label: 'Sangat Baik', description: 'Format teratur dan lengkap', points: 30 },
        { label: 'Cukup', description: 'Beberapa bagian kurang rapi', points: 20 },
        { label: 'Kurang', description: 'Format tidak sesuai petunjuk', points: 10 },
      ],
    },
    {
      title: 'Kedalaman Analisis',
      description: 'Analisis dan pemahaman terhadap masalah.',
      maxPoints: 70,
      levels: [
        { label: 'Mendalam', description: 'Analisis komprehensif dan tajam', points: 70 },
        { label: 'Standar', description: 'Analisis cukup mendalam', points: 50 },
        { label: 'Dangkal', description: 'Hanya merangkum tanpa analisis', points: 25 },
      ],
    },
  ]);

  const selectedRubric = rubrics.find((r) => r.id === selectedRubricId);

  const calculateTotalMaxPoints = () => {
    return criteria.reduce((sum, c) => sum + Number(c.maxPoints || 0), 0);
  };

  const handleAddCriterion = () => {
    setCriteria((prev) => [
      ...prev,
      {
        title: `Kriteria ${prev.length + 1}`,
        description: '',
        maxPoints: 20,
        levels: [
          { label: 'Sangat Baik', description: '', points: 20 },
          { label: 'Cukup', description: '', points: 10 },
          { label: 'Kurang', description: '', points: 5 },
        ],
      },
    ]);
  };

  const handleRemoveCriterion = (idx: number) => {
    if (criteria.length <= 1) return;
    setCriteria((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateRubric = () => {
    if (!title.trim()) {
      setActionError('Judul rubrik wajib diisi.');
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await createRubricAction({
        title: title.trim(),
        description: description.trim() || null,
        isTemplate: false,
        criteria,
      });

      if (res.ok && res.data) {
        setActionSuccess(`Rubrik '${res.data.title}' berhasil dibuat.`);
        setRubrics((prev) => [res.data!, ...prev]);
        setSelectedRubricId(res.data.id);
        setIsCreating(false);
        setTitle('');
        setDescription('');
      } else {
        setActionError(res.error || 'Gagal membuat rubrik.');
      }
    });
  };

  const handleDuplicate = (rubricId: string) => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await duplicateRubricAction(rubricId);
      if (res.ok && res.data) {
        setActionSuccess(`Rubrik berhasil digandakan.`);
        setRubrics((prev) => [res.data!, ...prev]);
        setSelectedRubricId(res.data.id);
      } else {
        setActionError(res.error || 'Gagal menggandakan rubrik.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Rubrik Penilaian</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Standarisasi penilaian tugas kuliah berbasis kriteria berjenjang.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreating(!isCreating);
            setActionError(null);
            setActionSuccess(null);
          }}
          className="btn-solid !w-auto px-4 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Tutup Pembuat' : 'Buat Rubrik Baru'}</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg border border-danger/20">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm rounded-lg border border-emerald-200">
          {actionSuccess}
        </div>
      )}

      {/* Form Pembuatan Rubrik Baru (Grid Editor) */}
      {isCreating && (
        <div className="rounded-[12px] border border-border bg-surface p-6 space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-lg font-bold text-foreground">Pembuat Rubrik Penilaian</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tentukan kriteria dan tingkatan capaian untuk penilaian objektif.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium">Judul Rubrik</label>
              <input
                type="text"
                placeholder="Contoh: Rubrik Laporan Praktikum Jaringan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isPending}
                className="field text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium">Deskripsi Singkat (opsional)</label>
              <input
                type="text"
                placeholder="Petunjuk penggunaan rubrik..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                className="field text-sm"
              />
            </div>
          </div>

          {/* Grid Kriteria */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Kriteria Penilaian ({criteria.length}) — Total Bobot: {calculateTotalMaxPoints()} poin
              </span>
              <button
                type="button"
                onClick={handleAddCriterion}
                disabled={isPending}
                className="btn-outline !w-auto text-xs px-3 py-1 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Kriteria</span>
              </button>
            </div>

            <div className="space-y-4">
              {criteria.map((c, cIdx) => (
                <div key={cIdx} className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 grid gap-2 sm:grid-cols-3">
                      <input
                        type="text"
                        placeholder="Nama kriteria..."
                        value={c.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCriteria((prev) =>
                            prev.map((item, i) => (i === cIdx ? { ...item, title: val } : item))
                          );
                        }}
                        className="field text-xs sm:col-span-2"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Maks:</span>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={c.maxPoints}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCriteria((prev) =>
                              prev.map((item, i) => (i === cIdx ? { ...item, maxPoints: val } : item))
                            );
                          }}
                          className="field text-xs"
                        />
                      </div>
                    </div>

                    {criteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(cIdx)}
                        className="text-danger hover:text-danger/80 p-1"
                        title="Hapus Kriteria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Level Capaian */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border/40">
                    {c.levels.map((lvl, lIdx) => (
                      <div key={lIdx} className="p-2.5 rounded bg-surface border border-border/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={lvl.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCriteria((prev) =>
                                prev.map((item, i) =>
                                  i === cIdx
                                    ? {
                                        ...item,
                                        levels: item.levels.map((l, j) =>
                                          j === lIdx ? { ...l, label: val } : l
                                        ),
                                      }
                                    : item
                                )
                              );
                            }}
                            className="text-xs font-semibold bg-transparent border-b border-border/40 w-full focus:outline-none"
                          />
                          <input
                            type="number"
                            value={lvl.points}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setCriteria((prev) =>
                                prev.map((item, i) =>
                                  i === cIdx
                                    ? {
                                        ...item,
                                        levels: item.levels.map((l, j) =>
                                          j === lIdx ? { ...l, points: val } : l
                                        ),
                                      }
                                    : item
                                )
                              );
                            }}
                            className="text-xs font-bold text-right w-12 bg-transparent focus:outline-none"
                          />
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Deskripsi capaian..."
                          value={lvl.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCriteria((prev) =>
                              prev.map((item, i) =>
                                i === cIdx
                                    ? {
                                        ...item,
                                        levels: item.levels.map((l, j) =>
                                          j === lIdx ? { ...l, description: val } : l
                                        ),
                                      }
                                    : item
                              )
                            );
                          }}
                          className="field !h-auto text-[11px] py-1 text-muted-foreground"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              disabled={isPending}
              className="btn-outline !w-auto px-4"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCreateRubric}
              disabled={isPending || !title.trim()}
              className="btn-solid !w-auto px-5"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Rubrik'}
            </button>
          </div>
        </div>
      )}

      {/* Daftar Rubrik */}
      {rubrics.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface p-12 text-center">
          <ListChecks className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="font-semibold text-foreground text-base">Belum ada rubrik</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Buat rubrik pertama Anda untuk memudahkan dan menstandarkan penilaian tugas mahasiswa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {rubrics.map((r) => {
              const isSelected = r.id === selectedRubricId;
              const totalPoints = r.criteria.reduce((sum, c) => sum + Number(c.max_points || 0), 0);
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRubricId(r.id)}
                  className={`p-4 rounded-[12px] border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-surface hover:border-foreground/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-foreground">{r.title}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(r.id);
                      }}
                      title="Gandakan Rubrik"
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {r.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
                    <span>{r.criteria.length} kriteria</span>
                    <span className="font-semibold text-foreground">{totalPoints} poin total</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kolom Kanan: Pratinjau Rubrik Terpilih */}
          <div className="lg:col-span-2">
            {selectedRubric ? (
              <div className="rounded-[12px] border border-border bg-surface p-6 space-y-6">
                <div className="border-b border-border pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedRubric.title}</h2>
                    {selectedRubric.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedRubric.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(selectedRubric.id)}
                    disabled={isPending}
                    className="btn-outline !w-auto text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Gandakan</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedRubric.criteria.map((c) => (
                    <div key={c.id} className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{c.title}</h4>
                          {c.description && (
                            <p className="text-xs text-muted-foreground">{c.description}</p>
                          )}
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 bg-surface border rounded">
                          Maks: {c.max_points} poin
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                        {c.levels.map((lvl) => (
                          <div key={lvl.id} className="p-3 rounded bg-surface border border-border/60 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground">{lvl.label}</span>
                              <span className="text-xs font-semibold text-primary">{lvl.points} pt</span>
                            </div>
                            {lvl.description && (
                              <p className="text-[11px] text-muted-foreground leading-snug">
                                {lvl.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[12px] border border-border bg-surface p-12 text-center text-muted-foreground">
                Pilih salah satu rubrik untuk melihat detail kriteria dan tingkat capaian.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
