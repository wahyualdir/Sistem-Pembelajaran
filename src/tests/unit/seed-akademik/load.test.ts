import { describe, it, expect } from 'vitest';
import path from 'path';
import { loadAllSeedData, validateCrossDataIntegrity, parseCSV } from '../../../../scripts/seed-akademik/load';

describe('Loader & Validator CSV Seed Akademik', () => {
  const seedDataDir = path.join(process.cwd(), 'docs', 'seed-data');

  it('berhasil mem-parsing CSV dengan BOM, tanda kutip ganda, dan koma di dalam teks', () => {
    const sampleCsv = `\uFEFFid,nama,keterangan\r\n1,"Dr. Ir. Rahmawati, M.Sc.",Dosen Tetap\r\n2,"Arief, S.T., M.Kom.",Kaprodi\r\n`;
    const records = parseCSV(sampleCsv);
    expect(records).toHaveLength(2);
    expect(records[0].nama).toBe('Dr. Ir. Rahmawati, M.Sc.');
    expect(records[1].nama).toBe('Arief, S.T., M.Kom.');
  });

  it('memuat seluruh 9 berkas CSV data seed dengan validasi Zod yang lolos 100%', () => {
    const data = loadAllSeedData(seedDataDir);

    expect(data.ruang).toHaveLength(14);
    expect(data.dosen).toHaveLength(42);
    expect(data.mahasiswa).toHaveLength(120);
    expect(data.staf).toHaveLength(6);
    expect(data.kurikulum).toHaveLength(63);
    expect(data.pemetaan).toHaveLength(38);
    expect(data.jadwal).toHaveLength(256);
    expect(data.krs).toHaveLength(870);
    expect(data.asdos).toHaveLength(56);
  });

  it('memvalidasi integritas silang data secara sempurna (NIM, NIDN, NIP, Ruang, Dosen, Kelas)', () => {
    const data = loadAllSeedData(seedDataDir);
    const summary = validateCrossDataIntegrity(data);

    expect(summary.totalAkun).toBe(168);
    expect(summary.totalMahasiswa).toBe(120);
    expect(summary.totalDosen).toBe(42);
    expect(summary.totalStaf).toBe(6);
    expect(summary.totalRuang).toBe(14);
    expect(summary.totalKurikulum).toBe(63);
    expect(summary.totalJadwal).toBe(256);
    expect(summary.totalKrs).toBe(870);
    expect(summary.totalAsdos).toBe(56);
    expect(summary.totalKelasUnik).toBe(164);
  });
});
