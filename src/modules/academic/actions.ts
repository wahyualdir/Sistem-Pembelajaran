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

export interface ClassItem {
  id: string;
  title: string;
  section: string;
  join_code: string;
  status: string;
  members?: number;
  meta?: string;
}

type Row = ClassItem & { created_by: string; capacity?: number };
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const createSchema = z.object({
  title: z.string().trim().min(3, 'Nama mata kuliah minimal 3 karakter.').max(120),
  section: z.string().trim().min(1, 'Isi nama kelas, misalnya A.').max(20),
  capacity: z.coerce.number().int().min(1, 'Kapasitas minimal 1.').max(500).optional(),
  course_id: z.string().uuid().optional(),
  semester_id: z.string().uuid().optional(),
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
const pub = (x: Row): ClassItem => ({ id: x.id, title: x.title, section: x.section, join_code: x.join_code, status: x.status, meta: x.meta });

// Cadangan memori saat Supabase tidak aktif (mode demo), setara pola perangkat pada modul identity.
const DEMO_CLASS_ID = 'c0000000-0000-0000-0000-000000000001';
const DEMO_CLASS_ID_2 = 'c0000000-0000-0000-0000-000000000002';
const DEMO_CLASS_ID_3 = 'c0000000-0000-0000-0000-000000000003';

const mem: { classes: Row[]; enrollments: { class_id: string; student_id: string; student_name?: string; enrolled_at?: string }[] } =
  ((globalThis as any).__siajarAkademik ??= { classes: [], enrollments: [] });

if (!mem.classes.some((c) => c.id === DEMO_CLASS_ID)) {
  mem.classes.push({
    id: DEMO_CLASS_ID,
    title: 'Pemrograman Web & Arsitektur Cloud',
    section: 'IF-3A',
    join_code: 'WEB2026A',
    status: 'OPEN',
    created_by: 'a0000002-0000-0000-0000-000000000002', // Dr. Budi Santoso
    capacity: 45,
    meta: 'IF-301, Semester Ganjil 2026/2027',
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
    capacity: 40,
    meta: 'IF-202, Semester Ganjil 2026/2027',
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
    capacity: 42,
    meta: 'IF-305, Semester Ganjil 2026/2027',
  });
}

if (!mem.enrollments.some((e) => e.class_id === DEMO_CLASS_ID)) {
  mem.enrollments.push(
    { class_id: DEMO_CLASS_ID, student_id: 'a0000001-0000-0000-0000-000000000001', student_name: 'Ahmad Mahasiswa', enrolled_at: new Date(Date.now() - 86400000 * 7).toISOString() },
    { class_id: DEMO_CLASS_ID, student_id: 'a0000003-0000-0000-0000-000000000003', student_name: 'Citra Asisten', enrolled_at: new Date(Date.now() - 86400000 * 7).toISOString() },
    { class_id: DEMO_CLASS_ID, student_id: 'mhs-1', student_name: 'Ahmad Mahasiswa', enrolled_at: new Date(Date.now() - 86400000 * 7).toISOString() }
  );
}

if (!mem.enrollments.some((e) => e.class_id === DEMO_CLASS_ID_2)) {
  mem.enrollments.push(
    { class_id: DEMO_CLASS_ID_2, student_id: 'a0000001-0000-0000-0000-000000000001', student_name: 'Ahmad Mahasiswa', enrolled_at: new Date(Date.now() - 86400000 * 5).toISOString() },
    { class_id: DEMO_CLASS_ID_2, student_id: 'mhs-1', student_name: 'Ahmad Mahasiswa', enrolled_at: new Date(Date.now() - 86400000 * 5).toISOString() }
  );
}

if (!mem.enrollments.some((e) => e.class_id === DEMO_CLASS_ID_3)) {
  mem.enrollments.push(
    { class_id: DEMO_CLASS_ID_3, student_id: 'a0000001-0000-0000-0000-000000000001', student_name: 'Ahmad Mahasiswa', enrolled_at: new Date(Date.now() - 86400000 * 3).toISOString() },
    { class_id: DEMO_CLASS_ID_3, student_id: 'mhs-1', student_name: 'Ahmad Mahasiswa', enrolled_at: new Date(Date.now() - 86400000 * 3).toISOString() }
  );
}

async function actor(role: string | string[]) {
  const c = await getCurrentUserWithRoles();
  const roles = Array.isArray(role) ? role : [role];
  if (!c || !roles.includes(c.activeRole ?? '')) return null;
  return { id: c.user.id, name: c.profile?.full_name ?? 'Mahasiswa', online: await checkSupabaseOnline(), isImpersonating: c.isImpersonating };
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
    const row: Row = { id: randomUUID(), title, section, join_code, status: 'OPEN', created_by: me.id, capacity, meta: metaOf(course_id, semester_id) };
    mem.classes.push(row);
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
  if (!c) return [];
  const isAdminOrStaff =
    c.activeRole === 'SUPER_ADMIN' ||
    c.activeRole === 'SYSTEM_ADMIN' ||
    c.activeRole === 'PROGRAM_COORDINATOR' ||
    c.activeRole === 'ACADEMIC_STAFF';
  const lecturer = c.activeRole === 'LECTURER' || c.activeRole === 'TEACHING_ASSISTANT';

  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    if (lecturer || isAdminOrStaff) {
      const { data } = await supabase
        .from('classes')
        .select('id,title,section,join_code,status,enrollments(count)')
        .order('created_at', { ascending: false });
      return (data ?? []).map((r: any) => ({ ...r, enrollments: undefined, members: r.enrollments?.[0]?.count ?? 0 }));
    }
    const { data } = await supabase
      .from('enrollments')
      .select('classes(id,title,section,join_code,status)')
      .eq('status', 'ACTIVE')
      .order('enrolled_at', { ascending: false });
    return (data ?? []).map((r: any) => r.classes).filter(Boolean);
  }

  if (isAdminOrStaff) {
    return mem.classes.map((x) => ({ ...pub(x), members: mem.enrollments.filter((e) => e.class_id === x.id).length }));
  }

  if (lecturer) {
    return mem.classes
      .filter((x) => x.created_by === c.user.id || demoPerms(x.id, c.user.id) !== null || x.id.startsWith('c0000000-0000-0000-0000-'))
      .map((x) => ({ ...pub(x), members: mem.enrollments.filter((e) => e.class_id === x.id).length }));
  }
  return mem.classes
    .filter((x) => mem.enrollments.some((e) => e.class_id === x.id && e.student_id === c.user.id) || x.id.startsWith('c0000000-0000-0000-0000-'))
    .map((x) => ({ ...pub(x), members: mem.enrollments.filter((e) => e.class_id === x.id).length }));
}

// ---------- Tugas dan pengumpulan (Bagian 13, langkah 3-4) ----------
export interface AssignmentItem {
  id: string;
  class_id: string;
  title: string;
  description: string;
  due_at: string;
  close_at: string;
  submissions?: number;
  mine?: { text_body: string; is_late: boolean; submitted_at: string; grade?: GradeInfo | null } | null;
}
export interface MaterialItem { id: string; title: string; body_md: string; created_at: string }
export interface MemberItem { student_id: string; name: string; enrolled_at: string }
export interface ClassDetail {
  cls: ClassItem;
  assignments: AssignmentItem[];
  materials: MaterialItem[];
  announcements: AnnouncementItem[];
  members?: MemberItem[];
  viewer: 'LECTURER' | 'TA' | 'STUDENT';
  assistants?: AssistantItem[];
  perms?: string[];
  discussions: DiscussionItem[];
}

type SubRow = { id: string; student_name: string; assignment_id: string; student_id: string; text_body: string; is_late: boolean; submitted_at: string };
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
  });
}

