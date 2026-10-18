/**
 * Prioritas Hari Ini (Daily Priorities)
 * Spesifikasi: docs/INSTRUKSI_PETA_PULAU.md Bagian 7.5
 * Sistem berbasis aturan deterministik transparan (tanpa AI), dihitung dalam zona waktu WIB.
 */

export interface PriorityAssignment {
  id: string;
  classId: string;
  className: string;
  title: string;
  effectiveDueDate: Date;
  hasSubmission: boolean;
  isOverdue: boolean;
  canSubmitLate: boolean;
}

export interface PriorityExam {
  id: string;
  classId: string;
  className: string;
  title: string;
  isOpenToday: boolean;
  isWeighted: boolean;
  dueDate?: Date;
}

export interface PriorityChapter {
  id: string;
  classId: string;
  className: string;
  title: string;
  isCompleted: boolean;
  isUnlocked: boolean;
  targetDate?: Date;
  bestScore?: number;
  passScore: number;
  attemptsCount: number;
  hasStarted: boolean;
}

export interface DailyPrioritiesInput {
  assignments: PriorityAssignment[];
  exams: PriorityExam[];
  chapters: PriorityChapter[];
  cardsDueCount: number;
  dismissedItemKeys?: string[];
}

export interface DailyPriorityItem {
  key: string;
  score: number;
  title: string;
  reason: string;
  actionLabel: string;
  actionHref: string;
  className?: string;
  dueDate?: Date;
}

/**
 * Konversi tanggal ke awal hari zona WIB (UTC+7)
 */
export function getWibDateString(date: Date = new Date()): string {
  // Offset WIB = +7 jam
  const wibTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return wibTime.toISOString().split('T')[0];
}

/**
 * Fungsi murni untuk menghitung daftar butir prioritas hari ini bagi mahasiswa.
 * Menghasilkan maksimal 5 butir dengan skor tertinggi, urutan tie-break jelas.
 */
