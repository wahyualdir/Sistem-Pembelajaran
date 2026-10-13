'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageSquare,
  Users,
  ShieldAlert,
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Trash2,
} from 'lucide-react';
import { RetroWindow } from '@/components/retro/retro-window';
import { cn } from '@/lib/utils';

export const STAFF_MODERATION_TABS = [
  { id: 'laporan-konten', label: 'Laporan Konten', icon: ShieldAlert },
  { id: 'grup-belajar', label: 'Grup Belajar', icon: Users },
  { id: 'program-mentoring', label: 'Program Mentoring', icon: GraduationCap },
] as const;

export type StaffModerationTabId = (typeof STAFF_MODERATION_TABS)[number]['id'];

interface StaffModerationHubViewProps {
  isDemo?: boolean;
}

export function StaffModerationHubView({ isDemo = true }: StaffModerationHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as StaffModerationTabId;
  const validTabs: StaffModerationTabId[] = [
    'laporan-konten',
    'grup-belajar',
    'program-mentoring',
  ];
  const activeTab: StaffModerationTabId = validTabs.includes(tabParam)
    ? tabParam
    : 'laporan-konten';

  const setTab = (tab: StaffModerationTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/staff/moderation?${params.toString()}`);
  };

  const REPORTED_CONTENT = [
    { id: 'rep-1', postTitle: 'Sharing Kunci Jawaban Kuis Algoritma Bab 3', author: 'Akun Mahasiswa Anonim', reporter: 'Dr. Budi Santoso, M.Kom.', category: 'Pelanggaran Integritas Akademik', date: '08 Okt 2026', status: 'MENUNGGU_REVIEW' },
    { id: 'rep-2', postTitle: 'Spam Tautan Iklan di Thread Diskusi Web', author: 'User Eksternal', reporter: 'Rian Hidayat (Mahasiswa)', category: 'Spam & Promosi', date: '06 Okt 2026', status: 'DIHAPUS' },
  ];

  const STUDY_GROUPS = [
    { id: 'grp-1', name: 'Komunitas Competitive Programming & Algoritma', leader: 'Ahmad Fauzi', members: 45, topic: 'Persiapan Gemastik & ICPC', createdDate: '01 Sep 2026', status: 'AKTIF' },
    { id: 'grp-2', name: 'Kelompok Belajar Deep Learning & NLP', leader: 'Siti Rahma', members: 32, topic: 'Paper Reading & Fine-Tuning LLM', createdDate: '05 Sep 2026', status: 'AKTIF' },
    { id: 'grp-3', name: 'Klub Keamanan Siber & CTF Mahasiswa', leader: 'Dimas Aditya', members: 28, topic: 'Reverse Engineering & Web Exploit', createdDate: '10 Sep 2026', status: 'AKTIF' },
  ];

  const MENTORING_PROGRAMS = [
    { id: 'mnt-1', name: 'Program Kakak Asuh Mahasiswa Baru Angkatan 2026', coordinator: 'Biro Kemahasiswaan & BEM', mentorsCount: 30, menteesCount: 180, duration: 'Semester 1 (Ganjil)', status: 'BERJALAN' },
    { id: 'mnt-2', name: 'Mentoring Skripsi & Tugas Akhir Bidang Software Engineering', coordinator: 'Tim Dosen KBK RPL', mentorsCount: 12, menteesCount: 36, duration: 'Semester 7 - 8', status: 'BERJALAN' },
  ];

  const reportedContent = isDemo ? REPORTED_CONTENT : [];
  const studyGroups = isDemo ? STUDY_GROUPS : [];
  const mentoringPrograms = isDemo ? MENTORING_PROGRAMS : [];

  return (
    <div className="p-4 sm:p-6 lg:p-9 w-full space-y-6 sm:space-y-8 animate-fade-up">
      {/* 1. HEADER RETRO */}
      <RetroWindow
        title="moderasi_komunitas_dan_pembelajaran_mahasiswa.app"
        badge="Biro Moderasi & Kemahasiswaan"
        headerClassName="bg-retro-yellow"
        bodyClassName="p-5 sm:p-7 bg-retro-surface"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border-2 border-black bg-retro-orange text-white shadow-xs">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground">
                Moderasi Komunitas & Mentoring
              </h1>
            </div>
            <p className="text-sm sm:text-base text-black font-medium max-w-3xl leading-relaxed">
              Pengawasan ketertiban forum pembelajaran daring: penindakan laporan pelanggaran konten akademik, supervisi grup belajar mandiri, dan monitoring program mentoring mahasiswa.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs sm:text-sm font-mono font-black text-black shadow-retro">
              Integritas Ekosistem Kampus
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* 2. STATS PILLS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Laporan Menunggu</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-retro-orange">1 Berkas</div>
          <span className="text-xs text-black/70">Perlu Tindakan</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Grup Belajar Aktif</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">{STUDY_GROUPS.length} Grup</div>
          <span className="text-xs text-emerald-800 font-bold">105 Anggota</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Program Mentoring</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">{MENTORING_PROGRAMS.length} Program</div>
          <span className="text-xs text-emerald-800 font-bold">216 Mahasiswa Binaan</span>
        </div>
        <div className="rounded-xl border-2 border-black bg-white p-4 shadow-retro space-y-1">
          <span className="text-xs font-mono font-bold uppercase text-black/60">Status Kebijakan</span>
          <div className="text-2xl sm:text-3xl font-heading font-black text-black">Aman</div>
          <span className="text-xs text-emerald-800 font-bold">Integritas Terjaga</span>
        </div>
      </div>

      {/* 3. TAB CONTROLLER */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto">
        {STAFF_MODERATION_TABS.map((tab) => {
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
                  ? 'bg-retro-orange text-white shadow-retro'
                  : 'bg-white text-black hover:bg-retro-warm shadow-xs'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}
      {/* TAB 1: LAPORAN KONTEN */}
      {activeTab === 'laporan-konten' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-retro-orange" />
                <span>Kotak Masuk Laporan Konten & Pelanggaran Etika</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Tinjau postingan forum diskusi yang dilaporkan pengguna karena memuat kecurangan kuis, spam, atau pelanggaran etika akademik.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-white border border-black rounded-lg">
              Respons Moderasi Cepat (SLA 24 Jam)
            </span>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Konten yang Dilaporkan</th>
                    <th className="p-3.5 sm:p-4">Pelapor</th>
                    <th className="p-3.5 sm:p-4">Kategori Pelanggaran</th>
                    <th className="p-3.5 sm:p-4">Waktu Laporan</th>
                    <th className="p-3.5 sm:p-4 text-center">Status</th>
                    <th className="p-3.5 sm:p-4 text-center">Tindakan Staf</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {reportedContent.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-black/60 font-mono text-xs">
                        Tidak ada laporan pelanggaran konten yang menunggu tinjauan.
                      </td>
                    </tr>
                  ) : (
                    reportedContent.map((r) => (
                      <tr key={r.id} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black max-w-sm">
                          <div>{r.postTitle}</div>
                          <span className="text-xs font-mono text-black/60">Pembuat: {r.author}</span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/80">{r.reporter}</td>
                        <td className="p-3.5 sm:p-4">
                          <span className="px-2 py-0.5 rounded border border-rose-500 bg-rose-100 text-rose-950 font-mono text-xs font-bold">
                            {r.category}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 font-mono text-xs">{r.date}</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded border text-xs font-mono font-bold',
                              r.status === 'MENUNGGU_REVIEW'
                                ? 'border-amber-500 bg-amber-100 text-amber-950'
                                : 'border-neutral-400 bg-neutral-100 text-neutral-800'
                            )}
                          >
                            {r.status === 'MENUNGGU_REVIEW' ? 'PERLU REVIEW' : 'SUDAH DITINDAK'}
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          {r.status === 'MENUNGGU_REVIEW' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={!isDemo}
                                title={!isDemo ? 'Fitur ini belum aktif' : undefined}
                                className={cn(
                                  'px-2.5 py-1 rounded border-2 border-black text-xs font-bold transition-all',
                                  isDemo
                                    ? 'bg-rose-100 text-rose-950 hover:bg-rose-200 cursor-pointer'
                                    : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
                                )}
                              >
                                Hapus
                              </button>
                              <button
                                type="button"
                                disabled={!isDemo}
                                title={!isDemo ? 'Fitur ini belum aktif' : undefined}
                                className={cn(
                                  'px-2.5 py-1 rounded border-2 border-black text-xs font-bold transition-all',
                                  isDemo
                                    ? 'bg-white text-black hover:bg-neutral-100 cursor-pointer'
                                    : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
                                )}
                              >
                                Abaikan
                              </button>
                              {!isDemo && <span className="text-xs bg-neutral-200 px-1 py-0.5 rounded font-mono text-neutral-600">(Belum Aktif)</span>}
                            </div>
                          ) : (
                            <span className="text-xs font-mono text-black/50">Telah Dihapus</span>
                          )}
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

      {/* TAB 2: GRUP BELAJAR */}
      {activeTab === 'grup-belajar' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <Users className="h-5 w-5 text-retro-orange" />
                <span>Supervisi Grup Belajar Mandiri Mahasiswa</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Pantau keaktifan komunitas belajar mandiri, topik pembahasan, dan fasilitator grup mahasiswa.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-white border border-black rounded-lg">
              Total {STUDY_GROUPS.length} Komunitas Mahasiswa
            </span>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Nama Grup Belajar</th>
                    <th className="p-3.5 sm:p-4">Fasilitator / Leader</th>
                    <th className="p-3.5 sm:p-4">Fokus & Topik Bahasan</th>
                    <th className="p-3.5 sm:p-4 text-center">Anggota</th>
                    <th className="p-3.5 sm:p-4">Tanggal Bentuk</th>
                    <th className="p-3.5 sm:p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {studyGroups.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-black/60 font-mono text-xs">
                        Belum ada grup belajar mahasiswa di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    studyGroups.map((g) => (
                      <tr key={g.id} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black max-w-sm">
                          <div>{g.name}</div>
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/80 font-semibold">{g.leader}</td>
                        <td className="p-3.5 sm:p-4 text-black/70">{g.topic}</td>
                        <td className="p-3.5 sm:p-4 text-center font-mono font-bold">{g.members} Mhs</td>
                        <td className="p-3.5 sm:p-4 font-mono text-xs">{g.createdDate}</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-2.5 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 font-mono text-xs font-bold">
                            AKTIF
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

      {/* TAB 3: PROGRAM MENTORING */}
      {activeTab === 'program-mentoring' && (
        <div className="space-y-4">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base text-black flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-retro-orange" />
                <span>Program Pendampingan Akademik & Mentoring Mahasiswa</span>
              </h2>
              <p className="text-xs text-black/70 mt-1">
                Staf memantau kemajuan inisiatif pendampingan adik tingkat, asistensi sebaya, dan pembinaan skripsi.
              </p>
            </div>
            <button
              type="button"
              disabled={!isDemo}
              title={!isDemo ? 'Fitur ini belum aktif' : undefined}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border-2 border-black text-xs font-black shadow-xs transition-all shrink-0',
                isDemo
                  ? 'bg-white text-black hover:bg-neutral-100 cursor-pointer'
                  : 'bg-neutral-200 text-neutral-500 border-neutral-400 cursor-not-allowed'
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Daftarkan Program Mentoring</span>
              {!isDemo && <span className="text-xs bg-neutral-200 px-1.5 py-0.2 rounded font-mono text-neutral-600">(Belum Aktif)</span>}
            </button>
          </div>

          <div className="rounded-xl border-2 border-black bg-white shadow-retro overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-black bg-neutral-100 font-mono font-bold uppercase text-black">
                  <tr>
                    <th className="p-3.5 sm:p-4">Nama Program Mentoring</th>
                    <th className="p-3.5 sm:p-4">Koordinator Program</th>
                    <th className="p-3.5 sm:p-4 text-center">Mentor</th>
                    <th className="p-3.5 sm:p-4 text-center">Mentee (Binaan)</th>
                    <th className="p-3.5 sm:p-4">Durasi Pelaksanaan</th>
                    <th className="p-3.5 sm:p-4 text-center">Status Program</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 font-medium">
                  {mentoringPrograms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-black/60 font-mono text-xs">
                        Belum ada program mentoring tersimpan di pangkalan data produksi.
                      </td>
                    </tr>
                  ) : (
                    mentoringPrograms.map((m) => (
                      <tr key={m.id} className="hover:bg-retro-warm/30 transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold text-black max-w-sm">
                          <div>{m.name}</div>
                        </td>
                        <td className="p-3.5 sm:p-4 text-black/80">{m.coordinator}</td>
                        <td className="p-3.5 sm:p-4 text-center font-mono font-bold">{m.mentorsCount} Orang</td>
                        <td className="p-3.5 sm:p-4 text-center font-mono font-bold text-retro-orange">{m.menteesCount} Mhs</td>
                        <td className="p-3.5 sm:p-4 text-xs font-mono">{m.duration}</td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-2.5 py-0.5 rounded border border-emerald-500 bg-emerald-100 text-emerald-950 font-mono text-xs font-bold">
                            BERJALAN
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