const assignmentSchema = z
  .object({
    class_id: z.string().uuid(),
    title: z.string().trim().min(3, 'Judul tugas minimal 3 karakter.').max(160),
    description: z.string().trim().max(5000).optional(),
    due_at: z.string().datetime({ offset: true, message: 'Isi tenggat pengumpulan.' }),
    close_at: z.string().datetime({ offset: true, message: 'Isi batas akhir pengumpulan.' }),
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
    item = data as AssignmentItem;
  } else {
    if (mem.classes.find((x) => x.id === v.class_id)?.created_by !== me.id) return { ok: false, error: ERR.FORBIDDEN };
    item = { id: randomUUID(), class_id: v.class_id, title: v.title, description: v.description ?? '', due_at: v.due_at, close_at: v.close_at };
    tugas.assignments.push(item);
    mem.enrollments.filter((e) => e.class_id === v.class_id).forEach((e) => notify(e.student_id, 'ASSIGNMENT_NEW', `Tugas baru: ${v.title}`, 'Buka kelas untuk melihat petunjuk dan tenggat.', v.class_id));
  }
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

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('submit_assignment', { p_assignment: id, p_text: body });
    if (error) return { ok: false, error: pesan(error.message) };
  } else {
    const a = tugas.assignments.find((x) => x.id === id);
    if (!a || !mem.enrollments.some((e) => e.class_id === a.class_id && e.student_id === me.id))
      return { ok: false, error: ERR.NOT_FOUND };
    const now = Date.now();
    if (now > Date.parse(a.close_at)) return { ok: false, error: ERR.CLOSED };
    if (tugas.submissions.some((x) => x.assignment_id === id && x.student_id === me.id))
      return { ok: false, error: ERR.ALREADY_SUBMITTED };
    tugas.submissions.push({ id: randomUUID(), student_name: me.name, assignment_id: id, student_id: me.id, text_body: body, is_late: now > Date.parse(a.due_at), submitted_at: new Date(now).toISOString() });
  }
  revalidatePath('/classes/[id]', 'page');
  return { ok: true };
}

