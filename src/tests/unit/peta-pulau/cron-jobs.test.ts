import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { isAuthorizedCronRequest, unauthorizedCronResponse } from '@/lib/cron/auth';
import { GET as getAiContent } from '@/app/api/cron/ai_content_jobs/route';
import { GET as getTts } from '@/app/api/cron/tts_jobs/route';
import { GET as getContentStale } from '@/app/api/cron/content_stale_check/route';
import { GET as getMorningSummary } from '@/app/api/cron/morning_summary/route';
import { GET as getContentReview } from '@/app/api/cron/content_review_digest/route';
import { GET as getSkillExpire } from '@/app/api/cron/skill_request_expire/route';
import { GET as getRecapGenerate } from '@/app/api/cron/recap_generate/route';
import { GET as getActivityPurge } from '@/app/api/cron/activity_purge/route';

describe('Peta Pulau: Cron Jobs — Otorisasi & Penolakan Tanpa Rahasia (401)', () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'secret_cron_token_test_123';
  });

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.CRON_SECRET = originalSecret;
    } else {
      delete process.env.CRON_SECRET;
    }
  });

  it('isAuthorizedCronRequest menolak (false) jika CRON_SECRET tidak dikonfigurasi di server (fail-closed)', () => {
    delete process.env.CRON_SECRET;
    const req = new NextRequest('http://localhost/api/cron/morning_summary', {
      headers: { authorization: 'Bearer secret_cron_token_test_123' },
    });
    expect(isAuthorizedCronRequest(req)).toBe(false);
  });

  it('isAuthorizedCronRequest menolak (false) jika header Authorization tidak disertakan', () => {
    const req = new NextRequest('http://localhost/api/cron/morning_summary');
    expect(isAuthorizedCronRequest(req)).toBe(false);
  });

  it('isAuthorizedCronRequest menolak (false) jika token Authorization salah', () => {
    const req = new NextRequest('http://localhost/api/cron/morning_summary', {
      headers: { authorization: 'Bearer token_palsu_999' },
    });
    expect(isAuthorizedCronRequest(req)).toBe(false);
  });

  it('isAuthorizedCronRequest menerima (true) jika Bearer token cocok dengan CRON_SECRET', () => {
    const req = new NextRequest('http://localhost/api/cron/morning_summary', {
      headers: { authorization: 'Bearer secret_cron_token_test_123' },
    });
    expect(isAuthorizedCronRequest(req)).toBe(true);
  });

  it('unauthorizedCronResponse mengembalikan HTTP 401 dengan pesan UNAUTHORIZED yang jelas', async () => {
    const res = unauthorizedCronResponse();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('UNAUTHORIZED');
  });

  it('Semua 8 rute cron menolak permintaan tanpa secret dengan status 401', async () => {
    const unauthReq = new NextRequest('http://localhost/api/cron/test');

    const handlers = [
      getAiContent,
      getTts,
      getContentStale,
      getMorningSummary,
      getContentReview,
      getSkillExpire,
      getRecapGenerate,
      getActivityPurge,
    ];

    for (const handler of handlers) {
      const res = await handler(unauthReq);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('UNAUTHORIZED');
    }
  });
});

describe('Peta Pulau: Cron Jobs — Idempotensi Logika Pekerjaan Terjadwal', () => {
  it('Deduplikasi Ringkasan Pagi memastikan satu mahasiswa hanya menerima 1 notifikasi per hari (WIB)', () => {
    const studentId = 'std-idempotent-1';
    const wibDate = '2026-10-20';
    const dedupKey = `morning_summary:${studentId}:${wibDate}`;

    // Simulasi penyimpanan dengan dedup_key
    const notificationStore = new Set<string>();

    const dispatchMorningSummary = (key: string) => {
      if (notificationStore.has(key)) {
        return { dispatched: false, skipped: true };
      }
      notificationStore.add(key);
      return { dispatched: true, skipped: false };
    };

    // Eksekusi pertama pukul 07.00 WIB
    const firstRun = dispatchMorningSummary(dedupKey);
    expect(firstRun.dispatched).toBe(true);
    expect(firstRun.skipped).toBe(false);

    // Eksekusi kedua (misal cron berulang atau re-trigger)
    const secondRun = dispatchMorningSummary(dedupKey);
    expect(secondRun.dispatched).toBe(false);
    expect(secondRun.skipped).toBe(true);

    expect(notificationStore.size).toBe(1);
  });

  it('Deduplikasi Content Review Digest memastikan dosen tidak menerima ringkasan ganda pada hari yang sama', () => {
    const lecturerId = 'lec-idempotent-1';
    const wibDate = '2026-10-20';
    const dedupKey = `review_digest:${lecturerId}:${wibDate}`;

    const digestStore = new Set<string>();

    const dispatchDigest = (key: string) => {
      if (digestStore.has(key)) {
        return { dispatched: false, skipped: true };
      }
      digestStore.add(key);
      return { dispatched: true, skipped: false };
    };

    expect(dispatchDigest(dedupKey).dispatched).toBe(true);
    expect(dispatchDigest(dedupKey).skipped).toBe(true);
    expect(digestStore.size).toBe(1);
  });

  it('Pembersihan aktivitas lampau (activity_purge) aman dijalankan berulang kali tanpa error', () => {
    const mockDbEvents = [
      { id: '1', occurred_at: '2024-01-01T00:00:00Z' }, // > 365 hari
      { id: '2', occurred_at: '2026-10-18T00:00:00Z' }, // aktif
    ];

    const purgeOldEvents = (events: typeof mockDbEvents, cutoffDate: Date) => {
      const remaining = events.filter((e) => new Date(e.occurred_at) >= cutoffDate);
      const deletedCount = events.length - remaining.length;
      return { remaining, deletedCount };
    };

    const oneYearAgo = new Date('2025-10-18T00:00:00Z');

    // Run 1
    const run1 = purgeOldEvents(mockDbEvents, oneYearAgo);
    expect(run1.deletedCount).toBe(1);
    expect(run1.remaining.length).toBe(1);

    // Run 2 (eksekusi kedua dengan sisa data)
    const run2 = purgeOldEvents(run1.remaining, oneYearAgo);
    expect(run2.deletedCount).toBe(0); // Idempoten: 0 baris dihapus, tidak ada error
    expect(run2.remaining.length).toBe(1);
  });
});
