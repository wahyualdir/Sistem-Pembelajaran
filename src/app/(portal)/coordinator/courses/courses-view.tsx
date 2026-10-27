'use client';

import React, { useState } from 'react';
import {
  Layers,
  Search,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  GitFork,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  saveCourseAction,
  CourseWithPrerequisite,
} from '@/modules/academic/curriculum-actions';

interface CoursesViewProps {
  initialCourses: CourseWithPrerequisite[];
}

export function CoursesView({ initialCourses }: CoursesViewProps) {
  const [courses, setCourses] = useState<CourseWithPrerequisite[]>(initialCourses);
  const [search, setSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | 'ALL'>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    credits: 3,
    semester: 1,
    is_mandatory: true,
    prerequisite_id: '',
  });
  const [formMsg, setFormMsg] = useState<{ ok?: boolean; text?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.aliases || []).some((a) => a.toLowerCase().includes(search.toLowerCase()));
    const matchesSemester = selectedSemester === 'ALL' || c.semester === selectedSemester;
    return matchesSearch && matchesSemester;
  });

  async function handleSaveCourse(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMsg(null);

    const res = await saveCourseAction({
      ...formData,
      prerequisite_id: formData.prerequisite_id || null,
    });
    setIsSubmitting(false);

    if (res.ok) {
      setFormMsg({ ok: true, text: 'Mata kuliah dan relasi prasyarat berhasil disimpan!' });
      const prereqCourse = courses.find((x) => x.id === formData.prerequisite_id);
      const newEntry: CourseWithPrerequisite = {
        id: (res.data as any)?.id || `mk-${Date.now()}`,
        code: formData.code,
        name: formData.name,
        credits: formData.credits,
        semester: formData.semester,
        is_mandatory: formData.is_mandatory,
        prerequisite_id: formData.prerequisite_id || null,
        prerequisite_code: prereqCourse?.code || null,
        prerequisite_name: prereqCourse?.name || null,
        aliases: [],
      };
      setCourses([newEntry, ...courses]);
      setTimeout(() => {
        setIsAddOpen(false);
        setFormMsg(null);
        setFormData({ code: '', name: '', credits: 3, semester: 1, is_mandatory: true, prerequisite_id: '' });
      }, 1200);
    } else {
      setFormMsg({ ok: false, text: res.error || 'Gagal menyimpan mata kuliah.' });
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-up font-sans">
      <RetroWindow
        title="Mata Kuliah Program Studi"
        badge="KAPRODI :: STRUKTUR MK"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-black flex items-center gap-3">
              <Layers className="h-7 w-7 text-black" />
              <span>Struktur Mata Kuliah & Prasyarat</span>
            </h1>
            <p className="text-xs sm:text-sm text-black/75 font-medium max-w-2xl leading-relaxed">
              Pengelolaan katalog mata kuliah wajib dan pilihan, bobot SKS, semester paket, deteksi siklus prasyarat (DFS), serta penamaan alias kode mata kuliah.
            </p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black bg-black text-white font-bold text-xs shadow-retro hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tambah Mata Kuliah</span>
          </button>
        </div>
      </RetroWindow>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/60" />
          <input
            type="text"
            placeholder="Cari kode, nama, atau alias mata kuliah…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-black bg-white text-xs font-medium text-black focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-black/70 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Semester:
          </span>
          <button
            onClick={() => setSelectedSemester('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer ${
              selectedSemester === 'ALL'
                ? 'border-black bg-black text-white'
                : 'border-black/30 bg-white text-black hover:bg-gray-soft'
            }`}
          >
            Semua
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSemester(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border-2 transition-all cursor-pointer ${
                selectedSemester === s
                  ? 'border-black bg-black text-white'
                  : 'border-black/30 bg-white text-black hover:bg-gray-soft'
              }`}
            >
              S{s}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container with overflow-x-auto */}
      <div className="rounded-2xl border-2 border-black bg-white shadow-retro overflow-hidden">
        <div className="p-4 border-b-2 border-black bg-gray-soft flex items-center justify-between">
          <span className="text-xs font-heading font-black text-black">
            Daftar Mata Kuliah Terdaftar ({filteredCourses.length})
          </span>
          <span className="text-xs font-mono font-bold text-black bg-white px-2.5 py-0.5 rounded border border-black">
            Total SKS Terfilter: {filteredCourses.reduce((acc, c) => acc + c.credits, 0)} SKS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-neutral-100 font-mono text-black uppercase">
                <th className="p-3.5 font-bold">Kode</th>
                <th className="p-3.5 font-bold">Nama Mata Kuliah</th>
                <th className="p-3.5 font-bold text-center">SKS</th>
                <th className="p-3.5 font-bold text-center">Semester</th>
                <th className="p-3.5 font-bold">Sifat</th>
                <th className="p-3.5 font-bold">Prasyarat Langsung</th>
                <th className="p-3.5 font-bold">Alias Kode</th>
              </tr>
            </thead>
            <tbody className="divide-y border-black font-sans">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-black/60 font-medium">
                    Tidak ada mata kuliah yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-black">{c.code}</td>
                    <td className="p-3.5 font-bold text-black">{c.name}</td>
                    <td className="p-3.5 font-mono font-bold text-center text-black">{c.credits}</td>
                    <td className="p-3.5 font-mono font-bold text-center text-black">Sem {c.semester}</td>
                    <td className="p-3.5 font-medium">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold border ${
                          c.is_mandatory
                            ? 'bg-gray-soft text-black border-black'
                            : 'bg-white text-black/70 border-black/30'
                        }`}
                      >
                        {c.is_mandatory ? 'Wajib' : 'Pilihan'}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium">
                      {c.prerequisite_code || c.prerequisite_id ? (
                        <div className="flex items-center gap-1.5 text-black font-bold">
                          <GitFork className="h-3.5 w-3.5 text-black/70" />
                          <span>{c.prerequisite_code || 'MK Prasyarat'}</span>
                          {c.prerequisite_name && (
                            <span className="text-black/60 font-normal">({c.prerequisite_name})</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-black/40 font-mono">-</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-black/70">
                      {(c.aliases || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.aliases?.map((a) => (
                            <span key={a} className="bg-gray-soft px-1.5 py-0.5 rounded border border-black/30 text-[11px]">
                              {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-black/40">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Ubah MK */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border-2 border-black bg-white p-6 shadow-retro space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className="font-heading font-black text-lg text-black">Tambah Mata Kuliah Baru</h3>
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

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black mb-1">Kode Mata Kuliah</label>
                  <input
                    type="text"
                    placeholder="Contoh: STI2544139"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-xl border-2 border-black bg-white p-2.5 font-medium text-black focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-black mb-1">Bobot SKS</label>
                  <select
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full rounded-xl border-2 border-black bg-white p-2.5 font-medium text-black focus:outline-hidden"
                  >
                    {[1, 2, 3, 4, 6].map((s) => (
                      <option key={s} value={s}>
                        {s} SKS
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Nama Mata Kuliah</label>
                <input
                  type="text"
                  placeholder="Contoh: Pemrograman Mobile & IoT"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border-2 border-black bg-white p-2.5 font-medium text-black focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black mb-1">Semester Paket</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full rounded-xl border-2 border-black bg-white p-2.5 font-medium text-black focus:outline-hidden"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-black mb-1">Sifat Mata Kuliah</label>
                  <select
                    value={formData.is_mandatory ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.value === 'true' })}
                    className="w-full rounded-xl border-2 border-black bg-white p-2.5 font-medium text-black focus:outline-hidden"
                  >
                    <option value="true">Wajib Prodi</option>
                    <option value="false">Pilihan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-black mb-1">
                  Mata Kuliah Prasyarat (Opsional — Divalidasi Anti-Siklus)
                </label>
                <select
                  value={formData.prerequisite_id}
                  onChange={(e) => setFormData({ ...formData, prerequisite_id: e.target.value })}
                  className="w-full rounded-xl border-2 border-black bg-white p-2.5 font-medium text-black focus:outline-hidden"
                >
                  <option value="">-- Tidak Ada Prasyarat --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name} (Sem {c.semester})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-black/60 mt-1">
                  Sistem otomatis menolak prasyarat jika membentuk rantai melingkar (contoh: A butuh B, B butuh A).
                </p>
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
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl border-2 border-black bg-black font-bold text-xs text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shadow-retro"
                >
                  {isSubmitting ? 'Memeriksa & Menyimpan…' : 'Simpan Mata Kuliah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
