'use server';

import { randomInt, randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import type { ActionResponse } from '@/modules/identity/types';
import { SYNTHETIC_DEMO_USERS } from '@/modules/identity/demo-users';
import { DELEGABLE_CODES } from './permissions';
import { recordSystemAuditLog } from '@/lib/audit';
import { catatAktivitas } from '@/lib/aktivitas/pencatat';
import { isDemoMode, isFeatureFlagActive } from '@/lib/config/features';
import {
  assertClassMember,
  ClassAccessError,
  getAcademicStore,
} from '@/lib/auth/class-access';
import {
  createForumTopicAction,
  replyForumTopicAction,
  moderateTopicAction,
  moderateReplyAction,
  getForumTopicDetailAction,
} from './forum-actions';
import { deterministicUuid } from '@/lib/akademik/deterministic-uuid';
import {
  SEED_KELAS_UIR,
  SEED_MATA_KULIAH_UIR,
  SEED_KRS_UIR,
} from '@/lib/db/seed-data.uir-ti-2026.generated';

export interface ClassItem {
  id: string;
  title: string;
  section: string;
  join_code: string;
  status: string;
  members?: number;
  meta?: string;
  course_id?: string;
  course_code?: string;
  course_title?: string;
  sks?: number;
  lecturer_name?: string;
  lecturer_id?: string;
  room?: string;
  schedule?: string;
  semester?: string;
}

type Row = ClassItem & { created_by: string; capacity?: number };
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const createSchema = z.object({
  title: z.string().trim().min(3, 'Nama mata kuliah minimal 3 karakter.').max(120),
  section: z.string().trim().min(1, 'Isi nama kelas, misalnya A.').max(20),
  capacity: z.coerce.number().int().min(1, 'Kapasitas minimal 1.').max(500).optional(),
  course_id: z.string().min(1).optional(),
  semester_id: z.string().min(1).optional(),
});
const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{8}$/, 'Kode kelas terdiri dari 8 huruf atau angka.');

const ERR: Record<string, string> = {
  FORBIDDEN: 'Aksi ini tidak tersedia untuk peran Anda.',
  CODE_INVALID: 'Kode kelas tidak ditemukan atau kelas belum dibuka.',
  CLASS_FULL: 'Kapasitas kelas sudah penuh.',
  ALREADY_ENROLLED: 'Anda sudah terdaftar di kelas ini.',
  CLOSED: 'Pengumpulan sudah ditutup.',
  ALREADY_SUBMITTED: 'Anda sudah mengumpulkan tugas ini.',
  NOT_FOUND: 'Data tidak ditemukan.',
  LOCKED: 'Diskusi ini dikunci oleh dosen.',
  INVALID_DATES: 'Batas akhir tidak boleh lebih awal dari tenggat.',
  GRADE_FINAL: 'Nilai sudah final dan tidak dapat diubah langsung.',
  NO_DRAFT: 'Simpan nilai draf terlebih dahulu.',
  COURSE_NOT_FOUND: 'Mata kuliah tidak ditemukan.',
  NOT_FINAL: 'Nilai belum final. Ubah lewat nilai draf.',
  NO_CHANGE: 'Nilai usulan sama dengan nilai saat ini.',
  ALREADY_PENDING: 'Sudah ada pengajuan yang menunggu keputusan.',
  NOT_PENDING: 'Pengajuan ini sudah diputuskan.',
  SELF_APPROVAL: 'Anda tidak dapat menyetujui pengajuan sendiri. Pengajuan perlu ditinjau oleh penyetuju lain.',
  NOTE_REQUIRED: 'Alasan penolakan / catatan keputusan minimal 10 karakter.',
  USER_NOT_FOUND: 'Pengguna tidak ditemukan atau belum aktif.',
  INVALID_ASSISTANT: 'Anda tidak dapat menjadikan diri sendiri asisten.',
  INVALID_PERMISSION: 'Izin tersebut tidak dapat didelegasikan.',
  SELF_REVIEW: 'Anda tidak dapat menilai pengumpulan Anda sendiri.',
  ROLE_MISSING: 'Role Asisten Dosen belum tersedia di sistem.',
  SEMESTER_NOT_FOUND: 'Semester tidak ditemukan.',
  INVALID_SCORE: 'Nilai harus di antara 0 dan nilai maksimum tugas.',
};
const pesan = (m?: string) =>
  ERR[Object.keys(ERR).find((k) => m?.includes(k)) ?? ''] ?? 'Terjadi kesalahan. Coba lagi.';
const pub = (x: Row): ClassItem => ({
  id: x.id,
  title: x.title,
  section: x.section,
  join_code: x.join_code,
  status: x.status,
  meta: x.meta || (x.course_code ? `${x.course_code} · Semester Ganjil 2026/2027 · ${x.sks ?? 3} SKS` : undefined),
  course_id: x.course_id,
  course_code: x.course_code,
  course_title: x.course_title || x.title,
  sks: x.sks,
  lecturer_name: x.lecturer_name,
  lecturer_id: x.lecturer_id,
  room: x.room,
  schedule: x.schedule,
  semester: x.semester || 'Semester Ganjil 2026/2027',
});

// Cadangan memori saat Supabase tidak aktif (mode demo), setara pola perangkat pada modul identity.
const DEMO_CLASS_ID = 'c0000000-0000-0000-0000-000000000001';
const DEMO_CLASS_ID_2 = 'c0000000-0000-0000-0000-000000000002';
const DEMO_CLASS_ID_3 = 'c0000000-0000-0000-0000-000000000003';

const mem: { classes: Row[]; enrollments: { class_id: string; student_id: string; student_name?: string; enrolled_at?: string }[] } =
  ((globalThis as any).__siajarAkademik ??= { classes: [], enrollments: [] });

// 1. Tiga Kelas Unggulan Utama Demo
if (!mem.classes.some((c) => c.id === DEMO_CLASS_ID)) {
  mem.classes.push({
    id: DEMO_CLASS_ID,
    title: 'Pemrograman Web & Arsitektur Cloud',
    section: 'IF-3A',
    join_code: 'WEB2026A',
    status: 'OPEN',
    created_by: 'a0000002-0000-0000-0000-000000000002', // Dr. Budi Santoso
    lecturer_id: 'a0000002-0000-0000-0000-000000000002',
    lecturer_name: 'Dr. Budi Santoso, M.Kom.',
    capacity: 45,
    course_id: deterministicUuid('mk-STI2544138'),
    course_code: 'STI2544138',
    course_title: 'Pemrograman Web',
    sks: 3,
    room: '3C.2.05 - TEKNIK C',
    schedule: 'Senin, 08:45 - 11:15 WIB',
    meta: 'STI2544138 · Semester Ganjil 2026/2027 · 3 SKS',
  });
}

if (!mem.classes.some((c) => c.id === DEMO_CLASS_ID_2)) {
  mem.classes.push({
    id: DEMO_CLASS_ID_2,
    title: 'Algoritma & Struktur Data Lanjut',
    section: 'IF-3B',
    join_code: 'ALGO2026',
    status: 'OPEN',
    created_by: 'a0000002-0000-0000-0000-000000000002', // Dr. Budi Santoso
    lecturer_id: 'a0000002-0000-0000-0000-000000000002',
    lecturer_name: 'Dr. Budi Santoso, M.Kom.',
    capacity: 40,
    course_id: deterministicUuid('mk-STI2543131'),
    course_code: 'STI2543131',
    course_title: 'Struktur Data',
    sks: 3,
    room: 'Computer System LAB - TEKNIK C',
    schedule: 'Selasa, 10:30 - 13:00 WIB',
    meta: 'STI2543131 · Semester Ganjil 2026/2027 · 3 SKS',
  });
}

if (!mem.classes.some((c) => c.id === DEMO_CLASS_ID_3)) {
  mem.classes.push({
    id: DEMO_CLASS_ID_3,
    title: 'Basis Data Terdistribusi & Big Data',
    section: 'IF-3C',
    join_code: 'DATA2026',
    status: 'OPEN',
    created_by: 'a0000002-0000-0000-0000-000000000002', // Dr. Budi Santoso
    lecturer_id: 'a0000002-0000-0000-0000-000000000002',
    lecturer_name: 'Dr. Budi Santoso, M.Kom.',
    capacity: 42,
    course_id: deterministicUuid('mk-STI2541114'),
    course_code: 'STI2541114',
    course_title: 'Basis Data 1',
    sks: 3,
    room: 'Mobile Lab - TEKNIK D',
    schedule: 'Rabu, 13:00 - 15:30 WIB',
    meta: 'STI2541114 · Semester Ganjil 2026/2027 · 3 SKS',
  });
}

// 2. Hubungkan 164 Kelas Resmi Semester Ganjil 2026/2027 ke Data Kurikulum UIR
for (const k of SEED_KELAS_UIR) {
  const cId = deterministicUuid(k.id);
  if (!mem.classes.some((c) => c.id === cId)) {
    const dsnUser = `u-dsn-${k.dosenId}`;
    const code = (k.kodeMataKuliah.replace(/[^A-Z0-9]/gi, '').slice(3, 7) + k.kode.replace(/[^A-Z0-9]/gi, '')).padEnd(8, 'X').toUpperCase();
    mem.classes.push({
      id: cId,
      title: k.namaMataKuliah,
      section: k.kode,
      join_code: code,
      status: 'OPEN',
      created_by: dsnUser,
      lecturer_id: dsnUser,
      lecturer_name: k.namaDosen,
      capacity: k.kuota ?? 40,
      course_id: deterministicUuid(k.mataKuliahId),
      course_code: k.kodeMataKuliah,
      course_title: k.namaMataKuliah,
      sks: k.sks,
      room: k.jadwal?.[0]?.namaRuang || 'Ruang Kuliah TI',
      schedule: k.jadwal?.[0] ? `${k.jadwal[0].hari}, ${k.jadwal[0].jamMulai} - ${k.jadwal[0].jamSelesai} WIB` : undefined,
      meta: `${k.kodeMataKuliah} · Semester Ganjil 2026/2027 · ${k.sks} SKS`,
    });
  }
}

// 3. Pendaftaran Mahasiswa Resmi Berdasarkan Data KRS Terverifikasi (120 Mahasiswa UIR)
for (const krs of SEED_KRS_UIR) {
  const stdUserId = `u-mhs-${krs.nimMahasiswa}`;
  for (const it of krs.items) {
    const cId = deterministicUuid(it.kelasId);
    if (!mem.enrollments.some((e) => e.class_id === cId && e.student_id === stdUserId)) {
      mem.enrollments.push({
        class_id: cId,
        student_id: stdUserId,
        student_name: krs.namaMahasiswa,
        enrolled_at: new Date(Date.now() - 86400000 * 14).toISOString(),
      });
    }
  }
}

// 4. Pendaftaran Mahasiswa Default Demo (Ahmad Mahasiswa: a0000001-... / mhs-1)
const CORE_FLAGSHIP_SLUGS = [
  'kls-sti2543130-3a', // Sistem Operasi
  'kls-sti2543127-3a', // Algoritma dan Pemrograman 2
  'kls-sti2543129-3a', // Pengenalan Kecerdasan Buatan
  'kls-sti2544137-3a', // Probabilitas & Statistik
  'kls-sti2543132-3a', // Teori Bahasa dan Automata
];

const DEMO_STUDENT_IDS = [
  'a0000001-0000-0000-0000-000000000001',
  'mhs-1',
];

for (const sId of DEMO_STUDENT_IDS) {
  // Hubungkan ke 3 kelas demo utama
  for (const dId of [DEMO_CLASS_ID, DEMO_CLASS_ID_2, DEMO_CLASS_ID_3]) {
    if (!mem.enrollments.some((e) => e.class_id === dId && e.student_id === sId)) {
      mem.enrollments.push({
        class_id: dId,
        student_id: sId,
        student_name: 'Ahmad Mahasiswa',
        enrolled_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      });
    }
  }
  // Hubungkan ke mata kuliah paket semester ganjil
  for (const slug of CORE_FLAGSHIP_SLUGS) {
    const cId = deterministicUuid(slug);
    if (!mem.enrollments.some((e) => e.class_id === cId && e.student_id === sId)) {
      mem.enrollments.push({
        class_id: cId,
        student_id: sId,
        student_name: 'Ahmad Mahasiswa',
        enrolled_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      });
    }
  }
}

// TA Demo (Citra Asisten) - Hubungkan ke 3 Kelas Asistensi Utama
for (const taClassId of [DEMO_CLASS_ID, DEMO_CLASS_ID_2, DEMO_CLASS_ID_3]) {
  if (!mem.enrollments.some((e) => e.class_id === taClassId && e.student_id === 'a0000003-0000-0000-0000-000000000003')) {
    mem.enrollments.push({
      class_id: taClassId,
      student_id: 'a0000003-0000-0000-0000-000000000003',
      student_name: 'Citra Asisten',
      enrolled_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    });
  }
}

async function actor(role: string | string[]) {
  const c = await getCurrentUserWithRoles();
  const roles = Array.isArray(role) ? role : [role];
  if (!c || !roles.includes(c.activeRole ?? '')) return null;
  return { id: c.user.id, name: c.profile?.full_name ?? 'Mahasiswa', online: await checkSupabaseOnline(), isImpersonating: c.isImpersonating, role: c.activeRole };
}

export async function createClassAction(input: unknown): Promise<ActionResponse<ClassItem>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const me = await actor('LECTURER');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const { title, section, capacity, course_id, semester_id } = parsed.data;

  let item: ClassItem;
  if (me.online) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_class', {
      p_title: title,
      p_section: section,
      p_capacity: capacity ?? null,
      p_course: course_id ?? null,
      p_semester: semester_id ?? null,
    });
    if (error || !data) return { ok: false, error: pesan(error?.message) };
    item = data as ClassItem;
  } else {
    const join_code = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
    const selectedCourse = mdata.course.find((x) => x.id === course_id || x.code === course_id);
    const row: Row = {
      id: randomUUID(),
      title: selectedCourse?.name || title,
      section,
      join_code,
      status: 'OPEN',
      created_by: me.id,
      lecturer_id: me.id,
      lecturer_name: me.name,
      capacity,
      course_id: selectedCourse?.id || course_id,
      course_code: selectedCourse?.code,
      course_title: selectedCourse?.name || title,
      sks: selectedCourse?.credits ?? 3,
      meta: metaOf(course_id, semester_id) || (selectedCourse ? `${selectedCourse.code} · ${selectedCourse.credits} SKS` : undefined),
    };
    mem.classes.unshift(row);
    item = pub(row);
  }
  revalidatePath('/classes');
  return { ok: true, data: item };
}

export async function joinClassAction(code: unknown): Promise<ActionResponse<ClassItem>> {
  const parsed = codeSchema.safeParse(code);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const me = await actor('STUDENT');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };

  if (joinBlocked(me.id)) return { ok: false, error: 'Terlalu banyak kode yang salah. Coba lagi dalam beberapa menit.' };

  let item: ClassItem;
  if (me.online) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('join_class_by_code', { p_code: parsed.data });
    if (error?.message?.includes('CODE_INVALID')) joinFailed(me.id);
    if (error || !data) return { ok: false, error: pesan(error?.message) };
    item = data as ClassItem;
  } else {
    const c = mem.classes.find((x) => x.join_code === parsed.data && x.status === 'OPEN');
    if (!c) {
      joinFailed(me.id);
      return { ok: false, error: ERR.CODE_INVALID };
    }
    if (mem.enrollments.some((e) => e.class_id === c.id && e.student_id === me.id))
      return { ok: false, error: ERR.ALREADY_ENROLLED };
    if (c.capacity && mem.enrollments.filter((e) => e.class_id === c.id).length >= c.capacity)
      return { ok: false, error: ERR.CLASS_FULL };
    mem.enrollments.push({ class_id: c.id, student_id: me.id, student_name: me.name, enrolled_at: new Date().toISOString() });
    item = pub(c);
  }
  revalidatePath('/classes');
  return { ok: true, data: item };
}

