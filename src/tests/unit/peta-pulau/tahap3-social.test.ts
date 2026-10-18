import { describe, it, expect } from 'vitest';
import {
  sanitizeSkillExchangeContent,
  isSkillExchangeBlackedOut,
  calculatePeerHelpXp,
} from '@/lib/akademik/skill-exchange';
import {
  buildSemesterRecap,
  maskCellIfBelowThreshold,
  type StudentRawSemesterStats,
} from '@/lib/akademik/semester-recap';

describe('Tahap 3: Tukar Keahlian (skill-exchange.ts)', () => {
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
        closesAt: '2026-10-25T12:00:00Z', // masih berjalan
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
        isOpen: false, // sudah ditutup
        isGraded: true,
        closesAt: '2026-10-25T12:00:00Z',
      },
    ];

    const blackout = isSkillExchangeBlackedOut(assessments, now);
    expect(blackout.isBlocked).toBe(false);
  });

  it('calculatePeerHelpXp membatasi maksimal 100 XP per hari dari bantuan rekan', () => {
    // 1. Jawaban pertama hari ini (+50 XP)
    const first = calculatePeerHelpXp(0, 50, 100);
    expect(first.awardedXp).toBe(50);
    expect(first.capped).toBe(false);

    // 2. Jawaban kedua hari ini (+50 XP -> cap tercapai)
    const second = calculatePeerHelpXp(50, 50, 100);
    expect(second.awardedXp).toBe(50);
    expect(second.capped).toBe(true);

    // 3. Jawaban ketiga hari ini (+0 XP karena cap 100 XP sudah penuh)
    const third = calculatePeerHelpXp(100, 50, 100);
    expect(third.awardedXp).toBe(0);
    expect(third.capped).toBe(true);
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

  it('maskCellIfBelowThreshold menyamarkan data jika sampel kurang dari 5 mahasiswa', () => {
    // Kurang dari 5 -> Disamarkan
    const masked = maskCellIfBelowThreshold(3, '92.5%');
    expect(masked).toBe('< 5 (Privasi Terjaga)');

    // 5 atau lebih -> Tampil data asli
    const real = maskCellIfBelowThreshold(5, '88.0%');
    expect(real).toBe('88.0%');
  });
});
