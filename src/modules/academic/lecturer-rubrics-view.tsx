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
        title,
        description,
        criteria,
      });

      if (res.ok && res.data) {
        setActionSuccess('Rubrik berhasil dibuat.');
        setRubrics((prev) => [res.data!, ...prev]);
        setSelectedRubricId(res.data.id);
        setIsCreating(false);
        setTitle('');
        setDescription('');
      } else {
        setActionError(res.error || 'Gagal membuat rubrik baru.');
      }
    });
  };

  const handleDuplicate = (rubricId: string) => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const res = await duplicateRubricAction(rubricId);
      if (res.ok && res.data) {
        setActionSuccess('Rubrik berhasil digandakan.');
        setRubrics((prev) => [res.data!, ...prev]);
        setSelectedRubricId(res.data.id);
      } else {
        setActionError(res.error || 'Gagal menggandakan rubrik.');
      }
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. BARIS ATAS: KONTROL DAN TOMBOL AKSI RETRO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-2 border-black bg-white shadow-retro rounded-xl">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-black uppercase text-black px-2.5 py-1 rounded border border-black bg-gray-soft shadow-retro-sm">
            {rubrics.length} RUBRIK TERSEDIA
          </span>
          <span className="text-xs font-bold text-black/75">
            Digunakan pada evaluasi tugas & kuis
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreating(!isCreating);
            setActionError(null);
            setActionSuccess(null);
          }}
          className="px-4 py-2 border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-black rounded-lg shadow-retro flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Tutup Pembuat' : 'Buat Rubrik Baru'}</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-gray-soft text-black text-xs rounded-xl border-2 border-black font-black shadow-retro-sm">
          ⚠️ {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="p-3 bg-white text-black text-xs rounded-xl border-2 border-black font-black shadow-retro-sm">
          ✓ {actionSuccess}
        </div>
      )}

      {/* 2. FORM PEMBUATAN RUBRIK BARU RETRO */}
      {isCreating && (
        <div className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro-md space-y-6">
          <div className="border-b-2 border-black/10 pb-4">
            <h2 className="text-lg font-heading font-black text-black">Pembuat Rubrik Penilaian</h2>
            <p className="text-xs text-black/70 font-medium mt-0.5">
              Tentukan kriteria dan tingkatan capaian untuk penilaian objektif.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-heading font-black text-black">Judul Rubrik</label>
              <input
                type="text"
                placeholder="Contoh: Rubrik Laporan Praktikum Jaringan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isPending}
                className="w-full border-2 border-black bg-white text-black text-xs font-medium p-2.5 rounded-lg shadow-retro-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-heading font-black text-black">Deskripsi Singkat (opsional)</label>
              <input
                type="text"
                placeholder="Petunjuk penggunaan rubrik..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                className="w-full border-2 border-black bg-white text-black text-xs font-medium p-2.5 rounded-lg shadow-retro-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Grid Kriteria */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-heading font-black text-black uppercase tracking-wider">
                Kriteria Penilaian ({criteria.length}) &bull; Total Bobot: {calculateTotalMaxPoints()} poin
              </span>
              <button
                type="button"
                onClick={handleAddCriterion}
                disabled={isPending}
                className="px-3 py-1.5 border-2 border-black bg-white hover:bg-gray-soft text-black text-xs font-bold rounded-lg shadow-retro-sm flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Kriteria</span>
              </button>
            </div>

            <div className="space-y-4">
              {criteria.map((c, cIdx) => (
                <div key={cIdx} className="p-4 rounded-xl border-2 border-black bg-gray-soft/50 space-y-3 shadow-retro-sm">
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
                        className="border-2 border-black bg-white text-black text-xs font-bold p-2 rounded shadow-retro-sm sm:col-span-2"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-black/70">Maks:</span>
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
                          className="w-20 border-2 border-black bg-white text-black text-xs font-mono font-bold p-2 rounded shadow-retro-sm"
                        />
                      </div>
                    </div>

                    {criteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(cIdx)}
                        className="text-black hover:opacity-75 p-1 cursor-pointer"
                        title="Hapus Kriteria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Level Capaian */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t-2 border-black/10">
                    {c.levels.map((lvl, lIdx) => (
                      <div key={lIdx} className="p-3 rounded-lg bg-white border-2 border-black space-y-1.5 shadow-retro-sm">
                        <div className="flex items-center justify-between border-b border-black/15 pb-1">
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
                            className="text-xs font-heading font-black text-black bg-transparent w-full focus:outline-none"
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
                            className="text-xs font-mono font-black text-right w-12 bg-transparent focus:outline-none text-black"
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
                          className="w-full text-xs font-medium bg-transparent focus:outline-none text-black/80 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t-2 border-black/10">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              disabled={isPending}
              className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-soft text-black font-bold text-xs shadow-retro rounded-lg cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCreateRubric}
              disabled={isPending || !title.trim()}
              className="px-5 py-2 border-2 border-black bg-black text-white hover:bg-neutral-800 font-black text-xs shadow-retro rounded-lg cursor-pointer disabled:opacity-50"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Rubrik'}
            </button>
          </div>
        </div>
      )}

      {/* 3. DAFTAR RUBRIK TERSEDIA */}
      {rubrics.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-black bg-gray-soft/40 p-12 text-center space-y-2">
          <ListChecks className="mx-auto h-10 w-10 text-black mb-2" />
          <h3 className="font-heading font-black text-black text-base">Belum ada rubrik</h3>
          <p className="text-xs text-black/75 font-medium max-w-sm mx-auto">
            Buat rubrik pertama Anda untuk memudahkan dan menstandarkan penilaian tugas mahasiswa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 space-y-3">
            {rubrics.map((r) => {
              const isSelected = r.id === selectedRubricId;
              const totalPoints = r.criteria.reduce((sum, c) => sum + Number(c.max_points || 0), 0);
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRubricId(r.id)}
                  className={`p-4 rounded-xl border-2 border-black cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gray-soft shadow-retro ring-2 ring-black'
                      : 'bg-white shadow-retro-sm hover:bg-gray-soft/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-heading font-black text-sm text-black">{r.title}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(r.id);
                      }}
                      title="Gandakan Rubrik"
                      className="text-black hover:opacity-75 p-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {r.description && (
                    <p className="text-xs text-black/70 mt-1 line-clamp-1 font-medium">
                      {r.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-black/70 border-t border-black/10 pt-2 font-mono font-bold">
                    <span>{r.criteria.length} kriteria</span>
                    <span className="font-black text-black">{totalPoints} poin total</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kolom Kanan: Pratinjau Rubrik Terpilih */}
          <div className="lg:col-span-2">
            {selectedRubric ? (
              <div className="rounded-xl border-2 border-black bg-white shadow-retro-md p-5 sm:p-6 space-y-5">
                <div className="border-b-2 border-black/10 pb-4 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-heading font-black text-black">{selectedRubric.title}</h2>
                    {selectedRubric.description && (
                      <p className="text-xs text-black/75 mt-0.5 font-medium">
                        {selectedRubric.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(selectedRubric.id)}
                    disabled={isPending}
                    className="px-3 py-1.5 border-2 border-black bg-white hover:bg-black hover:text-white text-black font-bold text-xs shadow-retro-sm rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Gandakan</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedRubric.criteria.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl border-2 border-black bg-gray-soft/40 space-y-3 shadow-retro-sm">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="font-heading font-black text-sm text-black">{c.title}</h4>
                          {c.description && (
                            <p className="text-xs text-black/70 font-medium">{c.description}</p>
                          )}
                        </div>
                        <span className="text-xs font-mono font-black px-2.5 py-0.5 bg-white border border-black rounded shadow-retro-sm text-black">
                          Maks: {c.max_points} poin
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                        {c.levels.map((lvl) => (
                          <div key={lvl.id} className="p-3 rounded-lg bg-white border-2 border-black space-y-1 shadow-retro-sm">
                            <div className="flex items-center justify-between border-b border-black/15 pb-1">
                              <span className="text-xs font-heading font-black text-black">{lvl.label}</span>
                              <span className="text-xs font-mono font-black text-black">{lvl.points} pt</span>
                            </div>
                            {lvl.description && (
                              <p className="text-[11px] text-black/75 leading-snug font-medium pt-0.5">
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
              <div className="rounded-xl border-2 border-black bg-white shadow-retro p-12 text-center text-xs font-bold text-black/70">
                Pilih salah satu rubrik untuk melihat detail kriteria dan tingkat capaian.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
