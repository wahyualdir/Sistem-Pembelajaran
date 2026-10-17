import { createClient } from '@/lib/supabase/server';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';

export const DEFAULT_CLASS_ID_1 = 'c0000000-0000-0000-0000-000000000001';
export const DEFAULT_CLASS_ID_2 = 'c0000000-0000-0000-0000-000000000002';
export const DEFAULT_CLASS_ID_3 = 'c0000000-0000-0000-0000-000000000003';

export const DEFAULT_LECTURER_ID = 'a0000002-0000-0000-0000-000000000002';
export const DEFAULT_STUDENT_ID = 'a0000001-0000-0000-0000-000000000001';
export const DEFAULT_TA_ID = 'a0000003-0000-0000-0000-000000000003';
export const DEFAULT_COORDINATOR_ID = 'a0000004-0000-0000-0000-000000000004';
export const DEFAULT_PRODI_ID = 'prodi-if-001';

export interface AcademicClassRecord {
  id: string;
  title: string;
  section: string;
  join_code: string;
  status: string;
  created_by: string;
  lecturer_id?: string;
  prodi_id?: string;
  capacity?: number;
  meta?: string;
}

export interface AcademicEnrollmentRecord {
  id?: string;
  class_id: string;
  student_id: string;
  student_name?: string;
  student_nim?: string;
  status?: string;
  prodi_id?: string;
  enrolled_at?: string;
}

export interface AcademicAssistantRecord {
  class_id: string;
  user_id: string;
  name: string;
  nim?: string;
  nidn?: string;
  perms: string[];
}

export interface AcademicAdviseeRecord {
  lecturer_id: string;
  student_id: string;
  student_name?: string;
}

export interface CanonicalAcademicStore {
  classes: AcademicClassRecord[];
  enrollments: AcademicEnrollmentRecord[];
  assistants: AcademicAssistantRecord[];
  advisees: AcademicAdviseeRecord[];
  studentProdiMap: Record<string, string>;
  coordinatorProdiMap: Record<string, string>;
}

/**
 * Mengambil dan menginisialisasi SATU store akademik kanonis (__siajarAkademik)
 * dan menyinkronkan referensi asisten (__siajarAsdos).
 */