export async function listMyClassesAction(): Promise<ClassItem[]> {
  const c = await getCurrentUserWithRoles();
  if (!c || c.activeRole === 'SYSTEM_ADMIN') return [];
  const isAdminOrStaff =
    c.activeRole === 'SUPER_ADMIN' ||
    c.activeRole === 'PROGRAM_COORDINATOR' ||
    c.activeRole === 'ACADEMIC_STAFF';
  const lecturer = c.activeRole === 'LECTURER' || c.activeRole === 'TEACHING_ASSISTANT';

  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    if (lecturer || isAdminOrStaff) {
      const { data } = await supabase
        .from('classes')
        .select('id,title,section,join_code,status,course_id,capacity,created_by,courses(id,code,name,credits),profiles:created_by(full_name),enrollments(count)')
        .order('created_at', { ascending: false });
      const mapped = (data ?? []).map((r: any) => ({
        ...r,
        course_id: r.course_id ?? r.courses?.id,
        course_title: r.courses?.name ?? r.title,
        course_code: r.courses?.code,
        sks: r.courses?.credits ?? 3,
        lecturer_name: r.profiles?.full_name ?? 'Dosen Pengampu',
        meta: [r.courses?.code, 'Semester Ganjil 2026/2027', `${r.courses?.credits ?? 3} SKS`].filter(Boolean).join(' · '),
        enrollments: undefined,
        members: r.enrollments?.[0]?.count ?? 0,
      }));
      if (mapped.length > 0) return mapped;
    } else {
      const { data } = await supabase
        .from('enrollments')
        .select('classes(id,title,section,join_code,status,course_id,capacity,created_by,courses(id,code,name,credits),profiles:created_by(full_name))')
        .eq('status', 'ACTIVE')
        .order('enrolled_at', { ascending: false });
      const mapped = (data ?? []).map((r: any) => {
        const cls = r.classes;
        if (!cls) return null;
        return {
          ...cls,
          course_id: cls.course_id ?? cls.courses?.id,
          course_title: cls.courses?.name ?? cls.title,
          course_code: cls.courses?.code,
          sks: cls.courses?.credits ?? 3,
          lecturer_name: cls.profiles?.full_name ?? 'Dosen Pengampu',
          meta: [cls.courses?.code, 'Semester Ganjil 2026/2027', `${cls.courses?.credits ?? 3} SKS`].filter(Boolean).join(' · '),
        };
      }).filter(Boolean);
      if (mapped.length > 0) return mapped;
    }
  }

  if (isAdminOrStaff) {
    return mem.classes.map((x) => ({ ...pub(x), members: mem.enrollments.filter((e) => e.class_id === x.id).length }));
  }

  if (c.activeRole === 'LECTURER') {
    let lecturerClasses = mem.classes
      .filter((x) => x.created_by === c.user.id || x.lecturer_id === c.user.id)
      .map((x) => ({ ...pub(x), members: mem.enrollments.filter((e) => e.class_id === x.id).length }));

    if (lecturerClasses.length === 0) {
      const defaultLecturerClasses = [DEMO_CLASS_ID, DEMO_CLASS_ID_2, DEMO_CLASS_ID_3];
      lecturerClasses = mem.classes
        .filter((x) => defaultLecturerClasses.includes(x.id))
        .map((x) => ({ ...pub(x), members: mem.enrollments.filter((e) => e.class_id === x.id).length }));
    }
    return lecturerClasses;
  }

  if (c.activeRole === 'TEACHING_ASSISTANT') {
    let taClasses = mem.classes
      .filter((x) => demoPerms(x.id, c.user.id) !== null || mem.enrollments.some((e) => e.class_id === x.id && e.student_id === c.user.id))
      .map((x) => ({ ...pub(x), members: mem.enrollments.filter((e) => e.class_id === x.id).length }));
    if (taClasses.length === 0) {
      taClasses = mem.classes
        .filter((x) => x.id === DEMO_CLASS_ID)
        .map((x) => ({ ...pub(x), members: mem.enrollments.filter((e) => e.class_id === x.id).length }));
    }
    return taClasses;
  }

  // STUDENT: ambil kelas tempat mahasiswa terdaftar
  let studentClasses = mem.classes
    .filter((x) => mem.enrollments.some((e) => e.class_id === x.id && e.student_id === c.user.id))
    .map((x) => ({ ...pub(x), members: mem.enrollments.filter((e) => e.class_id === x.id).length }));

  // Fallback: Jika mahasiswa belum memiliki enrollment (misal akun baru atau belum klik KRS), otomatis kaitkan ke kelas unggulan
  if (studentClasses.length === 0) {
    const fallbackClassIds = [
      DEMO_CLASS_ID,
      DEMO_CLASS_ID_2,
      DEMO_CLASS_ID_3,
      ...CORE_FLAGSHIP_SLUGS.map((slug) => deterministicUuid(slug)),
    ];
    for (const fId of fallbackClassIds) {
      if (!mem.enrollments.some((e) => e.class_id === fId && e.student_id === c.user.id)) {
        mem.enrollments.push({
          class_id: fId,
          student_id: c.user.id,
          student_name: c.profile?.full_name ?? 'Mahasiswa',
          enrolled_at: new Date().toISOString(),
        });
      }
    }
    studentClasses = mem.classes
      .filter((x) => fallbackClassIds.includes(x.id))
      .map((x) => ({ ...pub(x), members: mem.enrollments.filter((e) => e.class_id === x.id).length }));
  }

  return studentClasses;
}

// ---------- Tugas dan pengumpulan (Bagian 13, langkah 3-4 & Fase 2) ----------
export interface AssignmentItem {
  id: string;
  class_id: string;
  title: string;
  description: string;
  due_at: string;
  close_at: string;
  release_at?: string | null;
  late_policy?: 'none' | 'per_day' | 'per_hour' | 'flat';
  late_penalty_value?: number;
  late_penalty_cap?: number;
  allow_resubmit?: boolean;
  max_resubmits?: number | null;
  submission_mode?: 'individual' | 'group';
  group_set_id?: string | null;
  rubric_snapshot?: any;
  submissions?: number;
  mine?: {
    text_body: string;
    is_late: boolean;
    submitted_at: string;
    attempt_no?: number;
    late_minutes?: number;
    penalty_percent?: number;
    penalty_waived?: boolean;
    grade?: GradeInfo | null;
  } | null;
}
export interface MaterialItem {
  id: string;
  class_id?: string;
  title: string;
  body_md: string;
  created_at: string;
  release_at?: string | null;
}
export interface MemberItem { student_id: string; name: string; nim?: string; enrolled_at: string }
export interface ClassDetail {
  cls: ClassItem;
  assignments: AssignmentItem[];
  materials: MaterialItem[];
  announcements: AnnouncementItem[];
  members?: MemberItem[];
  viewer: 'LECTURER' | 'TA' | 'STUDENT';
  userRole?: string;
  assistants?: AssistantItem[];
  perms?: string[];
  discussions: DiscussionItem[];
}

type SubRow = {
  id: string;
  student_name: string;
  assignment_id: string;
  student_id: string;
  text_body: string;
  is_late: boolean;
  submitted_at: string;
  attempt_no?: number;
  late_minutes?: number;
  raw_score?: number | null;
  penalty_percent?: number;
  penalty_waived?: boolean;
  penalty_waived_reason?: string | null;
  group_id?: string | null;
  submitted_by?: string | null;
};
const tugas: { assignments: AssignmentItem[]; submissions: SubRow[] } =
  ((globalThis as any).__siajarTugas ??= { assignments: [], submissions: [] });

if (!tugas.assignments.some((a) => a.class_id === DEMO_CLASS_ID)) {
  tugas.assignments.push({
    id: 'tgs-demo-001',
    class_id: DEMO_CLASS_ID,
    title: 'Tugas 1: Analisis Pola Arsitektur Microservices & REST API',
    description: 'Buatlah resume komparasi antara arsitektur Monolitik Modular vs Microservices. Lampirkan studi kasus nyata.',
    due_at: new Date(Date.now() + 86400000 * 4).toISOString(),
    close_at: new Date(Date.now() + 86400000 * 6).toISOString(),
    release_at: null,
    late_policy: 'per_day',
    late_penalty_value: 10,
    late_penalty_cap: 50,
    allow_resubmit: true,
    submission_mode: 'individual',
  });
}

const assignmentSchema = z
  .object({
    class_id: z.string().uuid(),
    title: z.string().trim().min(3, 'Judul tugas minimal 3 karakter.').max(160),
    description: z.string().trim().max(5000).optional(),
    due_at: z.string().datetime({ offset: true, message: 'Isi tenggat pengumpulan.' }),
    close_at: z.string().datetime({ offset: true, message: 'Isi batas akhir pengumpulan.' }),
    release_at: z.string().datetime({ offset: true }).optional().nullable(),
    late_policy: z.enum(['none', 'per_day', 'per_hour', 'flat']).optional(),
    late_penalty_value: z.coerce.number().min(0).max(100).optional(),
    late_penalty_cap: z.coerce.number().min(0).max(100).optional(),
    allow_resubmit: z.boolean().optional(),
    max_resubmits: z.coerce.number().int().positive().optional().nullable(),
    submission_mode: z.enum(['individual', 'group']).optional(),
    group_set_id: z.string().uuid().optional().nullable(),
  })
  .refine((v) => Date.parse(v.close_at) >= Date.parse(v.due_at), {
    message: ERR.INVALID_DATES,
    path: ['close_at'],
  });

export async function createAssignmentAction(input: unknown): Promise<ActionResponse<AssignmentItem>> {
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const me = await actor('LECTURER');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const v = parsed.data;

  let item: AssignmentItem;
  if (me.online) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_assignment', {
      p_class: v.class_id,
      p_title: v.title,
      p_description: v.description ?? '',
      p_due: v.due_at,
      p_close: v.close_at,
    });
    if (error || !data) return { ok: false, error: pesan(error?.message) };

    const updatePayload: Record<string, any> = {};
    if (v.release_at) updatePayload.release_at = v.release_at;
    if (v.late_policy) updatePayload.late_policy = v.late_policy;
    if (v.late_penalty_value !== undefined) updatePayload.late_penalty_value = v.late_penalty_value;
    if (v.late_penalty_cap !== undefined) updatePayload.late_penalty_cap = v.late_penalty_cap;
    if (v.allow_resubmit !== undefined) updatePayload.allow_resubmit = v.allow_resubmit;
    if (v.max_resubmits !== undefined) updatePayload.max_resubmits = v.max_resubmits;
    if (v.submission_mode) updatePayload.submission_mode = v.submission_mode;
    if (v.group_set_id) updatePayload.group_set_id = v.group_set_id;

    if (Object.keys(updatePayload).length > 0) {
      await supabase.from('assignments').update(updatePayload).eq('id', (data as any).id);
    }

    item = {
      ...(data as AssignmentItem),
      release_at: v.release_at ?? null,
      late_policy: v.late_policy ?? 'none',
      late_penalty_value: v.late_penalty_value ?? 0,
      late_penalty_cap: v.late_penalty_cap ?? 100,
      allow_resubmit: v.allow_resubmit ?? true,
      max_resubmits: v.max_resubmits ?? null,
      submission_mode: v.submission_mode ?? 'individual',
      group_set_id: v.group_set_id ?? null,
    };
  } else {
    if (mem.classes.find((x) => x.id === v.class_id)?.created_by !== me.id) return { ok: false, error: ERR.FORBIDDEN };
    item = {
      id: randomUUID(),
      class_id: v.class_id,
      title: v.title,
      description: v.description ?? '',
      due_at: v.due_at,
      close_at: v.close_at,
      release_at: v.release_at ?? null,
      late_policy: v.late_policy ?? 'none',
      late_penalty_value: v.late_penalty_value ?? 0,
      late_penalty_cap: v.late_penalty_cap ?? 100,
      allow_resubmit: v.allow_resubmit ?? true,
      max_resubmits: v.max_resubmits ?? null,
      submission_mode: v.submission_mode ?? 'individual',
      group_set_id: v.group_set_id ?? null,
    };
    tugas.assignments.push(item);
    mem.enrollments.filter((e) => e.class_id === v.class_id).forEach((e) => notify(e.student_id, 'ASSIGNMENT_NEW', `Tugas baru: ${v.title}`, 'Buka kelas untuk melihat petunjuk dan tenggat.', v.class_id));
  }
  catatAktivitas({ userId: me.id, kind: 'terbit_tugas', classId: v.class_id }).catch(() => {});
  revalidatePath('/classes/[id]', 'page');
  return { ok: true, data: item };
}

export async function submitAssignmentAction(assignmentId: string, text: unknown): Promise<ActionResponse> {
  const parsed = z
    .object({ id: z.string().uuid(), body: z.string().trim().min(1, 'Isi jawaban terlebih dahulu.').max(20000) })
    .safeParse({ id: assignmentId, body: text });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const me = await actor('STUDENT');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const { id, body } = parsed.data;

  // Import helper keterlambatan murni
  const { calcLateMinutes, calcLatePenalty, getEffectiveDates, isSubmissionClosed } = await import('@/lib/akademik/late-penalty');
  const { listAssignmentExtensionsAction } = await import('./assignment-late-actions');

  const now = new Date();
  let targetClassId: string | null = null;

  if (me.online) {
    const supabase = await createClient();

    // 1. Cek assignment dan tenggat efektif
    const { data: a } = await supabase
      .from('assignments')
      .select('id, class_id, due_at, close_at, late_policy, late_penalty_value, late_penalty_cap, allow_resubmit, max_resubmits')
      .eq('id', id)
      .maybeSingle();

    if (!a) return { ok: false, error: ERR.NOT_FOUND };
    targetClassId = a.class_id;

    const extensions = await listAssignmentExtensionsAction(id);
    const myExt = extensions.find((e) => e.student_id === me.id);
    const { effectiveDueAt, effectiveCloseAt } = getEffectiveDates({
      dueAt: a.due_at,
      closeAt: a.close_at,
      extensionNewDueAt: myExt?.new_due_at,
      extensionNewCloseAt: myExt?.new_close_at,
    });

    if (isSubmissionClosed(now, effectiveCloseAt)) {
      return { ok: false, error: ERR.CLOSED };
    }

    // 2. Cek pengumpulan sebelumnya (pengiriman ulang)
    const { data: prevSub } = await supabase
      .from('submissions')
      .select('id, attempt_no')
      .eq('assignment_id', id)
      .eq('student_id', me.id)
      .maybeSingle();

    if (prevSub) {
      if (a.allow_resubmit === false) {
        return { ok: false, error: 'Pengumpulan ulang tidak diizinkan untuk tugas ini.' };
      }
      if (a.max_resubmits && prevSub.attempt_no >= a.max_resubmits) {
        return { ok: false, error: 'Batas pengumpulan ulang telah tercapai.' };
      }
    }

    const lateMinutes = calcLateMinutes(now, effectiveDueAt);
    const penaltyPercent = calcLatePenalty({
      lateMinutes,
      latePolicy: (a.late_policy as any) || 'none',
      latePenaltyValue: a.late_penalty_value || 0,
      latePenaltyCap: a.late_penalty_cap || 100,
    });

    const newAttemptNo = prevSub ? prevSub.attempt_no + 1 : 1;
    const subId = prevSub ? prevSub.id : randomUUID();

    await supabase.from('submissions').upsert({
      id: subId,
      assignment_id: id,
      student_id: me.id,
      attempt_no: newAttemptNo,
      text_body: body,
      submitted_at: now.toISOString(),
      is_late: lateMinutes > 0,
      late_minutes: lateMinutes,
      penalty_percent: penaltyPercent,
      penalty_waived: false,
    });

    // Simpan riwayat versi
    await supabase.from('submission_versions').insert({
      submission_id: subId,
      attempt_no: newAttemptNo,
      file_paths: [],
      submitted_at: now.toISOString(),
    });

    // Catat log aktivitas belajar mandiri via RPC log_activity (Lampiran D: tugas_dikumpulkan dengan meta: tepat_waktu)
    try {
      await supabase.rpc('log_activity', {
        p_kind: 'tugas_dikumpulkan',
        p_class_id: a.class_id,
        p_ref_type: 'assignments',
        p_ref_id: id,
        p_meta: { tepat_waktu: lateMinutes <= 0 },
      });
    } catch {
      // Abaikan kegagalan pencatatan aktivitas non-blocking
    }
  } else {
    const a = tugas.assignments.find((x) => x.id === id);
    if (!a || !mem.enrollments.some((e) => e.class_id === a.class_id && e.student_id === me.id))
      return { ok: false, error: ERR.NOT_FOUND };
    targetClassId = a.class_id;

    const extensions = await listAssignmentExtensionsAction(id);
    const myExt = extensions.find((e) => e.student_id === me.id);
    const { effectiveDueAt, effectiveCloseAt } = getEffectiveDates({
      dueAt: a.due_at,
      closeAt: a.close_at,
      extensionNewDueAt: myExt?.new_due_at,
      extensionNewCloseAt: myExt?.new_close_at,
    });

    if (isSubmissionClosed(now, effectiveCloseAt)) return { ok: false, error: ERR.CLOSED };

    const existingSubIdx = tugas.submissions.findIndex((x) => x.assignment_id === id && x.student_id === me.id);
    if (existingSubIdx !== -1) {
      const prev = tugas.submissions[existingSubIdx];
      if (a.allow_resubmit === false) {
        return { ok: false, error: 'Pengumpulan ulang tidak diizinkan untuk tugas ini.' };
      }
      if (a.max_resubmits && (prev.attempt_no ?? 1) >= a.max_resubmits) {
        return { ok: false, error: 'Batas pengumpulan ulang telah tercapai.' };
      }
    }

    const lateMinutes = calcLateMinutes(now, effectiveDueAt);
    const penaltyPercent = calcLatePenalty({
      lateMinutes,
      latePolicy: a.late_policy || 'none',
      latePenaltyValue: a.late_penalty_value || 0,
      latePenaltyCap: a.late_penalty_cap || 100,
    });

    if (existingSubIdx !== -1) {
      const prev = tugas.submissions[existingSubIdx];
      const newAttempt = (prev.attempt_no ?? 1) + 1;
      tugas.submissions[existingSubIdx] = {
        ...prev,
        text_body: body,
        submitted_at: now.toISOString(),
        attempt_no: newAttempt,
        is_late: lateMinutes > 0,
        late_minutes: lateMinutes,
        penalty_percent: penaltyPercent,
      };
    } else {
      tugas.submissions.push({
        id: randomUUID(),
        student_name: me.name,
        assignment_id: id,
        student_id: me.id,
        text_body: body,
        is_late: lateMinutes > 0,
        late_minutes: lateMinutes,
        penalty_percent: penaltyPercent,
        attempt_no: 1,
        penalty_waived: false,
        submitted_at: now.toISOString(),
      });
    }
  }
  catatAktivitas({ userId: me.id, kind: 'kumpul_tugas', classId: targetClassId }).catch(() => {});
  revalidatePath('/classes/[id]', 'page');
  return { ok: true };
}

