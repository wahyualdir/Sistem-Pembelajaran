import { PrismaClient } from "@prisma/client";
import {
  SEED_CONFIGS,
  SEED_PRODI,
  SEED_USERS,
  SEED_DOSEN,
  SEED_MAHASISWA,
  SEED_MATA_KULIAH,
  SEED_PRASYARAT,
  SEED_RUANG,
  SEED_TAHUN_AJARAN,
  SEED_KALENDER,
} from "../src/lib/db/seed-data";

const prisma = new PrismaClient();

async function main() {
  // 1. Konfigurasi Akademik
  for (const config of SEED_CONFIGS) {
    await prisma.konfigurasiAkademik.upsert({
      where: { kunci: config.kunci },
      update: { nilai: config.nilai, deskripsi: config.deskripsi },
      create: config,
    });
  }

  // 2. Tahun Ajaran Aktif
  const ta = await prisma.tahunAjaran.upsert({
    where: {
      kode_semester: {
        kode: SEED_TAHUN_AJARAN.kode,
        semester: SEED_TAHUN_AJARAN.semester,
      },
    },
    update: { aktif: true },
    create: SEED_TAHUN_AJARAN,
  });

  // 3. Kalender Akademik
  for (const kal of SEED_KALENDER) {
    await prisma.kalenderAkademik.upsert({
      where: { id: kal.id },
      update: {
        jenis: kal.jenis,
        mulai: kal.mulai,
        selesai: kal.selesai,
        keterangan: kal.keterangan,
      },
      create: kal,
    });
  }

  // 4. Program Studi
  for (const prodi of SEED_PRODI) {
    await prisma.programStudi.upsert({
      where: { kode: prodi.kode },
      update: { nama: prodi.nama, jenjang: prodi.jenjang },
      create: prodi,
    });
  }

  // 5. Akun Pengguna (Admin & Dosen)
  for (const user of SEED_USERS) {
    await prisma.pengguna.upsert({
      where: { email: user.email },
      update: { peran: user.peran, aktif: user.aktif },
      create: user,
    });
  }

  // 6. Data Dosen & Kaprodi
  for (const dsn of SEED_DOSEN) {
    const { kaprodiProdiId, ...dosenData } = dsn;
    await prisma.dosen.upsert({
      where: { nidn: dsn.nidn },
      update: {
        nama: dsn.nama,
        email: dsn.email,
        penandaWali: dsn.penandaWali,
        penandaKaprodi: dsn.penandaKaprodi,
      },
      create: dosenData,
    });

    if (kaprodiProdiId) {
      await prisma.programStudi.update({
        where: { id: kaprodiProdiId },
        data: { kaprodiId: dsn.id },
      });
    }
  }

  // 7. Data Mahasiswa
  for (const mhs of SEED_MAHASISWA) {
    await prisma.mahasiswa.upsert({
      where: { nim: mhs.nim },
      update: {
        nama: mhs.nama,
        email: mhs.email,
        angkatan: mhs.angkatan,
        prodiId: mhs.prodiId,
        dosenWaliId: mhs.dosenWaliId,
      },
      create: mhs,
    });
  }

  // 8. Mata Kuliah
  for (const mk of SEED_MATA_KULIAH) {
    await prisma.mataKuliah.upsert({
      where: { kode: mk.kode },
      update: {
        nama: mk.nama,
        sks: mk.sks,
        jenis: mk.jenis,
        semesterPaket: mk.semesterPaket,
        prodiId: mk.prodiId,
      },
      create: mk,
    });
  }

  // 9. Prasyarat Mata Kuliah
  for (const pra of SEED_PRASYARAT) {
    await prisma.prasyaratMataKuliah.upsert({
      where: {
        mataKuliahId_prasyaratId: {
          mataKuliahId: pra.mataKuliahId,
          prasyaratId: pra.prasyaratId,
        },
      },
      update: { nilaiMinimal: pra.nilaiMinimal },
      create: pra,
    });
  }

  // 10. Ruang
  for (const ruang of SEED_RUANG) {
    await prisma.ruang.upsert({
      where: { kode: ruang.kode },
      update: {
        nama: ruang.nama,
        kapasitas: ruang.kapasitas,
        gedung: ruang.gedung,
      },
      create: ruang,
    });
  }

  // 11. Contoh Kelas & Jadwal
  const sampleKelas = [
    {
      id: "kls-tif101-a",
      kode: "A",
      mataKuliahId: "mk-1", // Algo
      tahunAjaranId: ta.id,
      dosenId: "dsn-1",
      kuota: 35,
    },
    {
      id: "kls-tif201-a",
      kode: "A",
      mataKuliahId: "mk-3", // PBO
      tahunAjaranId: ta.id,
      dosenId: "dsn-4",
      kuota: 35,
    },
    {
      id: "kls-tif202-a",
      kode: "A",
      mataKuliahId: "mk-4", // Basis Data
      tahunAjaranId: ta.id,
      dosenId: "dsn-5",
      kuota: 35,
    },
    {
      id: "kls-tif302-a",
      kode: "A",
      mataKuliahId: "mk-7", // Web
      tahunAjaranId: ta.id,
      dosenId: "dsn-6",
      kuota: 35,
    },
  ];

  for (const k of sampleKelas) {
    await prisma.kelas.upsert({
      where: {
        mataKuliahId_tahunAjaranId_kode: {
          mataKuliahId: k.mataKuliahId,
          tahunAjaranId: k.tahunAjaranId,
          kode: k.kode,
        },
      },
      update: { kuota: k.kuota, dosenId: k.dosenId },
      create: k,
    });
  }

  // Sample Jadwal
  const sampleJadwal = [
    {
      id: "jdw-1",
      kelasId: "kls-tif101-a",
      hari: "Senin",
      jamMulai: "08:00",
      jamSelesai: "09:40",
      ruangId: "rng-1",
    },
    {
      id: "jdw-2",
      kelasId: "kls-tif201-a",
      hari: "Senin",
      jamMulai: "10:00",
      jamSelesai: "11:40",
      ruangId: "rng-1",
    },
    {
      id: "jdw-3",
      kelasId: "kls-tif202-a",
      hari: "Selasa",
      jamMulai: "08:00",
      jamSelesai: "09:40",
      ruangId: "rng-2",
    },
    {
      id: "jdw-4",
      kelasId: "kls-tif302-a",
      hari: "Rabu",
      jamMulai: "13:00",
      jamSelesai: "15:30",
      ruangId: "rng-2",
    },
  ];

  for (const j of sampleJadwal) {
    await prisma.jadwalKuliah.upsert({
      where: { id: j.id },
      update: {
        hari: j.hari,
        jamMulai: j.jamMulai,
        jamSelesai: j.jamSelesai,
        ruangId: j.ruangId,
      },
      create: j,
    });
  }

  // Sample Tagihan UKT Mahasiswa
  for (let i = 0; i < 10; i++) {
    const m = SEED_MAHASISWA[i];
    await prisma.tagihan.upsert({
      where: {
        mahasiswaId_tahunAjaranId: {
          mahasiswaId: m.id,
          tahunAjaranId: ta.id,
        },
      },
      update: { status: "LUNAS" },
      create: {
        id: `tag-${m.id}`,
        mahasiswaId: m.id,
        tahunAjaranId: ta.id,
        jumlah: 3500000,
        status: "LUNAS",
        tanggalBayar: new Date("2026-08-25"),
        catatan: "Lunas via Virtual Account Bank Riau Kepri",
      },
    });
  }
}

main()
  .catch((e) => {
    process.stderr.write(`${e.message}\n`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
