/**
 * Modul Logika Murni Kisi "Kain Semester" Mahasiswa
 * Bahasa antarmuka, komentar, dan label: Bahasa Indonesia.
 * Tidak melakukan I/O dan tidak memanggil Date.now() langsung (menerima parameter `now`).
 */

export type WeaveCellState =
  | 'LENGKAP'
  | 'SEBAGIAN'
  | 'IZIN'
  | 'TERLEWAT'
  | 'TANPA_SESI'
  | 'BELUM'
  | 'SEKARANG';

export interface RawClass {
  id: string;
  title: string;
  section: string;
  status: string;
  deleted_at?: string | null;
}

export interface RawSession {
  id: string;
  class_id: string;
  session_number: number;
  title: string;
  session_date: string; // YYYY-MM-DD
  is_open?: boolean;
}

export interface RawRecord {
  id?: string;
  session_id: string;
  student_id: string;
  status: 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALPA' | string;
  check_in_at?: string | null;
  is_late?: boolean;
}

export interface RawAssignment {
  id: string;
  class_id: string;
  title: string;
  due_at: string;
  close_at: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | string;
}

export interface RawSubmission {
  id?: string;
  assignment_id: string;
  student_id: string;
  status: 'DRAFT' | 'SUBMITTED' | 'RETURNED' | 'REVIEWED' | 'GRADED' | string;
  submitted_at?: string;
  is_late?: boolean;
}

export interface WeaveTaskDetail {
  id: string;
  title: string;
  dueAt: string;
  closeAt: string;
  isSubmitted: boolean;
  isLate: boolean;
  submittedAt: string | null;
}

export interface WeaveCell {
  weekNumber: number; // 1..16
  state: WeaveCellState;
  sessionTitle?: string;
  sessionDate?: string; // YYYY-MM-DD
  attendanceStatus?: 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALPA' | null;
  checkInAt?: string | null;
  tasks: WeaveTaskDetail[];
  ariaLabel: string;
}

export interface WeaveRow {
  classId: string;
  classTitle: string;
  section: string;
  cells: WeaveCell[]; // 16 sel
}

export interface SemesterWeaveSummary {
  missedWeeksCount: number;
  pendingTasksCount: number;
  text: string;
}

export interface SemesterWeaveData {
  currentWeek: number | null; // 1..16, atau 0 bila belum mulai, atau null
  totalWeeks: number; // Selalu 16
  semesterStart: string | null; // YYYY-MM-DD
  rows: WeaveRow[];
  summary: SemesterWeaveSummary;
}

export interface BuildSemesterWeaveInput {
  classes: RawClass[];
  sessions: RawSession[];
  records: RawRecord[];
  assignments: RawAssignment[];
  submissions: RawSubmission[];
}

/**
 * Konversi waktu Date / ISO ke format tanggal kalender WIB (Asia/Jakarta, UTC+7): YYYY-MM-DD.
 */
export function formatWIBDateString(dateInput: Date | string | number): string {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return '';
  }
  // Intl en-CA menghasilkan format YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

/**
 * Hitung selisih hari kalender (dateA - dateB) dalam format YYYY-MM-DD.
 */
export function diffCalendarDays(dateStrA: string, dateStrB: string): number {
  const [yA, mA, dA] = dateStrA.split('-').map(Number);
  const [yB, mB, dB] = dateStrB.split('-').map(Number);
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.floor((utcA - utcB) / (24 * 60 * 60 * 1000));
}

/**
 * Menentukan pekan sekarang dan tanggal mulai semester.
 * Sesuai Bagian 5.2 INSTRUKSI_KAIN_SEMESTER.md:
 * - Utama: `semesterStart` = `session_date` terkecil dari seluruh sesi bernomor 1 (`session_number = 1`).
 *   `week = Math.floor((hariIniWIB - semesterStart) / 7) + 1`, dijepit ke 1..16.
 *   Bila `hariIniWIB < semesterStart`: `week = 0` (semester belum mulai).
 * - Cadangan (bila tidak ada sesi nomor 1):
 *   `week` = nomor sesi terbesar yang `session_date <= hariIniWIB`.
 *   Bila tidak ada sama sekali: `week = null`, `semesterStart = null`.
 */
