import { describe, it, expect } from 'vitest';

export interface AnswerItem {
  questionId: string;
  answer: any;
  revision: number;
}

/**
 * Aturan Penggabungan 11.1:
 * "ambil jawaban server, gabungkan dengan IndexedDB per soal dengan aturan 'revisi lebih tinggi menang'"
 */
export function mergeExamAnswers(
  serverAnswers: Record<string, AnswerItem>,
  localAnswers: Record<string, AnswerItem>
): Record<string, AnswerItem> {
  const merged: Record<string, AnswerItem> = { ...serverAnswers };

  for (const [qId, localItem] of Object.entries(localAnswers)) {
    const serverItem = merged[qId];
    if (!serverItem || localItem.revision > serverItem.revision) {
      merged[qId] = localItem;
    }
  }

  return merged;
}

/**
 * Aturan Perhitungan Waktu 11.1:
 * "simpan offset = server_now - Date.now(). Sisa waktu = expires_at - (Date.now() + offset).
 * Jam perangkat tidak pernah menentukan apakah waktu habis."
 */
export function calcRemainingExamSeconds(
  expiresAtIso: string,
  serverNowIso: string,
  clientNowMs: number
): number {
  const serverNowMs = new Date(serverNowIso).getTime();
  const offset = serverNowMs - clientNowMs;
  const effectiveServerNowMs = clientNowMs + offset; // Selalu bernilai serverNowMs
  const expiresAtMs = new Date(expiresAtIso).getTime();

  const remainingMs = expiresAtMs - effectiveServerNowMs;
  return Math.max(0, Math.floor(remainingMs / 1000));
}

/**
 * Aturan Exponential Backoff 11.1:
 * "coba lagi dengan jeda 1, 2, 4, 8 … maksimal 30 detik."
 */
export function getNextBackoffInterval(currentInterval: number): number {
  return Math.min(30000, currentInterval * 2);
}

describe('Autosave & Pemulihan Ujian Saat Putus Koneksi (11.1)', () => {
  it('menggabungkan jawaban server dan lokal dengan aturan revisi lebih tinggi menang', () => {
    const serverAnswers: Record<string, AnswerItem> = {
      q1: { questionId: 'q1', answer: 'A', revision: 2 },
      q2: { questionId: 'q2', answer: 'B', revision: 1 },
      q3: { questionId: 'q3', answer: 'C', revision: 3 },
    };

    const localAnswers: Record<string, AnswerItem> = {
      q1: { questionId: 'q1', answer: 'D', revision: 3 }, // lokal lebih tinggi -> D menang
      q2: { questionId: 'q2', answer: 'A', revision: 1 }, // sama -> server tetap
      q3: { questionId: 'q3', answer: 'E', revision: 2 }, // server lebih tinggi -> C menang
      q4: { questionId: 'q4', answer: 'B', revision: 1 }, // baru di lokal -> B masuk
    };

    const merged = mergeExamAnswers(serverAnswers, localAnswers);

    expect(merged.q1.answer).toBe('D');
    expect(merged.q1.revision).toBe(3);

    expect(merged.q2.answer).toBe('B');

    expect(merged.q3.answer).toBe('C');
    expect(merged.q3.revision).toBe(3);

    expect(merged.q4.answer).toBe('B');
  });

  it('memastikan sisa waktu ujian kebal terhadap manipulasi jam perangkat pengguna (server offset)', () => {
    const serverNow = '2026-10-18T10:00:00.000Z';
    const expiresAt = '2026-10-18T10:30:00.000Z'; // Durasi 30 menit = 1800 detik

    // Skenario 1: Jam perangkat tepat sama dengan server
    const clientExact = new Date(serverNow).getTime();
    expect(calcRemainingExamSeconds(expiresAt, serverNow, clientExact)).toBe(1800);

    // Skenario 2: Jam perangkat dimajukan 1 jam oleh pengguna (11:00:00)
    const clientCheatedForward = clientExact + 3600000;
    expect(calcRemainingExamSeconds(expiresAt, serverNow, clientCheatedForward)).toBe(1800);

    // Skenario 3: Jam perangkat dimundurkan 2 jam oleh pengguna (08:00:00)
    const clientCheatedBackward = clientExact - 7200000;
    expect(calcRemainingExamSeconds(expiresAt, serverNow, clientCheatedBackward)).toBe(1800);
  });

  it('menghitung exponential backoff jeda coba lagi hingga maksimal 30 detik', () => {
    let interval = 1000; // 1s
    interval = getNextBackoffInterval(interval); // 2s
    expect(interval).toBe(2000);
    interval = getNextBackoffInterval(interval); // 4s
    expect(interval).toBe(4000);
    interval = getNextBackoffInterval(interval); // 8s
    expect(interval).toBe(8000);
    interval = getNextBackoffInterval(interval); // 16s
    expect(interval).toBe(16000);
    interval = getNextBackoffInterval(interval); // 32s -> cap 30s
    expect(interval).toBe(30000);
    interval = getNextBackoffInterval(interval); // tetap cap 30s
    expect(interval).toBe(30000);
  });
});
