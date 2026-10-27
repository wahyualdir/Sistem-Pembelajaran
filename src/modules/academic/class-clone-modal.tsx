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
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-black bg-white text-black font-bold text-xs shadow-retro hover:bg-gray-soft transition-all cursor-pointer"
      >
        <Copy className="h-4 w-4 text-black" />
        <span>Salin Isi Kelas</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="w-full max-w-xl max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-none">
            <RetroWindow
              title="Salin Isi Kelas Perkuliahan"
              badge="Penggunaan Ulang"
              headerBadgeVariant="default"
              headerClassName="bg-gray-soft"
              bodyClassName="p-6 bg-white space-y-5"
            >
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div>
                  <h3 className="font-heading font-black text-lg text-black">Pakai Ulang Isi Semester Lalu</h3>
                  <p className="text-xs text-black/75 mt-0.5 font-medium leading-relaxed">
                    Salin materi, tugas, dan kuis tanpa menyertakan data pengumpulan atau nilai mahasiswa.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg border-2 border-black bg-white hover:bg-gray-soft text-black shadow-retro-sm cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {message && (
                <div
                  className={`p-3.5 rounded-xl border-2 border-black text-xs font-bold shadow-retro-sm flex items-center gap-2 ${
                    message.type === 'sukses'
                      ? 'bg-gray-soft text-black'
                      : 'bg-white text-black'
                  }`}
                >
                  {message.type === 'sukses' ? (
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-black shrink-0" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              {cloneResult ? (
                <div className="p-6 rounded-2xl border-2 border-black bg-gray-soft/40 text-center space-y-4 shadow-retro">
                  <CheckCircle2 className="h-10 w-10 text-black mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-heading font-black text-base text-black">Penyalinan Selesai</h4>
                    <p className="text-xs text-black/75 font-medium">
                      Materi: {cloneResult.materials ?? 0}, Tugas: {cloneResult.assignments ?? 0}, Ujian/Kuis: {cloneResult.quizzes ?? 0}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 rounded-xl border-2 border-black bg-black text-white font-bold text-xs shadow-retro hover:bg-neutral-800 transition-all cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pemilih Kelas Sumber & Tujuan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-mono font-bold text-black uppercase tracking-wider block">
                        Kelas Sumber (Semester Lalu)
                      </label>
                      <select
                        value={sourceClassId}
                        onChange={(e) => setSourceClassId(e.target.value)}
                        className="w-full text-xs font-bold border-2 border-black rounded-lg p-2.5 bg-white text-black shadow-retro-sm cursor-pointer"
                      >
                        {myClasses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} {c.section ? `(${c.section})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono font-bold text-black uppercase tracking-wider block">
                        Kelas Tujuan (Semester Aktif)
                      </label>
                      <select
                        value={targetClassId}
                        onChange={(e) => setTargetClassId(e.target.value)}
                        className="w-full text-xs font-bold border-2 border-black rounded-lg p-2.5 bg-white text-black shadow-retro-sm cursor-pointer"
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
                  <div className="rounded-xl border-2 border-black p-4 bg-gray-soft/40 space-y-2.5 shadow-retro-sm">
                    <span className="text-xs font-mono font-bold text-black uppercase tracking-wider block">
                      Pilih Konten yang Disalin:
                    </span>
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-black">
                        <input
                          type="checkbox"
                          checked={options.materials}
                          onChange={(e) => setOptions({ ...options, materials: e.target.checked })}
                          className="h-4 w-4 rounded border-2 border-black accent-black"
                        />
                        <span>Materi Perkuliahan</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-black">
                        <input
                          type="checkbox"
                          checked={options.assignments}
                          onChange={(e) => setOptions({ ...options, assignments: e.target.checked })}
                          className="h-4 w-4 rounded border-2 border-black accent-black"
                        />
                        <span>Tugas (Draf & Digeser)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-black">
                        <input
                          type="checkbox"
                          checked={options.quizzes}
                          onChange={(e) => setOptions({ ...options, quizzes: e.target.checked })}
                          className="h-4 w-4 rounded border-2 border-black accent-black"
                        />
                        <span>Ujian & Kuis (Draf)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-black">
                        <input
                          type="checkbox"
                          checked={options.rubrics}
                          onChange={(e) => setOptions({ ...options, rubrics: e.target.checked })}
                          className="h-4 w-4 rounded border-2 border-black accent-black"
                        />
                        <span>Rubrik Penilaian</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-black">
                        <input
                          type="checkbox"
                          checked={options.gamification}
                          onChange={(e) => setOptions({ ...options, gamification: e.target.checked })}
                          className="h-4 w-4 rounded border-2 border-black accent-black"
                        />
                        <span>Pengaturan Gamifikasi</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-black">
                        <input
                          type="checkbox"
                          checked={options.cpmk}
                          onChange={(e) => setOptions({ ...options, cpmk: e.target.checked })}
                          className="h-4 w-4 rounded border-2 border-black accent-black"
                        />
                        <span>Pemetaan CPMK</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-black col-span-2">
                        <input
                          type="checkbox"
                          checked={options.assistants}
                          onChange={(e) => setOptions({ ...options, assistants: e.target.checked })}
                          className="h-4 w-4 rounded border-2 border-black accent-black"
                        />
                        <span>Tugaskan Asisten yang Sama</span>
                      </label>
                    </div>
                  </div>

                  {/* Pergeseran Tanggal */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-bold text-black uppercase tracking-wider block">
                      Pergeseran Tenggat Waktu (Hari)
                    </label>
                    <input
                      type="number"
                      value={dateShiftDays}
                      onChange={(e) => setDateShiftDays(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-xs font-bold border-2 border-black rounded-lg p-2.5 bg-white text-black shadow-retro-sm"
                      placeholder="Contoh: 120"
                    />
                    <p className="text-[11px] text-black/70 font-medium">
                      Tenggat waktu tugas dan jadwal kuis akan digeser sejumlah hari ke depan.
                    </p>
                  </div>

                  <div className="pt-4 border-t-2 border-black/15 flex justify-end gap-2.5">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 rounded-xl border-2 border-black bg-white text-black font-bold text-xs hover:bg-gray-soft shadow-retro-sm cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleRunClone}
                      disabled={isPending}
                      className="px-5 py-2 rounded-xl border-2 border-black bg-black text-white font-bold text-xs shadow-retro hover:bg-neutral-800 transition-all disabled:opacity-50 cursor-pointer"
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
