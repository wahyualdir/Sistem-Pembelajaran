import fs from 'node:fs';
import path from 'node:path';
import { loadAllSeedData } from './load';

export function generateLegacySeedFile() {
  const dataDir = path.join(process.cwd(), 'docs', 'seed-data');
  const seed = loadAllSeedData(dataDir);

  const dosenMap = new Map(seed.dosen.map((d) => [d.id_dosen, d]));
  const ruangMap = new Map(seed.ruang.map((r) => [r.id_ruang, r]));
  const kurikulumMap = new Map(seed.kurikulum.map((k) => [k.kode_kurikulum, k]));

  // 1. PRODI
  const prodi = [
    { id: 'prodi-ti', kode: 'TI', nama: 'Teknik Informatika', jenjang: 'S1' },
  ];

  // 2. DOSEN (42)
  const dosenWaliIds = new Set(['D018', 'D007', 'D031', 'D027', 'D024', 'D037', 'D033', 'D040']);
  const dosen = seed.dosen.map((d) => {
    const isWali = dosenWaliIds.has(d.id_dosen);
    const isKaprodi = d.id_dosen === 'D004';
    return {
      id: d.id_dosen,
      nidn: d.nidn_10_digit,
      nama: d.nama_lengkap,
      email: `${d.nidn_10_digit}@dosen.siajar.test`,
      penandaWali: isWali,
      penandaKaprodi: isKaprodi,
      statusAktif: true,
      penggunaId: `usr-${d.id_dosen}`,
      kaprodiProdiId: isKaprodi ? 'prodi-ti' : undefined,
    };
  });

  // 3. MAHASISWA (120)
  const mahasiswa = seed.mahasiswa.map((m) => ({
    id: `mhs-${m.nim}`,
    nim: m.nim,
    nama: m.nama,
    email: `${m.nim}@mhs.siajar.test`,
    angkatan: m.angkatan,
    prodiId: 'prodi-ti',
    dosenWaliId: m.dosen_wali_id,
    rombel: m.rombel,
  }));

  // 4. MATA KULIAH (63)
  const mataKuliah = seed.kurikulum.map((k) => ({
    id: `mk-${k.kode_kurikulum}`,
    kode: k.kode_kurikulum,
    nama: k.nama_id,
    sks: k.sks_teori + k.sks_praktik,
    jenis: k.jenis === 'Wajib' ? ('WAJIB' as const) : ('PILIHAN' as const),
    semesterPaket: k.semester,
    prodiId: 'prodi-ti',
  }));

  // 5. PRASYARAT
  const prasyarat: { id: string; mataKuliahId: string; prasyaratId: string; nilaiMinimal: string }[] = [];
  let praIdx = 1;
  for (const k of seed.kurikulum) {
    if (k.prasyarat && k.prasyarat !== '-') {
      const parts = k.prasyarat.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      for (const p of parts) {
        prasyarat.push({
          id: `pra-${praIdx++}`,
          mataKuliahId: `mk-${k.kode_kurikulum}`,
          prasyaratId: `mk-${p}`,
          nilaiMinimal: 'D',
        });
      }
    }
  }

  // 6. RUANG (14)
  const ruang = seed.ruang.map((r) => ({
    id: r.id_ruang,
    kode: r.kode_ruang,
    nama: r.nama_ruang,
    kapasitas: r.kapasitas_perkiraan,
    gedung: r.gedung,
  }));

  // 7. TAHUN AJARAN
  const tahunAjaran = {
    id: 'ta-2026-ganjil',
    kode: '2026/2027',
    semester: 'GANJIL' as const,
    tanggalMulai: '2026-08-31',
    tanggalSelesai: '2027-01-31',
    aktif: true,
  };

  // 8. USERS (168)
  const users = [
    // Staf & Admin (6)
    ...seed.staf.map((s) => ({
      id: `usr-${s.nip_8_digit}`,
      email: `${s.nip_8_digit}@staf.siajar.test`,
      peran: 'ADMIN' as const,
      passwordHash: null,
      aktif: true,
    })),
    // Dosen (42)
    ...seed.dosen.map((d) => ({
      id: `usr-${d.id_dosen}`,
      email: `${d.nidn_10_digit}@dosen.siajar.test`,
      peran: 'DOSEN' as const,
      passwordHash: null,
      aktif: true,
    })),
    // Mahasiswa (120)
    ...seed.mahasiswa.map((m) => ({
      id: `usr-${m.nim}`,
      email: `${m.nim}@mhs.siajar.test`,
      peran: 'MAHASISWA' as const,
      passwordHash: null,
      aktif: true,
    })),
  ];

  // 9. KELAS (164) & JADWAL (256)
  const enrollmentCounts = new Map<string, number>();
  for (const krs of seed.krs) {
    const key = `${krs.kode_kurikulum}#${krs.kelas}`;
    enrollmentCounts.set(key, (enrollmentCounts.get(key) || 0) + 1);
  }

  const classSlotsMap = new Map<string, typeof seed.jadwal>();
  for (const slot of seed.jadwal) {
    const key = `${slot.kode_kurikulum}#${slot.kelas}`;
    const list = classSlotsMap.get(key) || [];
    list.push(slot);
    classSlotsMap.set(key, list);
  }

  const kelasList: any[] = [];
  const kelasLookupById = new Map<string, any>();

  for (const [key, slots] of classSlotsMap.entries()) {
    const [kodeKurikulum, section] = key.split('#');
    const kur = kurikulumMap.get(kodeKurikulum);
    const theorySlot = slots.find((s) => s.komponen === 'Teori') || slots[0];
    const lecturerId = theorySlot.id_dosen.split(';')[0].trim();
    const dsn = dosenMap.get(lecturerId);

    const classId = `kls-${kodeKurikulum.toLowerCase()}-${section.toLowerCase()}`;
    const terisi = enrollmentCounts.get(key) || 0;

    const kelasItem = {
      id: classId,
      kode: section,
      mataKuliahId: `mk-${kodeKurikulum}`,
      namaMataKuliah: kur?.nama_id || theorySlot.matakuliah,
      kodeMataKuliah: kodeKurikulum,
      sks: kur ? kur.sks_teori + kur.sks_praktik : theorySlot.sks,
      tahunAjaranId: tahunAjaran.id,
      dosenId: lecturerId,
      namaDosen: dsn?.nama_lengkap || theorySlot.nama_dosen,
      kuota: 40,
      terisi,
      jadwal: slots.map((s) => ({
        id: `jdw-${s.id_sesi}`,
        kelasId: classId,
        hari: s.hari,
        jamMulai: s.jam_mulai,
        jamSelesai: s.jam_selesai,
        ruangId: s.id_ruang,
        namaRuang: ruangMap.get(s.id_ruang)?.nama_ruang || s.id_ruang,
      })),
    };

    kelasList.push(kelasItem);
    kelasLookupById.set(key, kelasItem);
  }

  kelasList.sort((a, b) => {
    if (a.kodeMataKuliah !== b.kodeMataKuliah) {
      return a.kodeMataKuliah.localeCompare(b.kodeMataKuliah);
    }
    return a.kode.localeCompare(b.kode);
  });

  // 10. KRS (120)
  const studentKrsMap = new Map<string, typeof seed.krs>();
  for (const krs of seed.krs) {
    const list = studentKrsMap.get(krs.nim) || [];
    list.push(krs);
    studentKrsMap.set(krs.nim, list);
  }

  const krsList: any[] = [];
  for (const mhs of seed.mahasiswa) {
    const enrollments = studentKrsMap.get(mhs.nim) || [];
    const dsnWali = dosenMap.get(mhs.dosen_wali_id);

    const items = enrollments.map((enr, idx) => {
      const classKey = `${enr.kode_kurikulum}#${enr.kelas}`;
      const kelasItem = kelasLookupById.get(classKey);
      return {
        krsDetailId: `krsd-${mhs.nim}-${idx + 1}`,
        kelasId: kelasItem?.id || `kls-${enr.kode_kurikulum.toLowerCase()}-${enr.kelas.toLowerCase()}`,
        kelas: kelasItem,
      };
    });

    const totalSks = items.reduce((acc, it) => acc + (it.kelas?.sks || 0), 0);

    krsList.push({
      id: `krs-${mhs.nim}`,
      mahasiswaId: `mhs-${mhs.nim}`,
      namaMahasiswa: mhs.nama,
      nimMahasiswa: mhs.nim,
      dosenWaliId: mhs.dosen_wali_id,
      namaDosenWali: dsnWali?.nama_lengkap || 'Dosen Wali',
      tahunAjaranId: tahunAjaran.id,
      tahunAjaranKode: `${tahunAjaran.kode} ${tahunAjaran.semester}`,
      status: 'DISETUJUI',
      totalSks,
      batasSks: 24,
      ipsSemesterLalu: 3.5,
      catatanWali: 'KRS Semester Ganjil 2026/2027 telah diverifikasi dan disetujui.',
      items,
    });
  }

  const tsContent = `// File ini di-generate secara otomatis oleh scripts/seed-akademik/generate-legacy.ts
// Dataset: UIR Teknik Informatika - Semester Ganjil 2026/2027 (1 Prodi, 42 Dosen, 120 Mhs, 63 MK, 14 Ruang, 164 Kelas, 256 Slot, 870 KRS)
// JANGAN MENGEDIT BERKAS INI SECARA MANUAL!

export interface SeedDosenItem {
  id: string;
  nidn: string;
  nama: string;
  email: string;
  penandaWali: boolean;
  penandaKaprodi: boolean;
  statusAktif: boolean;
  penggunaId: string;
  kaprodiProdiId?: string;
}

export interface SeedMahasiswaItem {
  id: string;
  nim: string;
  nama: string;
  email: string;
  angkatan: number;
  prodiId: string;
  dosenWaliId?: string;
  rombel?: string;
}

export interface SeedMataKuliahItem {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  jenis: 'WAJIB' | 'PILIHAN';
  semesterPaket: number;
  prodiId: string;
}

export interface SeedRuangItem {
  id: string;
  kode: string;
  nama: string;
  kapasitas: number;
  gedung: string;
}

export interface SeedUserItem {
  id: string;
  email: string;
  peran: 'ADMIN' | 'DOSEN' | 'MAHASISWA';
  passwordHash: string | null;
  aktif: boolean;
}

export const SEED_PRODI_UIR: { id: string; kode: string; nama: string; jenjang: string }[] = ${JSON.stringify(prodi, null, 2)};

export const SEED_DOSEN_UIR: SeedDosenItem[] = ${JSON.stringify(dosen, null, 2)};

export const SEED_MAHASISWA_UIR: SeedMahasiswaItem[] = ${JSON.stringify(mahasiswa, null, 2)};

export const SEED_MATA_KULIAH_UIR: SeedMataKuliahItem[] = ${JSON.stringify(mataKuliah, null, 2)};

export const SEED_PRASYARAT_UIR: { id: string; mataKuliahId: string; prasyaratId: string; nilaiMinimal: string }[] = ${JSON.stringify(prasyarat, null, 2)};

export const SEED_RUANG_UIR: SeedRuangItem[] = ${JSON.stringify(ruang, null, 2)};

export const SEED_TAHUN_AJARAN_UIR = {
  id: ${JSON.stringify(tahunAjaran.id)},
  kode: ${JSON.stringify(tahunAjaran.kode)},
  semester: ${JSON.stringify(tahunAjaran.semester)} as const,
  tanggalMulai: new Date(${JSON.stringify(tahunAjaran.tanggalMulai)}),
  tanggalSelesai: new Date(${JSON.stringify(tahunAjaran.tanggalSelesai)}),
  aktif: true,
};

export const SEED_USERS_UIR: SeedUserItem[] = ${JSON.stringify(users, null, 2)};

export const SEED_KELAS_UIR = ${JSON.stringify(kelasList, null, 2)};

export const SEED_KRS_UIR = ${JSON.stringify(krsList, null, 2)};
`;

  const outputPath = path.join(process.cwd(), 'src', 'lib', 'db', 'seed-data.uir-ti-2026.generated.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf8');
  console.log(`[generate-legacy] Berhasil menghasilkan ${outputPath}`);
  console.log(`[generate-legacy] Ringkasan:`);
  console.log(`  - Prodi: ${prodi.length}`);
  console.log(`  - Dosen: ${dosen.length}`);
  console.log(`  - Mahasiswa: ${mahasiswa.length}`);
  console.log(`  - Mata Kuliah: ${mataKuliah.length}`);
  console.log(`  - Ruang: ${ruang.length}`);
  console.log(`  - Users: ${users.length}`);
  console.log(`  - Kelas: ${kelasList.length}`);
  console.log(`  - KRS: ${krsList.length} (total pendaftaran: ${seed.krs.length})`);
}

if (process.argv[1] && process.argv[1].endsWith('generate-legacy.ts')) {
  generateLegacySeedFile();
}
