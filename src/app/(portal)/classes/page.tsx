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

export default async function ClassesPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const ctx = await getCurrentUserWithRoles();
  const lecturer = ctx?.activeRole === 'LECTURER' || ctx?.activeRole === 'SUPER_ADMIN' || ctx?.activeRole === 'SYSTEM_ADMIN';
  const student = ctx?.activeRole === 'STUDENT';
  const ta = ctx?.activeRole === 'TEACHING_ASSISTANT';
  const allClasses = await listMyClassesAction();
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
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up font-sans">
      {/* 1. HEADER WINDOW UTAMA KELAS SAYA */}
      <RetroWindow
        title="Kelas Perkuliahan"
        badge={lecturer ? 'Dosen' : student ? 'Mahasiswa' : 'Asisten'}
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-white space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl border-2 border-black bg-primary text-white shadow-xs">
                <Layers className="h-6 w-6" />
              </div>
              <h1 className="font-bold text-2xl sm:text-3xl tracking-tight text-black">
                Kelas Saya
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-bold max-w-2xl mt-1 leading-relaxed">
              {lecturer
                ? 'Kelola rombongan belajar Anda, publikasikan materi & tugas, serta bagikan kode pendaftaran kelas kepada mahasiswa.'
                : student
                ? 'Akses materi kuliah, kumpulkan tugas tepat waktu, ikuti kuis CBT, dan pantau kehadiran perkuliahan Anda.'
                : 'Pantau rombongan belajar dan submisi tugas di kelas tempat Anda bertugas.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-xl border-2 border-black bg-gray-soft px-4 py-2 text-xs sm:text-sm font-bold text-black shadow-retro">
              {classes.length} Kelas Aktif
            </span>
          </div>
        </div>

        {/* Toolbar Interaktif: Pencarian & Form Tambah/Gabung Kelas */}
        <ClassroomToolbar
          lecturer={lecturer}
          student={student}
          master={master}
          totalClasses={classes.length}
        />
      </RetroWindow>

      {/* BANNER KUESIONER EDOM UNTUK MAHASISWA */}
      {student && evalData?.period && evalData.pendingClasses.length > 0 && (
        <StudentEdomBanner
          period={evalData.period}
          pendingClasses={evalData.pendingClasses}
        />
      )}

      {/* 2. GRID KARTU KELAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black/25 pb-3">
          <h2 className="font-bold text-lg sm:text-xl text-black flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Daftar Kelas Perkuliahan</span>
          </h2>
          <span className="text-xs sm:text-sm font-bold text-black">
            Semester Ganjil 2026/2027
          </span>
        </div>

        {classes.length === 0 ? (
          <div className="p-10 sm:p-14 text-center rounded-2xl border-2 border-dashed border-black bg-white shadow-retro space-y-3">
            <FolderArchive className="h-10 w-10 sm:h-12 sm:w-12 text-black/60 mx-auto" />
            <h3 className="text-lg font-bold text-black">Belum Ada Kelas Terdaftar</h3>
            <p className="text-xs sm:text-sm text-black font-bold max-w-md mx-auto leading-relaxed">
              {lecturer
                ? 'Gunakan tombol Buat Kelas Baru di atas untuk membuka kelas pertama Anda.'
                : 'Gunakan tombol Gabung Kelas dengan Kode untuk mendaftar ke kelas perkuliahan dosen Anda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
}
