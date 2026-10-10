import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { KrsStore } from "@/features/krs/krs-store";
import { JadwalStore } from "@/features/jadwal/jadwal-store";
import { UktStore } from "@/features/ukt/ukt-store";
import { MahasiswaKrsView } from "@/features/krs/components/mahasiswa-krs-view";

export default async function MahasiswaKrsPage() {
  const session = await getSession();
  const mahasiswaId = session?.subId || "mhs-1";

  const krs = KrsStore.getKrsByMahasiswa(mahasiswaId);
  const availableKelas = JadwalStore.getKelas();
  const uktCheck = UktStore.isUktLunas(mahasiswaId);

  return (
    <DashboardShell
      role="MAHASISWA"
      userName={session?.name || "Mahasiswa"}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Kartu Rencana Studi (KRS) Online
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pengisian dan pengajuan mata kuliah semester berjalan dengan pembimbingan akademik
          </p>
        </div>

        <MahasiswaKrsView
          initialKrs={krs}
          availableKelas={availableKelas}
          isUktLunas={uktCheck.bolehKrs}
          uktMessage={uktCheck.alasan}
        />
      </div>
    </DashboardShell>
  );
}
