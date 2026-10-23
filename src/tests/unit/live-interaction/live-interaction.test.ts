import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createLiveQuestionAction,
  listLiveQuestionsAction,
  toggleUpvoteLiveQuestionAction,
  updateLiveQuestionStatusAction,
  togglePinLiveQuestionAction,
  deleteLiveQuestionAction,
} from '@/modules/academic/live-interaction-actions';
import * as identityModule from '@/modules/identity/actions';

describe('Ruang Interaksi Kuliah: Tanya Jawab Langsung & Cek Pemahaman', () => {
  const testClassId = '11111111-2222-3333-4444-555555555555';
  const studentUser = {
    user: { id: 'mhs-001', email: 'budi.santoso@student.univ.ac.id' },
    profile: { full_name: 'Budi Santoso' },
    activeRole: 'STUDENT',
  };
  const lecturerUser = {
    user: { id: 'dsn-001', email: 'dr.hendra@univ.ac.id' },
    profile: { full_name: 'Dr. Hendra, M.Kom.' },
    activeRole: 'LECTURER',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Menolak pembuatan pertanyaan yang terlalu pendek (di bawah 5 karakter)', async () => {
    vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue(studentUser as any);

    const res = await createLiveQuestionAction({
      classId: testClassId,
      question: 'Apa?',
      isAnonymous: false,
    });

    expect(res.ok).toBe(false);
    expect(res.error).toContain('minimal 5 karakter');
  });

  it('2. Berhasil membuat pertanyaan kuliah dengan nama terang mahasiswa', async () => {
    vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue(studentUser as any);

    const res = await createLiveQuestionAction({
      classId: testClassId,
      question: 'Pak, apakah indeks B-Tree selalu lebih cepat daripada Hash index untuk query range?',
      isAnonymous: false,
    });

    expect(res.ok).toBe(true);
    expect(res.questionId).toBeDefined();

    const listRes = await listLiveQuestionsAction(testClassId);
    expect(listRes.ok).toBe(true);
    const created = listRes.questions.find((q) => q.id === res.questionId);
    expect(created).toBeDefined();
    expect(created?.question).toContain('B-Tree');
    expect(created?.is_anonymous).toBe(false);
    expect(created?.student_name).toBe('Budi Santoso');
  });

  it('3. Menyamarkan nama penanya menjadi anonim untuk menjaga keberanian bertanya', async () => {
    const studentSiti = {
      user: { id: 'mhs-002', email: 'siti.aminah@student.univ.ac.id' },
      profile: { full_name: 'Siti Aminah' },
      activeRole: 'STUDENT',
    };

    // Siti membuat pertanyaan anonim
    vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue(studentSiti as any);
    const res = await createLiveQuestionAction({
      classId: testClassId,
      question: 'Apakah klausa HAVING bisa dipakai tanpa GROUP BY di standar SQL?',
      isAnonymous: true,
    });
    expect(res.ok).toBe(true);

    // Teman sekelas (Budi) melihat daftar pertanyaan
    vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue(studentUser as any);
    const listRes = await listLiveQuestionsAction(testClassId);
    const sitiQ = listRes.questions.find((q) => q.id === res.questionId);

    expect(sitiQ).toBeDefined();
    expect(sitiQ?.is_anonymous).toBe(true);
    // Mahasiswa lain melihat label anonim yang ramah
    expect(sitiQ?.student_name).toBe('Mahasiswa Kelas (Anonim)');
  });

  it('4. Mahasiswa dapat memberikan dan membatalkan dukungan (upvote) pada pertanyaan rekan', async () => {
    vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue(studentUser as any);

    const createRes = await createLiveQuestionAction({
      classId: testClassId,
      question: 'Bagaimana cara mengatasi kondisi race condition pada transaksi terisolasi?',
    });

    // Mahasiswa lain (Siti) memberi dukungan upvote
    const studentSiti = {
      user: { id: 'mhs-002', email: 'siti@student.univ.ac.id' },
      profile: { full_name: 'Siti' },
      activeRole: 'STUDENT',
    };
    vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue(studentSiti as any);

    const upvoteRes1 = await toggleUpvoteLiveQuestionAction(createRes.questionId!, testClassId);
    expect(upvoteRes1.ok).toBe(true);
    expect(upvoteRes1.upvoted).toBe(true);
    expect(upvoteRes1.totalUpvotes).toBe(1);

    // Batal upvote saat diklik kedua kali
    const upvoteRes2 = await toggleUpvoteLiveQuestionAction(createRes.questionId!, testClassId);
    expect(upvoteRes2.ok).toBe(true);
    expect(upvoteRes2.upvoted).toBe(false);
    expect(upvoteRes2.totalUpvotes).toBe(0);
  });

  it('5. Pengajar dapat menyematkan (pin) dan memperbarui status pembahasan pertanyaan kuliah', async () => {
    // Buat pertanyaan terlebih dahulu
    vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue(studentUser as any);
    const createRes = await createLiveQuestionAction({
      classId: testClassId,
      question: 'Bagaimana implementasi isolasi Serializable di PostgreSQL?',
    });
    const qId = createRes.questionId!;

    // Mahasiswa mencoba mengubah status pembahasan (harus ditolak)
    const mhsUpdate = await updateLiveQuestionStatusAction(qId, 'dibahas', undefined, testClassId);
    expect(mhsUpdate.ok).toBe(false);
    expect(mhsUpdate.error).toContain('Hanya dosen atau asisten');

    // Dosen mengubah status menjadi sedang dibahas
    vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue(lecturerUser as any);
    const dsnUpdate1 = await updateLiveQuestionStatusAction(qId, 'dibahas', undefined, testClassId);
    expect(dsnUpdate1.ok).toBe(true);

    // Dosen menyematkan pertanyaan ke layar kelas
    const pinRes = await togglePinLiveQuestionAction(qId, testClassId);
    expect(pinRes.ok).toBe(true);
    expect(pinRes.isPinned).toBe(true);

    // Dosen mencatat jawaban dan menandai selesai
    const dsnUpdate2 = await updateLiveQuestionStatusAction(
      qId,
      'terjawab',
      'PostgreSQL menggunakan SSI (Serializable Snapshot Isolation). Lihat dokumentasi resmi bab 13.',
      testClassId
    );
    expect(dsnUpdate2.ok).toBe(true);

    // Periksa bahwa status dan catatan jawaban tersimpan
    const list = await listLiveQuestionsAction(testClassId);
    const q = list.questions.find((item) => item.id === qId);
    expect(q?.status).toBe('terjawab');
    expect(q?.lecturer_response).toContain('Serializable Snapshot Isolation');
    expect(q?.is_pinned).toBe(true);
  });

  it('6. Pertanyaan yang disematkan atau memiliki upvote tinggi diurutkan lebih prioritas', async () => {
    const classPriorityTestId = '66666666-2222-3333-4444-555555555555';
    vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue(studentUser as any);

    const q1 = await createLiveQuestionAction({ classId: classPriorityTestId, question: 'Pertanyaan umum 1' });
    const q2 = await createLiveQuestionAction({ classId: classPriorityTestId, question: 'Pertanyaan paling banyak didukung' });

    // Beri upvote ke q2
    vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue({
      user: { id: 'mhs-voter' },
      activeRole: 'STUDENT',
    } as any);
    await toggleUpvoteLiveQuestionAction(q2.questionId!, classPriorityTestId);

    // Dosen menyematkan q1
    vi.spyOn(identityModule, 'getCurrentUserWithRoles').mockResolvedValue(lecturerUser as any);
    await togglePinLiveQuestionAction(q1.questionId!, classPriorityTestId);

    const list = await listLiveQuestionsAction(classPriorityTestId);
    // q1 harus berada paling atas karena disematkan (pin)
    expect(list.questions[0].id).toBe(q1.questionId);
    // q2 berikutnya karena memiliki upvote lebih banyak
    expect(list.questions[1].id).toBe(q2.questionId);
  });
});
