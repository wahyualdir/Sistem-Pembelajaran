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
  ArrowLeft,
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
  Video,
  Lock,
  Play,
  Map,
  BarChart3,
  Sliders,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RetroWindow } from '@/components/retro/retro-window';
import { MarkdownViewer } from '@/components/shared/markdown-viewer';
import { ClassIslandMap } from './class-island-map';
import { ClassChaptersTab } from './class-chapters-tab';
import { ClassProgressTab } from './class-progress-tab';
import { ClassFeatureSettingsTab } from './class-feature-settings-tab';
import { TabAktivitasKelas } from '@/components/aktivitas/tab-aktivitas-kelas';
import { RetroLiveClassroom } from '@/components/retro/retro-live-classroom';
import { RetroDocViewer } from '@/components/retro/retro-doc-viewer';
import type {
  ClassMapItem,
  ClassChapterItem,
  ChapterDistributionItem,
  HardestTopicItem,
  LaggingStudentItem,
} from './peta-pulau-actions';
import { CreateAnnouncementForm, CreateAssignmentForm, CreateMaterialForm, SubmitForm } from './assignment-forms';
import { AssistantForm, RevokeAssistant } from './assistant-forms';
import { CreateQuizModal } from './quiz-components';
import { CreateAttendanceSessionModal, StudentCheckInForm, AttendanceSummaryCard } from './attendance-components';
import { DELEGABLE_LABELS } from './permissions';
import type { QuizItem } from './quiz-actions';
import type { AttendanceSession, StudentAttendanceSummary } from './attendance-actions';
import { ClassRiskCard } from '@/modules/early-warning/class-risk-card';
import type { StudentRiskEvaluation } from '@/modules/early-warning/types';
import { ClassForumTabView } from './class-forum-tab-view';
import type { ForumTopic } from './forum-actions';
import { ClassGroupsTabView } from './class-groups-tab-view';
import { StudentAbsenceModal, LecturerAbsenceTabView } from './absence-modal-and-view';
import { toggleMaterialCompleteAction, remindUnreadStudentsAction } from './material-progress-actions';
import { CpmkCplRadarCard } from './cpmk-cpl-radar-card';
import { ClassLivePollCard } from './class-live-poll-card';
import { ClassLiveInteractionView } from './class-live-interaction-view';

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
    unlock_after_material_id?: string | null;
    require_completion?: boolean;
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
    nim?: string;
    enrolled_at?: string;
  }>;
  assistants?: Array<{
    user_id: string;
    name: string;
    nim?: string;
    nidn?: string;
    permissions: string[];
    assistant_type?: 'ASISTEN_DOSEN' | 'ASISTEN_LAB';
  }>;
  viewer: string;
  userRole?: string;
  currentUserId?: string;
  perms?: string[];
  quizzes?: QuizItem[];
  attendanceSessions?: AttendanceSession[];
  attendanceSummary?: StudentAttendanceSummary | null;
  riskEvaluations?: StudentRiskEvaluation[];
  forumTopics?: ForumTopic[];
  forumTags?: string[];
  petaPulauData?: {
    flags: Record<string, boolean>;
    mapItems: ClassMapItem[];
    chapters: ClassChapterItem[];
    distribution: ChapterDistributionItem[];
    hardestTopics: HardestTopicItem[];
    laggingStudents: LaggingStudentItem[];
  };
}

// 4 TAB IKONIK GOOGLE CLASSROOM
export const TA_CLASSROOM_TABS = [
  { id: 'forum', label: 'Forum', icon: MessagesSquare, badgeLabel: 'Stream' },
  { id: 'tugas', label: 'Tugas Kelas', icon: ClipboardList, badgeLabel: 'Classwork' },
  { id: 'interaksi', label: 'Interaksi Kuliah', icon: MessageSquare, badgeLabel: 'Interaksi' },
  { id: 'bantu-presensi', label: 'Bantu Presensi', icon: CalendarCheck2, badgeLabel: 'Presensi' },
  { id: 'peserta', label: 'Anggota', icon: Users, badgeLabel: 'Peserta' },
  { id: 'materi-asisten', label: 'Materi Asisten', icon: BookOpen, badgeLabel: 'Materi' },
  { id: 'aktivitas', label: 'Aktivitas', icon: Activity, badgeLabel: 'Aktivitas' },
] as const;

export const LECTURER_CLASSROOM_TABS = [
  { id: 'forum', label: 'Forum', icon: MessagesSquare, badgeLabel: 'Stream' },
  { id: 'tugas', label: 'Tugas & Penilaian', icon: ClipboardList, badgeLabel: 'Classwork' },
  { id: 'interaksi', label: 'Interaksi Kuliah', icon: MessageSquare, badgeLabel: 'Interaksi' },
  { id: 'presensi', label: 'Presensi', icon: CalendarCheck2, badgeLabel: 'Presensi' },
  { id: 'kelompok', label: 'Kelompok', icon: Users, badgeLabel: 'Kelompok' },
  { id: 'peserta', label: 'Anggota', icon: Users, badgeLabel: 'People' },
  { id: 'nilai', label: 'Nilai', icon: GraduationCap, badgeLabel: 'Grades' },
  { id: 'bab', label: 'Bab Perkuliahan', icon: Layers, badgeLabel: 'Bab' },
  { id: 'progres', label: 'Progres', icon: BarChart3, badgeLabel: 'Progres' },
  { id: 'materi', label: 'Materi Lengkap', icon: BookOpen, badgeLabel: 'Materi' },
  { id: 'asisten', label: 'Asisten', icon: UserCheck, badgeLabel: 'Asisten' },
  { id: 'aktivitas', label: 'Aktivitas', icon: Activity, badgeLabel: 'Aktivitas' },
  { id: 'fitur', label: 'Pengaturan Fitur', icon: Sliders, badgeLabel: 'Fitur' },
] as const;

