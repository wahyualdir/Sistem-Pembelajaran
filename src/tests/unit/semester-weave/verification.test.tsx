import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SemesterWeave } from '@/components/home/semester-weave';
import { buildSemesterWeave, type RawClass, type RawSession, type RawRecord, type RawAssignment, type RawSubmission } from '@/lib/akademik/semester-weave';

describe('Fase H: Verifikasi Menyeluruh Fitur Kain Semester', () => {
  const baseStart = '2026-09-07';

  // 1. Verifikasi Akun Baru Tanpa Kelas Aktif
  it('Verifikasi skenario 1: Akun baru tanpa kelas aktif menampilkan keadaan kosong yang jujur', () => {
    const dataEmpty = buildSemesterWeave({
      classes: [],
      sessions: [],
      records: [],
      assignments: [],
      submissions: [],
    });

    const html = renderToString(<SemesterWeave data={dataEmpty} />);
    expect(html).toContain('Kamu belum terdaftar di kelas mana pun.');
    expect(html).toContain('Buka Kelas Saya');
    expect(html).toContain('href="/classes"');
  });

  // 2. Verifikasi Satu Kelas Aktif
  it('Verifikasi skenario 2: Mahasiswa dengan 1 kelas aktif', () => {
    const rawClass: RawClass = {
      id: 'c1',
      title: 'Pemrograman Web Lanjut',
      section: 'A',
      status: 'ACTIVE',
    };
    const sessions: RawSession[] = [
      { id: 's1', class_id: 'c1', session_number: 1, title: 'Pertemuan 1', session_date: baseStart },
    ];
    const records: RawRecord[] = [
      { session_id: 's1', student_id: 'me', status: 'HADIR' },
    ];

    const dataSingle = buildSemesterWeave(
      {
        classes: [rawClass],
        sessions,
        records,
        assignments: [],
        submissions: [],
      },
      new Date('2026-09-14T10:00:00Z')
    );

    const html = renderToString(<SemesterWeave data={dataSingle} />);
    expect(html).toContain('Pemrograman Web Lanjut');
    // Memeriksa ada 16 sel tombol untuk kelas ini
    const buttonMatches = html.match(/aria-label="Pemrograman Web Lanjut, pekan/g);
    expect(buttonMatches).toHaveLength(16);
  });

  // 3. Verifikasi Delapan Kelas Aktif (Skala Penuh Mahasiswa Beban Penuh 24 SKS)
  it('Verifikasi skenario 3: Mahasiswa dengan 8 kelas aktif dirender stabil alfabetis', () => {
    const titles = [
      'Struktur Data',
      'Algoritma',
      'Kecerdasan Buatan',
      'Basis Data',
      'Jaringan Komputer',
      'Rekayasa Perangkat Lunak',
      'Sistem Operasi',
      'Pemrograman Web Lanjut',
    ];

    const classes: RawClass[] = titles.map((t, idx) => ({
      id: `c-${idx}`,
      title: t,
      section: 'IF-3A',
      status: 'ACTIVE',
    }));

    const sessions: RawSession[] = classes.map((c) => ({
      id: `s-${c.id}-1`,
      class_id: c.id,
      session_number: 1,
      title: `Pertemuan 1 ${c.title}`,
      session_date: baseStart,
    }));

    const dataEight = buildSemesterWeave(
      {
        classes,
        sessions,
        records: [],
        assignments: [],
        submissions: [],
      },
      new Date('2026-09-14T10:00:00Z')
    );

    expect(dataEight.rows).toHaveLength(8);
    // Verifikasi pengurutan alfabetis
    const renderedTitles = dataEight.rows.map((r) => r.classTitle);
    const sortedTitles = [...titles].sort((a, b) => a.localeCompare(b, 'id'));
    expect(renderedTitles).toEqual(sortedTitles);

    const html = renderToString(<SemesterWeave data={dataEight} />);
    // Total 8 kelas x 16 sel = 128 tombol sel
    const allButtons = html.match(/<button type="button"/g);
    expect(allButtons).toHaveLength(128);
  });

  // 4. Verifikasi Kelas dengan Sesi Sebagian (Misal baru terisi 3 sesi)
  it('Verifikasi skenario 4: Kelas dengan sesi sebagian (misal 3 pekan pertama ada sesi, sisanya belum dibuat)', () => {
    const rawClass: RawClass = {
      id: 'c1',
      title: 'Workshop Multimedia',
      section: 'A',
      status: 'ACTIVE',
    };
    const sessions: RawSession[] = [
      { id: 's1', class_id: 'c1', session_number: 1, title: 'Sesi 1', session_date: '2026-09-07' },
      { id: 's2', class_id: 'c1', session_number: 2, title: 'Sesi 2', session_date: '2026-09-14' },
      { id: 's3', class_id: 'c1', session_number: 3, title: 'Sesi 3', session_date: '2026-09-21' },
    ];
    const records: RawRecord[] = [
      { session_id: 's1', student_id: 'me', status: 'HADIR' },
      { session_id: 's2', student_id: 'me', status: 'HADIR' },
      { session_id: 's3', student_id: 'me', status: 'HADIR' },
    ];

    // Sekarang Pekan 5
    const dataPartial = buildSemesterWeave(
      {
        classes: [rawClass],
        sessions,
        records,
        assignments: [],
        submissions: [],
      },
      new Date('2026-10-06T10:00:00Z') // Pekan 5
    );

    const cells = dataPartial.rows[0].cells;
    expect(cells[0].state).toBe('LENGKAP'); // Pekan 1
    expect(cells[1].state).toBe('LENGKAP'); // Pekan 2
    expect(cells[2].state).toBe('LENGKAP'); // Pekan 3
    expect(cells[3].state).toBe('TANPA_SESI'); // Pekan 4 (lampau tapi tidak ada sesi dibuat)
    expect(cells[4].state).toBe('SEKARANG'); // Pekan 5 (sekarang)
    expect(cells[5].state).toBe('BELUM'); // Pekan 6 (masa depan)
  });

  // 5. Verifikasi Aksesibilitas ARIA & Semantik Pembaca Layar
  it('Verifikasi skenario 5: Atribut ARIA, peranan semantik table/button, dan teks screen reader', () => {
    const rawClass: RawClass = {
      id: 'c1',
      title: 'Kecerdasan Buatan',
      section: 'A',
      status: 'ACTIVE',
    };
    const sessions: RawSession[] = [
      { id: 's1', class_id: 'c1', session_number: 1, title: 'Pengantar AI', session_date: baseStart },
    ];
    const records: RawRecord[] = [
      { session_id: 's1', student_id: 'me', status: 'HADIR' },
    ];

    const data = buildSemesterWeave(
      {
        classes: [rawClass],
        sessions,
        records,
        assignments: [],
        submissions: [],
      },
      new Date('2026-09-14T10:00:00Z')
    );

    const html = renderToString(<SemesterWeave data={data} />);

    // Memastikan section memiliki aria-label="Kain semester"
    expect(html).toContain('aria-label="Kain semester"');

    // Memastikan tabel memiliki th scope="row" dan th scope="col"
    expect(html).toContain('scope="row"');
    expect(html).toContain('scope="col"');

    // Memastikan teks sr-only untuk pekan non-kunci (pekan 3 bukan kunci dan bukan pekan sekarang)
    expect(html).toContain('class="sr-only">Pekan');

    // Memastikan tombol sel memiliki aria-label eksplisit
    expect(html).toContain('aria-label="Kecerdasan Buatan, pekan 1: lengkap"');
  });

  // 6. Verifikasi Tata Letak Responsif (overflow-x protection)
  it('Verifikasi skenario 6: Pembungkus tabel memiliki overflow-x-auto untuk mencegah gulir horizontal halaman', () => {
    const rawClass: RawClass = {
      id: 'c1',
      title: 'Jaringan Komputer',
      section: 'A',
      status: 'ACTIVE',
    };
    const data = buildSemesterWeave(
      {
        classes: [rawClass],
        sessions: [],
        records: [],
        assignments: [],
        submissions: [],
      },
      new Date('2026-09-14T10:00:00Z')
    );

    const html = renderToString(<SemesterWeave data={data} />);
    expect(html).toContain('overflow-x-auto');
  });
});
