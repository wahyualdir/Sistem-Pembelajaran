'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  Layers,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { CpmkCplRadarCard } from '@/modules/academic/cpmk-cpl-radar-card';
import { createCpmkAction, CplItem, CpmkItem } from '@/modules/academic/curriculum-actions';

interface CurriculumViewProps {
  cpl: CplItem[];
  cpmk: CpmkItem[];
  coursesPerSemester: {
    semester: number;
    courses: Array<{
      id: string;
      code: string;
      name: string;
      credits: number;
      semester: number;
      is_mandatory: boolean;
    }>;
  }[];
}

export function CurriculumView({ cpl, cpmk, coursesPerSemester }: CurriculumViewProps) {
  const [activeTab, setActiveTab] = useState<'map' | 'cpl' | 'cpmk' | 'radar'>('map');
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [cpmkForm, setCpmkForm] = useState({
    course_id: coursesPerSemester[2]?.courses[0]?.id || '',
    code: '',
    description: '',
    cpl_ids: [] as string[],
  });
  const [formMsg, setFormMsg] = useState<{ ok?: boolean; text?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allCourses = coursesPerSemester.flatMap((s) => s.courses);

  async function handleCreateCpmk(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMsg(null);

    const res = await createCpmkAction(cpmkForm);
    setIsSubmitting(false);

    if (res.ok) {
      setFormMsg({ ok: true, text: 'CPMK berhasil disimpan dan dipetakan ke CPL!' });
      setIsAddOpen(false);
      setFormMsg(null);
    } else {
      setFormMsg({ ok: false, text: res.error || 'Gagal menyimpan CPMK.' });
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Kurikulum & Capaian Pembelajaran (CPL/CPMK)"
        badge="KAPRODI :: KURIKULUM OBE"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-black" />
              <span>Kurikulum & Pemetaan CPL/CPMK</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-2xl leading-relaxed">
              Struktur kurikulum berbasis Outcome-Based Education (OBE) Program Studi Teknik Informatika. Memetakan Capaian Pembelajaran Lulusan (CPL) ke Capaian Pembelajaran Mata Kuliah (CPMK).
            </p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black bg-black text-white font-bold text-xs shadow-retro hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tambah Butir CPMK</span>
          </button>
        </div>
      </RetroWindow>

      {/* Tabs Menu */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-black pb-3">
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
            activeTab === 'map'
              ? 'border-black bg-black text-white shadow-retro'
              : 'border-black/30 bg-white text-black hover:bg-gray-soft'
          }`}
        >
          Peta Semester (1-8)
        </button>
        <button
          onClick={() => setActiveTab('cpl')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
            activeTab === 'cpl'
              ? 'border-black bg-black text-white shadow-retro'
              : 'border-black/30 bg-white text-black hover:bg-gray-soft'
          }`}
        >
          Daftar CPL Prodi ({cpl.length})
        </button>
        <button
          onClick={() => setActiveTab('cpmk')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
            activeTab === 'cpmk'
              ? 'border-black bg-black text-white shadow-retro'
              : 'border-black/30 bg-white text-black hover:bg-gray-soft'
          }`}
        >
          Pemetaan CPMK ({cpmk.length})
        </button>
        <button
          onClick={() => setActiveTab('radar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
            activeTab === 'radar'
              ? 'border-black bg-black text-white shadow-retro'
              : 'border-black/30 bg-white text-black hover:bg-gray-soft'
          }`}
        >
          Radar Ketercapaian Kelas
        </button>
      </div>

      {/* TAB 1: Peta Semester */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSemester(s)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border-2 transition-all cursor-pointer ${
                  selectedSemester === s
                    ? 'border-black bg-gray-soft text-black shadow-retro-sm'
                    : 'border-black/20 bg-white text-black/70 hover:bg-neutral-50'
                }`}
              >
                Semester {s}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <h3 className="font-heading font-black text-lg text-black">
                  Mata Kuliah Paket Semester {selectedSemester}
                </h3>
                <p className="text-xs text-black/70 font-medium">
                  Total beban:{' '}
                  <strong>
                    {coursesPerSemester.find((x) => x.semester === selectedSemester)?.courses.reduce((acc, c) => acc + c.credits, 0) || 0} SKS
                  </strong>
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded border-2 border-black shadow-retro-sm">
                Kurikulum 2024-2029
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coursesPerSemester
                .find((x) => x.semester === selectedSemester)
                ?.courses.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-black bg-gray-soft px-2 py-0.5 rounded border border-black">
                          {c.code}
                        </span>
                        <span className="text-xs font-mono font-bold text-black">
                          {c.credits} SKS
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-black mt-2 leading-snug">
                        {c.name}
                      </h4>
                    </div>
                    <div className="pt-2 border-t border-black/20 flex items-center justify-between text-xs font-medium">
                      <span className={c.is_mandatory ? 'text-black font-bold' : 'text-black/70'}>
                        {c.is_mandatory ? 'Wajib Prodi' : 'Pilihan'}
                      </span>
                      <span className="text-black/60 font-mono">Sem {c.semester}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CPL List */}
      {activeTab === 'cpl' && (
        <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">
              Capaian Pembelajaran Lulusan (CPL) Prodi Teknik Informatika
            </h3>
            <span className="text-xs font-mono font-bold bg-gray-soft px-3 py-1 rounded border-2 border-black">
              Standar OBE Dikti
            </span>
          </div>
          <div className="space-y-3">
            {cpl.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border-2 border-black bg-white shadow-retro-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-3xl">
                  <span className="text-xs font-mono font-black text-black bg-gray-soft px-2.5 py-1 rounded border border-black inline-block">
                    {item.code}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-black leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-black/70 block">Target Ketercapaian</span>
                  <span className="text-base font-heading font-black text-black">{item.target || 75}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CPMK List */}
      {activeTab === 'cpmk' && (
        <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="font-heading font-black text-lg text-black">
              Daftar CPMK & Pemetaan ke CPL
            </h3>
            <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded border-2 border-black">
              Terverifikasi Tim Kurikulum
            </span>
          </div>
          <div className="space-y-4">
            {cpmk.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-xl border-2 border-black bg-white shadow-retro-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white bg-black px-2.5 py-1 rounded">
                      {item.code}
                    </span>
                    <span className="text-xs font-mono font-bold text-black bg-gray-soft px-2.5 py-1 rounded border border-black">
                      {item.course_code} · {item.course_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(item.cpl_mappings || []).map((cp) => (
                      <span
                        key={cp}
                        className="text-xs font-mono font-bold text-black bg-white px-2 py-0.5 rounded border border-black shadow-xs"
                      >
                        {cp}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-black leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Radar Ketercapaian Kelas */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border-2 border-black bg-gray-soft/50 text-xs text-black font-medium">
            Visualisasi ketercapaian dihitung secara dinamis dari nilai ujian dan tugas pada kelas percontohan: <strong>Pemrograman Web & Arsitektur Cloud (c0000000-0000-0000-0000-000000000001)</strong>.
          </div>
          <CpmkCplRadarCard classId="c0000000-0000-0000-0000-000000000001" />
        </div>
      )}

      {/* Modal Tambah CPMK */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className="font-heading font-black text-lg text-black">Tambah Butir CPMK Baru</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-black font-bold text-sm hover:opacity-70 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formMsg && (
              <div
                className={`p-3 rounded-xl border-2 text-xs font-bold ${
                  formMsg.ok
                    ? 'border-black bg-gray-soft text-black'
                    : 'border-[#C2553A] bg-[#C2553A]/10 text-[#C2553A]'
                }`}
              >
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateCpmk} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-black mb-1">Mata Kuliah</label>
                <select
                  value={cpmkForm.course_id}
                  onChange={(e) => setCpmkForm({ ...cpmkForm, course_id: e.target.value })}
                  className="w-full rounded-xl border-2 border-black bg-white p-2.5 font-medium text-black focus:outline-hidden"
                  required
                >
                  {allCourses.slice(0, 30).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name} (Sem {c.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Kode CPMK</label>
                <input
                  type="text"
                  placeholder="Contoh: CPMK-3"
                  value={cpmkForm.code}
                  onChange={(e) => setCpmkForm({ ...cpmkForm, code: e.target.value })}
                  className="w-full rounded-xl border-2 border-black bg-white p-2.5 font-medium text-black focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Deskripsi Capaian Pembelajaran</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan rumusan kompetensi spesifik mahasiswa pada mata kuliah..."
                  value={cpmkForm.description}
                  onChange={(e) => setCpmkForm({ ...cpmkForm, description: e.target.value })}
                  className="w-full rounded-xl border-2 border-black bg-white p-2.5 font-medium text-black focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Petakan ke CPL (Pilih minimal satu)</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {cpl.map((c) => {
                    const checked = cpmkForm.cpl_ids.includes(c.code);
                    return (
                      <label
                        key={c.id}
                        className={`p-2 rounded-lg border-2 flex items-center gap-2 cursor-pointer transition-all ${
                          checked
                            ? 'border-black bg-gray-soft font-bold'
                            : 'border-black/20 bg-white font-medium'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCpmkForm({
                                ...cpmkForm,
                                cpl_ids: [...cpmkForm.cpl_ids, c.code],
                              });
                            } else {
                              setCpmkForm({
                                ...cpmkForm,
                                cpl_ids: cpmkForm.cpl_ids.filter((x) => x !== c.code),
                              });
                            }
                          }}
                          className="rounded border-black"
                        />
                        <span className="text-xs">{c.code}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-black/20">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border-2 border-black bg-white font-bold text-xs text-black hover:bg-gray-soft cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || cpmkForm.cpl_ids.length === 0}
                  className="px-5 py-2 rounded-xl border-2 border-black bg-black font-bold text-xs text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shadow-retro"
                >
                  {isSubmitting ? 'Menyimpan…' : 'Simpan CPMK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
