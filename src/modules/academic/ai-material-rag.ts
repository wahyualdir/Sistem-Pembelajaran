'use server';

import { randomUUID } from 'crypto';
import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import {
  getAuthorizedClassesForUser,
  getMaterialStore,
} from '@/lib/auth/class-access';
import { quizStore } from './quiz-store';


export interface MaterialSnippet {
  id: string;
  classId: string;
  classTitle: string;
  materialTitle: string;
  meetingNumber: number | string;
  materialUrl: string;
  content: string;
}

export interface ChatHistoryRecord {
  id: string;
  userId: string;
  sender: 'user' | 'ai';
  text: string;
  contextClassId?: string;
  citations?: Array<{
    title: string;
    meeting: string | number;
    url: string;
  }>;
  createdAt: string;
}

// -------------------------------------------------------------
// Storage In-Memory untuk Riwayat Percakapan per Pengguna
// -------------------------------------------------------------
const chatHistoryStore: Map<string, ChatHistoryRecord[]> =
  ((globalThis as any).__siajarAiChatHistory ??= new Map<string, ChatHistoryRecord[]>());

// -------------------------------------------------------------
// 1. Cek Sesi Ujian Aktif Mahasiswa (Proteksi Anti-Kecurangan)
// -------------------------------------------------------------
export async function checkStudentActiveExamSession(userId: string): Promise<{
  hasActiveExam: boolean;
  examTitle?: string;
}> {
  // Cek apakah mahasiswa sedang berada di sesi ujian aktif
  const liveAttempts = (quizStore.attempts || []).filter(
    (a) => a.student_id === userId && ((a as any).status === 'IN_PROGRESS' || !a.submitted_at)
  );

  if (liveAttempts.length > 0) {
    const exam = (quizStore.quizzes || []).find((q) => q.id === liveAttempts[0].quiz_id);
    return {
      hasActiveExam: true,
      examTitle: exam?.title || 'Ujian Terjadwal',
    };
  }

  return { hasActiveExam: false };
}

// -------------------------------------------------------------
// 2. Indeks & Ambil Potongan Materi Kelas yang Diikuti / Diampu
// -------------------------------------------------------------
export async function getStudentAuthorizedMaterials(
  userId: string,
  userRole: string
): Promise<MaterialSnippet[]> {
  if (!userId || !userRole || userRole === 'SYSTEM_ADMIN') {
    return [];
  }

  // Ambil daftar kelas resmi dari store terpusat (__siajarAkademik / __siajarAsdos / Supabase)
  // STUDENT: hanya kelas terdaftar; LECTURER: hanya kelas diampu; TA: hanya kelas ditugaskan
  const authorizedClasses = await getAuthorizedClassesForUser(userId, userRole);
  if (authorizedClasses.length === 0) {
    return [];
  }

  const enrolledClassIds = new Set<string>(authorizedClasses.map((c) => c.id));
  const classMap = new Map<string, string>(authorizedClasses.map((c) => [c.id, c.title]));
  const materials: MaterialSnippet[] = [];

  // Kumpulkan materi dari store terpusat (__siajarMateri) hanya untuk kelas yang diizinkan
  const rawBahan = getMaterialStore();
  rawBahan.forEach((m, idx) => {
    if (enrolledClassIds.has(m.class_id)) {
      materials.push({
        id: m.id || `mat-${idx}`,
        classId: m.class_id,
        classTitle: classMap.get(m.class_id) || 'Kelas Perkuliahan',
        materialTitle: m.title || `Modul Kuliah #${idx + 1}`,
        meetingNumber: m.meeting_number ?? idx + 1,
        materialUrl: `/classes/${m.class_id}`,
        content: m.body_md || m.body || m.description || '',
      });
    }
  });

  return materials;
}

const STOPWORDS_ID = new Set([
  'apa',
  'apakah',
  'bagaimana',
  'berapa',
  'mengapa',
  'kenapa',
  'kapan',
  'dimana',
  'siapa',
  'jelaskan',
  'sebutkan',
  'dan',
  'atau',
  'yang',
  'untuk',
  'dari',
  'pada',
  'dengan',
  'dalam',
  'oleh',
  'saat',
  'ketika',
  'jika',
  'bila',
  'tidak',
  'bukan',
  'bisa',
  'dapat',
  'akan',
  'telah',
  'sudah',
  'belum',
  'adalah',
  'ialah',
  'merupakan',
  'itu',
  'ini',
  'tersebut',
  'cara',
  'tentang',
  'mengenai',
  'sebuah',
  'suatu',
  'para',
  'semua',
  'seluruh',
]);

// -------------------------------------------------------------
// 3. Cari Potongan Materi Relevan (Hanya dari Kelas yang Diikuti)
// -------------------------------------------------------------
export async function searchRelevantClassSnippets(
  userId: string,
  userRole: string,
  query: string,
  contextClassId?: string
): Promise<{
  snippets: MaterialSnippet[];
  contextClassTitle: string;
  isSpecificClass: boolean;
}> {
  const allMaterials = await getStudentAuthorizedMaterials(userId, userRole);
  const qTerms = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS_ID.has(w));

  let filtered = allMaterials;
  let contextTitle = 'Seluruh Kelas yang Diikuti';
  let isSpecific = false;

  if (contextClassId && contextClassId !== 'ALL') {
    filtered = allMaterials.filter((m) => m.classId === contextClassId);
    isSpecific = true;
    if (filtered.length > 0) {
      contextTitle = filtered[0].classTitle;
    }
  }

  // Scoring kecocokan kata kunci
  const scored = filtered.map((item) => {
    const textToSearch = `${item.materialTitle} ${item.content}`.toLowerCase();
    let score = 0;
    qTerms.forEach((term) => {
      if (textToSearch.includes(term)) {
        score += 2;
      }
    });
    return { item, score };
  });

  const matched = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item)
    .slice(0, 3); // Ambil maksimal 3 potongan materi paling relevan

  return {
    snippets: matched,
    contextClassTitle: contextTitle,
    isSpecificClass: isSpecific,
  };
}

// -------------------------------------------------------------
// 4. Riwayat Percakapan (Get & Save History)
// -------------------------------------------------------------
export async function getUserChatHistoryAction(): Promise<ChatHistoryRecord[]> {
  const user = await getCurrentUserWithRoles();
  if (!user) return [];

  const history = chatHistoryStore.get(user.user.id) || [];
  return history;
}

export async function saveUserChatHistoryAction(record: Omit<ChatHistoryRecord, 'id' | 'createdAt'>) {
  const id = randomUUID();
  const fullRecord: ChatHistoryRecord = {
    ...record,
    id,
    createdAt: new Date().toISOString(),
  };

  const list = chatHistoryStore.get(record.userId) || [];
  list.push(fullRecord);
  // Simpan maksimal 50 percakapan terakhir
  if (list.length > 50) list.shift();
  chatHistoryStore.set(record.userId, list);

  return fullRecord;
}
