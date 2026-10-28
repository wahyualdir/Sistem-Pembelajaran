'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/config/features';
import { SEED_MATA_KULIAH_UIR } from '@/lib/db/seed-data.uir-ti-2026.generated';
import { deterministicUuid } from '@/lib/akademik/deterministic-uuid';
import { validatePrerequisiteCycle, PrerequisitePair } from '@/lib/akademik/prasyarat';

export interface CplItem {
  id: string;
  code: string;
  description: string;
  target?: number;
}

export interface CpmkItem {
  id: string;
  course_id: string;
  course_code?: string;
  course_name?: string;
  code: string;
  description: string;
  target?: number;
  cpl_mappings?: string[]; // CPL codes
}

export interface CourseWithPrerequisite {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  is_mandatory: boolean;
  prerequisite_id?: string | null;
  prerequisite_code?: string | null;
  prerequisite_name?: string | null;
  aliases?: string[];
}

// In-memory demo stores
const DEMO_CPL: CplItem[] = [
  { id: 'cpl-01', code: 'CPL-01', description: 'Mampu menerapkan konsep rekayasa perangkat lunak dan arsitektur cloud.', target: 80 },
  { id: 'cpl-02', code: 'CPL-02', description: 'Mampu merancang dan menganalisis efisiensi algoritma dan struktur data.', target: 75 },
  { id: 'cpl-03', code: 'CPL-03', description: 'Mampu mengelola basis data relasional dan terdistribusi berskala besar.', target: 85 },
  { id: 'cpl-04', code: 'CPL-04', description: 'Mampu membangun sistem cerdas berbasis kecerdasan buatan dan machine learning.', target: 70 },
  { id: 'cpl-05', code: 'CPL-05', description: 'Mampu menerapkan prinsip keamanan siber dan integritas sistem komputasi.', target: 75 },
];

const DEMO_CPMK: CpmkItem[] = [
  {
    id: 'cpmk-01',
    course_id: deterministicUuid('mk-STI2544138'),
    course_code: 'STI2544138',
    course_name: 'Pemrograman Web & Arsitektur Cloud',
    code: 'CPMK-1',
    description: 'Menguasai konsep protokol HTTP, RESTful API, dan arsitektur microservices.',
    cpl_mappings: ['CPL-01', 'CPL-03'],
  },
  {
    id: 'cpmk-02',
    course_id: deterministicUuid('mk-STI2544138'),
    course_code: 'STI2544138',
    course_name: 'Pemrograman Web & Arsitektur Cloud',
    code: 'CPMK-2',
    description: 'Mampu membangun aplikasi web terdistribusi dengan orkestrasi cloud.',
    cpl_mappings: ['CPL-01'],
  },
  {
    id: 'cpmk-03',
    course_id: deterministicUuid('mk-STI2543131'),
    course_code: 'STI2543131',
    course_name: 'Algoritma & Struktur Data Lanjut',
    code: 'CPMK-1',
    description: 'Mampu mengimplementasikan struktur data hierarkis (Tree, Graph, Hash Table).',
    cpl_mappings: ['CPL-02'],
  },
];

const DEMO_PREREQUISITES: PrerequisitePair[] = [
  {
    courseId: deterministicUuid('mk-STI2544138'), // Pemrograman Web
    prerequisiteId: deterministicUuid('mk-STI2541114'), // Basis Data 1
  },
  {
    courseId: deterministicUuid('mk-STI2543131'), // Struktur Data
    prerequisiteId: deterministicUuid('mk-STI2541101'), // Algoritma & Pemrograman
  },
];

const DEMO_ALIASES: Record<string, string[]> = {
  STI2544138: ['TIF-401', 'IF-WEB-01'],
  STI2543131: ['TIF-202', 'IF-ALGO-02'],
  STI2541114: ['TIF-303', 'IF-DB-01'],
};

