'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, Award, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveClassItem } from '@/modules/academic/home-actions';
import {
  getClassroomBannerTheme,
  ClassroomBannerPattern,
} from '@/modules/academic/classroom-cards';

interface ActiveClassesGridProps {
  courses: ActiveClassItem[];
  selectedCourse?: ActiveClassItem;
  onSelectCourse: (course: ActiveClassItem) => void;
  title?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  moreHref?: string;
  progressLabel?: string;
}

export function ActiveClassesGrid({
  courses,
  selectedCourse,
  onSelectCourse,
  title = 'Kelas Aktif',
  emptyTitle = 'Belum Ada Kelas yang Diikuti',
  emptySubtitle = 'Anda belum terdaftar pada kelas mata kuliah apa pun. Buka menu Kelas Saya untuk bergabung ke rombongan belajar dosen Anda.',
  emptyActionLabel = 'Buka Kelas Saya',
  emptyActionHref = '/classes',
  moreHref = '/classes',
  progressLabel = 'Progres Belajar',
}: ActiveClassesGridProps) {
  const [savedCourses, setSavedCourses] = useState<Record<string, boolean>>({
    'course-1': true,
  });

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedCourses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section aria-label="Mata Kuliah Aktif" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg sm:text-xl tracking-tight text-[#111111]">
          {title}
        </h2>
        <Link
          href={moreHref}
          className="text-xs sm:text-sm font-semibold text-[#9F1521] hover:text-[#8F131E] transition-colors"
        >
          Semua Kelas &rarr;
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E2E3E4] bg-[#FFFFFF] p-8 text-center space-y-3">
          <FileText className="h-8 w-8 text-[#808285] mx-auto" />
          <p className="font-heading font-bold text-base text-[#111111]">
            {emptyTitle}
          </p>
          <p className="text-xs sm:text-sm text-[#58595B] max-w-md mx-auto">
            {emptySubtitle}
          </p>
          <div className="pt-1">
            <Link
              href={emptyActionHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#9F1521] text-white hover:bg-[#8F131E] text-xs font-semibold transition-colors shadow-xs"
            >
              <span>{emptyActionLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course, idx) => {
            const isSelected = selectedCourse?.id === course.id;
            const isSaved = !!savedCourses[course.id];
            const theme = getClassroomBannerTheme(
              course.code || course.id || course.title,
              idx
            );

            return (
              <div
                key={course.id}
                onClick={() => onSelectCourse(course)}
                className={cn(
                  'group cursor-pointer rounded-2xl border bg-[#FFFFFF] transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md',
                  isSelected
                    ? 'border-[#9F1521] ring-2 ring-[#9F1521]/20 shadow-sm'
                    : 'border-[#E2E3E4] hover:border-[#808285]'
                )}
              >
                {/* Header Kartu Berwarna & Bercorak ala Google Classroom */}
                <div
                  className={cn(
                    theme.bannerGradient,
                    'border-b border-black/10 relative text-white overflow-hidden'
                  )}
                >
                  <ClassroomBannerPattern pattern={theme.pattern} />

                  <div className="p-4 space-y-2.5 relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs border border-white/30 text-[11px] font-semibold text-white">
                        <span className="font-mono font-bold text-white">{course.code}</span>
                        <span className="text-white/60">•</span>
                        <span>{course.sks} SKS</span>
                      </span>

                      {course.hasOpenExam ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FFFFFF] text-[#9F1521] shadow-xs">
                          <Award className="h-3 w-3" />
                          <span>UJIAN</span>
                        </span>
                      ) : course.pendingTasksCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-black/30 backdrop-blur-xs text-white border border-white/20">
                          <FileText className="h-3 w-3 text-white" />
                          <span>{course.pendingTasksCount} Tugas</span>
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-heading font-bold text-sm sm:text-base text-white group-hover:underline decoration-white/80 underline-offset-4 transition-all leading-snug line-clamp-2 min-h-[2.5rem]">
                      {course.title}
                    </h3>

                    <p className="text-xs font-normal text-white/90 truncate">
                      {course.lecturer}
                    </p>
                  </div>
                </div>

                {/* Footer Kartu & Progres */}
                <div className="p-4 space-y-2.5 bg-[#FFFFFF]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#58595B]">
                      {progressLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#111111]">
                        {course.progressPercent}%
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleSave(course.id, e)}
                        className="text-[#808285] hover:text-[#111111] p-0.5 rounded transition-colors"
                        title="Simpan mata kuliah"
                      >
                        <Bookmark
                          className={cn('h-4 w-4', isSaved ? 'fill-current text-[#9F1521]' : '')}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[#F3F3F4] overflow-hidden">
                    <div
                      className={cn(
                        theme.progressBar,
                        'h-full rounded-full transition-all duration-500'
                      )}
                      style={{ width: `${course.progressPercent}%` }}
                    />
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