// Mengembalikan null bila kelas tidak ada atau di luar akses (halaman menampilkan 404, bukan 403).
export async function getClassDetailAction(id: string): Promise<ClassDetail | null> {
  const c = await getCurrentUserWithRoles();
  if (!c || !z.string().uuid().safeParse(id).success) return null;
  const isAdminOrStaff =
    c.activeRole === 'SUPER_ADMIN' ||
    c.activeRole === 'SYSTEM_ADMIN' ||
    c.activeRole === 'PROGRAM_COORDINATOR' ||
    c.activeRole === 'ACADEMIC_STAFF';
  const lecturer = c.activeRole === 'LECTURER';
  const ta = c.activeRole === 'TEACHING_ASSISTANT';

  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const { data: cls } = await supabase.from('classes').select('id,title,section,join_code,status,courses(code),semesters(label)').eq('id', id).maybeSingle();
    if (!cls) return null;
    const { data: rows } = await supabase
      .from('assignments')
      .select('id,class_id,title,description,due_at,close_at,submissions(count)')
      .eq('class_id', id)
      .order('due_at');
    const { data: mats } = await supabase.from('materials').select('id,title,body_md,created_at').eq('class_id', id).order('created_at', { ascending: false });
    const { data: ann } = await supabase.from('announcements').select('id,title,body,created_at').eq('class_id', id).order('created_at', { ascending: false }).limit(20);
    let members: MemberItem[] | undefined;
    if (lecturer || isAdminOrStaff) {
      const { data: enr } = await supabase.from('enrollments').select('student_id,enrolled_at,profiles(full_name)').eq('class_id', id).eq('status', 'ACTIVE').order('enrolled_at');
      members = (enr ?? []).map((e: any) => ({ student_id: e.student_id, name: e.profiles?.full_name ?? 'Mahasiswa', enrolled_at: e.enrolled_at }));
    }
    const { data: dis } = await supabase.from('discussions').select('id,title,author_name,created_at,is_pinned,is_locked,discussion_replies(count)').eq('class_id', id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    let assistants: AssistantItem[] | undefined;
    let perms: string[] | undefined;
    const { data: ca } = await supabase.from('class_assistants').select('user_id,permission,profiles(full_name,email)').eq('class_id', id);
    const isActualTa = ta && (ca ?? []).some((x: any) => x.user_id === c.user.id);
    const viewer = lecturer || isAdminOrStaff ? 'LECTURER' : isActualTa ? 'TA' : 'STUDENT';

    if (lecturer || isActualTa || isAdminOrStaff) {
      if (isActualTa) perms = (ca ?? []).filter((x: any) => x.user_id === c.user.id).map((x: any) => x.permission);
      else if (isAdminOrStaff) perms = [...DELEGABLE_CODES];
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
      cls: { ...(cls as any), courses: undefined, semesters: undefined, meta: [(cls as any).courses?.code, (cls as any).semesters?.label].filter(Boolean).join(', ') || undefined } as ClassItem,
      materials: (mats ?? []) as MaterialItem[],
      announcements: (ann ?? []) as AnnouncementItem[],
      members,
      viewer,
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

  const row = mem.classes.find((x) => x.id === id);
  if (!row) return null;

  const isDemoClass = id === DEMO_CLASS_ID;
  const isActualTa = ta && (demoPerms(id, c.user.id) !== null);
  const isStudentEnrolled = mem.enrollments.some((e) => e.class_id === id && e.student_id === c.user.id);

  if (isDemoClass && !lecturer && !isActualTa && !isAdminOrStaff && !isStudentEnrolled) {
    mem.enrollments.push({
      class_id: id,
      student_id: c.user.id,
      student_name: c.profile?.full_name ?? 'Mahasiswa SIAJAR',
      enrolled_at: new Date().toISOString(),
    });
  }

  const allowed =
    isAdminOrStaff ||
    (isDemoClass
      ? true
      : lecturer
        ? row.created_by === c.user.id
        : isActualTa
          ? true
          : isStudentEnrolled);
  if (!allowed) return null;

  const viewer = lecturer || isAdminOrStaff ? 'LECTURER' : isActualTa ? 'TA' : 'STUDENT';

  return {
    cls: pub(row),
    viewer,
    discussions: demoDiscussions(id, lecturer || isAdminOrStaff),
    perms: isActualTa ? demoPerms(id, c.user.id) ?? [] : (isAdminOrStaff ? [...DELEGABLE_CODES] : undefined),
    assistants: lecturer || isAdminOrStaff ? asisten.filter((x) => x.class_id === id).map((x) => ({ user_id: x.user_id, name: x.name, email: x.email, permissions: x.perms })) : undefined,
    announcements: pengumuman.filter((a) => a.class_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    materials: bahan.filter((m) => m.class_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    members: mem.enrollments.filter((e) => e.class_id === id).map((e) => ({ student_id: e.student_id, name: e.student_name ?? 'Mahasiswa', enrolled_at: e.enrolled_at ?? '' })),
    assignments: tugas.assignments
      .filter((a) => a.class_id === id)
      .sort((a, b) => a.due_at.localeCompare(b.due_at))
      .map((a) => ({
        ...a,
        submissions: lecturer || isActualTa || isAdminOrStaff ? tugas.submissions.filter((x) => x.assignment_id === a.id).length : undefined,
        mine: lecturer || isActualTa || isAdminOrStaff ? null : demoMine(a.id, c.user.id),
      })),
  };
}

// ---------- Review dan penilaian (Bagian 13, langkah 5-6) ----------
export interface GradeInfo { score: number; max_score: number; comment: string; status: 'DRAFT' | 'FINAL' }
export interface SubmissionItem { id: string; student_name: string; text_body: string; is_late: boolean; submitted_at: string; grade: GradeInfo | null; change?: { status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED'; proposed_score: number; reason: string; review_note: string | null } | null }
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

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('save_grade_draft', { p_submission: sid, p_score: score, p_comment: comment });
    if (error) return { ok: false, error: pesan(error.message) };
  } else {
    const o = demoOwned(sid, me.id, 'assignment.grade');
    if (!o) return { ok: false, error: ERR.FORBIDDEN };
    if (o.s.student_id === me.id) return { ok: false, error: ERR.SELF_REVIEW };
    const n = demoGrade(o.a.id, o.s.student_id);
    if (n?.status === 'FINAL') return { ok: false, error: ERR.GRADE_FINAL };
    if (n) Object.assign(n, { score, comment });
    else notas.push({ assignment_id: o.a.id, student_id: o.s.student_id, score, comment, status: 'DRAFT' });
  }
  revalidatePath('/classes/[id]/assignments/[aid]', 'page');
  return { ok: true };
}

export async function finalizeGradeAction(submissionId: string): Promise<ActionResponse> {
  if (!z.string().uuid().safeParse(submissionId).success) return { ok: false, error: ERR.NOT_FOUND };
  const me = await actor('LECTURER');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('finalize_grade', { p_submission: submissionId });
    if (error) return { ok: false, error: pesan(error.message) };
  } else {
    const o = demoOwned(submissionId, me.id);
    const n = o && demoGrade(o.a.id, o.s.student_id);
    if (!o) return { ok: false, error: ERR.NOT_FOUND };
    if (!n || n.status !== 'DRAFT') return { ok: false, error: ERR.NO_DRAFT };
    n.status = 'FINAL';
    notify(o.s.student_id, 'GRADE_PUBLISHED', `Nilai terbit: ${o.a.title}`, 'Nilai dan feedback dapat dilihat di kelas.', o.a.class_id);
  }
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
    const { data: subs } = await supabase.from('submissions').select('id,student_id,text_body,is_late,submitted_at,profiles(full_name)').eq('assignment_id', aid).order('submitted_at');
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
          id: s.id, student_name: s.profiles?.full_name ?? 'Mahasiswa', text_body: s.text_body, is_late: s.is_late, submitted_at: s.submitted_at,
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
      .map((s) => ({ id: s.id, student_name: s.student_name, text_body: s.text_body, is_late: s.is_late, submitted_at: s.submitted_at, grade: toInfo(demoGrade(aid, s.student_id)), change: [...perubahan].reverse().find((x) => x.submission_id === s.id) ?? null })),
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
});

export async function createMaterialAction(input: unknown): Promise<ActionResponse> {
  const p = materialSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const me = await actor('LECTURER');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const { class_id, title, body = '' } = p.data;

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('create_material', { p_class: class_id, p_title: title, p_body: body });
    if (error) return { ok: false, error: pesan(error.message) };
  } else {
    if (mem.classes.find((x) => x.id === class_id)?.created_by !== me.id) return { ok: false, error: ERR.FORBIDDEN };
    bahan.push({ id: randomUUID(), class_id, title, body_md: body, created_at: new Date().toISOString() });
    mem.enrollments.filter((e) => e.class_id === class_id).forEach((e) => notify(e.student_id, 'MATERIAL_NEW', `Materi baru: ${title}`, 'Buka kelas untuk membacanya.', class_id));
  }
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

function metaOf(courseId?: string, semesterId?: string) {
  const c = mdata.course.find((x) => x.id === courseId)?.code;
  const s = mdata.semester.find((x) => x.id === semesterId)?.label;
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
    return {
      programs: (pr.data ?? []) as ProgramItem[],
      semesters: (se.data ?? []) as SemesterItem[],
      courses: (co.data ?? []).map((x: any) => ({ ...x, programs: undefined, program_code: x.programs?.code ?? '' })),
    };
  }
  return {
    programs: mdata.program,
    semesters: mdata.semester,
    courses: mdata.course.map((x) => ({ ...x, program_code: mdata.program.find((q) => q.id === x.program_id)?.code ?? '' })),
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
export interface AssistantItem { user_id: string; name: string; email: string; permissions: string[] }
type DemoAsisten = { class_id: string; user_id: string; name: string; email: string; perms: string[] };
const asisten: DemoAsisten[] = ((globalThis as any).__siajarAsdos ??= []);

if (!asisten.some((x) => x.class_id === DEMO_CLASS_ID)) {
  asisten.push({
    class_id: DEMO_CLASS_ID,
    user_id: 'a0000003-0000-0000-0000-000000000003',
    name: 'Citra Asisten',
    email: 'asdos@siajar.ac.id',
    perms: ['ASSIGNMENT_CREATE', 'ASSIGNMENT_GRADE', 'MATERIAL_CREATE'],
  });
}
// null berarti pengguna bukan asisten kelas tersebut
const demoPerms = (classId: string, uid: string) => asisten.find((x) => x.class_id === classId && x.user_id === uid)?.perms ?? null;

function groupAssistants(rows: any[]): AssistantItem[] {
  const by = new Map<string, AssistantItem>();
  for (const r of rows) {
    const cur: AssistantItem = by.get(r.user_id) ?? { user_id: r.user_id, name: r.profiles?.full_name ?? 'Pengguna', email: r.profiles?.email ?? '', permissions: [] };
    cur.permissions.push(r.permission);
    by.set(r.user_id, cur);
  }
  return [...by.values()];
}

const assistantSchema = z.object({
  class_id: z.string().uuid(),
  identifier: z.string().trim().min(3, 'Isi email atau NIM asisten.').max(120),
  permissions: z.array(z.enum(DELEGABLE_CODES)).max(DELEGABLE_CODES.length),
});

// Daftar izin kosong mencabut penugasan asisten.
export async function setAssistantAction(input: unknown): Promise<ActionResponse> {
  const p = assistantSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const me = await actor('LECTURER');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const { class_id, identifier, permissions } = p.data;

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('set_assistant', { p_class: class_id, p_identifier: identifier, p_permissions: permissions });
    if (error) return { ok: false, error: pesan(error.message) };
  } else {
    if (mem.classes.find((x) => x.id === class_id)?.created_by !== me.id) return { ok: false, error: ERR.FORBIDDEN };
    const key = identifier.toLowerCase();
    const u = Object.values(SYNTHETIC_DEMO_USERS).find((x) => x.email.toLowerCase() === key) ?? SYNTHETIC_DEMO_USERS[identifier];
    if (!u) return { ok: false, error: ERR.USER_NOT_FOUND };
    if (u.id === me.id) return { ok: false, error: ERR.INVALID_ASSISTANT };
    const rest = asisten.filter((x) => !(x.class_id === class_id && x.user_id === u.id));
    asisten.length = 0;
    asisten.push(...rest);
    if (permissions.length) asisten.push({ class_id, user_id: u.id, name: u.name, email: u.email, perms: [...new Set<string>(permissions)] });
  }
  revalidatePath('/classes/[id]', 'page');
  return { ok: true };
}

// ---------- Diskusi kelas (Bagian 5.1) ----------
export interface DiscussionItem { id: string; title: string; author_name: string; created_at: string; reply_count: number; is_pinned: boolean; is_locked: boolean }
export interface ReplyItem { id: string; author_name: string; body: string; created_at: string; is_hidden: boolean }
export interface DiscussionThread {
  class_id: string; class_title: string; discussion: DiscussionItem & { body: string }; replies: ReplyItem[]; viewer: 'LECTURER' | 'TA' | 'STUDENT';
}
type DemoDiscussion = DiscussionItem & { class_id: string; author_id: string; body: string };
type DemoReply = ReplyItem & { discussion_id: string; class_id: string; author_id: string };
const diskusi: DemoDiscussion[] = ((globalThis as any).__siajarDiskusi ??= []);
const balasan: DemoReply[] = ((globalThis as any).__siajarBalasan ??= []);

if (!diskusi.some((d) => d.class_id === DEMO_CLASS_ID)) {
  diskusi.push({
    id: 'dis-demo-001',
    class_id: DEMO_CLASS_ID,
    author_id: 'a0000002-0000-0000-0000-000000000002',
    author_name: 'Dr. Budi Santoso, M.Kom.',
    title: 'Ruang Diskusi & Tanya Jawab: Proyek Akhir & Modul 1',
    body: 'Silakan ajukan pertanyaan seputar materi arsitektur cloud dan ketentuan proyek akhir semester di thread ini.',
    is_pinned: true,
    is_locked: false,
    reply_count: 0,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  });
}
const MEMBERS = ['STUDENT', 'LECTURER', 'TEACHING_ASSISTANT'];

// Mode demo: anggota kelas = mahasiswa terdaftar, dosen pemilik, atau asisten.
function demoMember(classId: string, uid: string) {
  return mem.enrollments.some((e) => e.class_id === classId && e.student_id === uid) || mem.classes.find((x) => x.id === classId)?.created_by === uid || demoPerms(classId, uid) !== null;
}
function demoDiscussions(classId: string, lecturer: boolean): DiscussionItem[] {
  return diskusi
    .filter((d) => d.class_id === classId)
    .map((d) => ({ id: d.id, title: d.title, author_name: d.author_name, created_at: d.created_at, is_pinned: d.is_pinned, is_locked: d.is_locked, reply_count: balasan.filter((r) => r.discussion_id === d.id && (lecturer || !r.is_hidden)).length }))
    .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || b.created_at.localeCompare(a.created_at));
}

const discussionSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().trim().min(3, 'Judul diskusi minimal 3 karakter.').max(200),
  body: z.string().trim().min(1, 'Isi diskusi tidak boleh kosong.').max(5000),
});
const replySchema = z.object({ discussion_id: z.string().uuid(), body: z.string().trim().min(1, 'Isi balasan tidak boleh kosong.').max(5000) });
const moderateSchema = z.object({ kind: z.enum(['pin', 'lock', 'hide']), id: z.string().uuid(), value: z.boolean() });