export function getAcademicStore(): CanonicalAcademicStore {
  const g = globalThis as any;
  const rawStore = (g.__siajarAkademik ??= {
    classes: [],
    enrollments: [],
  });

  rawStore.classes ??= [];
  rawStore.enrollments ??= [];

  // Sinkronkan referensi array asisten antara __siajarAkademik.assistants dan __siajarAsdos
  if (!rawStore.assistants) {
    rawStore.assistants = (g.__siajarAsdos ??= []);
  } else if (g.__siajarAsdos && g.__siajarAsdos !== rawStore.assistants) {
    for (const item of g.__siajarAsdos) {
      if (
        !rawStore.assistants.some(
          (a: AcademicAssistantRecord) => a.class_id === item.class_id && a.user_id === item.user_id
        )
      ) {
        rawStore.assistants.push(item);
      }
    }
    g.__siajarAsdos = rawStore.assistants;
  } else {
    g.__siajarAsdos = rawStore.assistants;
  }

  rawStore.advisees ??= [];
  rawStore.studentProdiMap ??= {};
  rawStore.coordinatorProdiMap ??= {};

  // Seed data awal hanya bila store baru diinisialisasi pertama kali dalam keadaan kosong
  if (!rawStore.__initializedDefaults) {
    const wasEmpty = rawStore.classes.length === 0 && rawStore.enrollments.length === 0;
    rawStore.__initializedDefaults = true;
    if (wasEmpty) {

    if (!rawStore.classes.some((c: AcademicClassRecord) => c.id === DEFAULT_CLASS_ID_1)) {
      rawStore.classes.push({
        id: DEFAULT_CLASS_ID_1,
        title: 'Pemrograman Web & Arsitektur Cloud',
        section: 'IF-3A',
        join_code: 'WEB2026A',
        status: 'OPEN',
        created_by: DEFAULT_LECTURER_ID,
        lecturer_id: DEFAULT_LECTURER_ID,
        prodi_id: DEFAULT_PRODI_ID,
        capacity: 45,
        meta: 'IF-301, Semester Ganjil 2026/2027',
      });
    }

    if (!rawStore.classes.some((c: AcademicClassRecord) => c.id === DEFAULT_CLASS_ID_2)) {
      rawStore.classes.push({
        id: DEFAULT_CLASS_ID_2,
        title: 'Algoritma & Struktur Data Lanjut',
        section: 'IF-3B',
        join_code: 'ALGO2026',
        status: 'OPEN',
        created_by: DEFAULT_LECTURER_ID,
        lecturer_id: DEFAULT_LECTURER_ID,
        prodi_id: DEFAULT_PRODI_ID,
        capacity: 40,
        meta: 'IF-202, Semester Ganjil 2026/2027',
      });
    }

    if (!rawStore.classes.some((c: AcademicClassRecord) => c.id === DEFAULT_CLASS_ID_3)) {
      rawStore.classes.push({
        id: DEFAULT_CLASS_ID_3,
        title: 'Basis Data Terdistribusi & Big Data',
        section: 'IF-3C',
        join_code: 'DATA2026',
        status: 'OPEN',
        created_by: DEFAULT_LECTURER_ID,
        lecturer_id: DEFAULT_LECTURER_ID,
        prodi_id: DEFAULT_PRODI_ID,
        capacity: 42,
        meta: 'IF-305, Semester Ganjil 2026/2027',
      });
    }

    if (!rawStore.enrollments.some((e: AcademicEnrollmentRecord) => e.class_id === DEFAULT_CLASS_ID_1)) {
      rawStore.enrollments.push(
        {
          class_id: DEFAULT_CLASS_ID_1,
          student_id: DEFAULT_STUDENT_ID,
          student_name: 'Ahmad Mahasiswa',
          student_nim: '2024001',
          prodi_id: DEFAULT_PRODI_ID,
          enrolled_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          class_id: DEFAULT_CLASS_ID_1,
          student_id: DEFAULT_TA_ID,
          student_name: 'Citra Asisten',
          student_nim: '2024002',
          prodi_id: DEFAULT_PRODI_ID,
          enrolled_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          class_id: DEFAULT_CLASS_ID_1,
          student_id: 'mhs-1',
          student_name: 'Ahmad Mahasiswa',
          student_nim: '2024001',
          prodi_id: DEFAULT_PRODI_ID,
          enrolled_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          class_id: DEFAULT_CLASS_ID_1,
          student_id: 'a0000007-0000-0000-0000-000000000007',
          student_name: 'Dewi Mahasiswi',
          student_nim: '2024099',
          prodi_id: DEFAULT_PRODI_ID,
          enrolled_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        }
      );
    }

    if (!rawStore.enrollments.some((e: AcademicEnrollmentRecord) => e.class_id === DEFAULT_CLASS_ID_2)) {
      rawStore.enrollments.push(
        {
          class_id: DEFAULT_CLASS_ID_2,
          student_id: DEFAULT_STUDENT_ID,
          student_name: 'Ahmad Mahasiswa',
          student_nim: '2024001',
          prodi_id: DEFAULT_PRODI_ID,
          enrolled_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          class_id: DEFAULT_CLASS_ID_2,
          student_id: DEFAULT_TA_ID,
          student_name: 'Citra Asisten',
          student_nim: '2024002',
          prodi_id: DEFAULT_PRODI_ID,
          enrolled_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          class_id: DEFAULT_CLASS_ID_2,
          student_id: 'mhs-1',
          student_name: 'Ahmad Mahasiswa',
          student_nim: '2024001',
          prodi_id: DEFAULT_PRODI_ID,
          enrolled_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        }
      );
    }

    if (!rawStore.enrollments.some((e: AcademicEnrollmentRecord) => e.class_id === DEFAULT_CLASS_ID_3)) {
      rawStore.enrollments.push(
        {
          class_id: DEFAULT_CLASS_ID_3,
          student_id: DEFAULT_STUDENT_ID,
          student_name: 'Ahmad Mahasiswa',
          student_nim: '2024001',
          prodi_id: DEFAULT_PRODI_ID,
          enrolled_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          class_id: DEFAULT_CLASS_ID_3,
          student_id: 'mhs-1',
          student_name: 'Ahmad Mahasiswa',
          student_nim: '2024001',
          prodi_id: DEFAULT_PRODI_ID,
          enrolled_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        }
      );
    }

    if (
      !rawStore.assistants.some(
        (a: AcademicAssistantRecord) => a.class_id === DEFAULT_CLASS_ID_1 && a.user_id === DEFAULT_TA_ID
      )
    ) {
      rawStore.assistants.push({
        class_id: DEFAULT_CLASS_ID_1,
        user_id: DEFAULT_TA_ID,
        name: 'Citra Asisten',
        nim: '2024002',
        perms: ['ASSIGNMENT_CREATE', 'ASSIGNMENT_GRADE', 'MATERIAL_CREATE'],
      });
    }

    if (rawStore.advisees.length === 0) {
      rawStore.advisees.push(
        { lecturer_id: DEFAULT_LECTURER_ID, student_id: DEFAULT_STUDENT_ID, student_name: 'Ahmad Mahasiswa' },
        { lecturer_id: DEFAULT_LECTURER_ID, student_id: 'a0000007-0000-0000-0000-000000000007', student_name: 'Dewi Mahasiswi' },
        { lecturer_id: DEFAULT_LECTURER_ID, student_id: DEFAULT_TA_ID, student_name: 'Citra Asisten' }
      );
    }

      rawStore.coordinatorProdiMap[DEFAULT_COORDINATOR_ID] ??= DEFAULT_PRODI_ID;
      rawStore.studentProdiMap[DEFAULT_STUDENT_ID] ??= DEFAULT_PRODI_ID;
      rawStore.studentProdiMap[DEFAULT_TA_ID] ??= DEFAULT_PRODI_ID;
      rawStore.studentProdiMap['mhs-1'] ??= DEFAULT_PRODI_ID;
      rawStore.studentProdiMap['a0000007-0000-0000-0000-000000000007'] ??= DEFAULT_PRODI_ID;
    }
  }

  return rawStore as CanonicalAcademicStore;
}

