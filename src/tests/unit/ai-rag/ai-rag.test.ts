import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockCurrentUser: {
  user: { id: string; name: string; email?: string };
  roles: string[];
  activeRole: string;
} | null = null;

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser),
}));

import {
  checkStudentActiveExamSession,
  getStudentAuthorizedMaterials,
  searchRelevantClassSnippets,
  saveUserChatHistoryAction,
  getUserChatHistoryAction,
} from '@/modules/academic/ai-material-rag';
import { askAiAcademicAssistantAction } from '@/modules/academic/ai-actions';
import { quizStore } from '@/modules/academic/quiz-actions';

describe('SIAJAR Fitur 3: Tanya AI SIAJAR (Class Material RAG & Exam Protection)', () => {
  const studentId = 'std-rag-001';
  const studentUser = {
    user: { id: studentId, name: 'Ahmad Mahasiswa' },
    roles: ['STUDENT'],
    activeRole: 'STUDENT',
  };

  const classA = 'c0000000-0000-0000-0000-000000000001';
  const classB_Unenrolled = 'c0000000-0000-0000-0000-000000000002';

  beforeEach(() => {
    // Reset attempts and history in place
    quizStore.attempts.length = 0;
    if ((globalThis as any).__siajarAiChatHistory) {
      (globalThis as any).__siajarAiChatHistory.clear();
    }

    // Setup store asli aplikasi (__siajarAkademik)
    (globalThis as any).__siajarAkademik = {
      classes: [
        { id: classA, title: 'Pemrograman Web & Cloud (IF-3A)', created_by: 'lec-1', status: 'OPEN' },
        { id: classB_Unenrolled, title: 'Kriptografi & Keamanan Jaringan (IF-3B)', created_by: 'lec-2', status: 'OPEN' },
      ],
      enrollments: [
        { class_id: classA, student_id: studentId, status: 'ACTIVE' },
        // Mahasiswa TIDAK terdaftar di classB
      ],
    };

    (globalThis as any).__siajarMateri = [
      {
        id: 'mat-a1',
        class_id: classA,
        title: 'Modul 01: Next.js Server Components dan CORS Preflight',
        meeting_number: 1,
        body_md: 'Server Components merender UI di server. Header Access-Control-Allow-Headers wajib dikonfigurasi saat OPTIONS preflight request.',
      },
      {
        id: 'mat-b1',
        class_id: classB_Unenrolled,
        title: 'Materi Kriptografi Rahasia: Algoritma RSA & Elliptic Curve',
        meeting_number: 1,
        body_md: 'Kunci privat RSA tidak boleh dipublikasikan. Kurva eliptik Ed25519 memiliki performa enkripsi asimetris lebih tinggi.',
      },
    ];
  });

  describe('1. Proteksi Sesi Ujian Aktif (Anti-Kecurangan)', () => {
    it('memblokir Tanya AI saat mahasiswa memiliki sesi ujian IN_PROGRESS', async () => {
      mockCurrentUser = studentUser;

      // Siswa sedang mengerjakan ujian aktif
      quizStore.attempts.push({
        id: 'att-active-1',
        quiz_id: quizStore.quizzes[0].id,
        student_id: studentId,
        student_name: 'Ahmad Mahasiswa',
        is_graded: false,
        score: 0,
        max_score: 100,
        submitted_at: '',
        answers: {},
      });

      // Tambahkan status attempt live di quizStore
      (quizStore.attempts[0] as any).status = 'IN_PROGRESS';

      const examStatus = await checkStudentActiveExamSession(studentId);
      expect(examStatus.hasActiveExam).toBe(true);

      const aiResponse = await askAiAcademicAssistantAction(
        'Berapa jawaban soal nomor 1?',
        [],
        classA
      );

      expect(aiResponse.isExamBlocked).toBe(true);
      expect(aiResponse.response).toContain('sesi ujian aktif');
      expect(aiResponse.response?.toLowerCase()).toContain('integritas akademik');
    });

    it('mengizinkan Tanya AI saat mahasiswa tidak memiliki sesi ujian aktif', async () => {
      mockCurrentUser = studentUser;

      const examStatus = await checkStudentActiveExamSession(studentId);
      expect(examStatus.hasActiveExam).toBe(false);

      const aiResponse = await askAiAcademicAssistantAction(
        'Bagaimana cara kerja Server Components di Next.js?',
        [],
        classA
      );

      expect(aiResponse.isExamBlocked).toBeFalsy();
      expect(aiResponse.response).toBeDefined();
    });
  });

  describe('2. Pengambilan Potongan Materi (RAG) Terbatas pada Kelas yang Diikuti', () => {
    it('hanya mengambil materi dari kelas yang diikuti mahasiswa', async () => {
      const authorizedMaterials = await getStudentAuthorizedMaterials(studentId, 'STUDENT');

      expect(authorizedMaterials.length).toBe(1);
      expect(authorizedMaterials.every((m) => m.classId === classA)).toBe(true);
      expect(authorizedMaterials.some((m) => m.classId === classB_Unenrolled)).toBe(false);
    });

    it('mahasiswa tanpa enrollment mendapat daftar materi kosong (tanpa fallback demoClassId)', async () => {
      const noEnrMaterials = await getStudentAuthorizedMaterials('std-no-enrollment', 'STUDENT');
      expect(noEnrMaterials).toEqual([]);
    });

    it('mengembalikan error akses yang jelas jika contextClassId dikirim untuk kelas yang tidak diikuti', async () => {
      mockCurrentUser = studentUser;

      const res = await askAiAcademicAssistantAction(
        'Jelaskan Algoritma RSA',
        [],
        classB_Unenrolled
      );

      expect(res.ok).toBe(false);
      expect(res.error).toContain('tidak terdaftar');
    });

    it('menolak SYSTEM_ADMIN di askAiAcademicAssistantAction', async () => {
      mockCurrentUser = {
        user: { id: 'sysadmin-1', name: 'System Admin' },
        roles: ['SYSTEM_ADMIN'],
        activeRole: 'SYSTEM_ADMIN',
      };

      const res = await askAiAcademicAssistantAction('Apa materi minggu ini?', [], classA);
      expect(res.ok).toBe(false);
      expect(res.error).toContain('SYSTEM_ADMIN');
    });

    it('tidak pernah membocorkan materi dari kelas yang tidak diikuti meskipun query sangat cocok', async () => {
      const searchRes = await searchRelevantClassSnippets(
        studentId,
        'STUDENT',
        'kunci privat RSA dan enkripsi asimetris'
      );

      // Materi classB_Unenrolled tidak boleh muncul
      expect(searchRes.snippets.some((s) => s.classId === classB_Unenrolled)).toBe(false);
      expect(searchRes.snippets.every((s) => s.classId === classA)).toBe(true);
    });
  });

  describe('3. Rujukan Materi Berbasis Bukti (Citations) & Anti-Halusinasi', () => {
    it('menyertakan rujukan nama materi, pertemuan, dan tautan halaman saat jawaban ditemukan', async () => {
      mockCurrentUser = studentUser;

      const res = await askAiAcademicAssistantAction(
        'Bagaimana penanganan header CORS preflight OPTIONS?',
        [],
        classA
      );

      expect(res.response).toBeDefined();
      expect(res.citations).toBeDefined();
      expect(res.citations!.length).toBeGreaterThan(0);

      const citation = res.citations![0];
      expect(citation.title).toContain('Next.js Server Components');
      expect(citation.meeting).toBe(1);
      expect(citation.url).toBe(`/classes/${classA}`);
    });

    it('anti-halusinasi: SELALU menyatakan tidak ditemukan saat snippet kosong, baik contextClassId bernilai kelas tertentu, ALL, maupun undefined', async () => {
      mockCurrentUser = studentUser;

      // 1. Kelas tertentu dengan topik di luar materi
      const resSpecific = await askAiAcademicAssistantAction(
        'Bagaimana cara sintesis senyawa polimer bioplastik menggunakan katalis asam laktat?',
        [],
        classA
      );
      expect(resSpecific.response).toContain('tidak ditemukan dalam materi');
      expect(resSpecific.citations?.length || 0).toBe(0);

      // 2. contextClassId = 'ALL' (termasuk untuk pertanyaan umum seperti syarat UAS / SKS yang tidak ada di materi kelas)
      const resAllPolicy = await askAiAcademicAssistantAction(
        'Apa syarat kehadiran minimal untuk mengikuti UAS dan aturan pengambilan SKS KRS?',
        [],
        'ALL'
      );
      expect(resAllPolicy.response).toContain('tidak ditemukan dalam materi');
      expect(resAllPolicy.citations?.length || 0).toBe(0);

      // 3. contextClassId = undefined
      const resUndefined = await askAiAcademicAssistantAction(
        'Jelaskan teori relativitas umum Einstein dan gelombang gravitasi',
        [],
        undefined
      );
      expect(resUndefined.response).toContain('tidak ditemukan dalam materi');
      expect(resUndefined.citations?.length || 0).toBe(0);
    });
  });

  describe('4. Riwayat Percakapan Pengguna (Chat History)', () => {
    it('menyimpan dan memuat kembali riwayat percakapan pengguna', async () => {
      mockCurrentUser = studentUser;

      await saveUserChatHistoryAction({
        userId: studentId,
        sender: 'user',
        text: 'Halo Tanya AI',
        contextClassId: classA,
      });

      await saveUserChatHistoryAction({
        userId: studentId,
        sender: 'ai',
        text: 'Halo! Saya asisten akademik SIAJAR.',
        contextClassId: classA,
      });

      const history = await getUserChatHistoryAction();
      expect(history.length).toBe(2);
      expect(history[0].sender).toBe('user');
      expect(history[1].sender).toBe('ai');
    });
  });
});
