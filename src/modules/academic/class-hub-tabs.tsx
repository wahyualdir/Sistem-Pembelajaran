'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Layers,
  BookOpen,
  FileText,
  Award,
  CalendarCheck2,
  MessagesSquare,
  GraduationCap,
  Users,
  Bell,
  FolderArchive,
  Key,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Download,
  Share2,
  Bookmark,
  Star,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Send,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
  ClipboardList,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RetroWindow } from '@/components/retro/retro-window';
import { MarkdownViewer } from '@/components/shared/markdown-viewer';
import { CreateAnnouncementForm, CreateAssignmentForm, CreateMaterialForm, SubmitForm } from './assignment-forms';
import { AssistantForm, RevokeAssistant } from './assistant-forms';
import { NewDiscussionForm } from './discussion-forms';
import { CreateQuizModal } from './quiz-components';
import { CreateAttendanceSessionModal, StudentCheckInForm, AttendanceSummaryCard } from './attendance-components';
import { DELEGABLE_LABELS } from './permissions';
import type { QuizItem } from './quiz-actions';
import type { AttendanceSession, StudentAttendanceSummary } from './attendance-actions';

export interface ClassDetailData {
  cls: {
    id: string;
    title: string;
    section: string;
    join_code: string;
    meta?: string | null;
    description?: string | null;
    schedule?: string | null;
    room?: string | null;
    sks?: number;
  };
  assignments: Array<{
    id: string;
    title: string;
    description?: string | null;
    due_at: string;
    close_at: string;
    submissions?: number;
    mine?: {
      submitted_at: string;
      is_late: boolean;
      text_body?: string | null;
      grade?: { score: number; max_score: number; comment?: string | null } | null;
    } | null;
  }>;
  materials: Array<{
    id: string;
    title: string;
    created_at: string;
    body_md?: string | null;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    body?: string | null;
    created_at: string;
  }>;
  discussions: Array<{
    id: string;
    title: string;
    author_name: string;
    created_at: string;
    reply_count: number;
    is_pinned?: boolean;
    is_locked?: boolean;
  }>;
  members?: Array<{
    student_id: string;
    name: string;
    enrolled_at?: string;
  }>;
  assistants?: Array<{
    user_id: string;
    name: string;
    email: string;
    permissions: string[];
  }>;
  viewer: string;
  perms?: string[];
  quizzes?: QuizItem[];
  attendanceSessions?: AttendanceSession[];
  attendanceSummary?: StudentAttendanceSummary | null;
}

// 4 TAB IKONIK GOOGLE CLASSROOM
export const TA_CLASSROOM_TABS = [
  { id: 'bantu-presensi', label: 'Bantu Presensi', icon: CalendarCheck2, badgeLabel: 'Presensi' },
  { id: 'jawab-forum', label: 'Jawab Forum', icon: MessagesSquare, badgeLabel: 'Forum' },
  { id: 'materi-asisten', label: 'Materi Asisten', icon: BookOpen, badgeLabel: 'Materi' },
  { id: 'peserta', label: 'Peserta', icon: Users, badgeLabel: 'Peserta' },
] as const;

export const LECTURER_CLASSROOM_TABS = [
  { id: 'materi', label: 'Materi', icon: BookOpen, badgeLabel: 'Materi' },
  { id: 'tugas', label: 'Tugas & Penilaian', icon: ClipboardList, badgeLabel: 'Classwork' },
  { id: 'peserta', label: 'Peserta', icon: Users, badgeLabel: 'Peserta' },
  { id: 'asisten', label: 'Asisten', icon: UserCheck, badgeLabel: 'Asisten' },
  { id: 'forum', label: 'Forum & Pengumuman', icon: MessagesSquare, badgeLabel: 'Stream' },
  { id: 'presensi', label: 'Presensi', icon: CalendarCheck2, badgeLabel: 'Presensi' },
  { id: 'nilai', label: 'Nilai', icon: GraduationCap, badgeLabel: 'Grades' },
] as const;

export const STUDENT_CLASSROOM_TABS = [
  { id: 'forum', label: 'Forum', icon: MessagesSquare, badgeLabel: 'Stream' },
  { id: 'tugas', label: 'Tugas Kelas', icon: ClipboardList, badgeLabel: 'Classwork' },
  { id: 'anggota', label: 'Anggota', icon: Users, badgeLabel: 'People' },
  { id: 'nilai', label: 'Nilai', icon: GraduationCap, badgeLabel: 'Grades' },
] as const;

export const CLASSROOM_TABS = STUDENT_CLASSROOM_TABS;
export type ClassroomTabId = string;

const fmt = (iso: string) =>
  `${new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  })} WIB`;