export async function getCurriculumDataAction() {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;
  if (role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN' && role !== 'ACADEMIC_STAFF' && role !== 'LECTURER') {
    throw new Error('Akses ditolak: Hanya Kaprodi atau staf akademik berwenang.');
  }

  const isDemo = isDemoMode();
  if (isDemo) {
    return {
      cpl: DEMO_CPL,
      cpmk: DEMO_CPMK,
      coursesPerSemester: [1, 2, 3, 4, 5, 6, 7, 8].map((sem) => ({
        semester: sem,
        courses: SEED_MATA_KULIAH_UIR.filter((m) => m.semesterPaket === sem).map((m) => ({
          id: deterministicUuid(m.id),
          code: m.kode,
          name: m.nama,
          credits: m.sks,
          semester: m.semesterPaket,
          is_mandatory: m.jenis === 'WAJIB',
        })),
      })),
    };
  }

  try {
    const supabase = await createClient();
    const [cplRes, cpmkRes, mapRes, courseRes] = await Promise.all([
      supabase.from('cpl').select('*').order('code'),
      supabase.from('cpmk').select('*, courses:course_id(code, name)').order('code'),
      supabase.from('cpmk_cpl_map').select('*, cpl:cpl_id(code)'),
      supabase.from('courses').select('*').eq('is_active', true).order('semester'),
    ]);

    const cplList: CplItem[] = (cplRes.data || []).map((c: any) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      target: c.target_score ?? 75,
    }));

    const cpmkList: CpmkItem[] = (cpmkRes.data || []).map((cp: any) => {
      const relatedMaps = (mapRes.data || []).filter((m: any) => m.cpmk_id === cp.id);
      return {
        id: cp.id,
        course_id: cp.course_id,
        course_code: cp.courses?.code,
        course_name: cp.courses?.name,
        code: cp.code,
        description: cp.description,
        cpl_mappings: relatedMaps.map((m: any) => m.cpl?.code).filter(Boolean),
      };
    });

    const courses = courseRes.data || [];
    const coursesPerSemester = [1, 2, 3, 4, 5, 6, 7, 8].map((sem) => ({
      semester: sem,
      courses: courses.filter((c: any) => c.semester === sem).map((c: any) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        credits: c.credits,
        semester: c.semester,
        is_mandatory: c.is_mandatory ?? true,
      })),
    }));

    return {
      cpl: cplList.length > 0 ? cplList : DEMO_CPL,
      cpmk: cpmkList.length > 0 ? cpmkList : DEMO_CPMK,
      coursesPerSemester,
    };
  } catch {
    return {
      cpl: DEMO_CPL,
      cpmk: DEMO_CPMK,
      coursesPerSemester: [1, 2, 3, 4, 5, 6, 7, 8].map((sem) => ({
        semester: sem,
        courses: SEED_MATA_KULIAH_UIR.filter((m) => m.semesterPaket === sem).map((m) => ({
          id: deterministicUuid(m.id),
          code: m.kode,
          name: m.nama,
          credits: m.sks,
          semester: m.semesterPaket,
          is_mandatory: m.jenis === 'WAJIB',
        })),
      })),
    };
  }
}

const createCpmkSchema = z.object({
  course_id: z.string().min(1, 'Mata kuliah wajib dipilih'),
  code: z.string().trim().min(2, 'Kode CPMK minimal 2 karakter').max(20),
  description: z.string().trim().min(5, 'Deskripsi minimal 5 karakter').max(500),
  cpl_ids: z.array(z.string()).min(1, 'Minimal petakan ke satu CPL'),
});

export async function createCpmkAction(input: unknown) {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;
  if (role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    return { ok: false, error: 'Akses ditolak: Hanya Kaprodi yang dapat menambahkan CPMK.' };
  }

  const parsed = createCpmkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input tidak valid.' };
  }

  const { course_id, code, description, cpl_ids } = parsed.data;
  const isDemo = isDemoMode();

  if (isDemo) {
    const course = SEED_MATA_KULIAH_UIR.find((m) => deterministicUuid(m.id) === course_id);
    const newCpmk: CpmkItem = {
      id: `cpmk-${Date.now()}`,
      course_id,
      course_code: course?.kode || 'STI-NEW',
      course_name: course?.nama || 'Mata Kuliah',
      code,
      description,
      cpl_mappings: cpl_ids,
    };
    DEMO_CPMK.push(newCpmk);
    revalidatePath('/coordinator/curriculum');
    return { ok: true, data: newCpmk };
  }

  try {
    const supabase = await createClient();
    const { data: cpmkData, error: cpmkErr } = await supabase
      .from('cpmk')
      .insert({ course_id, code, description })
      .select('id')
      .single();

    if (cpmkErr || !cpmkData) {
      return { ok: false, error: cpmkErr?.message || 'Gagal menyimpan CPMK ke database.' };
    }

    if (cpl_ids.length > 0) {
      const mapRows = cpl_ids.map((cpl_id) => ({
        cpmk_id: cpmkData.id,
        cpl_id,
        weight: 1.0,
      }));
      await supabase.from('cpmk_cpl_map').insert(mapRows);
    }

    revalidatePath('/coordinator/curriculum');
    return { ok: true, data: cpmkData };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Terjadi kesalahan sistem saat menyimpan CPMK.' };
  }
}

