import React from 'react';
import Link from 'next/link';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listMasterDataAction, listMyClassesAction } from '@/modules/academic/actions';
import {
  GoogleClassroomCard,
  ClassroomToolbar,
  ClassroomTodoListBanner,
} from '@/modules/academic/classroom-cards';
import { getStudentPendingEvaluationsAction } from '@/modules/academic/evaluation-actions';
import { StudentEdomBanner } from '@/modules/academic/student-edom-banner';
import { Layers, FolderArchive } from 'lucide-react';
import { ClassCloneModal } from '@/modules/academic/class-clone-modal';

export default async function ClassesPage({
  searchParams,
}: {
  searchParams?: { q?: string; tab?: 'aktif' | 'arsip' };
}) {
  const ctx = await getCurrentUserWithRoles();
  const lecturer =
    ctx?.activeRole === 'LECTURER' ||
    ctx?.activeRole === 'SUPER_ADMIN' ||
    ctx?.activeRole === 'SYSTEM_ADMIN';
  const student = ctx?.activeRole === 'STUDENT';
  const isStaff =
    ctx?.activeRole === 'ACADEMIC_STAFF' || ctx?.activeRole === 'SUPER_ADMIN';
  const currentTab = searchParams?.tab === 'arsip' ? 'arsip' : 'aktif';

  const rawClasses = await listMyClassesAction();
  const allClasses = rawClasses.filter((c: any) =>
    currentTab === 'arsip' ? c.status === 'ARCHIVED' : c.status !== 'ARCHIVED'
  );

  const q = searchParams?.q?.toLowerCase().trim();
  const classes = q
    ? allClasses.filter(
        (c: any) =>
          c.title?.toLowerCase().includes(q) ||
          c.course_title?.toLowerCase().includes(q) ||
          c.course_code?.toLowerCase().includes(q) ||
          c.lecturer_name?.toLowerCase().includes(q) ||
          c.section?.toLowerCase().includes(q) ||
          c.join_code?.toLowerCase().includes(q)
      )
    : allClasses;
  const master = lecturer ? await listMasterDataAction() : null;
  const evalData = student
    ? await getStudentPendingEvaluationsAction().catch(() => null)
    : null;

  const totalSks = classes.reduce((acc: number, c: any) => acc + (Number(c.sks) || 3), 0);
  const totalMembers = classes.reduce((acc: number, c: any) => acc + (Number(c.members) || 0), 0);

  const roleLabel =
    ctx?.activeRole === 'LECTURER'
      ? 'Dosen Pengampu'
      : ctx?.activeRole === 'TEACHING_ASSISTANT'
      ? 'Asisten Perkuliahan'
      : isStaff
      ? 'Administrator Akademik'
      : 'Mahasiswa';

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
      <div className="max-w-[1360px] mx-auto space-y-5">
        {/* 1. HEADER HALAMAN: KELAS SAYA & MODE PERAN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-[#1C1917] flex items-center gap-2.5">
                <Layers className="h-6 w-6 sm:h-7 sm:w-7 text-[#C2553A] inline-block" />
                <span>Direktori Kelas Perkuliahan</span>
              </h1>
              <span className="px-2.5 py-0.5 border-2 border-[#7A756D] bg-[#ECE9D8] text-[#1C1917] font-mono font-black text-[11px] uppercase tracking-wider shadow-retro-xs">
                Mode: {roleLabel}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#57534E] font-medium">
              {lecturer
                ? 'Pusat kendali perkuliahan Dosen: kelola silabus, publikasi materi & tugas, verifikasi presensi, dan evaluasi nilai rombongan belajar.'
                : student
                ? 'Ruang belajar digital terpadu: akses modul kuliah, pantau tenggat penugasan, rekam presensi kehadiran, dan diskusi kelas.'
                : 'Direktori pemantauan operasional kelas, pendampingan asisten, dan administrasi akademik semester aktif.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Tab Filter Aktif / Arsip */}
            <div className="inline-flex border-2 border-[#7A756D] bg-[#FFFFFF] p-1 shadow-retro-xs">
              <Link
                href="/classes?tab=aktif"
                className={`px-3.5 py-1 text-xs font-black transition-all ${
                  currentTab === 'aktif'
                    ? 'bg-[#1C1917] text-white shadow-retro-xs'
                    : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5]'
                }`}
              >
                Semester Aktif
              </Link>
              <Link
                href="/classes?tab=arsip"
                className={`px-3.5 py-1 text-xs font-black transition-all ${
                  currentTab === 'arsip'
                    ? 'bg-[#1C1917] text-white shadow-retro-xs'
                    : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5]'
                }`}
              >
                Arsip Kelas
              </Link>
            </div>

            {(lecturer || isStaff) && (
              <ClassCloneModal myClasses={rawClasses} />
            )}
          </div>
        </div>

        {/* 2. RINGKASAN STATISTIK MULTI-PERAN (DOSEN / ASISTEN / ADMIN / MAHASISWA) */}
        <ClassroomTodoListBanner
          roleLabel={roleLabel}
          isLecturer={lecturer || isStaff}
          totalClasses={classes.length}
          totalSks={totalSks}
          totalMembers={totalMembers}
        />

        {/* 3. TOOLBAR INTERAKTIF: PENCARIAN & FORM TAMBAH / GABUNG KELAS */}
        <ClassroomToolbar
          lecturer={lecturer}
          student={student}
          master={master}
          totalClasses={classes.length}
          initialQuery={searchParams?.q || ''}
        />

        {/* BANNER KUESIONER EDOM UNTUK MAHASISWA (JIKA ADA) */}
        {student && evalData?.period && evalData.pendingClasses.length > 0 && (
          <StudentEdomBanner
            period={evalData.period}
            pendingClasses={evalData.pendingClasses}
          />
        )}

        {/* PITA INFORMASI KELAS ARSIP */}
        {currentTab === 'arsip' && (
          <div className="p-3 sm:p-3.5 border-2 border-[#7A756D] bg-[#FAF8F5] text-[#1C1917] font-bold text-xs flex items-center gap-2.5 shadow-retro-sm">
            <FolderArchive className="h-4 w-4 shrink-0 text-[#C2553A]" />
            <span>Kelas dalam tab ini sudah diarsipkan dan berada dalam mode baca-saja (read-only).</span>
          </div>
        )}

        {/* 4. GRID KARTU DOSSIER KELAS (3 KOLOM PROPORSIONAL & DETAIL) */}
        <section aria-label="Daftar Kelas Perkuliahan">
          {classes.length === 0 ? (
            <div className="p-10 sm:p-14 text-center border-2 border-dashed border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm space-y-3">
              <FolderArchive className="h-10 w-10 sm:h-12 sm:w-12 text-[#7A756D] mx-auto" />
              <h3 className="text-base sm:text-lg font-heading font-black text-[#1C1917]">
                Belum Ada Kelas Terdaftar
              </h3>
              <p className="text-xs sm:text-sm text-[#57534E] font-medium max-w-md mx-auto leading-relaxed">
                {lecturer
                  ? 'Gunakan tombol Buka Kelas Baru pada bilah komando di atas untuk membuat rombongan belajar baru.'
                  : 'Gunakan tombol Gabung via Kode Kelas di atas untuk masuk ke kelas menggunakan kode dari Dosen Pengampu.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {classes.map((k, i) => (
                <GoogleClassroomCard
                  key={k.id}
                  item={{
                    ...k,
                    upcomingTask:
                      i % 2 === 0
                        ? {
                            title: `Tugas Terstruktur ${i + 1}: Studi Kasus ${k.title.split(' ')[0]}`,
                            due_at: new Date(Date.now() + 86400000 * (2 + i)).toISOString(),
                          }
                        : null,
                  }}
                  isLecturer={lecturer || isStaff}
                  index={i}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