export function buildDailyPriorities(
  input: DailyPrioritiesInput,
  now: Date = new Date()
): DailyPriorityItem[] {
  const dismissedSet = new Set(input.dismissedItemKeys || []);
  const candidates: DailyPriorityItem[] = [];

  const nowMs = now.getTime();
  const todayWib = getWibDateString(now);

  // 1. Ujian atau kuis berbobot yang dibuka hari ini (Skor 120)
  for (const exam of input.exams || []) {
    if (exam.isOpenToday && exam.isWeighted) {
      candidates.push({
        key: `ujian:${exam.id}`,
        score: 120,
        title: exam.title,
        reason: 'Ujian berbobot dibuka hari ini.',
        actionLabel: 'Mulai Ujian',
        actionHref: `/exams`,
        className: exam.className,
        dueDate: exam.dueDate,
      });
    }
  }

  // 2. Tugas dan tenggat waktu
  for (const ass of input.assignments || []) {
    if (ass.hasSubmission && !ass.isOverdue) {
      continue; // Sudah dikumpulkan tepat waktu
    }

    const dueMs = ass.effectiveDueDate.getTime();
    const diffHours = (dueMs - nowMs) / (1000 * 60 * 60);

    // Tugas terlambat tetapi masih bisa dikumpulkan (Skor 90)
    if (ass.isOverdue && ass.canSubmitLate && !ass.hasSubmission) {
      candidates.push({
        key: `tugas:${ass.id}`,
        score: 90,
        title: ass.title,
        reason: 'Terlambat, masih bisa dikumpulkan. Penalti berjalan.',
        actionLabel: 'Kumpulkan Tugas',
        actionHref: `/classes/${ass.classId}`,
        className: ass.className,
        dueDate: ass.effectiveDueDate,
      });
      continue;
    }

    // Tugas belum dikumpulkan dalam rentang tenggat
    if (!ass.isOverdue && !ass.hasSubmission) {
      let baseScore = 0;
      let reasonText = '';

      if (diffHours >= 0 && diffHours <= 24) {
        baseScore = 100;
        const hoursLeft = Math.max(1, Math.ceil(diffHours));
        reasonText = `Tenggat waktu dalam ${hoursLeft} jam ke depan.`;
      } else if (diffHours > 24 && diffHours <= 48) {
        baseScore = 80;
        reasonText = 'Tenggat waktu besok.';
      } else if (diffHours > 48 && diffHours <= 72) {
        baseScore = 60;
        reasonText = 'Tenggat waktu 3 hari lagi.';
      } else if (diffHours > 72 && diffHours <= 24 * 7) {
        baseScore = 40;
        reasonText = 'Tenggat waktu minggu ini.';
      }

      if (baseScore > 0) {
        // Tambah 10 poin bila belum ada pengumpulan sama sekali
        const finalScore = baseScore + 10;
        candidates.push({
          key: `tugas:${ass.id}`,
          score: finalScore,
          title: ass.title,
          reason: reasonText,
          actionLabel: 'Kumpulkan Tugas',
          actionHref: `/classes/${ass.classId}`,
          className: ass.className,
          dueDate: ass.effectiveDueDate,
        });
      }
    }
  }

  // 3. Bab target tanggal dan kuis bab
  for (const chap of input.chapters || []) {
    if (chap.isCompleted) {
      continue;
    }

    // Target tanggal bab sudah lewat dan bab belum selesai (Skor 70)
    if (chap.targetDate) {
      const targetWib = getWibDateString(chap.targetDate);
      if (targetWib < todayWib) {
        candidates.push({
          key: `bab:${chap.id}`,
          score: 70,
          title: chap.title,
          reason: 'Target tanggal bab sudah lewat.',
          actionLabel: 'Lanjutkan Bab',
          actionHref: `/classes/${chap.classId}`,
          className: chap.className,
          dueDate: chap.targetDate,
        });
        continue;
      }
    }

    // Kuis bab pernah dicoba tetapi belum lulus pada pulau terbuka (Skor 50)
    if (chap.isUnlocked && chap.attemptsCount > 0) {
      const best = chap.bestScore ?? 0;
      candidates.push({
        key: `kuis_bab:${chap.id}`,
        score: 50,
        title: `Kuis ${chap.title}`,
        reason: `Skor terbaik ${best}, perlu ${chap.passScore}.`,
        actionLabel: 'Coba Kuis Lagi',
        actionHref: `/classes/${chap.classId}`,
        className: chap.className,
      });
      continue;
    }

    // Lanjutkan pulau terbuka yang belum dimulai (Skor 40)
    if (chap.isUnlocked && !chap.hasStarted && chap.attemptsCount === 0) {
      candidates.push({
        key: `bab_baru:${chap.id}`,
        score: 40,
        title: chap.title,
        reason: 'Pulau terbuka belum dimulai.',
        actionLabel: 'Mulai Belajar',
        actionHref: `/classes/${chap.classId}`,
        className: chap.className,
      });
    }
  }

  // 4. Kartu flashcard jatuh tempo
  const count = input.cardsDueCount || 0;
  if (count > 0) {
    let cardScore = 0;
    if (count >= 30) cardScore = 65;
    else if (count >= 10) cardScore = 55;
    else cardScore = 45;

    // Perkiraan waktu: N x 20 detik dibulatkan ke atas dalam menit
    const minutesEst = Math.max(1, Math.ceil((count * 20) / 60));

    candidates.push({
      key: 'flashcards:due',
      score: cardScore,
      title: `Ulas ${count} kartu (sekitar ${minutesEst} menit)`,
      reason: 'Jadwal ulasan pengulangan berjarak hari ini.',
      actionLabel: 'Mulai Latihan',
      actionHref: '/flashcards',
    });
  }

  // 5. Filter butir yang telah disembunyikan mahasiswa hari ini
  const activeCandidates = candidates.filter((item) => !dismissedSet.has(item.key));

  // 6. Urutkan: Skor menurun -> Tenggat paling awal -> Nama kelas
  activeCandidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Seri diselesaikan dengan tenggat paling awal
    if (a.dueDate && b.dueDate) {
      const diffDue = a.dueDate.getTime() - b.dueDate.getTime();
      if (diffDue !== 0) return diffDue;
    } else if (a.dueDate && !b.dueDate) {
      return -1; // Yang memiliki tenggat diprioritaskan
    } else if (!a.dueDate && b.dueDate) {
      return 1;
    }

    // Seri selanjutnya diselesaikan dengan nama kelas alfabetis
    const classA = a.className || '';
    const classB = b.className || '';
    return classA.localeCompare(classB, 'id');
  });

  // Maksimal 5 butir
  return activeCandidates.slice(0, 5);
}
