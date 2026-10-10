export type JenisNotifikasi =
  | "TUGAS_TENGGAT"
  | "KEHADIRAN"
  | "KRS"
  | "UKT"
  | "NILAI"
  | "JADWAL"
  | "KEAMANAN"
  | "BRIEFING"
  | "PENGUMUMAN";

export type TingkatNotifikasi = "INFO" | "PENTING" | "MENDESAK";

export interface NotifikasiItem {
  id: string;
  penggunaId: string;
  jenis: JenisNotifikasi;
  tingkat: TingkatNotifikasi;
  judul: string;
  isiTemplate: string;
  isiAI?: string | null;
  tautan?: string | null;
  kunciDedup: string;
  dibacaPada?: string | null;
  ditundaSampai?: string | null;
  dibuatPada: string;
}

export interface KanalNotifikasi {
  app: boolean;
  email: boolean;
}

export type JenisAktifMap = Record<JenisNotifikasi, KanalNotifikasi>;

export const DEFAULT_JENIS_AKTIF: JenisAktifMap = {
  TUGAS_TENGGAT: { app: true, email: true },
  KEHADIRAN: { app: true, email: false },
  KRS: { app: true, email: true },
  UKT: { app: true, email: true },
  NILAI: { app: true, email: true },
  JADWAL: { app: true, email: false },
  KEAMANAN: { app: true, email: true },
  BRIEFING: { app: true, email: false },
  PENGUMUMAN: { app: true, email: false },
};

export interface PreferensiNotifikasiItem {
  penggunaId: string;
  jamTenangMulai: string | null; // Contoh: "22:00"
  jamTenangSelesai: string | null; // Contoh: "06:00"
  jenisAktif: JenisAktifMap;
  emailCadangan: string | null;
}

export interface BuatNotifikasiInput {
  penggunaId: string;
  jenis: JenisNotifikasi;
  tingkat: TingkatNotifikasi;
  judul: string;
  isiTemplate: string;
  isiAI?: string;
  tautan?: string;
  kunciDedup: string;
  waktuAcuan?: Date;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface PengirimNotifikasi {
  kirimEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }>;
}
