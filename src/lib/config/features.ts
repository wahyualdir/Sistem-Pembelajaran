/**
 * Feature Flags Configuration for SIAJAR
 * Mengontrol ketersediaan modul legacy atau modul tambahan tanpa menghapus kode.
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
