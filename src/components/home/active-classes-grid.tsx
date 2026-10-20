'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, Award, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveClassItem } from '@/modules/academic/home-actions';

interface ActiveClassesGridProps {
  courses: ActiveClassItem[];
  selectedCourse?: ActiveClassItem;
  onSelectCourse: (course: ActiveClassItem) => void;
}

export function ActiveClassesGrid({
  courses,
  selectedCourse,
  onSelectCourse,
}: ActiveClassesGridProps) {
  const [savedCourses, setSavedCourses] = useState<Record<string, boolean>>({
    'course-1': true,
  });

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedCourses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section aria-label="Mata Kuliah Aktif" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink">
          Kelas Aktif
        </h2>
        <Link
          href="/classes"
          className="text-base sm:text-lg font-bold text-primary-dark hover:text-ink transition-colors"
        >
          more &rarr;
        </Link>
      </div>

      {/* TAMPILAN KOSONG UNTUK AKUN BARU ATAU GRID KELAS */}
      {courses.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-ink bg-surface/50 p-8 text-center space-y-3">
          <FileText className="h-10 w-10 text-gray-dark mx-auto" />
          <p className="font-heading font-bold text-lg text-ink">
            Belum Ada Kelas yang Diikuti
          </p>
          <p className="text-xs sm:text-sm text-gray-dark font-bold max-w-md mx-auto">
            Sebagai mahasiswa baru, Anda belum terdaftar pada kelas mata kuliah apa pun. Buka menu Kelas Saya untuk bergabung ke rombongan belajar dosen Anda.
          </p>
          <div className="pt-2">
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-ink bg-ink text-white hover:bg-ink/90 text-xs sm:text-sm font-bold shadow-retro transition-all"
            >
              <span>Buka Kelas Saya</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {courses.map((course) => {
            const isSelected = selectedCourse?.id === course.id;
            const isSaved = !!savedCourses[course.id];

          return (
              <div
                key={course.id}
                onClick={() => onSelectCourse(course)}
                className={cn(
                  'reveal-scale group cursor-pointer rounded-xl border-2 border-ink bg-gray-soft p-4 sm:p-5 transition-all flex flex-col justify-between',
                  isSelected
                    ? 'shadow-retro-lg ring-2 ring-ink bg-surface border-b-4 border-b-primary'
                    : 'shadow-retro hover:-translate-y-1 hover:shadow-retro-md'
                )}
              >
                {/* Retro Book Cover Graphic (Monokrom & Warm Cream Elegan) */}
                <div
                  className={cn(
                    'relative w-full aspect-[3/4.2] rounded-lg border-2 border-ink overflow-hidden mb-4 p-5 flex flex-col justify-between transition-transform group-hover:scale-[1.02]',
                    course.colorScheme === 'yellow' ? 'bg-surface text-ink' : 'bg-ink text-white'
                  )}
                >
                {/* Vintage Book Frame Border */}
                <div
                  className={cn(
                    'absolute inset-2.5 border-2 rounded-lg pointer-events-none',
                    course.colorScheme === 'yellow' ? 'border-ink/25' : 'border-white/30'
                  )}
                />

                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-sans font-bold uppercase tracking-wider block">
                      {course.code}
                    </span>

                    {/* Penanda kecil jika ada tugas atau ujian yang belum selesai */}
                    {course.hasOpenExam && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-sans font-bold bg-primary-dark text-white border border-ink shadow-xs">
                        <Award className="h-3 w-3" />
                        <span>UJIAN</span>
                      </span>
                    )}
                    {!course.hasOpenExam && course.pendingTasksCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-sans font-bold bg-gray-soft text-ink border border-ink shadow-xs">
                        <FileText className="h-3 w-3" />
                        <span>{course.pendingTasksCount} Tugas</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading font-bold text-lg sm:text-xl leading-snug line-clamp-3 break-normal">
                    {course.title}
                  </h3>
                </div>

                <div
                  className={cn(
                    'relative z-10 pt-4 border-t-2',
                    course.colorScheme === 'yellow' ? 'border-ink/30' : 'border-white/30'
                  )}
                >
                  <p className="text-base sm:text-lg font-bold truncate">
                    {course.lecturer}
                  </p>
                  <span className="text-sm font-sans font-bold uppercase mt-1 block">
                    {course.sks} SKS
                  </span>
                </div>
              </div>

              {/* Info Bawah Cover (Footer Kartu) */}
              <div className="space-y-3">
                <h4 className="font-heading font-bold text-xl sm:text-2xl text-ink line-clamp-2 leading-snug group-hover:underline transition-colors">
                  {course.title}
                </h4>
                <p className="text-base sm:text-lg text-gray-dark font-bold break-words">
                  {course.lecturer}
                </p>

                {/* Progres Belajar Menggantikan Rating Bintang (Bagian 4.5) */}
                <div className="pt-3 border-t border-ink/15 space-y-2">
                  <div className="flex items-center justify-between text-ink">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider font-sans text-gray-dark">
                      Progres Belajar
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-bold font-sans text-ink">
                        {course.progressPercent}%
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleSave(course.id, e)}
                        className="text-ink hover:scale-110 transition-transform p-1 rounded-lg hover:bg-surface"
                        title="Simpan mata kuliah"
                      >
                        <Bookmark
                          className={cn('h-5 w-5', isSaved ? 'fill-current text-primary-dark' : '')}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Bar Progres Tipis Bergaya Hitam Solid */}
                  <div className="w-full h-2 rounded-full border border-ink bg-surface overflow-hidden">
                    <div
                      className="bg-ink h-full rounded-full transition-all duration-500"
                      style={{ width: `${course.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
