import { describe, it, expect } from 'vitest';
import {
  sanitizeSkillExchangeContent,
  isSkillExchangeBlackedOut,
  calculatePeerHelpXp,
  evaluatePeerHelpReward,
  type PeerHelpRewardInput,
} from '@/lib/akademik/skill-exchange';
import {
  buildSemesterRecap,
  maskCellIfBelowThreshold,
  type StudentRawSemesterStats,
} from '@/lib/akademik/semester-recap';

describe('Tahap 3: Tukar Keahlian — Sanitasi & Blackout (skill-exchange.ts)', () => {
  it('sanitizeSkillExchangeContent menerima pertanyaan dan jawaban valid', () => {
    const text = 'Bagaimana cara membuktikan pohon B-Tree tetap seimbang saat operasi penyisipan?';
    const res = sanitizeSkillExchangeContent(text);
    expect(res.isValid).toBe(true);
    expect(res.sanitized).toContain('B-Tree');
  });

  it('sanitizeSkillExchangeContent menolak teks dengan tautan URL eksternal demi integritas akademik', () => {
    const textWithHttp = 'Kalian bisa lihat jawaban lengkap di https://kuncijawaban.com/algo';
    const resHttp = sanitizeSkillExchangeContent(textWithHttp);
    expect(resHttp.isValid).toBe(false);
    expect(resHttp.error).toContain('Tautan eksternal');

    const textWithWww = 'Cek file di www.drive-share.id untuk kuis ini';
    const resWww = sanitizeSkillExchangeContent(textWithWww);
    expect(resWww.isValid).toBe(false);
  });

  it('sanitizeSkillExchangeContent menolak teks terlalu singkat (< 10 karakter)', () => {
    const res = sanitizeSkillExchangeContent('Tolong ya');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('terlalu singkat');
  });

  it('isSkillExchangeBlackedOut membekukan fitur jika ada kuis bernilai aktif', () => {
    const now = new Date('2026-10-25T10:00:00Z');
    const assessments = [
      {
        id: 'exam-1',
        title: 'Ujian Tengah Semester: Arsitektur Cloud',
        isOpen: true,
        isGraded: true,
        closesAt: '2026-10-25T12:00:00Z',
      },
    ];

    const blackout = isSkillExchangeBlackedOut(assessments, now);
    expect(blackout.isBlocked).toBe(true);
    expect(blackout.activeExamTitle).toContain('Ujian Tengah Semester');
    expect(blackout.reason).toContain('dibekukan sementara');
  });

  it('isSkillExchangeBlackedOut mengizinkan tukar keahlian jika tidak ada evaluasi aktif', () => {
    const now = new Date('2026-10-25T14:00:00Z');
    const assessments = [
      {
        id: 'exam-1',
        title: 'UTS Cloud',
        isOpen: false,
        isGraded: true,
        closesAt: '2026-10-25T12:00:00Z',
      },
    ];

    const blackout = isSkillExchangeBlackedOut(assessments, now);
    expect(blackout.isBlocked).toBe(false);
  });

  it('calculatePeerHelpXp membatasi maksimal 100 XP per hari dari bantuan rekan', () => {
    const first = calculatePeerHelpXp(0, 50, 100);
    expect(first.awardedXp).toBe(50);
    expect(first.capped).toBe(false);

    const second = calculatePeerHelpXp(50, 50, 100);
    expect(second.awardedXp).toBe(50);
    expect(second.capped).toBe(true);

    const third = calculatePeerHelpXp(100, 50, 100);
    expect(third.awardedXp).toBe(0);
    expect(third.capped).toBe(true);
  });
});

