'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, Award, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveClassItem } from '@/modules/academic/home-actions';

interface ActiveClassesGridProps {
  courses: ActiveClassItem[];
  selectedCourse: ActiveClassItem;
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
        <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-foreground">
          Kelas Aktif
        </h2>
        <Link
          href="/classes"
          className="text-base sm:text-lg font-black text-muted-foreground hover:text-foreground transition-colors"
        >
          more &rarr;
        </Link>
      </div>

      {/* GRID KELAS RESPONSIF & LEGA */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {courses.map((course) => {
          const isSelected = selectedCourse.id === course.id;
          const isSaved = !!savedCourses[course.id];

          return (
              <div
                key={course.id}
                onClick={() => onSelectCourse(course)}
                className={cn(
                  'group cursor-pointer rounded-xl border-2 border-retro-border bg-retro-surface p-4 sm:p-5 transition-all flex flex-col justify-between',
                  isSelected
                    ? 'shadow-retro-lg ring-2 ring-black bg-retro-warm/70'
                    : 'shadow-retro hover:-translate-y-1 hover:shadow-retro-md'
                )}
              >
                {/* Retro Book Cover Graphic (BESAR & JELAS - Layout DIBEKUKAN) */}
                <div
                  className={cn(
                    'relative w-full aspect-[3/4.2] rounded-lg border-2 border-retro-border overflow-hidden mb-4 p-5 flex flex-col justify-between transition-transform group-hover:scale-[1.02]',
                    course.colorScheme === 'yellow' ? 'bg-retro-yellow text-black' : 'bg-black text-white'
                  )}
                >
                {/* Vintage Book Frame Border */}
                <div
                  className={cn(
                    'absolute inset-2.5 border-2 rounded-lg pointer-events-none',
                    course.colorScheme === 'yellow' ? 'border-black/25' : 'border-white/30'
                  )}
                />

                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-sans font-black uppercase tracking-wider block">
                      {course.code}
                    </span>

                    {/* Penanda kecil jika ada tugas atau ujian yang belum selesai */}
                    {course.hasOpenExam && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-sans font-black bg-retro-orange text-white border border-black shadow-xs">
                        <Award className="h-3 w-3" />
                        <span>UJIAN</span>
                      </span>
                    )}
                    {!course.hasOpenExam && course.pendingTasksCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-sans font-black bg-retro-yellow text-black border border-black shadow-xs">
                        <FileText className="h-3 w-3" />
                        <span>{course.pendingTasksCount} Tugas</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading font-black text-lg sm:text-xl leading-snug line-clamp-3 break-normal">
                    {course.title}
                  </h3>
                </div>

                <div
                  className={cn(
                    'relative z-10 pt-4 border-t-2',
                    course.colorScheme === 'yellow' ? 'border-black/30' : 'border-white/30'
                  )}
                >
                  <p className="text-base sm:text-lg font-black truncate">
                    {course.lecturer}
                  </p>
                  <span className="text-sm font-sans font-black uppercase mt-1 block">
                    {course.sks} SKS
                  </span>
                </div>
              </div>

              {/* Info Bawah Cover */}
              <div className="space-y-3">
                <h4 className="font-heading font-black text-xl sm:text-2xl text-black line-clamp-2 leading-snug group-hover:underline transition-colors">
                  {course.title}
                </h4>
                <p className="text-base sm:text-lg text-black font-bold break-words">
                  {course.lecturer}
                </p>

                {/* Progres Belajar Menggantikan Rating Bintang (Bagian 4.5) */}
                <div className="pt-3 border-t border-black/10 space-y-2">
                  <div className="flex items-center justify-between text-black">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider font-sans">
                      Progres Belajar
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-black font-sans">
                        {course.progressPercent}%
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleSave(course.id, e)}
                        className="text-black hover:scale-110 transition-transform p-1 rounded-lg hover:bg-retro-warm"
                        title="Simpan mata kuliah"
                      >
                        <Bookmark
                          className={cn('h-5 w-5', isSaved ? 'fill-current' : '')}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Bar Progres Tipis Bergaya Hitam Solid */}
                  <div className="w-full h-2 rounded-full border border-black bg-retro-warm overflow-hidden">
                    <div
                      className="bg-black h-full rounded-full transition-all duration-500"
                      style={{ width: `${course.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
