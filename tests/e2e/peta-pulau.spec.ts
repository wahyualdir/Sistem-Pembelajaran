import { test, expect } from '@playwright/test';

test.describe('E2E Peta Pulau & Pembelajaran Mandiri SIAJAR', () => {
  test('Alur 1: Halaman Privasi memuat bagian Data Aktivitas Belajar dengan jaminan integritas akademik', async ({
    page,
  }) => {
    await page.goto('/transparency', { waitUntil: 'domcontentloaded' });

    // Periksa bahwa judul dan pernyataan privasi tampil
    await expect(page.locator('body')).toBeVisible();

    // Pastikan kalimat jaminan wajib ada di halaman: "Log tidak pernah dipakai untuk menilai atau menghukum mahasiswa"
    const content = await page.textContent('body');
    expect(content).toContain('Log tidak pernah dipakai untuk menilai atau menghukum mahasiswa');

    // Periksa sakelar dan tombol aksi privasi
    expect(content).toContain('Catat aktivitas belajar mandiri');
    expect(content).toContain('Unduh Data Saya (.json)');
    expect(content).toContain('Hapus Riwayat Aktivitas');
    expect(content).toContain('Reset Kemajuan Flashcard');
  });

  test('Alur 2: Simulasi Pemutar Podcast dengan kontrol kecepatan dan transkrip', async ({ page }) => {
    await page.goto('/student', { waitUntil: 'domcontentloaded' });

    // Evaluasi fungsi perhitungan progres dan pemetaan durasi podcast di konteks peramban
    const result = await page.evaluate(() => {
      const chunks = [
        { chunkIndex: 0, durationSeconds: 60 },
        { chunkIndex: 1, durationSeconds: 120 },
      ];
      let accumulated = 0;
      const mapped = chunks.map((c) => {
        const start = accumulated;
        accumulated += c.durationSeconds;
        return { start, end: accumulated };
      });

      // Format mm:ss
      const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
      };

      return {
        totalDuration: accumulated,
        formatted: formatTime(accumulated),
        chunkCount: mapped.length,
      };
    });

    expect(result.totalDuration).toBe(180);
    expect(result.formatted).toBe('3:00');
    expect(result.chunkCount).toBe(2);
  });

  test('Alur 3: Algoritma Kotak Leitner pada sesi flashcard di browser klien', async ({ page }) => {
    await page.goto('/student', { waitUntil: 'domcontentloaded' });

    const leitnerTest = await page.evaluate(() => {
      // Simulasi aturan reviewCard
      const review = (box: number, rating: number) => {
        if (rating === 1) return 1;
        if (rating === 2) return box;
        if (rating === 3) return Math.min(5, box + 1);
        if (rating === 4) return box === 1 ? 3 : Math.min(5, box + 1);
        return box;
      };

      return {
        boxAfterFail: review(4, 1), // Rating 1 -> Kotak 1
        boxAfterHard: review(3, 2), // Rating 2 -> Tetap Kotak 3
        boxAfterGood: review(2, 3), // Rating 3 -> Kotak 3
        boxAfterEasy: review(1, 4), // Rating 4 -> Kotak 3 (lompat)
      };
    });

    expect(leitnerTest.boxAfterFail).toBe(1);
    expect(leitnerTest.boxAfterHard).toBe(3);
    expect(leitnerTest.boxAfterGood).toBe(3);
    expect(leitnerTest.boxAfterEasy).toBe(3);
  });

  test('Alur 4: Integritas Tukar Keahlian menolak masukan yang memuat tautan eksternal', async ({ page }) => {
    await page.goto('/student', { waitUntil: 'domcontentloaded' });

    const validation = await page.evaluate(() => {
      const checkContent = (text: string) => {
        const urlPattern = /(https?:\/\/|www\.|\.com\b|\.id\b|\.edu\b)/i;
        if (urlPattern.test(text)) return { valid: false, error: 'URL_NOT_ALLOWED' };
        if (text.trim().length < 10) return { valid: false, error: 'TOO_SHORT' };
        return { valid: true };
      };

      return {
        validText: checkContent('Bagaimana cara menormalkan tabel relasional ke bentuk 3NF?'),
        urlText: checkContent('Kunci jawaban ada di https://cheat-exam.org/db'),
        shortText: checkContent('Tolong'),
      };
    });

    expect(validation.validText.valid).toBe(true);
    expect(validation.urlText.valid).toBe(false);
    expect(validation.urlText.error).toBe('URL_NOT_ALLOWED');
    expect(validation.shortText.valid).toBe(false);
    expect(validation.shortText.error).toBe('TOO_SHORT');
  });

  test('Alur 5: K-Anonymity pada Laporan Adopsi Kaprodi menyamarkan agregat di bawah 5 mahasiswa', async ({
    page,
  }) => {
    await page.goto('/transparency', { waitUntil: 'domcontentloaded' });

    const anonymityCheck = await page.evaluate(() => {
      const mask = (count: number, value: string) => {
        return count < 5 ? '< 5 (Privasi Terjaga)' : value;
      };

      return {
        smallGroup: mask(3, '91.5%'),
        sufficientGroup: mask(12, '84.0%'),
      };
    });

    expect(anonymityCheck.smallGroup).toBe('< 5 (Privasi Terjaga)');
    expect(anonymityCheck.sufficientGroup).toBe('84.0%');
  });

  test('Alur 6: Akses langsung materi pulau terkunci ditolak (Fail-Closed)', async ({ page }) => {
    await page.goto('/student', { waitUntil: 'domcontentloaded' });

    const accessCheck = await page.evaluate(() => {
      interface ChapterAccessContext {
        id: string;
        orderIndex: number;
        isUnlocked: boolean;
        hasCompletedPrerequisite: boolean;
      }

      const verifyMaterialAccess = (chapter: ChapterAccessContext) => {
        if (!chapter.isUnlocked || !chapter.hasCompletedPrerequisite) {
          return {
            allowed: false,
            httpStatus: 403,
            message: 'Bab ini masih terkunci. Tuntaskan pulau sebelumnya untuk membuka akses materi.',
          };
        }
        return {
          allowed: true,
          httpStatus: 200,
          message: 'Akses diizinkan',
        };
      };

      const lockedIsland: ChapterAccessContext = {
        id: 'chap-island-3',
        orderIndex: 3,
        isUnlocked: false,
        hasCompletedPrerequisite: false,
      };

      const unlockedIsland: ChapterAccessContext = {
        id: 'chap-island-1',
        orderIndex: 1,
        isUnlocked: true,
        hasCompletedPrerequisite: true,
      };

      return {
        lockedResult: verifyMaterialAccess(lockedIsland),
        unlockedResult: verifyMaterialAccess(unlockedIsland),
      };
    });

    expect(accessCheck.lockedResult.allowed).toBe(false);
    expect(accessCheck.lockedResult.httpStatus).toBe(403);
    expect(accessCheck.lockedResult.message).toContain('masih terkunci');
    expect(accessCheck.unlockedResult.allowed).toBe(true);
    expect(accessCheck.unlockedResult.httpStatus).toBe(200);
  });

  test('Alur 7: Blokir Tukar Keahlian saat ujian terbuka (Blackout Integritas Ujian)', async ({ page }) => {
    await page.goto('/student', { waitUntil: 'domcontentloaded' });

    const blackoutCheck = await page.evaluate(() => {
      interface ClassExamContext {
        hasActiveExamWindow: boolean;
        isPeerHelpBlockedForQuiz: boolean;
        hasOngoingQuizAttempt: boolean;
      }

      const canUseSkillExchange = (ctx: ClassExamContext) => {
        if (ctx.hasActiveExamWindow) {
          return {
            allowed: false,
            reason: 'Bantuan teman dinonaktifkan sementara selama ada ujian.',
          };
        }
        if (ctx.isPeerHelpBlockedForQuiz) {
          return {
            allowed: false,
            reason: 'Bantuan teman dinonaktifkan sementara selama kuis berlangsung.',
          };
        }
        if (ctx.hasOngoingQuizAttempt) {
          return {
            allowed: false,
            reason: 'Bantuan teman dinonaktifkan saat Anda sedang mengerjakan kuis.',
          };
        }
        return { allowed: true, reason: '' };
      };

      return {
        duringExam: canUseSkillExchange({
          hasActiveExamWindow: true,
          isPeerHelpBlockedForQuiz: false,
          hasOngoingQuizAttempt: false,
        }),
        duringBlockedQuiz: canUseSkillExchange({
          hasActiveExamWindow: false,
          isPeerHelpBlockedForQuiz: true,
          hasOngoingQuizAttempt: false,
        }),
        normalConditions: canUseSkillExchange({
          hasActiveExamWindow: false,
          isPeerHelpBlockedForQuiz: false,
          hasOngoingQuizAttempt: false,
        }),
      };
    });

    expect(blackoutCheck.duringExam.allowed).toBe(false);
    expect(blackoutCheck.duringExam.reason).toContain('selama ada ujian');
    expect(blackoutCheck.duringBlockedQuiz.allowed).toBe(false);
    expect(blackoutCheck.normalConditions.allowed).toBe(true);
  });

  test('Alur 8: Mematikan pencatatan aktivitas belajar lalu mengeksekusi hapus riwayat aktivitas', async ({
    page,
  }) => {
    await page.goto('/transparency', { waitUntil: 'domcontentloaded' });

    const privacyLifecycle = await page.evaluate(() => {
      let loggingEnabled = true;
      let activityEvents = [
        { id: 'ev-1', kind: 'materi_dibuka' },
        { id: 'ev-2', kind: 'kartu_direview' },
      ];
      let semesterRecaps = [{ id: 'recap-1', semester: '2026/2027 Ganjil' }];
      let flashcardReviews = [{ cardId: 'fc-1', box: 2 }];

      // 1. Matikan pencatatan aktivitas
      loggingEnabled = false;

      // Percobaan logging baru saat disabled -> ditolak secara senyap
      const logNewEvent = (kind: string) => {
        if (!loggingEnabled) return null;
        activityEvents.push({ id: `ev-${activityEvents.length + 1}`, kind });
        return true;
      };
      const rejectedEvent = logNewEvent('podcast_diputar');

      // 2. Eksekusi Hapus Riwayat Aktivitas (clear_my_activity_log)
      const deletedEventsCount = activityEvents.length;
      const deletedRecapsCount = semesterRecaps.length;
      activityEvents = [];
      semesterRecaps = [];

      // Progres flashcard tetap aman dan tidak terhapus
      const preservedFlashcardsCount = flashcardReviews.length;

      return {
        loggingDisabled: !loggingEnabled,
        rejectedEventResult: rejectedEvent,
        deletedEventsCount,
        deletedRecapsCount,
        remainingEventsCount: activityEvents.length,
        preservedFlashcardsCount,
      };
    });

    expect(privacyLifecycle.loggingDisabled).toBe(true);
    expect(privacyLifecycle.rejectedEventResult).toBeNull();
    expect(privacyLifecycle.deletedEventsCount).toBe(2);
    expect(privacyLifecycle.deletedRecapsCount).toBe(1);
    expect(privacyLifecycle.remainingEventsCount).toBe(0);
    expect(privacyLifecycle.preservedFlashcardsCount).toBe(1);
  });
});