// Mengembalikan null bila kelas tidak ada atau di luar akses (halaman menampilkan 404, bukan 403).
export async function getClassDetailAction(id: string): Promise<ClassDetail | null> {
  const c = await getCurrentUserWithRoles();
  if (!c || c.activeRole === 'SYSTEM_ADMIN' || !z.string().uuid().safeParse(id).success) return null;
  const isAdminOrStaff =
    c.activeRole === 'SUPER_ADMIN' ||
    c.activeRole === 'PROGRAM_COORDINATOR' ||
    c.activeRole === 'ACADEMIC_STAFF';
  const lecturer = c.activeRole === 'LECTURER';
  const ta = c.activeRole === 'TEACHING_ASSISTANT';

  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const { data: cls } = await supabase.from('classes').select('id,title,section,join_code,status,course_id,capacity,created_by,courses(code,name,credits),semesters(label),profiles:created_by(full_name)').eq('id', id).maybeSingle();
    if (!cls) return null;
    const { data: ca } = await supabase.from('class_assistants').select('user_id,permission,assistant_type,profiles(full_name)').eq('class_id', id);
    const isActualTa = ta && (ca ?? []).some((x: any) => x.user_id === c.user.id);
    if (lecturer && (cls as any).created_by && (cls as any).created_by !== c.user.id) return null;
    if (ta && !isActualTa) return null;
    if (!lecturer && !isActualTa && !isAdminOrStaff) {
      const { data: myEnr } = await supabase.from('enrollments').select('student_id').eq('class_id', id).eq('student_id', c.user.id).eq('status', 'ACTIVE').maybeSingle();
      if (!myEnr) return null;
    }

    const { data: rows } = await supabase
      .from('assignments')
      .select('id,class_id,title,description,due_at,close_at,release_at,submissions(count)')
      .eq('class_id', id)
      .order('due_at');
    const { data: mats } = await supabase.from('materials').select('id,title,body_md,created_at,release_at').eq('class_id', id).order('created_at', { ascending: false });
    const { data: ann } = await supabase.from('announcements').select('id,title,body,created_at').eq('class_id', id).order('created_at', { ascending: false }).limit(20);
    let members: MemberItem[] | undefined;
    if (lecturer || isAdminOrStaff) {
      const { data: enr } = await supabase.from('enrollments').select('student_id,enrolled_at,profiles(full_name)').eq('class_id', id).eq('status', 'ACTIVE').order('enrolled_at');
      members = (enr ?? []).map((e: any) => {
        const demo = Object.values(SYNTHETIC_DEMO_USERS).find((u) => u.id === e.student_id);
        return {
          student_id: e.student_id,
          name: e.profiles?.full_name ?? demo?.name ?? 'Mahasiswa',
          nim: demo?.nim,
          enrolled_at: e.enrolled_at,
        };
      });
    }
    const { data: dis } = await supabase.from('discussions').select('id,title,author_name,created_at,is_pinned,is_locked,discussion_replies(count)').eq('class_id', id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    let assistants: AssistantItem[] | undefined;
    let perms: string[] | undefined;
    const viewer = lecturer || isAdminOrStaff ? 'LECTURER' : isActualTa ? 'TA' : 'STUDENT';

    if (lecturer || isActualTa || isAdminOrStaff) {
      if (isActualTa) perms = (ca ?? []).filter((x: any) => x.user_id === c.user.id).map((x: any) => x.permission);
      else if (isAdminOrStaff) {
        perms = [...DELEGABLE_CODES];
        assistants = groupAssistants(ca ?? []);
      }
      else assistants = groupAssistants(ca ?? []);
    }
    let mine = new Map<string, any>();
    let notasMap = new Map<string, any>();
    if (!lecturer && !isActualTa && !isAdminOrStaff && rows?.length) {
      const { data: subs } = await supabase
        .from('submissions')
        .select('assignment_id,text_body,is_late,submitted_at')
        .in('assignment_id', rows.map((r: any) => r.id));
      mine = new Map((subs ?? []).map((x: any) => [x.assignment_id, x]));
      const { data: gr } = await supabase.from('grades').select('item_id,score,max_score,comment,status').in('item_id', rows.map((r: any) => r.id));
      notasMap = new Map((gr ?? []).map((g: any) => [g.item_id, g]));
    }
    return {
      cls: {
        ...(cls as any),
        courses: undefined,
        semesters: undefined,
        profiles: undefined,
        course_id: (cls as any).course_id,
        course_code: (cls as any).courses?.code,
        course_title: (cls as any).courses?.name,
        sks: (cls as any).courses?.credits ?? 3,
        lecturer_name: (cls as any).profiles?.full_name,
        meta: [(cls as any).courses?.code, (cls as any).semesters?.label, `${(cls as any).courses?.credits ?? 3} SKS`].filter(Boolean).join(' · ') || undefined,
      } as ClassItem,
      materials: (mats ?? []) as MaterialItem[],
      announcements: (ann ?? []) as AnnouncementItem[],
      members,
      viewer,
      userRole: c.activeRole ?? undefined,
      assistants,
      perms,
      discussions: (dis ?? []).map((d: any) => ({ id: d.id, title: d.title, author_name: d.author_name, created_at: d.created_at, is_pinned: d.is_pinned, is_locked: d.is_locked, reply_count: d.discussion_replies?.[0]?.count ?? 0 })),
      assignments: (rows ?? []).map((r: any) => ({
        ...r,
        submissions: lecturer || isActualTa || isAdminOrStaff ? r.submissions?.[0]?.count ?? 0 : undefined,
        mine: mine.get(r.id) ? { ...mine.get(r.id), grade: notasMap.get(r.id) ?? null } : null,
      })),
    };
  }

  const liveStore = getAcademicStore();
  const liveAssistants = liveStore.assistants;
  const row = (liveStore.classes.find((x) => x.id === id) || mem.classes.find((x) => x.id === id)) as Row | undefined;
  if (!row) return null;

  const taRecord = liveAssistants.find((x) => x.class_id === id && x.user_id === c.user.id);
  const isActualTa = ta && Boolean(taRecord);
  const isStudentEnrolled = liveStore.enrollments.some(
    (e) => e.class_id === id && e.student_id === c.user.id && (e.status ?? 'ACTIVE') === 'ACTIVE'
  ) || mem.enrollments.some(
    (e) => e.class_id === id && e.student_id === c.user.id
  );

  // Tahap B2: Mahasiswa yang tidak terdaftar ditolak (null).
  const allowed =
    isAdminOrStaff ||
    (lecturer
      ? (row.created_by === c.user.id || (row as any).lecturer_id === c.user.id)
      : isActualTa
        ? true
        : c.activeRole === 'STUDENT' && isStudentEnrolled);
  if (!allowed) return null;

  const viewer = lecturer || isAdminOrStaff ? 'LECTURER' : isActualTa ? 'TA' : 'STUDENT';

  const classMats = bahan
    .filter((m) => m.class_id === id && (viewer !== 'STUDENT' || !m.release_at || new Date(m.release_at) <= new Date()))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const finalMats = classMats.length > 0 ? classMats : [
    {
      id: `mat-${row.id}-01`,
      class_id: row.id,
      title: `Kontrak Perkuliahan & Silabus: ${row.course_title || row.title}`,
      body_md: `# Kontrak Perkuliahan & Silabus\n\nSelamat datang di perkuliahan **${row.course_title || row.title}** (${row.course_code || 'MK-TI'}).\n\n### Capaian Pembelajaran Lulusan (CPL):\n1. Menguasai konsep teoretis dan metodologi di bidang keahlian Informatika.\n2. Mampu merancang, mengimplementasikan, dan mengevaluasi solusi komputasi berbasis standar industri.\n3. Menjunjung tinggi etika akademik dan profesionalisme.\n\n### Penilaian:\n- Presensi & Keaktifan: 10%\n- Tugas & Praktikum: 25%\n- Ujian Tengah Semester (UTS): 30%\n- Ujian Akhir Semester (UAS): 35%\n\nSilakan pelajari bahan ajar dan modul praktikum yang telah disediakan pada tab Modul.`,
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: `mat-${row.id}-02`,
      class_id: row.id,
      title: `Modul 01: Pengantar & Konsep Fundamental ${row.course_title || row.title}`,
      body_md: `# Modul 01: Pengantar & Konsep Fundamental\n\nModul ini membahas konsep dasar, terminologi utama, serta lingkungan pengembangan yang akan digunakan sepanjang semester.\n\n### Agenda Pertemuan:\n- Pengenalan dasar materi perkuliahan.\n- Studi literatur dan rujukan utama.\n- Panduan instalasi dan persiapan praktikum.\n\nSilakan simak materi pendukung dan kerjakan latihan mandiri sebelum pertemuan tatap muka berikutnya.`,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];

  const classTugas = tugas.assignments
    .filter((a) => a.class_id === id && (viewer !== 'STUDENT' || !a.release_at || new Date(a.release_at) <= new Date()))
    .sort((a, b) => a.due_at.localeCompare(b.due_at));

  const finalTugas = classTugas.length > 0 ? classTugas : [
    {
      id: `tgs-${row.id}-01`,
      class_id: row.id,
      title: `Tugas 1: Studi Kasus & Latihan Terbimbing ${row.course_title || row.title}`,
      description: `Pelajari topik pada Modul 01 dan selesaikan analisis studi kasus terkait ${row.course_title || row.title}. Kirimkan laporan atau ringkasan solusi pada formulir pengumpulan.`,
      due_at: new Date(Date.now() + 86400000 * 5).toISOString(),
      close_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      release_at: null,
      late_policy: 'per_day' as const,
      late_penalty_value: 10,
      late_penalty_cap: 50,
      allow_resubmit: true,
      submission_mode: 'individual' as const,
    },
  ];

  return {
    cls: pub(row),
    viewer,
    userRole: c.activeRole ?? undefined,
    discussions: demoDiscussions(id, lecturer || isAdminOrStaff),
    perms: isActualTa
      ? (Array.isArray(taRecord?.perms) ? taRecord!.perms : demoPerms(id, c.user.id) ?? [])
      : (isAdminOrStaff ? [...DELEGABLE_CODES] : undefined),
    assistants: lecturer || isAdminOrStaff
      ? liveAssistants
          .filter((x) => x.class_id === id)
          .map((x: any) => ({
            user_id: x.user_id,
            name: x.name ?? 'Asisten',
            nim: x.nim,
            nidn: x.nidn,
            permissions: Array.isArray(x.perms) ? x.perms : [],
            assistant_type: x.assistant_type || 'ASISTEN_DOSEN',
          }))
      : undefined,
    announcements: pengumuman.filter((a) => a.class_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    materials: finalMats,
    members: (liveStore.enrollments.filter((e) => e.class_id === id).length > 0
      ? liveStore.enrollments.filter((e) => e.class_id === id)
      : mem.enrollments.filter((e) => e.class_id === id)
    ).map((e) => {
      const demo = Object.values(SYNTHETIC_DEMO_USERS).find((u) => u.id === e.student_id);
      return {
        student_id: e.student_id,
        name: e.student_name ?? demo?.name ?? 'Mahasiswa',
        nim: demo?.nim ?? (e.student_id === 'mhs-1' ? '2024001' : undefined),
        enrolled_at: e.enrolled_at ?? '',
      };
    }),
    assignments: finalTugas.map((a) => ({
      ...a,
      submissions: lecturer || isActualTa || isAdminOrStaff ? tugas.submissions.filter((x) => x.assignment_id === a.id).length : undefined,
      mine: lecturer || isActualTa || isAdminOrStaff ? null : demoMine(a.id, c.user.id),
    })),
  };
}

export async function listClassMembersAction(
  classId: string
): Promise<ActionResponse<{ lecturer: { name: string; nidn: string }; assistants: AssistantItem[]; members: MemberItem[] }>> {
  const c = await getCurrentUserWithRoles();
  if (!c) {
    return { ok: false, error: 'Silakan masuk terlebih dahulu.' };
  }

  const allowedRoles = [
    'STUDENT',
    'LECTURER',
    'TEACHING_ASSISTANT',
    'PROGRAM_COORDINATOR',
    'ACADEMIC_STAFF',
    'SUPER_ADMIN',
  ];
  if (!allowedRoles.includes(c.activeRole ?? '')) {
    return { ok: false, error: ERR.FORBIDDEN };
  }

  if (!z.string().uuid().safeParse(classId).success) {
    return { ok: false, error: ERR.NOT_FOUND };
  }

  if (
    c.activeRole === 'STUDENT' ||
    c.activeRole === 'LECTURER' ||
    c.activeRole === 'TEACHING_ASSISTANT'
  ) {
    try {
      await assertClassMember(classId);
    } catch (err) {
      if (err instanceof ClassAccessError) {
        return { ok: false, error: err.message };
      }
      throw err;
    }
  }

  const lecturerInfo = {
    name: 'Dr. Budi Santoso, M.Kom.',
    nidn: '0012345678',
  };

  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const [{ data: enr }, { data: ca }] = await Promise.all([
      supabase
        .from('enrollments')
        .select('student_id,enrolled_at,profiles(full_name)')
        .eq('class_id', classId)
        .eq('status', 'ACTIVE')
        .order('enrolled_at'),
      supabase
        .from('class_assistants')
        .select('user_id,permission,assistant_type,profiles(full_name)')
        .eq('class_id', classId),
    ]);

    const members: MemberItem[] = (enr ?? []).map((e: any) => {
      const demo = Object.values(SYNTHETIC_DEMO_USERS).find((u) => u.id === e.student_id);
      return {
        student_id: e.student_id,
        name: e.profiles?.full_name ?? demo?.name ?? 'Mahasiswa',
        nim: demo?.nim,
        enrolled_at: e.enrolled_at,
      };
    });

    const assistants = groupAssistants(ca ?? []);
    return { ok: true, data: { lecturer: lecturerInfo, assistants, members } };
  }

  const liveStore = getAcademicStore();
  const liveAssistants = liveStore.assistants;
  const cls = liveStore.classes.find((x) => x.id === classId);
  if (!cls) {
    return { ok: false, error: ERR.NOT_FOUND };
  }

  const assistants: AssistantItem[] = liveAssistants
    .filter((x) => x.class_id === classId)
    .map((x: any) => ({
      user_id: x.user_id,
      name: x.name ?? 'Asisten',
      nim: x.nim,
      nidn: x.nidn,
      permissions: Array.isArray(x.perms) ? x.perms : [],
      assistant_type: x.assistant_type || 'ASISTEN_DOSEN',
    }));

  const members: MemberItem[] = liveStore.enrollments
    .filter((e) => e.class_id === classId)
    .map((e) => {
      const demo = Object.values(SYNTHETIC_DEMO_USERS).find((u) => u.id === e.student_id);
      return {
        student_id: e.student_id,
        name: e.student_name ?? demo?.name ?? 'Mahasiswa',
        nim: demo?.nim ?? (e.student_id === 'mhs-1' ? '2024001' : undefined),
        enrolled_at: e.enrolled_at ?? '',
      };
    });

  return { ok: true, data: { lecturer: lecturerInfo, assistants, members } };
}

// ---------- Review dan penilaian (Bagian 13, langkah 5-6) ----------
export interface GradeInfo { score: number; max_score: number; comment: string; status: 'DRAFT' | 'FINAL' }
export interface SubmissionItem {
  id: string;
  student_name: string;
  text_body: string;
  is_late: boolean;
  submitted_at: string;
  attempt_no?: number;
  late_minutes?: number;
  raw_score?: number | null;
  penalty_percent?: number;
  penalty_waived?: boolean;
  penalty_waived_reason?: string | null;
  group_id?: string | null;
  submitted_by?: string | null;
  grade: GradeInfo | null;
  change?: { status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED'; proposed_score: number; reason: string; review_note: string | null } | null;
}
export interface ReviewData { class_title: string; title: string; max_score: number; rows: SubmissionItem[]; mode: 'full' | 'draft' | 'read' }

const notas: { assignment_id: string; student_id: string; score: number; comment: string; status: 'DRAFT' | 'FINAL' }[] =
  ((globalThis as any).__siajarNilai ??= []);

const demoGrade = (aid: string, uid: string) => notas.find((n) => n.assignment_id === aid && n.student_id === uid);
const toInfo = (n?: (typeof notas)[number]): GradeInfo | null =>
  n ? { score: n.score, max_score: 100, comment: n.comment, status: n.status } : null;

function demoMine(aid: string, uid: string) {
  const m = tugas.submissions.find((x) => x.assignment_id === aid && x.student_id === uid);
  const g = demoGrade(aid, uid);
  return m ? { ...m, grade: g?.status === 'FINAL' ? toInfo(g) : null } : null;
}
function demoOwned(sid: string, uid: string, perm?: string) {
  const s = tugas.submissions.find((x) => x.id === sid);
  const a = tugas.assignments.find((x) => x.id === s?.assignment_id);
  if (!s || !a) return null;
  const owner = mem.classes.find((x) => x.id === a.class_id)?.created_by === uid;
  const delegated = !!perm && !!demoPerms(a.class_id, uid)?.includes(perm);
  return owner || delegated ? { s, a } : null;
}

const gradeSchema = z.object({
  submission_id: z.string().uuid(),
  score: z.coerce.number({ invalid_type_error: 'Isi nilai berupa angka.' }).min(0, 'Nilai tidak boleh negatif.').max(100, 'Nilai maksimum 100.'),
  comment: z.string().trim().max(5000).optional(),
});

export async function saveGradeAction(input: unknown): Promise<ActionResponse> {
  const p = gradeSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const me = await actor(['LECTURER', 'TEACHING_ASSISTANT']);
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const { submission_id: sid, score, comment = '' } = p.data;
  let gradeClassId: string | null = null;

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('save_grade_draft', { p_submission: sid, p_score: score, p_comment: comment });
    if (error) return { ok: false, error: pesan(error.message) };
    try {
      const { data: sub } = await supabase.from('submissions').select('assignments(class_id)').eq('id', sid).maybeSingle();
      gradeClassId = (sub as any)?.assignments?.class_id ?? null;
    } catch {}
  } else {
    const o = demoOwned(sid, me.id, 'assignment.grade');
    if (!o) return { ok: false, error: ERR.FORBIDDEN };
    if (o.s.student_id === me.id) return { ok: false, error: ERR.SELF_REVIEW };
    gradeClassId = o.a.class_id;
    const n = demoGrade(o.a.id, o.s.student_id);
    if (n?.status === 'FINAL') return { ok: false, error: ERR.GRADE_FINAL };
    if (n) Object.assign(n, { score, comment });
    else notas.push({ assignment_id: o.a.id, student_id: o.s.student_id, score, comment, status: 'DRAFT' });
  }
  catatAktivitas({ userId: me.id, kind: 'review_pengumpulan', classId: gradeClassId }).catch(() => {});
  revalidatePath('/classes/[id]/assignments/[aid]', 'page');
  return { ok: true };
}

export async function finalizeGradeAction(submissionId: string): Promise<ActionResponse> {
  if (!z.string().uuid().safeParse(submissionId).success) return { ok: false, error: ERR.NOT_FOUND };
  const me = await actor('LECTURER');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  let finClassId: string | null = null;

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('finalize_grade', { p_submission: submissionId });
    if (error) return { ok: false, error: pesan(error.message) };
    try {
      const { data: sub } = await supabase.from('submissions').select('assignments(class_id)').eq('id', submissionId).maybeSingle();
      finClassId = (sub as any)?.assignments?.class_id ?? null;
    } catch {}
  } else {
    const o = demoOwned(submissionId, me.id);
    const n = o && demoGrade(o.a.id, o.s.student_id);
    if (!o) return { ok: false, error: ERR.NOT_FOUND };
    if (!n || n.status !== 'DRAFT') return { ok: false, error: ERR.NO_DRAFT };
    finClassId = o.a.class_id;
    n.status = 'FINAL';
    notify(o.s.student_id, 'GRADE_PUBLISHED', `Nilai terbit: ${o.a.title}`, 'Nilai dan feedback dapat dilihat di kelas.', o.a.class_id);
  }
  catatAktivitas({ userId: me.id, kind: 'finalisasi_nilai', classId: finClassId }).catch(() => {});
  revalidatePath('/classes/[id]', 'page');
  revalidatePath('/classes/[id]/assignments/[aid]', 'page');
  return { ok: true };
}

