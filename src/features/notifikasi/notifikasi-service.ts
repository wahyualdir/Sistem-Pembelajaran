import {
  JenisNotifikasi,
  TingkatNotifikasi,
  NotifikasiItem,
  PreferensiNotifikasiItem,
  BuatNotifikasiInput,
  JenisAktifMap,
  DEFAULT_JENIS_AKTIF,
} from "./types";
import { pengirimEmail } from "./pengirim-email";
import { prisma } from "@/lib/db";

export { DEFAULT_JENIS_AKTIF };

// Store data in-memory sebagai fallback ketika Prisma offline/local
let notifikasiDb: NotifikasiItem[] = [
  {
    id: "notif-seed-1",
    penggunaId: "mhs-1",
    jenis: "KRS",
    tingkat: "PENTING",
    judul: "KRS Disetujui Dosen Wali",
    isiTemplate: "KRS Semester Ganjil 2026/2027 (21 SKS) telah disetujui oleh Dr. Ardiansyah, S.T., M.Kom.",
    isiAI: null,
    tautan: "/mahasiswa/krs",
    kunciDedup: "krs-approved-ganjil-2026",
    dibacaPada: null,
    ditundaSampai: null,
    dibuatPada: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "notif-seed-2",
    penggunaId: "mhs-1",
    jenis: "UKT",
    tingkat: "INFO",
    judul: "Pembayaran UKT Terverifikasi",
    isiTemplate: "Status administrasi keuangan UKT Anda terverifikasi LUNAS untuk semester berjalan.",
    isiAI: null,
    tautan: "/mahasiswa/ukt",
    kunciDedup: "ukt-lunas-ganjil-2026",
    dibacaPada: null,
    ditundaSampai: null,
    dibuatPada: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "notif-seed-3",
    penggunaId: "mhs-1",
    jenis: "TUGAS_TENGGAT",
    tingkat: "MENDESAK",
    judul: "Tenggat Tugas: Proyek Basis Data",
    isiTemplate: "Tugas Perancangan ERD Basis Data berakhir besok pukul 23:59. Segera unggah laporan Anda.",
    isiAI: null,
    tautan: "/mahasiswa/tugas",
    kunciDedup: "tugas-basisdata-h1",
    dibacaPada: null,
    ditundaSampai: null,
    dibuatPada: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

let preferensiDb: Map<string, PreferensiNotifikasiItem> = new Map();

/**
 * Memeriksa apakah waktu acuan berada dalam rentang jam tenang (misal 22:00 - 06:00).
 */
export function apakahDalamJamTenang(
  jamMulai?: string | null,
  jamSelesai?: string | null,
  waktuCek: Date = new Date()
): boolean {
  if (!jamMulai || !jamSelesai) return false;

  const [startH, startM] = jamMulai.split(":").map(Number);
  const [endH, endM] = jamSelesai.split(":").map(Number);

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return false;

  const nowMins = waktuCek.getHours() * 60 + waktuCek.getMinutes();
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;

  if (startMins > endMins) {
    // Melewati tengah malam (misal 22:00 - 06:00)
    return nowMins >= startMins || nowMins < endMins;
  } else if (startMins < endMins) {
    // Dalam hari yang sama (misal 13:00 - 15:00)
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
  const [endH, endM] = jamSelesai.split(":").map(Number);
  const target = new Date(waktuAcuan);
  target.setHours(endH, endM, 0, 0);

  // Jika jam selesai sudah lewat hari ini, berarti berakhir besok
  if (target.getTime() <= waktuAcuan.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

export const NotifikasiService = {
  /**
   * Mengambil preferensi notifikasi pengguna (atau nilai bawaan).
   */
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
        // Database offline fallback
      }
    }

    const existing = preferensiDb.get(penggunaId);
    if (existing) return existing;

    const defaultPref: PreferensiNotifikasiItem = {
      penggunaId,
      jamTenangMulai: "22:00",
      jamTenangSelesai: "06:00",
      jenisAktif: JSON.parse(JSON.stringify(DEFAULT_JENIS_AKTIF)),
      emailCadangan: null,
    };
    preferensiDb.set(penggunaId, defaultPref);
    return defaultPref;
  },

  /**
   * Menyimpan preferensi notifikasi pengguna.
   * Aturan Mutlak: Peringatan KEAMANAN pada kanal in-app tidak dapat dimatikan!
   */
  simpanPreferensi: async (
    penggunaId: string,
    data: Partial<PreferensiNotifikasiItem>
  ): Promise<PreferensiNotifikasiItem> => {
    const current = await NotifikasiService.getPreferensi(penggunaId);

    const mergedJenisAktif: JenisAktifMap = {
      ...current.jenisAktif,
      ...(data.jenisAktif || {}),
    };

    // Keamanan: Peringatan keamanan selalu aktif pada kanal aplikasi
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

    preferensiDb.set(penggunaId, updated);

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
        // Database offline fallback
      }
    }

    return updated;
  },

  /**
   * Membuat notifikasi baru secara IDEMPOTEN berdasarkan kunciDedup.
   * Memanggil dua kali dengan kunciDedup yang sama tidak akan menggandakan data.
   */
  buatNotifikasi: async (params: BuatNotifikasiInput): Promise<NotifikasiItem> => {
    const waktuAcuan = params.waktuAcuan || new Date();

    // 1. Cek duplikasi di memory store
    const existing = notifikasiDb.find(
      (n) => n.penggunaId === params.penggunaId && n.kunciDedup === params.kunciDedup
    );
    if (existing) {
      return existing;
    }

    // 2. Ambil preferensi pengguna
    const pref = await NotifikasiService.getPreferensi(params.penggunaId);

    // 3. Evaluasi apakah kanal aplikasi diizinkan
    const isAppChannelActive =
      params.jenis === "KEAMANAN" || (pref.jenisAktif[params.jenis]?.app ?? true);

    // 4. Evaluasi aturan Jam Tenang:
    // Notifikasi non-mendesak ditahan sampai jam tenang selesai.
    // Peringatan MENDESAK dan KEAMANAN tidak pernah ditahan!
    let ditundaSampai: string | null = null;
    const isQuietHour = apakahDalamJamTenang(
      pref.jamTenangMulai,
      pref.jamTenangSelesai,
      waktuAcuan
    );

    if (isQuietHour && params.tingkat !== "MENDESAK" && params.jenis !== "KEAMANAN") {
      const akhir = hitungAkhirJamTenang(pref.jamTenangSelesai || "06:00", waktuAcuan);
      ditundaSampai = akhir.toISOString();
    }

    // 5. Susun entitas notifikasi
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

    // 6. Simpan ke Prisma jika online
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
        // Database offline fallback
      }
    }

    // 7. Pengiriman email jika kanal email aktif
    const isEmailActive = pref.jenisAktif[params.jenis]?.email ?? false;
    if (isEmailActive) {
      const emailTujuan = pref.emailCadangan || `${params.penggunaId}@student.uir.ac.id`;
      await pengirimEmail.kirimEmail({
        to: emailTujuan,
        subject: `[SIAKAD UIR] ${params.judul}`,
        html: `<div style="font-family: sans-serif; padding: 16px;">
          <h2 style="color: rgb(15, 23, 42);">${params.judul}</h2>
          <p style="color: rgb(51, 65, 85); font-size: 15px;">${params.isiTemplate}</p>
          ${params.tautan ? `<p><a href="${params.tautan}" style="color: rgb(37, 99, 235);">Lihat Rincian</a></p>` : ""}
          <hr style="border: none; border-top: 1px solid rgb(226, 232, 240); margin-top: 20px;" />
          <p style="color: rgb(100, 116, 139); font-size: 12px;">Sistem Informasi Akademik Universitas Islam Riau</p>
        </div>`,
      });
    }

    return item;
  },

  /**
   * Mengambil daftar notifikasi milik pengguna tertentu dengan otorisasi ketat.
   */
  getNotifikasiPengguna: async (
    penggunaId: string,
    options: {
      hanyaBelumDibaca?: boolean;
      includeDitunda?: boolean;
      waktuAcuan?: Date;
    } = {}
  ): Promise<NotifikasiItem[]> => {
    const waktuAcuan = options.waktuAcuan || new Date();

    let list = notifikasiDb.filter((n) => n.penggunaId === penggunaId);

    // Filter notifikasi yang sedang ditunda oleh jam tenang
    if (!options.includeDitunda) {
      list = list.filter((n) => {
        if (!n.ditundaSampai) return true;
        return new Date(n.ditundaSampai).getTime() <= waktuAcuan.getTime();
      });
    }

    if (options.hanyaBelumDibaca) {
      list = list.filter((n) => n.dibacaPada === null);
    }

    // Urutkan dari yang terbaru
    return list.sort(
      (a, b) => new Date(b.dibuatPada).getTime() - new Date(a.dibuatPada).getTime()
    );
  },

  /**
   * Menandai satu notifikasi sebagai sudah dibaca dengan verifikasi kepemilikan.
   */
  tandaiDibaca: async (notifikasiId: string, penggunaId: string): Promise<NotifikasiItem> => {
    const item = notifikasiDb.find((n) => n.id === notifikasiId);
    if (!item) {
      throw new Error("Notifikasi tidak ditemukan.");
    }

    // Otorisasi: Mahasiswa A tidak boleh memanipulasi notifikasi Mahasiswa B
    if (item.penggunaId !== penggunaId) {
      throw new Error("UNAUTHORIZED: Anda tidak berwenang mengakses notifikasi ini.");
    }

    item.dibacaPada = new Date().toISOString();

    if (process.env.DATABASE_URL) {
      try {
        await prisma.notifikasi.update({
          where: { id: notifikasiId },
          data: { dibacaPada: new Date() },
        });
      } catch {
        // Database offline fallback
      }
    }

    return item;
  },

  /**
   * Menandai semua notifikasi aktif milik pengguna sebagai sudah dibaca.
   */
  tandaiSemuaDibaca: async (penggunaId: string): Promise<{ count: number }> => {
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
        // Database offline fallback
      }
    }

    return { count: userNotifs.length };
  },

  /**
   * Menunda notifikasi (snooze) selama N menit.
   */
  tundaNotifikasi: async (
    notifikasiId: string,
    penggunaId: string,
    menit: number,
    waktuAcuan: Date = new Date()
  ): Promise<NotifikasiItem> => {
    const item = notifikasiDb.find((n) => n.id === notifikasiId);
    if (!item) {
      throw new Error("Notifikasi tidak ditemukan.");
    }

    if (item.penggunaId !== penggunaId) {
      throw new Error("UNAUTHORIZED: Anda tidak berwenang menunda notifikasi ini.");
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
        // Database offline fallback
      }
    }

    return item;
  },
};
