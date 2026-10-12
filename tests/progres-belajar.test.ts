import { describe, it, expect } from 'vitest';
import { hitungProgresMateri, hitungRekapProgresKelas } from '@/lib/akademik/hitung-progres';
import { sanitasiNamaBerkas, validasiBerkasServer } from '@/lib/akademik/konfigurasi-storage';

describe('Perhitungan Progres Belajar Mahasiswa (Fungsi Murni)', () => {
  it('menghasilkan 0% jika total materi 0', () => {
    expect(hitungProgresMateri(0, 0)).toBe(0);
    expect(hitungProgresMateri(0, 5)).toBe(0);
  });

  it('menghitung persentase secara proporsional dan dibulatkan', () => {
    expect(hitungProgresMateri(10, 5)).toBe(50);
    expect(hitungProgresMateri(3, 1)).toBe(33); // 33.333% -> 33%
    expect(hitungProgresMateri(3, 2)).toBe(67); // 66.666% -> 67%
    expect(hitungProgresMateri(10, 10)).toBe(100);
  });

  it('tidak menghasilkan nilai negatif atau melebihi 100%', () => {
    expect(hitungProgresMateri(10, -2)).toBe(0);
    expect(hitungProgresMateri(10, 15)).toBe(100);
  });

  it('menghitung statistik kelas dengan benar dan menandai mahasiswa perlu perhatian (<50%)', () => {
    const rekap = hitungRekapProgresKelas('kls-1', 4, 2, [
      {
        mahasiswaId: 'mhs-1',
        nim: '2024001',
        nama: 'Budi Santoso',
        materiSelesai: 4,
        tugasTerkumpul: 2,
      },
      {
        mahasiswaId: 'mhs-2',
        nim: '2024002',
        nama: 'Siti Aminah',
        materiSelesai: 1, // 25% -> perlu perhatian
        tugasTerkumpul: 1,
      },
      {
        mahasiswaId: 'mhs-3',
        nim: '2024003',
        nama: 'Doni Pratama',
        materiSelesai: 2, // 50% -> aman
        tugasTerkumpul: 1,
      },
    ]);

    expect(rekap.totalMahasiswa).toBe(3);
    expect(rekap.mahasiswaTuntas).toBe(1);
    expect(rekap.mahasiswaPerluPerhatian).toBe(1);
    expect(rekap.rataRataProgres).toBe(58); // (100 + 25 + 50) / 3 = 58.33 -> 58%
    expect(rekap.daftarMahasiswa[1].perluPerhatian).toBe(true);
    expect(rekap.daftarMahasiswa[0].perluPerhatian).toBe(false);
  });
});

describe('Sanitasi & Validasi Berkas Supabase Storage', () => {
  it('sanitasiNamaBerkas menghapus path traversal dan karakter berbahaya', () => {
    expect(sanitasiNamaBerkas('../../etc/passwd.pdf')).toBe('passwd.pdf');
    expect(sanitasiNamaBerkas('Modul Kuliah 01 (Algoritma & Struktur Data).pdf')).toBe('Modul-Kuliah-01-Algoritma-Struktur-Data.pdf');
    expect(sanitasiNamaBerkas('file\\with\\windows\\path.docx')).toBe('path.docx');
  });

  it('menolak berkas dengan format di luar allowlist', () => {
    const res = validasiBerkasServer({ name: 'script.exe', size: 1024 }, 'materi');
    expect(res.valid).toBe(false);
    expect(res.pesanError).toContain('tidak didukung');
  });

  it('menolak berkas yang melebihi batas ukuran maksimal materi (50 MB)', () => {
    const res = validasiBerkasServer({ name: 'video-besar.mp4', size: 55 * 1024 * 1024 }, 'materi');
    expect(res.valid).toBe(false);
    expect(res.pesanError).toContain('melebihi batas maksimal');
  });

  it('menolak berkas tugas yang melebihi batas maksimal tugas (10 MB)', () => {
    const res = validasiBerkasServer({ name: 'laporan.pdf', size: 12 * 1024 * 1024 }, 'tugas');
    expect(res.valid).toBe(false);
    expect(res.pesanError).toContain('melebihi batas maksimal');
  });

  it('menerima berkas valid sesuai aturan allowlist dan ukuran', () => {
    const resMateri = validasiBerkasServer({ name: 'Slide-Kuliah.pdf', size: 5 * 1024 * 1024 }, 'materi');
    expect(resMateri.valid).toBe(true);
    expect(resMateri.ekstensi).toBe('pdf');

    const resTugas = validasiBerkasServer({ name: 'SourceCode_Tugas.zip', size: 2 * 1024 * 1024 }, 'tugas');
    expect(resTugas.valid).toBe(true);
    expect(resTugas.ekstensi).toBe('zip');
  });
});
