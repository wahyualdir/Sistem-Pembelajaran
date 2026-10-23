/**
 * Definisi Tipe Data Ruang Interaksi Kuliah (Tanya Jawab Langsung & Cek Pemahaman)
 * Menggunakan peristilahan alami akademik kampus Indonesia.
 */

export type LiveQuestionStatus = 'antre' | 'dibahas' | 'terjawab' | 'diarsipkan';

export type LiveQuestionFilter = 'semua' | 'antre' | 'dibahas' | 'terjawab';

export interface LiveQuestionItem {
  id: string;
  class_id: string;
  session_id?: string | null;
  student_id: string;
  student_name: string;
  is_anonymous: boolean;
  question: string;
  upvotes_count: number;
  status: LiveQuestionStatus;
  is_pinned: boolean;
  lecturer_response?: string | null;
  created_at: string;
  updated_at?: string;
  has_upvoted?: boolean;
  is_mine?: boolean;
}

export interface CreateLiveQuestionInput {
  classId: string;
  sessionId?: string | null;
  question: string;
  isAnonymous?: boolean;
}

export interface UpdateQuestionStatusInput {
  questionId: string;
  status: LiveQuestionStatus;
  lecturerResponse?: string;
}
