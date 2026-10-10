import { describe, it, expect, beforeEach } from "vitest";
import {
  NotifikasiService,
  apakahDalamJamTenang,
  hitungAkhirJamTenang,
  DEFAULT_JENIS_AKTIF,
} from "../src/features/notifikasi/notifikasi-service";
import { BuatNotifikasiInput } from "../src/features/notifikasi/types";

describe("Infrastruktur Notifikasi (Fase 5)", () => {
  const mhsA = "mhs-test-alpha";
  const mhsB = "mhs-test-beta";

  beforeEach(() => {
    // Reset preferensi default untuk pengujian
  });

  describe("1. Idempotensi Layanan buatNotifikasi()", () => {
    it("menghasilkan satu notifikasi unik ketika dipanggil berulang kali dengan kunciDedup yang sama", async () => {
      const input: BuatNotifikasiInput = {
        penggunaId: mhsA,
        jenis: "KRS",
        tingkat: "PENTING",
        judul: "KRS Disetujui Dosen Wali",
        isiTemplate: "KRS Semester Ganjil Anda telah disetujui.",
        kunciDedup: "dedup-krs-approval-2026-ganjil",
      };

      const pertama = await NotifikasiService.buatNotifikasi(input);
      expect(pertama).toBeDefined();
      expect(pertama.kunciDedup).toBe("dedup-krs-approval-2026-ganjil");

      // Panggilan kedua dengan kunciDedup yang sama persis
      const kedua = await NotifikasiService.buatNotifikasi({
        ...input,
        judul: "KRS Disetujui (Duplikat Call)",
      });

      // Harus mengembalikan notifikasi pertama tanpa duplikasi ID
      expect(kedua.id).toBe(pertama.id);
      expect(kedua.judul).toBe(pertama.judul);

      const list = await NotifikasiService.getNotifikasiPengguna(mhsA, { includeDitunda: true });
      const matched = list.filter((n) => n.kunciDedup === "dedup-krs-approval-2026-ganjil");
      expect(matched.length).toBe(1);
    });
  });

  describe("2. Aturan Jam Tenang (Quiet Hours)", () => {
    it("mendeteksi jam tenang yang melewati tengah malam (mis. 22:00 - 06:00)", () => {
      const jamMulai = "22:00";
      const jamSelesai = "06:00";

      // Pukul 23:30 (dalam jam tenang)
      const malam = new Date("2026-09-29T23:30:00");
      expect(apakahDalamJamTenang(jamMulai, jamSelesai, malam)).toBe(true);

      // Pukul 02:15 dini hari (dalam jam tenang)
      const diniHari = new Date("2026-09-30T02:15:00");
      expect(apakahDalamJamTenang(jamMulai, jamSelesai, diniHari)).toBe(true);

      // Pukul 08:00 pagi (di luar jam tenang)
      const pagi = new Date("2026-09-30T08:00:00");
      expect(apakahDalamJamTenang(jamMulai, jamSelesai, pagi)).toBe(false);

      // Pukul 14:00 siang (di luar jam tenang)
      const siang = new Date("2026-09-30T14:00:00");
      expect(apakahDalamJamTenang(jamMulai, jamSelesai, siang)).toBe(false);
    });

    it("menahan notifikasi non-mendesak selama jam tenang (ditundaSampai terisi)", async () => {
      // Set preferensi jam tenang
      await NotifikasiService.simpanPreferensi(mhsA, {
        jamTenangMulai: "22:00",
        jamTenangSelesai: "06:00",
      });

      const waktuMalam = new Date("2026-09-29T23:00:00");

      const notif = await NotifikasiService.buatNotifikasi({
        penggunaId: mhsA,
        jenis: "PENGUMUMAN",
        tingkat: "INFO",
        judul: "Pengumuman Seminar",
        isiTemplate: "Seminar nasional dibuka esok lusa.",
        kunciDedup: "dedup-seminar-info-1",
        waktuAcuan: waktuMalam,
      });

      expect(notif.ditundaSampai).not.toBeNull();
      const akhirDitunda = new Date(notif.ditundaSampai!);
      expect(akhirDitunda.getHours()).toBe(6);
      expect(akhirDitunda.getMinutes()).toBe(0);

      // Pada jam 23:00, notifikasi tidak muncul di daftar aktif pengguna
      const activeList = await NotifikasiService.getNotifikasiPengguna(mhsA, {
        waktuAcuan: waktuMalam,
      });
      const found = activeList.find((n) => n.id === notif.id);
      expect(found).toBeUndefined();

      // Keesokan harinya pukul 07:00 (setelah jam tenang selesai), notifikasi muncul
      const waktuPagi = new Date("2026-09-30T07:00:00");
      const activeListPagi = await NotifikasiService.getNotifikasiPengguna(mhsA, {
        waktuAcuan: waktuPagi,
      });
      const foundPagi = activeListPagi.find((n) => n.id === notif.id);
      expect(foundPagi).toBeDefined();
    });

    it("tidak menahan notifikasi MENDESAK atau KEAMANAN saat jam tenang (bypass)", async () => {
      const waktuMalam = new Date("2026-09-29T23:30:00");

      // Notifikasi Mendesak
      const notifMendesak = await NotifikasiService.buatNotifikasi({
        penggunaId: mhsA,
        jenis: "TUGAS_TENGGAT",
        tingkat: "MENDESAK",
        judul: "Tugas Segera Berakhir!",
        isiTemplate: "Batas pengumpulan tugas tinggal 2 jam lagi.",
        kunciDedup: "dedup-tugas-mendesak-bypass",
        waktuAcuan: waktuMalam,
      });

      expect(notifMendesak.ditundaSampai).toBeNull();

      // Notifikasi Keamanan
      const notifKeamanan = await NotifikasiService.buatNotifikasi({
        penggunaId: mhsA,
        jenis: "KEAMANAN",
        tingkat: "PENTING",
        judul: "Percobaan Login Baru",
        isiTemplate: "Terdeteksi login dari browser Chrome di Windows.",
        kunciDedup: "dedup-keamanan-login-bypass",
        waktuAcuan: waktuMalam,
      });

      expect(notifKeamanan.ditundaSampai).toBeNull();
    });
  });

  describe("3. Isolasi Otorisasi Data Antar Mahasiswa", () => {
    it("menolak mahasiswa B membaca atau mengubah status notifikasi mahasiswa A", async () => {
      const notifA = await NotifikasiService.buatNotifikasi({
        penggunaId: mhsA,
        jenis: "NILAI",
        tingkat: "INFO",
        judul: "Nilai Basis Data Terbit",
        isiTemplate: "Nilai akhir mata kuliah Basis Data Anda: A.",
        kunciDedup: "dedup-nilai-mhsA-unique",
      });

      // Mahasiswa B mencoba menandai dibaca notifikasi milik mahasiswa A
      await expect(
        NotifikasiService.tandaiDibaca(notifA.id, mhsB)
      ).rejects.toThrow(/UNAUTHORIZED/i);

      // Mahasiswa B mencoba menunda notifikasi milik mahasiswa A
      await expect(
        NotifikasiService.tundaNotifikasi(notifA.id, mhsB, 60)
      ).rejects.toThrow(/UNAUTHORIZED/i);

      // Notifikasi milik A tidak boleh muncul di daftar notifikasi B
      const listB = await NotifikasiService.getNotifikasiPengguna(mhsB);
      const existsInB = listB.some((n) => n.id === notifA.id);
      expect(existsInB).toBe(false);
    });
  });

  describe("4. Aturan Keamanan Kanal In-App", () => {
    it("menolak penonaktifan kanal aplikasi untuk peringatan KEAMANAN", async () => {
      // Mencoba mematikan app channel untuk KEAMANAN
      const pref = await NotifikasiService.simpanPreferensi(mhsA, {
        jenisAktif: {
          ...DEFAULT_JENIS_AKTIF,
          KEAMANAN: { app: false, email: false },
        },
      });

      // Sistem wajib memaksa status app: true untuk KEAMANAN
      expect(pref.jenisAktif.KEAMANAN.app).toBe(true);
    });
  });

  describe("5. Fitur Tunda (Snooze) & Tandai Dibaca", () => {
    it("berhasil menunda notifikasi selama durasi menit yang ditentukan", async () => {
      const waktuSekarang = new Date("2026-09-29T10:00:00");
      const notif = await NotifikasiService.buatNotifikasi({
        penggunaId: mhsA,
        jenis: "BRIEFING",
        tingkat: "INFO",
        judul: "Briefing Pagi",
        isiTemplate: "Hari ini ada 2 jadwal kuliah.",
        kunciDedup: "dedup-briefing-pagi-test",
        waktuAcuan: waktuSekarang,
      });

      // Tunda selama 60 menit (sampai 11:00)
      const snoozed = await NotifikasiService.tundaNotifikasi(
        notif.id,
        mhsA,
        60,
        waktuSekarang
      );
      expect(snoozed.ditundaSampai).toBeDefined();

      const waktuTunda = new Date(snoozed.ditundaSampai!);
      expect(waktuTunda.getTime()).toBe(waktuSekarang.getTime() + 60 * 60 * 1000);

      // Pada pukul 10:30, notifikasi tidak muncul
      const cek1030 = await NotifikasiService.getNotifikasiPengguna(mhsA, {
        waktuAcuan: new Date("2026-09-29T10:30:00"),
      });
      expect(cek1030.some((n) => n.id === notif.id)).toBe(false);

      // Pada pukul 11:05, notifikasi kembali muncul
      const cek1105 = await NotifikasiService.getNotifikasiPengguna(mhsA, {
        waktuAcuan: new Date("2026-09-29T11:05:00"),
      });
      expect(cek1105.some((n) => n.id === notif.id)).toBe(true);
    });

    it("berhasil menandai semua notifikasi aktif sebagai sudah dibaca", async () => {
      await NotifikasiService.tandaiSemuaDibaca(mhsA);
      const unread = await NotifikasiService.getNotifikasiPengguna(mhsA, {
        hanyaBelumDibaca: true,
      });
      expect(unread.length).toBe(0);
    });
  });
});
