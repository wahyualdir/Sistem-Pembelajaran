import { describe, it, expect, vi } from 'vitest';
import { createExecutionGuard, ExecutionGuard } from '@/lib/cron/guard';
import { Judge0Adapter } from '@/lib/judge/coderunner';

describe('Resilience & Performance Hardening (Fase 1)', () => {
  describe('ExecutionGuard (Timeout Guard)', () => {
    it('mengembalikan hasTimeRemaining true jika masih di dalam batas waktu', () => {
      const guard = createExecutionGuard({ maxDurationMs: 5000, label: 'test-cron' });
      expect(guard.hasTimeRemaining()).toBe(true);
      expect(guard.elapsedMs()).toBeGreaterThanOrEqual(0);
      expect(guard.remainingMs()).toBeLessThanOrEqual(5000);
      expect(() => guard.assertTimeRemaining()).not.toThrow();
    });

    it('melempar error saat batas waktu terlampaui', () => {
      const guard = new ExecutionGuard({ maxDurationMs: -1, label: 'expired-cron' });
      expect(guard.hasTimeRemaining()).toBe(false);
      expect(guard.remainingMs()).toBe(0);
      expect(() => guard.assertTimeRemaining()).toThrow(
        /Batas toleransi durasi eksekusi serverless.*tercapai/
      );
    });
  });

  describe('Judge0Adapter Circuit & Timeout Fallback', () => {
    it('mengembalikan status galat dan pesan manual ketika JUDGE_API_URL tidak disetel', async () => {
      const origUrl = process.env.JUDGE_API_URL;
      delete process.env.JUDGE_API_URL;

      try {
        const runner = new Judge0Adapter();
        const res = await runner.run({
          language: 'python',
          sourceCode: 'print(42)',
          testCases: [
            { id: 'tc-1', stdin: '', expectedStdout: '42', isHidden: false, weight: 10 },
          ],
        });

        expect(res.ok).toBe(false);
        expect(res.status).toBe('galat');
        expect(res.message).toContain('diperiksa manual');
      } finally {
        if (origUrl) process.env.JUDGE_API_URL = origUrl;
      }
    });
  });
});
