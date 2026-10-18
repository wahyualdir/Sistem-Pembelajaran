/**
 * Konfigurasi Poin Gamifikasi SIAJAR (Section 12.3)
 * Nilai poin terpusat di satu berkas konfigurasi.
 */

export const GAMIFICATION_POINTS = {
  ASSIGNMENT_ON_TIME: 10,
  ATTENDANCE_PRESENT: 5,
  MATERIAL_COMPLETED: 3,
  POLL_VOTE: 2,
  QUIZ_VOTE_CORRECT: 3,
} as const;

export interface BadgeDefinition {
  code: string;
  name: string;
  description: string;
  icon: string;
}

export const INITIAL_BADGES: BadgeDefinition[] = [
  {
    code: 'TEPAT_WAKTU',
    name: 'Tepat Waktu',
    description: 'Mengumpulkan 5 tugas berturut-turut sebelum batas tenggat waktu.',
    icon: 'clock',
  },
  {
    code: 'HADIR_PENUH',
    name: 'Hadir Penuh',
    description: 'Hadir pada seluruh pertemuan perkuliahan dalam satu bulan penuh.',
    icon: 'check-circle',
  },
  {
    code: 'TUNTAS_MATERI',
    name: 'Tuntas Materi',
    description: 'Menyelesaikan seluruh modul dan materi pada satu kelas perkuliahan.',
    icon: 'book-open',
  },
  {
    code: 'RAJIN_MEMBACA',
    name: 'Rajin Membaca',
    description: 'Menyelesaikan minimal 20 materi perkuliahan secara mandiri.',
    icon: 'book',
  },
  {
    code: 'PENJAWAB_AKTIF',
    name: 'Penjawab Aktif',
    description: 'Berpartisipasi menjawab 10 polling interaktif di ruang kelas.',
    icon: 'message-circle',
  },
  {
    code: 'SEMINGGU_BERUNTUN',
    name: 'Seminggu Beruntun',
    description: 'Mempertahankan kebiasaan belajar aktif selama 7 hari berturut-turut.',
    icon: 'flame',
  },
  {
    code: 'SEBULAN_BERUNTUN',
    name: 'Sebulan Beruntun',
    description: 'Mempertahankan kebiasaan belajar aktif selama 30 hari berturut-turut.',
    icon: 'award',
  },
];

/**
 * Hitung perubahan streak harian secara deterministik
 */
export function calculateStreak(
  lastActiveDate: string | null,
  currentDate: string,
  currentDays: number,
  bestDays: number
): { currentDays: number; bestDays: number; isConsecutive: boolean } {
  if (!lastActiveDate) {
    return {
      currentDays: 1,
      bestDays: Math.max(bestDays, 1),
      isConsecutive: false,
    };
  }

  const last = new Date(lastActiveDate);
  const cur = new Date(currentDate);
  const diffDays = Math.round((cur.getTime() - last.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 0) {
    // Hari yang sama, streak tidak bertambah
    return { currentDays, bestDays, isConsecutive: true };
  } else if (diffDays === 1) {
    // Hari berturut-turut
    const newCurrent = currentDays + 1;
    return {
      currentDays: newCurrent,
      bestDays: Math.max(bestDays, newCurrent),
      isConsecutive: true,
    };
  } else {
    // Putus, kembali ke 1 hari tanpa pesan menakut-nakuti
    return {
      currentDays: 1,
      bestDays,
      isConsecutive: false,
    };
  }
}
