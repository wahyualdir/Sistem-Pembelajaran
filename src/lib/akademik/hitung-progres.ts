/**
 * Logika Murni Perhitungan Progres Belajar Mahasiswa SIAJAR
 * Memastikan kalkulasi progres stabil, akurat (0% bila total 0), dan bebas efek samping.
 */

export interface ProgresMahasiswaRingkasan {
  mahasiswaId: string;
  nim: string;
  nama: string;
  totalMateri: number;
  materiSelesai: number;
  persenProgres: number;
  tugasTerkumpul: number;
  totalTugas: number;
  terakhirAktivitas?: string;
  perluPerhatian: boolean; // true jika persenProgres < 50% dan totalMateri > 0
}

export interface RekapProgresKelas {
  kelasId: string;
  totalMateri: number;
  totalTugas: number;
  totalMahasiswa: number;
  rataRataProgres: number;
  mahasiswaTuntas: number; // 100%
  mahasiswaPerluPerhatian: number; // < 50%
  daftarMahasiswa: ProgresMahasiswaRingkasan[];
}

/**
 * Menghitung persentase progres materi (0 - 100%).
 * Total materi 0 akan menghasilkan 0%.
 */
export function hitungProgresMateri(totalMateri: number, materiSelesai: number): number {
  if (totalMateri <= 0) return 0;
  if (materiSelesai <= 0) return 0;
  if (materiSelesai >= totalMateri) return 100;

  return Math.round((materiSelesai / totalMateri) * 100);
}

/**
 * Menghitung rekapitulasi statistik kelas untuk dosen dan koordinator
 */
export function hitungRekapProgresKelas(
  kelasId: string,
  totalMateri: number,
  totalTugas: number,
  dataMahasiswa: Array<{
    mahasiswaId: string;
    nim: string;
    nama: string;
    materiSelesai: number;
    tugasTerkumpul: number;
    terakhirAktivitas?: string;
  }>
): RekapProgresKelas {
  const totalMahasiswa = dataMahasiswa.length;
  if (totalMahasiswa === 0) {
    return {
      kelasId,
      totalMateri,
      totalTugas,
      totalMahasiswa: 0,
      rataRataProgres: 0,
      mahasiswaTuntas: 0,
      mahasiswaPerluPerhatian: 0,
      daftarMahasiswa: [],
    };
  }

  let akumulasiPersen = 0;
  let mahasiswaTuntas = 0;
  let mahasiswaPerluPerhatian = 0;

  const daftarMahasiswa: ProgresMahasiswaRingkasan[] = dataMahasiswa.map((m) => {
    const persenProgres = hitungProgresMateri(totalMateri, m.materiSelesai);
    akumulasiPersen += persenProgres;

    if (persenProgres === 100) {
      mahasiswaTuntas++;
    }

    const perluPerhatian = totalMateri > 0 && persenProgres < 50;
    if (perluPerhatian) {
      mahasiswaPerluPerhatian++;
    }

    return {
      mahasiswaId: m.mahasiswaId,
      nim: m.nim,
      nama: m.nama,
      totalMateri,
      materiSelesai: m.materiSelesai,
      persenProgres,
      totalTugas,
      tugasTerkumpul: m.tugasTerkumpul,
      terakhirAktivitas: m.terakhirAktivitas,
      perluPerhatian,
    };
  });

  const rataRataProgres = Math.round(akumulasiPersen / totalMahasiswa);

  return {
    kelasId,
    totalMateri,
    totalTugas,
    totalMahasiswa,
    rataRataProgres,
    mahasiswaTuntas,
    mahasiswaPerluPerhatian,
    daftarMahasiswa,
  };
}
