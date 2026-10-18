/**
 * Utilitas dan Validasi Sanggah Nilai oleh Mahasiswa (SIAJAR Bagian 9.4)
 * Menangani batas waktu sanggahan, alasan minimal, wewenang penarikan,
 * pembatasan laju per jam, dan pembuatan draf revisi nilai jika buku nilai final.
 */

export type DisputeStatus = 'diajukan' | 'ditinjau' | 'diterima' | 'ditolak' | 'ditarik';
export type DisputeDecision = 'diterima' | 'ditolak' | 'ditinjau';

export interface DisputeWindowCheck {
  valid: boolean;
  error?: string;
  remainingDays?: number;
}

/**
 * Validasi batas waktu pengajuan sanggahan (bawaan: 7 hari sejak nilai dipublikasikan).
 */
export function validateDisputeWindow(
  publishedAtIso: string,
  disputeWindowDays: number = 7,
  now: Date = new Date()
): DisputeWindowCheck {
  const publishedTime = new Date(publishedAtIso).getTime();
  if (isNaN(publishedTime)) {
    return { valid: false, error: 'Tanggal publikasi nilai tidak valid.' };
  }

  const windowMs = disputeWindowDays * 24 * 60 * 60 * 1000;
  const expiryTime = publishedTime + windowMs;
  const currentTime = now.getTime();

  if (currentTime > expiryTime) {
    return {
      valid: false,
      error: 'Batas pengajuan sanggahan sudah lewat.',
      remainingDays: 0,
    };
  }

  const remainingMs = expiryTime - currentTime;
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  return { valid: true, remainingDays };
}

/**
 * Validasi teks alasan sanggahan dari mahasiswa (minimal 30 karakter).
 */
export function validateDisputeReason(reason: string): { valid: boolean; error?: string } {
  if (!reason || reason.trim().length < 30) {
    return {
      valid: false,
      error: 'Alasan sanggahan minimal 30 karakter agar dapat ditinjau dosen.',
    };
  }
  return { valid: true };
}

/**
 * Pembatasan laju pengajuan sanggahan: maksimal 5 pengajuan per jam per mahasiswa.
 */
export function checkDisputeHourlyLimit(
  submissionTimestamps: number[],
  nowMs: number = Date.now(),
  maxPerHour: number = 5
): { allowed: boolean; remaining: number } {
  const oneHourAgo = nowMs - 3600 * 1000;
  const recent = submissionTimestamps.filter((t) => t > oneHourAgo);

  if (recent.length >= maxPerHour) {
    return { allowed: false, remaining: 0 };
  }

  return {
    allowed: true,
    remaining: maxPerHour - recent.length,
  };
}

/**
 * Penarikan sanggahan: mahasiswa hanya dapat menarik sanggahan yang masih berstatus 'diajukan'.
 */
export function canWithdrawDispute(status: DisputeStatus): boolean {
  return status === 'diajukan';
}

/**
 * Validasi berkas bukti sanggahan:
 * - Privat, maksimal 5 MB
 * - Format PDF atau gambar (JPG, PNG, WebP)
 */
export function validateDisputeEvidence(file: {
  sizeBytes: number;
  mimeType: string;
}): { valid: boolean; error?: string } {
  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

  if (file.sizeBytes > MAX_BYTES) {
    return {
      valid: false,
      error: 'Ukuran berkas bukti maksimal 5 MB.',
    };
  }

  if (!ALLOWED_MIME.includes(file.mimeType.toLowerCase())) {
    return {
      valid: false,
      error: 'Format berkas bukti harus berupa PDF atau gambar (JPG/PNG/WebP).',
    };
  }

  return { valid: true };
}

export interface ResolveDisputeParams {
  decision: DisputeDecision;
  response: string;
  newScore?: number | null;
  isGradebookFinal: boolean;
}

export interface ResolveDisputeResult {
  valid: boolean;
  error?: string;
  createsChangeRequestDraft: boolean;
  draftChangeRequest?: {
    status: 'DRAF';
    reason: string;
    newScore: number;
  } | null;
}

/**
 * Validasi dan pemrosesan keputusan sanggah nilai oleh Dosen Pengampu:
 * - Tolak: alasan penolakan minimal 20 karakter
 * - Terima: skor baru wajib diisi
 * - Jika buku nilai sudah final dan diterima: membuat draf grade_change_requests
 */
export function evaluateDisputeDecision(params: ResolveDisputeParams): ResolveDisputeResult {
  const { decision, response, newScore, isGradebookFinal } = params;

  if (decision === 'ditolak') {
    if (!response || response.trim().length < 20) {
      return {
        valid: false,
        error: 'Keputusan tolak membutuhkan alasan penolakan minimal 20 karakter.',
        createsChangeRequestDraft: false,
      };
    }
    return {
      valid: true,
      createsChangeRequestDraft: false,
      draftChangeRequest: null,
    };
  }

  if (decision === 'ditinjau') {
    if (!response || response.trim().length < 5) {
      return {
        valid: false,
        error: 'Permintaan penjelasan membutuhkan tanggapan minimal 5 karakter.',
        createsChangeRequestDraft: false,
      };
    }
    return {
      valid: true,
      createsChangeRequestDraft: false,
      draftChangeRequest: null,
    };
  }

  if (decision === 'diterima') {
    if (newScore === undefined || newScore === null || isNaN(newScore) || newScore < 0 || newScore > 100) {
      return {
        valid: false,
        error: 'Keputusan terima membutuhkan skor baru yang valid (0 - 100).',
        createsChangeRequestDraft: false,
      };
    }

    if (isGradebookFinal) {
      return {
        valid: true,
        createsChangeRequestDraft: true,
        draftChangeRequest: {
          status: 'DRAF',
          reason: `Hasil persetujuan sanggah nilai mahasiswa: ${response.trim() || 'Nilai disesuaikan'}`,
          newScore,
        },
      };
    }

    return {
      valid: true,
      createsChangeRequestDraft: false,
      draftChangeRequest: null,
    };
  }

  return {
    valid: false,
    error: 'Keputusan tidak dikenal.',
    createsChangeRequestDraft: false,
  };
}