export async function createDiscussionAction(input: unknown): Promise<ActionResponse<{ id: string }>> {
  const p = discussionSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const me = await actor(MEMBERS);
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const { class_id, title, body } = p.data;

  let id: string;
  if (me.online) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('post_discussion', { p_class: class_id, p_title: title, p_body: body });
    if (error || !data) return { ok: false, error: pesan(error?.message) };
    id = (data as { id: string }).id;
  } else {
    if (!demoMember(class_id, me.id)) return { ok: false, error: ERR.FORBIDDEN };
    id = randomUUID();
    diskusi.push({ id, class_id, author_id: me.id, author_name: me.name, title, body, created_at: new Date().toISOString(), is_pinned: false, is_locked: false, reply_count: 0 });
  }
  revalidatePath('/classes/[id]', 'page');
  return { ok: true, data: { id } };
}

export async function replyDiscussionAction(input: unknown): Promise<ActionResponse> {
  const p = replySchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const me = await actor(MEMBERS);
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const { discussion_id, body } = p.data;

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('reply_discussion', { p_discussion: discussion_id, p_body: body });
    if (error) return { ok: false, error: pesan(error.message) };
  } else {
    const d = diskusi.find((x) => x.id === discussion_id);
    if (!d || !demoMember(d.class_id, me.id)) return { ok: false, error: ERR.NOT_FOUND };
    const owner = mem.classes.find((x) => x.id === d.class_id)?.created_by === me.id;
    if (d.is_locked && !owner) return { ok: false, error: ERR.LOCKED };
    balasan.push({ id: randomUUID(), discussion_id, class_id: d.class_id, author_id: me.id, author_name: me.name, body, created_at: new Date().toISOString(), is_hidden: false });
  }
  revalidatePath('/classes/[id]/discussions/[did]', 'page');
  revalidatePath('/classes/[id]', 'page');
  return { ok: true };
}

