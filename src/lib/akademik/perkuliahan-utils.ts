/**
 * Utilitas Murni Perkuliahan & Kehadiran (SIAJAR Fase 3)
 * Menangani validasi host kuliah daring, aturan keterlambatan berita acara,
 * perhitungan persentase kehadiran (3 mode), jendela izin, dan penguncian materi.
 */

export const DEFAULT_MEETING_HOSTS = [
  'meet.google.com',
  'zoom.us',
  'teams.microsoft.com',
  'teams.live.com',
  'meet.jit.si',
];

export const DEFAULT_RECORDING_HOSTS = [
  ...DEFAULT_MEETING_HOSTS,
  'youtube.com',
  'youtu.be',
  'drive.google.com',
];

/**
 * Memvalidasi apakah URL pertemuan / rekaman memiliki host terdaftar dan memakai HTTPS.
 */
export function isValidMeetingHost(
  rawUrl: string,
  isRecording: boolean = false,
  customAllowedHosts?: string[]
): { valid: boolean; error?: string } {
  if (!rawUrl || !rawUrl.trim()) {
    return { valid: false, error: 'URL tidak boleh kosong.' };
  }

  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL harus menggunakan protokol HTTPS aman.' };
    }

    const host = parsed.hostname.toLowerCase();
    const allowed = customAllowedHosts && customAllowedHosts.length > 0
      ? customAllowedHosts.map((h) => h.toLowerCase())
      : (isRecording ? DEFAULT_RECORDING_HOSTS : DEFAULT_MEETING_HOSTS);

    const matches = allowed.some((allowedHost) => {
      if (allowedHost.startsWith('*.')) {
        const rootDomain = allowedHost.slice(2);
        return host === rootDomain || host.endsWith(`.${rootDomain}`);
      }
      return host === allowedHost || host.endsWith(`.${allowedHost}`);
    });

    if (!matches) {
      return {
        valid: false,
        error: 'Alamat ini belum diizinkan. Minta admin menambahkannya di Integrasi.',
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Format URL tidak valid.' };
  }
}

/**
 * Memeriksa apakah tombol Gabung Kuliah Daring aktif berdasarkan jendela waktu.
 * Aktif mulai `windowMinutes` sebelum `startTime` sampai `endTime`.
 */
export function isMeetingJoinActive(
  sessionDate: string,
  startTime: string,
  endTime: string,
  windowMinutes: number = 15,
  now: Date = new Date()
): { active: boolean; reason?: string } {
  try {
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    const dateParts = sessionDate.split('-').map(Number);

    const year = dateParts[0];
    const month = (dateParts[1] || 1) - 1;
    const day = dateParts[2] || 1;

    const sessionStart = new Date(year, month, day, startParts[0] || 0, startParts[1] || 0, 0, 0);
    const sessionEnd = new Date(year, month, day, endParts[0] || 0, endParts[1] || 0, 0, 0);

    const openTime = new Date(sessionStart.getTime() - windowMinutes * 60 * 1000);

    if (now.getTime() < openTime.getTime()) {
      const diffMinutes = Math.ceil((openTime.getTime() - now.getTime()) / (60 * 1000));
      return {
        active: false,
        reason: `Tombol aktif ${diffMinutes} menit sebelum perkuliahan dimulai.`,
      };
    }

    if (now.getTime() > sessionEnd.getTime()) {
      return {
        active: false,
        reason: 'Sesi perkuliahan telah berakhir.',
      };
    }

    return { active: true };
  } catch {
    return { active: false, reason: 'Format jadwal tidak valid.' };
  }
}

/**
 * Validasi rentang tanggal izin dan sakit:
 * - Maksimal 14 hari kalender
 * - Tanggal mulai tidak boleh mundur lebih dari `maxBackdateDays` (bawaan 7)
 */
