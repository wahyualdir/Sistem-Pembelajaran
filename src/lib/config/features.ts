/**
 * Feature Flags Configuration for SIAJAR
 * Mengontrol ketersediaan modul legacy atau modul tambahan tanpa menghapus kode.
 * Mengatur aktivasi bertahap persistensi basis data per domain (Fase 3A .. 3F).
 */
export const FEATURES = {
  // Flag menu SIAKAD legacy (KRS, UKT, Surat, Simulasi IPK, KHS)
  // Default mati (false) sesuai Aturan 4.5 Prompt V2 agar menu lama tidak muncul di UI / rute aktif
  siakadLegacy: process.env.NEXT_PUBLIC_ENABLE_SIAKAD_LEGACY === 'true',

  // Modul Pembelajaran Terpadu (LMS, Ujian/Kuis, Presensi QR/Lokasi/Biometrik)
  lms: true,
  liveExams: true,
  advancedAttendance: true,
};

/**
 * Memeriksa apakah aplikasi berjalan dalam mode demo/development.
 * Di production, mode demo mati total kecuali ALLOW_DEMO_AUTH="true" secara eksplisit.
 */
export function isDemoMode(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_AUTH === 'true';
}

/**
 * Feature Flags Per-Domain Persistensi Basis Data (Fase 3A .. 3F)
 */
export const FEATURE_FLAGS = {
  // Domain 1: Identitas, Pengguna, Peran, Audit Log (Fase 2E / 3A)
  FF_PERSISTENCE_IDENTITY: process.env.NEXT_PUBLIC_FF_PERSISTENCE_IDENTITY !== 'false',

  // Domain 2: Master Kurikulum, Kelas Perkuliahan, Peserta & Asisten (Fase 3A)
  FF_PERSISTENCE_ACADEMIC: process.env.NEXT_PUBLIC_FF_PERSISTENCE_ACADEMIC !== 'false',

  // Domain 3: Evaluasi Akademik & Buku Nilai (Fase 3B)
  FF_PERSISTENCE_GRADES: process.env.NEXT_PUBLIC_FF_PERSISTENCE_GRADES === 'true',

  // Domain 4: Kehadiran Kuliah & Dispensasi (Fase 3C)
  FF_PERSISTENCE_ATTENDANCE: process.env.NEXT_PUBLIC_FF_PERSISTENCE_ATTENDANCE === 'true',

  // Domain 5: Kuis, Ujian CBT & Telemetri Proctoring (Fase 3D)
  FF_PERSISTENCE_QUIZ: process.env.NEXT_PUBLIC_FF_PERSISTENCE_QUIZ === 'true',

  // Domain 6: Sengketa Nilai Ujian & Putusan Perubahan Nilai Final (Fase 3E)
  FF_PERSISTENCE_DISPUTES: process.env.NEXT_PUBLIC_FF_PERSISTENCE_DISPUTES === 'true',

  // Domain 7: Konten Pembelajaran, Forum, Notifikasi & Layanan Kampus (Fase 3F)
  FF_PERSISTENCE_CONTENT: process.env.NEXT_PUBLIC_FF_PERSISTENCE_CONTENT === 'true',
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export function isFeatureFlagActive(key: FeatureFlagKey): boolean {
  return Boolean(FEATURE_FLAGS[key]);
}
