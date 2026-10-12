/**
 * Konfigurasi Terpusat Penyimpanan & Validasi Berkas Supabase Storage SIAJAR
 * Mengatur batas ukuran, format file allowlist, sanitasi nama berkas, dan validasi MIME.
 */

export interface KonfigurasiUpload {
  maxUkuranMb: number;
  maxUkuranBytes: number;
  ekstensiDiizinkan: string[];
  mimeDiizinkan: string[];
}

// Batas Default Resmi SIAJAR (Dapat diambil dari tabel KonfigurasiAkademik bila tersedia)
export const KONFIGURASI_STORAGE = {
  materi: {
    maxUkuranMb: 50,
    maxUkuranBytes: 50 * 1024 * 1024,
    ekstensiDiizinkan: ['pdf', 'docx', 'pptx', 'xlsx', 'zip', 'png', 'jpg', 'jpeg', 'mp4'],
    mimeDiizinkan: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed',
      'image/png',
      'image/jpeg',
      'video/mp4',
    ],
  },
  tugas: {
    maxUkuranMb: 10,
    maxUkuranBytes: 10 * 1024 * 1024,
    ekstensiDiizinkan: ['pdf', 'docx', 'pptx', 'xlsx', 'zip', 'png', 'jpg', 'jpeg'],
    mimeDiizinkan: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed',
      'image/png',
      'image/jpeg',
    ],
  },
} as const;

export interface HasilValidasiBerkas {
  valid: boolean;
  pesanError?: string;
  namaAman?: string;
  ekstensi?: string;
  ukuranBytes?: number;
}

/**
 * Membersihkan nama berkas dari path traversal, karakter aneh, dan spasi.
 * Membatasi panjang maksimal nama dasar ke 60 karakter.
 */
export function sanitasiNamaBerkas(namaBerkas: string): string {
  // Ambil hanya nama dasar (buang path traversal)
  const namaDasar = namaBerkas.replace(/.*[/\\]/, '');

  // Pisahkan ekstensi
  const lastDot = namaDasar.lastIndexOf('.');
  let namaTanpaEkstensi = lastDot !== -1 ? namaDasar.slice(0, lastDot) : namaDasar;
  const ekstensi = lastDot !== -1 ? namaDasar.slice(lastDot + 1).toLowerCase() : '';

  // Buang karakter non-alphanumeric selain strip dan underscore, serta collapse multiple hyphens
  namaTanpaEkstensi = namaTanpaEkstensi
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  if (!namaTanpaEkstensi) {
    namaTanpaEkstensi = 'dokumen';
  }

  return ekstensi ? `${namaTanpaEkstensi}.${ekstensi}` : namaTanpaEkstensi;
}

/**
 * Validasi sisi server untuk berkas yang diunggah
 */
export function validasiBerkasServer(
  file: { name: string; size: number; type?: string },
  kategori: 'materi' | 'tugas'
): HasilValidasiBerkas {
  const config = KONFIGURASI_STORAGE[kategori];

  if (!file || !file.name) {
    return { valid: false, pesanError: 'Berkas tidak ditemukan atau belum dipilih.' };
  }

  // Cek ukuran berkas
  if (file.size <= 0) {
    return { valid: false, pesanError: 'Ukuran berkas kosong (0 byte).' };
  }

  if (file.size > config.maxUkuranBytes) {
    return {
      valid: false,
      pesanError: `Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal ${config.maxUkuranMb} MB.`,
    };
  }

  // Cek ekstensi
  const namaAman = sanitasiNamaBerkas(file.name);
  const lastDot = namaAman.lastIndexOf('.');
  const ekstensi = lastDot !== -1 ? namaAman.slice(lastDot + 1).toLowerCase() : '';

  if (!ekstensi || !(config.ekstensiDiizinkan as readonly string[]).includes(ekstensi)) {
    return {
      valid: false,
      pesanError: `Format berkas (.${ekstensi || 'tanpa ekstensi'}) tidak didukung. Format yang diizinkan: ${config.ekstensiDiizinkan.join(', ')}.`,
    };
  }

  // Cek MIME type jika ada
  if (file.type && !(config.mimeDiizinkan as readonly string[]).includes(file.type)) {
    // Toleransi jika file binary umum seperti octet-stream untuk zip
    const isZipOctet = (ekstensi === 'zip' || ekstensi === 'docx' || ekstensi === 'xlsx' || ekstensi === 'pptx') &&
      (file.type === 'application/octet-stream' || file.type === 'application/zip');
    if (!isZipOctet) {
      return {
        valid: false,
        pesanError: `Tipe MIME (${file.type}) tidak sesuai dengan format berkas yang diizinkan.`,
      };
    }
  }

  return {
    valid: true,
    namaAman,
    ekstensi,
    ukuranBytes: file.size,
  };
}
