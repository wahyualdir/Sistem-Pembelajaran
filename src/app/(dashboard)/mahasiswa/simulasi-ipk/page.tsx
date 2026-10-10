import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { MasterStore } from "@/features/master/master-store";
import { NilaiStore } from "@/features/nilai/nilai-store";
import { KrsStore } from "@/features/krs/krs-store";
import { SimulasiIpkView } from "@/components/mahasiswa/simulasi-ipk-view";
import { Calculator } from "lucide-react";

export default async function MahasiswaSimulasiIpkPage() {
  const session = await getSession();
  const mahasiswaId = session?.subId || "mhs-1";
  const mahasiswa = MasterStore.getMahasiswaById(mahasiswaId);

  // Ambil transkrip riwayat studi
  const transkrip = NilaiStore.getTranskripMahasiswa(mahasiswaId);

  // Ambil mata kuliah aktif di KRS semester berjalan
  const krs = KrsStore.getKrsByMahasiswa(mahasiswaId);
  const daftarMataKuliahKrs = (krs?.items || []).map((item) => ({
    kodeMataKuliah: item.kelas.kodeMataKuliah,
    namaMataKuliah: item.kelas.namaMataKuliah,
    sks: item.kelas.sks,
    kelas: item.kelas.kode,
  }));

  return (
    <DashboardShell
      role="MAHASISWA"
      userName={mahasiswa?.nama || session?.name || "Mahasiswa"}
    >
      <div className="space-y-6 animate-fade-up">
        {/* Header Halaman */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Simulasi IPK & Perencanaan Studi
          </h1>
          <p className="text-sm text-muted-foreground">
            Kalkulator interaktif proyeksi capaian IPS dan IPK kumulatif untuk semester berjalan
          </p>
        </div>

        {/* Tampilan Interaktif Simulasi */}
        <SimulasiIpkView
          transkripLalu={transkrip.daftarMataKuliah}
          daftarMataKuliahKrs={daftarMataKuliahKrs}
        />
      </div>
    </DashboardShell>
  );
}
