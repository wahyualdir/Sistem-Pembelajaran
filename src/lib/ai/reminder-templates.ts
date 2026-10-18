/**
 * Templat Statis Fallback Pengingat Proaktif SIAJAR (Section 12.4)
 * Digunakan jika pemanggilan AI gagal, timeout > 5s, atau dimatikan.
 * Seluruh teks mengikuti kaidah natural Bahasa Indonesia tanpa serapan/emoji.
 */

export interface ReminderPayload {
  title?: string;
  courseName?: string;
  deadline?: string;
  timeRemaining?: string;
  attendancePercent?: number;
  safeAbsencesRemaining?: number;
  device?: string;
  location?: string;
  weeklyTasksCount?: number;
  weeklyExamsCount?: number;
}

export type ReminderKind =
  | 'tugas_h1'
  | 'tugas_3jam'
  | 'ujian_h1'
  | 'kehadiran'
  | 'materi_baru'
  | 'login_baru'
  | 'ringkasan_mingguan';

export function getStaticReminderMessage(kind: ReminderKind, data: ReminderPayload): string {
  switch (kind) {
    case 'tugas_h1':
      return `Tugas ${data.title || 'perkuliahan'} pada kelas ${data.courseName || ''} akan ditutup besok. Pastikan kamu telah memeriksa kelengkapan berkas sebelum mengumpulkan.`.trim();

    case 'tugas_3jam':
      return `Tenggat pengumpulan tugas ${data.title || ''} tersisa kurang dari 3 jam. Segera kumpulkan berkas jawabanmu sebelum sistem menutup pengumpulan.`.trim();

    case 'ujian_h1':
      return `Ujian ${data.title || ''} untuk kelas ${data.courseName || ''} dijadwalkan buka besok. Pastikan koneksi internet dan perangkatmu dalam kondisi baik.`.trim();

    case 'kehadiran':
      return `Tingkat kehadiranmu di ${data.courseName || 'mata kuliah ini'} saat ini ${data.attendancePercent ?? 0}%. Kamu memiliki ${data.safeAbsencesRemaining ?? 0} kesempatan absen lagi sebelum berada di bawah batas minimal 75%.`.trim();

    case 'materi_baru':
      return `Materi baru "${data.title || ''}" telah dirilis pada kelas ${data.courseName || ''}. Luangkan waktu untuk mempelajari modul perkuliahan ini.`.trim();

    case 'login_baru':
      return `Terdeteksi aktivitas masuk baru ke akunmu menggunakan ${data.device || 'perangkat baru'} dari ${data.location || 'lokasi baru'}. Jika ini bukan kamu, segera amankan akunmu.`.trim();

    case 'ringkasan_mingguan':
      return `Agenda minggu ini mencakup ${data.weeklyTasksCount ?? 0} tugas dan ${data.weeklyExamsCount ?? 0} ujian yang perlu kamu selesaikan. Jaga ritme belajar dan periksa jadwal perkuliahanmu secara berkala.`.trim();

    default:
      return 'Kamu memiliki pengingat kegiatan akademik baru di SIAJAR.';
  }
}

/**
 * Memeriksa apakah waktu saat ini berada pada jam tenang (22.00 - 06.00 WIB)
 */
export function isInQuietHours(date: Date = new Date()): boolean {
  // Hitung jam di zona WIB (UTC+7)
  const utcHours = date.getUTCHours();
  const wibHours = (utcHours + 7) % 24;
  return wibHours >= 22 || wibHours < 6;
}

/**
 * Menyesuaikan waktu kirim pengingat bila jatuh pada jam tenang.
 * Pengingat yang jatuh di jam tenang digeser ke pukul 06.00 WIB pada hari yang sama / esok paginya.
 * Pengecualian: login_baru TIDAK mengikuti jam tenang (segera dikirim demi keamanan).
 */
export function adjustScheduledTimeForQuietHours(date: Date, kind: ReminderKind): Date {
  if (kind === 'login_baru') {
    return date;
  }

  const d = new Date(date);
  const utcHours = d.getUTCHours();
  const wibHours = (utcHours + 7) % 24;

  if (wibHours >= 22 || wibHours < 6) {
    // Geser ke jam 06.00 WIB (23.00 UTC hari sebelumnya bila wibHours < 6, atau 23.00 UTC hari ini jika wibHours >= 22)
    const shifted = new Date(d);
    if (wibHours >= 22) {
      // 22.00 WIB = 15.00 UTC. Jam 06.00 WIB esok hari = 23.00 UTC hari ini.
      shifted.setUTCHours(23, 0, 0, 0);
    } else {
      // 00.00-05.59 WIB = 17.00-22.59 UTC kemarin. Jam 06.00 WIB hari ini = 23.00 UTC hari kemarin.
      shifted.setUTCHours(23, 0, 0, 0);
    }
    return shifted;
  }

  return d;
}
