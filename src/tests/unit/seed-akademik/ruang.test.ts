import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { parseCSV } from '../../../../scripts/seed-akademik/load';
import { SEED_RUANG_UIR } from '@/lib/db/seed-data.uir-ti-2026.generated';
import { MasterStore } from '@/features/master/master-store';

describe('Verifikasi Kesesuaian 14 Ruang dengan docs/seed-data/ruang.csv', () => {
  const ruangCsvPath = path.join(process.cwd(), 'docs', 'seed-data', 'ruang.csv');
  const csvContent = fs.readFileSync(ruangCsvPath, 'utf-8');
  const rawRuang = parseCSV(csvContent);

  it('memastikan docs/seed-data/ruang.csv mendefinisikan tepat 14 ruang perkuliahan & laboratorium', () => {
    expect(rawRuang).toHaveLength(14);
    
    // Verifikasi sampel kode & nama dari CSV persis seperti spesifikasi
    const r01 = rawRuang.find((r) => r.id_ruang === 'R01');
    expect(r01?.kode_ruang).toBe('3A.1.08');
    expect(r01?.nama_ruang).toBe('3A.1.08 - TEKNIK A');

    const r11 = rawRuang.find((r) => r.id_ruang === 'R11');
    expect(r11?.kode_ruang).toBe('Basic Computer LAB');
    expect(r11?.nama_ruang).toBe('Basic Computer LAB - TEKNIK C');
  });

  it('memastikan seluruh 14 ruang pada lapisan legacy (SEED_RUANG_UIR) persis sama dengan ruang.csv', () => {
    expect(SEED_RUANG_UIR).toHaveLength(14);
    for (const csvRow of rawRuang) {
      const legacyRoom = SEED_RUANG_UIR.find((r) => r.id === csvRow.id_ruang);
      expect(legacyRoom, `Ruang ${csvRow.id_ruang} harus ada di SEED_RUANG_UIR`).toBeDefined();
      expect(legacyRoom?.kode, `Kode ruang ${csvRow.id_ruang} harus persis sama`).toBe(csvRow.kode_ruang);
      expect(legacyRoom?.nama, `Nama ruang ${csvRow.id_ruang} harus persis sama`).toBe(csvRow.nama_ruang);
      expect(legacyRoom?.gedung).toBe(csvRow.gedung);
      expect(legacyRoom?.kapasitas).toBe(Number(csvRow.kapasitas_perkiraan));
    }
  });

  it('memastikan MasterStore getRuang() menghasilkan 14 ruang yang persis sama dengan ruang.csv saat dataset uir-ti-2026 aktif', () => {
    MasterStore.resetStore('uir-ti-2026');
    const storeRuang = MasterStore.getRuang();
    expect(storeRuang).toHaveLength(14);

    for (const csvRow of rawRuang) {
      const storeRoom = storeRuang.find((r) => r.id === csvRow.id_ruang);
      expect(storeRoom, `Ruang ${csvRow.id_ruang} harus ada di MasterStore`).toBeDefined();
      expect(storeRoom?.kode, `Kode ruang ${csvRow.id_ruang} pada store harus persis sama`).toBe(csvRow.kode_ruang);
      expect(storeRoom?.nama, `Nama ruang ${csvRow.id_ruang} pada store harus persis sama`).toBe(csvRow.nama_ruang);
      expect(storeRoom?.gedung).toBe(csvRow.gedung);
      expect(storeRoom?.kapasitas).toBe(Number(csvRow.kapasitas_perkiraan));
    }
  });
});