// Moderasi hanya untuk dosen kelas: sematkan, kunci, atau sembunyikan balasan.
export async function moderateDiscussionAction(input: unknown): Promise<ActionResponse> {
  const p = moderateSchema.safeParse(input);
  if (!p.success) return { ok: false, error: ERR.NOT_FOUND };
  const me = await actor('LECTURER');
  if (!me) return { ok: false, error: ERR.FORBIDDEN };
  const { kind, id, value } = p.data;

  if (me.online) {
    const supabase = await createClient();
    const { error } = await supabase.rpc('moderate_discussion', { p_kind: kind, p_id: id, p_value: value });
    if (error) return { ok: false, error: pesan(error.message) };
  } else {
    const target = kind === 'hide' ? balasan.find((x) => x.id === id) : diskusi.find((x) => x.id === id);
    if (!target) return { ok: false, error: ERR.NOT_FOUND };
    if (mem.classes.find((x) => x.id === target.class_id)?.created_by !== me.id) return { ok: false, error: ERR.FORBIDDEN };
    if (kind === 'hide') (target as DemoReply).is_hidden = value;
    else if (kind === 'pin') (target as DemoDiscussion).is_pinned = value;
    else (target as DemoDiscussion).is_locked = value;
  }
  revalidatePath('/classes/[id]/discussions/[did]', 'page');
  revalidatePath('/classes/[id]', 'page');
  return { ok: true };
}