export function computeCurrentWeek(
  sessions: RawSession[],
  now: Date
): { week: number | null; semesterStart: string | null } {
  if (!sessions || sessions.length === 0) {
    return { week: null, semesterStart: null };
  }

  const todayWIB = formatWIBDateString(now);
  const firstSessions = sessions.filter((s) => s.session_number === 1 && Boolean(s.session_date));

  if (firstSessions.length > 0) {
    // Cari tanggal terkecil dari sesi nomor 1
    const dates = firstSessions.map((s) => s.session_date.slice(0, 10)).sort();
    const semesterStart = dates[0];

    const diffDays = diffCalendarDays(todayWIB, semesterStart);
    if (diffDays < 0) {
      // Hari ini sebelum hari perkuliahan pekan 1
      return { week: 0, semesterStart };
    }

    const calculatedWeek = Math.floor(diffDays / 7) + 1;
    const clampedWeek = Math.min(Math.max(calculatedWeek, 1), 16);
    return { week: clampedWeek, semesterStart };
  }

  // Cadangan: tidak ada sesi nomor 1
  const pastSessions = sessions
    .filter((s) => s.session_date && s.session_date.slice(0, 10) <= todayWIB)
    .sort((a, b) => b.session_number - a.session_number);

  if (pastSessions.length > 0) {
    const fallbackWeek = Math.min(Math.max(pastSessions[0].session_number, 1), 16);
    return { week: fallbackWeek, semesterStart: null };
  }

  // Jika semua sesi di masa depan atau tidak ada tanggal
  const futureSessions = sessions
    .filter((s) => s.session_date && s.session_date.slice(0, 10) > todayWIB)
    .sort((a, b) => a.session_number - b.session_number);

  if (futureSessions.length > 0) {
    // Sesi ada tetapi semuanya di masa depan -> semester belum mulai
    return { week: 0, semesterStart: futureSessions[0].session_date.slice(0, 10) };
  }

  return { week: null, semesterStart: null };
}

/**
 * Memetakan tenggat tugas (due_at) ke nomor pekan (1 sampai 16).
 * Sesuai Bagian 5.4:
 * `floor((tanggalWIB(due_at) - semesterStart) / 7) + 1`, dijepit 1..16.
 */
export function assignWeek(dueAtISO: string, semesterStart: string | null): number {
  if (!dueAtISO) return 1;
  const dueWIB = formatWIBDateString(dueAtISO);
  if (!semesterStart) {
    return 1;
  }

  const diffDays = diffCalendarDays(dueWIB, semesterStart);
  if (diffDays < 0) {
    return 1;
  }

  const calculatedWeek = Math.floor(diffDays / 7) + 1;
  if (calculatedWeek < 1) return 1;
  if (calculatedWeek > 16) return 16;
  return calculatedWeek;
}

/**
 * Resolusi status sel kisi semester berdasarkan tabel keputusan Bagian 5.4.
 * Evaluasi berurutan:
 * 1. W kosong atau n > W -> BELUM
 * 2. n == W -> SEKARANG
 * 3. n < W dan kelas tak punya sesi nomor n -> TANPA_SESI
 * 4. Rekaman ALPA, atau sesi ada tetapi tak ada rekaman -> TERLEWAT
 * 5. Rekaman IZIN atau SAKIT -> IZIN
 * 6. Rekaman HADIR atau TERLAMBAT, dan ada tugas pekan itu yang sudah lewat tenggat tanpa pengumpulan -> SEBAGIAN
 * 7. Rekaman HADIR atau TERLAMBAT -> LENGKAP
 */
