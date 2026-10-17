import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock current active user
let mockCurrentUser: {
  user: { id: string; name: string; email?: string };
  roles: string[];
  activeRole: string;
} | null = null;

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser),
}));

// Mock audit log recorder
const auditLogs: any[] = [];
vi.mock('@/lib/audit', () => ({
  recordSystemAuditLog: vi.fn(async (log: any) => {
    auditLogs.push(log);
    return { ok: true, id: 'audit-mock-id' };
  }),
}));

import {
  listClassForumTopicsAction,
  getForumTopicDetailAction,
  createForumTopicAction,
  replyForumTopicAction,
  markBestAnswerAction,
  moderateTopicAction,
  moderateReplyAction,
  getTaForumThreadsAction,
  type ForumTopic,
  type ForumReply,
} from '@/modules/academic/forum-actions';
import { getClassDetailAction } from '@/modules/academic/actions';

describe('SIAJAR Fitur 1: Forum Diskusi per Kelas & Moderasi', () => {
  const classId = 'c0000000-0000-0000-0000-000000000001';
  const otherClassId = 'c0000000-0000-0000-0000-000000000002';

  const studentUser = {
    user: { id: 'a0000001-0000-0000-0000-000000000001', name: 'Ahmad Mahasiswa' },
    roles: ['STUDENT'],
    activeRole: 'STUDENT',
  };
  const unenrolledStudentUser = {
    user: { id: 'std-outsider-999', name: 'Mahasiswa Luar Kelas' },
    roles: ['STUDENT'],
    activeRole: 'STUDENT',
  };
  const lecturerUser = {
    user: { id: 'a0000002-0000-0000-0000-000000000002', name: 'Dr. Budi Santoso' },
    roles: ['LECTURER'],
    activeRole: 'LECTURER',
  };
  const otherLecturerUser = {
    user: { id: 'lec-outsider-999', name: 'Dosen Kelas Lain' },
    roles: ['LECTURER'],
    activeRole: 'LECTURER',
  };
  const taUser = {
    user: { id: 'a0000003-0000-0000-0000-000000000003', name: 'Citra Asisten' },
    roles: ['TEACHING_ASSISTANT'],
    activeRole: 'TEACHING_ASSISTANT',
  };
  const unassignedTaUser = {
    user: { id: 'ta-outsider-999', name: 'Asdos Tidak Ditugaskan' },
    roles: ['TEACHING_ASSISTANT'],
    activeRole: 'TEACHING_ASSISTANT',
  };
  const sysAdminUser = {
    user: { id: 'a0000006-0000-0000-0000-000000000006', name: 'System Admin' },
    roles: ['SYSTEM_ADMIN'],
    activeRole: 'SYSTEM_ADMIN',
  };

  beforeEach(() => {
    // Setup store asli aplikasi (__siajarAkademik & __siajarAsdos)
    const store = ((globalThis as any).__siajarAkademik ??= {
      classes: [],
      enrollments: [],
      class_assistants: [],
    });
    store.classes = [
      {
        id: classId,
        title: 'Pemrograman Web & Arsitektur Cloud',
        section: 'IF-3A',
        join_code: 'WEB2026A',
        status: 'OPEN',
        created_by: lecturerUser.user.id,
      },
      {
        id: otherClassId,
        title: 'Algoritma & Struktur Data Lanjut',
        section: 'IF-3B',
        join_code: 'ALGO2026',
        status: 'OPEN',
        created_by: otherLecturerUser.user.id,
      },
    ];
    store.enrollments = [
      {
        class_id: classId,
        student_id: studentUser.user.id,
        student_name: studentUser.user.name,
        status: 'ACTIVE',
      },
    ];
    store.class_assistants = [
      {
        class_id: classId,
        user_id: taUser.user.id,
        name: taUser.user.name,
        perms: ['submission.review', 'attendance.manage'],
      },
    ];

    const asdosStore = ((globalThis as any).__siajarAsdos ??= []);
    asdosStore.length = 0;
    asdosStore.push({
      class_id: classId,
      user_id: taUser.user.id,
      name: taUser.user.name,
      perms: ['submission.review', 'attendance.manage'],
    });

    if ((globalThis as any).__siajarForumTopics) {
      (globalThis as any).__siajarForumTopics.length = 0;
    }
    if ((globalThis as any).__siajarForumReplies) {
      (globalThis as any).__siajarForumReplies.length = 0;
    }
    auditLogs.length = 0;
  });

  describe('1. Akses & Pembuatan Topik Diskusi', () => {
    it('mahasiswa kelas berhasil membuat topik baru dengan tag dan lampiran berkas', async () => {
      mockCurrentUser = studentUser;

      const res = await createForumTopicAction({
        classId,
        title: 'Bagaimana cara setup PostgreSQL connection pool di Supabase?',
        body: 'Saya mengalami bottleneck koneksi ketika serverless functions dieksekusi secara masif. Apakah disarankan memakai pgBouncer transaction mode?',
        tags: ['database', 'postgresql', 'supabase'],
        attachments: [
          { name: 'pg-error-log.txt', url: '/files/pg-error-log.txt', size: '12 KB', type: 'text/plain' },
        ],
      });

      expect(res.ok).toBe(true);
      expect(res.topicId).toBeDefined();

      const listRes = await listClassForumTopicsAction(classId);
      expect(listRes.ok).toBe(true);
      expect(listRes.topics?.length).toBeGreaterThanOrEqual(1);

      const topic = listRes.topics?.find((t) => t.id === res.topicId);
      expect(topic).toBeDefined();
      expect(topic?.title).toContain('PostgreSQL connection pool');
      expect(topic?.tags).toEqual(['database', 'postgresql', 'supabase']);
      expect(topic?.attachments.length).toBe(1);
      expect(topic?.author_name).toBe('Ahmad Mahasiswa');
      expect(topic?.author_role).toBe('STUDENT');
    });

    it('menolak pembuatan topik jika judul kurang dari 5 karakter atau body kurang dari 10 karakter', async () => {
      mockCurrentUser = studentUser;

      const res = await createForumTopicAction({
        classId,
        title: 'API?',
        body: 'Pendek',
        tags: [],
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('menolak akses baca, tulis, dan moderasi bagi mahasiswa non-anggota, dosen non-pengampu, TA tidak ditugaskan, dan SYSTEM_ADMIN', async () => {
      // Buat topik & balasan nyata terlebih dahulu oleh anggota sah
      mockCurrentUser = studentUser;
      const created = await createForumTopicAction({
        classId,
        title: 'Topik Rahasia Internal Kelas IF-3A',
        body: 'Isi diskusi internal yang hanya boleh diakses oleh anggota resmi kelas IF-3A.',
      });
      const topicId = created.topicId!;

      mockCurrentUser = taUser;
      const createdReply = await replyForumTopicAction({
        classId,
        topicId,
        body: 'Balasan resmi dari asisten dosen kelas IF-3A.',
      });
      const replyId = createdReply.replyId!;

      const unauthorizedActors = [
        unenrolledStudentUser,
        otherLecturerUser,
        unassignedTaUser,
        sysAdminUser,
      ];

      for (const actor of unauthorizedActors) {
        mockCurrentUser = actor;

        // 1. Ditolak Baca (List & Detail)
        const listRes = await listClassForumTopicsAction(classId);
        expect(listRes.ok).toBe(false);
        expect(listRes.topics).toEqual([]);

        const detailRes = await getForumTopicDetailAction(classId, topicId);
        expect(detailRes.ok).toBe(false);
        expect(detailRes.topic).toBeNull();
        expect(detailRes.replies).toEqual([]);

        // 2. Ditolak Tulis (Buat Topik & Balas Topik)
        const createRes = await createForumTopicAction({
          classId,
          title: `Topik Ilegal dari ${actor.user.name}`,
          body: 'Mencoba menyusupkan topik ke kelas tanpa otorisasi.',
        });
        expect(createRes.ok).toBe(false);

        const replyRes = await replyForumTopicAction({
          classId,
          topicId,
          body: 'Mencoba membalas topik tanpa keanggotaan kelas.',
        });
        expect(replyRes.ok).toBe(false);

        // 3. Ditolak Moderasi (Pin, Lock, Hide Topic, Hide Reply, Best Answer)
        const pinRes = await moderateTopicAction(topicId, 'pin', true);
        expect(pinRes.ok).toBe(false);

        const lockRes = await moderateTopicAction(topicId, 'lock', true);
        expect(lockRes.ok).toBe(false);

        const hideReplyRes = await moderateReplyAction(replyId, 'hide');
        expect(hideReplyRes.ok).toBe(false);

        const bestAnsRes = await markBestAnswerAction(topicId, replyId);
        expect(bestAnsRes.ok).toBe(false);
      }

      // Pastikan mahasiswa anggota biasa juga ditolak melakukan moderasi pin/lock/hide
      mockCurrentUser = studentUser;
      expect((await moderateTopicAction(topicId, 'pin', true)).ok).toBe(false);
      expect((await moderateTopicAction(topicId, 'lock', true)).ok).toBe(false);
      expect((await moderateReplyAction(replyId, 'hide')).ok).toBe(false);
    });
  });

  describe('2. Balasan Diskusi & Penandaan Jawaban Terbaik (Best Answer)', () => {
    it('anggota kelas dapat membalas topik dan memperbarui reply_count', async () => {
      mockCurrentUser = studentUser;
      const created = await createForumTopicAction({
        classId,
        title: 'Tanya mengenai optimasi indeks B-Tree vs Hash pada PostgreSQL',
        body: 'Kapan sebaiknya kita menggunakan index hash dibandingkan b-tree default di Postgres?',
      });
      const topicId = created.topicId!;

      // Dosen membalas topik
      mockCurrentUser = lecturerUser;
      const replyRes = await replyForumTopicAction({
        classId,
        topicId,
        body: 'Index B-Tree sangat cocok untuk kueri perbandingan rentang (<, <=, =, >=, >), sedangkan Hash index hanya efisien untuk kueri equality (=). Di Postgres modern, B-Tree adalah pilihan default yang paling optimal.',
      });

      expect(replyRes.ok).toBe(true);
      expect(replyRes.replyId).toBeDefined();

      // Cek detail thread
      const threadRes = await getForumTopicDetailAction(classId, topicId);
      expect(threadRes.ok).toBe(true);
      expect(threadRes.topic?.reply_count).toBe(1);
      expect(threadRes.replies?.length).toBe(1);
      expect(threadRes.replies?.[0].author_role).toBe('LECTURER');
    });

    it('penanya atau dosen dapat menandai jawaban terbaik (Best Answer)', async () => {
      // Mahasiswa buat topik
      mockCurrentUser = studentUser;
      const created = await createForumTopicAction({
        classId,
        title: 'Masalah async await pada useEffect React',
        body: 'Apakah boleh langsung menjadikan callback useEffect sebagai async function?',
      });
      const topicId = created.topicId!;

      // Balasan dari TA
      mockCurrentUser = taUser;
      const replyRes = await replyForumTopicAction({
        classId,
        topicId,
        body: 'Jangan langsung buat async callback di useEffect karena useEffect mengekspektasikan cleanup function. Buat fungsi async di dalamnya lalu panggil.',
      });
      const replyId = replyRes.replyId!;

      // Penanya (Ahmad Mahasiswa) menandai best answer
      mockCurrentUser = studentUser;
      const markRes = await markBestAnswerAction(topicId, replyId);

      expect(markRes.ok).toBe(true);
      expect(markRes.isBestAnswer).toBe(true);

      const threadRes = await getForumTopicDetailAction(classId, topicId);
      expect(threadRes.topic?.best_reply_id).toBe(replyId);
      expect(threadRes.replies?.[0].is_best_answer).toBe(true);
    });
  });

  describe('3. Moderasi oleh Dosen & Asisten Dosen (Pin, Lock, Hide)', () => {
    it('dosen dan asdos dapat menyematkan (PIN) dan mengunci (LOCK) topik', async () => {
      mockCurrentUser = studentUser;
      const created = await createForumTopicAction({
        classId,
        title: 'Topik Panduan Format Submission Tugas Akhir Semester',
        body: 'Berikut adalah format pengumpulan tugas yang disepakati untuk kelas kita.',
      });
      const topicId = created.topicId!;

      // Dosen PIN topik
      mockCurrentUser = lecturerUser;
      const pinRes = await moderateTopicAction(topicId, 'pin', true);
      expect(pinRes.ok).toBe(true);

      // Asdos LOCK topik
      mockCurrentUser = taUser;
      const lockRes = await moderateTopicAction(topicId, 'lock', true);
      expect(lockRes.ok).toBe(true);

      const threadRes = await getForumTopicDetailAction(classId, topicId);
      expect(threadRes.topic?.is_pinned).toBe(true);
      expect(threadRes.topic?.is_locked).toBe(true);

      // Verifikasi topik yang terkunci menolak balasan baru
      mockCurrentUser = studentUser;
      const failedReply = await replyForumTopicAction({
        classId,
        topicId,
        body: 'Apakah masih bisa membalas di topik yang sudah dikunci?',
      });
      expect(failedReply.ok).toBe(false);
      expect(failedReply.error).toContain('dikunci');
    });

    it('dosen dapat menyembunyikan postingan balasan yang melanggar ketentuan', async () => {
      mockCurrentUser = studentUser;
      const created = await createForumTopicAction({
        classId,
        title: 'Diskusi Praktikum Modul 4',
        body: 'Ada kendala pada konfigurasi Nginx reverse proxy.',
      });
      const topicId = created.topicId!;

      const replyRes = await replyForumTopicAction({
        classId,
        topicId,
        body: 'Komentar spam yang tidak relevan dengan praktikum.',
      });
      const replyId = replyRes.replyId!;

      // Dosen sembunyikan balasan
      mockCurrentUser = lecturerUser;
      const hideRes = await moderateReplyAction(replyId, 'hide');
      expect(hideRes.ok).toBe(true);

      // Siswa biasa tidak melihat postingan yang disembunyikan
      mockCurrentUser = studentUser;
      const threadRes = await getForumTopicDetailAction(classId, topicId);
      expect(threadRes.replies?.length).toBe(0);

      // Dosen dan asdos tetap dapat melihat dengan status hidden
      mockCurrentUser = lecturerUser;
      const lecturerThreadRes = await getForumTopicDetailAction(classId, topicId);
      expect(lecturerThreadRes.replies?.length).toBe(1);
      expect(lecturerThreadRes.replies?.[0].is_hidden).toBe(true);
    });

    it('pelaporan postingan dicatat ke sistem audit trail', async () => {
      mockCurrentUser = studentUser;
      const created = await createForumTopicAction({
        classId,
        title: 'Diskusi Kode Etik Akademik',
        body: 'Pertanyaan umum mengenai aturan sitasi karya ilmiah.',
      });
      const topicId = created.topicId!;

      const replyRes = await replyForumTopicAction({
        classId,
        topicId,
        body: 'Penawaran jasa joki tugas akademik.',
      });
      const replyId = replyRes.replyId!;

      // Asisten / Dosen melaporkan postingan ini
      mockCurrentUser = lecturerUser;
      const reportRes = await moderateReplyAction(
        replyId,
        'report',
        'Indikasi pelanggaran integritas akademik dan promosi joki tugas.'
      );

      expect(reportRes.ok).toBe(true);
      expect(auditLogs.length).toBeGreaterThanOrEqual(1);

      const reportAudit = auditLogs.find((l) => l.action === 'forum.post_reported');
      expect(reportAudit).toBeDefined();
      expect(reportAudit.entityType).toBe('forum_replies');
      expect(reportAudit.entityId).toBe(replyId);
      expect(reportAudit.description).toContain('integritas akademik');
    });
  });

  describe('4. Forum Praktikum Asisten Dosen (/ta/forum) & Akses URL Langsung Kelas (Tahap D)', () => {
    it('getTaForumThreadsAction hanya mengembalikan topik dari kelas tempat TA ditugaskan dan menolak role tidak berwenang', async () => {
      // Buat topik di classId (tempat taUser ditugaskan)
      mockCurrentUser = studentUser;
      await createForumTopicAction({
        classId,
        title: 'Topik untuk Asdos Praktikum Modul 2',
        body: 'Pertanyaan seputar modul praktikum yang membutuhkan asistensi lab.',
        tags: ['praktikum', 'lab'],
      });

      // Buat topik di otherClassId (milik otherLecturerUser, tempat taUser TIDAK ditugaskan)
      mockCurrentUser = otherLecturerUser;
      await createForumTopicAction({
        classId: otherClassId,
        title: 'Topik Rahasia Kelas Algoritma IF-3B',
        body: 'Diskusi internal kelas Algoritma Lanjut yang bukan wewenang Citra Asisten.',
      });

      // Role TA (Citra Asisten) mengakses /ta/forum -> hanya melihat classId, bukan otherClassId
      mockCurrentUser = taUser;
      const taRes = await getTaForumThreadsAction();
      expect(taRes.ok).toBe(true);
      expect(taRes.threads.length).toBeGreaterThanOrEqual(1);
      expect(taRes.threads.some((t) => t.title === 'Topik untuk Asdos Praktikum Modul 2')).toBe(true);
      expect(taRes.threads.every((t) => t.class_id === classId)).toBe(true);
      expect(taRes.threads.some((t) => t.class_id === otherClassId)).toBe(false);

      // TA yang tidak ditugaskan di kelas mana pun mendapat daftar kosong
      mockCurrentUser = unassignedTaUser;
      const unassignedRes = await getTaForumThreadsAction();
      expect(unassignedRes.ok).toBe(true);
      expect(unassignedRes.threads).toEqual([]);

      // SYSTEM_ADMIN dan STUDENT ditolak di getTaForumThreadsAction
      mockCurrentUser = sysAdminUser;
      const sysRes = await getTaForumThreadsAction();
      expect(sysRes.ok).toBe(false);
      expect(sysRes.threads).toEqual([]);
    });

    it('akses langsung via URL kelas lain (getClassDetailAction) ditolak tanpa auto-enroll', async () => {
      const store = (globalThis as any).__siajarAkademik;
      const initialEnrollmentCount = store.enrollments.length;

      // Mahasiswa yang hanya terdaftar di classId mencoba membuka URL otherClassId secara langsung
      mockCurrentUser = studentUser;
      const detailOtherClass = await getClassDetailAction(otherClassId);
      expect(detailOtherClass).toBeNull();

      // Pastikan TIDAK ada auto-enroll ke otherClassId
      expect(store.enrollments.length).toBe(initialEnrollmentCount);
      expect(
        store.enrollments.some(
          (e: any) => e.class_id === otherClassId && e.student_id === studentUser.user.id
        )
      ).toBe(false);

      // Sebaliknya, untuk classId tempat mahasiswa terdaftar, getClassDetailAction berhasil
      const detailOwnClass = await getClassDetailAction(classId);
      expect(detailOwnClass).not.toBeNull();
      expect(detailOwnClass?.cls.id).toBe(classId);
    });
  });
});