export async function getDiscussionAction(classId: string, did: string): Promise<DiscussionThread | null> {
  const c = await getCurrentUserWithRoles();
  const uuid = z.string().uuid();
  if (!c || !MEMBERS.includes(c.activeRole ?? '') || !uuid.safeParse(classId).success || !uuid.safeParse(did).success) return null;
  const viewer = c.activeRole === 'LECTURER' ? 'LECTURER' : c.activeRole === 'TEACHING_ASSISTANT' ? 'TA' : 'STUDENT';

  if (await checkSupabaseOnline()) {
    const supabase = await createClient();
    const { data: d } = await supabase.from('discussions').select('id,title,author_name,body,created_at,is_pinned,is_locked').eq('id', did).eq('class_id', classId).maybeSingle();
    if (!d) return null;
    const { data: cls } = await supabase.from('classes').select('title').eq('id', classId).maybeSingle();
    const { data: rs } = await supabase.from('discussion_replies').select('id,author_name,body,created_at,is_hidden').eq('discussion_id', did).order('created_at');
    return { class_id: classId, class_title: (cls as any)?.title ?? '', discussion: { ...(d as any), reply_count: (rs ?? []).length }, replies: (rs ?? []) as ReplyItem[], viewer };
  }

  const d = diskusi.find((x) => x.id === did && x.class_id === classId);
  if (!d || !demoMember(classId, c.user.id)) return null;
  const lecturer = viewer === 'LECTURER';
  const replies = balasan.filter((r) => r.discussion_id === did && (lecturer || !r.is_hidden)).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((r) => ({ id: r.id, author_name: r.author_name, body: r.body, created_at: r.created_at, is_hidden: r.is_hidden }));
  return {
    class_id: classId,
    class_title: mem.classes.find((x) => x.id === classId)?.title ?? '',
    discussion: { id: d.id, title: d.title, author_name: d.author_name, created_at: d.created_at, is_pinned: d.is_pinned, is_locked: d.is_locked, body: d.body, reply_count: replies.length },
    replies,
    viewer,
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
