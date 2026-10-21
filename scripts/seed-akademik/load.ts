// ============================================================================
// Loader & Validator Zod untuk Berkas Data CSV Seed Akademik
// Spesifikasi: docs/INSTRUKSI_SEED_AKADEMIK.md (Bagian 3, 4, 5, 6)
// ============================================================================

import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// ----------------------------------------------------------------------------
// 1. Zero-dependency Robust CSV Parser (RFC 4180 + UTF-8 BOM Support)
// ----------------------------------------------------------------------------
export function parseCSV(content: string): Record<string, string>[] {
  const clean = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().replace(/^[\uFEFF\xA0]+/, ''));
  const data: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;
    const obj: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = row[c] ?? '';
    }
    data.push(obj);
  }

  return data;
}

// ----------------------------------------------------------------------------
// 2. Skema Zod Per Berkas CSV
// ----------------------------------------------------------------------------

export const RuangSchema = z.object({
  id_ruang: z.string().min(1),
  kode_ruang: z.string().min(1),
  nama_ruang: z.string().min(1),
  gedung: z.string().min(1),
  tipe: z.string().min(1),
  kapasitas_perkiraan: z.coerce.number().min(1),
});
export type RuangData = z.infer<typeof RuangSchema>;

export const DosenBaruSchema = z.object({
  id_dosen: z.string().min(1),
  nama_lengkap: z.string().min(1),
  nidn_10_digit: z.string().regex(/^\d{10}$/, 'NIDN harus tepat 10 digit angka'),
  tahun_masuk: z.string().regex(/^\d{4}$/, 'Tahun masuk harus 4 digit'),
  asal: z.string().min(1),
  peran: z.string().min(1),
  dosen_wali: z.enum(['Y', 'N']),
  email_login: z.string().email(),
  catatan: z.string().optional().default(''),
});
export type DosenBaruData = z.infer<typeof DosenBaruSchema>;

export const MahasiswaSchema = z.object({
  nim: z.string().regex(/^(23|24|25|26)3510\d{3}$/, 'NIM harus berformat {23|24|25|26}3510{001-030}'),
  nama: z.string().min(1),
  angkatan: z.coerce.number(),
  tingkat_semester: z.coerce.number(),
  rombel: z.string().min(1),
  dosen_wali_id: z.string().min(1),
  dosen_wali_nidn: z.string().regex(/^\d{10}$/),
  email_login: z.string().email(),
  status: z.string().min(1),
  asdos: z.enum(['YA', 'TIDAK']),
});
export type MahasiswaData = z.infer<typeof MahasiswaSchema>;

export const StafAdminSchema = z.object({
  nip_8_digit: z.string().regex(/^\d{8}$/, 'NIP harus tepat 8 digit angka'),
  nama_lengkap: z.string().min(1),
  peran: z.string().min(1),
  jabatan: z.string().min(1),
  email_login: z.string().email(),
});
export type StafAdminData = z.infer<typeof StafAdminSchema>;

export const KurikulumSchema = z.object({
  semester: z.coerce.number(),
  kode_kurikulum: z.string().min(1),
  nama_id: z.string().min(1),
  nama_en: z.string().optional().default(''),
  sks_teori: z.coerce.number(),
  sks_praktik: z.coerce.number(),
  sks_total: z.coerce.number().min(1),
  prasyarat: z.string(),
  kategori: z.string().min(1),
  rumpun_pilihan: z.string(),
  jenis: z.string().min(1),
  ditawarkan_ganjil_2026: z.enum(['YA', 'TIDAK']),
});
export type KurikulumData = z.infer<typeof KurikulumSchema>;

export const PemetaanKodeSchema = z.object({
  kode_jadwal: z.string().min(1),
  nama_di_jadwal: z.string().min(1),
  kode_kurikulum: z.string().min(1),
  nama_kurikulum: z.string().min(1),
  semester: z.coerce.number(),
  sks_teori_jadwal: z.coerce.number(),
  sks_praktik_jadwal: z.coerce.number(),
  sks_teori_kurikulum: z.coerce.number(),
  sks_praktik_kurikulum: z.coerce.number(),
  sks_cocok: z.string(),
  kode_sama: z.string(),
  kategori: z.string(),
  rumpun_pilihan: z.string(),
  jenis: z.string(),
  rombel_di_jadwal: z.string(),
});
export type PemetaanKodeData = z.infer<typeof PemetaanKodeSchema>;

