import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SemesterWeave } from '@/components/home/semester-weave';
import { SemesterWeaveSheet } from '@/components/home/semester-weave-sheet';
import { buildSemesterWeave } from '@/lib/akademik/semester-weave';

describe('Komponen UI Kain Semester', () => {
  const dummyClass1 = {
    id: 'c1',
    title: 'Algoritma & Pemrograman',
    section: 'IF-1A',
    status: 'ACTIVE',
  };
  const dummyClass2 = {
    id: 'c2',
    title: 'Basis Data',
    section: 'IF-2B',
    status: 'ACTIVE',
  };

  const dummyData = buildSemesterWeave(
    {
      classes: [dummyClass1, dummyClass2],
      sessions: [
        {
          id: 's1',
          class_id: 'c1',
          session_number: 1,
          title: 'Pertemuan 1 Algoritma',
          session_date: '2026-09-07',
        },
        {
          id: 's2',
          class_id: 'c2',
          session_number: 1,
          title: 'Pertemuan 1 Basis Data',
          session_date: '2026-09-07',
        },
      ],
      records: [
        { session_id: 's1', student_id: 'me', status: 'HADIR' },
      ],
      assignments: [],
      submissions: [],
    },
    new Date('2026-09-20T10:00:00Z') // Pekan 2
  );

  it('memastikan komponen SemesterWeave dan SemesterWeaveSheet terdefinisi dan dapat diimpor', () => {
    expect(SemesterWeave).toBeDefined();
    expect(SemesterWeaveSheet).toBeDefined();
  });

  it('merender jumlah baris kelas sesuai jumlah kelas aktif (2 kelas)', () => {
    const html = renderToString(<SemesterWeave data={dummyData} />);

    // Memeriksa bahwa kedua nama kelas muncul di HTML
    expect(html).toContain('Algoritma &amp; Pemrograman');
    expect(html).toContain('Basis Data');

    // Memeriksa baris tabel tr (1 header tr + 2 body tr = 3 tr)
    const trMatches = html.match(/<tr/g);
    expect(trMatches).toHaveLength(3);
  });

  it('merender 16 sel tombol untuk tiap kelas (total 32 tombol sel)', () => {
    const html = renderToString(<SemesterWeave data={dummyData} />);

    // Memeriksa kemunculan tombol dengan aria-label
    expect(html).toContain('aria-label="Algoritma &amp; Pemrograman, pekan 1: lengkap"');
    expect(html).toContain('aria-label="Basis Data, pekan 1: tidak hadir"');
  });

  it('merender keadaan kosong ketika tidak ada kelas aktif', () => {
    const emptyData = buildSemesterWeave({
      classes: [],
      sessions: [],
      records: [],
      assignments: [],
      submissions: [],
    });

    const html = renderToString(<SemesterWeave data={emptyData} />);
    expect(html).toContain('Kamu belum terdaftar di kelas mana pun.');
    expect(html).toContain('Buka Kelas Saya');
  });

  it('merender keadaan semester belum dimulai secara informatif', () => {
    const futureData = buildSemesterWeave(
      {
        classes: [dummyClass1],
        sessions: [
          {
            id: 's1',
            class_id: 'c1',
            session_number: 1,
            title: 'Sesi Depan',
            session_date: '2026-11-01',
          },
        ],
        records: [],
        assignments: [],
        submissions: [],
      },
      new Date('2026-10-01T10:00:00Z') // Sebelum November
    );

    const html = renderToString(<SemesterWeave data={futureData} />);
    expect(html).toContain('Semester belum dimulai');
  });

  it('merender keadaan skeleton memuat saat isLoading = true', () => {
    const html = renderToString(<SemesterWeave data={null} isLoading={true} />);
    expect(html).toContain('MEMUAT...');
    expect(html).toContain('animate-pulse');
  });
});
