'use server';

import { getCurrentUserWithRoles } from '@/modules/identity/actions';
import {
  ambilAktivitasUser,
  ambilAktivitasKelasAgregat,
  ambilAktivitasAnggotaKelas,
  ItemAktivitasHarian,
  pastikanSeedAktivitasDemo,
} from '@/lib/aktivitas';
import { assertClassMember, ClassAccessError } from '@/lib/auth/class-access';
import { checkSupabaseOnline } from '@/lib/supabase/status';
import { createClient } from '@/lib/supabase/server';

export interface ResponAktivitasSaya {
  aktivitas: ItemAktivitasHarian[];
  daftarKelas: { id: string; label: string }[];
}

/**
 * Mengambil riwayat aktivitas pribadi pengguna yang sedang login,
 * beserta daftar kelas yang diikutinya untuk keperluan filter.
 */
export async function getAktivitasSayaAction(
  classId?: string
): Promise<ResponAktivitasSaya> {
  const userContext = await getCurrentUserWithRoles();
  if (!userContext) {
    return { aktivitas: [], daftarKelas: [] };
  }

  // Pastikan data demo tersedia saat lingkungan lokal / akun demo
  pastikanSeedAktivitasDemo();

  const userId = userContext.user.id;
  const normalizedClassId = classId === 'semua' ? undefined : classId;

  const aktivitas = await ambilAktivitasUser({
    userId,
    classId: normalizedClassId,
  });

  const daftarKelas: { id: string; label: string }[] = [];

  const isOnline = await checkSupabaseOnline();
  if (isOnline) {
    try {
      const supabase = await createClient();
      if (userContext.activeRole === 'STUDENT') {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('class_id, classes(id, title, section)')
          .eq('student_id', userId)
          .eq('status', 'ENROLLED');

        if (enrollments) {
          enrollments.forEach((e: any) => {
            if (e.classes) {
              daftarKelas.push({
                id: e.classes.id,
                label: `${e.classes.title} (${e.classes.section})`,
              });
            }
          });
        }
      } else {
        const { data: classes } = await supabase
          .from('classes')
          .select('id, title, section')
          .or(`created_by.eq.${userId},lecturer_id.eq.${userId}`);

        if (classes) {
          classes.forEach((c: any) => {
            daftarKelas.push({
              id: c.id,
              label: `${c.title} (${c.section})`,
            });
          });
        }
      }
    } catch {
      // Abaikan dan lanjutkan
    }
  }

  // Jika daftar kelas masih kosong (mode memori / fallback)
  if (daftarKelas.length === 0) {
    const mem = ((globalThis as any).__siajarAkademik ??= { classes: [], enrollments: [] });
    if (userContext.activeRole === 'STUDENT') {
      const myEnrollments = mem.enrollments.filter((e: any) => e.student_id === userId);
      for (const enr of myEnrollments) {
        const cls = mem.classes.find((c: any) => c.id === enr.class_id);
        if (cls) {
          daftarKelas.push({
            id: cls.id,
            label: `${cls.title} (${cls.section})`,
          });
        }
      }
    } else {
      const myClasses = mem.classes.filter(
        (c: any) => c.created_by === userId || c.lecturer_id === userId
      );
      for (const cls of myClasses) {
        daftarKelas.push({
          id: cls.id,
          label: `${cls.title} (${cls.section})`,
        });
      }
    }
  }

  // Jika tetap kosong pada demo akun, berikan default kelas demo
  if (daftarKelas.length === 0) {
    daftarKelas.push(
      { id: 'c0000000-0000-0000-0000-000000000001', label: 'Pemrograman Web (IF-3A)' },
      { id: 'c0000000-0000-0000-0000-000000000002', label: 'Arsitektur Cloud (IF-5B)' },
      { id: 'c0000000-0000-0000-0000-000000000003', label: 'Struktur Data & Algoritma (IF-2A)' }
    );
  }

  return { aktivitas, daftarKelas };
}

/**
 * Mengambil ringkasan aktivitas gabungan seluruh kelas tanpa identitas nama siswa (agregat anonim).
 */
export async function getAktivitasKelasAgregatAction(
  classId: string
): Promise<ItemAktivitasHarian[]> {
  try {
    await assertClassMember(classId);
  } catch (err: any) {
    throw new Error(err?.message || 'Akses ditolak ke aktivitas kelas.');
  }

  pastikanSeedAktivitasDemo();
  return ambilAktivitasKelasAgregat({ classId });
}

/**
 * Mengambil rincian ringkasan aktivitas per anggota kelas untuk Dosen / Asisten pengampu.
 */
export async function getAktivitasAnggotaKelasAction(classId: string) {
  const access = await assertClassMember(classId);
  if (!access.isLecturer && !access.isTa) {
    throw new Error('Hanya Dosen atau Asisten yang dapat melihat rincian aktivitas anggota kelas.');
  }

  pastikanSeedAktivitasDemo();
  return ambilAktivitasAnggotaKelas({ classId });
}