export class ClassAccessError extends Error {
  public readonly code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND';

  constructor(code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND', message: string) {
    super(message);
    this.name = 'ClassAccessError';
    this.code = code;
  }
}

export interface AuthenticatedViewer {
  userId: string;
  userName: string;
  activeRole: string;
  roles: any[];
  isImpersonating: boolean;
  prodiId?: string;
  raw: any;
}

export interface ClassMemberAssertionResult {
  viewer: AuthenticatedViewer;
  cls: AcademicClassRecord;
  memberRole: 'STUDENT' | 'LECTURER' | 'TEACHING_ASSISTANT';
  isLecturer: boolean;
  isTa: boolean;
  isStudent: boolean;
  permissions: string[];
}

export interface ClassOwnerAssertionResult {
  viewer: AuthenticatedViewer;
  cls: AcademicClassRecord;
}

/**
 * Memastikan pengguna telah login. Melempar ClassAccessError('UNAUTHORIZED') bila belum.
 */
export async function requireUser(): Promise<AuthenticatedViewer> {
  const ctx = await getCurrentUserWithRoles();
  if (!ctx || !ctx.user?.id) {
    throw new ClassAccessError('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.');
  }

  const activeRole = ctx.activeRole || '';
  const userName =
    ctx.profile?.full_name ||
    (ctx.user as any).name ||
    'Pengguna SIAJAR';

  return {
    userId: ctx.user.id,
    userName,
    activeRole,
    roles: ctx.roles || [],
    isImpersonating: Boolean(ctx.isImpersonating),
    prodiId: (ctx.profile as any)?.prodi_id || (ctx.user as any)?.prodi_id,
    raw: ctx,
  };
}

/**
 * Memastikan pengguna memiliki salah satu role yang diizinkan.
 * SYSTEM_ADMIN ditolak secara tegas untuk fungsi akademik dan forum.
 */
export async function requireRole(roles: string | string[]): Promise<AuthenticatedViewer> {
  const viewer = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];

  if (viewer.activeRole === 'SYSTEM_ADMIN' && !allowed.includes('SYSTEM_ADMIN')) {
    throw new ClassAccessError(
      'FORBIDDEN',
      'Aturan A2: SYSTEM_ADMIN dilarang mengakses fungsi akademik dan forum.'
    );
  }

  if (!allowed.includes(viewer.activeRole)) {
    throw new ClassAccessError('FORBIDDEN', 'Aksi ini tidak tersedia untuk peran Anda.');
  }

  return viewer;
}

/**
 * Memastikan pengguna adalah anggota sah kelas tersebut:
 * - STUDENT: harus terdaftar di enrollments kelas.
 * - LECTURER: harus pengampu kelas (created_by atau lecturer_id).
 * - TEACHING_ASSISTANT: harus ditugaskan di class_assistants untuk kelas tersebut.
 * - Peran lain (termasuk SYSTEM_ADMIN, SUPER_ADMIN, dll.) atau pengguna di luar kelas ditolak.
 */
