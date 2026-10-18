import { describe, it, expect } from 'vitest';
import { validateDirectMessagePermission } from '@/modules/academic/message-actions';

describe('Aturan Otorisasi Pesan Langsung 12.1 (Tidak Ada Pesan Antarmahasiswa)', () => {
  it('menolak mahasiswa memulai percakapan langsung dengan sesama mahasiswa', async () => {
    const res = await validateDirectMessagePermission('STUDENT', ['STUDENT']);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Mahasiswa tidak dapat mengirim pesan langsung antarmahasiswa');
  });

  it('mengizinkan mahasiswa mengirim pesan ke dosen pengampu di kelas yang sama', async () => {
    const res = await validateDirectMessagePermission('STUDENT', ['LECTURER'], true);
    expect(res.allowed).toBe(true);
    expect(res.reason).toBeUndefined();
  });

  it('mengizinkan mahasiswa mengirim pesan ke asisten dosen di kelas yang sama', async () => {
    const res = await validateDirectMessagePermission('STUDENT', ['STUDENT', 'TEACHING_ASSISTANT'], true);
    expect(res.allowed).toBe(true);
    expect(res.reason).toBeUndefined();
  });

  it('menolak mahasiswa mengirim pesan ke dosen di luar kelas aktifnya', async () => {
    const res = await validateDirectMessagePermission('STUDENT', ['LECTURER'], false);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('hanya dapat menghubungi dosen atau asisten pada kelas aktif');
  });

  it('mengizinkan dosen mengirim pesan ke mahasiswa di kelasnya', async () => {
    const res = await validateDirectMessagePermission('LECTURER', ['STUDENT'], true);
    expect(res.allowed).toBe(true);
  });
});