export const JadwalSchema = z.object({
  id_sesi: z.string().min(1),
  hari: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']),
  jam_mulai: z.string().regex(/^\d{2}:\d{2}$/),
  jam_selesai: z.string().regex(/^\d{2}:\d{2}$/),
  durasi_menit: z.coerce.number(),
  komponen: z.enum(['Teori', 'Praktikum']),
  sks: z.coerce.number().min(1),
  kode_jadwal: z.string().min(1),
  kode_kurikulum: z.string().min(1),
  matakuliah: z.string().min(1),
  kelas: z.string().min(1),
  tingkat: z.coerce.number(),
  mk_pilihan: z.string(),
  id_ruang: z.string().min(1),
  nama_ruang: z.string().min(1),
  id_dosen: z.string().min(1),
  nama_dosen: z.string().min(1),
});
export type JadwalData = z.infer<typeof JadwalSchema>;

export const KrsSchema = z.object({
  nim: z.string().regex(/^(23|24|25|26)3510\d{3}$/),
  kode_jadwal: z.string().min(1),
  kode_kurikulum: z.string().min(1),
  matakuliah: z.string().min(1),
  kelas: z.string().min(1),
  jenis: z.string().min(1),
});
export type KrsData = z.infer<typeof KrsSchema>;

export const AsdosSchema = z.object({
  nim: z.string().regex(/^(23|24|25|26)3510\d{3}$/),
  nama: z.string().min(1),
  kode_jadwal: z.string().min(1),
  kode_kurikulum: z.string().min(1),
  matakuliah: z.string().min(1),
  kelas: z.string().min(1),
  hari: z.string().min(1),
  jam: z.string().min(1),
  ruang: z.string().min(1),
  izin_class_assistants: z.string().min(1),
  can_open_attendance: z.string().min(1),
});
export type AsdosData = z.infer<typeof AsdosSchema>;

export interface AllSeedDataset {
  ruang: RuangData[];
  dosen: DosenBaruData[];
  mahasiswa: MahasiswaData[];
  staf: StafAdminData[];
  kurikulum: KurikulumData[];
  pemetaan: PemetaanKodeData[];
  jadwal: JadwalData[];
  krs: KrsData[];
  asdos: AsdosData[];
}

