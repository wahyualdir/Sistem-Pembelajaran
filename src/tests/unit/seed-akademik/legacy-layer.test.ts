import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MasterStore } from '@/features/master/master-store';
import { JadwalStore } from '@/features/jadwal/jadwal-store';
import { KrsStore } from '@/features/krs/krs-store';

describe('SIAJAR Fase S5 - Lapisan Kompatibilitas Legacy Store (SEED_DATASET)', () => {
  const originalEnv = process.env.SEED_DATASET;

  beforeEach(() => {
    // Reset stores to default
    MasterStore.resetStore();
    JadwalStore.resetStore();
    KrsStore.resetStore();
  });

  afterEach(() => {
    process.env.SEED_DATASET = originalEnv;
    MasterStore.resetStore();
    JadwalStore.resetStore();
    KrsStore.resetStore();
  });

  it('memastikan dataset default tetap aktif bila SEED_DATASET tidak disetel', () => {
    expect(MasterStore.getMahasiswa().length).toBe(30);
    expect(MasterStore.getDosen().length).toBe(8);
    expect(MasterStore.getRuang().length).toBe(4);
    expect(MasterStore.getMataKuliah().length).toBe(20);
    expect(JadwalStore.getKelas().length).toBe(8);
  });

  it('memuat dataset UIR TI 2026/2027 lengkap dengan jumlah tepat saat dataset uir-ti-2026 aktif', () => {
    MasterStore.resetStore('uir-ti-2026');
    JadwalStore.resetStore('uir-ti-2026');
    KrsStore.resetStore('uir-ti-2026');

    // 1. Master Data UIR
    const mhs = MasterStore.getMahasiswa();
    expect(mhs.length).toBe(120);

    const dsn = MasterStore.getDosen();
    expect(dsn.length).toBe(42);

    const ruang = MasterStore.getRuang();
    expect(ruang.length).toBe(14);

    const mk = MasterStore.getMataKuliah();
    expect(mk.length).toBe(63);

    // 2. Jadwal UIR
    const kelas = JadwalStore.getKelas();
    expect(kelas.length).toBe(164);

    // Total slot jadwal di seluruh kelas = 256
    const totalSlots = kelas.reduce((acc, k) => acc + k.jadwal.length, 0);
    expect(totalSlots).toBe(256);

    // 3. KRS & Perwalian
    const allKrs = KrsStore.getAllKrs();
    expect(allKrs.length).toBe(120);

    // Total pendaftaran kelas di seluruh KRS = 870
    const totalEnrollments = allKrs.reduce((acc, k) => acc + k.items.length, 0);
    expect(totalEnrollments).toBe(870);

    // Cek perwalian dosen D018 (Dr. Ir. Dosen Wali 2023) -> tepat 15 mahasiswa
    const perwalianD018 = KrsStore.getKrsByDosenWali('D018');
    expect(perwalianD018.length).toBe(15);

    // Cek perwalian dosen D007 -> tepat 15 mahasiswa
    const perwalianD007 = KrsStore.getKrsByDosenWali('D007');
    expect(perwalianD007.length).toBe(15);

    // Kaprodi D004
    const kaprodi = dsn.find((d) => d.id === 'D004');
    expect(kaprodi?.penandaKaprodi).toBe(true);
  });

  it('mengembalikan data ke kondisi default setelah resetStore dipanggil', () => {
    MasterStore.resetStore('uir-ti-2026');
    expect(MasterStore.getMahasiswa().length).toBe(120);

    MasterStore.resetStore();
    expect(MasterStore.getMahasiswa().length).toBe(30);
  });

  it('memastikan akun UIR terdaftar di SYNTHETIC_DEMO_USERS untuk login offline di localhost', async () => {
    const { SYNTHETIC_DEMO_USERS } = await import('@/modules/identity/demo-users');
    
    // Mahasiswa
    expect(SYNTHETIC_DEMO_USERS['243510001']).toBeDefined();
    expect(SYNTHETIC_DEMO_USERS['243510001'].name).toBe('Arya Permana Ginting');
    expect(SYNTHETIC_DEMO_USERS['243510001'].roles).toEqual(['STUDENT']);

    // Kaprodi
    expect(SYNTHETIC_DEMO_USERS['2008000307']).toBeDefined();
    expect(SYNTHETIC_DEMO_USERS['2008000307'].roles).toContain('PROGRAM_COORDINATOR');

    // Super Admin
    expect(SYNTHETIC_DEMO_USERS['20120009']).toBeDefined();
    expect(SYNTHETIC_DEMO_USERS['20120009'].roles).toContain('SUPER_ADMIN');
  });
});
