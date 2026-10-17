// Evaluasi Kelayakan Ujian Sisi Server (membaca kebijakan institusi secara dinamis)
import { evaluasiKelayakanUjian, type SyaratUjianInput, type HasilEvaluasiUjian } from './syarat-ujian';
import { getPolicy } from '@/lib/policies';

export async function evaluasiKelayakanUjianAsync(
  input: Omit<SyaratUjianInput, 'batasMinimalKehadiran'> & { batasMinimalKehadiran?: number }
): Promise<HasilEvaluasiUjian> {
  let batas = input.batasMinimalKehadiran;
  if (batas === undefined) {
    try {
      batas = await getPolicy<number>('min_attendance_percent');
    } catch {
      batas = 75.0;
    }
  }
  return evaluasiKelayakanUjian({ ...input, batasMinimalKehadiran: batas ?? 75.0 });
}