export function resolveCellState(params: {
  weekNumber: number; // n
  currentWeek: number | null; // W
  hasSession: boolean;
  attendanceRecord?: RawRecord | null;
  tasks: WeaveTaskDetail[];
  now: Date;
}): WeaveCellState {
  const { weekNumber: n, currentWeek: W, hasSession, attendanceRecord, tasks, now } = params;

  // Aturan 1: W kosong (null / 0) atau n > W
  if (W === null || W === 0 || n > W) {
    return 'BELUM';
  }

  // Aturan 2: n == W (pekan berjalan)
  if (n === W) {
    return 'SEKARANG';
  }

  // Aturan 3: n < W dan kelas tak punya sesi nomor n
  if (!hasSession) {
    return 'TANPA_SESI';
  }

  const status = attendanceRecord?.status?.toUpperCase();

  // Aturan 4: Rekaman ALPA atau sesi ada tetapi tanpa rekaman
  if (!attendanceRecord || status === 'ALPA') {
    return 'TERLEWAT';
  }

  // Aturan 5: Rekaman IZIN atau SAKIT
  if (status === 'IZIN' || status === 'SAKIT') {
    return 'IZIN';
  }

  // Aturan 6 & 7: Rekaman HADIR atau TERLAMBAT
  if (status === 'HADIR' || status === 'TERLAMBAT') {
    // Periksa apakah ada tugas pekan itu yang sudah lewat tenggat dan belum dikumpulkan
    const nowTime = now.getTime();
    const hasUnsubmittedOverdueTask = tasks.some((t) => {
      if (t.isSubmitted) return false;
      const dueTime = new Date(t.dueAt).getTime();
      const closeTime = t.closeAt ? new Date(t.closeAt).getTime() : dueTime;
      // Tenggat atau batas pengumpulan sudah lewat
      return nowTime >= dueTime || nowTime >= closeTime;
    });

    if (hasUnsubmittedOverdueTask) {
      return 'SEBAGIAN';
    }

    return 'LENGKAP';
  }

  // Fallback defensif
  return 'TERLEWAT';
}

/**
 * Bangun teks ringkasan netral (Bagian 5.5).
 */
export function buildWeaveSummaryText(missedWeeksCount: number, pendingTasksCount: number): string {
  if (missedWeeksCount === 0 && pendingTasksCount === 0) {
    return 'Semua pekan berjalan sesuai rencana.';
  }

  const parts: string[] = [];
  if (missedWeeksCount > 0) {
    parts.push(`${missedWeeksCount} pekan terlewat`);
  }
  if (pendingTasksCount > 0) {
    parts.push(`${pendingTasksCount} tugas menunggu`);
  }

  return `${parts.join(', ')}.`;
}

/**
 * Buat label ARIA yang deskriptif dan aksesibel untuk sel kisi.
 */
function buildCellAriaLabel(params: {
  classTitle: string;
  weekNumber: number;
  state: WeaveCellState;
  attendanceStatus?: string | null;
  tasks: WeaveTaskDetail[];
}): string {
  const { classTitle, weekNumber, state, tasks } = params;

  let stateDescription = '';
  switch (state) {
    case 'LENGKAP':
      stateDescription = 'lengkap';
      break;
    case 'SEBAGIAN':
      stateDescription = 'hadir, tugas belum masuk';
      break;
    case 'IZIN':
      stateDescription = 'izin atau sakit';
      break;
    case 'TERLEWAT':
      stateDescription = 'tidak hadir';
      break;
    case 'TANPA_SESI':
      stateDescription = 'tidak ada pertemuan';
      break;
    case 'BELUM':
      stateDescription = 'pekan belum tiba';
      break;
    case 'SEKARANG':
      stateDescription = 'pekan ini';
      break;
  }

  const unsubmittedTasks = tasks.filter((t) => !t.isSubmitted);
  let taskPart = '';
  if (unsubmittedTasks.length > 0) {
    taskPart = `, ${unsubmittedTasks.length} tugas belum dikumpulkan`;
  }

  return `${classTitle}, pekan ${weekNumber}: ${stateDescription}${taskPart}`;
}

/**
 * Fungsi Utama: Bangun seluruh data Kain Semester (SemesterWeaveData) secara deterministik.
 */