export const STUDENT_CLASSROOM_TABS = [
  { id: 'forum', label: 'Forum', icon: MessagesSquare, badgeLabel: 'Stream' },
  { id: 'tugas', label: 'Tugas Kelas', icon: ClipboardList, badgeLabel: 'Classwork' },
  { id: 'interaksi', label: 'Interaksi Kuliah', icon: MessageSquare, badgeLabel: 'Interaksi' },
  { id: 'presensi', label: 'Presensi', icon: CalendarCheck2, badgeLabel: 'Presensi' },
  { id: 'kelompok', label: 'Kelompok', icon: Users, badgeLabel: 'Kelompok' },
  { id: 'anggota', label: 'Anggota', icon: Users, badgeLabel: 'People' },
  { id: 'nilai', label: 'Nilai', icon: GraduationCap, badgeLabel: 'Grades' },
  { id: 'peta', label: 'Peta Belajar', icon: Map, badgeLabel: 'Peta' },
  { id: 'aktivitas', label: 'Aktivitas', icon: Activity, badgeLabel: 'Aktivitas' },
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
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [attendanceSubTab, setAttendanceSubTab] = useState<'sesi' | 'permohonan'>('sesi');
  const [completedMaterials, setCompletedMaterials] = useState<Record<string, boolean>>({});
  const [remindSuccess, setRemindSuccess] = useState<string | null>(null);
  const [isLiveRoomOpen, setIsLiveRoomOpen] = useState(false);
  const [isCpmkExpanded, setIsCpmkExpanded] = useState(false);
  const [selectedMaterialForReading, setSelectedMaterialForReading] = useState<{
    id: string;
    title: string;
    created_at: string;
    body_md?: string | null;
  } | null>(null);

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
    currentUserId,
    perms = [],
    quizzes = [],
    attendanceSessions = [],
    attendanceSummary,
    forumTopics = [],
    forumTags = [],
  } = data;

  const lecturer = viewer === 'LECTURER';
  const ta = viewer === 'TA';
  const student = viewer === 'STUDENT';
  const isStaff = data.userRole === 'ACADEMIC_STAFF' || data.userRole === 'SUPER_ADMIN';
  const isActualLecturer = data.userRole === 'LECTURER' || (!data.userRole && lecturer);
  const can = (p: string) => !!perms?.includes(p);

  const petaEnabled = data.petaPulauData?.flags?.peta_pulau ?? false;

  const roleTabs = ta
    ? TA_CLASSROOM_TABS
    : lecturer
    ? LECTURER_CLASSROOM_TABS
    : (petaEnabled ? STUDENT_CLASSROOM_TABS : STUDENT_CLASSROOM_TABS.filter((t) => t.id !== 'peta'));

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
    <div className="max-w-[1360px] mx-auto space-y-4 sm:space-y-5 animate-fade-up font-sans p-3 sm:p-5 lg:p-6 pb-24">
      {/* ======================================================== */}
      {/* 1. TOP NAVIGASI GOOGLE CLASSROOM (TAB TERPADU SATU BARIS)*/}
      {/* ======================================================== */}
      <div className="border-2 border-[#7A756D] bg-[#FAF8F5] p-2 sm:p-2.5 shadow-retro-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
          {/* Sisi Kiri: Tombol Kembali & Segmented Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Tombol Kembali ke Daftar Kelas */}
            <Link
              href="/classes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#7A756D] bg-[#FFFFFF] hover:bg-[#FAF8F5] font-black text-xs text-[#1C1917] shadow-retro-xs transition-all shrink-0 cursor-pointer"
              title="Kembali ke Daftar Kelas"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#C2553A]" />
              <span className="hidden sm:inline">Daftar Kelas</span>
            </Link>

            <div className="h-5 w-[1px] bg-[#D6D3CB] shrink-0" />

            {/* Segmented Tabs Peran */}
            <div className="flex items-center gap-1 shrink-0">
              {roleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer',
                      isActive
                        ? 'bg-[#1C1917] text-white border-2 border-[#1C1917] shadow-retro-xs'
                        : 'bg-[#FFFFFF] text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] border border-[#D6D3CB]'
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-[#C2553A]' : 'text-[#7A756D]')} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sisi Kanan: Aksi Cepat Live, Kode Kelas & SKS */}
          <div className="flex items-center gap-1.5 shrink-0 self-end xl:self-auto">
            <button
              type="button"
              onClick={() => setIsLiveRoomOpen(true)}
              className="text-xs font-bold bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] border-2 border-[#7A756D] px-3 py-1.5 shadow-retro-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Buka Ruang Tatap Muka Daring (Live WebRTC)"
            >
              <Video className="h-3.5 w-3.5 text-[#C2553A]" />
              <span className="hidden sm:inline">{lecturer || ta ? 'Tatap Muka' : 'Gabung Tatap Muka'}</span>
              <span className="sm:hidden">Live</span>
            </button>
            {lecturer && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-xs font-mono font-bold bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] border-2 border-[#7A756D] px-2.5 py-1.5 shadow-retro-xs transition-all flex items-center gap-1 cursor-pointer"
                title="Salin Kode Kelas"
              >
                <Key className="h-3.5 w-3.5 text-[#C2553A]" />
                <span>{cls.join_code}</span>
                {copiedCode ? (
                  <span className="text-[10px] bg-[#065F46] text-white px-1.5 py-0.5 font-bold">Disalin!</span>
                ) : (
                  <span className="text-[10px] text-[#7A756D] font-medium">Salin</span>
                )}
              </button>
            )}
            <span className="text-xs font-bold text-[#1C1917] bg-[#FFFFFF] border-2 border-[#7A756D] px-2.5 py-1.5 shadow-retro-xs">
              {cls.sks || 3} SKS
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB: FORUM / JAWAB FORUM (BERITA & INTERAKSI KELAS)      */}
      {/* ======================================================== */}
      {(activeTab === 'forum' || activeTab === 'jawab-forum') && (
        <div className="space-y-6">
          {/* A. HERO COVER BANNER GOOGLE CLASSROOM (DESAIN AUTENTIK) */}
          <div className="relative overflow-hidden border-2 border-[#6B2D20] bg-gradient-to-r from-[#C2553A] via-[#B84A2B] to-[#853827] text-white p-6 sm:p-8 lg:p-9 shadow-retro font-sans">
            {/* Background subtle retro watermark */}
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none select-none text-white">
              <BookOpen className="h-44 w-44" />
            </div>

            <div className="relative z-10 flex flex-col justify-between min-h-[140px] gap-5">
              {/* Baris Atas: Badge Seksi, Semester, & SKS */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-[#FFFFFF] text-[#853827] border-2 border-[#6B2D20] shadow-retro-xs">
                    Kelas {cls.section}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-bold bg-[#FAF8F5]/20 text-white border border-white/30">
                    Semester Ganjil 2026/2027
                  </span>
                </div>

                <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#FAF8F5]/20 text-white border border-white/30">
                  {cls.sks || 3} SKS
                </span>
              </div>

              {/* Judul Mata Kuliah & Jadwal */}
              <div className="space-y-2">
                <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight">
                  {cls.title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-white/90 font-medium">
                  {cls.schedule && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-[#FDDDD7] shrink-0" />
                      <span>{cls.schedule}</span>
                    </span>
                  )}
                  {cls.room && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#FDDDD7] shrink-0" />
                      <span>{cls.room}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-[#FDDDD7] shrink-0" />
                    <span>{members.length} Mahasiswa Terdaftar</span>
                  </span>
                </div>
              </div>

              {/* Baris Bawah: Kode Gabung Kelas & Tombol Tatap Muka */}
              <div className="pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-white/80 font-bold uppercase tracking-wider text-[11px]">Kode Kelas:</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] font-mono font-black border border-[#6B2D20] shadow-retro-xs cursor-pointer transition-all"
                    title="Salin kode kelas"
                  >
                    <Key className="h-3.5 w-3.5 text-[#C2553A]" />
                    <span>{cls.join_code}</span>
                    {copiedCode ? (
                      <span className="text-xs text-[#065F46] font-bold">Disalin!</span>
                    ) : (
                      <span className="text-[10px] text-[#7A756D] font-medium">Salin</span>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLiveRoomOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#1C1917] font-black border border-[#6B2D20] shadow-retro-xs cursor-pointer transition-all"
                >
                  <Video className="h-3.5 w-3.5 text-[#C2553A]" />
                  <span>{lecturer || ta ? 'Buka Tatap Muka Kelas' : 'Gabung Tatap Muka Kelas'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* B. DUA KOLOM AUTENTIK: PANEL RINGKASAN TUNGGAL (KIRI) & STREAM FEED (KANAN) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Kolom Kiri: Satu Panel Ringkasan Perkuliahan Terpadu (TIDAK BERTUMPUK) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="border-2 border-[#7A756D] bg-[#FFFFFF] shadow-retro-sm divide-y-2 divide-[#D6D3CB] font-sans">
                {/* Bagian 1: Mendatang (Upcoming Deadlines) */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="font-heading font-black text-sm text-[#1C1917] flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#C2553A]" />
                      <span>Mendatang</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tugas')}
                      className="text-xs font-bold text-[#C2553A] hover:underline cursor-pointer"
                    >
                      Lihat semua
                    </button>
                  </div>

                  {upcomingAssignments.length === 0 ? (
                    <p className="text-xs text-[#57534E] font-medium py-1">
                      Semua tugas telah selesai. Tidak ada batas waktu yang dekat!
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {upcomingAssignments.slice(0, 3).map((a) => (
                        <div
                          key={a.id}
                          onClick={() => setActiveTab('tugas')}
                          className="p-3 border border-[#D6D3CB] bg-[#FAF8F5] hover:bg-[#FFFFFF] hover:border-[#7A756D] transition-all cursor-pointer space-y-1 shadow-retro-xs"
                        >
                          <span className="text-[10px] font-mono font-bold text-[#853827] block truncate">
                            Batas: {fmt(a.close_at)}
                          </span>
                          <p className="text-xs font-bold text-[#1C1917] truncate">{a.title}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bagian 2: Presensi Perkuliahan Hari Ini */}
                <div className="p-4 sm:p-5 space-y-3 bg-[#FAF8F5]/60">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="font-heading font-black text-sm text-[#1C1917] flex items-center gap-2">
                      <CalendarCheck2 className="h-4 w-4 text-[#C2553A]" />
                      <span>Presensi Perkuliahan</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('presensi')}
                      className="text-xs font-bold text-[#C2553A] hover:underline cursor-pointer"
                    >
                      Buka
                    </button>
                  </div>

                  {attendanceSessions.length > 0 && attendanceSessions.some((s) => s.is_open) ? (
                    <div className="p-3 border-2 border-[#10B981] bg-[#E8F5E9] space-y-2 text-xs">
                      <span className="font-black text-[#065F46] block">Sesi Pertemuan Sedang Dibuka!</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('presensi')}
                        className="w-full py-1.5 border-2 border-[#065F46] bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs shadow-retro-xs cursor-pointer"
                      >
                        Buka Lembar Presensi
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-[#57534E] font-medium">
                      Tidak ada sesi presensi aktif saat ini. Dosen akan mengaktifkan presensi saat kelas dimulai.
                    </p>
                  )}
                </div>

                {/* Bagian 3: Spesifikasi Akademik Singkat */}
                <div className="p-4 text-xs font-sans text-[#57534E] space-y-2 bg-[#FFFFFF]">
                  <div className="flex justify-between font-medium">
                    <span>Kehadiran Minimal:</span>
                    <span className="font-bold text-[#C2553A]">75% (Syarat UAS)</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Bobot Kredit:</span>
                    <span className="font-bold text-[#1C1917]">{cls.sks || 3} SKS</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Kode Pendaftaran:</span>
                    <span className="font-mono font-bold text-[#1C1917]">{cls.join_code}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Main Stream Feed */}
            <div className="lg:col-span-8 space-y-4">
              {/* Polling & Kuis Cepat Perkuliahan (Fase 5) */}
              <ClassLivePollCard classId={cls.id} currentUserRole={viewer} />

              {/* Post Box "Umumkan sesuatu ke kelas Anda..." (Khusus Dosen Pengampu) */}
              {lecturer && (
                <div className="border-2 border-[#7A756D] bg-[#FFFFFF] shadow-retro-sm p-4 sm:p-5 space-y-3 font-sans">
                  <div
                    onClick={() => setIsAnnounceOpen(!isAnnounceOpen)}
                    className="flex items-center gap-3.5 p-3 sm:p-3.5 border border-[#D6D3CB] bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 cursor-pointer transition-all shadow-retro-xs"
                  >
                    <div className="h-9 w-9 border-2 border-[#6B2D20] bg-[#C2553A] text-white flex items-center justify-center font-black text-xs shrink-0">
                      DS
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-[#57534E] flex-1">
                      Umumkan sesuatu ke kelas Anda...
                    </span>
                    <Send className="h-4 w-4 text-[#C2553A]" />
                  </div>

                  {isAnnounceOpen && (
                    <div className="pt-3 border-t-2 border-[#D6D3CB] animate-fade-up space-y-3">
                      <h4 className="text-xs font-heading font-black text-[#1C1917]">
                        Kirim Pengumuman Resmi Dosen Pengampu
                      </h4>
                      <CreateAnnouncementForm classId={cls.id} />
                    </div>
                  )}
                </div>
              )}

              {/* Feed: Pengumuman Dosen & Diskusi Kelas */}
              <div className="space-y-3.5">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-5 sm:p-6 border-2 border-[#7A756D] border-l-4 border-l-[#C2553A] bg-[#FFFFFF] shadow-retro-sm space-y-3 animate-fade-up font-sans"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 border-2 border-[#6B2D20] bg-[#C2553A] text-white flex items-center justify-center font-black text-xs shrink-0">
                          DS
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-[#1C1917] block">
                            Dosen Pengampu Kelas
                          </span>
                          <span className="text-xs font-mono font-medium text-[#7A756D]">{fmt(a.created_at)}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black uppercase bg-[#FEF4F1] text-[#853827] border border-[#C2553A] px-2.5 py-0.5">
                        Pengumuman
                      </span>
                    </div>

                    <h3 className="font-heading font-black text-base sm:text-lg text-[#1C1917]">{a.title}</h3>
                    {a.body && <MarkdownViewer content={a.body} className="text-xs sm:text-sm text-[#1C1917]/90 leading-relaxed" />}
                  </div>
                ))}

                {/* Notifikasi Tugas Baru di Stream */}
                {assignments.slice(0, 2).map((asg) => (
                  <div
                    key={asg.id}
                    onClick={() => setActiveTab('tugas')}
                    className="p-4 sm:p-4.5 border-2 border-[#7A756D] border-l-4 border-l-[#1D4ED8] bg-[#FAF8F5] shadow-retro-sm hover:shadow-retro hover:-translate-y-0.5 cursor-pointer transition-all flex items-center justify-between gap-4 font-sans"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 border-2 border-[#7A756D] bg-[#FFFFFF] text-[#1D4ED8] shrink-0 shadow-retro-xs">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#1D4ED8] font-black uppercase tracking-wider block">
                          Tugas Baru
                        </span>
                        <h4 className="font-heading font-black text-sm sm:text-base text-[#1C1917]">{asg.title}</h4>
                        <span className="text-xs font-mono font-bold text-[#853827]">Batas: {fmt(asg.due_at)}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#1D4ED8] shrink-0" />
                  </div>
                ))}

                {/* Forum Diskusi Interaktif Terpadu Kelas */}
                <div className="pt-2">
                  <ClassForumTabView
                    classId={cls.id}
                    initialTopics={forumTopics}
                    availableTags={forumTags}
                    userRole={lecturer ? 'LECTURER' : ta ? 'TEACHING_ASSISTANT' : 'STUDENT'}
                    currentUserId={viewer}
                  />
                </div>

                {/* Pemetaan Capaian CPMK & CPL (Accordion Terpadu) */}
                <div className="border-2 border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm">
                  <button
                    type="button"
                    onClick={() => setIsCpmkExpanded(!isCpmkExpanded)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FFFFFF] transition-all cursor-pointer font-sans"
                  >
                    <div className="flex items-center gap-2.5">
                      <Award className="h-5 w-5 text-[#C2553A] shrink-0" />
                      <div>
                        <span className="font-heading font-black text-sm text-[#1C1917] block">
                          Ketercapaian CPMK & CPL Kurikulum OBE
                        </span>
                        <span className="text-xs text-[#57534E] font-medium">
                          Pemetaan capaian pembelajaran lulusan dan mata kuliah
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#7A756D]">
                      <span>{isCpmkExpanded ? 'Tutup Analisis' : 'Buka Analisis'}</span>
                      {isCpmkExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {isCpmkExpanded && (
                    <div className="p-4 sm:p-6 border-t-2 border-[#D6D3CB] bg-[#FFFFFF] animate-fade-up">
                      <CpmkCplRadarCard classId={cls.id} />
                    </div>
                  )}
                </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5] p-3.5 sm:p-4 border-2 border-[#7A756D] shadow-retro-sm font-sans">
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
                    'px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-retro-xs',
                    classworkFilter === f.id
                      ? 'border-2 border-[#1C1917] bg-[#1C1917] text-white'
                      : 'border border-[#7A756D] bg-[#FFFFFF] text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5]'
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
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#6B2D20] bg-[#C2553A] hover:bg-[#853827] text-white font-black text-xs sm:text-sm shadow-retro-sm transition-all cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>{isClassworkCreateOpen ? 'Tutup Form' : '+ Buat Baru'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Form Pembuatan Konten jika Dosen mengklik "+ Buat" */}
          {lecturer && isClassworkCreateOpen && (
            <div className="p-5 sm:p-6 border-2 border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm space-y-5 animate-fade-up font-sans">
              <h3 className="font-heading font-black text-base text-[#1C1917] flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-[#C2553A]" />
                <span>Publikasikan Tugas atau Materi</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 sm:p-5 border-2 border-[#7A756D] bg-[#FFFFFF] shadow-retro-xs space-y-3">
                  <h4 className="font-heading font-black text-sm text-[#1C1917] flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#C2553A]" /> Terbitkan Tugas Baru
                  </h4>
                  <CreateAssignmentForm classId={cls.id} />
                </div>

                <div className="p-4 sm:p-5 border-2 border-[#7A756D] bg-[#FFFFFF] shadow-retro-xs space-y-3">
                  <h4 className="font-heading font-black text-sm text-[#1C1917] flex items-center gap-2">
                    <FolderArchive className="h-4 w-4 text-[#C2553A]" /> Unggah Modul / Materi
                  </h4>
                  <CreateMaterialForm classId={cls.id} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3 border-t-2 border-[#D6D3CB]">
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
                  <FileText className="h-5 w-5 text-primary" />
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
                            <div className="p-2.5 rounded-xl border-2 border-black bg-surface text-black shrink-0">
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
                                  a.mine ? 'bg-retro-mint text-black' : closed ? 'bg-primary text-white' : 'bg-gray-soft text-black'
                                )}
                              >
                                {a.mine ? 'Diserahkan' : closed ? 'Ditutup' : 'Ditugaskan'}
                              </span>
                            )}
                            {(lecturer || ta) && (a as any).release_at && new Date((a as any).release_at) > new Date() && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border-2 border-black bg-gray-soft text-black font-mono font-bold shadow-retro-sm">
                                Tampil untuk mahasiswa pada {fmt((a as any).release_at)}
                              </span>
                            )}
                            {lecturer && (
                              <span className="text-xs font-medium bg-gray-soft border border-black px-2 py-1 rounded-lg">
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
                                <p className="text-xs font-bold text-primary-dark">Batas waktu pengumpulan tugas telah berakhir.</p>
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
                  <Award className="h-5 w-5 text-primary" />
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
                        <div className="p-2.5 rounded-xl border-2 border-black bg-surface text-black shrink-0">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm sm:text-base text-black">{q.title}</h4>
                            <span className="text-xs font-medium bg-gray-soft border border-black px-2 py-0.5 rounded">
                              {q.exam_type ?? 'KUIS'}
                            </span>
                            {(lecturer || ta) && (q as any).release_at && new Date((q as any).release_at) > new Date() && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded border-2 border-black bg-gray-soft text-black font-mono font-bold shadow-retro-sm">
                                Tampil untuk mahasiswa pada {fmt((q as any).release_at)}
                              </span>
                            )}
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
                  <FolderArchive className="h-5 w-5 text-primary" />
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
                          <div className="p-2 rounded-xl border-2 border-black bg-surface text-black">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-base text-black">{m.title}</h4>
                            <span className="text-xs font-normal text-black/60">{fmt(m.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setSelectedMaterialForReading(m)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 border-black bg-white hover:bg-black hover:text-white text-xs font-bold shadow-retro-xs transition-colors cursor-pointer"
                          >
                            <BookOpen className="h-3.5 w-3.5 text-primary" />
                            <span>Baca Dokumen</span>
                          </button>
                          {(lecturer || ta) && (m as any).release_at && new Date((m as any).release_at) > new Date() && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border-2 border-black bg-gray-soft text-black font-mono font-bold shadow-retro-sm">
                              Tampil untuk mahasiswa pada {fmt((m as any).release_at)}
                            </span>
                          )}
                          <span className="text-xs font-medium bg-gray-soft px-2.5 py-1 rounded border border-black">
                            Modul #{idx + 1}
                          </span>
                        </div>
                      </div>
                      {m.body_md && (
                        <div className="p-4 rounded-xl border border-black/20 bg-gray-soft/20 text-xs sm:text-sm">
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
                  <CalendarCheck2 className="h-5 w-5 text-primary" />
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
                        <div className="p-2.5 rounded-xl border-2 border-black bg-gray-soft text-black shrink-0">
                          <CalendarCheck2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm sm:text-base text-black">{s.title}</h4>
                            <span
                              className={cn(
                                'text-xs font-semibold px-2 py-0.5 rounded border border-black',
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
                          <span className="text-xs font-bold bg-gray-soft border border-black px-2.5 py-1 rounded">
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
          {/* Peringatan Dini Mahasiswa Berisiko (Dosen Pengampu & Asisten) */}
          {(lecturer || ta) && (
            <ClassRiskCard
              evaluations={data.riskEvaluations || []}
              classTitle={cls.title}
            />
          )}

          {/* Section Pengajar */}
          <div className="space-y-4 font-sans">
            <div className="flex items-center justify-between border-b-2 border-[#7A756D] pb-3">
              <h3 className="font-heading font-black text-lg sm:text-xl text-[#1C1917] flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#C2553A]" />
                <span>Dosen & Pengajar</span>
              </h3>
              <span className="text-xs font-bold bg-[#FAF8F5] border border-[#7A756D] px-2.5 py-1 text-[#1C1917]">
                {(assistants?.length ?? 0) + 1} Pengajar
              </span>
            </div>

            {/* Dosen Utama */}
            <div className="p-4 sm:p-5 border-2 border-[#7A756D] bg-[#FFFFFF] shadow-retro-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 border-2 border-[#6B2D20] bg-[#C2553A] text-white flex items-center justify-center font-black text-sm shrink-0">
                  DS
                </div>
                <div>
                  <h4 className="font-heading font-black text-base text-[#1C1917]">Dosen Pengampu Utama</h4>
                  <span className="text-xs text-[#57534E] font-medium">Dosen Penanggung Jawab Mata Kuliah</span>
                </div>
              </div>
              <span className="text-xs font-black uppercase bg-[#FEF4F1] text-[#853827] border border-[#C2553A] px-3 py-1">
                Dosen
              </span>
            </div>

            {/* Asisten Dosen */}
            {assistants && assistants.length > 0 && (
              <div className="space-y-3">
                {assistants.map((ast) => (
                  <div
                    key={ast.user_id}
                    className="p-4 border-2 border-[#7A756D] bg-[#FFFFFF] shadow-retro-sm flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 border-2 border-[#7A756D] bg-[#FAF8F5] text-[#1C1917] flex items-center justify-center font-black text-xs shrink-0">
                        {ast.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-heading font-black text-sm text-[#1C1917]">{ast.name}</h4>
                        <span className="text-xs text-[#57534E] font-mono">
                          {ast.nidn ? `NIDN: ${ast.nidn}` : `NIM: ${ast.nim || '2024002'}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ast.assistant_type === 'ASISTEN_LAB' ? (
                        <span className="text-xs font-bold bg-[#FAF8F5] text-[#1D4ED8] border border-[#1D4ED8] px-2.5 py-1">
                          Asisten Lab
                        </span>
                      ) : (
                        <span className="text-xs font-bold bg-[#FEF4F1] text-[#853827] border border-[#C2553A] px-2.5 py-1">
                          Asisten Dosen
                        </span>
                      )}
                      {(isActualLecturer || (isStaff && ast.assistant_type === 'ASISTEN_LAB')) && (
                        <RevokeAssistant
                          classId={cls.id}
                          identifier={ast.nim || ast.nidn || ast.user_id}
                          name={ast.name}
                          assistantType={ast.assistant_type}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form Tambah Asisten untuk Dosen & Staf */}
            {(lecturer || isStaff) && (
              <div className="p-4 sm:p-5 border-2 border-[#7A756D] bg-[#FAF8F5] shadow-retro-sm space-y-3">
                <h4 className="font-heading font-black text-sm text-[#1C1917]">
                  + Tambah {isStaff && !isActualLecturer ? 'Asisten Lab' : 'Asisten (Dosen / Lab)'}
                </h4>
                <AssistantForm
                  classId={cls.id}
                  allowedTypes={isStaff && !isActualLecturer ? ['ASISTEN_LAB'] : ['ASISTEN_DOSEN', 'ASISTEN_LAB']}
                  defaultType={isStaff && !isActualLecturer ? 'ASISTEN_LAB' : 'ASISTEN_DOSEN'}
                />
              </div>
            )}
          </div>

          {/* Section Teman Sekelas (Mahasiswa) */}
          <div className="space-y-4 font-sans">
            <div className="flex items-center justify-between border-b-2 border-[#7A756D] pb-3">
              <h3 className="font-heading font-black text-lg sm:text-xl text-[#1C1917] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#C2553A]" />
                <span>Daftar Mahasiswa</span>
              </h3>
              <span className="text-xs font-bold bg-[#FAF8F5] border border-[#7A756D] px-2.5 py-1 text-[#1C1917]">
                {members.length} Mahasiswa
              </span>
            </div>

            {members.length === 0 ? (
              <p className="text-xs text-[#57534E] italic p-6 bg-[#FAF8F5] border-2 border-dashed border-[#7A756D] text-center font-medium">
                Belum ada mahasiswa yang terdaftar di kelas ini.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {members.map((m) => (
                  <div
                    key={m.student_id}
                    className="p-3.5 border-2 border-[#7A756D] bg-[#FFFFFF] shadow-retro-sm flex items-center gap-3"
                  >
                    <div className="h-9 w-9 border-2 border-[#7A756D] bg-[#FAF8F5] text-[#1C1917] flex items-center justify-center font-black text-xs shrink-0">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-xs sm:text-sm text-[#1C1917] truncate">{m.name}</p>
                      <span className="text-xs font-mono font-medium text-[#7A756D]">
                        NIM: {m.nim || m.student_id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: ASISTEN (DOSEN PENGAMPU & STAF AKADEMIK)            */}
      {/* ======================================================== */}
      {activeTab === 'asisten' && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-black">Kelola Asisten Dosen & Asisten Lab</h3>
              <p className="text-xs text-black/70 font-medium">Asisten Dosen ditugaskan langsung oleh Dosen Pengampu. Asisten Lab dapat ditugaskan oleh Staf Akademik dan Dosen.</p>
            </div>
            <span className="text-xs font-sans font-bold px-3 py-1 bg-white border border-black rounded-lg">
              {assistants?.length ?? 0} Asisten Aktif
            </span>
          </div>

          {/* Daftar Asisten */}
          {assistants && assistants.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-black">Daftar Asisten Kelas</h4>
              {assistants.map((ast) => (
                <div key={ast.user_id} className="p-4 rounded-2xl border-2 border-black bg-white shadow-retro flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-full border-2 border-black bg-gray-soft flex items-center justify-center font-bold text-xs text-black shrink-0">
                      {ast.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-black">{ast.name}</h4>
                      <span className="text-xs text-black/60">
                        {ast.nidn ? `NIDN: ${ast.nidn}` : `NIM: ${ast.nim || '2024002'}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ast.assistant_type === 'ASISTEN_LAB' ? (
                      <span className="text-xs font-bold bg-sky-100 text-sky-800 border border-sky-600 px-2.5 py-1 rounded">
                        Asisten Lab
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-retro-mint border border-black px-2.5 py-1 rounded">
                        Asisten Dosen
                      </span>
                    )}
                    {(isActualLecturer || (isStaff && ast.assistant_type === 'ASISTEN_LAB')) && (
                      <RevokeAssistant
                        classId={cls.id}
                        identifier={ast.nim || ast.nidn || ast.user_id}
                        name={ast.name}
                        assistantType={ast.assistant_type}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form Tambah Asisten untuk Dosen & Staf */}
          {(lecturer || isStaff) && (
            <div className="p-5 rounded-2xl border-2 border-black bg-gray-soft/40 space-y-3">
              <h4 className="font-bold text-sm text-black">
                + Tambah {isStaff && !isActualLecturer ? 'Asisten Lab' : 'Asisten Baru (Dosen / Lab)'}
              </h4>
              <AssistantForm
                classId={cls.id}
                allowedTypes={isStaff && !isActualLecturer ? ['ASISTEN_LAB'] : ['ASISTEN_DOSEN', 'ASISTEN_LAB']}
                defaultType={isStaff && !isActualLecturer ? 'ASISTEN_LAB' : 'ASISTEN_DOSEN'}
              />
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: MATERI / MATERI ASISTEN                             */}
      {/* ======================================================== */}
      {(activeTab === 'materi' || activeTab === 'materi-asisten') && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-black">Modul & Bahan Pembelajaran</h3>
              <p className="text-xs text-black/70 font-medium">Bahan ajar kuliah, slide presentasi, panduan praktikum lab, dan referensi bacaan.</p>
            </div>
            {(lecturer || ta) && (
              <span className="text-xs font-sans font-bold px-3 py-1 bg-white border border-black rounded-lg">
                {materials.length} Modul Terbit
              </span>
            )}
          </div>

          {remindSuccess && (
            <div className="p-3.5 rounded-xl bg-gray-soft text-black text-xs font-bold border-2 border-black shadow-retro-sm">
              {remindSuccess}
            </div>
          )}

          {/* Progres Belajar Mahasiswa (10.4) */}
          {student && materials.length > 0 && (
            <div className="p-4 rounded-xl border-2 border-black bg-white shadow-retro flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-foreground">
                  Progres Belajar: {materials.filter((m) => completedMaterials[m.id]).length} dari {materials.length} materi selesai ({materials.length > 0 ? Math.round((materials.filter((m) => completedMaterials[m.id]).length / materials.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full sm:w-48 bg-muted rounded-full h-2.5 overflow-hidden border border-black/30">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all"
                  style={{
                    width: `${materials.length > 0 ? Math.round((materials.filter((m) => completedMaterials[m.id]).length / materials.length) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {(lecturer || ta) && (
            <div className="p-5 rounded-2xl border-2 border-black bg-white shadow-retro space-y-3">
              <h4 className="font-bold text-sm text-black flex items-center gap-2">
                <FolderArchive className="h-4 w-4 text-primary" /> Unggah Modul / Materi Baru
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
              materials.map((m, idx) => {
                const prevMat = idx > 0 ? materials[idx - 1] : null;
                const isLocked = Boolean(
                  student &&
                  m.unlock_after_material_id &&
                  m.require_completion &&
                  prevMat &&
                  !completedMaterials[prevMat.id]
                );

                return (
                  <div key={m.id} className="p-5 rounded-2xl border-2 border-black bg-white shadow-retro space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl border-2 border-black bg-surface text-black">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base text-black">{m.title}</h4>
                          <span className="text-xs font-normal text-black/60">{fmt(m.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLocked && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-soft text-black border-2 border-black font-mono font-bold shadow-retro-sm flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Terkunci
                          </span>
                        )}
                        <span className="text-xs font-medium bg-gray-soft px-2.5 py-1 rounded border border-black">
                          Modul #{idx + 1}
                        </span>
                      </div>
                    </div>

                    {/* Penguncian Berurutan (10.4) */}
                    {isLocked ? (
                      <div className="p-3.5 rounded-xl border-2 border-black bg-gray-soft text-black font-bold shadow-retro-sm flex items-center gap-2 text-xs">
                        <Lock className="w-4 h-4 text-black shrink-0" />
                        <span>Selesaikan &apos;{prevMat?.title || 'materi sebelumnya'}&apos; dulu untuk membuka materi ini.</span>
                      </div>
                    ) : (
                      <>
                        {m.body_md && (
                          <div className="p-4 rounded-xl border border-black/20 bg-gray-soft/20 text-xs sm:text-sm">
                            <MarkdownViewer content={m.body_md} />
                          </div>
                        )}

                        {student && (
                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const next = !completedMaterials[m.id];
                                await toggleMaterialCompleteAction(m.id, next);
                                setCompletedMaterials((prev) => ({ ...prev, [m.id]: next }));
                              }}
                              className={cn(
                                'btn-outline !w-auto text-xs px-3.5 py-1.5 flex items-center gap-1.5 font-bold',
                                completedMaterials[m.id] && 'bg-black text-white border-black'
                              )}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{completedMaterials[m.id] ? 'Selesai Dipelajari' : 'Tandai Selesai'}</span>
                            </button>
                          </div>
                        )}

                        {lecturer && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
                            <span className="text-muted-foreground font-medium">
                              Tingkat pembacaan modul: 75% mahasiswa
                            </span>
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await remindUnreadStudentsAction(m.id, cls.id, m.title);
                                if (res.ok) {
                                  setRemindSuccess(`Pengingat membaca modul '${m.title}' berhasil dikirim.`);
                                  setTimeout(() => setRemindSuccess(null), 4000);
                                } else {
                                  alert(res.error);
                                }
                              }}
                              className="btn-outline !w-auto text-xs px-2.5 py-1"
                            >
                              Ingatkan Mahasiswa Belum Buka
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: PRESENSI / BANTU PRESENSI                           */}
      {/* ======================================================== */}
      {(activeTab === 'presensi' || activeTab === 'bantu-presensi') && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-soft border-2 border-black rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-black">
                {ta ? 'Bantu Presensi Kelas & Sesi Kehadiran' : student ? 'Presensi Perkuliahan Saya' : 'Presensi Perkuliahan Kelas'}
              </h3>
              <p className="text-xs text-black/70 font-medium">
                {ta
                  ? 'Bantu dosen memvalidasi kehadiran mahasiswa via kode sesi, QR token berputar, dan rekap partisipasi.'
                  : student
                  ? 'Pantau kehadiran Anda, lakukan presensi pertemuan perkuliahan, dan penuhi syarat minimal 75% kehadiran untuk mengikuti UAS.'
                  : 'Kelola sesi kehadiran pertemuan tatap muka, monitoring QR berputar, dan verifikasi izin dispensasi.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {student && (
                <button
                  type="button"
                  onClick={() => setIsAbsenceModalOpen(true)}
                  className="btn-solid !w-auto text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ajukan Izin / Sakit</span>
                </button>
              )}
              {lecturer && (
                <CreateAttendanceSessionModal classId={cls.id} nextMeetingNumber={attendanceSessions.length + 1} />
              )}
            </div>
          </div>

          {/* Dosen Sub-tab: Sesi vs Permohonan Izin (10.1) */}
          {lecturer && (
            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
              <button
                type="button"
                onClick={() => setAttendanceSubTab('sesi')}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-bold rounded-xl border border-black transition-all',
                  attendanceSubTab === 'sesi' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-soft'
                )}
              >
                Sesi Perkuliahan
              </button>
              <button
                type="button"
                onClick={() => setAttendanceSubTab('permohonan')}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-bold rounded-xl border border-black transition-all',
                  attendanceSubTab === 'permohonan' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-soft'
                )}
              >
                Permohonan Izin &amp; Sakit
              </button>
            </div>
          )}

          {lecturer && attendanceSubTab === 'permohonan' ? (
            <LecturerAbsenceTabView classId={cls.id} />
          ) : (
            <>
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
                        <div className="p-2.5 rounded-xl border-2 border-black bg-gray-soft text-black shrink-0">
                          <CalendarCheck2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm sm:text-base text-black">{s.title}</h4>
                            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border border-black', s.is_open ? 'bg-retro-mint text-black' : 'bg-neutral-200 text-black/60')}>
                              {s.is_open ? 'BUKA' : 'DITUTUP'}
                            </span>
                            {s.delivery_mode && s.delivery_mode !== 'luring' && (
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                                {s.delivery_mode}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-normal text-black/60">
                            Pertemuan #{s.meeting_number} · {s.date} ({s.start_time} - {s.end_time} WIB)
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Kuliah Daring Link (10.3) */}
                        {s.meeting_url && (
                          <a
                            href={s.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl border-2 border-black bg-black text-white hover:bg-neutral-800 text-xs font-bold inline-flex items-center gap-1.5 shadow-retro-sm cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Gabung Kuliah Daring</span>
                          </a>
                        )}

                        {/* Rekaman Perkuliahan (10.3) */}
                        {s.recording_url && (
                          <a
                            href={s.recording_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl border-2 border-black bg-gray-soft text-black hover:bg-neutral-200 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Tonton Rekaman</span>
                          </a>
                        )}

                        {(lecturer || ta) && (
                          <span className="text-xs font-bold bg-gray-soft border border-black px-2.5 py-1 rounded">
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
            </>
          )}

          {/* Modal Permohonan Izin Mahasiswa (10.1) */}
          <StudentAbsenceModal
            isOpen={isAbsenceModalOpen}
            onClose={() => setIsAbsenceModalOpen(false)}
            availableSessions={attendanceSessions.map((s) => ({
              id: s.id,
              sessionNumber: s.meeting_number,
              sessionDate: s.date,
              className: cls.title,
            }))}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: NILAI (GRADES GOOGLE CLASSROOM)                   */}
      {/* ======================================================== */}
      {activeTab === 'nilai' && (
        <div className="space-y-6">
          {/* Summary Card Nilai */}
          <div className="p-6 sm:p-7 rounded-2xl border-2 border-black bg-white shadow-retro-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/15 pb-4">
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-black flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-primary" />
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
                <div key={i} className="p-4 rounded-xl border-2 border-black bg-gray-soft/40 text-center space-y-1 shadow-xs">
                  <span className="text-xs font-semibold text-black/60 uppercase">{it.label}</span>
                  <p className="text-2xl font-bold text-black">{it.score}</p>
                  <span className="text-xs font-normal text-black/70">Bobot {it.bobot}</span>
                </div>
              ))}
            </div>

            {/* Rekap Nilai Akhir */}
            <div className="p-4 sm:p-5 rounded-xl border-2 border-black bg-surface text-black flex items-center justify-between gap-4">
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

      {/* ======================================================== */}
      {/* TAB: KELOMPOK (TUGAS KELOMPOK FASE 2)                    */}
      {/* ======================================================== */}
      {activeTab === 'kelompok' && (
        <ClassGroupsTabView
          classId={cls.id}
          isLecturer={lecturer}
          currentUserId={currentUserId}
        />
      )}

      {/* ======================================================== */}
      {/* TAB: PETA (PETA PULAU UNTUK MAHASISWA)                  */}
      {/* ======================================================== */}
      {activeTab === 'peta' && (
        <ClassIslandMap
          classId={cls.id}
          chapters={data.petaPulauData?.mapItems || []}
          isSkillExchangeEnabled={data.petaPulauData?.flags?.tukar_keahlian ?? false}
        />
      )}

      {/* ======================================================== */}
      {/* TAB: BAB (MANAJEMEN BAB & TOPIK DOSEN)                   */}
      {/* ======================================================== */}
      {activeTab === 'bab' && (
        <ClassChaptersTab
          classId={cls.id}
          initialChapters={data.petaPulauData?.chapters || []}
        />
      )}

      {/* ======================================================== */}
      {/* TAB: PROGRES (SEBARAN MAHASISWA & TOPIK SULIT DOSEN)     */}
      {/* ======================================================== */}
      {activeTab === 'progres' && (
        <ClassProgressTab
          classId={cls.id}
          distribution={data.petaPulauData?.distribution || []}
          hardestTopics={data.petaPulauData?.hardestTopics || []}
          laggingStudents={data.petaPulauData?.laggingStudents || []}
        />
      )}

      {/* ======================================================== */}
      {/* TAB: PENGATURAN FITUR (PENANDA FITUR PETA PULAU)         */}
      {/* ======================================================== */}
      {activeTab === 'fitur' && (
        <ClassFeatureSettingsTab
          classId={cls.id}
          initialFlags={data.petaPulauData?.flags || {}}
        />
      )}

      {/* ======================================================== */}
      {/* TAB: AKTIVITAS (HEATMAP KONTRIBUSI KELAS)                */}
      {/* ======================================================== */}
      {activeTab === 'aktivitas' && (
        <TabAktivitasKelas
          classId={cls.id}
          classTitle={cls.title}
          isLecturerOrTa={Boolean(lecturer || ta)}
          members={members}
        />
      )}

      {/* ======================================================== */}
      {/* TAB: INTERAKSI KULIAH (TANYA JAWAB LANGSUNG & KUIS KILAT)*/}
      {/* ======================================================== */}
      {activeTab === 'interaksi' && (
        <ClassLiveInteractionView
          classId={cls.id}
          currentUserRole={viewer}
          currentUserId={currentUserId}
          isStaff={Boolean(isActualLecturer || ta || isStaff)}
        />
      )}

      {/* MODAL TATAP MUKA LANGSUNG RETRO (JITSI WEBRTC) */}
      <RetroLiveClassroom
        isOpen={isLiveRoomOpen}
        onClose={() => setIsLiveRoomOpen(false)}
        classId={cls.id}
        classTitle={cls.title}
        section={cls.section}
        isHost={Boolean(lecturer || ta)}
      />

      {/* IN-BROWSER DOCUMENT & PDF READER MODAL */}
      <RetroDocViewer
        isOpen={!!selectedMaterialForReading}
        onClose={() => setSelectedMaterialForReading(null)}
        title={selectedMaterialForReading?.title || 'Dokumen Modul Perkuliahan'}
        markdownContent={selectedMaterialForReading?.body_md}
        authorOrDate={selectedMaterialForReading ? fmt(selectedMaterialForReading.created_at) : undefined}
      />
    </div>
  );
}
