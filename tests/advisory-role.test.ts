import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCurrentUser = vi.hoisted(() => ({
  value: {
    user: { id: 'a0000002-0000-0000-0000-000000000002', email: 'dosen001@siajar.test' },
    profile: { full_name: 'Dr. Budi Santoso, M.Kom.' },
    activeRole: 'LECTURER',
    roles: [{ code: 'LECTURER' }],
    isImpersonating: false,
  } as any,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/modules/identity/actions', () => ({
  getCurrentUserWithRoles: vi.fn(async () => mockCurrentUser.value),
}));

vi.mock('@/lib/audit', () => ({
  recordSystemAuditLog: vi.fn(async () => {}),
}));

import {
  assignAdvisorAction,
  revokeAdvisorAction,
  getAdviseesListAction,
  addAdvisoryNoteAction,
  getAdvisoryNotesAction,
  getMyAdvisorAction,
  approveAdviseeKrsAction,
  rejectAdviseeKrsAction,
} from '@/modules/academic/advisory-actions';
import { getAcademicStore, DEFAULT_LECTURER_ID, DEFAULT_STUDENT_ID, DEFAULT_PRODI_ID } from '@/lib/auth/class-access';
import { recordSystemAuditLog } from '@/lib/audit';

describe('Fase 2: Dosen Wali sebagai Tugas Melekat LECTURER', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default context: Dosen Wali Dr. Budi Santoso
    mockCurrentUser.value = {
      user: { id: DEFAULT_LECTURER_ID, email: 'dosen001@siajar.test' },
      profile: { full_name: 'Dr. Budi Santoso, M.Kom.' },
      activeRole: 'LECTURER',
      roles: [{ code: 'LECTURER' }],
      isImpersonating: false,
    };
  });

  it('1. Dosen Wali hanya melihat daftar mahasiswa bimbingan miliknya sendiri', async () => {
    const list = await getAdviseesListAction();
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((item) => item.advisor_id === DEFAULT_LECTURER_ID)).toBe(true);
  });

  it('2. Dosen biasa tidak berwenang menetapkan atau mencabut Dosen Wali (hanya Kaprodi, Sekprodi, Staf)', async () => {
    const res = await assignAdvisorAction({
      student_id: 'mhs-baru-001',
      advisor_id: DEFAULT_LECTURER_ID,
      program_id: DEFAULT_PRODI_ID,
    });
    expect(res.ok).toBe(false);
    expect(res.pesan).toContain('hanya dapat dilakukan oleh Koordinator Prodi, Sekprodi, atau Staf Akademik');

    const resRevoke = await revokeAdvisorAction({ student_id: 'mhs-baru-001' });
    expect(resRevoke.ok).toBe(false);
  });

  it('3. Koordinator Prodi berwenang menetapkan Dosen Wali dan aksi tercatat di audit log', async () => {
    mockCurrentUser.value = {
      user: { id: 'a0000004-0000-0000-0000-000000000004', email: 'kaprodi@siajar.test' },
      profile: { full_name: 'Kaprodi TI' },
      activeRole: 'PROGRAM_COORDINATOR',
      roles: [{ code: 'PROGRAM_COORDINATOR' }],
      isImpersonating: false,
    };

    const res = await assignAdvisorAction({
      student_id: 'mhs-test-assign',
      advisor_id: DEFAULT_LECTURER_ID,
      program_id: DEFAULT_PRODI_ID,
      angkatan: 2024,
    });

    expect(res.ok).toBe(true);
    expect(res.data?.id).toBeDefined();

    // Pastikan audit log dipanggil
    expect(recordSystemAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ASSIGN_ACADEMIC_ADVISOR',
        actorRole: 'PROGRAM_COORDINATOR',
        entityType: 'academic_advisories',
      })
    );
  });

  it('4. Sekretaris Prodi (PROGRAM_SECRETARY) berwenang menetapkan Dosen Wali', async () => {
    mockCurrentUser.value = {
      user: { id: 'a0000011-0000-0000-0000-000000000011', email: 'sekprodi@siajar.test' },
      profile: { full_name: 'Sekprodi TI' },
      activeRole: 'PROGRAM_SECRETARY',
      roles: [{ code: 'PROGRAM_SECRETARY' }],
      isImpersonating: false,
    };

    const res = await assignAdvisorAction({
      student_id: 'mhs-test-sekprodi',
      advisor_id: DEFAULT_LECTURER_ID,
      program_id: DEFAULT_PRODI_ID,
      angkatan: 2024,
    });

    expect(res.ok).toBe(true);
    expect(recordSystemAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ASSIGN_ACADEMIC_ADVISOR',
        actorRole: 'PROGRAM_SECRETARY',
      })
    );
  });

  it('5. Mahasiswa hanya melihat Dosen Wali miliknya sendiri pada getMyAdvisorAction', async () => {
    mockCurrentUser.value = {
      user: { id: DEFAULT_STUDENT_ID, email: 'mhs2024001@student.siajar.test' },
      profile: { full_name: 'Ahmad Mahasiswa' },
      activeRole: 'STUDENT',
      roles: [{ code: 'STUDENT' }],
      isImpersonating: false,
    };

    const myAdvisor = await getMyAdvisorAction();
    expect(myAdvisor).not.toBeNull();
    expect(myAdvisor?.advisor_id).toBe(DEFAULT_LECTURER_ID);
    expect(myAdvisor?.status).toBe('ACTIVE');
  });

  it('6. Dosen Wali dapat menambahkan catatan perwalian dan mencatat audit log', async () => {
    // Kembali ke role LECTURER
    mockCurrentUser.value = {
      user: { id: DEFAULT_LECTURER_ID, email: 'dosen001@siajar.test' },
      profile: { full_name: 'Dr. Budi Santoso, M.Kom.' },
      activeRole: 'LECTURER',
      roles: [{ code: 'LECTURER' }],
      isImpersonating: false,
    };

    const resNote = await addAdvisoryNoteAction({
      advisory_id: 'adv-test-01',
      content: 'Mahasiswa disarankan mengambil maksimal 20 SKS karena semester lalu ada remedial.',
      note_for_student: 'Pertahankan kehadiran di atas 80%.',
    });

    expect(resNote.ok).toBe(true);
    expect(recordSystemAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE_ADVISORY_NOTE',
        entityType: 'advisory_notes',
      })
    );
  });

  it('7. Dosen Wali dapat menyetujui dan menolak KRS mahasiswa bimbingannya', async () => {
    const resApprove = await approveAdviseeKrsAction({
      krs_id: 'krs-mhs-1',
      student_id: DEFAULT_STUDENT_ID,
      catatan: 'KRS telah disetujui.',
    });
    expect(resApprove.ok).toBe(true);
    expect(recordSystemAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'APPROVE_ADVISEE_KRS',
      })
    );

    const resReject = await rejectAdviseeKrsAction({
      krs_id: 'krs-mhs-1',
      student_id: DEFAULT_STUDENT_ID,
      catatan: 'Harap konsultasikan mata kuliah pilihan semester 5 terlebih dahulu.',
    });
    expect(resReject.ok).toBe(true);
    expect(recordSystemAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REJECT_ADVISEE_KRS',
      })
    );
  });

  it('8. Validasi Zod: tolak catatan penolakan KRS jika kurang dari 5 karakter', async () => {
    const resRejectInvalid = await rejectAdviseeKrsAction({
      krs_id: 'krs-mhs-1',
      student_id: DEFAULT_STUDENT_ID,
      catatan: 'bad',
    });
    expect(resRejectInvalid.ok).toBe(false);
    expect(resRejectInvalid.pesan).toContain('minimal 5 karakter');
  });
});