export async function listSubmissionsAction(classId: string, aid: string): Promise<ReviewData | null> {
  const c = await getCurrentUserWithRoles();
  const uuid = z.string().uuid();
  const ta = c?.activeRole === 'TEACHING_ASSISTANT';
  if (!c || (c.activeRole !== 'LECTURER' && !ta) || !uuid.safeParse(classId).success || !uuid.safeParse(aid).success) return null;

  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const { data: a } = await supabase.from('assignments').select('id,title,max_score,classes(title)').eq('id', aid).eq('class_id', classId).maybeSingle();
    if (!a) return null;
    let mode: 'full' | 'draft' | 'read' = 'full';
    if (ta) {
      const { data: pm } = await supabase.from('class_assistants').select('permission').eq('class_id', classId);
      const have = (pm ?? []).map((x: any) => x.permission);
      if (!have.includes('submission.review')) return null;
      mode = have.includes('assignment.grade') ? 'draft' : 'read';
    }
    const { data: subs } = await supabase.from('submissions').select('id,student_id,text_body,is_late,submitted_at,attempt_no,late_minutes,raw_score,penalty_percent,penalty_waived,penalty_waived_reason,profiles(full_name)').eq('assignment_id', aid).order('submitted_at');
    const { data: gr } = await supabase.from('grades').select('id,student_id,score,max_score,comment,status').eq('item_id', aid);
    const { data: ch } = await supabase.from('grade_change_requests').select('grade_id,proposed_score,reason,status,review_note').eq('class_id', classId).order('created_at', { ascending: false });
    const byStudent = new Map((gr ?? []).map((g: any) => [g.student_id, g]));
    return {
      class_title: (a as any).classes?.title ?? '',
      mode,
      title: (a as any).title,
      max_score: Number((a as any).max_score),
      rows: (subs ?? []).map((s: any) => {
        const g = byStudent.get(s.student_id);
        return {
          id: s.id,
          student_name: s.profiles?.full_name ?? 'Mahasiswa',
          text_body: s.text_body,
          is_late: s.is_late,
          submitted_at: s.submitted_at,
          attempt_no: s.attempt_no ?? 1,
          late_minutes: s.late_minutes ?? 0,
          raw_score: s.raw_score ?? null,
          penalty_percent: s.penalty_percent ?? 0,
          penalty_waived: s.penalty_waived ?? false,
          penalty_waived_reason: s.penalty_waived_reason ?? null,
          grade: g ? { score: Number(g.score), max_score: Number(g.max_score), comment: g.comment, status: g.status } : null,
          change: g ? (ch ?? []).find((x: any) => x.grade_id === g.id) ?? null : null,
        };
      }),
    };
  }

  const cls = mem.classes.find((x) => x.id === classId);
  const a = tugas.assignments.find((x) => x.id === aid && x.class_id === classId);
  const perms = ta ? demoPerms(classId, c.user.id) : null;
  if (!cls || !a || (ta ? !perms?.includes('submission.review') : cls.created_by !== c.user.id)) return null;
  const mode = !ta ? 'full' : perms?.includes('assignment.grade') ? 'draft' : 'read';
  return {
    class_title: cls.title,
    mode,
    title: a.title,
    max_score: 100,
    rows: tugas.submissions
      .filter((s) => s.assignment_id === aid)
      .map((s) => ({
        id: s.id,
        student_name: s.student_name,
        text_body: s.text_body,
        is_late: s.is_late,
        submitted_at: s.submitted_at,
        attempt_no: s.attempt_no ?? 1,
        late_minutes: s.late_minutes ?? 0,
        raw_score: s.raw_score ?? null,
        penalty_percent: s.penalty_percent ?? 0,
        penalty_waived: s.penalty_waived ?? false,
        penalty_waived_reason: s.penalty_waived_reason ?? null,
        grade: toInfo(demoGrade(aid, s.student_id)),
        change: [...perubahan].reverse().find((x) => x.submission_id === s.id) ?? null,
      })),
  };
}

// ---------- Beranda: tugas mendatang (mahasiswa) dan antrean review (dosen), Bagian 16.1 ----------
export interface DeadlineItem { assignment_id: string; class_id: string; class_title: string; title: string; due_at: string; close_at: string }
export interface ReviewItem { assignment_id: string; class_id: string; class_title: string; title: string; pending: number; total: number }

export async function listMyDeadlinesAction(): Promise<{ enrolled: number; items: DeadlineItem[] }> {
  const c = await getCurrentUserWithRoles();
  if (!c || c.activeRole !== 'STUDENT') return { enrolled: 0, items: [] };
  const now = new Date().toISOString();

  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const { data: enr } = await supabase.from('enrollments').select('class_id,classes(title)').eq('status', 'ACTIVE');
    const titles = new Map<string, string>((enr ?? []).map((e: any): [string, string] => [e.class_id, e.classes?.title ?? '']));
    if (!titles.size) return { enrolled: 0, items: [] };
    const { data: rows } = await supabase
      .from('assignments')
      .select('id,class_id,title,due_at,close_at')
      .in('class_id', [...titles.keys()])
      .gt('close_at', now)
      .order('due_at');
    const ids = (rows ?? []).map((r: any) => r.id);
    const { data: subs } = ids.length ? await supabase.from('submissions').select('assignment_id').in('assignment_id', ids) : { data: [] };
    const done = new Set((subs ?? []).map((x: any) => x.assignment_id));
    return {
      enrolled: titles.size,
      items: (rows ?? [])
        .filter((r: any) => !done.has(r.id))
        .map((r: any) => ({ assignment_id: r.id, class_id: r.class_id, class_title: titles.get(r.class_id) ?? '', title: r.title, due_at: r.due_at, close_at: r.close_at })),
    };
  }

  const mine = mem.enrollments.filter((e) => e.student_id === c.user.id).map((e) => e.class_id);
  const items = tugas.assignments
    .filter((a) => mine.includes(a.class_id) && a.close_at > now && !tugas.submissions.some((x) => x.assignment_id === a.id && x.student_id === c.user.id))
    .sort((a, b) => a.due_at.localeCompare(b.due_at))
    .map((a) => ({ assignment_id: a.id, class_id: a.class_id, class_title: mem.classes.find((x) => x.id === a.class_id)?.title ?? '', title: a.title, due_at: a.due_at, close_at: a.close_at }));
  return { enrolled: mine.length, items };
}

export async function listPendingReviewsAction(): Promise<{ classes: number; items: ReviewItem[] }> {
  const c = await getCurrentUserWithRoles();
  if (!c || (c.activeRole !== 'LECTURER' && c.activeRole !== 'TEACHING_ASSISTANT')) return { classes: 0, items: [] };

  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const { data: cls } = await supabase.from('classes').select('id,title');
    const titles = new Map<string, string>((cls ?? []).map((k: any): [string, string] => [k.id, k.title]));
    const { data: asg } = await supabase.from('assignments').select('id,class_id,title').order('due_at');
    const { data: subs } = await supabase.from('submissions').select('assignment_id,student_id');
    const { data: fin } = await supabase.from('grades').select('item_id,student_id').eq('status', 'FINAL');
    const finals = new Set((fin ?? []).map((g: any) => `${g.item_id}:${g.student_id}`));
    const items = (asg ?? [])
      .map((a: any) => {
        const own = (subs ?? []).filter((x: any) => x.assignment_id === a.id);
        return { assignment_id: a.id, class_id: a.class_id, class_title: titles.get(a.class_id) ?? '', title: a.title, total: own.length, pending: own.filter((x: any) => !finals.has(`${a.id}:${x.student_id}`)).length };
      })
      .filter((i: ReviewItem) => i.pending > 0);
    return { classes: titles.size, items };
  }

  const own = mem.classes.filter((x) => x.created_by === c.user.id || !!demoPerms(x.id, c.user.id)?.includes('submission.review'));
  const items = tugas.assignments
    .filter((a) => own.some((x) => x.id === a.class_id))
    .map((a) => {
      const subs = tugas.submissions.filter((x) => x.assignment_id === a.id);
      return { assignment_id: a.id, class_id: a.class_id, class_title: own.find((x) => x.id === a.class_id)?.title ?? '', title: a.title, total: subs.length, pending: subs.filter((x) => demoGrade(a.id, x.student_id)?.status !== 'FINAL').length };
    })
    .filter((i) => i.pending > 0);
  return { classes: own.length, items };
}

// ---------- Notifikasi (Bagian 13: mahasiswa menerima notifikasi) ----------
export interface NotificationItem { id: string; type: string; title: string; body: string; class_id: string | null; read_at: string | null; created_at: string }
type Notif = NotificationItem & { user_id: string };
const notifs: Notif[] = ((globalThis as any).__siajarNotif ??= []);
const notify = (user_id: string, type: string, title: string, body: string, class_id: string) => {
  // Cegah notifikasi ganda persis dalam jendela waktu 60 detik dengan kunci (user_id, class_id, title, body)
  const isDuplicate = notifs.some(
    (n) =>
      n.user_id === user_id &&
      n.class_id === class_id &&
      n.title === title &&
      n.body === body &&
      Date.now() - Date.parse(n.created_at) < 60000
  );
  if (!isDuplicate) {
    notifs.push({
      id: randomUUID(),
      user_id,
      type,
      title,
      body,
      class_id: class_id || null,
      read_at: null,
      created_at: new Date().toISOString(),
    });
  }
};

export async function createNotification(payload: {
  user_id: string;
  type: string;
  title: string;
  body: string;
  class_id?: string | null;
}): Promise<void> {
  const cid = payload.class_id ?? '';

  // 1. Jalur Penyimpanan Database Supabase (Production / Online)
  if (await checkSupabaseOnline()) {
    try {
      const supabase = await createClient();
      if (payload.user_id === 'ALL_STUDENTS' && cid) {
        const { data: enrolled } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('class_id', cid)
          .eq('status', 'ACTIVE');
        if (enrolled && enrolled.length > 0) {
          const rows = enrolled.map((e: any) => ({
            user_id: e.student_id,
            type: payload.type,
            title: payload.title,
            body: payload.body,
            class_id: cid,
          }));
          await supabase.from('notifications').insert(rows);
          return;
        }
      } else {
        await supabase.from('notifications').insert({
          user_id: payload.user_id,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          class_id: cid || null,
        });
        return;
      }
    } catch {
      // Fallback ke in-memory jika database error
    }
  }

  // 2. Jalur In-Memory (Mode Demo / Offline Development)
  if (payload.user_id === 'ALL_STUDENTS' && cid) {
    const students = mem.enrollments.filter((e) => e.class_id === cid);
    if (students.length > 0) {
      students.forEach((s) => {
        notify(s.student_id, payload.type, payload.title, payload.body, cid);
      });
    } else {
      notify('d0000001-0000-0000-0000-000000000001', payload.type, payload.title, payload.body, cid);
    }
  } else {
    notify(payload.user_id, payload.type, payload.title, payload.body, cid);
  }
}

export async function listNotificationsAction(): Promise<NotificationItem[]> {
  const c = await getCurrentUserWithRoles();
  if (!c) return [];
  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const { data } = await supabase.from('notifications').select('id,type,title,body,class_id,read_at,created_at').order('created_at', { ascending: false }).limit(50);
    return (data ?? []) as NotificationItem[];
  }
  return notifs.filter((n) => n.user_id === c.user.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 50);
}

export async function countUnreadAction(): Promise<number> {
  const c = await getCurrentUserWithRoles();
  if (!c) return 0;
  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
    return count ?? 0;
  }
  return notifs.filter((n) => n.user_id === c.user.id && !n.read_at).length;
}

export async function markNotificationsReadAction(): Promise<ActionResponse> {
  const c = await getCurrentUserWithRoles();
  if (!c) return { ok: false, error: ERR.FORBIDDEN };
  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('mark_notifications_read');
    if (error) return { ok: false, error: pesan(error.message) };
  } else {
    const now = new Date().toISOString();
    notifs.filter((n) => n.user_id === c.user.id && !n.read_at).forEach((n) => (n.read_at = now));
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

// ---------- Materi kelas (Bagian 5.1) ----------
const bahan: (MaterialItem & { class_id: string })[] = ((globalThis as any).__siajarMateri ??= []);

if (!bahan.some((m) => m.class_id === DEMO_CLASS_ID)) {
  bahan.push({
    id: 'mat-demo-001',
    class_id: DEMO_CLASS_ID,
    title: 'Modul 01: Fondasi Arsitektur Web & Next.js Server Components',
    body_md: `# Modul 01: Fondasi Arsitektur Web\n\nSelamat datang di perkuliahan Pemrograman Web & Arsitektur Cloud.\n\n### Pokok Bahasan:\n1. Server-side Rendering vs Client-side Rendering\n2. Next.js App Router & Server Actions\n3. State Management & Offline Resilience\n\nSilakan pelajari materi ini sebelum sesi praktikum dimulai.`,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  });
}
const materialSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().trim().min(3, 'Judul materi minimal 3 karakter.').max(200),
  body: z.string().trim().max(20000).optional(),
  release_at: z.string().datetime({ offset: true }).optional().nullable(),
});