export async function getCoursesWithPrerequisitesAction(): Promise<CourseWithPrerequisite[]> {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;
  if (role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN' && role !== 'ACADEMIC_STAFF' && role !== 'LECTURER') {
    throw new Error('Akses ditolak: Hanya Kaprodi atau staf berwenang.');
  }

  const isDemo = isDemoMode();
  if (isDemo) {
    return SEED_MATA_KULIAH_UIR.map((m) => {
      const mId = deterministicUuid(m.id);
      const prereq = DEMO_PREREQUISITES.find((p) => p.courseId === mId);
      const prereqCourse = prereq ? SEED_MATA_KULIAH_UIR.find((x) => deterministicUuid(x.id) === prereq.prerequisiteId) : null;
      return {
        id: mId,
        code: m.kode,
        name: m.nama,
        credits: m.sks,
        semester: m.semesterPaket,
        is_mandatory: m.jenis === 'WAJIB',
        prerequisite_id: prereq?.prerequisiteId || null,
        prerequisite_code: prereqCourse?.kode || null,
        prerequisite_name: prereqCourse?.nama || null,
        aliases: DEMO_ALIASES[m.kode] || [],
      };
    });
  }

  try {
    const supabase = await createClient();
    const { data: courses } = await supabase.from('courses').select('*').order('code');
    const { data: aliases } = await supabase.from('course_code_aliases').select('*');

    const aliasMap: Record<string, string[]> = {};
    for (const a of aliases || []) {
      aliasMap[a.course_id] = [...(aliasMap[a.course_id] || []), a.alias_code];
    }

    return (courses || []).map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      credits: c.credits,
      semester: c.semester || 1,
      is_mandatory: c.is_mandatory ?? true,
      prerequisite_id: c.prerequisite_id || null,
      aliases: aliasMap[c.id] || [],
    }));
  } catch {
    return SEED_MATA_KULIAH_UIR.map((m) => ({
      id: deterministicUuid(m.id),
      code: m.kode,
      name: m.nama,
      credits: m.sks,
      semester: m.semesterPaket,
      is_mandatory: m.jenis === 'WAJIB',
      aliases: DEMO_ALIASES[m.kode] || [],
    }));
  }
}

const saveCourseSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(3, 'Kode mata kuliah minimal 3 karakter').max(20),
  name: z.string().trim().min(3, 'Nama mata kuliah minimal 3 karakter').max(150),
  credits: z.coerce.number().min(1).max(6),
  semester: z.coerce.number().min(1).max(8),
  is_mandatory: z.boolean().default(true),
  prerequisite_id: z.string().optional().nullable(),
});

export async function saveCourseAction(input: unknown) {
  const user = await getCurrentUserWithRoles();
  const role = user?.activeRole;
  if (role !== 'PROGRAM_COORDINATOR' && role !== 'SUPER_ADMIN') {
    return { ok: false, error: 'Akses ditolak: Hanya Kaprodi yang dapat mengubah mata kuliah.' };
  }

  const parsed = saveCourseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Input mata kuliah tidak valid.' };
  }

  const { id, code, name, credits, semester, is_mandatory, prerequisite_id } = parsed.data;
  const courseId = id || deterministicUuid(`mk-${code}`);

  // Validasi prasyarat (deteksi siklus via DFS)
  if (prerequisite_id) {
    const existingPairs = DEMO_PREREQUISITES;
    const cycleCheck = validatePrerequisiteCycle(existingPairs, courseId, prerequisite_id);
    if (!cycleCheck.valid) {
      return { ok: false, error: cycleCheck.message || 'Terdeteksi lingkaran prasyarat (circular dependency)!' };
    }
  }

  const isDemo = isDemoMode();
  if (isDemo) {
    if (prerequisite_id) {
      const idx = DEMO_PREREQUISITES.findIndex((p) => p.courseId === courseId);
      if (idx >= 0) {
        DEMO_PREREQUISITES[idx].prerequisiteId = prerequisite_id;
      } else {
        DEMO_PREREQUISITES.push({ courseId, prerequisiteId: prerequisite_id });
      }
    }
    revalidatePath('/coordinator/courses');
    return { ok: true, data: { id: courseId, code, name, credits, semester } };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('courses')
      .upsert({
        id: courseId,
        code,
        name,
        credits,
        semester,
        is_mandatory,
        prerequisite_id: prerequisite_id || null,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath('/coordinator/courses');
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Gagal menyimpan mata kuliah.' };
  }
}
