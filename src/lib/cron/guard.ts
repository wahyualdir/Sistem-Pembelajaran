/**
 * Utilitas Pengaman Waktu Eksekusi (Timeout Guard) untuk Serverless Cron & Batch Worker
 * Mencegah proses latar belakang terkena SIGKILL / hard abort dari batas waktu eksekusi Vercel (10s - 60s).
 */

export interface ExecutionGuardOptions {
  /**
   * Durasi maksimum dalam milidetik sebelum eksekusi diminta untuk berhenti secara aman (graceful exit).
   * Nilai bawaan: 25.000 ms (25 detik).
   */
  maxDurationMs?: number;
  label?: string;
}

export class ExecutionGuard {
  private startTime: number;
  private maxDurationMs: number;
  private label: string;

  constructor(options?: ExecutionGuardOptions) {
    this.startTime = Date.now();
    this.maxDurationMs = options?.maxDurationMs ?? 25000;
    this.label = options?.label ?? 'BatchWorker';
  }

  /**
   * Mengembalikan true jika waktu eksekusi masih tersedia di bawah batas aman.
   */
  public hasTimeRemaining(): boolean {
    return Date.now() - this.startTime < this.maxDurationMs;
  }

  /**
   * Mengembalikan durasi waktu yang telah berjalan dalam milidetik.
   */
  public elapsedMs(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Mengembalikan sisa waktu dalam milidetik.
   */
  public remainingMs(): number {
    return Math.max(0, this.maxDurationMs - this.elapsedMs());
  }

  /**
   * Memeriksa apakah waktu sudah habis. Jika habis, melempar error agar loop berhenti dengan jelas.
   */
  public assertTimeRemaining(): void {
    if (!this.hasTimeRemaining()) {
      throw new Error(
        `[${this.label}] Batas toleransi durasi eksekusi serverless (${this.maxDurationMs}ms) tercapai. Menghentikan batch berikutnya secara aman.`
      );
    }
  }
}

/**
 * Factory helper untuk membuat ExecutionGuard.
 */
export function createExecutionGuard(options?: ExecutionGuardOptions): ExecutionGuard {
  return new ExecutionGuard(options);
}
