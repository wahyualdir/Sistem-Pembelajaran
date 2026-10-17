'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  Calendar,
  Plus,
  Search,
  ExternalLink,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';

export const STAFF_ANNOUNCEMENTS_TABS = [
  { id: 'pengumuman-kampus', label: 'Pengumuman Kampus', icon: Bell },
  { id: 'event-dan-webinar', label: 'Event & Webinar', icon: Calendar },
] as const;

export type StaffAnnouncementsTabId = (typeof STAFF_ANNOUNCEMENTS_TABS)[number]['id'];

interface StaffAnnouncementsHubViewProps {
  isDemo?: boolean;
}

export function StaffAnnouncementsHubView({ isDemo = true }: StaffAnnouncementsHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as StaffAnnouncementsTabId;
  const validTabs: StaffAnnouncementsTabId[] = [
    'pengumuman-kampus',
    'event-dan-webinar',
  ];
  const activeTab: StaffAnnouncementsTabId = validTabs.includes(tabParam)
    ? tabParam
    : 'pengumuman-kampus';

  const setTab = (tab: StaffAnnouncementsTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/staff/announcements?${params.toString()}`);
  };

  const ANNOUNCEMENTS = [
    {
      id: 'anc-1',
      title: 'Jadwal Pengisian Kartu Rencana Studi (KRS) Semester Ganjil 2026/2027',
      target: 'Seluruh Mahasiswa Aktif',
      category: 'AKADEMIK',
      date: '01 Sep 2026',
      author: 'Biro Administrasi Akademik',
      status: 'PUBLISHED',
    },
    {
      id: 'anc-2',
      title: 'Sosialisasi Program Pertukaran Mahasiswa Merdeka (PMM) Batch 5',
      target: 'Mahasiswa Semester 3 - 7',
      category: 'KEMAHASISWAAN',
      date: '15 Sep 2026',
      author: 'Pusat Karir & MBKM',
      status: 'PUBLISHED',
    },
    {
      id: 'anc-3',
      title: 'Pemeliharaan Server Database CBT & Portal Pembelajaran SIAJAR',
      target: 'Seluruh Civitas Akademika',
      category: 'TEKNOLOGI',
      date: '28 Sep 2026',
      author: 'Pusat Data & Sistem Informasi',
      status: 'PUBLISHED',
    },
  ];

  const EVENTS = [
    {
      id: 'ev-1',
      title: 'Webinar Nasional: Penerapan Agentic AI dalam Rekayasa Perangkat Lunak',
      speaker: 'Prof. Richard Socher & Tim DeepLearning.AI',
      date: 'Sabtu, 24 Okt 2026',
      time: '09:00 - 12:00 WIB',
      quota: '500 Peserta (Online Zoom)',
      registered: 412,
      status: 'REGISTRASI_DIBUKA',
    },
    {
      id: 'ev-2',
      title: 'Workshop Sertifikasi Google Cloud Cloud Architect Bootcamp',
      speaker: 'Certified Cloud Trainer Google Indonesia',
      date: 'Kamis - Jumat, 05-06 Nov 2026',
      time: '08:30 - 16:30 WIB',
      quota: '60 Peserta (Lab Komputer 2)',
      registered: 60,
      status: 'KUOTA_PENUH',
    },
  ];

  const announcements = isDemo ? ANNOUNCEMENTS : [];
  const events = isDemo ? EVENTS : [];

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER RETRO */}
      <RetroWindow
        title="pengumuman_dan_event_kampus.app"
        badge="Biro Komunikasi & Publikasi Akademik"
        headerClassName="bg-gray-soft"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-primary text-white shadow-xs">
                <Bell className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Pengumuman dan Acara Kampus
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Pusat penerbitan siaran resmi institusi: broadcast pengumuman akademik, jadwal kegiatan seminar, kompetisi mahasiswa, dan webinar bersertifikat.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-sans font-bold text-black shadow-retro">
              Kanal Informasi Terpadu
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. STATS PILLS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold uppercase text-black/60">Pengumuman Aktif</span>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-black">{ANNOUNCEMENTS.length} Siaran</div>
          <span className="text-xs text-ink font-bold">Terpublikasi</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold uppercase text-black/60">Event & Webinar</span>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-black">{EVENTS.length} Kegiatan</div>
          <span className="text-xs text-primary font-bold">Semester Berjalan</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold uppercase text-black/60">Pendaftar Webinar</span>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-black">472 Peserta</div>
          <span className="text-xs text-black/70">Total Registran</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-sans font-bold uppercase text-black/60">Status Kanal</span>
          <div className="text-2xl sm:text-3xl font-heading font-bold text-ink">Online</div>
          <span className="text-xs text-ink font-bold">Siaran Terhubung</span>
        </div>
      </div>

      {/* 3. TAB CONTROLLER */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {STAFF_ANNOUNCEMENTS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-black text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0',
                isSelected
                  ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
                  : 'bg-white text-black hover:bg-gray-soft shadow-xs'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}
      {/* TAB 1: PENGUMUMAN KAMPUS */}
      {activeTab === 'pengumuman-kampus' && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-black flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <span>Siaran Berita & Pengumuman Resmi Kampus</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Kelola broadcast informasi untuk seluruh mahasiswa, dosen, atau target program studi tertentu.
              </p>
            </div>
            <button
              type="button"
              disabled={!isDemo}
              title={!isDemo ? 'Fitur ini belum aktif' : undefined}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black text-xs font-bold shadow-xs transition-all shrink-0',
                isDemo
                  ? 'bg-white text-black hover:bg-neutral-100 cursor-pointer'
                  : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Buat Pengumuman Baru</span>
              {!isDemo && <span className="text-xs bg-neutral-200 px-1.5 py-0.2 rounded font-sans text-neutral-600">(Belum Aktif)</span>}
            </button>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Judul Pengumuman</th>
                    <th className="p-3.5 sm:p-4">Kategori & Target</th>
                    <th className="p-3.5 sm:p-4">Penerbit</th>
                    <th className="p-3.5 sm:p-4">Tanggal Terbit</th>
                    <th className="p-3.5 sm:p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {announcements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-black/60 font-sans text-xs">
                        Belum ada siaran pengumuman tersimpan di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    announcements.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black max-w-md">
                          <div>{a.title}</div>
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <span className="px-2 py-0.5 rounded border border-black bg-gray-soft text-xs font-sans font-bold">
                            {a.category}
                          </span>
                          <div className="text-xs text-black/60 mt-0.5">{a.target}</div>
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/80">{a.author}</td>
                        <td className="p-3.5 sm:p-4 font-sans text-xs">{a.date}</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-2.5 py-0.5 rounded border border-ink bg-surface text-ink font-sans text-xs font-bold">
                            PUBLIK
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EVENT & WEBINAR */}
      {activeTab === 'event-dan-webinar' && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-base text-black flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Manajemen Agenda Event, Workshop & Webinar Institusi</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Publikasikan seminar akademik bersertifikat serta kelola batas kuota kehadiran peserta.
              </p>
            </div>
            <button
              type="button"
              disabled={!isDemo}
              title={!isDemo ? 'Fitur ini belum aktif' : undefined}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black text-xs font-bold shadow-xs transition-all shrink-0',
                isDemo
                  ? 'bg-white text-black hover:bg-neutral-100 cursor-pointer'
                  : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Daftarkan Event Baru</span>
              {!isDemo && <span className="text-xs bg-neutral-200 px-1.5 py-0.2 rounded font-sans text-neutral-600">(Belum Aktif)</span>}
            </button>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-sans font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Nama Event & Narasumber</th>
                    <th className="p-3.5 sm:p-4">Jadwal Pelaksanaan</th>
                    <th className="p-3.5 sm:p-4 text-center">Kuota Peserta</th>
                    <th className="p-3.5 sm:p-4 text-center">Terdaftar</th>
                    <th className="p-3.5 sm:p-4 text-center">Status Pendaftaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-black/60 font-sans text-xs">
                        Belum ada agenda event atau webinar tersimpan di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    events.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-soft/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black max-w-sm">
                          <div>{e.title}</div>
                          <span className="text-xs font-sans text-black/60">Pembicara: {e.speaker}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-sans text-xs">
                          <div>{e.date}</div>
                          <span className="text-black/60">{e.time}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center text-xs font-sans">{e.quota}</td>
                        <td className="p-3.5 sm:p-4 text-center font-sans font-bold text-black">{e.registered} Orang</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded border text-xs font-sans font-bold',
                              e.status === 'REGISTRASI_DIBUKA'
                                ? 'border-ink bg-surface text-ink'
                                : 'border-ink bg-gray-soft text-ink'
                            )}
                          >
                            {e.status === 'REGISTRASI_DIBUKA' ? 'DIBUKA' : 'KUOTA PENUH'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