describe('Tahap 3: Aturan Poin & Batas Pasangan Tukar Keahlian (evaluatePeerHelpReward) — Minimal 10 Kasus', () => {
  const studentA = 'std-a';
  const studentB = 'std-b';
  const studentC = 'std-c';

  it('Kasus 1: Bantuan pertama hari ini ke rekan berbeda -> +5 XP (sukses)', () => {
    const input: PeerHelpRewardInput = {
      requesterId: studentA,
      responderId: studentB,
      helpfulCountToday: 0,
      pairCountThisWeek: 0,
    };
    const res = evaluatePeerHelpReward(input);
    expect(res.awarded).toBe(true);
    expect(res.xp).toBe(5);
    expect(res.reason).toBe('success');
  });

  it('Kasus 2: Bantuan kedua hari ini ke rekan berbeda -> +5 XP (sukses)', () => {
    const input: PeerHelpRewardInput = {
      requesterId: studentC,
      responderId: studentB,
      helpfulCountToday: 1,
      pairCountThisWeek: 0,
    };
    const res = evaluatePeerHelpReward(input);
    expect(res.awarded).toBe(true);
    expect(res.xp).toBe(5);
    expect(res.reason).toBe('success');
  });

  it('Kasus 3: Bantuan ketiga hari ini -> +5 XP (sukses, batas harian 3x tercapai)', () => {
    const input: PeerHelpRewardInput = {
      requesterId: 'std-d',
      responderId: studentB,
      helpfulCountToday: 2,
      pairCountThisWeek: 0,
    };
    const res = evaluatePeerHelpReward(input);
    expect(res.awarded).toBe(true);
    expect(res.xp).toBe(5);
  });

  it('Kasus 4: Bantuan keempat hari ini -> 0 XP ditolak karena batas harian 3x terlampaui', () => {
    const input: PeerHelpRewardInput = {
      requesterId: 'std-e',
      responderId: studentB,
      helpfulCountToday: 3, // sudah 3x
      pairCountThisWeek: 0,
    };
    const res = evaluatePeerHelpReward(input);
    expect(res.awarded).toBe(false);
    expect(res.xp).toBe(0);
    expect(res.reason).toBe('daily_cap_exceeded');
  });

  it('Kasus 5: Bantuan kelima hari ini -> tetap 0 XP tanpa error', () => {
    const input: PeerHelpRewardInput = {
      requesterId: 'std-f',
      responderId: studentB,
      helpfulCountToday: 4,
      pairCountThisWeek: 0,
    };
    const res = evaluatePeerHelpReward(input);
    expect(res.awarded).toBe(false);
    expect(res.xp).toBe(0);
    expect(res.reason).toBe('daily_cap_exceeded');
  });

  it('Kasus 6: Pemohon menandai jawabannya sendiri -> 0 XP ditolak tegas (self_help)', () => {
    const input: PeerHelpRewardInput = {
      requesterId: studentA,
      responderId: studentA, // sama
      helpfulCountToday: 0,
      pairCountThisWeek: 0,
    };
    const res = evaluatePeerHelpReward(input);
    expect(res.awarded).toBe(false);
    expect(res.xp).toBe(0);
    expect(res.reason).toBe('self_help');
  });

  it('Kasus 7: Pasangan A dan B: Bantuan pertama minggu ini -> +5 XP (sukses)', () => {
    const input: PeerHelpRewardInput = {
      requesterId: studentA,
      responderId: studentB,
      helpfulCountToday: 0,
      pairCountThisWeek: 0,
    };
    const res = evaluatePeerHelpReward(input);
    expect(res.awarded).toBe(true);
    expect(res.xp).toBe(5);
  });

  it('Kasus 8: Pasangan A dan B: Bantuan kedua minggu ini -> +5 XP (sukses, batas pasangan 2x tercapai)', () => {
    const input: PeerHelpRewardInput = {
      requesterId: studentA,
      responderId: studentB,
      helpfulCountToday: 1,
      pairCountThisWeek: 1,
    };
    const res = evaluatePeerHelpReward(input);
    expect(res.awarded).toBe(true);
    expect(res.xp).toBe(5);
  });

  it('Kasus 9: Pasangan A dan B: Bantuan ketiga minggu ini -> 0 XP ditolak batas pasangan (pair_weekly_cap_exceeded)', () => {
    const input: PeerHelpRewardInput = {
      requesterId: studentA,
      responderId: studentB,
      helpfulCountToday: 1,
      pairCountThisWeek: 2, // sudah 2x minggu ini
    };
    const res = evaluatePeerHelpReward(input);
    expect(res.awarded).toBe(false);
    expect(res.xp).toBe(0);
    expect(res.reason).toBe('pair_weekly_cap_exceeded');
  });

  it('Kasus 10: Pasangan A dan C: Bantuan pertama tetap dapat poin meskipun pasangan A dan B sudah melebihi cap', () => {
    const input: PeerHelpRewardInput = {
      requesterId: studentA,
      responderId: studentC, // responden C baru 0x dengan A
      helpfulCountToday: 1,
      pairCountThisWeek: 0,
    };
    const res = evaluatePeerHelpReward(input);
    expect(res.awarded).toBe(true);
    expect(res.xp).toBe(5);
    expect(res.reason).toBe('success');
  });

  it('Kasus 11: Konfigurasi kustom kebijakan institusi (dailyCap = 5, pairCap = 3, xp = 10)', () => {
    const customInput: PeerHelpRewardInput = {
      requesterId: studentA,
      responderId: studentB,
      helpfulCountToday: 3,
      pairCountThisWeek: 2,
      dailyCap: 5,
      pairWeeklyCap: 3,
      xpPerHelpful: 10,
    };
    const res = evaluatePeerHelpReward(customInput);
    expect(res.awarded).toBe(true);
    expect(res.xp).toBe(10);
  });
});

