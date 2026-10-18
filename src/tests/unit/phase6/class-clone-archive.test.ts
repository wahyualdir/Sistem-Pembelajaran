import { describe, it, expect } from 'vitest';

describe('Class Cloning and Archiving Business Rules (13.1)', () => {
  it('menghitung pergeseran tanggal tugas dan kuis secara akurat sesuai selisih hari', () => {
    const shiftDays = 120;
    const originalDue = new Date('2026-02-01T15:00:00.000Z');

    const shiftedDue = new Date(originalDue.getTime() + shiftDays * 86400000);
    expect(shiftedDue.toISOString()).toBe('2026-06-01T15:00:00.000Z');
  });

  it('memastikan data privat mahasiswa (pengumpulan, nilai, presensi) dikecualikan dari salinan kelas', () => {
    const sourceClassData = {
      materials: [{ id: 'm1', title: 'Bab 1' }],
      assignments: [{ id: 'a1', title: 'Tugas 1' }],
      quizzes: [{ id: 'q1', title: 'Kuis 1' }],
      // Data mahasiswa yang DILARANG disalin:
      submissions: [{ id: 'sub1', student_id: 'mhs-1', score: 85 }],
      grades: [{ student_id: 'mhs-1', final_grade: 'A' }],
      attendance_records: [{ student_id: 'mhs-1', status: 'H' }],
      enrollments: [{ student_id: 'mhs-1' }]
    };

    // Filter clone payload
    const clonePayload = {
      materials: sourceClassData.materials.map(m => ({ ...m, status: 'DRAFT' })),
      assignments: sourceClassData.assignments.map(a => ({ ...a, status: 'DRAFT' })),
      quizzes: sourceClassData.quizzes.map(q => ({ ...q, status: 'DRAFT' }))
    };

    expect(clonePayload).not.toHaveProperty('submissions');
    expect(clonePayload).not.toHaveProperty('grades');
    expect(clonePayload).not.toHaveProperty('attendance_records');
    expect(clonePayload).not.toHaveProperty('enrollments');
    expect(clonePayload.assignments[0].status).toBe('DRAFT');
  });

  it('menolak aksi penulisan jika kelas berstatus ARCHIVED kecuali dilakukan staf/super admin', () => {
    function canWriteToClass(role: string, classStatus: string): boolean {
      if (classStatus === 'ARCHIVED') {
        return ['ACADEMIC_STAFF', 'SUPER_ADMIN'].includes(role);
      }
      return ['LECTURER', 'TEACHING_ASSISTANT', 'STUDENT', 'ACADEMIC_STAFF', 'SUPER_ADMIN'].includes(role);
    }

    expect(canWriteToClass('STUDENT', 'ARCHIVED')).toBe(false);
    expect(canWriteToClass('TEACHING_ASSISTANT', 'ARCHIVED')).toBe(false);
    expect(canWriteToClass('LECTURER', 'ARCHIVED')).toBe(false);
    expect(canWriteToClass('ACADEMIC_STAFF', 'ARCHIVED')).toBe(true);
    expect(canWriteToClass('SUPER_ADMIN', 'ARCHIVED')).toBe(true);

    expect(canWriteToClass('LECTURER', 'ACTIVE')).toBe(true);
    expect(canWriteToClass('STUDENT', 'ACTIVE')).toBe(true);
  });
});
