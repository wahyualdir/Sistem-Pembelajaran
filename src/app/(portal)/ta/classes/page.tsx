import React from 'react';
import Link from 'next/link';
import { Layers, Users, ArrowRight, Clock, BookOpen } from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import {
  getClassroomBannerTheme,
  ClassroomBannerPattern,
} from '@/modules/academic/classroom-cards';
import { listMyClassesAction } from '@/modules/academic/actions';

export default async function AssistantClassesPage() {
  const classes = await listMyClassesAction();

  return (
    <div className="p-6 sm:p-9 w-full space-y-8 animate-fade-up">
      <RetroWindow
        title="Kelas yang Diasistensi"
        headerBadge="Mode Asisten"
        headerBadgeVariant="warning"
      >
        <div className="p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground flex items-center gap-3">
            <Layers className="h-7 w-7 text-primary" />
            <span>Kelas yang Diasistensi</span>
          </h1>
          <p className="text-sm sm:text-base text-black font-bold max-w-3xl leading-relaxed">
            Peran asisten Anda berlaku spesifik per kelas. Anda dapat membantu presensi, memeriksa draf tugas, dan menjawab forum mahasiswa sesuai izin dosen pengampu.
          </p>
        </div>
      </RetroWindow>

      {/* Grid Kartu Kelas Diasistensi Full-Width */}
      {classes.length === 0 ? (
        <RetroWindow
          title="asistensi_kosong.txt"
          badge="ASISTENSI :: KOSONG"
          headerClassName="bg-gray-soft"
          bodyClassName="p-8 text-center bg-surface"
        >
          <div className="max-w-md mx-auto space-y-3 py-6">
            <div className="w-12 h-12 rounded-xl bg-gray-soft border-2 border-ink mx-auto flex items-center justify-center text-ink shadow-xs">
              <Layers className="h-6 w-6 text-gray-dark" />
            </div>
            <h2 className="font-heading font-bold text-lg text-ink">Belum Ada Kelas yang Diasistensi</h2>
            <p className="text-xs sm:text-sm text-gray-dark leading-relaxed font-medium">
              Anda belum ditugaskan sebagai asisten pada kelas mana pun untuk semester ini. Dosen pengampu dapat menambahkan mandat Anda pada pengaturan kelas perkuliahan.
            </p>
          </div>
        </RetroWindow>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls, idx) => {
            const courseCode = cls.course_code || 'STI-2026';
            const theme = getClassroomBannerTheme(courseCode, idx);
            const permissions = ['Bantu Presensi', 'Review Draf Tugas', 'Moderasi Forum'];

            return (
              <div
                key={cls.id}
                className="rounded-2xl border border-[#D6D3CB] hover:border-[#7A756D] bg-[#FFFFFF] shadow-sm flex flex-col justify-between overflow-hidden transition-all"
              >
                {/* Header Berwarna & Bercorak ala Google Classroom */}
                <div
                  className={`${theme.bannerGradient} relative p-5 text-white border-b border-[#1C1917]/15 overflow-hidden space-y-3`}
                >
                  <ClassroomBannerPattern pattern={theme.pattern} />
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#FFFFFF]/15 backdrop-blur-xs border border-[#FFFFFF]/25 text-white">
                      {courseCode} · {cls.section || 'Kelas'}
                    </span>
                    <span className="text-[11px] font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#1C1917]/30 border border-[#FFFFFF]/25 text-white">
                      {cls.status === 'ACTIVE' || cls.status === 'Aktif' ? 'Aktif Berjalan' : (cls.status || 'Aktif')}
                    </span>
                  </div>

                  <div className="relative z-10">
                    <h2 className="font-heading font-black text-lg text-white leading-snug drop-shadow-xs">
                      <Link
                        href={`/classes/${cls.id}`}
                        className="hover:underline decoration-white/80 underline-offset-4 transition-all"
                      >
                        {cls.course_title || cls.title}
                      </Link>
                    </h2>
                    <p className="text-xs text-white/90 mt-1 font-medium">
                      Dosen: <strong className="text-white">{cls.lecturer_name || 'Dosen Pengampu'}</strong>
                    </p>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1.5 text-xs">
                      <p className="text-[#57534E] flex items-center gap-2 font-sans font-medium">
                        <Clock className={`h-3.5 w-3.5 ${theme.accentText} shrink-0`} />
                        <span>{cls.schedule || 'Senin, 08:45 - 11:15 WIB · Lab TI'}</span>
                      </p>
                      <p className="text-[#57534E] flex items-center gap-2 font-sans font-medium">
                        <Users className="h-3.5 w-3.5 text-[#78716C] shrink-0" />
                        <span>{cls.members ?? 40} Mahasiswa Terdaftar</span>
                      </p>
                    </div>

                    {/* Izin Mandat Asdos */}
                    <div className="pt-2 border-t border-[#E8E5DE]">
                      <span className="text-[11px] font-sans font-bold uppercase text-[#6B6560] block mb-1.5">
                        Izin Mandat Dosen:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {permissions.map((perm) => (
                          <span
                            key={perm}
                            className="text-xs font-sans font-semibold px-2 py-0.5 rounded-md border border-[#D6D3CB] bg-[#FAF8F5] text-[#1C1917]"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E8E5DE] flex items-center justify-between">
                    <Link
                      href={`/classes/${cls.id}`}
                      className="text-xs font-sans font-bold text-primary hover:underline flex items-center gap-1.5"
                    >
                      <span>Buka Ruang Kelas</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/ta/grading"
                      className="text-xs font-sans font-bold text-ink hover:underline"
                    >
                      Antrean Koreksi
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