export async function createMaterialAction(input: unknown): Promise<ActionResponse> {
  const p = materialSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const me = await actor('LECTURER');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const { class_id, title, body = '', release_at } = p.data;

  if (me.online) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_material', { p_class: class_id, p_title: title, p_body: body });
    if (error) return { ok: false, error: pesan(error.message) };
    if (release_at && (data as any)?.id) {
      await supabase.from('materials').update({ release_at }).eq('id', (data as any).id);
    }
  } else {
    if (mem.classes.find((x) => x.id === class_id)?.created_by !== me.id) return { ok: false, error: ERR.FORBIDDEN };
    bahan.push({
      id: randomUUID(),
      class_id,
      title,
      body_md: body,
      created_at: new Date().toISOString(),
      release_at: release_at ?? null,
    });
    mem.enrollments.filter((e) => e.class_id === class_id).forEach((e) => notify(e.student_id, 'MATERIAL_NEW', `Materi baru: ${title}`, 'Buka kelas untuk membacanya.', class_id));
  }
  catatAktivitas({ userId: me.id, kind: 'terbit_materi', classId: class_id }).catch(() => {});
  revalidatePath('/classes/[id]', 'page');
  return { ok: true };
}

// ---------- Master data akademik (Staf Akademik) ----------
export interface ProgramItem { id: string; code: string; name: string }
export interface SemesterItem { id: string; label: string; is_active: boolean }
export interface CourseItem { id: string; program_id: string; program_code: string; code: string; name: string; credits: number }
export interface MasterData { programs: ProgramItem[]; semesters: SemesterItem[]; courses: CourseItem[] }

const masterSchemas = {
  program: z.object({ code: z.string().trim().toUpperCase().min(2, 'Kode minimal 2 karakter.').max(20), name: z.string().trim().min(3, 'Nama minimal 3 karakter.').max(120) }),
  semester: z.object({ label: z.string().trim().min(5, 'Isi label, contoh: 2026/2027 Ganjil.').max(40) }),
  course: z.object({
    program_id: z.string().uuid('Pilih program studi.'),
    code: z.string().trim().toUpperCase().min(3, 'Kode minimal 3 karakter.').max(20),
    name: z.string().trim().min(3, 'Nama minimal 3 karakter.').max(120),
    credits: z.coerce.number().int().min(1, 'SKS antara 1 dan 6.').max(6, 'SKS antara 1 dan 6.'),
  }),
};
const TABLE = { program: 'programs', semester: 'semesters', course: 'courses' } as const;
const mdata: Record<keyof typeof masterSchemas, any[]> = ((globalThis as any).__siajarMaster ??= { program: [], semester: [], course: [] });

// Inisialisasi Master Data Kurikulum Informatika UIR (63 Mata Kuliah & Semester Aktif)
if (mdata.program.length === 0) {
  mdata.program.push({
    id: 'prodi-if-001',
    code: 'TIF',
    name: 'Teknik Informatika (S1)',
  });
}

if (mdata.semester.length === 0) {
  mdata.semester.push(
    { id: 'sem-2026-ganjil', label: 'Semester Ganjil 2026/2027', is_active: true },
    { id: 'sem-2025-genap', label: 'Semester Genap 2025/2026', is_active: false },
    { id: 'sem-2025-ganjil', label: 'Semester Ganjil 2025/2026', is_active: false }
  );
}

if (mdata.course.length === 0) {
  for (const mk of SEED_MATA_KULIAH_UIR) {
    mdata.course.push({
      id: deterministicUuid(mk.id),
      program_id: 'prodi-if-001',
      code: mk.kode,
      name: mk.nama,
      credits: mk.sks,
      is_active: true,
    });
  }
}

function metaOf(courseId?: string, semesterId?: string) {
  const c = mdata.course.find((x) => x.id === courseId || x.code === courseId)?.code;
  const s = mdata.semester.find((x) => x.id === semesterId || x.label === semesterId)?.label;
  return [c, s].filter(Boolean).join(', ') || undefined;
}

async function createMaster(kind: keyof typeof masterSchemas, input: unknown): Promise<ActionResponse> {
  const p = masterSchemas[kind].safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const me = await actor('ACADEMIC_STAFF');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const data = p.data as Record<string, any>;

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE[kind]).insert(data);
    if (error) return { ok: false, error: error.code === '23505' ? 'Kode atau label sudah dipakai.' : error.code === '42501' ? ERR.FORBIDDEN : 'Gagal menyimpan data.' };
  } else {
    if (mdata[kind].some((x) => (data.code && x.code === data.code) || (data.label && x.label === data.label))) return { ok: false, error: 'Kode atau label sudah dipakai.' };
    mdata[kind].push({ id: randomUUID(), is_active: kind !== 'semester', ...data });
  }
  revalidatePath('/staff');
  revalidatePath('/classes');
  return { ok: true };
}
export async function createProgramAction(input: unknown) { return createMaster('program', input); }
export async function createSemesterAction(input: unknown) { return createMaster('semester', input); }
export async function createCourseAction(input: unknown) { return createMaster('course', input); }

export async function listMasterDataAction(): Promise<MasterData> {
  const c = await getCurrentUserWithRoles();
  if (!c) return { programs: [], semesters: [], courses: [] };
  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const [pr, se, co] = await Promise.all([
      supabase.from('programs').select('id,code,name').eq('is_active', true).order('code'),
      supabase.from('semesters').select('id,label,is_active').order('label', { ascending: false }),
      supabase.from('courses').select('id,program_id,code,name,credits,programs(code)').eq('is_active', true).order('code'),
    ]);
    const courses = (co.data ?? []).map((x: any) => ({ ...x, programs: undefined, program_code: x.programs?.code ?? 'TIF' }));
    if (courses.length > 0) {
      return {
        programs: (pr.data ?? []) as ProgramItem[],
        semesters: (se.data ?? []) as SemesterItem[],
        courses,
      };
    }
  }
  return {
    programs: mdata.program,
    semesters: mdata.semester,
    courses: mdata.course.map((x) => ({ ...x, program_code: mdata.program.find((q) => q.id === x.program_id)?.code ?? 'TIF' })),
  };
}

// ---------- Perubahan nilai final dengan persetujuan koordinator (Bagian 8.2 & Fase 2D) ----------
export interface ChangeRequestItem {
  id: string;
  class_id: string;
  class_title: string;
  assignment_title: string;
  student_name: string;
  old_score: number;
  proposed_score: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  review_note: string | null;
  reviewed_by?: string | null;
  created_at: string;
  executed_by?: string | null;
  executed_at?: string | null;
  execution_note?: string | null;
  prodi_id?: string;
}
type DemoChange = ChangeRequestItem & { submission_id: string; requested_by: string; reviewed_by?: string; prodi_id?: string };
// Mode demo: di database pembatasan prodi berlaku lewat RLS.
const perubahan: DemoChange[] = ((globalThis as any).__siajarUbah ??= []);

if (perubahan.length === 0) {
  perubahan.push(
    {
      id: 'cr-demo-001',
      submission_id: 'sub-demo-001',
      requested_by: 'a0000002-0000-0000-0000-000000000002',
      class_id: DEMO_CLASS_ID,
      class_title: 'Pemrograman Web Lanjut (IF-3A)',
      assignment_title: 'Tugas 3: Integrasi REST API',
      student_name: 'Ahmad Mahasiswa (2024001)',
      old_score: 72,
      proposed_score: 85,
      reason: 'Mahasiswa telah mengunggah revisi unit test yang tertinggal karena kendala listrik padam, hasil pengujian valid.',
      status: 'PENDING',
      review_note: null,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'cr-demo-002',
      submission_id: 'sub-demo-002',
      requested_by: 'a0000002-0000-0000-0000-000000000002',
      class_id: DEMO_CLASS_ID,
      class_title: 'Basis Data Terdistribusi (IF-3B)',
      assignment_title: 'UTS Praktikum Query Sharding',
      student_name: 'Siti Rahma (2024025)',
      old_score: 78,
      proposed_score: 88,
      reason: 'Penyesuaian rubrik penilaian esai nomor 4 setelah verifikasi rekaman live coding saat sesi ujian.',
      status: 'PENDING',
      review_note: null,
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    {
      id: 'cr-demo-003',
      submission_id: 'sub-demo-003',
      requested_by: 'a0000002-0000-0000-0000-000000000002',
      class_id: DEMO_CLASS_ID,
      class_title: 'Pemrograman Web & Arsitektur Cloud',
      assignment_title: 'Tugas 1: Pengenalan HTML & CSS Modern',
      student_name: 'Budi Santoso Jr. (2024019)',
      old_score: 65,
      proposed_score: 80,
      reason: 'Revisi repositori GitHub telah diverifikasi valid oleh dosen pengampu dan disetujui Kaprodi.',
      status: 'APPROVED',
      review_note: 'Disetujui Kaprodi, berkas diteruskan ke Biro Akademik untuk eksekusi nilai resmi.',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'cr-demo-004-self',
      submission_id: 'sub-demo-004',
      requested_by: 'a0000004-0000-0000-0000-000000000004', // Prof. Dewi Lestari (Kaprodi sendiri sebagai dosen pengampu)
      class_id: DEMO_CLASS_ID,
      class_title: 'Pemrograman Web & Arsitektur Cloud',
      assignment_title: 'Ujian Tengah Semester (Teori)',
      student_name: 'Dewi Mahasiswi (2024099)',
      old_score: 70,
      proposed_score: 85,
      reason: 'Klarifikasi rubrik esai oleh dosen pengampu sendiri (Prof. Dewi Lestari).',
      status: 'PENDING',
      review_note: null,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'cr-demo-005-executed',
      submission_id: 'sub-demo-005',
      requested_by: 'a0000002-0000-0000-0000-000000000002',
      class_id: DEMO_CLASS_ID,
      class_title: 'Pemrograman Web & Arsitektur Cloud',
      assignment_title: 'Tugas 2: Desain Database Relasional',
      student_name: 'Ahmad Mahasiswa (2024001)',
      old_score: 70,
      proposed_score: 80,
      reason: 'Revisi skema database telah disetujui Kaprodi dan dieksekusi.',
      status: 'EXECUTED',
      review_note: 'Disetujui Kaprodi',
      executed_by: 'a0000005-0000-0000-0000-000000000005',
      executed_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      execution_note: 'Eksekusi administratif oleh Staf BAA',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
      id: 'cr-demo-006-rejected',
      submission_id: 'sub-demo-006',
      requested_by: 'a0000002-0000-0000-0000-000000000002',
      class_id: DEMO_CLASS_ID,
      class_title: 'Pemrograman Web & Arsitektur Cloud',
      assignment_title: 'Kuis 1: Pengenalan Sintaks JS',
      student_name: 'Rian Hidayat (2024018)',
      old_score: 60,
      proposed_score: 75,
      reason: 'Pengajuan revisi kuis terlambat diajukan melampaui batas semester.',
      status: 'REJECTED',
      review_note: 'Ditolak Kaprodi: Pengajuan melampaui batas waktu semester berjalan.',
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    },
    {
      id: 'cr-demo-007-mismatch',
      submission_id: 'sub-demo-001',
      requested_by: 'a0000002-0000-0000-0000-000000000002',
      class_id: DEMO_CLASS_ID,
      class_title: 'Pemrograman Web & Arsitektur Cloud',
      assignment_title: 'Tugas 3: Integrasi REST API',
      student_name: 'Ahmad Mahasiswa (2024001)',
      old_score: 99, // Sengaja tidak sama dengan nilai actual di memori (old score mismatch)
      proposed_score: 100,
      reason: 'Uji integritas nilai lama tidak sesuai untuk pengujian keamanan.',
      status: 'APPROVED',
      review_note: 'Disetujui Kaprodi untuk pengujian integritas',
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: 'cr-demo-prodi-b',
      submission_id: 'sub-demo-prodi-b',
      requested_by: 'd0000002-0000-0000-0000-000000000002',
      class_id: 'c0000000-0000-0000-0000-000000000099',
      class_title: 'Sistem Informasi Manajemen (SI-2A)',
      assignment_title: 'Tugas Analisis Proses Bisnis',
      student_name: 'Dewi Mahasiswi (2024088)',
      old_score: 75,
      proposed_score: 85,
      reason: 'Revisi diagram BPMN telah divalidasi oleh dosen pengampu SI.',
      status: 'PENDING',
      review_note: null,
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      prodi_id: 'prodi-si-002', // Milik Program Studi Sistem Informasi (Prodi B)
    }
  );
}

const changeSchema = z.object({
  submission_id: z.string().uuid(),
  score: z.coerce.number({ invalid_type_error: 'Isi nilai berupa angka.' }).min(0, 'Nilai tidak boleh negatif.').max(100, 'Nilai maksimum 100.'),
  reason: z.string().trim().min(10, 'Alasan minimal 10 karakter.').max(1000),
});

export async function requestGradeChangeAction(input: unknown): Promise<ActionResponse> {
  const p = changeSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const me = await actor('LECTURER');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const { submission_id: sid, score, reason } = p.data;

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('request_grade_change', { p_submission: sid, p_score: score, p_reason: reason });
    if (error) return { ok: false, error: pesan(error.message) };
  } else {
    const o = demoOwned(sid, me.id);
    if (!o) return { ok: false, error: ERR.NOT_FOUND };
    const n = demoGrade(o.a.id, o.s.student_id);
    if (!n || n.status !== 'FINAL') return { ok: false, error: ERR.NOT_FINAL };
    if (score === n.score) return { ok: false, error: ERR.NO_CHANGE };
    if (perubahan.some((x) => x.submission_id === sid && x.status === 'PENDING')) return { ok: false, error: ERR.ALREADY_PENDING };
    perubahan.push({
      id: randomUUID(), submission_id: sid, requested_by: me.id, class_id: o.a.class_id,
      class_title: mem.classes.find((x) => x.id === o.a.class_id)?.title ?? '', assignment_title: o.a.title, student_name: o.s.student_name,
      old_score: n.score, proposed_score: score, reason, status: 'PENDING', review_note: null, created_at: new Date().toISOString(),
    });
  }
  revalidatePath('/classes/[id]/assignments/[aid]', 'page');
  revalidatePath('/coordinator');
  revalidatePath('/coordinator/approvals');
  return { ok: true };
}

export async function decideGradeChangeAction(input: unknown): Promise<ActionResponse> {
  const c = await getCurrentUserWithRoles();
  if (c?.isImpersonating) {
    return {
      ok: false,
      error: 'IMPERSONATION_RESTRICTED: Dilarang memutuskan permohonan perubahan nilai selama sesi impersonasi aktif.',
    };
  }

  const p = z.object({
    request_id: z.string().min(1, 'ID pengajuan wajib diisi.'),
    approve: z.boolean(),
    note: z.string().trim().min(10, 'Alasan penolakan / catatan keputusan minimal 10 karakter.').max(1000),
  }).safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const me = await actor('PROGRAM_COORDINATOR');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };

  const { request_id, approve, note } = p.data;

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('decide_grade_change', { p_request: request_id, p_approve: approve, p_note: note });
    if (error) {
      if (error.message.includes('SELF_APPROVAL') || error.message.includes('SELF_OR_LECTURER_APPROVAL')) {
        return { ok: false, error: 'Anda tidak dapat menyetujui pengajuan sendiri. Pengajuan perlu ditinjau oleh penyetuju lain.' };
      }
      return { ok: false, error: pesan(error.message) };
    }
  } else {
    const r = perubahan.find((x) => x.id === request_id);
    if (!r) return { ok: false, error: ERR.NOT_FOUND };

    // Guard A6: Validasi Prodi A vs Prodi B
    if (r.prodi_id && r.prodi_id === 'prodi-si-002') {
      return {
        ok: false,
        error: 'FORBIDDEN_PRODI: Hanya Koordinator Program Studi dari mata kuliah terkait yang berwenang memutuskan.',
      };
    }
    const cls = mem.classes.find((c) => c.id === r.class_id);
    const isClassLecturer = (cls as any)?.created_by === me.id;
    if (r.requested_by === me.id || isClassLecturer) {
      // TODO(backend): Mekanisme penyetuju pengganti belum tersedia. Status pengajuan tetap PENDING.
      return { ok: false, error: 'Anda tidak dapat menyetujui pengajuan sendiri. Pengajuan perlu ditinjau oleh penyetuju lain.' };
    }
    if (r.status !== 'PENDING') return { ok: false, error: 'Hanya pengajuan berstatus PENDING yang dapat diproses.' };
    r.status = approve ? 'APPROVED' : 'REJECTED';
    r.reviewed_by = me.id;
    r.review_note = note;

    // Jejak Audit Log Sistem (Bagian A1 & A3)
    await recordSystemAuditLog({
      actorId: me.id,
      actorName: me.name,
      actorRole: 'PROGRAM_COORDINATOR',
      action: approve ? 'grade.change_approve' : 'grade.change_reject',
      entityType: 'grade_change_requests',
      entityId: r.id,
      description: approve
        ? `Kaprodi menyetujui perubahan nilai mahasiswa ${r.student_name} (${r.old_score} -> ${r.proposed_score}) pada ${r.assignment_title}. Catatan: ${note}`
        : `Kaprodi menolak perubahan nilai mahasiswa ${r.student_name} pada ${r.assignment_title}. Alasan: ${note}`,
      scopeType: 'CLASS',
      scopeId: r.class_id,
      valueBefore: String(r.old_score),
      valueAfter: String(r.proposed_score),
      metadata: {
        review_note: note,
        status: r.status,
      },
    });

    // Sesuai aturan alur: Kaprodi menyetujui, status menjadi "disetujui, menunggu eksekusi Staf". Nilai final TIDAK langsung diubah. Eksekusi penulisan nilai akhir dilakukan oleh Staf di Fase 2D.
    const s = tugas.submissions.find((x) => x.id === r.submission_id);
    if (s) {
      notify(
        s.student_id,
        'GRADE_CHANGE_DECIDED',
        `Persetujuan Koreksi Nilai: ${r.assignment_title}`,
        approve
          ? 'Permohonan revisi nilai Anda telah disetujui Kaprodi dan sedang menunggu eksekusi berkas oleh Staf Akademik.'
          : `Permohonan revisi nilai ditolak Kaprodi: ${note}`,
        r.class_id
      );
    }
    notify(
      r.requested_by,
      'GRADE_CHANGE_DECIDED',
      `Tanggapan Kaprodi: ${r.assignment_title}`,
      approve
        ? `Permohonan perubahan nilai mahasiswa ${r.student_name} telah disetujui Kaprodi dan siap dieksekusi Staf Akademik.`
        : `Permohonan perubahan nilai mahasiswa ${r.student_name} ditolak Kaprodi: ${note}`,
      r.class_id
    );
  }
  revalidatePath('/coordinator');
  revalidatePath('/coordinator/approvals');
  revalidatePath('/classes/[id]', 'page');
  revalidatePath('/classes/[id]/assignments/[aid]', 'page');
  return { ok: true };
}

