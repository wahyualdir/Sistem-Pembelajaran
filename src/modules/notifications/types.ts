export type NotificationType =
  | 'ASSIGNMENT_NEW'
  | 'ASSIGNMENT_DUE'
  | 'EXAM_UPCOMING'
  | 'ATTENDANCE_OPEN'
  | 'GRADE_PUBLISHED'
  | 'GRADE_CHANGE_DECIDED'
  | 'GRADE_CHANGE_EXECUTED'
  | 'MATERIAL_NEW'
  | 'ANNOUNCEMENT_NEW'
  | 'FORUM_REPLY'
  | 'EARLY_WARNING'
  | 'SYSTEM_ALERT'
  | 'TENGGAT_DIPERPANJANG'
  | 'SANGGAHAN_BARU'
  | 'KEPUTUSAN_SANGGAHAN'
  | 'PERMOHONAN_IZIN_BARU'
  | 'KEPUTUSAN_IZIN'
  | 'BERITA_ACARA_BELUM_DIISI'
  | 'DITAMBAHKAN_KE_KELOMPOK'
  | 'PESAN_BARU'
  | 'KONSULTASI_DIPESAN'
  | 'KONSULTASI_DIBATALKAN'
  | 'POLLING_DIBUKA'
  | 'PERIODE_EVALUASI_DIBUKA'
  | 'UJIAN_SUSULAN_DIJADWALKAN'
  | 'MATERI_TERBUKA'
  | 'TUGAS_DIKOREKSI'
  | 'PENGINGAT_AI'
  // Lampiran B: Jenis Notifikasi Baru Peta Pulau
  | 'PULAU_TERBUKA'
  | 'RINGKASAN_PAGI'
  | 'KONTEN_AI_REVIEW_DIGEST'
  | 'PEMBUATAN_KONTEN_SELESAI'
  | 'KONTEN_TERBIT'
  | 'KONTEN_PERLU_TINJAU_ULANG'
  | 'PERMINTAAN_BANTUAN'
  | 'PERMINTAAN_DIJAWAB'
  | 'JAWABAN_TERBANTU'
  | 'MAHASISWA_TERTINGGAL'
  | 'REKAP_SEMESTER_SIAP'
  | 'LAPORAN_TUKAR_KEAHLIAN';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'WHATSAPP';

export type ReminderStage = 'H_3' | 'H_1' | 'H_3_HOURS' | 'H_1_HOUR' | 'IMMEDIATE';

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  target_url?: string | null;
  class_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  dedup_key?: string | null;
  snoozed_until?: string | null;
  read_at: string | null;
  created_at: string;
}

export interface UserNotificationPreferences {
  user_id: string;
  phone_number?: string | null;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  backup_email?: string | null;
  channels: {
    in_app: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  events: {
    assignment_due: boolean;
    exam_upcoming: boolean;
    attendance_open: boolean;
    announcement: boolean;
    grades: boolean;
    forum_and_early_warning: boolean;
    peta_pulau?: boolean;
    ringkasan_pagi?: boolean;
    flashcard_dan_podcast?: boolean;
    tukar_keahlian?: boolean;
    rekap_semester?: boolean;
  };
  updated_at: string;
}

export interface NotifyPayload {
  userId: string;
  type: NotificationType | string;
  title: string;
  body: string;
  targetUrl?: string | null;
  classId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  dedupKey?: string;
  phoneNumber?: string | null;
  channels?: NotificationChannel[];
}

export interface NotifyResult {
  ok: boolean;
  notificationId?: string;
  dispatchedChannels: NotificationChannel[];
  skippedDueToDedup?: boolean;
  error?: string;
}

export interface ScheduledReminderCheckResult {
  assignmentsChecked: number;
  examsChecked: number;
  attendanceSessionsChecked: number;
  remindersDispatched: number;
  skippedDuplicates: number;
  errors: string[];
}
