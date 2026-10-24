import React from 'react';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { listMasterDataAction, listMyClassesAction } from '@/modules/academic/actions';
import {
  GoogleClassroomCard,
  ClassroomToolbar,
} from '@/modules/academic/classroom-cards';
import { getStudentPendingEvaluationsAction } from '@/modules/academic/evaluation-actions';
import { StudentEdomBanner } from '@/modules/academic/student-edom-banner';
import { FolderArchive } from 'lucide-react';
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

  const roleLabel =
    ctx?.activeRole === 'LECTURER'
      ? 'Dosen Pengampu'
      : ctx?.activeRole === 'TEACHING_ASSISTANT'
      ? 'Asisten Perkuliahan'
      : isStaff
      ? 'Staf Akademik'
      : 'Mahasiswa';

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0 font-sans">
      <div className="max-w-[1360px] mx-auto space-y-5">
        {/* 1. UNIFIED TOP BAR: JUDUL, RINGKASAN PILL, TAB AKTIF/ARSIP, PENCARIAN & TOMBOL KELAS */}
        <ClassroomToolbar
          lecturer={lecturer}
          student={student}
          master={master}
          totalClasses={classes.length}
          initialQuery={searchParams?.q || ''}
          totalSks={totalSks}
          roleLabel={roleLabel}
          currentTab={currentTab}
          cloneSlot={(lecturer || isStaff) ? <ClassCloneModal myClasses={rawClasses} /> : null}
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
          <div className="p-3.5 rounded-xl border border-[#D6D3CB] bg-[#FAF8F5] text-[#1C1917] font-semibold text-xs flex items-center gap-2.5">
            <FolderArchive className="h-4 w-4 shrink-0 text-[#C2553A]" />
            <span>Kelas dalam tab ini sudah diarsipkan dan berada dalam mode baca-saja (read-only).</span>
          </div>
        )}

        {/* 2. GRID KARTU KELAS CLEAN SOFT-HEADER (FRESH & LEGA) */}
        <section aria-label="Daftar Kelas Perkuliahan">
          {classes.length === 0 ? (
            <div className="p-10 sm:p-14 text-center rounded-2xl border border-dashed border-[#D6D3CB] bg-[#FAF8F5] space-y-3">
              <FolderArchive className="h-10 w-10 text-[#7A756D] mx-auto" />
              <h3 className="text-base sm:text-lg font-heading font-black text-[#1C1917]">
                Belum Ada Kelas Terdaftar
              </h3>
              <p className="text-xs sm:text-sm text-[#6B6560] max-w-md mx-auto leading-relaxed">
                {lecturer
                  ? 'Gunakan tombol Buka Kelas di sudut kanan atas untuk membuat rombongan belajar baru.'
                  : 'Gunakan tombol Gabung Kelas di sudut kanan atas untuk masuk menggunakan kode dari Dosen Pengampu.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {classes.map((k, i) => (
                <GoogleClassroomCard
                  key={k.id}
                  item={k}
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
