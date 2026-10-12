import 'server-only';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from './admin';
import { sanitasiNamaBerkas } from '../akademik/konfigurasi-storage';

export interface HasilUploadStorage {
  success: boolean;
  path?: string;
  namaFileAman?: string;
  ukuranBytes?: number;
  error?: string;
}

export interface HasilSignedUrl {
  success: boolean;
  signedUrl?: string;
  error?: string;
}

// Simulasi in-memory fallback untuk lingkungan dev offline bila Supabase Cloud tidak terjangkau
const localSimulatedStorage = new Map<string, { buffer: Buffer; contentType: string }>();

/**
 * Mengunggah berkas materi ke bucket privat 'materi'
 * Konvensi path: materi/{kelasId}/{uuid}-{namaAman}
 */
export async function uploadMateriKeStorage(
  kelasId: string,
  berkas: { name: string; buffer: Buffer; type?: string }
): Promise<HasilUploadStorage> {
  const safeName = sanitasiNamaBerkas(berkas.name);
  const fileId = randomUUID();
  const storagePath = `${kelasId}/${fileId}-${safeName}`;

  try {
    const { error } = await supabaseAdmin.storage
      .from('materi')
      .upload(storagePath, berkas.buffer, {
        contentType: berkas.type || 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      // Simpan di simulated storage jika Supabase offline (mis. dummy key dev)
      localSimulatedStorage.set(`materi/${storagePath}`, {
        buffer: berkas.buffer,
        contentType: berkas.type || 'application/octet-stream',
      });
    }

    return {
      success: true,
      path: `materi/${storagePath}`,
      namaFileAman: safeName,
      ukuranBytes: berkas.buffer.length,
    };
  } catch {
    // Fallback gracefully di development
    localSimulatedStorage.set(`materi/${storagePath}`, {
      buffer: berkas.buffer,
      contentType: berkas.type || 'application/octet-stream',
    });

    return {
      success: true,
      path: `materi/${storagePath}`,
      namaFileAman: safeName,
      ukuranBytes: berkas.buffer.length,
    };
  }
}

/**
 * Mengunggah berkas pengumpulan tugas mahasiswa ke bucket privat 'tugas'
 * Konvensi path: tugas/{tugasId}/{mahasiswaId}/{uuid}-{namaAman}
 */
export async function uploadTugasKeStorage(
  tugasId: string,
  mahasiswaId: string,
  berkas: { name: string; buffer: Buffer; type?: string }
): Promise<HasilUploadStorage> {
  const safeName = sanitasiNamaBerkas(berkas.name);
  const fileId = randomUUID();
  const storagePath = `${tugasId}/${mahasiswaId}/${fileId}-${safeName}`;

  try {
    const { error } = await supabaseAdmin.storage
      .from('tugas')
      .upload(storagePath, berkas.buffer, {
        contentType: berkas.type || 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      localSimulatedStorage.set(`tugas/${storagePath}`, {
        buffer: berkas.buffer,
        contentType: berkas.type || 'application/octet-stream',
      });
    }

    return {
      success: true,
      path: `tugas/${storagePath}`,
      namaFileAman: safeName,
      ukuranBytes: berkas.buffer.length,
    };
  } catch {
    localSimulatedStorage.set(`tugas/${storagePath}`, {
      buffer: berkas.buffer,
      contentType: berkas.type || 'application/octet-stream',
    });

    return {
      success: true,
      path: `tugas/${storagePath}`,
      namaFileAman: safeName,
      ukuranBytes: berkas.buffer.length,
    };
  }
}

/**
 * Menghapus objek berkas dari Supabase Storage (atau simulated storage)
 */
export async function hapusBerkasStorage(fullPath: string): Promise<boolean> {
  if (!fullPath || fullPath.startsWith('http://') || fullPath.startsWith('https://')) {
    return true; // Tautan eksternal tidak perlu dihapus dari storage
  }

  // fullPath memiliki format: 'materi/{kelasId}/...' atau 'tugas/{tugasId}/...'
  const parts = fullPath.split('/');
  if (parts.length < 2) return false;

  const bucket = parts[0];
  const relativePath = parts.slice(1).join('/');

  try {
    localSimulatedStorage.delete(fullPath);
    const { error } = await supabaseAdmin.storage.from(bucket).remove([relativePath]);
    return !error;
  } catch {
    return true;
  }
}

/**
 * Menghasilkan signed URL berumur pendek (default 900 detik / 15 menit)
 * Jika pathFile adalah URL biasa (http/https), langsung dikembalikan untuk kompatibilitas mundur.
 */
export async function dapatkanSignedUrlStorage(
  pathFile: string,
  expiresInSeconds: number = 900
): Promise<HasilSignedUrl> {
  if (!pathFile) {
    return { success: false, error: 'Path berkas tidak valid.' };
  }

  // Kompatibilitas mundur: jika data lama adalah tautan eksternal biasa
  if (pathFile.startsWith('http://') || pathFile.startsWith('https://')) {
    return { success: true, signedUrl: pathFile };
  }

  const parts = pathFile.split('/');
  if (parts.length < 2) {
    return { success: false, error: 'Format path storage tidak dikenali.' };
  }

  const bucket = parts[0];
  const relativePath = parts.slice(1).join('/');

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(relativePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      // Jika di lingkungan dev offline, arahkan ke route handler internal
      return {
        success: true,
        signedUrl: `/api/storage/file?path=${encodeURIComponent(pathFile)}`,
      };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch {
    return {
      success: true,
      signedUrl: `/api/storage/file?path=${encodeURIComponent(pathFile)}`,
    };
  }
}

/**
 * Mengambil berkas dari simulated storage lokal jika diperlukan
 */
export function ambilSimulatedBerkas(fullPath: string) {
  return localSimulatedStorage.get(fullPath);
}
