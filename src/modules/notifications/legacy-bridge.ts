import { prisma } from '@/lib/db';
import { savePersistentDedupKey } from './channels/in-app';
import { sendEmailNotification } from './channels/email';
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from './preferences';

export {
  type JenisNotifikasi,
  type TingkatNotifikasi,
  type NotifikasiItem,
  type KanalNotifikasi,
  type JenisAktifMap,
  DEFAULT_JENIS_AKTIF,
  type PreferensiNotifikasiItem,
  type BuatNotifikasiInput,
  type EmailPayload,
  type PengirimNotifikasi,
} from '@/features/notifikasi/types';

import {
  type JenisNotifikasi,
  type TingkatNotifikasi,
  type NotifikasiItem,
  type KanalNotifikasi,
  type JenisAktifMap,
  DEFAULT_JENIS_AKTIF,
  type PreferensiNotifikasiItem,
  type BuatNotifikasiInput,
  type EmailPayload,
  type PengirimNotifikasi,
} from '@/features/notifikasi/types';

export const pengirimEmail: PengirimNotifikasi = {
  async kirimEmail(payload: EmailPayload) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'SIAKAD UIR <notifikasi@siakad.uir.ac.id>',
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          return { success: false, error: errData.message || 'Gagal mengirim email via Resend' };
        }

        const data = await response.json();
        return { success: true, id: data.id };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Kesalahan koneksi pengiriman email',
        };
      }
    }

    const res = await sendEmailNotification({
      to: payload.to,
      subject: payload.subject,
      bodyText: payload.text || payload.html.replace(/<[^>]+>/g, ' ').trim(),
      bodyHtml: payload.html,
    });

    return {
      success: res.success,
      id: `mock-email-${Date.now()}`,
      error: res.error,
    };
  },
};

