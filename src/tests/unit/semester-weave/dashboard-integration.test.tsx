import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StudentDashboardClient } from '@/app/(portal)/student/student-dashboard-client';
import { buildSemesterWeave } from '@/lib/akademik/semester-weave';
import type { StudentRiskEvaluation } from '@/modules/early-warning/types';

describe('Integrasi Beranda Mahasiswa di Belakang Feature Flag (Fase G)', () => {
  const dummyRiskEvaluations: StudentRiskEvaluation[] = [
    {
      id: 'eval-1',
      studentId: 'std-1',
      studentName: 'Budi Santoso',
      studentNim: '223510001',
      classId: 'cls-1',
      classTitle: 'Pemrograman Web Lanjut',
      angkatan: 2022,
      riskLevel: 'PERHATIAN',
      score: 65,
      indicators: [
        {
          category: 'KEHADIRAN',
          severity: 'PERHATIAN',
          label: 'Kehadiran Rendah',
          reason: 'Kehadiran di bawah 80%',
          currentValue: '75%',
          threshold: '80%',
        },
      ],
      recommendations: ['Tingkatkan kehadiran pada pertemuan berikutnya.'],
      calculatedAt: new Date().toISOString(),
    },
  ];

  const dummyWeaveData = buildSemesterWeave(
    {
      classes: [
        {
          id: 'cls-1',
          title: 'Pemrograman Web Lanjut',
          section: 'IF-3A',
          status: 'ACTIVE',
        },
      ],
      sessions: [
        {
          id: 's-1',
          class_id: 'cls-1',
          session_number: 1,
          title: 'Pertemuan 1',
          session_date: '2026-09-07',
        },
      ],
      records: [
        { session_id: 's-1', student_id: 'std-1', status: 'HADIR' },
      ],
      assignments: [],
      submissions: [],
    },
    new Date('2026-09-14T10:00:00Z')
  );

  it('1. Dengan feature flag MATI (semesterWeave = null): merender kartu lama dan TIDAK merender Kain Semester', () => {
    const html = renderToString(
      <StudentDashboardClient
        academicStatus={dummyRiskEvaluations}
        semesterWeave={null}
      />
    );

    // Kain semester tidak boleh muncul
    expect(html).not.toContain('aria-label="Kain semester"');
    expect(html).not.toContain('Kain semestermu');

    // Kartu lama StudentAcademicStatusCard harus tetap muncul
    expect(html).toContain('status_akademik_dan_peringatan_dini.card');
    expect(html).toContain('Status Akademik Semester Ini');
  });

  it('2. Dengan feature flag MENYALA (semesterWeave berisi data): merender Kain Semester menggantikan kartu lama', () => {
    const html = renderToString(
      <StudentDashboardClient
        academicStatus={dummyRiskEvaluations}
        semesterWeave={dummyWeaveData}
      />
    );

    // Kain semester harus muncul
    expect(html).toContain('aria-label="Kain semester"');
    expect(html).toContain('Kain semestermu');
    expect(html).toContain('Pemrograman Web Lanjut');

    // Kartu window lama tidak muncul sebagai kartu terpisah melainkan digantikan
    expect(html).not.toContain('status_akademik_dan_peringatan_dini.card');

    // Peringatan dini tetap ada di bawah kain semester
    expect(html).toContain('Status Akademik Memerlukan Perhatian');
  });

  it('3. Memastikan komponen utama beranda (ActionBanner, dsb) tetap utuh', () => {
    const htmlWithFlag = renderToString(
      <StudentDashboardClient
        academicStatus={dummyRiskEvaluations}
        semesterWeave={dummyWeaveData}
      />
    );

    // Banner selamat datang / aksi tetap ada
    expect(htmlWithFlag).toContain('Selamat Datang di SIAJAR');
  });
});