export function loadAllSeedData(seedDataDir: string): AllSeedDataset {
  const readAndParse = <T>(filename: string, schema: z.ZodType<T, any, any>): T[] => {
    const fullPath = path.join(seedDataDir, filename);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Berkas data tidak ditemukan: ${fullPath}`);
    }
    const rawContent = fs.readFileSync(fullPath, 'utf-8');
    const records = parseCSV(rawContent);
    return records.map((record, index) => {
      const parsed = schema.safeParse(record);
      if (!parsed.success) {
        throw new Error(
          `Validasi gagal pada ${filename} baris ${index + 2}: ${parsed.error.errors
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join(', ')}`
        );
      }
      return parsed.data;
    });
  };

  const ruang = readAndParse<RuangData>('ruang.csv', RuangSchema);
  const dosen = readAndParse<DosenBaruData>('dosen_baru.csv', DosenBaruSchema);
  const mahasiswa = readAndParse<MahasiswaData>('mahasiswa.csv', MahasiswaSchema);
  const staf = readAndParse<StafAdminData>('staf_admin.csv', StafAdminSchema);
  const kurikulum = readAndParse<KurikulumData>('kurikulum_2025.csv', KurikulumSchema);
  const pemetaan = readAndParse<PemetaanKodeData>('pemetaan_kode_jadwal_kurikulum.csv', PemetaanKodeSchema);
  const jadwal = readAndParse<JadwalData>('jadwal_ganjil_2026_2027.csv', JadwalSchema);
  const krs = readAndParse<KrsData>('krs_pendaftaran.csv', KrsSchema);
  const asdos = readAndParse<AsdosData>('asdos_penugasan.csv', AsdosSchema);

  return {
    ruang,
    dosen,
    mahasiswa,
    staf,
    kurikulum,
    pemetaan,
    jadwal,
    krs,
    asdos,
  };
}

export function validateCrossDataIntegrity(data: AllSeedDataset): {
  totalAkun: number;
  totalMahasiswa: number;
  totalDosen: number;
  totalStaf: number;
  totalRuang: number;
  totalKurikulum: number;
  totalJadwal: number;
  totalKrs: number;
  totalAsdos: number;
  totalKelasUnik: number;
} {
  // 1. Keunikan NIM Mahasiswa (120 orang)
  const nimSet = new Set<string>();
  for (const m of data.mahasiswa) {
    if (nimSet.has(m.nim)) {
      throw new Error(`Integritas gagal: NIM ganda ditemukan: ${m.nim}`);
    }
    nimSet.add(m.nim);
  }
  if (nimSet.size !== 120) {
    throw new Error(`Integritas gagal: Diharapkan 120 mahasiswa, ditemukan ${nimSet.size}`);
  }

  // 2. Keunikan NIDN Dosen (42 orang) & 4 digit awal = tahun masuk
  const nidnSet = new Set<string>();
  const dosenIdMap = new Map<string, DosenBaruData>();
  for (const d of data.dosen) {
    if (nidnSet.has(d.nidn_10_digit)) {
      throw new Error(`Integritas gagal: NIDN ganda ditemukan: ${d.nidn_10_digit}`);
    }
    nidnSet.add(d.nidn_10_digit);
    dosenIdMap.set(d.id_dosen, d);

    if (!d.nidn_10_digit.startsWith(d.tahun_masuk)) {
      throw new Error(
        `Integritas gagal: NIDN ${d.nidn_10_digit} tidak diawali tahun masuk ${d.tahun_masuk} (${d.nama_lengkap})`
      );
    }
  }
  if (nidnSet.size !== 42) {
    throw new Error(`Integritas gagal: Diharapkan 42 dosen, ditemukan ${nidnSet.size}`);
  }

  // 3. Keunikan NIP Staf (6 orang) & 4 digit awal = tahun masuk
  const nipSet = new Set<string>();
  for (const s of data.staf) {
    if (nipSet.has(s.nip_8_digit)) {
      throw new Error(`Integritas gagal: NIP ganda ditemukan: ${s.nip_8_digit}`);
    }
    nipSet.add(s.nip_8_digit);
  }
  if (nipSet.size !== 6) {
    throw new Error(`Integritas gagal: Diharapkan 6 staf/admin, ditemukan ${nipSet.size}`);
  }

  // 4. Setiap id_dosen pada jadwal harus ada di dosen_baru.csv
  for (const j of data.jadwal) {
    const dosenIds = j.id_dosen.split(';').map((id) => id.trim());
    for (const dId of dosenIds) {
      if (!dosenIdMap.has(dId)) {
        throw new Error(`Integritas gagal: Dosen ${dId} pada sesi jadwal ${j.id_sesi} tidak terdaftar di dosen_baru.csv`);
      }
    }
  }

  // 5. Setiap kode_jadwal pada jadwal ada di pemetaan_kode_jadwal_kurikulum.csv
  const pemetaanMap = new Map<string, PemetaanKodeData>();
  for (const p of data.pemetaan) {
    pemetaanMap.set(p.kode_jadwal, p);
  }
  for (const j of data.jadwal) {
    if (!pemetaanMap.has(j.kode_jadwal)) {
      throw new Error(`Integritas gagal: Kode jadwal ${j.kode_jadwal} pada sesi ${j.id_sesi} tidak ada di pemetaan`);
    }
  }

  // 6. Setiap NIM pada KRS dan Asdos ada di mahasiswa.csv
  for (const k of data.krs) {
    if (!nimSet.has(k.nim)) {
      throw new Error(`Integritas gagal: Mahasiswa ${k.nim} pada KRS tidak terdaftar di mahasiswa.csv`);
    }
  }
  for (const a of data.asdos) {
    if (!nimSet.has(a.nim)) {
      throw new Error(`Integritas gagal: Asisten ${a.nim} pada penugasan asdos tidak terdaftar di mahasiswa.csv`);
    }
  }

  // 7. Hitung jumlah kelas unik dari jadwal (kombinasi kode_kurikulum + kelas)
  const classKeySet = new Set<string>();
  for (const j of data.jadwal) {
    classKeySet.add(`${j.kode_kurikulum}-${j.kelas}`);
  }

  // 8. Pastikan setiap kelas memiliki peserta KRS (tidak ada kelas kosong)
  const krsClassKeySet = new Set<string>();
  for (const k of data.krs) {
    krsClassKeySet.add(`${k.kode_kurikulum}-${k.kelas}`);
  }
  for (const ck of classKeySet) {
    if (!krsClassKeySet.has(ck)) {
      throw new Error(`Integritas gagal: Kelas ${ck} tidak memiliki peserta pada krs_pendaftaran.csv`);
    }
  }

  return {
    totalAkun: data.mahasiswa.length + data.dosen.length + data.staf.length,
    totalMahasiswa: data.mahasiswa.length,
    totalDosen: data.dosen.length,
    totalStaf: data.staf.length,
    totalRuang: data.ruang.length,
    totalKurikulum: data.kurikulum.length,
    totalJadwal: data.jadwal.length,
    totalKrs: data.krs.length,
    totalAsdos: data.asdos.length,
    totalKelasUnik: classKeySet.size,
  };
}
