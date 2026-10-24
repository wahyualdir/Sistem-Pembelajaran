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

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
      <div className="max-w-[1360px] mx-auto space-y-6">
        {/* 1. HEADER HALAMAN: KELAS SAYA & UTILITAS GLOBAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-[#1C1917] flex items-center gap-2.5">
              <Layers className="h-6 w-6 sm:h-7 sm:w-7 text-[#C2553A] inline-block" />
              <span>Kelas Saya</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#57534E] font-medium">
              {lecturer
                ? 'Kelola rombongan belajar Anda, bagikan materi kuliah, pantau penugasan, dan buka sesi tatap muka daring.'
                : student
                ? 'Pusat pembelajaran digital, pengumpulan tugas, kuis CBT, dan presensi perkuliahan mahasiswa.'
                : 'Pantau kelas perkuliahan dan pendampingan mahasiswa aktif.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Tab Filter Aktif / Arsip */}
            <div className="inline-flex rounded-full border-2 border-[#7A756D] bg-[#FFFFFF] p-1 shadow-retro-xs">
              <Link
                href="/classes?tab=aktif"
                className={`px-3.5 py-1 rounded-full text-xs font-black transition-all ${
                  currentTab === 'aktif'
                    ? 'bg-[#1C1917] text-white shadow-retro-xs'
                    : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5]'
                }`}
              >
                Aktif
              </Link>
              <Link
                href="/classes?tab=arsip"
                className={`px-3.5 py-1 rounded-full text-xs font-black transition-all ${
                  currentTab === 'arsip'
                    ? 'bg-[#1C1917] text-white shadow-retro-xs'
                    : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5]'
                }`}
              >
                Arsip
              </Link>
            </div>

            {(lecturer || isStaff) && (
              <ClassCloneModal myClasses={rawClasses} />
            )}
          </div>
        </div>

        {/* 2. STRIP GOOGLE CLASSROOM: HARUS DIKUMPULKAN SEGERA (TO-DO) */}
        <ClassroomTodoListBanner />

        {/* 3. TOOLBAR INTERAKTIF: HEADER KELAS, PENCARIAN & FORM TAMBAH KELAS */}
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
            <span>Kelas ini sudah diarsipkan dan hanya bisa dibaca (read-only).</span>
          </div>
        )}

        {/* 4. GRID KARTU KELAS (RESPONSIF 3-4 KOLOM IDENTIK DENGAN GOOGLE CLASSROOM) */}
        <section aria-label="Daftar Kelas Perkuliahan">
          {classes.length === 0 ? (
            <div className="p-10 sm:p-14 text-center border-2 border-dashed border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm space-y-3">
              <FolderArchive className="h-10 w-10 sm:h-12 sm:w-12 text-[#7A756D] mx-auto" />
              <h3 className="text-base sm:text-lg font-heading font-black text-[#1C1917]">
                Belum Ada Kelas Terdaftar
              </h3>
              <p className="text-xs sm:text-sm text-[#57534E] font-medium max-w-md mx-auto leading-relaxed">
                {lecturer
                  ? 'Gunakan tombol Tambahkan kelas di atas untuk membuka rombongan belajar baru Anda.'
                  : 'Gunakan tombol Tambahkan kelas di atas untuk mendaftar ke kelas dengan kode dari dosen.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {classes.map((k, i) => (
                <GoogleClassroomCard
                  key={k.id}
                  item={{
                    ...k,
                    upcomingTask:
                      i % 2 === 0
                        ? {
                            title: `Tugas ${i + 1}: Analisis Kasus ${k.title.split(' ')[0]}`,
                            due_at: new Date(Date.now() + 86400000 * (2 + i)).toISOString(),
                          }
                        : null,
                  }}
                  isLecturer={lecturer}
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
