import { describe, it, expect, vi } from 'vitest';
import mammoth from 'mammoth';
import { parseQuestionDocxBuffer } from '@/lib/akademik/word-question-parser';

describe('Word DOCX Question Parser (13.2)', () => {
  it('berhasil mem-parse dokumen Word dengan pola nomor, opsi a-e, dan Jawaban', async () => {
    const sampleDocxText = `
1. Apa fungsi utama dari protokol DNS di jaringan komputer?
a. Menerjemahkan nama domain menjadi alamat IP
b. Mengenkripsi komunikasi web
c. Mengirim email ke server tujuan
d. Mengatur antrean paket data
Jawaban: A
Pembahasan: DNS (Domain Name System) berfungsi mengonversi nama host menjadi IP address.

2. Apakah Git merupakan sistem kontrol versi terdistribusi?
a. Benar
b. Salah
Jawaban: Benar
Pembahasan: Git adalah distributed version control system.

3. Jelaskan perbedaan mendasar antara thread dan proses pada sistem operasi modern.
Jawaban: Proses memiliki ruang alamat memori mandiri sedangkan thread berbagi ruang memori dalam satu proses.
Pembahasan: Konteks switching antar-thread lebih ringan dibandingkan antar-proses.
    `;

    vi.spyOn(mammoth, 'extractRawText').mockResolvedValueOnce({
      value: sampleDocxText,
      messages: []
    });

    const fakeBuffer = Buffer.from('dummy docx');
    const result = await parseQuestionDocxBuffer(fakeBuffer);

    expect(result.total_questions).toBe(3);
    expect(result.valid_count).toBe(3);
    expect(result.error_count).toBe(0);

    // Soal 1
    expect(result.items[0].tipe).toBe('pilihan_ganda');
    expect(result.items[0].pertanyaan).toContain('protokol DNS');
    expect(result.items[0].opsi_a).toBe('Menerjemahkan nama domain menjadi alamat IP');
    expect(result.items[0].kunci).toBe('A');
    expect(result.items[0].pembahasan).toContain('Domain Name System');

    // Soal 2
    expect(result.items[1].tipe).toBe('benar_salah');
    expect(result.items[1].kunci).toBe('Benar');

    // Soal 3
    expect(result.items[2].tipe).toBe('esai');
    expect(result.items[2].pertanyaan).toContain('thread dan proses');
  });

  it('mendeteksi galat jika pilihan ganda memiliki kunci yang tidak terdaftar', async () => {
    const invalidDocxText = `
1. Siapakah penemu protokol TCP/IP?
a. Vint Cerf
b. Tim Berners-Lee
c. Linus Torvalds
Jawaban: Z
    `;

    vi.spyOn(mammoth, 'extractRawText').mockResolvedValueOnce({
      value: invalidDocxText,
      messages: []
    });

    const fakeBuffer = Buffer.from('dummy docx');
    const result = await parseQuestionDocxBuffer(fakeBuffer);

    expect(result.total_questions).toBe(1);
    expect(result.error_count).toBe(1);
    expect(result.items[0].status).toBe('galat');
    expect(result.items[0].issues[0]).toContain("kunci 'Z' tidak ada di pilihan");
  });
});