function getLegacyNotifStore(): NotifikasiItem[] {
  return ((globalThis as any).__siajarNotifLegacyItems ??= [
    {
      id: 'notif-seed-1',
      penggunaId: 'mhs-1',
      jenis: 'KRS',
      tingkat: 'PENTING',
      judul: 'KRS Disetujui Dosen Wali',
      isiTemplate:
        'KRS Semester Ganjil 2026/2027 (21 SKS) telah disetujui oleh Dr. Ardiansyah, S.T., M.Kom.',
      isiAI: null,
      tautan: '/mahasiswa/krs',
      kunciDedup: 'krs-approved-ganjil-2026',
      dibacaPada: null,
      ditundaSampai: null,
      dibuatPada: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'notif-seed-2',
      penggunaId: 'mhs-1',
      jenis: 'UKT',
      tingkat: 'INFO',
      judul: 'Pembayaran UKT Terverifikasi',
      isiTemplate:
        'Status administrasi keuangan UKT Anda terverifikasi LUNAS untuk semester berjalan.',
      isiAI: null,
      tautan: '/mahasiswa/ukt',
      kunciDedup: 'ukt-lunas-ganjil-2026',
      dibacaPada: null,
      ditundaSampai: null,
      dibuatPada: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'notif-seed-3',
      penggunaId: 'mhs-1',
      jenis: 'TUGAS_TENGGAT',
      tingkat: 'MENDESAK',
      judul: 'Tenggat Tugas: Proyek Basis Data',
      isiTemplate:
        'Tugas Perancangan ERD Basis Data berakhir besok pukul 23:59. Segera unggah laporan Anda.',
      isiAI: null,
      tautan: '/mahasiswa/tugas',
      kunciDedup: 'tugas-basisdata-h1',
      dibacaPada: null,
      ditundaSampai: null,
      dibuatPada: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
  ]);
}

function getLegacyPrefStore(): Map<string, PreferensiNotifikasiItem> {
  return ((globalThis as any).__siajarNotifLegacyPrefs ??= new Map<
    string,
    PreferensiNotifikasiItem
  >());
}

/**
 * Memeriksa apakah waktu acuan berada dalam rentang jam tenang (misal 22:00 - 06:00).
 */
export function apakahDalamJamTenang(
  jamMulai?: string | null,
  jamSelesai?: string | null,
  waktuCek: Date = new Date()
): boolean {
  if (!jamMulai || !jamSelesai) return false;

  const [startH, startM] = jamMulai.split(':').map(Number);
  const [endH, endM] = jamSelesai.split(':').map(Number);

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return false;

  const nowMins = waktuCek.getHours() * 60 + waktuCek.getMinutes();
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;

  if (startMins > endMins) {
    return nowMins >= startMins || nowMins < endMins;
  } else if (startMins < endMins) {
    return nowMins >= startMins && nowMins < endMins;
  }

  return false;
}

/**
 * Menghitung waktu akhir jam tenang berikutnya relatif terhadap waktu acuan.
 */
export function hitungAkhirJamTenang(
  jamSelesai: string,
  waktuAcuan: Date = new Date()
): Date {
  const [endH, endM] = jamSelesai.split(':').map(Number);
  const target = new Date(waktuAcuan);
  target.setHours(endH, endM, 0, 0);

  if (target.getTime() <= waktuAcuan.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

export const NotifikasiService = {
  getPreferensi: async (penggunaId: string): Promise<PreferensiNotifikasiItem> => {
    if (process.env.DATABASE_URL) {
      try {
        const dbPref = await prisma.preferensiNotifikasi.findUnique({
          where: { penggunaId },
        });
        if (dbPref) {
          return {
            penggunaId: dbPref.penggunaId,
            jamTenangMulai: dbPref.jamTenangMulai,
            jamTenangSelesai: dbPref.jamTenangSelesai,
            jenisAktif: (dbPref.jenisAktif as unknown as JenisAktifMap) || DEFAULT_JENIS_AKTIF,
            emailCadangan: dbPref.emailCadangan,
          };
        }
      } catch {
        // fallback
      }
    }

    const preferensiDb = getLegacyPrefStore();
    const existing = preferensiDb.get(penggunaId);
    if (existing) return existing;

    const unifiedPref = await getUserNotificationPreferences(penggunaId);
    const defaultPref: PreferensiNotifikasiItem = {
      penggunaId,
      jamTenangMulai: unifiedPref.quiet_hours_start ?? '22:00',
      jamTenangSelesai: unifiedPref.quiet_hours_end ?? '06:00',
      jenisAktif: JSON.parse(JSON.stringify(DEFAULT_JENIS_AKTIF)),
      emailCadangan: unifiedPref.backup_email ?? null,
    };
    preferensiDb.set(penggunaId, defaultPref);
    return defaultPref;
  },

  simpanPreferensi: async (
    penggunaId: string,
    data: Partial<PreferensiNotifikasiItem>
  ): Promise<PreferensiNotifikasiItem> => {
    const current = await NotifikasiService.getPreferensi(penggunaId);

    const mergedJenisAktif: JenisAktifMap = {
      ...current.jenisAktif,
      ...(data.jenisAktif || {}),
    };

    // Aturan Mutlak: Peringatan keamanan selalu aktif pada kanal aplikasi
    mergedJenisAktif.KEAMANAN = {
      ...mergedJenisAktif.KEAMANAN,
      app: true,
    };

    const updated: PreferensiNotifikasiItem = {
      penggunaId,
      jamTenangMulai:
        data.jamTenangMulai !== undefined ? data.jamTenangMulai : current.jamTenangMulai,
      jamTenangSelesai:
        data.jamTenangSelesai !== undefined ? data.jamTenangSelesai : current.jamTenangSelesai,
      jenisAktif: mergedJenisAktif,
      emailCadangan:
        data.emailCadangan !== undefined ? data.emailCadangan : current.emailCadangan,
    };

    getLegacyPrefStore().set(penggunaId, updated);

    // Sinkronkan ke preferensi terpusat di src/modules/notifications
    await updateUserNotificationPreferences(penggunaId, {
      quiet_hours_start: updated.jamTenangMulai,
      quiet_hours_end: updated.jamTenangSelesai,
      backup_email: updated.emailCadangan,
      events: {
        assignment_due: updated.jenisAktif.TUGAS_TENGGAT?.app ?? true,
        attendance_open: updated.jenisAktif.KEHADIRAN?.app ?? true,
        grades: updated.jenisAktif.NILAI?.app ?? true,
      },
    });

    if (process.env.DATABASE_URL) {
      try {
        await prisma.preferensiNotifikasi.upsert({
          where: { penggunaId },
          update: {
            jamTenangMulai: updated.jamTenangMulai,
            jamTenangSelesai: updated.jamTenangSelesai,
            jenisAktif: updated.jenisAktif as object,
            emailCadangan: updated.emailCadangan,
          },
          create: {
            penggunaId,
            jamTenangMulai: updated.jamTenangMulai,
            jamTenangSelesai: updated.jamTenangSelesai,
            jenisAktif: updated.jenisAktif as object,
            emailCadangan: updated.emailCadangan,
          },
        });
      } catch {
        // fallback
      }
    }

    return updated;
  },

  buatNotifikasi: async (params: BuatNotifikasiInput): Promise<NotifikasiItem> => {
    const waktuAcuan = params.waktuAcuan || new Date();
    const notifikasiDb = getLegacyNotifStore();

    // 1. Cek duplikasi persisten di store aplikasi
    const existing = notifikasiDb.find(
      (n) => n.penggunaId === params.penggunaId && n.kunciDedup === params.kunciDedup
    );
    if (existing) {
      return existing;
    }

    savePersistentDedupKey(`${params.penggunaId}:${params.kunciDedup}`);

    // 2. Ambil preferensi pengguna
    const pref = await NotifikasiService.getPreferensi(params.penggunaId);

    // 3. Evaluasi kanal aplikasi
    const isAppChannelActive =
      params.jenis === 'KEAMANAN' || (pref.jenisAktif[params.jenis]?.app ?? true);

    // 4. Evaluasi aturan Jam Tenang
    let ditundaSampai: string | null = null;
    const isQuietHour = apakahDalamJamTenang(
      pref.jamTenangMulai,
      pref.jamTenangSelesai,
      waktuAcuan
    );

    if (isQuietHour && params.tingkat !== 'MENDESAK' && params.jenis !== 'KEAMANAN') {
      const akhir = hitungAkhirJamTenang(pref.jamTenangSelesai || '06:00', waktuAcuan);
      ditundaSampai = akhir.toISOString();
    }

    const item: NotifikasiItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      penggunaId: params.penggunaId,
      jenis: params.jenis,
      tingkat: params.tingkat,
      judul: params.judul,
      isiTemplate: params.isiTemplate,
      isiAI: params.isiAI || null,
      tautan: params.tautan || null,
      kunciDedup: params.kunciDedup,
      dibacaPada: null,
      ditundaSampai,
      dibuatPada: waktuAcuan.toISOString(),
    };

    if (isAppChannelActive) {
      notifikasiDb.unshift(item);
    }

    if (process.env.DATABASE_URL) {
      try {
        if (isAppChannelActive) {
          await prisma.notifikasi.upsert({
            where: {
              penggunaId_kunciDedup: {
                penggunaId: params.penggunaId,
                kunciDedup: params.kunciDedup,
              },
            },
            update: {},
            create: {
              id: item.id,
              penggunaId: item.penggunaId,
              jenis: item.jenis,
              tingkat: item.tingkat,
              judul: item.judul,
              isiTemplate: item.isiTemplate,
              isiAI: item.isiAI,
              tautan: item.tautan,
              kunciDedup: item.kunciDedup,
              ditundaSampai: item.ditundaSampai ? new Date(item.ditundaSampai) : null,
              dibuatPada: new Date(item.dibuatPada),
            },
          });
        }
      } catch {
        // fallback
      }
    }

    const isEmailActive = pref.jenisAktif[params.jenis]?.email ?? false;
    if (isEmailActive) {
      const emailTujuan = pref.emailCadangan || `${params.penggunaId}@student.uir.ac.id`;
      await pengirimEmail.kirimEmail({
        to: emailTujuan,
        subject: `[SIAKAD UIR] ${params.judul}`,
        html: `<div style="font-family: sans-serif; padding: 16px;">
          <h2 style="color: rgb(15, 23, 42);">${params.judul}</h2>
          <p style="color: rgb(51, 65, 85); font-size: 15px;">${params.isiTemplate}</p>
          ${params.tautan ? `<p><a href="${params.tautan}" style="color: rgb(37, 99, 235);">Lihat Rincian</a></p>` : ''}
          <hr style="border: none; border-top: 1px solid rgb(226, 232, 240); margin-top: 20px;" />
          <p style="color: rgb(100, 116, 139); font-size: 12px;">Sistem Informasi Akademik Universitas Islam Riau</p>
        </div>`,
      });
    }

    return item;
  },

  getNotifikasiPengguna: async (
    penggunaId: string,
    options: {
      hanyaBelumDibaca?: boolean;
      includeDitunda?: boolean;
      waktuAcuan?: Date;
    } = {}
  ): Promise<NotifikasiItem[]> => {
    const waktuAcuan = options.waktuAcuan || new Date();
    const notifikasiDb = getLegacyNotifStore();

    let list = notifikasiDb.filter((n) => n.penggunaId === penggunaId);

    if (!options.includeDitunda) {
      list = list.filter((n) => {
        if (!n.ditundaSampai) return true;
        return new Date(n.ditundaSampai).getTime() <= waktuAcuan.getTime();
      });
    }

    if (options.hanyaBelumDibaca) {
      list = list.filter((n) => n.dibacaPada === null);
    }

    return list.sort(
      (a, b) => new Date(b.dibuatPada).getTime() - new Date(a.dibuatPada).getTime()
    );
  },

  tandaiDibaca: async (notifikasiId: string, penggunaId: string): Promise<NotifikasiItem> => {
    const notifikasiDb = getLegacyNotifStore();
    const item = notifikasiDb.find((n) => n.id === notifikasiId);
    if (!item) {
      throw new Error('Notifikasi tidak ditemukan.');
    }

    if (item.penggunaId !== penggunaId) {
      throw new Error('UNAUTHORIZED: Anda tidak berwenang mengakses notifikasi ini.');
    }

    item.dibacaPada = new Date().toISOString();

    if (process.env.DATABASE_URL) {
      try {
        await prisma.notifikasi.update({
          where: { id: notifikasiId },
          data: { dibacaPada: new Date() },
        });
      } catch {
        // fallback
      }
    }

    return item;
  },

  tandaiSemuaDibaca: async (penggunaId: string): Promise<{ count: number }> => {
    const notifikasiDb = getLegacyNotifStore();
    const userNotifs = notifikasiDb.filter(
      (n) => n.penggunaId === penggunaId && n.dibacaPada === null
    );

    const now = new Date().toISOString();
    userNotifs.forEach((n) => {
      n.dibacaPada = now;
    });

    if (process.env.DATABASE_URL) {
      try {
        await prisma.notifikasi.updateMany({
          where: { penggunaId, dibacaPada: null },
          data: { dibacaPada: new Date() },
        });
      } catch {
        // fallback
      }
    }

    return { count: userNotifs.length };
  },

  tundaNotifikasi: async (
    notifikasiId: string,
    penggunaId: string,
    menit: number,
    waktuAcuan: Date = new Date()
  ): Promise<NotifikasiItem> => {
    const notifikasiDb = getLegacyNotifStore();
    const item = notifikasiDb.find((n) => n.id === notifikasiId);
    if (!item) {
      throw new Error('Notifikasi tidak ditemukan.');
    }

    if (item.penggunaId !== penggunaId) {
      throw new Error('UNAUTHORIZED: Anda tidak berwenang menunda notifikasi ini.');
    }

    const tundaSampai = new Date(waktuAcuan.getTime() + menit * 60 * 1000);
    item.ditundaSampai = tundaSampai.toISOString();

    if (process.env.DATABASE_URL) {
      try {
        await prisma.notifikasi.update({
          where: { id: notifikasiId },
          data: { ditundaSampai: tundaSampai },
        });
      } catch {
        // fallback
      }
    }

    return item;
  },
};