export function ClassHubTabs({ data }: { data: ClassDetailData }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [copiedCode, setCopiedCode] = useState(false);
  const [classworkFilter, setClassworkFilter] = useState<'all' | 'tugas' | 'materi' | 'ujian' | 'presensi'>('all');
  const [isAnnounceOpen, setIsAnnounceOpen] = useState(false);
  const [isClassworkCreateOpen, setIsClassworkCreateOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const {
    cls,
    assignments = [],
    materials = [],
    announcements = [],
    discussions = [],
    members = [],
    assistants = [],
    viewer,
    perms = [],
    quizzes = [],
    attendanceSessions = [],
    attendanceSummary,
  } = data;

  const lecturer = viewer === 'LECTURER';
  const ta = viewer === 'TA';
  const student = viewer === 'STUDENT';
  const can = (p: string) => !!perms?.includes(p);

  const roleTabs = ta
    ? TA_CLASSROOM_TABS
    : lecturer
    ? LECTURER_CLASSROOM_TABS
    : STUDENT_CLASSROOM_TABS;

  const tabParam = searchParams?.get('tab');
  const validTabIds = roleTabs.map((t) => t.id as string);
  const activeTab = (tabParam && validTabIds.includes(tabParam))
    ? tabParam
    : (roleTabs[0].id as string);

  const setActiveTab = (tabId: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', tabId);
    router.push(`/classes/${cls.id}?${params.toString()}`);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cls.join_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Hitung tugas mendatang (deadlines)
  const upcomingAssignments = assignments.filter((a) => {
    return Date.parse(a.close_at) >= Date.now();
  });

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-up font-sans p-4 sm:p-6 lg:p-9">
      {/* ======================================================== */}
      {/* 1. TOP NAVIGASI GOOGLE CLASSROOM (TAB BESAR PER PERAN)   */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4">
        {/* Tombol Kembali ke Daftar Kelas */}
        <Link
          href="/classes"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-black bg-white font-bold text-xs sm:text-sm text-black shadow-retro hover:bg-retro-warm transition-all w-fit"
        >
          <span>&larr;</span>
          <span>Daftar Kelas</span>
        </Link>

        {/* TAB PER PERAN TERPISAH (SINKRON DENGAN ?tab=...) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-1">
          {roleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer',
                  isActive
                    ? 'border-2 border-black bg-black text-white shadow-retro scale-[1.02]'
                    : 'border-2 border-black bg-white text-black shadow-xs hover:bg-retro-warm'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Kode Kelas Cepat untuk Pengajar */}
        <div className="flex items-center gap-2">
          {lecturer && (
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-xs font-bold bg-retro-yellow text-black border-2 border-black px-3 py-1.5 rounded-lg shadow-xs hover:bg-white transition-all flex items-center gap-1.5"
              title="Salin Kode Kelas"
            >
              <Key className="h-3.5 w-3.5 text-retro-orange" />
              <span>{cls.join_code}</span>
              {copiedCode ? (
                <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-bold">Disalin!</span>
              ) : (
                <span className="text-[10px] text-black/60 font-medium">Salin</span>
              )}
            </button>
          )}
          <span className="text-xs font-bold text-black bg-retro-warm border-2 border-black px-2.5 py-1.5 rounded-lg">
            {cls.sks || 3} SKS
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB: FORUM / JAWAB FORUM                                 */}
      {/* ======================================================== */}
      {(activeTab === 'forum' || activeTab === 'jawab-forum') && (
        <div className="space-y-6">
          {/* A. HERO COVER BANNER ALA GOOGLE CLASSROOM */}
          <div className="rounded-2xl border-2 border-black bg-[#FFE4D6] shadow-[6px_6px_0px_#000000] p-6 sm:p-8 lg:p-10 relative overflow-hidden">
            {/* Header Baris & Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border border-black bg-[#FF5F56] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                <span className="h-3.5 w-3.5 rounded-full border border-black bg-[#FFBD2E] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                <span className="h-3.5 w-3.5 rounded-full border border-black bg-[#27C93F] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                <span className="text-xs font-semibold text-black ml-2">
                  Kelas {cls.section}
                </span>
              </div>
              <span className="text-xs font-medium bg-white border-2 border-black px-3 py-1 rounded-lg shadow-xs">
                Semester Ganjil 2026/2027
              </span>
            </div>

            <div className="space-y-2 max-w-3xl">
              <span className="text-xs font-semibold text-black bg-retro-yellow px-2.5 py-1 rounded border border-black inline-block shadow-xs">
                Kelas {cls.section}
              </span>
              <h1 className="font-bold text-2xl sm:text-3xl text-black tracking-tight leading-snug">
                {cls.title}
              </h1>
              <p className="text-xs sm:text-sm font-normal text-black/75 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-retro-orange" />
                  {cls.schedule || 'Senin, 08:00 - 10:30 WIB'}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-retro-orange" />
                  {cls.room || 'Lab Komputer 2 (Hybrid)'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-retro-orange" />
                  {members.length} Mahasiswa
                </span>
              </p>
            </div>
          </div>

          {/* B. DUA KOLOM: SIDEBAR WIDGETS (KIRI) & STREAM FEED (KANAN) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Kolom Kiri: Widget Mendatang & Info Kelas */}
            <div className="lg:col-span-4 space-y-5">
              {/* Widget Mendatang (Google Classroom Upcoming) */}
              <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-retro space-y-3.5">
                <div className="flex items-center justify-between border-b-2 border-black/15 pb-2.5">
                  <h3 className="font-bold text-sm text-black flex items-center gap-2">
                    <Clock className="h-4 w-4 text-retro-orange" />
                    <span>Mendatang</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tugas')}
                    className="text-xs font-bold text-retro-orange hover:underline"
                  >
                    Lihat semua
                  </button>
                </div>

                {upcomingAssignments.length === 0 ? (
                  <p className="text-xs text-black/70 font-medium py-1">
                    Semua tugas telah selesai. Tidak ada batas waktu yang dekat!
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {upcomingAssignments.slice(0, 3).map((a) => (
                      <div key={a.id} className="p-3 rounded-xl border border-black/20 bg-retro-warm/30 space-y-1">
                        <span className="text-[11px] font-semibold text-black/60 block">
                          Batas: {fmt(a.close_at)}
                        </span>
                        <p className="text-xs font-bold text-black truncate">{a.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Widget Presensi Hari Ini */}
              <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-retro space-y-3">
                <h3 className="font-bold text-sm text-black flex items-center gap-2 border-b-2 border-black/15 pb-2.5">
                  <CalendarCheck2 className="h-4 w-4 text-retro-orange" />
                  <span>Presensi Perkuliahan</span>
                </h3>
                {attendanceSessions.length > 0 && attendanceSessions.some((s) => s.is_open) ? (
                  <div className="p-3.5 rounded-xl border-2 border-black bg-retro-yellow/40 space-y-2 text-xs">
                    <span className="font-bold text-black block">Sesi Pertemuan Sedang Dibuka!</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tugas')}
                      className="w-full py-2 rounded-lg border-2 border-black bg-black text-white font-bold text-xs shadow-xs"
                    >
                      Buka Lembar Presensi
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-black/70 font-medium">
                    Tidak ada sesi presensi aktif saat ini. Dosen akan mengaktifkan presensi saat kelas dimulai.
                  </p>
                )}
              </div>

              {/* Widget Info Singkat Kelas */}
              <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-retro space-y-2.5 text-xs">
                <h4 className="font-bold text-xs text-black/75 uppercase tracking-wider mb-2">
                  Spesifikasi Akademik
                </h4>
                <div className="flex justify-between py-1 border-b border-black/10 font-medium">
                  <span className="text-black/70">Bobot Kredit</span>
                  <span className="font-bold text-black">{cls.sks || 3} SKS</span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/10 font-medium">
                  <span className="text-black/70">Kode Pendaftaran</span>
                  <span className="font-bold text-black">{cls.join_code}</span>
                </div>
                <div className="flex justify-between py-1 font-medium">
                  <span className="text-black/70">Kehadiran Minimal</span>
                  <span className="font-bold text-retro-orange">75% (Syarat UAS)</span>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Main Stream Feed */}
            <div className="lg:col-span-8 space-y-5">
              {/* Post Box "Umumkan sesuatu ke kelas Anda..." */}
              <div className="rounded-2xl border-2 border-black bg-white shadow-retro p-4 sm:p-5 space-y-3">
                <div
                  onClick={() => setIsAnnounceOpen(!isAnnounceOpen)}
                  className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl border border-black/25 bg-neutral-50 hover:bg-retro-warm/30 cursor-pointer transition-all"
                >
                  <div className="h-9 w-9 rounded-full border-2 border-black bg-retro-warm flex items-center justify-center font-bold text-xs shrink-0">
                    {viewer === 'LECTURER' ? 'DS' : 'MH'}
                  </div>
                  <span className="text-xs sm:text-sm font-normal text-black/65 flex-1">
                    Umumkan sesuatu atau ajukan pertanyaan ke kelas...
                  </span>
                  <Send className="h-4 w-4 text-black/40 shrink-0" />
                </div>

                {isAnnounceOpen && (
                  <div className="pt-3 border-t-2 border-black/15 animate-fade-up space-y-3">
                    <h4 className="text-xs font-bold text-black">
                      {lecturer ? 'Kirim Pengumuman Resmi Dosen' : 'Mulai Topik Diskusi Mahasiswa'}
                    </h4>
                    {lecturer ? (
                      <CreateAnnouncementForm classId={cls.id} />
                    ) : (
                      <NewDiscussionForm classId={cls.id} />
                    )}
                  </div>
                )}
              </div>

              {/* Feed: Pengumuman Dosen & Diskusi Kelas */}
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-5 sm:p-6 rounded-2xl border-2 border-black bg-white shadow-retro space-y-3 animate-fade-up"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full border-2 border-black bg-retro-orange text-white flex items-center justify-center font-bold text-xs shrink-0">
                          DS
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-semibold text-black block">
                            Dosen Pengampu Kelas
                          </span>
                          <span className="text-[11px] font-normal text-black/60">{fmt(a.created_at)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium uppercase bg-retro-warm px-2 py-0.5 rounded border border-black">
                        Pengumuman
                      </span>
                    </div>

                    <h3 className="font-bold text-base sm:text-lg text-black">{a.title}</h3>
                    {a.body && <MarkdownViewer content={a.body} className="text-xs sm:text-sm text-black/85" />}
                  </div>
                ))}

                {/* Notifikasi Tugas Baru di Stream */}
                {assignments.slice(0, 2).map((asg) => (
                  <div
                    key={asg.id}
                    onClick={() => setActiveTab('tugas')}
                    className="p-4 sm:p-5 rounded-2xl border-2 border-black bg-white shadow-retro hover:bg-retro-warm/20 cursor-pointer transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl border-2 border-black bg-[#D8F3DC] text-black shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs text-black/60 font-normal block">
                          Tugas Baru
                        </span>
                        <h4 className="font-semibold text-sm sm:text-base text-black">{asg.title}</h4>
                        <span className="text-[11px] font-medium text-black/60">Batas: {fmt(asg.due_at)}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-black shrink-0" />
                  </div>
                ))}

                {/* Diskusi Kelas */}
                {discussions.map((d) => (
                  <Link
                    key={d.id}
                    href={`/classes/${cls.id}/discussions/${d.id}`}
                    className="p-5 rounded-2xl border-2 border-black bg-white shadow-retro hover:bg-retro-warm/20 transition-all flex items-center justify-between gap-4 block"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl border-2 border-black bg-retro-warm text-black shrink-0">
                        <MessagesSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm sm:text-base text-black hover:underline">
                          {d.title}
                        </h4>
                        <p className="text-xs text-black/70 font-normal">
                          Oleh <strong>{d.author_name}</strong> · {d.reply_count} Balasan
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-black bg-retro-warm border border-black px-2.5 py-1 rounded-lg shrink-0">
                      Diskusi &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TUGAS KELAS (CLASSWORK GOOGLE CLASSROOM)          */}
      {/* ======================================================== */}
      {activeTab === 'tugas' && (
        <div className="space-y-6">
          {/* Action Bar & Filter Chips Topik */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000]">
            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'Semua Materi & Tugas' },
                { id: 'tugas', label: 'Tugas Praktikum' },
                { id: 'ujian', label: 'Ujian & Kuis CBT' },
                { id: 'materi', label: 'Modul Kuliah' },
                { id: 'presensi', label: 'Sesi Presensi' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setClassworkFilter(f.id as any)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0',
                    classworkFilter === f.id
                      ? 'border-2 border-black bg-black text-white shadow-xs'
                      : 'border-2 border-black bg-white text-black hover:bg-retro-warm'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Tombol "+ Buat" untuk Dosen */}
            {lecturer && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsClassworkCreateOpen(!isClassworkCreateOpen)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black bg-black text-white font-semibold text-xs sm:text-sm shadow-retro hover:bg-neutral-800 transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>{isClassworkCreateOpen ? 'Tutup Form' : '+ Buat Baru'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Form Pembuatan Konten jika Dosen mengklik "+ Buat" */}
          {lecturer && isClassworkCreateOpen && (
            <div className="p-6 rounded-2xl border-2 border-black bg-retro-warm/50 shadow-retro space-y-6 animate-fade-up">
              <h3 className="font-bold text-base text-black flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-retro-orange" />
                <span>Publikasikan Tugas atau Materi</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border-2 border-black bg-white space-y-3">
                  <h4 className="font-bold text-sm text-black flex items-center gap-2">
                    <FileText className="h-4 w-4 text-retro-orange" /> Terbitkan Tugas Baru
                  </h4>
                  <CreateAssignmentForm classId={cls.id} />
                </div>

                <div className="p-5 rounded-xl border-2 border-black bg-white space-y-3">
                  <h4 className="font-bold text-sm text-black flex items-center gap-2">
                    <FolderArchive className="h-4 w-4 text-retro-orange" /> Unggah Modul / Materi
                  </h4>
                  <CreateMaterialForm classId={cls.id} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t-2 border-black/20">
                <CreateQuizModal classId={cls.id} />
                <CreateAttendanceSessionModal classId={cls.id} nextMeetingNumber={attendanceSessions.length + 1} />
              </div>
            </div>
          )}

          {/* DAFTAR KONTEN TERSTRUKTUR PER KATEGORI (GOOGLE CLASSWORK) */}
          <div className="space-y-6">
            {/* Topik 1: Tugas Perkuliahan */}
            {(classworkFilter === 'all' || classworkFilter === 'tugas') && (
              <div className="space-y-3">
                <h3 className="font-bold text-base sm:text-lg text-black flex items-center gap-2">
                  <FileText className="h-5 w-5 text-retro-orange" />
                  <span>Tugas Perkuliahan</span>
                </h3>

                {assignments.length === 0 ? (
                  <p className="text-xs text-black/60 italic p-4 bg-white rounded-xl border border-black/20">
                    Belum ada tugas perkuliahan yang diterbitkan.
                  </p>
                ) : (
                  assignments.map((a) => {
                    const isExpanded = !!expandedItems[a.id];
                    const closed = Date.now() > Date.parse(a.close_at);
                    return (
                      <div
                        key={a.id}
                        className="rounded-2xl border-2 border-black bg-white shadow-retro overflow-hidden transition-all"
                      >
                        {/* Header Baris Tugas */}
                        <div
                          onClick={() => toggleExpand(a.id)}
                          className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="p-2.5 rounded-xl border-2 border-black bg-[#D8F3DC] text-black shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-sm sm:text-base text-black truncate">
                                {a.title}
                              </h4>
                              <span className="text-xs text-black/60 font-medium">Batas: {fmt(a.due_at)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {student && (
                              <span
                                className={cn(
                                  'text-xs font-semibold px-2.5 py-1 rounded-lg border border-black',
                                  a.mine ? 'bg-retro-mint text-black' : closed ? 'bg-danger text-white' : 'bg-retro-warm text-black'
                                )}
                              >
                                {a.mine ? 'Diserahkan' : closed ? 'Ditutup' : 'Ditugaskan'}
                              </span>
                            )}
                            {lecturer && (
                              <span className="text-xs font-medium bg-retro-warm border border-black px-2 py-1 rounded-lg">
                                {a.submissions ?? 0} Submisi
                              </span>
                            )}
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </div>
                        </div>

                        {/* Detail Tugas jika diperluas */}
                        {isExpanded && (
                          <div className="p-5 sm:p-6 border-t-2 border-black/15 bg-neutral-50 space-y-4 animate-fade-up">
                            {a.description && (
                              <div className="p-4 rounded-xl border border-black/20 bg-white">
                                <MarkdownViewer content={a.description} />
                              </div>
                            )}

                            {/* Aksi Tugas: Review untuk Dosen / Submit untuk Mahasiswa */}
                            <div className="pt-2">
                              {lecturer || (ta && can('submission.review')) ? (
                                <Link
                                  href={`/classes/${cls.id}/assignments/${a.id}`}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black bg-black text-white font-bold text-xs sm:text-sm shadow-xs hover:bg-neutral-800"
                                >
                                  <span>Tinjau & Beri Nilai {a.submissions ?? 0} Submisi</span>
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              ) : a.mine ? (
                                <div className="p-4 rounded-xl border-2 border-black bg-retro-mint/40 text-xs sm:text-sm font-bold text-black space-y-1">
                                  <p className="flex items-center gap-1.5 text-black">
                                    <CheckCircle2 className="h-4 w-4 text-black" />
                                    <span>Sudah berhasil dikumpulkan pada {fmt(a.mine.submitted_at)}</span>
                                  </p>
                                  {a.mine.grade && (
                                    <p className="pt-1 text-black font-semibold">
                                      Nilai: {a.mine.grade.score} / {a.mine.grade.max_score}
                                      {a.mine.grade.comment ? ` · Feedback: "${a.mine.grade.comment}"` : ''}
                                    </p>
                                  )}
                                </div>
                              ) : closed ? (
                                <p className="text-xs font-bold text-danger">Batas waktu pengumpulan tugas telah berakhir.</p>
                              ) : (
                                <SubmitForm assignmentId={a.id} />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Topik 2: Ujian & Kuis CBT */}
            {(classworkFilter === 'all' || classworkFilter === 'ujian') && (
              <div className="space-y-3">
                <h3 className="font-bold text-base sm:text-lg text-black flex items-center gap-2">
                  <Award className="h-5 w-5 text-retro-orange" />
                  <span>Ujian & Kuis CBT</span>
                </h3>

                {quizzes.length === 0 ? (
                  <p className="text-xs text-black/60 italic p-4 bg-white rounded-xl border border-black/20">
                    Belum ada kuis atau ujian yang aktif di kelas ini.
                  </p>
                ) : (
                  quizzes.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 sm:p-5 rounded-2xl border-2 border-black bg-white shadow-retro flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl border-2 border-black bg-retro-yellow text-black shrink-0">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm sm:text-base text-black">{q.title}</h4>
                            <span className="text-[10px] font-medium bg-retro-warm border border-black px-2 py-0.5 rounded">
                              {q.exam_type ?? 'KUIS'}
                            </span>
                          </div>
                          <p className="text-xs text-black/70 font-normal mt-0.5">
                            Durasi: {q.duration_minutes} Menit · Total: {q.total_points} Poin · KKM: {q.kkm ?? 70}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/classes/${cls.id}/quizzes/${q.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 font-bold text-xs sm:text-sm shadow-xs shrink-0"
                      >
                        <span>Buka Lembar Ujian</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Topik 3: Materi Kuliah */}
            {(classworkFilter === 'all' || classworkFilter === 'materi') && (
              <div className="space-y-3">
                <h3 className="font-bold text-base sm:text-lg text-black flex items-center gap-2">
                  <FolderArchive className="h-5 w-5 text-retro-orange" />
                  <span>Materi Perkuliahan</span>
                </h3>

                {materials.length === 0 ? (
                  <p className="text-xs text-black/60 italic p-4 bg-white rounded-xl border border-black/20">
                    Belum ada modul materi kuliah yang diunggah.
                  </p>
                ) : (
                  materials.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl border-2 border-black bg-white shadow-retro space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl border-2 border-black bg-[#E0F4FF] text-black">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-base text-black">{m.title}</h4>
                            <span className="text-xs font-normal text-black/60">{fmt(m.created_at)}</span>
                          </div>
                        </div>
                        <span className="text-xs font-medium bg-retro-warm px-2.5 py-1 rounded border border-black">
                          Modul #{idx + 1}
                        </span>
                      </div>
                      {m.body_md && (
                        <div className="p-4 rounded-xl border border-black/20 bg-retro-warm/20 text-xs sm:text-sm">
                          <MarkdownViewer content={m.body_md} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Topik 4: Sesi Presensi */}
            {(classworkFilter === 'all' || classworkFilter === 'presensi') && (
              <div className="space-y-3">
                <h3 className="font-bold text-base sm:text-lg text-black flex items-center gap-2">
                  <CalendarCheck2 className="h-5 w-5 text-retro-orange" />
                  <span>Presensi Perkuliahan</span>
                </h3>

                {attendanceSessions.length === 0 ? (
                  <p className="text-xs text-black/60 italic p-4 bg-white rounded-xl border border-black/20">
                    Belum ada sesi presensi yang dibuat di kelas ini.
                  </p>
                ) : (
                  attendanceSessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 sm:p-5 rounded-2xl border-2 border-black bg-white shadow-retro flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl border-2 border-black bg-retro-warm text-black shrink-0">
                          <CalendarCheck2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm sm:text-base text-black">{s.title}</h4>
                            <span
                              className={cn(
                                'text-[10px] font-semibold px-2 py-0.5 rounded border border-black',
                                s.is_open ? 'bg-retro-mint text-black' : 'bg-neutral-200 text-black/60'
                              )}
                            >
                              {s.is_open ? 'BUKA' : 'DITUTUP'}
                            </span>
                          </div>
                          <span className="text-xs font-normal text-black/60">
                            Pertemuan #{s.meeting_number} · {s.date} ({s.start_time} - {s.end_time} WIB)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {lecturer && (
                          <span className="text-xs font-bold bg-retro-warm border border-black px-2.5 py-1 rounded">
                            Kode: {s.code}
                          </span>
                        )}
                        <Link
                          href={`/classes/${cls.id}/attendance`}
                          className="px-3.5 py-1.5 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-bold shadow-xs"
                        >
                          Detail Sesi &rarr;
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: ANGGOTA / PESERTA KELAS                             */}
      {/* ======================================================== */}
      {(activeTab === 'anggota' || activeTab === 'peserta') && (
        <div className="space-y-8">
          {/* Section Pengajar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black/20 pb-3">
              <h3 className="font-bold text-lg sm:text-xl text-black flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-retro-orange" />
                <span>Dosen & Pengajar</span>
              </h3>
              <span className="text-xs font-medium bg-retro-warm border border-black px-2.5 py-1 rounded">
                {(assistants?.length ?? 0) + 1} Pengajar
              </span>
            </div>

            {/* Dosen Utama */}
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-black bg-white shadow-retro flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-full border-2 border-black bg-[#FFE4D6] flex items-center justify-center font-bold text-sm text-black shrink-0">
                  BS
                </div>
                <div>
                  <h4 className="font-semibold text-base text-black">Dr. Budi Santoso, M.Kom</h4>
                  <span className="text-xs text-black/60 font-normal">Dosen Pengampu Utama</span>
                </div>
              </div>
              <span className="text-xs font-medium bg-retro-yellow border border-black px-3 py-1 rounded-lg">
                Dosen
              </span>
            </div>

            {/* Asisten Dosen */}
            {assistants && assistants.length > 0 && (
              <div className="space-y-3">
                {assistants.map((ast) => (
                  <div
                    key={ast.user_id}
                    className="p-4 rounded-2xl border-2 border-black bg-white shadow-retro flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-full border-2 border-black bg-retro-warm flex items-center justify-center font-bold text-xs text-black shrink-0">
                        {ast.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-black">{ast.name}</h4>
                        <span className="text-xs text-black/60">{ast.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-retro-mint border border-black px-2.5 py-1 rounded">
                        Asisten Dosen
                      </span>
                      {lecturer && <RevokeAssistant classId={cls.id} email={ast.email} name={ast.name} />}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form Tambah Asisten untuk Dosen */}
            {lecturer && (
              <div className="p-5 rounded-2xl border-2 border-black bg-retro-warm/40 space-y-3">
                <h4 className="font-bold text-sm text-black">+ Tambah Asisten Dosen Baru</h4>
                <AssistantForm classId={cls.id} />
              </div>
            )}
          </div>

          {/* Section Teman Sekelas (Mahasiswa) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black/20 pb-3">
              <h3 className="font-bold text-lg sm:text-xl text-black flex items-center gap-2">
                <Users className="h-5 w-5 text-retro-orange" />
                <span>Daftar Mahasiswa</span>
              </h3>
              <span className="text-xs font-medium bg-retro-warm border border-black px-2.5 py-1 rounded">
                {members.length} Mahasiswa
              </span>
            </div>

            {members.length === 0 ? (
              <p className="text-xs text-black/60 italic p-6 bg-white rounded-2xl border border-black/20 text-center">
                Belum ada mahasiswa yang terdaftar di kelas ini.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {members.map((m, idx) => (
                  <div
                    key={m.student_id}
                    className="p-3.5 rounded-xl border-2 border-black bg-white shadow-retro flex items-center gap-3"
                  >
                    <div className="h-9 w-9 rounded-full border-2 border-black bg-retro-warm flex items-center justify-center font-bold text-xs shrink-0">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm text-black truncate">{m.name}</p>
                      <span className="text-[11px] font-normal text-black/60">Peserta #{idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: ASISTEN (KHUSUS DOSEN PENGAMPU)                     */}
      {/* ======================================================== */}
      {activeTab === 'asisten' && (
        <div className="space-y-6">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-heading font-black text-lg text-black">Kelola Asisten Dosen & Hak Akses</h3>
              <p className="text-xs text-black/70 font-medium">Delegasikan izin pengelolaan presensi, koreksi tugas, dan materi kelas kepada asisten resmi.</p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-white border border-black rounded-lg">
              {assistants?.length ?? 0} Asisten Aktif
            </span>
          </div>

          {/* Daftar Asisten */}
          {assistants && assistants.length > 0 && (
            <div className="space-y-3">
              {assistants.map((ast) => (
                <div key={ast.user_id} className="p-4 rounded-2xl border-2 border-black bg-white shadow-retro flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-full border-2 border-black bg-retro-warm flex items-center justify-center font-bold text-xs text-black shrink-0">
                      {ast.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-black">{ast.name}</h4>
                      <span className="text-xs text-black/60">{ast.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-retro-mint border border-black px-2.5 py-1 rounded">Asisten Dosen</span>
                    {lecturer && <RevokeAssistant classId={cls.id} email={ast.email} name={ast.name} />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form Tambah Asisten untuk Dosen */}
          {lecturer && (
            <div className="p-5 rounded-2xl border-2 border-black bg-retro-warm/40 space-y-3">
              <h4 className="font-bold text-sm text-black">+ Tambah Asisten Dosen Baru</h4>
              <AssistantForm classId={cls.id} />
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: MATERI / MATERI ASISTEN                             */}
      {/* ======================================================== */}
      {(activeTab === 'materi' || activeTab === 'materi-asisten') && (
        <div className="space-y-6">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-heading font-black text-lg text-black">Modul & Bahan Pembelajaran</h3>
              <p className="text-xs text-black/70 font-medium">Bahan ajar kuliah, slide presentasi, panduan praktikum lab, dan referensi bacaan.</p>
            </div>
            {(lecturer || ta) && (
              <span className="text-xs font-mono font-bold px-3 py-1 bg-white border border-black rounded-lg">
                {materials.length} Modul Terbit
              </span>
            )}
          </div>

          {(lecturer || ta) && (
            <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-retro space-y-3">
              <h4 className="font-bold text-sm text-black flex items-center gap-2">
                <FolderArchive className="h-4 w-4 text-retro-orange" /> Unggah Modul / Materi Baru
              </h4>
              <CreateMaterialForm classId={cls.id} />
            </div>
          )}

          {/* Daftar Materi */}
          <div className="space-y-3">
            {materials.length === 0 ? (
              <p className="text-xs text-black/60 italic p-6 bg-white rounded-xl border border-black/20 text-center">
                Belum ada modul materi kuliah yang diunggah.
              </p>
            ) : (
              materials.map((m, idx) => (
                <div key={m.id} className="p-5 rounded-2xl border-2 border-black bg-white shadow-retro space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl border-2 border-black bg-[#E0F4FF] text-black">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base text-black">{m.title}</h4>
                        <span className="text-xs font-normal text-black/60">{fmt(m.created_at)}</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-retro-warm px-2.5 py-1 rounded border border-black">
                      Modul #{idx + 1}
                    </span>
                  </div>
                  {m.body_md && (
                    <div className="p-4 rounded-xl border border-black/20 bg-retro-warm/20 text-xs sm:text-sm">
                      <MarkdownViewer content={m.body_md} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: PRESENSI / BANTU PRESENSI                           */}
      {/* ======================================================== */}
      {(activeTab === 'presensi' || activeTab === 'bantu-presensi') && (
        <div className="space-y-6">
          <div className="p-4 bg-retro-warm border-2 border-black rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-heading font-black text-lg text-black">
                {ta ? 'Bantu Presensi Kelas & Sesi Kehadiran' : 'Presensi Perkuliahan Kelas'}
              </h3>
              <p className="text-xs text-black/70 font-medium">
                {ta
                  ? 'Bantu dosen memvalidasi kehadiran mahasiswa via kode sesi, QR token berputar, dan rekap partisipasi.'
                  : 'Kelola sesi kehadiran pertemuan tatap muka, monitoring QR berputar, dan verifikasi izin dispensasi.'}
              </p>
            </div>
            {lecturer && (
              <CreateAttendanceSessionModal classId={cls.id} nextMeetingNumber={attendanceSessions.length + 1} />
            )}
          </div>

          {attendanceSummary && (
            <AttendanceSummaryCard
              summary={{
                total_sessions: attendanceSummary.total_sessions,
                hadir_count:
                  (attendanceSummary as any).hadir_count ??
                  (attendanceSummary as any).attended_count ??
                  0,
                percentage: attendanceSummary.percentage,
                can_take_uas: attendanceSummary.can_take_uas,
              }}
            />
          )}

          {/* Daftar Sesi Presensi */}
          <div className="space-y-3">
            {attendanceSessions.length === 0 ? (
              <p className="text-xs text-black/60 italic p-6 bg-white rounded-xl border border-black/20 text-center">
                Belum ada sesi presensi yang dibuat di kelas ini.
              </p>
            ) : (
              attendanceSessions.map((s) => (
                <div key={s.id} className="p-4 sm:p-5 rounded-2xl border-2 border-black bg-white shadow-retro flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl border-2 border-black bg-retro-warm text-black shrink-0">
                      <CalendarCheck2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm sm:text-base text-black">{s.title}</h4>
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded border border-black', s.is_open ? 'bg-retro-mint text-black' : 'bg-neutral-200 text-black/60')}>
                          {s.is_open ? 'BUKA' : 'DITUTUP'}
                        </span>
                      </div>
                      <span className="text-xs font-normal text-black/60">
                        Pertemuan #{s.meeting_number} · {s.date} ({s.start_time} - {s.end_time} WIB)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {(lecturer || ta) && (
                      <span className="text-xs font-bold bg-retro-warm border border-black px-2.5 py-1 rounded">
                        Kode: {s.code}
                      </span>
                    )}
                    <Link
                      href={`/classes/${cls.id}/attendance`}
                      className="px-3.5 py-1.5 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-bold shadow-xs"
                    >
                      Detail Sesi &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: NILAI (GRADES GOOGLE CLASSROOM)                   */}
      {/* ======================================================== */}
      {activeTab === 'nilai' && (
        <div className="space-y-6">
          {/* Summary Card Nilai */}
          <div className="p-6 sm:p-7 rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0px_#000] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/15 pb-4">
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-black flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-retro-orange" />
                  <span>Buku Nilai & Transkrip</span>
                </h3>
                <p className="text-xs text-black/70 mt-0.5 font-normal">
                  Rekapitulasi capaian tugas, kuis, dan evaluasi perkuliahan.
                </p>
              </div>

              <Link
                href={`/classes/${cls.id}/gradebook`}
                className="px-4 py-2 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-semibold shadow-xs inline-flex items-center gap-2 w-fit"
              >
                <span>Buka Gradebook Lengkap</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Bobot Nilai Standar Kurikulum OBE */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Tugas & Praktikum', bobot: '30%', score: '88.5' },
                { label: 'Ujian Tengah (UTS)', bobot: '30%', score: '85.0' },
                { label: 'Ujian Akhir (UAS)', bobot: '30%', score: '90.0' },
                { label: 'Kehadiran Kuliah', bobot: '10%', score: '95.0' },
              ].map((it, i) => (
                <div key={i} className="p-4 rounded-xl border-2 border-black bg-retro-warm/40 text-center space-y-1 shadow-xs">
                  <span className="text-[11px] font-semibold text-black/60 uppercase">{it.label}</span>
                  <p className="text-2xl font-bold text-black">{it.score}</p>
                  <span className="text-[10px] font-normal text-black/70">Bobot {it.bobot}</span>
                </div>
              ))}
            </div>

            {/* Rekap Nilai Akhir */}
            <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-retro-yellow text-black flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-black/80">Estimasi Nilai Akhir</p>
                <p className="text-2xl sm:text-3xl font-bold">A (Nilai Akhir: 88.55)</p>
              </div>
              <span className="px-4 py-2 rounded-xl bg-black text-white text-xs sm:text-sm font-semibold shadow-xs">
                LULUS KKM
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