export function buildSemesterWeave(
  input: BuildSemesterWeaveInput,
  now: Date = new Date()
): SemesterWeaveData {
  const { classes = [], sessions = [], records = [], assignments = [], submissions = [] } = input;

  // Filter kelas aktif dan tidak terhapus
  const activeClasses = classes
    .filter((c) => c && c.status === 'ACTIVE' && !c.deleted_at)
    .sort((a, b) => a.title.localeCompare(b.title, 'id'));

  if (activeClasses.length === 0) {
    return {
      currentWeek: null,
      totalWeeks: 16,
      semesterStart: null,
      rows: [],
      summary: {
        missedWeeksCount: 0,
        pendingTasksCount: 0,
        text: 'Semua pekan berjalan sesuai rencana.',
      },
    };
  }

  const activeClassIds = new Set(activeClasses.map((c) => c.id));
  const relevantSessions = sessions.filter((s) => activeClassIds.has(s.class_id));

  // Tentukan pekan sekarang & tanggal mulai semester
  const { week: currentWeek, semesterStart } = computeCurrentWeek(relevantSessions, now);

  // Buat indeks sesi: Map<`${class_id}:${session_number}`, RawSession>
  const sessionMap = new Map<string, RawSession>();
  for (const s of relevantSessions) {
    sessionMap.set(`${s.class_id}:${s.session_number}`, s);
  }

  // Buat indeks rekaman presensi: Map<session_id, RawRecord>
  const recordMap = new Map<string, RawRecord>();
  for (const r of records) {
    recordMap.set(r.session_id, r);
  }

  // Indeks pengumpulan mahasiswa: Map<assignment_id, RawSubmission> (abaikan DRAFT)
  const submissionMap = new Map<string, RawSubmission>();
  for (const sub of submissions) {
    if (sub.status && sub.status.toUpperCase() !== 'DRAFT') {
      submissionMap.set(sub.assignment_id, sub);
    }
  }

  // Filter tugas: hanya terbit/ditutup (abaikan DRAFT dosen) dan kelas aktif
  const validAssignments = assignments.filter(
    (a) => activeClassIds.has(a.class_id) && a.status && a.status.toUpperCase() !== 'DRAFT'
  );

  // Kelompokkan tugas ke pekan: Map<`${class_id}:${week}`, WeaveTaskDetail[]>
  const classWeekTasksMap = new Map<string, WeaveTaskDetail[]>();
  for (const a of validAssignments) {
    const taskWeek = assignWeek(a.due_at, semesterStart);
    const key = `${a.class_id}:${taskWeek}`;
    const sub = submissionMap.get(a.id);

    const taskDetail: WeaveTaskDetail = {
      id: a.id,
      title: a.title,
      dueAt: a.due_at,
      closeAt: a.close_at,
      isSubmitted: Boolean(sub),
      isLate: Boolean(sub?.is_late),
      submittedAt: sub?.submitted_at || null,
    };

    const existing = classWeekTasksMap.get(key) || [];
    existing.push(taskDetail);
    classWeekTasksMap.set(key, existing);
  }

  // Susun 16 sel untuk tiap baris kelas
  let totalMissedWeeks = 0;
  let totalPendingTasks = 0;
  const rows: WeaveRow[] = [];

  for (const cls of activeClasses) {
    const cells: WeaveCell[] = [];

    for (let w = 1; w <= 16; w++) {
      const sess = sessionMap.get(`${cls.id}:${w}`);
      const rec = sess ? recordMap.get(sess.id) : undefined;
      const tasks = classWeekTasksMap.get(`${cls.id}:${w}`) || [];

      const state = resolveCellState({
        weekNumber: w,
        currentWeek,
        hasSession: Boolean(sess),
        attendanceRecord: rec,
        tasks,
        now,
      });

      // Hitung ringkasan hanya hingga pekan berjalan (w <= currentWeek)
      if (currentWeek !== null && currentWeek > 0 && w <= currentWeek) {
        if (state === 'TERLEWAT') {
          totalMissedWeeks++;
        }
        for (const t of tasks) {
          if (!t.isSubmitted) {
            totalPendingTasks++;
          }
        }
      }

      const ariaLabel = buildCellAriaLabel({
        classTitle: cls.title,
        weekNumber: w,
        state,
        attendanceStatus: rec?.status,
        tasks,
      });

      cells.push({
        weekNumber: w,
        state,
        sessionTitle: sess?.title,
        sessionDate: sess?.session_date ? sess.session_date.slice(0, 10) : undefined,
        attendanceStatus: (rec?.status as any) || null,
        checkInAt: rec?.check_in_at || null,
        tasks,
        ariaLabel,
      });
    }

    rows.push({
      classId: cls.id,
      classTitle: cls.title,
      section: cls.section,
      cells,
    });
  }

  const summaryText = buildWeaveSummaryText(totalMissedWeeks, totalPendingTasks);

  return {
    currentWeek,
    totalWeeks: 16,
    semesterStart,
    rows,
    summary: {
      missedWeeksCount: totalMissedWeeks,
      pendingTasksCount: totalPendingTasks,
      text: summaryText,
    },
  };
}