export async function assertClassMember(classId: string): Promise<ClassMemberAssertionResult> {
  const viewer = await requireUser();

  if (viewer.activeRole === 'SYSTEM_ADMIN') {
    throw new ClassAccessError(
      'FORBIDDEN',
      'Aturan A2: SYSTEM_ADMIN dilarang mengakses data akademik dan forum kelas.'
    );
  }

  if (
    viewer.activeRole !== 'STUDENT' &&
    viewer.activeRole !== 'LECTURER' &&
    viewer.activeRole !== 'TEACHING_ASSISTANT'
  ) {
    throw new ClassAccessError(
      'FORBIDDEN',
      'Hanya anggota kelas (Mahasiswa terdaftar, Dosen pengampu, atau Asisten Dosen kelas) yang dapat mengakses.'
    );
  }

  const online = await checkSupabaseOnline();
  if (online) {
    const supabase = await createClient();
    const { data: cls } = await supabase
      .from('classes')
      .select('id,title,section,join_code,status,created_by')
      .eq('id', classId)
      .maybeSingle();

    if (!cls) {
      throw new ClassAccessError('NOT_FOUND', 'Kelas perkuliahan tidak ditemukan.');
    }

    const classRecord = cls as unknown as AcademicClassRecord;

    if (viewer.activeRole === 'LECTURER') {
      const isOwner =
        classRecord.created_by === viewer.userId ||
        (classRecord as any).lecturer_id === viewer.userId;
      if (!isOwner) {
        throw new ClassAccessError('FORBIDDEN', 'Akses ditolak. Anda bukan dosen pengampu kelas ini.');
      }
      return {
        viewer,
        cls: classRecord,
        memberRole: 'LECTURER',
        isLecturer: true,
        isTa: false,
        isStudent: false,
        permissions: [],
      };
    }

    if (viewer.activeRole === 'TEACHING_ASSISTANT') {
      const { data: ca } = await supabase
        .from('class_assistants')
        .select('permission')
        .eq('class_id', classId)
        .eq('user_id', viewer.userId);
      if (!ca || ca.length === 0) {
        throw new ClassAccessError(
          'FORBIDDEN',
          'Akses ditolak. Anda tidak ditugaskan sebagai asisten dosen di kelas ini.'
        );
      }
      return {
        viewer,
        cls: classRecord,
        memberRole: 'TEACHING_ASSISTANT',
        isLecturer: false,
        isTa: true,
        isStudent: false,
        permissions: ca.map((r: any) => r.permission),
      };
    }

    // STUDENT
    const { data: enr } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('class_id', classId)
      .eq('student_id', viewer.userId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (!enr) {
      throw new ClassAccessError('FORBIDDEN', 'Akses ditolak. Anda tidak terdaftar di kelas ini.');
    }

    return {
      viewer,
      cls: classRecord,
      memberRole: 'STUDENT',
      isLecturer: false,
      isTa: false,
      isStudent: true,
      permissions: [],
    };
  }

  // Jalur store kanonis (__siajarAkademik)
  const store = getAcademicStore();
  const cls = store.classes.find((c) => c.id === classId);
  if (!cls) {
    throw new ClassAccessError('NOT_FOUND', 'Kelas perkuliahan tidak ditemukan.');
  }

  if (viewer.activeRole === 'LECTURER') {
    const isOwner = cls.created_by === viewer.userId || cls.lecturer_id === viewer.userId;
    if (!isOwner) {
      throw new ClassAccessError('FORBIDDEN', 'Akses ditolak. Anda bukan dosen pengampu kelas ini.');
    }
    return {
      viewer,
      cls,
      memberRole: 'LECTURER',
      isLecturer: true,
      isTa: false,
      isStudent: false,
      permissions: [],
    };
  }

  if (viewer.activeRole === 'TEACHING_ASSISTANT') {
    const taAssignment = store.assistants.find(
      (a) => a.class_id === classId && a.user_id === viewer.userId && (!a.perms || a.perms.length > 0)
    );
    if (!taAssignment) {
      throw new ClassAccessError(
        'FORBIDDEN',
        'Akses ditolak. Anda tidak ditugaskan sebagai asisten dosen di kelas ini.'
      );
    }
    return {
      viewer,
      cls,
      memberRole: 'TEACHING_ASSISTANT',
      isLecturer: false,
      isTa: true,
      isStudent: false,
      permissions: taAssignment.perms || [],
    };
  }

  // STUDENT
  const isEnrolled = store.enrollments.some(
    (e) =>
      e.class_id === classId &&
      e.student_id === viewer.userId &&
      (e.status === undefined || e.status === 'ACTIVE')
  );
  if (!isEnrolled) {
    throw new ClassAccessError('FORBIDDEN', 'Akses ditolak. Anda tidak terdaftar di kelas ini.');
  }

  return {
    viewer,
    cls,
    memberRole: 'STUDENT',
    isLecturer: false,
    isTa: false,
    isStudent: true,
    permissions: [],
  };
}

/**
 * Memastikan pengguna adalah Dosen Pengampu (LECTURER pemilik/pengampu) dari kelas tersebut.
 * SYSTEM_ADMIN dan semua peran/pengguna lain ditolak.
 */
export async function assertClassOwner(classId: string): Promise<ClassOwnerAssertionResult> {
  const viewer = await requireUser();

  if (viewer.activeRole === 'SYSTEM_ADMIN') {
    throw new ClassAccessError(
      'FORBIDDEN',
      'Aturan A2: SYSTEM_ADMIN dilarang mengakses atau mengubah data akademik kelas.'
    );
  }

  if (viewer.activeRole !== 'LECTURER') {
    throw new ClassAccessError(
      'FORBIDDEN',
      'Akses ditolak. Hanya Dosen Pengampu yang dapat menjalankan aksi ini.'
    );
  }

  const online = await checkSupabaseOnline();
  if (online) {
    const supabase = await createClient();
    const { data: cls } = await supabase
      .from('classes')
      .select('id,title,section,join_code,status,created_by')
      .eq('id', classId)
      .maybeSingle();

    if (!cls) {
      throw new ClassAccessError('NOT_FOUND', 'Kelas perkuliahan tidak ditemukan.');
    }

    const classRecord = cls as unknown as AcademicClassRecord;
    const isOwner =
      classRecord.created_by === viewer.userId ||
      (classRecord as any).lecturer_id === viewer.userId;

    if (!isOwner) {
      throw new ClassAccessError(
        'FORBIDDEN',
        'Akses ditolak. Anda bukan Dosen Pengampu dari kelas ini.'
      );
    }

    return { viewer, cls: classRecord };
  }

  const store = getAcademicStore();
  const cls = store.classes.find((c) => c.id === classId);
  if (!cls) {
    throw new ClassAccessError('NOT_FOUND', 'Kelas perkuliahan tidak ditemukan.');
  }

  const isOwner = cls.created_by === viewer.userId || cls.lecturer_id === viewer.userId;
  if (!isOwner) {
    throw new ClassAccessError(
      'FORBIDDEN',
      'Akses ditolak. Anda bukan Dosen Pengampu dari kelas ini.'
    );
  }

  return { viewer, cls };
}

/**
 * Memeriksa apakah viewer berhak melihat data akademik seorang mahasiswa:
 * - SYSTEM_ADMIN: selalu ditolak (false).
 * - STUDENT: hanya dirinya sendiri.
 * - LECTURER: hanya mahasiswa yang terdaftar di kelas yang ia ampu atau mahasiswa bimbingannya.
 * - PROGRAM_COORDINATOR: hanya mahasiswa dari program studinya.
 */
export async function canViewStudent(
  viewer:
    | AuthenticatedViewer
    | {
        userId?: string;
        user?: { id: string };
        activeRole?: string | null;
        prodiId?: string;
        profile?: { prodi_id?: string; [key: string]: any } | null;
      }
    | null
    | undefined,
  studentId: string
): Promise<boolean> {
  if (!viewer || !studentId) return false;

  const viewerId = (viewer as AuthenticatedViewer).userId ?? (viewer as any).user?.id;
  const role = viewer.activeRole;

  if (!viewerId || !role) return false;
  if (role === 'SYSTEM_ADMIN') return false;

  if (role === 'STUDENT') {
    return viewerId === studentId;
  }

  const store = getAcademicStore();

  if (role === 'LECTURER') {
    // Cek apakah mahasiswa adalah bimbingan dosen ini
    const isAdvisee = store.advisees.some(
      (a) => a.lecturer_id === viewerId && a.student_id === studentId
    );
    if (isAdvisee) return true;

    // Cek apakah mahasiswa terdaftar di salah satu kelas yang diampu dosen ini
    const ownedClassIds = new Set(
      store.classes
        .filter((c) => c.created_by === viewerId || c.lecturer_id === viewerId)
        .map((c) => c.id)
    );

    const isEnrolledInLecturerClass = store.enrollments.some(
      (e) =>
        ownedClassIds.has(e.class_id) &&
        e.student_id === studentId &&
        (e.status === undefined || e.status === 'ACTIVE')
    );

    return isEnrolledInLecturerClass;
  }

  if (role === 'PROGRAM_COORDINATOR') {
    const coordProdi =
      (viewer as AuthenticatedViewer).prodiId ??
      (viewer as any).profile?.prodi_id ??
      store.coordinatorProdiMap[viewerId] ??
      DEFAULT_PRODI_ID;

    // Cek prodi mahasiswa dari studentProdiMap atau dari kelas tempat mahasiswa terdaftar
    const explicitStudentProdi = store.studentProdiMap[studentId];
    if (explicitStudentProdi) {
      return explicitStudentProdi === coordProdi;
    }

    const studentEnrollments = store.enrollments.filter(
      (e) => e.student_id === studentId && (e.status === undefined || e.status === 'ACTIVE')
    );
    if (studentEnrollments.length === 0) {
      return false;
    }

    return studentEnrollments.some((enr) => {
      if (enr.prodi_id) return enr.prodi_id === coordProdi;
      const cls = store.classes.find((c) => c.id === enr.class_id);
      const classProdi = cls?.prodi_id ?? DEFAULT_PRODI_ID;
      return classProdi === coordProdi;
    });
  }

  return false;
}

/**
 * Mengembalikan daftar kelas dari store kanonis yang diizinkan untuk diakses oleh pengguna
 * sesuai perannya (STUDENT: kelas yang diikuti; LECTURER: kelas yang diampu; TA: kelas yang ditugaskan).
 */
export function getAuthorizedClassesForUser(
  userId: string,
  userRole: string
): AcademicClassRecord[] {
  if (!userId || !userRole || userRole === 'SYSTEM_ADMIN') {
    return [];
  }

  const store = getAcademicStore();

  if (userRole === 'STUDENT') {
    const enrolledIds = new Set(
      store.enrollments
        .filter(
          (e) => e.student_id === userId && (e.status === undefined || e.status === 'ACTIVE')
        )
        .map((e) => e.class_id)
    );
    return store.classes.filter((c) => enrolledIds.has(c.id));
  }

  if (userRole === 'LECTURER') {
    return store.classes.filter(
      (c) => c.created_by === userId || c.lecturer_id === userId
    );
  }

  if (userRole === 'TEACHING_ASSISTANT') {
    const assignedIds = new Set(
      store.assistants
        .filter((a) => a.user_id === userId && (!a.perms || a.perms.length > 0))
        .map((a) => a.class_id)
    );
    return store.classes.filter((c) => assignedIds.has(c.id));
  }

  return [];
}

/**
 * Accessor bersama untuk store kuis/ujian (__siajarKuis)
 */
export function getQuizStore(): {
  quizzes: any[];
  attempts: any[];
  events: any[];
  liveStatus: Record<string, Record<string, any>>;
  questionBank: any[];
  disputes: any[];
} {
  const g = globalThis as any;
  const store = (g.__siajarKuis ??= {
    quizzes: [],
    attempts: [],
    events: [],
    liveStatus: {},
    questionBank: [],
    disputes: [],
  });
  store.quizzes ??= [];
  store.attempts ??= [];
  store.events ??= [];
  store.liveStatus ??= {};
  store.questionBank ??= [];
  store.disputes ??= [];
  return store;
}

/**
 * Accessor bersama untuk store tugas & pengumpulan (__siajarTugas)
 */
export function getAssignmentStore(): {
  assignments: any[];
  submissions: any[];
} {
  const g = globalThis as any;
  const store = (g.__siajarTugas ??= {
    assignments: [],
    submissions: [],
  });
  store.assignments ??= [];
  store.submissions ??= [];
  return store;
}

/**
 * Accessor bersama untuk store presensi (__siajarPresensi)
 */
export function getAttendanceStore(): {
  sessions: any[];
  records: any[];
  leaves: any[];
} {
  const g = globalThis as any;
  const store = (g.__siajarPresensi ??= {
    sessions: [],
    records: [],
    leaves: [],
  });
  store.sessions ??= [];
  store.records ??= [];
  store.leaves ??= [];
  return store;
}

/**
 * Accessor bersama untuk store materi kelas (__siajarMateri)
 */
export function getMaterialStore(): any[] {
  const g = globalThis as any;
  return (g.__siajarMateri ??= []);
}

/**
 * Accessor bersama untuk store progres materi (__siajarMateriProgres)
 */
export function getMaterialProgressStore(): any[] {
  const g = globalThis as any;
  return (g.__siajarMateriProgres ??= []);
}