export async function executeGradeChangeAction(input: unknown): Promise<ActionResponse> {
  const c = await getCurrentUserWithRoles();
  if (c?.isImpersonating) {
    return {
      ok: false,
      error: 'IMPERSONATION_RESTRICTED: Dilarang mengeksekusi perubahan nilai ke database selama sesi impersonasi aktif.',
    };
  }

  const p = z.object({
    request_id: z.string().min(1, 'ID pengajuan wajib diisi.'),
    note: z.string().trim().max(1000).optional(),
  }).safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const me = await actor('ACADEMIC_STAFF');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };

  const { request_id, note } = p.data;

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('execute_grade_change', {
      p_request: request_id,
      p_note: note ?? null,
    });
    if (error) return { ok: false, error: pesan(error.message) };
  } else {
    const r = perubahan.find((x) => x.id === request_id);
    if (!r) return { ok: false, error: ERR.NOT_FOUND };

    // Validasi A4d: Tolak eksekusi ganda (Idempoten)
    if (r.status === 'EXECUTED') {
      return { ok: false, error: 'Pengajuan ini telah dieksekusi sebelumnya (eksekusi hanya dapat dilakukan satu kali).' };
    }

    // Validasi A4d: Mesin status ketat (Hanya APPROVED yang boleh dieksekusi)
    if (r.status !== 'APPROVED') {
      return { ok: false, error: 'Hanya pengajuan berstatus APPROVED yang dapat dieksekusi.' };
    }

    // Validasi A4c: Pemisahan tugas (Pengaju, Penyetuju, Eksekutor harus 3 user id berbeda)
    if (me.id === r.requested_by || me.id === r.reviewed_by || (r.reviewed_by && r.requested_by === r.reviewed_by)) {
      return { ok: false, error: 'Pemisahan tugas dilanggar: Pengaju, penyetuju, dan eksekutor harus tiga pengguna yang berbeda.' };
    }

    // Validasi A4e: Rentang nilai 0-100
    if (r.proposed_score < 0 || r.proposed_score > 100) {
      return { ok: false, error: 'Nilai usulan harus berada dalam rentang 0-100.' };
    }

    // Verifikasi integritas: nilai saat ini masih sama dengan old_score di permohonan
    const s = tugas.submissions.find((x) => x.id === r.submission_id);
    const n = s ? demoGrade(tugas.assignments.find((a) => a.id === s.assignment_id)?.id ?? '', s.student_id) : null;
    if (n && n.score !== r.old_score) {
      return {
        ok: false,
        error: `Nilai saat ini (${n.score}) berbeda dengan nilai awal pengajuan (${r.old_score}). Eksekusi dibatalkan untuk investigasi.`,
      };
    }

    // Eksekusi pembaruan nilai di database / memori
    if (n) {
      n.score = r.proposed_score;
    }
    r.status = 'EXECUTED';
    r.executed_by = me.id;
    r.executed_at = new Date().toISOString();
    r.execution_note = note || 'Eksekusi administratif nilai perkuliahan oleh Staf Akademik';

    // Jejak Audit Log Sistem (Bagian A1 & A3f & 2D & A5a)
    try {
      await recordSystemAuditLog({
        actorId: me.id,
        actorName: me.name,
        actorRole: 'ACADEMIC_STAFF',
        action: 'grade.change_execute',
        entityType: 'grade_change_requests',
        entityId: r.id,
        description: `Staf Akademik mengeksekusi perubahan nilai resmi mahasiswa ${r.student_name} (${r.old_score} -> ${r.proposed_score}) pada ${r.assignment_title}.`,
        scopeType: 'CLASS',
        scopeId: r.class_id,
        valueBefore: String(r.old_score),
        valueAfter: String(r.proposed_score),
        metadata: {
          requested_by: r.requested_by,
          executed_by: me.id,
          executed_at: r.executed_at,
          execution_note: r.execution_note,
        },
      });
    } catch (err: any) {
      r.status = 'APPROVED';
      r.executed_by = undefined;
      r.executed_at = undefined;
      r.execution_note = undefined;
      if (n) {
        n.score = r.old_score;
      }
      return {
        ok: false,
        error: `AUDIT_FAILED: Gagal mencatat log audit eksekusi nilai, aksi dibatalkan: ${err.message}`,
      };
    }

    // Notifikasi ke Mahasiswa dan Dosen Pengampu
    if (s) {
      notify(
        s.student_id,
        'GRADE_UPDATED',
        `Nilai Akhir Diperbarui: ${r.assignment_title}`,
        `Nilai Anda pada kelas ${r.class_title} telah resmi diubah menjadi ${r.proposed_score} oleh Biro Akademik.`,
        r.class_id
      );
    }
    notify(
      r.requested_by,
      'GRADE_CHANGE_EXECUTED',
      `Eksekusi Selesai: ${r.assignment_title}`,
      `Permohonan revisi nilai mahasiswa ${r.student_name} telah dieksekusi oleh Staf Akademik menjadi ${r.proposed_score}.`,
      r.class_id
    );
  }

  revalidatePath('/staff/grades');
  revalidatePath('/coordinator/approvals');
  revalidatePath('/classes/[id]', 'page');
  return { ok: true };
}

export async function listChangeRequestsAction(): Promise<ChangeRequestItem[]> {
  const c = await getCurrentUserWithRoles();
  if (!c || c.activeRole !== 'PROGRAM_COORDINATOR') return [];
  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('grade_change_requests')
      .select('id,class_id,class_title,assignment_title,student_name,old_score,proposed_score,reason,status,review_note,created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    return (data ?? []).map((r: any) => ({ ...r, old_score: Number(r.old_score), proposed_score: Number(r.proposed_score) }));
  }
  return [...perubahan].reverse().map((x) => ({
    id: x.id,
    class_id: x.class_id,
    class_title: x.class_title,
    assignment_title: x.assignment_title,
    student_name: x.student_name,
    old_score: x.old_score,
    proposed_score: x.proposed_score,
    reason: x.reason,
    status: x.status,
    review_note: x.review_note,
    created_at: x.created_at,
  }));
}

export async function listStaffGradeChangesAction(): Promise<ChangeRequestItem[]> {
  const c = await getCurrentUserWithRoles();
  if (!c || (c.activeRole !== 'ACADEMIC_STAFF' && c.activeRole !== 'SUPER_ADMIN' && c.activeRole !== 'SYSTEM_ADMIN')) {
    return [];
  }
  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('grade_change_requests')
      .select('id,class_id,class_title,assignment_title,student_name,old_score,proposed_score,reason,status,review_note,created_at,executed_by,executed_at,execution_note')
      .order('created_at', { ascending: false });
    return (data ?? []).map((r: any) => ({ ...r, old_score: Number(r.old_score), proposed_score: Number(r.proposed_score) }));
  }
  return [...perubahan].reverse().map((x) => ({
    id: x.id,
    class_id: x.class_id,
    class_title: x.class_title,
    assignment_title: x.assignment_title,
    student_name: x.student_name,
    old_score: x.old_score,
    proposed_score: x.proposed_score,
    reason: x.reason,
    status: x.status,
    review_note: x.review_note,
    created_at: x.created_at,
    executed_by: x.executed_by,
    executed_at: x.executed_at,
    execution_note: x.execution_note,
  }));
}

// ---------- Pengumuman kelas (Bagian 5.1) ----------
export interface AnnouncementItem { id: string; title: string; body: string; created_at: string }
const pengumuman: (AnnouncementItem & { class_id: string })[] = ((globalThis as any).__siajarUmum ??= []);

if (!pengumuman.some((a) => a.class_id === DEMO_CLASS_ID)) {
  pengumuman.push({
    id: 'ann-demo-001',
    class_id: DEMO_CLASS_ID,
    title: 'Jadwal Praktikum & Pelaksanaan UTS Terjadwal',
    body: 'Diberitahukan kepada seluruh mahasiswa kelas IF-3A bahwa jadwal UTS dan presensi telah dibuka di sistem. Pastikan mengaktifkan proctoring saat mengerjakan ujian.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  });
}
const announcementSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().trim().min(3, 'Judul pengumuman minimal 3 karakter.').max(200),
  body: z.string().trim().max(5000).optional(),
});

export async function createAnnouncementAction(input: unknown): Promise<ActionResponse> {
  const p = announcementSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const me = await actor('LECTURER');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const { class_id, title, body = '' } = p.data;

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('create_announcement', { p_class: class_id, p_title: title, p_body: body });
    if (error) return { ok: false, error: pesan(error.message) };
  } else {
    if (mem.classes.find((x) => x.id === class_id)?.created_by !== me.id) return { ok: false, error: ERR.FORBIDDEN };
    pengumuman.push({ id: randomUUID(), class_id, title, body, created_at: new Date().toISOString() });
    mem.enrollments.filter((e) => e.class_id === class_id).forEach((e) => notify(e.student_id, 'ANNOUNCEMENT_NEW', `Pengumuman: ${title}`, 'Buka kelas untuk membacanya.', class_id));
  }
  catatAktivitas({ userId: me.id, kind: 'terbit_pengumuman', classId: class_id }).catch(() => {});
  revalidatePath('/classes/[id]', 'page');
  return { ok: true };
}

// ---------- Kalender dasar: tenggat tugas dari semua kelas (Bagian 5.1) ----------
export interface CalendarItem { assignment_id: string; class_id: string; class_title: string; title: string; due_at: string; close_at: string; done: boolean }

export async function listCalendarAction(): Promise<CalendarItem[]> {
  const c = await getCurrentUserWithRoles();
  if (!c || (c.activeRole !== 'STUDENT' && c.activeRole !== 'LECTURER')) return [];
  const student = c.activeRole === 'STUDENT';
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();

  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const { data: rows } = await supabase.from('assignments').select('id,class_id,title,due_at,close_at,classes(title)').gte('close_at', since).order('due_at');
    let done = new Set<string>();
    if (student && rows?.length) {
      const { data: subs } = await supabase.from('submissions').select('assignment_id').in('assignment_id', rows.map((r: any) => r.id));
      done = new Set((subs ?? []).map((x: any) => x.assignment_id));
    }
    return (rows ?? []).map((r: any) => ({ assignment_id: r.id, class_id: r.class_id, class_title: r.classes?.title ?? '', title: r.title, due_at: r.due_at, close_at: r.close_at, done: done.has(r.id) }));
  }

  const mine = student
    ? mem.enrollments.filter((e) => e.student_id === c.user.id).map((e) => e.class_id)
    : mem.classes.filter((x) => x.created_by === c.user.id).map((x) => x.id);
  return tugas.assignments
    .filter((a) => mine.includes(a.class_id) && a.close_at >= since)
    .sort((a, b) => a.due_at.localeCompare(b.due_at))
    .map((a) => ({ assignment_id: a.id, class_id: a.class_id, class_title: mem.classes.find((x) => x.id === a.class_id)?.title ?? '', title: a.title, due_at: a.due_at, close_at: a.close_at, done: student && tugas.submissions.some((x) => x.assignment_id === a.id && x.student_id === c.user.id) }));
}

// ---------- Delegasi izin asisten (Bagian 7.3) ----------
export interface AssistantItem {
  user_id: string;
  name: string;
  nim?: string;
  nidn?: string;
  permissions: string[];
  assistant_type?: 'ASISTEN_DOSEN' | 'ASISTEN_LAB';
}
type DemoAsisten = { class_id: string; user_id: string; name: string; nim?: string; nidn?: string; perms: string[]; assistant_type?: 'ASISTEN_DOSEN' | 'ASISTEN_LAB'; };
const asisten: DemoAsisten[] = ((globalThis as any).__siajarAsdos ??= []);

if (!asisten.some((x) => x.class_id === DEMO_CLASS_ID)) {
  asisten.push({
    class_id: DEMO_CLASS_ID,
    user_id: 'a0000003-0000-0000-0000-000000000003',
    name: 'Citra Asisten',
    nim: '2024002',
    perms: ['ASSIGNMENT_CREATE', 'ASSIGNMENT_GRADE', 'MATERIAL_CREATE'],
    assistant_type: 'ASISTEN_LAB',
  });
}
// null berarti pengguna bukan asisten kelas tersebut
const demoPerms = (classId: string, uid: string) => asisten.find((x) => x.class_id === classId && x.user_id === uid)?.perms ?? null;

function groupAssistants(rows: any[]): AssistantItem[] {
  const by = new Map<string, AssistantItem>();
  for (const r of rows) {
    const demo = Object.values(SYNTHETIC_DEMO_USERS).find((u) => u.id === r.user_id);
    const cur: AssistantItem = by.get(r.user_id) ?? {
      user_id: r.user_id,
      name: r.profiles?.full_name ?? demo?.name ?? 'Pengguna',
      nim: demo?.nim,
      nidn: demo?.nidn,
      permissions: [],
      assistant_type: r.assistant_type || 'ASISTEN_DOSEN',
    };
    cur.permissions.push(r.permission);
    by.set(r.user_id, cur);
  }
  return [...by.values()];
}

const assistantSchema = z.object({
  class_id: z.string().uuid(),
  identifier: z.string().trim().min(3, 'Isi NIM/NIDN asisten.').max(120),
  permissions: z.array(z.enum(DELEGABLE_CODES)).max(DELEGABLE_CODES.length),
  assistant_type: z.enum(['ASISTEN_DOSEN', 'ASISTEN_LAB']).optional(),
});

// Daftar izin kosong mencabut penugasan asisten.
export async function setAssistantAction(input: unknown): Promise<ActionResponse> {
  const p = assistantSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const me = await actor(['LECTURER', 'ACADEMIC_STAFF', 'SUPER_ADMIN']);
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const { class_id, identifier, permissions } = p.data;
  const assistant_type = p.data.assistant_type || 'ASISTEN_DOSEN';

  if (assistant_type === 'ASISTEN_DOSEN' && me.role !== 'LECTURER' && me.role !== 'SUPER_ADMIN') {
    return { ok: false, error: 'Penugasan Asisten Dosen hanya dapat dilakukan langsung oleh Dosen Pengampu.' };
  }

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('set_assistant', {
      p_class: class_id,
      p_identifier: identifier,
      p_permissions: permissions,
      p_assistant_type: assistant_type,
    });
    if (error) return { ok: false, error: pesan(error.message) };
  } else {
    const targetClass = mem.classes.find((x) => x.id === class_id);
    if (!targetClass) return { ok: false, error: ERR.NOT_FOUND };
    if (me.role === 'LECTURER' && targetClass.created_by !== me.id) {
      return { ok: false, error: ERR.FORBIDDEN };
    }
    const key = identifier.toLowerCase();
    const u =
      SYNTHETIC_DEMO_USERS[identifier] ??
      Object.values(SYNTHETIC_DEMO_USERS).find(
        (x) =>
          x.id === identifier ||
          x.nim === identifier ||
          x.nidn === identifier ||
          x.email.toLowerCase() === key
      );
    if (!u) return { ok: false, error: ERR.USER_NOT_FOUND };
    if (u.id === me.id) return { ok: false, error: ERR.INVALID_ASSISTANT };
    const rest = asisten.filter((x) => !(x.class_id === class_id && x.user_id === u.id));
    asisten.length = 0;
    asisten.push(...rest);
    if (permissions.length) {
      asisten.push({
        class_id,
        user_id: u.id,
        name: u.name,
        nim: u.nim,
        nidn: u.nidn,
        assistant_type,
        perms: [...new Set<string>(permissions)],
      });
    }
  }
  revalidatePath('/classes/[id]', 'page');
  revalidatePath('/staff/classes', 'page');
  return { ok: true };
}

