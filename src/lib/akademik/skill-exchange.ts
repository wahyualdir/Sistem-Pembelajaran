/**
 * Modul Pembantu Tukar Keahlian (Skill Exchange)
 * Spesifikasi: docs/INSTRUKSI_PETA_PULAU.md Bagian 9.1
 * Aturan: hanya antarmahasiswa sekelas, opt-in, tanpa pesan pribadi, tanpa link eksternal, blackout saat ujian.
 */

/**
 * Sanitasi konten pertanyaan atau jawaban tukar keahlian.
 * Menolak tautan eksternal (URL) dan markup berbahaya untuk mencegah pembocoran jawaban.
 */
export function sanitizeSkillExchangeContent(text: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Konten tidak boleh kosong.',
    };
  }

  const trimmed = text.trim();

  // Pola deteksi tautan eksternal (http, https, www, domain extensions)
  const urlPattern = /(https?:\/\/|www\.|\.com\b|\.id\b|\.edu\b|\.net\b|\.org\b)/i;
  if (urlPattern.test(trimmed)) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Tautan eksternal (URL) tidak diizinkan pada Tukar Keahlian demi menjaga integritas akademik.',
    };
  }

  if (trimmed.length < 10) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Deskripsi pertanyaan atau jawaban terlalu singkat (minimal 10 karakter).',
    };
  }

  // Bersihkan karakter HTML mencurigakan
  const sanitized = trimmed
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return {
    isValid: true,
    sanitized,
  };
}

export interface ActiveAssessmentItem {
  id: string;
  title: string;
  isOpen: boolean;
  isGraded: boolean;
  closesAt?: string | null;
}

/**
 * Memeriksa apakah Tukar Keahlian sedang dibekukan (Blackout)
 * karena terdapat penilaian bernilai aktif (kuis bernilai, UTS, UAS).
 */
export function isSkillExchangeBlackedOut(
  assessments: ActiveAssessmentItem[],
  now: Date = new Date()
): {
  isBlocked: boolean;
  activeExamTitle?: string;
  reason?: string;
} {
  const nowMs = now.getTime();

  for (const a of assessments) {
    if (a.isOpen && a.isGraded) {
      if (!a.closesAt || new Date(a.closesAt).getTime() > nowMs) {
        return {
          isBlocked: true,
          activeExamTitle: a.title,
          reason: `Tukar Keahlian dibekukan sementara karena ada penilaian aktif "${a.title}". Fitur akan dibuka kembali setelah sesi evaluasi berakhir.`,
        };
      }
    }
  }

  return { isBlocked: false };
}

/**
 * Menghitung perolehan XP bantuan rekan dengan batas harian maksimal 100 XP
 */
export function calculatePeerHelpXp(
  alreadyEarnedTodayXp: number,
  rewardPerAccepted: number = 50,
  dailyCap: number = 100
): {
  awardedXp: number;
  capped: boolean;
} {
  if (alreadyEarnedTodayXp >= dailyCap) {
    return { awardedXp: 0, capped: true };
  }

  const remainingQuota = dailyCap - alreadyEarnedTodayXp;
  const toAward = Math.min(rewardPerAccepted, remainingQuota);

  return {
    awardedXp: toAward,
    capped: alreadyEarnedTodayXp + toAward >= dailyCap,
  };
}
