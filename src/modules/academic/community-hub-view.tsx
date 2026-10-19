'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  Bell,
  Users,
  UserCheck,
  Calendar,
  Pin,
  Clock,
  ArrowRight,
  PlusCircle,
  ThumbsUp,
  MessageCircle,
  Eye,
  Award,
  Video,
  MapPin,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';

export const STUDENT_COMMUNITY_TABS = [
  { id: 'pengumuman', label: 'Pengumuman Kampus', icon: Bell },
  { id: 'forum', label: 'Forum Umum', icon: MessageSquare },
  { id: 'grup', label: 'Grup Belajar', icon: Users },
  { id: 'mentoring', label: 'Mentoring Mahasiswa', icon: UserCheck },
  { id: 'event', label: 'Event & Webinar', icon: Calendar },
] as const;

export const LECTURER_COMMUNITY_TABS = [
  { id: 'forum', label: 'Forum & Pengumuman', icon: MessageSquare },
  { id: 'mentoring', label: 'Mentoring & Bimbingan', icon: UserCheck },
  { id: 'event', label: 'Event & Webinar', icon: Calendar },
] as const;

export const COMMUNITY_TABS = STUDENT_COMMUNITY_TABS;
export type CommunityTabId = string;

interface CommunityHubViewProps {
  announcements: any[];
  threads: any[];
  groups: any[];
  mentors: any[];
  events: any[];
  isLecturer?: boolean;
}