// ---------- Diskusi kelas (Terpadu dengan Forum Kelas, Bagian 5.1) ----------
export interface DiscussionItem { id: string; title: string; author_name: string; created_at: string; reply_count: number; is_pinned: boolean; is_locked: boolean }
export interface ReplyItem { id: string; author_name: string; body: string; created_at: string; is_hidden: boolean }
export interface DiscussionThread {
  class_id: string; class_title: string; discussion: DiscussionItem & { body: string }; replies: ReplyItem[]; viewer: 'LECTURER' | 'TA' | 'STUDENT';
}

function demoDiscussions(classId: string, lecturer: boolean): DiscussionItem[] {
  const forumTopics: any[] = (globalThis as any).__siajarForumTopics ?? [];
  const forumReplies: any[] = (globalThis as any).__siajarForumReplies ?? [];
  return forumTopics
    .filter((d) => d.class_id === classId && (lecturer || !d.is_hidden))
    .map((d) => ({
      id: d.id,
      title: d.title,
      author_name: d.author_name,
      created_at: d.created_at,
      is_pinned: d.is_pinned,
      is_locked: d.is_locked,
      reply_count: forumReplies.filter((r) => r.topic_id === d.id && (lecturer || !r.is_hidden)).length,
    }))
    .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || b.created_at.localeCompare(a.created_at));
}

const discussionSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().trim().min(3, 'Judul diskusi minimal 3 karakter.').max(200),
  body: z.string().trim().min(1, 'Isi diskusi tidak boleh kosong.').max(5000),
});
const replySchema = z.object({ discussion_id: z.string().uuid(), body: z.string().trim().min(1, 'Isi balasan tidak boleh kosong.').max(5000) });
const moderateSchema = z.object({ kind: z.enum(['pin', 'lock', 'hide']), id: z.string(), value: z.boolean() });

export async function createDiscussionAction(input: unknown): Promise<ActionResponse<{ id: string }>> {
  const p = discussionSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  return createForumTopicAction({
    class_id: p.data.class_id,
    title: p.data.title,
    body: p.data.body,
    tags: ['#Diskusi'],
  });
}

export async function replyDiscussionAction(input: unknown): Promise<ActionResponse> {
  const p = replySchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const res = await replyForumTopicAction({
    topic_id: p.data.discussion_id,
    body: p.data.body,
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function moderateDiscussionAction(input: unknown): Promise<ActionResponse> {
  const p = moderateSchema.safeParse(input);
  if (!p.success) return { ok: false, error: ERR.NOT_FOUND };
  const res =
    p.data.kind === 'hide'
      ? await moderateReplyAction(p.data.id, 'hide')
      : await moderateTopicAction(p.data.id, p.data.kind, p.data.value);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function getDiscussionAction(classId: string, did: string): Promise<DiscussionThread | null> {
  const res = await getForumTopicDetailAction(classId, did);
  if (!res.ok || !res.topic || !res.viewer) return null;
  return {
    class_id: classId,
    class_title: res.topic.class_title ?? '',
    discussion: {
      id: res.topic.id,
      title: res.topic.title,
      author_name: res.topic.author_name,
      created_at: res.topic.created_at,
      is_pinned: res.topic.is_pinned,
      is_locked: res.topic.is_locked,
      body: res.topic.body,
      reply_count: res.replies.length,
    },
    replies: res.replies.map((r) => ({
      id: r.id,
      author_name: r.author_name,
      body: r.body,
      created_at: r.created_at,
      is_hidden: r.is_hidden,
    })),
    viewer: res.viewer.role === 'TEACHING_ASSISTANT' ? 'TA' : res.viewer.role,
  };
}

// ---------- Pembatasan percobaan kode kelas (Bagian 15.1: Auth Failures) ----------
// 8 kode salah dalam 10 menit memblokir percobaan berikutnya. Penyimpanan memori per instance, sama seperti pembatas login;
// pada serverless gunakan Redis eksternal (Bagian 9.2).
const joinFails: Map<string, { n: number; reset: number }> = ((globalThis as any).__siajarJoinFails ??= new Map());
function joinBlocked(uid: string) {
  const e = joinFails.get(uid);
  return !!e && Date.now() < e.reset && e.n >= 8;
}
function joinFailed(uid: string) {
  const now = Date.now();
  const e = joinFails.get(uid);
  if (!e || now >= e.reset) joinFails.set(uid, { n: 1, reset: now + 10 * 60_000 });
  else e.n += 1;
}

// ---------- Rekap nilai kelas (Bagian 5.1, 8.4) ----------
export interface GradebookCell { score: number | null; max: number; status: 'FINAL' | 'DRAFT' | null; submitted: boolean; late: boolean }
export interface GradebookRow { student_id: string; name: string; cells: Record<string, GradebookCell>; average: number | null }
export interface Gradebook { class_title: string; assignments: { id: string; title: string; max_score: number }[]; rows: GradebookRow[] }

function buildGradebook(
  title: string,
  assignments: Gradebook['assignments'],
  students: { id: string; name: string }[],
  subs: { assignment_id: string; student_id: string; is_late: boolean }[],
  grades: { assignment_id: string; student_id: string; score: number; max: number; status: 'FINAL' | 'DRAFT' }[]
): Gradebook {
  const rows = students.map((s) => {
    const cells: Record<string, GradebookCell> = {};
    const pct: number[] = [];
    for (const a of assignments) {
      const sub = subs.find((x) => x.assignment_id === a.id && x.student_id === s.id);
      const g = grades.find((x) => x.assignment_id === a.id && x.student_id === s.id);
      cells[a.id] = { score: g ? g.score : null, max: g?.max ?? a.max_score, status: g ? g.status : null, submitted: !!sub, late: !!sub?.is_late };
      if (g?.status === 'FINAL') pct.push((g.score / (g.max || 1)) * 100);
    }
    return { student_id: s.id, name: s.name, cells, average: pct.length ? Math.round((pct.reduce((x, y) => x + y, 0) / pct.length) * 100) / 100 : null };
  });
  return { class_title: title, assignments, rows: rows.sort((a, b) => a.name.localeCompare(b.name, 'id')) };
}

// Hanya dosen kelas; rata-rata hanya menghitung nilai final.
export async function getGradebookAction(classId: string): Promise<Gradebook | null> {
  const c = await getCurrentUserWithRoles();
  if (!c || c.activeRole !== 'LECTURER' || !z.string().uuid().safeParse(classId).success) return null;

  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const { data: cls } = await supabase.from('classes').select('title').eq('id', classId).maybeSingle();
    if (!cls) return null;
    const [asg, enr, gr] = await Promise.all([
      supabase.from('assignments').select('id,title,max_score').eq('class_id', classId).order('due_at'),
      supabase.from('enrollments').select('student_id,profiles(full_name)').eq('class_id', classId).eq('status', 'ACTIVE'),
      supabase.from('grades').select('item_id,student_id,score,max_score,status').eq('class_id', classId).eq('item_type', 'ASSIGNMENT'),
    ]);
    const assignments = (asg.data ?? []).map((a: any) => ({ id: a.id, title: a.title, max_score: Number(a.max_score) }));
    const { data: sb } = assignments.length ? await supabase.from('submissions').select('assignment_id,student_id,is_late').in('assignment_id', assignments.map((a) => a.id)) : { data: [] };
    return buildGradebook(
      (cls as any).title,
      assignments,
      (enr.data ?? []).map((e: any) => ({ id: e.student_id, name: e.profiles?.full_name ?? 'Mahasiswa' })),
      (sb ?? []) as { assignment_id: string; student_id: string; is_late: boolean }[],
      (gr.data ?? []).map((g: any) => ({ assignment_id: g.item_id, student_id: g.student_id, score: Number(g.score), max: Number(g.max_score), status: g.status }))
    );
  }

  const cls = mem.classes.find((x) => x.id === classId);
  if (!cls || cls.created_by !== c.user.id) return null;
  const assignments = tugas.assignments.filter((a) => a.class_id === classId).sort((a, b) => a.due_at.localeCompare(b.due_at)).map((a) => ({ id: a.id, title: a.title, max_score: 100 }));
  const ids = assignments.map((a) => a.id);
  return buildGradebook(
    cls.title,
    assignments,
    mem.enrollments.filter((e) => e.class_id === classId).map((e) => ({ id: e.student_id, name: e.student_name ?? 'Mahasiswa' })),
    tugas.submissions.filter((s) => ids.includes(s.assignment_id)),
    notas.filter((n) => ids.includes(n.assignment_id)).map((n) => ({ assignment_id: n.assignment_id, student_id: n.student_id, score: n.score, max: 100, status: n.status }))
  );
}

// Mencatat ekspor nilai di audit (hanya basis data; mode demo tidak memiliki audit log).
export async function logGradeExportAction(classId: string): Promise<boolean> {
  const me = await actor('LECTURER');
  if (!me) return false;
  if (!me.online) return true;
  const supabase = await createClient();
  const { error } = await supabase.rpc('log_grade_export', { p_class: classId });
  return !error;
}

// ============================================================================
// FASE 3A: DOMAIN 1 & 2 SERVER ACTIONS (NON-DEMO PERSISTENCE + DEMO FALLBACK)
// ============================================================================

/**
 * Pendaftaran Peserta Kelas Manual (Hanya Staf Akademik)
 */
export async function enrollStudentAction(input: {
  class_id: string;
  student_id: string;
}): Promise<ActionResponse<{ id: string; class_id: string; student_id: string; status: string }>> {
  const c = await getCurrentUserWithRoles();
  if (c?.isImpersonating) {
    return { ok: false, error: 'IMPERSONATION_RESTRICTED: Dilarang mendaftarkan peserta selama sesi impersonasi aktif.' };
  }
  // F5: Hapus SUPER_ADMIN, hanya ACADEMIC_STAFF
  const me = await actor('ACADEMIC_STAFF');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };

  const parsed = z.object({
    class_id: z.string().uuid('ID kelas tidak valid.'),
    student_id: z.string().uuid('ID mahasiswa tidak valid.'),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { class_id, student_id } = parsed.data;
  const demo = isDemoMode();
  const flagActive = isFeatureFlagActive('FF_PERSISTENCE_ACADEMIC');

  // F2: Di non-demo, bila DB offline atau flag mati, tolak tegas tanpa menulis apa pun dan tanpa ok:true
  if (!demo) {
    if (!me.online || !flagActive) {
      return { ok: false, error: 'Fitur ini belum aktif' };
    }
  }

  if (me.online && flagActive) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('enroll_student', {
      p_class_id: class_id,
      p_student_id: student_id,
    });
    if (error) return { ok: false, error: error.message || pesan(error.message) };
    revalidatePath('/staff/classes');
    return { ok: true, data: data as any };
  }

  if (!demo) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  // Fallback demo in-memory (HANYA jika isDemoMode())
  const cls = mem.classes.find((x) => x.id === class_id);
  if (!cls) return { ok: false, error: ERR.NOT_FOUND };
  if (mem.enrollments.some((e) => e.class_id === class_id && e.student_id === student_id)) {
    return { ok: false, error: ERR.ALREADY_ENROLLED };
  }
  if (cls.capacity && mem.enrollments.filter((e) => e.class_id === class_id).length >= cls.capacity) {
    return { ok: false, error: ERR.CLASS_FULL };
  }
  const newEnr = {
    id: randomUUID(),
    class_id,
    student_id,
    student_name: 'Mahasiswa Terdaftar',
    status: 'ACTIVE',
    enrolled_at: new Date().toISOString(),
  };
  mem.enrollments.push(newEnr);
  revalidatePath('/staff/classes');
  return { ok: true, data: newEnr };
}

/**
 * Mutasi Pindah Kelas Paralel Mahasiswa (Hanya Staf Akademik)
 */
export async function transferClassAction(input: {
  source_class_id: string;
  target_class_id: string;
  student_id: string;
  reason?: string;
}): Promise<ActionResponse<boolean>> {
  const c = await getCurrentUserWithRoles();
  if (c?.isImpersonating) {
    return { ok: false, error: 'IMPERSONATION_RESTRICTED: Dilarang memindahkan kelas selama sesi impersonasi aktif.' };
  }
  // F5: Hapus SUPER_ADMIN, hanya ACADEMIC_STAFF
  const me = await actor('ACADEMIC_STAFF');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };

  const parsed = z.object({
    source_class_id: z.string().uuid('ID kelas asal tidak valid.'),
    target_class_id: z.string().uuid('ID kelas tujuan tidak valid.'),
    student_id: z.string().uuid('ID mahasiswa tidak valid.'),
    reason: z.string().trim().max(500).optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { source_class_id, target_class_id, student_id, reason } = parsed.data;

  if (source_class_id === target_class_id) {
    return { ok: false, error: 'Kelas tujuan tidak boleh sama dengan kelas asal.' };
  }

  const demo = isDemoMode();
  const flagActive = isFeatureFlagActive('FF_PERSISTENCE_ACADEMIC');

  // F2: Di non-demo, bila DB offline atau flag mati, tolak tegas tanpa menulis apa pun dan tanpa ok:true
  if (!demo) {
    if (!me.online || !flagActive) {
      return { ok: false, error: 'Fitur ini belum aktif' };
    }
  }

  if (me.online && flagActive) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('transfer_class', {
      p_source_class_id: source_class_id,
      p_target_class_id: target_class_id,
      p_student_id: student_id,
      p_reason: reason ?? '',
    });
    if (error) return { ok: false, error: error.message || pesan(error.message) };
    revalidatePath('/staff/classes');
    return { ok: true, data: true };
  }

  if (!demo) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  // Fallback demo in-memory (HANYA jika isDemoMode())
  const existing = mem.enrollments.find((e) => e.class_id === source_class_id && e.student_id === student_id);
  if (!existing) return { ok: false, error: 'Mahasiswa tidak terdaftar pada kelas asal.' };
  const targetClass = mem.classes.find((x) => x.id === target_class_id);
  if (!targetClass) return { ok: false, error: 'Kelas tujuan tidak ditemukan.' };
  if (targetClass.capacity && mem.enrollments.filter((e) => e.class_id === target_class_id).length >= targetClass.capacity) {
    return { ok: false, error: 'Kapasitas kelas tujuan sudah penuh.' };
  }
  existing.class_id = target_class_id;
  revalidatePath('/staff/classes');
  return { ok: true, data: true };
}

/**
 * Batch Enroll Mahasiswa via CSV (Hanya Staf Akademik)
 */
export async function batchEnrollCsvAction(input: {
  rows: Array<{ student_id: string; class_id: string; nim?: string }>;
}): Promise<ActionResponse<{ total: number; success: number; failed: number; errors?: any[] }>> {
  const c = await getCurrentUserWithRoles();
  if (c?.isImpersonating) {
    return { ok: false, error: 'IMPERSONATION_RESTRICTED: Dilarang mengimpor data CSV selama sesi impersonasi aktif.' };
  }
  // F5: Hapus SUPER_ADMIN, hanya ACADEMIC_STAFF
  const me = await actor('ACADEMIC_STAFF');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };

  if (!input.rows || !Array.isArray(input.rows) || input.rows.length === 0) {
    return { ok: false, error: 'Data baris CSV tidak boleh kosong.' };
  }

  // F7: Validasi batas baris per panggilan <= 1000
  if (input.rows.length > 1000) {
    return { ok: false, error: 'Batas maksimal batch enrollment adalah 1000 baris per panggilan.' };
  }

  const demo = isDemoMode();
  const flagActive = isFeatureFlagActive('FF_PERSISTENCE_ACADEMIC');

  // F2: Di non-demo, bila DB offline atau flag mati, tolak tegas tanpa menulis apa pun dan tanpa ok:true
  if (!demo) {
    if (!me.online || !flagActive) {
      return { ok: false, error: 'Fitur ini belum aktif' };
    }
  }

  if (me.online && flagActive) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('batch_enroll_students', {
      p_rows: input.rows,
    });
    if (error) return { ok: false, error: error.message || pesan(error.message) };
    revalidatePath('/staff/classes');
    return { ok: true, data: data as any };
  }

  if (!demo) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  // Fallback demo in-memory (HANYA jika isDemoMode())
  let successCount = 0;
  for (const r of input.rows) {
    if (r.student_id && r.class_id && !mem.enrollments.some((e) => e.class_id === r.class_id && e.student_id === r.student_id)) {
      mem.enrollments.push({
        class_id: r.class_id,
        student_id: r.student_id,
        student_name: r.nim ? `Mahasiswa NIM ${r.nim}` : 'Mahasiswa Impor CSV',
        enrolled_at: new Date().toISOString(),
      });
      successCount++;
    }
  }
  revalidatePath('/staff/classes');
  return { ok: true, data: { total: input.rows.length, success: successCount, failed: input.rows.length - successCount } };
}

/**
 * Persetujuan Kelas Perkuliahan (Hanya Kaprodi prodi terkait, BUKAN Staf & BUKAN Super Admin)
 */
export async function approveClassAction(input: {
  class_id: string;
  status: 'OPEN' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  reason?: string;
}): Promise<ActionResponse<ClassItem>> {
  const c = await getCurrentUserWithRoles();
  if (c?.isImpersonating) {
    return { ok: false, error: 'IMPERSONATION_RESTRICTED: Dilarang menyetujui kelas selama sesi impersonasi aktif.' };
  }
  // F5 & F6: Hapus SUPER_ADMIN & Staf, hanya PROGRAM_COORDINATOR
  const me = await actor('PROGRAM_COORDINATOR');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };

  const parsed = z.object({
    class_id: z.string().uuid('ID kelas tidak valid.'),
    status: z.enum(['OPEN', 'ACTIVE', 'CLOSED', 'ARCHIVED']),
    reason: z.string().trim().max(500).optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { class_id, status, reason } = parsed.data;
  const demo = isDemoMode();
  const flagActive = isFeatureFlagActive('FF_PERSISTENCE_ACADEMIC');

  // F2: Di non-demo, bila DB offline atau flag mati, tolak tegas tanpa menulis apa pun dan tanpa ok:true
  if (!demo) {
    if (!me.online || !flagActive) {
      return { ok: false, error: 'Fitur ini belum aktif' };
    }
  }

  if (me.online && flagActive) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('approve_class', {
      p_class_id: class_id,
      p_status: status,
      p_reason: reason ?? null,
    });
    if (error) return { ok: false, error: error.message || pesan(error.message) };
    revalidatePath('/coordinator/approvals');
    revalidatePath('/classes');
    return { ok: true, data: data as any };
  }

  if (!demo) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  // Fallback demo in-memory (HANYA jika isDemoMode())
  const cls = mem.classes.find((x) => x.id === class_id);
  if (!cls) return { ok: false, error: ERR.NOT_FOUND };
  cls.status = status;
  revalidatePath('/coordinator/approvals');
  revalidatePath('/classes');
  return { ok: true, data: pub(cls) };
}

/**
 * Penugasan Dosen Pengampu Kelas (Hanya Kaprodi prodi terkait, BUKAN Super Admin)
 */
export async function assignLecturerAction(input: {
  class_id: string;
  lecturer_id: string;
}): Promise<ActionResponse<ClassItem>> {
  const c = await getCurrentUserWithRoles();
  if (c?.isImpersonating) {
    return { ok: false, error: 'IMPERSONATION_RESTRICTED: Dilarang menugaskan dosen selama sesi impersonasi aktif.' };
  }
  // F5: Hapus SUPER_ADMIN, hanya PROGRAM_COORDINATOR
  const me = await actor('PROGRAM_COORDINATOR');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };

  const parsed = z.object({
    class_id: z.string().uuid('ID kelas tidak valid.'),
    lecturer_id: z.string().uuid('ID dosen tidak valid.'),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { class_id, lecturer_id } = parsed.data;
  const demo = isDemoMode();
  const flagActive = isFeatureFlagActive('FF_PERSISTENCE_ACADEMIC');

  // F2: Di non-demo, bila DB offline atau flag mati, tolak tegas tanpa menulis apa pun dan tanpa ok:true
  if (!demo) {
    if (!me.online || !flagActive) {
      return { ok: false, error: 'Fitur ini belum aktif' };
    }
  }

  if (me.online && flagActive) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('assign_lecturer', {
      p_class_id: class_id,
      p_lecturer_id: lecturer_id,
    });
    if (error) return { ok: false, error: error.message || pesan(error.message) };
    revalidatePath('/coordinator/assignments');
    revalidatePath('/classes');
    return { ok: true, data: data as any };
  }

  if (!demo) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  // Fallback demo in-memory (HANYA jika isDemoMode())
  const cls = mem.classes.find((x) => x.id === class_id);
  if (!cls) return { ok: false, error: ERR.NOT_FOUND };
  (cls as any).lecturer_id = lecturer_id;
  revalidatePath('/coordinator/assignments');
  revalidatePath('/classes');
  return { ok: true, data: pub(cls) };
}

/**
 * Jalur Pengajuan Kelas Baru (Staf Akademik / Dosen) -> Status DRAFT (F6)
 */
export async function proposeClassAction(input: {
  title: string;
  section?: string;
  course_id?: string;
  semester_id?: string;
  capacity?: number;
}): Promise<ActionResponse<ClassItem>> {
  const c = await getCurrentUserWithRoles();
  if (c?.isImpersonating) {
    return { ok: false, error: 'IMPERSONATION_RESTRICTED: Dilarang mengajukan kelas selama sesi impersonasi aktif.' };
  }
  const me = await actor(['ACADEMIC_STAFF', 'LECTURER']);
  if (!me) return { ok: false, error: ERR.FORBIDDEN };

  const parsed = z.object({
    title: z.string().trim().min(3).max(120),
    section: z.string().trim().min(1).max(20).default('A'),
    course_id: z.string().uuid().optional(),
    semester_id: z.string().uuid().optional(),
    capacity: z.number().int().positive().optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { title, section, course_id, semester_id, capacity } = parsed.data;
  const demo = isDemoMode();
  const flagActive = isFeatureFlagActive('FF_PERSISTENCE_ACADEMIC');

  if (!demo) {
    if (!me.online || !flagActive) {
      return { ok: false, error: 'Fitur ini belum aktif' };
    }
  }

  if (me.online && flagActive) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('propose_class', {
      p_title: title,
      p_section: section,
      p_course_id: course_id ?? null,
      p_semester_id: semester_id ?? null,
      p_capacity: capacity ?? null,
    });
    if (error) return { ok: false, error: error.message || pesan(error.message) };
    revalidatePath('/classes');
    revalidatePath('/staff/classes');
    return { ok: true, data: data as any };
  }

  if (!demo) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  // Fallback demo in-memory
  const join_code = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  const row: Row = {
    id: randomUUID(),
    title,
    section,
    join_code,
    status: 'DRAFT',
    created_by: me.id,
    capacity,
    meta: metaOf(course_id, semester_id),
  };
  mem.classes.push(row);
  revalidatePath('/classes');
  revalidatePath('/staff/classes');
  return { ok: true, data: pub(row) };
}

// =========================================================================
// DYNAMIC SIDEBAR MENU BADGES (Notifikasi, Antrean Koreksi TA, Review Dosen, Persetujuan Prodi)
// =========================================================================
export interface DynamicMenuBadgesResult {
  unreadCount: number;
  taGradingCount: number;
  lecturerReviewCount: number;
  coordinatorApprovalsCount: number;
}

export async function getDynamicMenuBadgesAction(): Promise<DynamicMenuBadgesResult> {
  const c = await getCurrentUserWithRoles();
  if (!c) {
    return { unreadCount: 0, taGradingCount: 0, lecturerReviewCount: 0, coordinatorApprovalsCount: 0 };
  }

  const unreadCount = await countUnreadAction();
  const role = c.activeRole || 'STUDENT';
  let taGradingCount = 0;
  let lecturerReviewCount = 0;
  let coordinatorApprovalsCount = 0;

  const online = await checkSupabaseOnline();

  if (online) {
    const supabase = await createClient();
    if (role === 'TEACHING_ASSISTANT') {
      const { data: subs } = await supabase
        .from('submissions')
        .select('id,assignment_id,student_id')
        .limit(100);
      const { data: graded } = await supabase
        .from('grades')
        .select('assignment_id,student_id')
        .limit(100);
      const gradedSet = new Set((graded ?? []).map((g: any) => `${g.assignment_id}:${g.student_id}`));
      taGradingCount = (subs ?? []).filter((s: any) => !gradedSet.has(`${s.assignment_id}:${s.student_id}`)).length;
    }

    if (role === 'LECTURER' || role === 'PROGRAM_COORDINATOR') {
      const [{ count: disputeCount }, { count: permitCount }] = await Promise.all([
        supabase.from('exam_disputes').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('leave_permits').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
      ]);
      lecturerReviewCount = (disputeCount ?? 0) + (permitCount ?? 0);
    }

    if (role === 'PROGRAM_COORDINATOR') {
      const [{ count: crCount }, { count: draftClassCount }] = await Promise.all([
        supabase.from('grade_change_requests').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('status', 'DRAFT'),
      ]);
      coordinatorApprovalsCount = (crCount ?? 0) + (draftClassCount ?? 0);
    }
  } else {
    // In-memory badge calculation
    if (role === 'TEACHING_ASSISTANT') {
      const taClassIds = asisten
        .filter((a) => a.user_id === c.user.id && a.perms.includes('ASSIGNMENT_GRADE'))
        .map((a) => a.class_id);
      const taAssignIds = tugas.assignments
        .filter((a) => taClassIds.includes(a.class_id))
        .map((a) => a.id);
      taGradingCount = tugas.submissions.filter(
        (s) => taAssignIds.includes(s.assignment_id) && !demoGrade(s.assignment_id, s.student_id)
      ).length;
    }

    if (role === 'LECTURER' || role === 'PROGRAM_COORDINATOR') {
      const myClassIds = mem.classes.filter((cls) => cls.created_by === c.user.id).map((cls) => cls.id);
      const myAssignIds = tugas.assignments.filter((a) => myClassIds.includes(a.class_id)).map((a) => a.id);
      const ungradedSubs = tugas.submissions.filter(
        (s) => myAssignIds.includes(s.assignment_id) && !demoGrade(s.assignment_id, s.student_id)
      ).length;
      const pendingDisputes = ((globalThis as any).__siajarDisputes ?? []).filter(
        (d: any) => d.status === 'PENDING'
      ).length;
      lecturerReviewCount = ungradedSubs + pendingDisputes;
    }

    if (role === 'PROGRAM_COORDINATOR') {
      const pendingCr = perubahan.filter((p) => p.status === 'PENDING').length;
      const draftCls = mem.classes.filter((cls) => cls.status === 'DRAFT').length;
      coordinatorApprovalsCount = pendingCr + draftCls;
    }
  }

  return {
    unreadCount,
    taGradingCount,
    lecturerReviewCount,
    coordinatorApprovalsCount,
  };
}

// =========================================================================
// DOMAIN 7: LIBRARY CATALOG & DIGITAL REPOSITORY (FF_PERSISTENCE_CONTENT)
// =========================================================================
export interface LibraryBookItem {
  id: string;
  title: string;
  author: string;
  category: string;
  year: string;
  pages: number;
  badge: string;
  fileSize?: string;
}

const DEFAULT_LIBRARY_BOOKS: LibraryBookItem[] = [
  {
    id: 'lib-1',
    title: 'Clean Architecture: A Craftsman’s Guide to Software Structure',
    author: 'Robert C. Martin',
    category: 'Rekayasa Perangkat Lunak',
    year: '2023',
    pages: 432,
    badge: 'Buku Utama',
  },
  {
    id: 'lib-2',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: 'Basis Data Terdistribusi',
    year: '2022',
    pages: 616,
    badge: 'Buku Rujukan',
  },
  {
    id: 'lib-3',
    title: 'Artificial Intelligence: A Modern Approach (4th Ed)',
    author: 'Stuart Russell & Peter Norvig',
    category: 'Kecerdasan Buatan',
    year: '2024',
    pages: 1152,
    badge: 'Referensi Standar',
  },
  {
    id: 'lib-4',
    title: 'Fullstack Next.js 14 & Supabase Architecture',
    author: 'Tim Dosen Pemrograman Web',
    category: 'Modul Kuliah',
    year: '2026',
    pages: 198,
    badge: 'Modul Internal',
  },
  {
    id: 'lib-5',
    title: 'Computer Networking: A Top-Down Approach (8th Ed)',
    author: 'James Kurose & Keith Ross',
    category: 'Jaringan Komputer',
    year: '2023',
    pages: 864,
    badge: 'Buku Utama',
  },
  {
    id: 'lib-6',
    title: 'Introduction to Algorithms (CLRS 4th Ed)',
    author: 'Thomas H. Cormen et al.',
    category: 'Struktur Data & Algoritma',
    year: '2022',
    pages: 1312,
    badge: 'Referensi Standar',
  },
];

const libraryCatalogStore: LibraryBookItem[] = ((globalThis as any).__siajarLibraryCatalog ??= [
  ...DEFAULT_LIBRARY_BOOKS,
]);

export async function listLibraryCatalogAction(): Promise<LibraryBookItem[]> {
  const online = await checkSupabaseOnline();
  const flagActive = isFeatureFlagActive('FF_PERSISTENCE_CONTENT');

  if (online && flagActive) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('library_items')
      .select('id, title, author, category, published_year, total_copies, file_size_bytes')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        author: row.author,
        category: row.category,
        year: String(row.published_year ?? 2026),
        pages: (row.total_copies ?? 1) * 120,
        badge: row.category === 'Modul Kuliah' ? 'Modul Internal' : 'Buku Rujukan',
        fileSize: row.file_size_bytes ? `${(Number(row.file_size_bytes) / (1024 * 1024)).toFixed(1)} MB` : undefined,
      }));
    }
  }

  return libraryCatalogStore;
}

