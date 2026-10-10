import React from 'react';
import {
  createCourseAction,
  createProgramAction,
  createSemesterAction,
  listMasterDataAction,
} from '@/modules/academic/actions';
import { QuickAdd } from '@/modules/academic/quick-add';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  FileSpreadsheet,
  GraduationCap,
  CalendarDays,
  BookOpen,
  PlusCircle,
  Layers,
  Database,
} from 'lucide-react';

export default async function StaffPortalPage() {
  const { programs, semesters, courses } = await listMasterDataAction();

  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW STAF AKADEMIK */}
      <RetroWindow
        title="staf_master_data_akademik.portal"
        badge="ROLE: STAF AKADEMIK"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-6 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg border-[1.5px] border-retro-border bg-retro-orange text-white shadow-xs">
                <Database className="h-5 w-5" />
              </div>
              <h1 className="font-heading font-black text-2xl tracking-tight text-foreground">
                Master Data Akademik Kampus
              </h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl mt-1">
              Pengelolaan fondasi akademik: Program Studi, Semester Aktif, dan Katalog Mata Kuliah.
              Data yang dikelola di sini digunakan dosen dalam pembukaan kelas dan mahasiswa dalam pengisian KRS.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-retro-border bg-retro-warm px-3 py-1 text-xs font-mono font-bold text-foreground">
              BAAK UIR
            </span>
          </div>
        </div>

        {/* 3 Kartu Metrik Ringkasan Data Master */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-retro-border/40 mt-5">
          <div className="p-3.5 rounded-lg border border-retro-border bg-retro-warm/70 shadow-xs flex items-center gap-3">
            <div className="p-2 rounded border border-retro-border bg-retro-surface text-retro-orange">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Program Studi</p>
              <p className="font-heading font-black text-2xl text-foreground leading-tight">{programs.length}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-retro-border bg-retro-yellow/40 shadow-xs flex items-center gap-3">
            <div className="p-2 rounded border border-retro-border bg-retro-surface text-foreground">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold text-foreground uppercase">Semester Akademik</p>
              <p className="font-heading font-black text-2xl text-foreground leading-tight">{semesters.length}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-retro-border bg-retro-mint/40 shadow-xs flex items-center gap-3">
            <div className="p-2 rounded border border-retro-border bg-retro-surface text-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold text-foreground uppercase">Katalog Mata Kuliah</p>
              <p className="font-heading font-black text-2xl text-foreground leading-tight">{courses.length}</p>
            </div>
          </div>
        </div>
      </RetroWindow>

      {/* 2. PROGRAM STUDI & SEMESTER (2 KOLOM GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WINDOW 1: PROGRAM STUDI */}
        <RetroWindow
          title="master_program_studi.tbl"
          badge={`${programs.length} PRODI`}
          headerClassName="bg-retro-warm"
          bodyClassName="p-5 space-y-4"
        >
          <div className="space-y-1">
            <h2 className="font-heading font-black text-base text-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-retro-orange" />
              <span>Program Studi</span>
            </h2>
            <p className="text-xs text-muted-foreground">Tambah kode dan nama program studi baru.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-retro-border bg-retro-warm/40">
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
            <p className="text-[11px] font-mono font-bold text-muted-foreground uppercase">Daftar Prodi Terdaftar:</p>
            {programs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-retro-border rounded">
                Belum ada program studi.
              </p>
            ) : (
              <div className="divide-y divide-retro-border/30 border border-retro-border rounded-lg bg-retro-surface overflow-hidden">
                {programs.map((p) => (
                  <div key={p.id} className="p-3 flex items-center justify-between text-xs hover:bg-retro-warm/30 transition-colors">
                    <span className="font-bold text-foreground">{p.name}</span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-retro-warm border border-retro-border text-[10px]">
                      {p.code}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </RetroWindow>

        {/* WINDOW 2: SEMESTER AKADEMIK */}
        <RetroWindow
          title="master_semester_akademik.tbl"
          badge={`${semesters.length} PERIODE`}
          headerClassName="bg-retro-warm"
          bodyClassName="p-5 space-y-4"
        >
          <div className="space-y-1">
            <h2 className="font-heading font-black text-base text-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-retro-orange" />
              <span>Semester Akademik</span>
            </h2>
            <p className="text-xs text-muted-foreground">Tambah tahun dan periode semester perkuliahan.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-retro-border bg-retro-warm/40">
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
            <p className="text-[11px] font-mono font-bold text-muted-foreground uppercase">Daftar Semester Aktif & Arsip:</p>
            {semesters.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-retro-border rounded">
                Belum ada semester.
              </p>
            ) : (
              <div className="divide-y divide-retro-border/30 border border-retro-border rounded-lg bg-retro-surface overflow-hidden">
                {semesters.map((s) => (
                  <div key={s.id} className="p-3 flex items-center justify-between text-xs hover:bg-retro-warm/30 transition-colors">
                    <span className="font-bold text-foreground">{s.label}</span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-retro-mint text-black border border-retro-border text-[10px] shadow-xs">
                      AKTIF
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </RetroWindow>
      </div>

      {/* 3. WINDOW MATA KULIAH */}
      <RetroWindow
        title={`master_katalog_mata_kuliah.tbl (${courses.length} MATA KULIAH)`}
        badge="KURIKULUM"
        headerClassName="bg-retro-warm"
        bodyClassName="p-5 space-y-4"
      >
        <div className="space-y-1">
          <h2 className="font-heading font-black text-base text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-retro-orange" />
            <span>Katalog Mata Kuliah</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Entri mata kuliah lengkap dengan bobot SKS dan program studi penanggung jawab.
          </p>
        </div>

        {programs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-retro-border rounded">
            Harap tambahkan program studi terlebih dahulu sebelum memasukkan mata kuliah.
          </p>
        ) : (
          <div className="p-4 rounded-lg border border-retro-border bg-retro-warm/40">
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

        <div className="space-y-2">
          <p className="text-[11px] font-mono font-bold text-muted-foreground uppercase">Daftar Mata Kuliah Tersedia:</p>
          {courses.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-retro-border rounded">
              Belum ada mata kuliah terdaftar.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-lg border-[1.5px] border-retro-border bg-retro-surface shadow-retro hover:bg-retro-warm/30 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-retro-yellow text-black border border-retro-border px-2 py-0.5 rounded shadow-xs">
                      {c.code}
                    </span>
                    <span className="font-bold text-xs bg-retro-warm border border-retro-border px-2 py-0.5 rounded text-foreground">
                      {c.credits} SKS
                    </span>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-foreground leading-tight line-clamp-1">
                      {c.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono mt-1">
                      Prodi: {c.program_code}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </RetroWindow>
    </div>
  );
}
