import React from 'react';
import {
  createCourseAction,
  createProgramAction,
  createSemesterAction,
  listMasterDataAction,
} from '@/modules/academic/actions';
import { QuickAdd } from '@/modules/academic/quick-add';
import {
  GraduationCap,
  CalendarDays,
  BookOpen,
  Database,
} from 'lucide-react';

import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

export default async function StaffPortalPage() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;

  if (role === 'SYSTEM_ADMIN') {
    redirect('/admin/system');
  }
  if (role === 'SUPER_ADMIN' && !user?.isImpersonating) {
    redirect('/admin');
  }
  if (role === 'STUDENT') {
    redirect('/student');
  }
  if (role === 'LECTURER') {
    redirect('/lecturer');
  }
  if (role === 'PROGRAM_COORDINATOR') {
    redirect('/coordinator');
  }
  if (role === 'TEACHING_ASSISTANT') {
    redirect('/ta');
  }

  const { programs, semesters, courses } = await listMasterDataAction();

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* OPEN HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <Database className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Master Data Akademik Kampus
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Pengelolaan fondasi akademik: Program Studi, Semester Aktif, dan Katalog Mata Kuliah.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-primary text-white border-2 border-ink shadow-xs">
              ROLE: STAF AKADEMIK
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              BAAK UIR
            </span>
          </div>
        </div>

        {/* 3 KARTU METRIK RINGKASAN */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg border-2 border-ink bg-primary text-white shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">Program Studi</p>
              <p className="font-heading font-bold text-2xl text-ink leading-tight">{programs.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg border-2 border-ink bg-gray-soft text-ink shadow-xs">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-sans font-bold text-ink uppercase tracking-wider">Semester Akademik</p>
              <p className="font-heading font-bold text-2xl text-ink leading-tight">{semesters.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg border-2 border-ink bg-surface text-ink shadow-xs">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-sans font-bold text-ink uppercase tracking-wider">Katalog Mata Kuliah</p>
              <p className="font-heading font-bold text-2xl text-ink leading-tight">{courses.length}</p>
            </div>
          </div>
        </div>

        {/* 2 KOLOM GRID: PROGRAM STUDI & SEMESTER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* WINDOW 1: PROGRAM STUDI */}
          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
              <div className="space-y-0.5">
                <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span>Program Studi</span>
                </h2>
                <p className="text-xs text-gray-dark font-bold">Tambah kode dan nama program studi baru.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full border-2 border-ink bg-gray-soft text-xs font-sans font-bold text-ink shadow-xs">
                {programs.length} PRODI
              </span>
            </div>

            <div className="p-3.5 rounded-xl border-2 border-ink bg-gray-soft/40 shadow-xs">
              <QuickAdd
                action={createProgramAction}
                submitLabel="Tambah Program Studi"
                okMessage="Program studi berhasil ditambahkan."
                fields={[
                  { name: 'code', label: 'Kode', placeholder: 'TI', narrow: true },
                  { name: 'name', label: 'Nama Program Studi', placeholder: 'Teknik Informatika', grow: true },
                ]}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">Daftar Prodi Terdaftar:</p>
              {programs.length === 0 ? (
                <p className="text-xs text-gray-dark font-bold py-4 text-center border-2 border-dashed border-ink/30 rounded-xl">
                  Belum ada program studi.
                </p>
              ) : (
                <div className="divide-y-2 divide-ink/20 border-2 border-ink rounded-xl bg-surface overflow-hidden shadow-xs">
                  {programs.map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between text-xs font-sans hover:bg-gray-soft/30 transition-colors">
                      <span className="font-bold text-ink text-sm">{p.name}</span>
                      <span className="font-sans font-bold px-2 py-0.5 rounded-full bg-gray-soft border-2 border-ink text-xs text-ink shadow-xs">
                        {p.code}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* WINDOW 2: SEMESTER AKADEMIK */}
          <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
              <div className="space-y-0.5">
                <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <span>Semester Akademik</span>
                </h2>
                <p className="text-xs text-gray-dark font-bold">Tambah tahun dan periode semester perkuliahan.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full border-2 border-ink bg-gray-soft text-xs font-sans font-bold text-ink shadow-xs">
                {semesters.length} PERIODE
              </span>
            </div>

            <div className="p-3.5 rounded-xl border-2 border-ink bg-gray-soft/40 shadow-xs">
              <QuickAdd
                action={createSemesterAction}
                submitLabel="Tambah Semester"
                okMessage="Semester berhasil ditambahkan."
                fields={[
                  { name: 'label', label: 'Label Semester', placeholder: '2026/2027 Ganjil', grow: true },
                ]}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">Daftar Semester Aktif & Arsip:</p>
              {semesters.length === 0 ? (
                <p className="text-xs text-gray-dark font-bold py-4 text-center border-2 border-dashed border-ink/30 rounded-xl">
                  Belum ada semester.
                </p>
              ) : (
                <div className="divide-y-2 divide-ink/20 border-2 border-ink rounded-xl bg-surface overflow-hidden shadow-xs">
                  {semesters.map((s) => (
                    <div key={s.id} className="p-3 flex items-center justify-between text-xs font-sans hover:bg-gray-soft/30 transition-colors">
                      <span className="font-bold text-ink text-sm">{s.label}</span>
                      <span className="font-sans font-bold px-2 py-0.5 rounded-full bg-surface text-ink border-2 border-ink text-xs shadow-xs">
                        AKTIF
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. WINDOW MATA KULIAH */}
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro space-y-4">
          <div className="flex items-center justify-between border-b-2 border-ink/20 pb-3">
            <div className="space-y-0.5">
              <h2 className="font-heading font-bold text-base sm:text-lg text-ink flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>Katalog Mata Kuliah</span>
              </h2>
              <p className="text-xs text-gray-dark font-bold">
                Entri mata kuliah lengkap dengan bobot SKS dan program studi penanggung jawab.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full border-2 border-ink bg-gray-soft text-xs font-sans font-bold text-ink shadow-xs">
              {courses.length} MATA KULIAH
            </span>
          </div>

          {programs.length === 0 ? (
            <p className="text-xs text-gray-dark font-bold py-6 text-center border-2 border-dashed border-ink/30 rounded-xl">
              Harap tambahkan program studi terlebih dahulu sebelum memasukkan mata kuliah.
            </p>
          ) : (
            <div className="p-4 rounded-xl border-2 border-ink bg-gray-soft/40 shadow-xs">
              <QuickAdd
                action={createCourseAction}
                submitLabel="Tambah Mata Kuliah"
                okMessage="Mata kuliah berhasil ditambahkan ke katalog."
                fields={[
                  {
                    name: 'program_id',
                    label: 'Program Studi',
                    options: programs.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` })),
                    grow: true,
                  },
                  { name: 'code', label: 'Kode MK', placeholder: 'TI-301', narrow: true },
                  { name: 'name', label: 'Nama Mata Kuliah', placeholder: 'Pemrograman Web Lanjut', grow: true },
                  { name: 'credits', label: 'SKS', type: 'number', placeholder: '3', narrow: true },
                ]}
              />
            </div>
          )}

          <div className="space-y-2 pt-2">
            <p className="text-xs font-sans font-bold text-gray-dark uppercase tracking-wider">Daftar Mata Kuliah Tersedia:</p>
            {courses.length === 0 ? (
              <p className="text-xs text-gray-dark font-bold py-6 text-center border-2 border-dashed border-ink/30 rounded-xl">
                Belum ada mata kuliah terdaftar.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border-2 border-ink bg-surface shadow-retro-sm hover:bg-gray-soft/20 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-bold text-xs bg-gray-soft text-ink border-2 border-ink px-2.5 py-0.5 rounded-full shadow-xs">
                        {c.code}
                      </span>
                      <span className="font-bold text-xs bg-surface border-2 border-ink px-2 py-0.5 rounded-full text-ink shadow-xs">
                        {c.credits} SKS
                      </span>
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-sm text-ink leading-tight line-clamp-1">
                        {c.name}
                      </h3>
                      <p className="text-xs text-gray-dark font-bold font-sans mt-1">
                        Prodi: {c.program_code}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
