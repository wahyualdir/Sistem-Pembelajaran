import { describe, it, expect } from 'vitest';

/**
 * Spesifikasi Lampiran D: Daftar Putih Jenis Kejadian Aktivitas
 * Tabel activity_event_kinds(kind, allowed_meta_keys text[])
 */
export const ACTIVITY_EVENT_KINDS_WHITELIST: Record<string, string[]> = {
  materi_dibuka: [],
  podcast_diputar: [],
  podcast_selesai: [],
  kartu_direview: ['jumlah', 'ingat', 'ragu', 'lupa'],
  kuis_selesai: ['skor', 'lulus', 'durasi_detik'],
  pulau_selesai: [],
  tugas_dikumpulkan: ['tepat_waktu'],
  bantuan_diminta: [],
  bantuan_diberikan: [],
  bantuan_terbantu: [],
};

export const INDONESIAN_ACTIVITY_LABELS: Record<string, string> = {
  materi_dibuka: 'Membuka Modul Materi',
  podcast_diputar: 'Memutar Podcast Materi',
  podcast_selesai: 'Menyelesaikan Podcast Materi',
  kartu_direview: 'Mengulas Kartu Flashcard',
  kuis_selesai: 'Menyelesaikan Kuis Bab',
  pulau_selesai: 'Menuntaskan Pulau Belajar',
  tugas_dikumpulkan: 'Mengumpulkan Tugas Kuliah',
  bantuan_diminta: 'Meminta Bantuan Teman',
  bantuan_diberikan: 'Menjawab Permintaan Bantuan',
  bantuan_terbantu: 'Bantuan Ditandai Terbantu',
};

/**
 * Helper simulasi logika pembersihan meta log_activity di basis data
 */
export function filterActivityMetadata(
  kind: string,
  rawMeta: Record<string, any>
): { isValidKind: boolean; sanitizedMeta: Record<string, any>; rejectedKeys: string[] } {
  if (!(kind in ACTIVITY_EVENT_KINDS_WHITELIST)) {
    return { isValidKind: false, sanitizedMeta: {}, rejectedKeys: Object.keys(rawMeta) };
  }

  const allowedKeys = new Set(ACTIVITY_EVENT_KINDS_WHITELIST[kind]);
  const sanitizedMeta: Record<string, any> = {};
  const rejectedKeys: string[] = [];

  for (const [key, value] of Object.entries(rawMeta)) {
    if (allowedKeys.has(key)) {
      sanitizedMeta[key] = value;
    } else {
      rejectedKeys.push(key);
    }
  }

  return { isValidKind: true, sanitizedMeta, rejectedKeys };
}

