/**
 * Store Notifikasi In-App (Fase 3 - Fondasi awal sebelum migrasi ke PostgreSQL/Prisma di Fase 5)
 *
 * Struktur dirancang presisi sesuai skema entitas data mendatang agar
 * transisi persistensi pada Fase 5 berjalan mulus tanpa mengubah kontrak UI.
 */

export type KategoriNotifikasi =
  | "AKADEMIK"
  | "KEUANGAN"
  | "KRS"
  | "PRESENSI"
  | "SISTEM";

export interface Notifikasi {
  id: string;
  penggunaId: string; // ID pengguna atau 'all' / role
  judul: string;
  pesan: string;
  kategori: KategoriNotifikasi;
  tautan?: string;
  sudahDibaca: boolean;
  waktu: string;
}

let notifikasiStore: Notifikasi[] = [
  // Notifikasi Mahasiswa (mhs-1 / Wahyu Aldi)
  {
    id: "notif-1",
    penggunaId: "mhs-1",
    judul: "KRS Disetujui Dosen Wali",
    pesan: "KRS Semester Ganjil 2026/2027 (21 SKS) telah disetujui oleh Dr. Ardiansyah, S.T., M.Kom.",
    kategori: "KRS",
    tautan: "/mahasiswa/krs",
    sudahDibaca: false,
    waktu: "10 menit yang lalu",
  },
  {
    id: "notif-2",
    penggunaId: "mhs-1",
    judul: "Pembayaran UKT Terverifikasi",
    pesan: "Status administrasi keuangan UKT Anda terverifikasi LUNAS untuk semester berjalan.",
    kategori: "KEUANGAN",
    tautan: "/mahasiswa/ukt",
    sudahDibaca: false,
    waktu: "2 jam yang lalu",
  },
  {
    id: "notif-3",
    penggunaId: "mhs-1",
    judul: "Pembaruan Rekap Kehadiran",
    pesan: "Rekap presensi pertemuan minggu ke-4 telah direkapitulasi oleh dosen pengampu.",
    kategori: "PRESENSI",
    tautan: "/mahasiswa/presensi",
    sudahDibaca: true,
    waktu: "Kemarin",
  },
  {
    id: "notif-4",
    penggunaId: "mhs-1",
    judul: "Jadwal Ujian Tengah Semester",
    pesan: "Pekan UTS Semester Ganjil 2026/2027 dijadwalkan pada 1 s.d. 15 November 2026.",
    kategori: "AKADEMIK",
    tautan: "/mahasiswa/ujian",
    sudahDibaca: true,
    waktu: "3 hari yang lalu",
  },

  // Notifikasi Dosen (dsn-1)
  {
    id: "notif-d1",
    penggunaId: "dsn-1",
    judul: "Pengajuan KRS Mahasiswa Bimbingan",
    pesan: "Dimas Anggara Putra (NIM 223510004) mengajukan persetujuan KRS 6 SKS.",
    kategori: "KRS",
    tautan: "/dosen/wali",
    sudahDibaca: false,
    waktu: "25 menit yang lalu",
  },
  {
    id: "notif-d2",
    penggunaId: "dsn-1",
    judul: "Pengisian Komponen Nilai Kelas",
    pesan: "Batas penguncian draf komponen nilai semester ganjil berakhir pekan depan.",
    kategori: "AKADEMIK",
    tautan: "/dosen/nilai",
    sudahDibaca: false,
    waktu: "1 hari yang lalu",
  },

  // Notifikasi Admin
  {
    id: "notif-a1",
    penggunaId: "usr-admin-1",
    judul: "Sinkronisasi Kalender Akademik",
    pesan: "Kalender tahun ajaran 2026/2027 berhasil disinkronkan ke seluruh modul operasional.",
    kategori: "SISTEM",
    tautan: "/admin/kalender",
    sudahDibaca: false,
    waktu: "1 jam yang lalu",
  },
];

export const NotifikasiStore = {
  // Ambil notifikasi pengguna berdasarkan ID pengguna atau ID mahasiswa/dosen
  getNotifikasi: (penggunaId?: string): Notifikasi[] => {
    if (!penggunaId) return [...notifikasiStore];
    return notifikasiStore.filter(
      (n) => n.penggunaId === penggunaId || n.penggunaId === "all"
    );
  },

  // Ambil jumlah notifikasi yang belum dibaca
  getJumlahBelumDibaca: (penggunaId?: string): number => {
    return NotifikasiStore.getNotifikasi(penggunaId).filter((n) => !n.sudahDibaca)
      .length;
  },

  // Tandai notifikasi spesifik sebagai sudah dibaca
  tandaiSudahDibaca: (notifikasiId: string): void => {
    const item = notifikasiStore.find((n) => n.id === notifikasiId);
    if (item) {
      item.sudahDibaca = true;
    }
  },

  // Tandai seluruh notifikasi pengguna sebagai sudah dibaca
  tandaiSemuaSudahDibaca: (penggunaId?: string): void => {
    for (const item of notifikasiStore) {
      if (!penggunaId || item.penggunaId === penggunaId || item.penggunaId === "all") {
        item.sudahDibaca = true;
      }
    }
  },

  // Tambahkan notifikasi baru
  tambahNotifikasi: (
    data: Omit<Notifikasi, "id" | "sudahDibaca" | "waktu">
  ): Notifikasi => {
    const newItem: Notifikasi = {
      ...data,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sudahDibaca: false,
      waktu: "Baru saja",
    };
    notifikasiStore.unshift(newItem);
    return newItem;
  },
};