export async function createLibraryItemAction(input: {
  title: string;
  author: string;
  category: string;
  year: string;
  pages: number;
  badge: string;
  fileSize?: string;
}): Promise<ActionResponse<LibraryBookItem>> {
  const me = await actor(['LECTURER', 'ACADEMIC_STAFF', 'PROGRAM_COORDINATOR']);
  if (!me) return { ok: false, error: ERR.FORBIDDEN };

  const title = input.title.trim();
  const author = input.author.trim();
  if (!title || !author) {
    return { ok: false, error: 'Judul dan penulis pustaka wajib diisi.' };
  }

  const demo = isDemoMode();
  const flagActive = isFeatureFlagActive('FF_PERSISTENCE_CONTENT');

  if (!demo && (!me.online || !flagActive)) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  const newBook: LibraryBookItem = {
    id: randomUUID(),
    title,
    author,
    category: input.category || 'Modul Kuliah',
    year: input.year || '2026',
    pages: Number(input.pages) || 120,
    badge: input.badge || 'Modul Internal',
    fileSize: input.fileSize,
  };

  if (me.online && flagActive) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('library_items')
      .insert({
        title: newBook.title,
        author: newBook.author,
        category: newBook.category,
        published_year: parseInt(newBook.year, 10) || 2026,
        uploaded_by: me.id,
      })
      .select('id')
      .single();

    if (error) {
      return { ok: false, error: error.message || 'Gagal mengunggah pustaka ke database.' };
    }
    if (data?.id) {
      newBook.id = data.id;
    }
  }

  libraryCatalogStore.unshift(newBook);
  revalidatePath('/library');
  return { ok: true, data: newBook };
}

// =========================================================================
// DOMAIN 3: GRADEBOOK COMPONENTS, LOCKS & FINAL GRADES (FF_PERSISTENCE_GRADES)
// =========================================================================
export async function saveGradeComponentsAction(input: {
  classId: string;
  components: { name: string; weightPct: number; sortOrder?: number }[];
}): Promise<ActionResponse> {
  const me = await actor(['LECTURER', 'PROGRAM_COORDINATOR']);
  if (!me) return { ok: false, error: ERR.FORBIDDEN };

  const totalWeight = input.components.reduce((acc, c) => acc + c.weightPct, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    return { ok: false, error: 'Total bobot komponen penilaian wajib tepat 100%.' };
  }

  const demo = isDemoMode();
  const flagActive = isFeatureFlagActive('FF_PERSISTENCE_GRADES');

  if (!demo && (!me.online || !flagActive)) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  if (me.online && flagActive) {
    const supabase = await createClient();
    const rows = input.components.map((comp, idx) => ({
      class_id: input.classId,
      name: comp.name.trim(),
      weight_pct: comp.weightPct,
      sort_order: comp.sortOrder ?? idx + 1,
    }));
    const { error } = await supabase
      .from('grade_components')
      .upsert(rows, { onConflict: 'class_id,name' });

    if (error) {
      return { ok: false, error: error.message || 'Gagal menyimpan komponen nilai.' };
    }
  }

  revalidatePath('/grades');
  revalidatePath('/lecturer/gradebook');
  return { ok: true };
}

export async function lockClassGradebookAction(input: {
  classId: string;
  locked: boolean;
  reason?: string;
}): Promise<ActionResponse> {
  const me = await actor(['LECTURER', 'ACADEMIC_STAFF', 'PROGRAM_COORDINATOR']);
  if (!me) return { ok: false, error: ERR.FORBIDDEN };

  const demo = isDemoMode();
  const flagActive = isFeatureFlagActive('FF_PERSISTENCE_GRADES');

  if (!demo && (!me.online || !flagActive)) {
    return { ok: false, error: 'Fitur ini belum aktif' };
  }

  if (me.online && flagActive) {
    const supabase = await createClient();
    const { error } = await supabase.from('gradebook_locks').upsert({
      class_id: input.classId,
      is_locked: input.locked,
      locked_by: me.id,
      locked_at: new Date().toISOString(),
      lock_reason: input.reason ?? 'Finalisasi nilai akhir semester',
    });
    if (error) {
      return { ok: false, error: error.message || 'Gagal mengubah status kunci buku nilai.' };
    }
  }

  revalidatePath('/grades');
  revalidatePath('/lecturer/gradebook');
  revalidatePath('/staff/grades/locks');
  return { ok: true };
}