export function validateAbsenceDates(
  startDateStr: string,
  endDateStr: string,
  maxBackdateDays: number = 7,
  maxRangeDays: number = 14,
  now: Date = new Date()
): { valid: boolean; error?: string } {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Format tanggal tidak valid.' };
  }

  if (end.getTime() < start.getTime()) {
    return { valid: false, error: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.' };
  }

  // Cek selisih hari rentang (inklusif)
  const diffDays = Math.floor((end.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1;
  if (diffDays > maxRangeDays) {
    return {
      valid: false,
      error: `Rentang izin maksimal ${maxRangeDays} hari kalender. Anda memilih ${diffDays} hari.`,
    };
  }

  // Cek batas mundur tanggal mulai (backdate)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minAllowedStart = new Date(today.getTime() - maxBackdateDays * 24 * 3600 * 1000);

  if (start.getTime() < minAllowedStart.getTime()) {
    return {
      valid: false,
      error: `Tanggal mulai tidak boleh lebih dari ${maxBackdateDays} hari yang lalu.`,
    };
  }

  return { valid: true };
}

/**
 * Menghitung persentase kehadiran mahasiswa berdasarkan mode kebijakan:
 * - 'exclude': izin & sakit dikeluarkan dari pembagi (bawaan)
 * - 'present': izin & sakit dihitung hadir
 * - 'absent': izin & sakit dihitung tidak hadir
 */
export function calcAttendancePercent(counts: {
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpa: number;
  mode?: 'exclude' | 'present' | 'absent';
}): number {
  const { hadir, terlambat, izin, sakit, alpa, mode = 'exclude' } = counts;
  const total = hadir + terlambat + izin + sakit + alpa;

  if (total === 0) return 100;

  let numerator = 0;
  let denominator = total;

  if (mode === 'present') {
    numerator = hadir + terlambat + izin + sakit;
    denominator = total;
  } else if (mode === 'absent') {
    numerator = hadir + terlambat;
    denominator = total;
  } else {
    // Mode 'exclude' (bawaan)
    numerator = hadir + terlambat;
    denominator = total - (izin + sakit);
  }

  if (denominator <= 0) return 100;

  const percent = (numerator / denominator) * 100;
  return Math.round(percent * 100) / 100;
}

/**
 * Memeriksa apakah pengisian berita acara terlambat:
 * Terlambat jika difinalkan lebih dari `deadlineDays` (bawaan 3) setelah `heldOn`.
 */
export function isJournalLate(
  heldOnStr: string,
  finalizedAtStr: string | Date,
  deadlineDays: number = 3
): boolean {
  const parts = heldOnStr.split('-').map(Number);
  const heldOn = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1, 23, 59, 59, 999);
  const finalizedAt = new Date(finalizedAtStr);

  const deadline = new Date(heldOn.getTime() + deadlineDays * 24 * 3600 * 1000);
  return finalizedAt.getTime() > deadline.getTime();
}

/**
 * Memeriksa apakah materi tertentu terbuka bagi mahasiswa:
 * Jika `unlockAfterMaterialId` terisi dan `requireCompletion = true`,
 * materi prasyarat harus sudah berstatus 'selesai'.
 */
export function isMaterialUnlocked(params: {
  unlockAfterMaterialId?: string | null;
  requireCompletion?: boolean;
  completedMaterialIds: Set<string>;
  previousMaterialTitle?: string;
}): { unlocked: boolean; message?: string } {
  const { unlockAfterMaterialId, requireCompletion, completedMaterialIds, previousMaterialTitle } = params;

  if (!unlockAfterMaterialId || !requireCompletion) {
    return { unlocked: true };
  }

  const isPreviousCompleted = completedMaterialIds.has(unlockAfterMaterialId);
  if (!isPreviousCompleted) {
    const title = previousMaterialTitle || 'materi sebelumnya';
    return {
      unlocked: false,
      message: `Selesaikan '${title}' dulu untuk membuka materi ini.`,
    };
  }

  return { unlocked: true };
}
