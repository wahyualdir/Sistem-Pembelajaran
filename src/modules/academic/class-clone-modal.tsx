'use client';

import React, { useState, useTransition } from 'react';
import {
  Copy,
  Layers,
  Calendar,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cloneClassAction } from './class-clone-actions';

interface ClassItem {
  id: string;
  title: string;
  section?: string;
  course_code?: string;
}

interface ClassCloneModalProps {
  myClasses: ClassItem[];
  availableTargetClasses?: ClassItem[];
}

export function ClassCloneModal({ myClasses, availableTargetClasses }: ClassCloneModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [sourceClassId, setSourceClassId] = useState(myClasses[0]?.id || '');
  const [targetClassId, setTargetClassId] = useState(availableTargetClasses?.[0]?.id || myClasses[1]?.id || '');
  const [dateShiftDays, setDateShiftDays] = useState(120);

  const [options, setOptions] = useState({
    materials: true,
    assignments: true,
    quizzes: true,
    rubrics: true,
    gamification: true,
    cpmk: true,
    assistants: false
  });

  const [message, setMessage] = useState<{ type: 'sukses' | 'galat'; text: string } | null>(null);
  const [cloneResult, setCloneResult] = useState<any | null>(null);

  const handleRunClone = () => {
    if (!sourceClassId || !targetClassId) {
      setMessage({ type: 'galat', text: 'Pilih kelas sumber dan kelas tujuan.' });
      return;
    }
    if (sourceClassId === targetClassId) {
      setMessage({ type: 'galat', text: 'Kelas tujuan tidak boleh sama dengan kelas sumber.' });
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const res = await cloneClassAction({
        sourceClassId,
        targetClassId,
        options,
        dateShiftDays
      });

      if (!res.ok) {
        setMessage({ type: 'galat', text: res.pesan || 'Gagal menyalin kelas.' });
        return;
      }

      setCloneResult(res.data?.summary || res.data);
      setMessage({ type: 'sukses', text: 'Kelas berhasil disalin ke kelas tujuan.' });
    });
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setMessage(null);
          setCloneResult(null);
        }}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black bg-white text-black font-bold text-xs shadow-retro hover:bg-neutral-100 transition-all"
      >
        <Copy className="h-4 w-4" />
        <span>Salin Isi Kelas</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <RetroWindow
              title="Salin Isi Kelas Perkuliahan"
              badge="Penggunaan Ulang"
              headerBadgeVariant="warning"
              headerClassName="bg-gray-soft"
              bodyClassName="p-6 bg-white space-y-5"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-lg text-black">Pakai Ulang Isi Semester Lalu</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Salin materi, tugas, dan kuis tanpa menyertakan data pengumpulan atau nilai mahasiswa.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-neutral-100 text-black border border-black"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg border-2 text-xs font-bold ${
                    message.type === 'sukses'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-red-600 bg-red-50 text-red-900'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {cloneResult ? (
                <div className="p-5 rounded-xl border-2 border-black bg-neutral-50 text-center space-y-4">
                  <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-black">Penyalinan Selesai</h4>
                    <p className="text-xs text-muted-foreground">
                      Materi: {cloneResult.materials ?? 0}, Tugas: {cloneResult.assignments ?? 0}, Ujian/Kuis: {cloneResult.quizzes ?? 0}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-lg border-2 border-black bg-primary text-white font-bold text-xs shadow-retro hover:bg-emerald-700 transition-all"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pemilih Kelas Sumber & Tujuan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-black block">Kelas Sumber (Semester Lalu)</label>
                      <select
                        value={sourceClassId}
                        onChange={(e) => setSourceClassId(e.target.value)}
                        className="w-full text-xs font-medium border-2 border-black rounded-lg p-2 bg-white"
                      >
                        {myClasses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} {c.section ? `(${c.section})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-black block">Kelas Tujuan (Semester Aktif)</label>
                      <select
                        value={targetClassId}
                        onChange={(e) => setTargetClassId(e.target.value)}
                        className="w-full text-xs font-medium border-2 border-black rounded-lg p-2 bg-white"
                      >
                        {(availableTargetClasses || myClasses).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} {c.section ? `(${c.section})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Komponen yang Disalin */}
                  <div className="rounded-lg border-2 border-black p-3.5 bg-neutral-50 space-y-2">
                    <span className="text-xs font-bold text-black block">Pilih Konten yang Disalin:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={options.materials}
                          onChange={(e) => setOptions({ ...options, materials: e.target.checked })}
                          className="h-4 w-4 rounded border-black accent-primary"
                        />
                        <span>Materi Perkuliahan</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={options.assignments}
                          onChange={(e) => setOptions({ ...options, assignments: e.target.checked })}
                          className="h-4 w-4 rounded border-black accent-primary"
                        />
                        <span>Tugas (Draf & Digeser)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={options.quizzes}
                          onChange={(e) => setOptions({ ...options, quizzes: e.target.checked })}
                          className="h-4 w-4 rounded border-black accent-primary"
                        />
                        <span>Ujian & Kuis (Draf)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={options.rubrics}
                          onChange={(e) => setOptions({ ...options, rubrics: e.target.checked })}
                          className="h-4 w-4 rounded border-black accent-primary"
                        />
                        <span>Rubrik Penilaian</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={options.gamification}
                          onChange={(e) => setOptions({ ...options, gamification: e.target.checked })}
                          className="h-4 w-4 rounded border-black accent-primary"
                        />
                        <span>Pengaturan Gamifikasi</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={options.cpmk}
                          onChange={(e) => setOptions({ ...options, cpmk: e.target.checked })}
                          className="h-4 w-4 rounded border-black accent-primary"
                        />
                        <span>Pemetaan CPMK</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium col-span-2">
                        <input
                          type="checkbox"
                          checked={options.assistants}
                          onChange={(e) => setOptions({ ...options, assistants: e.target.checked })}
                          className="h-4 w-4 rounded border-black accent-primary"
                        />
                        <span>Tugaskan Asisten yang Sama</span>
                      </label>
                    </div>
                  </div>

                  {/* Pergeseran Tanggal */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-black block">
                      Pergeseran Tenggat Waktu (Hari)
                    </label>
                    <input
                      type="number"
                      value={dateShiftDays}
                      onChange={(e) => setDateShiftDays(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-xs font-medium border-2 border-black rounded-lg p-2 bg-white"
                      placeholder="Contoh: 120"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Tenggat waktu tugas dan jadwal kuis akan digeser sejumlah hari ke depan.
                    </p>
                  </div>

                  <div className="pt-3 border-t flex justify-end gap-2">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 rounded-lg border border-black bg-white text-black font-bold text-xs hover:bg-neutral-100"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleRunClone}
                      disabled={isPending}
                      className="px-5 py-2 rounded-lg border-2 border-black bg-primary text-white font-bold text-xs shadow-retro hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      {isPending ? 'Menyalin...' : 'Jalankan Penyalinan'}
                    </button>
                  </div>
                </div>
              )}
            </RetroWindow>
          </div>
        </div>
      )}
    </>
  );
}
