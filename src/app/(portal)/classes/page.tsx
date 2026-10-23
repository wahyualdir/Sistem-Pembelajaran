import React from 'react';
import Link from 'next/link';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listMasterDataAction, listMyClassesAction } from '@/modules/academic/actions';
import { CreateClassForm, JoinClassForm } from '@/modules/academic/class-forms';
import { RetroWindow } from '@/components/retro/retro-window';
import { GoogleClassroomCard, ClassroomToolbar } from '@/modules/academic/classroom-cards';
import { getStudentPendingEvaluationsAction } from '@/modules/academic/evaluation-actions';
import { StudentEdomBanner } from '@/modules/academic/student-edom-banner';
import {
  Layers,
  BookOpen,
  ArrowRight,
  GraduationCap,
  PlusCircle,
  Key,
  FolderArchive,
} from 'lucide-react';

import { ClassCloneModal } from '@/modules/academic/class-clone-modal';

export default async function ClassesPage({
  searchParams,
}: {
  searchParams?: { q?: string; tab?: 'aktif' | 'arsip' };
}) {
  const ctx = await getCurrentUserWithRoles();
  const lecturer = ctx?.activeRole === 'LECTURER' || ctx?.activeRole === 'SUPER_ADMIN' || ctx?.activeRole === 'SYSTEM_ADMIN';
  const student = ctx?.activeRole === 'STUDENT';
  const ta = ctx?.activeRole === 'TEACHING_ASSISTANT';
  const isStaff = ctx?.activeRole === 'ACADEMIC_STAFF' || ctx?.activeRole === 'SUPER_ADMIN';
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
  const evalData = student ? await getStudentPendingEvaluationsAction().catch(() => null) : null;

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER HALAMAN: KELAS SAYA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <Layers className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Kelas Saya
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              {lecturer
                ? 'Kelola rombongan belajar Anda, publikasikan materi & tugas, serta bagikan kode pendaftaran kelas kepada mahasiswa.'
                : student
                ? 'Akses materi kuliah, kumpulkan tugas tepat waktu, ikuti kuis CBT, dan pantau kehadiran perkuliahan Anda.'
                : 'Pantau rombongan belajar dan submisi tugas di kelas tempat Anda bertugas.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex rounded-full border-2 border-ink bg-surface p-1 shadow-xs">
              <Link
                href="/classes?tab=aktif"
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  currentTab === 'aktif'
                    ? 'bg-ink text-white shadow-retro'
                    : 'text-ink hover:bg-gray-soft'
                }`}
              >
                Aktif
              </Link>
              <Link
                href="/classes?tab=arsip"
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  currentTab === 'arsip'
                    ? 'bg-ink text-white shadow-retro'
                    : 'text-ink hover:bg-gray-soft'
                }`}
              >
                Arsip
              </Link>
            </div>

            {(lecturer || isStaff) && (
              <ClassCloneModal myClasses={rawClasses} />
            )}

            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              {classes.length} KELAS
            </span>
          </div>
        </div>

        {/* Toolbar Interaktif: Pencarian & Form Tambah/Gabung Kelas */}
        <div className="rounded-xl border-2 border-ink bg-surface p-4 sm:p-5 shadow-retro">
          <ClassroomToolbar
            lecturer={lecturer}
            student={student}
            master={master}
            totalClasses={classes.length}
            initialQuery={searchParams?.q || ''}
          />
        </div>

        {/* BANNER KUESIONER EDOM UNTUK MAHASISWA */}
        {student && evalData?.period && evalData.pendingClasses.length > 0 && (
          <StudentEdomBanner
            period={evalData.period}
            pendingClasses={evalData.pendingClasses}
          />
        )}

        {/* PITA INFORMASI KELAS ARSIP */}
        {currentTab === 'arsip' && (
          <div className="p-3.5 rounded-xl border-2 border-ink bg-gray-soft text-ink font-bold text-xs flex items-center gap-2.5 shadow-retro">
            <FolderArchive className="h-4 w-4 shrink-0 text-primary" />
            <span>Kelas ini sudah diarsipkan dan hanya bisa dibaca.</span>
          </div>
        )}

        {/* 2. GRID KARTU KELAS */}
        <section aria-label="Daftar Kelas Perkuliahan" className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-ink pb-2.5">
            <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-ink flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary inline-block" />
              <span>Daftar Kelas Perkuliahan</span>
            </h2>
            <span className="text-xs sm:text-sm font-bold text-gray-dark">
              {currentTab === 'arsip' ? 'Arsip Kelas Lampau' : 'Semester Ganjil 2026/2027'}
            </span>
          </div>

          {classes.length === 0 ? (
            <div className="p-10 sm:p-14 text-center rounded-xl border-2 border-dashed border-ink bg-surface/50 shadow-retro space-y-3">
              <FolderArchive className="h-10 w-10 sm:h-12 sm:w-12 text-gray-dark mx-auto" />
              <h3 className="text-base sm:text-lg font-heading font-bold text-ink">Belum Ada Kelas Terdaftar</h3>
              <p className="text-xs sm:text-sm text-gray-dark font-medium max-w-md mx-auto leading-relaxed">
                {lecturer
                  ? 'Gunakan tombol Buat Kelas Baru di atas untuk membuka kelas pertama Anda.'
                  : 'Gunakan tombol Gabung Kelas dengan Kode untuk mendaftar ke kelas perkuliahan dosen Anda.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {classes.map((k, i) => (
                <GoogleClassroomCard
                  key={k.id}
                  item={{
                    ...k,
                    upcomingTask: {
                      title: `Tugas ${i + 1}: Analisis & Studi Kasus ${k.title.split(' ')[0]}`,
                      due_at: new Date(Date.now() + 86400000 * (3 + i)).toISOString(),
                    },
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