describe('Tahap 3: Rekap Semester & K-Anonymity (semester-recap.ts)', () => {
  const sampleStats: StudentRawSemesterStats = {
    studentName: 'Ahmad Mahasiswa',
    semesterLabel: 'Semester Ganjil 2026/2027',
    totalChaptersPassed: 8,
    totalChaptersAvailable: 10,
    topicsMastery: [
      { name: 'Normalisasi Relasional', level: 'kuat' },
      { name: 'Indeks B-Tree', level: 'kuat' },
      { name: 'Partisi Hash', level: 'cukup' },
      { name: 'Konsensus Raft', level: 'perlu_latihan' },
    ],
    flashcardsReviewedCount: 65,
    podcastSecondsListened: 4800, // 80 menit
    peerHelpAcceptedCount: 6,
    totalXp: 1450,
  };

  it('buildSemesterRecap menghitung persentase tuntas dan memisahkan topik kuat', () => {
    const recap = buildSemesterRecap(sampleStats);
    expect(recap.completionRatePct).toBe(80);
    expect(recap.strongTopics).toEqual(['Normalisasi Relasional', 'Indeks B-Tree']);
    expect(recap.growthTopics).toEqual(['Partisi Hash', 'Konsensus Raft']);
    expect(recap.podcastMinutesListened).toBe(80);
    expect(recap.learningHabitBadge).toBe('Rekan Kolaboratif');
    expect(recap.headlineSummary).toContain('8 bab pulau belajar (80%)');
  });

  it('buildSemesterRecap memberikan lencana Penjelajah Sempurna bila 100% bab tuntas', () => {
    const perfectStats: StudentRawSemesterStats = {
      ...sampleStats,
      totalChaptersPassed: 10,
      totalChaptersAvailable: 10,
      peerHelpAcceptedCount: 1,
    };
    const recap = buildSemesterRecap(perfectStats);
    expect(recap.completionRatePct).toBe(100);
    expect(recap.learningHabitBadge).toBe('Penjelajah Sempurna');
  });

  it('buildSemesterRecap menangani kondisi tanpa aktivitas belajar (0 bab tuntas)', () => {
    const emptyStats: StudentRawSemesterStats = {
      studentName: 'Budi',
      semesterLabel: 'Semester Ganjil 2026/2027',
      totalChaptersPassed: 0,
      totalChaptersAvailable: 8,
      topicsMastery: [],
      flashcardsReviewedCount: 0,
      podcastSecondsListened: 0,
      peerHelpAcceptedCount: 0,
      totalXp: 0,
    };
    const recap = buildSemesterRecap(emptyStats);
    expect(recap.completionRatePct).toBe(0);
    expect(recap.strongTopics).toEqual([]);
    expect(recap.growthTopics).toEqual([]);
    expect(recap.learningHabitBadge).toBe('Langkah Awal');
  });

  it('maskCellIfBelowThreshold menyamarkan data jika sampel kurang dari 5 mahasiswa', () => {
    const masked = maskCellIfBelowThreshold(3, '92.5%');
    expect(masked).toBe('< 5 (Privasi Terjaga)');

    const masked1 = maskCellIfBelowThreshold(1, '50.0%');
    expect(masked1).toBe('< 5 (Privasi Terjaga)');

    const real = maskCellIfBelowThreshold(5, '88.0%');
    expect(real).toBe('88.0%');

    const real10 = maskCellIfBelowThreshold(10, '95.2%');
    expect(real10).toBe('95.2%');
  });
});