describe('Lampiran D: Daftar Putih Jenis Kejadian Aktivitas (activity_event_kinds)', () => {
  it('Tepat memiliki 10 jenis kejadian terdaftar dalam daftar putih', () => {
    const kinds = Object.keys(ACTIVITY_EVENT_KINDS_WHITELIST);
    expect(kinds.length).toBe(10);
    expect(kinds).toEqual([
      'materi_dibuka',
      'podcast_diputar',
      'podcast_selesai',
      'kartu_direview',
      'kuis_selesai',
      'pulau_selesai',
      'tugas_dikumpulkan',
      'bantuan_diminta',
      'bantuan_diberikan',
      'bantuan_terbantu',
    ]);
  });

  it('Setiap jenis kejadian memiliki label bahasa Indonesia yang ramah pengguna di halaman Privasi', () => {
    for (const kind of Object.keys(ACTIVITY_EVENT_KINDS_WHITELIST)) {
      expect(INDONESIAN_ACTIVITY_LABELS[kind]).toBeDefined();
      expect(INDONESIAN_ACTIVITY_LABELS[kind].length).toBeGreaterThan(5);
      // Memastikan bukan teks mentah teknis snake_case
      expect(INDONESIAN_ACTIVITY_LABELS[kind]).not.toContain('_');
    }
  });

  describe('Pengujian Pemfilteran Kunci Metadata untuk Kesepuluh Jenis Kejadian', () => {
    // 1. materi_dibuka — tanpa meta
    it('1. materi_dibuka: menolak metadata apa pun dan hanya menyimpan objek kosong', () => {
      const res = filterActivityMetadata('materi_dibuka', {
        judul_materi: 'Bab 1 Rahasia',
        url: 'https://evil.com',
      });
      expect(res.isValidKind).toBe(true);
      expect(res.sanitizedMeta).toEqual({});
      expect(res.rejectedKeys).toContain('judul_materi');
      expect(res.rejectedKeys).toContain('url');
    });

    // 2. podcast_diputar — tanpa meta
    it('2. podcast_diputar: membuang metadata dan tidak merekam judul atau lokasi', () => {
      const res = filterActivityMetadata('podcast_diputar', {
        posisi_detik: 120,
        volume: 80,
      });
      expect(res.isValidKind).toBe(true);
      expect(res.sanitizedMeta).toEqual({});
      expect(res.rejectedKeys).toEqual(['posisi_detik', 'volume']);
    });

    // 3. podcast_selesai — tanpa meta
    it('3. podcast_selesai: tidak menerima metadata tambahan', () => {
      const res = filterActivityMetadata('podcast_selesai', {
        rating: 5,
        komentar: 'Bagus',
      });
      expect(res.isValidKind).toBe(true);
      expect(res.sanitizedMeta).toEqual({});
      expect(res.rejectedKeys.length).toBe(2);
    });

    // 4. kartu_direview — jumlah, ingat, ragu, lupa
    it('4. kartu_direview: mempertahankan jumlah, ingat, ragu, lupa, dan membuang kunci lain', () => {
      const res = filterActivityMetadata('kartu_direview', {
        jumlah: 15,
        ingat: 10,
        ragu: 3,
        lupa: 2,
        pertanyaan: 'Apa isi kartu?', // harus dibuang
        jawaban: 'Isi rahasia', // harus dibuang
      });
      expect(res.isValidKind).toBe(true);
      expect(res.sanitizedMeta).toEqual({
        jumlah: 15,
        ingat: 10,
        ragu: 3,
        lupa: 2,
      });
      expect(res.rejectedKeys).toEqual(['pertanyaan', 'jawaban']);
    });

    // 5. kuis_selesai — skor, lulus, durasi_detik
    it('5. kuis_selesai: mempertahankan skor, lulus, durasi_detik, dan membuang rincian soal', () => {
      const res = filterActivityMetadata('kuis_selesai', {
        skor: 85,
        lulus: true,
        durasi_detik: 340,
        kunci_jawaban: [1, 3, 2], // harus dibuang
      });
      expect(res.isValidKind).toBe(true);
      expect(res.sanitizedMeta).toEqual({
        skor: 85,
        lulus: true,
        durasi_detik: 340,
      });
      expect(res.rejectedKeys).toEqual(['kunci_jawaban']);
    });

    // 6. pulau_selesai — tanpa meta
    it('6. pulau_selesai: menolak metadata apa pun', () => {
      const res = filterActivityMetadata('pulau_selesai', {
        xp_didapat: 100,
      });
      expect(res.isValidKind).toBe(true);
      expect(res.sanitizedMeta).toEqual({});
      expect(res.rejectedKeys).toEqual(['xp_didapat']);
    });

    // 7. tugas_dikumpulkan — tepat_waktu
    it('7. tugas_dikumpulkan: hanya mempertahankan tepat_waktu', () => {
      const res = filterActivityMetadata('tugas_dikumpulkan', {
        tepat_waktu: true,
        lampiran_nama: 'tugas.pdf',
        isi_tugas: 'isi rahasia',
      });
      expect(res.isValidKind).toBe(true);
      expect(res.sanitizedMeta).toEqual({ tepat_waktu: true });
      expect(res.rejectedKeys).toEqual(['lampiran_nama', 'isi_tugas']);
    });

    // 8. bantuan_diminta — tanpa meta
    it('8. bantuan_diminta: tanpa metadata isi pertanyaan', () => {
      const res = filterActivityMetadata('bantuan_diminta', {
        isi_pertanyaan: 'Bagaimana cara join SQL?',
      });
      expect(res.isValidKind).toBe(true);
      expect(res.sanitizedMeta).toEqual({});
      expect(res.rejectedKeys).toEqual(['isi_pertanyaan']);
    });

    // 9. bantuan_diberikan — tanpa meta
    it('9. bantuan_diberikan: tanpa metadata isi jawaban', () => {
      const res = filterActivityMetadata('bantuan_diberikan', {
        isi_jawaban: 'Gunakan klausa INNER JOIN',
      });
      expect(res.isValidKind).toBe(true);
      expect(res.sanitizedMeta).toEqual({});
      expect(res.rejectedKeys).toEqual(['isi_jawaban']);
    });

    // 10. bantuan_terbantu — tanpa meta
    it('10. bantuan_terbantu: tanpa metadata poin atau komentar', () => {
      const res = filterActivityMetadata('bantuan_terbantu', {
        rating: 'bintang 5',
      });
      expect(res.isValidKind).toBe(true);
      expect(res.sanitizedMeta).toEqual({});
      expect(res.rejectedKeys).toEqual(['rating']);
    });
  });

  it('Menolak secara ketat jenis kejadian di luar daftar putih', () => {
    const invalidKinds = ['cheat_detected', 'pesan_dikirim', 'hacked_event', 'login_attempt'];
    for (const kind of invalidKinds) {
      const res = filterActivityMetadata(kind, { foo: 'bar' });
      expect(res.isValidKind).toBe(false);
      expect(res.sanitizedMeta).toEqual({});
    }
  });
});