export function CommunityHubView({
  announcements,
  threads,
  groups,
  mentors,
  events,
  isLecturer = false,
}: CommunityHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleTabs = isLecturer ? LECTURER_COMMUNITY_TABS : STUDENT_COMMUNITY_TABS;
  const tabParam = searchParams.get('tab');
  const validTabs = roleTabs.map((t) => t.id as string);
  const activeTab = tabParam && validTabs.includes(tabParam) ? tabParam : (roleTabs[0].id as string);

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/community?${params.toString()}`);
  };

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 pb-24 min-w-0">
      <div className="max-w-[1280px] mx-auto space-y-5 sm:space-y-6">
        {/* 1. HEADER HALAMAN BERANDA STANDARD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight text-ink flex items-center gap-2.5">
              <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-primary inline-block" />
              Komunitas & Kegiatan Kampus
            </h1>
            <p className="text-xs sm:text-sm text-gray-dark font-bold">
              Ruang interaksi terpadu: forum diskusi, kelompok belajar, mentoring sebaya, dan agenda webinar
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              5 Kanal Terintegrasi
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-sans font-bold bg-gray-soft border-2 border-ink text-ink shadow-xs">
              SEMESTER AKTIF 2026/2027
            </span>
          </div>
        </div>

        {/* 2. TAB CONTROLLER */}
        <div className="flex items-center gap-2 border-b-2 border-ink pb-2 overflow-x-auto">
          {roleTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-ink text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0',
                  isSelected
                    ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
                    : 'bg-surface text-ink hover:bg-gray-soft shadow-xs'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      {/* 3. TAB 1: PENGUMUMAN (ATAU BAGIAN ATAS TAB FORUM UNTUK DOSEN) */}
      {(activeTab === 'pengumuman' || (isLecturer && activeTab === 'forum')) && (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <Bell className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-black">Belum Ada Pengumuman Kampus</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Saat ini belum ada pengumuman resmi terbaru yang disematkan oleh dekanat atau program studi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={cn(
                    'rounded-xl border-2 border-ink p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-4 transition-all hover:-translate-y-1',
                    ann.isPinned ? 'bg-gray-soft/70 border-ink' : 'bg-surface'
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded border border-ink text-xs font-sans font-bold bg-gray-soft text-ink">
                        {ann.category}
                      </span>
                      {ann.isPinned && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-ink font-sans">
                          <Pin className="h-3.5 w-3.5 fill-current" />
                          <span>Disematkan</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-ink leading-snug">
                      {ann.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-dark font-medium leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t-2 border-ink/10 text-xs font-sans text-gray-dark font-bold">
                    <span>Oleh: {ann.author}</span>
                    <span>{ann.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: FORUM UMUM */}
      {activeTab === 'forum' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-ink">
              Diskusi Terbuka Mahasiswa & Dosen ({threads.length})
            </h2>
            <button
              type="button"
              onClick={() => alert('Fitur buat topik diskusi baru akan tersedia di versi komunitas lanjutan.')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-ink text-white text-xs font-bold shadow-xs hover:bg-neutral-800 cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Mulai Diskusi</span>
            </button>
          </div>

          {threads.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-ink bg-surface">
              <MessageSquare className="h-10 w-10 text-gray-dark mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-ink">Belum Ada Topik Diskusi</h3>
              <p className="text-xs sm:text-sm text-gray-dark font-bold max-w-md mx-auto">
                Jadilah yang pertama memulai obrolan atau pertanyaan akademik di forum terbuka mahasiswa!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {threads.map((th) => (
                <div
                  key={th.id}
                  className="rounded-xl border-2 border-ink bg-surface p-5 shadow-retro hover:bg-gray-soft/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      {th.isPinned && (
                        <span className="px-2 py-0.5 rounded border border-ink bg-gray-soft text-xs font-sans font-bold text-ink">
                          PIN
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded border border-ink bg-gray-soft text-xs font-sans font-bold text-ink">
                        {th.category}
                      </span>
                      <span className="text-xs text-gray-dark font-sans font-bold">
                        {th.lastActive}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-ink hover:text-primary transition-colors">
                      {th.title}
                    </h3>
                    <p className="text-xs text-gray-dark font-medium line-clamp-2">
                      {th.excerpt}
                    </p>
                    <div className="text-xs font-sans text-gray-dark font-medium pt-1">
                      Diposting oleh <strong className="text-ink font-bold">{th.author}</strong> ({th.authorRole})
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-ink/10">
                    <div className="flex items-center gap-3 text-xs font-sans font-bold text-gray-dark">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {th.replies} balasan
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {th.views}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: GRUP BELAJAR */}
      {activeTab === 'grup' && (
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-ink bg-surface">
              <Users className="h-10 w-10 text-gray-dark mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-ink">Belum Ada Grup Belajar</h3>
              <p className="text-xs sm:text-sm text-gray-dark font-bold max-w-md mx-auto">
                Belum ada kelompok studi kolaboratif yang terdaftar pada semester ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="rounded-xl border-2 border-ink bg-surface p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded border-2 border-ink bg-gray-soft text-xs font-sans font-bold text-ink">
                        {g.topic}
                      </span>
                      <span className="text-xs font-sans font-bold text-gray-dark">
                        {g.members} Anggota Aktif
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-ink">
                      {g.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-dark font-medium leading-relaxed">
                      {g.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {g.tags?.map((t: string) => (
                        <span key={t} className="px-2 py-0.5 rounded border border-ink bg-surface text-xs font-sans font-bold text-ink">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t-2 border-ink/10 flex items-center justify-between text-xs font-sans">
                    <span className="text-gray-dark font-bold">{g.schedule}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Bergabung dengan grup: ${g.name}`)}
                      className="px-3 py-1.5 rounded-lg border-2 border-ink bg-ink text-white font-bold hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      Gabung Grup
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 4: MENTORING */}
      {activeTab === 'mentoring' && (
        <div className="space-y-4">
          {mentors.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-ink bg-surface">
              <UserCheck className="h-10 w-10 text-gray-dark mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-ink">Belum Ada Sesi Mentoring</h3>
              <p className="text-xs sm:text-sm text-gray-dark font-bold max-w-md mx-auto">
                Belum ada kuota bimbingan akademik atau asistensi sebaya yang dibuka minggu ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mentors.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border-2 border-ink bg-surface p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-lg border-2 border-ink bg-gray-soft font-heading font-bold text-sm flex items-center justify-center text-ink">
                          {m.initials}
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-base text-ink leading-tight">
                            {m.name}
                          </h3>
                          <p className="text-xs text-primary font-bold">{m.role}</p>
                        </div>
                      </div>
                      <span className="text-xs font-sans font-bold px-2 py-0.5 rounded border border-ink bg-surface text-ink">
                        {m.slots}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-dark font-medium leading-relaxed">
                      {m.focus}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.topics?.map((top: string) => (
                        <span key={top} className="px-2 py-0.5 rounded border border-ink bg-surface text-xs font-sans font-bold text-ink">
                          {top}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t-2 border-ink/10 flex items-center justify-between text-xs font-sans">
                    <span className="text-gray-dark font-bold">{m.schedule}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Reservasi sesi mentoring bersama ${m.name}`)}
                      className="px-3 py-1.5 rounded-lg border-2 border-ink bg-primary text-white font-bold hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      Booking Sesi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. TAB 5: EVENT & WEBINAR */}
      {activeTab === 'event' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-ink bg-surface">
              <Calendar className="h-10 w-10 text-gray-dark mx-auto" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-ink">Belum Ada Agenda Kegiatan</h3>
              <p className="text-xs sm:text-sm text-gray-dark font-bold max-w-md mx-auto">
                Saat ini belum ada jadwal webinar, workshop, atau hackathon kampus yang dipublikasikan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border-2 border-ink bg-surface p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded border border-ink bg-gray-soft text-xs font-sans font-bold text-ink">
                        {ev.type}
                      </span>
                      <span className="text-xs font-sans font-bold text-gray-dark">
                        {ev.seats}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-ink leading-tight">
                      {ev.title}
                    </h3>
                    <div className="space-y-1 text-xs text-gray-dark font-medium">
                      <div>Pembicara: <strong className="text-ink font-bold">{ev.speaker}</strong> ({ev.role})</div>
                      <div className="flex items-center gap-1.5 text-gray-dark font-sans font-bold">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>{ev.date} &bull; {ev.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-dark font-sans font-bold">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{ev.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t-2 border-ink/10 flex items-center justify-between text-xs font-sans">
                    <span className="font-bold text-ink">{ev.status}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Mendaftar event: ${ev.title}`)}
                      className="px-3 py-1.5 rounded-lg border-2 border-ink bg-ink text-white font-bold hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      Daftar Sekarang
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
