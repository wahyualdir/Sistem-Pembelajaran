/**
 * Utilitas dan Validasi Komentar Berkas (SIAJAR Bagian 9.3)
 * Mendukung komentar pada baris kode (type: 'lines') dan halaman PDF (type: 'page').
 */

export interface LineAnchor {
  type: 'lines';
  from: number;
  to: number;
}

export interface PageAnchor {
  type: 'page';
  page: number;
  x: number; // 0.0 - 1.0 (posisi relatif horizontal)
  y: number; // 0.0 - 1.0 (posisi relatif vertikal)
}

export type FeedbackAnchor = LineAnchor | PageAnchor;

export interface FeedbackComment {
  id: string;
  submission_id: string;
  author_id: string;
  author_name?: string;
  author_role?: 'LECTURER' | 'TEACHING_ASSISTANT';
  file_path?: string | null;
  anchor?: FeedbackAnchor | null;
  body: string;
  is_draft: boolean;
  created_at: string;
}

/**
 * Validasi anchor komentar berkas:
 * - lines: from >= 1, to >= from
 * - page: page >= 1, x dan y di antara 0 dan 1
 */
export function validateFeedbackAnchor(anchor: unknown): { valid: boolean; error?: string } {
  if (!anchor) {
    return { valid: true }; // Komentar umum tanpa penanda baris/halaman
  }

  if (typeof anchor !== 'object') {
    return { valid: false, error: 'Format penanda berkas (anchor) tidak valid.' };
  }

  const a = anchor as Record<string, any>;

  if (a.type === 'lines') {
    if (typeof a.from !== 'number' || typeof a.to !== 'number') {
      return { valid: false, error: 'Rentang baris harus berupa angka.' };
    }
    if (a.from < 1) {
      return { valid: false, error: 'Nomor baris awal minimal 1.' };
    }
    if (a.to < a.from) {
      return { valid: false, error: 'Nomor baris akhir tidak boleh lebih kecil dari baris awal.' };
    }
    return { valid: true };
  }

  if (a.type === 'page') {
    if (typeof a.page !== 'number' || a.page < 1) {
      return { valid: false, error: 'Nomor halaman dokumen minimal 1.' };
    }
    if (typeof a.x !== 'number' || a.x < 0 || a.x > 1) {
      return { valid: false, error: 'Koordinat horizontal (x) harus di antara 0.0 dan 1.0.' };
    }
    if (typeof a.y !== 'number' || a.y < 0 || a.y > 1) {
      return { valid: false, error: 'Koordinat vertikal (y) harus di antara 0.0 dan 1.0.' };
    }
    return { valid: true };
  }

  return { valid: false, error: 'Tipe penanda berkas hanya mendukung "lines" atau "page".' };
}

/**
 * Validasi isi teks komentar (1 - 2000 karakter).
 */
export function validateCommentBody(body: string): { valid: boolean; error?: string } {
  if (!body || !body.trim()) {
    return { valid: false, error: 'Komentar tidak boleh kosong.' };
  }
  const len = body.trim().length;
  if (len > 2000) {
    return { valid: false, error: 'Komentar maksimal 2000 karakter.' };
  }
  return { valid: true };
}

/**
 * Memeriksa hak akses melihat komentar berkas untuk mahasiswa:
 * Mahasiswa hanya dapat melihat komentar jika status nilai sudah dipublikasikan
 * dan komentar tidak berstatus draf.
 */
export function canStudentViewFeedback(isPublished: boolean, isDraft: boolean): boolean {
  return isPublished && !isDraft;
}
