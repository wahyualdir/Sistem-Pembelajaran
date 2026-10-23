import { describe, it, expect } from 'vitest';
import {
  computeCurrentWeek,
  assignWeek,
  resolveCellState,
  buildSemesterWeave,
  formatWIBDateString,
  diffCalendarDays,
  type RawClass,
  type RawSession,
  type RawRecord,
  type RawAssignment,
  type RawSubmission,
} from '@/lib/akademik/semester-weave';

describe('Logika Murni Kain Semester (Semester Weave)', () => {
  // Tanggal acuan: 2026-10-23T10:00:00+07:00 (WIB)
  const nowWIB = new Date('2026-10-23T03:00:00Z'); // UTC jam 03:00 = WIB jam 10:00

  // 1. Mahasiswa tanpa kelas aktif menghasilkan data kosong dengan rows = []
  it('1. Mahasiswa tanpa kelas aktif menghasilkan data kosong dengan rows = []', () => {
    const result = buildSemesterWeave(
      {
        classes: [],
        sessions: [],
        records: [],
        assignments: [],
        submissions: [],
      },
      nowWIB
    );

    expect(result.rows).toEqual([]);
    expect(result.currentWeek).toBeNull();
    expect(result.summary.missedWeeksCount).toBe(0);
    expect(result.summary.pendingTasksCount).toBe(0);
    expect(result.summary.text).toBe('Semua pekan berjalan sesuai rencana.');
  });

  // 2. Kelas tanpa sesi sama sekali, currentWeek = null, semua sel BELUM/TANPA_SESI, tanpa galat
  it('2. Kelas tanpa sesi sama sekali, currentWeek = null, semua sel BELUM/TANPA_SESI, tanpa galat', () => {
    const rawClass: RawClass = {
      id: 'c1',
      title: 'Algoritma Pemrograman',
      section: 'A',
      status: 'ACTIVE',
    };

    const result = buildSemesterWeave(
      {
        classes: [rawClass],
        sessions: [],
        records: [],
        assignments: [],
        submissions: [],
      },
      nowWIB
    );

    expect(result.currentWeek).toBeNull();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].cells).toHaveLength(16);
    // Bila currentWeek null, aturan 1 menyatakan sel adalah BELUM
    result.rows[0].cells.forEach((cell) => {
      expect(cell.state).toBe('BELUM');
    });
  });

  // Helper untuk setup semester: semester mulai Senin 2026-09-07
  // Pekan 1: 07 Sep - 13 Sep
  // Pekan 2: 14 Sep - 20 Sep
  // Pekan 3: 21 Sep - 27 Sep
  // Pekan 4: 28 Sep - 04 Okt
  // Pekan 5: 05 Okt - 11 Okt
  // Pekan 6: 12 Okt - 18 Okt
  // Pekan 7: 19 Okt - 25 Okt (now: 23 Okt 2026 -> Pekan 7)
  const semesterStart = '2026-09-07';

  // 3. Pekan lampau, HADIR, tanpa tugas, hasilnya LENGKAP
  it('3. Pekan lampau, HADIR, tanpa tugas, hasilnya LENGKAP', () => {
    const state = resolveCellState({
      weekNumber: 3,
      currentWeek: 7,
      hasSession: true,
      attendanceRecord: {
        session_id: 's3',
        student_id: 'me',
        status: 'HADIR',
      },
      tasks: [],
      now: nowWIB,
    });

    expect(state).toBe('LENGKAP');
  });

  // 4. Pekan lampau, TERLAMBAT, hasilnya LENGKAP (terlambat hadir tetap hadir)
  it('4. Pekan lampau, TERLAMBAT, hasilnya LENGKAP (terlambat hadir tetap hadir)', () => {
    const state = resolveCellState({
      weekNumber: 4,
      currentWeek: 7,
      hasSession: true,
      attendanceRecord: {
        session_id: 's4',
        student_id: 'me',
        status: 'TERLAMBAT',
      },
      tasks: [],
      now: nowWIB,
    });

    expect(state).toBe('LENGKAP');
  });

  // 5. Pekan lampau, HADIR, ada tugas lewat tenggat belum dikumpulkan, hasilnya SEBAGIAN
  it('5. Pekan lampau, HADIR, ada tugas lewat tenggat belum dikumpulkan, hasilnya SEBAGIAN', () => {
    const overdueTask = {
      id: 'task-1',
      title: 'Tugas Pekan 3',
      dueAt: '2026-09-25T16:59:00Z', // 23:59 WIB pada pekan 3 (sudah lewat)
      closeAt: '2026-09-25T16:59:00Z',
      isSubmitted: false,
      isLate: false,
      submittedAt: null,
    };

    const state = resolveCellState({
      weekNumber: 3,
      currentWeek: 7,
      hasSession: true,
      attendanceRecord: {
        session_id: 's3',
        student_id: 'me',
        status: 'HADIR',
      },
      tasks: [overdueTask],
      now: nowWIB,
    });

    expect(state).toBe('SEBAGIAN');
  });

  // 6. Pekan lampau, HADIR, tugas dikumpulkan terlambat (is_late = true), hasilnya LENGKAP
  it('6. Pekan lampau, HADIR, tugas dikumpulkan terlambat (is_late = true), hasilnya LENGKAP', () => {
    const lateSubmittedTask = {
      id: 'task-1',
      title: 'Tugas Pekan 3',
      dueAt: '2026-09-25T16:59:00Z',
      closeAt: '2026-09-27T16:59:00Z',
      isSubmitted: true,
      isLate: true,
      submittedAt: '2026-09-26T10:00:00Z',
    };

    const state = resolveCellState({
      weekNumber: 3,
      currentWeek: 7,
      hasSession: true,
      attendanceRecord: {
        session_id: 's3',
        student_id: 'me',
        status: 'HADIR',
      },
      tasks: [lateSubmittedTask],
      now: nowWIB,
    });

    expect(state).toBe('LENGKAP');
  });

  // 7. Pekan lampau, IZIN, hasilnya IZIN (tidak dianggap terlewat)
  it('7. Pekan lampau, IZIN, hasilnya IZIN (tidak dianggap terlewat)', () => {
    const state = resolveCellState({
      weekNumber: 2,
      currentWeek: 7,
      hasSession: true,
      attendanceRecord: {
        session_id: 's2',
        student_id: 'me',
        status: 'IZIN',
      },
      tasks: [],
      now: nowWIB,
    });

    expect(state).toBe('IZIN');
  });

  // 8. Pekan lampau, SAKIT, hasilnya IZIN
  it('8. Pekan lampau, SAKIT, hasilnya IZIN', () => {
    const state = resolveCellState({
      weekNumber: 2,
      currentWeek: 7,
      hasSession: true,
      attendanceRecord: {
        session_id: 's2',
        student_id: 'me',
        status: 'SAKIT',
      },
      tasks: [],
      now: nowWIB,
    });

    expect(state).toBe('IZIN');
  });

  // 9. Pekan lampau, ALPA, hasilnya TERLEWAT
  it('9. Pekan lampau, ALPA, hasilnya TERLEWAT', () => {
    const state = resolveCellState({
      weekNumber: 5,
      currentWeek: 7,
      hasSession: true,
      attendanceRecord: {
        session_id: 's5',
        student_id: 'me',
        status: 'ALPA',
      },
      tasks: [],
      now: nowWIB,
    });

    expect(state).toBe('TERLEWAT');
  });

  // 10. Pekan lampau, sesi ada, tanpa rekaman presensi, hasilnya TERLEWAT
  it('10. Pekan lampau, sesi ada, tanpa rekaman presensi, hasilnya TERLEWAT', () => {
    const state = resolveCellState({
      weekNumber: 5,
      currentWeek: 7,
      hasSession: true,
      attendanceRecord: null,
      tasks: [],
      now: nowWIB,
    });

    expect(state).toBe('TERLEWAT');
  });

  // 11. Pekan lampau, kelas tidak punya sesi di nomor itu, hasilnya TANPA_SESI
  it('11. Pekan lampau, kelas tidak punya sesi di nomor itu, hasilnya TANPA_SESI', () => {
    const state = resolveCellState({
      weekNumber: 5,
      currentWeek: 7,
      hasSession: false,
      attendanceRecord: null,
      tasks: [],
      now: nowWIB,
    });

    expect(state).toBe('TANPA_SESI');
  });

  // 12. Pekan berjalan, hasilnya SEKARANG apa pun isinya
  it('12. Pekan berjalan, hasilnya SEKARANG apa pun isinya', () => {
    const stateWithRecord = resolveCellState({
      weekNumber: 7,
      currentWeek: 7,
      hasSession: true,
      attendanceRecord: {
        session_id: 's7',
        student_id: 'me',
        status: 'HADIR',
      },
      tasks: [],
      now: nowWIB,
    });
    expect(stateWithRecord).toBe('SEKARANG');

    const stateWithoutRecord = resolveCellState({
      weekNumber: 7,
      currentWeek: 7,
      hasSession: false,
      attendanceRecord: null,
      tasks: [],
      now: nowWIB,
    });
    expect(stateWithoutRecord).toBe('SEKARANG');
  });

  // 13. Pekan depan, hasilnya BELUM
  it('13. Pekan depan, hasilnya BELUM', () => {
    const stateWeek8 = resolveCellState({
      weekNumber: 8,
      currentWeek: 7,
      hasSession: true,
      attendanceRecord: null,
      tasks: [],
      now: nowWIB,
    });
    expect(stateWeek8).toBe('BELUM');

    const stateWeek16 = resolveCellState({
      weekNumber: 16,
      currentWeek: 7,
      hasSession: true,
      attendanceRecord: null,
      tasks: [],
      now: nowWIB,
    });
    expect(stateWeek16).toBe('BELUM');
  });

  // 14. Tugas dengan status = 'DRAFT' (milik dosen) tidak dihitung; submission DRAFT mahasiswa tidak dihitung sebagai "dikumpulkan"
  it('14. Tugas dengan status = "DRAFT" (milik dosen) tidak dihitung; submission DRAFT mahasiswa tidak dihitung sebagai "dikumpulkan"', () => {
    const rawClass: RawClass = {
      id: 'c1',
      title: 'Pemrograman Web',
      section: 'IF-3A',
      status: 'ACTIVE',
    };

    const sessions: RawSession[] = [
      { id: 's1', class_id: 'c1', session_number: 1, title: 'Sesi 1', session_date: '2026-09-07' },
      { id: 's2', class_id: 'c1', session_number: 2, title: 'Sesi 2', session_date: '2026-09-14' },
    ];

    const records: RawRecord[] = [
      { session_id: 's1', student_id: 'me', status: 'HADIR' },
      { session_id: 's2', student_id: 'me', status: 'HADIR' },
    ];

    const assignments: RawAssignment[] = [
      // Tugas 1 terbit, tapi mahasiswa hanya punya submission DRAFT -> harus dihitung BELUM dikumpulkan
      { id: 'a1', class_id: 'c1', title: 'Tugas 1', due_at: '2026-09-12T10:00:00Z', close_at: '2026-09-13T10:00:00Z', status: 'PUBLISHED' },
      // Tugas 2 masih DRAFT oleh dosen -> harus diabaikan total
      { id: 'a2', class_id: 'c1', title: 'Tugas 2 Draft', due_at: '2026-09-19T10:00:00Z', close_at: '2026-09-20T10:00:00Z', status: 'DRAFT' },
    ];

    const submissions: RawSubmission[] = [
      { assignment_id: 'a1', student_id: 'me', status: 'DRAFT' }, // status DRAFT tidak boleh dianggap terkumpul
    ];

    const result = buildSemesterWeave(
      {
        classes: [rawClass],
        sessions,
        records,
        assignments,
        submissions,
      },
      nowWIB // now: Pekan 7
    );

    const cell1 = result.rows[0].cells[0]; // Pekan 1
    const cell2 = result.rows[0].cells[1]; // Pekan 2

    // Tugas 1 tidak terhitung dikumpulkan dan due_at sudah lewat -> status sel Pekan 1 jadi SEBAGIAN
    expect(cell1.state).toBe('SEBAGIAN');
    expect(cell1.tasks).toHaveLength(1);
    expect(cell1.tasks[0].isSubmitted).toBe(false);

    // Tugas 2 dosen yang DRAFT diabaikan -> Pekan 2 tanpa tugas valid -> HADIR murni -> LENGKAP
    expect(cell2.state).toBe('LENGKAP');
    expect(cell2.tasks).toHaveLength(0);
  });

  // 15. Tugas jatuh tepat di batas pekan (pukul 23:59 WIB hari ke-7 vs 00:00 hari ke-8) masuk pekan yang benar (uji dengan zona WIB, bukan UTC)
  it('15. Tugas jatuh tepat di batas pekan (pukul 23:59 WIB hari ke-7 vs 00:00 hari ke-8) masuk pekan yang benar (uji dengan zona WIB, bukan UTC)', () => {
    // semesterStart: 2026-09-07 (Senin)
    // Hari ke-7: Minggu 2026-09-13
    // Pukul 23:59:00 WIB (UTC: 2026-09-13T16:59:00Z)
    const taskEndOfWeek1 = '2026-09-13T16:59:00Z';
    const weekEnd1 = assignWeek(taskEndOfWeek1, semesterStart);
    expect(weekEnd1).toBe(1);

    // Hari ke-8: Senin 2026-09-14
    // Pukul 00:00:00 WIB (UTC: 2026-09-13T17:00:00Z)
    const taskStartOfWeek2 = '2026-09-13T17:00:00Z';
    const weekStart2 = assignWeek(taskStartOfWeek2, semesterStart);
    expect(weekStart2).toBe(2);
  });

  // 16. Tugas dengan tenggat sebelum semesterStart masuk pekan 1; setelah pekan 16 masuk pekan 16
  it('16. Tugas dengan tenggat sebelum semesterStart masuk pekan 1; setelah pekan 16 masuk pekan 16', () => {
    // Sebelum semesterStart (misal: Agustus 2026)
    const earlyTask = '2026-08-15T10:00:00Z';
    expect(assignWeek(earlyTask, semesterStart)).toBe(1);

    // Jauh setelah pekan 16 (misal: semester genap tahun berikutnya)
    const lateTask = '2027-02-10T10:00:00Z';
    expect(assignWeek(lateTask, semesterStart)).toBe(16);
  });

  // 17. Kelas dengan enrollments.status != 'ACTIVE' tidak muncul
  it('17. Kelas dengan status != "ACTIVE" atau deleted_at tidak muncul', () => {
    const classes: RawClass[] = [
      { id: 'c1', title: 'Kelas Aktif', section: 'A', status: 'ACTIVE' },
      { id: 'c2', title: 'Kelas Tertutup', section: 'B', status: 'CLOSED' },
      { id: 'c3', title: 'Kelas Dihapus', section: 'C', status: 'ACTIVE', deleted_at: '2026-10-01' },
    ];

    const result = buildSemesterWeave(
      {
        classes,
        sessions: [],
        records: [],
        assignments: [],
        submissions: [],
      },
      nowWIB
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].classId).toBe('c1');
  });

  // 18. Ringkasan: jumlah pekan terlewat dan jumlah tugas menunggu dihitung benar, hanya hingga pekan berjalan
  it('18. Ringkasan: jumlah pekan terlewat dan jumlah tugas menunggu dihitung benar, hanya hingga pekan berjalan', () => {
    const rawClass: RawClass = {
      id: 'c1',
      title: 'Struktur Data',
      section: 'IF-2B',
      status: 'ACTIVE',
    };

    // Buat sesi 1 sampai 10
    const sessions: RawSession[] = [];
    for (let i = 1; i <= 10; i++) {
      const dayOffset = (i - 1) * 7;
      const date = new Date(new Date(semesterStart).getTime() + dayOffset * 24 * 3600 * 1000);
      sessions.push({
        id: `s${i}`,
        class_id: 'c1',
        session_number: i,
        title: `Pertemuan ${i}`,
        session_date: date.toISOString().split('T')[0],
      });
    }

    // Rekaman kehadiran:
    // Pekan 1: HADIR
    // Pekan 2: ALPA (terlewat 1)
    // Pekan 3: HADIR
    // Pekan 4: Tidak ada rekaman (terlewat 2)
    // Pekan 5: HADIR
    // Pekan 6: HADIR
    // Pekan 7: SEKARANG
    // Pekan 8..10: Masa depan (tidak boleh dihitung)
    const records: RawRecord[] = [
      { session_id: 's1', student_id: 'me', status: 'HADIR' },
      { session_id: 's2', student_id: 'me', status: 'ALPA' },
      { session_id: 's3', student_id: 'me', status: 'HADIR' },
      // s4 absen tanpa rekaman
      { session_id: 's5', student_id: 'me', status: 'HADIR' },
      { session_id: 's6', student_id: 'me', status: 'HADIR' },
    ];

    // Tugas:
    // Tugas 1 di pekan 3: sudah dikumpulkan
    // Tugas 2 di pekan 6: belum dikumpulkan (pending 1)
    // Tugas 3 di pekan 7 (sekarang): belum dikumpulkan (pending 2)
    // Tugas 4 di pekan 9 (masa depan): belum dikumpulkan (TIDAK boleh dihitung di ringkasan)
    const assignments: RawAssignment[] = [
      { id: 'a1', class_id: 'c1', title: 'Tugas Pekan 3', due_at: '2026-09-25T10:00:00Z', close_at: '2026-09-26T10:00:00Z', status: 'PUBLISHED' },
      { id: 'a2', class_id: 'c1', title: 'Tugas Pekan 6', due_at: '2026-10-16T10:00:00Z', close_at: '2026-10-17T10:00:00Z', status: 'PUBLISHED' },
      { id: 'a3', class_id: 'c1', title: 'Tugas Pekan 7', due_at: '2026-10-24T10:00:00Z', close_at: '2026-10-25T10:00:00Z', status: 'PUBLISHED' },
      { id: 'a4', class_id: 'c1', title: 'Tugas Pekan 9', due_at: '2026-11-05T10:00:00Z', close_at: '2026-11-06T10:00:00Z', status: 'PUBLISHED' },
    ];

    const submissions: RawSubmission[] = [
      { assignment_id: 'a1', student_id: 'me', status: 'SUBMITTED' },
    ];

    const result = buildSemesterWeave(
      {
        classes: [rawClass],
        sessions,
        records,
        assignments,
        submissions,
      },
      nowWIB // now: Pekan 7
    );

    expect(result.currentWeek).toBe(7);
    // Pekan terlewat: pekan 2 (ALPA) dan pekan 4 (tanpa rekaman) -> total 2
    expect(result.summary.missedWeeksCount).toBe(2);
    // Tugas menunggu: a2 (pekan 6) dan a3 (pekan 7) -> total 2. a4 (pekan 9) tidak dihitung.
    expect(result.summary.pendingTasksCount).toBe(2);
    expect(result.summary.text).toBe('2 pekan terlewat, 2 tugas menunggu.');
  });
});
