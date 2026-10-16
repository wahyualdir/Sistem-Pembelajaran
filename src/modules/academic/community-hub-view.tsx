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
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER WINDOW RETRO */}
      <RetroWindow
        title="komunitas_dan_kegiatan_akademik.app"
        badge="Komunitas Aktif"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Komunitas & Informasi Kampus
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Ruang interaksi terpadu: pengumuman resmi dekanat, forum diskusi akademik terbuka, kolaborasi kelompok belajar, konsultasi mentoring sebaya, dan agenda webinar.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-mono font-black text-black shadow-retro">
              5 Kanal Terintegrasi
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. TAB CONTROLLER */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {roleTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0',
                isSelected
                  ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
                  : 'bg-white text-black hover:bg-retro-warm shadow-xs'
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
              <h3 className="font-heading font-black text-base sm:text-lg text-black">Belum Ada Pengumuman Kampus</h3>
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
                    'rounded-xl border-2 border-black p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-4 transition-all hover:-translate-y-1',
                    ann.isPinned ? 'bg-amber-50/70 border-black' : 'bg-white'
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded border border-black text-xs font-mono font-bold bg-retro-warm text-black">
                        {ann.category}
                      </span>
                      {ann.isPinned && (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-amber-900 font-mono">
                          <Pin className="h-3.5 w-3.5 fill-current" />
                          <span>Disematkan</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading font-black text-base sm:text-lg text-black leading-snug">
                      {ann.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-black/80 font-medium leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t-2 border-black/10 text-xs font-mono text-black/60">
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
            <h2 className="font-heading font-black text-base text-black">
              Diskusi Terbuka Mahasiswa & Dosen ({threads.length})
            </h2>
            <button
              type="button"
              onClick={() => alert('Fitur buat topik diskusi baru akan tersedia di versi komunitas lanjutan.')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-black text-white text-xs font-black shadow-xs hover:bg-neutral-800 cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Mulai Diskusi</span>
            </button>
          </div>

          {threads.length === 0 ? (
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <MessageSquare className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-black">Belum Ada Topik Diskusi</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Jadilah yang pertama memulai obrolan atau pertanyaan akademik di forum terbuka mahasiswa!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {threads.map((th) => (
                <div
                  key={th.id}
                  className="rounded-xl border-2 border-black bg-white p-5 shadow-retro hover:bg-retro-warm/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      {th.isPinned && (
                        <span className="px-2 py-0.5 rounded border border-black bg-retro-yellow text-xs font-mono font-black">
                          PIN
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded border border-black bg-neutral-100 text-xs font-mono font-bold">
                        {th.category}
                      </span>
                      <span className="text-xs text-black/60 font-mono">
                        {th.lastActive}
                      </span>
                    </div>
                    <h3 className="font-heading font-black text-base sm:text-lg text-black hover:text-primary-dark transition-colors">
                      {th.title}
                    </h3>
                    <p className="text-xs text-black/70 font-medium line-clamp-2">
                      {th.excerpt}
                    </p>
                    <div className="text-xs font-mono text-black/60 pt-1">
                      Diposting oleh <strong className="text-black">{th.author}</strong> ({th.authorRole})
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/10">
                    <div className="flex items-center gap-3 text-xs font-mono font-bold text-black/70">
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
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <Users className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-black">Belum Ada Grup Belajar</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Belum ada kelompok studi kolaboratif yang terdaftar pada semester ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded border border-black bg-retro-warm text-xs font-mono font-bold">
                        {g.topic}
                      </span>
                      <span className="text-xs font-mono font-bold text-black/70">
                        {g.members} Anggota Aktif
                      </span>
                    </div>
                    <h3 className="font-heading font-black text-base sm:text-lg text-black">
                      {g.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-black/80 font-medium leading-relaxed">
                      {g.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {g.tags?.map((t: string) => (
                        <span key={t} className="px-2 py-0.5 rounded border border-black bg-white text-xs font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t-2 border-black/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-black/70">{g.schedule}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Bergabung dengan grup: ${g.name}`)}
                      className="px-3 py-1.5 rounded-lg border-2 border-black bg-black text-white font-bold hover:bg-neutral-800 transition-all cursor-pointer"
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
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <UserCheck className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-black">Belum Ada Sesi Mentoring</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Belum ada kuota bimbingan akademik atau asistensi sebaya yang dibuka minggu ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mentors.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-lg border-2 border-black bg-retro-warm font-heading font-black text-sm flex items-center justify-center text-black">
                          {m.initials}
                        </div>
                        <div>
                          <h3 className="font-heading font-black text-base text-black leading-tight">
                            {m.name}
                          </h3>
                          <p className="text-xs text-primary font-bold">{m.role}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-emerald-500 bg-emerald-50 text-emerald-950">
                        {m.slots}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-black/80 font-medium leading-relaxed">
                      {m.focus}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.topics?.map((top: string) => (
                        <span key={top} className="px-2 py-0.5 rounded border border-black bg-white text-xs font-mono">
                          {top}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t-2 border-black/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-black/70">{m.schedule}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Reservasi sesi mentoring bersama ${m.name}`)}
                      className="px-3 py-1.5 rounded-lg border-2 border-black bg-primary text-white font-bold hover:bg-black transition-all cursor-pointer"
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
            <div className="p-10 text-center space-y-3 rounded-xl border-2 border-dashed border-black bg-white">
              <Calendar className="h-10 w-10 text-black/40 mx-auto" />
              <h3 className="font-heading font-black text-base sm:text-lg text-black">Belum Ada Agenda Kegiatan</h3>
              <p className="text-xs sm:text-sm text-black/70 max-w-md mx-auto">
                Saat ini belum ada jadwal webinar, workshop, atau hackathon kampus yang dipublikasikan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border-2 border-black bg-white p-5 sm:p-6 shadow-retro flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded border border-black bg-retro-warm text-xs font-mono font-bold">
                        {ev.type}
                      </span>
                      <span className="text-xs font-mono font-bold text-black/70">
                        {ev.seats}
                      </span>
                    </div>
                    <h3 className="font-heading font-black text-base sm:text-lg text-black leading-tight">
                      {ev.title}
                    </h3>
                    <div className="space-y-1 text-xs text-black/80 font-medium">
                      <div>Pembicara: <strong className="text-black">{ev.speaker}</strong> ({ev.role})</div>
                      <div className="flex items-center gap-1.5 text-black/70 font-mono">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{ev.date} &bull; {ev.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-black/70 font-mono">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{ev.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t-2 border-black/10 flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-emerald-800">{ev.status}</span>
                    <button
                      type="button"
                      onClick={() => alert(`Mendaftar event: ${ev.title}`)}
                      className="px-3 py-1.5 rounded-lg border-2 border-black bg-black text-white font-bold hover:bg-neutral-800 transition-all cursor-pointer"
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
  );
}
