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
        <h2 className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-[#1C1917]">
          {title}
        </h2>
        <Link
          href={moreHref}
          className="text-xs sm:text-sm font-semibold text-[#C2553A] hover:text-[#1C1917] transition-colors"
        >
          Semua Kelas &rarr;
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E8E5DE] bg-[#FFFFFF] p-8 text-center space-y-3 shadow-2xs">
          <FileText className="h-8 w-8 text-[#7A756D] mx-auto" />
          <p className="font-heading font-bold text-base text-[#1C1917]">
            {emptyTitle}
          </p>
          <p className="text-xs sm:text-sm text-[#57534E] max-w-md mx-auto">
            {emptySubtitle}
          </p>
          <div className="pt-1">
            <Link
              href={emptyActionHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1C1917] text-white hover:bg-[#C2553A] text-xs font-semibold transition-colors"
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
                  'group cursor-pointer rounded-2xl border bg-[#FFFFFF] transition-all flex flex-col justify-between overflow-hidden shadow-2xs',
                  isSelected
                    ? 'border-[#1C1917] ring-2 ring-[#1C1917] shadow-sm'
                    : 'border-[#E8E5DE] hover:border-[#D6D3CB]'
                )}
              >
                {/* Header Kartu Berwarna & Bercorak ala Google Classroom */}
                <div
                  className={cn(
                    theme.bannerGradient,
                    'border-b border-[#1C1917]/15 relative text-white overflow-hidden'
                  )}
                >
                  <ClassroomBannerPattern pattern={theme.pattern} />

                  <div className="p-4 space-y-2.5 relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FFFFFF]/15 backdrop-blur-xs border border-[#FFFFFF]/25 text-[11px] font-semibold text-white">
                        <span className="font-mono font-bold text-white">{course.code}</span>
                        <span className="text-white/60">•</span>
                        <span>{course.sks} SKS</span>
                      </span>

                      {course.hasOpenExam ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#FEF2F0] text-[#853827] border border-[#FFFFFF]/40 shadow-xs">
                          <Award className="h-3 w-3" />
                          <span>UJIAN</span>
                        </span>
                      ) : course.pendingTasksCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#1C1917]/35 text-white border border-[#FFFFFF]/25">
                          <FileText className="h-3 w-3 text-white" />
                          <span>{course.pendingTasksCount} Tugas</span>
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-heading font-bold text-base text-white group-hover:underline decoration-white/80 underline-offset-4 transition-all leading-snug line-clamp-2 min-h-[2.5rem] drop-shadow-xs">
                      {course.title}
                    </h3>

                    <p className="text-xs font-medium text-white/90 truncate">
                      {course.lecturer}
                    </p>
                  </div>
                </div>

                {/* Footer Kartu & Progres */}
                <div className="p-4 space-y-2.5 bg-[#FFFFFF]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#57534E]">
                      {progressLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#1C1917]">
                        {course.progressPercent}%
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleSave(course.id, e)}
                        className="text-[#57534E] hover:text-[#1C1917] p-0.5 rounded transition-colors"
                        title="Simpan mata kuliah"
                      >
                        <Bookmark
                          className={cn('h-4 w-4', isSaved ? 'fill-current text-[#C2553A]' : '')}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[#E8E5DE] overflow-hidden">
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
